import { readFileSync } from "node:fs";
import { join } from "node:path";
import Script from "next/script";
import { headers } from "next/headers";

const source = readFileSync(join(process.cwd(), "public", "index.html"), "utf8");
const body = source.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? "";
const pageMarkup = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");

export default async function HomePage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      <div
        className="min-h-screen bg-[var(--surface-canvas)] text-[var(--text-primary)]"
        dangerouslySetInnerHTML={{ __html: pageMarkup }}
      />
      <Script src="/app.js?v=next-app-20261025" type="module" strategy="afterInteractive" nonce={nonce} />
    </>
  );
}
