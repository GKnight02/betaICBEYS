"use client";

import { useActionState } from "react";
import { MensajeEstado } from "@/components/formularios";
import { BotonPixel } from "@/components/pixel/BotonPixel";
import { bloquearPorNombre } from "@/lib/acciones/social";

export function FormBloquear() {
  const [estado, accion] = useActionState(bloquearPorNombre, null);
  return (
    <form action={accion}>
      <label htmlFor="bloquear-usuario" className="etiqueta">
        Bloquear por nombre de usuario
      </label>
      <div className="flex gap-2">
        <input id="bloquear-usuario" name="username" required maxLength={20} className="campo-pixel" autoComplete="off" />
        <BotonPixel variante="peligro" cargando="…" confirmar="¿Seguro que quieres bloquear a este usuario?">
          Bloquear
        </BotonPixel>
      </div>
      <MensajeEstado estado={estado} />
    </form>
  );
}
