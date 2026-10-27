"use client";

import { useActionState, useEffect, useRef } from "react";
import { Campo, MensajeEstado } from "@/components/formularios";
import { BotonPixel } from "@/components/pixel/BotonPixel";
import { agregarDeseo } from "@/lib/acciones/deseos";

export function FormDeseo({ ownerId }: { ownerId: string }) {
  const [estado, accion] = useActionState(agregarDeseo.bind(null, ownerId), null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (estado?.ok) form.current?.reset();
  }, [estado]);
  const c = estado?.campos ?? {};
  return (
    <form ref={form} action={accion} className="grid gap-x-4 @2xl:grid-cols-3">
      <Campo etiqueta="Qué" name="name" required maxLength={80} error={c.name} />
      <Campo etiqueta="Enlace" name="link" type="url" error={c.link} />
      <Campo etiqueta="Nota" name="note" maxLength={200} error={c.note} />
      <div className="@2xl:col-span-3">
        <MensajeEstado estado={estado} />
        <BotonPixel mini variante="primario" cargando="…">
          Añadir
        </BotonPixel>
      </div>
    </form>
  );
}
