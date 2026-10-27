"use client";

import Link from "next/link";
import { BotonPixel } from "./pixel/BotonPixel";
import { TextoDialogo } from "./pixel/TextoDialogo";

/** Muestra los códigos de recuperación una única vez, con opción de copiarlos o descargarlos. */
export function CodigosRecuperacion({
  codigos,
  intro,
  continuar,
}: {
  codigos: string[];
  intro: string;
  continuar?: string;
}) {
  const texto = codigos.join("\n");
  return (
    <div>
      <TextoDialogo texto={intro} />
      <ol className="my-5 grid grid-cols-2 gap-2 @md:grid-cols-4">
        {codigos.map((c) => (
          <li key={c} className="chip m-0! justify-center py-2! text-sm! tracking-widest">
            {c}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        <BotonPixel type="button" onClick={() => navigator.clipboard?.writeText(texto)}>
          Copiar
        </BotonPixel>
        <a
          className="boton-pixel"
          download="notecreo-codigos.txt"
          href={`data:text/plain;charset=utf-8,${encodeURIComponent("Códigos de recuperación de NoTeCreo\n\n" + texto)}`}
        >
          Descargar
        </a>
        {continuar && (
          <Link href={continuar} className="boton-pixel boton-primario">
            Ya los guardé ▶
          </Link>
        )}
      </div>
    </div>
  );
}
