import { Readable } from "node:stream";
import { join } from "node:path";
import { createQipiHandler } from "../../../server.mjs";
import { SupabaseStore } from "../../../src/store.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let application;

function getApplication() {
  if (application) return application;
  const useSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY;
  application = createQipiHandler(useSupabase ? {
    store: new SupabaseStore({ url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SECRET_KEY })
  } : { dataFile: join(process.cwd(), "data", "store.json") });
  return application;
}

async function handle(request) {
  const configured = process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY && process.env.SUPABASE_PUBLISHABLE_KEY;
  if (process.env.VERCEL && !configured) {
    return Response.json({ error: "Qipi database is not configured" }, { status: 503, headers: { "cache-control": "no-store" } });
  }

  const url = new URL(request.url);
  const nodeRequest = request.body ? Readable.fromWeb(request.body) : Readable.from([]);
  nodeRequest.method = request.method;
  nodeRequest.url = `${url.pathname}${url.search}`;
  nodeRequest.headers = Object.fromEntries(request.headers.entries());
  nodeRequest.socket = { remoteAddress: request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown" };

  let status = 200;
  const headers = new Headers();
  let finish;
  const responseReady = new Promise((resolve) => { finish = resolve; });
  const nodeResponse = {
    writeHead(code, responseHeaders = {}) {
      status = code;
      for (const [name, value] of Object.entries(responseHeaders)) headers.set(name, String(value));
      return this;
    },
    end(value) {
      finish(new Response(request.method === "HEAD" ? null : value ?? null, { status, headers }));
      return this;
    }
  };

  try {
    const app = getApplication();
    await app.ready;
    await app.handler(nodeRequest, nodeResponse);
    return await responseReady;
  } catch (error) {
    console.error("Qipi API initialization failed", error);
    return Response.json({ error: "Qipi API is unavailable" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}

export const GET = handle;
export const HEAD = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
export const OPTIONS = handle;
