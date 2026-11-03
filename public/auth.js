import { profileMetadata } from "./js/shared.js";

const SESSION_KEY = "qipi:auth-session";

function storedSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
  catch { return null; }
}

export function normalizePhoneNumber(value) {
  let phone = String(value || "").trim().replace(/[\s().-]/g, "");
  if (phone.startsWith("00")) phone = `+${phone.slice(2)}`;
  else if (phone.startsWith("0")) phone = `+855${phone.slice(1)}`;
  else if (/^855\d+$/.test(phone)) phone = `+${phone}`;
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : "";
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

  async signUp({ email, password, displayName, homeBase = "", travelStyles = [], bio = "" }) {
    const redirect = encodeURIComponent(`${location.origin}/`);
    const result = await this.request(`/signup?redirect_to=${redirect}`, {
      method: "POST", body: { email, password, data: profileMetadata({ displayName, homeBase, travelStyles, bio }) }
    });
    return this.acceptSession(result);
  }

  async signUpWithPhone({ phone, password, displayName }) {
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) throw new Error("Enter a valid phone number in international format.");
    const result = await this.request("/signup", {
      method: "POST",
      body: { phone: normalizedPhone, password, data: profileMetadata({ displayName }) }
    });
    const signedIn = this.acceptSession(result);
    if (signedIn) await this.getUser();
    return { signedIn, phone: normalizedPhone };
  }

  async verifyPhoneSignup(phone, token) {
    const normalizedPhone = normalizePhoneNumber(phone);
    const result = await this.request("/verify", {
      method: "POST", body: { phone: normalizedPhone, token: String(token).trim(), type: "sms" }
    });
    if (!this.acceptSession(result)) throw new Error("Phone verification did not return a session");
    await this.getUser();
  }

  async requestPhoneOtp(phone, { createUser = false } = {}) {
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!normalizedPhone) throw new Error("Enter a valid phone number with country code.");
    await this.request("/otp", { method: "POST", body: { phone: normalizedPhone, create_user: createUser } });
    return normalizedPhone;
  }

  async verifyPhoneOtp(phone, token) {
    const normalizedPhone = normalizePhoneNumber(phone);
    const result = await this.request("/verify", {
      method: "POST", body: { phone: normalizedPhone, token: String(token).trim(), type: "sms" }
    });
    if (!this.acceptSession(result)) throw new Error("Phone verification did not return a session");
    await this.getUser();
  }

  async resendPhoneSignup(phone) {
    const normalizedPhone = normalizePhoneNumber(phone);
    await this.request("/resend", { method: "POST", body: { phone: normalizedPhone, type: "sms" } });
  }

  async signIn({ email, identifier, password }) {
    const login = String(identifier || email || "").trim();
    const credentials = login.includes("@")
      ? { email: login.toLowerCase(), password }
      : { phone: normalizePhoneNumber(login), password };
    if (credentials.phone === "") throw new Error("Enter a valid phone number with country code, or sign in with your email.");
    const result = await this.request("/token?grant_type=password", { method: "POST", body: credentials });
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

  async updateMetadata(data, signInMessage = "Sign in again to update your profile") {
    const accessToken = await this.accessToken();
    if (!accessToken) throw new Error(signInMessage);
    const user = await this.request("/user", {
      method: "PUT", body: { data: { ...this.user?.user_metadata, ...data } }, accessToken
    });
    this.save({ ...this.session, user });
    return user;
  }

  async updateProfile(values) {
    return this.updateMetadata(profileMetadata(values));
  }

  async updateAvatar(avatarPath) {
    return this.updateMetadata({ avatar_path: avatarPath }, "Sign in again to update your profile photo");
  }

  async signOut() {
    const accessToken = await this.accessToken().catch(() => null);
    this.save(null);
    if (accessToken) await this.request("/logout", { method: "POST", accessToken }).catch(() => {});
  }
}
