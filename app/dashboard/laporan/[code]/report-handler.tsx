"use client";
import { FormEvent, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import styles from "./report-handler.module.css";

type History = { status: string; note: string; at: string; actor: string };
type SubReport = {
  id: string;
  code: string;
  reporterPhone: string;
  description: string;
  damageLevel: number;
  createdAt: string;
  latitude: number;
  longitude: number;
};
type Report = {
  code: string;
  category: string;
  severity: string;
  description: string;
  contactPhone: string;
  latitude: number;
  longitude: number;
  priority: string;
  status: string;
  assignedTo: string | null;
  createdAt: string;
  history: History[];
  reports?: SubReport[];
};
const statusOptions = ["baru", "diverifikasi", "diproses", "selesai", "ditolak"];

export default function ReportHandler({ code }: { code: string }) {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [clusterSearch, setClusterSearch] = useState("");
  const [clusterCurrentPage, setClusterCurrentPage] = useState(1);
  const clusterItemsPerPage = 10;

  useEffect(() => {
    fetch(`/api/admin/reports/${encodeURIComponent(code)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setReport(data);
      })
      .catch((reason) => setError(reason.message));
  }, [code]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const day = date.getDate();
      const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${day} ${month} ${year}, ${hours}.${minutes}`;
    } catch {
      return dateStr;
    }
  };

  const filteredClusterReports = useMemo(() => {
    if (!report?.reports) return [];
    const query = clusterSearch.trim().toLowerCase();
    if (!query) return report.reports;

    return report.reports.filter((item) => {
      const codeMatch = item.code.toLowerCase().includes(query);
      const contactMatch = item.reporterPhone.toLowerCase().includes(query);
      const descMatch = item.description.toLowerCase().includes(query);
      const levelStr = item.damageLevel === 3 ? "tinggi" : item.damageLevel === 2 ? "sedang" : "rendah";
      const priorityMatch = levelStr.includes(query);
      const dateMatch = formatDate(item.createdAt).toLowerCase().includes(query);

      return codeMatch || contactMatch || descMatch || priorityMatch || dateMatch;
    });
  }, [report?.reports, clusterSearch]);

  const totalClusterPages = Math.ceil(filteredClusterReports.length / clusterItemsPerPage);

  const paginatedClusterReports = useMemo(() => {
    const start = (clusterCurrentPage - 1) * clusterItemsPerPage;
    return filteredClusterReports.slice(start, start + clusterItemsPerPage);
  }, [filteredClusterReports, clusterCurrentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClusterSearch(e.target.value);
    setClusterCurrentPage(1);
  };

  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/reports/${encodeURIComponent(code)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: form.get("status"),
        assignedTo: form.get("assignedTo"),
        note: form.get("note")
      })
    });
    const data = await response.json();
    setPending(false);
    if (!response.ok) setError(data.error);
    else {
      setReport(data);
      (event.currentTarget.elements.namedItem("note") as HTMLTextAreaElement).value = "";
    }
  }

  if (error && !report) return <main className={styles.page}><Link href="/dashboard">← Dashboard</Link><h1>{error}</h1></main>;
  if (!report) return <main className={styles.page}>Memuat laporan…</main>;

  const displayedStart = filteredClusterReports.length > 0 ? (clusterCurrentPage - 1) * clusterItemsPerPage + 1 : 0;
  const displayedEnd = Math.min(clusterCurrentPage * clusterItemsPerPage, filteredClusterReports.length);

  return (
    <main className={styles.page}>
      <header>
        <Link href="/dashboard">← Kembali ke dashboard</Link>
        <Link href={`/status/${report.code}`} target="_blank">Lihat sebagai warga ↗</Link>
      </header>
      <section className={styles.head}>
        <div>
          <p>PENANGANAN LAPORAN</p>
          <h1>{report.code}</h1>
          <span>{report.category} · Prioritas {report.priority}</span>
        </div>
        <strong>{report.status}</strong>
      </section>
      <section className={styles.grid}>
        <article className={styles.detail}>
          <p>DETAIL KEJADIAN</p>
          <h2>{report.description}</h2>
          <dl>
            <div>
              <dt>Dikirim</dt>
              <dd>{new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date(report.createdAt))}</dd>
            </div>
            <div>
              <dt>Kontak warga</dt>
              <dd>{report.contactPhone}</dd>
            </div>
            <div>
              <dt>Lokasi</dt>
              <dd>
                <a target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}#map=18/${report.latitude}/${report.longitude}`}>
                  {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)} ↗
                </a>
              </dd>
            </div>
            <div>
              <dt>Petugas</dt>
              <dd>{report.assignedTo ?? "Belum ditugaskan"}</dd>
            </div>
          </dl>
        </article>
        <article className={styles.action}>
          <p>PERBARUI PENANGANAN</p>
          <form onSubmit={update}>
            <label>
              Status
              <select name="status" defaultValue={report.status} key={report.status}>
                {statusOptions.map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label>
              Petugas / regu
              <input name="assignedTo" defaultValue={report.assignedTo ?? ""} placeholder="Contoh: Tim Infrastruktur 01" />
            </label>
            <label>
              Catatan untuk warga
              <textarea name="note" required minLength={5} rows={4} placeholder="Jelaskan tindakan atau perkembangan terbaru…" />
            </label>
            {error && <div role="alert">{error}</div>}
            <button disabled={pending}>{pending ? "Menyimpan…" : "Simpan pembaruan"}</button>
          </form>
        </article>
        {report.reports && report.reports.length > 1 && (
          <article className={styles.cluster}>
            <div className={styles.clusterHeader}>
              <p>DAFTAR ADUAN DALAM KLASTER INI</p>
              <div className={styles.clusterSearchWrapper}>
                <input
                  type="text"
                  className={styles.clusterSearchInput}
                  placeholder="Cari aduan..."
                  value={clusterSearch}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            <div className={styles.clusterTableWrapper}>
              <table className={styles.clusterTable}>
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Kontak</th>
                    <th>Tanggal</th>
                    <th>Tingkat Kerusakan</th>
                    <th>Deskripsi Aduan</th>
                    <th>Lokasi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedClusterReports.length > 0 ? (
                    paginatedClusterReports.map((item) => (
                      <tr key={item.id}>
                        <td><code>{item.code}</code></td>
                        <td>{item.reporterPhone}</td>
                        <td>{formatDate(item.createdAt)}</td>
                        <td>
                          <span className={`${styles.badge} ${item.damageLevel === 3 ? styles.badgeHigh : item.damageLevel === 2 ? styles.badgeMedium : styles.badgeLow}`}>
                            {item.damageLevel === 3 ? "Tinggi" : item.damageLevel === 2 ? "Sedang" : "Rendah"}
                          </span>
                        </td>
                        <td>{item.description}</td>
                        <td>
                          <a target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${item.latitude}&mlon=${item.longitude}#map=18/${item.latitude}/${item.longitude}`}>
                            {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)} ↗
                          </a>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className={styles.emptyCell}>
                        Tidak ada aduan yang cocok dengan pencarian Anda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredClusterReports.length > 0 && (
              <div className={styles.pagination}>
                <span className={styles.paginationInfo}>
                  Menampilkan {displayedStart}-{displayedEnd} dari {filteredClusterReports.length} aduan
                </span>
                <div className={styles.paginationButtons}>
                  <button
                    onClick={() => setClusterCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={clusterCurrentPage === 1}
                    className={styles.pageButton}
                  >
                    Sebelumnya
                  </button>
                  <button
                    onClick={() => setClusterCurrentPage((prev) => Math.min(prev + 1, totalClusterPages))}
                    disabled={clusterCurrentPage === totalClusterPages}
                    className={styles.pageButton}
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </article>
        )}
        <article className={styles.history}>
          <p>RIWAYAT AKTIVITAS</p>
          {[...report.history].reverse().map((item, index) => (
            <div key={`${item.at}-${index}`}>
              <i />
              <span>
                <b>{item.status}</b>
                <small>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.at))} · {item.actor}</small>
                <p>{item.note}</p>
              </span>
            </div>
          ))}
        </article>
      </section>
    </main>
  );
}
