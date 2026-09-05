"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRightIcon,
  BellIcon,
  CaretDownIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
  DotsThreeIcon,
  FileTextIcon,
  MapPinIcon,
  ListBulletsIcon,
  WarningCircleIcon,
  PlayIcon,
  CheckIcon,
} from "@phosphor-icons/react";
import splikEmblem from "../../../public/brand/splik-emblem.png";
import styles from "../dashboard.module.css";
import SuratTugasModal from "@/src/components/surat-tugas-modal";
import ConfirmModal, { ModalType } from "@/src/components/confirm-modal";

type Ticket = {
  id: string;
  code: string;
  category: string;
  description?: string;
  latitude: number;
  longitude: number;
  status: string;
  priority?: string;
  updatedAt: string;
  createdAt?: string;
};
type Notification = { id: string; title: string; message: string; createdAt: string; readAt: string | null };
type DashboardData = { tickets: Ticket[]; notifications: Notification[] };

export default function OpdClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [tab, setTab] = useState<"ALL" | "PENDING" | "IN_PROGRESS" | "DONE">("ALL");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loadingCode, setLoadingCode] = useState<string | null>(null);

  // Custom UI Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description?: string;
    type?: ModalType;
    onConfirm?: () => void | Promise<void>;
    confirmText?: string;
    cancelText?: string;
  }>({
    isOpen: false,
    title: "",
  });

  const showAlert = (title: string, description?: string, type: ModalType = "info") => {
    setModalConfig({
      isOpen: true,
      title,
      description,
      type,
    });
  };

  const showConfirm = (
    title: string,
    description: string,
    onConfirm: () => void | Promise<void>,
    confirmText = "Ya, Konfirmasi",
    type: ModalType = "confirm"
  ) => {
    setModalConfig({
      isOpen: true,
      title,
      description,
      onConfirm,
      confirmText,
      type,
    });
  };

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    fetch("/api/opd/dashboard")
      .then((response) => (response.ok ? response.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const tickets = data?.tickets ?? [];
  const inProgress = tickets.filter((t) => t.status === "DIPROSES_OPD" || t.status === "SHARED_LOCK");
  const pending = tickets.filter((t) => t.status === "TERVALIDASI" || t.status === "MENUNGGU_KLIRING");
  const completed = tickets.filter((t) => t.status === "SELESAI");

  const filteredTickets = tickets.filter((t) => {
    if (tab === "PENDING") return t.status === "TERVALIDASI" || t.status === "MENUNGGU_KLIRING";
    if (tab === "IN_PROGRESS") return t.status === "DIPROSES_OPD" || t.status === "SHARED_LOCK";
    if (tab === "DONE") return t.status === "SELESAI";
    return true;
  });

  const triggerStartProgress = (code: string) => {
    showConfirm(
      "Konfirmasi Penanganan Lapangan",
      `Apakah tim OPD siap memulai pengerjaan teknis untuk tiket ${code}?`,
      async () => {
        closeModal();
        setLoadingCode(code);
        try {
          const response = await fetch(`/api/opd/tickets/${encodeURIComponent(code)}/progress`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "diproses",
              note: "Memulai inspeksi dan penanganan teknis lapangan oleh tim OPD.",
            }),
          });
          const resData = await response.json();
          if (!response.ok) throw new Error(resData.error || "Gagal memperbarui status.");

          const refreshRes = await fetch("/api/opd/dashboard");
          if (refreshRes.ok) setData(await refreshRes.json());

          showAlert(
            "Penanganan Dimulai",
            `Status tiket ${code} berhasil diubah menjadi DIPROSES OPD. Silakan menuju ke lokasi aduan.`,
            "success"
          );
        } catch (err: any) {
          showAlert("Gagal Memperbarui Status", err.message, "error");
        } finally {
          setLoadingCode(null);
        }
      },
      "Mulai Penanganan",
      "confirm"
    );
  };

  return (
    <main className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/" aria-label="Kembali ke beranda SPLIK">
          <Image src={splikEmblem} alt="" width={48} height={48} priority />
          <span>
            <strong>SPLIK</strong>
            <small>OPD CONSOLE</small>
          </span>
        </Link>

        <div className={styles.workspace}>
          <span className={styles.liveDot} /> Tim Lapangan OPD <CaretDownIcon size={13} />
        </div>
        <nav className={styles.navigation} aria-label="Menu dashboard">
          <p>RUANG KERJA</p>
          <button type="button" className={styles.navActive}>
            <ListBulletsIcon size={18} weight="fill" />
            <span>Antrean Penugasan</span>
            <b>{tickets.length}</b>
          </button>
          <p className={styles.settingsLabel}>PENGELOLAAN</p>
          <button type="button" onClick={() => window.location.assign("/dashboard/map")}>
            <MapPinIcon size={18} />
            <span>Peta Wilayah</span>
          </button>
        </nav>

        <div className={styles.operator}>
          <div className={styles.avatar}>OP</div>
          <span>
            <b>Akun Petugas OPD</b>
            <small>Instansi Pelaksana</small>
          </span>
          <DotsThreeIcon size={19} />
        </div>
      </aside>

      <section className={styles.content}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}>
            <span>OPD /</span> KONSOL TUGAS LAPANGAN
          </div>
          <div className={styles.topActions}>
            <button className={styles.iconButton} aria-label="Notifikasi">
              <BellIcon size={20} />
              {data?.notifications.some((n) => !n.readAt) && <i />}
            </button>
            <Link href="/" className={styles.publicLink}>
              Portal Publik <ArrowRightIcon size={15} />
            </Link>
          </div>
        </header>

        <div className={styles.pageHead}>
          <div>
            <p className={styles.kicker}>INSTANSI PELAKSANA LAPANGAN</p>
            <h1>Daftar Penugasan OPD<span>.</span></h1>
            <p>Kelola instruksi penanganan resmi dari Camat, mulai inspeksi, dan unggah foto hasil penyelesaian pekerjaan.</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className={styles.logoutButton}
              style={{
                backgroundColor: "#272a2e",
                border: "none",
                color: "#fff",
                padding: "10px 16px",
                borderRadius: "100px",
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
              }}
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.assign("/login");
              }}
            >
              Keluar
            </button>
          </div>
        </div>

        <div>
          <section className={styles.metrics}>
            <article
              className={`${styles.metric} ${styles.metricPrimary}`}
              onClick={() => setTab("ALL")}
              style={{ cursor: "pointer" }}
            >
              <div className={styles.metricTop}>
                <span>Total Penugasan</span>
                <span className={styles.metricIcon}>
                  <FileTextIcon size={19} />
                </span>
              </div>
              <strong>{tickets.length}</strong>
              <p>
                <WarningCircleIcon size={14} weight="bold" /> <b>Seluruh tiket</b> disposisi
              </p>
            </article>
            <article
              className={styles.metric}
              onClick={() => setTab("PENDING")}
              style={{ cursor: "pointer", border: tab === "PENDING" ? "2px solid #f59e0b" : undefined }}
            >
              <div className={styles.metricTop}>
                <span>Perlu Penanganan</span>
                <span className={`${styles.metricIcon} ${styles.coralIcon}`}>
                  <WarningCircleIcon size={20} />
                </span>
              </div>
              <strong>{pending.length}</strong>
              <p className={styles.alertText}>Menunggu konfirmasi</p>
            </article>
            <article
              className={styles.metric}
              onClick={() => setTab("IN_PROGRESS")}
              style={{ cursor: "pointer", border: tab === "IN_PROGRESS" ? "2px solid #3b82f6" : undefined }}
            >
              <div className={styles.metricTop}>
                <span>Sedang Dikerjakan</span>
                <span className={`${styles.metricIcon} ${styles.blueIcon}`}>
                  <ClockCountdownIcon size={20} />
                </span>
              </div>
              <strong>{inProgress.length}</strong>
              <p>Dalam pengerjaan tim</p>
            </article>
            <article
              className={styles.metric}
              onClick={() => setTab("DONE")}
              style={{ cursor: "pointer", border: tab === "DONE" ? "2px solid #10b981" : undefined }}
            >
              <div className={styles.metricTop}>
                <span>Tuntas Selesai</span>
                <span className={`${styles.metricIcon} ${styles.mintIcon}`}>
                  <CheckCircleIcon size={20} />
                </span>
              </div>
              <strong>{completed.length}</strong>
              <p>Bukti telah dikirim</p>
            </article>
          </section>

          {/* Tab Selection */}
          <div style={{ marginTop: "24px", display: "flex", gap: "10px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
            <button
              onClick={() => setTab("ALL")}
              style={{
                background: tab === "ALL" ? "#0f172a" : "#f1f5f9",
                color: tab === "ALL" ? "#fff" : "#475569",
                border: "none",
                padding: "8px 16px",
                borderRadius: "20px",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Semua ({tickets.length})
            </button>
            <button
              onClick={() => setTab("PENDING")}
              style={{
                background: tab === "PENDING" ? "#d97706" : "#f1f5f9",
                color: tab === "PENDING" ? "#fff" : "#475569",
                border: "none",
                padding: "8px 16px",
                borderRadius: "20px",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Perlu Dikonfirmasi ({pending.length})
            </button>
            <button
              onClick={() => setTab("IN_PROGRESS")}
              style={{
                background: tab === "IN_PROGRESS" ? "#2563eb" : "#f1f5f9",
                color: tab === "IN_PROGRESS" ? "#fff" : "#475569",
                border: "none",
                padding: "8px 16px",
                borderRadius: "20px",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Sedang Dikerjakan ({inProgress.length})
            </button>
            <button
              onClick={() => setTab("DONE")}
              style={{
                background: tab === "DONE" ? "#059669" : "#f1f5f9",
                color: tab === "DONE" ? "#fff" : "#475569",
                border: "none",
                padding: "8px 16px",
                borderRadius: "20px",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Tuntas ({completed.length})
            </button>
          </div>

          <section className={styles.queue} style={{ marginTop: "20px" }}>
            <div className={styles.queueHead}>
              <div>
                <p>PENUGASAN AKTIF RESMI</p>
                <h2>
                  Daftar Tiket Disposisi Camat <span>{filteredTickets.length}</span>
                </h2>
              </div>
            </div>

            <div className={styles.caseList}>
              {filteredTickets.length ? (
                filteredTickets.map((item) => {
                  const isDone = item.status === "SELESAI";
                  const isInProgress = item.status === "DIPROSES_OPD" || item.status === "SHARED_LOCK";
                  const tone = isDone ? "mint" : isInProgress ? "blue" : "coral";
                  const statusLabel = isDone ? "TUNTAS SELESAI" : isInProgress ? "SEDANG DIPROSES" : "PERLU KONFIRMASI";

                  return (
                    <article className={styles.case} key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", padding: "18px 22px" }}>
                      <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                        <div className={`${styles.caseMark} ${styles[tone]}`}>
                          <MapPinIcon size={20} weight="fill" />
                        </div>
                        <div className={styles.caseTitle}>
                          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>
                            {item.code} · Kategori {item.category}
                          </span>
                          <h3 style={{ margin: "2px 0", fontSize: "15px", fontWeight: 700 }}>
                            Disposisi Penanganan Lapangan
                          </h3>
                          <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                            <MapPinIcon size={13} style={{ verticalAlign: "middle" }} /> Lokasi: {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <span className={`${styles.priority} ${styles[tone]}`} style={{ padding: "6px 12px", fontSize: "11px", borderRadius: "12px" }}>
                          {statusLabel}
                        </span>

                        {/* Surat Tugas Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(item)}
                          style={{
                            background: "#f1f5f9",
                            color: "#0f172a",
                            border: "1px solid #cbd5e1",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <FileTextIcon size={16} weight="bold" /> Surat Tugas
                        </button>

                        {/* Quick Status Action Button */}
                        {!isDone && !isInProgress && (
                          <button
                            type="button"
                            onClick={() => triggerStartProgress(item.code)}
                            disabled={loadingCode === item.code}
                            style={{
                              background: "#2563eb",
                              color: "#fff",
                              border: "none",
                              padding: "8px 14px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <PlayIcon size={16} weight="fill" /> {loadingCode === item.code ? "Memproses…" : "Mulai Penanganan"}
                          </button>
                        )}

                        {!isDone && isInProgress && (
                          <Link
                            href={`/dashboard/laporan/${item.code}`}
                            style={{
                              background: "#059669",
                              color: "#fff",
                              textDecoration: "none",
                              padding: "8px 14px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <CheckIcon size={16} weight="bold" /> Unggah Bukti Selesai
                          </Link>
                        )}

                        {isDone && (
                          <Link
                            href={`/dashboard/laporan/${item.code}`}
                            className={styles.caseMore}
                            aria-label={`Detail ${item.code}`}
                          >
                            <ArrowRightIcon size={18} />
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })
              ) : (
                <p style={{ padding: "26px 23px", color: "#75828a", fontSize: 13 }}>
                  Belum ada penugasan untuk kategori filter ini.
                </p>
              )}
            </div>
          </section>
        </div>
      </section>

      {/* Surat Tugas Modal View */}
      {selectedTicket && (
        <SuratTugasModal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          report={{
            code: selectedTicket.code,
            category: selectedTicket.category,
            description: selectedTicket.description || `Penanganan teknis untuk aduan ${selectedTicket.category}`,
            latitude: selectedTicket.latitude,
            longitude: selectedTicket.longitude,
            priority: selectedTicket.priority || "Sedang",
            status: selectedTicket.status,
            createdAt: selectedTicket.createdAt || selectedTicket.updatedAt,
          }}
        />
      )}

      {/* Custom Confirmation / Alert Modal */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
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
