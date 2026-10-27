import { NextResponse, type NextRequest } from "next/server";
import { SESION_COOKIE, SESION_DIAS } from "@/lib/config";

// Las páginas privadas exigen sesión. Aquí solo se mira la cookie (rápido);
// la sesión real y los permisos se comprueban en el servidor en cada consulta.
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESION_COOKIE)?.value;
  if (!token) {
    const url = new URL("/entrar", request.url);
    url.searchParams.set("siguiente", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  // Renueva la caducidad de la cookie con cada visita
  const res = NextResponse.next();
  res.cookies.set(SESION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESION_DIAS * 24 * 60 * 60,
  });
  return res;
}

export const config = {
  matcher: [
    "/hoy/:path*",
    "/yo/:path*",
    "/u/:path*",
    "/amigos/:path*",
    "/grupos/:path*",
    "/notificaciones/:path*",
    "/ajustes/:path*",
    "/admin/:path*",
    "/api/exportar",
  ],
};
