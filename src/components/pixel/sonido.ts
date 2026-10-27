"use client";

// Sonidos de 8 bits generados con Web Audio (sin archivos). Apagados por defecto.
const CLAVE = "ntc-sonido";

export function sonidoActivo() {
  try {
    return localStorage.getItem(CLAVE) === "si";
  } catch {
    return false;
  }
}

export function activarSonido(si: boolean) {
  try {
    localStorage.setItem(CLAVE, si ? "si" : "no");
  } catch {}
}

let ctx: AudioContext | null = null;

const MELODIAS = {
  bip: [[880, 0.06]],
  exito: [[660, 0.08], [880, 0.08], [1320, 0.14]],
  error: [[220, 0.12], [165, 0.18]],
} as const;

export function sonar(tipo: keyof typeof MELODIAS = "bip") {
  if (typeof window === "undefined" || !sonidoActivo()) return;
  try {
    ctx ??= new AudioContext();
    let t = ctx.currentTime;
    for (const [freq, dur] of MELODIAS[tipo]) {
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      vol.gain.setValueAtTime(0.06, t);
      vol.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(vol).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur);
      t += dur;
    }
  } catch {}
}
