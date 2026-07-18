"use client";

import React, { useState } from "react";
import {
  LockKeyIcon,
  MapPinLineIcon,
  MapPinIcon,
  ClockIcon,
  VisorIcon,
  CameraIcon,
  NavigationArrowIcon,
  CheckCircleIcon,
  ChartLineUpIcon,
  TicketIcon,
  FireIcon,
  ShieldCheckIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { DashboardSidebar } from "./DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import styles from "@/src/styles/dashboard.module.css";

interface DashboardLayoutProps {
  page: "eksekutif" | "opd";
}

function EksekutifContent() {
  const heatmapData = [
    { lat: -6.19283, lng: 106.82391, intensity: 0.8 },
    { lat: -6.19500, lng: 106.82100, intensity: 0.6 },
    { lat: -6.18500, lng: 106.83500, intensity: 0.9 },
    { lat: -6.21000, lng: 106.80000, intensity: 0.5 },
    { lat: -6.17000, lng: 106.84000, intensity: 0.7 },
    { lat: -6.22000, lng: 106.78000, intensity: 0.4 },
    { lat: -6.23000, lng: 106.85000, intensity: 0.65 },
    { lat: -6.16000, lng: 106.81000, intensity: 0.85 },
    { lat: -6.19000, lng: 106.87000, intensity: 0.55 },
    { lat: -6.24000, lng: 106.82000, intensity: 0.75 },
  ];

  const bbox = { minLng: 106.75, maxLng: 106.9, minLat: -6.25, maxLat: -6.15 };

  const heatmapGradients = heatmapData.map(point => {
    const x_pct = ((point.lng - bbox.minLng) / (bbox.maxLng - bbox.minLng)) * 100;
    const y_pct = ((bbox.maxLat - point.lat) / (bbox.maxLat - bbox.minLat)) * 100;
    
    const color1 = `rgba(239, 68, 68, ${point.intensity})`;
    const color2 = `rgba(249, 115, 22, ${point.intensity * 0.7})`;
    const color3 = `rgba(234, 179, 8, ${point.intensity * 0.3})`;
    
    return `radial-gradient(circle at ${x_pct.toFixed(2)}% ${y_pct.toFixed(2)}%, ${color1} 0%, ${color2} 15%, ${color3} 30%, transparent 50%)`;
  }).join(", ");

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>Dashboard Eksekutif</h1>
        <p className={styles.subtitle}>
          Ringkasan pemantauan isu regional dan manajemen penanganan
        </p>
      </header>

      <div className={styles.grid}>
        <Card className={`${styles.col12} border-slate-200 shadow-sm`}>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <ChartLineUpIcon size={24} weight="duotone" />
              Statistik Ringkas (Bulan Ini)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={styles.statIcon}>
                    <TicketIcon size={18} weight="bold" />
                  </div>
                  Tiket Masuk
                </div>
                <div className={styles.statValue}>1,284</div>
                <div className={`${styles.statTrend} ${styles.trendUp}`}>
                  <ChartLineUpIcon size={16} /> +12.5% dari bulan lalu
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={styles.statIcon}>
                    <ClockIcon size={18} weight="bold" />
                  </div>
                  Dalam Proses
                </div>
                <div className={styles.statValue}>432</div>
                <div className={`${styles.statTrend} ${styles.trendDown}`}>
                  <ChartLineUpIcon
                    size={16}
                    style={{ transform: "scaleY(-1)" }}
                  />{" "}
                  -3.2% efisiensi SLA
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={styles.statIcon}>
                    <CheckCircleIcon size={18} weight="bold" />
                  </div>
                  Selesai
                </div>
                <div className={styles.statValue}>852</div>
                <div className={`${styles.statTrend} ${styles.trendUp}`}>
                  <ChartLineUpIcon size={16} /> +8.1% tingkat penyelesaian
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${styles.col8} border-slate-200 shadow-sm`}>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FireIcon size={24} weight="duotone" />
              Peta Heatmap Konsentrasi Masalah
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <div className={styles.mapWrapper}>
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=106.75%2C-6.25%2C106.9%2C-6.15&layer=mapnik"
              className={styles.mapIframe}
              title="Heatmap"
              loading="lazy"
            />
            <div 
              className={styles.heatmapOverlay} 
              style={{ background: heatmapGradients }}
            />
            </div>
          </CardContent>
        </Card>

        <Card className={`${styles.col4} border-slate-200 shadow-sm`}>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <WarningCircleIcon size={24} weight="duotone" />
              Daftar Prioritas Teratas
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6 px-4">
            <div className={styles.list}>
            {[
              {
                id: "TK-2041",
                type: "Infrastruktur",
                score: "9.8",
                loc: "Kec. Sukamaju",
              },
              {
                id: "TK-2038",
                type: "Penerangan",
                score: "9.5",
                loc: "Jalan Merdeka",
              },
              {
                id: "TK-2022",
                type: "Kesehatan",
                score: "9.2",
                loc: "Pasar Rakyat",
              },
              {
                id: "TK-2015",
                type: "Kebersihan",
                score: "8.9",
                loc: "Bantaran Sungai",
              },
              {
                id: "TK-2011",
                type: "Infrastruktur",
                score: "8.7",
                loc: "Ring Road Utara",
              },
              {
                id: "TK-1998",
                type: "Infrastruktur",
                score: "8.4",
                loc: "Simpang Lima",
              },
            ].map((ticket, i) => (
              <div key={i} className={styles.listItem}>
                <div className={styles.itemInfo}>
                  <span className={styles.itemTitle}>
                    {ticket.id} - {ticket.type}
                  </span>
                  <div className={styles.itemMeta}>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <MapPinIcon size={14} /> {ticket.loc}
                    </span>
                    <span className={styles.itemScore}>
                      Skor: {ticket.score}
                    </span>
                  </div>
                </div>
                <div className={styles.actions}>
                  <Button size="sm">Setujui</Button>
                  <Button size="sm" variant="outline">Tolak</Button>
                </div>
              </div>
            ))}
          </div>
          </CardContent>
        </Card>

        <Card className={`${styles.col12} border-slate-200 shadow-sm`}>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheckIcon size={24} weight="duotone" />
              Manajemen Lock Flag (Zona Terkunci)
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-6">
            <div className={styles.mapWrapper} style={{ height: "360px" }}>
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=106.8%2C-6.22%2C106.85%2C-6.18&layer=mapnik"
              className={styles.mapIframe}
              title="Lock Flag Map"
              loading="lazy"
            />
            <div className={styles.lockOverlay}>
              <div className={styles.lockTitle}>
                <div className={styles.lockIndicator} />
                Zona Terkunci: Sukamaju Utara
              </div>
              <div className={styles.lockDetail}>
                <span>Kategori:</span>
                <strong>Infrastruktur (Jalan Rusak)</strong>
              </div>
              <div className={styles.lockDetail}>
                <span>Ditangani oleh:</span>
                <strong>Dinas Bina Marga</strong>
              </div>
              <div className={styles.lockDetail}>
                <span>Estimasi Selesai:</span>
                <strong>48 Jam (2 Hari)</strong>
              </div>
              <div className={styles.lockDetail}>
                <span>Status:</span>
                <strong style={{ fontWeight: 600 }}>Tim di lokasi</strong>
              </div>
            </div>
            <div
              className={styles.lockOverlay}
              style={{
                top: "auto",
                bottom: "1rem",
                right: "1rem",
                left: "auto",
              }}
            >
              <div className={styles.lockTitle}>
                <div className={styles.lockIndicator} />
                Zona Terkunci: Pasar Rakyat
              </div>
              <div className={styles.lockDetail}>
                <span>Kategori:</span>
                <strong>Kesehatan Lingkungan</strong>
              </div>
              <div className={styles.lockDetail}>
                <span>Ditangani oleh:</span>
                <strong>Dinas Lingkungan Hidup</strong>
              </div>
              <div className={styles.lockDetail}>
                <span>Estimasi Selesai:</span>
                <strong>12 Jam</strong>
              </div>
              <div className={styles.lockDetail}>
                <span>Status:</span>
                <strong style={{ fontWeight: 600 }}>
                  Menunggu alat berat
                </strong>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
}

function OpdContent() {
  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>Antrean Disposisi Masalah</h1>
        <p className={styles.subtitle}>
          Tiket prioritas yang membutuhkan inspeksi lapangan dan penanganan tim
          Anda.
        </p>
      </header>

      <div className={styles.queueList}>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className={styles.ticketCard}>
              <div className={styles.ticketContent}>
            <div className={styles.ticketHeader}>
              <div>
                <h3 className={styles.ticketTitle}>
                  Jalan Berlubang Parah di Ring Road Utara
                </h3>
                <div className={styles.ticketMeta}>
                  <Badge variant="secondary">#TK-2045</Badge>
                  <Badge variant="destructive">
                    Tingkat: Berat
                  </Badge>
                  <span className="text-sm text-slate-500">Dilaporkan 2 jam lalu</span>
                </div>
              </div>
            </div>

            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>
                  <MapPinLineIcon size={16} /> Koordinat Presisi
                </div>
                <div className={`${styles.detailValue} ${styles.coords}`}>
                  -6.19283, 106.82391
                </div>
              </div>
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>
                  <ClockIcon size={16} /> SLA Penanganan
                </div>
                <div
                  className={styles.detailValue}
                  style={{ fontWeight: 600 }}
                >
                  12 Jam Tersisa
                </div>
              </div>
            </div>

            <div className={styles.historyBox}>
              <div className={styles.historyTitle}>
                <VisorIcon size={16} /> Riwayat Tiket Berdekatan (Radius 500m)
              </div>
              <div className={styles.historyItem}>
                <span>TK-1980 - Saluran Air Mampet (102m)</span>
                <span style={{ fontWeight: 600 }}>
                  Selesai
                </span>
              </div>
              <div className={styles.historyItem}>
                <span>TK-1945 - Jalan Ambles (320m)</span>
                <span style={{ fontWeight: 600 }}>
                  Selesai
                </span>
              </div>
            </div>

            <div className={styles.ticketActions}>
              <Button>
                <NavigationArrowIcon size={18} /> Arahkan Tim Lapangan
              </Button>
              <Button variant="outline">
                <CheckCircleIcon size={18} /> Tandai Sedang Inspeksi
              </Button>
            </div>
          </div>

          <div className={styles.ticketMedia}>
            <img
              src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=400&h=400"
              alt="Bukti Masalah"
              className={styles.photo}
            />
            <div className={styles.photoLabel}>
              <CameraIcon size={14} /> Bukti Lampiran Warga
            </div>
          </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-slate-200">
          <CardContent className="p-0">
            <div
              className={styles.ticketCard}
            >
              <div className={styles.ticketContent}>
            <div className={styles.ticketHeader}>
              <div>
                <h3 className={styles.ticketTitle}>
                  Trotoar Amblas Dekat Galian
                </h3>
                <div className={styles.ticketMeta}>
                  <Badge variant="secondary">#TK-2041</Badge>
                  <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
                    Tingkat: Sedang
                  </Badge>
                  <span className="text-sm text-slate-500">Dilaporkan 5 jam lalu</span>
                </div>
              </div>
            </div>

            <div className={styles.lockAlert}>
              <LockKeyIcon size={20} weight="duotone" />
              <span>
                <strong>Status Terkunci:</strong> Penanganan ditunda karena
                wilayah ini masih dalam pengerjaan oleh{" "}
                <strong>Dinas Pekerjaan Umum (SLA: 24 Jam)</strong>.
              </span>
            </div>

            <div className={styles.detailGrid} style={{ marginBottom: "1rem" }}>
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>
                  <MapPinLineIcon size={16} /> Koordinat Presisi
                </div>
                <div className={`${styles.detailValue} ${styles.coords}`}>
                  -6.19500, 106.82100
                </div>
              </div>
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>
                  <ClockIcon size={16} /> SLA Penanganan
                </div>
                <div
                  className={styles.detailValue}
                  style={{ fontWeight: 600 }}
                >
                  Menunggu Lock Flag
                </div>
              </div>
            </div>

            <div className={styles.ticketActions}>
              <Button
                variant="outline"
                disabled
              >
                <LockKeyIcon size={18} /> Terkunci (Pending)
              </Button>
            </div>
          </div>

          <div className={styles.ticketMedia}>
            <img
              src="https://images.unsplash.com/photo-1584984647264-7e579da2b49f?auto=format&fit=crop&q=80&w=400&h=400"
              alt="Bukti Masalah"
              className={styles.photo}
            />
            <div className={styles.photoLabel}>
              <CameraIcon size={14} /> Bukti Lampiran Warga
            </div>
          </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export const DashboardLayout = ({ page }: DashboardLayoutProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isEksekutif = page === "eksekutif";

  return (
    <div className={styles.layout}>
      <DashboardSidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />

      <main className={styles.main}>
        {isEksekutif ? <EksekutifContent /> : <OpdContent />}
      </main>
    </div>
  );
};
