# Contrato P0: contenido, piezas compartidas, SEO y OG de la 004

**Dueño**: P0 · **Estado**: congelado en el tag `p0-frozen` · **Base**: [contracts-r0.md de la
002](../002-refinamiento-impoluto/contracts-r0.md), [data-model.md](./data-model.md) y [contenido.md](./contenido.md)

Todo lo de la 001 y la 002 sigue vigente. P0 agrega tipos, contenido y piezas encima; ningún componente congelado
cambia de API salvo `ServiceIcon` (A-405), el footer y el layout (A-407). Las lanes P1 a P7 programan contra este
documento. Si falta algo, se pide como enmienda de contenido al orquestador.

## 1. Tipos (`content/types.ts`)

| Tipo | Forma | Notas |
|---|---|---|
| `SERVICE_IDS`, `ServiceId` | `'ai-harness' \| 'software-factory' \| 'process-optimization' \| 'architecture' \| 'product' \| 'workshops'` | `SERVICE_IDS` es el arreglo en el orden de la página. |
| `isServiceId(value)` | `(value: unknown) => value is ServiceId` | Para `?servicio=` (P5, R-408) y "Quiero esto" (P3). Distingue mayúsculas y no recorta espacios. |
| `ServiceItem` | `{ id, title, description, forWho, deliverables: Localized[], example?, priceRange?, icon? }` | **D-1**: `deliverables` es `Localized[]`, no `Localized<string[]>`. |
| `ServicesContent` | `{ intro, hero: { title, intro, cta }, audiences, items, process: { title, steps: Localized[], principles: Localized[] }, faq, cta: { title, text, button } }` | **D-1**: `process.principles` es `Localized[]`. `intro` es igual a `hero.intro` hasta T506. |
| `ServiceAudience` | `{ id: 'professionals' \| 'companies' \| 'engineering-teams', title, text }` | |
| `ServiceFaq` | `{ q, a }` | Cuatro publicadas; la de propiedad espera a P-412. |
| `SiteContent.home` | `{ greeting, name, title, previousTitle?, subtitle? }` | `title` es el de hoy; `previousTitle` es "SOY DESARROLLADOR". |
| `Profile` / `SiteContent.profile?` | `{ availability: { location, timezone: 'UTC−5', relocation }, cv: { href } }` | `cv.href` es LinkedIn, nunca un PDF. |
| `SiteContent.about.skills.inWords?` | `Partial<Record<lobeId, Localized>>` | Ver `lobeWords` (§2). |
| `Principle` / `about.principles?` | `{ short, full }[]` | Cinco, en el orden de §8.6. |
| `PROJECT_ERAS`, `ProjectEra` | `'2024-2026' \| '2022-2023'` | |
| `Project` | suma `era` (obligatorio), `adrCards?`, `diagram?` y `links.repos?` | `AdrCard`, `DiagramLayer` y `RepoLink` como en data-model §1. |
| `SynergosFacts` | ver data-model E-09 | |
| `TerminalCommand` | `{ name, output, lang? } \| { name, generated }` | **D-2**: `TerminalGenerated` suma `'principles'` y `'mottos'`. |
| `NowEntry`, `NowContent` | ver data-model E-12 | `lang: 'la'` solo en "Veni, vidi, vici". |

Los tipos viven todos en `content/types.ts`; `synergos.ts`, `now.ts` y `terminal.ts` los importan de ahí.

## 2. Contenido (`content/`)

| Archivo | Exporta | Uso |
|---|---|---|
| `site.ts` | `site`, `lobeWords(lobe, content?)`, `publicEmail(content?)` | `lobeWords` devuelve `inWords[lobe.id] ?? lobe.words ?? null`: Frontend, Backend y nube e IA aplicada salen de §9; Arquitectura e Idiomas y negocio, de `lobe.words` de T229; Prácticas de ingeniería devuelve `null` (P-424, no se muestra el bloque). `publicEmail()` devuelve el correo sin `mailto:`. |
| `projects.ts` | `projects` | 15 casos con `order` y `era` de §4. Synergos (`12`) trae 4 `adrCards`, 3 capas en `diagram` (`cdn`, `umbraco`, `micro-frontends`) y 3 `links.repos`; `live` sigue en `null` (P-410). `13`, `14` y `15` van sin enlaces. |
| `synergos.ts` | `synergosFacts`, `formatFact(n, lang)`, `formatFloor(n, lang)` | Única fuente de las cifras. `formatFact(2300, 'es')` = `2.300`, `formatFloor(2300, 'en')` = `2,300+`. Ningún otro archivo de `content/`, `components/`, `lib/` o `app/` escribe esas cifras como literal: `tests/unit/p0/synergos-facts.test.ts` lo rompe. |
| `now.ts` | `now` | Bloques de `/now` (§24). `updatedAt` es `2026-11-04`; el orquestador lo fija el día de publicación. |
| `terminal.ts` | `terminalCommands`, `terminalNotFound`, `projectSlugs`, `TERMINAL_MAX_INPUT` (80), `normalizeTerminalInput`, `findTerminalCommand`, `completeTerminalInput`, `terminalLines`, `runTerminal`, tipos `TerminalLine` y `TerminalResult` | Ver §2.1. |

Las cifras de la carrera de Synergos Labs, del caso `12` y de `whoami` se interpolan desde `synergosFacts`; el texto
que resulta es el de contenido.md, palabra por palabra.

### 2.1 Terminal

- `runTerminal(input, lang)` devuelve `{ kind: 'output', lines }`, `{ kind: 'clear' }` o `{ kind: 'unknown', lines }`.
  La entrada se corta a 80 caracteres, se comparan los nombres sin distinguir mayúsculas y los espacios repetidos
  cuentan como uno.
- `TerminalLine` es `{ text, lang?: 'la', href? }`. Pinta `text` como texto, nunca como HTML. `lang` va en el
  elemento de la línea; `href` (solo en `ls projects/`) enlaza al caso.
- Salidas generadas: `cat principles.md` desde `about.principles[].full`, numerados; `cat lemas.md` desde
  `now.mottos`, con `lang: 'la'` solo en la línea 2; `ls projects/` en el orden del portafolio con los slugs de
  §15; `ls synergos/` desde `synergosFacts`.
- `completeTerminalInput(input)` devuelve el comando solo si el prefijo tiene una coincidencia única; si devuelve
  `null`, deja pasar el Tab.
- `cat <lóbulo>.lobe` no está aquí: sigue en `BrainMap.tsx` (T229).

## 3. Claves i18n nuevas o cambiadas

Paridad ES/EN y marcadores iguales: lo cuida `tests/unit/l0/i18n-parity.test.ts`. Ninguna clave en uso se borró.

| Namespace | Claves | Lane que las consume |
|---|---|---|
| `common` | **cambian**: `meta.description`, `privacy.consent` (frase completa, sin `{privacyPolicy}`). **Nuevas**: `nav.now`, `footer.egg`, `profile.availability.label`, `cv.link`, `cv.linkLabel`, `cv.palette`, `cv.keywords`, `email.menu`, `email.write`, `email.copy`, `email.copied`, `privacy.readPolicy`, `og.alt` | P0, P5 (A-404), P6 |
| `site` | **cambian**: `home.title`, `meta.home.description`, `meta.about.description`, `meta.services.description`, `meta.portfolio.description`. **Nuevas**: `home.previousTitleLabel`, `meta.now.description`, `about.brain.applied`, `about.brain.appliedWord`, `about.principles`, `about.figure.{pieces,piecesNote,adrs,adrsNote,tests,testsNote}`, `about.terminal.{input,hint,output}`, `services.{audiences,forWho,deliverables,flip,flipBack,want,try,principles,cases,faq}`, `portfolio.era`, `portfolio.era.2024-2026`, `portfolio.era.2022-2023`, `portfolio.filteredEra`, `portfolio.clearFilters`, `project.adr.{decision,why,tradeoff}`, `case.diagram.{title,hint}`, `nowPage.{title,building,learning,preparing,offKeyboard,mottos,updated}`, `og.about.line`, `og.services.line`, `og.portfolio.line` | P1, P2, P3, P4 |
| `contact` | **cambian**: `meta.contact.description`, `contact.success.text` (48 horas). **Nuevas**: `contact.interest`, `contact.interest.none`, `contact.interest.<ServiceId>` (seis), `contact.interest.other`, `og.contact.line` | P5 |
| `admin` | `admin.field.interest` | P5 |
| `privacy` | **cambia**: `privacy.technical.body` (reacciones) | P5 (solo verifica) |
| `blog` | `reactions.{title,clap,idea,fire,count,rateLimited,unavailable}` | P5 |
| `experience` | **cambia**: `palette.placeholder`. **Nuevas**: `palette.group.skills`, `palette.group.commands`, `palette.skillHint`, `palette.action.{cv,shortcuts,aiLab,listen}`, `shortcuts.{title,palette,help,theme,close,singleKey,on,off}`, `capability.<nombre>` (las ocho de §25 sin `draft_contact_message`, que espera a P-416) | P6 |

Notas:

- `about.figure.piecesNote` lleva `{capabilities}` y `{orchestrators}`: pásalos desde `synergosFacts` para no repetir
  las cifras.
- **D-3**: `home.previousTitleLabel` y `case.diagram.*` van en `site.json`, no en `home.json` ni en `portfolio.json`:
  esos dos namespaces tienen pruebas de claves exactas de R1 y R2 (`tests/unit/r1/home-dictionary.test.ts`,
  `tests/unit/r2/labels.test.ts`) que ninguna lane de la 004 puede tocar.
- Las etiquetas de cada opción de "¿Qué te interesa?" son `contact.interest.<id>`, con el texto de §5.8.

## 4. Piezas compartidas (`components/ui/`)

Las tres resuelven sus textos con `sharedText(lang, ns, key, vars?)`, que lee `common` y `experience` en el
servidor. Son síncronas: se pueden pintar con `renderToStaticMarkup` en pruebas unitarias.

| Pieza | Props | Comportamiento |
|---|---|---|
| `CvLink` (Server) | `{ lang, variant?: 'solid' \| 'glass' = 'glass', size?: ButtonSize = 'md', className? }` | `<a data-cw-cv-link>` a `site.profile.cv.href` con `target="_blank"`, `rel="noopener noreferrer"`, nombre accesible `cv.linkLabel` y texto `cv.link`, con el estilo de `buttonClassName`. Sin perfil, no pinta nada. |
| `AvailabilityChip` (Server) | `{ lang, className? }` | `<p data-cw-availability>` con el punto `#25ED9E` (`aria-hidden`), el texto visible "Armenia, Colombia · UTC−5 · Abierto a reubicación" y el prefijo "Disponibilidad:" oculto, así que se lee `profile.availability.label` completo. El punto late con `transform` y `opacity` y se detiene con movimiento reducido. `availabilityText(lang)` da `{ prefix, visible, label }`. |
| `EmailMenu` (Server, envuelve a `EmailMenuButton`) | `{ lang, email, trigger: ReactNode, className?, placement?: 'top' \| 'bottom' = 'bottom' }` | Ver §4.1. `email` va sin `mailto:` (usa `publicEmail()`). `className` se aplica al enlace y al botón: pasa la clase del ícono que reemplazas. Usa `placement="top"` cerca del final de la página. |
| `EmailMenuButton` (Client) | `{ email, labels: EmailMenuLabels, trigger, className?, placement? }` | Para consumidores que ya son Client Components. `emailMenuLabels(lang, email)` arma `labels`. |

### 4.1 `EmailMenu`

- **Sin JS** (`:root:not([data-js])`): solo se ve `<a data-cw-email-fallback href="mailto:…">` con nombre accesible
  `email.write`. Es el `mailto:` de hoy.
- **Con JS** (`:root[data-js]`): el enlace se oculta y se ve `<button data-cw-email-trigger aria-haspopup="menu"
  aria-expanded aria-label="Opciones de correo">`. Al abrir aparece `<ul role="menu" data-cw-email-options
  data-cw-glass="strong">` con dos `menuitem`: `a[href^="mailto:"][data-cw-email-write]` y
  `button[data-cw-email-copy]`.
- **Teclado**: Enter, Espacio o flecha abren y enfocan la primera opción; las flechas recorren en círculo; Inicio y
  Fin saltan; Esc cierra y devuelve el foco al botón; Tab cierra y deja seguir el foco. Un clic fuera cierra.
- **Copiar**: `navigator.clipboard.writeText` y el `Toast` existente: `email.copied` ("Correo copiado ✓") al copiar
  y `palette.copyFailed` (con el correo) si el navegador lo niega. Necesita estar dentro de `ToastProvider`, que el
  layout ya monta.

## 5. Footer (A-407)

- `[data-cw-footer-egg]`: `footer.egg`, en un `<p lang="en">` pequeño y sin enlace, en ambos idiomas.
- El ícono de correo es un `EmailMenu` con `placement="top"`; las demás redes no cambian.
- `[data-cw-footer-now]`: enlace "Ahora" / "Now" a `/{lang}/now`, junto a la privacidad. La página la crea P1.
- `ShellLabels` suma `now` y `egg`.

## 6. JSON-LD `Person` (`lib/seo/person.ts`)

| Export | Forma |
|---|---|
| `personJsonLd(lang, base = getSiteUrl())` | Objeto de contenido.md §22: `description` es `meta.description` del idioma; `name`, `sameAs`, `image` y `alumniOf` salen de `content/` y de `common.json`. Sin correo ni teléfono. |
| `personId(base = getSiteUrl())` | `{origen}/#person`. **La 005 lo usa en `BlogPosting.author`**: `{ '@id': personId() }`. |
| `jsonLdScript(data)` | `JSON.stringify` con cada `<` escapado como `\u003c`. Úsalo para cualquier otro JSON-LD. |

`app/[lang]/layout.tsx` publica `<script type="application/ld+json" data-cw-person>` en el `<head>` de todas las
páginas, en ES y EN.

## 7. Imágenes OG (`lib/og/`)

| Export | Uso |
|---|---|
| `renderOgImage({ lang, title, line })` | `ImageResponse` de 1200 × 630: negro, retícula en SVG, halo y acentos `#25ED9E`, Montserrat y `cherced-world.vercel.app` abajo (R-403). |
| `ogImageMetadata(id, input)` | El objeto de `generateImageMetadata`: `{ id, alt: '{título}: {línea}', size, contentType: 'image/png' }`. |
| `ogSection(lang, section)` | `section` en `home`, `about`, `services`, `portfolio`, `contact` o `now`; devuelve los textos de §23. `now` usa `nowPage.title` y `meta.now.description`. |
| `ogCase(lang, id)` | Título y resumen del caso; `null` si el id no existe. |
| `OG_DEFAULT_ID` (`'og'`), `OG_SIZE`, `OG_CONTENT_TYPE`, `ogAlt`, `ogFonts`, `OgCard` | Piezas sueltas para pruebas. |

Receta para cada lane (por ejemplo, `app/[lang]/aboutMe/opengraph-image.tsx`):

```tsx
import { defaultLocale, isLocale } from '@/lib/i18n/config'
import { OG_DEFAULT_ID, ogSection } from '@/lib/og/sections'
import { ogImageMetadata, renderOgImage } from '@/lib/og/template'

type Params = { lang: string }

export async function generateImageMetadata({ params }: { params: Params | Promise<Params> }) {
  const { lang } = await params
  return isLocale(lang) ? [ogImageMetadata(OG_DEFAULT_ID, ogSection(lang, 'about'))] : []
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const { lang } = await params
  return renderOgImage(ogSection(isLocale(lang) ? lang : defaultLocale, 'about'))
}
```

Para los casos (`app/[lang]/portfolio/[id]/opengraph-image.tsx`, P4) usa `ogCase(lang, id)` y devuelve `[]` si es
`null`. La imagen queda en `/{lang}/…/opengraph-image/og`.

**Regla importante (Next 16.4)**: un archivo `opengraph-image` solo manda si la metadata de **la misma página** no
fija `openGraph.images`. `pageMetadata` sigue poniendo el logo como respaldo, así que cada lane que agrega su archivo
**debe** pasar `ogImageFile: true`:

```ts
pageMetadata({ lang, path: '/aboutMe', title, description, common, ogImageFile: true })
```

| Ruta | Archivo OG | Quién pasa `ogImageFile: true` |
|---|---|---|
| `/{lang}` | `app/[lang]/opengraph-image.tsx` (P0, ya existe) | P1 en `app/[lang]/page.tsx` |
| `/{lang}/now` | P1 (T423) | P1 |
| `/{lang}/aboutMe` | P2 (T438) | P2 |
| `/{lang}/services` | P3 (T451) | P3 |
| `/{lang}/portfolio` y `/{lang}/portfolio/[id]` | P4 (T463) | P4 |
| `/{lang}/contactMe` | P5 (T481) | P5: su `generateMetadata` propio no fija `images`, así que no hace falta el flag |

**Montserrat Bold pendiente**: `public/fonts/Montserrat/static/Montserrat-Bold.ttf` todavía no está en el repo
(falta el visto bueno del autor para descargarlo). `ogFonts()` carga Regular siempre y Bold si el archivo existe, así
que agregarlo después no cambia este contrato.

## 8. Sitemap

`app/sitemap.ts` suma `/now` a las rutas públicas. Los casos entran solos desde `projects.ts` (15 × 2 idiomas).

## 9. Contratos entre lanes (recordatorio del plan)

| Contrato | Forma | Ayuda de P0 |
|---|---|---|
| Ancla de lóbulo (P2 → P6) | `/{lang}/aboutMe#lobe-<id>`, con los `id` de `site.about.skills.lobes` | — |
| Preselección de servicio (P5 → P3) | `/{lang}/contactMe?servicio=<ServiceId>`; un valor desconocido se ignora | `isServiceId`, `SERVICE_IDS`, `contact.interest.<id>` |
| `Person` (P0 → 005) | `@id` = `personId()` | §6 |
| Plantilla OG (P0 → P1 a P5 y 005) | `renderOgImage` y `ogImageMetadata` | §7 |

## 10. Desviaciones de la spec

| ID | Qué | Por qué |
|---|---|---|
| D-1 | `ServiceItem.deliverables` y `process.principles` son `Localized[]` en vez de `Localized<string[]>` | `tests/unit/l0/content.test.ts` (congelada) exige que todo `{ es, en }` del contenido sea texto. Es la misma forma que `highlights` y `bullets`, y mantiene alineados ES y EN. El copy es el de §5.3 y §5.4 sin cambios. |
| D-2 | `TerminalGenerated` suma `'principles'` y `'mottos'`; `help` es una salida fija | `cat principles.md` y `cat lemas.md` se generan desde `about.principles` y `now.mottos` para no duplicar texto y para marcar en latín solo la línea que lo es. `help` es el texto exacto de §15. |
| D-3 | `home.previousTitleLabel` y `case.diagram.*` en `site.json` | Ver §3. |
| D-4 | `site.privacy.updatedAt` y `now.updatedAt` en `2026-11-04` | Es la fecha del cambio de texto. El orquestador la ajusta al publicar (T507). |
| D-5 | Las URLs de `links.repos` de Synergos se verificaron con la API pública de GitHub el 2026-11-04 (`CHERCED-DEV/Synergos.CMS`, `.UI`, `.Fabrica`, públicos) | La spec no trae las URLs que verificó el orquestador. Confírmalas. |

## 11. Pruebas que protegen este contrato

| Prueba | Qué cuida |
|---|---|
| `tests/unit/p0/career-verification.test.ts` | Tabla §7.8: empresa, rol oficial en inglés en ambos idiomas, fechas, logros, educación, 140+ cursos, idiomas, contacto y ubicación (SC-402) |
| `tests/unit/p0/identity-copy.test.ts` | Ningún diccionario ni texto vigente dice "front-end/full-stack developer"; metas de §1; hero, intro y "Quién soy" (SC-401) |
| `tests/unit/p0/confidentiality.test.ts` | Sin cantidades en las entradas del empleador ni en Event bridge, con la regla probada fallando (FR-444, SC-407) |
| `tests/unit/p0/synergos-facts.test.ts` | Fuente única de las cifras, sin literales en el código, y carrera, caso y terminal coherentes (FR-441) |
| `tests/unit/p0/content-refs.test.ts` | Orden y época de los 15 casos, ADR, diagrama y repos solo en Synergos, SVG nuevos, seis servicios, `isServiceId`, `inWords` contra los lóbulos, terminal, `/now` y sitemap |
| `tests/unit/p0/person-jsonld.test.ts` | Objeto de §22, `@id` estable, sin datos de contacto y `<` escapado |
| `tests/unit/p0/og-template.test.ts` | Textos de §23, `ogCase` de los 15 casos, fuentes TTF y un PNG real de 1200 × 630 |
| `tests/unit/p0/shared-pieces.test.ts` | `CvLink`, `AvailabilityChip`, `EmailMenu`, footer y `pageMetadata({ ogImageFile })` |
| `tests/unit/lc/content-completeness.test.ts` | Completitud ES/EN de los tipos nuevos, `now` y la terminal (FR-495, SC-412) |
| `tests/e2e/p0/shell.spec.ts` | Easter egg, menú de correo (mouse, teclado, clic fuera, error y axe), `mailto:` sin JS, JSON-LD en ES y EN, PNG OG y sitemap |

## 12. Impacto en pruebas de otras lanes

El contenido nuevo cambia comportamiento que pide la spec. Estas pruebas congeladas de la 001 y la 002 lo notan:

| Prueba | Qué pasa | Estado |
|---|---|---|
| `tests/unit/l5/assistant.test.ts` › "no afirma tecnologías…" | Pregunta por Python, que ahora está en el portafolio (Legal workspace, §13) | Rompe `npm test`. Ajuste propuesto en la rama `lane/P0-compat` (pregunta por Rust) |
| `tests/unit/r2/case-study.test.ts` (2 casos) | Supone que el caso 1 va primero y que hay 12 | Ídem: la posición y los vecinos salen del orden real |
| `tests/unit/r2/highlights.test.ts` | Máximo 4 resultados; Synergos trae 5 (§11.2) | Ídem: 5 solo para Synergos |
| `tests/unit/r2/explorer.test.ts` › "clasifica cada tecnología…" | Las tecnologías de los casos nuevos no tienen capa en `components/site/portfolio/stack.ts` (P4) | Ídem: capa provisional en `stack.ts`; P4 puede reclasificar |
| `tests/unit/r3/figures.test.ts` | Espera 12 proyectos | Ídem: 15. P2 reescribe las cifras en T431 |
| `tests/e2e/l1/site.spec.ts` › "servicios: introducción, Explorar y tres tarjetas" | Ahora hay seis servicios | Lo reemplaza P3 (T440 a T452) |
| `tests/e2e/l1/site.spec.ts` › "cada página declara…" (`og:image` en `/assets/`) | Sigue en verde en `p0-frozen`; rompe cuando cada lane pase `ogImageFile: true` (FR-471) | Ajuste del orquestador o P7 al integrar |
| `tests/e2e/l3/public.spec.ts` (líneas 68 y 129) | La confirmación dice "…en menos de 48 horas" (FR-480) | Ajuste al integrar P5 (T482 corre l3) |
| `tests/e2e/l1/site.spec.ts` › home sin JS, y `tests/e2e/r1/home.spec.ts` › redes del banner | Cuando P1 ponga `EmailMenu` y `CvLink` en el banner cambian los enlaces del `nav` | P1 (T421) |
