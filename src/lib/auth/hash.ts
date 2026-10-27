import { createHash, randomBytes } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";

// Parámetros recomendados por OWASP para Argon2id (19 MiB, 2 iteraciones)
const OPCIONES = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export function hashContrasena(contrasena: string) {
  return hash(contrasena, OPCIONES);
}

export async function verificarContrasena(hashGuardado: string, contrasena: string) {
  try {
    return await verify(hashGuardado, contrasena);
  } catch {
    return false;
  }
}

let hashFalso: Promise<string> | undefined;

/** Verifica contra un hash inventado para tardar lo mismo cuando el usuario no existe. */
export async function verificarFalso(contrasena: string) {
  hashFalso ??= hash("contraseña-que-nadie-usa-" + randomBytes(8).toString("hex"), OPCIONES);
  await verificarContrasena(await hashFalso, contrasena);
  return false;
}

export function sha256(valor: string) {
  return createHash("sha256").update(valor).digest("hex");
}

export function tokenAleatorio(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Código legible tipo ABCD-EFGH (sin 0/O ni 1/I para evitar confusiones). */
export function codigoLegible(grupos = 2, largo = 4) {
  const bytes = randomBytes(grupos * largo);
  const chars = Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]);
  const partes: string[] = [];
  for (let i = 0; i < grupos; i++) partes.push(chars.slice(i * largo, (i + 1) * largo).join(""));
  return partes.join("-");
}

export function normalizarCodigo(codigo: string) {
  return codigo.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}
