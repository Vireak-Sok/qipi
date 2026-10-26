export function contentSecurityPolicy({ nonce, supabaseUrl = "", development = false } = {}) {
  const scripts = ["'self'"];
  if (nonce) scripts.push("'nonce-" + nonce + "'", "'strict-dynamic'");
  if (development) scripts.push("'unsafe-eval'");
  const styles = ["'self'"];
  if (development) styles.push("'unsafe-inline'");
  else if (nonce) styles.push("'nonce-" + nonce + "'");
  const connections = ["'self'"];
  if (supabaseUrl) connections.push(new URL(supabaseUrl).origin);
  if (development) connections.push("ws:");

  return [
    "default-src 'self'",
    "img-src 'self' data: blob:",
    "style-src " + styles.join(" "),
    "script-src " + scripts.join(" "),
    "connect-src " + connections.join(" "),
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'"
  ].join("; ");
}
