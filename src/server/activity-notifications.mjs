import { randomUUID } from "node:crypto";
import { profileUsername } from "../../public/js/shared.js";

export function notificationActor(data, user) {
  if (!user?.id) return null;
  const profile = (data.profiles || []).find((item) => item.id === user.id);
  const displayName = profile?.displayName || user.displayName || "Traveler";
  return {
    id: user.id,
    displayName,
    username: profile?.username || profileUsername(displayName, user.id),
    avatarPath: profile?.avatarPath || user.avatarPath || ""
  };
}

export function addActivityNotification(data, { recipientId, actor, type, targetId, targetLabel = "" }) {
  if (!recipientId || !actor?.id || recipientId === actor.id) return null;
  data.notifications ||= [];
  const notification = {
    id: randomUUID(),
    recipientId,
    actor,
    type,
    targetId: String(targetId || ""),
    targetLabel: String(targetLabel || "").slice(0, 120),
    createdAt: new Date().toISOString(),
    readAt: ""
  };
  data.notifications.unshift(notification);
  if (data.notifications.length > 3000) data.notifications.length = 3000;
  return notification;
}
