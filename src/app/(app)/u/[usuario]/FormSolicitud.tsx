"use client";

import { useActionState } from "react";
import { MensajeEstado } from "@/components/formularios";
import { BotonPixel } from "@/components/pixel/BotonPixel";
import { enviarSolicitud } from "@/lib/acciones/social";

export function FormSolicitud({ username }: { username?: string }) {
  const [estado, accion] = useActionState(enviarSolicitud, null);
  if (username) {
    return (
      <form action={accion}>
        <input type="hidden" name="username" value={username} />
        <BotonPixel mini variante="exito" cargando="…">
          + Solicitar amistad
        </BotonPixel>
        <MensajeEstado estado={estado} />
      </form>
    );
  }
  return (
    <form action={accion}>
      <label htmlFor="buscar-usuario" className="etiqueta">
        Nombre de usuario exacto
      </label>
      <div className="flex gap-2">
        <input id="buscar-usuario" name="username" required maxLength={20} className="campo-pixel" placeholder="su_usuario" autoComplete="off" />
        <BotonPixel variante="primario" cargando="…">
          Enviar
        </BotonPixel>
      </div>
      <MensajeEstado estado={estado} />
    </form>
  );
}
