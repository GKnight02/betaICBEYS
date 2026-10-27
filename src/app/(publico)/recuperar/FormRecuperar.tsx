"use client";

import { useActionState } from "react";
import { Campo, MensajeEstado } from "@/components/formularios";
import { BotonPixel } from "@/components/pixel/BotonPixel";
import { recuperarCuenta } from "@/lib/acciones/auth";

export function FormRecuperar() {
  const [estado, accion] = useActionState(recuperarCuenta, null);
  const c = estado?.campos ?? {};
  return (
    <form action={accion}>
      <Campo etiqueta="Usuario" name="username" autoComplete="username" required error={c.username} />
      <Campo
        etiqueta="Código de recuperación"
        name="codigo"
        placeholder="ABCDE-FGHIJ"
        required
        autoComplete="one-time-code"
        error={c.codigo}
      />
      <Campo
        etiqueta="Nueva contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={10}
        error={c.password}
      />
      <Campo etiqueta="Repite la contraseña" name="confirm" type="password" autoComplete="new-password" required error={c.confirm} />
      <MensajeEstado estado={estado} />
      <BotonPixel variante="primario" cargando="Comprobando…" className="mt-4">
        Cambiar contraseña
      </BotonPixel>
    </form>
  );
}
