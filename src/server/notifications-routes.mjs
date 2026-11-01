import { HttpError, body, createResponder } from "./http.mjs";

export async function handleNotificationsRoutes({ req, res, path, method, store, userFor }) {
  if (!path.startsWith("/api/notifications")) return false;
  const respond = createResponder(res);
  const user = await userFor(req, { required: true });
  if (!user) throw new HttpError(401, "Sign in to view notifications");

  if (path === "/api/notifications" && method === "GET") {
    const data = await store.read();
    const userNotifications = (data.notifications || []).filter((item) => item.recipientId === user.id);
    const notifications = userNotifications
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 50);
    return respond(200, {
      notifications,
      unreadCount: userNotifications.filter((item) => !item.readAt).length
    });
  }

  if (path === "/api/notifications/read-all" && method === "POST") {
    const readAt = new Date().toISOString();
    await store.mutate((data) => {
      data.notifications ||= [];
      for (const item of data.notifications) {
        if (item.recipientId === user.id && !item.readAt) item.readAt = readAt;
      }
    });
    return respond(200, { readAt });
  }

  const notificationMatch = /^\/api\/notifications\/([0-9a-f-]{36})$/.exec(path);
  if (notificationMatch && method === "PATCH") {
    const input = await body(req);
    if (typeof input.read !== "boolean") throw new HttpError(400, "read must be true or false");
    const readAt = input.read ? new Date().toISOString() : "";
    await store.mutate((data) => {
      const notification = (data.notifications || []).find((item) => item.id === notificationMatch[1] && item.recipientId === user.id);
      if (!notification) throw new HttpError(404, "Notification not found");
      notification.readAt = readAt;
    });
    return respond(200, { readAt });
  }

  throw new HttpError(404, "Notifications not found");
}
