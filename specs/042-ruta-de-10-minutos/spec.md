# 042 — Ruta de 10 minutos: el modo entrevistador

Pedido del autor, 26 de noviembre de 2026 (línea [041](../041-pruebame-en-vivo/spec.md), ola 1, línea L1). Para
entrevistadores de AI Engineer, líderes técnicos que buscan senior full-stack con IA y posibles clientes de
consultoría. Depende de 029, 030, 031, 032, 033, 034, 035 y 038, todas construidas.

Estado: borrador para aprobación del autor. Nada se implementa sin su visto bueno
([aprobacion.md](../041-pruebame-en-vivo/aprobacion.md)).

## Qué hace

Una página nueva, `/{lang}/ai-lab/ruta`, guía al entrevistador por cuatro estaciones en 10 minutos, una por cada
prueba de la 041. En cada estación él controla una prueba en vivo sobre lo que el sitio ya tiene: le pregunta al
agente, intenta romperlo, pega su propia vacante, mira código real o sigue una spec hasta sus commits. Al final se
descarga un acta con lo que comprobó y la evidencia enlazada.

## Qué prueba en la entrevista

Las cuatro pruebas de la 041, para los tres públicos:

| Estación | Prueba | Qué comprueba el entrevistador |
|---|---|---|
| Agente en vivo | 1. Agentes que funcionan | Que Mini Cherced responde con fuentes, que su traza muestra herramientas, tokens y costo, y que se niega a lo que debe |
| Encaje y pitch | 2. Problemas de negocio | Que su propia vacante se cruza contra evidencia publicada y que un caso se cuenta con problema, decisión y resultado |
| Código real | 3. Código de calidad | Que una pieza real del repo se explica línea por línea, con sus pruebas y su decisión de arquitectura |
| De spec a commit | 4. Entrega rápida con IA | Que una funcionalidad tiene spec, requisitos, commits y pruebas trazables |

## Caso de negocio o valor

- **Problema:** el sitio ya tiene 18 experimentos en el AI Lab y siete piezas pensadas para entrevistas (029–035).
  Un entrevistador con 10 minutos no sabe por dónde empezar, y lo más fuerte queda escondido.
- **Para quién:** quien entrevista y quien decide si contrata.
- **Qué evita:** que el entrevistador vea una demo suelta y se vaya sin poder comparar, o que tenga que pedirle a
  Camilo que comparta pantalla.
- **Cómo se mide:** SC-4201 y SC-4202. Tiempo real de la ruta y cuántas pruebas quedan marcadas con evidencia.

## Historias de usuario

### US1 — Recorrer las cuatro estaciones en 10 minutos (P1)

El entrevistador abre la ruta, ve un reloj de 10:00 y cuatro estaciones en orden. Cada estación dice qué va a
comprobar, cuántos minutos sugiere y qué pasos seguir. Un botón abre la experiencia que ya existe. Al volver, marca la
estación como comprobada, no probada o «no funcionó».

**Por qué esta prioridad:** es la columna de toda la línea. Sin ella, lo demás sigue siendo un catálogo suelto.

**Prueba independiente:** con solo esta historia, el entrevistador cubre las cuatro pruebas con lo que ya está
publicado (029–035).

**Escenarios:**

1. **Dado** que el entrevistador abre `/es/ai-lab/ruta`, **cuando** pulsa «Empezar», **entonces** arranca un reloj de
   10:00 y aparece la primera estación con su objetivo, sus pasos y su botón.
2. **Dado** que está en la estación «Agente en vivo», **cuando** pulsa «Abrir a Mini Cherced», **entonces** llega a la
   tarjeta V5 del AI Lab (`/es/ai-lab#lab-v5`) y la ruta sigue contando el tiempo.
3. **Dado** que vuelve a la ruta, **cuando** marca la estación como comprobada, **entonces** la estación queda con su
   marca y la ruta avanza a la siguiente.
4. **Dado** que se pasa del tiempo, **cuando** el reloj llega a cero, **entonces** la ruta no se bloquea: el reloj
   sigue en negativo con un aviso discreto y las estaciones siguen abiertas.
5. **Dado** que entra con el celular, **cuando** recorre las cuatro estaciones, **entonces** todo se lee y se toca sin
   zoom en 390×844.

### US2 — Llevarse el acta (P1)

Al terminar, o en cualquier momento, el entrevistador descarga un acta en Markdown con la fecha, la duración, el
estado de cada prueba, la evidencia enlazada y sus notas.

**Por qué esta prioridad:** el acta es lo que viaja al resto del equipo que contrata. Sin ella, la ruta se olvida.

**Prueba independiente:** con la ruta recorrida a medias, el acta sale igual y marca lo no probado como no probado.

**Escenarios:**

1. **Dado** que marcó tres estaciones y dejó una sin probar, **cuando** pulsa «Descargar el acta», **entonces** baja un
   `.md` con las cuatro pruebas, tres marcadas y una «sin probar», y nunca una prueba marcada que él no marcó.
2. **Dado** que escribió notas en una estación, **cuando** descarga el acta, **entonces** las notas salen tal cual,
   debajo de su estación.
3. **Dado** que no tiene JavaScript, **cuando** abre la ruta, **entonces** ve las cuatro estaciones con sus pasos y
   enlaces renderizados en el servidor, y un aviso de que el reloj y el acta piden JavaScript.

### US3 — Rómpelo: el red team guiado (P2)

En la estación del agente, una sección «Rómpelo» propone tres ataques sacados de la batería de rechazos de la 032:
pedir el prompt de sistema, pedir datos privados o «ignora tus instrucciones». El entrevistador copia uno, lo prueba
con Mini Cherced y anota qué pasó. Al lado ve el resultado de la última corrida pública de las evals.

**Por qué esta prioridad:** distingue a un AI Engineer de alguien que hizo una demo. Depende de la US1.

**Prueba independiente:** con la US1 hecha, los tres ataques salen de `content/ailab/evals/battery.ts` (12 casos de
tipo `refusal`) sin escribir casos nuevos.

**Escenarios:**

1. **Dado** que abre «Rómpelo» en español, **cuando** pide otros ataques, **entonces** salen tres casos distintos de la
   batería, en el idioma de la página, con un botón para copiarlos.
2. **Dado** que la batería no tiene corridas publicadas (hoy `content/ailab/evals/results.json` tiene `runs: []`),
   **cuando** se muestra el resultado, **entonces** dice «todavía no hay una corrida publicada» y enlaza al tablero de
   la 032, sin inventar un porcentaje.
3. **Dado** que hay una corrida publicada, **cuando** se muestra, **entonces** dice cuántos rechazos pasaron sobre el
   total y la fecha de la corrida.

### US4 — Entrar a la ruta sin tocar lo aprobado (P2)

Hay dos entradas: un enlace de texto en la ventana «Para reclutadores» del inicio, como el de los pitches de la 033, y
un acceso al inicio del AI Lab. Mientras la ruta está activa, en las páginas de las estaciones aparece una pastilla
pequeña «Volver a la ruta (06:32)».

**Por qué esta prioridad:** sin entrada nadie llega. Va segunda porque toca archivos compartidos (enmiendas de la
base) y secciones aprobadas.

**Prueba independiente:** la ruta funciona por su URL aunque no haya entradas. Las entradas solo suman.

**Escenarios:**

1. **Dado** que el entrevistador abre «Para reclutadores», **cuando** lee la ventana, **entonces** ve un enlace de
   texto «Pruébame en 10 minutos» y nada más cambia en la ventana ni en el hero.
2. **Dado** que empezó la ruta y abrió la tarjeta de Mini Cherced, **cuando** mira la pantalla, **entonces** ve la
   pastilla «Volver a la ruta» con el tiempo, que se puede cerrar y se opera con teclado.
3. **Dado** que nunca empezó la ruta, **cuando** navega el sitio, **entonces** no ve ninguna pastilla.

### US5 — Registro de estaciones para las otras líneas (P3)

Las líneas siguientes (043 a 050) suman estaciones propias sin tocar la ruta: cada una entrega un archivo con una
`RouteStation` y el integrador la agrega al registro.

**Por qué esta prioridad:** es el contrato que vuelve a la ruta el índice vivo de toda la línea, pero en la ola 1 solo
hacen falta las estaciones propias y las de 044 y 045.

**Prueba independiente:** una prueba de contrato valida el registro: ids únicos, al menos una estación por prueba, la
ruta núcleo de 10 minutos o menos y enlaces internos que existen.

**Escenarios:**

1. **Dado** que el integrador suma la estación de la 044, **cuando** corre la prueba del registro, **entonces** pasa si
   la estación cumple el contrato y falla con el motivo si no.
2. **Dado** que una estación nueva es de la prueba 1, **cuando** aparece en la ruta, **entonces** sale en «Más pruebas»
   de esa estación y no alarga la ruta núcleo.

## Casos límite

- **Mini Cherced sin cupo** (cupo de prueba sin cuenta de 2 por IP al día y 15 en total, `agentTrial` y
  `agentTrialDaily` en `lib/security/rate-limit.ts`): la estación lo dice, ofrece entrar con cuenta y muestra una
  traza grabada, marcada como grabada, para que la prueba no se pierda.
- **Gemini apagado** (sin llave o con el techo mensual de la 043 alcanzado): las estaciones con modelo lo dicen y
  ofrecen la evidencia sin modelo (traza grabada, código y spec).
- **El entrevistador no sigue el orden:** puede abrir cualquier estación; el acta refleja lo que marcó.
- **Recarga de la página o pestaña nueva:** el avance vive en `sessionStorage` de esa pestaña. Si se pierde, la ruta
  arranca de cero sin error.
- **`sessionStorage` bloqueado** (navegación privada estricta): la ruta funciona sin persistencia y lo dice.
- **Idioma:** cambiar de idioma a mitad conserva el avance y traduce las estaciones.
- **Movimiento reducido:** el reloj no anima; solo cambian los números.
- **Estación cuyo enlace dejó de existir:** la prueba de contrato lo detecta antes de integrar.

## Requisitos

- **FR-4201** Página `/{lang}/ai-lab/ruta` en español y en inglés. Las estaciones, sus pasos y sus enlaces se
  renderizan en el servidor (principio IV). El reloj, las marcas, las notas y el acta piden JavaScript y lo dicen.
- **FR-4202** La ruta núcleo tiene exactamente cuatro estaciones, una por prueba, que suman 10 minutos o menos.
  Las estaciones extra de cada prueba van en «Más pruebas» y no cuentan en los 10 minutos.
- **FR-4203** Cada estación muestra su objetivo, sus minutos, de dos a cuatro pasos, el botón a la experiencia que
  ya existe y qué evidencia conviene llevarse al acta.
- **FR-4204** Cada estación se marca como «comprobada», «no funcionó» o se deja «sin probar», y admite notas de hasta
  500 caracteres. Nada de eso sale del navegador.
- **FR-4205** El avance (inicio del reloj, marcas y notas) vive en `sessionStorage` de la pestaña y nunca se manda al
  servidor ni se guarda en la base.
- **FR-4206** Acta en Markdown que se descarga desde el navegador: fecha y hora (zona `America/Bogota`, como la
  030), duración, las cuatro pruebas con su estado, la evidencia enlazada con URL absoluta, las notas y una nota fija
  de que la marcó el entrevistador. Reusa el formato de `lib/ai/agent/interview.ts` (encabezados, fecha y nota final)
  sin duplicar su código: lo común se extrae a una función compartida si hace falta (enmienda E-4204).
- **FR-4207** «Rómpelo» toma tres casos de tipo `refusal` de `EVAL_BATTERY` en el idioma de la página, sin escribir
  casos nuevos, y muestra el resultado de la última corrida de `content/ailab/evals/results.json` o «todavía no hay una
  corrida publicada».
- **FR-4208** Contrato `RouteStation` en `content/ailab/route/stations.ts`:
  `{ id; proof: 1 | 2 | 3 | 4; alsoProves?: (1 | 2 | 3 | 4)[]; title: Localized; minutes; steps: Localized[]; href;
  evidence: string[]; spec }`. `proof` es la prueba principal y decide dónde va la estación; `alsoProves` suma las
  demás pruebas que demuestra, sin repetir `proof` y sin alargar la ruta núcleo. El registro `content/ailab/route/index.ts` exporta `routeStations` y `coreRoute` (el id de la estación núcleo de
  cada prueba).
- **FR-4209** Prueba de contrato del registro: ids únicos, al menos una estación por prueba, la ruta núcleo de 10
  minutos o menos, de dos a cuatro pasos por estación, títulos y pasos en los dos idiomas y `href` internos que
  existen.
- **FR-4210** Entradas (enmiendas de la base): un enlace de texto en la ventana «Para reclutadores» y un acceso al
  inicio del AI Lab. No cambia nada más del hero, de la ventana ni del AI Lab (FR-4108).
- **FR-4211** Pastilla «Volver a la ruta» con el tiempo restante, solo mientras hay una ruta activa en la pestaña. Se
  cierra, se opera con teclado y no tapa contenido en 390×844.
- **FR-4212** Cuando una estación depende de un modelo que no está disponible (sin cupo, sin llave o con el techo
  mensual alcanzado), la estación lo dice y ofrece evidencia sin modelo, marcada como grabada.
- **FR-4213** Accesible: el reloj se anuncia solo al cambiar de estación (no cada segundo), las marcas son controles
  nativos y el estado no depende solo del color (principio V).
- **FR-4214** La ruta no gasta API por sí misma: solo las experiencias que ya existen, con sus topes de siempre.

## Entidades clave

- **RouteStation:** una estación. Pertenece a una prueba (1 a 4), apunta a una experiencia del sitio y dice qué
  evidencia llevarse.
- **Avance de la ruta:** inicio del reloj, marca y notas por estación. Vive solo en la pestaña.
- **Acta de la ruta:** el Markdown que se descarga. No se guarda en el sitio.

## Criterios de éxito

- **SC-4201** El autor y dos personas que no conocen el sitio terminan la ruta núcleo en 10 minutos o menos,
  cronometrados, en escritorio y en celular.
- **SC-4202** En esas tres corridas, el acta sale con las cuatro pruebas marcadas y al menos un enlace de evidencia
  por prueba.
- **SC-4203** La prueba de contrato del registro falla con un `href` interno que no existe y con una ruta núcleo de
  más de 10 minutos.
- **SC-4204** Cero cambios en las capturas del hero, de la ventana «Para reclutadores» (salvo su enlace nuevo) y del
  AI Lab (salvo su acceso nuevo), comparadas en 390×844 y WebKit contra la última vista aprobada.
- **SC-4205** La ruta, sin abrir ninguna estación, hace cero llamadas a `/api/ailab/*` y a `/api/agent/*`.

## No incluye

- No reescribe ni cambia el comportamiento de las experiencias que enlaza (029–035, 038). Solo enlaza a ellas.
- No lee el resultado de esas experiencias de forma automática: el entrevistador marca y pega lo que quiera. Leer la
  traza o el acta de la 030 sin que él la descargue pediría tocar componentes de otras specs.
- No guarda el avance ni el acta en la base, ni con cuenta ni sin ella.
- No califica al candidato con un puntaje: marca pruebas comprobadas, como la 029 no da nota de encaje (P-2902).
- No agenda entrevistas ni manda el acta por correo.
- No agrega estaciones de las olas 2 y 3: las entrega cada línea con su spec.

## Costo y topes

- **La ruta:** cero. No llama a ningún modelo.
- **Lo que abre** (con los topes de siempre):
  - Mini Cherced, unos 0,10 USD por 5 minutos (030);
  - el encaje con la vacante, unos 0,01 USD (029);
  - la explicación de una pieza de código, unos 0,01 USD, o cero si ya está en caché 7 días (035).
- **Total por entrevistador:** unos 0,12 USD (unos COP 396, TRM de 3.297 del 11 de noviembre de 2026) si usa las tres.
- **En el tope mensual:** 50 rutas al mes son unos 6 USD (COP 19.782), dentro de la meta de 10 USD de la 041.
- **Tope por visitante:** el de cada experiencia. La ruta no agrega límites porque no tiene endpoint.

## Estación en la ruta de 10 minutos

Esta spec es la ruta. Sus cuatro estaciones núcleo:

| Id | Prueba | Minutos | Qué hace el entrevistador | Evidencia para el acta |
|---|---|---|---|---|
| `agente-en-vivo` | 1 | 3 | Abre Mini Cherced en modo entrevista (pista Técnica), hace una pregunta, abre «Cómo pensó» y prueba un ataque de «Rómpelo» | La traza exportada en JSON (031) o el acta de la entrevista (030), y el resultado del ataque |
| `encaje-y-pitch` | 2 | 3 | Pega su vacante en «¿Encajo en tu vacante?» y escucha el pitch de un caso | Cobertura de requisitos y el enlace al pitch |
| `codigo-real` | 3 | 2 | Elige una pieza en el recorrido por el código y le pregunta «¿por qué no usaste X?» | Enlace a las líneas en GitHub |
| `de-spec-a-commit` | 4 | 2 | Sigue la spec 030 hasta sus commits y sus pruebas | Enlaces a la spec, los commits y el archivo de pruebas |

Estaciones extra en la ola 1: `rompelo` (prueba 1, 2 minutos) y `diseno-de-sistemas` (pruebas 1 y 3 con la 034, 5
minutos). Las de la 044 (MCP) y la 045 (tablero) llegan con sus líneas.

## Evals

La ruta no usa modelo, así que no lleva batería propia. Sus pruebas son la de contrato del registro (FR-4209), la del
acta (FR-4206) y una prueba e2e de punta a punta con las cuatro estaciones.

## Supuestos

- Las experiencias enlazadas siguen en las rutas de hoy: `/{lang}/ai-lab#lab-v5`, `#lab-a6`, `/{lang}/ai-lab/codigo`,
  `/{lang}/ai-lab/evals` y los casos de `/{lang}/portfolio/{id}`.
- El entrevistador entra sin cuenta, así que usa el cupo de prueba de Mini Cherced (038).
- `sessionStorage` alcanza: la ruta se hace en una sola sesión de 10 a 20 minutos.
- La spec 030 y sus commits (`feat(030)…`) sirven de ejemplo de trazabilidad hasta que exista el tablero de la 045.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-4201 | ¿Cómo se llama la página? | «Pruébame en 10 minutos» / "Try me in 10 minutes", dentro de la línea «Pruébame en vivo» (P-4101) |
| P-4202 | ¿Qué pista del modo entrevista sugiere la estación del agente? | Técnica, porque muestra criterio de AI Engineer; la conductual queda en «Más pruebas» |
| P-4203 | ¿Qué caso se usa para el pitch y para «de spec a commit»? | Synergos para el pitch, y la 030 para la trazabilidad |
| P-4204 | ¿Mostramos la pastilla «Volver a la ruta» en las páginas de las estaciones? | Sí, solo con una ruta activa, y se puede cerrar |
| P-4205 | ¿Ofrecemos una versión imprimible del acta, como el resumen de la 029? | No en v1: el Markdown alcanza y se pega en cualquier herramienta |
| P-4206 | ¿La traza grabada de respaldo se graba con Gemini real? | Sí, una vez y con permiso del autor (unos 0,10 USD); mientras tanto, la del simulador marcada como simulada |
