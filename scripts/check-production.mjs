import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { readFile, access } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Exercise the built application with isolated, disposable Supabase-compatible
// endpoints. No real account, deployment, or application records are changed.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
await access(join(root, ".next", "BUILD_ID")).catch(() => {
  throw new Error("Run pnpm build before pnpm check:production");
});
const keepOpen = process.argv.includes("--keep-open");
const requestedPort = process.argv.find((value) => value.startsWith("--port="))?.split("=")[1];
const secretKey = "sb_secret_isolated_production_check";
const publishableKey = "sb_publishable_isolated_production_check";
const accessToken = "isolated-production-check-user-token";
const userId = "11111111-1111-4111-8111-111111111111";
const imageId = "22222222-2222-4222-8222-222222222222";
let row = { version: 0, data: { trips: [], joinRequests: [], routeUpdates: [], reports: [], events: [], likes: [], follows: [], media: [] } };
let authenticated = 0;
let databaseWrites = 0;
const json = (res, status, value) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(value));
};
const supabase = createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (url.pathname.startsWith("/storage/v1/object/public/qipi-images/")) {
    res.writeHead(200, { "content-type": "image/webp" });
    res.end(new Uint8Array([1, 2, 3]));
    return;
  }
  if (url.pathname === "/auth/v1/user") {
    assert.equal(req.headers.apikey, publishableKey);
    if (req.headers.authorization !== "Bearer " + accessToken) return json(res, 401, {});
    authenticated++;
    return json(res, 200, { id: userId, email: "check@example.test", user_metadata: { display_name: "Production Check" } });
  }
  if (url.pathname === "/rest/v1/qipi_state") {
    assert.equal(req.headers.apikey, secretKey);
    if (req.method === "GET") return json(res, 200, [row]);
    if (req.method === "PATCH") {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      if (url.searchParams.get("version") !== "eq." + row.version) return json(res, 200, []);
      row = JSON.parse(raw);
      databaseWrites++;
      return json(res, 200, [{ version: row.version }]);
    }
  }
  json(res, 404, { error: "Unknown isolated Supabase endpoint" });
});
supabase.listen(0, "127.0.0.1");
await once(supabase, "listening");
const supabaseUrl = "http://127.0.0.1:" + supabase.address().port;

async function availablePort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
const port = requestedPort ? Number(requestedPort) : await availablePort();
const base = "http://127.0.0.1:" + port;
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd: root,
  env: {
    ...process.env, NODE_ENV: "production", VERCEL: "1",
    SUPABASE_URL: supabaseUrl, SUPABASE_SECRET_KEY: secretKey,
    SUPABASE_PUBLISHABLE_KEY: publishableKey
  },
  stdio: ["ignore", "pipe", "pipe"]
});
let output = "";
child.stdout.on("data", (chunk) => { output = (output + chunk).slice(-6000); });
child.stderr.on("data", (chunk) => { output = (output + chunk).slice(-6000); });

try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error(output);
    try { ready = (await fetch(base + "/api/health")).ok; } catch {}
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  assert.ok(ready, "Production server did not become ready. " + output);
  const health = await (await fetch(base + "/api/health")).json();
  assert.equal(health.storage, "supabase");
  const config = await (await fetch(base + "/api/config")).json();
  assert.equal(config.authEnabled, true);
  assert.equal(config.supabaseUrl, supabaseUrl);
  assert.equal(config.publishableKey, publishableKey);
  assert.ok(!JSON.stringify(config).includes(secretKey));

  for (const path of ["/", "/feed", "/settings", "/saved", "/explore", "/trips", "/signup", "/production-check", "/post/example"]) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    assert.ok(html.includes("/app.js"), path + " must include the client entry");
    assert.ok(!html.includes(secretKey));
    const csp = response.headers.get("content-security-policy");
    assert.ok(csp.includes(supabaseUrl));
    assert.ok(csp.includes("'nonce-"));
    assert.ok(!csp.includes("unsafe-eval"));
  }
  const assets = ["core", "shared", "state", "routing", "api", "selects", "loading", "media", "search", "profile", "feed", "trip-card", "profile-tabs", "route-config"];
  for (const name of assets) {
    const response = await fetch(base + "/js/" + name + ".js");
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /javascript/);
  }
  for (const locale of ["en", "km", "zh"]) assert.equal((await fetch(base + "/locales/" + locale + ".js")).status, 200);
  for (const name of ["base", "community", "controls", "pages", "responsive"]) assert.equal((await fetch(base + "/css/" + name + ".css")).status, 200);
  const admin = await fetch(base + "/admin.html");
  assert.equal(admin.status, 200);
  assert.ok(!admin.headers.get("content-security-policy").includes("strict-dynamic"));
  const headers = { authorization: "Bearer " + accessToken, "content-type": "application/json" };
  const posted = await fetch(base + "/api/trips", {
    method: "POST", headers,
    body: JSON.stringify({
      routeId: "kampot-kep", title: "Isolated production check",
      date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      departureTime: "07:00", transport: "car", seats: 2, meetingArea: "Kampot town",
      costStyle: "own", hostName: "Production Check",
      mediaPath: "users/" + userId + "/trips/" + imageId + ".webp"
    })
  });
  assert.equal(posted.status, 201, await posted.clone().text());
  const { trip } = await posted.json();
  const sync = await fetch(base + "/api/me/profile", { method: "PUT", headers });
  assert.equal(sync.status, 200);
  const { profile } = await sync.json();
  const publicProfile = await (await fetch(base + "/api/profiles/" + profile.username)).json();
  assert.equal(publicProfile.profile.id, userId);
  assert.equal((await fetch(base + "/unexpected/nested/path")).status, 404);
  const selected = await (await fetch(base + "/api/trips?ids=" + trip.id)).json();
  assert.equal(selected.trips.length, 1);
  const own = await (await fetch(base + "/api/me", { headers })).json();
  assert.equal(own.trips[0].id, trip.id);
  const image = await fetch(base + "/media/" + imageId);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("content-type"), "image/webp");
  assert.equal((await image.arrayBuffer()).byteLength, 3);
  assert.ok(authenticated >= 2);
  assert.ok(databaseWrites >= 1);
  for (const route of ["page", "[...slug]/page"]) {
    const file = join(root, ".next/server/app", route + ".js.nft.json");
    const trace = JSON.parse(await readFile(file, "utf8"));
    assert.ok(trace.files.some((filePath) => resolve(dirname(file), filePath) === join(root, "public/index.html")), "Page shell must be included in the deployment trace");
  }
  console.log("Production checks passed: pages, modules, CSP, Auth, Supabase writes, media, and deployment traces.");
  if (keepOpen) {
    console.log("Isolated production preview: " + base + "/feed (Ctrl+C to stop)");
    await new Promise((resolve) => {
      process.once("SIGINT", resolve);
      process.once("SIGTERM", resolve);
    });
  }
} finally {
  child.kill("SIGTERM");
  supabase.closeAllConnections();
  await new Promise((resolve) => supabase.close(resolve));
}
