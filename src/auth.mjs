import { TRAVEL_STYLES } from "../public/js/shared.js";

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
      cache: "no-store",
      headers: { apikey: this.key, authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(6000)
    });
    if (response.status === 401 || response.status === 403) return null;
    if (!response.ok) throw new Error(`Supabase Auth returned ${response.status}`);
    const user = await response.json();
    if (typeof user.id !== "string" || !user.id) return null;
    const metadata = user.user_metadata || {};
    const displayName = (typeof metadata.display_name === "string" ? metadata.display_name.trim() : "")
      .slice(0, 40) || String(user.email || "").split("@")[0].slice(0, 40) || "Traveler";
    const rawAvatarPath = typeof metadata.avatar_path === "string" ? metadata.avatar_path : "";
    const avatarPath = new RegExp(`^users/${user.id}/profile/[0-9a-f-]{36}\\.(?:jpg|png|webp)$`, "i").test(rawAvatarPath)
      ? rawAvatarPath : "";
    const allowedStyles = new Set(TRAVEL_STYLES);
    const interests = Array.isArray(metadata.travel_styles)
      ? metadata.travel_styles.filter((item) => allowedStyles.has(item)).slice(0, 3) : [];
    return {
      id: user.id,
      email: user.email || "",
      displayName,
      avatarPath,
      homeBase: typeof metadata.home_base === "string" ? metadata.home_base.trim().slice(0, 80) : "",
      interests,
      bio: typeof metadata.bio === "string" ? metadata.bio.trim().slice(0, 160) : ""
    };
  }
}
