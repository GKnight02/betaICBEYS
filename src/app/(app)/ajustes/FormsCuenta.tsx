"use client";

import { useActionState } from "react";
import { CodigosRecuperacion } from "@/components/CodigosRecuperacion";
import { Campo, MensajeEstado } from "@/components/formularios";
import { BotonPixel } from "@/components/pixel/BotonPixel";
import { borrarCuenta, cambiarContrasena, regenerarCodigos } from "@/lib/acciones/ajustes";

export function FormContrasena() {
  const [estado, accion] = useActionState(cambiarContrasena, null);
  const c = estado?.campos ?? {};
  return (
    <form action={accion}>
      <Campo etiqueta="Contraseña actual" name="actual" type="password" autoComplete="current-password" required error={c.actual} />
      <Campo etiqueta="Nueva contraseña" name="password" type="password" autoComplete="new-password" required minLength={10} error={c.password} />
      <Campo etiqueta="Repite la nueva" name="confirm" type="password" autoComplete="new-password" required error={c.confirm} />
      <MensajeEstado estado={estado} />
      <BotonPixel variante="primario" cargando="Cambiando…">
        Cambiar contraseña
      </BotonPixel>
    </form>
  );
}

export function FormCodigos() {
  const [estado, accion] = useActionState(regenerarCodigos, null);
  if (estado?.ok && estado.codigos) {
    return <CodigosRecuperacion codigos={estado.codigos} intro="Códigos nuevos. Los anteriores ya no sirven. Guárdalos bien." />;
  }
  return (
    <form action={accion}>
      <Campo etiqueta="Tu contraseña" name="actual" type="password" autoComplete="current-password" required error={estado?.campos?.actual} />
      <BotonPixel cargando="Generando…" confirmar="Los códigos anteriores dejarán de funcionar. ¿Continuar?">
        Generar códigos nuevos
      </BotonPixel>
    </form>
  );
}

export function FormBorrarCuenta({ username }: { username: string }) {
  const [estado, accion] = useActionState(borrarCuenta, null);
  const c = estado?.campos ?? {};
  return (
    <form action={accion}>
      <p className="mb-2">
        Se borrarán tu ficha, tu ánimo, tus suposiciones pendientes, tus sesiones y tus relaciones. No se puede deshacer.
      </p>
      <Campo etiqueta={`Escribe «${username}» para confirmar`} name="confirmar" required autoComplete="off" error={c.confirmar} />
      <Campo etiqueta="Tu contraseña" name="actual" type="password" autoComplete="current-password" required error={c.actual} />
      <MensajeEstado estado={estado} />
      <BotonPixel variante="peligro" cargando="Borrando…" confirmar="Última oportunidad: ¿borrar tu cuenta para siempre?">
        Borrar mi cuenta
      </BotonPixel>
    </form>
  );
}
