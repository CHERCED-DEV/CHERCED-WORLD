# Research: Evolutivo CHERCED-WORLD 2026

**Feature**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Fecha**: 2026-11-01

Cada decisión responde a la spec y a la constitución 2.0.0, con el principio VIII (simplicidad operativa)
como desempate.

## R-01 Framework y runtime

- **Decisión**: Next.js 16 (App Router) + React 19 + TypeScript estricto. `engines.node: "22.x"` en
  `package.json` para que Vercel use Node 22 sin tocar la configuración del proyecto.
- **Por qué**: lo eligió el autor. Next 16 renderiza en servidor por defecto (resuelve FR-021) y se
  despliega en Vercel sin configuración.
- **Notas de Next 16 que afectan el diseño**: `middleware.ts` pasó a llamarse `proxy.ts` (función
  `proxy`). `next lint` ya no existe: se usa ESLint directamente con `eslint-config-next`. Turbopack es
  el bundler por defecto, así que los plugins de MDX se declaran por nombre.
- **Alternativas descartadas**: quedarse en Pages Router 13 (no resuelve SSR del contenido ni los layouts
  persistentes que necesita el fondo animado).

## R-02 Idiomas (FR-060 a FR-065)

- **Decisión**: segmento `app/[lang]/` con `es` y `en`, diccionarios JSON por idioma y por namespace,
  y `proxy.ts` que negocia el idioma. Las URLs sin prefijo (las de 2023) redirigen con 307 al idioma
  preferido (cookie `cw-lang`, si no `Accept-Language`, si no `es`). Las rutas conservan sus nombres de
  2023: `/es/aboutMe`, `/en/contactMe`.
- **Por qué**: es el patrón que documenta Next sin librerías. El principio VIII exige justificar cada
  dependencia, y una librería de i18n no aporta nada que este sitio necesite.
- **Diccionarios por namespace** (`common`, `site`, `motion`, `contact`, `admin`, `blog`, `experience`):
  cada lane es dueña de su namespace, así nadie edita el archivo de otra (principio VII).
- **Alternativas descartadas**: `next-intl` (dependencia extra); dominio o subdominio por idioma
  (requiere configuración en Vercel).

## R-03 Contenido (FR-020, FR-071, FR-080)

- **Decisión**: secciones y proyectos como módulos TypeScript tipados en `content/`, con campos
  bilingües `{ es, en }`. Posts como MDX, un archivo por idioma (`content/posts/<id>/<lang>.mdx`), con
  `export const meta`. MDX con `@next/mdx`; resaltado de código con `sugar-high` en el servidor.
- **Por qué**: el compilador de TypeScript valida el contenido (una sola fuente de verdad, cero
  runtime). `@next/mdx` es oficial y procesa todo en build, y `sugar-high` es diminuto, sin JS en el
  cliente.
- **Alternativas descartadas**: CMS headless (infraestructura nueva); JSON sin tipos; `rehype-pretty-code`
  con `shiki` (dos dependencias más pesadas para tres posts).

## R-04 Acceso a datos y regla "sin servicios nuevos"

- **Decisión**: driver oficial `mongodb` contra la base existente (`MONGODB_INTEGRAL_DB`), con cliente
  cacheado en el ámbito del módulo (patrón serverless). Todo vive en `lib/data/` e importa
  `server-only`. Cada colección se expone mediante una interfaz de repositorio con dos implementaciones:
  Mongo (producción) y en memoria (pruebas y lanes aisladas).
- **Validación**: `zod` en el límite (Server Actions), con los mismos esquemas en la UI (FR-031).
- **Colecciones**: `messages` y `comments` (existentes, creadas por Mongoose en 2023), más
  `admin_credentials`, `admin_sessions`, `setup_codes` y `rate_limits` (nuevas colecciones en la misma
  base; no es infraestructura nueva). Índices TTL creados de forma idempotente en el primer uso, sin
  scripts de migración.
- **Datos históricos**: sin migración. Al leer, un comentario sin `status` es `approved` y un mensaje sin
  `status` es `read` (supuestos de la spec). `newmessages` (el contador de 2023) queda sin uso.
- **Alternativas descartadas**: Mongoose (sus validaciones de 2023 nunca funcionaron y agrega una capa);
  un backend separado (prohibido por el principio VIII).

## R-05 Autenticación del administrador (FR-040 a FR-049)

- **Contraseña**: hash con `crypto.scrypt` de Node (N=2^15, sal aleatoria de 16 bytes), comparación en
  tiempo constante. Sin dependencias.
- **Sesión**: token opaco aleatorio de 32 bytes en cookie `cw-admin` (`HttpOnly`, `Secure`,
  `SameSite=Lax`, `Path=/`). En la base solo se guarda el SHA-256 del token, con `lastActivityAt`
  deslizante de 12 h e índice TTL. Al no firmar nada, no hace falta secreto nuevo (principio VIII).
- **Configuración inicial**: si no existe credencial, la primera visita a `/[lang]/inbox` genera un
  código de 8 caracteres (alfabeto sin ambigüedades), guarda su hash con vencimiento de 24 h y lo escribe
  con `console.warn` en los logs de Vercel. Al crear la contraseña, el código se borra y la ruta de
  configuración responde 404 mientras exista credencial.
- **Bloqueo**: 5 fallos en 15 min por IP (hash) bloquean 15 min. El mensaje de error es siempre el mismo.
- **Autorización**: el layout de `inbox` y cada Server Action o Route Handler de administración llaman a
  `requireAdmin()`. `proxy.ts` no protege rutas: la verificación vive junto al dato (principio III).

## R-06 Anti-spam y límites (FR-033)

- **Decisión**: campo trampa, tiempo mínimo de 3 s entre render y envío, y límite de 3 envíos por
  10 min por IP y acción en `rate_limits` (TTL).
- **IP sin guardar la IP**: `HMAC-SHA256(clave = SHA-256(MONGODB_INTEGRAL_DB), ip)`. Así se deriva una
  clave secreta de una variable que ya existe, sin crear otra, y la base nunca guarda IPs en claro.
- **Alternativas descartadas**: CAPTCHA de terceros (cuenta y claves nuevas); Redis o KV (infraestructura
  nueva).

## R-07 Avisos "casi en tiempo real" (FR-047)

- **Decisión**: polling cada 5 s desde el panel a `GET /api/admin/updates?since=<iso>`, pausado con la
  pestaña oculta y reanudado al volver. Si una petición falla, se muestra "reconectando" con backoff de
  5 s a 30 s.
- **Por qué**: Vercel no mantiene WebSockets, y SSE con funciones serverless corta la conexión por
  duración máxima. Con 5 s se cumple SC-008 (≤ 10 s) sin piezas nuevas.
- **Nota histórica**: la carpeta `pages/api/sockets/` de 2023 también era polling. Esta vez se llama por
  su nombre.

## R-08 Fondo animado y glass (FR-010 a FR-017)

- **Montaje único**: `<Background>` vive en el layout raíz. Los layouts del App Router no se desmontan
  al navegar, así que hay una sola instancia por pestaña (corrige la duplicación de 2023).
- **Motor**: Canvas 2D, partículas con atracción y repulsión suave al puntero o toque en un radio de
  120 px. Pausa con `visibilitychange` e `IntersectionObserver`. Si la mediana de tiempo por cuadro supera
  20 ms en 60 cuadros, reduce partículas un 30 % (mínimo 60). Con `prefers-reduced-motion` dibuja un solo
  cuadro estático.
- **Intensidad por página**: cada página declara `data-bg-intensity` (`full` en home, `subtle` en el
  resto) con un componente marcador que publica el valor en un store mínimo de `lib/motion`.
- **Tokens glass**: variables CSS por tema y variante (`subtle`, `standard`, `strong`): fondo,
  desenfoque, saturación, borde, sombra y radio. Hay fallback sólido con
  `@supports not (backdrop-filter: blur(1px))` y con `@media (prefers-reduced-transparency: reduce)`.
- **Contraste**: el fondo del glass oscuro arranca en `rgb(0 0 0 / 0.55)`, porque las partículas son
  blancas y se acercan al color del texto. La verificación es una prueba Playwright que muestrea píxeles
  detrás de cada texto en varios cuadros y calcula la razón WCAG; axe no puede leer el canvas.

## R-09 Intro, tema y no-flash (FR-005, FR-102)

- **Decisión**: un script en línea en `<head>`, antes del primer pintado, lee `sessionStorage`
  (`cw-intro-seen`) y `localStorage` (`cw-theme`, o `prefers-color-scheme`) y fija `data-intro` y
  `data-theme` en `<html>`. La intro es una capa CSS de 1,5 s encima del contenido ya renderizado (SEO
  intacto), que se salta con clic, tecla o toque.
- **Alternativas descartadas**: decidir el tema en el servidor con cookie (fuerza render dinámico en
  todas las páginas).

## R-10 Asistente sin modelo externo (FR-090 a FR-097)

- **Decisión**: un motor de intención en el cliente sobre un índice del contenido público.
  1. Normaliza la pregunta: minúsculas, sin tildes, abreviaturas ("q" → "que", "u" → "you").
  2. Mapea sinónimos ES↔EN ("tecnologías" ↔ "technologies", "proyectos" ↔ "projects").
  3. Clasifica la intención: experiencia, tecnología X, proyectos con X, servicios, educación, idiomas,
     contacto, sobre el sitio o fuera de alcance.
  4. Recupera hechos con búsqueda difusa (`minisearch`, tolera errores de tipeo).
  5. Compone la respuesta con plantillas por intención, idioma y enlaces a la fuente.
- **Seguridad estructural**: el índice solo contiene contenido público, así que no hay nada privado que
  filtrar (FR-093). No guarda conversaciones (FR-097).
- **Reutilización**: el mismo índice y `minisearch` alimentan la command palette (FR-100).
- **Entrega del índice**: `GET /api/search-index/[lang]`, generado estático en build y servido por CDN.
  Se carga solo al abrir la palette o el asistente, sin costo en la carga inicial.

## R-11 Diálogos accesibles (FR-101)

- **Decisión**: el elemento nativo `<dialog>` con `showModal()` para la palette, el asistente, la
  cápsula y las confirmaciones. Atrapa el foco, cierra con Esc y devuelve el foco de forma nativa.
- **Alternativas descartadas**: librerías de diálogos (dependencia sin necesidad); portales manuales
  como el `modalPortal` de 2023.

## R-12 Pruebas y gate de calidad (principio VI)

- **Unitarias**: Vitest sobre lógica pura (validadores, rate limit, hashing, sesión, motor del
  asistente, i18n, utilidades de contenido), con repositorios en memoria.
- **Contrato**: una suite compartida por repositorio que corre contra la implementación en memoria (y
  contra Mongo si existe `MONGODB_INTEGRAL_DB` en el entorno local), para que ambas se comporten igual.
- **E2E**: Playwright para los recorridos críticos: con y sin JavaScript (`javaScriptEnabled: false`),
  accesibilidad con `@axe-core/playwright`, escaneo de privacidad de respuestas públicas (SC-007) y
  contraste sobre el canvas (R-08).
- **Gate**: `npm run verify` = lint + typecheck + unit + build + `npm audit --audit-level=high`. En
  Vercel, `prebuild` corre lint, typecheck y unitarias, así un push a `main` con pruebas rotas no se
  despliega. Las e2e se corren antes de integrar cada lane.

## R-13 URL canónica

- **Decisión**: `metadataBase` y el sitemap usan `VERCEL_URL_CORS` (ya existe, apunta al dominio público)
  y, si falta, `VERCEL_PROJECT_PRODUCTION_URL`, que Vercel inyecta solo. No se crean variables.

## R-14 Cierre de la exposición 2023 (FR-116)

- **Decisión**: un hotfix mínimo sobre el código 2023 en `main`, en la rama `hotfix/cerrar-exposicion-datos`:
  - `GET /api/contactMe` responde 405, y el `getServerSideProps` de `/inbox` deja de pedir mensajes.
  - `GET /api/blog/comments/:id` excluye `email` de la respuesta.
- **Riesgo**: es el único despliegue a producción antes del corte, y se confirma con el autor antes del
  push. Después se hace merge de `main` en la rama del evolutivo.

## R-15 Cápsula 2023 (FR-117)

- **Decisión**: capturas con Playwright del sitio 2023 en línea (escritorio 1440×900 y móvil 390×844) de
  las 8 rutas públicas, más una capa de proyecto y un post, guardadas en `public/capsule/` como WebP.
  Se toman antes del corte; mejor si es antes del hotfix, que no cambia ninguna pantalla pública.

## R-16 Dependencias finales

| Paquete | Para qué | Justificación (principio VIII) |
|---------|----------|--------------------------------|
| `next`, `react`, `react-dom` | Framework | Elegido por el autor |
| `mongodb` | Base existente | Sin él no hay acceso a la base |
| `zod` | Validación compartida | FR-031 exige los mismos criterios en UI y servidor |
| `server-only` | Guardia de la capa de datos | Lo exige la constitución (restricciones técnicas) |
| `@next/mdx`, `@mdx-js/loader`, `@mdx-js/react`, `@types/mdx` | Posts enriquecidos | Integración oficial de Next para FR-071 |
| `sugar-high` | Resaltado de código | El más liviano; corre en el servidor |
| `minisearch` | Palette y asistente | Una sola dependencia para dos funcionalidades |
| `sass` | Estilos | Ya existía; conserva el ADN 2023 |
| `typescript`, `@types/*`, `eslint`, `eslint-config-next` | Tooling | Estándar |
| `vitest`, `@playwright/test`, `@axe-core/playwright` | Pruebas | Principio VI |

**Se eliminan**: `express`, `cors`, `body-parser`, `express-validator`, `mongoose`, `@types/mongoose`,
`@types/mongodb`, `@types/express*`, `@types/cors`, `sweetalert`, `react-hook-form`,
`react-network-speed`, `@next/font`, `fs`, `eslint-plugin-tree-shaking`.
