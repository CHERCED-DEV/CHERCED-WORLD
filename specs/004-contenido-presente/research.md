# Research 004: decisiones técnicas

Investigación del 2026-11-04 para el [plan](./plan.md). Solo aparecen las decisiones técnicas reales. Lo marcado
"sin verificar" se comprueba en la vista previa antes de cerrar la lane que lo usa.

## R-401 WebMCP en los navegadores, a la fecha

**Lo que se sabe** (fuentes al final; son blogs y guías, no documentación oficial de Chrome):

- **Estado**: es un borrador del Web Machine Learning Community Group del W3C, no un estándar.
- **Disponibilidad**: Chrome lo abrió como origin trial desde la versión 149. Para usarlo en un sitio real hace falta
  registrar el origen y publicar el token del trial.
- **Pruebas en local**: `chrome://flags/#enable-webmcp-testing`.
- **Punto de entrada inestable**: los tutoriales usan `navigator.modelContext.registerTool()`. Implementaciones y
  guías recientes usan `document.modelContext`, y al menos una fuente dice que el borrador de octubre de 2026 quitó
  `unregisterTool()`. Para dar de baja una herramienta se usa un `AbortSignal`.
- **Forma de una herramienta**: `name`, `description`, `inputSchema` (JSON Schema) y `execute`.
- **Forma declarativa**: atributos en formularios HTML.
- **Permisos**: el uso está controlado por una Permissions Policy `tools`.
- **Consumidores**: según las fuentes, hoy solo Gemini en Chrome consume estas herramientas.
- **Pruebas automatizadas**: el handoff menciona una clase `WebMCP` de Playwright y `navigator.modelContextTesting`.
  **Sin verificar**: no se pudo abrir la documentación de Playwright desde esta sesión, y el repo usa Playwright 1.64.

**Decisión**:

- Un solo adaptador, `lib/agent/webmcp.ts`, detecta `document.modelContext` y luego `navigator.modelContext`, y
  registra las herramientas con un `AbortController` cuya señal se aborta al desmontar.
- Se carga con `import()` diferido después de que la página está interactiva.
- Sin polyfill ni dependencia.
- **Sin origin trial en la v1.** Un token del trial pide una cuenta externa y vence, lo que roza el principio VIII.
  Queda como P-423. Sin token, las herramientas aparecen en Chrome con el flag de pruebas y en cualquier navegador
  que lance la API.
- **Pruebas**:
  - Unitarias del adaptador con un `modelContext` falso.
  - E2E con la API real solo si Playwright 1.64 trae soporte. Si no, una prueba manual documentada en Chrome con el
    flag.

**Alternativas descartadas**:

- Un polyfill que simule la API. Agrega código para un consumidor que no existe.
- Las herramientas declarativas por atributos HTML. Cubren formularios, no las lecturas, y el nombre de los
  atributos tampoco es estable.

## R-402 Transición compartida del carrusel al caso

**Decisión**:

- Usar el mismo mecanismo que ya usan las transiciones entre páginas de la 002 (`components/shell/PageTransition.tsx`,
  con el `<ViewTransition>` de React 19.3).
- La imagen de la tarjeta y la del caso se envuelven en `<ViewTransition name={`project-media-${id}`}>`.
- Cada nombre tiene que ser único en la página. Por eso el carrusel no puede duplicar diapositivas: hoy no las clona,
  y una prueba lo fija.
- Con movimiento reducido, una regla `@media (prefers-reduced-motion: reduce)` anula la animación de
  `::view-transition-group(*)`.

**Sin verificar**: la 002 decía que Next 16 lo activa con `experimental.viewTransition`, pero `next.config.ts` no lo
tiene y las transiciones entre páginas funcionan. P4 lo confirma en la vista previa. Si hace falta el flag, es una
enmienda de R0 (`next.config.ts`).

**Alternativa descartada**: animar a mano con FLIP. Duplica lo que hace la plataforma y es más difícil con
movimiento reducido.

## R-403 Imágenes OG por código

**Decisión**:

- La convención `opengraph-image.tsx` por segmento, con `ImageResponse` de `next/og`, que viene con Next.
- **Plantilla única**: `lib/og/template.tsx`, que recibe idioma, título y línea.
- **Pre-generación**: se prerenderiza en el build con `generateStaticParams` de `[lang]` y de `[id]`. Nada se genera
  en cada visita.
- **Texto alternativo**: `generateImageMetadata` lo localiza; el `alt` estático no sirve con dos idiomas.
- **Prioridad**: las imágenes por archivo tienen prioridad sobre el `openGraph.images` de
  `components/site/metadata.ts`. El logo por defecto de esa función queda como respaldo para las rutas sin archivo.
- **Fuentes**: `ImageResponse` necesita TTF u OTF. El repo solo trae `Montserrat-Regular.ttf`, así que se agrega
  `Montserrat-Bold.ttf` (licencia OFL) en `public/fonts/Montserrat/static/`. Es un archivo, no una dependencia.
- **Límites**: `ImageResponse` solo entiende un subconjunto de CSS (flexbox, sin grid). La retícula del sistema de
  diseño se dibuja con un SVG en línea.

**Alternativa descartada**: imágenes PNG hechas a mano por sección. Hay que rehacerlas cada vez que cambia un título.

## R-404 JSON-LD `Person`

**Decisión**:

- `lib/seo/person.ts` arma el objeto desde `content/site.ts`.
- `app/[lang]/layout.tsx` lo publica en un `<script type="application/ld+json">` y reemplaza `<` por `<`, para
  que un texto de contenido no pueda cerrar el script.
- La URL base sale de `getSiteUrl()` (`lib/site-url.ts`). Sin variables nuevas.
- El `@id` es `{base}/#person`, y la 005 lo reutiliza en `BlogPosting.author`.
- Va en el layout, no solo en el home: es la identidad del sitio y cuesta menos de 1 KB.

## R-405 `llms.txt`

**Decisión**:

- Un route handler `app/llms.txt/route.ts` con `dynamic = 'force-static'`, fuera de `[lang]`, generado en el build
  desde el registro de capacidades (contenido.md §25).
- El proxy no corre para rutas con extensión (commit 7e05b91), así que no se redirige a un idioma.

**Alternativa descartada**: un archivo fijo en `public/`. Se desincroniza con los casos y los posts.

## R-406 Reacciones de un clic

**Decisión**:

- **Almacenamiento**: la colección nueva `post_reactions` en la base que ya existe, un documento por post con
  contadores por tipo, actualizados con `$inc` y piso en 0.
- **Lectura**: `GET /api/reactions/[postId]` devuelve solo `{ clap, idea, fire }`, con caché corta.
- **Escritura**: la acción `toggleReaction(postId, kind, op)`:
  - valida que `postId` exista en el registro de posts y que `kind` y `op` sean del enum;
  - aplica la regla `reaction` (10 cada 10 minutos por huella de IP).
- **Reacción propia**: se recuerda en `localStorage` como preferencia.

**Trade-off**: el servidor confía en el `op` que manda el cliente, así que alguien podría restar reacciones ajenas.
Se acepta: los contadores son cosméticos, tienen piso en 0 y el límite por IP frena el abuso.

**Alternativas descartadas**:

- Guardar quién reaccionó (huella de IP o cookie por post). Son datos derivados de la persona guardados más tiempo, y
  una cookie de seguimiento contradice la política de privacidad.
- Un servicio externo de reacciones. Va contra el principio VIII.

## R-407 Atajos de una tecla y WCAG 2.1.4

**Decisión**:

- Un único listener en `components/experience/Shortcuts.tsx` para `/`, `?` y `t`.
- Se ignora si el foco está en un elemento editable, si hay modificadores o si `event.isComposing`.
- La preferencia de apagarlos va en `components/experience/preferences.ts` (`localStorage`, con `try/catch`).
- Ctrl/⌘+K se queda en `components/shell/PaletteTrigger.tsx`, como hoy.
- `t` usa la misma acción de tema que ya tiene la paleta.

## R-408 Preselección del servicio en Contacto

**Decisión**:

- `app/[lang]/contactMe/page.tsx` ya es `force-dynamic`. Lee `searchParams.servicio`, lo valida contra `ServiceId` y
  preselecciona el `<select>` en el HTML del servidor. Funciona sin JS.
- `contactSchema` valida el mismo enum, así que un valor manipulado se rechaza.

## R-409 Terminal en la que se escribe

**Decisión**:

- Un `<input>` con etiqueta y un registro de salida con `aria-live="polite"` dentro del panel terminal que ya existe
  en `components/site/about/BrainMap.tsx`.
- **Comandos**: datos en `content/terminal.ts` (contenido.md §15 y §15b). `ls projects/` y `ls synergos/` se generan
  desde `projects.ts` y `synergos.ts`.
- **Tab** completa solo si hay un prefijo con coincidencia única. Si no, deja pasar el evento y el foco se mueve.
- **Seguridad**: la salida se pinta como texto, nunca como HTML.

**Alternativa descartada**: una librería de terminal (xterm.js y similares). Pesa decenas de KB para cinco comandos.

## R-410 Tarjetas de servicio con reverso

**Decisión**:

- Las dos caras están en el DOM. Un botón con `aria-expanded` gira la tarjeta con `transform` y `backface-visibility`.
  El puntero y el toque usan la misma acción.
- Con movimiento reducido, cambia de cara con un fundido.
- Sin JS (sin la clase `cw-js`), las dos caras se apilan.
- "Quiero esto" es un enlace propio, fuera del área que gira.

## Fuentes

- [WebMCP en Chrome 149 (DEV Community)](https://dev.to/thousand_miles_ai/webmcp-in-chrome-149-web-pages-get-a-tool-api-for-ai-agents-bfi)
- [WebMCP: guía práctica (DEV Community)](https://dev.to/nilambuilds/your-website-has-a-new-user-and-its-not-human-a-hands-on-guide-to-webmcp-1e73)
- [What Is WebMCP (MCP Playground)](https://mcpplaygroundonline.com/blog/what-is-webmcp)
- [What Is WebMCP and How Does It Work (MCP Bundles)](https://www.mcpbundles.com/guides/what-is-webmcp)
- Código del repo: `components/shell/PageTransition.tsx`, `components/site/metadata.ts`, `lib/site-url.ts`,
  `lib/security/rate-limit.ts`, `app/[lang]/contactMe/page.tsx` y `next.config.ts`.
