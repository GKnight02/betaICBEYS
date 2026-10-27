"use client";

import { LayoutGroup, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { salir } from "@/lib/acciones/auth";
import { APP_NAME } from "@/lib/config";
import { ICONOS, type NombreIcono } from "./pixel/iconos";
import { sonar } from "./pixel/sonido";
import { Avatar, Sprite } from "./pixel/Sprite";
import { SUPOSICION } from "./pixel/sprites";

type Enlace = { href: string; texto: string; corto: string; icono: NombreIcono };

const ENLACES: Enlace[] = [
  { href: "/hoy", texto: "Hoy", corto: "Hoy", icono: "hoy" },
  { href: "/yo", texto: "Mi ficha", corto: "Ficha", icono: "ficha" },
  { href: "/amigos", texto: "Amigos", corto: "Amigos", icono: "amigos" },
  { href: "/grupos", texto: "Grupos", corto: "Grupos", icono: "grupos" },
  { href: "/notificaciones", texto: "Avisos", corto: "Avisos", icono: "avisos" },
  { href: "/ajustes", texto: "Ajustes", corto: "Ajustes", icono: "ajustes" },
];
const ADMIN: Enlace = { href: "/admin", texto: "Moderación", corto: "Admin", icono: "admin" };

type Usuario = { displayName: string; username: string; avatar: string };
type Props = { avisos: number; esAdmin: boolean; usuario: Usuario };

function esActivo(ruta: string, href: string) {
  return ruta === href || ruta.startsWith(href + "/");
}

function Globo({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="globo" aria-label={`${n} sin leer`}>
      {n > 99 ? "99+" : n}
    </span>
  );
}

function Logo({ compacto }: { compacto?: boolean }) {
  return (
    <Link href="/hoy" className="flex items-center gap-2 text-texto no-underline!" aria-label={`${APP_NAME}, ir a Hoy`}>
      <span className="flotar">
        <Sprite sprite={SUPOSICION} escala={2} fps={3} />
      </span>
      <span className={`text-xl font-bold tracking-tight ${compacto ? "hidden lg:inline" : ""}`}>{APP_NAME}</span>
    </Link>
  );
}

/** Barra lateral: carril de iconos en tablet y panel completo en escritorio. */
export function NavLateral({ avisos, esAdmin, usuario }: Props) {
  const ruta = usePathname();
  const enlaces = esAdmin ? [...ENLACES, ADMIN] : ENLACES;
  return (
    <aside className="lateral sticky top-0 z-30 hidden h-dvh w-20 shrink-0 flex-col md:flex lg:w-64">
      <div className="flex h-20 items-center justify-center px-4 lg:justify-start lg:px-6">
        <Logo compacto />
      </div>

      <Link
        href="/yo"
        className="tarjeta tarjeta-viva mx-3 mb-4 flex items-center justify-center gap-3 p-2! text-texto no-underline! lg:mx-5 lg:justify-start lg:p-3!"
        title="Mi ficha"
      >
        <Avatar id={usuario.avatar} escala={2} />
        <span className="hidden min-w-0 lg:block">
          <span className="block truncate font-bold">{usuario.displayName}</span>
          <span className="block truncate text-sm text-tenue">@{usuario.username}</span>
        </span>
      </Link>

      <nav aria-label="Principal" className="flex-1 overflow-y-auto px-3 lg:px-5">
        <p className="titulo mb-2 hidden px-1 text-[0.65rem] uppercase text-tenue lg:block">Menú</p>
        <LayoutGroup id="nav-lateral">
          <ul className="space-y-1.5">
            {enlaces.map((e) => {
              const activo = esActivo(ruta, e.href);
              return (
                <li key={e.href}>
                  <Link
                    href={e.href}
                    onClick={() => sonar("bip")}
                    aria-current={activo ? "page" : undefined}
                    title={e.texto}
                    className="nav-enlace justify-center lg:justify-start"
                  >
                    {activo && (
                      <motion.span
                        layoutId="nav-activo"
                        className="nav-activo"
                        transition={{ type: "spring", stiffness: 500, damping: 38 }}
                      />
                    )}
                    <span className="nav-icono relative z-10">
                      <Sprite sprite={ICONOS[e.icono]} escala={2} />
                    </span>
                    <span className="relative z-10 hidden flex-1 lg:inline">{e.texto}</span>
                    {e.href === "/notificaciones" && (
                      <span className="absolute top-1 right-1 z-10 lg:static">
                        <Globo n={avisos} />
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </LayoutGroup>
      </nav>

      <div className="space-y-3 p-3 lg:p-5">
        <div className="separador" />
        <form action={salir}>
          <button className="nav-enlace w-full cursor-pointer justify-center text-tenue lg:justify-start" title="Salir">
            <span className="nav-icono">
              <Sprite sprite={ICONOS.salir} escala={2} />
            </span>
            <span className="hidden lg:inline">Salir</span>
          </button>
        </form>
        <p className="hidden px-1 text-sm text-tenue lg:block">
          <Link href="/terminos">Términos</Link> · <Link href="/privacidad">Privacidad</Link>
        </p>
      </div>
    </aside>
  );
}

/** Móvil: barra superior con logo y accesos rápidos, y barra inferior de pestañas. */
export function NavMovil({ avisos, esAdmin, usuario }: Props) {
  const ruta = usePathname();
  const pestanas = ENLACES.filter((e) => e.href !== "/ajustes");
  return (
    <>
      <header className="barra-superior sticky top-0 z-30 flex h-16 items-center gap-2 px-4 md:hidden">
        <Logo />
        <div className="ml-auto flex items-center gap-1">
          {esAdmin && (
            <Link href={ADMIN.href} className="p-2 text-texto" aria-label={ADMIN.texto} aria-current={esActivo(ruta, ADMIN.href) ? "page" : undefined}>
              <Sprite sprite={ICONOS.admin} escala={2} />
            </Link>
          )}
          <Link href="/ajustes" className="p-2 text-texto" aria-label="Ajustes" aria-current={esActivo(ruta, "/ajustes") ? "page" : undefined}>
            <Sprite sprite={ICONOS.ajustes} escala={2} />
          </Link>
          <Link href="/yo" className="ml-1" aria-label="Mi ficha">
            <Avatar id={usuario.avatar} escala={2} />
          </Link>
        </div>
      </header>

      <nav aria-label="Principal" className="barra-movil fixed inset-x-0 bottom-0 z-40 md:hidden">
        <LayoutGroup id="nav-movil">
          <ul className="grid grid-cols-5">
            {pestanas.map((e) => {
              const activo = esActivo(ruta, e.href);
              return (
                <li key={e.href}>
                  <Link
                    href={e.href}
                    onClick={() => sonar("bip")}
                    aria-current={activo ? "page" : undefined}
                    className={`relative flex flex-col items-center gap-1 py-2.5 text-xs no-underline! ${activo ? "text-acento" : "text-tenue"}`}
                  >
                    {activo && (
                      <motion.span
                        layoutId="pestana-activa"
                        className="absolute inset-x-3 top-0 h-1 bg-acento"
                        transition={{ type: "spring", stiffness: 500, damping: 38 }}
                      />
                    )}
                    <span className={`relative transition-transform ${activo ? "-translate-y-0.5" : ""}`}>
                      <Sprite sprite={ICONOS[e.icono]} escala={2} />
                      {e.href === "/notificaciones" && (
                        <span className="absolute -top-2 -right-4">
                          <Globo n={avisos} />
                        </span>
                      )}
                    </span>
                    {e.corto}
                  </Link>
                </li>
              );
            })}
          </ul>
        </LayoutGroup>
      </nav>
    </>
  );
}
