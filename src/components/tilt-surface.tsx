"use client";

import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import type { PointerEvent, ReactNode } from "react";

type TiltSurfaceProps = {
  children: ReactNode;
  className?: string;
  intensity?: number;
};

export default function TiltSurface({ children, className = "", intensity = 6 }: TiltSurfaceProps) {
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const rotateX = useSpring(rawRotateX, { stiffness: 210, damping: 23 });
  const rotateY = useSpring(rawRotateY, { stiffness: 210, damping: 23 });
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,.22), rgba(255,255,255,0) 42%)`;
  const reduceMotion = useReducedMotion();

  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch" || reduceMotion) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    rawRotateY.set((x - 0.5) * intensity * 2);
    rawRotateX.set((0.5 - y) * intensity * 2);
    glareX.set(x * 100);
    glareY.set(y * 100);
  };

  const reset = () => {
    rawRotateX.set(0);
    rawRotateY.set(0);
    glareX.set(50);
    glareY.set(50);
  };

  return (
    <motion.div
      className={`tilt-surface ${className}`}
      onPointerMove={move}
      onPointerLeave={reset}
      style={{ rotateX, rotateY, transformPerspective: 1100, transformStyle: "preserve-3d" }}
    >
      <motion.span className="tilt-glare" aria-hidden="true" style={{ background: glare }} />
      {children}
    </motion.div>
  );
}
