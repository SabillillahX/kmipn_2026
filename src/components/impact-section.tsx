import { ArrowUpRightIcon, ChartLineUpIcon, ClockCountdownIcon, StackIcon, UsersThreeIcon } from "@phosphor-icons/react/dist/ssr";
import Reveal from "./reveal";

const stats = [
  { value: "1.248", label: "suara warga diterima", note: "+18% bulan ini", Icon: UsersThreeIcon, tone: "blue" },
  { value: "386", label: "laporan serupa disatukan", note: "lebih efisien", Icon: StackIcon, tone: "mint" },
  { value: "4,2", suffix: "jam", label: "rata-rata waktu disposisi", note: "−31 menit", Icon: ClockCountdownIcon, tone: "sand" },
];

export default function ImpactSection() {
  return (
    <section className="impact-section" id="transparansi">
      <div className="shell">
        <Reveal className="editorial-heading">
          <div>
            <small>BUKAN SEKADAR ANGKA</small>
            <h2>Pelayanan yang bisa<br /><em>dilihat hasilnya.</em></h2>
          </div>
          <p>Setiap aksi tercatat. Setiap perkembangan terbuka. Data di bawah diperbarui langsung dari antrean layanan Kecamatan Sukamaju.</p>
        </Reveal>

        <div className="impact-layout">
          <Reveal className="big-stat" delay={.08}>
            <span className="big-stat-icon"><ChartLineUpIcon size={34} weight="duotone" /></span>
            <small>TINGKAT PENYELESAIAN / JULI</small>
            <strong>91<span>%</span></strong>
            <div className="completion-bar"><i /></div>
            <p><b>1.136</b> dari 1.248 laporan telah diselesaikan dan pelapor sudah menerima pembaruan.</p><br />
            <a href="#laporkan">Lihat laporan publik <ArrowUpRightIcon size={18} weight="bold" /></a>
            <div className="stat-orbit orbit-one" /><div className="stat-orbit orbit-two" />
          </Reveal>
          <div className="stat-stack">
            {stats.map(({ value, suffix, label, note, Icon, tone }, index) => (
              <Reveal className={`stat-row tone-${tone}`} delay={.13 + index * .08} key={label}>
                <span className="stat-icon"><Icon size={25} weight="duotone" /></span>
                <strong>{value}{suffix && <small>{suffix}</small>}</strong>
                <span className="stat-copy"><b>{label}</b><small>{note}</small></span>
                <span className="stat-index">0{index + 1}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
