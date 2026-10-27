import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Sprite } from "@/components/pixel/Sprite";
import { COFRE } from "@/components/pixel/sprites";
import { aDate } from "@/lib/fechas";
import { clasificar, type ItemConAutor } from "@/lib/items";
import { TarjetaGusto } from "./TarjetaGusto";

type Props = {
  lista: ItemConAutor[];
  fechaHoy: string;
  propio: boolean;
  viewerId: string;
  mostrarCategoria?: boolean;
  textoVacio?: string;
};

function Rejilla({ items, ...resto }: { items: ItemConAutor[] } & Omit<Props, "lista" | "fechaHoy">) {
  return (
    <div className="rejilla-auto [--min:15rem]">
      {items.map((item, i) => (
        <TarjetaGusto key={item.id} item={item} indice={i} {...resto} />
      ))}
    </div>
  );
}

function mesAnio(fecha: string) {
  return format(aDate(fecha), "MMM yyyy", { locale: es });
}

/** Línea de tiempo de temporadas cerradas: «marzo a mayo: obsesión con el ramen». */
function Historial({ items }: { items: ItemConAutor[] }) {
  return (
    <ol className="relative ml-3 border-l-4 border-dashed border-panel-3 pl-6">
      {items.map((item, i) => (
        <li key={item.id} className="entra-rebote relative mb-3" style={{ ["--i" as string]: i }}>
          <span className="absolute top-0.5 -left-[2.2rem] bg-panel">
            <Sprite sprite={COFRE} escala={1} modo="quieto" />
          </span>
          <span className="text-tenue">
            {item.startDate ? mesAnio(item.startDate) : "?"} → {item.endDate ? mesAnio(item.endDate) : "?"}
          </span>
          <span className="ml-2">: {item.name}</span>
          {item.detail && <span className="text-tenue"> · {item.detail}</span>}
        </li>
      ))}
    </ol>
  );
}

function Subtitulo({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="titulo mt-7 mb-3 flex items-center gap-3 text-xs font-normal text-tenue uppercase first:mt-0">
      {children}
      <span className="separador flex-1" aria-hidden />
    </h3>
  );
}

export function SeccionItems({ lista, fechaHoy, propio, viewerId, mostrarCategoria, textoVacio }: Props) {
  const g = clasificar(lista, fechaHoy);
  const ahora = [...g.temporada, ...g.recurrentesActivos, ...g.siempre];
  const comun = { propio, viewerId, mostrarCategoria };
  const vacio = lista.length === 0;

  return (
    <div>
      {vacio && <p className="text-tenue">{textoVacio ?? "Todavía no hay nada aquí."}</p>}

      {g.pendientes.length > 0 && (
        <>
          <Subtitulo>{propio ? "¿Te lo crees? Suposiciones por responder" : "Tus suposiciones pendientes"}</Subtitulo>
          <Rejilla items={g.pendientes} {...comun} />
        </>
      )}
      {ahora.length > 0 && (
        <>
          <Subtitulo>Ahora</Subtitulo>
          <Rejilla items={ahora} {...comun} />
        </>
      )}
      {g.recurrentesDormidos.length > 0 && (
        <>
          <Subtitulo>Vuelve pronto</Subtitulo>
          <Rejilla items={g.recurrentesDormidos} {...comun} />
        </>
      )}
      {g.noLeGusta.length > 0 && (
        <>
          <Subtitulo>Ya no / no le gusta</Subtitulo>
          <Rejilla items={g.noLeGusta} {...comun} />
        </>
      )}
      {g.historial.length > 0 && (
        <>
          <Subtitulo>Historial de temporadas</Subtitulo>
          <Historial items={g.historial} />
          {propio && (
            <details className="mt-2">
              <summary className="cursor-pointer text-enlace">Gestionar temporadas archivadas</summary>
              <div className="mt-2">
                <Rejilla items={g.historial} {...comun} />
              </div>
            </details>
          )}
        </>
      )}
      {g.rechazadas.length > 0 && (
        <>
          <Subtitulo>{propio ? "Rechazadas (solo las ve quien las propuso)" : "Tus suposiciones rechazadas"}</Subtitulo>
          <Rejilla items={g.rechazadas} {...comun} />
        </>
      )}
    </div>
  );
}
