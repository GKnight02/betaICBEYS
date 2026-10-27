import { and, desc, eq, getTableColumns, inArray, or } from "drizzle-orm";
import { db } from "./db";
import { blocks, friendships, groupMembers, groups, users } from "./db/schema";

const perfilCorto = {
  id: users.id,
  username: users.username,
  displayName: users.displayName,
  avatar: users.avatar,
  birthday: users.birthday,
};

/** Amigos aceptados y solicitudes de un usuario. */
export async function amistadesDe(userId: string) {
  const filas = await db
    .select()
    .from(friendships)
    .where(or(eq(friendships.userA, userId), eq(friendships.userB, userId)))
    .orderBy(desc(friendships.createdAt));
  const otros = filas.map((f) => (f.userA === userId ? f.userB : f.userA));
  const perfiles = otros.length ? await db.select(perfilCorto).from(users).where(inArray(users.id, otros)) : [];
  const porId = new Map(perfiles.map((p) => [p.id, p]));
  const out = filas.map((f) => ({
    ...porId.get(f.userA === userId ? f.userB : f.userA)!,
    status: f.status,
    recibida: f.status === "pending" && f.requestedBy !== userId,
  }));
  return {
    amigos: out.filter((o) => o.status === "accepted"),
    recibidas: out.filter((o) => o.recibida),
    enviadas: out.filter((o) => o.status === "pending" && !o.recibida),
  };
}

export async function idsAmigos(userId: string) {
  const filas = await db
    .select({ a: friendships.userA, b: friendships.userB })
    .from(friendships)
    .where(and(eq(friendships.status, "accepted"), or(eq(friendships.userA, userId), eq(friendships.userB, userId))));
  return filas.map((f) => (f.a === userId ? f.b : f.a));
}

export async function bloqueadosPor(userId: string) {
  return db
    .select({ id: users.id, username: users.username, displayName: users.displayName, avatar: users.avatar })
    .from(blocks)
    .innerJoin(users, eq(users.id, blocks.blockedId))
    .where(eq(blocks.blockerId, userId));
}

export async function gruposDe(userId: string) {
  return db
    .select({ id: groups.id, name: groups.name, role: groupMembers.role, ownerId: groups.ownerId })
    .from(groupMembers)
    .innerJoin(groups, eq(groups.id, groupMembers.groupId))
    .where(eq(groupMembers.userId, userId))
    .orderBy(groups.name);
}

export async function miembrosDe(groupId: string) {
  return db
    .select({ ...perfilCorto, role: groupMembers.role, joinedAt: groupMembers.joinedAt })
    .from(groupMembers)
    .innerJoin(users, eq(users.id, groupMembers.userId))
    .where(eq(groupMembers.groupId, groupId))
    .orderBy(groupMembers.joinedAt);
}

const { passwordHash: _omitida, ...columnasPublicas } = getTableColumns(users);

/** Usuario por nombre exacto (sin hash de contraseña). */
export async function usuarioPorNombre(username: string) {
  const [u] = await db.select(columnasPublicas).from(users).where(eq(users.usernameLower, username.toLowerCase())).limit(1);
  return u ?? null;
}
