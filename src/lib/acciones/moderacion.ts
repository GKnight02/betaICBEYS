"use server";

import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { limites } from "@/lib/auth/rate-limit";
import { cerrarTodasLasSesiones, requerirAdmin, requerirUsuario } from "@/lib/auth/sesiones";
import { db } from "@/lib/db";
import { items, reports, users } from "@/lib/db/schema";
import { erroresDeCampo, esquemaReporte, leerFormulario } from "@/lib/validacion";
import { ERROR_LIMITE, type Estado } from "./estado";

export async function reportar(_: Estado, fd: FormData): Promise<Estado> {
  const yo = await requerirUsuario();
  if (!(await limites.reporte(yo.id)).success) return { error: ERROR_LIMITE };
  const datos = esquemaReporte.safeParse(leerFormulario(fd));
  if (!datos.success) return { campos: erroresDeCampo(datos.error) };
  await db.insert(reports).values({ ...datos.data, reporterId: yo.id });
  return { ok: true, mensaje: "Gracias. Un moderador lo revisará." };
}

export async function cerrarReporte(reportId: string, estado: "resolved" | "dismissed") {
  await requerirAdmin();
  await db.update(reports).set({ status: estado }).where(eq(reports.id, reportId));
  refresh();
}

export async function eliminarItemReportado(reportId: string) {
  await requerirAdmin();
  const [r] = await db.select().from(reports).where(eq(reports.id, reportId));
  if (r?.targetType !== "item") return;
  await db.delete(items).where(eq(items.id, r.targetId));
  await db.update(reports).set({ status: "resolved" }).where(eq(reports.id, reportId));
  refresh();
}

export async function suspenderUsuario(userId: string, suspender: boolean) {
  const admin = await requerirAdmin();
  if (userId === admin.id) return;
  await db.update(users).set({ bannedAt: suspender ? new Date() : null }).where(eq(users.id, userId));
  if (suspender) await cerrarTodasLasSesiones(userId);
  refresh();
}
