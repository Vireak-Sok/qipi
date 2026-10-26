export class ApiError extends Error {
  constructor(message, status = 0) { super(message); this.name = "ApiError"; this.status = status; }
}

export function createApiClient({ auth, state, t, fetchImpl = fetch }) {
  // Coalesce simultaneous reads only; no stale cache or cross-account reuse.
  const pendingReads = new Map();
  async function api(path, { method = "GET", data, headers = {}, signal } = {}) {
    const accessToken = await auth.accessToken();
    const requestHeaders = { "x-qipi-actor": state.likeActorId, ...(data ? { "content-type": "application/json" } : {}), ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}), ...headers };
    const key = JSON.stringify([path, requestHeaders]);
    const canShare = method === "GET" && !signal;
    if (canShare && pendingReads.has(key)) return pendingReads.get(key);
    const request = (async () => {
      const response = await fetchImpl(path, {
        method, headers: requestHeaders, cache: "no-store",
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
        body: data ? JSON.stringify(data) : undefined
      });
      let result;
      try { result = await response.json(); }
      catch { throw new ApiError(t("failed"), response.status); }
      if (!response.ok) throw new ApiError(result.error || t("failed"), response.status);
      return result;
    })();
    if (canShare) pendingReads.set(key, request);
    try { return await request; }
    finally { if (pendingReads.get(key) === request) pendingReads.delete(key); }
  }
  function event(type, targetId) { api("/api/events", { method: "POST", data: { type, targetId } }).catch(() => {}); }
  return { api, event };
}
