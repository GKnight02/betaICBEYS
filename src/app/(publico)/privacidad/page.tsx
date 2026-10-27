import type { Metadata } from "next";
import Link from "next/link";
import { Encabezado } from "@/components/pixel/Encabezado";
import { Ventana } from "@/components/pixel/Ventana";
import { APP_NAME } from "@/lib/config";

export const metadata: Metadata = { title: "Privacidad" };

export default function Privacidad() {
  return (
    <main className="mx-auto w-full max-w-[1680px] px-4 py-10 sm:px-6 lg:px-10 lg:py-14">
      <Encabezado antetitulo="Legal" titulo="Privacidad" descripcion="Qué guardamos, por qué y cómo lo controlas." />
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,48rem)_20rem]">
      <Ventana className="aparecer text-lg leading-relaxed">
        <div className="space-y-3">
          <p>Qué guarda {APP_NAME} y por qué:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>
              <b>Cuenta:</b> nombre de usuario y un hash Argon2id de tu contraseña. Nunca guardamos la contraseña en
              claro. No pedimos correo.
            </li>
            <li>
              <b>Sesiones:</b> una cookie httpOnly con un token aleatorio; en la base solo se guarda su hash.
            </li>
            <li>
              <b>Tu ficha:</b> lo que escribes (perfil, comidas, gustos, ánimo, regalos) y las suposiciones de tus
              amigos.
            </li>
            <li>
              <b>Zona horaria:</b> una cookie con la zona de tu navegador, para saber qué día es «hoy».
            </li>
          </ul>
          <p>
            Por defecto todo es privado o solo para amigos, y tú eliges quién ve cada sección. Las notas del ánimo solo
            las ves tú. Las suposiciones pendientes solo las ven tú y quien las propuso.
          </p>
          <p>
            Las fichas no se indexan en buscadores y no hay buscador público de usuarios: solo te encuentra quien sabe
            tu nombre de usuario exacto.
          </p>
          <p>
            Desde Ajustes puedes descargar todos tus datos en JSON y borrar tu cuenta; al borrarla se eliminan tu ficha,
            tus suposiciones pendientes, tus sesiones y tus relaciones.
          </p>
        </div>
      </Ventana>
      <Ventana titulo="En corto" className="aparecer lg:sticky lg:top-24" style={{ ["--i" as string]: 1 }}>
        <ul className="space-y-2 text-tenue">
          <li>🔒 Sin correo ni contraseñas en claro</li>
          <li>👁 Tú eliges quién ve cada sección</li>
          <li>🚫 Sin buscador público</li>
          <li>📦 Exporta o borra tus datos</li>
        </ul>
        <Link href="/terminos" className="boton-pixel boton-mini mt-4">
          Ver términos ▶
        </Link>
      </Ventana>
      </div>
    </main>
  );
}
