import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/app/lib/dal";
import { getLocalReports } from "@/app/lib/local-reports";
import { db } from "@/src/database";
import { reports, tickets } from "@/src/database/schema";
import MapClient from "./map-client";
import styles from "./map.module.css";

export default async function DashboardMapPage() {
  await requireAdmin();
  let points: Array<{
    id: string;
    code: string;
    category: string;
    description: string;
    latitude: number;
    longitude: number;
    priority: string;
    status: string;
  }> = [];

  try {
    const dbRows = await db
      .select({
        id: reports.id,
        category: reports.category,
        damageLevel: reports.damageLevel,
        description: reports.description,
        location: reports.location,
        ticketStatus: tickets.status
      })
      .from(reports)
      .leftJoin(tickets, eq(reports.ticketId, tickets.id))
      .orderBy(desc(reports.createdAt))
      .limit(50);

    const catLabelMap: Record<string, string> = {
      INFRASTRUKTUR: "Infrastruktur",
      KEBERSIHAN: "Lingkungan & kebersihan",
      PENERANGAN_JALAN: "Penerangan jalan",
      KESEHATAN_LINGKUNGAN: "Kesehatan lingkungan"
    };

    points = dbRows.map((row) => {
      const lat = (row.location as any)?.y ?? 0;
      const lng = (row.location as any)?.x ?? 0;
      const priority = row.damageLevel === 1 ? "rendah" : row.damageLevel === 2 ? "sedang" : "tinggi";
      
      let status = "baru";
      if (row.ticketStatus === "DIPROSES_OPD" || row.ticketStatus === "SHARED_LOCK") {
        status = "diproses";
      } else if (row.ticketStatus === "SELESAI") {
        status = "selesai";
      }

      return {
        id: row.id,
        code: `REP-${row.id.slice(0, 6).toUpperCase()}`,
        category: catLabelMap[row.category] ?? row.category,
        description: row.description,
        latitude: lat,
        longitude: lng,
        priority,
        status
      };
    });
  } catch {
    const local = await getLocalReports();
    points = local.slice(0, 50).map((report) => {
      let status = "baru";
      if (report.status === "diproses") status = "diproses";
      else if (report.status === "selesai") status = "selesai";
      return {
        id: report.id,
        code: report.code,
        category: report.category,
        description: report.description,
        latitude: report.latitude,
        longitude: report.longitude,
        priority: report.priority,
        status
      };
    });
  }

  return (
    <main className={styles.page}>
      <a className={styles.back} href="/dashboard">← Kembali ke dashboard</a>
      <h1>Peta laporan warga</h1>
      <p>{points.length} titik laporan ditampilkan. Marker memakai koordinat geografis asli dan dapat diklik untuk membuka penanganan.</p>
      <MapClient points={points} />
      <section className={styles.list}>
        {points.map((item, index) => (
          <a key={item.id} href={`/dashboard/laporan/${item.code}`}>
            <span><b>{index + 1}. {item.code}</b> · {item.category}</span>
            <em data-priority={item.priority}>{item.status} →</em>
          </a>
        ))}
      </section>
    </main>
  );
}
