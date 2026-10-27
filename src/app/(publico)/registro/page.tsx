import type { Metadata } from "next";
import { PantallaAuth } from "@/components/PantallaAuth";
import { FormRegistro } from "./FormRegistro";

export const metadata: Metadata = { title: "Crear cuenta" };

// No redirige si ya hay sesión: tras registrarse, esta misma página muestra los códigos de recuperación.
export default function Registro() {
  return (
    <PantallaAuth antetitulo="Nueva partida" titulo="Crear cuenta" lema="Crea tu ficha y descubre quién te conoce de verdad.">
      <FormRegistro />
    </PantallaAuth>
  );
}
