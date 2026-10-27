import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Sprite } from "@/components/pixel/Sprite";
import { CORAZON, SUPOSICION } from "@/components/pixel/sprites";
import { BotonPixel } from "@/components/pixel/BotonPixel";
import { borrarItem, cambiarIntensidad, guardarItem, repetirTemporada } from "@/lib/acciones/ficha";
import { retirarSuposicion } from "@/lib/acciones/suposiciones";
import { CATEGORIAS, INTENSIDADES, MESES } from "@/lib/config";
import { aDate } from "@/lib/fechas";
import type { ItemConAutor } from "@/lib/items";
import { BotonTerminarTemporada } from "./BotonTerminarTemporada";
import { FormItem } from "./FormItem";
import { ReportarBoton } from "./ReportarBoton";
import { RespuestaSuposicion } from "./RespuestaSuposicion";

export function fechaCorta(fecha: string) {
  return format(aDate(fecha), "d MMM yyyy", { locale: es });
}

export function mesesTexto(meses: number[]) {
  return meses.map((m) => MESES[m - 1]?.slice(0, 3)).join(", ");
}

type Props = {
  item: ItemConAutor;
  /** Quien mira es el dueño de la ficha */
  propio: boolean;
  viewerId: string;
  indice?: number;
  mostrarCategoria?: boolean;
};

export function TarjetaGusto({ item, propio, viewerId, indice = 0, mostrarCategoria }: Props) {
  const esSuposicion = !!item.proposedBy && item.proposedBy !== item.ownerId;
  const pendiente = item.status === "pending";
  const soyAutor = item.proposedBy === viewerId;

  return (
    <article
      className="tarjeta tarjeta-viva entra-rebote @container flex flex-col gap-2"
      style={{ ["--i" as string]: indice, opacity: item.status === "rejected" ? 0.6 : 1 }}
    >
      <header className="flex items-start gap-3">
        {pendiente ? (
          <Sprite sprite={SUPOSICION} escala={2} fps={3} titulo="Suposición pendiente" />
        ) : item.intensity === "love" ? (
          <Sprite sprite={CORAZON} escala={3} titulo="Le encanta" className="latir" />
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 className="break-words">{item.name}</h3>
          <div className="-mx-1 mt-1 flex flex-wrap">
            {mostrarCategoria && <span className="chip">{CATEGORIAS[item.category]}</span>}
            {item.mode !== "disliked" && <span className="chip">{INTENSIDADES[item.intensity]}</span>}
            {item.mode === "season" && !item.endDate && <span className="chip chip-aviso">De temporada</span>}
            {item.mode === "recurring" && <span className="chip">Cada {mesesTexto(item.recurringMonths)}</span>}
            {item.status === "partial" && <span className="chip chip-aviso">Más o menos</span>}
            {item.status === "rejected" && <span className="chip chip-peligro">Rechazada</span>}
          </div>
        </div>
      </header>

      {item.detail && <p className="break-words">{item.category === "food" ? "☕ " : ""}{item.detail}</p>}
      {item.link && (
        <a href={item.link} target="_blank" rel="noopener noreferrer nofollow" className="break-all">
          ▶ Abrir enlace
        </a>
      )}
      {item.mode === "season" && item.startDate && (
        <p className="text-tenue">
          Desde {fechaCorta(item.startDate)}
          {item.endDate ? ` hasta ${fechaCorta(item.endDate)}` : item.expectedEnd ? ` · previsto hasta ${fechaCorta(item.expectedEnd)}` : ""}
        </p>
      )}
      {esSuposicion && item.autor && (
        <p className="text-tenue">
          ? Suposición de <Link href={`/u/${item.autor.username}`}>@{item.autor.username}</Link>
        </p>
      )}
      {item.respuesta?.comment && <p className="text-tenue">💬 «{item.respuesta.comment}»</p>}

      {/* Acciones del dueño */}
      {propio && pendiente && <RespuestaSuposicion itemId={item.id} />}
      {propio && !pendiente && (
        <div className="mt-auto flex flex-wrap items-center gap-1 pt-2">
          {item.mode === "season" && !item.endDate && <BotonTerminarTemporada itemId={item.id} />}
          {item.mode === "season" && item.endDate && (
            <form action={repetirTemporada.bind(null, item.id)}>
              <BotonPixel mini>Ha vuelto</BotonPixel>
            </form>
          )}
          {item.mode !== "disliked" && (
            <form action={cambiarIntensidad.bind(null, item.id)} className="flex items-center">
              <label className="sr-only-pixel" htmlFor={`int-${item.id}`}>Intensidad</label>
              <select id={`int-${item.id}`} name="intensity" defaultValue={item.intensity} className="campo-pixel w-auto! py-1! text-sm!">
                {Object.entries(INTENSIDADES).map(([v, t]) => (
                  <option key={v} value={v}>{t}</option>
                ))}
              </select>
              <BotonPixel mini>OK</BotonPixel>
            </form>
          )}
          <details className="order-last w-full">
            <summary className="cursor-pointer text-sm text-enlace">✎ Editar</summary>
            <div className="mt-2">
              <FormItem accion={guardarItem} tipo={item.category === "food" ? "food" : "likes"} item={item} textoBoton="Guardar cambios" />
            </div>
          </details>
          <form action={borrarItem.bind(null, item.id)}>
            <BotonPixel mini variante="peligro" confirmar={`¿Borrar «${item.name}»?`}>Borrar</BotonPixel>
          </form>
        </div>
      )}

      {/* Acciones de quien propuso */}
      {soyAutor && (pendiente || item.status === "rejected") && (
        <form action={retirarSuposicion.bind(null, item.id)}>
          <BotonPixel mini confirmar="¿Retirar esta suposición?">Retirar</BotonPixel>
        </form>
      )}

      {esSuposicion && !soyAutor && <ReportarBoton tipo="item" id={item.id} />}
    </article>
  );
}
