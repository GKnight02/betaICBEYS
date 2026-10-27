import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type DB = NeonHttpDatabase<typeof schema>;

let instancia: DB | undefined;

function crear(): DB {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL (revisa .env.local o las variables de Vercel)");
  return drizzle({ client: neon(url), schema });
}

// Se conecta en el primer uso para que el build no exija la variable.
export const db = new Proxy({} as DB, {
  get(_, prop) {
    instancia ??= crear();
    const valor = Reflect.get(instancia, prop, instancia);
    return typeof valor === "function" ? valor.bind(instancia) : valor;
  },
});

export * as tablas from "./schema";
