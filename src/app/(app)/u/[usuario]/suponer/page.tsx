import { and, count, eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormItem } from "@/components/ficha/FormItem";
import { Encabezado } from "@/components/pixel/Encabezado";
import { Avatar, Sprite } from "@/components/pixel/Sprite";
import { SUPOSICION } from "@/components/pixel/sprites";
import { TextoDialogo } from "@/components/pixel/TextoDialogo";
import { Ventana } from "@/components/pixel/Ventana";
import { proponer } from "@/lib/acciones/suposiciones";
import { requerirUsuario } from "@/lib/auth/sesiones";
import { MAX_SUPOSICIONES_PENDIENTES } from "@/lib/config";
import { usuarioPorNombre } from "@/lib/consultas";
import { db } from "@/lib/db";
import { items } from "@/lib/db/schema";
import { puedeProponer, puedeVer } from "@/lib/permisos";

export const metadata: Metadata = { title: "Suponer algo" };

export default async function Suponer({ params }: { params: Promise<{ usuario: string }> }) {
  const yo = await requerirUsuario();
  const { usuario } = await params;
  const otro = await usuarioPorNombre(decodeURIComponent(usuario));
  if (!otro || otro.bannedAt || otro.id === yo.id) notFound();

  const [permitido, comidas, gustos, [pend]] = await Promise.all([
    puedeProponer(yo.id, otro.id),
    puedeVer(yo.id, otro.id, "food"),
    puedeVer(yo.id, otro.id, "likes"),
    db
      .select({ n: count() })
      .from(items)
      .where(and(eq(items.ownerId, otro.id), eq(items.proposedBy, yo.id), eq(items.status, "pending"))),
  ]);
  if (!permitido) notFound();

  const pendientes = pend?.n ?? 0;
  const tipo = comidas && gustos ? "todas" : comidas ? "food" : gustos ? "likes" : null;

  return (
    <>
      <Encabezado
        antetitulo="Nueva suposición"
        titulo={`¿Qué le gusta a ${otro.displayName}?`}
        icono={<Sprite sprite={SUPOSICION} escala={4} fps={3} />}
        acciones={
          <Link href={`/u/${otro.username}`} className="boton-pixel boton-mini">
            ◀ Volver a su ficha
          </Link>
        }
      />

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Ventana titulo="Tu suposición" className="aparecer">
          {tipo === null ? (
            <p>No tienes acceso a sus comidas ni a sus gustos, así que no puedes suponer nada todavía.</p>
          ) : pendientes >= MAX_SUPOSICIONES_PENDIENTES ? (
            <p>Ya tienes el máximo de suposiciones pendientes. Espera a que responda alguna.</p>
          ) : (
            <FormItem accion={proponer.bind(null, otro.id)} tipo={tipo} textoBoton="Enviar suposición" suposicion />
          )}
        </Ventana>

        <Ventana className="aparecer" style={{ ["--i" as string]: 1 }}>
          <div className="mb-4 flex items-end gap-2">
            <Avatar id={otro.avatar} escala={4} />
            <span className="flotar mb-8">
              <Sprite sprite={SUPOSICION} escala={2} fps={3} />
            </span>
          </div>
          <TextoDialogo texto={`¿Qué crees que le gusta (o no) a ${otro.displayName}? Quedará en duda hasta que lo confirme.`} />
          <div className="separador my-4" />
          <p className="mb-2 text-sm text-tenue">Pendientes con esta persona</p>
          <div className="flex items-center gap-3">
            <div className="h-3 flex-1 bg-panel-2" style={{ boxShadow: "0 0 0 2px var(--borde)" }}>
              <div className="h-full bg-acento" style={{ width: `${Math.min(100, (pendientes / MAX_SUPOSICIONES_PENDIENTES) * 100)}%` }} />
            </div>
            <span className="titulo text-sm">
              {pendientes}/{MAX_SUPOSICIONES_PENDIENTES}
            </span>
          </div>
        </Ventana>
      </div>
    </>
  );
}
