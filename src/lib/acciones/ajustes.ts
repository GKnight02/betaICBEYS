"use server";

import { and, eq, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { hashContrasena, verificarContrasena } from "@/lib/auth/hash";
import { crearCodigosRecuperacion } from "@/lib/auth/recuperacion";
import { cerrarTodasLasSesiones, crearSesion, requerirUsuario } from "@/lib/auth/sesiones";
import { SECCIONES, SESION_COOKIE, type Nivel, type Seccion } from "@/lib/config";
import { idsAmigos } from "@/lib/consultas";
import { db } from "@/lib/db";
import { items, sectionVisibility, users } from "@/lib/db/schema";
import { erroresDeCampo, esquemaCambioContrasena } from "@/lib/validacion";
import type { Estado } from "./estado";

async function comprobarContrasena(userId: string, contrasena: string) {
  const [u] = await db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, userId));
  return !!u && (await verificarContrasena(u.hash, contrasena));
}

export async function guardarPrivacidad(_: Estado, fd: FormData): Promise<Estado> {
  const yo = await requerirUsuario();
  const amigos = new Set(await idsAmigos(yo.id));

  const filas = (Object.keys(SECCIONES) as Seccion[]).map((section) => {
    const opciones = SECCIONES[section].opciones as readonly Nivel[];
    const pedido = fd.get(`nivel_${section}`) as Nivel | null;
    const level = pedido && opciones.includes(pedido) ? pedido : SECCIONES[section].porDefecto;
    const allowedUserIds =
      level === "selected" ? fd.getAll(`elegidos_${section}`).map(String).filter((id) => amigos.has(id)) : [];
    return { userId: yo.id, section, level, allowedUserIds };
  });
  for (const fila of filas) {
    await db
      .insert(sectionVisibility)
      .values(fila)
      .onConflictDoUpdate({
        target: [sectionVisibility.userId, sectionVisibility.section],
        set: { level: fila.level, allowedUserIds: fila.allowedUserIds },
      });
  }

  const modo = String(fd.get("suposiciones"));
  const suppositions = modo === "off" || modo === "selected" ? modo : "all";
  const suppositionsAllowed =
    suppositions === "selected" ? fd.getAll("permitidos").map(String).filter((id) => amigos.has(id)) : [];
  await db.update(users).set({ suppositions, suppositionsAllowed }).where(eq(users.id, yo.id));

  refresh();
  return { ok: true, mensaje: "Privacidad guardada" };
}

export async function cambiarContrasena(_: Estado, fd: FormData): Promise<Estado> {
  const yo = await requerirUsuario();
  const datos = esquemaCambioContrasena.safeParse(Object.fromEntries(fd));
  if (!datos.success) return { campos: erroresDeCampo(datos.error) };
  if (!(await comprobarContrasena(yo.id, datos.data.actual))) {
    return { campos: { actual: "La contraseña actual no es correcta" } };
  }
  await db.update(users).set({ passwordHash: await hashContrasena(datos.data.password) }).where(eq(users.id, yo.id));
  // Cambiar la contraseña cierra todas las sesiones; abrimos una nueva para este dispositivo
  await cerrarTodasLasSesiones(yo.id);
  await crearSesion(yo.id);
  return { ok: true, mensaje: "Contraseña cambiada. Cerramos tus otras sesiones." };
}

export async function regenerarCodigos(_: Estado, fd: FormData): Promise<Estado> {
  const yo = await requerirUsuario();
  if (!(await comprobarContrasena(yo.id, String(fd.get("actual") ?? "")))) {
    return { campos: { actual: "La contraseña no es correcta" } };
  }
  return { ok: true, codigos: await crearCodigosRecuperacion(yo.id) };
}

export async function cerrarOtrasSesiones() {
  const yo = await requerirUsuario();
  await cerrarTodasLasSesiones(yo.id, true);
  refresh();
}

export async function borrarCuenta(_: Estado, fd: FormData): Promise<Estado> {
  const yo = await requerirUsuario();
  if (String(fd.get("confirmar") ?? "").trim().toLowerCase() !== yo.usernameLower) {
    return { campos: { confirmar: "Escribe tu nombre de usuario exacto para confirmar" } };
  }
  if (!(await comprobarContrasena(yo.id, String(fd.get("actual") ?? "")))) {
    return { campos: { actual: "La contraseña no es correcta" } };
  }
  // Las suposiciones que hice en otras fichas y siguen sin respuesta también se van
  await db.delete(items).where(and(eq(items.proposedBy, yo.id), inArray(items.status, ["pending", "rejected"])));
  // El resto (ficha, ánimo, sesiones, amistades, grupos...) cae en cascada
  await db.delete(users).where(eq(users.id, yo.id));
  (await cookies()).delete(SESION_COOKIE);
  redirect("/?adios=1");
}
