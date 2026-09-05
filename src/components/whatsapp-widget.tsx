"use client";

import { WhatsappLogo } from "@phosphor-icons/react";

export default function WhatsAppWidget() {
  const waNumber = "6285183011370";
  const defaultMessage = encodeURIComponent(
    `Halo Admin SPLIK Kecamatan Sukamaju, saya ingin mengadukan laporan warga:\n\n` +
      `- Nama Pelapor: \n` +
      `- Kategori Aduan: (Infrastruktur / Sampah & Kebersihan / Penerangan Jalan / Kesehatan Lingkungan)\n` +
      `- Lokasi Keberadaan: \n` +
      `- Detail Deskripsi Kejadian: `
  );

  const waDirectUrl = `https://wa.me/${waNumber}?text=${defaultMessage}`;

  return (
    <a
      href={waDirectUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Lapor via WhatsApp Direct"
      style={{
        position: "fixed",
        bottom: "28px",
        right: "28px",
        zIndex: 9999,
        background: "#25D366",
        color: "#ffffff",
        border: "none",
        borderRadius: "50px",
        padding: "14px 24px",
        fontWeight: 750,
        fontSize: "14px",
        boxShadow: "0 10px 25px rgba(37, 211, 102, 0.45)",
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        cursor: "pointer",
        textDecoration: "none",
        transition: "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px) scale(1.03)";
        e.currentTarget.style.boxShadow = "0 14px 30px rgba(37, 211, 102, 0.6)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.boxShadow = "0 10px 25px rgba(37, 211, 102, 0.45)";
      }}
    >
      <WhatsappLogo size={26} weight="fill" />
      <span>Lapor via WhatsApp</span>
    </a>
  );
}
