import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import Brand from "./brand";

export default function SiteFooter() {
  return (
    <footer id="bantuan">
      <div className="shell footer-cta">
        <div><small>SUDAH PERNAH MELAPOR?</small><h2>Ikuti perjalanannya.</h2></div>
        <form id="cek-status"><MagnifyingGlassIcon size={20} weight="bold" /><input aria-label="Kode laporan" placeholder="Masukkan kode laporan" /><button type="submit">Lacak <ArrowUpRightIcon size={18} weight="bold" /></button></form>
      </div>
      <div className="footer-main">
        <div className="footer-orbit" aria-hidden="true" />
        <div className="shell footer-grid">
          <div className="footer-brand"><Brand inverse /><p>Kanal resmi pelaporan publik yang menyatukan suara warga, data, dan tindakan pemerintah kecamatan.</p></div>
          <div><strong>Navigasi</strong><a href="#beranda">Beranda</a><a href="#peta-laporan">Peta laporan</a><a href="#transparansi">Transparansi</a><a href="#cara-kerja">Cara kerja</a></div>
          <div><strong>Layanan</strong><a href="#laporkan">Buat laporan</a><a href="#cek-status">Cek status</a><a href="#bantuan">Pusat bantuan</a><a href="#bantuan">Privasi</a></div>
          <div><strong>Hubungi kami</strong><p>Senin—Jumat<br />08.00—16.00 WIB</p><a href="mailto:layanan@splik.go.id">layanan@splik.go.id</a><a href="tel:112">Darurat 112</a></div>
        </div>
        <div className="shell footer-bottom"><span>© 2026 Pemerintah Kecamatan Sukamaju</span><span className="footer-motto">Transparan. Terukur. Terhubung.</span><a href="#beranda">Kembali ke atas ↑</a></div>
      </div>
    </footer>
  );
}
