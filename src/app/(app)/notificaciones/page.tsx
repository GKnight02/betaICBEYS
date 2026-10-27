import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { and, desc, eq, isNull } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { SeccionItems } from "@/components/ficha/SeccionItems";
import { Encabezado } from "@/components/pixel/Encabezado";
import { Ventana } from "@/components/pixel/Ventana";
import { requerirUsuario } from "@/lib/auth/sesiones";
import { CATEGORIAS } from "@/lib/config";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { hoy } from "@/lib/fechas";
import { itemsVisibles } from "@/lib/items";

export const metadata: Metadata = { title: "Avisos" };

type Aviso = typeof notifications.$inferSelect;

const RESPUESTAS: Record<string, string> = {
  confirmed: "¡la confirmó! +1 XP",
  partial: "dijo «más o menos»",
  rejected: "la rechazó",
};

function Mensaje({ n }: { n: Aviso }) {
  const p = n.payload;
  const de = p.from ? <Link href={`/u/${p.from}`}>@{p.from}</Link> : "Alguien";
  switch (n.type) {
    case "friend_request":
      return <>{de} te envió una <Link href="/amigos">solicitud de amistad</Link>.</>;
    case "friend_accepted":
      return <>{de} aceptó tu solicitud. ¡Ya sois amigos!</>;
    case "supposition":
      return <>{de} cree que te gusta «{p.item}». <a href="#pendientes">¿Te lo crees?</a></>;
    case "supposition_answered":
      return (
        <>
          {de} respondió a tu suposición «{p.item}»: {RESPUESTAS[String(p.response)] ?? p.response}
          {p.comment && <span className="text-tenue"> — «{p.comment}»</span>}
        </>
      );
    case "group_joined":
      return <>{de} se unió a <Link href={`/grupos/${p.groupId}`}>{p.group}</Link>.</>;
    default:
      return null;
  }
}

export default async function Notificaciones() {
  const yo = await requerirUsuario();
  const [avisos, todos, fechaHoy] = await Promise.all([
    db.select().from(notifications).where(eq(notifications.userId, yo.id)).orderBy(desc(notifications.createdAt)).limit(60),
    itemsVisibles(yo.id, yo.id, Object.keys(CATEGORIAS) as (keyof typeof CATEGORIAS)[]),
    hoy(),
  ]);
  const pendientes = todos.filter((i) => i.status === "pending");

  // Al abrir la página se marcan como leídas
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, yo.id), isNull(notifications.readAt)));

  return (
    <>
      <Encabezado antetitulo="Bandeja" titulo="Avisos" descripcion="Suposiciones por responder y todo lo que ha pasado con tus amigos." />

      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Ventana
          titulo="Suposiciones por responder"
          id="pendientes"
          acciones={<span className={`chip ${pendientes.length > 0 ? "chip-aviso" : ""}`}>{pendientes.length}</span>}
          className="aparecer"
        >
          {pendientes.length === 0 ? (
            <p className="text-tenue">No tienes suposiciones pendientes.</p>
          ) : (
            <SeccionItems lista={pendientes} fechaHoy={fechaHoy} propio viewerId={yo.id} mostrarCategoria />
          )}
        </Ventana>

        <Ventana titulo="Historial" className="aparecer" style={{ ["--i" as string]: 1 }}>
          {avisos.length === 0 ? (
            <p className="text-tenue">Sin avisos todavía.</p>
          ) : (
            <ul className="space-y-1">
              {avisos.map((n, i) => (
                <li
                  key={n.id}
                  className={`entra-rebote flex flex-wrap items-baseline gap-x-2 px-3 py-2.5 ${n.readAt ? "" : "nota [--c:var(--acento)]"}`}
                  style={{ ["--i" as string]: Math.min(i, 10) }}
                >
                  {!n.readAt && <span className="chip chip-acento m-0!">nuevo</span>}
                  <span className="min-w-0 flex-1">
                    <Mensaje n={n} />
                  </span>
                  <span className="text-sm text-tenue">{formatDistanceToNow(n.createdAt, { locale: es, addSuffix: true })}</span>
                </li>
              ))}
            </ul>
          )}
        </Ventana>
      </div>
    </>
  );
}
