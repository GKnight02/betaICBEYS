"use server";

import { and, eq, isNull } from "drizzle-orm";
import { refresh } from "next/cache";
import { requerirUsuario } from "@/lib/auth/sesiones";
import { INTENSIDADES } from "@/lib/config";
import { db } from "@/lib/db";
import { items, moods, users } from "@/lib/db/schema";
import { hoy } from "@/lib/fechas";
import { contieneOfensas } from "@/lib/filtro";
import { AVATARES } from "@/components/pixel/sprites";
import {
  erroresDeCampo,
  esquemaAnimo,
  esquemaItem,
  esquemaPerfil,
  leerFormulario,
} from "@/lib/validacion";
import { z } from "zod";
import type { Estado } from "./estado";

export async function guardarPerfil(_: Estado, fd: FormData): Promise<Estado> {
  const yo = await requerirUsuario();
  const datos = esquemaPerfil.safeParse(leerFormulario(fd));
  if (!datos.success) return { campos: erroresDeCampo(datos.error) };
  const avatar = datos.data.avatar in AVATARES ? datos.data.avatar : yo.avatar;
  await db.update(users).set({ ...datos.data, avatar }).where(eq(users.id, yo.id));
  refresh();
  return { ok: true, mensaje: "¡Perfil guardado!" };
}

/** Normaliza los campos de temporada según el modo elegido. */
async function camposDeModo(d: z.infer<typeof esquemaItem>) {
  return {
    startDate: d.mode === "season" ? (d.startDate ?? (await hoy())) : d.startDate,
    expectedEnd: d.mode === "season" ? d.expectedEnd : null,
    recurringMonths: d.mode === "recurring" ? [...new Set(d.recurringMonths)].sort((a, b) => a - b) : [],
  };
}

export async function guardarItem(_: Estado, fd: FormData): Promise<Estado> {
  const yo = await requerirUsuario();
  const datos = esquemaItem.safeParse(leerFormulario(fd, ["recurringMonths"]));
  if (!datos.success) return { campos: erroresDeCampo(datos.error) };
  const d = datos.data;
  const valores = {
    category: d.category,
    name: d.name,
    detail: d.detail,
    link: d.link,
    intensity: d.mode === "disliked" ? ("no_longer" as const) : d.intensity,
    mode: d.mode,
    ...(await camposDeModo(d)),
  };

  const id = fd.get("id");
  if (typeof id === "string" && id) {
    const [actual] = await db
      .select({ mode: items.mode })
      .from(items)
      .where(and(eq(items.id, id), eq(items.ownerId, yo.id)))
      .limit(1);
    if (!actual) return { error: "No encontramos ese elemento" };
    await db
      .update(items)
      .set({ ...valores, ...(d.mode !== "season" && { endDate: null }) })
      .where(and(eq(items.id, id), eq(items.ownerId, yo.id)));
  } else {
    await db.insert(items).values({ ...valores, ownerId: yo.id, status: "confirmed" });
  }
  refresh();
  return { ok: true, mensaje: id ? "Cambios guardados" : "¡Añadido a tu ficha!" };
}

/** Botón "se acabó la temporada": solo escribe end_date con la fecha de hoy. */
export async function terminarTemporada(id: string) {
  const yo = await requerirUsuario();
  await db
    .update(items)
    .set({ endDate: await hoy() })
    .where(and(eq(items.id, id), eq(items.ownerId, yo.id), eq(items.mode, "season"), isNull(items.endDate)));
  refresh();
}

/** Vuelve a abrir una temporada archivada como una nueva (conserva la anterior en el historial). */
export async function repetirTemporada(id: string) {
  const yo = await requerirUsuario();
  const [orig] = await db
    .select()
    .from(items)
    .where(and(eq(items.id, id), eq(items.ownerId, yo.id)))
    .limit(1);
  if (!orig) return;
  await db.insert(items).values({
    ownerId: yo.id,
    category: orig.category,
    name: orig.name,
    detail: orig.detail,
    link: orig.link,
    intensity: orig.intensity,
    mode: "season",
    startDate: await hoy(),
    status: "confirmed",
  });
  refresh();
}

export async function borrarItem(id: string) {
  const yo = await requerirUsuario();
  await db.delete(items).where(and(eq(items.id, id), eq(items.ownerId, yo.id)));
  refresh();
}

export async function cambiarIntensidad(id: string, fd: FormData) {
  const yo = await requerirUsuario();
  const valor = fd.get("intensity");
  if (typeof valor !== "string" || !(valor in INTENSIDADES)) return;
  await db
    .update(items)
    .set({ intensity: valor as keyof typeof INTENSIDADES })
    .where(and(eq(items.id, id), eq(items.ownerId, yo.id)));
  refresh();
}

export async function guardarAntojo(_: Estado, fd: FormData): Promise<Estado> {
  const yo = await requerirUsuario();
  const datos = z
    .object({ craving: z.string().trim().max(80, "Máximo 80 caracteres").optional() })
    .safeParse(leerFormulario(fd));
  if (!datos.success) return { campos: erroresDeCampo(datos.error) };
  const craving = datos.data.craving || null;
  if (craving && contieneOfensas(craving)) return { campos: { craving: "Ese texto contiene palabras no permitidas" } };
  await db
    .update(users)
    .set({ craving, cravingDate: craving ? await hoy() : null })
    .where(eq(users.id, yo.id));
  refresh();
  return { ok: true, mensaje: craving ? "¡Antojo anotado!" : "Antojo borrado" };
}

export async function guardarAnimo(_: Estado, fd: FormData): Promise<Estado> {
  const yo = await requerirUsuario();
  const datos = esquemaAnimo.safeParse(leerFormulario(fd, ["needs"]));
  if (!datos.success) return { campos: erroresDeCampo(datos.error) };
  const fecha = await hoy();
  const valores = { ...datos.data, notePrivate: true };
  await db
    .insert(moods)
    .values({ userId: yo.id, date: fecha, ...valores })
    .onConflictDoUpdate({ target: [moods.userId, moods.date], set: valores });
  refresh();
  return { ok: true, mensaje: "¡Ánimo de hoy guardado!" };
}
