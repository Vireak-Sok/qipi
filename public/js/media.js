import { esc, initials } from "./core.js";
import { IMAGE_BUCKET, mediaIdFromPath } from "./shared.js";

export function createMediaClient({ auth, t }) {
  const IMAGE_TYPES = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  function storagePublicUrl(path) {
    if (!path || !auth.url) return "";
    const encodedPath = path.split("/").map((part) => encodeURIComponent(part)).join("/");
    return `${auth.url}/storage/v1/object/public/${IMAGE_BUCKET}/${encodedPath}`;
  }
  function appMediaUrl(path) {
    const id = mediaIdFromPath(path);
    return id ? "/media/" + id : storagePublicUrl(path);
  }
  function avatarContents(name, path = "") {
    const url = appMediaUrl(path);
    const fallback = `<span class="avatar-fallback">${esc(initials(name))}</span>`;
    return url ? `${fallback}<img class="avatar-image" src="${esc(url)}" data-media-path="${esc(path)}" alt="" loading="lazy" decoding="async" />` : fallback;
  }
  async function uploadImage(file, area) {
    if (!auth.user) throw new Error(t("imageSignInRequired"));
    if (!["profile", "trips"].includes(area)) throw new Error(t("imageUploadError"));
    const extension = IMAGE_TYPES.get(file?.type);
    if (!extension) throw new Error(t("imageTypeError"));
    if (!file.size || file.size > MAX_IMAGE_BYTES) throw new Error(t("imageSizeError"));
    const accessToken = await auth.accessToken();
    if (!accessToken) throw new Error(t("imageSignInRequired"));
    const path = `users/${auth.user.id}/${area}/${crypto.randomUUID()}.${extension}`;
    const response = await fetch(`${auth.url}/storage/v1/object/${IMAGE_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`, {
      method: "POST",
      headers: {
        apikey: auth.key,
        authorization: `Bearer ${accessToken}`,
        "content-type": file.type,
        "cache-control": "31536000",
        "x-upsert": "false"
      },
      body: file
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.message || result.error || t("imageUploadError"));
    }
    return path;
  }

  return { storagePublicUrl, appMediaUrl, avatarContents, uploadImage };
}
