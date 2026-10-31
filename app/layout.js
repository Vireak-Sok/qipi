import Script from "next/script";
import { headers } from "next/headers";
import "./globals.css";

export const metadata = {
  title: "Qipi",
  description: "Qipi is a Cambodia travel community for stories, trip plans, and safer journeys.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/pwa-192.png", sizes: "192x192", type: "image/png" }
    ],
    apple: [{ url: "/icons/pwa-180.png", sizes: "180x180", type: "image/png" }]
  },
  appleWebApp: { capable: true, title: "Qipi", statusBarStyle: "black-translucent" }
};

export const viewport = {
  themeColor: "#10191B"
};

export default async function RootLayout({ children }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="social-app">
        <Script src="/startup.js" strategy="beforeInteractive" nonce={nonce} />
        {children}
      </body>
    </html>
  );
}
