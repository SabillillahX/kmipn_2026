import { ChatCircleDotsIcon } from "@phosphor-icons/react/dist/ssr/ChatCircleDots";
import { FingerprintIcon } from "@phosphor-icons/react/dist/ssr/Fingerprint";
import { SealCheckIcon } from "@phosphor-icons/react/dist/ssr/SealCheck";
import { StackIcon } from "@phosphor-icons/react/dist/ssr/Stack";
import Reveal from "./reveal";
import TiltSurface from "./tilt-surface";

const steps = [
  { n: "01", title: "Warga bersuara", text: "Pilih lokasi, ceritakan masalah, lalu kirim tanpa perlu membuat akun.", Icon: ChatCircleDotsIcon },
  { n: "02", title: "Sistem menyatukan", text: "Lokasi dan deskripsi serupa dikliring menjadi satu tiket induk yang kuat.", Icon: StackIcon },
  { n: "03", title: "Prioritas dihitung", text: "Urgensi ditentukan dari dampak teknis dan kerentanan wilayah secara objektif.", Icon: FingerprintIcon },
  { n: "04", title: "Perubahan dibuktikan", text: "OPD mengunggah bukti, status ditutup, dan setiap pelapor diberi kabar.", Icon: SealCheckIcon },
];

export default function ProcessSection() {
  return (
    <section className="process-section" id="cara-kerja">
      <div className="process-threads" aria-hidden="true"><span /><span /><span /></div>
      <div className="shell">
        <Reveal className="process-heading">
          <small>DI BALIK SATU LAPORAN</small>
          <h2>Satu alur.<br /><em>Tanpa suara yang hilang.</em></h2>
        </Reveal>
        <div className="process-grid">
          {steps.map(({ n, title, text, Icon }, index) => (
            <Reveal className="process-card-reveal" delay={index * .09} key={n}>
              <TiltSurface className="process-card" intensity={4.5}>
                <div className="process-card-top"><span>{n}</span><Icon size={34} weight="duotone" /></div>
                <h3>{title}</h3><p>{text}</p>
                <div className="process-line"><i /></div>
              </TiltSurface>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
