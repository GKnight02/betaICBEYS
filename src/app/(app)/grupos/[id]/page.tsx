import { and, desc, eq, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bateria } from "@/components/pixel/Bateria";
import { BotonPixel } from "@/components/pixel/BotonPixel";
import { Encabezado } from "@/components/pixel/Encabezado";
import { Avatar, Sprite } from "@/components/pixel/Sprite";
import { ANIMO_SPRITES } from "@/components/pixel/sprites";
import { Ventana } from "@/components/pixel/Ventana";
import { borrarGrupo, gestionarMiembro, salirDeGrupo } from "@/lib/acciones/social";
import { requerirUsuario } from "@/lib/auth/sesiones";
import { ANIMOS, CATEGORIAS } from "@/lib/config";
import { miembrosDe } from "@/lib/consultas";
import { db } from "@/lib/db";
import { groups, items, moods } from "@/lib/db/schema";
import { hoy } from "@/lib/fechas";
import { puedeVer } from "@/lib/permisos";
import { Invitar } from "../FormsGrupo";

export const metadata: Metadata = { title: "Grupo" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Grupo({ params }: { params: Promise<{ id: string }> }) {
  const yo = await requerirUsuario();
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const [[grupo], miembros] = await Promise.all([db.select().from(groups).where(eq(groups.id, id)), miembrosDe(id)]);
  const yoMiembro = miembros.find((m) => m.id === yo.id);
  // Solo los miembros ven el grupo
  if (!grupo || !yoMiembro) notFound();
  const soyAdmin = yoMiembro.role === "admin";
  const soyCreador = grupo.ownerId === yo.id;

  const fechaHoy = await hoy();
  const otros = miembros.filter((m) => m.id !== yo.id);

  // Actividad respetando la privacidad de cada miembro
  const permisos = await Promise.all(
    otros.map(async (m) => ({
      id: m.id,
      animo: await puedeVer(yo.id, m.id, "mood"),
      comidas: await puedeVer(yo.id, m.id, "food"),
      gustos: await puedeVer(yo.id, m.id, "likes"),
    })),
  );
  const conAnimo = permisos.filter((p) => p.animo).map((p) => p.id);
  const conItems = permisos.filter((p) => p.comidas || p.gustos).map((p) => p.id);

  const [animos, recientes] = await Promise.all([
    conAnimo.length
      ? db
          .select({ userId: moods.userId, mood: moods.mood, energy: moods.energy })
          .from(moods)
          .where(and(inArray(moods.userId, conAnimo), eq(moods.date, fechaHoy)))
      : [],
    conItems.length
      ? db
          .select({ id: items.id, ownerId: items.ownerId, name: items.name, category: items.category, createdAt: items.createdAt })
          .from(items)
          .where(and(inArray(items.ownerId, conItems), eq(items.status, "confirmed")))
          .orderBy(desc(items.createdAt))
          .limit(40)
      : [],
  ]);
  const permisoDe = new Map(permisos.map((p) => [p.id, p]));
  const actividad = recientes
    .filter((r) => {
      const p = permisoDe.get(r.ownerId);
      return r.category === "food" ? p?.comidas : p?.gustos;
    })
    .slice(0, 12);
  const animoDe = new Map(animos.map((a) => [a.userId, a]));
  const miembroDe = new Map(miembros.map((m) => [m.id, m]));

  return (
    <>
      <Encabezado
        antetitulo={
          <Link href="/grupos" className="text-acento">
            ◀ Grupos
          </Link>
        }
        titulo={grupo.name}
        descripcion={`${miembros.length} ${miembros.length === 1 ? "miembro" : "miembros"}`}
        acciones={
          <>
            <form action={salirDeGrupo.bind(null, id)}>
              <BotonPixel mini confirmar="¿Salir del grupo?">Salir del grupo</BotonPixel>
            </form>
            {soyCreador && (
              <form action={borrarGrupo.bind(null, id)}>
                <BotonPixel mini variante="peligro" confirmar="¿Borrar el grupo para todos? No se puede deshacer.">
                  Borrar grupo
                </BotonPixel>
              </form>
            )}
          </>
        }
      />

      <div className={`grid items-start gap-7 ${soyAdmin ? "xl:grid-cols-[minmax(0,1fr)_24rem]" : ""}`}>
        <div className="grid items-start gap-7 2xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Ventana titulo="Miembros" acciones={<span className="chip">{miembros.length}</span>} className="aparecer">
            <ul className="rejilla-auto [--min:16rem]">
              {miembros.map((m, i) => {
                const a = animoDe.get(m.id);
                return (
                  <li key={m.id} className="tarjeta entra-rebote flex flex-col gap-2" style={{ ["--i" as string]: i }}>
                    <div className="flex items-center gap-3">
                      <Avatar id={m.avatar} escala={2} />
                      <div className="min-w-0 flex-1">
                        {m.id === yo.id ? (
                          <span className="block truncate font-bold">{m.displayName} (tú)</span>
                        ) : (
                          <Link href={`/u/${m.username}`} className="block truncate font-bold">{m.displayName}</Link>
                        )}
                        <span className="titulo text-xs text-tenue uppercase">
                          {m.id === grupo.ownerId ? "creador" : m.role === "admin" ? "admin" : "miembro"}
                        </span>
                      </div>
                      {a && (
                        <span className="flex items-center gap-2">
                          <Sprite sprite={ANIMO_SPRITES[a.mood]!} escala={2} titulo={ANIMOS[a.mood as keyof typeof ANIMOS]} />
                          <Bateria nivel={a.energy} escala={2} />
                        </span>
                      )}
                    </div>
                    {soyAdmin && m.id !== yo.id && m.id !== grupo.ownerId && (
                      <div className="flex flex-wrap">
                        <form action={gestionarMiembro.bind(null, id, m.id, m.role === "admin" ? "member" : "admin")}>
                          <BotonPixel mini>{m.role === "admin" ? "Quitar admin" : "Hacer admin"}</BotonPixel>
                        </form>
                        <form action={gestionarMiembro.bind(null, id, m.id, "expulsar")}>
                          <BotonPixel mini variante="peligro" confirmar={`¿Expulsar a ${m.displayName}?`}>Expulsar</BotonPixel>
                        </form>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Ventana>

          <Ventana titulo="Actividad reciente" className="aparecer" style={{ ["--i" as string]: 1 }}>
            {actividad.length === 0 ? (
              <p className="text-tenue">Nada nuevo (o los miembros no comparten sus fichas contigo).</p>
            ) : (
              <ol className="relative ml-2 space-y-3 border-l-4 border-dashed border-panel-3 pl-5">
                {actividad.map((r, i) => {
                  const m = miembroDe.get(r.ownerId);
                  return (
                    <li key={r.id} className="entra-rebote relative" style={{ ["--i" as string]: i }}>
                      <span className="absolute top-1.5 -left-[1.85rem] size-3 bg-acento" style={{ boxShadow: "0 0 0 2px var(--borde)" }} aria-hidden />
                      <Link href={`/u/${m?.username}`}>{m?.displayName}</Link> añadió <b>{r.name}</b>{" "}
                      <span className="text-tenue">({CATEGORIAS[r.category]})</span>
                    </li>
                  );
                })}
              </ol>
            )}
          </Ventana>
        </div>

        {soyAdmin && (
          <Ventana titulo="Invitar" className="aparecer" style={{ ["--i" as string]: 2 }}>
            <Invitar groupId={id} />
          </Ventana>
        )}
      </div>
    </>
  );
}
