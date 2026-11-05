# Implementation Plan: Contenido presente de CHERCED-WORLD

**Branch**: `004-contenido-presente` | **Date**: 2026-11-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-contenido-presente/spec.md`, con el copy en
[contenido.md](./contenido.md)

## Summary

La 004 pone el sitio al día con lo que el autor es hoy. Trae seis frentes:

- **Identidad**: hero con guiño, metas, Servicios rehecha (D10), CV en LinkedIn y carrera verificada.
- **Evidencia**: Synergos reescrito con tarjetas ADR y diagrama vivo, tres casos nuevos, "En cifras", principios y
  "en palabras".
- **Teclado**: paleta con habilidades y comandos, atajos y terminal en la que se escribe.
- **Detalles**: easter egg, chip de disponibilidad, copiar correo, transición del carrusel al caso y `/now`.
- **Compartir**: JSON-LD `Person` e imágenes OG por sección.
- **Agentes**: un registro único de capacidades que alimenta la paleta, el asistente, WebMCP y `llms.txt`.

Casi todo es contenido como datos y componentes sobre lo que ya existe. Lo que toca contratos congelados de la 001 y
la 002 se registra como enmiendas A-401 a A-407:

- el campo "¿Qué te interesa?" y el enlace de agenda;
- las reacciones;
- el checkbox de privacidad;
- los ids de servicio;
- el tipo de búsqueda `skill`;
- el layout y el footer.

El trabajo se reparte en 8 lanes con rutas exclusivas:

- **P0** va primero: tipos, contenido, i18n, piezas compartidas, SEO y la plantilla OG. Congela con `p0-frozen`.
- **P1 a P6** corren en paralelo.
- **P7** hace el QA integral.

El orquestador integra en la rama `004-contenido-presente`, y el corte a `main` necesita la confirmación del autor.

## Technical Context

**Language/Version**: TypeScript 5.9 (estricto) sobre Node.js 22, igual que la 001.

**Primary Dependencies**: las de hoy, sin cambios: next 16.4, react / react-dom 19.3, mongodb 7.8, zod 4.6,
minisearch 7.2, sugar-high 2.6 y sass 1.107.
- `next/og` (ImageResponse) viene con Next.
- WebMCP, View Transitions y la Clipboard API son APIs del navegador.
- **Cero dependencias nuevas.**

**Storage**: la base MongoDB que ya existe (`MONGODB_INTEGRAL_DB`).
- `messages` suma el campo opcional `interest` (A-401).
- Colección nueva `post_reactions`, con contadores agregados (A-403). Es una colección, no infraestructura: la 001
  ya creó varias en la misma base.
- El contenido sigue en el repo (`content/`).

**Testing**: Vitest 5 (unitarias y contrato) y Playwright 1.64 con @axe-core/playwright 4.14 (e2e, sin JS,
móvil, accesibilidad). Las e2e corren contra el repositorio en memoria, nunca contra la base de producción.

**Target Platform**: el proyecto de Vercel que ya existe; las últimas 2 versiones de Chrome, Edge, Firefox y Safari.
WebMCP solo se activa en navegadores que lo exponen (ver [research.md](./research.md), R-401).

**Project Type**: aplicación web full-stack en un solo proyecto Next.js (App Router).

**Performance Goals**: los del principio V: LCP ≤ 2,5 s, CLS ≤ 0,1 e INP ≤ 200 ms en móvil de gama media. El fondo
sigue a 50 fps o más (002, SC-205).

**Constraints**:
- Cero infraestructura y cero variables de entorno nuevas.
- Despliegue = merge a `main`.
- El contenido principal se ve sin JS.
- Contraste AA sobre glass.
- Ninguna cifra ni nombre interno del empleador.
- Datos personales nunca en respuestas públicas.

**Scale/Scope**: 11 vistas públicas × 2 idiomas (se suma `/now`), 15 casos de estudio, 6 servicios y 9 herramientas
WebMCP. Tráfico de un portafolio personal.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Verificación en este plan | Estado |
|---|---|---|
| I. Evolución, no reemplazo | Rutas intactas; `/now` y `/llms.txt` son aditivas. El hero conserva "SOY DESARROLLADOR" tachado. Servicios cambia de contenido, no de ruta. Cristal, tokens y paleta sin cambios | ✅ |
| II. Glass sobre movimiento | Guiño, diagrama vivo, línea de tiempo de Servicios, giro de tarjetas, punto del chip y transición compartida: todo se apaga con movimiento reducido. Ningún bucle nuevo de animación continua | ✅ |
| III. Seguridad real | `interest` y las reacciones se validan en el servidor, con límite por huella de IP. Las reacciones solo devuelven contadores. Las herramientas WebMCP exponen solo datos públicos; `draft_contact_message` nunca envía ni marca el consentimiento. El JSON-LD escapa `<` | ✅ |
| IV. Contenido como datos | Todo el copy vive en `content/` y en `content/i18n/`. Las cifras de Synergos tienen una sola fuente. `llms.txt` y las herramientas leen las mismas fuentes que la UI. El navegador solo guarda preferencias: tema, idioma, atajos, guiño visto y reacción propia | ✅ |
| V. Rendimiento y accesibilidad | El adaptador WebMCP se importa diferido. Las imágenes OG se generan en el build. Los atajos de una tecla se pueden apagar (WCAG 2.1.4). Terminal, tarjetas y reacciones son operables con teclado | ✅ |
| VI. Calidad verificable | Cada lane cierra con `npm run verify` y sus e2e. Hay suite de contrato para el repositorio nuevo, pruebas de esquema de las herramientas (mutadas una vez) y pruebas de confidencialidad y de verificación de carrera | ✅ |
| VII. Propiedad exclusiva | 8 lanes con rutas disjuntas (tabla abajo). P0 congela antes que las demás. Los cambios a lanes congeladas de la 001 y la 002 van como enmiendas A-4xx | ✅ |
| VIII. Simplicidad operativa | Sin servicios, cuentas, llaves ni variables nuevas. WebMCP corre en el navegador y `llms.txt` es estático. El origin trial de WebMCP pediría una cuenta externa y un token que vence: queda fuera de la v1 y pendiente del autor (P-423) | ✅ con P-423 abierta |

Re-check post-diseño: sin violaciones. La única tensión es el origin trial de WebMCP (R-401). Se resuelve sin
token: el sitio registra herramientas solo donde el navegador ya las expone.

## Project Structure

### Documentation (this feature)

```text
specs/004-contenido-presente/
├── spec.md
├── contenido.md      # copy ES/EN listo para pegar
├── plan.md           # este archivo
├── research.md       # decisiones técnicas R-401 a R-410
├── data-model.md     # tipos, datos y contratos (incluye los de API y capacidades)
└── tasks.md          # T401 en adelante, por lane
```

No hay `contracts/` aparte: los tres contratos nuevos (reacciones, `interest` y capacidades) son cortos y viven en
[data-model.md](./data-model.md).

### Source Code (repository root)

Cada ruta indica la lane dueña en la 004. Ninguna ruta tiene dos dueños. Lo que no aparece aquí no se toca.

```text
content/
├── types.ts                                                         P0
├── site.ts, projects.ts, capsule.ts                                 P0
├── synergos.ts, now.ts, terminal.ts (nuevos)                        P0
└── i18n/{es,en}/*.json (todos los namespaces)                       P0
public/
├── fonts/Montserrat/static/Montserrat-Bold.ttf (nuevo)              P0
├── assets/imgs/projects/{director-lines,legal-workspace,event-bridge}.svg (nuevos)   P0
└── assets/imgs/projects/** (el resto)                               P4
app/
├── sitemap.ts, robots.ts                                            P0
├── llms.txt/route.ts (nuevo)                                        P6
├── api/reactions/[postId]/route.ts (nuevo)                          P5
├── api/search-index/**                                              P6
└── [lang]/
    ├── layout.tsx, opengraph-image.tsx (nuevo)                      P0
    ├── page.tsx, now/** (nuevo)                                     P1
    ├── aboutMe/**                                                   P2
    ├── services/**                                                  P3
    ├── portfolio/**                                                 P4
    └── contactMe/**, privacy/**                                     P5
components/
├── ui/ (+ CvLink, AvailabilityChip, EmailMenu)                      P0
├── shell/ (footer: easter egg, EmailMenu, enlace a /now)            P0
├── site/{SectionTitle,format,metadata,lang}*, site/_site.scss       P0
├── site/HomeBanner*, site/home/**, site/now/** (nuevo)              P1
├── site/about/**                                                    P2
├── site/services/**                                                 P3 (P0 solo toca ServiceIcon para compilar, A-405)
├── site/portfolio/**                                                P4
├── contact/**, admin/**                                             P5
├── blog/comments/**, blog/reactions/** (nuevo)                      P5
└── experience/**                                                    P6
lib/
├── seo/** (nuevo), og/** (nuevo)                                    P0
├── validation/**, data/**, actions/contact.ts                       P5
├── actions/reactions.ts (nuevo), security/rate-limit.ts             P5
├── search/**, assistant/**                                          P6
└── capabilities/** (nuevo), agent/** (nuevo)                        P6
tests/
├── unit/p0/**, e2e/p0/**, unit/lc/** (completitud de contenido)     P0
├── unit/p{1..6}/**, e2e/p{1..6}/**                                  cada lane la suya
├── contract/**                                                      P5
└── e2e/integration/**, playwright.config.ts                         P7
```

**Structure Decision**: un solo proyecto Next.js, como en la 001 y la 002. Las carpetas nuevas (`lib/seo`, `lib/og`,
`lib/capabilities`, `lib/agent`, `components/site/now`, `components/blog/reactions`) siguen la convención de una
carpeta por responsabilidad. Las imágenes OG de cada sección viven junto a su ruta, como pide la convención de
archivos de Next, y por eso son de la lane dueña de esa ruta.

## Lanes

| Lane | Alcance | Historias / requisitos | Depende de | Puerto e2e |
|---|---|---|---|---|
| **P0** Foundation y contenido | Tipos E-04 a E-13; todo el contenido e i18n de contenido.md; carrera verificada; piezas compartidas (CV, chip, menú de correo); footer; JSON-LD; plantilla OG; sitemap; pruebas de contenido, confidencialidad y verificación | US3, US8 (JSON-LD), FR-403/404/407, FR-410–419, FR-436 (datos), FR-440–444, FR-462–464, FR-470–472, FR-483, FR-495, FR-496 | 002 integrada | 3110 |
| **P1** Home y /now | Hero con guiño y subtítulo, CV, chip y correo en el banner, página `/now` | US1, US2 (hero), US7 (guiño), US10 | `p0-frozen` | 3111 |
| **P2** Sobre mí | "En cifras", principios, "en palabras", CV en "Quién soy", terminal con comandos, lóbulo por ancla, OG | US2, US5, US7 (terminal) | `p0-frozen` | 3112 |
| **P3** Servicios | Los siete bloques, seis tarjetas con reverso, pictogramas, línea de tiempo, preguntas frecuentes, "Quiero esto", OG | US1b | `p0-frozen` | 3113 |
| **P4** Portafolio y casos | Época y filtro, tarjetas ADR, diagrama vivo, repos, transición compartida, OG por caso | US1 (intro), US4, US7 (transición), US8 (OG de casos) | `p0-frozen` | 3114 |
| **P5** Contacto, privacidad y reacciones | Enmiendas A-401 a A-404: campo `interest`, checkbox de privacidad, reacciones; CV, chip y correo en Contacto; agenda (bloqueada) | US1b (formulario), US2, US7, US9 | `p0-frozen` | 3115 |
| **P6** Experiencia y agentes | Registro de capacidades, paleta con habilidades y `>`, atajos, asistente, WebMCP, `llms.txt` | US6, US11 | `p0-frozen` | 3116 |
| **P7** QA integral | Auditorías responsive, de interacción, de privacidad y de rendimiento sobre todo lo nuevo | FR-446, FR-499, SC-405, SC-406, SC-413, SC-414 | `p0-frozen` (corre completa al integrar) | 3117 |

**Orden de integración**: P0 → P5 → P6 → P2 → P1 → P3 → P4 → P7. P5 va temprano porque el formulario de Contacto
es el destino de "Quiero esto" (P3), y P6 antes de P2 porque la paleta enlaza a lóbulos por ancla. Después se corre
la verificación completa tres veces, se revisa la vista previa con el autor y se corta a `main` solo con su
confirmación explícita.

### Contratos entre lanes (se congelan con `p0-frozen`)

| Contrato | Proveedor | Consumidores | Forma |
|---|---|---|---|
| Ancla de lóbulo | P2 | P6 (paleta, `get_skills`) | `/{lang}/aboutMe#lobe-<id>`. Sin JS lleva a la lista del lóbulo; con JS, el mapa lo activa |
| Preselección de servicio | P5 | P3 | `/{lang}/contactMe?servicio=<ServiceId>`. Un valor desconocido se ignora |
| Piezas compartidas | P0 | P1, P2, P5 | `CvLink`, `AvailabilityChip` y `EmailMenu` en `components/ui/` (props en data-model) |
| Plantilla OG | P0 | P1 a P5, y la 005 | `renderOgImage({ lang, title, line })` en `lib/og/` |
| `Person` JSON-LD | P0 | la 005 (`BlogPosting.author`) | `@id` = `{base}/#person` |
| Registro de capacidades | P6 | la 003 (A1, A13) | `lib/capabilities/` (E-13) |

## Enmiendas a lanes congeladas (A-4xx)

Las lanes de la 001 (L3 contacto y datos, L4 blog, L5 experiencia) y de la 002 (R0 a R4) quedan congeladas. Estos
cambios se hacen como enmiendas explícitas. Cada una tiene una sola lane ejecutora y queda en este plan:

| ID | Cambio | Contrato congelado que toca | Lane | Motivo |
|---|---|---|---|---|
| A-401 | `NewMessage.interest?` y `MessageRecord.interest` (`ServiceId \| 'other' \| null`); `contactSchema` con el campo opcional; `submitContact` lo guarda; el panel lo muestra; la política de privacidad lo menciona | L3: `lib/data/types.ts`, `lib/validation`, `lib/actions/contact.ts`, `components/contact/**`, `components/admin/**`. Política: `content/site.ts` (P0) | P5 (texto de privacidad: P0) | FR-406f |
| A-402 | Enlace de agenda en la confirmación del formulario | L3: `components/contact/ContactForm.tsx` | P5 | FR-480. **Bloqueada por P-422** |
| A-403 | `ReactionRepo` en `lib/data` (memoria y Mongo, colección `post_reactions`), regla `reaction` en `RATE_LIMITS`, ruta `GET /api/reactions/[postId]` y acción `toggleReaction` | L3: `lib/data/**`, `lib/security/rate-limit.ts`; suite de contrato | P5 | FR-482 |
| A-404 | `ConsentLabels` pasa de `{ before, link, after }` a `{ text, readPolicy, newTab }`; el enlace sale de la etiqueta | L3: `components/contact/ConsentField.tsx`; L4: `components/blog/comments/CommentForm.tsx` | P5 | FR-481 |
| A-405 | `ServiceId` con seis ids nuevos. P0 deja en `ServiceIcon.tsx` pictogramas provisionales solo para que compile; P3 los reemplaza | R3: `components/site/services/**` | P0 (provisional), P3 (final) | E-05 |
| A-406 | `SearchDocKind` suma `'skill'` y `SEARCH_INDEX_VERSION` pasa a 2 | L5: `lib/search/types.ts` | P6 | FR-450 |
| A-407 | `app/[lang]/layout.tsx` publica el JSON-LD `Person`; el footer suma el easter egg, el menú de correo y el enlace a `/now` | R0: layout y `components/shell/**` | P0 | FR-462, FR-464, FR-470 |

La 005 trabaja después sobre `components/blog/**`. P5 solo toca `components/blog/comments/**` y crea
`components/blog/reactions/**`. Si la 005 arranca antes de integrar la 004, el orquestador mueve esas dos carpetas de
dueño con una enmienda.

## Tareas bloqueadas por preguntas abiertas

Se escriben como tareas con su bloqueo, para que el resto avance. Si una pregunta se resuelve después de
`p0-frozen`, el dato lo agrega el orquestador como enmienda de contenido.

| Pregunta | Qué bloquea | Tarea |
|---|---|---|
| P-408 | Tarjetas ADR de Director & lines, Legal workspace, Event bridge y CHERCED-WORLD 2026 | T462 |
| P-410 | `links.live` de Synergos | T461 |
| P-412 | La pregunta frecuente "¿Quién es dueño…?" | T446 |
| P-413 | La selección final de casos en Servicios | T447 |
| P-416 | `draft_contact_message` | T492 |
| P-417 | El nombre "fábrica de software" y el título del hero de Servicios. Por defecto va como está | T449 |
| P-418 | El orden registro → AI Lab y `llms.txt` en la misma entrega. Por defecto, sí | T493 |
| P-419 | Servicios de LinkedIn (acción del autor fuera del repo) | T508 |
| P-420 | El enlace al repo `legal-workspace` | T461 |
| P-421 | Rangos de precio | T448 |
| P-422 | Enlace de agenda (A-402) | T480 |
| P-423 | Token del origin trial de WebMCP | T494 |
| P-424 | Párrafo "en palabras" de Prácticas de ingeniería | T434 |

P-409 ya no bloquea nada: está resuelta (el enlace a Instagram se queda).

## Complexity Tracking

Sin violaciones de la constitución que justificar. Se asumen dos riesgos con mitigación:

| Riesgo | Mitigación |
|---|---|
| WebMCP es un borrador cuya API cambia de nombre (R-401) | Un único adaptador, detección de las dos entradas conocidas y cero efecto si no existe |
| Las reacciones confían en que el cliente diga si suma o resta (R-406) | Contadores cosméticos con piso en 0 y límite por IP. Guardar quién reaccionó exigiría datos personales y se descarta |
