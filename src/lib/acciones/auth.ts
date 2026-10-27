"use server";

import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { hashContrasena, normalizarCodigo, sha256, verificarContrasena, verificarFalso } from "@/lib/auth/hash";
import { crearCodigosRecuperacion } from "@/lib/auth/recuperacion";
import { limites } from "@/lib/auth/rate-limit";
import { cerrarSesionActual, cerrarTodasLasSesiones, crearSesion, ipCliente } from "@/lib/auth/sesiones";
import { db } from "@/lib/db";
import { recoveryCodes, users } from "@/lib/db/schema";
import { erroresDeCampo, esquemaLogin, esquemaRecuperar, esquemaRegistro, leerFormulario } from "@/lib/validacion";
import { ERROR_LIMITE, type Estado } from "./estado";

const ERROR_LOGIN = "Usuario o contraseña incorrectos";

function destinoSeguro(valor: FormDataEntryValue | null) {
  const s = typeof valor === "string" ? valor : "";
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : "/hoy";
}

export async function registrar(_: Estado, fd: FormData): Promise<Estado> {
  const datos = esquemaRegistro.safeParse(leerFormulario(fd));
  if (!datos.success) return { campos: erroresDeCampo(datos.error) };

  if (!(await limites.registro(await ipCliente())).success) return { error: ERROR_LIMITE };

  const { username, password } = datos.data;
  const lower = username.toLowerCase();
  const [existe] = await db.select({ id: users.id }).from(users).where(eq(users.usernameLower, lower)).limit(1);
  if (existe) return { campos: { username: "Ese nombre de usuario ya está ocupado" } };

  const passwordHash = await hashContrasena(password);
  const insertado = await db
    .insert(users)
    .values({ username, usernameLower: lower, passwordHash, displayName: username })
    .onConflictDoNothing({ target: users.usernameLower })
    .returning({ id: users.id });
  const nuevo = insertado[0];
  if (!nuevo) return { campos: { username: "Ese nombre de usuario ya está ocupado" } };

  const codigos = await crearCodigosRecuperacion(nuevo.id);
  await crearSesion(nuevo.id);
  return { ok: true, codigos };
}

export async function entrar(_: Estado, fd: FormData): Promise<Estado> {
  const datos = esquemaLogin.safeParse(leerFormulario(fd));
  if (!datos.success) return { error: ERROR_LOGIN };

  const lower = datos.data.username.toLowerCase();
  const [porIp, porUsuario] = await Promise.all([limites.login(await ipCliente()), limites.login(`u:${lower}`)]);
  if (!porIp.success || !porUsuario.success) return { error: ERROR_LIMITE };

  const [usuario] = await db
    .select({ id: users.id, passwordHash: users.passwordHash, bannedAt: users.bannedAt })
    .from(users)
    .where(eq(users.usernameLower, lower))
    .limit(1);

  const valida = usuario
    ? await verificarContrasena(usuario.passwordHash, datos.data.password)
    : await verificarFalso(datos.data.password);
  if (!usuario || !valida) return { error: ERROR_LOGIN };
  if (usuario.bannedAt) return { error: "Esta cuenta está suspendida." };

  await crearSesion(usuario.id);
  redirect(destinoSeguro(fd.get("siguiente")));
}

export async function salir() {
  await cerrarSesionActual();
  redirect("/");
}

export async function recuperarCuenta(_: Estado, fd: FormData): Promise<Estado> {
  const datos = esquemaRecuperar.safeParse(leerFormulario(fd));
  if (!datos.success) return { campos: erroresDeCampo(datos.error) };

  const lower = datos.data.username.toLowerCase();
  const [porIp, porUsuario] = await Promise.all([limites.recuperar(await ipCliente()), limites.recuperar(`u:${lower}`)]);
  if (!porIp.success || !porUsuario.success) return { error: ERROR_LIMITE };

  const ERROR = "Usuario o código de recuperación incorrectos";
  const [usuario] = await db.select({ id: users.id }).from(users).where(eq(users.usernameLower, lower)).limit(1);
  if (!usuario) return { error: ERROR };

  const codeHash = sha256(normalizarCodigo(datos.data.codigo));
  const usado = await db
    .update(recoveryCodes)
    .set({ usedAt: new Date() })
    .where(and(eq(recoveryCodes.userId, usuario.id), eq(recoveryCodes.codeHash, codeHash), isNull(recoveryCodes.usedAt)))
    .returning({ id: recoveryCodes.id });
  if (usado.length === 0) return { error: ERROR };

  await db.update(users).set({ passwordHash: await hashContrasena(datos.data.password) }).where(eq(users.id, usuario.id));
  await cerrarTodasLasSesiones(usuario.id);
  await crearSesion(usuario.id);
  redirect("/hoy");
}
