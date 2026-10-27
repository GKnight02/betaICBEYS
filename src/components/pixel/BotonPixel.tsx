"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import { sonar } from "./sonido";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "normal" | "primario" | "exito" | "peligro";
  mini?: boolean;
  /** Texto mientras el formulario se envía */
  cargando?: string;
  /** Pide confirmación antes de enviar */
  confirmar?: string;
};

export function BotonPixel({
  variante = "normal",
  mini,
  cargando,
  confirmar,
  className = "",
  children,
  onClick,
  disabled,
  type = "submit",
  ...resto
}: Props) {
  const { pending } = useFormStatus();
  const clases = [
    "boton-pixel",
    variante !== "normal" && `boton-${variante}`,
    mini && "boton-mini",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type={type}
      className={clases}
      disabled={disabled || (pending && type === "submit")}
      onClick={(e) => {
        if (confirmar && !window.confirm(confirmar)) {
          e.preventDefault();
          return;
        }
        sonar("bip");
        onClick?.(e);
      }}
      {...resto}
    >
      {pending && cargando && type === "submit" ? cargando : children}
    </button>
  );
}
