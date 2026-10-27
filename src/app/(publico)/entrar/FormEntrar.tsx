"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Campo, MensajeEstado } from "@/components/formularios";
import { BotonPixel } from "@/components/pixel/BotonPixel";
import { entrar } from "@/lib/acciones/auth";

export function FormEntrar({ siguiente }: { siguiente: string }) {
  const [estado, accion] = useActionState(entrar, null);
  return (
    <form action={accion}>
      <input type="hidden" name="siguiente" value={siguiente} />
      <Campo etiqueta="Usuario" name="username" autoComplete="username" required />
      <Campo etiqueta="Contraseña" name="password" type="password" autoComplete="current-password" required />
      <MensajeEstado estado={estado} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <BotonPixel variante="primario" cargando="Entrando…">
          Entrar
        </BotonPixel>
        <div className="flex flex-col text-right">
          <Link href="/registro">Crear cuenta</Link>
          <Link href="/recuperar">Olvidé mi contraseña</Link>
        </div>
      </div>
    </form>
  );
}
