export class SupabaseAuthVerifier {
  constructor({ url, key, fetchImpl = fetch }) {
    if (!url || !key) throw new Error("Supabase Auth URL and publishable key are required");
    this.url = url.replace(/\/$/, "");
    this.key = key;
    this.fetch = fetchImpl;
  }

  async verify(accessToken) {
    if (typeof accessToken !== "string" || accessToken.length < 20 || accessToken.length > 8192) return null;
    const response = await this.fetch(`${this.url}/auth/v1/user`, {
      headers: { apikey: this.key, authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(6000)
    });
    if (response.status === 401 || response.status === 403) return null;
    if (!response.ok) throw new Error(`Supabase Auth returned ${response.status}`);
    const user = await response.json();
    if (typeof user.id !== "string" || !user.id) return null;
    const displayName = typeof user.user_metadata?.display_name === "string"
      ? user.user_metadata.display_name.trim().slice(0, 40) : "";
    const rawAvatarPath = typeof user.user_metadata?.avatar_path === "string" ? user.user_metadata.avatar_path : "";
    const avatarPath = new RegExp(`^users/${user.id}/profile/[0-9a-f-]{36}\\.(?:jpg|png|webp)$`, "i").test(rawAvatarPath)
      ? rawAvatarPath : "";
    return { id: user.id, email: user.email || "", displayName, avatarPath };
  }
}
