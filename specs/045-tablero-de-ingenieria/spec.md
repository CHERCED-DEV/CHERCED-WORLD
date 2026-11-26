# 045 — Tablero de ingeniería vivo

Pedido del autor, 26 de noviembre de 2026 (línea [041](../041-pruebame-en-vivo/spec.md), ola 1, línea L3). Para
líderes técnicos que buscan senior full-stack con IA y entrevistadores de AI Engineer que quieren ver cómo trabaja,
no solo qué hizo. Depende de la 032 (evals) y de la 038 (trazas). Lee el gasto mensual de la 043 cuando exista.

Estado: borrador para aprobación del autor. Nada se implementa sin su visto bueno
([aprobacion.md](../041-pruebame-en-vivo/aprobacion.md)).

## Qué hace

Una página, `/{lang}/ingenieria`, muestra números reales de cómo se construye el sitio:
- las pruebas que pasaron en este mismo despliegue;
- cada spec con su estado, sus requisitos y sus commits;
- cuántos requisitos nombra alguna prueba;
- los despliegues;
- los presupuestos de rendimiento y accesibilidad, y quién los vigila;
- las últimas corridas de evals;
- el gasto de IA frente al tope.

Todo sale del repo y del build: nada se escribe a mano, y nada se inventa cuando falta un dato.

## Qué prueba en la entrevista

- **Prueba 3, código de calidad:** pruebas que corren en cada build, requisitos con prueba que los nombra y
  presupuestos que se vigilan.
- **Prueba 4, entrega rápida con IA:** de una spec a sus commits y a «construida», con fechas. Por ejemplo, la 030 se
  escribió el 14 de noviembre de 2026 y quedó construida el 15.
- **Público:** sobre todo el líder técnico. Al entrevistador de AI Engineer le muestra que las evals y el costo de IA
  se miden.

## Caso de negocio o valor

- **Problema:** «trabajo con calidad y entrego rápido con IA» lo dice cualquiera. Sin números con fuente, el
  entrevistador tiene que creerlo.
- **Para quién:** quien decide si el candidato trabaja bien en equipo y con proceso.
- **Qué evita:** discutir en abstracto; también evita los números que se escriben a mano y se desactualizan.
- **Cómo se mide:** SC-4501 a SC-4505. Cada número trae su fuente y su fecha, y la página se rehace sola en cada
  build.

## Historias de usuario

### US1 — De la spec al commit (P1)

El entrevistador ve la lista de specs (001 a 050) con su estado («construida», «en construcción», «aprobada»,
«borrador», «propuesta» o «sin estado»), cuántos requisitos tiene, cuántos commits la nombran y cuántos días pasaron
de la spec a «construida». Elige una y ve sus commits con la fecha y el enlace a GitHub.

**Por qué esta prioridad:** es la prueba 4 en números, y nada más del sitio la muestra así.

**Prueba independiente:** con solo esta historia, la página sirve: el historial versionado más las specs del repo.

**Escenarios:**

1. **Dado** que abre `/es/ingenieria`, **cuando** mira la tabla de specs, **entonces** ve cada spec con su estado,
   leído de la línea «Estado:» de su `spec.md`, y un enlace a la spec en GitHub.
2. **Dado** que elige la 030, **cuando** se abre su detalle, **entonces** ve los commits cuyo asunto la nombra (por
   ejemplo `feat(030): …`), con fecha y enlace, y los días de la spec a «construida».
3. **Dado** que una spec no tiene commits que la nombren, **cuando** se muestra, **entonces** dice «sin commits que la
   nombren» y no inventa un tiempo.
4. **Dado** que el historial versionado tiene fecha, **cuando** se muestra, **entonces** la página dice «historial al
   <fecha>, commit <sha corto>».

### US2 — Pruebas y este despliegue (P1)

Arriba, una franja dice qué commit y qué entorno está viendo y cuántas pruebas unitarias pasaron en el build de ese
mismo despliegue. Más abajo, cuántos archivos de prueba hay por tipo (unitarias, de contrato y e2e) y cuántos
requisitos de cada spec aparecen nombrados en alguna prueba.

**Por qué esta prioridad:** es la prueba 3 en números, y la franja del despliegue la vuelve verificable: no es una
captura de otro día.

**Prueba independiente:** sin el historial de git, la franja y los conteos salen del build y del árbol del repo.

**Escenarios:**

1. **Dado** que el build corrió las pruebas unitarias antes de compilar (hoy ya lo hace el `prebuild`), **cuando** el
   entrevistador mira la franja, **entonces** ve «N de N pruebas unitarias pasaron en este build», el commit y el
   entorno.
2. **Dado** que el reporte de las pruebas no está (por ejemplo, en un build local sin `prebuild`), **cuando** se
   muestra la franja, **entonces** dice «sin reporte de pruebas en este build» y no muestra un número.
3. **Dado** que la spec 006 tiene requisitos citados en pruebas (por ejemplo «(FR-602, SC-602)» en
   `tests/e2e/integration/mobile-budgets.spec.ts`), **cuando** se abre su detalle, **entonces** ve qué requisitos tienen
   una prueba que los nombra y cuáles no.

### US3 — Evals y gasto de IA (P2)

Una sección muestra la última corrida de cada batería de evals (hoy la de Mini Cherced, de la 032) y el gasto de IA:
el del día por experimento mientras no exista la 043, y el del mes frente a la meta de 10 USD y el techo de 25 USD
cuando exista. También dice cuántas llamadas recibió hoy el MCP público de la 044.

**Por qué esta prioridad:** muestra que la IA se mide y se topa, pero depende de corridas que hace el autor y de la
043 para el mes completo.

**Prueba independiente:** con `content/ailab/evals/results.json` vacío (`runs: []`, como hoy), la sección dice «todavía
no hay una corrida publicada» y enlaza al tablero de la 032.

**Escenarios:**

1. **Dado** que no hay corridas publicadas, **cuando** se muestra la sección de evals, **entonces** dice que no hay
   corridas y cómo se corre (`npm run evals:agent`, unos 0,05 USD, la corre el autor).
2. **Dado** que hay una corrida, **cuando** se muestra, **entonces** dice la fecha, aprobadas por tipo, latencia p50 y
   p95 y costo, como el tablero de la 032.
3. **Dado** que la 043 no está integrada, **cuando** se muestra el gasto, **entonces** sale el estimado de hoy por
   experimento (`spendToday` de `lib/ai/spend.ts`), con el aviso de que es un estimado por usos.
4. **Dado** que la 043 está integrada, **cuando** se muestra el gasto, **entonces** sale el del mes en USD y COP, por
   proveedor, frente a la meta y el techo.

### US4 — Calidad que se vigila (P3)

Los presupuestos del principio V (LCP ≤ 2,5 s, CLS ≤ 0,1, INP ≤ 200 ms y accesibilidad ≥ 95 sin violaciones
críticas) aparecen con la prueba que vigila cada uno y, si existe, la última medición con su fecha.

**Por qué esta prioridad:** muestra disciplina, pero las mediciones reales dependen de corridas de Playwright que no se
hacen en cada build.

**Prueba independiente:** sin mediciones, la sección lista los presupuestos y las pruebas que los vigilan, con enlace.

**Escenarios:**

1. **Dado** que no hay mediciones guardadas, **cuando** se muestra la sección, **entonces** dice «sin medición
   publicada» junto a cada presupuesto y nunca un valor.
2. **Dado** que el integrador guardó una medición de una corrida `fast`, **cuando** se muestra, **entonces** sale el
   valor, la fecha y la página medida.

### US5 — Registro de evals para las otras líneas (P3)

Cada línea con modelo (043, 046, 048, 049 y 050) deja sus resultados de evals en su propio archivo, y el integrador
los suma al registro del tablero sin tocar la página.

**Por qué esta prioridad:** hace que SC-4103 de la 041 se cumpla solo, pero en la ola 1 solo existe la batería de la
032.

**Prueba independiente:** una prueba de contrato valida cada entrada del registro contra el esquema `EvalResults`.

**Escenarios:**

1. **Dado** que el integrador suma las evals de la 048, **cuando** corre la prueba del registro, **entonces** pasa si
   el archivo cumple el esquema y falla con el motivo si no.

## Casos límite

- **El build de Vercel no trae la historia completa de git:** por eso la historia se toma en local y se versiona
  (`content/engineering/history.json`). La página dice hasta qué fecha llega.
- **Un commit nombra varias specs** (`fix(018, 022): …`): cuenta para cada una.
- **Una spec sin `spec.md`** (la 014 tiene `propuesta.md`, la 015 tiene `notas.md`): sale con el estado «propuesta» o
  «sin estado», sin error.
- **Una línea «Estado:» con texto libre:** se clasifica por palabras clave («construida», «en construcción»,
  «aprobada», «borrador», «propuesta»). Lo que no encaja sale como «otro», con el texto tal cual.
- **Base de datos caída:** la sección de gasto dice «no disponible ahora» y el resto de la página sigue estático.
- **Despliegues sin `gh`:** si el script corre sin la CLI de GitHub, la sección de despliegues dice «sin datos» y el
  resto sale igual.
- **Carpetas privadas:** el tablero solo lee archivos versionados. `specs/**/privado/` y
  `content/mini-cherced/privado/` nunca entran, ni en local.

## Requisitos

- **FR-4501** Página `/{lang}/ingenieria` en español y en inglés, generada en el build. Las tablas se renderizan en el
  servidor y se leen sin JavaScript (principio IV). Los gráficos son SVG sin librerías, con su tabla equivalente.
- **FR-4502** Cada número trae su fuente y su fecha: el archivo o la prueba de donde sale, el commit y el momento del
  cálculo. Cuando falta un dato, la página lo dice y no muestra un valor.
- **FR-4503** Franja del despliegue: commit corto y entorno (`VERCEL_GIT_COMMIT_SHA` y `VERCEL_ENV`, que Vercel pone
  solo), fecha del build y pruebas unitarias que pasaron en ese build, tomadas del reporte JSON de Vitest que deja el
  `prebuild`.
- **FR-4504** Specs: para cada carpeta de `specs/` con número, se muestra:
  - el estado, clasificado desde la línea «Estado:» de su `spec.md`;
  - los `FR-` que declaran los `.md` versionados de la carpeta, porque algunas specs los tienen fuera de `spec.md`
    (los de la 006 están en `contracts-m0.md`);
  - los commits cuyo asunto la nombra entre paréntesis;
  - la fecha del primer commit que creó su archivo principal y la del primer commit `feat(NNN)`.

  «Días de spec a construida» sale solo si existen las dos fechas.
- **FR-4505** Requisitos con prueba: busca los ids `FR-` y `SC-` de cada spec, literalmente, en los archivos de
  `tests/`. Muestra cuántos tienen una prueba que los nombra, sin decir que eso es cobertura completa.
- **FR-4506** Historia de git tomada en local por `scripts/engineering-metrics.mjs`: commits (sha corto, fecha y asunto,
  sin correos ni nombres), fechas de creación de cada spec y, si `gh` está disponible, los despliegues por entorno de
  los últimos 30 días (sin URLs de vista previa). Se guarda en `content/engineering/history.json` y lo corre el
  integrador antes del push de cada ola, así que no agrega despliegues.
- **FR-4507** El script y el build solo leen archivos versionados (`git ls-files`). Nada de lo ignorado por Git entra al
  tablero.
- **FR-4508** Evals: un registro `content/engineering/evals.ts` con las baterías publicadas (hoy la de la 032 en
  `content/ailab/evals/results.json`), validadas contra `EvalResults` de `lib/ai/evals/grade.ts`. Muestra la última
  corrida o «todavía no hay una corrida publicada».
- **FR-4509** Gasto de IA, sin datos de visitantes: antes de la 043, el estimado de hoy de `spendToday`; después, el
  mes por proveedor con la función que exponga la 043, frente a la meta de 10 USD y el techo de 25 USD, en USD y COP.
  También, las llamadas del día al MCP público (contador global `mcpDaily` de la 044). Esta sección la trae el
  navegador de `GET /api/engineering/spend`, cacheado una hora. El resto de la página es estático, del build.
- **FR-4510** Calidad: los presupuestos del principio V con la prueba que vigila cada uno (enlace al archivo) y la
  última medición solo si el integrador la guardó en el historial, con fecha y página.
- **FR-4511** Entrega: commits por semana de las últimas 8 semanas y despliegues por entorno de los últimos 30 días.
- **FR-4512** Contrato de la estación `tablero-en-numeros` para la ruta de la 042.

## Entidades clave

- **Historial:** commits, fechas de creación de specs y despliegues, tomados en local. Se versiona con su fecha y su
  commit.
- **Reporte de pruebas del build:** el JSON de Vitest del `prebuild`. No se versiona.
- **Spec en números:** estado, requisitos, commits, requisitos con prueba y días hasta construida.
- **Batería de evals publicada:** un archivo de resultados con el esquema de la 032.

## Criterios de éxito

- **SC-4501** El 100 % de los números de la página trae su fuente y su fecha.
- **SC-4502** Los conteos de la página coinciden con un conteo a mano el día de la revisión: specs, archivos de prueba
  por tipo y commits de tres specs elegidas al azar.
- **SC-4503** El tablero no muestra ningún valor de rendimiento, de evals o de gasto que no exista en su fuente. Una
  prueba con fuentes vacías lo verifica.
- **SC-4504** Cero correos, nombres de personas fuera del autor, URLs de vista previa o rutas de `privado/` en la
  página y en `history.json`.
- **SC-4505** La página cumple el principio V en perfil móvil (LCP ≤ 2,5 s, CLS ≤ 0,1, INP ≤ 200 ms y accesibilidad ≥ 95)
  con tablas de más de 50 filas.

## No incluye

- No es un panel de observabilidad en tiempo real ni reemplaza a Vercel: no muestra errores ni logs.
- No corre pruebas ni evals: lee los resultados que ya existen.
- No calcula cobertura de código por líneas: no hay herramienta de cobertura en el repo y sumarla pide justificar una
  dependencia.
- No muestra datos de visitantes, cuentas, mensajes ni trazas del AI Lab, ni siquiera agregados por persona.
- No muestra URLs de vistas previas de Vercel.
- No mide la productividad de personas. Mide el proceso del repo.

## Costo y topes

- **Modelos:** cero.
- **Vercel:** página estática por idioma, más un endpoint de gasto cacheado una hora (unas 720 ejecuciones al mes como
  máximo; el resto sale de la caché).
- **Base de datos:** lecturas de los contadores globales, una vez por hora como mucho.
- **Peso en el tope mensual de IA:** cero USD (COP 0).

## Estación en la ruta de 10 minutos

| Id | Prueba | Minutos | Qué hace el entrevistador | Evidencia para el acta |
|---|---|---|---|---|
| `tablero-en-numeros` | 4 (y 3) | 2 | Abre el tablero, mira la franja del despliegue y elige la spec 030 para ver sus commits, sus requisitos con prueba y los días hasta construida | El enlace al detalle de la spec en el tablero (`metrics-link`) |

Cuando se integre, el autor decide si reemplaza a la estación núcleo `de-spec-a-commit` de la 042 (P-4502).

## Evals

No usa modelo. Sus pruebas son unitarias sobre la derivación (clasificar estados, leer asuntos de commits, buscar ids
en pruebas), de contrato sobre `history.json` y el registro de evals, y una prueba con fuentes vacías (SC-4503).

## Supuestos

- Los commits siguen nombrando la spec entre paréntesis, como hoy (`feat(038): …`). Lo cumplen, por ejemplo, los
  últimos cinco commits de `dev` al 26 de noviembre de 2026.
- Vercel expone sus variables de sistema (`VERCEL_GIT_COMMIT_SHA`, `VERCEL_ENV`) en el build, como hace por defecto.
  No son variables nuevas que tenga que crear el autor.
- El `prebuild` sigue corriendo `vitest run` en cada build de Vercel, como hoy en `package.json`.
- El integrador tiene `gh` con la cuenta personal (CHERCED-DEV) para leer los despliegues. Si no, esa sección queda
  sin datos.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-4501 | ¿Cómo se llama la página y dónde vive? | «Tablero de ingeniería» / "Engineering dashboard" en `/{lang}/ingenieria`, enlazada desde la ruta y el sitemap |
| P-4502 | ¿El tablero reemplaza a la estación núcleo `de-spec-a-commit` de la ruta? | Sí, cuando se integre, porque muestra lo mismo con números |
| P-4503 | ¿Sumamos el reporte JSON de Vitest al `prebuild`? | Sí: es lo que vuelve verificable la franja del despliegue, y no agrega dependencias |
| P-4504 | ¿Se publica el gasto de IA? | Sí, el total y por proveedor frente al tope, sin desglose por visitante |
| P-4505 | ¿Cada cuánto se refresca el historial? | En cada push de ola, por el integrador, para no sumar despliegues |
| P-4506 | ¿Se muestran las mediciones de rendimiento? | Solo las que el integrador guarde de una corrida `fast` que ya iba a hacer, con fecha; nunca una corrida extra solo para el tablero |
