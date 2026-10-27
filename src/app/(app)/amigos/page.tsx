import type { Metadata } from "next";
import Link from "next/link";
import { BotonPixel } from "@/components/pixel/BotonPixel";
import { Encabezado } from "@/components/pixel/Encabezado";
import { Avatar } from "@/components/pixel/Sprite";
import { Ventana } from "@/components/pixel/Ventana";
import { aceptarAmistad, desbloquear, quitarAmistad } from "@/lib/acciones/social";
import { requerirUsuario } from "@/lib/auth/sesiones";
import { amistadesDe, bloqueadosPor } from "@/lib/consultas";
import { puntosConocimiento } from "@/lib/items";
import { FormSolicitud } from "../u/[usuario]/FormSolicitud";
import { FormBloquear } from "./FormBloquear";

export const metadata: Metadata = { title: "Amigos" };

function Persona({ p }: { p: { username: string; displayName: string; avatar: string } }) {
  return (
    <span className="flex min-w-0 flex-1 items-center gap-3">
      <Avatar id={p.avatar} escala={2} />
      <Link href={`/u/${p.username}`} className="min-w-0">
        <span className="block truncate font-bold">{p.displayName}</span>
        <span className="block truncate text-sm text-tenue">@{p.username}</span>
      </Link>
    </span>
  );
}

export default async function Amigos() {
  const yo = await requerirUsuario();
  const [{ amigos, recibidas, enviadas }, bloqueados, xp] = await Promise.all([
    amistadesDe(yo.id),
    bloqueadosPor(yo.id),
    puntosConocimiento(yo.id),
  ]);
  const xpPorId = new Map(xp.map((x) => [x.id, x.xp]));

  return (
    <>
      <Encabezado
        antetitulo="Social"
        titulo="Amigos"
        descripcion="Tus amigos pueden ver tu ficha (según tu privacidad) y proponerte suposiciones."
        acciones={recibidas.length > 0 && <span className="chip chip-aviso">{recibidas.length} solicitudes nuevas</span>}
      />

      <div className="grid items-start gap-7 lg:grid-cols-[22rem_minmax(0,1fr)] 2xl:grid-cols-[24rem_minmax(0,1fr)_22rem]">
        <div className="pila">
          <Ventana titulo="Añadir amigo" className="aparecer">
            <p className="mb-3 text-tenue">No hay buscador público: pídele a tu amigo su nombre de usuario exacto.</p>
            <FormSolicitud />
          </Ventana>

          {recibidas.length > 0 && (
            <Ventana titulo="Solicitudes recibidas" acciones={<span className="chip chip-aviso">{recibidas.length}</span>} className="aparecer">
              <ul className="space-y-3">
                {recibidas.map((p) => (
                  <li key={p.id} className="tarjeta flex flex-wrap items-center gap-2">
                    <Persona p={p} />
                    <div className="flex">
                      <form action={aceptarAmistad.bind(null, p.id)}>
                        <BotonPixel mini variante="exito">Aceptar</BotonPixel>
                      </form>
                      <form action={quitarAmistad.bind(null, p.id)}>
                        <BotonPixel mini>Rechazar</BotonPixel>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            </Ventana>
          )}

          {enviadas.length > 0 && (
            <Ventana titulo="Solicitudes enviadas" className="aparecer">
              <ul className="space-y-3">
                {enviadas.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-2">
                    <Persona p={p} />
                    <form action={quitarAmistad.bind(null, p.id)}>
                      <BotonPixel mini>Cancelar</BotonPixel>
                    </form>
                  </li>
                ))}
              </ul>
            </Ventana>
          )}
        </div>

        <Ventana
          titulo="Mis amigos"
          acciones={<span className="chip">{amigos.length}</span>}
          className="aparecer"
          style={{ ["--i" as string]: 1 }}
        >
          {amigos.length === 0 ? (
            <p className="text-tenue">Aún no tienes amigos aquí.</p>
          ) : (
            <ul className="rejilla-auto [--min:17rem]">
              {amigos.map((p, i) => (
                <li key={p.id} className="tarjeta tarjeta-viva entra-rebote flex flex-col gap-3" style={{ ["--i" as string]: i }}>
                  <Persona p={p} />
                  <div className="mt-auto flex flex-wrap items-center gap-1">
                    {xpPorId.get(p.id) ? <span className="chip chip-exito">Te conoce: {xpPorId.get(p.id)} XP</span> : null}
                    <Link href={`/u/${p.username}/suponer`} className="boton-pixel boton-mini ml-auto">
                      ? Suponer
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Ventana>

        <Ventana titulo="Bloqueos" className="aparecer lg:col-span-2 2xl:col-span-1" style={{ ["--i" as string]: 2 }}>
          <p className="mb-3 text-tenue">Un usuario bloqueado no puede encontrarte, ver tu ficha ni proponerte suposiciones.</p>
          {bloqueados.length > 0 && (
            <ul className="mb-4 space-y-2">
              {bloqueados.map((p) => (
                <li key={p.id} className="flex items-center gap-2">
                  <span className="flex-1">@{p.username}</span>
                  <form action={desbloquear.bind(null, p.id)}>
                    <BotonPixel mini>Desbloquear</BotonPixel>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <FormBloquear />
        </Ventana>
      </div>
    </>
  );
}
