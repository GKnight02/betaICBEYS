"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

/** Texto que aparece letra a letra, como un NPC. */
export function TextoDialogo({ texto, velocidad = 28, className = "" }: { texto: string; velocidad?: number; className?: string }) {
  const reducir = useReducedMotion();
  const [n, setN] = useState(0);

  useEffect(() => {
    setN(0);
    if (reducir) return;
    const id = setInterval(() => {
      setN((v) => {
        if (v >= texto.length) {
          clearInterval(id);
          return v;
        }
        return v + 1;
      });
    }, velocidad);
    return () => clearInterval(id);
  }, [texto, velocidad, reducir]);

  const visible = reducir ? texto.length : n;
  return (
    <p className={className}>
      <span className="sr-only-pixel">{texto}</span>
      <span aria-hidden>
        {texto.slice(0, visible)}
        <span style={{ visibility: "hidden" }}>{texto.slice(visible)}</span>
        {visible >= texto.length && <span className="cursor-dialogo"> ▼</span>}
      </span>
    </p>
  );
}
