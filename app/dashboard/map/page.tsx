import { desc } from "drizzle-orm";
import { requireAdmin } from "@/app/lib/dal";
import { getLocalReports } from "@/app/lib/local-reports";
import { db } from "@/src/db";
import { reports } from "@/src/db/schema";
import MapClient from "./map-client";
import styles from "./map.module.css";

export default async function DashboardMapPage() {
  await requireAdmin();
  let entries: (typeof reports.$inferSelect)[] = [];
  try { entries = await db.select().from(reports).orderBy(desc(reports.createdAt)).limit(50); }
  catch { entries = (await getLocalReports()).map(({ history: _history, ...report }) => ({ ...report, assignedTo: null, createdAt: new Date(report.createdAt), resolvedAt: report.resolvedAt ? new Date(report.resolvedAt) : null })); }
  const points = entries.map((item) => ({ id: item.id, code: item.code, category: item.category, description: item.description, latitude: item.latitude, longitude: item.longitude, priority: item.priority, status: item.status }));
  return <main className={styles.page}><a className={styles.back} href="/dashboard">← Kembali ke dashboard</a><h1>Peta laporan warga</h1><p>{points.length} titik laporan ditampilkan. Marker memakai koordinat geografis asli dan dapat diklik untuk membuka penanganan.</p><MapClient points={points} /><section className={styles.list}>{points.map((item, index) => <a key={item.id} href={`/dashboard/laporan/${item.code}`}><span><b>{index + 1}. {item.code}</b> · {item.category}</span><em data-priority={item.priority}>{item.status} →</em></a>)}</section></main>;
}
