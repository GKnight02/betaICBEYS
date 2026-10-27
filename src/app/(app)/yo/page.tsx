import { and, desc, eq, isNull } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { ListaDeseos } from "@/components/ficha/Deseos";
import { FormItem } from "@/components/ficha/FormItem";
import { FormPerfil } from "@/components/ficha/FormPerfil";
import { SeccionItems } from "@/components/ficha/SeccionItems";
import { Encabezado } from "@/components/pixel/Encabezado";
import { Avatar } from "@/components/pixel/Sprite";
import { Ventana } from "@/components/pixel/Ventana";
import { guardarItem } from "@/lib/acciones/ficha";
import { requerirUsuario } from "@/lib/auth/sesiones";
import { CATEGORIAS, CATEGORIAS_GUSTOS, NIVELES } from "@/lib/config";
import { db } from "@/lib/db";
import { wishes } from "@/lib/db/schema";
import { hoy } from "@/lib/fechas";
import { itemsVisibles, puntosConocimiento } from "@/lib/items";
import { visibilidades } from "@/lib/permisos";

export const metadata: Metadata = { title: "Mi ficha" };

export default async function MiFicha({ searchParams }: { searchParams: Promise<{ cat?: string }> }) {
  const yo = await requerirUsuario();
  const { cat } = await searchParams;
  const filtro = CATEGORIAS_GUSTOS.find((c) => c === cat);

  const [fechaHoy, comidas, gustos, xp, vis, deseos] = await Promise.all([
    hoy(),
    itemsVisibles(yo.id, yo.id, ["food"]),
    itemsVisibles(yo.id, yo.id, filtro ? [filtro] : CATEGORIAS_GUSTOS),
    puntosConocimiento(yo.id),
    visibilidades(yo.id),
    // El dueño solo ve sus propios deseos, nunca ideas secretas ni reservas
    db
      .select({ id: wishes.id, name: wishes.name, link: wishes.link, note: wishes.note, addedBy: wishes.addedBy })
      .from(wishes)
      .where(and(eq(wishes.ownerId, yo.id), isNull(wishes.addedBy)))
      .orderBy(desc(wishes.createdAt)),
  ]);

  const nivel = (s: keyof typeof vis) => <span className="chip" title="Quién lo ve">👁 {NIVELES[vis[s].level]}</span>;

  return (
    <>
      <Encabezado
        antetitulo="Mi ficha"
        titulo={yo.displayName}
        icono={<Avatar id={yo.avatar} escala={5} nombre={yo.displayName} />}
        descripcion={
          <>
            <p>
              @{yo.username}
              {yo.nickname && ` · «${yo.nickname}»`}
            </p>
            {yo.bio && <p className="text-texto">{yo.bio}</p>}
          </>
        }
        acciones={
          <>
            <span className="chip normal-case!" title="Tus amigos te encuentran así">🔗 /u/{yo.username}</span>
            <Link href="/ajustes#privacidad" className="boton-pixel boton-mini">
              👁 Privacidad
            </Link>
          </>
        }
      >
        <nav aria-label="Secciones" className="-mx-0.5 flex flex-wrap">
          {[
            ["#comidas", "Comidas"],
            ["#gustos", "Gustos"],
            ["#deseos", "Deseos"],
            ["#perfil", "Perfil"],
          ].map(([h, t]) => (
            <a key={h} href={h} className="boton-pixel boton-mini">
              {t}
            </a>
          ))}
        </nav>
      </Encabezado>

      <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_24rem] 2xl:grid-cols-[minmax(0,1fr)_28rem]">
        <div className="pila">
          <Ventana titulo="Comidas" id="comidas" acciones={nivel("food")} className="aparecer">
            <details className="mb-4">
              <summary className="boton-pixel boton-mini boton-primario">+ Añadir comida</summary>
              <div className="tarjeta mt-2">
                <FormItem accion={guardarItem} tipo="food" textoBoton="Añadir" />
              </div>
            </details>
            <SeccionItems lista={comidas} fechaHoy={fechaHoy} propio viewerId={yo.id} textoVacio="Añade tu primera comida favorita." />
          </Ventana>

          <Ventana titulo="Otros gustos" id="gustos" acciones={nivel("likes")} className="aparecer" style={{ ["--i" as string]: 1 }}>
            <nav aria-label="Filtrar por categoría" className="mb-3 flex flex-wrap">
              <Link href="/yo#gustos" className={`boton-pixel boton-mini ${filtro ? "" : "boton-primario"}`} scroll={false}>
                Todo
              </Link>
              {CATEGORIAS_GUSTOS.map((c) => (
                <Link key={c} href={`/yo?cat=${c}#gustos`} scroll={false} className={`boton-pixel boton-mini ${filtro === c ? "boton-primario" : ""}`}>
                  {CATEGORIAS[c]}
                </Link>
              ))}
            </nav>
            <details className="mb-4">
              <summary className="boton-pixel boton-mini boton-primario">+ Añadir gusto</summary>
              <div className="tarjeta mt-2">
                <FormItem accion={guardarItem} tipo="likes" textoBoton="Añadir" />
              </div>
            </details>
            <SeccionItems lista={gustos} fechaHoy={fechaHoy} propio viewerId={yo.id} mostrarCategoria={!filtro} textoVacio="Música, series, juegos, lugares… lo que te guste." />
          </Ventana>
        </div>

        <div className="pila">
          <Ventana titulo="Quién te conoce mejor" className="aparecer" style={{ ["--i" as string]: 2 }}>
            {xp.length === 0 ? (
              <p className="text-tenue">Cuando confirmes suposiciones de tus amigos, aquí verás quién te conoce mejor.</p>
            ) : (
              <ol className="space-y-2">
                {xp.map((p, i) => (
                  <li key={p.id} className="entra-rebote flex items-center gap-3" style={{ ["--i" as string]: i }}>
                    <span className={`titulo w-6 text-center text-sm ${i === 0 ? "text-acento-2" : "text-tenue"}`}>{i + 1}</span>
                    <Avatar id={p.avatar} escala={2} />
                    <Link href={`/u/${p.username}`} className="min-w-0 flex-1 truncate">{p.displayName}</Link>
                    <span className="chip chip-exito">{p.xp} XP</span>
                  </li>
                ))}
              </ol>
            )}
          </Ventana>

          <Ventana titulo="Lista de deseos" id="deseos" acciones={nivel("gifts")} className="aparecer" style={{ ["--i" as string]: 3 }}>
            <ListaDeseos deseos={deseos.map((d) => ({ ...d, claimedBy: null }))} propio viewerId={yo.id} ownerId={yo.id} />
          </Ventana>

          <Ventana titulo="Perfil" id="perfil" className="aparecer" style={{ ["--i" as string]: 4 }}>
            <FormPerfil perfil={yo} />
          </Ventana>
        </div>
      </div>
    </>
  );
}
