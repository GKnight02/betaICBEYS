"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const COLORES = ["#ffcd75", "#a7f070", "#73eff7", "#ef7d57", "#b13e53", "#f4f4f4"];
const N = 14;

/** Estallido de partículas cuadradas y "+1 XP" flotante. Se dispara al cambiar `clave`. */
export function Estallido({ clave, texto = "+1 XP" }: { clave: number; texto?: string }) {
  const reducir = useReducedMotion();
  return (
    <AnimatePresence>
      {clave > 0 && (
        <motion.span
          key={clave}
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ delay: 1.1, duration: 0.3 }}
          aria-hidden
        >
          {!reducir &&
            Array.from({ length: N }, (_, i) => {
              const ang = (i / N) * Math.PI * 2;
              const dist = 50 + (i % 3) * 18;
              return (
                <motion.span
                  key={i}
                  className="absolute"
                  style={{ width: 6, height: 6, background: COLORES[i % COLORES.length] }}
                  initial={{ x: 0, y: 0, scale: 1 }}
                  animate={{ x: Math.cos(ang) * dist, y: Math.sin(ang) * dist, scale: 0 }}
                  transition={{ duration: 0.7, ease: (t: number) => Math.floor(t * 6) / 6 }}
                />
              );
            })}
          <motion.span
            className="titulo absolute text-sm"
            style={{ color: "var(--exito)", textShadow: "2px 2px 0 var(--negro)" }}
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: -48, opacity: 0 }}
            transition={{ duration: 1.2, ease: (t: number) => Math.floor(t * 8) / 8 }}
          >
            {texto}
          </motion.span>
        </motion.span>
      )}
    </AnimatePresence>
  );
}
