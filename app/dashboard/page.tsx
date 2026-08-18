"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRightIcon,
  BellIcon,
  CaretDownIcon,
  ChartLineUpIcon,
  CheckCircleIcon,
  ClockCountdownIcon,
  DotsThreeIcon,
  FileTextIcon,
  FunnelSimpleIcon,
  GridFourIcon,
  MapPinIcon,
  PlusIcon,
  TrendUpIcon,
  UserCircleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import splikEmblem from "../../public/brand/splik-emblem.png";
import styles from "./dashboard.module.css";

const cases = [
  { id: "SPL-2408", title: "Lampu jalan mati", area: "Jl. Melati Raya · RW 05", time: "8 menit lalu", type: "Penerangan", priority: "Tinggi", tone: "coral" },
  { id: "SPL-2407", title: "Tumpukan sampah pasar", area: "Pasar Sukamaju · Blok C", time: "23 menit lalu", type: "Kebersihan", priority: "Sedang", tone: "gold" },
  { id: "SPL-2406", title: "Lubang jalan dekat sekolah", area: "Jl. Pendidikan · RW 02", time: "41 menit lalu", type: "Infrastruktur", priority: "Tinggi", tone: "blue" },
  { id: "SPL-2405", title: "Saluran air tersumbat", area: "Kp. Cendana · RT 01", time: "1 jam lalu", type: "Drainase", priority: "Rendah", tone: "mint" },
];
void cases;

type Report = { id: string; code: string; category: string; description: string; latitude: number; longitude: number; priority: string; status: string; createdAt: string };
type DashboardData = { user: { name: string }; metrics: { total: number; actionable: number; inProgress: number; resolved: number }; categories: Record<string, number>; reports: Report[] };

const nav = [
  { label: "Ringkasan", icon: GridFourIcon },
  { label: "Laporan masuk", icon: FileTextIcon, count: "18" },
  { label: "Peta wilayah", icon: MapPinIcon },
  { label: "Analitik", icon: ChartLineUpIcon },
];

export default function DashboardPage() {
  const [active, setActive] = useState("Ringkasan");
  const [period, setPeriod] = useState("7 hari terakhir");
  const [data, setData] = useState<DashboardData | null>(null);
  useEffect(() => { fetch("/api/dashboard").then((response) => response.ok ? response.json() : null).then(setData).catch(() => setData(null)); }, []);
  const metrics = data?.metrics ?? { total: 0, actionable: 0, inProgress: 0, resolved: 0 };
  const reportRows = data?.reports ?? [];
  const categoryCount = (name: string) => data?.categories?.[name] ?? 0;

  return (
    <main className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/" aria-label="Kembali ke beranda SPLIK">
          <Image src={splikEmblem} alt="" width={48} height={48} priority />
          <span><strong>SPLIK</strong><small>ADMIN CONSOLE</small></span>
        </Link>

        <div className={styles.workspace}><span className={styles.liveDot} /> Kecamatan Sukamaju <CaretDownIcon size={13} /></div>
        <nav className={styles.navigation} aria-label="Menu dashboard">
          <p>RUANG KERJA</p>
          {nav.map(({ label, icon: Icon, count }) => (
            <button key={label} type="button" onClick={() => label === "Peta wilayah" ? window.location.assign("/dashboard/map") : setActive(label)} className={active === label ? styles.navActive : ""}>
              <Icon size={18} weight={active === label ? "fill" : "regular"} /><span>{label}</span>{count && <b>{reportRows.length}</b>}
            </button>
          ))}
          <p className={styles.settingsLabel}>PENGELOLAAN</p>
          <button type="button" onClick={() => setActive("Tim & petugas")} className={active === "Tim & petugas" ? styles.navActive : ""}><UserCircleIcon size={18} /><span>Tim & petugas</span></button>
          <button type="button" onClick={() => setActive("Pengaturan")} className={active === "Pengaturan" ? styles.navActive : ""}><DotsThreeIcon size={20} /><span>Pengaturan</span></button>
        </nav>

        <div className={styles.operator}>
          <div className={styles.avatar}>{data?.user.name.slice(0, 2).toUpperCase() ?? "AD"}</div><span><b>{data?.user.name ?? "Memuat akun…"}</b><small>Admin layanan</small></span><DotsThreeIcon size={19} />
        </div>
      </aside>

      <section className={styles.content}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}><span>ADMIN /</span> {active.toUpperCase()}</div>
          <div className={styles.topActions}><button className={styles.iconButton} aria-label="Notifikasi"><BellIcon size={20} /><i /></button><Link href="/" className={styles.publicLink}>Lihat portal <ArrowRightIcon size={15} /></Link></div>
        </header>

        <div className={styles.pageHead}>
          <div><p className={styles.kicker}>PUSAT KENDALI LAYANAN</p><h1>Selamat pagi, {data?.user.name.split(" ")[0] ?? "Admin"}<span>.</span></h1><p>Berikut denyut layanan warga di Sukamaju hari ini.</p></div>
          <button className={styles.primaryButton} onClick={() => window.location.assign("/#laporkan")}><PlusIcon size={18} weight="bold" /> Buat laporan</button>
        </div>

        {active === "Laporan masuk" && <section className={styles.workPage}><div><p className={styles.kicker}>MANAJEMEN LAPORAN</p><h2>Semua laporan masuk</h2><p>Pilih laporan untuk memverifikasi, menugaskan petugas, dan memperbarui progres.</p></div><div className={styles.workList}>{reportRows.length ? reportRows.map((item) => <article key={item.id}><span><b>{item.code}</b><small>{item.category} · {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</small></span><strong>{item.description}</strong><em className={styles[`priority_${item.priority}`] ?? ""}>{item.status}</em><Link href={`/dashboard/laporan/${item.code}`}>Tangani →</Link></article>) : <div className={styles.emptyState}>Belum ada laporan. Coba kirim laporan dari portal publik untuk melihat data tampil di sini.</div>}</div></section>}
        {active === "Tim & petugas" && <section className={styles.workPage}><div><p className={styles.kicker}>PENGELOLAAN AKUN</p><h2>Tim & petugas</h2><p>Kelola siapa yang dapat mengakses dan menangani laporan SPLIK.</p></div><div className={styles.teamCard}><div className={styles.teamAvatar}>{data?.user.name.slice(0, 2).toUpperCase() ?? "AD"}</div><span><b>{data?.user.name ?? "Admin Lokal"}</b><small>Administrator layanan · Akses penuh</small></span><em>AKTIF</em></div><div className={styles.emptyState}>Penambahan petugas akan tersedia setelah database tersambung. Akun lokal ini hanya dipakai untuk pengembangan.</div></section>}
        {active === "Pengaturan" && <section className={styles.workPage}><div><p className={styles.kicker}>KONFIGURASI SISTEM</p><h2>Pengaturan layanan</h2><p>Periksa status koneksi dan atur identitas layanan.</p></div><div className={styles.settingsGrid}><article><b>Mode aplikasi</b><span>{data?.user.name === "Admin Lokal" ? "Pengembangan lokal" : "Terhubung ke database"}</span></article><article><b>Peta laporan</b><span>OpenStreetMap aktif</span></article><article><b>Autentikasi</b><span>Email & password internal</span></article></div><button className={styles.logoutButton} onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.assign("/login"); }}>Keluar dari dashboard</button></section>}
        <div hidden={active !== "Ringkasan" && active !== "Analitik"}>
          <section className={styles.metrics}>
            <article className={`${styles.metric} ${styles.metricPrimary}`}><div className={styles.metricTop}><span>Total laporan</span><span className={styles.metricIcon}><FileTextIcon size={19} /></span></div><strong>{metrics.total}</strong><p><TrendUpIcon size={14} weight="bold" /> <b>Data aktual</b> dari database</p><div className={styles.spark}><i /><i /><i /><i /><i /><i /><i /></div></article>
            <article className={styles.metric}><div className={styles.metricTop}><span>Butuh tindakan</span><span className={`${styles.metricIcon} ${styles.coralIcon}`}><WarningCircleIcon size={20} /></span></div><strong>{metrics.actionable}</strong><p className={styles.alertText}>Laporan baru dan belum selesai</p><div className={styles.progress}><i style={{ width: `${metrics.total ? (metrics.actionable / metrics.total) * 100 : 0}%` }} /></div></article>
            <article className={styles.metric}><div className={styles.metricTop}><span>Sedang diproses</span><span className={`${styles.metricIcon} ${styles.blueIcon}`}><ClockCountdownIcon size={20} /></span></div><strong>{metrics.inProgress}</strong><p><b>Status</b> ditangani petugas</p><div className={styles.progress}><i style={{ width: `${metrics.total ? (metrics.inProgress / metrics.total) * 100 : 0}%` }} /></div></article>
            <article className={styles.metric}><div className={styles.metricTop}><span>Tuntas 7 hari ini</span><span className={`${styles.metricIcon} ${styles.mintIcon}`}><CheckCircleIcon size={20} /></span></div><strong>{metrics.resolved}</strong><p><TrendUpIcon size={14} weight="bold" /> <b>Data aktual</b> penyelesaian</p><div className={styles.progress}><i style={{ width: `${metrics.total ? (metrics.resolved / metrics.total) * 100 : 0}%` }} /></div></article>
          </section>

          <section className={styles.insights}>
            <article className={styles.chartCard}>
              <div className={styles.cardHead}><div><p>ARUS LAPORAN</p><h2>Masuk vs terselesaikan</h2></div><button onClick={() => setPeriod(period === "7 hari terakhir" ? "30 hari terakhir" : "7 hari terakhir")}>{period} <CaretDownIcon size={14} /></button></div>
              <div className={styles.chartLegend}><span><i className={styles.legendLime} /> Masuk</span><span><i className={styles.legendBlue} /> Terselesaikan</span></div>
              <div className={styles.lineChart}><div className={styles.gridLines} /><svg viewBox="0 0 650 185" preserveAspectRatio="none" aria-label="Grafik laporan mingguan" role="img"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#c4f458" stopOpacity=".28" /><stop offset="1" stopColor="#c4f458" stopOpacity="0" /></linearGradient></defs><path d="M0 143 C45 126, 58 145, 98 119 S148 90, 185 111 S235 140, 275 83 S325 91, 362 100 S410 55, 452 67 S500 97, 543 49 S600 64, 650 21 L650 185 L0 185Z" fill="url(#area)" /><path d="M0 143 C45 126, 58 145, 98 119 S148 90, 185 111 S235 140, 275 83 S325 91, 362 100 S410 55, 452 67 S500 97, 543 49 S600 64, 650 21" fill="none" stroke="#b9ee4d" strokeWidth="3" /><path d="M0 159 C38 142, 65 158, 98 139 S153 125, 185 130 S238 146, 275 116 S325 110, 362 121 S415 90, 452 99 S507 117, 543 78 S598 87, 650 62" fill="none" stroke="#4d9bff" strokeWidth="3" strokeDasharray="5 5" /></svg><div className={styles.chartDays}><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span><span>Min</span></div></div>
            </article>
            <article className={styles.categoryCard}><div className={styles.cardHead}><div><p>SEBARAN LAPORAN</p><h2>Kategori teratas</h2></div><button aria-label="Opsi"><DotsThreeIcon size={20} /></button></div><div className={styles.donut}><span><b>{metrics.total}</b><small>LAPORAN</small></span></div><div className={styles.categories}><p><i className={styles.dotCoral} /> Infrastruktur <b>{categoryCount("Infrastruktur")}</b></p><p><i className={styles.dotGold} /> Kebersihan <b>{categoryCount("Lingkungan & kebersihan")}</b></p><p><i className={styles.dotBlue} /> Penerangan <b>{categoryCount("Penerangan jalan")}</b></p><p><i className={styles.dotMint} /> Kesehatan <b>{categoryCount("Kesehatan lingkungan")}</b></p></div></article>
          </section>

          <section className={styles.queue}>
            <div className={styles.queueHead}><div><p>PERLU DITINDAKLANJUTI</p><h2>Antrean laporan terbaru <span>{reportRows.length}</span></h2></div><div><button className={styles.filter}><FunnelSimpleIcon size={16} /> Filter</button><Link href="/dashboard/map" className={styles.viewAll}>Buka peta <ArrowRightIcon size={15} /></Link></div></div>
            <div className={styles.caseList}>{reportRows.length ? reportRows.map((item) => { const tone = item.priority === "tinggi" ? "coral" : item.priority === "rendah" ? "mint" : "gold"; return <article className={styles.case} key={item.id}><div className={`${styles.caseMark} ${styles[tone]}`}><MapPinIcon size={18} weight="fill" /></div><div className={styles.caseTitle}><span>{item.code} · {item.category}</span><h3>{item.description}</h3><p><MapPinIcon size={13} /> {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}</p></div><time>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</time><span className={`${styles.priority} ${styles[tone]}`}>{item.priority}</span><Link className={styles.caseMore} aria-label={`Tangani ${item.code}`} href={`/dashboard/laporan/${item.code}`}><ArrowRightIcon size={18} /></Link></article>; }) : <p style={{ padding: "26px 23px", color: "#75828a", fontSize: 12 }}>Belum ada laporan. Laporan dari portal warga akan muncul otomatis di sini.</p>}</div>
          </section>
        </div>
      </section>
    </main>
  );
}
