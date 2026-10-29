// Read configuration at runtime so the same build can run on Preview and Production.
export function readRuntimeConfig(env = process.env) {
  const supabaseUrl = (env.SUPABASE_URL || "").trim().replace(/\/$/, "");
  if (supabaseUrl) {
    const url = new URL(supabaseUrl);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.protocol !== "https:" && !(local && url.protocol === "http:")) {
      throw new Error("SUPABASE_URL must use HTTPS");
    }
  }
  return {
    supabaseUrl,
    secretKey: (env.SUPABASE_SECRET_KEY || "").trim(),
    publishableKey: (env.SUPABASE_PUBLISHABLE_KEY || "").trim(),
    maptilerPublicKey: (env.MAPTILER_PUBLIC_KEY || "").trim(),
    openrouteserviceKey: (env.OPENROUTESERVICE_API_KEY || "").trim(),
    adminToken: env.QIPI_ADMIN_TOKEN || "",
    hosted: Boolean(env.VERCEL)
  };
}

export function assertHostedConfiguration(config) {
  if (!config.hosted) return;
  const required = {
    SUPABASE_URL: config.supabaseUrl,
    SUPABASE_SECRET_KEY: config.secretKey,
    SUPABASE_PUBLISHABLE_KEY: config.publishableKey
  };
  const missing = Object.keys(required).filter((name) => !required[name]);
  if (missing.length) throw new Error("Missing Vercel environment variables: " + missing.join(", "));
}
