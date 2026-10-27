import Link from "next/link";
import { Sprite } from "@/components/pixel/Sprite";
import { SUPOSICION } from "@/components/pixel/sprites";
import { Ventana } from "@/components/pixel/Ventana";

export default function NoEncontrado() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-16">
      <Ventana className="aparecer w-full max-w-lg text-center">
        <div className="flotar inline-block">
          <Sprite sprite={SUPOSICION} escala={6} fps={3} />
        </div>
        <p className="titulo mt-4 text-5xl text-acento">404</p>
        <p className="mt-3 text-lg">Aquí no hay nada… o no tienes permiso para verlo.</p>
        <Link href="/" className="boton-pixel boton-primario mt-6">
          ◀ Volver al inicio
        </Link>
      </Ventana>
    </main>
  );
}
