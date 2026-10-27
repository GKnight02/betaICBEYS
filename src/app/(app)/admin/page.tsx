import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { desc, eq, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { BotonPixel } from "@/components/pixel/BotonPixel";
import { Encabezado } from "@/components/pixel/Encabezado";
import { Ventana } from "@/components/pixel/Ventana";
import { cerrarReporte, eliminarItemReportado, suspenderUsuario } from "@/lib/acciones/moderacion";
import { requerirAdmin } from "@/lib/auth/sesiones";
import { MOTIVOS_REPORTE } from "@/lib/config";
import { db } from "@/lib/db";
import { items, reports, users } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Moderación" };

type Estado = "open" | "resolved" | "dismissed";
const ESTADOS: Record<Estado, string> = { open: "Abiertos", resolved: "Resueltos", dismissed: "Descartados" };

export default async function Admin({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  await requerirAdmin();
  const { estado: e } = await searchParams;
  const estado: Estado = e === "resolved" || e === "dismissed" ? e : "open";

  const lista = await db.select().from(reports).where(eq(reports.status, estado)).orderBy(desc(reports.createdAt)).limit(100);

  const idsItems = lista.filter((r) => r.targetType === "item").map((r) => r.targetId);
  const itemsReportados = idsItems.length
    ? await db
        .select({ id: items.id, name: items.name, detail: items.detail, ownerId: items.ownerId, proposedBy: items.proposedBy })
        .from(items)
        .where(inArray(items.id, idsItems))
    : [];
  const idsUsuarios = [
    ...lista.map((r) => r.reporterId),
    ...lista.filter((r) => r.targetType === "user").map((r) => r.targetId),
    ...itemsReportados.flatMap((i) => [i.ownerId, i.proposedBy]),
  ].filter((x): x is string => !!x);
  const usuarios = idsUsuarios.length
    ? await db
        .select({ id: users.id, username: users.username, bannedAt: users.bannedAt })
        .from(users)
        .where(inArray(users.id, [...new Set(idsUsuarios)]))
    : [];
  const u = new Map(usuarios.map((x) => [x.id, x]));
  const it = new Map(itemsReportados.map((x) => [x.id, x]));

  function Usuario({ id }: { id: string | null }) {
    const x = id ? u.get(id) : undefined;
    if (!x) return <span className="text-tenue">(borrado)</span>;
    return (
      <span className="inline-flex flex-wrap items-center gap-1">
        <Link href={`/u/${x.username}`}>@{x.username}</Link>
        {x.bannedAt && <span className="chip chip-peligro">suspendido</span>}
        <form action={suspenderUsuario.bind(null, x.id, !x.bannedAt)}>
          <BotonPixel mini variante={x.bannedAt ? "normal" : "peligro"} confirmar={x.bannedAt ? "¿Reactivar la cuenta?" : "¿Suspender esta cuenta?"}>
            {x.bannedAt ? "Reactivar" : "Suspender"}
          </BotonPixel>
        </form>
      </span>
    );
  }

  return (
    <>
      <Encabezado
        antetitulo="Admin"
        titulo="Moderación"
        descripcion={`Reportes · ${ESTADOS[estado]} (${lista.length})`}
        acciones={
          <nav className="flex flex-wrap" aria-label="Estado de los reportes">
            {(Object.keys(ESTADOS) as Estado[]).map((k) => (
              <Link key={k} href={`/admin?estado=${k}`} className={`boton-pixel boton-mini ${estado === k ? "boton-primario" : ""}`}>
                {ESTADOS[k]}
              </Link>
            ))}
          </nav>
        }
      />
      {lista.length === 0 ? (
        <Ventana className="aparecer">
          <p className="text-tenue">Nada por aquí. ✨</p>
        </Ventana>
      ) : (
        <ul className="rejilla-auto gap-6! [--min:22rem]">
          {lista.map((r, i) => {
            const item = r.targetType === "item" ? it.get(r.targetId) : undefined;
            return (
              <li key={r.id} className="ventana entra-rebote space-y-1" style={{ ["--i" as string]: Math.min(i, 10) }}>
                  <p>
                    <span className="chip chip-aviso">{MOTIVOS_REPORTE[r.reason as keyof typeof MOTIVOS_REPORTE] ?? r.reason}</span>{" "}
                    <span className="text-tenue">{formatDistanceToNow(r.createdAt, { locale: es, addSuffix: true })}</span>
                  </p>
                  <p>
                    Reporta: <Usuario id={r.reporterId} />
                  </p>
                  {r.targetType === "user" ? (
                    <p>
                      Perfil: <Usuario id={r.targetId} />
                    </p>
                  ) : item ? (
                    <div>
                      <p>
                        Suposición «<b>{item.name}</b>»{item.detail && <span className="text-tenue"> · {item.detail}</span>}
                      </p>
                      <p>
                        De: <Usuario id={item.proposedBy} /> · Para: <Usuario id={item.ownerId} />
                      </p>
                    </div>
                  ) : (
                    <p className="text-tenue">El contenido ya no existe.</p>
                  )}
                  {r.detail && <p className="mt-1">«{r.detail}»</p>}
                  {estado === "open" && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item && (
                        <form action={eliminarItemReportado.bind(null, r.id)}>
                          <BotonPixel mini variante="peligro" confirmar="¿Borrar este contenido?">Borrar contenido</BotonPixel>
                        </form>
                      )}
                      <form action={cerrarReporte.bind(null, r.id, "resolved")}>
                        <BotonPixel mini variante="exito">Marcar resuelto</BotonPixel>
                      </form>
                      <form action={cerrarReporte.bind(null, r.id, "dismissed")}>
                        <BotonPixel mini>Descartar</BotonPixel>
                      </form>
                    </div>
                  )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
