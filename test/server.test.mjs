import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { once } from "node:events";
import { createQipiHandler, createQipiServer } from "../server.mjs";
import { JsonStore, SupabaseStore } from "../src/store.mjs";

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), "qipi-test-"));
  const { server, ready } = createQipiServer({
    store: new JsonStore(join(directory, "store.json")),
    adminToken: "test-admin-secret"
  });
  await ready;
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  async function request(path, method = "GET", data, headers = {}) {
    const response = await fetch(base + path, {
      method,
      headers: { ...(data ? { "content-type": "application/json" } : {}), ...headers },
      body: data ? JSON.stringify(data) : undefined
    });
    return { status: response.status, body: await response.json() };
  }
  async function close() {
    server.close();
    await once(server, "close");
    await rm(directory, { recursive: true, force: true });
  }
  return { base, request, close };
}

test("routes and trip join flow persist, authorize, and enforce capacity", async () => {
  const app = await fixture();
  try {
    const routes = await app.request("/api/routes");
    assert.equal(routes.status, 200);
    assert.equal(routes.body.routes.length, 3);
    const rewrittenRoutes = await app.request("/api/index?_qipi_path=routes");
    assert.equal(rewrittenRoutes.status, 200);
    assert.equal(rewrittenRoutes.body.routes.length, 3);

    const futureDate = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
    const created = await app.request("/api/trips", "POST", {
      routeId: "bokor-day", title: "Morning ride to Bokor", date: futureDate,
      departureTime: "07:00", transport: "motorbike", seats: 1,
      meetingArea: "Kampot town center", costStyle: "shared",
      notes: "Daylight ride with breaks.", hostName: "Dara"
    });
    assert.equal(created.status, 201);
    assert.ok(created.body.ownerToken);
    const tripId = created.body.trip.id;

    const joined = await app.request(`/api/trips/${tripId}/requests`, "POST", { travelerName: "Sokha", message: "I ride regularly." });
    assert.equal(joined.status, 201);
    const requestId = joined.body.request.id;

    const denied = await app.request(`/api/trips/${tripId}/requests/${requestId}/decision`, "POST", { decision: "approved" }, { "x-host-token": "wrong" });
    assert.equal(denied.status, 403);

    const approved = await app.request(`/api/trips/${tripId}/requests/${requestId}/decision`, "POST", { decision: "approved" }, { "x-host-token": created.body.ownerToken });
    assert.equal(approved.status, 200);
    assert.equal(approved.body.request.status, "approved");

    const privateStatus = await app.request(`/api/trips/${tripId}/requests/${requestId}`, "GET", undefined, { "x-request-token": joined.body.requestToken });
    assert.equal(privateStatus.body.request.status, "approved");
    const wrongStatus = await app.request(`/api/trips/${tripId}/requests/${requestId}`);
    assert.equal(wrongStatus.status, 403);

    const full = await app.request(`/api/trips/${tripId}`);
    assert.equal(full.body.trip.availableSpots, 0);
    assert.equal(full.body.trip.ownerTokenHash, undefined);
    const second = await app.request(`/api/trips/${tripId}/requests`, "POST", { travelerName: "Maly", message: "" });
    assert.equal(second.status, 409);
  } finally { await app.close(); }
});

test("Supabase store retries a conflicting write without losing the other update", async () => {
  let row = {
    version: 0,
    data: { trips: [], joinRequests: [], routeUpdates: [], reports: [], events: [] }
  };
  let injectedConflict = false;
  const fetchImpl = async (url, options) => {
    assert.equal(options.headers.apikey, "test-secret");
    const target = new URL(url);
    if (options.method === "GET") return Response.json([structuredClone(row)]);
    if (options.method === "PATCH") {
      if (!injectedConflict) {
        injectedConflict = true;
        row = { version: 1, data: { ...row.data, events: [{ type: "other_writer" }] } };
      }
      if (target.searchParams.get("version") !== `eq.${row.version}`) return Response.json([]);
      row = JSON.parse(options.body);
      return Response.json([{ version: row.version }]);
    }
    throw new Error("Unexpected request");
  };
  const store = new SupabaseStore({ url: "https://example.supabase.co", key: "test-secret", fetchImpl });
  await store.mutate((data) => { data.trips.push({ id: "trip-1" }); });
  assert.equal(row.version, 2);
  assert.deepEqual(row.data.trips, [{ id: "trip-1" }]);
  assert.deepEqual(row.data.events, [{ type: "other_writer" }]);
});

test("Vercel-style rewritten request accepts a parsed JSON body", async () => {
  let data = { trips: [], joinRequests: [], routeUpdates: [], reports: [], events: [] };
  const store = {
    ready: Promise.resolve(),
    read: async () => structuredClone(data),
    mutate: async (change) => {
      const next = structuredClone(data);
      const result = await change(next);
      data = next;
      return result;
    }
  };
  const { handler } = createQipiHandler({ store });
  const date = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
  const req = {
    url: "/api/index?_qipi_path=trips",
    method: "POST",
    headers: { "content-type": "application/json" },
    socket: { remoteAddress: "127.0.0.1" },
    body: {
      routeId: "kampot-kep", title: "Weekend trip to Kep", date,
      departureTime: "07:30", transport: "motorbike", seats: 2,
      meetingArea: "Kampot town", costStyle: "own", hostName: "Dara"
    }
  };
  const res = {
    writeHead(status) { this.status = status; },
    end(payload) { this.body = JSON.parse(payload); }
  };
  await handler(req, res);
  assert.equal(res.status, 201);
  assert.equal(res.body.trip.title, "Weekend trip to Kep");
  assert.equal(data.trips.length, 1);
});

test("route notes require moderation, and reports can be resolved", async () => {
  const app = await fixture();
  try {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const submitted = await app.request("/api/routes/kampot-kep/updates", "POST", {
      nickname: "Vireak", visitedOn: yesterday, condition: "mixed",
      note: "Road was open, but check the weather before leaving."
    });
    assert.equal(submitted.status, 201);
    const before = await app.request("/api/routes/kampot-kep");
    assert.equal(before.body.updates.length, 0);

    const adminHeaders = { "x-admin-token": "test-admin-secret" };
    const overview = await app.request("/api/admin/overview", "GET", undefined, adminHeaders);
    assert.equal(overview.body.updates.length, 1);
    const approved = await app.request(`/api/admin/updates/${submitted.body.id}/decision`, "POST", { decision: "approved" }, adminHeaders);
    assert.equal(approved.status, 200);
    const after = await app.request("/api/routes/kampot-kep");
    assert.equal(after.body.updates.length, 1);

    const reported = await app.request("/api/reports", "POST", { targetType: "route", targetId: "kampot-kep", reason: "inaccurate", details: "Please review the timing." });
    assert.equal(reported.status, 201);
    const pending = await app.request("/api/admin/overview", "GET", undefined, adminHeaders);
    assert.equal(pending.body.reports.length, 1);
    await app.request(`/api/admin/reports/${reported.body.id}/resolve`, "POST", {}, adminHeaders);
    const resolved = await app.request("/api/admin/overview", "GET", undefined, adminHeaders);
    assert.equal(resolved.body.reports.length, 0);
  } finally { await app.close(); }
});
