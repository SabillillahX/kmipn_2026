"use client";

import Image from "next/image";
import { Printer, X, ShieldCheck, QrCode } from "@phosphor-icons/react";
import styles from "./surat-tugas-modal.module.css";
import logoGaruda from "../../public/brand/splik-emblem.png";

type ReportDetails = {
  code: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  priority: string;
  status: string;
  assignedTo?: string | null;
  createdAt: string;
  districtName?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  report: ReportDetails;
  disposisiNote?: string;
  assignedOpdName?: string;
  camatName?: string;
};

export default function SuratTugasModal({
  isOpen,
  onClose,
  report,
  disposisiNote,
  assignedOpdName,
  camatName = "Drs. H. Ahmad Fauzi, M.Si.",
}: Props) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const createdDate = new Date(report.createdAt);
  const formattedDate = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(isNaN(createdDate.getTime()) ? new Date() : createdDate);

  const cleanCode = report.code.replace(/^TK-/i, "").replace(/^REP-/i, "");
  const nomorSurat = `ST/045.2/SPLIK/2026/08/${cleanCode}`;
  const targetOpd = assignedOpdName || report.assignedTo || "Tim Operasional Teknis OPD";

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <header className={styles.topActions}>
          <div className={styles.topActionsTitle}>
            <ShieldCheck size={20} weight="fill" style={{ color: "#38bdf8" }} />
            <span>DOKUMEN RESMI DISPOSISI PEMERINTAH KOTA</span>
          </div>
          <div className={styles.btnGroup}>
            <button type="button" className={styles.printBtn} onClick={handlePrint}>
              <Printer size={18} weight="bold" /> Cetak / Download PDF
            </button>
            <button type="button" className={styles.closeBtn} onClick={onClose}>
              <X size={18} weight="bold" />
            </button>
          </div>
        </header>

        <main className={styles.body}>
          {/* Kop Surat */}
          <div className={styles.kop}>
            <Image
              src={logoGaruda}
              alt="Logo Daerah"
              className={styles.kopLogo}
              width={76}
              height={76}
            />
            <div className={styles.kopText}>
              <h4>PEMERINTAH KOTA SUKAMAIU</h4>
              <h2>KECAMATAN SUKAMAIU</h2>
              <p>
                Jl. Pradana Raya No. 1, Telp (024) 7654321 · Fax (024) 7654322 <br />
                Pos-el: camat@sukamajukota.go.id · Laman: www.sukamajukota.go.id / Kode Pos 50241
              </p>
            </div>
          </div>

          {/* Judul Surat */}
          <div className={styles.docTitle}>
            <h3>SURAT PERINTAH TUGAS (SPT)</h3>
            <p>Nomor: {nomorSurat}</p>
          </div>

          {/* Perintah & Penerima */}
          <p className={styles.sectionText}>
            Dasar: Peraturan Walikota Sukamaju tentang Penyelenggaraan Layanan Aduan Warga Berbasis Sistem Terpadu (SPLIK).
            Camat Kecamatan Sukamaju dengan ini memberikan perintah tugas kepada:
          </p>

          <table className={styles.tableDetails}>
            <tbody>
              <tr>
                <td>Kepada / Instansi</td>
                <td>:</td>
                <td>
                  <strong>{targetOpd}</strong>
                </td>
              </tr>
              <tr>
                <td>Nomor Tiket Aduan</td>
                <td>:</td>
                <td>
                  <code>{report.code}</code>
                </td>
              </tr>
              <tr>
                <td>Kategori Lapangan</td>
                <td>:</td>
                <td>
                  {report.category} (Prioritas:{" "}
                  <strong style={{ textTransform: "uppercase" }}>{report.priority}</strong>)
                </td>
              </tr>
              <tr>
                <td>Lokasi Kejadian</td>
                <td>:</td>
                <td>
                  Koordinat ({report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}) — Kec. Sukamaju
                </td>
              </tr>
              <tr>
                <td>Deskripsi Masalah</td>
                <td>:</td>
                <td>"{report.description}"</td>
              </tr>
              <tr>
                <td>Catatan Disposisi</td>
                <td>:</td>
                <td>
                  <div className={styles.noteBox}>
                    {disposisiNote || "Segera lakukan penanganan teknis di lokasi kejadian dan laporkan bukti penyelesaian pekerjaan."}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <p className={styles.sectionText}>
            Demikian Surat Perintah Tugas ini diterbitkan untuk dilaksanakan dengan penuh tanggung jawab serta melaporkan hasil pekerjaan dalam tempo paling lambat 24-48 jam.
          </p>

          {/* Tanda Tangan & Verification */}
          <div className={styles.footerSign}>
            <div className={styles.qrVerification}>
              <div className={styles.qrBox}>
                <QrCode size={48} weight="duotone" style={{ color: "#0f172a" }} />
              </div>
              <div className={styles.qrInfo}>
                <strong>Tersertifikasi Digital</strong>
                <span>BSRE / SPLIK GOV VERIFIED</span>
                <span style={{ fontSize: "0.68rem", color: "#64748b", display: "block" }}>
                  ID: {cleanCode}
                </span>
              </div>
            </div>

            <div className={styles.signBox}>
              <p>Sukamaju, {formattedDate}</p>
              <p>
                <strong>Camat Sukamaju</strong>
              </p>

              <div className={styles.stampWrapper}>
                <div className={styles.stempelBasah}>
                  PEMERINTAH KOTA
                  <div className={styles.stempelInner}>KEC. SUKAMAIU</div>
                  DISPOSISI RESMI
                </div>
                <div className={styles.ttdDigital}>Ahmad Fauzi</div>
              </div>

              <div className={styles.signName}>{camatName}</div>
              <div className={styles.signNip}>NIP. 19780512 200312 1 004</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
