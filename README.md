# CHERCED-WORLD

Portafolio personal de Camilo Hernandez. Nació en 2023 con Next.js 13 y en 2026 evoluciona a
Next.js 16 y React 19 sin perder su identidad: el fondo animado GlitteringSea, la intro
"CHERCED / Front-End Developer", la paleta blanco y negro y la tipografía Montserrat, ahora con
glassmorfismo encima, contenido renderizado en servidor y el sitio completo en español e inglés.

La especificación del evolutivo vive en [`specs/001-evolutivo-cherced-world/`](specs/001-evolutivo-cherced-world/)
y los principios del proyecto en [`.specify/memory/constitution.md`](.specify/memory/constitution.md).

## Requisitos

- Node.js 22 (es lo que usa Vercel; en local funciona desde la 20.9).
- npm.

## Empezar

```bash
npm install
npm run dev
```

El sitio queda en `http://localhost:3000` y redirige a `/es` o `/en` según tu idioma. Sin
`MONGODB_INTEGRAL_DB` en el entorno, los datos privados usan repositorios en memoria: todo funciona y
se pierde al reiniciar. El detalle está en la [guía rápida](specs/001-evolutivo-cherced-world/quickstart.md).

## Scripts

| Script | Qué hace |
|--------|----------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción; `prebuild` corre lint, typecheck y pruebas unitarias |
| `npm start` | Sirve el build de producción |
| `npm run lint` | ESLint 9 con `eslint-config-next` |
| `npm run typecheck` | `next typegen` + `tsc --noEmit` (incluye el contrato de firmas por tipos) |
| `npm test` | Vitest: pruebas unitarias y de contrato |
| `npm run e2e` | Playwright contra un build local en el puerto 3100 |
| `npm run verify` | lint + typecheck + test + build + `npm audit --audit-level=high` |

Para las e2e, instala Chromium una vez con `npx playwright install chromium`. Cada lane corre las
suyas con `npx playwright test tests/e2e/<lane>`.

## Estructura

| Ruta | Qué hay |
|------|---------|
| `app/[lang]/` | Layout raíz (no hay `app/layout.tsx`) y las páginas por idioma |
| `components/ui/` | Primitivas glass: `GlassSurface`, `Button`, `Dialog`, `FormField`, `Toast`… |
| `components/shell/` | Header, menú flotante, footer, cambio de idioma y tema |
| `components/motion/`, `components/experience/` | Fondo animado, intro y loaders; palette, asistente y cápsula |
| `content/` | Contenido tipado (`site.ts`, `projects.ts`, `capsule.ts`), posts MDX y diccionarios |
| `lib/` | i18n, accesores de contenido, validación, datos, acciones y eventos |
| `styles/` | Tokens, mixin `glass()`, breakpoints y estilos globales |
| `tests/` | Unitarias, contrato y e2e, una carpeta por lane |

## MCP público

El portafolio publica un servidor MCP remoto de solo lectura en `https://cherced-world.vercel.app/api/mcp`
(Streamable HTTP, sin sesión y sin token). Se conecta desde cualquier cliente MCP, por ejemplo con
`claude mcp add --transport http cherced-world https://cherced-world.vercel.app/api/mcp`. Los pasos por cliente, el
catálogo de herramientas y un probador del protocolo están en [/es/mcp](https://cherced-world.vercel.app/es/mcp).
No usa variables de entorno nuevas: el límite por IP y el tope diario viven en `lib/security/rate-limit.ts` (`mcp`,
`mcpMatch` y `mcpDaily`).

## Despliegue

Hacer merge a `main` publica el sitio en el proyecto de Vercel existente. No hay pasos manuales.

### Variables de entorno

Todas son del servidor: ninguna lleva `NEXT_PUBLIC_` y ninguna se versiona. Sin cada una, el sitio compila y
funciona; la función que la usa queda apagada o, en local, simulada (constitución, principio VIII).

| Variable | Para qué | Quién la crea | Entornos de Vercel |
|---|---|---|---|
| `MONGODB_INTEGRAL_DB` | Base de mensajes, comentarios, cuentas y posts del panel | Existente | Production, Preview |
| `VERCEL_URL_CORS` | Origen del sitio para CORS y URLs absolutas | Existente | Production, Preview |
| `GOOGLE_CLIENT_ID` | Ingreso con Google (017) | El autor, en Google Cloud ([guía](specs/017-cuentas-e-ingreso/configurar-google.md)) | Production, Preview |
| `GOOGLE_CLIENT_SECRET` | Ingreso con Google (017) | El autor, en Google Cloud | Production, Preview (Sensitive) |
| `GEMINI_API_KEY` | IA de Google: agente de voz y experimentos del AI Lab (018) | El autor, en Google Cloud ([guía](specs/018-ia-de-google/configurar-gemini.md)) | Production, Preview (Sensitive) |
| `GUEST_MODE` | Modo invitada de Mini Cherced (039): persona, hash del correo de la invitada y, si existe, su experiencia (bienvenida, sorpresas, estrellas y final), en base64. Sin ella el modo no existe | El autor, con `node scripts/guest-mode.mjs` desde su carpeta privada | Production, Preview (Sensitive) |

En local van en `.env.local`, que no se versiona.
