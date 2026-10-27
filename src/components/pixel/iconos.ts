import type { Sprite } from "./sprites";

// Iconos de 9×9 en un solo color: "X" se pinta con currentColor, así siguen al texto y al tema.
function icono(filas: string[]): Sprite {
  return { ancho: 9, alto: 9, colores: { X: "currentColor" }, cuadros: [filas] };
}

export const ICONOS = {
  hoy: icono([
    "....X....",
    ".X.....X.",
    "...XXX...",
    "..XXXXX..",
    "X.XXXXX.X",
    "..XXXXX..",
    "...XXX...",
    ".X.....X.",
    "....X....",
  ]),
  ficha: icono([
    "XXXXXXXXX",
    "X.......X",
    "X.XX.XX.X",
    "X.XX....X",
    "X.......X",
    "X.XXXXX.X",
    "X.......X",
    "XXXXXXXXX",
    ".........",
  ]),
  amigos: icono([
    ".XX...XX.",
    "XXXX.XXXX",
    "XXXX.XXXX",
    ".XX...XX.",
    ".........",
    "XXXX.XXXX",
    "XXXX.XXXX",
    "XXXX.XXXX",
    ".........",
  ]),
  grupos: icono([
    ".........",
    "...XXX...",
    "...XXX...",
    "XX.....XX",
    "XX.....XX",
    "..XXXXX..",
    "XXXXXXXXX",
    "XXXXXXXXX",
    ".........",
  ]),
  avisos: icono([
    "....X....",
    "...XXX...",
    "..XXXXX..",
    "..XXXXX..",
    "..XXXXX..",
    ".XXXXXXX.",
    "XXXXXXXXX",
    ".........",
    "...XXX...",
  ]),
  ajustes: icono([
    "....X....",
    ".X.XXX.X.",
    "..XXXXX..",
    ".XXX.XXX.",
    "XXX...XXX",
    ".XXX.XXX.",
    "..XXXXX..",
    ".X.XXX.X.",
    "....X....",
  ]),
  admin: icono([
    ".XXXXXXX.",
    "XX.....XX",
    "X...X...X",
    "X..XXX..X",
    "X...X...X",
    "XX.....XX",
    ".XX...XX.",
    "..XX.XX..",
    "....X....",
  ]),
  salir: icono([
    "XXXXXX...",
    "X....X...",
    "X....X.X.",
    "X..XXXXXX",
    "X....X.X.",
    "X....X...",
    "X....X...",
    "XXXXXX...",
    ".........",
  ]),
} satisfies Record<string, Sprite>;

export type NombreIcono = keyof typeof ICONOS;
