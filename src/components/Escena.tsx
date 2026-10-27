import { Avatar, Sprite } from "./pixel/Sprite";
import { CORAZON, NUBE, SUPOSICION } from "./pixel/sprites";

// Posiciones fijas para que el cielo sea igual en servidor y cliente
const ESTRELLAS = Array.from({ length: 26 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  top: `${(i * 53) % 50}%`,
  t: `${1.5 + (i % 4) * 0.6}s`,
}));

function Capa({ velocidad, children }: { velocidad: string; children: React.ReactNode }) {
  // Dos mitades idénticas para que el desplazamiento infinito no tenga saltos
  return (
    <div className="capa-parallax" style={{ ["--vel" as string]: velocidad }}>
      <div className="relative h-full w-1/2">{children}</div>
      <div className="relative h-full w-1/2">{children}</div>
    </div>
  );
}

/** Pantalla de «juego» decorativa: cielo por bandas, nubes en parallax y dos amigos hablando. */
export function Escena({ className = "", compacta }: { className?: string; compacta?: boolean }) {
  const e = compacta ? 4 : 5;
  return (
    <div aria-hidden className={`ventana flex flex-col overflow-hidden p-0! ${className}`}>
      {/* Barra de estado del «juego» */}
      <div className="relative z-10 flex items-center gap-3 bg-panel px-4 py-2.5" style={{ boxShadow: "0 3px 0 0 var(--borde)" }}>
        <span className="titulo text-xs uppercase text-tenue">Nivel 3 · Amistad</span>
        <span className="ml-auto flex gap-1">
          {[0, 1, 2].map((i) => (
            <Sprite key={i} sprite={CORAZON} escala={2} className={i === 2 ? "latir" : ""} />
          ))}
        </span>
      </div>

      <div
        className="relative min-h-72 flex-1"
        style={{
          // Degradado en bandas, como un cielo de 16 bits
          background:
            "linear-gradient(var(--cielo-1) 0 22%, color-mix(in srgb, var(--cielo-1) 66%, var(--cielo-2)) 22% 44%, color-mix(in srgb, var(--cielo-1) 33%, var(--cielo-2)) 44% 66%, var(--cielo-2) 66%)",
        }}
      >
        <Capa velocidad="120s">
          {ESTRELLAS.map((s, i) => (
            <span key={i} className="estrella" style={{ left: s.left, top: s.top, ["--t" as string]: s.t }} />
          ))}
        </Capa>
        <Capa velocidad="80s">
          <span className="absolute" style={{ left: "8%", top: "10%" }}><Sprite sprite={NUBE} escala={5} /></span>
          <span className="absolute" style={{ left: "58%", top: "26%" }}><Sprite sprite={NUBE} escala={3} /></span>
          <span className="absolute" style={{ left: "82%", top: "6%" }}><Sprite sprite={NUBE} escala={4} /></span>
        </Capa>
        <Capa velocidad="40s">
          <span className="absolute" style={{ left: "30%", top: "44%" }}><Sprite sprite={NUBE} escala={6} /></span>
          <span className="absolute" style={{ left: "76%", top: "52%" }}><Sprite sprite={NUBE} escala={4} /></span>
        </Capa>

        {/* Personajes y diálogo */}
        <div className="absolute inset-x-0 bottom-12 flex items-end justify-center gap-[12%]">
          <div className="relative">
            <span className="bocadillo pop -top-16 left-0" style={{ ["--retraso" as string]: "0s" }}>
              ¿Te encanta el ramen?
            </span>
            <span className="flotar block" style={{ ["--dur" as string]: "2.4s" }}>
              <Avatar id="gato" escala={e} />
            </span>
          </div>
          <span className="flotar mb-16" style={{ ["--dur" as string]: "1.8s" }}>
            <Sprite sprite={SUPOSICION} escala={3} fps={3} />
          </span>
          <div className="relative">
            <span className="bocadillo pop -top-16 right-0 [--cola:calc(100%-1.4rem)]" style={{ ["--retraso" as string]: "3s" }}>
              ¡Confirmado! ✔
            </span>
            <span className="titulo pop absolute -top-24 right-2 text-sm" style={{ ["--retraso" as string]: "3.4s", color: "var(--lima)", textShadow: "2px 2px 0 var(--negro)" }}>
              +1 XP
            </span>
            <span className="flotar block" style={{ ["--dur" as string]: "2.8s", ["--retraso" as string]: "0.6s" }}>
              <Avatar id="pelirroja" escala={e} />
            </span>
          </div>
        </div>

        {/* Suelo de bloques */}
        <div
          className="absolute inset-x-0 bottom-0 h-12"
          style={{
            background: "var(--verde)",
            boxShadow: "0 -6px 0 0 var(--lima)",
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0 30px, var(--turquesa) 30px 34px), linear-gradient(transparent 60%, #0003 60%)",
          }}
        />
      </div>
    </div>
  );
}
