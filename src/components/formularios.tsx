"use client";

import { useEffect, useRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import type { Estado } from "@/lib/acciones/estado";
import { sonar } from "./pixel/sonido";
import { TextoDialogo } from "./pixel/TextoDialogo";

type CampoProps = InputHTMLAttributes<HTMLInputElement> & { etiqueta: ReactNode; error?: string; ayuda?: ReactNode };

export function Campo({ etiqueta, error, ayuda, id, name, className = "", ...resto }: CampoProps) {
  const idCampo = id ?? `campo-${name}`;
  return (
    <div className={`mb-3 ${className}`}>
      <label htmlFor={idCampo} className="etiqueta">
        {etiqueta}
      </label>
      <input
        id={idCampo}
        name={name}
        className="campo-pixel"
        aria-invalid={!!error}
        aria-describedby={error ? `${idCampo}-error` : undefined}
        {...resto}
      />
      {ayuda && !error && <p className="mt-1 text-sm text-tenue">{ayuda}</p>}
      {error && (
        <p id={`${idCampo}-error`} className="error-campo">
          {error}
        </p>
      )}
    </div>
  );
}

type AreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { etiqueta: ReactNode; error?: string };

export function Area({ etiqueta, error, id, name, ...resto }: AreaProps) {
  const idCampo = id ?? `campo-${name}`;
  return (
    <div className="mb-3">
      <label htmlFor={idCampo} className="etiqueta">
        {etiqueta}
      </label>
      <textarea id={idCampo} name={name} className="campo-pixel" rows={3} aria-invalid={!!error} {...resto} />
      {error && <p className="error-campo">{error}</p>}
    </div>
  );
}

export function Selector({
  etiqueta,
  name,
  opciones,
  defaultValue,
  error,
  onChange,
}: {
  etiqueta: ReactNode;
  name: string;
  opciones: Record<string, string>;
  defaultValue?: string;
  error?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div className="mb-3">
      <label htmlFor={`campo-${name}`} className="etiqueta">
        {etiqueta}
      </label>
      <select
        id={`campo-${name}`}
        name={name}
        defaultValue={defaultValue}
        className="campo-pixel"
        onChange={(e) => onChange?.(e.target.value)}
      >
        {Object.entries(opciones).map(([v, t]) => (
          <option key={v} value={v}>
            {t}
          </option>
        ))}
      </select>
      {error && <p className="error-campo">{error}</p>}
    </div>
  );
}

/** Mensaje de resultado de una acción: éxito como diálogo de NPC, error en rojo. Suena según el caso. */
export function MensajeEstado({ estado }: { estado: Estado }) {
  const anterior = useRef<Estado>(null);
  useEffect(() => {
    if (estado && estado !== anterior.current) {
      sonar(estado.error || estado.campos ? "error" : "exito");
      anterior.current = estado;
    }
  }, [estado]);
  if (!estado) return null;
  if (estado.error) {
    return (
      <p role="alert" className="error-campo mt-2">
        ✖ {estado.error}
      </p>
    );
  }
  if (estado.mensaje) {
    return (
      <div role="status" className="mt-2 text-exito">
        <TextoDialogo texto={estado.mensaje} />
      </div>
    );
  }
  return null;
}
