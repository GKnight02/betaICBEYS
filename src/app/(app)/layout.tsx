import Link from "next/link";
import { NavLateral, NavMovil } from "@/components/Navegacion";
import { requerirUsuario } from "@/lib/auth/sesiones";
import { contarSinLeer } from "@/lib/notificaciones";

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const yo = await requerirUsuario();
  const avisos = await contarSinLeer(yo.id);
  const nav = {
    avisos,
    esAdmin: yo.esAdmin,
    usuario: { displayName: yo.displayName, username: yo.username, avatar: yo.avatar },
  };
  return (
    <div className="flex min-h-dvh">
      <NavLateral {...nav} />
      <div className="flex min-w-0 flex-1 flex-col">
        <NavMovil {...nav} />
        <main className="w-full flex-1 px-4 pt-6 pb-8 sm:px-6 md:pb-10 lg:px-10 lg:pt-10 2xl:px-14">
          <div className="mx-auto w-full max-w-[1680px]">{children}</div>
        </main>
        <footer className="px-4 pb-28 text-center text-sm text-tenue md:hidden">
          <Link href="/terminos">Términos</Link> · <Link href="/privacidad">Privacidad</Link>
        </footer>
      </div>
    </div>
  );
}
