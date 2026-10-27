import { and, eq, inArray, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { cache } from "react";
import { SECCIONES, type Nivel, type Seccion } from "./config";
import { db } from "./db";
import { blocks, friendships, groupMembers, sectionVisibility, users } from "./db/schema";

export type Relacion = {
  propio: boolean;
  bloqueado: boolean;
  amigos: boolean;
  pendiente: "enviada" | "recibida" | null;
  grupoComun: boolean;
};

export function parAmistad(x: string, y: string): [string, string] {
  return x < y ? [x, y] : [y, x];
}

/** Relación entre quien mira y el dueño de la ficha. Toda comprobación ocurre en el servidor. */
export const relacion = cache(async (viewerId: string, ownerId: string): Promise<Relacion> => {
  if (viewerId === ownerId) {
    return { propio: true, bloqueado: false, amigos: true, pendiente: null, grupoComun: true };
  }
  const [a, b] = parAmistad(viewerId, ownerId);
  const gb = alias(groupMembers, "gb");
  const [bloqueos, amistad, grupo] = await Promise.all([
    db
      .select({ x: blocks.blockerId })
      .from(blocks)
      .where(
        or(
          and(eq(blocks.blockerId, viewerId), eq(blocks.blockedId, ownerId)),
          and(eq(blocks.blockerId, ownerId), eq(blocks.blockedId, viewerId)),
        ),
      )
      .limit(1),
    db
      .select()
      .from(friendships)
      .where(and(eq(friendships.userA, a), eq(friendships.userB, b)))
      .limit(1),
    db
      .select({ g: groupMembers.groupId })
      .from(groupMembers)
      .innerJoin(gb, eq(gb.groupId, groupMembers.groupId))
      .where(and(eq(groupMembers.userId, viewerId), eq(gb.userId, ownerId)))
      .limit(1),
  ]);
  const f = amistad[0];
  return {
    propio: false,
    bloqueado: bloqueos.length > 0,
    amigos: f?.status === "accepted",
    pendiente: f?.status === "pending" ? (f.requestedBy === viewerId ? "enviada" : "recibida") : null,
    grupoComun: grupo.length > 0,
  };
});

export type Visibilidad = { level: Nivel; allowed: string[] };

export const visibilidades = cache(async (ownerId: string): Promise<Record<Seccion, Visibilidad>> => {
  const filas = await db.select().from(sectionVisibility).where(eq(sectionVisibility.userId, ownerId));
  const out = {} as Record<Seccion, Visibilidad>;
  for (const [sec, def] of Object.entries(SECCIONES) as [Seccion, (typeof SECCIONES)[Seccion]][]) {
    const fila = filas.find((f) => f.section === sec);
    out[sec] = { level: fila?.level ?? def.porDefecto, allowed: fila?.allowedUserIds ?? [] };
  }
  return out;
});

export function puedeVerCon(rel: Relacion, vis: Visibilidad, viewerId: string) {
  if (rel.propio) return true;
  if (rel.bloqueado) return false;
  switch (vis.level) {
    case "public":
      return true;
    case "friends":
      return rel.amigos;
    case "groups":
      return rel.amigos || rel.grupoComun;
    case "selected":
      return rel.amigos && vis.allowed.includes(viewerId);
    default:
      return false;
  }
}

export async function puedeVer(viewerId: string, ownerId: string, seccion: Seccion) {
  const [rel, vis] = await Promise.all([relacion(viewerId, ownerId), visibilidades(ownerId)]);
  return puedeVerCon(rel, vis[seccion], viewerId);
}

export async function puedeProponer(viewerId: string, ownerId: string) {
  const rel = await relacion(viewerId, ownerId);
  if (rel.propio || rel.bloqueado || !(rel.amigos || rel.grupoComun)) return false;
  const [owner] = await db
    .select({ modo: users.suppositions, permitidos: users.suppositionsAllowed })
    .from(users)
    .where(eq(users.id, ownerId))
    .limit(1);
  if (!owner || owner.modo === "off") return false;
  if (owner.modo === "selected") return owner.permitidos.includes(viewerId);
  return true;
}

/**
 * De una lista de amigos aceptados (sin bloqueos, porque bloquear borra la amistad),
 * devuelve los que dejan ver `seccion` a `viewerId`. Una sola consulta.
 */
export async function amigosQueMuestran(viewerId: string, amigoIds: string[], seccion: Seccion) {
  if (amigoIds.length === 0) return new Set<string>();
  const filas = await db
    .select()
    .from(sectionVisibility)
    .where(and(inArray(sectionVisibility.userId, amigoIds), eq(sectionVisibility.section, seccion)));
  const porId = new Map(filas.map((f) => [f.userId, f]));
  const rel: Relacion = { propio: false, bloqueado: false, amigos: true, pendiente: null, grupoComun: false };
  return new Set(
    amigoIds.filter((id) => {
      const f = porId.get(id);
      const vis = { level: f?.level ?? SECCIONES[seccion].porDefecto, allowed: f?.allowedUserIds ?? [] };
      return puedeVerCon(rel, vis, viewerId);
    }),
  );
}

/** Sección de la ficha a la que pertenece una categoría de item. */
export function seccionDeCategoria(categoria: string): Seccion {
  return categoria === "food" ? "food" : "likes";
}
