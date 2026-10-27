import { HttpError, body, createResponder } from "./http.mjs";
import { text } from "./validation.mjs";
import { profileUsername } from "../../public/js/shared.js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isMember = (conversation, userId) => conversation && (conversation.user_low === userId || conversation.user_high === userId);
function publicProfile(data, id) {
  const stored = (data.profiles || []).find((candidate) => candidate.id === id);
  if (stored) return stored;
  const trip = (data.trips || []).find((item) => item.hostUserId === id && !item.hidden);
  return trip ? { id, displayName: trip.hostName, avatarPath: trip.hostAvatarPath || "", username: profileUsername(trip.hostName, id) } : null;
}

export async function handleMessagesRoutes({ req, res, path, method, store, userFor, chat }) {
  if (!path.startsWith("/api/messages") && !path.startsWith("/api/conversations")) return false;
  const respond = createResponder(res);
  const user = await userFor(req, { required: true });
  if (!user) throw new HttpError(401, "Sign in to use messages");
  if (!chat) throw new HttpError(503, "Messaging is not configured yet");

  if (path === "/api/conversations" && method === "GET") {
    const [conversations, data] = await Promise.all([chat.conversationsFor(user.id), store.read()]);
    const result = await Promise.all(conversations.map(async (conversation) => {
      const otherId = conversation.user_low === user.id ? conversation.user_high : conversation.user_low;
      const profile = publicProfile(data, otherId);
      if (!profile) return null;
      const [lastMessage, unreadCount] = await Promise.all([
        chat.latestMessage(conversation.id),
        chat.unreadCount(conversation.id, user.id)
      ]);
      return {
        id: conversation.id,
        updatedAt: conversation.updated_at,
        profile: { id: profile.id, username: profile.username, displayName: profile.displayName, avatarPath: profile.avatarPath || "" },
        lastMessage,
        unreadCount
      };
    }));
    return respond(200, { conversations: result.filter(Boolean) });
  }

  if (path === "/api/conversations" && method === "POST") {
    const input = await body(req);
    const targetId = text(input.targetId, "targetId", 36, 36);
    if (!uuidPattern.test(targetId)) throw new HttpError(400, "Invalid traveler");
    if (targetId === user.id) throw new HttpError(400, "You cannot message yourself");
    const data = await store.read();
    const profile = publicProfile(data, targetId);
    if (!profile) throw new HttpError(404, "Traveler not found");
    const conversation = await chat.findOrCreateConversation(user.id, targetId);
    return respond(201, { id: conversation.id });
  }

  const conversationMatch = /^\/api\/messages\/([0-9a-f-]{36})$/.exec(path);
  if (!conversationMatch || !uuidPattern.test(conversationMatch[1])) throw new HttpError(404, "Messages not found");
  const conversationId = conversationMatch[1];
  const conversation = await chat.findConversation(conversationId);
  if (!isMember(conversation, user.id)) throw new HttpError(404, "Conversation not found");

  if (method === "GET") {
    const before = new URL(req.url || "/", "http://localhost").searchParams.get("before") || "";
    if (before && (!Number.isFinite(Date.parse(before)) || before.length > 40)) throw new HttpError(400, "Invalid message cursor");
    const [messages, data] = await Promise.all([
      chat.messages(conversationId, { before }),
      store.read(),
      chat.markRead(conversationId, user.id)
    ]);
    const otherId = conversation.user_low === user.id ? conversation.user_high : conversation.user_low;
    const profile = publicProfile(data, otherId);
    return respond(200, {
      messages: messages.reverse(),
      profile: profile ? { id: profile.id, username: profile.username, displayName: profile.displayName, avatarPath: profile.avatarPath || "" } : null,
      hasMore: messages.length === 50
    });
  }

  if (method === "POST") {
    const input = await body(req);
    const message = text(input.body, "body", 1, 2000).trim();
    if (!message) throw new HttpError(400, "Write a message first");
    const result = await chat.sendMessage(conversationId, user.id, message);
    return respond(201, { message: result });
  }
  return false;
}
