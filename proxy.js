import { NextResponse } from "next/server";
import { contentSecurityPolicy } from "./src/security-policy.mjs";
import { readRuntimeConfig } from "./src/config.mjs";

export function proxy(request) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const staticPage = ["/admin.html", "/index.html"].includes(request.nextUrl.pathname);
  const policy = contentSecurityPolicy({
    nonce: staticPage ? undefined : nonce,
    supabaseUrl: readRuntimeConfig().supabaseUrl,
    development: process.env.NODE_ENV === "development"
  });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|media/|favicon.ico|.*\\.(?:js|css|svg|png|jpg|webp)$).*)"]
};
