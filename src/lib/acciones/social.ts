"use server";

import { and, asc, eq, ne } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { codigoLegible, normalizarCodigo, sha256 } from "@/lib/auth/hash";
import { limites } from "@/lib/auth/rate-limit";
import { requerirUsuario } from "@/lib/auth/sesiones";
import { db } from "@/lib/db";
import { blocks, friendships, groupMembers, groups, items, users } from "@/lib/db/schema";
import { notificar } from "@/lib/notificaciones";
import { parAmistad, relacion } from "@/lib/permisos";
import { erroresDeCampo, esquemaGrupo, leerFormulario } from "@/lib/validacion";
import { ERROR_LIMITE, type Estado } from "./estado";

const NO_ENCONTRADO = "No encontramos a nadie con ese usuario exacto.";

// ───────────── Amistades ─────────────

export async function enviarSolicitud(_: Estado, fd: FormData): Promise<Estado> {
  const yo = await requerirUsuario();
  if (!(await limites.social(yo.id)).success) return { error: ERROR_LIMITE };

  const username = String(fd.get("username") ?? "").trim().toLowerCase();
  if (!username) return { error: "Escribe un nombre de usuario" };
  const [otro] = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(eq(users.usernameLower, username))
    .limit(1);
  if (!otro) return { error: NO_ENCONTRADO };
  if (otro.id === yo.id) return { error: "No puedes enviarte una solicitud a ti mismo 😅" };

  const rel = await relacion(yo.id, otro.id);
  // Un bloqueo se trata como si el usuario no existiera
  if (rel.bloqueado) return { error: NO_ENCONTRADO };
  if (rel.amigos) return { mensaje: `Ya eres amigo de @${otro.username}` };
  if (rel.pendiente === "enviada") return { mensaje: "Ya le enviaste una solicitud; espera su respuesta." };
  if (rel.pendiente === "recibida") {
    await aceptarAmistad(otro.id);
    return { ok: true, mensaje: `¡Ahora eres amigo de @${otro.username}!` };
  }

  const [a, b] = parAmistad(yo.id, otro.id);
  await db.insert(friendships).values({ userA: a, userB: b, requestedBy: yo.id }).onConflictDoNothing();
  await notificar(otro.id, "friend_request", { from: yo.username });
  refresh();
  return { ok: true, mensaje: `Solicitud enviada a @${otro.username}` };
}

export async function aceptarAmistad(otroId: string) {
  const yo = await requerirUsuario();
  const [a, b] = parAmistad(yo.id, otroId);
  const hecho = await db
    .update(friendships)
    .set({ status: "accepted" })
    .where(
      and(
        eq(friendships.userA, a),
        eq(friendships.userB, b),
        eq(friendships.status, "pending"),
        ne(friendships.requestedBy, yo.id),
      ),
    )
    .returning({ a: friendships.userA });
  if (hecho.length) await notificar(otroId, "friend_accepted", { from: yo.username });
  refresh();
}

/** Rechaza una solicitud, cancela una enviada o elimina una amistad. */
export async function quitarAmistad(otroId: string) {
  const yo = await requerirUsuario();
  const [a, b] = parAmistad(yo.id, otroId);
  await db.delete(friendships).where(and(eq(friendships.userA, a), eq(friendships.userB, b)));
  refresh();
}

export async function bloquear(otroId: string) {
  const yo = await requerirUsuario();
  if (otroId === yo.id) return;
  const [a, b] = parAmistad(yo.id, otroId);
  await db.insert(blocks).values({ blockerId: yo.id, blockedId: otroId }).onConflictDoNothing();
  await db.delete(friendships).where(and(eq(friendships.userA, a), eq(friendships.userB, b)));
  // Sus suposiciones pendientes hacia mí desaparecen
  await db
    .delete(items)
    .where(and(eq(items.ownerId, yo.id), eq(items.proposedBy, otroId), eq(items.status, "pending")));
  refresh();
}

export async function desbloquear(otroId: string) {
  const yo = await requerirUsuario();
  await db.delete(blocks).where(and(eq(blocks.blockerId, yo.id), eq(blocks.blockedId, otroId)));
  refresh();
}

export async function bloquearPorNombre(_: Estado, fd: FormData): Promise<Estado> {
  const yo = await requerirUsuario();
  const username = String(fd.get("username") ?? "").trim().toLowerCase();
  const [otro] = await db.select({ id: users.id }).from(users).where(eq(users.usernameLower, username)).limit(1);
  if (!otro || otro.id === yo.id) return { error: NO_ENCONTRADO };
  await bloquear(otro.id);
  return { ok: true, mensaje: "Usuario bloqueado" };
}

// ───────────── Grupos ─────────────

async function rolEnGrupo(groupId: string, userId: string) {
  const [m] = await db
    .select({ role: groupMembers.role })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)))
    .limit(1);
  return m?.role ?? null;
}

export async function crearGrupo(_: Estado, fd: FormData): Promise<Estado> {
  const yo = await requerirUsuario();
  if (!(await limites.social(yo.id)).success) return { error: ERROR_LIMITE };
  const datos = esquemaGrupo.safeParse(leerFormulario(fd));
  if (!datos.success) return { campos: erroresDeCampo(datos.error) };
  const [g] = await db.insert(groups).values({ name: datos.data.name, ownerId: yo.id }).returning({ id: groups.id });
  await db.insert(groupMembers).values({ groupId: g!.id, userId: yo.id, role: "admin" });
  redirect(`/grupos/${g!.id}`);
}

/** Crea un código de invitación de un solo uso (reemplaza al anterior). */
export async function generarInvitacion(groupId: string, _: Estado): Promise<Estado> {
  const yo = await requerirUsuario();
  if ((await rolEnGrupo(groupId, yo.id)) !== "admin") return { error: "Solo un admin del grupo puede invitar" };
  const codigo = codigoLegible(2, 4);
  await db.update(groups).set({ inviteCodeHash: sha256(normalizarCodigo(codigo)) }).where(eq(groups.id, groupId));
  return { ok: true, codigo };
}

export async function unirseAGrupo(_: Estado, fd: FormData): Promise<Estado> {
  const yo = await requerirUsuario();
  if (!(await limites.social(yo.id)).success) return { error: ERROR_LIMITE };
  const codigo = normalizarCodigo(String(fd.get("codigo") ?? ""));
  if (codigo.length < 8) return { error: "Código no válido" };

  // Consumir el código en la misma consulta garantiza que sea de un solo uso
  const [g] = await db
    .update(groups)
    .set({ inviteCodeHash: null })
    .where(eq(groups.inviteCodeHash, sha256(codigo)))
    .returning({ id: groups.id, name: groups.name, ownerId: groups.ownerId });
  if (!g) return { error: "Ese código no existe o ya se usó" };

  await db.insert(groupMembers).values({ groupId: g.id, userId: yo.id, role: "member" }).onConflictDoNothing();
  const admins = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, g.id), eq(groupMembers.role, "admin")));
  await Promise.all(
    admins
      .filter((a) => a.userId !== yo.id)
      .map((a) => notificar(a.userId, "group_joined", { from: yo.username, group: g.name, groupId: g.id })),
  );
  redirect(`/grupos/${g.id}`);
}

export async function salirDeGrupo(groupId: string) {
  const yo = await requerirUsuario();
  await db.delete(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, yo.id)));
  const restantes = await db
    .select()
    .from(groupMembers)
    .where(eq(groupMembers.groupId, groupId))
    .orderBy(asc(groupMembers.joinedAt));
  if (restantes.length === 0) {
    await db.delete(groups).where(eq(groups.id, groupId));
  } else {
    const [g] = await db.select({ ownerId: groups.ownerId }).from(groups).where(eq(groups.id, groupId));
    if (g?.ownerId === yo.id) {
      // Pasa la propiedad al admin más antiguo, o al miembro más antiguo
      const heredero = restantes.find((m) => m.role === "admin") ?? restantes[0]!;
      await db.update(groups).set({ ownerId: heredero.userId }).where(eq(groups.id, groupId));
      await db
        .update(groupMembers)
        .set({ role: "admin" })
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, heredero.userId)));
    }
  }
  redirect("/grupos");
}

export async function gestionarMiembro(groupId: string, userId: string, accion: "expulsar" | "admin" | "member") {
  const yo = await requerirUsuario();
  if ((await rolEnGrupo(groupId, yo.id)) !== "admin" || userId === yo.id) return;
  const [g] = await db.select({ ownerId: groups.ownerId }).from(groups).where(eq(groups.id, groupId));
  if (!g || userId === g.ownerId) return; // nadie toca al creador
  if (accion === "expulsar") {
    await db.delete(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
  } else {
    await db
      .update(groupMembers)
      .set({ role: accion })
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
  }
  refresh();
}

export async function borrarGrupo(groupId: string) {
  const yo = await requerirUsuario();
  await db.delete(groups).where(and(eq(groups.id, groupId), eq(groups.ownerId, yo.id)));
  redirect("/grupos");
}
