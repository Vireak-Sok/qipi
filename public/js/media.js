import { esc, initials } from "./core.js";
import { IMAGE_BUCKET, mediaIdFromPath } from "./shared.js";

const IMAGE_TYPES = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]]);
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function revealImage(image) {
  const source = image.currentSrc || image.src;
  try { await image.decode?.(); } catch {}
  if (image.isConnected && image.complete && image.naturalWidth && (image.currentSrc || image.src) === source) {
    image.classList.add("is-loaded");
  }
}

export async function prepareImageUpload(file, area, {
  decode = globalThis.createImageBitmap,
  createCanvas = () => document.createElement("canvas")
} = {}) {
  const maxEdge = area === "profile" ? 512 : 1600;
  const targetBytes = area === "profile" ? 300 * 1024 : 1500 * 1024;
  if (file.type === "image/webp" && file.size <= targetBytes) return file;
  if (typeof decode !== "function") return file;

  let bitmap;
  try {
    bitmap = await decode(file);
    const canvas = createCanvas();
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d", { alpha: true });
    if (!context || typeof canvas.toBlob !== "function") return file;
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    let smallest = null;
    for (const quality of [0.82, 0.68, 0.54]) {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
      if (!blob || blob.type !== "image/webp") break;
      if (!smallest || blob.size < smallest.size) smallest = blob;
      if (blob.size <= targetBytes) break;
    }
    if (smallest?.size > targetBytes && (canvas.width > 600 || canvas.height > 600)) {
      const width = canvas.width, height = canvas.height;
      canvas.width = Math.max(1, Math.round(width * 0.75));
      canvas.height = Math.max(1, Math.round(height * 0.75));
      canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.6));
      if (blob?.type === "image/webp" && blob.size < smallest.size) smallest = blob;
    }
    return smallest && (smallest.size < file.size || file.size > MAX_UPLOAD_BYTES) ? smallest : file;
  } catch {
    return file;
  } finally {
    bitmap?.close?.();
  }
}

export function createMediaClient({ auth, t }) {
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
    return url ? `${fallback}<img class="avatar-image" src="${esc(url)}" data-media-path="${esc(path)}" alt="" loading="lazy" decoding="async" /><span class="image-loading-indicator" aria-hidden="true"></span>` : fallback;
  }
  async function uploadImage(file, area) {
    if (!auth.user) throw new Error(t("imageSignInRequired"));
    if (!["profile", "trips"].includes(area)) throw new Error(t("imageUploadError"));
    if (!IMAGE_TYPES.has(file?.type)) throw new Error(t("imageTypeError"));
    if (!file.size || file.size > MAX_SOURCE_BYTES) throw new Error(t("imageSizeError"));
    const uploadFile = await prepareImageUpload(file, area);
    if (!uploadFile.size || uploadFile.size > MAX_UPLOAD_BYTES) throw new Error(t("imageUploadError"));
    const extension = IMAGE_TYPES.get(uploadFile.type);
    if (!extension) throw new Error(t("imageUploadError"));
    const accessToken = await auth.accessToken();
    if (!accessToken) throw new Error(t("imageSignInRequired"));
    const path = `users/${auth.user.id}/${area}/${crypto.randomUUID()}.${extension}`;
    const response = await fetch(`${auth.url}/storage/v1/object/${IMAGE_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`, {
      method: "POST",
      headers: {
        apikey: auth.key,
        authorization: `Bearer ${accessToken}`,
        "content-type": uploadFile.type,
        "cache-control": "31536000",
        "x-upsert": "false"
      },
      body: uploadFile
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.message || result.error || t("imageUploadError"));
    }
    return path;
  }

  return { storagePublicUrl, appMediaUrl, avatarContents, uploadImage };
}
