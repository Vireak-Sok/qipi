import { createServer } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createQipiHandler } from "./src/server/application.mjs";

export { createQipiHandler };

export function createQipiServer(options = {}) {
  const { handler, ready } = createQipiHandler(options);
  return { server: createServer(handler), ready };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { server, ready } = createQipiServer();
  await ready;
  const port = Number(process.env.PORT || 4173);
  const host = process.env.HOST || "127.0.0.1";
  server.listen(port, host, () => {
    console.log(`Qipi running at http://${host}:${port}`);
    if (!process.env.QIPI_ADMIN_TOKEN) {
      console.log("Admin moderation is disabled. Set QIPI_ADMIN_TOKEN to enable /admin.html.");
    }
  });
}
