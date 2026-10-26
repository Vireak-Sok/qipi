import Script from "next/script";
import { headers } from "next/headers";
import { QipiShell } from "../src/ui/QipiShell.jsx";

export default async function HomePage() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <>
      <QipiShell />
      <Script src="/app.js" type="module" strategy="afterInteractive" nonce={nonce} />
    </>
  );
}
