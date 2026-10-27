import type { Metadata, Viewport } from "next";
import { Pixelify_Sans, Silkscreen } from "next/font/google";
import { Proveedores } from "@/components/Proveedores";
import { APP_LEMA, APP_NAME } from "@/lib/config";
import "./globals.css";

// Silkscreen para etiquetas y botones; Pixelify Sans (pixel moderno y legible) para todo lo demás
const titulo = Silkscreen({ weight: "400", subsets: ["latin"], variable: "--fuente-titulo", display: "swap" });
const texto = Pixelify_Sans({ subsets: ["latin"], variable: "--fuente-texto", display: "swap" });

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: APP_LEMA,
  // Las fichas no deben aparecer en buscadores; la portada lo sobreescribe
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3ebde" },
    { media: "(prefers-color-scheme: dark)", color: "#110f1f" },
  ],
};

// Aplica el tema guardado antes de pintar y guarda la zona horaria del navegador en una cookie
const scriptInicial = `try{var t=localStorage.getItem("ntc-tema");if(t)document.documentElement.dataset.tema=t;var z=Intl.DateTimeFormat().resolvedOptions().timeZone;if(z)document.cookie="tz="+encodeURIComponent(z)+";path=/;max-age=31536000;samesite=lax"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${titulo.variable} ${texto.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptInicial }} />
      </head>
      <body>
        <Proveedores>{children}</Proveedores>
      </body>
    </html>
  );
}
