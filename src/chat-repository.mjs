// Chat uses dedicated relational tables; the versioned JSON MVP store is not
// suitable for high-frequency message writes or per-user message history.
export class SupabaseChatRepository {
  constructor({ url, key, fetchImpl = fetch }) {
    this.base = new URL(url);
    this.key = key;
    this.fetch = fetchImpl;
  }

  async request(table, { method = "GET", query = {}, body, prefer } = {}) {
    const url = new URL(`/rest/v1/${table}`, this.base);
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);
    const response = await this.fetch(url, {
      method, cache: "no-store", signal: AbortSignal.timeout(10000),
      headers: {
        apikey: this.key, authorization: `Bearer ${this.key}`, accept: "application/json",
        ...(body === undefined ? {} : { "content-type": "application/json" }),
        ...(prefer ? { prefer } : {})
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (!response.ok) {
      let detail = "";
      try { detail = (await response.json()).message || ""; } catch {}
      throw new Error(`Chat database request failed (${response.status})${detail ? `: ${detail}` : ""}`);
    }
    if (response.status === 204) return [];
    return response.json();
  }

  conversationsFor(userId) {
    return this.request("qipi_conversations", { query: {
      select: "id,user_low,user_high,created_at,updated_at",
      or: `(user_low.eq.${userId},user_high.eq.${userId})`,
      order: "updated_at.desc", limit: "100"
    } });
  }

  async findConversation(id) {
    const rows = await this.request("qipi_conversations", { query: {
      select: "id,user_low,user_high,created_at,updated_at", id: `eq.${id}`, limit: "1"
    } });
    return rows[0] || null;
  }

  async findOrCreateConversation(userId, targetId) {
    const [user_low, user_high] = [userId, targetId].sort();
    const rows = await this.request("qipi_conversations", {
      method: "POST", query: { on_conflict: "user_low,user_high", select: "id,user_low,user_high,created_at,updated_at" },
      prefer: "resolution=merge-duplicates,return=representation", body: { user_low, user_high }
    });
    return rows[0];
  }

  messages(id, { before = "", limit = 50 } = {}) {
    return this.request("qipi_messages", { query: {
      select: "id,conversation_id,sender_id,body,created_at,read_at",
      conversation_id: `eq.${id}`,
      ...(before ? { created_at: `lt.${before}` } : {}),
      order: "created_at.desc,id.desc", limit: String(limit)
    } });
  }

  searchMessages(conversationIds, query) {
    if (!conversationIds.length) return Promise.resolve([]);
    const safeQuery = String(query || "").replace(/[\\%_*(),]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
    if (!safeQuery) return Promise.resolve([]);
    return this.request("qipi_messages", { query: {
      select: "id,conversation_id,sender_id,body,created_at",
      conversation_id: `in.(${conversationIds.join(",")})`,
      body: `ilike.*${safeQuery}*`,
      order: "created_at.desc,id.desc", limit: "100"
    } });
  }

  async sendMessage(conversationId, senderId, body) {
    const rows = await this.request("qipi_messages", {
      method: "POST", query: { select: "id,conversation_id,sender_id,body,created_at,read_at" },
      prefer: "return=representation", body: { conversation_id: conversationId, sender_id: senderId, body }
    });
    return rows[0];
  }

  markRead(conversationId, userId) {
    return this.request("qipi_messages", {
      method: "PATCH",
      query: { conversation_id: `eq.${conversationId}`, sender_id: `neq.${userId}`, read_at: "is.null" },
      prefer: "return=minimal", body: { read_at: new Date().toISOString() }
    });
  }

  async latestMessage(conversationId) {
    const rows = await this.request("qipi_messages", { query: {
      select: "id,conversation_id,sender_id,body,created_at,read_at",
      conversation_id: `eq.${conversationId}`, order: "created_at.desc,id.desc", limit: "1"
    } });
    return rows[0] || null;
  }

  async unreadCount(conversationId, userId) {
    const rows = await this.request("qipi_messages", { query: {
      select: "id", conversation_id: `eq.${conversationId}`, sender_id: `neq.${userId}`,
      read_at: "is.null", limit: "100"
    } });
    return rows.length;
  }
}
