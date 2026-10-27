import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Resultado = { success: boolean };

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

// Respaldo en memoria para desarrollo local
const memoria = new Map<string, number[]>();
let avisado = false;

function duracionMs(ventana: Duration) {
  const [n, unidad] = ventana.split(" ") as [string, string];
  const mult: Record<string, number> = { ms: 1, s: 1e3, m: 6e4, h: 36e5, d: 864e5 };
  return Number(n) * (mult[unidad] ?? 1e3);
}

const limitadores = new Map<string, Ratelimit>();

function crearLimite(nombre: string, intentos: number, ventana: Duration) {
  return async (clave: string): Promise<Resultado> => {
    if (redis) {
      let rl = limitadores.get(nombre);
      if (!rl) {
        rl = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(intentos, ventana), prefix: `ntc:${nombre}` });
        limitadores.set(nombre, rl);
      }
      return rl.limit(clave);
    }
    if (!avisado && process.env.NODE_ENV === "production") {
      avisado = true;
      console.warn("[rate-limit] Sin Upstash configurado: se usa memoria local (no fiable en serverless).");
    }
    const ahora = Date.now();
    const k = `${nombre}:${clave}`;
    const recientes = (memoria.get(k) ?? []).filter((t) => ahora - t < duracionMs(ventana));
    recientes.push(ahora);
    memoria.set(k, recientes);
    return { success: recientes.length <= intentos };
  };
}

export const limites = {
  login: crearLimite("login", 5, "15 m"),
  registro: crearLimite("registro", 5, "1 h"),
  recuperar: crearLimite("recuperar", 5, "15 m"),
  suposicion: crearLimite("suposicion", 30, "1 h"),
  social: crearLimite("social", 30, "10 m"),
  reporte: crearLimite("reporte", 10, "1 h"),
};
