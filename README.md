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

## Despliegue

Hacer merge a `main` publica el sitio en el proyecto de Vercel existente. No hay pasos manuales ni
variables nuevas: solo se usan `MONGODB_INTEGRAL_DB` y `VERCEL_URL_CORS`.
