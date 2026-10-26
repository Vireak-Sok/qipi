import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { contentSecurityPolicy } from "../security-policy.mjs";

const staticFiles = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/startup.js", ["startup.js", "text/javascript; charset=utf-8"]],
  ["/i18n.js", ["i18n.js", "text/javascript; charset=utf-8"]],
  ["/auth.js", ["auth.js", "text/javascript; charset=utf-8"]],
  ["/admin.html", ["admin.html", "text/html; charset=utf-8"]],
  ["/admin.js", ["admin.js", "text/javascript; charset=utf-8"]],
  ["/icons.svg", ["icons.svg", "image/svg+xml"]],
  ["/favicon.svg", ["favicon.svg", "image/svg+xml"]]
]);

export async function serveStatic(req, res, path, { publicDir, authOrigin }) {
  const method = req.method || "GET";
  if (method !== "GET" && method !== "HEAD") return false;
  let asset = staticFiles.get(path);
  if (!asset && /^\/(?:js|css|locales)\/[a-z0-9-]+\.(?:js|css|locales)$/.test(path)) {
    asset = [path.slice(1), path.endsWith(".js") ? "text/javascript; charset=utf-8" : "text/css; charset=utf-8"];
  }
  if (!asset) return false;
  const [file, contentType] = asset;
  const content = await readFile(resolve(publicDir, file));
  res.writeHead(200, {
    "content-type": contentType,
    "content-length": content.length,
    "cache-control": "no-cache",
    "x-content-type-options": "nosniff",
    "content-security-policy": contentSecurityPolicy({ supabaseUrl: authOrigin })
  });
  res.end(method === "HEAD" ? undefined : content);
  return true;
}
