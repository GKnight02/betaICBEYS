"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { MensajeEstado } from "@/components/formularios";
import { BotonPixel } from "@/components/pixel/BotonPixel";
import { Estallido } from "@/components/pixel/Estallido";
import { responderSuposicion } from "@/lib/acciones/suposiciones";

/** Confirmar, «más o menos» (con comentario) o rechazar una suposición. */
export function RespuestaSuposicion({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [estado, accion] = useActionState(responderSuposicion.bind(null, itemId), null);
  const [comentar, setComentar] = useState(false);
  const [estallido, setEstallido] = useState(0);

  useEffect(() => {
    if (!estado?.ok) return;
    if (estado.xp) setEstallido(Date.now());
    // Deja ver la animación antes de refrescar la ficha
    const t = setTimeout(() => router.refresh(), estado.xp ? 1400 : 400);
    return () => clearTimeout(t);
  }, [estado, router]);

  return (
    <form action={accion} className="relative mt-1">
      <Estallido clave={estallido} />
      {comentar && (
        <input
          name="comment"
          maxLength={200}
          placeholder="¿Qué parte sí y qué parte no?"
          className="campo-pixel mb-1"
          aria-label="Comentario"
        />
      )}
      <div className="flex flex-wrap gap-1">
        <BotonPixel mini variante="exito" name="response" value="confirmed">
          ✔ Confirmar
        </BotonPixel>
        {comentar ? (
          <BotonPixel mini name="response" value="partial">
            Enviar «más o menos»
          </BotonPixel>
        ) : (
          <BotonPixel mini type="button" onClick={() => setComentar(true)}>
            ~ Más o menos
          </BotonPixel>
        )}
        <BotonPixel mini variante="peligro" name="response" value="rejected">
          ✖ Rechazar
        </BotonPixel>
      </div>
      <MensajeEstado estado={estado} />
    </form>
  );
}
