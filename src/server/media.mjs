import { getQipiStore } from "../runtime-store.mjs";
import { IMAGE_BUCKET, mediaIdFromPath } from "../../public/js/shared.js";

export function createMediaHandler({
  getStore = getQipiStore,
  getSupabaseUrl = () => process.env.SUPABASE_URL,
  fetchImpl = fetch
} = {}) {
  return async function handle(request, { params }) {
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id || "")) return new Response("Not found", { status: 404 });

    try {
      const data = await getStore().read();
      const publicPaths = [
        ...(data.trips || []).filter((trip) => !trip.hidden).flatMap((trip) => [trip.mediaPath, trip.hostAvatarPath]),
        ...(data.demoUsers || []).map((profile) => profile.avatarPath),
        ...(data.profiles || []).map((profile) => profile.avatarPath),
        ...(data.media || []).map((media) => media.path)
      ].filter(Boolean);
      const path = publicPaths.find((candidate) => mediaIdFromPath(candidate) === id.toLowerCase());
      if (!path) return new Response("Not found", { status: 404 });

      const base = getSupabaseUrl();
      if (!base) return new Response("Media storage is not configured", { status: 503 });
      const encodedPath = path.split("/").map(encodeURIComponent).join("/");
      const remote = await fetchImpl(new URL("/storage/v1/object/public/" + IMAGE_BUCKET + "/" + encodedPath, base), {
        cache: "force-cache", signal: AbortSignal.timeout(10000)
      });
      if (!remote.ok || !remote.body) return new Response("Not found", { status: 404 });

      const extension = path.split(".").pop().toLowerCase();
      const contentType = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" }[extension];
      return new Response(request.method === "HEAD" ? null : remote.body, {
        status: 200,
        headers: {
          "content-type": contentType,
          "cache-control": "public, max-age=31536000, immutable",
          "content-disposition": "inline",
          "x-content-type-options": "nosniff"
        }
      });
    } catch {
      return new Response("Media is unavailable", { status: 503 });
    }
  };
}
