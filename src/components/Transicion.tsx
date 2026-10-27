"use client";

import { motion, useReducedMotion } from "motion/react";

// Cada página entra con un fundido corto hacia arriba
export function Transicion({ children }: { children: React.ReactNode }) {
  const reducir = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reducir ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.2, 0.7, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
