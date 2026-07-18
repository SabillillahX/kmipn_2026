import Image from "next/image";
import splikEmblem from "../../public/brand/splik-emblem.png";

export default function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <a className={`brand ${inverse ? "brand-inverse" : ""}`} href="#beranda" aria-label="Distrac, kembali ke beranda">
      <Image
        className="brand-logo"
        src={splikEmblem}
        alt=""
        width={70}
        height={70}
        priority
        sizes="70px"
        aria-hidden="true"
      />
      <span className="brand-words">
        <strong>Distrac</strong>
      </span>
    </a>
  );
}
