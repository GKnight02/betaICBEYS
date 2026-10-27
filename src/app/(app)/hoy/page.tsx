import { differenceInCalendarDays, format, setYear } from "date-fns";
import { es } from "date-fns/locale";
import { and, between, eq, inArray, isNull } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { AnioEnPixeles, CalendarioMensual } from "@/components/ficha/CalendarioAnimo";
import { FormAnimo } from "@/components/ficha/FormAnimo";
import { FormAntojo } from "@/components/ficha/FormAntojo";
import { mesesTexto } from "@/components/ficha/TarjetaGusto";
import { Bateria } from "@/components/pixel/Bateria";
import { Encabezado } from "@/components/pixel/Encabezado";
import { Avatar, Sprite } from "@/components/pixel/Sprite";
import { ANIMO_SPRITES } from "@/components/pixel/sprites";
import { Ventana } from "@/components/pixel/Ventana";
import { requerirUsuario } from "@/lib/auth/sesiones";
import { ANIMOS, MESES, NECESIDADES } from "@/lib/config";
import { idsAmigos } from "@/lib/consultas";
import { db } from "@/lib/db";
import { items, moods, users } from "@/lib/db/schema";
import { aDate, hoy, mesDe, rangoAnio, rangoMes } from "@/lib/fechas";
import { estaActivo } from "@/lib/items";
import { amigosQueMuestran } from "@/lib/permisos";

export const metadata: Metadata = { title: "Hoy" };

type Busqueda = { mes?: string; vista?: string; anio?: string };

export default async function Hoy({ searchParams }: { searchParams: Promise<Busqueda> }) {
  const yo = await requerirUsuario();
  const [fechaHoy, busqueda] = await Promise.all([hoy(), searchParams]);
  const vistaAnual = busqueda.vista === "anio";
  const mes = /^\d{4}-\d{2}$/.test(busqueda.mes ?? "") ? busqueda.mes! : fechaHoy.slice(0, 7);
  const anio = Number(busqueda.anio) || Number(fechaHoy.slice(0, 4));

  const amigos = await idsAmigos(yo.id);
  const [miAnimo, registros, verAnimo, verPerfil, verComidas, verGustos, misRecurrentes] = await Promise.all([
    db.select().from(moods).where(and(eq(moods.userId, yo.id), eq(moods.date, fechaHoy))).limit(1),
    db
      .select({ date: moods.date, mood: moods.mood })
      .from(moods)
      .where(and(eq(moods.userId, yo.id), between(moods.date, ...(vistaAnual ? rangoAnio(anio) : rangoMes(mes))))),
    amigosQueMuestran(yo.id, amigos, "mood"),
    amigosQueMuestran(yo.id, amigos, "profile"),
    amigosQueMuestran(yo.id, amigos, "food"),
    amigosQueMuestran(yo.id, amigos, "likes"),
    db
      .select()
      .from(items)
      .where(and(eq(items.ownerId, yo.id), eq(items.mode, "recurring"), eq(items.status, "confirmed"))),
  ]);

  // Ánimo de hoy de los amigos que lo comparten conmigo (sin notas: son siempre privadas)
  const conAnimo = [...verAnimo];
  const animosAmigos = conAnimo.length > 0
    ? await db
        .select({
          userId: users.id,
          username: users.username,
          displayName: users.displayName,
          avatar: users.avatar,
          mood: moods.mood,
          energy: moods.energy,
          needs: moods.needs,
        })
        .from(moods)
        .innerJoin(users, eq(users.id, moods.userId))
        .where(and(inArray(moods.userId, conAnimo), eq(moods.date, fechaHoy)))
    : [];

  // Sugerencia cruzada: si un amigo está de bajón, su comida de temporada y su serie favorita
  const bajones = animosAmigos.filter((a) => a.mood <= 2).map((a) => a.userId);
  const sugerencias = bajones.length
    ? await db
        .select()
        .from(items)
        .where(and(inArray(items.ownerId, bajones), inArray(items.status, ["confirmed", "partial"]), isNull(items.endDate)))
    : [];
  function sugerenciaPara(userId: string) {
    const suyos = sugerencias.filter((i) => i.ownerId === userId && estaActivo(i, fechaHoy));
    const comida = verComidas.has(userId)
      ? (suyos.find((i) => i.category === "food" && i.mode !== "always" && i.mode !== "disliked") ??
        suyos.find((i) => i.category === "food" && i.intensity === "love"))
      : undefined;
    const serie = verGustos.has(userId)
      ? suyos.find((i) => i.category === "series" && i.intensity === "love") ?? suyos.find((i) => i.category === "series")
      : undefined;
    return { comida, serie };
  }

  // Recordatorios: cumpleaños próximos de amigos y temporadas recurrentes que vuelven
  const conPerfil = [...verPerfil];
  const cumples = conPerfil.length
    ? await db
        .select({ username: users.username, displayName: users.displayName, birthday: users.birthday })
        .from(users)
        .where(inArray(users.id, conPerfil))
    : [];
  const hoyDate = aDate(fechaHoy);
  const proximosCumples = cumples
    .filter((c) => c.birthday)
    .map((c) => {
      let siguiente = setYear(aDate(c.birthday!), hoyDate.getFullYear());
      if (differenceInCalendarDays(siguiente, hoyDate) < 0) siguiente = setYear(siguiente, hoyDate.getFullYear() + 1);
      return { ...c, dias: differenceInCalendarDays(siguiente, hoyDate) };
    })
    .filter((c) => c.dias <= 14)
    .sort((a, b) => a.dias - b.dias);
  const mesActual = mesDe(fechaHoy);
  const mesSiguiente = (mesActual % 12) + 1;
  const vuelvenPronto = misRecurrentes.filter(
    (i) => i.recurringMonths.includes(mesSiguiente) && !i.recurringMonths.includes(mesActual),
  );
  const activasAhora = misRecurrentes.filter((i) => i.recurringMonths.includes(mesActual));

  const antojo = yo.cravingDate === fechaHoy ? yo.craving : null;

  const recordatorios = proximosCumples.length + vuelvenPronto.length + activasAhora.length;

  return (
    <>
      <Encabezado
        antetitulo={<span className="capitalize">{format(hoyDate, "EEEE d 'de' MMMM", { locale: es })}</span>}
        titulo={`¡Hola, ${yo.displayName}!`}
        descripcion="Apunta cómo va tu día y mira cómo están tus amigos."
        icono={<Avatar id={yo.avatar} escala={4} />}
      />

      <div className="grid items-start gap-7 md:grid-cols-2 2xl:grid-cols-[1.1fr_1fr_0.9fr]">
        <div className="pila">
          <Ventana titulo="Mi ánimo de hoy" className="aparecer">
            <FormAnimo actual={miAnimo[0] ?? null} avatar={yo.avatar} />
          </Ventana>
          <Ventana className="aparecer" style={{ ["--i" as string]: 1 }}>
            <FormAntojo actual={antojo} />
          </Ventana>
        </div>

        <Ventana
          titulo={vistaAnual ? `Mi ${anio} en píxeles` : "Mi calendario"}
          className="aparecer"
          style={{ ["--i" as string]: 2 }}
          acciones={
            <>
              <Link href="/hoy" className={`boton-pixel boton-mini ${vistaAnual ? "" : "boton-primario"}`}>Mes</Link>
              <Link href={`/hoy?vista=anio&anio=${anio}`} className={`boton-pixel boton-mini ${vistaAnual ? "boton-primario" : ""}`}>Año</Link>
              {vistaAnual && (
                <>
                  <Link href={`/hoy?vista=anio&anio=${anio - 1}`} className="boton-pixel boton-mini" aria-label="Año anterior">◀</Link>
                  <Link href={`/hoy?vista=anio&anio=${anio + 1}`} className="boton-pixel boton-mini" aria-label="Año siguiente">▶</Link>
                </>
              )}
            </>
          }
        >
          {vistaAnual ? (
            <AnioEnPixeles anio={anio} registros={registros} />
          ) : (
            <CalendarioMensual mes={mes} registros={registros} hrefBase="/hoy" fechaHoy={fechaHoy} />
          )}
        </Ventana>

        <div className="grid gap-7 md:col-span-2 lg:grid-cols-2 2xl:col-span-1 2xl:grid-cols-1">
          <Ventana
            titulo="Así están tus amigos"
            className="aparecer"
            style={{ ["--i" as string]: 3 }}
            acciones={animosAmigos.length > 0 && <span className="chip">{animosAmigos.length}</span>}
          >
            {amigos.length === 0 ? (
              <p>
                Aún no tienes amigos aquí. <Link href="/amigos">Invita a alguien</Link> con su nombre de usuario.
              </p>
            ) : animosAmigos.length === 0 ? (
              <p className="text-tenue">Ningún amigo ha compartido su ánimo hoy (o no te lo muestran).</p>
            ) : (
              <ul className="space-y-3">
                {animosAmigos.map((a, i) => {
                  const s = a.mood <= 2 ? sugerenciaPara(a.userId) : null;
                  return (
                    <li key={a.userId} className="tarjeta entra-rebote" style={{ ["--i" as string]: i }}>
                      <div className="flex flex-wrap items-center gap-3">
                        <Avatar id={a.avatar} escala={2} />
                        <Link href={`/u/${a.username}`} className="mr-auto min-w-0 truncate font-bold">{a.displayName}</Link>
                        <Sprite sprite={ANIMO_SPRITES[a.mood]!} escala={2} titulo={ANIMOS[a.mood as keyof typeof ANIMOS]} />
                        <Bateria nivel={a.energy} escala={2} />
                      </div>
                      {a.needs.length > 0 && (
                        <p className="mt-2 text-tenue">
                          Necesita: {a.needs.map((n) => NECESIDADES[n as keyof typeof NECESIDADES] ?? n).join(", ")}
                        </p>
                      )}
                      {s && (s.comida || s.serie) && (
                        <p className="nota mt-3">
                          💡 ¿Le animas?{s.comida && ` Su comida del momento: ${s.comida.name}.`}
                          {s.serie && ` Su serie favorita: ${s.serie.name}.`}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Ventana>

          <Ventana
            titulo="Recordatorios"
            className="aparecer"
            style={{ ["--i" as string]: 4 }}
            acciones={recordatorios > 0 && <span className="chip chip-aviso">{recordatorios}</span>}
          >
            {recordatorios === 0 ? (
              <p className="text-tenue">Nada a la vista por ahora.</p>
            ) : (
              <ul className="space-y-3">
                {proximosCumples.map((c) => (
                  <li key={c.username} className="flex gap-2">
                    <span aria-hidden>🎂</span>
                    <span>
                      {c.dias === 0 ? "¡Hoy" : c.dias === 1 ? "Mañana" : `En ${c.dias} días`} es el cumpleaños de{" "}
                      <Link href={`/u/${c.username}`}>{c.displayName}</Link>
                      {c.dias === 0 && "!"}
                    </span>
                  </li>
                ))}
                {activasAhora.map((i) => (
                  <li key={i.id} className="flex gap-2">
                    <span aria-hidden>🔁</span>
                    <span>Temporada activa: <b>{i.name}</b> <span className="text-tenue">({mesesTexto(i.recurringMonths)})</span></span>
                  </li>
                ))}
                {vuelvenPronto.map((i) => (
                  <li key={i.id} className="flex gap-2">
                    <span aria-hidden>⏳</span>
                    <span>En {MESES[mesSiguiente - 1]} vuelve: <b>{i.name}</b></span>
                  </li>
                ))}
              </ul>
            )}
          </Ventana>
        </div>
      </div>
    </>
  );
}
