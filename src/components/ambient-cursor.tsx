"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useState } from "react";

export default function AmbientCursor() {
  const pointerX = useMotionValue(-400);
  const pointerY = useMotionValue(-400);
  const x = useSpring(pointerX, { stiffness: 72, damping: 22, mass: 0.55 });
  const y = useSpring(pointerY, { stiffness: 72, damping: 22, mass: 0.55 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reducedMotion.matches) return;

    const handlePointer = (event: PointerEvent) => {
      pointerX.set(event.clientX);
      pointerY.set(event.clientY);
      setVisible(true);
    };
    const hide = () => setVisible(false);

    window.addEventListener("pointermove", handlePointer, { passive: true });
    document.documentElement.addEventListener("mouseleave", hide);
    return () => {
      window.removeEventListener("pointermove", handlePointer);
      document.documentElement.removeEventListener("mouseleave", hide);
    };
  }, [pointerX, pointerY]);

  return (
    <motion.div
      aria-hidden="true"
      className="ambient-cursor"
      style={{ x, y, opacity: visible ? 1 : 0 }}
    />
  );
}
