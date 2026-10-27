import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PantallaAuth } from "@/components/PantallaAuth";
import { usuarioActual } from "@/lib/auth/sesiones";
import { FormEntrar } from "./FormEntrar";

export const metadata: Metadata = { title: "Entrar" };

export default async function Entrar({ searchParams }: { searchParams: Promise<{ siguiente?: string }> }) {
  if (await usuarioActual()) redirect("/hoy");
  const { siguiente } = await searchParams;
  return (
    <PantallaAuth antetitulo="Continuar partida" titulo="Entrar" lema="Tus amigos llevan un rato suponiendo cosas sobre ti.">
      <FormEntrar siguiente={siguiente ?? "/hoy"} />
    </PantallaAuth>
  );
}
