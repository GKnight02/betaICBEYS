// Sprites en pixel art definidos como mapas de caracteres.
// Cada cuadro es una lista de filas; "." es transparente y cada letra apunta a un color.
// Se dibujan como una hoja horizontal (SVG) y se animan con CSS steps(), igual que una hoja PNG.

export type Sprite = {
  ancho: number;
  alto: number;
  colores: Record<string, string>;
  cuadros: string[][];
};

// Paleta Sweetie 16 (Lospec)
export const P = {
  negro: "#1a1c2c",
  morado: "#5d275d",
  rojo: "#b13e53",
  naranja: "#ef7d57",
  amarillo: "#ffcd75",
  lima: "#a7f070",
  verde: "#38b764",
  turquesa: "#257179",
  marino: "#29366f",
  azul: "#3b5dc9",
  celeste: "#41a6f6",
  cian: "#73eff7",
  blanco: "#f4f4f4",
  gris: "#94b0c2",
  pizarra: "#566c86",
  noche: "#333c57",
} as const;

const PIEL = { clara: "#f4c9a0", media: "#c68a5e", oscura: "#8d5a3b" };

/** Cuadro de "respirar": la cabeza baja un píxel y tapa el cuello. */
function respirar(filas: string[]) {
  return [".".repeat(filas[0]!.length), ...filas.slice(0, 11), ...filas.slice(12)];
}

/** Cuadro de "flotar": todo sube un píxel. */
function flotar(filas: string[]) {
  return [...filas.slice(1), ".".repeat(filas[0]!.length)];
}

const CABELLO_CORTO = [
  "................",
  "....OOOOOOOO....",
  "...OHHHHHHHHO...",
  "..OHHHHHHHHHHO..",
  "..OHHHHHHHHHHO..",
  "..OHSSSSSSSSHO..",
  "..OSSESSSSESSO..",
  "..OSSESSSSESSO..",
  "..OSBSSSSSSBSO..",
  "..OSSSSMMSSSSO..",
  "...OSSSSSSSSO...",
  "....OOSSSSOO....",
  "...OCCCCCCCCO...",
  "..OCCCCCCCCCCO..",
  "..OCCCCCCCCCCO..",
  "..OOOOOOOOOOOO..",
];

const CABELLO_LARGO = [
  "................",
  "....OOOOOOOO....",
  "...OHHHHHHHHO...",
  "..OHHHHHHHHHHO..",
  ".OHHHHHHHHHHHHO.",
  ".OHHSSSSSSSSHHO.",
  ".OHSSESSSSESSHO.",
  ".OHSSESSSSESSHO.",
  ".OHSBSSSSSSBSHO.",
  ".OHSSSSMMSSSSHO.",
  ".OHHSSSSSSSSHHO.",
  ".OHHOOSSSSOOHHO.",
  "..OOCCCCCCCCOO..",
  "..OCCCCCCCCCCO..",
  "..OCCCCCCCCCCO..",
  "..OOOOOOOOOOOO..",
];

const GATO = [
  "................",
  "..OO........OO..",
  "..OHO......OHO..",
  "..OHHOOOOOOHHO..",
  "..OHHHHHHHHHHO..",
  "..OHHHHHHHHHHO..",
  "..OHHEHHHHEHHO..",
  "..OHHEHHHHEHHO..",
  ".OOHBHHHHHHBHOO.",
  "..OHHHHMMHHHHO..",
  "...OHHHHHHHHO...",
  "....OOHHHHOO....",
  "...OHHHHHHHHO...",
  "..OHHHHHHHHHHO..",
  "..OHHHHHHHHHHO..",
  "..OOOOOOOOOOOO..",
];

const FANTASMA = [
  "................",
  ".....OOOOOO.....",
  "....OSSSSSSO....",
  "...OSSSSSSSSO...",
  "..OSSSSSSSSSSO..",
  "..OSSSSSSSSSSO..",
  "..OSSESSSSESSO..",
  "..OSSESSSSESSO..",
  "..OSBSSSSSSBSO..",
  "..OSSSSMMSSSSO..",
  "..OSSSSSSSSSSO..",
  "..OSSSSSSSSSSO..",
  "..OSSSSSSSSSSO..",
  "..OSSSSSSSSSSO..",
  "..OSOSSOOSSOSO..",
  "..OO.OO..OO.OO..",
];

function personaje(base: string[], c: { H: string; S: string; C: string; B?: string; O?: string }): Sprite {
  return {
    ancho: 16,
    alto: 16,
    colores: { O: c.O ?? P.negro, E: P.negro, M: P.rojo, B: c.B ?? P.naranja, H: c.H, S: c.S, C: c.C },
    cuadros: [base, respirar(base)],
  };
}

export const AVATARES = {
  pelirroja: { nombre: "Pelirroja", sprite: personaje(CABELLO_LARGO, { H: P.rojo, S: PIEL.clara, C: P.verde }) },
  moreno: { nombre: "Moreno", sprite: personaje(CABELLO_CORTO, { H: P.noche, S: PIEL.media, C: P.azul }) },
  rubio: { nombre: "Rubio", sprite: personaje(CABELLO_CORTO, { H: P.amarillo, S: PIEL.clara, C: P.rojo }) },
  azul: { nombre: "Pelo azul", sprite: personaje(CABELLO_LARGO, { H: P.celeste, S: PIEL.clara, C: P.morado }) },
  morena: { nombre: "Morena", sprite: personaje(CABELLO_LARGO, { H: P.noche, S: PIEL.oscura, C: P.naranja }) },
  verde: { nombre: "Pelo verde", sprite: personaje(CABELLO_CORTO, { H: P.verde, S: PIEL.media, C: P.marino }) },
  gato: { nombre: "Gato", sprite: personaje(GATO, { H: P.naranja, S: P.naranja, C: P.naranja, B: P.rojo }) },
  fantasma: {
    nombre: "Fantasma",
    sprite: {
      ...personaje(FANTASMA, { H: P.blanco, S: P.blanco, C: P.blanco, O: P.pizarra }),
      cuadros: [FANTASMA, flotar(FANTASMA)],
    },
  },
} satisfies Record<string, { nombre: string; sprite: Sprite }>;

export type AvatarId = keyof typeof AVATARES;

export function spriteAvatar(id: string) {
  return (AVATARES[id as AvatarId] ?? AVATARES.pelirroja).sprite;
}

// ───────────── Caras de ánimo (5 niveles) ─────────────

type Punto = [fila: number, col: number];

function caraBase() {
  const filas: string[][] = [];
  for (let y = 0; y < 16; y++) {
    const fila: string[] = [];
    for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x - 7.5, y - 7.5);
      fila.push(d <= 6.6 ? "F" : d <= 7.6 ? "O" : ".");
    }
    filas.push(fila);
  }
  return filas;
}

function cara(boca: Punto[], extra: { relleno?: Punto[]; lagrima?: Punto[] }, parpadeo: boolean) {
  const f = caraBase();
  const ojos: Punto[] = parpadeo ? [[7, 5], [7, 10]] : [[5, 5], [6, 5], [5, 10], [6, 10]];
  for (const [y, x] of ojos) f[y]![x] = "E";
  for (const [y, x] of boca) f[y]![x] = "E";
  for (const [y, x] of extra.relleno ?? []) f[y]![x] = "M";
  for (const [y, x] of extra.lagrima ?? []) f[y]![x] = "T";
  return f.map((r) => r.join(""));
}

const BOCAS: Record<number, { boca: Punto[]; relleno?: Punto[]; lagrima?: Punto[] }> = {
  1: { boca: [[11, 5], [10, 6], [10, 7], [10, 8], [10, 9], [11, 10]], lagrima: [[8, 4], [9, 4]] },
  2: { boca: [[11, 6], [10, 7], [10, 8], [11, 9]] },
  3: { boca: [[10, 6], [10, 7], [10, 8], [10, 9]] },
  4: { boca: [[10, 5], [11, 6], [11, 7], [11, 8], [11, 9], [10, 10]] },
  5: {
    boca: [[9, 4], [10, 5], [11, 6], [11, 7], [11, 8], [11, 9], [10, 10], [9, 11]],
    relleno: [[10, 6], [10, 7], [10, 8], [10, 9]],
  },
};

const COLOR_ANIMO: Record<number, string> = { 1: P.azul, 2: P.cian, 3: P.gris, 4: P.lima, 5: P.amarillo };

export const ANIMO_SPRITES: Record<number, Sprite> = Object.fromEntries(
  [1, 2, 3, 4, 5].map((n) => {
    const b = BOCAS[n]!;
    const abierta = cara(b.boca, b, false);
    return [
      n,
      {
        ancho: 16,
        alto: 16,
        colores: { O: P.negro, E: P.negro, F: COLOR_ANIMO[n]!, M: P.rojo, T: P.blanco },
        cuadros: [abierta, abierta, abierta, cara(b.boca, b, true)],
      } satisfies Sprite,
    ];
  }),
);

export const COLOR_ANIMO_CSS = COLOR_ANIMO;

// ───────────── Objetos ─────────────

const INTERROGACION = [
  "................",
  ".OOOOOOOOOOOOOO.",
  ".OYYYYYYYYYYYYO.",
  ".OYDYYYYYYYYDYO.",
  ".OYYYYQQQQYYYYO.",
  ".OYYYQQYYQQYYYO.",
  ".OYYYYYYYQQYYYO.",
  ".OYYYYYYQQYYYYO.",
  ".OYYYYYQQYYYYYO.",
  ".OYYYYYQQYYYYYO.",
  ".OYYYYYYYYYYYYO.",
  ".OYYYYYQQYYYYYO.",
  ".OYDYYYYYYYYDYO.",
  ".OYYYYYYYYYYYYO.",
  ".OOOOOOOOOOOOOO.",
  "................",
];

export const SUPOSICION: Sprite = {
  ancho: 16,
  alto: 16,
  colores: { O: P.negro, Y: P.amarillo, D: P.naranja, Q: P.blanco },
  cuadros: [INTERROGACION, INTERROGACION, flotar(INTERROGACION), flotar(INTERROGACION)],
};

const COFRE_ABAJO = [
  ".OWWWWWGGWWWWWO.",
  ".OWWWWWOOWWWWWO.",
  ".OWWWWWWWWWWWWO.",
  ".OGGGGGGGGGGGGO.",
  ".OWWWWWWWWWWWWO.",
  ".OWWWWWWWWWWWWO.",
  ".OOOOOOOOOOOOOO.",
  "................",
];

export const COFRE: Sprite = {
  ancho: 16,
  alto: 16,
  colores: { O: P.negro, W: P.naranja, G: P.amarillo, K: P.noche, S: P.blanco },
  cuadros: [
    [
      "................",
      "................",
      "................",
      "..OOOOOOOOOOOO..",
      ".OWWWWWWWWWWWWO.",
      ".OWWWWWWWWWWWWO.",
      ".OGGGGGGGGGGGGO.",
      ".OOOOOOGGOOOOOO.",
      ...COFRE_ABAJO,
    ],
    [
      "..OOOOOOOOOOOO..",
      ".OWWWWWWWWWWWWO.",
      ".OGGGGGGGGGGGGO.",
      ".OOOOOOOOOOOOOO.",
      ".OKKKKKKKKKKKKO.",
      ".OKKSKKKKKKSKKO.",
      ".OKKKKKSKKKKKKO.",
      ".OOOOOOGGOOOOOO.",
      ...COFRE_ABAJO,
    ],
  ],
};

export const CORAZON: Sprite = {
  ancho: 8,
  alto: 8,
  colores: { O: P.negro, R: P.rojo, W: P.blanco },
  cuadros: [
    [".OO.OO..", "OWRORRO.", "ORRRRRO.", "ORRRRRO.", ".ORRRO..", "..ORO...", "...O....", "........"],
  ],
};

export const NUBE: Sprite = {
  ancho: 16,
  alto: 8,
  colores: { O: P.gris, W: P.blanco },
  cuadros: [
    [
      "......OOOO......",
      "....OOWWWWOO....",
      "..OOWWWWWWWWOO..",
      ".OWWWWWWWWWWWWO.",
      "OWWWWWWWWWWWWWWO",
      "OWWWWWWWWWWWWWWO",
      ".OOOOOOOOOOOOOO.",
      "................",
    ],
  ],
};
