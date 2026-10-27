import type { CSSProperties, ReactElement } from "react";
import { spriteAvatar, type Sprite as SpriteDef } from "./sprites";

const memo = new WeakMap<SpriteDef, ReactElement[]>();

/** Convierte los mapas de caracteres en rectángulos SVG (une píxeles seguidos del mismo color). */
function rectangulos(s: SpriteDef) {
  const guardado = memo.get(s);
  if (guardado) return guardado;
  const out: ReactElement[] = [];
  s.cuadros.forEach((cuadro, i) => {
    cuadro.forEach((fila, y) => {
      let x = 0;
      while (x < fila.length) {
        const c = fila[x]!;
        if (c === "." || !s.colores[c]) {
          x++;
          continue;
        }
        let fin = x + 1;
        while (fin < fila.length && fila[fin] === c) fin++;
        out.push(
          <rect key={`${i}-${y}-${x}`} x={i * s.ancho + x} y={y} width={fin - x} height={1} fill={s.colores[c]} />,
        );
        x = fin;
      }
    });
  });
  memo.set(s, out);
  return out;
}

type Props = {
  sprite: SpriteDef;
  /** Escala entera (x2, x3, x4…) para que no se vea borroso. */
  escala?: number;
  fps?: number;
  /** loop: en bucle · una: se reproduce una vez y se queda en el último cuadro · quieto: primer cuadro */
  modo?: "loop" | "una" | "quieto";
  titulo?: string;
  className?: string;
};

export function Sprite({ sprite, escala = 4, fps = 2, modo = "loop", titulo, className = "" }: Props) {
  const n = sprite.cuadros.length;
  const e = Math.max(1, Math.round(escala));
  let animacion: CSSProperties = {};
  if (n > 1 && modo === "loop") {
    animacion = { animation: `sprite-hoja ${n / fps}s steps(${n}) infinite` };
  } else if (n > 1 && modo === "una") {
    animacion = {
      animation: `sprite-una ${(n - 1) / fps}s steps(${n - 1}) forwards`,
      ["--sprite-fin" as string]: `${-((n - 1) / n) * 100}%`,
    };
  }
  return (
    <span
      className={`sprite ${className}`}
      style={{ width: sprite.ancho * e, height: sprite.alto * e }}
      role={titulo ? "img" : undefined}
      aria-label={titulo}
      aria-hidden={titulo ? undefined : true}
    >
      <svg
        className="sprite-hoja"
        viewBox={`0 0 ${sprite.ancho * n} ${sprite.alto}`}
        width={sprite.ancho * n * e}
        height={sprite.alto * e}
        shapeRendering="crispEdges"
        style={animacion}
      >
        {rectangulos(sprite)}
      </svg>
    </span>
  );
}

export function Avatar({ id, escala = 4, nombre, className }: { id: string; escala?: number; nombre?: string; className?: string }) {
  return (
    <Sprite sprite={spriteAvatar(id)} escala={escala} fps={1.5} titulo={nombre ? `Avatar de ${nombre}` : undefined} className={className} />
  );
}
