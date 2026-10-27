"use client";

import { useActionState } from "react";
import { MensajeEstado } from "@/components/formularios";
import { BotonPixel } from "@/components/pixel/BotonPixel";
import { reportar } from "@/lib/acciones/moderacion";
import { MOTIVOS_REPORTE } from "@/lib/config";

export function ReportarBoton({ tipo, id }: { tipo: "user" | "item"; id: string }) {
  const [estado, accion] = useActionState(reportar, null);
  if (estado?.ok) return <MensajeEstado estado={estado} />;
  return (
    <details className="text-tenue">
      <summary className="cursor-pointer text-sm">⚑ Reportar</summary>
      <form action={accion} className="mt-2">
        <input type="hidden" name="targetType" value={tipo} />
        <input type="hidden" name="targetId" value={id} />
        <label className="etiqueta" htmlFor={`motivo-${id}`}>Motivo</label>
        <select id={`motivo-${id}`} name="reason" className="campo-pixel mb-2">
          {Object.entries(MOTIVOS_REPORTE).map(([v, t]) => (
            <option key={v} value={v}>{t}</option>
          ))}
        </select>
        <textarea name="detail" maxLength={500} rows={2} className="campo-pixel mb-2" placeholder="Cuéntanos qué pasa (opcional)" aria-label="Detalle" />
        <BotonPixel mini variante="peligro" cargando="Enviando…">Enviar reporte</BotonPixel>
        <MensajeEstado estado={estado} />
      </form>
    </details>
  );
}
