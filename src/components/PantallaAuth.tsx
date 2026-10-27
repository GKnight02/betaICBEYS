import type { ReactNode } from "react";
import { Escena } from "./Escena";
import { Ventana } from "./pixel/Ventana";

/** Pantalla dividida para entrar, registrarse o recuperar: escena a la izquierda y formulario a la derecha. */
export function PantallaAuth({
  titulo,
  antetitulo,
  lema,
  children,
}: {
  titulo: string;
  antetitulo: string;
  /** Frase grande junto a la escena (solo en pantallas anchas) */
  lema: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto grid w-full max-w-[1680px] items-center gap-10 px-4 py-10 sm:px-6 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-16 lg:px-10">
      <div className="hidden lg:block">
        <h2 className="aparecer mb-6 max-w-xl text-[clamp(1.8rem,1.2rem+1.6vw,3rem)] leading-tight">{lema}</h2>
        <Escena compacta className="aparecer h-[28rem] [--i:1]" />
      </div>
      <div className="mx-auto w-full max-w-lg">
        <p className="titulo aparecer mb-2 text-xs uppercase text-acento">{antetitulo}</p>
        <h1 className="aparecer mb-6">{titulo}</h1>
        <Ventana className="aparecer [--i:1]">{children}</Ventana>
      </div>
    </main>
  );
}
