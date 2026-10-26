import Script from "next/script";
import { headers } from "next/headers";
import "./globals.css";

export const metadata = {
  title: "Qipi",
  description: "Qipi is a Cambodia travel community for sharing routes, weekend plans and stories from the road.",
  icons: { icon: "/favicon.svg" }
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
