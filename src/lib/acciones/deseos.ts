"use server";

import { and, eq, isNull, or } from "drizzle-orm";
import { refresh } from "next/cache";
import { requerirUsuario } from "@/lib/auth/sesiones";
import { db } from "@/lib/db";
import { wishes } from "@/lib/db/schema";
import { puedeVer } from "@/lib/permisos";
import { erroresDeCampo, esquemaDeseo, leerFormulario } from "@/lib/validacion";
import type { Estado } from "./estado";

/** El dueño añade deseos; un amigo añade ideas secretas que el dueño nunca ve. */
export async function agregarDeseo(ownerId: string, _: Estado, fd: FormData): Promise<Estado> {
  const yo = await requerirUsuario();
  const propio = ownerId === yo.id;
  if (!propio && !(await puedeVer(yo.id, ownerId, "gifts"))) return { error: "No tienes acceso a sus regalos" };
  const datos = esquemaDeseo.safeParse(leerFormulario(fd));
  if (!datos.success) return { campos: erroresDeCampo(datos.error) };
  await db.insert(wishes).values({ ...datos.data, ownerId, addedBy: propio ? null : yo.id });
  refresh();
  return { ok: true, mensaje: propio ? "Deseo añadido" : "Idea secreta guardada 🤫" };
}

/** "Lo regalo yo": lo ven los amigos, nunca el dueño. */
export async function reservarDeseo(wishId: string, reservar: boolean) {
  const yo = await requerirUsuario();
  const [w] = await db.select().from(wishes).where(eq(wishes.id, wishId));
  if (!w || w.ownerId === yo.id || !(await puedeVer(yo.id, w.ownerId, "gifts"))) return;
  await db
    .update(wishes)
    .set({ claimedBy: reservar ? yo.id : null })
    .where(and(eq(wishes.id, wishId), reservar ? isNull(wishes.claimedBy) : eq(wishes.claimedBy, yo.id)));
  refresh();
}

export async function borrarDeseo(wishId: string) {
  const yo = await requerirUsuario();
  await db
    .delete(wishes)
    .where(
      and(
        eq(wishes.id, wishId),
        or(and(eq(wishes.ownerId, yo.id), isNull(wishes.addedBy)), eq(wishes.addedBy, yo.id)),
      ),
    );
  refresh();
}
