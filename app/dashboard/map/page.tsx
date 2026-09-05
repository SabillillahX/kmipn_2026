import { and, desc, eq, inArray, or } from "drizzle-orm";
import { requireStaff } from "@/app/lib/dal";
import { getLocalReports } from "@/app/lib/local-reports";
import { db } from "@/src/database";
import { reports, tickets } from "@/src/database/schema";
import MapClient from "./map-client";
import ReportListClient from "./report-list-client";
import styles from "./map.module.css";

export default async function DashboardMapPage() {
  const user = await requireStaff();
  const isOpd = user.role === "OPD";

  let points: Array<{
    id: string;
    code: string;
    category: string;
    description: string;
    latitude: number;
    longitude: number;
    priority: string;
    status: string;
    contactPhone: string;
    createdAt: string;
  }> = [];

  const catLabelMap: Record<string, string> = {
    INFRASTRUKTUR: "Infrastruktur",
    KEBERSIHAN: "Lingkungan & kebersihan",
    PENERANGAN_JALAN: "Penerangan jalan",
    KESEHATAN_LINGKUNGAN: "Kesehatan lingkungan"
  };

  try {
    let dbRows;

    if (isOpd) {
      // For OPD role: Fetch ONLY active tickets/reports assigned to this OPD by Camat
      dbRows = await db
        .select({
          id: reports.id,
          category: reports.category,
          damageLevel: reports.damageLevel,
          description: reports.description,
          location: reports.location,
          ticketStatus: tickets.status,
          reporterPhone: reports.reporterPhone,
          createdAt: reports.createdAt,
        })
        .from(reports)
        .innerJoin(tickets, eq(reports.ticketId, tickets.id))
        .where(
          and(
            or(eq(tickets.assignedToUserId, user.id), eq(tickets.assignedToRole, "OPD")),
            inArray(tickets.status, ["TERVALIDASI", "DIPROSES_OPD", "SHARED_LOCK"])
          )
        )
        .orderBy(desc(reports.createdAt))
        .limit(100);
    } else {
      // For Camat / Admin role: Fetch overall district reports
      dbRows = await db
        .select({
          id: reports.id,
          category: reports.category,
          damageLevel: reports.damageLevel,
          description: reports.description,
          location: reports.location,
          ticketStatus: tickets.status,
          reporterPhone: reports.reporterPhone,
          createdAt: reports.createdAt,
        })
        .from(reports)
        .leftJoin(tickets, eq(reports.ticketId, tickets.id))
        .orderBy(desc(reports.createdAt))
        .limit(100);
    }

    points = dbRows.map((row) => {
      const lat = (row.location as any)?.y ?? 0;
      const lng = (row.location as any)?.x ?? 0;
      const priority = row.damageLevel === 1 ? "rendah" : row.damageLevel === 2 ? "sedang" : "tinggi";
      
      let status = "baru";
      if (row.ticketStatus === "DIPROSES_OPD" || row.ticketStatus === "SHARED_LOCK") {
        status = "diproses";
      } else if (row.ticketStatus === "SELESAI") {
        status = "selesai";
      } else if (row.ticketStatus === "TERVALIDASI") {
        status = "diverifikasi";
      }

      return {
        id: row.id,
        code: `REP-${row.id.slice(0, 6).toUpperCase()}`,
        category: catLabelMap[row.category] ?? row.category,
        description: row.description,
        latitude: lat,
        longitude: lng,
        priority,
        status,
        contactPhone: row.reporterPhone,
        createdAt: row.createdAt.toISOString()
      };
    });
  } catch {
    const local = await getLocalReports();

    let filteredLocal = local;
    if (isOpd) {
      // Local fallback for OPD: Only include active assigned items
      filteredLocal = local.filter(
        (r) => r.assignedTo && r.status !== "selesai" && r.status !== "ditolak" && r.status !== "baru"
      );
    }

    points = filteredLocal.slice(0, 100).map((report) => {
      let status = "baru";
      if (report.status === "diproses") status = "diproses";
      else if (report.status === "selesai") status = "selesai";
      else if (report.status === "diverifikasi") status = "diverifikasi";
      return {
        id: report.id,
        code: report.code,
        category: report.category,
        description: report.description,
        latitude: report.latitude,
        longitude: report.longitude,
        priority: report.priority,
        status,
        contactPhone: report.contactPhone,
        createdAt: report.createdAt
      };
    });
  }

  const activePoints = points.filter((p) => p.status.toLowerCase() !== "selesai");
  const backHref = isOpd ? "/dashboard/opd" : "/dashboard";

  return (
    <main className={styles.page}>
      <a className={styles.back} href={backHref}>← Kembali ke konsol dashboard</a>
      
      {isOpd ? (
        <>
          <h1>Peta Wilayah Penugasan {user.name}</h1>
          <p>
            Menampilkan titik penugasan aktif khusus instansi Anda dari Camat. Penugasan yang <b>Selesai</b> otomatis dibersihkan dari peta.
          </p>
        </>
      ) : (
        <>
          <h1>Peta Pemantauan Wilayah Kecamatan</h1>
          <p>
            Pemantauan distribusi aduan warga di wilayah kecamatan.
          </p>
        </>
      )}

      <MapClient points={activePoints} />
      <ReportListClient points={activePoints} />
    </main>
  );
}
