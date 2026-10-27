"use client";

import { useActionState } from "react";
import { Campo, MensajeEstado } from "@/components/formularios";
import { BotonPixel } from "@/components/pixel/BotonPixel";
import { crearGrupo, generarInvitacion, unirseAGrupo } from "@/lib/acciones/social";

export function FormCrearGrupo() {
  const [estado, accion] = useActionState(crearGrupo, null);
  return (
    <form action={accion}>
      <Campo etiqueta="Nombre del grupo" name="name" required maxLength={40} error={estado?.campos?.name} placeholder="Los de la prepa" />
      <MensajeEstado estado={estado} />
      <BotonPixel variante="primario" cargando="Creando…">
        Crear
      </BotonPixel>
    </form>
  );
}

export function FormUnirse({ codigo = "" }: { codigo?: string }) {
  const [estado, accion] = useActionState(unirseAGrupo, null);
  return (
    <form action={accion}>
      <Campo etiqueta="Código de invitación" name="codigo" defaultValue={codigo} required placeholder="ABCD-EFGH" autoComplete="off" />
      <MensajeEstado estado={estado} />
      <BotonPixel variante="primario" cargando="Entrando…">
        Unirme
      </BotonPixel>
    </form>
  );
}

/** Genera un código de un solo uso y muestra el enlace para compartir. */
export function Invitar({ groupId }: { groupId: string }) {
  const [estado, accion] = useActionState(generarInvitacion.bind(null, groupId), null);
  const enlace =
    estado?.codigo && typeof window !== "undefined"
      ? `${window.location.origin}/grupos/unirse?codigo=${estado.codigo}`
      : null;
  return (
    <form action={accion}>
      <p className="mb-2 text-tenue">Cada código sirve para una sola persona. Al generar uno nuevo, el anterior deja de valer.</p>
      {estado?.codigo && (
        <div className="mb-2">
          <p className="titulo my-3 text-2xl tracking-widest text-acento">{estado.codigo}</p>
          {enlace && (
            <div className="flex flex-wrap items-center gap-2">
              <code className="chip break-all">{enlace}</code>
              <BotonPixel type="button" mini onClick={() => navigator.clipboard?.writeText(enlace)}>
                Copiar enlace
              </BotonPixel>
            </div>
          )}
        </div>
      )}
      <MensajeEstado estado={estado?.error ? estado : null} />
      <BotonPixel variante="primario" cargando="…">
        {estado?.codigo ? "Generar otro" : "Generar invitación"}
      </BotonPixel>
    </form>
  );
}
