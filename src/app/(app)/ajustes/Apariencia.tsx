"use client";

import { useEffect, useState } from "react";
import { activarSonido, sonar, sonidoActivo } from "@/components/pixel/sonido";

type Tema = "auto" | "claro" | "oscuro";

function leerTema(): Tema {
  try {
    const t = localStorage.getItem("ntc-tema");
    return t === "claro" || t === "oscuro" ? t : "auto";
  } catch {
    return "auto";
  }
}

export function Apariencia() {
  const [tema, setTema] = useState<Tema>("auto");
  const [sonido, setSonido] = useState(false);

  useEffect(() => {
    setTema(leerTema());
    setSonido(sonidoActivo());
  }, []);

  function cambiarTema(t: Tema) {
    setTema(t);
    try {
      if (t === "auto") {
        localStorage.removeItem("ntc-tema");
        delete document.documentElement.dataset.tema;
      } else {
        localStorage.setItem("ntc-tema", t);
        document.documentElement.dataset.tema = t;
      }
    } catch {}
  }

  return (
    <div>
      <fieldset className="mb-4">
        <legend className="etiqueta">Tema</legend>
        <div className="flex flex-wrap">
          {(
            [
              ["auto", "Automático"],
              ["claro", "Claro"],
              ["oscuro", "Oscuro"],
            ] as const
          ).map(([v, t]) => (
            <label key={v} className="opcion-pixel">
              <input type="radio" name="tema" value={v} checked={tema === v} onChange={() => cambiarTema(v)} />
              <span>{t}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="opcion-pixel">
        <input
          type="checkbox"
          checked={sonido}
          onChange={(e) => {
            setSonido(e.target.checked);
            activarSonido(e.target.checked);
            if (e.target.checked) sonar("exito");
          }}
        />
        <span>🔊 Sonidos de 8 bits</span>
      </label>
      <p className="mt-2 text-tenue">Las animaciones se reducen solas si tu sistema tiene activado «reducir movimiento».</p>
    </div>
  );
}
