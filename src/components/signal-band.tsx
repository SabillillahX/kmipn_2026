import { BellRingingIcon } from "@phosphor-icons/react/dist/ssr/BellRinging";

export default function SignalBand() {
  return (
    <section className="signal-band" aria-label="Pembaruan layanan">
      <div className="signal-label"><BellRingingIcon size={18} weight="fill" /> Pembaruan</div>
      <div className="signal-window">
        <div className="signal-track">
          <span>91% laporan bulan ini selesai ditangani</span><i>✦</i>
          <span>386 laporan duplikat berhasil digabung</span><i>✦</i>
          <span>Rata-rata disposisi hanya 4,2 jam</span><i>✦</i>
          <span>91% laporan bulan ini selesai ditangani</span><i>✦</i>
          <span>386 laporan duplikat berhasil digabung</span><i>✦</i>
          <span>Rata-rata disposisi hanya 4,2 jam</span><i>✦</i>
        </div>
      </div>
    </section>
  );
}
