"use server";

import { and, count, eq, inArray } from "drizzle-orm";
import { refresh } from "next/cache";
import { limites } from "@/lib/auth/rate-limit";
import { requerirUsuario } from "@/lib/auth/sesiones";
import { MAX_SUPOSICIONES_PENDIENTES } from "@/lib/config";
import { db } from "@/lib/db";
import { itemResponses, items } from "@/lib/db/schema";
import { hoy } from "@/lib/fechas";
import { notificar } from "@/lib/notificaciones";
import { puedeProponer, puedeVer, seccionDeCategoria } from "@/lib/permisos";
import { erroresDeCampo, esquemaItem, esquemaRespuesta, leerFormulario } from "@/lib/validacion";
import { ERROR_LIMITE, type Estado } from "./estado";

export async function proponer(ownerId: string, _: Estado, fd: FormData): Promise<Estado> {
  const yo = await requerirUsuario();
  if (!(await puedeProponer(yo.id, ownerId))) {
    return { error: "No puedes proponer suposiciones en esta ficha." };
  }
  if (!(await limites.suposicion(yo.id)).success) return { error: ERROR_LIMITE };

  const datos = esquemaItem.safeParse(leerFormulario(fd, ["recurringMonths"]));
  if (!datos.success) return { campos: erroresDeCampo(datos.error) };
  const d = datos.data;

  // Proponer sobre una sección que no puedes ver revelaría que existe
  if (!(await puedeVer(yo.id, ownerId, seccionDeCategoria(d.category)))) {
    return { error: "No tienes acceso a esa sección de la ficha." };
  }

  const [pendientes] = await db
    .select({ n: count() })
    .from(items)
    .where(and(eq(items.ownerId, ownerId), eq(items.proposedBy, yo.id), eq(items.status, "pending")));
  if ((pendientes?.n ?? 0) >= MAX_SUPOSICIONES_PENDIENTES) {
    return { error: `Ya tienes ${MAX_SUPOSICIONES_PENDIENTES} suposiciones pendientes con esta persona. Espera a que responda.` };
  }

  const [nuevo] = await db
    .insert(items)
    .values({
      ownerId,
      category: d.category,
      name: d.name,
      detail: d.detail,
      link: d.link,
      intensity: d.mode === "disliked" ? "no_longer" : d.intensity,
      mode: d.mode,
      startDate: d.mode === "season" ? await hoy() : null,
      recurringMonths: d.mode === "recurring" ? d.recurringMonths : [],
      status: "pending",
      proposedBy: yo.id,
    })
    .returning({ id: items.id });
  await notificar(ownerId, "supposition", { from: yo.username, item: d.name, itemId: nuevo!.id });
  return { ok: true, mensaje: "¡Suposición enviada! Ahora a esperar si te la cree…" };
}

export async function responderSuposicion(itemId: string, _: Estado, fd: FormData): Promise<Estado> {
  const yo = await requerirUsuario();
  const datos = esquemaRespuesta.safeParse(leerFormulario(fd));
  if (!datos.success) return { campos: erroresDeCampo(datos.error) };
  const { response, comment } = datos.data;

  const [item] = await db
    .update(items)
    .set({ status: response })
    .where(and(eq(items.id, itemId), eq(items.ownerId, yo.id), eq(items.status, "pending")))
    .returning({ name: items.name, proposedBy: items.proposedBy });
  if (!item) return { error: "Esa suposición ya no está pendiente" };

  await db
    .insert(itemResponses)
    .values({ itemId, response, comment })
    .onConflictDoUpdate({ target: itemResponses.itemId, set: { response, comment, respondedAt: new Date() } });

  if (item.proposedBy) {
    await notificar(item.proposedBy, "supposition_answered", {
      from: yo.username,
      item: item.name,
      response,
      comment: comment ?? null,
    });
  }
  // Sin refresh(): el cliente refresca tras mostrar la animación de "+1 XP"
  const textos = { confirmed: "¡Confirmada! +1 XP para quien acertó", partial: "Marcada como «más o menos»", rejected: "Rechazada" };
  return { ok: true, mensaje: textos[response], xp: response === "confirmed" ? 1 : 0 };
}

/** Quien propuso puede retirar su suposición mientras esté pendiente o rechazada. */
export async function retirarSuposicion(itemId: string) {
  const yo = await requerirUsuario();
  await db
    .delete(items)
    .where(and(eq(items.id, itemId), eq(items.proposedBy, yo.id), inArray(items.status, ["pending", "rejected"])));
  refresh();
}
