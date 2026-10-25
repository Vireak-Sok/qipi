import { createQipiHandler } from "../server.mjs";
import { SupabaseStore } from "../src/store.mjs";

let app;

export default async function handler(req, res) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY || !process.env.SUPABASE_PUBLISHABLE_KEY) {
    res.writeHead(503, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    return res.end(JSON.stringify({ error: "Qipi database is not configured" }));
  }
  try {
    app ||= createQipiHandler({
      store: new SupabaseStore({
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_SECRET_KEY
      })
    });
    await app.ready;
    return app.handler(req, res);
  } catch (error) {
    console.error("Qipi API initialization failed", error);
    res.writeHead(503, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    return res.end(JSON.stringify({ error: "Qipi API is unavailable" }));
  }
}
