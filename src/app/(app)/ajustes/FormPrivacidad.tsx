"use client";

import { useActionState, useState } from "react";
import { MensajeEstado } from "@/components/formularios";
import { BotonPixel } from "@/components/pixel/BotonPixel";
import { guardarPrivacidad } from "@/lib/acciones/ajustes";
import { NIVELES, SECCIONES, type Nivel, type Seccion } from "@/lib/config";
import type { Visibilidad } from "@/lib/permisos";

type Amigo = { id: string; nombre: string; username: string };

function ElegirAmigos({ name, amigos, elegidos }: { name: string; amigos: Amigo[]; elegidos: string[] }) {
  if (amigos.length === 0) return <p className="text-tenue">Aún no tienes amigos para elegir.</p>;
  return (
    <div className="flex flex-wrap">
      {amigos.map((a) => (
        <label key={a.id} className="opcion-pixel">
          <input type="checkbox" name={name} value={a.id} defaultChecked={elegidos.includes(a.id)} />
          <span>{a.nombre}</span>
        </label>
      ))}
    </div>
  );
}

export function FormPrivacidad({
  visibilidad,
  amigos,
  suposiciones,
  permitidos,
}: {
  visibilidad: Record<Seccion, Visibilidad>;
  amigos: Amigo[];
  suposiciones: "all" | "selected" | "off";
  permitidos: string[];
}) {
  const [estado, accion] = useActionState(guardarPrivacidad, null);
  const [niveles, setNiveles] = useState<Record<string, Nivel>>(
    Object.fromEntries(Object.entries(visibilidad).map(([s, v]) => [s, v.level])),
  );
  const [modoSup, setModoSup] = useState(suposiciones);

  return (
    <form action={accion}>
      <p className="mb-3 text-tenue">Elige quién ve cada sección de tu ficha. Las notas del ánimo son siempre solo tuyas.</p>
      {(Object.keys(SECCIONES) as Seccion[]).map((s) => (
        <fieldset key={s} className="mb-4">
          <legend className="etiqueta">{SECCIONES[s].nombre}</legend>
          <div className="flex flex-wrap">
            {SECCIONES[s].opciones.map((n) => (
              <label key={n} className="opcion-pixel">
                <input
                  type="radio"
                  name={`nivel_${s}`}
                  value={n}
                  checked={niveles[s] === n}
                  onChange={() => setNiveles((v) => ({ ...v, [s]: n }))}
                />
                <span>{NIVELES[n]}</span>
              </label>
            ))}
          </div>
          {niveles[s] === "selected" && (
            <div className="mt-2 ml-2">
              <ElegirAmigos name={`elegidos_${s}`} amigos={amigos} elegidos={visibilidad[s].allowed} />
            </div>
          )}
        </fieldset>
      ))}

      <fieldset className="mb-4">
        <legend className="etiqueta">Suposiciones sobre mí</legend>
        <div className="flex flex-wrap">
          {(
            [
              ["all", "Amigos y grupos"],
              ["selected", "Solo amigos elegidos"],
              ["off", "Desactivadas"],
            ] as const
          ).map(([v, t]) => (
            <label key={v} className="opcion-pixel">
              <input type="radio" name="suposiciones" value={v} checked={modoSup === v} onChange={() => setModoSup(v)} />
              <span>{t}</span>
            </label>
          ))}
        </div>
        {modoSup === "selected" && (
          <div className="mt-2 ml-2">
            <ElegirAmigos name="permitidos" amigos={amigos} elegidos={permitidos} />
          </div>
        )}
      </fieldset>

      <MensajeEstado estado={estado} />
      <BotonPixel variante="primario" cargando="Guardando…">
        Guardar privacidad
      </BotonPixel>
    </form>
  );
}
