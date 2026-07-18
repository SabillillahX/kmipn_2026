"use client";

import { ArrowRightIcon } from "@phosphor-icons/react/dist/csr/ArrowRight";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/csr/ArrowUpRight";
import { BuildingsIcon } from "@phosphor-icons/react/dist/csr/Buildings";
import { MapPinIcon } from "@phosphor-icons/react/dist/csr/MapPin";
import { ShieldCheckIcon } from "@phosphor-icons/react/dist/csr/ShieldCheck";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef, type PointerEvent } from "react";

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const visualY = useTransform(scrollYProgress, [0, 1], [0, 185]);
  const visualRotate = useTransform(scrollYProgress, [0, 1], [0, -3]);
  const ornamentRotate = useTransform(scrollYProgress, [0, 1], [0, 42]);
  const smoothCopyY = useSpring(copyY, { stiffness: 90, damping: 24 });
  const rawTiltX = useMotionValue(0);
  const rawTiltY = useMotionValue(0);
  const tiltX = useSpring(rawTiltX, { stiffness: 170, damping: 24 });
  const tiltY = useSpring(rawTiltY, { stiffness: 170, damping: 24 });
  const reduceMotion = useReducedMotion();

  const tiltMap = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || reduceMotion) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    rawTiltY.set(x * 7);
    rawTiltX.set(y * -6);
  };

  const resetMap = () => {
    rawTiltX.set(0);
    rawTiltY.set(0);
  };

  return (
    <section className="hero" ref={sectionRef}>
      <motion.div className="hero-orbit orbit-a" style={{ rotate: ornamentRotate }} />
      <motion.div className="hero-orbit orbit-b" style={{ rotate: ornamentRotate }} />
      <div className="coordinate-stamp">06°12&apos;S — 106°49&apos;E</div>
      <div className="hero-ghost-word" aria-hidden="true">SPLIK</div>

      <div className="shell hero-layout">
        <motion.div className="hero-copy" style={{ y: smoothCopyY }}>
          <motion.div className="hero-kicker" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .7 }}>
            <span>01</span><i /> Pelayanan publik berbasis kliring
          </motion.div>
          <h1>
            <motion.span initial={{ y: 70, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: .85, ease: [0.16, 1, 0.3, 1] }}>
              Suaramu<br />menggerakkan
            </motion.span>
            <motion.em initial={{ y: 70, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: .85, delay: .1, ease: [0.16, 1, 0.3, 1] }}>
              kota.
            </motion.em>
          </h1>
          <motion.p initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .28 }}>
            Satu kanal untuk melapor, mengawal, dan melihat perubahan nyata di lingkunganmu—tanpa laporan ganda, tanpa tindak lanjut yang samar.
          </motion.p>
          <motion.div className="hero-ctas" initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .38 }}>
            <a className="hero-primary" href="#laporkan">Laporkan sekarang <ArrowUpRightIcon size={20} weight="bold" /></a>
            <a className="hero-secondary" href="#cara-kerja"><span className="play-dot">▶</span> Lihat cara kerjanya</a>
          </motion.div>
          <motion.div className="hero-assurance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .8, delay: .55 }}>
            <ShieldCheckIcon size={22} weight="duotone" />
            <span><strong>Aman & tanpa akun</strong><small>Nomor kontak hanya untuk pembaruan status.</small></span>
          </motion.div>
        </motion.div>

        <motion.div
          className="hero-visual-wrap"
          style={{ y: visualY, rotateZ: visualRotate, rotateX: tiltX, rotateY: tiltY, transformPerspective: 1350, transformStyle: "preserve-3d" }}
          id="peta-laporan"
          onPointerMove={tiltMap}
          onPointerLeave={resetMap}
        >
          <div className="map-depth-plane" aria-hidden="true" />
          <div className="map-index">PETA / 001</div>
          <div className="civic-map">
            <div className="map-topline">
              <span><i /> LIVE MAP</span>
              <span>28 laporan aktif</span>
            </div>
            <div className="map-field">
              <div className="map-scan" aria-hidden="true" />
              <div className="map-noise" aria-hidden="true" />
              <div className="map-grid-lines" />
              <div className="river-shape" />
              <div className="route route-a" />
              <div className="route route-b" />
              <div className="route route-c" />
              <span className="district-name name-a">Sukamaju Utara</span>
              <span className="district-name name-b">Pasar Rakyat</span>
              <motion.div className="premium-pin pin-a" animate={{ y: [0, -8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}>
                <MapPinIcon size={19} weight="fill" /><b>12</b><span />
              </motion.div>
              <motion.div className="premium-pin pin-b teal" animate={{ y: [0, -6, 0] }} transition={{ duration: 4.2, repeat: Infinity, delay: .5, ease: "easeInOut" }}>
                <MapPinIcon size={18} weight="fill" /><b>8</b><span />
              </motion.div>
              <motion.div className="premium-pin pin-c amber" animate={{ y: [0, -7, 0] }} transition={{ duration: 3.8, repeat: Infinity, delay: 1, ease: "easeInOut" }}>
                <MapPinIcon size={18} weight="fill" /><b>4</b><span />
              </motion.div>
              <div className="active-case-card">
                <span className="case-icon"><BuildingsIcon size={23} weight="duotone" /></span>
                <span className="case-copy"><small>PRIORITAS 01</small><strong>Jalan Merdeka berlubang</strong><em>12 laporan tergabung</em></span>
                <span className="case-score"><small>SKOR</small><b>92</b></span>
              </div>
              <div className="map-compass"><span>N</span><i /></div>
              <div className="data-beacon beacon-one" aria-hidden="true"><i /><span /></div>
              <div className="data-beacon beacon-two" aria-hidden="true"><i /><span /></div>
            </div>
          </div>
          <a className="floating-map-link" href="#transparansi">Buka peta publik <ArrowRightIcon size={17} weight="bold" /></a>
          <div className="map-ornament-dots" aria-hidden="true">••••••<br />••••••<br />••••••</div>
        </motion.div>
      </div>

      <div className="hero-bottom-line">
        <div className="shell"><span>Scroll untuk menjelajah</span><i /><span>Transparan • terukur • terhubung</span></div>
      </div>
    </section>
  );
}
