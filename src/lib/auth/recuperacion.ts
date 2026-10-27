import { eq } from "drizzle-orm";
import { CODIGOS_RECUPERACION } from "@/lib/config";
import { db } from "@/lib/db";
import { recoveryCodes } from "@/lib/db/schema";
import { codigoLegible, normalizarCodigo, sha256 } from "./hash";

/** Genera códigos nuevos, guarda sus hashes y devuelve los códigos en claro (solo se muestran una vez). */
export async function crearCodigosRecuperacion(userId: string) {
  const codigos = Array.from({ length: CODIGOS_RECUPERACION }, () => codigoLegible(2, 5));
  await db.delete(recoveryCodes).where(eq(recoveryCodes.userId, userId));
  await db.insert(recoveryCodes).values(codigos.map((c) => ({ userId, codeHash: sha256(normalizarCodigo(c)) })));
  return codigos;
}
