import { and, eq, getTableColumns, gt, ne } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SESION_COOKIE, SESION_DIAS, SESION_RENOVAR_DIAS } from "@/lib/config";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { sha256, tokenAleatorio } from "./hash";

const DIA = 24 * 60 * 60 * 1000;

const { passwordHash: _omitida, ...columnasPublicas } = getTableColumns(users);
export type UsuarioSesion = Omit<typeof users.$inferSelect, "passwordHash"> & { esAdmin: boolean };

function admins() {
  return (process.env.ADMIN_USERNAMES ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Crea la sesión y pone la cookie. Solo se puede llamar desde Server Actions o rutas. */
export async function crearSesion(userId: string) {
  const token = tokenAleatorio(32);
  const expiresAt = new Date(Date.now() + SESION_DIAS * DIA);
  await db.insert(sessions).values({ id: sha256(token), userId, expiresAt });
  const jar = await cookies();
  jar.set(SESION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/** Usuario de la petición actual (o null). Se memoriza por petición. */
export const usuarioActual = cache(async (): Promise<UsuarioSesion | null> => {
  const token = (await cookies()).get(SESION_COOKIE)?.value;
  if (!token) return null;
  const id = sha256(token);
  const [fila] = await db
    .select({ user: columnasPublicas, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())))
    .limit(1);
  if (!fila || fila.user.bannedAt) return null;

  // Renueva la expiración en la base si queda poco (la cookie la renueva proxy.ts)
  if (fila.expiresAt.getTime() - Date.now() < SESION_RENOVAR_DIAS * DIA) {
    await db
      .update(sessions)
      .set({ expiresAt: new Date(Date.now() + SESION_DIAS * DIA) })
      .where(eq(sessions.id, id));
  }
  const esAdmin = fila.user.role === "admin" || admins().includes(fila.user.usernameLower);
  return { ...fila.user, esAdmin };
});

export async function requerirUsuario() {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/entrar");
  return usuario;
}

export async function requerirAdmin() {
  const usuario = await requerirUsuario();
  if (!usuario.esAdmin) redirect("/hoy");
  return usuario;
}

export async function cerrarSesionActual() {
  const jar = await cookies();
  const token = jar.get(SESION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, sha256(token)));
  jar.delete(SESION_COOKIE);
}

/** Cierra todas las sesiones del usuario; opcionalmente conserva la actual. */
export async function cerrarTodasLasSesiones(userId: string, conservarActual = false) {
  const token = (await cookies()).get(SESION_COOKIE)?.value;
  if (conservarActual && token) {
    await db.delete(sessions).where(and(eq(sessions.userId, userId), ne(sessions.id, sha256(token))));
  } else {
    await db.delete(sessions).where(eq(sessions.userId, userId));
  }
}

export async function ipCliente() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}
