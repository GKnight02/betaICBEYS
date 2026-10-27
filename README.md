# NoTeCreo

> «No te puedo creer todo… hasta que lo confirmes»

Una web donde cada persona tiene una ficha sobre sí misma (gustos, comidas por temporada, ánimo diario) y sus amigos proponen **suposiciones** que el dueño confirma o rechaza. Tiene estética retro en pixel art.

## Stack

| Capa | Elección |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript |
| Base de datos | Postgres en Neon (driver HTTP serverless) |
| ORM | Drizzle ORM + drizzle-kit |
| Contraseñas | Argon2id (`@node-rs/argon2`) |
| Sesiones | Propias: tabla `sessions` (hash SHA-256 del token) + cookie httpOnly |
| Validación | Zod 4 |
| Límite de intentos | Upstash Redis + `@upstash/ratelimit` (en memoria si no está configurado) |
| Estilos | Tailwind CSS 4 + CSS propio para el pixel art (paleta Sweetie 16) |
| Animaciones | Motion + CSS `steps()` |
| Fechas | date-fns |

> **Nota sobre Next 16:** el antiguo `middleware.ts` ahora se llama `proxy.ts` (`src/proxy.ts`).

## Puesta en marcha local

1. Instala las dependencias (Node 20.9 o superior):
   ```bash
   npm install
   ```
2. Crea una base de datos gratis en [Neon](https://neon.tech) (o desde Vercel → Storage → Neon) y copia su cadena de conexión.
3. Copia `.env.example` a `.env.local` y rellena `DATABASE_URL`. Para hacerte admin, pon tu usuario en `ADMIN_USERNAMES`.
4. Crea las tablas:
   ```bash
   npm run db:migrate
   ```
5. Arranca el servidor:
   ```bash
   npm run dev
   ```
   y abre http://localhost:3000

El driver es el HTTP de Neon, así que también en local hace falta una base de Neon (no sirve un Postgres local sin cambiar el driver).

### Scripts

| Script | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run typecheck` | Comprobación de tipos |
| `npm run db:generate` | Genera una migración nueva tras cambiar `src/lib/db/schema.ts` |
| `npm run db:migrate` | Aplica las migraciones pendientes |
| `npm run db:studio` | Abre Drizzle Studio para ver o editar datos |
| `npm run vercel-build` | Migra y compila (lo usa Vercel automáticamente) |

## Despliegue en Vercel

1. Sube el repositorio a GitHub e impórtalo en Vercel.
2. En **Storage**, crea una base **Neon** desde el Marketplace: Vercel añade `DATABASE_URL` sola.
3. Del mismo modo, crea una base **Upstash Redis** para el límite de intentos (sirven tanto `UPSTASH_REDIS_REST_*` como `KV_REST_API_*`).
4. En **Settings → Environment Variables** añade `ADMIN_USERNAMES` y, si quieres, `APP_TIMEZONE`.
5. Vercel ejecuta `npm run vercel-build`, que aplica las migraciones de Drizzle antes del build.
6. Cada push a `main` despliega a producción; cada rama genera una URL de vista previa para probar con tus amigos.

Los secretos van solo en las variables de entorno de Vercel o en `.env.local`. **Nunca** en el repositorio: `.gitignore` ya los excluye.

## Estructura

```
src/
  app/
    (publico)/      portada, registro, entrar, recuperar, términos, privacidad
    (app)/          hoy, yo, u/[usuario] (+ suponer, quiz), amigos, grupos, notificaciones, ajustes, admin
    api/exportar/   descarga de mis datos en JSON
  components/
    pixel/          Ventana, BotonPixel, Sprite, TextoDialogo, Estallido, Bateria, sprites, sonido
    ficha/          TarjetaGusto, SeccionItems, FormItem, CalendarioAnimo, FormAnimo, Deseos…
  lib/
    auth/           hash, sesiones, rate-limit, recuperación
    acciones/       Server Actions (auth, ficha, social, suposiciones, ajustes, moderación, deseos)
    db/             schema.ts (Drizzle) y cliente
    permisos.ts     relacion(), puedeVer(), puedeProponer()
    validacion.ts   esquemas Zod
    filtro.ts       filtro básico de palabras ofensivas
  proxy.ts          exige sesión en las rutas privadas
drizzle/            migraciones SQL
```

## Seguridad

- Las contraseñas se guardan solo como hash Argon2id. Si el usuario no existe, se verifica igual contra un hash falso para no revelar qué usuarios existen.
- Tokens de sesión de 32 bytes: en la base solo va su SHA-256. La cookie es httpOnly, Secure y SameSite=Lax, y caduca a los 30 días con renovación.
- Hay límite de intentos por IP y por usuario en entrar, registrarse y recuperar la cuenta.
- La recuperación funciona sin correo: 8 códigos de un solo uso, guardados hasheados.
- Toda comprobación de permisos se hace en el servidor: `src/lib/permisos.ts` se usa en cada página y en cada Server Action.
- Las cabeceras CSP, X-Frame-Options y Referrer-Policy se configuran en `next.config.ts`. Las fichas llevan `noindex`.

## Sprites

Los sprites (avatares, caras de ánimo, cofre, signo de interrogación…) están definidos como mapas de caracteres en `src/components/pixel/sprites.ts`. Se dibujan como una hoja SVG horizontal y se animan con `steps()`, igual que una hoja PNG. Si haces los tuyos en Aseprite o Piskel, expórtalos como PNG en hoja horizontal a `public/sprites/` y sustituye el componente `Sprite` por un `background-image` con la misma animación.

## Preguntas abiertas

- El nombre definitivo y el dominio propio.
- La edad mínima según el país (`EDAD_MINIMA` en `src/lib/config.ts`).
- Si añadir un correo opcional para recuperar la cuenta.
