"use client";

import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { CrosshairIcon } from "@phosphor-icons/react/dist/csr/Crosshair";
import { MapPinIcon } from "@phosphor-icons/react/dist/csr/MapPin";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/csr/PaperPlaneTilt";
import { SealCheckIcon } from "@phosphor-icons/react/dist/csr/SealCheck";
import { motion } from "motion/react";
import { FormEvent, useRef, useState } from "react";

export default function ReportExperience() {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState("Belum ada titik dipilih");
  const [locating, setLocating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  function locate() {
    setLocating(true);
    if (!navigator.geolocation) {
      setLocationLabel("Deteksi lokasi tidak didukung");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const lat = coords.latitude;
        const lng = coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setLocationLabel(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        setLocating(false);
      },
      () => {
        setLocationLabel("Izin lokasi belum diberikan");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  const mapSrc =
    latitude !== null && longitude !== null
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.005}%2C${latitude - 0.003}%2C${longitude + 0.005}%2C${latitude + 0.003}&layer=mapnik&marker=${latitude}%2C${longitude}`
      : null;

  return (
    <section className="report-section" id="laporkan">
      <div className="report-glow glow-a" /><div className="report-glow glow-b" />
      <div className="shell report-shell">
        <motion.div className="report-message" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: .8 }}>
          <small>RUANG UNTUK SUARAMU</small>
          <h2>Ada yang perlu<br />kami <em>dengar?</em></h2>
          <p>Mulai dari satu titik di peta. Informasi yang jujur dan jelas membantu petugas bergerak lebih cepat.</p>
          <div className="privacy-note"><SealCheckIcon size={28} weight="duotone" /><span><b>Privasi terjaga</b><small>Kontakmu tidak akan ditampilkan ke publik.</small></span></div>
          <div className="report-signature">dari warga, untuk kota</div>
        </motion.div>

        <motion.div className="report-form-card" initial={{ opacity: 0, x: 55, rotate: 1.5 }} whileInView={{ opacity: 1, x: 0, rotate: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: .9, ease: [0.16, 1, 0.3, 1] }}>
          {submitted ? (
            <motion.div className="success-state" initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }}>
              <span><CheckCircleIcon size={42} weight="duotone" /></span>
              <small>LAPORAN TEREKAM</small>
              <h3>Suaramu sudah masuk.</h3>
              <p>Simpan kode ini untuk mengikuti setiap perkembangan laporan.</p>
              <strong>Distrac-260717</strong>
              <button type="button" onClick={() => setSubmitted(false)}>Buat laporan lainnya ↗</button>
            </motion.div>
          ) : (
            <form onSubmit={submit}>
              <div className="form-intro"><h3>Ceritakan yang terjadi.</h3><p>Kolom bertanda * wajib diisi.</p></div>
              <div className="field-grid">
                <label><span>Kategori *</span><select required defaultValue=""><option value="" disabled>Pilih masalah</option><option>Infrastruktur</option><option>Lingkungan &amp; kebersihan</option><option>Penerangan jalan</option><option>Kesehatan lingkungan</option></select></label>
                <label><span>Tingkat kerusakan *</span><select required defaultValue=""><option value="" disabled>Pilih tingkat</option><option>Ringan</option><option>Sedang</option><option>Berat</option></select></label>
              </div>
              <label className="location-field"><span>Lokasi kejadian *</span><button type="button" onClick={locate}><i><CrosshairIcon size={23} weight="duotone" /></i><span><b>{locating ? "Mencari titikmu..." : "Gunakan lokasi saya"}</b><small>{locationLabel}</small></span><MapPinIcon size={19} weight="fill" /></button></label>
              {mapSrc && (
                <div className="location-map-preview" ref={mapContainerRef}>
                  <iframe
                    title="Lokasi kejadian"
                    src={mapSrc}
                    width="100%"
                    height="220"
                    style={{ border: 0, borderRadius: 12 }}
                    loading="lazy"
                  />
                </div>
              )}
              <label className="full-field"><span>Deskripsi *</span><textarea required rows={4} placeholder="Apa yang terjadi? Sertakan patokan lokasi dan dampaknya..." /></label>
              <label className="full-field"><span>Nomor WhatsApp *</span><input required type="tel" inputMode="tel" placeholder="08xx xxxx xxxx" /></label>
              <button className="send-report" type="submit">Kirim suara saya <PaperPlaneTiltIcon size={20} weight="fill" /></button>
              <p className="form-disclaimer">Dengan mengirim, kamu menyetujui penggunaan data untuk verifikasi dan pembaruan laporan.</p>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
