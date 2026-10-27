import Link from "next/link";
import { Sprite } from "@/components/pixel/Sprite";
import { SUPOSICION } from "@/components/pixel/sprites";
import { APP_LEMA, APP_NAME } from "@/lib/config";

export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="barra-superior sticky top-0 z-30">
        <div className="mx-auto flex h-16 w-full max-w-[1680px] items-center gap-3 px-4 sm:px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-2 text-texto no-underline!">
            <span className="flotar">
              <Sprite sprite={SUPOSICION} escala={2} fps={3} />
            </span>
            <span className="text-xl font-bold">{APP_NAME}</span>
          </Link>
          <nav aria-label="Cuenta" className="ml-auto flex items-center">
            <Link href="/entrar" className="boton-pixel boton-mini">
              Entrar
            </Link>
            <Link href="/registro" className="boton-pixel boton-mini boton-primario hidden sm:inline-flex">
              Crear cuenta
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="mt-12" style={{ boxShadow: "0 -3px 0 0 var(--borde)" }}>
        <div className="mx-auto flex w-full max-w-[1680px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-sm text-tenue sm:px-6 lg:px-10">
          <span>
            <b className="text-texto">{APP_NAME}</b> · {APP_LEMA}
          </span>
          <span className="sm:ml-auto">
            <Link href="/terminos">Términos</Link> · <Link href="/privacidad">Privacidad</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
