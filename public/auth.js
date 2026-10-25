const SESSION_KEY = "qipi:auth-session";

function storedSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
  catch { return null; }
}

export class QipiAuth {
  constructor() {
    this.enabled = false;
    this.url = "";
    this.key = "";
    this.session = storedSession();
    this.user = this.session?.user || null;
    this.recovery = false;
    this.refreshing = null;
  }

  save(session) {
    this.session = session;
    this.user = session?.user || null;
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }

  acceptSession(result) {
    if (!result?.access_token || !result?.refresh_token) return false;
    this.save({
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      expiresAt: Date.now() + Number(result.expires_in || 3600) * 1000,
      user: result.user || this.user
    });
    return true;
  }

  async initialize() {
    const response = await fetch("/api/config", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load sign-in settings");
    const config = await response.json();
    this.enabled = Boolean(config.authEnabled && config.supabaseUrl && config.publishableKey);
    if (!this.enabled) return;
    this.url = config.supabaseUrl.replace(/\/$/, "");
    this.key = config.publishableKey;
    const fragment = new URLSearchParams(location.hash.replace(/^#/, ""));
    if (fragment.has("access_token") && fragment.has("refresh_token")) {
      this.acceptSession({
        access_token: fragment.get("access_token"),
        refresh_token: fragment.get("refresh_token"),
        expires_in: fragment.get("expires_in"),
        user: null
      });
      this.recovery = fragment.get("type") === "recovery";
      history.replaceState(history.state, "", `${location.pathname}${location.search}`);
    }
    if (this.session) {
      try { await this.getUser(); }
      catch { this.save(null); }
    }
  }

  async request(path, { method = "GET", body, accessToken } = {}) {
    const response = await fetch(`${this.url}/auth/v1${path}`, {
      method,
      headers: {
        apikey: this.key,
        ...(body ? { "content-type": "application/json" } : {}),
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {})
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store"
    });
    const result = response.status === 204 ? {} : await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.msg || result.message || result.error_description || result.error || "Sign-in failed");
    return result;
  }

  async signUp({ email, password, displayName }) {
    const redirect = encodeURIComponent(`${location.origin}/`);
    const result = await this.request(`/signup?redirect_to=${redirect}`, {
      method: "POST", body: { email, password, data: { display_name: displayName } }
    });
    return this.acceptSession(result);
  }

  async signIn({ email, password }) {
    const result = await this.request("/token?grant_type=password", { method: "POST", body: { email, password } });
    if (!this.acceptSession(result)) throw new Error("Sign-in did not return a session");
    await this.getUser();
  }

  async refresh() {
    if (!this.session?.refreshToken) return null;
    if (!this.refreshing) {
      this.refreshing = this.request("/token?grant_type=refresh_token", {
        method: "POST", body: { refresh_token: this.session.refreshToken }
      }).then((result) => {
        if (!this.acceptSession(result)) throw new Error("Session refresh failed");
        return this.session.accessToken;
      }).catch((error) => { this.save(null); throw error; }).finally(() => { this.refreshing = null; });
    }
    return this.refreshing;
  }

  async accessToken() {
    if (!this.enabled || !this.session) return null;
    if (this.session.expiresAt - Date.now() < 60_000) return this.refresh();
    return this.session.accessToken;
  }

  async getUser() {
    const accessToken = await this.accessToken();
    if (!accessToken) return null;
    const user = await this.request("/user", { accessToken });
    this.save({ ...this.session, user });
    return user;
  }

  async recover(email) {
    const redirect = encodeURIComponent(`${location.origin}/`);
    await this.request(`/recover?redirect_to=${redirect}`, { method: "POST", body: { email } });
  }

  async updatePassword(password) {
    const accessToken = await this.accessToken();
    if (!accessToken) throw new Error("Sign in again to set a password");
    await this.request("/user", { method: "PUT", body: { password }, accessToken });
    this.recovery = false;
  }

  async updateProfile(displayName) {
    const accessToken = await this.accessToken();
    if (!accessToken) throw new Error("Sign in again to update your profile");
    const user = await this.request("/user", {
      method: "PUT", body: { data: { display_name: displayName } }, accessToken
    });
    this.save({ ...this.session, user });
    return user;
  }

  async signOut() {
    const accessToken = await this.accessToken().catch(() => null);
    this.save(null);
    if (accessToken) await this.request("/logout", { method: "POST", accessToken }).catch(() => {});
  }
}
