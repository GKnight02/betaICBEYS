"use client";

import { useActionState, useState } from "react";
import { MensajeEstado } from "@/components/formularios";
import { Bateria } from "@/components/pixel/Bateria";
import { BotonPixel } from "@/components/pixel/BotonPixel";
import { Avatar, Sprite } from "@/components/pixel/Sprite";
import { ANIMO_SPRITES } from "@/components/pixel/sprites";
import { guardarAnimo } from "@/lib/acciones/ficha";
import { ANIMOS, ENERGIAS, NECESIDADES } from "@/lib/config";
import type { Mood } from "@/lib/db/schema";

export function FormAnimo({ actual, avatar }: { actual: Mood | null; avatar: string }) {
  const [estado, accion] = useActionState(guardarAnimo, null);
  const [mood, setMood] = useState(actual?.mood ?? 0);
  const c = estado?.campos ?? {};

  return (
    <form action={accion}>
      <div className="mb-5 flex items-end gap-4">
        {/* La key cambia con cada guardado para repetir el salto */}
        <span key={estado?.ok ? JSON.stringify(estado) : "quieto"} className={estado?.ok ? "saltar inline-block" : "inline-block"}>
          <Avatar id={avatar} escala={4} />
        </span>
        <p className="nota mb-1 [--c:var(--enlace)]">{actual ? "Ya registraste hoy; puedes cambiarlo." : "¿Cómo va el día?"}</p>
      </div>

      <fieldset className="mb-4">
        <legend className="etiqueta">Ánimo</legend>
        <div className="grid grid-cols-5 gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="opcion-pixel block">
              <input type="radio" name="mood" value={n} defaultChecked={actual?.mood === n} onChange={() => setMood(n)} />
              <span className="w-[calc(100%-8px)] flex-col justify-center gap-1! px-1! py-2!">
                <Sprite sprite={ANIMO_SPRITES[n]!} escala={3} fps={2} modo={mood === n ? "loop" : "quieto"} className={mood === n ? "latir" : ""} />
                <span className="truncate text-sm">{ANIMOS[n as keyof typeof ANIMOS]}</span>
              </span>
            </label>
          ))}
        </div>
        {c.mood && <p className="error-campo">{c.mood}</p>}
      </fieldset>

      <fieldset className="mb-4">
        <legend className="etiqueta">Energía</legend>
        <div className="flex flex-wrap gap-1">
          {[1, 2, 3].map((n) => (
            <label key={n} className="opcion-pixel">
              <input type="radio" name="energy" value={n} defaultChecked={actual?.energy === n} />
              <span>
                <Bateria nivel={n} escala={2} /> {ENERGIAS[n as keyof typeof ENERGIAS]}
              </span>
            </label>
          ))}
        </div>
        {c.energy && <p className="error-campo">{c.energy}</p>}
      </fieldset>

      <fieldset className="mb-4">
        <legend className="etiqueta">Qué necesito hoy</legend>
        <div className="flex flex-wrap">
          {Object.entries(NECESIDADES).map(([v, t]) => (
            <label key={v} className="opcion-pixel">
              <input type="checkbox" name="needs" value={v} defaultChecked={actual?.needs.includes(v)} />
              <span>{t}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label htmlFor="nota-animo" className="etiqueta">
        Nota (privada: solo tú la ves)
      </label>
      <textarea id="nota-animo" name="note" maxLength={500} rows={2} className="campo-pixel" defaultValue={actual?.note ?? ""} />
      {c.note && <p className="error-campo">{c.note}</p>}

      <MensajeEstado estado={estado} />
      <BotonPixel variante="primario" cargando="Guardando…" className="mt-3">
        Guardar ánimo
      </BotonPixel>
    </form>
  );
}
