export function profileUsername(name, id) {
  const base = String(name || "traveler").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30) || "traveler";
  const suffix = String(id || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(-10);
  return (base + (suffix ? "-" + suffix : "")).slice(0, 64);
}

export function todayInCambodia() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Phnom_Penh", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date());
  const part = (name) => parts.find((item) => item.type === name).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}


export const IMAGE_BUCKET = "qipi-images";

export function mediaIdFromPath(path) {
  const filename = String(path || "").split("/").pop() || "";
  const match = /^([0-9a-f-]{36})\.(?:jpg|png|webp)$/i.exec(filename);
  return match?.[1]?.toLowerCase() || "";
}

export const TRAVEL_OPTIONS = [
  ["solo", "travelSolo"], ["backpacking", "travelBackpacking"],
  ["adventure", "travelAdventure"], ["motor-trips", "travelMotorTrips"],
  ["road-trips", "travelRoadTrips"], ["group-trips", "travelGroupTrips"]
];
export const TRAVEL_STYLES = TRAVEL_OPTIONS.map(([value]) => value);

export function profileMetadata({ displayName, homeBase = "", travelStyles = [], bio = "" }) {
  return { display_name: displayName, home_base: homeBase, travel_styles: travelStyles, bio };
}
