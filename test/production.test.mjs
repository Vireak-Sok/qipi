import test from "node:test";
import assert from "node:assert/strict";
import { readRuntimeConfig, assertHostedConfiguration } from "../src/config.mjs";
import { createQipiStore } from "../src/runtime-store.mjs";
import { SupabaseStore } from "../src/store.mjs";
import { contentSecurityPolicy } from "../src/security-policy.mjs";
import { createQipiHandler } from "../src/server/application.mjs";
import { createWebHandler } from "../src/server/web-handler.mjs";
import { createMediaHandler } from "../src/server/media.mjs";

const productionEnv = {
  VERCEL: "1", SUPABASE_URL: "https://configured-project.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_server_only", SUPABASE_PUBLISHABLE_KEY: "sb_publishable_browser"
};
function memoryStore(initial = {}) {
  let data = { trips: [], joinRequests: [], routeUpdates: [], reports: [], events: [], likes: [], follows: [], media: [], ...initial };
  return {
    ready: Promise.resolve(),
    read: async () => structuredClone(data),
    mutate: async (change) => {
      const next = structuredClone(data);
      const value = await change(next);
      data = next;
      return value;
    }
  };
}

test("Vercel storage fails closed when Supabase configuration is incomplete", () => {
  assert.throws(() => createQipiStore({ env: { VERCEL: "1" } }), /Missing Vercel environment variables/);
  assert.throws(() => createQipiStore({ env: { ...productionEnv, SUPABASE_SECRET_KEY: "" } }), /SUPABASE_SECRET_KEY/);
  assert.throws(() => createQipiStore({ env: { ...productionEnv, SUPABASE_PUBLISHABLE_KEY: "" } }), /SUPABASE_PUBLISHABLE_KEY/);
  assert.ok(createQipiStore({ env: productionEnv }) instanceof SupabaseStore);
  assert.doesNotThrow(() => assertHostedConfiguration(readRuntimeConfig({})));
  assert.throws(() => readRuntimeConfig({ SUPABASE_URL: "http://remote.example" }), /HTTPS/);
});

test("production CSP follows the configured Supabase project and permits image previews", () => {
  const policy = contentSecurityPolicy({ nonce: "request-nonce", supabaseUrl: productionEnv.SUPABASE_URL });
  assert.match(policy, /connect-src 'self' https:\/\/configured-project.supabase.co/);
  assert.match(policy, /'nonce-request-nonce' 'strict-dynamic'/);
  assert.match(policy, /img-src 'self' data: blob:/);
  assert.doesNotMatch(policy, /unsafe-eval|unsafe-inline|dlqkapkaash/);
  const staticPolicy = contentSecurityPolicy({ supabaseUrl: productionEnv.SUPABASE_URL });
  assert.doesNotMatch(staticPolicy, /strict-dynamic|nonce-/);
  const devPolicy = contentSecurityPolicy({ development: true });
  assert.match(devPolicy, /unsafe-eval/);
  assert.match(devPolicy, /ws:/);
});

test("Next request adapter preserves authenticated posting, profile, likes, and private configuration", async () => {
  const config = readRuntimeConfig(productionEnv);
  const user = { id: "member-1", displayName: "Traveler", email: "traveler@example.test", interests: [], homeBase: "", bio: "" };
  const app = createQipiHandler({ config, store: memoryStore(), authVerifier: { verify: async (token) => token === "member-token" ? user : null } });
  const handle = createWebHandler(() => app);
  const call = (path, { method = "GET", data, authenticated = false, headers = {} } = {}) => handle(new Request("https://qipi.example" + path, {
    method,
    headers: {
      ...(data ? { "content-type": "application/json" } : {}),
      ...(authenticated ? { authorization: "Bearer member-token" } : {}),
      "x-qipi-actor": "11111111-1111-4111-8111-111111111111",
      ...headers
    },
    body: data ? JSON.stringify(data) : undefined
  }));
  const settings = await (await call("/api/config")).json();
  assert.equal(settings.supabaseUrl, productionEnv.SUPABASE_URL);
  assert.equal(settings.publishableKey, productionEnv.SUPABASE_PUBLISHABLE_KEY);
  assert.ok(!JSON.stringify(settings).includes(productionEnv.SUPABASE_SECRET_KEY));
  const ownProfile = await call("/api/profiles/member-1", { authenticated: true });
  assert.equal(ownProfile.status, 200);
  assert.equal((await ownProfile.json()).profile.displayName, "Traveler");
  assert.equal((await call("/api/me/profile", { method: "PUT" })).status, 401);
  const synced = await (await call("/api/me/profile", { method: "PUT", authenticated: true })).json();
  const publicProfile = await (await call("/api/profiles/" + synced.profile.username)).json();
  assert.equal(publicProfile.profile.id, user.id);
  assert.equal(publicProfile.trips.length, 0);
  assert.ok(!JSON.stringify(publicProfile).includes(user.email));
  const input = {
    routeId: "kampot-kep", title: "Production adapter trip",
    date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    departureTime: "07:00", transport: "car", seats: 2, meetingArea: "Kampot town", costStyle: "own", hostName: "Traveler"
  };
  assert.equal((await call("/api/trips", { method: "POST", data: input })).status, 401);
  const posted = await call("/api/trips", { method: "POST", data: input, authenticated: true });
  assert.equal(posted.status, 201);
  const { trip } = await posted.json();
  assert.equal((await (await call("/api/trips?ids=" + trip.id)).json()).trips.length, 1);
  const firstPage = await (await call("/api/trips?limit=1")).json();
  assert.equal(firstPage.trips.length, 1);
  assert.equal(firstPage.trips[0].id, trip.id);
  assert.equal(firstPage.nextCursor, null);
  assert.equal((await call("/api/trips?limit=101")).status, 400);
  assert.equal((await call("/api/trips?limit=1&cursor=invalid")).status, 400);
  assert.equal((await (await call("/api/trips?ids=unknown")).json()).trips.length, 0);
  assert.equal((await call("/api/trips?ids=" + Array(101).fill("id").join(","))).status, 400);

  const liked = await call("/api/trips/" + trip.id + "/like", { method: "POST", data: { liked: true } });
  assert.equal(liked.status, 200);
  assert.equal((await liked.json()).likesCount, 1);
  const unliked = await call("/api/trips/" + trip.id + "/like", { method: "POST", data: { liked: false } });
  assert.equal((await unliked.json()).likesCount, 0);
  const ownTrips = await (await call("/api/me", { authenticated: true })).json();
  assert.equal(ownTrips.trips[0].id, trip.id);
  const malformed = await handle(new Request("https://qipi.example/api/events", {
    method: "POST", headers: { "content-type": "application/json" }, body: "{invalid"
  }));
  assert.equal(malformed.status, 400);
});

test("media delivery resolves registered public images, handles HEAD, and rejects hidden or unknown files", async () => {
  const id = "11111111-1111-4111-8111-111111111111";
  const path = "users/member-1/profile/" + id + ".webp";
  let fetched = 0;
  const media = createMediaHandler({
    getStore: () => memoryStore({ media: [{ path }] }),
    getSupabaseUrl: () => productionEnv.SUPABASE_URL,
    fetchImpl: async (url) => {
      fetched++;
      assert.equal(String(url), productionEnv.SUPABASE_URL + "/storage/v1/object/public/qipi-images/" + path);
      return new Response(new Uint8Array([1, 2, 3]));
    }
  });
  const context = { params: Promise.resolve({ id }) };
  const response = await media(new Request("https://qipi.example/media/" + id), context);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "image/webp");
  assert.match(response.headers.get("cache-control"), /immutable/);
  assert.equal((await response.arrayBuffer()).byteLength, 3);
  const head = await media(new Request("https://qipi.example/media/" + id, { method: "HEAD" }), context);
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
  const missing = await media(new Request("https://qipi.example/media/missing"), { params: Promise.resolve({ id: "not-an-id" }) });
  assert.equal(missing.status, 404);
  assert.equal(fetched, 2);
  const hidden = createMediaHandler({
    getStore: () => memoryStore({ trips: [{ hidden: true, mediaPath: path }] }),
    getSupabaseUrl: () => productionEnv.SUPABASE_URL,
    fetchImpl: () => { throw new Error("Must not fetch a hidden trip image"); }
  });
  assert.equal((await hidden(new Request("https://qipi.example/media/" + id), context)).status, 404);
});
