import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { HttpError } from "./http.mjs";

const token = () => randomBytes(24).toString("base64url");
const digest = (value) => createHash("sha256").update(value).digest("hex");

function sameSecret(provided, expectedHash) {
  if (typeof provided !== "string" || !provided || !expectedHash) return false;
  const received = Buffer.from(digest(provided), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

function owner(req, trip, user) {
  if (trip.hostUserId) {
    if (user?.id === trip.hostUserId) return;
    throw new HttpError(403, "This trip belongs to another host");
  }
  if (!sameSecret(req.headers["x-host-token"], trip.ownerTokenHash)) {
    throw new HttpError(403, "This trip belongs to another host");
  }
}

function admin(req, adminToken) {
  if (!adminToken) throw new HttpError(503, "Admin access is not configured");
  if (typeof req.headers["x-admin-token"] !== "string" ||
      !sameSecret(req.headers["x-admin-token"], digest(adminToken))) {
    throw new HttpError(403, "Admin token is invalid");
  }
}

export { token, digest, sameSecret, owner, admin };
