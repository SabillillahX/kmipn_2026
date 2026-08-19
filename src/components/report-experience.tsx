"use client";

import { CheckCircleIcon } from "@phosphor-icons/react/dist/csr/CheckCircle";
import { CrosshairIcon } from "@phosphor-icons/react/dist/csr/Crosshair";
import { MapPinIcon } from "@phosphor-icons/react/dist/csr/MapPin";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/csr/PaperPlaneTilt";
import { SealCheckIcon } from "@phosphor-icons/react/dist/csr/SealCheck";
import { Copy } from "@phosphor-icons/react/dist/csr/Copy";
import { motion } from "motion/react";
import { FormEvent, useEffect, useRef, useState } from "react";

export default function ReportExperience() {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState("Belum ada titik dipilih");
  const [locating, setLocating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  function handleCopy() {
    navigator.clipboard.writeText(reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => {
      const L = (window as any).L;
      if (!L) return;

      const defaultLat = latitude ?? -7.06580;
      const defaultLng = longitude ?? 110.42918;

      const map = L.map("map-picker").setView([defaultLat, defaultLng], 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
      }).addTo(map);

      const pinIcon = L.divIcon({
        html: `<svg width="30" height="42" viewBox="0 0 30 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M15 0C6.71573 0 0 6.71573 0 15C0 26.25 15 42 15 42C15 42 30 26.25 30 15C30 6.71573 23.2843 0 15 0ZM15 20.25C12.1005 20.25 9.75 17.8995 9.75 15C9.75 12.1005 12.1005 9.75 15 9.75C17.8995 9.75 20.25 12.1005 20.25 15C20.25 17.8995 17.8995 20.25 15 20.25Z" fill="#c94e40"/>
               </svg>`,
        className: "",
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      });

      const marker = L.marker([defaultLat, defaultLng], { draggable: true, icon: pinIcon }).addTo(map);

      const updatePosition = (lat: number, lng: number) => {
        setLatitude(lat);
        setLongitude(lng);
        setCoordinates({ latitude: lat, longitude: lng });
        setLocationLabel(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      };

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        updatePosition(pos.lat, pos.lng);
      });

      map.on("click", (e: any) => {
        marker.setLatLng(e.latlng);
        updatePosition(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
    };
    document.head.appendChild(script);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      document.head.removeChild(link);
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (latitude !== null && longitude !== null && mapRef.current && markerRef.current) {
      mapRef.current.setView([latitude, longitude], 16);
      markerRef.current.setLatLng([latitude, longitude]);
    }
  }, [latitude, longitude]);

  function locate() {
    setLocating(true);
    if (!navigator.geolocation) {
      setLocationLabel("Deteksi lokasi tidak didukung");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocationLabel(`${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
        setCoordinates({ latitude: coords.latitude, longitude: coords.longitude });
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
        setLocating(false);
      },
      () => {
        setLocationLabel("Izin lokasi belum diberikan");
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
              <strong style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                {reference}
                <button type="button" onClick={handleCopy} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: "4px", display: "inline-flex", alignItems: "center" }}>
                  <Copy size={20} />
                </button>
              </strong>
              {copied && (
                <p style={{ color: "#22c55e", fontSize: "0.85rem", margin: "4px 0 0 0", textAlign: "center" }}>
                  kode telah tersalin
                </p>
              )}
              <button type="button" onClick={() => setSubmitted(false)}>Buat laporan lainnya ↗</button>
            </motion.div>
          ) : (
            <form onSubmit={submit}>
              <div className="form-intro"><h3>Ceritakan yang terjadi.</h3><p>Kolom bertanda * wajib diisi.</p></div>
              <div className="field-grid">
                <label><span>Kategori *</span><select name="category" required defaultValue=""><option value="" disabled>Pilih masalah</option><option>Infrastruktur</option><option>Lingkungan & kebersihan</option><option>Penerangan jalan</option><option>Kesehatan lingkungan</option></select></label>
                <label><span>Tingkat kerusakan *</span><select name="severity" required defaultValue=""><option value="" disabled>Pilih tingkat</option><option>Ringan</option><option>Sedang</option><option>Berat</option></select></label>
              </div>
              <label className="location-field"><span>Lokasi kejadian *</span><button type="button" onClick={locate}><i><CrosshairIcon size={23} weight="duotone" /></i><span><b>{locating ? "Mencari titikmu..." : "Gunakan lokasi saya"}</b><small>{locationLabel}</small></span><MapPinIcon size={19} weight="fill" /></button></label>
              <div style={{ width: "100%", height: "300px", marginTop: "10px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e2e8f0", zIndex: 10, position: "relative" }}>
                <div id="map-picker" style={{ width: "100%", height: "100%" }} />
              </div>
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
