import { join } from "node:path";
import { SupabaseStore } from "../store.mjs";
import { createQipiStore } from "../runtime-store.mjs";
import { SupabaseAuthVerifier } from "../auth.mjs";
import { HttpError, json } from "./http.mjs";
import { serveStatic } from "./static.mjs";
import { readRuntimeConfig } from "../config.mjs";
import { handleAccountsRoutes } from "./accounts-routes.mjs";
import { handleTripsRoutes } from "./trips-routes.mjs";
import { handleCommunityRoutes } from "./community-routes.mjs";
import { handleMessagesRoutes } from "./messages-routes.mjs";
import { SupabaseChatRepository } from "../chat-repository.mjs";
import { SafetyRepository } from "../safety-repository.mjs";
import { handleSafetyRoutes } from "./safety-routes.mjs";
import { handleMapRoutes } from "./map-routes.mjs";

const routeHandlers = [handleAccountsRoutes, handleTripsRoutes, handleCommunityRoutes, handleMessagesRoutes, handleSafetyRoutes, handleMapRoutes];

const defaultDataFile = join(process.cwd(), "data", "store.json");
const defaultPublicDir = join(process.cwd(), "public");

export function createQipiHandler({
  config = readRuntimeConfig(),
  dataFile = defaultDataFile,
  publicDir = defaultPublicDir,
  adminToken = config.adminToken,
  authVerifier = config.supabaseUrl && config.publishableKey
    ? new SupabaseAuthVerifier({ url: config.supabaseUrl, key: config.publishableKey })
    : null,
  store = createQipiStore({ dataFile })
} = {}) {
  const recentWrites = new Map();
  const safety = new SafetyRepository({ url: config.supabaseUrl && config.secretKey ? config.supabaseUrl : "", key: config.secretKey });
  const authOrigin = authVerifier && config.supabaseUrl ? new URL(config.supabaseUrl).origin : "";

  async function userFor(req, { required = false } = {}) {
    if (!authVerifier) {
      if (required && store instanceof SupabaseStore) throw new HttpError(503, "Authentication is not configured");
      return null; // Local JSON development keeps the original browser-token demo flow.
    }
    const header = req.headers.authorization;
    if (typeof header !== "string" || !header.startsWith("Bearer ")) {
      if (required) throw new HttpError(401, "Sign in to continue");
      return null;
    }
    try {
      const user = await authVerifier.verify(header.slice(7));
      if (!user) throw new HttpError(401, "Your session has expired. Sign in again");
      return user;
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(503, "Sign-in service is unavailable");
    }
  }

  function limitWrites(req) {
    const key = (typeof req.headers["x-real-ip"] === "string" && req.headers["x-real-ip"]) ||
      req.socket?.remoteAddress || "unknown";
    const now = Date.now();
    const recent = (recentWrites.get(key) || []).filter((time) => now - time < 15 * 60_000);
    if (recent.length >= 80) throw new HttpError(429, "Too many requests; try again later");
    recent.push(now);
    recentWrites.set(key, recent);
  }

  const handler = async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://localhost");
      const rewrittenPath = url.pathname === "/api/index" ? url.searchParams.get("_qipi_path") : null;
      const path = rewrittenPath ? `/api/${rewrittenPath.replace(/^\/+/, "")}` : url.pathname;
      const method = req.method || "GET";
      if (method !== "GET" && method !== "HEAD") limitWrites(req);

      if (path === "/api/health" && method === "GET") {
        await store.read();
        return json(res, 200, { ok: true, name: "Qipi", storage: store instanceof SupabaseStore ? "supabase" : "local" });
      }
      if (path === "/api/config" && method === "GET") {
        return json(res, 200, {
          authEnabled: Boolean(authVerifier),
          supabaseUrl: authVerifier ? config.supabaseUrl : "",
          publishableKey: authVerifier ? config.publishableKey : "",
          maptilerPublicKey: config.maptilerPublicKey || "",
          navigationEnabled: Boolean(config.maptilerPublicKey && config.openrouteserviceKey)
        });
      }
      const context = {
        req, res, path, method, url, store, userFor, adminToken, safety, config,
        chat: config.supabaseUrl && config.secretKey
          ? new SupabaseChatRepository({ url: config.supabaseUrl, key: config.secretKey })
          : null
      };
      for (const routeHandler of routeHandlers) {
        if (await routeHandler(context)) return;
      }

      if (await serveStatic(req, res, path, { publicDir, authOrigin })) return;

      throw new HttpError(404, "Page not found");
    } catch (error) {
      if (!(error instanceof HttpError)) console.error(error);
      json(res, error instanceof HttpError ? error.status : 500, {
        error: error instanceof HttpError ? error.message : "Unexpected server error"
      });
    }
  };
  return { handler, ready: store.ready };
}
