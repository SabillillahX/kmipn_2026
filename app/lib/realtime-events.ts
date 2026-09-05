import { EventEmitter } from "events";

declare global {
  // eslint-disable-next-line no-var
  var __realtimeEventHub: EventEmitter | undefined;
}

// Ensure a single global event emitter instance across Next.js reloads
export const eventHub: EventEmitter =
  globalThis.__realtimeEventHub || (globalThis.__realtimeEventHub = new EventEmitter());

eventHub.setMaxListeners(200);

export type RealtimeWABroadcastEvent = {
  id: string;
  code: string;
  phone: string;
  status: string;
  message: string;
  timestamp: string;
};

export function broadcastRealtimeWhatsAppStatus(data: Omit<RealtimeWABroadcastEvent, "id" | "timestamp">) {
  const payload: RealtimeWABroadcastEvent = {
    ...data,
    id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  console.log(`[REALTIME BROADCAST ⚡] Emitting WA event for code: ${data.code} -> Phone: ${data.phone}`);
  eventHub.emit("wa_broadcast", payload);
  return payload;
}
