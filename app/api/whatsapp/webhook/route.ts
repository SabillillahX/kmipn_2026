import { NextResponse } from "next/server";
import { createLocalReport } from "@/app/lib/local-reports";
import { sendWhatsAppNotification } from "@/app/lib/whatsapp";
import { db } from "@/src/database";
import { reports } from "@/src/database/schema";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === (process.env.WHATSAPP_VERIFY_TOKEN || "splik_wa_token")) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ service: "SPLIK WhatsApp Webhook", status: "active" });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    // Extract sender & text from various WA API payload schemas (Fonnte, Wablas, WhatsApp Cloud API)
    const sender =
      body?.sender ||
      body?.from ||
      body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from ||
      "08123456789";

    const text =
      body?.message ||
      body?.text ||
      body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body ||
      "";

    const formattedSender = String(sender).startsWith("62")
      ? `0${String(sender).slice(2)}`
      : String(sender);

    // Auto categorize based on message content
    let category = "Infrastruktur";
    const lower = text.toLowerCase();
    if (lower.includes("sampah") || lower.includes("bersih") || lower.includes("bau") || lower.includes("pohon")) {
      category = "Lingkungan & kebersihan";
    } else if (lower.includes("lampu") || lower.includes("pju") || lower.includes("gelap")) {
      category = "Penerangan jalan";
    } else if (lower.includes("air") || lower.includes("got") || lower.includes("nyamuk") || lower.includes("saluran")) {
      category = "Kesehatan lingkungan";
    }

    const description = text.trim().length > 5 ? text.trim() : "Aduan warga dikirim via WhatsApp Hotline SPLIK.";
    let reportCode = "";

    try {
      const dbCatMap: Record<string, "INFRASTRUKTUR" | "KEBERSIHAN" | "PENERANGAN_JALAN" | "KESEHATAN_LINGKUNGAN"> = {
        "Infrastruktur": "INFRASTRUKTUR",
        "Lingkungan & kebersihan": "KEBERSIHAN",
        "Penerangan jalan": "PENERANGAN_JALAN",
        "Kesehatan lingkungan": "KESEHATAN_LINGKUNGAN",
      };

      const [newDbReport] = await db
        .insert(reports)
        .values({
          reporterPhone: formattedSender,
          description: description,
          category: dbCatMap[category] || "INFRASTRUKTUR",
          damageLevel: 2, // Medium priority by default
          location: { x: 110.42918, y: -7.0658 }, // Default Semarang / Sukamaju center
        })
        .returning();

      reportCode = `REP-${newDbReport.id.slice(0, 6).toUpperCase()}`;
    } catch {
      // Fallback to local report JSON storage
      const localReport = await createLocalReport({
        category: category,
        severity: "Sedang",
        description: description,
        contactPhone: formattedSender,
        latitude: -7.0658,
        longitude: 110.42918,
        priority: "sedang",
      });
      reportCode = localReport.code;
    }

    // Automatically send instantaneous WhatsApp response back to reporter with tracking link
    await sendWhatsAppNotification({
      to: formattedSender,
      type: "TERIMA",
      code: reportCode,
      category: category,
    });

    return NextResponse.json({
      success: true,
      reportCode,
      message: `Aduan WhatsApp dari ${formattedSender} berhasil dicatat dengan kode ${reportCode}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal memproses aduan WhatsApp." }, { status: 500 });
  }
}
