"use client";

import { useActionState } from "react";
import { MensajeEstado } from "@/components/formularios";
import { BotonPixel } from "@/components/pixel/BotonPixel";
import { guardarAntojo } from "@/lib/acciones/ficha";

export function FormAntojo({ actual }: { actual: string | null }) {
  const [estado, accion] = useActionState(guardarAntojo, null);
  return (
    <form action={accion}>
      <label htmlFor="antojo" className="etiqueta">
        😋 Antojo de hoy
      </label>
      <div className="flex items-start gap-2">
        <input id="antojo" name="craving" maxLength={80} defaultValue={actual ?? ""} className="campo-pixel" placeholder="Unos tacos al pastor…" />
        <BotonPixel mini cargando="…">OK</BotonPixel>
      </div>
      {estado?.campos?.craving && <p className="error-campo">{estado.campos.craving}</p>}
      <MensajeEstado estado={estado} />
    </form>
  );
}
