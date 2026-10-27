import { cookies } from "next/headers";

/** Zona horaria del visitante (cookie `tz` que pone el navegador) o la de la app. */
export async function zonaHoraria() {
  const tz = (await cookies()).get("tz")?.value;
  if (tz) {
    try {
      new Intl.DateTimeFormat("en", { timeZone: tz });
      return tz;
    } catch {}
  }
  return process.env.APP_TIMEZONE || "UTC";
}

export function fechaEn(zona: string, fecha = new Date()) {
  // en-CA formatea como YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha);
}

/** Fecha de hoy (YYYY-MM-DD) en la zona del visitante. */
export async function hoy() {
  return fechaEn(await zonaHoraria());
}

export function mesDe(fecha: string) {
  return Number(fecha.slice(5, 7));
}

/** Primer y último día (YYYY-MM-DD) de un mes `YYYY-MM`. */
export function rangoMes(mes: string): [string, string] {
  const [y, m] = mes.split("-").map(Number);
  const ultimo = new Date(Date.UTC(y!, m!, 0)).getUTCDate();
  return [`${mes}-01`, `${mes}-${String(ultimo).padStart(2, "0")}`];
}

/** Primer y último día (YYYY-MM-DD) de un año. */
export function rangoAnio(anio: number | string): [string, string] {
  return [`${anio}-01-01`, `${anio}-12-31`];
}

/** Crea un Date a mediodía local para evitar saltos de día al formatear. */
export function aDate(fecha: string) {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(y!, m! - 1, d!, 12);
}
