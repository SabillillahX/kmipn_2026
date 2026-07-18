"use client";

import { ListIcon } from "@phosphor-icons/react/dist/csr/List";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/csr/MagnifyingGlass";
import { XIcon } from "@phosphor-icons/react/dist/csr/X";
import { useState } from "react";
import Brand from "./brand";

const links = [
  ["Peta laporan", "#peta-laporan"],
  ["Transparansi", "#transparansi"],
  ["Cara kerja", "#cara-kerja"],
  ["Bantuan", "#bantuan"],
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>

      <header className="site-header">
        <div className="shell header-grid">
          <Brand inverse />
          <nav className="desktop-nav" aria-label="Navigasi utama">
            {links.map(([label, href]) => <a href={href} key={href}>{label}</a>)}
          </nav>
          <div className="header-actions">
            <a className="status-search" href="#cek-status">
              <MagnifyingGlassIcon size={18} weight="bold" />
              <span>Cek status</span>
            </a>
            <a className="cta-pill" href="#laporkan">Buat laporan <span>↗</span></a>
            <button className="menu-button" type="button" onClick={() => setOpen(true)} aria-label="Buka menu">
              <ListIcon size={25} weight="bold" />
            </button>
          </div>
        </div>
      </header>

      <div className={`mobile-menu ${open ? "is-open" : ""}`} aria-hidden={!open}>
        <div className="mobile-menu-top">
          <Brand inverse />
          <button type="button" onClick={() => setOpen(false)} aria-label="Tutup menu">
            <XIcon size={25} weight="bold" />
          </button>
        </div>
        <nav aria-label="Navigasi mobile">
          {links.map(([label, href], index) => (
            <a href={href} key={href} onClick={() => setOpen(false)}>
              <small>0{index + 1}</small><span>{label}</span><b>↗</b>
            </a>
          ))}
        </nav>
        <a className="mobile-report-button" href="#laporkan" onClick={() => setOpen(false)}>Laporkan masalah</a>
      </div>
    </>
  );
}
