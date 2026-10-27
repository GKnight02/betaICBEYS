"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BotonPixel } from "@/components/pixel/BotonPixel";
import { Estallido } from "@/components/pixel/Estallido";
import { sonar } from "@/components/pixel/sonido";
import { TextoDialogo } from "@/components/pixel/TextoDialogo";

export type Pregunta = { texto: string; opciones: string[]; correcta: number };

export function Quiz({ preguntas }: { preguntas: Pregunta[] }) {
  const router = useRouter();
  const [actual, setActual] = useState(0);
  const [elegida, setElegida] = useState<number | null>(null);
  const [aciertos, setAciertos] = useState(0);
  const [estallido, setEstallido] = useState(0);

  const terminado = actual >= preguntas.length;

  if (terminado) {
    const pct = Math.round((aciertos / preguntas.length) * 100);
    const veredicto =
      pct === 100 ? "¡Perfecto! Le conoces mejor que su espejo." : pct >= 70 ? "¡Muy bien! Se nota la amistad." : pct >= 40 ? "Nada mal, pero hay cosas que todavía no te crees." : "Mmm… ¿seguro que os conocéis?";
    return (
      <div className="relative text-center">
        <p className="titulo my-6 text-4xl text-acento">
          {aciertos} / {preguntas.length}
        </p>
        <TextoDialogo texto={veredicto} />
        <BotonPixel type="button" variante="primario" className="mt-4" onClick={() => {
            // El servidor baraja preguntas nuevas
            setActual(0);
            setAciertos(0);
            router.refresh();
          }}
        >
          Otra ronda
        </BotonPixel>
      </div>
    );
  }

  const p = preguntas[actual]!;
  function elegir(i: number) {
    if (elegida !== null) return;
    setElegida(i);
    if (i === p.correcta) {
      setAciertos((a) => a + 1);
      setEstallido(Date.now());
      sonar("exito");
    } else {
      sonar("error");
    }
  }

  return (
    <div className="relative">
      <Estallido clave={estallido} texto="¡Bien!" />
      <div className="mb-4 flex items-center gap-3">
        <p className="titulo shrink-0 text-xs text-tenue uppercase">
          Pregunta {actual + 1} de {preguntas.length}
        </p>
        {/* Barra de progreso por bloques */}
        <div className="flex flex-1 gap-1" aria-hidden>
          {preguntas.map((_, i) => (
            <span key={i} className={`h-2 flex-1 transition-colors ${i < actual ? "bg-exito" : i === actual ? "bg-acento" : "bg-panel-3"}`} />
          ))}
        </div>
      </div>
      <TextoDialogo key={actual} texto={p.texto} className="mb-5 min-h-[3.5rem] text-2xl font-bold" />
      <div className="grid gap-x-2 @lg:grid-cols-2">
        {p.opciones.map((o, i) => {
          const marca = elegida === null ? "" : i === p.correcta ? "boton-exito" : i === elegida ? "boton-peligro" : "";
          return (
            <BotonPixel key={o + i} type="button" className={`justify-start! text-left ${marca}`} onClick={() => elegir(i)} aria-pressed={elegida === i}>
              {o}
            </BotonPixel>
          );
        })}
      </div>
      {elegida !== null && (
        <BotonPixel
          type="button"
          variante="primario"
          className="mt-3"
          onClick={() => {
            setElegida(null);
            setActual((a) => a + 1);
          }}
        >
          Siguiente ▶
        </BotonPixel>
      )}
    </div>
  );
}
