import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { createRouter } from "../public/js/routing.js";
import { createMediaClient, prepareImageUpload, revealImage } from "../public/js/media.js";
import { profileUsername } from "../public/js/shared.js";
import { QipiAuth } from "../public/auth.js";
import { createPwaController } from "../public/js/pwa.js";

function routerFor(path) {
  const location = new URL(path, "https://qipi.example");
  const state = { view: "feed", profileUsername: "", search: "" };
  const history = {
    replaceState(_state, _title, path) { location.href = new URL(path, location).href; },
    pushState(_state, _title, path) { location.href = new URL(path, location).href; }
  };
  return { location, state, router: createRouter(state, { location, history }) };
}

test("page refresh routing preserves named pages without stale profile queries", () => {
  for (const page of ["feed", "settings", "saved", "trips", "explore", "signup"]) {
    const { router } = routerFor("/" + page + "?profile=old-user");
    assert.equal(router.profileIdFromLocation(), "");
    assert.equal(router.viewFromLocation(false), page);
  }
  const { router } = routerFor("/dara-demo001");
  assert.equal(router.profileIdFromLocation(), "dara-demo001");
  assert.equal(router.viewFromLocation(true), "profile");
  const post = routerFor("/post/unique-id");
  assert.equal(post.router.profileIdFromLocation(), "");
  assert.equal(post.router.viewFromLocation(false), "feed");
  const search = routerFor("/search?q=kampot");
  assert.equal(search.router.profileIdFromLocation(), "");
  assert.equal(search.router.viewFromLocation(false), "search-results");
  assert.equal(routerFor("/#settings").router.viewFromLocation(false), "settings");
});

test("links discard stale parameters and retain profile and search paths", () => {
  const { router, location, state } = routerFor("/settings?profile=stale");
  state.view = "profile";
  state.profileUsername = profileUsername("Dara (Demo)", "demo-user-001");
  router.setLink("profile", state.profileUsername);
  assert.equal(location.pathname, "/" + state.profileUsername);
  assert.equal(location.search, "");
  router.setLink("trip", "unique-id");
  assert.equal(location.pathname, "/post/unique-id");
  state.search = "kampot & kep";
  assert.equal(router.pageUrl("search-results"), "/search?q=kampot+%26+kep");
  state.view = "search-results";
  router.pushPage("search-results");
  assert.equal(location.pathname + location.search, "/search?q=kampot+%26+kep");
});

test("image uploads use the signed-in folder, publishable key, and user token", async (context) => {
  const auth = { user: { id: "member-1" }, key: "sb_publishable_browser", url: "https://configured.supabase.co", accessToken: async () => "user-jwt" };
  const media = createMediaClient({ auth, t: (key) => key });
  const request = context.mock.method(globalThis, "fetch", async (url, options) => {
    assert.match(String(url), /\/storage\/v1\/object\/qipi-images\/users\/member-1\/trips\/.*\.webp$/);
    assert.equal(options.headers.apikey, "sb_publishable_browser");
    assert.equal(options.headers.authorization, "Bearer user-jwt");
    return new Response("{}", { status: 200 });
  });
  const path = await media.uploadImage(new File(["sample"], "trip.webp", { type: "image/webp" }), "trips");
  assert.match(path, /^users\/member-1\/trips\//);
  assert.match(media.appMediaUrl(path), /^\/media\/[0-9a-f-]{36}$/);
  await assert.rejects(() => media.uploadImage(new File(["bad"], "file.txt", { type: "text/plain" }), "trips"), /imageTypeError/);
  assert.equal(request.mock.callCount(), 1);
});

test("large photos are resized and uploaded as smaller WebP files", async (context) => {
  const previousDecode = globalThis.createImageBitmap, previousDocument = globalThis.document;
  let closed = false, drawn = false;
  const canvas = {
    width: 0, height: 0,
    getContext: () => ({ drawImage: () => { drawn = true; } }),
    toBlob: (resolve, type) => resolve(new Blob([new Uint8Array(180_000)], { type }))
  };
  globalThis.createImageBitmap = async () => ({ width: 4000, height: 3000, close: () => { closed = true; } });
  globalThis.document = { createElement: () => canvas };
  context.after(() => {
    if (previousDecode) globalThis.createImageBitmap = previousDecode; else delete globalThis.createImageBitmap;
    if (previousDocument) globalThis.document = previousDocument; else delete globalThis.document;
  });
  const auth = { user: { id: "member-1" }, key: "publishable", url: "https://configured.supabase.co", accessToken: async () => "user-jwt" };
  const media = createMediaClient({ auth, t: key => key });
  const request = context.mock.method(globalThis, "fetch", async (url, options) => {
    assert.match(String(url), /\/trips\/[0-9a-f-]{36}\.webp$/);
    assert.equal(options.headers["content-type"], "image/webp");
    assert.equal(options.body.size, 180_000);
    return new Response("{}", { status: 200 });
  });
  await media.uploadImage(new File([new Uint8Array(1_000_000)], "photo.jpg", { type: "image/jpeg" }), "trips");
  assert.deepEqual([canvas.width, canvas.height], [1600, 1200]);
  assert.equal(drawn, true);
  assert.equal(closed, true);
  assert.equal(request.mock.callCount(), 1);
  await prepareImageUpload(new File([new Uint8Array(1_000_000)], "avatar.jpg", { type: "image/jpeg" }), "profile");
  assert.deepEqual([canvas.width, canvas.height], [512, 384]);
  await assert.rejects(() => media.uploadImage({ type: "image/jpeg", size: 21 * 1024 * 1024 }, "trips"), /imageSizeError/);
});

test("images stay hidden until decoding completes and stale loads cannot reveal them", async () => {
  let finishDecode, revealed = false;
  const image = {
    src: "/media/first", currentSrc: "/media/first", isConnected: true, complete: true, naturalWidth: 800,
    classList: { add: () => { revealed = true; } },
    decode: () => new Promise(resolve => { finishDecode = resolve; })
  };
  const first = revealImage(image);
  assert.equal(revealed, false);
  image.currentSrc = "/media/second";
  finishDecode();
  await first;
  assert.equal(revealed, false);
  const second = revealImage(image);
  assert.equal(revealed, false);
  finishDecode();
  await second;
  assert.equal(revealed, true);
});

test("theme and entry boot flags are applied synchronously before first paint", async () => {
  const source = await readFile(new URL("../public/startup.js", import.meta.url), "utf8");
  const root = { dataset: {} };
  const themeColor = { content: "" };
  const saved = new Map([["qipi:theme", "dark"]]);
  const browser = {
    document: { documentElement: root, querySelector: () => themeColor, readyState: "loading", addEventListener() {} },
    window: { matchMedia: () => ({ matches: false, addEventListener() {} }) },
    localStorage: { getItem: (key) => saved.get(key) || null, setItem: (key, value) => saved.set(key, value) },
    sessionStorage: { getItem: () => null },
    location: new URL("https://qipi.example/dara-demo001"),
    URLSearchParams
  };
  runInNewContext(source, browser);
  assert.equal(root.dataset.theme, "dark");
  assert.equal(root.dataset.themeBooting, "true");
  assert.equal(root.dataset.profilePending, "true");
  assert.equal(root.dataset.entryPending, "true");
  assert.equal(themeColor.content, "#10191B");
});

test("guest choice survives app restarts and upgrades the previous session choice", async () => {
  const source = await readFile(new URL("../public/startup.js", import.meta.url), "utf8");
  for (const { localChoice, sessionChoice, expectedChoice } of [
    { localChoice: "guest", sessionChoice: null, expectedChoice: "guest" },
    { localChoice: null, sessionChoice: "guest", expectedChoice: "guest" }
  ]) {
    const root = { dataset: {} };
    const saved = new Map(localChoice ? [["qipi:entry-choice", localChoice]] : []);
    const session = new Map(sessionChoice ? [["qipi:entry-choice", sessionChoice]] : []);
    const browser = {
      document: { documentElement: root, querySelector: () => null, readyState: "loading", addEventListener() {} },
      window: { matchMedia: () => ({ matches: false, addEventListener() {} }) },
      localStorage: { getItem: (key) => saved.get(key) || null, setItem: (key, value) => saved.set(key, value) },
      sessionStorage: { getItem: (key) => session.get(key) || null },
      location: new URL("https://qipi.example/feed"), URLSearchParams
    };
    runInNewContext(source, browser);
    assert.equal(root.dataset.entryPending, undefined);
    assert.equal(saved.get("qipi:entry-choice"), expectedChoice);
  }
});

test("service worker activates automatically after caching the app shell", async () => {
  const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  const handlers = new Map();
  let cachedName = "";
  let cachedAssets = [];
  let skipWaitingCalls = 0;
  const progress = [];
  const worker = {
    registration: { active: { state: "activated" } },
    addEventListener: (name, handler) => handlers.set(name, handler),
    skipWaiting: async () => { skipWaitingCalls++; },
    clients: { matchAll: async () => [{ postMessage: (message) => progress.push(message) }] }
  };
  const cachesApi = { open: async (name) => { cachedName = name; return { add: async (asset) => { cachedAssets.push(asset); } }; } };
  runInNewContext(source, { self: worker, caches: cachesApi, URL, Request, Response, fetch, Promise });

  let installPromise;
  handlers.get("install")({ waitUntil: (promise) => { installPromise = promise; } });
  await installPromise;
  assert.equal(cachedName, "qipi-static-v8");
  assert.ok(cachedAssets.includes("/offline.js"));
  assert.equal(progress.at(-1).percent, 100);
  assert.equal(progress.at(-1).completed, cachedAssets.length);
  assert.equal(skipWaitingCalls, 1);

  let activationMessage;
  handlers.get("message")({
    data: { type: "QIPI_ACTIVATE_UPDATE" },
    waitUntil: (promise) => { activationMessage = promise; }
  });
  await activationMessage;
  assert.equal(skipWaitingCalls, 2);
});

test("PWA update status advances automatically and times out instead of spinning forever", async (context) => {
  const prior = Object.fromEntries(["window", "document", "navigator", "setTimeout", "clearTimeout"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const documentListeners = new Map();
  const serviceWorkerListeners = new Map();
  const registrationListeners = new Map();
  const timers = [];
  let reloads = 0;
  let button = null;
  let postedMessage = null;
  const oldController = { state: "activated" };
  const waitingWorker = { postMessage: (message) => { postedMessage = message; } };
  const registration = {
    waiting: null, installing: null,
    addEventListener: (name, handler) => registrationListeners.set(name, handler),
    update: async () => {}
  };
  const mockWindow = {
    isSecureContext: true,
    location: { reload: () => { reloads++; } },
    addEventListener() {}
  };
  const mockDocument = {
    readyState: "complete",
    body: { append: (node) => { button = node; } },
    createElement: () => ({ hidden: false, disabled: false, dataset: {}, setAttribute() {} }),
    addEventListener: (name, handler) => documentListeners.set(name, handler)
  };
  const mockNavigator = {
    serviceWorker: {
      controller: oldController,
      register: async () => registration,
      addEventListener: (name, handler) => serviceWorkerListeners.set(name, handler)
    }
  };
  const fakeSetTimeout = (handler, delay) => {
    const timer = { handler, delay, unref() {} };
    timers.push(timer);
    return timer;
  };
  for (const [key, value] of Object.entries({ window: mockWindow, document: mockDocument, navigator: mockNavigator, setTimeout: fakeSetTimeout, clearTimeout: () => {} })) {
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  context.after(() => {
    for (const [key, descriptor] of Object.entries(prior)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });

  createPwaController({ t: (key) => key, toast: () => {} });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(button, null);

  const installingListeners = new Map();
  const installingWorker = { state: "installing", addEventListener: (name, handler) => installingListeners.set(name, handler) };
  registration.installing = installingWorker;
  registrationListeners.get("updatefound")();
  assert.equal(button.textContent, "pwaUpdateDownloading 0%");
  assert.equal(button.disabled, true);
  serviceWorkerListeners.get("message")({ data: { type: "QIPI_UPDATE_PROGRESS", percent: 43 } });
  assert.equal(button.textContent, "pwaUpdateDownloading 43%");
  assert.equal(button.querySelector, undefined); // The status is one button, with no progress bar.

  registration.waiting = waitingWorker;
  installingWorker.state = "installed";
  installingListeners.get("statechange")();
  assert.equal(button.textContent, "pwaUpdateInstalling");
  assert.deepEqual(postedMessage, { type: "QIPI_ACTIVATE_UPDATE" });
  assert.equal(reloads, 0);

  timers.at(-1).handler();
  assert.match(button.textContent, /pwaUpdateFailed/);
  assert.equal(button.disabled, false);
  mockNavigator.serviceWorker.controller = { state: "activated" };
  serviceWorkerListeners.get("controllerchange")();
  assert.equal(reloads, 1);
  assert.ok(documentListeners.has("click"));
});

test("Supabase profile updates retain metadata and refresh tokens rotate once for concurrent requests", async () => {
  const auth = new QipiAuth();
  auth.enabled = true;
  auth.save = function(session) { this.session = session; this.user = session?.user || null; };
  auth.save({
    accessToken: "old-token", refreshToken: "refresh-token", expiresAt: 0,
    user: { id: "member-1", user_metadata: { avatar_path: "existing.webp", custom: "keep" } }
  });
  let refreshCalls = 0;
  auth.request = async (path, options) => {
    if (path.startsWith("/token")) {
      refreshCalls++;
      await Promise.resolve();
      return { access_token: "rotated-token", refresh_token: "rotated-refresh", expires_in: 3600, user: auth.user };
    }
    assert.equal(path, "/user");
    assert.equal(options.accessToken, "rotated-token");
    assert.equal(options.body.data.custom, "keep");
    return { ...auth.user, user_metadata: options.body.data };
  };
  assert.deepEqual(await Promise.all([auth.accessToken(), auth.accessToken()]), ["rotated-token", "rotated-token"]);
  assert.equal(refreshCalls, 1);
  await auth.updateProfile({ displayName: "Dara", travelStyles: ["solo"] });
  assert.equal(auth.user.user_metadata.avatar_path, "existing.webp");
  await auth.updateAvatar("replacement.webp");
  assert.equal(auth.user.user_metadata.display_name, "Dara");
  assert.deepEqual(auth.user.user_metadata.travel_styles, ["solo"]);
  assert.equal(auth.user.user_metadata.avatar_path, "replacement.webp");
});

test("profile tab links survive refresh and malformed page paths are rejected", async () => {
  const { isSupportedPage, isValidUsername, normalizeUsername } = await import("../public/js/route-config.js");
  const { router, location, state } = routerFor("/feed");
  state.profileUsername = "dara-member";
  state.profileTab = "saved";
  assert.equal(router.pageUrl("profile"), "/dara-member?tab=saved");
  router.setLink("profile", state.profileUsername);
  assert.equal(location.pathname + location.search, "/dara-member?tab=saved");
  assert.equal(router.profileIdFromLocation(), "dara-member");
  assert.equal(isSupportedPage(["post", "unique-id"]), true);
  assert.equal(isSupportedPage(["settings", "anything"]), false);
  assert.equal(isSupportedPage(["post", "x", "y"]), false);
  assert.equal(isSupportedPage(["bad%2Fslug"]), false);
  assert.equal(isSupportedPage(["traveler.name_1"]), true);
  assert.equal(isSupportedPage(["វីរៈ_2026"]), true);
  assert.equal(isSupportedPage([encodeURIComponent("វីរៈ_2026")]), true);
  assert.equal(isValidUsername("@Traveler.Name_1"), true);
  assert.equal(normalizeUsername("@Traveler.Name_1"), "traveler.name_1");
  assert.equal(isValidUsername("bad/name"), false);
});

test("shared shell components preserve unique IDs and omit Saved from both navigations", async () => {
  const { pageMarkup } = await import("../src/ui/shell.mjs");
  const { navigation } = await import("../src/ui/components/navigation.mjs");
  const ids = [...pageMarkup.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.doesNotMatch(navigation(), /saved-trips/);
  assert.doesNotMatch(navigation({ mobile: true }), /saved-trips/);
  assert.equal((navigation({ mobile: true }).match(/<(a|button)\b/g) || []).length, 5);
  for (const id of ["settings-view", "profile-view", "signup-view", "trip-list", "auth-dialog"]) assert.ok(ids.includes(id));
});

test("API reads coalesce in flight, then refetch; different sessions never share responses", async () => {
  const { createApiClient } = await import("../public/js/api.js");
  let calls = 0, token = "one", resolveRead;
  const client = createApiClient({ auth: { accessToken: async () => token }, state: { likeActorId: "device" }, t: key => key,
    fetchImpl: async () => { calls++; await new Promise(resolve => { resolveRead = resolve; }); return Response.json({ ok: true }); } });
  const first = client.api("/api/me"), second = client.api("/api/me");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 1);
  resolveRead(); await Promise.all([first, second]);
  const third = client.api("/api/me");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 2);
  const finishThird = resolveRead;
  token = "two";
  const fourth = client.api("/api/me");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(calls, 3);
  finishThird(); resolveRead(); await Promise.all([third, fourth]);
});

test("public profile directory preserves usernames and omits private Auth fields", async () => {
  const { syncPublicProfile } = await import("../src/server/profiles.mjs");
  const data = {};
  const user = { id: "11111111-1111-4111-8111-111111111111", displayName: "Dara", email: "private@example.test", accessToken: "secret" };
  const first = syncPublicProfile(data, user);
  const username = first.username;
  const renamed = syncPublicProfile(data, { ...user, displayName: "New Name" });
  assert.equal(renamed.username, username);
  assert.equal(data.profiles.length, 1);
  assert.equal(renamed.displayName, "New Name");
  assert.equal(renamed.email, undefined);
  assert.equal(renamed.accessToken, undefined);
});

test("Saved belongs to the owner's profile and never appears on another profile", async (context) => {
  const { createProfileController } = await import("../public/js/profile.js");
  const content = { innerHTML: "", setAttribute() {} };
  const previousDocument = globalThis.document, previousLocation = globalThis.location;
  globalThis.document = { querySelector: () => content };
  globalThis.location = new URL("https://qipi.example/owner");
  context.after(() => { if (previousDocument) globalThis.document = previousDocument; else delete globalThis.document; if (previousLocation) globalThis.location = previousLocation; else delete globalThis.location; });
  let loaded = 0;
  const state = { profile: { id: "owner", displayName: "Owner", trips: [] }, profileTab: "posts", savedTrips: ["saved-id"], savedTripRecords: [{ id: "saved-id" }], me: { requests: [] } };
  const controller = createProfileController({ state, auth: { user: { id: "owner" } }, t: key => key, avatarContents: () => "avatar", tripCardMarkup: trip => `<article>${trip.id}</article>`, skeletonPostsMarkup: () => "skeleton", setLink() {}, loadSavedTrips: async () => { loaded++; } });
  await controller.selectProfileTab("saved");
  assert.equal(loaded, 1);
  assert.match(content.innerHTML, /<article>saved-id<\/article>/);
  assert.match(content.innerHTML, /data-action="edit-profile"/);
  const sharedSections = ["profile-card-main", "profile-overview", "profile-stats", "profile-tab-panel"];
  for (const section of sharedSections) assert.match(content.innerHTML, new RegExp(section));
  assert.match(content.innerHTML, /class="profile-tabs"/);
  state.profile = { id: "someone-else", displayName: "Other", interests: ["motorbike"], trips: [] };
  controller.renderProfile();
  for (const section of sharedSections) assert.match(content.innerHTML, new RegExp(section));
  assert.match(content.innerHTML, /data-action="toggle-follow"/);
  assert.doesNotMatch(content.innerHTML, /class="profile-tabs"|data-action="profile-tab"/);
  assert.match(content.innerHTML, />Motorbike<\/span>/);
  assert.doesNotMatch(content.innerHTML, /saved-id|data-id="saved"|data-id="joining"|data-action="edit-profile"/);
  await controller.selectProfileTab("saved");
  assert.equal(loaded, 1);
});

test("profile card identity shows the name without the username or private profile details", async () => {
  const { profileCardMarkup } = await import("../public/js/profile-card.js");
  const base = { id: "demo-1", displayName: "Dara", username: "dara", homeBase: "Kampot", languages: ["km", "en"], isDemo: true, interests: [] };
  for (const isOwnProfile of [false, true]) {
    const markup = profileCardMarkup({ profile: base, trips: [], isOwnProfile, isFollowing: false, isEditing: false, t: key => key, avatarContents: () => "DD" });
    assert.match(markup, /<h2>Dara<\/h2>/);
    assert.doesNotMatch(markup, /@dara/);
    assert.doesNotMatch(markup, /demoProfile|Kampot|km · en|profile-demo-label/);
  }
});
