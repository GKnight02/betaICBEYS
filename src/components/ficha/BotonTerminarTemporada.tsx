"use client";

import { useState, useTransition } from "react";
import { BotonPixel } from "@/components/pixel/BotonPixel";
import { Sprite } from "@/components/pixel/Sprite";
import { COFRE } from "@/components/pixel/sprites";
import { sonar } from "@/components/pixel/sonido";
import { terminarTemporada } from "@/lib/acciones/ficha";

/** "Se acabó la temporada": el cofre se abre, la tarjeta se archiva y pasa al historial. */
export function BotonTerminarTemporada({ itemId }: { itemId: string }) {
  const [archivando, setArchivando] = useState(false);
  const [, startTransition] = useTransition();

  function archivar() {
    setArchivando(true);
    sonar("exito");
    setTimeout(() => startTransition(() => terminarTemporada(itemId)), 700);
  }

  if (archivando) {
    return (
      <span className="flex items-center gap-2" role="status">
        <Sprite sprite={COFRE} escala={3} fps={3} modo="una" />
        <span className="text-tenue">Archivando…</span>
      </span>
    );
  }
  return (
    <BotonPixel type="button" mini variante="exito" onClick={archivar}>
      Se acabó la temporada
    </BotonPixel>
  );
}
