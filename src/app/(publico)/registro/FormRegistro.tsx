"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CodigosRecuperacion } from "@/components/CodigosRecuperacion";
import { Campo, MensajeEstado } from "@/components/formularios";
import { BotonPixel } from "@/components/pixel/BotonPixel";
import { registrar } from "@/lib/acciones/auth";
import { EDAD_MINIMA } from "@/lib/config";

export function FormRegistro() {
  const [estado, accion] = useActionState(registrar, null);

  if (estado?.ok && estado.codigos) {
    return (
      <CodigosRecuperacion
        codigos={estado.codigos}
        intro="¡Cuenta creada! Guarda estos códigos: son la única forma de recuperar tu cuenta si olvidas la contraseña. Cada uno sirve una sola vez."
        continuar="/yo"
      />
    );
  }

  const c = estado?.campos ?? {};
  return (
    <form action={accion} noValidate>
      <Campo
        etiqueta="Usuario"
        name="username"
        autoComplete="username"
        required
        minLength={3}
        maxLength={20}
        ayuda="3 a 20 caracteres: letras, números y _"
        error={c.username}
      />
      <Campo
        etiqueta="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={10}
        ayuda="Mínimo 10 caracteres. Mejor una frase larga que símbolos raros."
        error={c.password}
      />
      <Campo
        etiqueta="Repite la contraseña"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        error={c.confirm}
      />
      <label className="mb-3 flex items-start gap-2">
        <input type="checkbox" name="edad" className="mt-1 size-5 shrink-0 accent-[var(--acento)]" required />
        <span>
          Tengo {EDAD_MINIMA} años o más y acepto los <Link href="/terminos">términos</Link> y la{" "}
          <Link href="/privacidad">política de privacidad</Link>.
        </span>
      </label>
      {c.edad && <p className="error-campo">{c.edad}</p>}
      <MensajeEstado estado={estado} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <BotonPixel variante="primario" cargando="Creando…">
          Crear cuenta
        </BotonPixel>
        <Link href="/entrar">Ya tengo cuenta</Link>
      </div>
    </form>
  );
}
