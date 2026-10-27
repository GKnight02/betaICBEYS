// Constantes compartidas entre servidor y cliente.

export const APP_NAME = "NoTeCreo";
export const APP_LEMA = "No te puedo creer todo… hasta que lo confirmes";

export const EDAD_MINIMA = 13;

export const SESION_COOKIE = "ntc_sesion";
export const SESION_DIAS = 30;
/** Si a la sesión le quedan menos días que esto, se renueva. */
export const SESION_RENOVAR_DIAS = 15;

export const CODIGOS_RECUPERACION = 8;
export const MAX_SUPOSICIONES_PENDIENTES = 10;

export const NOMBRES_RESERVADOS = new Set([
  "admin", "administrador", "root", "soporte", "support", "moderador", "mod",
  "api", "app", "ayuda", "help", "sistema", "system", "notecreo", "staff",
  "yo", "hoy", "u", "amigos", "grupos", "ajustes", "entrar", "registro",
  "salir", "notificaciones", "terminos", "privacidad", "null", "undefined",
]);

export const CATEGORIAS = {
  food: "Comidas",
  music: "Música",
  series: "Series",
  movie: "Películas",
  game: "Videojuegos",
  book: "Libros",
  anime: "Anime",
  place: "Lugares",
  hobby: "Hobbies",
  other: "Otros",
} as const;
export type Categoria = keyof typeof CATEGORIAS;
export const CATEGORIAS_GUSTOS = Object.keys(CATEGORIAS).filter((c) => c !== "food") as Categoria[];

export const MODOS = {
  always: "Siempre",
  season: "Temporada",
  recurring: "Recurrente",
  disliked: "Ya no / no le gusta",
} as const;
export type Modo = keyof typeof MODOS;

export const INTENSIDADES = {
  love: "Le encanta",
  like: "Le gusta",
  paused: "En pausa",
  no_longer: "Ya no",
} as const;
export type Intensidad = keyof typeof INTENSIDADES;

export const ESTADOS_ITEM = ["confirmed", "pending", "partial", "rejected"] as const;
export type EstadoItem = (typeof ESTADOS_ITEM)[number];

export const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export const ANIMOS = {
  1: "Muy mal",
  2: "Mal",
  3: "Normal",
  4: "Bien",
  5: "¡Genial!",
} as const;

export const ENERGIAS = { 1: "Baja", 2: "Media", 3: "Llena" } as const;

export const NECESIDADES = {
  espacio: "Espacio",
  compania: "Compañía",
  escucha: "Que me escuchen",
  comida: "Comida rica",
  distraerme: "Distraerme",
} as const;
export type Necesidad = keyof typeof NECESIDADES;

// Visibilidad por sección de la ficha
export const NIVELES = {
  private: "Solo yo",
  selected: "Amigos elegidos",
  friends: "Amigos",
  groups: "Amigos y grupos",
  public: "Público",
} as const;
export type Nivel = keyof typeof NIVELES;

export const SECCIONES = {
  profile: { nombre: "Perfil básico", porDefecto: "friends", opciones: ["private", "friends", "groups", "public"] },
  mood: { nombre: "Ánimo del día", porDefecto: "private", opciones: ["private", "selected", "friends"] },
  food: { nombre: "Comidas", porDefecto: "friends", opciones: ["private", "friends", "groups", "public"] },
  likes: { nombre: "Otros gustos", porDefecto: "friends", opciones: ["private", "friends", "groups", "public"] },
  gifts: { nombre: "Datos para regalos", porDefecto: "friends", opciones: ["private", "friends"] },
} as const satisfies Record<string, { nombre: string; porDefecto: Nivel; opciones: readonly Nivel[] }>;
export type Seccion = keyof typeof SECCIONES;

export const MOTIVOS_REPORTE = {
  acoso: "Acoso u ofensas",
  spam: "Spam",
  privacidad: "Expone datos privados",
  suplantacion: "Suplantación",
  otro: "Otro",
} as const;
