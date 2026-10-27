import type { CSSProperties, ReactNode } from "react";

/** Panel con borde de píxel y sombra escalonada. El título va en una cabecera con hueco para acciones. */
export function Ventana({
  titulo,
  acciones,
  children,
  className = "",
  style,
  as: Etiqueta = "section",
  id,
}: {
  titulo?: ReactNode;
  /** Botones o chips a la derecha del título */
  acciones?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: "section" | "div" | "article";
  id?: string;
}) {
  return (
    <Etiqueta id={id} className={`ventana scroll-mt-24 ${className}`} style={style}>
      {(titulo || acciones) && (
        <header className="ventana-cabecera flex-wrap">
          {titulo && <h2 className="ventana-titulo">{titulo}</h2>}
          {acciones && <div className="flex flex-wrap items-center gap-1">{acciones}</div>}
        </header>
      )}
      {children}
    </Etiqueta>
  );
}
