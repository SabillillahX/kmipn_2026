import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireStaff } from "@/app/lib/dal";
import { getLocalReport } from "@/app/lib/local-reports";
import { formatWhatsAppMessage, sendWhatsAppNotification, WhatsAppMessageType } from "@/app/lib/whatsapp";
import { db } from "@/src/database";
import { reports, tickets } from "@/src/database/schema";

export async function POST(request: Request) {
  const user = await requireStaff();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const customNote = typeof body?.customNote === "string" ? body.customNote.trim() : "";

  if (!code) {
    return NextResponse.json({ error: "Kode laporan/tiket wajib diisi." }, { status: 400 });
  }

  let reporterPhones: string[] = [];
  let currentStatus = "baru";
  let category = "Aduan Warga";
  let assignedTo = "Petugas OPD Pelaksana";

  try {
    if (code.toUpperCase().startsWith("TK-")) {
      const prefix = code.slice(3).toLowerCase();
      const [ticket] = await db
        .select()
        .from(tickets)
        .where(sql`cast(${tickets.id} as text) like ${prefix + "%"}`)
        .limit(1);

      if (ticket) {
        currentStatus = ticket.status;
        category = ticket.category;
        const subReports = await db
          .select({ phone: reports.reporterPhone })
          .from(reports)
          .where(eq(reports.ticketId, ticket.id));

        reporterPhones = subReports.map((r) => r.phone).filter(Boolean);
      }
    } else if (code.toUpperCase().startsWith("REP-")) {
      const prefix = code.slice(4).toLowerCase();
      const [rep] = await db
        .select()
        .from(reports)
        .where(sql`cast(${reports.id} as text) like ${prefix + "%"}`)
        .limit(1);

      if (rep) {
        category = rep.category;
        if (rep.reporterPhone) reporterPhones.push(rep.reporterPhone);

        if (rep.ticketId) {
          const [t] = await db.select().from(tickets).where(eq(tickets.id, rep.ticketId)).limit(1);
          if (t) currentStatus = t.status;
        }
      }
    }
  } catch {}

  // Local fallback
  if (reporterPhones.length === 0) {
    const local = await getLocalReport(code);
    if (local) {
      if (local.contactPhone) reporterPhones.push(local.contactPhone);
      currentStatus = local.status;
      category = local.category;
      if (local.assignedTo) assignedTo = local.assignedTo;
    }
  }

  if (reporterPhones.length === 0) {
    return NextResponse.json({ error: "Tidak ditemukan nomor telepon pelapor untuk laporan ini." }, { status: 404 });
  }

  // Deduplicate phone numbers
  const uniquePhones = Array.from(new Set(reporterPhones));

  // Determine WhatsApp message type based on current report/ticket status
  let waMessageType: WhatsAppMessageType = "TERIMA";
  if (currentStatus === "TERVALIDASI" || currentStatus === "diverifikasi") {
    waMessageType = "DISPOSISI";
  } else if (currentStatus === "DIPROSES_OPD" || currentStatus === "SHARED_LOCK" || currentStatus === "diproses") {
    waMessageType = "DIPROSES";
  } else if (currentStatus === "SELESAI" || currentStatus === "selesai") {
    waMessageType = "SELESAI";
  }

  const trackingUrl = `http://localhost:3000/status/${encodeURIComponent(code)}`;

  const directWaUrls: Array<{ phone: string; waUrl: string; message: string }> = [];

  for (const phone of uniquePhones) {
    const messageText = formatWhatsAppMessage({
      to: phone,
      type: waMessageType,
      code: code,
      category: category,
      assignedTo: assignedTo,
      note: customNote || undefined,
      trackingUrl: trackingUrl,
    });

    const cleanPhone = phone.startsWith("0") ? `62${phone.slice(1)}` : phone.replace(/\D/g, "");
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

    directWaUrls.push({
      phone: phone,
      waUrl: waUrl,
      message: messageText,
    });

    // Dispatch automated background notification
    await sendWhatsAppNotification({
      to: phone,
      type: waMessageType,
      code: code,
      category: category,
      assignedTo: assignedTo,
      note: customNote || undefined,
      trackingUrl: trackingUrl,
    });
  }

  return NextResponse.json({
    success: true,
    code: code,
    count: uniquePhones.length,
    recipients: uniquePhones,
    directWaUrls: directWaUrls,
    message: `Broadcast WhatsApp berhasil dikirim ke ${uniquePhones.length} nomor pelapor.`,
  });
}
