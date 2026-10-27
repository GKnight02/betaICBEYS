import type { Metadata } from "next";
import { PantallaAuth } from "@/components/PantallaAuth";
import { FormRecuperar } from "./FormRecuperar";

export const metadata: Metadata = { title: "Recuperar cuenta" };

export default function Recuperar() {
  return (
    <PantallaAuth antetitulo="Continuar partida" titulo="Recuperar cuenta" lema="¿Perdiste la llave? Tus códigos de recuperación abren el cofre.">
      <p className="nota mb-5 [--c:var(--enlace)]">Usa uno de los códigos de recuperación que guardaste al registrarte.</p>
      <FormRecuperar />
    </PantallaAuth>
  );
}
