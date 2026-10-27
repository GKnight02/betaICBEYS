import type { Metadata } from "next";
import { and, count, eq, gt, isNull } from "drizzle-orm";
import { BotonPixel } from "@/components/pixel/BotonPixel";
import { Encabezado } from "@/components/pixel/Encabezado";
import { Ventana } from "@/components/pixel/Ventana";
import { cerrarOtrasSesiones } from "@/lib/acciones/ajustes";
import { salir } from "@/lib/acciones/auth";
import { requerirUsuario } from "@/lib/auth/sesiones";
import { amistadesDe } from "@/lib/consultas";
import { db } from "@/lib/db";
import { recoveryCodes, sessions } from "@/lib/db/schema";
import { visibilidades } from "@/lib/permisos";
import { Apariencia } from "./Apariencia";
import { FormBorrarCuenta, FormCodigos, FormContrasena } from "./FormsCuenta";
import { FormPrivacidad } from "./FormPrivacidad";

export const metadata: Metadata = { title: "Ajustes" };

export default async function Ajustes() {
  const yo = await requerirUsuario();
  const [vis, { amigos }, [ses], [cods]] = await Promise.all([
    visibilidades(yo.id),
    amistadesDe(yo.id),
    db.select({ n: count() }).from(sessions).where(and(eq(sessions.userId, yo.id), gt(sessions.expiresAt, new Date()))),
    db.select({ n: count() }).from(recoveryCodes).where(and(eq(recoveryCodes.userId, yo.id), isNull(recoveryCodes.usedAt))),
  ]);

  return (
    <>
      <Encabezado antetitulo="Cuenta" titulo="Ajustes" descripcion={`Conectado como @${yo.username}.`} />

      {/* Mosaico: 1, 2 o 3 columnas según el ancho; cada panel cae donde cabe */}
      <div className="mosaico">
        <Ventana titulo="Privacidad" id="privacidad" className="aparecer">
          <FormPrivacidad
            visibilidad={vis}
            amigos={amigos.map((a) => ({ id: a.id, nombre: a.displayName, username: a.username }))}
            suposiciones={yo.suppositions}
            permitidos={yo.suppositionsAllowed}
          />
        </Ventana>
        <Ventana titulo="Apariencia y sonido" className="aparecer" style={{ ["--i" as string]: 1 }}>
          <Apariencia />
        </Ventana>
        <Ventana titulo="Contraseña" className="aparecer" style={{ ["--i" as string]: 2 }}>
          <FormContrasena />
        </Ventana>
        <Ventana titulo="Códigos de recuperación" className="aparecer" style={{ ["--i" as string]: 3 }}>
          <p className="mb-3">
            Te quedan <b>{cods?.n ?? 0}</b> códigos sin usar.
          </p>
          <FormCodigos />
        </Ventana>
        <Ventana titulo="Sesiones" className="aparecer" style={{ ["--i" as string]: 4 }}>
          <p className="mb-3">
            Sesiones abiertas: <b>{ses?.n ?? 0}</b>
          </p>
          <div className="flex flex-wrap gap-1">
            <form action={cerrarOtrasSesiones}>
              <BotonPixel confirmar="¿Cerrar la sesión en todos los demás dispositivos?">Cerrar las demás</BotonPixel>
            </form>
            <form action={salir}>
              <BotonPixel>Salir</BotonPixel>
            </form>
          </div>
        </Ventana>
        <Ventana titulo="Mis datos" className="aparecer" style={{ ["--i" as string]: 5 }}>
          <p className="mb-3">Descarga todo lo que guardamos de ti en un archivo JSON.</p>
          <a href="/api/exportar" className="boton-pixel" download>
            Exportar mis datos
          </a>
        </Ventana>
        <Ventana titulo="Zona de peligro" className="aparecer [--borde:var(--peligro)]" style={{ ["--i" as string]: 6 }}>
          <FormBorrarCuenta username={yo.username} />
        </Ventana>
      </div>
    </>
  );
}
