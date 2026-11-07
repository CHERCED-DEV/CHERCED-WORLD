# Tasks: Synergos, el showcase (009), fase 2 y atlas de patrones

**Spec**: [spec.md](./spec.md), sección "Fase 2" · **Evidencias**: [fase-2-evidencias.md](./fase-2-evidencias.md)

**Prerequisito**: la fase 1 (`/[lang]/synergos`, lane S1) integrada en `dev`. Otra lane la está tocando ahora: esta
fase no edita sus componentes salvo en las tareas marcadas "coordinar".

**Formato**: `- [ ] T09NN [P?] [Historia] Descripción con ruta`. El prefijo `T09` evita chocar con los `T9xx` de la
007. `[P]` se puede hacer en paralelo con la tarea anterior. Las rutas de tests usan `s2/` como carpeta de la lane que
construya; si la lane tiene otro nombre, se cambia la carpeta.

**Regla de contenido en todas las tareas**: cada texto sale de una fila de `fase-2-evidencias.md`. Si algo no está ahí,
no se escribe: se agrega primero la evidencia, con fuente y fecha.

---

## Fase 0: decisiones del autor (bloquea todo lo demás)

- [ ] T0901 [Todas] Entrevista corta con el autor: P-904 a P-909. Las respuestas van a la spec, en "Clarifications"
  (una sesión nueva) y en la tabla "Preguntas al autor (fase 2)".
  - P-904 confirmada por el autor el 2026-11-07: subpágina `/synergos/arquitectura`, enlazada desde Synergos.
    Siguen pendientes P-905 a P-909; la entrevista no se marca como terminada.
- [ ] T0902 [F2-2] El autor revisa la tabla del atlas (`fase-2-evidencias.md` §4) y aprueba el estado de cada patrón
  y la lista de "fuera de la lista" que entra (P-906). Es la condición del SC-912.
- [ ] T0903 [Todas] Boceto de la subpágina en `specs/009-synergos-showcase/bocetos/arquitectura.html`, con el orden de
  las secciones y los tres diagramas (recorrido CMS → elemento, cadena C# → TS y coordinación de islas), en escritorio
  y en 375 px. El autor lo aprueba antes de escribir código.

**Checkpoint**: decisiones y boceto aprobados.

---

## Fase 1: setup

- [ ] T0904 [Todas] Tipos en `content/types.ts`: `SynergosSource` (`repo`, `path`, `label`), `ArchitectureTopic`,
  `SynergosPattern` (estado `aplicado` · `parcial` · `descartado`, ancla, casos) y `FactoryMilestone` (`hecho` ·
  `vision`).
- [ ] T0905 [P] [Todas] Cifras ya verificadas (evidencias §1): `content/synergos.ts`, `countedAt` de `2026-11-01` a
  `2026-11-05`. **Coordinar** con la lane dueña de `/synergos` la aclaración de `backend.bff` en
  `content/synergos-showcase.ts` (9 orquestadores desplegables).

---

## Fase 2: fundaciones (bloquea las historias)

- [ ] T0906 [F2-1, F2-3] `content/synergos-architecture.ts`: los temas de §2 y §3 de las evidencias en ES y EN, cada uno
  con sus fuentes, la fecha del conteo y `privado: true` donde corresponda (FR-912). Las cifras que se repiten se
  importan de `content/synergos.ts` (FR-920).
- [ ] T0907 [P] [F2-2] El atlas en el mismo archivo (o en `content/synergos-patterns.ts` si crece): los patrones
  aprobados en T0902, con su ancla `patron-<id>`, cómo se aplica, dónde no (en los parciales), sus fuentes y los casos
  que lo usan; más el grupo "lo que decidí no usar" si la P-905 lo aprueba.
- [ ] T0908 [P] [F2-4] Los hitos de la fábrica del §5: bloque `hecho` con fuente obligatoria y bloque `vision` sin
  cifras (FR-919).
- [ ] T0909 [Todas] Prueba `tests/unit/s2/synergos-architecture.test.ts` (FR-913): cada tema, patrón e hito `hecho`
  tiene fuente o `privado: true`; cada `repo` está entre `Synergos.CMS`, `Synergos.UI` y `Synergos.Fabrica`; ninguna
  ruta empieza por una unidad (`C:`) ni contiene `Desktop`; ningún patrón `descartado` se lista como aplicado; las
  anclas son únicas; ES y EN están completos.
- [ ] T0910 [Todas] Extender `tests/unit/p0/confidentiality.test.ts` (FR-917) a `content/synergos-architecture.ts`
  y a sus i18n: que ningún texto de la fase 2 nombre al empleador actual (la regla `EMPLOYER` que ya existe) ni a los
  empleadores anteriores de `site.about.career`, salvo en la carrera. Los nombres de proveedores de producción los dicta
  el autor al construir; no se escriben en las specs públicas.
- [ ] T0911 [Todas] La ruta `app/[lang]/synergos/arquitectura/page.tsx`, SSR y legible sin JS (FR-910, FR-911), con su
  `generateMetadata` y la carpeta `components/site/synergos/arquitectura/` para sus piezas. Solo la estructura y los
  títulos de sección.

**Checkpoint**: los datos cargan, las pruebas de fuentes y de confidencialidad pasan y la página existe vacía.

---

## Fase 3: User Story F2-1, del CMS al elemento (P1)

**Goal**: que se entienda cómo una vista Razor muestra un elemento Angular servido desde la CDN y cómo se coordinan
las islas.

**Independent Test**: la sección se lee completa sin JS, en ES y EN, y cada bloque enlaza al menos una fuente pública.

- [ ] T0912 [F2-1] Diagrama SVG renderizado en el servidor del recorrido vista Razor → SynHost → custom element con
  `config` → import map → CDN, en `components/site/synergos/arquitectura/RecorridoDiagram.tsx`. Alternativa en texto,
  vertical en móvil y sin pulsos con movimiento reducido (FR-916), reusando el modelo de `AssemblyLine.tsx` donde sirva.
- [ ] T0913 [F2-1] Secciones "Los frameworks" y "Cómo compone Umbraco", desde `content/synergos-architecture.ts`, con
  sus fuentes visibles (evidencias §3.1 y §3.2). No se nombra React, Svelte ni Vue como plataformas activas.
- [ ] T0914 [F2-1] Diagrama y sección "Islas que no comparten Angular", con los tres mecanismos: BroadcastChannel entre
  islas y pestañas, eventos DOM con el coordinador sin render y la puerta del CMS (evidencias §2.1 y §3.6). No se habla
  de `postMessage` entre ventanas como parte de Synergos.
- [ ] T0915 [P] [F2-1] e2e `tests/e2e/s2/synergos-arquitectura.spec.ts`: la página en ES y EN sin JS, la lista en
  texto de cada diagrama y la navegación con teclado.

**Checkpoint**: la F2-1 se puede mostrar sola.

---

## Fase 4: User Story F2-2, el atlas de patrones (P1)

**Goal**: los patrones aplicados de verdad, cada uno con su evidencia, sin saturar.

**Independent Test**: las entradas coinciden con las aprobadas en T0902 y cada una enlaza a un repo público.

- [ ] T0916 [F2-2] Componente `components/site/synergos/arquitectura/PatternAtlas.tsx`: lista en móvil y rejilla en
  escritorio, sin tabla con scroll horizontal. Cada entrada lleva su ancla, su estado (los parciales dicen dónde no se
  aplican) y sus fuentes.
- [ ] T0917 [F2-2] El grupo "Lo que decidí no usar" con el argumento y la ADR de cada decisión, si la P-905 lo aprueba.
- [ ] T0918 [F2-2] Casos 12 y 13: un campo `patterns` en `content/projects.ts` y su render como enlaces a las anclas del
  atlas en la vista del caso, sin repetir el texto. **Coordinar** si la lane de `/synergos` o la de los casos tiene esos
  archivos abiertos.
- [ ] T0919 [P] [F2-2] Pruebas: unitaria de que el atlas muestra exactamente los aprobados y ninguno `descartado`, y e2e
  de las anclas desde los casos y de que no hay scroll horizontal a 320 px.

**Checkpoint**: el atlas se puede mostrar solo y enlazar desde los casos.

---

## Fase 5: User Story F2-3, un tipo y dos compiladores (P2)

**Goal**: la sinergia C#/TS, el diseño atómico en los dos árboles y la accesibilidad, con lo que falta dicho de frente.

**Independent Test**: cada eslabón de la cadena C# → JSON → TS enlaza a su fichero, y la sección de accesibilidad no
dice nada que §3.5 no sostenga.

- [ ] T0920 [F2-3] Diagrama SVG de la cadena (`record` C# → `elementos-synhost.json` → tipo TS → sanitizador con spec)
  y, junto a él, la cadena de OpenAPI y la de los vectores compartidos (evidencias §3.3). El ejemplo de `record` y de
  tipo TS se copia del repo público, con su fuente al lado.
- [ ] T0921 [F2-3] Sección "Diseño atómico": front (primitiva, composición y módulo, con los conteos del registry y su
  fecha) y back (la regla de atomicidad del doc 07). El despiece de las verticales se dice "en curso", sin cifras
  privadas (evidencias §3.4).
- [ ] T0922 [F2-3] Sección "Accesibilidad": la autoauditoría y la reauditoría, el SSR primero y lo que hacen los
  elementos, y la frase de que no hay un gate automático de accesibilidad en Synergos (evidencias §3.5).

**Checkpoint**: la F2-3 completa la explicación de la F2-1.

---

## Fase 6: User Story F2-4, la fábrica (P3)

**Goal**: la visión del autor, sin confundirla con lo construido.

**Independent Test**: lo de "Ya construido" enlaza a ficheros públicos; lo de "Lo que viene" está rotulado y sin cifras.

- [ ] T0923 [F2-4] Sección "La fábrica" con los dos bloques rotulados, "Ya construido" y "Lo que viene" (evidencias §5).
  Las cifras del piloto de Alquiler llevan su enlace al spec público si la P-908 lo aprueba. El enlace del arnés va a
  `Synergos.Fabrica`.
- [ ] T0924 [F2-4] Solo si la P-907 es sí: un bloque genérico con la experiencia del autor en su empleo, con el texto que
  él escriba, separado de las evidencias de Synergos y sin nombres internos ni cifras (FR-918). Pasa por la prueba de
  confidencialidad de T0910.

**Checkpoint**: las cuatro historias están completas.

---

## Fase 7: accesos, SEO y cierre

- [ ] T0925 [Todas] Imagen OG `app/[lang]/synergos/arquitectura/opengraph-image.tsx` con la plantilla de
  `lib/og/template.tsx`, y JSON-LD `TechArticle` con `about` hacia el `SoftwareApplication` de `lib/seo/synergos.ts` y
  `author` hacia la `Person` (FR-921).
- [ ] T0926 [Todas] **Coordinar**: el enlace a la subpágina desde "Cómo se construye" en
  `components/site/synergos/SynergosView.tsx`.
- [ ] T0927 [P] [Todas] Accesos (FR-922): `app/sitemap.ts`, `lib/agent/llms.ts`, `lib/search/build-index.ts`, la paleta
  (`components/experience/palette-model.ts`, `> synergos arquitectura`) y el asistente (`lib/assistant/engine.ts`), que
  contesta "qué patrones usa Synergos" con el atlas y sus enlaces. Pruebas en `tests/unit/p6/assistant.test.ts` y
  `tests/unit/p6/llms.test.ts` (SC-915).
- [ ] T0928 [Todas] Accesibilidad y responsive (FR-923): axe sin violaciones serias, teclado, movimiento reducido y de
  320 a 2560 px, en la e2e de T0915 (SC-914).
- [ ] T0929 [Todas] Revisión del autor en la vista previa: confidencialidad (SC-911), lectura en voz alta de la F2-1
  (SC-913) y el atlas contra lo aprobado (SC-912).

---

## Dependencias y orden

- La Fase 0 bloquea todo. T0902 bloquea T0907, y T0903 bloquea las Fases 3 a 6.
- La Fase 2 bloquea las historias. T0909 y T0910 van antes de escribir texto, para que todo texto nuevo nazca vigilado.
- F2-1 y F2-2 son P1 y se pueden hacer en paralelo después de la Fase 2. F2-3 depende del recorrido de la F2-1 (T0912).
  F2-4 no depende de las otras, pero se publica al final.
- La Fase 7 va al final. T0926 y T0918 se coordinan con la lane dueña de `/synergos` y de los casos.
