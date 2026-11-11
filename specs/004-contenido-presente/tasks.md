# Tasks: Contenido presente (004)

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Datos**: [data-model.md](./data-model.md) ·
**Research**: [research.md](./research.md) · **Copy**: [contenido.md](./contenido.md) · **Base**: la 002 integrada
completa, con T225 y T229 · **Rama**: `004-contenido-presente`

**Formato**: `- [ ] T4xx [P] [USx] Descripción con ruta`.

- `[P]` marca una tarea que puede correr en paralelo con las demás de su lane (otros archivos, sin dependencias
  pendientes).
- `[USx]` es la historia de la spec.
- **BLOQUEADA** lleva la pregunta abierta que la frena. El resto de la lane avanza sin ella.

**Reglas para todas las lanes**:

- Cada lane trabaja en `.worktrees/P<n>`, rama `lane/P<n>`, y toca solo sus rutas (tabla de lanes del plan).
- Cada lane cierra con `npm run verify` y sus e2e en verde, con `E2E_PORT` propio.
- Las e2e usan el repositorio en memoria. Ninguna prueba ni agente apunta a la base de producción.
- Las pruebas son proporcionales al riesgo: más en datos, privacidad y contratos; menos en decoración (principio VI).
- Ningún texto nuevo trae cifras o nombres internos del empleador, material de clientes ni rutas del escritorio del
  autor.

## Precondición (orquestador)

- [ ] T401 Confirmar que la 002 está integrada con T225, T229 y la auditoría de R5 cerradas.
  - Crear la rama `004-contenido-presente` desde ese punto.
  - Crear los worktrees `.worktrees/P0` a `.worktrees/P7` con sus ramas `lane/P0` a `lane/P7`.
  - Asignar `E2E_PORT` 3110 a 3117 (patrón A-12 de la 001).

## P0 Foundation y contenido (va primero y congela con el tag `p0-frozen`)

Rutas: `content/**`, `public/fonts/**`, los tres SVG nuevos de `public/assets/imgs/projects/`, `app/sitemap.ts`,
`app/robots.ts`, `app/[lang]/layout.tsx`, `app/[lang]/opengraph-image.tsx`, `components/ui/**`,
`components/shell/**`, `components/site/{SectionTitle,format,metadata,lang}*`, `components/site/_site.scss`,
`lib/seo/**`, `lib/og/**`, `tests/unit/p0/**`, `tests/e2e/p0/**`, `tests/unit/lc/**`. Excepción A-405:
`components/site/services/ServiceIcon.tsx`, solo para compilar.

- [ ] T402 Enmiendas de tipos E-04 a E-12 en `content/types.ts`, según data-model §1.
  - `Project.era` obligatorio; `adrCards?`, `diagram?` y `links.repos?`.
  - `ServiceId` con los seis ids; `ServiceItem` con `forWho`, `deliverables`, `example?`, `priceRange?` e `icon?`.
  - `ServicesContent`, `home.previousTitle?` y `home.subtitle?`, `skills.inWords?`, `about.principles?` y `profile?`.
- [ ] T403 A-405: pictogramas provisionales en `components/site/services/ServiceIcon.tsx` para los seis `ServiceId`,
  solo para que compile. P3 los reemplaza en T443.
- [ ] T404 [P] [US1] [US1b] [US5] Contenido de `content/site.ts`:
  - home: contenido.md §1;
  - `about.description`: §6 (FR-407);
  - `profile`: §2 y §3;
  - `principles`: §8.6;
  - `skills.inWords` de Frontend, Backend y nube e IA aplicada (§9), con las claves de lóbulo de T229. Arquitectura e
    Idiomas y negocio, si T229 no los trae, salen del párrafo que el autor aprobó en la 002;
  - `portfolio.intro`: §4;
  - `services` completo con seis ítems: §5.1 a §5.7 y §5b, con el mapeo de data-model §1 (E-05);
  - política de privacidad con `interest` (§5.8) y reacciones (§21).
- [ ] T405 [P] [US3] Carrera y educación en `content/site.ts`, según contenido.md §7.1 a §7.7:
  - FR-410: Growup IT, rol y descripción;
  - FR-411: Newshore, rol;
  - FR-412: Platzi, empresa y rol;
  - FR-413: FLYR, PCI y vouchers;
  - FR-414: Synergos Labs, con las cifras de `synergos.ts`;
  - FR-415: Squadra, descripción y rol;
  - FR-416: roles en inglés en ambos idiomas;
  - FR-417: 140+ cursos.
- [ ] T406 [P] [US4] Casos en `content/projects.ts` (FR-440, FR-443):
  - Synergos (§11.2), con `adrCards` (§11.3), `diagram` (§11.4) y `links.repos` con `Synergos.CMS`, `Synergos.UI` y
    `Synergos.Fabrica`. Las URLs son las que verificó el orquestador.
  - Los casos `13`, `14` y `15` (§12 a §14). Legal workspace va sin repo (P-420).
  - `order` y `era` de los 15 casos (§4).
- [ ] T407 [P] [US4] Diagramas SVG propios, sin logos ni nombres internos, de 960 × 640, legibles en ambos temas:
  - `public/assets/imgs/projects/director-lines.svg`;
  - `public/assets/imgs/projects/legal-workspace.svg`;
  - `public/assets/imgs/projects/event-bridge.svg`.
- [ ] T408 [P] Archivos nuevos de contenido:
  - `content/synergos.ts` (E-09, §11.1);
  - `content/now.ts` (E-12, §24, con `mottos` y medallas; `lang: 'la'` en "Veni, vidi, vici"; sin fecha de HYROX);
  - `content/terminal.ts` (E-10, §15 y §15b `cat lemas.md`).
- [ ] T409 [P] Todas las claves nuevas ES/EN en `content/i18n/{es,en}/*.json`: `common`, `site`, `portfolio`,
  `experience`, `contact`, `blog`, `privacy`, `admin` y `home`.
  - Incluye las meta descriptions de §1 y las etiquetas de §2, §3, §5.8, §5.9, §8.3, §11, §15, §17, §18, §19, §20, §21,
    §23 y §24.
  - Solo agrega: no borra claves en uso. Las que queden sin uso las borra el orquestador en T506.
- [ ] T410 [US8] A-407: `lib/seo/person.ts` (`personJsonLd`, `jsonLdScript` con `<` escapado) y el `<script
  type="application/ld+json">` en `app/[lang]/layout.tsx`, con `@id` `{base}/#person` (FR-470, R-404).
- [ ] T411 [P] [US8] Plantilla OG:
  - `lib/og/template.tsx` (`renderOgImage`, R-403);
  - `public/fonts/Montserrat/static/Montserrat-Bold.ttf` (OFL);
  - `app/[lang]/opengraph-image.tsx` para el home y por defecto, con `generateImageMetadata` para el `alt`
    localizado (FR-471).
- [ ] T412 [P] [US2] [US7] Piezas compartidas en `components/ui/`, con las props de data-model §6:
  - `CvLink.tsx` (FR-420);
  - `AvailabilityChip.tsx` (FR-419, FR-463);
  - `EmailMenu.tsx` (FR-464), con el `Toast` existente.
- [ ] T413 [US7] A-407: en `components/shell/SiteFooter.tsx`, el easter egg (§16, `lang="en"`, FR-462), el
  `EmailMenu` en el ícono de correo y el enlace "Ahora" a `/now`.
- [ ] T414 [P] Sumar `/now` a `PUBLIC_PATHS` en `app/sitemap.ts`. Los casos nuevos entran solos (FR-472).
- [ ] T415 [P] Pruebas unitarias de contenido:
  - `tests/unit/p0/career-verification.test.ts` (tabla de §7.8; FR-418, SC-402);
  - `tests/unit/p0/identity-copy.test.ts` (ninguna meta ni texto vigente presenta al autor como "front-end" o
    "full-stack developer"; SC-401);
  - `tests/unit/p0/confidentiality.test.ts` (FR-444: sin cantidades en las entradas del empleador ni en Event
    bridge; SC-407);
  - `tests/unit/p0/synergos-facts.test.ts` (una sola fuente; FR-441);
  - `tests/unit/p0/content-refs.test.ts` (claves de `inWords` contra los lóbulos; `era` en los 15 casos; seis
    servicios);
  - `tests/unit/p0/person-jsonld.test.ts`;
  - `tests/unit/p0/og-template.test.ts`;
  - actualizar `tests/unit/lc/content-completeness.test.ts` para los tipos nuevos (FR-495, SC-412).
- [ ] T416 [P] E2E de P0 en `tests/e2e/p0/shell.spec.ts`:
  - easter egg visible;
  - menú de correo: copiar muestra el toast y, sin JS, queda un `mailto:`;
  - JSON-LD presente y válido en ES y EN (SC-408);
  - enlace a `/now`.
- [ ] T417 `npm run verify` y e2e de l0, r0 y p0 en verde. Tag `p0-frozen`.

## P1 Home y /now (después de `p0-frozen`)

Rutas: `app/[lang]/page.tsx`, `app/[lang]/now/**`, `components/site/HomeBanner*`, `components/site/home/**`,
`components/site/now/**`, `tests/unit/p1/**`, `tests/e2e/p1/**`.

- [ ] T420 [US1] [US7] Guiño del hero en `components/site/HomeBanner.tsx` y `HomeBanner.module.scss` (FR-401, FR-402,
  FR-460):
  - `previousTitle` tachado fuera del nombre del `h1`, con la etiqueta oculta `home.previousTitleLabel`;
  - `h1` con el título nuevo y el subtítulo debajo;
  - animación de 2 s o menos, una vez por sesión (`cw-wink-seen`), estado final en el HTML del servidor y sin
    animación con movimiento reducido.
- [ ] T421 [P] [US2] [US7] `CvLink`, `AvailabilityChip` y `EmailMenu` en el banner (`components/site/HomeBanner.tsx`),
  reemplazando el `mailto:` directo del ícono de correo.
- [ ] T422 [US10] Página `/now`: `app/[lang]/now/page.tsx` y `components/site/now/NowView.tsx` (FR-490).
  - Bloques: "Construyendo", "Aprendiendo", "Entrenando para", "Fuera del teclado" y "Mis lemas", con `lang="la"`
    donde corresponde.
  - Fecha de actualización con `<time>`, y `pageMetadata` con `meta.now.description`.
- [ ] T423 [P] [US10] [US8] `app/[lang]/now/opengraph-image.tsx` con la plantilla de P0.
- [ ] T424 [P] Pruebas:
  - `tests/e2e/p1/hero.spec.ts`: nombre accesible del `h1`, sin JS, movimiento reducido, CLS ≤ 0,1 y una vez por
    sesión;
  - `tests/e2e/p1/now.spec.ts`: ES y EN, sin JS y lemas en latín;
  - `tests/unit/p1/now.test.ts`.
- [ ] T425 `npm run verify` y e2e de p1 en verde.

## P2 Sobre mí (después de `p0-frozen`)

Rutas: `app/[lang]/aboutMe/**`, `components/site/about/**`, `tests/unit/p2/**`, `tests/e2e/p2/**`.

- [ ] T430 [P] [US2] `CvLink` en "Quién soy" (`components/site/about/AboutDescription.tsx`).
- [ ] T431 [P] [US5] "En cifras" en `components/site/about/figures.ts` y `AboutFigures.tsx` (FR-436):
  - `years` sigue calculado; suma `pieces`, `adrs` y `tests` desde `content/synergos.ts`;
  - salen `projects`, `technologies` y `airlines`;
  - números formateados según el idioma.
- [ ] T432 [P] [US5] Chips de principios bajo Arquitectura en `components/site/about/BrainScene.tsx` y `BrainMap.tsx`
  (FR-433).
- [ ] T433 [US5] "Mis habilidades, en palabras" por lóbulo en `components/site/about/BrainScene.tsx` (FR-434, FR-408):
  - sale el texto de 2023;
  - con JS muestra el párrafo del lóbulo activo y sin JS, todos;
  - un lóbulo sin párrafo no muestra el bloque.
- [ ] T434 [US5] **BLOQUEADA (P-424)**: párrafo "en palabras" de Prácticas de ingeniería. Cuando el autor lo dé, el
  orquestador lo agrega a `content/site.ts` como enmienda de contenido.
- [ ] T435 [US5] Verificar tras T229 que FR-431 (íconos de skills nuevas), FR-432 ("dónde lo apliqué") y FR-435
  (proyectos nunca vacíos) quedaron cumplidos. Completar en `components/site/about/` solo lo que falte, sin rehacer
  T229.
- [ ] T436 [US7] Terminal en el que se escribe: `components/site/about/BrainTerminal.tsx` (nuevo), dentro del panel de
  `BrainMap.tsx` (FR-461, R-409).
  - Comandos de `content/terminal.ts`, incluido `cat lemas.md` con `lang="la"`.
  - `ls projects/` y `ls synergos/` generados desde datos; `cat <lóbulo>.lobe` sigue funcionando.
  - Tab sin trampa, Esc, `clear`, 80 caracteres, `aria-live="polite"` y salida como texto.
- [ ] T437 [US6] Contrato de ancla: `#lobe-<id>` activa el lóbulo en `BrainMap.tsx`; sin JS, el ancla lleva a la lista
  del lóbulo en `BrainScene.tsx` (plan, contratos entre lanes).
- [ ] T438 [P] [US8] `app/[lang]/aboutMe/opengraph-image.tsx`.
- [ ] T439 Pruebas y cierre:
  - `tests/e2e/p2/about.spec.ts`: cifras, chips, "en palabras" con y sin JS, y ancla;
  - `tests/e2e/p2/terminal.spec.ts`: cada comando en ES y EN, Tab, foco y desconocido;
  - `tests/unit/p2/terminal.test.ts`;
  - `npm run verify` y e2e de p2 en verde.

## P3 Servicios (después de `p0-frozen`)

Rutas: `app/[lang]/services/**`, `components/site/services/**`, `tests/unit/p3/**`, `tests/e2e/p3/**`.

- [ ] T440 [US1b] Estructura de siete bloques en `components/site/services/ServicesView.tsx` (FR-406a, FR-406b):
  - hero con `h1` y "Cuéntame tu proceso" hacia Contacto;
  - "¿Cómo te puedo ayudar?" como título del bloque de servicios;
  - CTA final con "¿Dónde se te va el tiempo?" y "Escríbeme".
- [ ] T441 [P] [US1b] "Para quién" (tres perfiles) y "Cómo trabajo" (FR-406e), en
  `components/site/services/ServiceAudiences.tsx` y `ServiceProcess.tsx`:
  - los pasos en una lista ordenada que se ilumina al hacer scroll;
  - los principios debajo;
  - todo encendido con movimiento reducido o sin JS.
- [ ] T442 [US1b] Seis tarjetas en `components/site/services/ServiceCard.tsx` (FR-406c, FR-406d, R-410):
  - grilla fija de ícono, número y título;
  - "Para quién", texto y ejemplo si existe;
  - reverso "Qué recibes" con botón `aria-expanded`;
  - fundido con movimiento reducido; sin JS, las dos caras apiladas.
- [ ] T443 [P] [US1b] Pictogramas finales de línea fina para los seis servicios en
  `components/site/services/ServiceIcon.tsx`: nodo con conexiones, carriles, embudo con rayo, capas, cohete y uno
  para talleres. Reemplazan los provisionales de T403.
- [ ] T444 [P] [US1b] "Quiero esto" en cada tarjeta hacia `/{lang}/contactMe?servicio=<id>` (FR-406f; la preselección
  la implementa P5 en T472).
- [ ] T445 [US1b] Preguntas frecuentes como disclosures (cuatro publicadas; FR-406g). Bloque "Casos" con enlaces a los
  casos publicados según contenido.md §5.5 (FR-406h, por defecto).
- [ ] T446 [US1b] **BLOQUEADA (P-412)**: la pregunta "¿Quién es dueño de lo que se construye?". Cuando el autor dé la
  respuesta, el orquestador la agrega a `services.faq`.
- [ ] T447 [US1b] **BLOQUEADA (P-413)**: la selección final de casos reales en Servicios. Hasta entonces sigue el
  valor por defecto de T445.
- [x] T448 [US1b] ~~Rangos de precio en las tarjetas (`priceRange`)~~. P-421 se resolvió sin rangos (R2.2 de la 012,
  2026-11-11): el precio es a convenir y lo explica una pregunta frecuente; ninguna tarjeta muestra precio (FR-406j).
- [ ] T449 [US1b] **P-417 (por defecto, como está)**: si el autor cambia "fábrica de software" o el título del hero,
  el orquestador ajusta el copy en `content/`. P3 no cambia código.
- [ ] T450 [US1b] **Depende de la 003 (A4)**: el botón "Probar" de la tarjeta de asistentes, que lleva a la vitrina
  "Despacho". No aparece mientras la vitrina no exista (FR-406i).
- [ ] T451 [P] [US8] `app/[lang]/services/opengraph-image.tsx`.
- [ ] T452 Pruebas y cierre:
  - `tests/e2e/p3/services.spec.ts`: siete bloques, seis tarjetas, reverso con teclado y sin JS, "Quiero esto" y
    preguntas frecuentes;
  - `npm run verify` y e2e de p3 en verde.

## P4 Portafolio y casos (después de `p0-frozen`)

Rutas: `app/[lang]/portfolio/**`, `components/site/portfolio/**`, `public/assets/imgs/projects/**` (salvo los tres
SVG de P0), `tests/unit/p4/**`, `tests/e2e/p4/**`.

- [ ] T455 [P] [US1] [US4] Intro de un solo párrafo en `components/site/portfolio/PortfolioView.tsx`, y etiqueta de
  época en las tarjetas y en el caso (`ProjectsExplorer.tsx`, `CaseStudy.tsx`; FR-404, FR-405).
- [ ] T456 [US4] Filtro por época combinado con el de tecnología en `components/site/portfolio/ProjectsExplorer.tsx` y
  `projects.ts`:
  - anuncia la cantidad;
  - con cero resultados ofrece "Quitar filtros".
- [ ] T457 [P] [US4] `components/site/portfolio/AdrCards.tsx`: lista de tarjetas Decisión · Por qué · Trade-off en
  "Decisiones clave" de `CaseStudy.tsx`. Sin `adrCards`, se queda la prosa (FR-442).
- [ ] T458 [P] [US4] `components/site/portfolio/LiveDiagram.tsx` para `project.diagram` (FR-445):
  - capas enfocables y línea de rol al enfocar o al pasar el puntero;
  - iluminación en orden al entrar en pantalla;
  - estático y completo con movimiento reducido y sin JS.
- [ ] T459 [P] [US4] Lista de `links.repos` en `components/site/portfolio/CaseStudy.tsx`, en pestaña nueva y con aviso
  accesible (FR-447).
- [ ] T460 [US7] Transición compartida carrusel → caso con `<ViewTransition name="project-media-<id>">` en
  `ProjectsExplorer.tsx` y `CaseStudy.tsx` (FR-465, R-402):
  - anulada con movimiento reducido;
  - prueba de que el carrusel no duplica diapositivas;
  - confirmar en la vista previa si hace falta `experimental.viewTransition` (si hace falta, es una enmienda de R0).
- [ ] T461 [US4] **BLOQUEADA (P-410, P-420)**: `links.live` de Synergos y el enlace al repo `legal-workspace`. Cuando
  el autor confirme, el orquestador los agrega a `content/projects.ts`.
- [ ] T462 [US4] **BLOQUEADA (P-408)**: tarjetas ADR de Director & lines, Legal workspace, Event bridge y CHERCED-WORLD
  2026. Cuando el autor las escriba, el orquestador las agrega a `content/projects.ts`; P4 no cambia código.
- [ ] T463 [P] [US8] `app/[lang]/portfolio/opengraph-image.tsx` y `app/[lang]/portfolio/[id]/opengraph-image.tsx` (título
  y resumen del caso, prerenderizados para los 15).
- [ ] T464 Pruebas y cierre:
  - `tests/e2e/p4/cases.spec.ts`: 15 casos, orden, época, filtros, tarjetas ADR, diagrama con teclado y sin JS,
    repos y transición con y sin movimiento reducido;
  - `npm run verify` y e2e de p4 en verde.

## P5 Contacto, privacidad y reacciones (después de `p0-frozen`; enmiendas A-401 a A-404)

Rutas: `app/[lang]/contactMe/**`, `app/[lang]/privacy/**`, `app/api/reactions/**`, `components/contact/**`,
`components/admin/**`, `components/blog/comments/**`, `components/blog/reactions/**`, `lib/validation/**`,
`lib/data/**`, `lib/actions/contact.ts`, `lib/actions/reactions.ts`, `lib/security/rate-limit.ts`,
`tests/contract/**`, `tests/unit/p5/**`, `tests/e2e/p5/**`.

- [ ] T470 A-401 en la capa de datos (data-model §2):
  - `interest: MessageInterest | null` en `NewMessage` y `MessageRecord` (`lib/data/types.ts`);
  - el mapper de `lib/data/mongo/mappers.ts` acepta mensajes sin el campo;
  - el repositorio en memoria (`lib/data/memory/messages.ts`) lo guarda;
  - la suite `tests/contract/repos.contract.ts` lo cubre.
- [ ] T471 A-401 en el servidor: `contactSchema` en `lib/validation/index.ts` con `interest` opcional y validado contra
  `MessageInterest`, y `submitContact` en `lib/actions/contact.ts` lo guarda.
- [ ] T472 [US1b] Campo "¿Qué te interesa?" en `components/contact/ContactForm.tsx`, con preselección desde
  `?servicio=` en `app/[lang]/contactMe/page.tsx`. Un valor desconocido se ignora y funciona sin JS (R-408).
- [ ] T473 [P] A-401: el panel muestra `interest` en `components/admin/MessageList.tsx` con `admin.field.interest`.
- [ ] T474 [P] [US2] [US7] [US9] En `app/[lang]/contactMe/page.tsx`: `CvLink`, `AvailabilityChip` y `EmailMenu`.
  Verificar que la confirmación usa el texto de 48 horas (FR-480).
- [ ] T475 [P] [US9] A-404: el nombre accesible completo del checkbox de privacidad (FR-481).
  - `ConsentLabels` pasa a `{ text, readPolicy, newTab }`.
  - El enlace sale de la etiqueta, en `components/contact/ConsentField.tsx` y en
    `components/blog/comments/CommentForm.tsx`.
- [ ] T476 [US9] A-403 en la capa de datos:
  - `ReactionRepo` en `lib/data/types.ts`;
  - Mongo en `lib/data/mongo/reactions.ts` (colección `post_reactions`, `$inc`, piso 0) y memoria en
    `lib/data/memory/reactions.ts`;
  - `RATE_LIMITS.reaction` en `lib/security/rate-limit.ts` (10 cada 10 min);
  - casos en `tests/contract/repos.contract.ts`.
- [ ] T477 [US9] `GET /api/reactions/[postId]` en `app/api/reactions/[postId]/route.ts`, solo con contadores, y
  `toggleReaction` en `lib/actions/reactions.ts` (validación, límite por huella de IP y resultados de data-model §3).
- [ ] T478 [US9] `components/blog/reactions/Reactions.tsx` dentro de `components/blog/comments/CommentsSection.tsx`:
  - tres botones con `aria-pressed` y contador;
  - reacción propia en `localStorage`;
  - avisos de límite y de indisponibilidad;
  - oculto sin JS.
- [ ] T479 [P] [US9] Verificar que `app/[lang]/privacy/**` muestra el texto nuevo de datos (con `interest`) y el
  técnico (con reacciones) que trae P0 (FR-483).
- [ ] T480 [US9] **BLOQUEADA (P-422)**, A-402: el enlace de agenda en la confirmación de
  `components/contact/ContactForm.tsx`. No se muestra sin el enlace del autor.
- [ ] T481 [P] [US8] `app/[lang]/contactMe/opengraph-image.tsx`.
- [ ] T482 Pruebas y cierre:
  - `tests/unit/p5/validation.test.ts`: `interest` válido, vacío y manipulado;
  - `tests/unit/p5/reactions.test.ts`: piso, enum y límite;
  - `tests/e2e/p5/contact.spec.ts`: preselección sin JS, nombre del checkbox en ambos formularios (SC-409) y chip;
  - `tests/e2e/p5/reactions.spec.ts`: 1 clic, quitar, 50 clics contra el límite y respuesta sin datos personales
    (SC-410);
  - `npm run verify` y e2e de p5 y de l3 en verde.

## P6 Experiencia y agentes (después de `p0-frozen`)

Rutas: `components/experience/**`, `lib/search/**`, `lib/assistant/**`, `lib/capabilities/**`, `lib/agent/**`,
`app/api/search-index/**`, `app/llms.txt/**`, `tests/unit/p6/**`, `tests/e2e/p6/**`.

- [ ] T485 [US11] Registro de capacidades en `lib/capabilities/` (E-13, data-model §5; FR-485, FR-487, FR-488):
  - `search_portfolio`, `get_project`, `list_projects`, `get_experience`, `get_skills` (con los lóbulos de T229),
    `list_posts`, `get_cv` (LinkedIn) y `set_preferences`;
  - JSON Schema y zod equivalentes, y descripciones de contenido.md §25;
  - cada herramienta corresponde a algo que ya se puede hacer desde la UI (FR-489b).
- [ ] T486 [US6] A-406: `SearchDocKind` con `'skill'` y `SEARCH_INDEX_VERSION = 2` en `lib/search/types.ts`, y docs de
  habilidad con la URL del ancla `#lobe-<id>` en `lib/search/build-index.ts` (FR-450).
- [ ] T487 [US6] Grupo "Habilidades" en `components/experience/palette-model.ts` y `CommandPalette.tsx`. Al elegir una
  habilidad, navega al ancla del lóbulo.
- [ ] T488 [US6] Modo de comandos `>` en `components/experience/palette-model.ts` (FR-451):
  - registro de comandos alimentado por las capacidades: ver el CV en LinkedIn (FR-421), copiar el correo, tema,
    idioma, asistente y atajos;
  - punto de extensión para la 003 ("Abrir el AI Lab") y la 005 ("Escuchar este post").
- [ ] T489 [US6] Atajos globales y diálogo de atajos en `components/experience/Shortcuts.tsx` y `preferences.ts`
  (FR-452, FR-453, R-407):
  - `/`, `?` y `t`;
  - se ignoran en campos editables, con modificadores y durante una composición;
  - interruptor de los atajos de una tecla guardado en `cw-shortcuts`;
  - `aria-keyshortcuts`.
- [ ] T490 [US11] Adaptador WebMCP en `lib/agent/webmcp.ts` (FR-486, R-401):
  - detecta `document.modelContext` y luego `navigator.modelContext`;
  - se baja con `AbortController`;
  - se importa diferido desde `components/experience/ExperienceClient.tsx`;
  - registra las ocho herramientas de T485, y sin la API no hace nada.
- [ ] T491 [US11] El asistente usa el registro en `lib/assistant/engine.ts` y `lexicon.ts` (FR-498): servicios nuevos,
  lóbulos de T229, sin cifras del empleador, sin presentar "Aprendiendo ahora" como skills en uso y sin el contenido
  del CV: solo su enlace (FR-422).
- [ ] T492 [US11] **BLOQUEADA (P-416)**: `draft_contact_message`. Llena el formulario de Contacto sin enviarlo y sin
  marcar el consentimiento; nada se guarda en el navegador (FR-489).
- [ ] T493 [US11] `app/llms.txt/route.ts` con `force-static`, generado desde el registro (contenido.md §25; FR-489a,
  R-405). P-418, por defecto: sale en esta entrega.
- [ ] T494 [US11] **BLOQUEADA (P-423)**: el token del origin trial de WebMCP. Si el autor lo aprueba, el meta va en
  `app/[lang]/layout.tsx` como enmienda de P0, y el token, sin ser secreto, se versiona en el repo.
- [ ] T495 Pruebas:
  - `tests/unit/p6/capabilities.test.ts`: esquema contra zod, mutado una vez para verlo fallar, y solo datos públicos;
  - `tests/unit/p6/webmcp.test.ts`: `modelContext` falso, registro, baja y ausencia de API;
  - `tests/e2e/p6/palette.spec.ts`: "saga", "Angular" y "Synergos" entre los 3 primeros (SC-404), `>` y `> cv` en 4
    teclas o menos (SC-403);
  - `tests/e2e/p6/shortcuts.spec.ts`: dentro y fuera de campos, y apagados (SC-411);
  - `tests/e2e/p6/llms.spec.ts`;
  - WebMCP real en Chromium solo si Playwright 1.64 lo soporta. Si no, una prueba manual documentada en la tarea.
- [ ] T496 `npm run verify` y e2e de p6 y de l5 en verde.

## P7 QA integral (en paralelo; corre completa al integrar)

Rutas: `tests/e2e/integration/**`, `playwright.config.ts`.

- [ ] T498 [P] Auditoría responsive de 320 a 2560 px que suma `/now`, la Servicios nueva y los 15 casos, en ES y EN
  (FR-446, SC-405, SC-413).
- [ ] T499 [P] Auditoría de interacción con los controles nuevos: terminal, tarjetas con reverso, menú de correo,
  reacciones, atajos, filtro de época, capas del diagrama y "Quiero esto".
- [ ] T500 [P] Escaneo de privacidad y confidencialidad sobre la respuesta de reacciones, `/llms.txt`, las salidas de
  las capacidades y las imágenes OG:
  - sin datos personales;
  - sin cantidades ni nombres internos del empleador;
  - cada una de las 5 secciones y los 15 casos tiene su `og:image` en ES y EN (SC-408).
- [ ] T501 [P] Presupuestos de rendimiento en home (guiño), Sobre mí (terminal), Servicios y un caso (FR-499,
  SC-406, SC-414): 0 errores de consola sin WebMCP y fondo a 50 fps o más.
- [ ] T502 Estabilizar lo que salga de T498 a T501 y dejar la suite completa en verde en el puerto 3117.

## Integración (orquestador)

- [ ] T504 Integrar en orden P0 → P5 → P6 → P2 → P1 → P3 → P4 → P7, con `npm run verify` después de cada merge.
  Revisar que `package.json` no suma dependencias y que no hay variables de entorno nuevas (FR-497).
- [ ] T505 Correr la suite exhaustiva una vez en verde antes de la vista previa final (ver T510).
- [ ] T510 (P7, va primero dentro de P7) Suite por niveles, decisión del autor del 2026-11-04: una hora de e2e no es
  aceptable en el día a día.
  - `npm run test:fast`: lint, tipos, unitarias y humo e2e en escritorio (cada página carga, navega y no rompe),
    en menos de 5 minutos. Es lo que corre cada lane en cada cambio.
  - `npm run test:full`: todas las e2e con el barrido responsive en 6 anchos clave (320, 390, 768, 1024, 1440 y
    2560), en 10 a 15 minutos. Corre antes de integrar cada lane.
  - `npm run test:exhaustive`: lo de hoy (cada 40 px, los controles, el contraste y el rendimiento), solo antes
    de pasar a producción.
  - Se compila una sola vez y se reutiliza el servidor entre proyectos y corridas.
- [ ] T506 Limpiar las claves de i18n que quedaron sin uso (`services.explore`, `services.cta`, `services.contact`,
  `about.figure.projects`, `about.figure.technologies`, `about.figure.airlines` y `about.figure.airlinesNote`) y el
  campo `services.intro`.
- [ ] T507 Desplegar la vista previa, revisarla con el autor y cortar a `main` solo con su confirmación explícita.
- [ ] T508 **P-419, acción del autor fuera del repo**: alinear los servicios de LinkedIn con la página nueva. No hay
  cambio en el sitio.
- [ ] T509 Desbloquear T434, T446, T447, T448, T461, T462, T480, T492 y T494 a medida que el autor resuelva su
  pregunta. Cada dato nuevo entra como enmienda de contenido sobre `content/` y pasa por `npm run verify`.

## Dependencias y orden

- **T401** abre todo.
- **P0 (T402 a T417)** bloquea a P1 a P7.
- **Entre lanes paralelas**, solo dos contratos, congelados en `p0-frozen`:
  - T444 (P3) enlaza a la preselección de T472 (P5).
  - T486 y T487 (P6) enlazan al ancla de T437 (P2).

  Cada lane prueba su lado contra el contrato.
- **Dentro de cada lane**:
  - P0: T402 va primero; T403 a T416 en paralelo donde dice `[P]`; T417 al final.
  - P5: T470 → T471 → T472, y T476 → T477 → T478.
  - P6: T485 → T490 y T485 → T493.
- **Las tareas BLOQUEADAS** no frenan el cierre de su lane. Quedan abiertas hasta T509.

## Estrategia

- **MVP**: P0, P1, P3 y P4. Con eso el sitio dice quién es el autor hoy: hero, carrera, Servicios rehecha, casos y CV
  (US1, US1b, US2, US3 y US4, todas P1).
- **Después**: P2, P5 y P6 (US5, US6, US7, US8 y US9).
- **Luego**: US10 (`/now`, dentro de P1) y US11 (agentes, dentro de P6).
- **QA (P7)** corre en paralelo y cierra todo antes de T505.

## Análisis cruzado (2026-11-04)

`/speckit.analyze` sobre spec, plan y tasks, sin hallazgos críticos abiertos. Lo que encontró y cómo quedó:

| ID | Severidad | Hallazgo | Resolución |
|---|---|---|---|
| F1 | Alta | La spec seguía con cinco servicios, "sin precios" y `ServiceId` de cinco, aunque P-414 y P-415 están resueltas | FR-406c, FR-406j, US1b y E-05 corregidos: seis servicios; rangos solo con las cifras de P-421 |
| F2 | Alta | FR-490, US10 y un caso límite decían que `/now` no se publica (P-404 resuelta) | Corregidos: se publica con contenido.md §24, lemas y medallas |
| F3 | Alta | FR-447 dejaba todos los repos en `null` (P-403 resuelta) | Corregido: Synergos enlaza sus tres repos; Legal workspace espera a P-420; `live` espera a P-410 |
| F4 | Media | FR-480 dependía de P-405 (resuelta) | Corregido: depende de P-422 |
| F5 | Media | FR-461 y la ayuda de §15 no incluían `cat lemas.md` (§15b) | Agregado a FR-461, a la tabla de §15 y a T436 |
| F6 | Media | US5, FR-432, FR-434 y FR-435, y contenido §8 y §9, seguían con cinco lóbulos y "Oficio", aunque T229 los reemplaza | Notas de reemplazo en la spec y en contenido.md; T435 verifica sin rehacer T229; P-424 nueva para el párrafo que falta |
| F7 | Media | §5b usa `summary` y `outcomes`; el resto de servicios, `description` y `deliverables` | Mapeo en data-model §1 (E-05). §5.8 pasa a seis opciones más "Otra cosa" |
| F8 | Media | El origin trial de WebMCP pide cuenta externa y un token que vence (principio VIII) | v1 sin token (R-401); P-423 nueva; T494 bloqueada |
| F9 | Baja | La spec listaba P-409 como abierta en la tabla del coordinador | P-409 está resuelta; no bloquea tareas |
| F10 | Baja | Ocho criterios de éxito (SC-401 a SC-404, SC-407 a SC-410 y SC-412) y ocho requisitos (FR-407, FR-419, FR-421, FR-422, FR-440, FR-443, FR-489b y FR-497) no tenían tarea con referencia explícita | Referencias agregadas en T404, T406, T412, T415, T416, T482, T485, T488, T491, T495, T500 y T504 |

**Cobertura**: 77 requisitos funcionales y 14 criterios de éxito.
- Todos tienen al menos una tarea, salvo FR-406 y FR-430, que están reemplazados, y FR-437, que no cambia.
- Hay 92 tareas: 9 bloqueadas por una pregunta abierta, 1 con valor por defecto (T449, P-417) y 1 que depende de la
  003 (T450).
