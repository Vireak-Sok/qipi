import { randomUUID } from "node:crypto";

export class SafetyRepository {
  constructor({ url = "", key = "", fetchImpl = fetch } = {}) {
    this.url = url;
    this.key = key;
    this.fetchImpl = fetchImpl;
    this.lastPurgeAt = 0;
    this.local = { contacts: [], sessions: [], checkins: [] };
  }

  async query(table, method, params = {}, value) {
    if (!this.url || !this.key) throw new Error("Safety database is unavailable");
    const target = new URL(`/rest/v1/qipi_safety_${table}`, this.url);
    for (const [name, item] of Object.entries(params)) target.searchParams.set(name, item);
    const response = await this.fetchImpl(target, {
      method,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
      headers: {
        apikey: this.key,
        accept: "application/json",
        ...(value === undefined ? {} : { "content-type": "application/json", prefer: "return=representation" })
      },
      body: value === undefined ? undefined : JSON.stringify(value)
    });
    if (!response.ok) throw new Error(`Safety database request failed (${response.status})`);
    return response.status === 204 ? [] : response.json();
  }

  async list(table, userId) {
    if (table === "sessions" || table === "checkins") await this.purgeExpired();
    if (!this.url) return this.local[table].filter(item => item.user_id === userId).sort((a, b) => b.created_at.localeCompare(a.created_at));
    return this.query(table, "GET", { select: "*", user_id: `eq.${userId}`, order: "created_at.desc", limit: "50" });
  }

  async insert(table, value) {
    if (!this.url) {
      const row = { id: randomUUID(), created_at: new Date().toISOString(), ...value };
      this.local[table].push(row);
      return row;
    }
    const rows = await this.query(table, "POST", { select: "*" }, value);
    return rows[0];
  }

  async update(table, id, userId, value) {
    if (!this.url) {
      const row = this.local[table].find(item => item.id === id && item.user_id === userId);
      if (!row) return null;
      Object.assign(row, value);
      return row;
    }
    const rows = await this.query(table, "PATCH", { id: `eq.${id}`, user_id: `eq.${userId}`, select: "*" }, value);
    return rows[0] || null;
  }

  async remove(table, id, userId) {
    if (!this.url) {
      const index = this.local[table].findIndex(item => item.id === id && item.user_id === userId);
      if (index < 0) return false;
      this.local[table].splice(index, 1);
      return true;
    }
    const rows = await this.query(table, "DELETE", { id: `eq.${id}`, user_id: `eq.${userId}`, select: "id" });
    return rows.length > 0;
  }

  async sessionByHash(hash) {
    await this.purgeExpired();
    if (!this.url) return this.local.sessions.find(item => item.token_hash === hash) || null;
    const rows = await this.query("sessions", "GET", { select: "*", token_hash: `eq.${hash}`, limit: "1" });
    return rows[0] || null;
  }

  async purgeExpired() {
    if (Date.now() - this.lastPurgeAt < 60 * 60 * 1000) return;
    this.lastPurgeAt = Date.now();
    const sessionCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const checkinCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    if (!this.url) {
      this.local.sessions = this.local.sessions.filter(item => item.expires_at > sessionCutoff);
      this.local.checkins = this.local.checkins.filter(item => item.created_at > checkinCutoff);
      return;
    }
    await Promise.all([
      this.query("sessions", "DELETE", { expires_at: `lt.${sessionCutoff}` }),
      this.query("checkins", "DELETE", { created_at: `lt.${checkinCutoff}` })
    ]);
  }
}
