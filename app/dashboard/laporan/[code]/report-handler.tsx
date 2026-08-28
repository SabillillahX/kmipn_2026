"use client";

import { FormEvent, useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import styles from "./report-handler.module.css";
import ClusterMapClient from "./cluster-map";
import SuratTugasModal from "@/src/components/surat-tugas-modal";
import ConfirmModal from "@/src/components/confirm-modal";
import { FileText, Image as ImageIcon, Play, CheckCircle, WhatsappLogo } from "@phosphor-icons/react";

async function fetchAddress(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(`/api/admin/geocode?lat=${lat}&lon=${lon}`);
    if (res.ok) {
      const data = await res.json();
      if (data.address) return data.address;
    }
  } catch {}
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

const geocodeQueue: Array<{
  lat: number;
  lon: number;
  resolve: (val: string) => void;
}> = [];
let isGeocodeQueueRunning = false;

async function runGeocodeQueue() {
  if (isGeocodeQueueRunning || geocodeQueue.length === 0) return;
  isGeocodeQueueRunning = true;
  const task = geocodeQueue[0];
  try {
    const res = await fetchAddress(task.lat, task.lon);
    task.resolve(res);
  } catch {
    task.resolve(`${task.lat.toFixed(5)}, ${task.lon.toFixed(5)}`);
  }
  geocodeQueue.shift();
  await new Promise((resolve) => setTimeout(resolve, 200));
  isGeocodeQueueRunning = false;
  runGeocodeQueue();
}

function enqueueGeocode(lat: number, lon: number): Promise<string> {
  return new Promise((resolve) => {
    geocodeQueue.push({ lat, lon, resolve });
    runGeocodeQueue();
  });
}

type History = { status: string; note: string; at: string; actor: string };
type ReportImage = { id: string; reportId: string; url: string };
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
  districtId?: string;
};
const statusOptions = ["baru", "diverifikasi", "diproses", "selesai", "ditolak"];

export default function ReportHandler({ code, userRole, userId }: { code: string; userRole?: string; userId?: string }) {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [clusterSearch, setClusterSearch] = useState("");
  const [clusterCurrentPage, setClusterCurrentPage] = useState(1);
  const [images, setImages] = useState<ReportImage[]>([]);
  const [proofImages, setProofImages] = useState<ReportImage[]>([]);
  const [opds, setOpds] = useState<{id: string, name: string}[]>([]);
  const [isSuratTugasOpen, setIsSuratTugasOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);
  const clusterItemsPerPage = 10;
  const [addresses, setAddresses] = useState<Record<string, string>>({});
  const resolvedRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!report) return;
    const coords: Array<{ lat: number; lon: number }> = [];
    coords.push({ lat: report.latitude, lon: report.longitude });
    if (report.reports) {
      report.reports.forEach((r) => {
        coords.push({ lat: r.latitude, lon: r.longitude });
      });
    }

    coords.forEach(async ({ lat, lon }) => {
      const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
      if (resolvedRef.current[key]) return;
      resolvedRef.current[key] = true;
      const addr = await enqueueGeocode(lat, lon);
      setAddresses((prev) => ({ ...prev, [key]: addr }));
    });
  }, [report]);

  useEffect(() => {
    fetch(`/api/admin/reports/${encodeURIComponent(code)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setReport(data);
        if (userRole === "CAMAT" || userRole === "ADMIN") {
          const query = data.districtId ? `?districtId=${data.districtId}` : "";
          fetch(`/api/camat/opds${query}`)
            .then(res => res.json())
            .then(setOpds)
            .catch(() => {});
        }
      })
      .catch((reason) => setError(reason.message));
  }, [code, userRole]);

  useEffect(() => {
    if (!code.toUpperCase().startsWith("TK-")) return;
    fetch(`/api/opd/tickets/${encodeURIComponent(code)}/proof`)
      .then(async (response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setProofImages(data.images ?? []))
      .catch(() => setProofImages([]));
  }, [code]);

  useEffect(() => {
    fetch(`/api/reports/${encodeURIComponent(code)}/attachments`)
      .then(async (response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setImages(data.images ?? []))
      .catch(() => setImages([]));
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

  const disposisiLog = useMemo(() => {
    if (!report?.history) return null;
    return report.history.find((h) => h.note.toLowerCase().includes("disposisi") || h.status === "diproses" || h.status === "diverifikasi");
  }, [report]);

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
    const currentTarget = event.currentTarget;
    setPending(true);
    setError("");
    const form = new FormData(currentTarget);
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
      (currentTarget.elements.namedItem("note") as HTMLTextAreaElement).value = "";
    }
  }

  // Custom UI Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    type?: "confirm" | "success" | "error" | "warning" | "info";
    onConfirm?: () => void | Promise<void>;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: "",
  });

  const showAlert = (title: string, description?: string, type: "confirm" | "success" | "error" | "warning" | "info" = "info", onConfirm?: () => void) => {
    setModalConfig({
      isOpen: true,
      title,
      description,
      type,
      onConfirm: onConfirm ? () => { setModalConfig(p => ({ ...p, isOpen: false })); onConfirm(); } : () => setModalConfig(p => ({ ...p, isOpen: false }))
    });
  };

  const showConfirm = (title: string, description: string, onConfirm: () => void | Promise<void>) => {
    setModalConfig({
      isOpen: true,
      title,
      description,
      onConfirm: async () => {
        setModalConfig(p => ({ ...p, isOpen: false }));
        await onConfirm();
      },
      confirmText: "Ya, Konfirmasi",
      type: "confirm"
    });
  };

  async function handleDisposisi(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentTarget = event.currentTarget;
    setPending(true);
    setError("");
    const form = new FormData(currentTarget);
    const response = await fetch(`/api/camat/tickets/${encodeURIComponent(code)}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        opdUserId: form.get("opdUserId"),
        note: form.get("note")
      })
    });
    const data = await response.json();
    setPending(false);
    if (!response.ok) setError(data.error);
    else {
      showAlert(
        "Disposisi Berhasil",
        "Tiket berhasil didisposisikan ke OPD dan Surat Tugas Resmi telah diterbitkan!",
        "success",
        () => window.location.reload()
      );
    }
  }

  async function handleStartProgress() {
    showConfirm(
      "Konfirmasi Penanganan Lapangan",
      "Apakah Anda yakin ingin mengonfirmasi dan memulai penanganan teknis untuk tiket ini?",
      async () => {
        setPending(true);
        setError("");
        const response = await fetch(`/api/opd/tickets/${encodeURIComponent(code)}/progress`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "diproses",
            note: "Memulai inspeksi teknis dan pengerjaan lapangan oleh tim OPD."
          })
        });
        const data = await response.json();
        setPending(false);
        if (!response.ok) setError(data.error);
        else {
          showAlert(
            "Penanganan Dimulai",
            "Status penanganan berhasil diperbarui menjadi 'Diproses OPD'!",
            "success",
            () => window.location.reload()
          );
        }
      }
    );
  }

  async function handleProofUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentTarget = event.currentTarget;
    setPending(true);
    setError("");
    const form = new FormData(currentTarget);
    const proofRes = await fetch(`/api/opd/tickets/${encodeURIComponent(code)}/proof`, {
      method: "POST",
      body: form
    });
    const proofData = await proofRes.json();
    if (!proofRes.ok) {
      setPending(false);
      setError(proofData.error || "Gagal mengunggah foto bukti.");
      return;
    }

    const note = (form.get("note") as string) || "Penanganan lapangan telah selesai dikerjakan.";
    const progressRes = await fetch(`/api/opd/tickets/${encodeURIComponent(code)}/progress`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "selesai",
        note: note
      })
    });
    const progressData = await progressRes.json();
    setPending(false);
    if (!progressRes.ok) setError(progressData.error);
    else {
      showAlert(
        "Penanganan Selesai",
        "Bukti penyelesaian berhasil diunggah dan laporan resmi ditandai Selesai!",
        "success",
        () => window.location.reload()
      );
    }
  }

  if (error && !report) return <main className={styles.page}><Link href="/dashboard">← Dashboard</Link><h1>{error}</h1></main>;
  if (!report) return <main className={styles.page}>Memuat laporan…</main>;

  const displayedStart = filteredClusterReports.length > 0 ? (clusterCurrentPage - 1) * clusterItemsPerPage + 1 : 0;
  const displayedEnd = Math.min(clusterCurrentPage * clusterItemsPerPage, filteredClusterReports.length);

  const handleBroadcastWhatsApp = async () => {
    const cleanPhone = report.contactPhone.startsWith("0") ? `62${report.contactPhone.slice(1)}` : report.contactPhone.replace(/\D/g, "");
    const trackingLink = `http://localhost:3000/status/${encodeURIComponent(code)}`;
    const statusMsg = `🏛️ *SISTEM SPLIK KECAMATAN SUKAMAJU* 🏛️\n\nYth. Warga Sukamaju,\nUpdate status terkini laporan Anda (*${code}*):\nSTATUS: *${report.status.toUpperCase()}*\nPelaksana: *${report.assignedTo || "OPD Pelaksana"}*\n\nLacak detail & bukti foto di:\n🔗 ${trackingLink}`;
    const directWaUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(statusMsg)}`;

    showConfirm(
      "Broadcast WhatsApp Status",
      `Kirim notifikasi update status laporan (${report.status}) ke nomor pelapor ${report.contactPhone}?`,
      async () => {
        setBroadcasting(true);
        try {
          const res = await fetch("/api/admin/whatsapp/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: code }),
          });
          const data = await res.json();
          setBroadcasting(false);
          if (!res.ok) throw new Error(data.error || "Gagal melakukan broadcast.");

          showAlert(
            "Broadcast Berhasil!",
            `Notifikasi WA otomatis telah dipicu ke ${data.count} nomor pelapor. Klik 'Mengerti' untuk menguji direct chat WhatsApp Web ke ${report.contactPhone}.`,
            "success",
            () => window.open(directWaUrl, "_blank")
          );
        } catch (err: any) {
          setBroadcasting(false);
          showAlert("Gagal Broadcast", err.message, "error");
        }
      }
    );
  };

  const showSuratTugasButton = report.assignedTo || report.status === "diverifikasi" || report.status === "diproses" || report.status === "selesai";

  return (
    <main className={styles.page}>
      <header>
        <Link href="/dashboard">← Kembali ke dashboard</Link>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleBroadcastWhatsApp}
            disabled={broadcasting}
            style={{
              background: "#25D366",
              color: "#fff",
              border: "none",
              padding: "8px 14px",
              borderRadius: "6px",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(37,211,102,0.25)"
            }}
          >
            <WhatsappLogo size={18} weight="fill" /> {broadcasting ? "Mengirim WA…" : "Broadcast WA Status"}
          </button>

          {showSuratTugasButton && (
            <button
              type="button"
              onClick={() => setIsSuratTugasOpen(true)}
              style={{
                background: "#0f172a",
                color: "#fff",
                border: "none",
                padding: "8px 14px",
                borderRadius: "6px",
                fontWeight: 600,
                fontSize: "12px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <FileText size={16} weight="bold" /> Surat Tugas Resmi
            </button>
          )}
        </div>
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
        <article className={styles.detail} style={report.status === "selesai" ? { gridColumn: "1 / -1" } : undefined}>
          <p>DETAIL KEJADIAN</p>
          <h2>{report.description}</h2>
          <dl>
            <div>
              <dt>Dikirim</dt>
              <dd>{new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeStyle: "short" }).format(new Date(report.createdAt))}</dd>
            </div>
            <div>
              <dt>Kontak warga</dt>
              <dd style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>{report.contactPhone}</span>
                <a
                  href={`https://wa.me/${report.contactPhone.startsWith("0") ? `62${report.contactPhone.slice(1)}` : report.contactPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Halo, ini dari pihak Kecamatan Sukamaju mengenai laporan ${report.code}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "#25D366",
                    fontWeight: 700,
                    fontSize: "11px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    textDecoration: "none"
                  }}
                >
                  <WhatsappLogo size={14} weight="fill" /> Kirim WA ↗
                </a>
              </dd>
            </div>
            <div>
              <dt>Lokasi</dt>
              <dd>
                <a target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${report.latitude}&mlon=${report.longitude}#map=18/${report.latitude}/${report.longitude}`}>
                  {addresses[`${report.latitude.toFixed(5)},${report.longitude.toFixed(5)}`] || `${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}`} ↗
                </a>
              </dd>
            </div>
            <div>
              <dt>Petugas OPD Pelaksana</dt>
              <dd>{report.assignedTo ?? "Belum didisposisikan"}</dd>
            </div>
          </dl>

          {images.length > 0 && (
            <div className={styles.images}>
              <dt>
                <ImageIcon size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
                Foto Lampiran Warga ({images.length})
              </dt>
              <div>
                {images.map((image, index) => (
                  <button
                    type="button"
                    key={image.id}
                    onClick={() => setPreviewImage(image.url)}
                    style={{ border: "none", padding: 0, background: "none", cursor: "pointer" }}
                  >
                    <img src={image.url} alt={`Foto laporan ${index + 1}`} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {proofImages.length > 0 && (
            <div className={styles.images}>
              <dt style={{ color: "#22c55e", fontWeight: 700 }}>
                <CheckCircle size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
                Bukti Penyelesaian Lapangan OPD ({proofImages.length})
              </dt>
              <div>
                {proofImages.map((image, index) => (
                  <button
                    type="button"
                    key={image.id}
                    onClick={() => setPreviewImage(image.url)}
                    style={{ border: "none", padding: 0, background: "none", cursor: "pointer" }}
                  >
                    <img src={image.url} alt={`Bukti penyelesaian ${index + 1}`} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </article>

        {report.status !== "selesai" && (
          <article className={styles.action}>
            <p>TINDAKAN PENANGANAN LAPANGAN</p>
            
            {(userRole === "CAMAT" || userRole === "ADMIN") && (
              <form onSubmit={handleDisposisi}>
                <label>
                  Pilih Instansi OPD Pelaksana *
                  <select name="opdUserId" required defaultValue="">
                    <option value="" disabled>-- Pilih OPD Pelaksana --</option>
                    {opds.map((opd) => <option key={opd.id} value={opd.id}>{opd.name}</option>)}
                  </select>
                </label>
                <label>
                  Catatan / Perintah Disposisi Resmi *
                  <textarea name="note" required minLength={5} rows={4} placeholder="Tuliskan instruksi teknis penanganan untuk OPD pelaksana…" />
                </label>
                {error && <div role="alert">{error}</div>}
                <button disabled={pending}>{pending ? "Menerbitkan Surat Tugas…" : "Disposisikan & Terbitkan Surat Tugas"}</button>
              </form>
            )}

            {userRole === "OPD" && (report.status === "diverifikasi" || report.status === "baru") && (
              <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#0f172a" }}>Langkah 1: Konfirmasi Memulai Pengerjaan</h4>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 16px 0" }}>
                  Klik tombol di bawah untuk mengonfirmasi bahwa tim OPD sudah siap turun ke lapangan untuk menangani aduan ini.
                </p>
                {error && <div role="alert" style={{ marginBottom: "12px" }}>{error}</div>}
                <button
                  type="button"
                  onClick={handleStartProgress}
                  disabled={pending}
                  style={{
                    width: "100%",
                    height: "44px",
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  <Play size={18} weight="fill" /> {pending ? "Memproses…" : "Mulai Penanganan Lapangan"}
                </button>
              </div>
            )}

            {userRole === "OPD" && report.status === "diproses" && (
              <form onSubmit={handleProofUpload}>
                <div style={{ padding: "12px", background: "#f0fdf4", borderRadius: "6px", border: "1px solid #bbf7d0", marginBottom: "12px", fontSize: "12px", color: "#166534" }}>
                  <strong>Langkah 2: Unggah Hasil Pekerjaan Lapangan</strong>
                </div>
                <label>
                  Foto Bukti Penyelesaian Lapangan (Wajib)
                  <input type="file" name="images" accept="image/*,image/heic,image/heif" required multiple style={{marginTop: "8px", marginBottom: "16px"}} />
                </label>
                <label>
                  Laporan Hasil Pekerjaan / Catatan Hasil
                  <textarea name="note" required minLength={5} rows={4} placeholder="Jelaskan tindakan teknis yang telah dikerjakan oleh tim di lokasi…" />
                </label>
                {error && <div role="alert">{error}</div>}
                <button disabled={pending}>{pending ? "Mengunggah Laporan…" : "Kirim Bukti Lapangan & Selesaikan"}</button>
              </form>
            )}
          </article>
        )}

        {report.reports && report.reports.length >= 1 && (
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
            <ClusterMapClient reports={report.reports} />
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
                            {addresses[`${item.latitude.toFixed(5)},${item.longitude.toFixed(5)}`] || `${item.latitude.toFixed(5)}, ${item.longitude.toFixed(5)}`} ↗
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
          <p>RIWAYAT AKTIVITAS & AUDIT LOG</p>
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

      {/* Surat Tugas Modal */}
      <SuratTugasModal
        isOpen={isSuratTugasOpen}
        onClose={() => setIsSuratTugasOpen(false)}
        report={report}
        disposisiNote={disposisiLog?.note}
        assignedOpdName={report.assignedTo ?? undefined}
      />

      {/* Image Lightbox Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(4px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >
          <img
            src={previewImage}
            alt="Pratinjau Foto Full"
            style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: "8px", objectFit: "contain" }}
          />
        </div>
      )}

      {/* Custom Confirmation / Alert Modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((p) => ({ ...p, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        description={modalConfig.description}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
      />
    </main>
  );
}
