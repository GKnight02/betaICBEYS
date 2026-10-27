import type { Metadata } from "next";
import Link from "next/link";
import { Encabezado } from "@/components/pixel/Encabezado";
import { Ventana } from "@/components/pixel/Ventana";
import { APP_NAME, EDAD_MINIMA } from "@/lib/config";

export const metadata: Metadata = { title: "Términos" };

export default function Terminos() {
  return (
    <main className="mx-auto w-full max-w-[1680px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <Encabezado antetitulo="Legal" titulo="Términos de uso" descripcion="Las reglas del juego, en corto." />
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,48rem)_20rem]">
      <Ventana className="aparecer text-lg leading-relaxed">
        <div className="space-y-3">
          <p>
            {APP_NAME} es un proyecto personal para compartir gustos, ánimo y suposiciones entre amigos. Al crear una
            cuenta aceptas estas reglas:
          </p>
          <ol className="list-decimal space-y-2 pl-6">
            <li>Debes tener al menos {EDAD_MINIMA} años (o la edad mínima que exija tu país).</li>
            <li>Eres responsable de lo que escribes, en tu ficha y en las suposiciones que propones a otras personas.</li>
            <li>No se permite acosar, insultar, suplantar a otra persona ni publicar datos privados de terceros.</li>
            <li>Puedes reportar perfiles y suposiciones. La moderación puede borrar contenido o suspender cuentas.</li>
            <li>Guarda tus códigos de recuperación: sin correo, son la única forma de recuperar la cuenta.</li>
            <li>Puedes exportar tus datos o borrar tu cuenta cuando quieras desde Ajustes.</li>
            <li>El servicio se ofrece «tal cual», sin garantías de disponibilidad.</li>
          </ol>
          <p>
            Consulta también la <Link href="/privacidad">política de privacidad</Link>.
          </p>
        </div>
      </Ventana>
      <Ventana titulo="Resumen" className="aparecer lg:sticky lg:top-24" style={{ ["--i" as string]: 1 }}>
        <ul className="space-y-2 text-tenue">
          <li>✔ Mínimo {EDAD_MINIMA} años</li>
          <li>✔ Respeto ante todo</li>
          <li>✔ Tus datos, tu control</li>
          <li>✔ Guarda tus códigos</li>
        </ul>
        <Link href="/privacidad" className="boton-pixel boton-mini mt-4">
          Ver privacidad ▶
        </Link>
      </Ventana>
      </div>
    </main>
  );
}
