import { and, between, count, desc, eq, isNull } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AnioEnPixeles } from "@/components/ficha/CalendarioAnimo";
import { ListaDeseos } from "@/components/ficha/Deseos";
import { ReportarBoton } from "@/components/ficha/ReportarBoton";
import { SeccionItems } from "@/components/ficha/SeccionItems";
import { fechaCorta } from "@/components/ficha/TarjetaGusto";
import { Bateria } from "@/components/pixel/Bateria";
import { BotonPixel } from "@/components/pixel/BotonPixel";
import { Encabezado } from "@/components/pixel/Encabezado";
import { Avatar, Sprite } from "@/components/pixel/Sprite";
import { ANIMO_SPRITES, SUPOSICION } from "@/components/pixel/sprites";
import { Ventana } from "@/components/pixel/Ventana";
import { aceptarAmistad, bloquear, quitarAmistad } from "@/lib/acciones/social";
import { requerirUsuario } from "@/lib/auth/sesiones";
import { ANIMOS, CATEGORIAS_GUSTOS, NECESIDADES } from "@/lib/config";
import { usuarioPorNombre } from "@/lib/consultas";
import { db } from "@/lib/db";
import { items, moods, users, wishes } from "@/lib/db/schema";
import { hoy, rangoAnio } from "@/lib/fechas";
import { itemsVisibles } from "@/lib/items";
import { puedeProponer, puedeVerCon, relacion, visibilidades } from "@/lib/permisos";
import { FormSolicitud } from "./FormSolicitud";

type Props = { params: Promise<{ usuario: string }> };

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function FichaAjena({ params }: Props) {
  const yo = await requerirUsuario();
  const { usuario } = await params;
  const otro = await usuarioPorNombre(decodeURIComponent(usuario));
  if (!otro || otro.bannedAt) notFound();
  if (otro.id === yo.id) redirect("/yo");

  const [rel, vis] = await Promise.all([relacion(yo.id, otro.id), visibilidades(otro.id)]);
  // Un bloqueo, en cualquier dirección, hace que la ficha "no exista"
  if (rel.bloqueado) notFound();

  const ver = {
    perfil: puedeVerCon(rel, vis.profile, yo.id),
    animo: puedeVerCon(rel, vis.mood, yo.id),
    comidas: puedeVerCon(rel, vis.food, yo.id),
    gustos: puedeVerCon(rel, vis.likes, yo.id),
    regalos: puedeVerCon(rel, vis.gifts, yo.id),
  };
  const fechaHoy = await hoy();
  const anio = fechaHoy.slice(0, 4);

  const [comidas, gustos, animoHoy, animoAnio, deseos, proponer, [miXp]] = await Promise.all([
    ver.comidas ? itemsVisibles(yo.id, otro.id, ["food"]) : [],
    ver.gustos ? itemsVisibles(yo.id, otro.id, CATEGORIAS_GUSTOS) : [],
    ver.animo
      ? db
          .select({ mood: moods.mood, energy: moods.energy, needs: moods.needs })
          .from(moods)
          .where(and(eq(moods.userId, otro.id), eq(moods.date, fechaHoy)))
          .limit(1)
      : [],
    ver.animo
      ? db
          .select({ date: moods.date, mood: moods.mood })
          .from(moods)
          .where(and(eq(moods.userId, otro.id), between(moods.date, ...rangoAnio(anio))))
      : [],
    ver.regalos
      ? db
          .select({
            id: wishes.id,
            name: wishes.name,
            link: wishes.link,
            note: wishes.note,
            addedBy: wishes.addedBy,
            claimedBy: wishes.claimedBy,
            autor: users.username,
          })
          .from(wishes)
          .leftJoin(users, eq(users.id, wishes.addedBy))
          .where(eq(wishes.ownerId, otro.id))
          .orderBy(isNull(wishes.addedBy), desc(wishes.createdAt))
      : [],
    puedeProponer(yo.id, otro.id),
    db
      .select({ n: count() })
      .from(items)
      .where(and(eq(items.ownerId, otro.id), eq(items.proposedBy, yo.id), eq(items.status, "confirmed"))),
  ]);

  const nombre = ver.perfil ? otro.displayName : `@${otro.username}`;
  const animo = animoHoy[0];
  const nadaVisible = !Object.values(ver).some(Boolean);

  const hayPrincipal = ver.animo || ver.comidas || ver.gustos;
  const hayLateral = (ver.perfil && !!(otro.birthday || otro.allergies)) || ver.regalos;

  const relacionBotones = rel.amigos ? (
    <form action={quitarAmistad.bind(null, otro.id)}>
      <BotonPixel mini confirmar={`¿Dejar de ser amigos de @${otro.username}?`}>Eliminar amistad</BotonPixel>
    </form>
  ) : rel.pendiente === "recibida" ? (
    <>
      <span className="mr-1">Te envió una solicitud de amistad.</span>
      <form action={aceptarAmistad.bind(null, otro.id)}>
        <BotonPixel mini variante="exito">Aceptar</BotonPixel>
      </form>
      <form action={quitarAmistad.bind(null, otro.id)}>
        <BotonPixel mini>Rechazar</BotonPixel>
      </form>
    </>
  ) : rel.pendiente === "enviada" ? (
    <>
      <span className="mr-1 text-tenue">Solicitud enviada.</span>
      <form action={quitarAmistad.bind(null, otro.id)}>
        <BotonPixel mini>Cancelar</BotonPixel>
      </form>
    </>
  ) : (
    <FormSolicitud username={otro.username} />
  );

  return (
    <>
      <Encabezado
        antetitulo="Ficha"
        titulo={nombre}
        icono={ver.perfil ? <Avatar id={otro.avatar} escala={5} nombre={otro.displayName} /> : <Sprite sprite={SUPOSICION} escala={4} />}
        descripcion={
          <>
            <p>
              @{otro.username}
              {ver.perfil && otro.nickname && ` · «${otro.nickname}»`}
            </p>
            {ver.perfil && otro.bio && <p className="text-texto">{otro.bio}</p>}
          </>
        }
        acciones={
          <>
            {proponer && (
              <Link href={`/u/${otro.username}/suponer`} className="boton-pixel boton-primario">
                ? Suponer algo
              </Link>
            )}
            {(ver.comidas || ver.gustos) && (
              <Link href={`/u/${otro.username}/quiz`} className="boton-pixel">
                ¿Cuánto le conoces?
              </Link>
            )}
          </>
        }
      >
        <div className="tarjeta flex flex-wrap items-center gap-x-2 gap-y-1 py-2!">
          <div className="-mx-1 flex flex-wrap">
            {rel.amigos && <span className="chip chip-exito">Amigos</span>}
            {!rel.amigos && rel.grupoComun && <span className="chip">Grupo en común</span>}
            {(miXp?.n ?? 0) > 0 && <span className="chip chip-aviso">Le conoces: {miXp!.n} XP</span>}
          </div>
          <div className="flex flex-wrap items-center gap-1 sm:ml-auto">
            {relacionBotones}
            <form action={bloquear.bind(null, otro.id)}>
              <BotonPixel mini variante="peligro" confirmar={`¿Bloquear a @${otro.username}? No podrá encontrarte, ver tu ficha ni proponerte suposiciones.`}>
                Bloquear
              </BotonPixel>
            </form>
          </div>
          <div className="w-full">
            <ReportarBoton tipo="user" id={otro.id} />
          </div>
        </div>
      </Encabezado>

      {nadaVisible && (
        <Ventana className="aparecer mx-auto max-w-2xl text-center">
          <div className="flotar mb-3 inline-block">
            <Sprite sprite={SUPOSICION} escala={4} fps={3} />
          </div>
          <p>Esta ficha es privada. Si os conocéis, envíale una solicitud de amistad.</p>
        </Ventana>
      )}

      <div
        className={`grid items-start gap-7 ${hayPrincipal && hayLateral ? "xl:grid-cols-[minmax(0,1fr)_24rem] 2xl:grid-cols-[minmax(0,1fr)_28rem]" : ""}`}
      >
        {hayPrincipal && (
          <div className="pila">
            {ver.animo && (
              <Ventana titulo="Ánimo" className="aparecer">
                {animo ? (
                  <div className="mb-5 flex flex-wrap items-center gap-4">
                    <Sprite sprite={ANIMO_SPRITES[animo.mood]!} escala={4} titulo={ANIMOS[animo.mood as keyof typeof ANIMOS]} />
                    <span className="text-lg font-bold">Hoy: {ANIMOS[animo.mood as keyof typeof ANIMOS]}</span>
                    <Bateria nivel={animo.energy} />
                    {animo.needs.length > 0 && (
                      <span className="nota w-full">
                        Necesita: {animo.needs.map((n) => NECESIDADES[n as keyof typeof NECESIDADES] ?? n).join(", ")}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="mb-4 text-tenue">Hoy aún no ha registrado su ánimo.</p>
                )}
                <AnioEnPixeles anio={Number(anio)} registros={animoAnio} />
              </Ventana>
            )}

            {ver.comidas && (
              <Ventana titulo="Comidas" className="aparecer" style={{ ["--i" as string]: 1 }}>
                {ver.perfil && otro.cravingDate === fechaHoy && otro.craving && (
                  <p className="nota mb-4">😋 Antojo de hoy: {otro.craving}</p>
                )}
                <SeccionItems lista={comidas} fechaHoy={fechaHoy} propio={false} viewerId={yo.id} />
              </Ventana>
            )}

            {ver.gustos && (
              <Ventana titulo="Otros gustos" className="aparecer" style={{ ["--i" as string]: 2 }}>
                <SeccionItems lista={gustos} fechaHoy={fechaHoy} propio={false} viewerId={yo.id} mostrarCategoria />
              </Ventana>
            )}
          </div>
        )}

        {hayLateral && (
          <div className="pila">
            {ver.perfil && (otro.birthday || otro.allergies) && (
              <Ventana titulo="Perfil" className="aparecer" style={{ ["--i" as string]: 3 }}>
                <ul className="space-y-2">
                  {otro.birthday && <li>🎂 Cumpleaños: <b>{fechaCorta(otro.birthday)}</b></li>}
                  {otro.allergies && <li className="nota [--c:var(--peligro)]">⚠ Alergias y restricciones: {otro.allergies}</li>}
                </ul>
              </Ventana>
            )}

            {ver.regalos && (
              <Ventana titulo="Para regalarle" className="aparecer" style={{ ["--i" as string]: 4 }}>
                {(otro.giftSizes || otro.giftColors) && (
                  <ul className="mb-4 space-y-1">
                    {otro.giftSizes && <li>📏 Tallas: {otro.giftSizes}</li>}
                    {otro.giftColors && <li>🎨 Colores favoritos: {otro.giftColors}</li>}
                  </ul>
                )}
                <p className="mb-3 text-sm text-tenue">Lista de deseos en modo sorpresa: no ve quién regala qué.</p>
                <ListaDeseos deseos={deseos} propio={false} viewerId={yo.id} ownerId={otro.id} />
              </Ventana>
            )}
          </div>
        )}
      </div>
    </>
  );
}
