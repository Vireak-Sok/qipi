import { Readable } from "node:stream";

// Keep the API contract shared between the standalone server and Next route handlers.
export function createWebHandler(getApplication) {
  return async function handle(request) {
    try {
      const app = await getApplication();
      await app.ready;
      const url = new URL(request.url);
      const nodeRequest = request.body ? Readable.fromWeb(request.body) : Readable.from([]);
      Object.assign(nodeRequest, {
        method: request.method,
        url: url.pathname + url.search,
        headers: Object.fromEntries(request.headers.entries()),
        socket: { remoteAddress: request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown" }
      });
      let status = 200;
      const headers = new Headers();
      let response;
      const nodeResponse = {
        writeHead(code, values = {}) {
          status = code;
          for (const [name, value] of Object.entries(values)) headers.set(name, String(value));
          return this;
        },
        end(value) {
          response = new Response(request.method === "HEAD" ? null : value ?? null, { status, headers });
          return this;
        }
      };
      await app.handler(nodeRequest, nodeResponse);
      if (!response) throw new Error("Qipi handler did not finish the response");
      return response;
    } catch (error) {
      console.error("Qipi API initialization failed", error);
      return Response.json({ error: "Qipi API is unavailable" }, { status: 503, headers: { "cache-control": "no-store" } });
    }
  };
}
