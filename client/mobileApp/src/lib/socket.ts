import { io, type Socket } from "socket.io-client";

import { SOCKET_URL } from "./api-client";
import { readAccessToken } from "./token-store";

export type SocketEvent =
  | "message:new"
  | "notification:new"
  | "typing"
  | "connect"
  | "disconnect";

type Listener = (payload: unknown) => void;

let socket: Socket | null = null;
const listeners = new Map<SocketEvent, Set<Listener>>();

function emitLocal(event: SocketEvent, payload?: unknown) {
  for (const listener of listeners.get(event) ?? []) listener(payload);
}

/** Subscribes to a socket event. Returns an unsubscribe function. */
export function onSocket(event: SocketEvent, listener: Listener) {
  let set = listeners.get(event);
  if (!set) {
    set = new Set();
    listeners.set(event, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
    if (set!.size === 0) listeners.delete(event);
  };
}

/** Opens (or reuses) the authenticated Socket.IO connection. Realtime is
 *  best effort: every screen also refetches over REST, so a failed handshake
 *  degrades to polling rather than breaking messaging. */
export async function connectSocket() {
  if (socket?.connected) return socket;
  if (socket) return socket;

  const token = await readAccessToken();
  if (!token) return null;

  socket = io(SOCKET_URL, {
    auth: { token },
    // React Native has no XHR long-polling support, so force the websocket
    // transport — otherwise the handshake hangs until it falls back.
    transports: ["websocket"],
    reconnectionAttempts: 8,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => emitLocal("connect"));
  socket.on("disconnect", () => emitLocal("disconnect"));
  socket.on("message:new", (payload) => emitLocal("message:new", payload));
  socket.on("notification:new", (payload) =>
    emitLocal("notification:new", payload),
  );
  socket.on("typing", (payload) => emitLocal("typing", payload));

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function joinConversation(conversationId: string) {
  socket?.emit("conversation:join", { conversationId });
}

export function leaveConversation(conversationId: string) {
  socket?.emit("conversation:leave", { conversationId });
}

export function sendTyping(conversationId: string) {
  socket?.emit("typing", { conversationId });
}

export function getSocket() {
  return socket;
}
