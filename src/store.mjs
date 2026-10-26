import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";

const emptyStore = () => ({ trips: [], joinRequests: [], routeUpdates: [], reports: [], events: [], likes: [], follows: [], media: [] });

function validateStore(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Store data is missing or invalid");
  for (const key of ["trips", "joinRequests", "routeUpdates", "reports", "events"]) {
    if (!Array.isArray(data?.[key])) throw new Error(`Store field ${key} is missing or invalid`);
  }
  for (const key of ["likes", "follows"]) {
    if (data[key] === undefined) data[key] = [];
    if (!Array.isArray(data[key])) throw new Error(`Store field ${key} is missing or invalid`);
  }
  if (data.media === undefined) data.media = [];
  if (!Array.isArray(data.media)) throw new Error("Store field media is missing or invalid");
  return data;
}

export class JsonStore {
  constructor(file) {
    this.file = file;
    this.ready = this.initialize();
    this.queue = Promise.resolve();
  }

  async initialize() {
    await mkdir(dirname(this.file), { recursive: true });
    try {
      await writeFile(this.file, JSON.stringify(emptyStore(), null, 2), { flag: "wx" });
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
  }

  async read() {
    await this.ready;
    return validateStore(JSON.parse(await readFile(this.file, "utf8")));
  }

  mutate(change) {
    const operation = this.queue.then(async () => {
      const data = await this.read();
      const result = await change(data);
      const temporary = `${this.file}.${randomUUID()}.tmp`;
      await writeFile(temporary, JSON.stringify(data, null, 2));
      await rename(temporary, this.file);
      return result;
    });
    this.queue = operation.then(() => undefined, () => undefined);
    return operation;
  }
}

// A single versioned JSONB row keeps this MVP's existing data model while making
// writes safe across independent Vercel function instances. Move to relational
// tables before growing beyond a small pilot.
export class SupabaseStore {
  constructor({ url, key, fetchImpl = fetch }) {
    if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY are required");
    const base = new URL(url);
    if (base.protocol !== "https:" && base.hostname !== "localhost" && base.hostname !== "127.0.0.1") {
      throw new Error("SUPABASE_URL must use HTTPS");
    }
    this.endpoint = new URL("/rest/v1/qipi_state", base);
    this.key = key;
    this.fetchImpl = fetchImpl;
    this.ready = Promise.resolve();
  }

  async request(method, params, body) {
    const target = new URL(this.endpoint);
    for (const [key, value] of Object.entries(params)) target.searchParams.set(key, value);
    const response = await this.fetchImpl(target, {
      method,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
      headers: {
        apikey: this.key,
        accept: "application/json",
        ...(body === undefined ? {} : { "content-type": "application/json", prefer: "return=representation" })
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (!response.ok) {
      let detail = "";
      try { detail = (await response.json()).message || ""; } catch { /* Keep the status as the useful error. */ }
      throw new Error(`Supabase request failed (${response.status})${detail ? `: ${detail}` : ""}`);
    }
    return response.json();
  }

  async snapshot() {
    const rows = await this.request("GET", { select: "version,data", id: "eq.1", limit: "1" });
    if (!Array.isArray(rows) || rows.length !== 1 || !Number.isSafeInteger(rows[0].version)) {
      throw new Error("Qipi database is not initialized. Apply supabase/migrations/0001_qipi_state.sql.");
    }
    return { version: rows[0].version, data: validateStore(rows[0].data) };
  }

  async read() {
    return (await this.snapshot()).data;
  }

  async mutate(change) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const { version, data } = await this.snapshot();
      const result = await change(data);
      const updated = await this.request("PATCH", {
        id: "eq.1", version: `eq.${version}`, select: "version"
      }, { version: version + 1, data });
      if (Array.isArray(updated) && updated.length === 1) return result;
      if (!Array.isArray(updated) || updated.length > 1) throw new Error("Unexpected Supabase update response");
      await new Promise((resolve) => setTimeout(resolve, Math.min(10 * (attempt + 1), 60)));
    }
    throw new Error("Qipi database is busy. Please retry the request.");
  }
}
