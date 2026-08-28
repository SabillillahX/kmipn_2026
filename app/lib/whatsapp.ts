import "server-only";

export type WhatsAppMessageType =
  | "TERIMA"
  | "DISPOSISI"
  | "DIPROSES"
  | "SELESAI";

export type WhatsAppPayload = {
  to: string;
  type: WhatsAppMessageType;
  code: string;
  category?: string;
  assignedTo?: string;
  note?: string;
  trackingUrl?: string;
};

/**
 * Formats official WhatsApp notification message text
 */
export function formatWhatsAppMessage(payload: WhatsAppPayload): string {
  const cleanPhone = payload.to.replace(/\D/g, "");
  const trackingLink = payload.trackingUrl || `http://localhost:3000/status/${encodeURIComponent(payload.code)}`;

  switch (payload.type) {
    case "TERIMA":
      return `🏛️ *SISTEM SPLIK KECAMATAN* 🏛️\n\n` +
        `Yth. Pelapor,\n` +
        `Laporan Anda telah berhasil diterima oleh sistem SPLIK dengan Kode Tracking: *${payload.code}*.\n\n` +
        `📌 *Kategori:* ${payload.category || "Aduan Warga"}\n` +
        `STATUS: 🟡 *Laporan Diterima*\n\n` +
        `Lacak status terkini laporan Anda kapan saja di:\n🔗 ${trackingLink}\n\n` +
        `_Terima kasih atas kepedulian Anda membangun wilayah kita._`;

    case "DISPOSISI":
      return `🏛️ *SISTEM SPLIK KECAMATAN* 🏛️\n\n` +
        `Yth. Pelapor,\n` +
        `Laporan Anda (*${payload.code}*) telah diverifikasi oleh Camat dan didisposisikan ke instansi teknis:\n` +
        `🏢 *Pelaksana:* ${payload.assignedTo || "OPD Pelaksana"}\n` +
        `📝 *Instruksi:* ${payload.note || "Persiapan tim teknis ke lokasi."}\n\n` +
        `STATUS: 🔵 *Didisposisikan ke OPD*\n\n` +
        `Lacak update berkala di:\n🔗 ${trackingLink}`;

    case "DIPROSES":
      return `🏛️ *SISTEM SPLIK KECAMATAN* 🏛️\n\n` +
        `Yth. Pelapor,\n` +
        `Tim lapangan dari *${payload.assignedTo || "OPD Pelaksana"}* saat ini sedang berada di lokasi untuk menangani laporan Anda (*${payload.code}*).\n\n` +
        `STATUS: 🟠 *Dalam Penanganan Lapangan*\n\n` +
        `Lacak detail di:\n🔗 ${trackingLink}`;

    case "SELESAI":
      return `🏛️ *SISTEM SPLIK KECAMATAN* 🏛️\n\n` +
        `*PENANGANAN LAPORAN SELESAI*\n\n` +
        `Yth. Pelapor,\n` +
        `Laporan Anda (*${payload.code}*) telah *TUNTAS SELESAI* ditangani oleh *${payload.assignedTo || "OPD Pelaksana"}*.\n\n` +
        `📝 *Catatan Hasil:* ${payload.note || "Penanganan lapangan selesai dan bukti foto telah diunggah."}\n` +
        `STATUS: 🟢 *Selesai Ditangani*\n\n` +
        `📸 *Lihat Foto Bukti Penyelesaian Lapangan:* \n🔗 ${trackingLink}\n\n` +
        `_Terima kasih atas partisipasi aktif Anda!_`;

    default:
      return `Update status laporan SPLIK [${payload.code}]: ${trackingLink}`;
  }
}

import { broadcastRealtimeWhatsAppStatus } from "./realtime-events";

/**
 * Sends automated WhatsApp notification message to citizen's phone number
 */
export async function sendWhatsAppNotification(payload: WhatsAppPayload): Promise<{ success: boolean; log: string }> {
  const messageText = formatWhatsAppMessage(payload);
  const formattedPhone = payload.to.startsWith("0") ? `62${payload.to.slice(1)}` : payload.to.replace(/\D/g, "");

  console.log(`[WHATSAPP DISPATCH] 📲 Sending WhatsApp to ${formattedPhone} (${payload.type}):`);
  console.log("--------------------------------------------------");
  console.log(messageText);
  console.log("--------------------------------------------------");

  // Trigger real-time WebSocket/SSE broadcast event
  broadcastRealtimeWhatsAppStatus({
    code: payload.code,
    phone: formattedPhone,
    status: payload.type,
    message: messageText,
  });

  // Integration with Fonnte WhatsApp Gateway API
  const apiToken = (process.env.FONNTE_TOKEN || process.env.WHATSAPP_API_TOKEN || "").trim();
  if (apiToken) {
    try {
      const formData = new URLSearchParams();
      formData.append("target", formattedPhone);
      formData.append("message", messageText);
      formData.append("countryCode", "62");

      const res = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          Authorization: apiToken,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const responseText = await res.text();
      console.log(`[FONNTE API RESPONSE] Status: ${res.status} | Body: ${responseText}`);

      if (res.ok) {
        return { success: true, log: `WhatsApp sent via Fonnte Gateway to ${formattedPhone}` };
      }
    } catch (e) {
      console.error("[WHATSAPP GATEWAY ERROR]", e);
    }
  }

  return { success: true, log: `WhatsApp simulated successfully for ${formattedPhone}` };
}
