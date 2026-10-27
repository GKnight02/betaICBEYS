import { z } from "zod";
import { CATEGORIAS, INTENSIDADES, MODOS, MOTIVOS_REPORTE, NECESIDADES, NOMBRES_RESERVADOS } from "./config";
import { contieneOfensas } from "./filtro";

const sinOfensas = (s: string) => !contieneOfensas(s);
const MSG_OFENSA = "Ese texto contiene palabras no permitidas";

/** Texto libre opcional: vacío → null. */
const opcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .refine(sinOfensas, { error: MSG_OFENSA })
    .optional()
    .transform((v) => (v ? v : null));

const obligatorio = (max: number, campo = "Este campo") =>
  z
    .string({ error: `${campo} es obligatorio` })
    .trim()
    .min(1, `${campo} es obligatorio`)
    .max(max, `Máximo ${max} caracteres`)
    .refine(sinOfensas, { error: MSG_OFENSA });

const fechaOpcional = z
  .string()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), { error: "Fecha no válida" });

const enlace = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^https?:\/\/[^\s]+$/i.test(v), {
    error: "El enlace debe empezar por http:// o https://",
  });

export const esquemaUsuario = z
  .string({ error: "Escribe un nombre de usuario" })
  .trim()
  .min(3, "El usuario debe tener al menos 3 caracteres")
  .max(20, "El usuario puede tener como máximo 20 caracteres")
  .regex(/^[A-Za-z0-9_]+$/, "Solo letras, números y guión bajo");

export const esquemaContrasena = z
  .string({ error: "Escribe una contraseña" })
  .min(10, "La contraseña debe tener al menos 10 caracteres")
  .max(200, "La contraseña es demasiado larga");

export const esquemaRegistro = z
  .object({
    username: esquemaUsuario
      .refine((u) => !NOMBRES_RESERVADOS.has(u.toLowerCase()), { error: "Ese nombre está reservado" })
      .refine(sinOfensas, { error: MSG_OFENSA }),
    password: esquemaContrasena,
    confirm: z.string(),
    edad: z.literal("on", { error: "Debes confirmar la edad mínima" }),
  })
  .refine((d) => d.password === d.confirm, { error: "Las contraseñas no coinciden", path: ["confirm"] });

export const esquemaLogin = z.object({
  username: z.string().trim().min(1).max(50),
  password: z.string().min(1).max(200),
});

export const esquemaRecuperar = z
  .object({
    username: z.string().trim().min(1, "Escribe tu usuario").max(50),
    codigo: z.string().trim().min(8, "Código no válido").max(20, "Código no válido"),
    password: esquemaContrasena,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { error: "Las contraseñas no coinciden", path: ["confirm"] });

export const esquemaCambioContrasena = z
  .object({
    actual: z.string().min(1, "Escribe tu contraseña actual"),
    password: esquemaContrasena,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { error: "Las contraseñas no coinciden", path: ["confirm"] });

export const esquemaPerfil = z.object({
  displayName: obligatorio(40, "El nombre visible"),
  nickname: opcional(30),
  avatar: z.string().max(30),
  birthday: fechaOpcional,
  bio: opcional(140),
  allergies: opcional(300),
  giftSizes: opcional(200),
  giftColors: opcional(200),
});

export const esquemaItem = z
  .object({
    category: z.enum(Object.keys(CATEGORIAS) as [keyof typeof CATEGORIAS]),
    name: obligatorio(80, "El nombre"),
    detail: opcional(300),
    link: enlace,
    intensity: z.enum(Object.keys(INTENSIDADES) as [keyof typeof INTENSIDADES]),
    mode: z.enum(Object.keys(MODOS) as [keyof typeof MODOS]),
    startDate: fechaOpcional,
    expectedEnd: fechaOpcional,
    recurringMonths: z.array(z.coerce.number().int().min(1).max(12)).max(12),
  })
  .refine((d) => d.mode !== "recurring" || d.recurringMonths.length > 0, {
    error: "Elige al menos un mes para algo recurrente",
    path: ["recurringMonths"],
  });

export const esquemaAnimo = z.object({
  mood: z.coerce.number({ error: "Elige tu ánimo" }).int().min(1, "Elige tu ánimo").max(5),
  energy: z.coerce.number({ error: "Elige tu energía" }).int().min(1, "Elige tu energía").max(3),
  needs: z.array(z.enum(Object.keys(NECESIDADES) as [keyof typeof NECESIDADES])).max(5),
  note: opcional(500),
});

export const esquemaRespuesta = z.object({
  response: z.enum(["confirmed", "partial", "rejected"]),
  comment: opcional(200),
});

export const esquemaGrupo = z.object({ name: obligatorio(40, "El nombre del grupo") });

export const esquemaReporte = z.object({
  targetType: z.enum(["user", "item"]),
  targetId: z.uuid(),
  reason: z.enum(Object.keys(MOTIVOS_REPORTE) as [keyof typeof MOTIVOS_REPORTE]),
  detail: opcional(500),
});

export const esquemaDeseo = z.object({
  name: obligatorio(80, "El nombre"),
  link: enlace,
  note: opcional(200),
});

/** Errores de Zod como { campo: "mensaje" } (el primero de cada campo). */
export function erroresDeCampo(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const campo = String(issue.path[0] ?? "_");
    out[campo] ??= issue.message;
  }
  return out;
}

/** FormData → objeto plano; los campos de `listas` se leen con getAll. */
export function leerFormulario(fd: FormData, listas: string[] = []) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (k.startsWith("$")) continue;
    if (typeof v === "string") out[k] = v;
  }
  for (const k of listas) out[k] = fd.getAll(k).filter((v) => typeof v === "string");
  return out;
}
