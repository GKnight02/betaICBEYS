import type { Metadata } from "next";
import Link from "next/link";
import { Escena } from "@/components/Escena";
import { Avatar, Sprite } from "@/components/pixel/Sprite";
import { ANIMO_SPRITES, COFRE, SUPOSICION, type Sprite as SpriteDef } from "@/components/pixel/sprites";
import { TextoDialogo } from "@/components/pixel/TextoDialogo";
import { Ventana } from "@/components/pixel/Ventana";
import { usuarioActual } from "@/lib/auth/sesiones";
import { APP_LEMA, APP_NAME } from "@/lib/config";

export const metadata: Metadata = { robots: { index: true, follow: true } };

const FUNCIONES: { titulo: string; texto: string; sprite?: SpriteDef; avatar?: string }[] = [
  { titulo: "Tu ficha", texto: "Gustos, comidas por temporada, lo que ya no te gusta y tu pedido exacto del café.", avatar: "gato" },
  { titulo: "Tu ánimo", texto: "Un registro al día, con calendario y un píxel por cada día del año.", sprite: ANIMO_SPRITES[5] },
  { titulo: "Suposiciones", texto: "Tus amigos proponen cosas sobre ti. Nada es verdad hasta que tú lo confirmas.", sprite: SUPOSICION },
  { titulo: "Temporadas", texto: "Cuando se acaba una obsesión, se guarda en el cofre y queda en tu historial.", sprite: COFRE },
];

const PASOS = [
  ["Crea tu ficha", "Elige avatar y apunta lo que te gusta (y lo que no)."],
  ["Invita a tus amigos", "Sin buscador público: solo con tu nombre de usuario exacto."],
  ["¿Te lo crees?", "Confirma o rechaza sus suposiciones y descubre quién te conoce mejor."],
];

export default async function Portada({ searchParams }: { searchParams: Promise<{ adios?: string }> }) {
  const [usuario, { adios }] = await Promise.all([usuarioActual(), searchParams]);
  return (
    <main>
      {/* Portada a pantalla completa: texto a un lado y escena animada al otro */}
      <section className="mx-auto grid w-full max-w-[1680px] items-center gap-10 px-4 py-10 sm:px-6 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16 lg:px-10 lg:py-14">
        <div className="aparecer">
          <span className="chip chip-acento mx-0!">Pixel social · Beta</span>
          <h1 className="mt-5 text-[clamp(2.4rem,1.6rem+3.6vw,5rem)] leading-[1.02]">
            No te creo…
            <span className="texto-destello block">hasta que lo confirmes.</span>
          </h1>
          <TextoDialogo
            texto={adios ? "¡Tu cuenta se borró! Hasta pronto, viajero." : `${APP_NAME}: fichas personales con suposiciones de amigos.`}
            className="mt-6 max-w-xl text-xl text-tenue"
          />
          <div className="mt-8 flex flex-wrap gap-2">
            {usuario ? (
              <Link href="/hoy" className="boton-pixel boton-primario text-sm!">
                ▶ Continuar
              </Link>
            ) : (
              <>
                <Link href="/registro" className="boton-pixel boton-primario text-sm!">
                  ▶ Empezar partida
                </Link>
                <Link href="/entrar" className="boton-pixel text-sm!">
                  Ya tengo cuenta
                </Link>
              </>
            )}
          </div>
          <ul className="mt-10 grid max-w-xl grid-cols-3 gap-4 text-sm text-tenue">
            {[
              ["Privado", "por defecto"],
              ["Sin correo", "ni anuncios"],
              ["Gratis", "para amigos"],
            ].map(([a, b]) => (
              <li key={a}>
                <b className="block text-lg text-texto">{a}</b>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <Escena className="aparecer h-[clamp(20rem,48vw,34rem)] [--i:2]" />
      </section>

      <section className="mx-auto w-full max-w-[1680px] px-4 py-12 sm:px-6 lg:px-10">
        <h2 className="mb-8 text-[clamp(1.5rem,1.2rem+1vw,2.1rem)]">Todo lo que cabe en tu ficha</h2>
        <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-4">
          {FUNCIONES.map((f, i) => (
            <Ventana key={f.titulo} className="entra-rebote" style={{ ["--i" as string]: i }}>
              <div className="flotar mb-4 inline-block" style={{ ["--retraso" as string]: `${i * 0.3}s` }}>
                {f.avatar ? <Avatar id={f.avatar} escala={3} /> : <Sprite sprite={f.sprite!} escala={3} fps={2} />}
              </div>
              <h3 className="mb-2 text-xl">{f.titulo}</h3>
              <p className="text-tenue">{f.texto}</p>
            </Ventana>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1680px] px-4 py-12 sm:px-6 lg:px-10">
        <h2 className="mb-8 text-[clamp(1.5rem,1.2rem+1vw,2.1rem)]">Cómo se juega</h2>
        <ol className="grid gap-7 md:grid-cols-3">
          {PASOS.map(([t, d], i) => (
            <li key={t} className="tarjeta entra-rebote flex gap-4 p-5!" style={{ ["--i" as string]: i }}>
              <span className="titulo grid size-12 shrink-0 place-items-center bg-acento text-lg text-acento-texto" style={{ boxShadow: "3px 3px 0 0 var(--acento-2)" }}>
                {i + 1}
              </span>
              <div>
                <h3 className="mb-1 text-lg">{t}</h3>
                <p className="text-tenue">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {!usuario && (
        <section className="mx-auto w-full max-w-[1680px] px-4 py-12 sm:px-6 lg:px-10">
          <Ventana className="flex flex-col items-start gap-6 md:flex-row md:items-center">
            <div className="flex items-end gap-2">
              <Avatar id="pelirroja" escala={4} />
              <Avatar id="gato" escala={4} />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl">¿Cuánto te conocen de verdad?</h2>
              <p className="mt-1 text-tenue">«{APP_LEMA}»</p>
            </div>
            <Link href="/registro" className="boton-pixel boton-primario text-sm!">
              ▶ Crear mi ficha
            </Link>
          </Ventana>
        </section>
      )}
    </main>
  );
}
