import { eventHub, RealtimeWABroadcastEvent } from "@/app/lib/realtime-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filterCode = url.searchParams.get("code")?.toUpperCase();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({ message: "Realtime WhatsApp Broadcast Stream Connected", code: filterCode || "ALL" })}\n\n`
        )
      );

      const listener = (eventData: RealtimeWABroadcastEvent) => {
        if (!filterCode || eventData.code.toUpperCase() === filterCode || filterCode.startsWith(eventData.code.substring(0, 6).toUpperCase())) {
          controller.enqueue(
            encoder.encode(`event: wa_broadcast\ndata: ${JSON.stringify(eventData)}\n\n`)
          );
        }
      };

      eventHub.on("wa_broadcast", listener);

      // Heartbeat interval every 15 seconds
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        eventHub.off("wa_broadcast", listener);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
