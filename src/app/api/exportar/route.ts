import { and, eq, isNull, or } from "drizzle-orm";
import { usuarioActual } from "@/lib/auth/sesiones";
import { amistadesDe, gruposDe } from "@/lib/consultas";
import { db } from "@/lib/db";
import { blocks, items, moods, notifications, sectionVisibility, wishes } from "@/lib/db/schema";

/** Exportar mis datos: todo lo mío en JSON (sin hashes ni datos privados de otros). */
export async function GET() {
  const yo = await usuarioActual();
  if (!yo) return new Response("No autorizado", { status: 401 });

  const [miFicha, misSuposiciones, animo, privacidad, amistades, grupos, bloqueos, deseos, avisos] = await Promise.all([
    db.select().from(items).where(eq(items.ownerId, yo.id)),
    db.select().from(items).where(eq(items.proposedBy, yo.id)),
    db.select().from(moods).where(eq(moods.userId, yo.id)),
    db.select().from(sectionVisibility).where(eq(sectionVisibility.userId, yo.id)),
    amistadesDe(yo.id),
    gruposDe(yo.id),
    db.select({ blockedId: blocks.blockedId, createdAt: blocks.createdAt }).from(blocks).where(eq(blocks.blockerId, yo.id)),
    // Mis deseos y las ideas secretas que YO escribí para otros (nunca las de otros sobre mí)
    db
      .select()
      .from(wishes)
      .where(or(and(eq(wishes.ownerId, yo.id), isNull(wishes.addedBy)), eq(wishes.addedBy, yo.id))),
    db.select().from(notifications).where(eq(notifications.userId, yo.id)),
  ]);

  const { esAdmin: _a, ...cuenta } = yo;
  const datos = {
    exportado: new Date().toISOString(),
    cuenta,
    ficha: miFicha,
    suposicionesHechas: misSuposiciones.filter((i) => i.ownerId !== yo.id),
    animo,
    privacidad,
    amistades,
    grupos,
    bloqueos,
    deseos: deseos.map((d) => (d.ownerId === yo.id ? { ...d, claimedBy: null } : d)),
    avisos,
  };

  return new Response(JSON.stringify(datos, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="notecreo-${yo.username}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
