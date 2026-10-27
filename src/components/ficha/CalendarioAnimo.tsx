import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfYear,
  format,
  getISODay,
  startOfMonth,
  startOfYear,
} from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { Sprite } from "@/components/pixel/Sprite";
import { ANIMO_SPRITES, COLOR_ANIMO_CSS } from "@/components/pixel/sprites";
import { ANIMOS } from "@/lib/config";
import { aDate } from "@/lib/fechas";

type MoodDia = { date: string; mood: number };

const DIAS = ["L", "M", "X", "J", "V", "S", "D"];

/** Calendario mensual que se pinta celda a celda al cargar. */
export function CalendarioMensual({
  mes,
  registros,
  hrefBase,
  fechaHoy,
}: {
  /** YYYY-MM */
  mes: string;
  registros: MoodDia[];
  hrefBase: string;
  fechaHoy: string;
}) {
  const inicio = startOfMonth(aDate(`${mes}-01`));
  const dias = eachDayOfInterval({ start: inicio, end: endOfMonth(inicio) });
  const porFecha = new Map(registros.map((r) => [r.date, r.mood]));
  const huecos = getISODay(inicio) - 1;
  const anterior = format(addMonths(inicio, -1), "yyyy-MM");
  const siguiente = format(addMonths(inicio, 1), "yyyy-MM");

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link href={`${hrefBase}?mes=${anterior}`} className="boton-pixel boton-mini" aria-label="Mes anterior">◀</Link>
        <h3 className="text-xl capitalize">{format(inicio, "MMMM yyyy", { locale: es })}</h3>
        <Link href={`${hrefBase}?mes=${siguiente}`} className="boton-pixel boton-mini" aria-label="Mes siguiente">▶</Link>
      </div>
      <div className="mx-auto grid max-w-xl grid-cols-7 gap-1.5 text-center sm:gap-2" role="grid" aria-label="Calendario de ánimo">
        {DIAS.map((d) => (
          <div key={d} className="titulo pb-1 text-xs text-tenue" role="columnheader">{d}</div>
        ))}
        {Array.from({ length: huecos }, (_, i) => (
          <div key={`h${i}`} />
        ))}
        {dias.map((dia, i) => {
          const f = format(dia, "yyyy-MM-dd");
          const mood = porFecha.get(f);
          return (
            <div
              key={f}
              role="gridcell"
              title={mood ? `${f}: ${ANIMOS[mood as keyof typeof ANIMOS]}` : f}
              className="pintar flex aspect-square flex-col items-center justify-center gap-0.5 transition-transform hover:-translate-y-0.5"
              style={{
                ["--i" as string]: i,
                background: mood ? COLOR_ANIMO_CSS[mood] : "var(--panel-2)",
                boxShadow:
                  f === fechaHoy
                    ? "0 0 0 3px var(--acento), 3px 3px 0 3px var(--acento-2)"
                    : "inset 0 -3px 0 0 color-mix(in srgb, var(--borde) 18%, transparent)",
                color: mood ? "var(--negro)" : "var(--tenue)",
              }}
            >
              <span className="text-sm leading-none font-bold">{dia.getDate()}</span>
              {mood && <Sprite sprite={ANIMO_SPRITES[mood]!} escala={1} modo="quieto" className="hidden sm:inline-block" />}
            </div>
          );
        })}
      </div>
      <Leyenda />
    </div>
  );
}

/** Vista anual: un píxel por día. */
export function AnioEnPixeles({ anio, registros }: { anio: number; registros: MoodDia[] }) {
  const inicio = startOfYear(new Date(anio, 0, 1, 12));
  const porFecha = new Map(registros.map((r) => [r.date, r.mood]));
  const meses = Array.from({ length: 12 }, (_, m) => {
    const ini = new Date(anio, m, 1, 12);
    return eachDayOfInterval({ start: ini, end: endOfMonth(ini) });
  });
  let indice = 0;
  return (
    <div>
      <div className="max-w-2xl">
        {/* Las columnas son fluidas: los píxeles crecen o se encogen con el panel */}
        <div className="grid gap-[2px] sm:gap-[3px]" style={{ gridTemplateColumns: "2.4rem repeat(31, minmax(0, 1fr))" }} aria-label={`Año ${anio} en píxeles`}>
          {meses.map((dias, m) => (
            <div key={m} className="contents">
              <span className="self-center pr-1.5 text-right text-xs leading-none text-tenue capitalize">
                {format(dias[0]!, "MMM", { locale: es })}
              </span>
              {Array.from({ length: 31 }, (_, d) => {
                const dia = dias[d];
                if (!dia) return <span key={d} />;
                const f = format(dia, "yyyy-MM-dd");
                const mood = porFecha.get(f);
                return (
                  <span
                    key={d}
                    title={mood ? `${f}: ${ANIMOS[mood as keyof typeof ANIMOS]}` : f}
                    className="pintar block aspect-square w-full"
                    style={{ ["--i" as string]: indice++ / 4, background: mood ? COLOR_ANIMO_CSS[mood] : "var(--panel-2)" }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-tenue">Días registrados: {registros.length} de {eachDayOfInterval({ start: inicio, end: endOfYear(inicio) }).length}</p>
      <Leyenda />
    </div>
  );
}

function Leyenda() {
  return (
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className="flex items-center gap-1">
          <span className="inline-block size-3.5" style={{ background: COLOR_ANIMO_CSS[n], boxShadow: "0 0 0 2px var(--borde)" }} />
          {ANIMOS[n as keyof typeof ANIMOS]}
        </span>
      ))}
    </div>
  );
}
