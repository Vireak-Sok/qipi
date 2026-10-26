import { HttpError } from "./http.mjs";
import { todayInCambodia } from "../../public/js/shared.js";

function text(value, field, min, max) {
  if (typeof value !== "string") throw new HttpError(400, `${field} is required`);
  const clean = value.trim().replace(/\s+/g, " ");
  if (clean.length < min || clean.length > max) {
    throw new HttpError(400, `${field} must be ${min}–${max} characters`);
  }
  return clean;
}

function optionalText(value, field, max) {
  if (value == null || value === "") return "";
  return text(value, field, 0, max);
}

function choice(value, field, allowed) {
  if (!allowed.includes(value)) throw new HttpError(400, `${field} is invalid`);
  return value;
}

function dateField(value, field, { future = false, past = false } = {}) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new HttpError(400, `${field} must be YYYY-MM-DD`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new HttpError(400, `${field} is invalid`);
  }
  const today = todayInCambodia();
  if (future && value < today) throw new HttpError(400, `${field} must be today or later`);
  if (past && value > today) throw new HttpError(400, `${field} cannot be in the future`);
  return value;
}

function timeField(value) {
  if (typeof value !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new HttpError(400, "departureTime must be HH:MM");
  }
  return value;
}

export { text, optionalText, choice, dateField, timeField };
