import type { Metadata } from "next";
import Link from "next/link";
import { Encabezado } from "@/components/pixel/Encabezado";
import { ICONOS } from "@/components/pixel/iconos";
import { Sprite } from "@/components/pixel/Sprite";
import { Ventana } from "@/components/pixel/Ventana";
import { requerirUsuario } from "@/lib/auth/sesiones";
import { gruposDe } from "@/lib/consultas";
import { FormCrearGrupo, FormUnirse } from "./FormsGrupo";

export const metadata: Metadata = { title: "Grupos" };

export default async function Grupos() {
  const yo = await requerirUsuario();
  const grupos = await gruposDe(yo.id);
  return (
    <>
      <Encabezado
        antetitulo="Social"
        titulo="Grupos"
        descripcion="Con un grupo compartís ánimo y actividad sin tener que ser amigos uno a uno."
      />
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_26rem]">
        <Ventana titulo="Mis grupos" acciones={<span className="chip">{grupos.length}</span>} className="aparecer">
          {grupos.length === 0 ? (
            <p className="text-tenue">Todavía no estás en ningún grupo.</p>
          ) : (
            <ul className="rejilla-auto [--min:15rem]">
              {grupos.map((g, i) => (
                <li key={g.id} className="entra-rebote" style={{ ["--i" as string]: i }}>
                  <Link href={`/grupos/${g.id}`} className="tarjeta tarjeta-viva flex h-full items-center gap-3 text-texto no-underline!">
                    <span className="grid size-11 shrink-0 place-items-center bg-acento text-acento-texto" style={{ boxShadow: "0 0 0 2px var(--borde)" }}>
                      <Sprite sprite={ICONOS.grupos} escala={3} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-lg font-bold">{g.name}</span>
                      <span className="titulo text-xs text-tenue uppercase">
                        {g.ownerId === yo.id ? "creador" : g.role === "admin" ? "admin" : "miembro"}
                      </span>
                    </span>
                    <span aria-hidden className="text-tenue">▶</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Ventana>
        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-1">
          <Ventana titulo="Crear grupo" className="aparecer" style={{ ["--i" as string]: 1 }}>
            <FormCrearGrupo />
          </Ventana>
          <Ventana titulo="Unirse con código" className="aparecer" style={{ ["--i" as string]: 2 }}>
            <FormUnirse />
          </Ventana>
        </div>
      </div>
    </>
  );
}
