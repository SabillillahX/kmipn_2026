"use client";

import { useEffect, useState } from "react";
import { WhatsappLogo, CheckCircle, Bell, X } from "@phosphor-icons/react";

type WABroadcastEvent = {
  id: string;
  code: string;
  phone: string;
  status: string;
  message: string;
  timestamp: string;
};

export default function RealtimeWhatsAppListener({ code }: { code?: string }) {
  const [eventNotification, setEventNotification] = useState<WABroadcastEvent | null>(null);

  useEffect(() => {
    const query = code ? `?code=${encodeURIComponent(code)}` : "";
    const eventSource = new EventSource(`/api/realtime${query}`);

    eventSource.addEventListener("wa_broadcast", (e: MessageEvent) => {
      try {
        const data: WABroadcastEvent = JSON.parse(e.data);
        setEventNotification(data);

        // Auto-refresh page content when status changes
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } catch (err) {
        console.error("Failed to parse SSE WA Broadcast data:", err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [code]);

  if (!eventNotification) return null;

  const cleanPhone = eventNotification.phone.startsWith("62")
    ? `0${eventNotification.phone.slice(2)}`
    : eventNotification.phone;

  return (
    <div
      style={{
        position: "fixed",
        top: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 999999,
        width: "90%",
        maxWidth: "520px",
        background: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.25), 0 0 0 2px #25D366",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        animation: "slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: "#25D366",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <WhatsappLogo size={28} weight="fill" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "#128C7E", letterSpacing: "0.5px" }}>
            REAL-TIME WHATSAPP BROADCAST ⚡
          </span>
        </div>
        <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 750, color: "#0f172a" }}>
          Notifikasi Terkirim ke WA {cleanPhone}
        </h4>
        <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          Status [{eventNotification.code}]: <strong>{eventNotification.status}</strong>
        </p>
      </div>

      <button
        type="button"
        onClick={() => setEventNotification(null)}
        style={{
          background: "none",
          border: "none",
          color: "#94a3b8",
          cursor: "pointer",
          padding: "4px",
        }}
      >
        <X size={18} />
      </button>
    </div>
  );
}
