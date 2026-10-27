import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "./db";
import { notifications } from "./db/schema";

type Tipo = (typeof notifications.$inferInsert)["type"];

export async function notificar(userId: string, type: Tipo, payload: Record<string, string | number | null>) {
  await db.insert(notifications).values({ userId, type, payload });
}

export async function contarSinLeer(userId: string) {
  const [fila] = await db
    .select({ n: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return fila?.n ?? 0;
}
