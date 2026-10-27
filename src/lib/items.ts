import { and, desc, eq, inArray, isNotNull, ne, or, sql } from "drizzle-orm";
import { db } from "./db";
import { items, itemResponses, users, type Item } from "./db/schema";
import { mesDe } from "./fechas";

export type ItemConAutor = Item & {
  autor: { username: string; displayName: string } | null;
  respuesta: { response: string; comment: string | null } | null;
};

/** Temporada activa = season sin end_date. Recurrente activa = el mes actual está en recurring_months. */
export function estaActivo(item: Pick<Item, "mode" | "endDate" | "recurringMonths">, fechaHoy: string) {
  switch (item.mode) {
    case "always":
      return true;
    case "season":
      return !item.endDate;
    case "recurring":
      return item.recurringMonths.includes(mesDe(fechaHoy));
    default:
      return false;
  }
}

export function clasificar<T extends Item>(lista: T[], fechaHoy: string) {
  const visibles = lista.filter((i) => i.status === "confirmed" || i.status === "partial");
  return {
    siempre: visibles.filter((i) => i.mode === "always"),
    temporada: visibles.filter((i) => i.mode === "season" && !i.endDate),
    recurrentesActivos: visibles.filter((i) => i.mode === "recurring" && estaActivo(i, fechaHoy)),
    recurrentesDormidos: visibles.filter((i) => i.mode === "recurring" && !estaActivo(i, fechaHoy)),
    noLeGusta: visibles.filter((i) => i.mode === "disliked"),
    historial: visibles
      .filter((i) => i.mode === "season" && i.endDate)
      .sort((a, b) => (b.endDate ?? "").localeCompare(a.endDate ?? "")),
    pendientes: lista.filter((i) => i.status === "pending"),
    rechazadas: lista.filter((i) => i.status === "rejected"),
  };
}

/**
 * Items de una ficha tal como los puede ver `viewerId`:
 * - el dueño ve todo;
 * - los demás ven confirmados y "más o menos", más sus propias suposiciones pendientes o rechazadas.
 * La visibilidad por sección se filtra con `categorias`.
 */
export async function itemsVisibles(viewerId: string, ownerId: string, categorias: Item["category"][]) {
  if (categorias.length === 0) return [] as ItemConAutor[];
  const propio = viewerId === ownerId;
  const filtroEstado = propio
    ? undefined
    : or(inArray(items.status, ["confirmed", "partial"]), eq(items.proposedBy, viewerId));

  const filas = await db
    .select({
      item: items,
      autorUsername: users.username,
      autorNombre: users.displayName,
      response: itemResponses.response,
      comment: itemResponses.comment,
    })
    .from(items)
    .leftJoin(users, eq(users.id, items.proposedBy))
    .leftJoin(itemResponses, eq(itemResponses.itemId, items.id))
    .where(and(eq(items.ownerId, ownerId), inArray(items.category, categorias), filtroEstado))
    .orderBy(desc(items.createdAt));

  return filas.map(
    (f): ItemConAutor => ({
      ...f.item,
      autor: f.autorUsername ? { username: f.autorUsername, displayName: f.autorNombre ?? f.autorUsername } : null,
      respuesta: f.response ? { response: f.response, comment: f.comment } : null,
    }),
  );
}

/** Puntos de "qué tanto te conozco": +1 XP por cada suposición confirmada. */
export async function puntosConocimiento(ownerId: string) {
  return db
    .select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatar: users.avatar,
      xp: sql<number>`count(*)::int`,
    })
    .from(items)
    .innerJoin(users, eq(users.id, items.proposedBy))
    .where(
      and(
        eq(items.ownerId, ownerId),
        eq(items.status, "confirmed"),
        isNotNull(items.proposedBy),
        ne(items.proposedBy, ownerId),
      ),
    )
    .groupBy(users.id, users.username, users.displayName, users.avatar)
    .orderBy(desc(sql`count(*)`));
}
