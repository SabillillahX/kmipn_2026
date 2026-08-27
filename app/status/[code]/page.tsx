import Link from "next/link";
import { getLocalReport } from "@/app/lib/local-reports";
import styles from "../status.module.css";
import { db } from "@/src/database";
import { tickets, reports, auditLogs, users } from "@/src/database/schema";
import { eq, sql, desc } from "drizzle-orm";
import StatusMapClient from "./status-map-client";

type SubReport = {
  id: string;
  code: string;
  reporterPhone: string;
  description: string;
  damageLevel: number;
  createdAt: string;
  latitude: number;
  longitude: number;
  address?: string;
};

const labels: Record<string, string> = {
  baru: "Laporan diterima",
  diverifikasi: "Sudah diverifikasi",
  diproses: "Dalam penanganan",
  selesai: "Selesai ditangani",
  ditolak: "Laporan ditolak"
};

const catLabelMap: Record<string, string> = {
  INFRASTRUKTUR: "Infrastruktur",
  KEBERSIHAN: "Lingkungan & kebersihan",
  PENERANGAN_JALAN: "Penerangan jalan",
  KESEHATAN_LINGKUNGAN: "Kesehatan lingkungan"
};

async function getAddress(lat: number, lon: number): Promise<string> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 1200);
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=id`,
      {
        headers: { "User-Agent": "SPLIK-App/1.0" },
        signal: controller.signal
      }
    );
    clearTimeout(id);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address;
      if (addr) {
        const parts = [];
        if (addr.road) parts.push(addr.road);
        if (addr.suburb) parts.push(addr.suburb);
        if (addr.city || addr.town || addr.municipality) parts.push(addr.city || addr.town || addr.municipality);
        if (parts.length > 0) return parts.join(", ");
      }
      return data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    }
  } catch {}
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

export default async function ReportStatusPage({ params }: PageProps<"/status/[code]">) {
  const { code } = await params;
  let report: {
    code: string;
    createdAt: string;
    status: string;
    description: string;
    category: string;
    priority: string;
    assignedTo: string | null;
    latitude: number;
    longitude: number;
    history: Array<{ status: string; note: string; at: string; actor: string }>;
    reportCodes: string[];
    isClustered: boolean;
    reports?: SubReport[];
  } | null = null;

  if (code.toUpperCase().startsWith("TK-")) {
    const prefix = code.slice(3).toLowerCase();
    const ticketList = await db
      .select()
      .from(tickets)
      .where(sql`cast(${tickets.id} as text) like ${prefix + "%"}`)
      .limit(1);

    if (ticketList.length > 0) {
      const ticket = ticketList[0];
      const ticketReports = await db
        .select()
        .from(reports)
        .where(eq(reports.ticketId, ticket.id));

      const logs = await db
        .select({
          id: auditLogs.id,
          action: auditLogs.action,
          reason: auditLogs.reason,
          createdAt: auditLogs.createdAt,
          actor: users.name,
        })
        .from(auditLogs)
        .innerJoin(users, eq(auditLogs.userId, users.id))
        .where(eq(auditLogs.ticketId, ticket.id))
        .orderBy(desc(auditLogs.createdAt));

      const firstReport = ticketReports[0];
      const lat = (ticket.centroidLocation as any)?.y ?? (firstReport?.location as any)?.y ?? 0;
      const lng = (ticket.centroidLocation as any)?.x ?? (firstReport?.location as any)?.x ?? 0;
      const score = ticket.urgencyScore;
      const priority = score >= 70 ? "tinggi" : score >= 40 ? "sedang" : "rendah";

      let status = "baru";
      if (ticket.status === "DIPROSES_OPD" || ticket.status === "SHARED_LOCK") {
        status = "diproses";
      } else if (ticket.status === "SELESAI") {
        status = "selesai";
      } else if (ticket.status === "TERVALIDASI") {
        status = "diverifikasi";
      }

      const history = logs.map((log) => {
        let uiStatus = "baru";
        if (log.action === "DISPOSISI") uiStatus = "diproses";
        else if (log.action === "TOLAK") uiStatus = "ditolak";
        else if (log.action === "LOCK_AKTIF") uiStatus = "diverifikasi";
        else if (log.action === "SELESAI") uiStatus = "selesai";
        return {
          status: uiStatus,
          note: log.reason ?? "",
          at: log.createdAt.toISOString(),
          actor: log.actor,
        };
      });

      if (history.length === 0) {
        history.push({
          status: "baru",
          note: "Laporan diterima oleh sistem SPLIK.",
          at: ticket.createdAt.toISOString(),
          actor: "Sistem",
        });
      }

      const firstDesc = firstReport?.description ?? "";
      const description = ticketReports.length > 1 ? `${firstDesc} (berdasarkan ${ticketReports.length} aduan)` : firstDesc;
      const reportCodes = ticketReports.map(r => `REP-${r.id.slice(0, 6).toUpperCase()}`);

      const subReports: SubReport[] = await Promise.all(
        ticketReports.map(async (r) => {
          const rLat = (r.location as { y: number } | null)?.y ?? 0;
          const rLng = (r.location as { x: number } | null)?.x ?? 0;
          const rAddr = await getAddress(rLat, rLng);
          const maskedPhone = r.reporterPhone.length > 7
            ? `${r.reporterPhone.slice(0, 4)}****${r.reporterPhone.slice(-3)}`
            : r.reporterPhone;
          return {
            id: r.id,
            code: `REP-${r.id.slice(0, 6).toUpperCase()}`,
            reporterPhone: maskedPhone,
            description: r.description,
            damageLevel: r.damageLevel,
            createdAt: r.createdAt.toISOString(),
            latitude: rLat,
            longitude: rLng,
            address: rAddr
          };
        })
      );

      report = {
        code: `TK-${ticket.id.slice(0, 6).toUpperCase()}`,
        category: catLabelMap[ticket.category] ?? ticket.category,
        description,
        latitude: lat,
        longitude: lng,
        priority,
        status,
        assignedTo: ticket.assignedToRole === "OPD" ? "Petugas OPD" : null,
        createdAt: ticket.createdAt.toISOString(),
        history,
        reportCodes,
        isClustered: true,
        reports: subReports
      };
    }
  } else if (code.toUpperCase().startsWith("REP-")) {
    const prefix = code.slice(4).toLowerCase();
    const reportList = await db
      .select()
      .from(reports)
      .where(sql`cast(${reports.id} as text) like ${prefix + "%"}`)
      .limit(1);

    if (reportList.length > 0) {
      const dbReport = reportList[0];
      if (dbReport.ticketId) {
        const [ticket] = await db.select().from(tickets).where(eq(tickets.id, dbReport.ticketId)).limit(1);
        if (ticket) {
          const ticketReports = await db.select().from(reports).where(eq(reports.ticketId, ticket.id));
          const logs = await db
            .select({
              id: auditLogs.id,
              action: auditLogs.action,
              reason: auditLogs.reason,
              createdAt: auditLogs.createdAt,
              actor: users.name,
            })
            .from(auditLogs)
            .innerJoin(users, eq(auditLogs.userId, users.id))
            .where(eq(auditLogs.ticketId, ticket.id))
            .orderBy(desc(auditLogs.createdAt));

          const lat = (ticket.centroidLocation as any)?.y ?? (dbReport.location as any)?.y ?? 0;
          const lng = (ticket.centroidLocation as any)?.x ?? (dbReport.location as any)?.x ?? 0;
          const score = ticket.urgencyScore;
          const priority = score >= 70 ? "tinggi" : score >= 40 ? "sedang" : "rendah";

          let status = "baru";
          if (ticket.status === "DIPROSES_OPD" || ticket.status === "SHARED_LOCK") {
            status = "diproses";
          } else if (ticket.status === "SELESAI") {
            status = "selesai";
          } else if (ticket.status === "TERVALIDASI") {
            status = "diverifikasi";
          }

          const history = logs.map((log) => {
            let uiStatus = "baru";
            if (log.action === "DISPOSISI") uiStatus = "diproses";
            else if (log.action === "TOLAK") uiStatus = "ditolak";
            else if (log.action === "LOCK_AKTIF") uiStatus = "diverifikasi";
            else if (log.action === "SELESAI") uiStatus = "selesai";
            return {
              status: uiStatus,
              note: log.reason ?? "",
              at: log.createdAt.toISOString(),
              actor: log.actor,
            };
          });

          if (history.length === 0) {
            history.push({
              status: "baru",
              note: "Laporan diterima oleh sistem SPLIK.",
              at: ticket.createdAt.toISOString(),
              actor: "Sistem",
            });
          }

          const reportCodes = ticketReports.map(r => `REP-${r.id.slice(0, 6).toUpperCase()}`);

          const subReports: SubReport[] = await Promise.all(
            ticketReports.map(async (r) => {
              const rLat = (r.location as { y: number } | null)?.y ?? 0;
              const rLng = (r.location as { x: number } | null)?.x ?? 0;
              const rAddr = await getAddress(rLat, rLng);
              const maskedPhone = r.reporterPhone.length > 7
                ? `${r.reporterPhone.slice(0, 4)}****${r.reporterPhone.slice(-3)}`
                : r.reporterPhone;
              return {
                id: r.id,
                code: `REP-${r.id.slice(0, 6).toUpperCase()}`,
                reporterPhone: maskedPhone,
                description: r.description,
                damageLevel: r.damageLevel,
                createdAt: r.createdAt.toISOString(),
                latitude: rLat,
                longitude: rLng,
                address: rAddr
              };
            })
          );

          report = {
            code: `TK-${ticket.id.slice(0, 6).toUpperCase()}`,
            category: catLabelMap[ticket.category] ?? ticket.category,
            description: ticketReports.length > 1 ? `${dbReport.description} (berdasarkan ${ticketReports.length} aduan)` : dbReport.description,
            latitude: lat,
            longitude: lng,
            priority,
            status,
            assignedTo: ticket.assignedToRole === "OPD" ? "Petugas OPD" : null,
            createdAt: ticket.createdAt.toISOString(),
            history,
            reportCodes,
            isClustered: true,
            reports: subReports
          };
        }
      } else {
        const lat = (dbReport.location as any)?.y ?? 0;
        const lng = (dbReport.location as any)?.x ?? 0;
        const priority = dbReport.damageLevel === 1 ? "rendah" : dbReport.damageLevel === 2 ? "sedang" : "tinggi";
        const reportCodes = [`REP-${dbReport.id.slice(0, 6).toUpperCase()}`];

        report = {
          code: `REP-${dbReport.id.slice(0, 6).toUpperCase()}`,
          category: catLabelMap[dbReport.category] ?? dbReport.category,
          description: dbReport.description,
          latitude: lat,
          longitude: lng,
          priority,
          status: "baru",
          assignedTo: null,
          createdAt: dbReport.createdAt.toISOString(),
          history: [
            {
              status: "baru",
              note: "Laporan diterima oleh sistem SPLIK.",
              at: dbReport.createdAt.toISOString(),
              actor: "Sistem",
            }
          ],
          reportCodes,
          isClustered: false
        };
      }
    }
  }

  if (!report) {
    const localReport = await getLocalReport(code);
    if (localReport) {
      report = {
        code: localReport.code,
        category: localReport.category,
        description: localReport.description,
        latitude: localReport.latitude,
        longitude: localReport.longitude,
        priority: localReport.priority,
        status: localReport.status,
        assignedTo: localReport.assignedTo,
        createdAt: localReport.createdAt,
        history: localReport.history,
        reportCodes: [localReport.code],
        isClustered: false
      };
    }
  }

  if (!report) return <main className={styles.page}><section className={styles.searchCard}><Link href="/status">← Coba kode lain</Link><p>KODE TIDAK DITEMUKAN</p><h1>Laporan belum<br /><em>kami temukan.</em></h1><span>Periksa kembali penulisan kode laporanmu.</span></section></main>;

  const address = await getAddress(report.latitude, report.longitude);

  return (
    <main className={styles.detailPage}>
      <header>
        <Link href="/status">← Lacak kode lain</Link>
        <Link href="/">Portal SPLIK</Link>
      </header>
      <section className={styles.statusHero}>
        <div>
          <p>PERJALANAN LAPORAN</p>
          <h1>{report.code}</h1>
          <span>Dikirim {new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date(report.createdAt))}</span>
          {report.isClustered ? (
            <div style={{ marginTop: "16px", fontSize: "12px", color: "#607480", lineHeight: "1.6" }}>
              <div>Kode Klaster: <b>{report.code}</b></div>
            </div>
          ) : (
            <div style={{ marginTop: "16px", fontSize: "12px", color: "#607480" }}>
              <div>Kode Aduan: <b>{report.code}</b></div>
            </div>
          )}
        </div>
        <strong data-status={report.status}>{labels[report.status]}</strong>
      </section>
      <section className={styles.statusGrid}>
        <article className={styles.summary}>
          <p>RINGKASAN LAPORAN</p>
          <h2>{report.description}</h2>
          <dl>
            <div>
              <dt>Kategori</dt>
              <dd>{report.category}</dd>
            </div>
            <div>
              <dt>Prioritas</dt>
              <dd>{report.priority}</dd>
            </div>
            <div>
              <dt>Petugas</dt>
              <dd>{report.assignedTo ?? "Belum ditugaskan"}</dd>
            </div>
            <div>
              <dt>Lokasi</dt>
              <dd>{address}</dd>
            </div>
          </dl>
        </article>
        <article className={styles.timeline}>
          <p>RIWAYAT PENANGANAN</p>
          {[...report.history].reverse().map((event, index) => (
            <div className={styles.event} key={`${event.at}-${index}`}>
              <i data-current={index === 0} />
              <span>
                <b>{labels[event.status]}</b>
                <small>{new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date(event.at))} · {event.actor}</small>
                <p>{event.note}</p>
              </span>
            </div>
          ))}
        </article>
        <section className={styles.statusMapSection}>
          <p>LOKASI KEJADIAN</p>
          <StatusMapClient latitude={report.latitude} longitude={report.longitude} priority={report.priority} />
        </section>
      </section>
      {report.reports && report.reports.length >= 1 && (
        <section className={styles.clusterSection}>
          <p>Daftar Aduan Dalam Klaster Ini</p>
          <div className={styles.clusterTableWrapper}>
            <table className={styles.clusterTable}>
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Tanggal</th>
                  <th>Tingkat Kerusakan</th>
                  <th>Deskripsi Aduan</th>
                  <th>Lokasi</th>
                </tr>
              </thead>
              <tbody>
                {report.reports.map((item) => (
                  <tr key={item.id}>
                    <td><code>{item.code}</code></td>
                    <td>
                      {new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date(item.createdAt))}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${item.damageLevel === 3 ? styles.badgeHigh : item.damageLevel === 2 ? styles.badgeMedium : styles.badgeLow}`}>
                        {item.damageLevel === 3 ? "Tinggi" : item.damageLevel === 2 ? "Sedang" : "Rendah"}
                      </span>
                    </td>
                    <td>{item.description}</td>
                    <td>
                      <a target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${item.latitude}&mlon=${item.longitude}#map=18/${item.latitude}/${item.longitude}`}>
                        {item.address || `${item.latitude.toFixed(5)}, ${item.longitude.toFixed(5)}`} ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
