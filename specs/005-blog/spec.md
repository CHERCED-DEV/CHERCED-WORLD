# Feature Specification: El blog de un arquitecto que trabaja con agentes

**Feature Branch**: `005-blog` (sobre lo integrado en `002-refinamiento-impoluto`; reutiliza piezas de la
[004](../004-contenido-presente/spec.md))

**Created**: 2026-11-04

**Status**: Draft

**Input**: handoff del autor del 2026-11-04 (privado, fuera del repo), sección del blog: índice, página de cada post,
detalles para compartir y calendario de contenido. Más las decisiones del autor de esta sesión.

## Principio rector

El blog deja de ser una lista plana de cinco posts y pasa a ser el cuaderno de un arquitecto que trabaja con agentes:
decisiones, errores y lo que los tests no vieron. Se construye sobre lo que la 002 (R4) ya entregó, sin rehacerlo, y
dentro de la constitución 2.0.1:

- Sin infraestructura, servicios, proveedores ni variables nuevas (VIII).
- ES/EN con paridad y contenido como datos, con los posts en MDX (IV).
- Presupuestos de rendimiento y accesibilidad (V).

Mismas reglas de contenido que la 004: cero invención, ninguna cifra ni nombre interno del empleador, nada del material
de clientes y ninguna ruta de archivos privados del autor.

## Lo que ya existe y esta spec no repite

| Ya existe (002, R4, y la 001) | Dónde |
|---|---|
| Tiempo de lectura | `components/blog/PostView.tsx` (`post.readingTime`) |
| Índice "En este post" | `components/blog/Toc.tsx` |
| Barra de progreso de lectura | `components/blog/ReadingProgress.tsx` |
| Bloques de código con botón de copiar y resaltado de sintaxis | `components/blog/mdx/CodeBlock.tsx`, `components/blog/CopyButton.tsx` |
| Post anterior y siguiente | `components/blog/PostNav.tsx` |
| Compartir (copiar enlace, X, LinkedIn, Facebook, WhatsApp) | `PostView.tsx` (`Share`) |
| Comentarios con aviso de privacidad y honeypot | `components/blog/comments/` |
| Portada en la página del post y en la tarjeta | `components/blog/PostMedia.tsx` |
| Aviso cuando un post no tiene traducción y se lee en su idioma original | `PostView.tsx` (`LanguageNotice`) |
| Tarjeta entera clicable con "Leer más" | `components/blog/PostCard.tsx` |
| Catálogo de componentes para escribir posts | `components/blog/catalog/`, `/blog/catalog` |

De la 004 se reutilizan:

- la plantilla de imágenes OG (004, FR-471);
- el `@id` del JSON-LD `Person` (004, FR-470);
- el registro de comandos de la paleta (004, FR-451);
- las reacciones de un clic (004, FR-482).

## Clarifications

### Session 2026-11-04

- Q: ¿Se especifica el blog aparte? → A: sí, como la 005.
- Q: ¿"Escuchar este post" se hace ya? → A: depende del AI Lab (003, experimento V3) y de la decisión A/B, que sigue
  abierta. Se especifica aquí con esa dependencia marcada (US5).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Un índice que invita a leer (Priority: P1)

Quien entra al blog ve primero el post destacado, grande y con imagen. El resto va en una grilla. Los posts de 2026 y
los de 2023 se separan por año, con un texto de bienvenida que dice de qué va el blog.

**Why this priority**: hoy los cinco posts pesan igual, los de 2023 se mezclan con los de 2026 y la bienvenida es
genérica. Es la cara del blog.

**Independent Test**: abrir `/es/blog` y `/en/blog` con y sin JS, y de 320 a 2560 px.

**Acceptance Scenarios**:

1. **Given** el índice, **When** carga, **Then** arriba se ve el post destacado (el marcado como destacado o, si no hay
   ninguno, el más reciente) con su portada grande, y el resto en una grilla.
2. **Given** posts de varios años, **When** se ve el índice, **Then** se agrupan por año, del más nuevo al más viejo. El
   año más reciente se titula "Ahora" y los demás, "Archivo".
3. **Given** la bienvenida, **When** se lee, **Then** dice "Notas de un arquitecto que trabaja con agentes: decisiones,
   errores y lo que los tests no vieron." (o su versión en inglés).
4. **Given** un post sin portada propia, **When** se ve su tarjeta, **Then** usa su imagen OG generada (US4) como portada.

---

### User Story 2 - Filtrar y buscar (Priority: P1)

Las etiquetas de cada post filtran el índice, y hay una búsqueda dentro del blog.

**Why this priority**: con el calendario de la sección de abajo, el blog pasa de 5 a 12 posts. Sin filtro ni búsqueda,
lo nuevo se pierde entre lo viejo.

**Independent Test**: filtrar por una etiqueta, compartir la URL, abrirla sin JS y buscar un término que solo esté en un
post.

**Acceptance Scenarios**:

1. **Given** una etiqueta en una tarjeta o en un post, **When** se activa, **Then** el índice muestra solo los posts con
   esa etiqueta, la URL cambia y se puede compartir, y se anuncia la cantidad de resultados.
2. **Given** la URL de una etiqueta, **When** se abre sin JS, **Then** el servidor entrega la lista ya filtrada.
3. **Given** la búsqueda del blog, **When** se escribe "saga" o "tests", **Then** aparecen los posts que lo mencionan en el
   título, la descripción o las etiquetas. Sin coincidencias, se ofrece limpiar la búsqueda.

---

### User Story 3 - Posts que muestran criterio (Priority: P2)

Los posts técnicos resaltan las decisiones con callouts propios ("Decisión", "Trade-off", "Lo que aprendí"), cuentan
arquitectura con diagramas sin capturas, se agrupan en series, sugieren posts relacionados, cierran con una caja de
autor y dicen cuándo se actualizaron o si son una traducción.

**Why this priority**: el calendario del blog es técnico. Estas piezas son las que lo hacen legible y muestran criterio,
no solo relato.

**Independent Test**: un post de prueba en el catálogo de componentes que use cada pieza, auditado con lector de
pantalla y contraste.

**Acceptance Scenarios**:

1. **Given** un callout "Decisión", "Trade-off" o "Lo que aprendí" en el MDX, **When** se renderiza, **Then** se ve con su
   estilo de cristal y su etiqueta visible, y un lector de pantalla anuncia el tipo antes del texto.
2. **Given** un diagrama en un post, **When** se renderiza, **Then** llega como SVG en el HTML del servidor, con texto
   alternativo, y se lee bien en ambos temas.
3. **Given** un post que es parte de una serie, **When** se abre, **Then** muestra "{serie} · parte {n} de {total}" y
   enlaces a las otras partes publicadas.
4. **Given** el final de un post, **When** se llega, **Then** hay hasta 3 posts relacionados por etiqueta (sin repetir el
   anterior ni el siguiente) y una caja de autor con su retrato, una línea y el botón de contacto.
5. **Given** un post traducido (no el aviso de "sin traducción" que ya existe), **When** se lee en el idioma de la
   traducción, **Then** una nota dice "Escrito originalmente en {idioma}".
6. **Given** un post con fecha de actualización, **When** se lee, **Then** muestra "Actualizado el {fecha}" junto a la
   fecha de publicación.

---

### User Story 4 - Compartir bien y seguir el blog (Priority: P2)

Cada post se ve profesional al compartirlo en LinkedIn. Los buscadores entienden cada post, y quien quiera seguir el
blog tiene RSS.

**Why this priority**: el autor piensa publicar un resumen de cada post en LinkedIn. La imagen OG es lo primero que se ve.

**Independent Test**: revisar el `og:image` y el JSON-LD de cada post en ambos idiomas, y validar el feed RSS.

**Acceptance Scenarios**:

1. **Given** un post, **When** se comparte, **Then** su `og:image` muestra el título, la fecha y las etiquetas con la
   plantilla de la 004.
2. **Given** un post, **When** se analiza con un validador de datos estructurados, **Then** hay un `BlogPosting` válido
   cuyo autor es el `Person` de la 004 (mismo `@id`), con fechas de publicación y de actualización, idioma, imagen y
   etiquetas.
3. **Given** `/es/feed.xml` o `/en/feed.xml`, **When** se valida, **Then** es RSS 2.0 válido con los posts que tienen
   versión en ese idioma, y cada página del blog lo anuncia con `<link rel="alternate" type="application/rss+xml">`.

---

### User Story 5 - Escuchar este post (Priority: P3, depende de la 003)

Cada post tiene un botón "Escuchar este post" que lo lee en voz alta. También se puede lanzar desde la paleta.

**Why this priority**: conecta el blog con el AI Lab y suma accesibilidad. Pero depende del experimento V3 de la 003 y
de la decisión A/B, que sigue abierta.

**Independent Test**: escuchar un post en ES y en EN, pausarlo, retomarlo y navegar con teclado.

**Acceptance Scenarios**:

1. **Given** un post y el V3 de la 003 disponible, **When** se activa "Escuchar este post", **Then** se lee el cuerpo del
   post (sin bloques de código ni texto alternativo de imágenes decorativas) en el idioma de la página, con controles de
   reproducir, pausar y detener operables con teclado.
2. **Given** un navegador sin síntesis de voz o sin audio disponible, **When** se ve el post, **Then** el botón no aparece.
3. **Given** la paleta en un post, **When** se escribe `> escuchar`, **Then** aparece "Escuchar este post". Fuera de un
   post, ese comando no existe.

---

### Edge Cases

- Una etiqueta que solo existe en un idioma: su URL en el otro idioma responde con la lista vacía y un enlace al índice,
  no con un error.
- Las etiquetas con mayúsculas, tildes o espacios se normalizan a un slug estable; la etiqueta visible no cambia.
- Un post sin traducción: aparece en el feed y en la búsqueda solo de su idioma original. En el otro idioma se ve con el
  aviso que ya existe.
- Una serie con partes sin publicar: el total cuenta solo las publicadas.
- Un diagrama SVG muy ancho en 320 px: se desplaza en su propio contenedor, sin scroll horizontal de la página.
- La síntesis de voz se corta al cambiar de pestaña: al volver, se puede retomar desde el párrafo actual.
- El post destacado también está en el grupo de su año: no se repite en la grilla.

## Requirements *(mandatory)*

### Functional Requirements

#### Índice

- **FR-501**: El índice MUST mostrar arriba un post destacado: el que tenga `featured` en su meta o, si no hay ninguno, el
  más reciente. Va con portada grande y no se repite en la grilla.
- **FR-502**: El resto de los posts MUST ir en una grilla, agrupados por año de publicación, del más nuevo al más viejo.
  El grupo del año más reciente se titula "Ahora" y los demás, "Archivo".
- **FR-503**: La bienvenida y la meta description del blog MUST cambiar al copy de la sección [Copy](#copy).
- **FR-504**: Cada tarjeta MUST tener portada. Si el post no trae una propia, se usa su imagen OG (FR-520).
- **FR-505**: Las etiquetas MUST ser enlaces que filtran el índice. Cada etiqueta tiene una URL propia, renderizada en el
  servidor y prerenderizada en el build, que se puede compartir. El filtro MUST NOT volver dinámico el índice principal
  (no regresión de D-05 de la 002).
- **FR-506**: El blog MUST tener una búsqueda sobre título, descripción y etiquetas de los posts del idioma, sobre el
  índice de búsqueda que ya existe, sin dependencias nuevas. Sin JS, el formulario cae a una página de resultados
  servida por el servidor, o a las páginas de etiquetas.

#### Página del post

- **FR-510**: El catálogo de MDX MUST sumar el componente `Callout` con tres tipos (`decision`, `tradeoff` y `learned`),
  documentado en `/blog/catalog`.
- **FR-511**: Los diagramas MUST llegar como SVG estático en el HTML, sin JS en el cliente. Mermaid u otro renderizador
  solo entra si se justifica según el principio VIII y se renderiza en el build (P-503). Mientras tanto, los diagramas
  son SVG dibujados a mano con `MdxImage`.
- **FR-512**: `PostMeta` MUST admitir `series?: { id: string; part: number }`, con el nombre de cada serie en datos. El
  post muestra su posición en la serie y enlaces a las otras partes publicadas.
- **FR-513**: Al final de cada post MUST mostrarse hasta 3 posts relacionados por etiquetas en común, ordenados por
  coincidencias y luego por fecha, sin repetir los de `PostNav`.
- **FR-514**: Cada post MUST cerrar con una caja de autor: retrato según el tema, "Camilo Hernandez · Software Solutions
  Engineer · AI-First" y un botón a Contacto. Los datos salen de `content/site.ts`, no se repiten en el post.
- **FR-515**: Un post traducido MUST mostrar la nota "Escrito originalmente en {idioma}" en el idioma de la traducción.
  Usa `originalLang`, que ya existe en la meta. El aviso de fallback que ya existe se queda como está.
- **FR-516**: `PostMeta` MUST admitir `updated?: string`. Si existe, el post muestra "Actualizado el {fecha}" con `<time>`.

#### Compartir y seguir

- **FR-520**: Cada post, en cada idioma, MUST tener su `og:image` generada con la plantilla de la 004: título, fecha y
  etiquetas, 1200 × 630, con texto alternativo.
- **FR-521**: Cada post MUST publicar un JSON-LD `BlogPosting` con `headline`, `description`, `datePublished`,
  `dateModified` (si hay `updated`), `inLanguage`, `image`, `keywords`, `url` y `author: { "@id": "{base}/#person" }`.
- **FR-522**: El sitio MUST servir un feed RSS 2.0 por idioma (`/es/feed.xml` y `/en/feed.xml`) con los posts que
  tienen versión en ese idioma: título, enlace, descripción, fecha, `guid` y etiquetas como `category`. Se genera en el
  build desde el registro de posts, sin servicios nuevos.
- **FR-523**: Las páginas del blog MUST anunciar el feed de su idioma en el `<head>`. El índice muestra un enlace visible
  "Suscríbete por RSS".

#### Escuchar este post (depende de la 003)

- **FR-530**: "Escuchar este post" MUST implementarse con el motor que decida la 003 para el experimento V3. Si es el
  camino A, es síntesis de voz en el navegador, sin enviar nada a un servidor propio. Si es el B, es audio pregenerado
  con una llave aprobada como excepción. Hasta que la 003 decida, esta historia no se implementa.
- **FR-531**: El reproductor MUST leer solo el cuerpo del post en el idioma de la página. Sus controles son operables con
  teclado y su estado se anuncia con `aria-live`. Si el navegador no puede, no se muestra.
- **FR-532**: La paleta MUST registrar "Escuchar este post" (004, FR-451) solo en las páginas de post y solo cuando FR-530
  esté disponible.

#### Contenido y publicación

- **FR-540**: Cada post nuevo del calendario MUST publicarse en ES y EN, con el flujo que ya existe (`registry.ts`,
  `es.mdx`, `en.mdx` y la meta), y pasar la auditoría de contraste de posts (L2).
- **FR-541**: Ningún post MUST incluir cifras o nombres internos del empleador, material de clientes ni rutas de archivos
  privados del autor. Las cifras de Synergos van con "más de", o con su fecha de medición si se usa la exacta (P-502).
- **FR-542**: Todo texto visible nuevo MUST existir en ES y EN (prueba de completitud de contenido).

### Key Entities

- **`PostMeta`** (enmienda): suma `featured?: true`, `updated?: string` y `series?: { id: string; part: number }`.
  `image` se vuelve opcional; sin portada, se usa la imagen OG.
- **Serie**: `{ id: string; name: Localized }`, en datos del blog.
- **Callout**: componente MDX con `type: 'decision' | 'tradeoff' | 'learned'` y contenido.
- **Feed**: derivado del registro de posts, uno por idioma. No se guarda.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-501**: Desde el índice, cualquier post se encuentra en 2 interacciones o menos (una etiqueta o una búsqueda, y
  luego el clic).
- **SC-502**: El 100 % de las URLs de etiqueta y de los posts responde con su contenido completo sin JS.
- **SC-503**: El 100 % de los posts tiene `og:image` propia y un `BlogPosting` válido, en ambos idiomas.
- **SC-504**: Los dos feeds RSS validan sin errores.
- **SC-505**: Las páginas del blog mantienen LCP ≤ 2,5 s, CLS ≤ 0,1, INP ≤ 200 ms y accesibilidad ≥ 95 en móvil de gama
  media, con portadas, diagramas y callouts.
- **SC-506**: 0 dependencias nuevas sin justificación aprobada según el principio VIII.

## Assumptions

- La 005 arranca cuando la 002 esté integrada. La plantilla OG, el `Person` y el registro de comandos llegan con la 004.
  Si la 005 llega primero, crea la plantilla OG y la 004 la reutiliza.
- Las etiquetas siguen siendo por idioma, como hoy.
- Los posts de 2023 se quedan: cuentan el camino del autor.
- El resumen de cada post en LinkedIn lo publica el autor a mano. No es parte del sitio.

## Fuera de alcance

- **"Avísame del próximo post" por correo.** Enviar correos exige un proveedor nuevo, y eso va contra el principio VIII.
  El RSS cubre la necesidad.
- **Cambiar los posts que ya existen**, salvo para agregarles `series`, `updated` o una portada.

## Calendario editorial (propuesto)

Posts que el autor ya tiene material para escribir. Todos van en ES y EN. Ritmo sugerido: uno cada dos semanas. Ninguno
se publica sin la revisión del autor.

| # | Título ES | Título EN | De qué se trata | Depende de |
|---|---|---|---|---|
| 1 | Lo que 2.353 tests no vieron | What 2,353 tests didn't see | Los dos defectos más caros de Synergos no los encontró la suite: los tests codificaban la misma suposición equivocada que el código. Salieron de levantar los procesos y matar uno a mitad del cobro. Criterio, no volumen | P-502 (la cifra exacta es la medición del 2026-08-06) |
| 2 | Un gate que nunca falló no vigila nada | A gate that never failed isn't watching anything | Fitness functions y gates de arquitectura que se mutan antes de confiar en ellos | — |
| 3 | Director y líneas: cómo dirijo agentes en paralelo | Director and lines: how I run AI agents in parallel | El modelo del caso "Director & lines" de la 004: worktrees, Spec Kit, una constitución compartida y decisiones por lotes | Publicar después del caso (004) |
| 4 | La compensación es dato | Compensation is data | Sagas en Synergos: por qué deshacer una reserva no es lo mismo que soltar un apartado | Se enlaza con el simulador de sagas (003, R1) cuando exista |
| 5 | Me hice mi propio dictador de voz | I built my own voice dictation tool | El dictador de voz del autor: Python, Whisper local y síntesis de voz, para escribir en español con términos técnicos en inglés | P-504 (¿se puede nombrar en público?); se enlaza con el transcriptor (003, V1) |
| 6 | Agnóstico hasta el segundo caso | Agnostic until the second use case | Cómo se parten las capacidades de Synergos para que no sepan de negocios | — |
| 7 | Una frontera de confianza para la IA | A trust boundary for AI | El arnés de agentes del caso "Legal workspace" de la 004: MCP, auditoría y humano en el ciclo | Mismas reglas de anonimización del caso. Revisión del autor antes de publicar |

## Copy

| Clave | ES | EN |
|---|---|---|
| `site.blog.welcome` | Notas de un arquitecto que trabaja con agentes: decisiones, errores y lo que los tests no vieron. | Notes from an architect who works with agents: decisions, mistakes and what the tests didn't catch. |
| `meta.blog.description` | Notas de un arquitecto que trabaja con agentes: decisiones, errores y lo que los tests no vieron. | Notes from an architect who works with agents: decisions, mistakes and what the tests didn't catch. |
| `index.featured` | Destacado | Featured |
| `index.now` | Ahora | Now |
| `index.archive` | Archivo | Archive |
| `index.filter` | Filtrar por etiqueta | Filter by tag |
| `index.allTags` | Todas | All |
| `index.tagResults` | {count} posts con «{tag}» | {count} posts tagged “{tag}” |
| `index.search` | Buscar en el blog | Search the blog |
| `index.noResults` | Sin resultados para «{query}». | No results for “{query}”. |
| `index.clear` | Limpiar | Clear |
| `index.rss` | Suscríbete por RSS | Subscribe via RSS |
| `callout.decision` | Decisión | Decision |
| `callout.tradeoff` | Trade-off | Trade-off |
| `callout.learned` | Lo que aprendí | What I learned |
| `series.position` | {series} · parte {n} de {total} | {series} · part {n} of {total} |
| `related.title` | Posts relacionados | Related posts |
| `author.line` | Software Solutions Engineer · AI-First | Software Solutions Engineer · AI-First |
| `author.cta` | Escríbeme | Write to me |
| `post.translatedFrom` | Escrito originalmente en {lang}. | Originally written in {lang}. |
| `post.updated` | Actualizado el {date} | Updated {date} |
| `listen.play` | Escuchar este post | Listen to this post |
| `listen.pause` | Pausar | Pause |
| `listen.resume` | Seguir escuchando | Resume |
| `listen.stop` | Detener | Stop |
| `listen.status` | Leyendo: {heading} | Reading: {heading} |

## Preguntas abiertas

| ID | Pregunta | Origen | Por defecto |
|---|---|---|---|
| P-501 | ¿Con qué post del calendario se arranca? El handoff recomienda "Lo que 2.353 tests no vieron" | Handoff, pregunta 14 | Ninguno se publica sin el visto bueno del autor |
| P-502 | El título del post 1 usa la cifra exacta de tests (medida el 2026-08-06), pero el sitio va con "más de 2.300". ¿Se queda la cifra exacta con su fecha, o se vuelve a medir? | Decisión "más de" del autor | Cifra exacta en el título, con la fecha de medición en el primer párrafo |
| P-503 | ¿Diagramas con Mermaid (dependencia nueva, renderizada en el build) o SVG dibujados a mano? | Principio VIII | SVG a mano |
| P-504 | ¿Se puede nombrar en público el dictador de voz del autor? ¿Tiene repo público? | Handoff, pregunta 9 | El post 5 no lo nombra ni enlaza un repo |
| P-505 | "Escuchar este post": ¿camino A (voz del navegador) o B (audio pregenerado con una llave)? | 003, decisión A/B | No se implementa hasta que la 003 decida |
