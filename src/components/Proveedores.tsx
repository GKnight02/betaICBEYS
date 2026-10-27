"use client";

import { MotionConfig } from "motion/react";

export function Proveedores({ children }: { children: React.ReactNode }) {
  // Con prefers-reduced-motion, Motion reduce las animaciones a fundidos
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
