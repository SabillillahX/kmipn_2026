"use client";

import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";

export default function SectionPortal() {
  const portalRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: portalRef, offset: ["start end", "end start"] });
  const ringScale = useSpring(useTransform(scrollYProgress, [0, .5, 1], [.68, 1, 1.24]), { stiffness: 90, damping: 22 });
  const ringRotate = useTransform(scrollYProgress, [0, 1], [-18, 28]);
  const wordX = useTransform(scrollYProgress, [0, 1], [90, -110]);

  return (
    <div className="section-portal" ref={portalRef} aria-hidden="true">
      <motion.div className="portal-kinetic-word" style={{ x: wordX }}>KLIRING</motion.div>
      <motion.div className="portal-rings" style={{ scale: ringScale, rotate: ringRotate }}>
        <span className="portal-ring ring-one" />
        <span className="portal-ring ring-two" />
        <span className="portal-ring ring-three" />
        <span className="portal-core"><i /> VERIFIED<br />PUBLIC SIGNAL</span>
      </motion.div>
    </div>
  );
}
