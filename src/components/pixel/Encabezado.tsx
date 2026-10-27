import type { ReactNode } from "react";

/** Cabecera de página: antetítulo, título grande, descripción y acciones a la derecha (abajo en móvil). */
export function Encabezado({
  antetitulo,
  titulo,
  descripcion,
  icono,
  acciones,
  children,
}: {
  antetitulo?: ReactNode;
  titulo: ReactNode;
  descripcion?: ReactNode;
  /** Sprite o avatar a la izquierda del título */
  icono?: ReactNode;
  acciones?: ReactNode;
  /** Contenido extra bajo la cabecera (chips, pestañas…) */
  children?: ReactNode;
}) {
  return (
    <header className="aparecer mb-8">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {icono && <div className="flotar shrink-0">{icono}</div>}
          <div className="min-w-0">
            {antetitulo && <p className="titulo mb-1 text-xs uppercase text-acento">{antetitulo}</p>}
            <h1 className="break-words">{titulo}</h1>
            {descripcion && <div className="mt-1 max-w-3xl text-tenue">{descripcion}</div>}
          </div>
        </div>
        {acciones && <div className="flex flex-wrap items-center gap-1">{acciones}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </header>
  );
}
