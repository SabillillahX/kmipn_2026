"use client";

import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { CrosshairIcon } from "@phosphor-icons/react/dist/csr/Crosshair";
import { MapPinIcon } from "@phosphor-icons/react/dist/csr/MapPin";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/csr/PaperPlaneTilt";
import { SealCheckIcon } from "@phosphor-icons/react/dist/csr/SealCheck";
import { motion } from "motion/react";
import { FormEvent, useState } from "react";

export default function ReportExperience() {
  const [location, setLocation] = useState("Belum ada titik dipilih");
  const [locating, setLocating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  function locate() {
    setLocating(true);
    if (!navigator.geolocation) {
      setLocation("Deteksi lokasi tidak didukung");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
        setCoordinates({ latitude: coords.latitude, longitude: coords.longitude });
        setLocating(false);
      },
      () => {
        setLocation("Izin lokasi belum diberikan");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!coordinates) { setError("Pilih lokasi kejadian terlebih dahulu."); return; }
    setError(""); setSending(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category: form.get("category"), severity: form.get("severity"), description: form.get("description"), contactPhone: form.get("contactPhone"), ...coordinates }) });
    const data = await response.json();
    setSending(false);
    if (!response.ok) { setError(data.error ?? "Laporan belum dapat dikirim."); return; }
    setReference(data.code); setSubmitted(true);
  }

  return (
    <section className="report-section" id="laporkan">
      <div className="report-glow glow-a" /><div className="report-glow glow-b" />
      <div className="shell report-shell">
        <motion.div className="report-message" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .8 }}>
          <div className="chapter-mark"><span>04</span><i /></div>
          <small>RUANG UNTUK SUARAMU</small>
          <h2>Ada yang perlu<br />kami <em>dengar?</em></h2>
          <p>Mulai dari satu titik di peta. Informasi yang jujur dan jelas membantu petugas bergerak lebih cepat.</p>
          <div className="privacy-note"><SealCheckIcon size={28} weight="duotone" /><span><b>Privasi terjaga</b><small>Kontakmu tidak akan ditampilkan ke publik.</small></span></div>
          <div className="report-signature">dari warga, untuk kota</div>
        </motion.div>

        <motion.div className="report-form-card" initial={{ opacity: 0, x: 55, rotate: 1.5 }} whileInView={{ opacity: 1, x: 0, rotate: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: .9, ease: [0.16, 1, 0.3, 1] }}>
          <div className="form-corner-label">FORM / 01</div>
          {submitted ? (
            <motion.div className="success-state" initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }}>
              <span><CheckCircleIcon size={42} weight="duotone" /></span>
              <small>LAPORAN TEREKAM</small>
              <h3>Suaramu sudah masuk.</h3>
              <p>Simpan kode ini untuk mengikuti setiap perkembangan laporan.</p>
              <strong>{reference}</strong>
              <button type="button" onClick={() => setSubmitted(false)}>Buat laporan lainnya ↗</button>
            </motion.div>
          ) : (
            <form onSubmit={submit}>
              <div className="form-intro"><span><b>01</b> dari 01</span><h3>Ceritakan yang terjadi.</h3><p>Kolom bertanda * wajib diisi.</p></div>
              <div className="field-grid">
                <label><span>Kategori *</span><select name="category" required defaultValue=""><option value="" disabled>Pilih masalah</option><option>Infrastruktur</option><option>Lingkungan & kebersihan</option><option>Penerangan jalan</option><option>Kesehatan lingkungan</option></select></label>
                <label><span>Tingkat kerusakan *</span><select name="severity" required defaultValue=""><option value="" disabled>Pilih tingkat</option><option>Ringan</option><option>Sedang</option><option>Berat</option></select></label>
              </div>
              <label className="location-field"><span>Lokasi kejadian *</span><button type="button" onClick={locate}><i><CrosshairIcon size={23} weight="duotone" /></i><span><b>{locating ? "Mencari titikmu..." : "Gunakan lokasi saya"}</b><small>{location}</small></span><MapPinIcon size={19} weight="fill" /></button></label>
              <label className="full-field"><span>Deskripsi *</span><textarea name="description" required rows={4} minLength={10} placeholder="Apa yang terjadi? Sertakan patokan lokasi dan dampaknya..." /></label>
              <label className="full-field"><span>Nomor WhatsApp *</span><input name="contactPhone" required type="tel" inputMode="tel" placeholder="08xx xxxx xxxx" /></label>
              {error && <p className="form-disclaimer" role="alert" style={{ color: "#c94e40" }}>{error}</p>}
              <button className="send-report" disabled={sending} type="submit">{sending ? "Mengirim laporan…" : "Kirim suara saya"} <PaperPlaneTiltIcon size={20} weight="fill" /></button>
              <p className="form-disclaimer">Dengan mengirim, kamu menyetujui penggunaan data untuk verifikasi dan pembaruan laporan.</p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
