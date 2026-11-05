# Quickstart de la 004: la suite por niveles (T510)

Decisión del autor del 2026-11-04: una hora de e2e no es aceptable en el día a día. La suite se corre en tres niveles.
Cada nivel incluye al anterior, y ninguno borra pruebas: solo eligen cuáles corren.

| Nivel | Comando | Cuándo | Tiempo |
|---|---|---|---|
| Rápido | `npm run test:fast` | En cada cambio, en cada lane | 3 min 10 s, medido con build y con otras lanes corriendo en la máquina |
| Completo | `npm run test:full` | Antes de integrar una lane | Unos 12 min con la máquina libre (estimado; ver abajo) |
| Exhaustivo | `npm run test:exhaustive` | Solo antes de pasar a producción | Unos 50 min con la máquina libre (estimado) |

Cada lane usa su puerto, como siempre: `E2E_PORT=3117 npm run test:fast` en Bash, o `$env:E2E_PORT='3117'` antes del
comando en PowerShell.

### De dónde salen los tiempos

- **Rápido**: medido el 2026-11-05 con `E2E_REBUILD=1`, en un portátil de 4 núcleos con otras lanes trabajando.
  - Lint, 19 s; tipos, 19 s; unitarias, 14 s; build, unos 45 s.
  - El humo, 56 pruebas en unos 100 s.
  - Sin cambios desde el último build, reutiliza el build y tarda 2 min 25 s (medido con el último commit de P7).
- **Completo**: la única corrida, con P2 y P3 corriendo sus e2e al mismo tiempo, tardó 33 min 25 s.
  - Sumó 102 min de tiempo de prueba con un paralelismo efectivo de 3,2.
  - La auditoría de interacción (24 min) y el contraste de `l2` (18 min) eran casi la mitad. Con esos tiempos se
    recortó la selección (abajo), y quedan unos 77 min de tiempo de prueba: unos 24 min con esa carga.
  - La corrida exhaustiva de la 002 (40 min con la máquina libre) da el factor de carga, de unos 2×. Con la máquina
    libre son unos 12 min.
  - Al integrar, las e2e de P1 a P6 y las pruebas que hoy esperan (abajo) suman unos minutos.
  - Con la 006 integrada y los anchos de 375 y 412 px, la corrida del 2026-11-05 tardó 1 h 8 min, con la lane Q1
    corriendo sus e2e al mismo tiempo y la CPU al 100 %: 1395 pasaron y 23 fallaron.
- **Exhaustivo**: no se corrió. Son los 40 min de la 002 más lo nuevo de la 004: el contraste de los 15 casos (unos
  5 min), axe, humo y rendimiento.

## Qué corre cada nivel

Los tres empiezan con `npm run lint`, `npm run typecheck` y `npm test` (Vitest). Si alguno falla, no se llega a
Playwright.

**Rápido**: el humo de `tests/e2e/integration/smoke.spec.ts`, solo en `desktop-chromium`.

- Cada página pública en ES y EN (secciones, `/now`, los 15 casos y los posts) responde 200, tiene un solo `h1`
  visible, hidrata y no deja errores de consola ni excepciones.
- En `/es` y `/en`, cada enlace del header lleva a su sección con su `h1` y queda marcado, y el cambio de idioma
  funciona.

**Completo**: todas las e2e de los tres proyectos (`desktop-chromium`, `mobile-chromium` y `no-js`), con estas
selecciones:

- **Responsive**: la auditoría de `integration` revisa todas las páginas en 6 anchos clave: 320, 390, 768, 1024, 1440
  y 2560 px.
- **Barridos de 40 px**: no corren. Son `r2/responsive.spec.ts`, `r4/responsive-blog.spec.ts`, el del home de `r1`, el
  del carrusel de `r2` y el resto de la rejilla de `integration`.
- **Interacción**: corre en escritorio, en 6 páginas (`KEY_PAGES` en `tests/e2e/integration/support/pages.ts`): `/es`,
  `/en/aboutMe`, `/es/services`, `/es/portfolio/12`, `/es/contactMe` y `/en/now`.
  - "Volver arriba" corre en esas 6, en escritorio y en móvil.
  - Las tarjetas del blog, solo en ES.
- **Contraste**:
  - `l2` corre en 4 de sus 11 rutas: `/es`, Sobre mí, Servicios y el caso 1.
  - `integration` corre en el caso 12 y en `/es/now`, en escritorio.
- **Accesibilidad**: axe de los casos, Servicios y `/now`, solo en tema oscuro.
- **Rendimiento**: no corren la fluidez del fondo ni el INP con la CPU 4× más lenta, porque dependen de la carga de
  la máquina.

**Exhaustivo**: todo lo que existe, sin selección.

- Barridos cada 40 px de 320 a 2560 px.
- Interacción y "volver arriba" en todas las páginas, en escritorio y en móvil.
- Contraste en todas las rutas: las 11 de `l2`, más los 15 casos y `/now` (FR-446).
- Rendimiento, con la fluidez del fondo a 50 fps o más y el INP con la CPU 4× más lenta.

`npm run e2e`, o `npx playwright test` sin nivel, corre el nivel exhaustivo: es lo mismo que hasta hoy. Para correr
solo tus pruebas, pásale la carpeta: `npx playwright test tests/e2e/p3`.

### Móvil de la 006 (T851 a T854)

- **Anchos**: `mobile-375` (375 × 812) y `mobile-412` (412 × 915) se suman a `mobile-chromium` (390 × 844). Los dos
  nuevos solo corren `tests/e2e/integration/mobile-*.spec.ts`, así que las demás pruebas no se multiplican.
- **Tag `@anchos`**: en el nivel completo, `mobile-375` y `mobile-412` corren solo lo que lo lleva. Lo demás de los
  `mobile-*` corre en 390 px; en el exhaustivo, todo corre en los tres anchos.
- `mobile-patterns`: cada hoja (lóbulo, carta, embebido, paleta y asistente) con toque, teclado, Esc y arrastre; el
  mapa y el mazo solo con botones; sin JS; y, con movimiento reducido, nada que se mueva o quede en bucle (los
  fundidos de opacidad y color se permiten).
- `mobile-budgets`:
  - blur de 3 o menos en todas las páginas (13 en el completo, el resto en el exhaustivo);
  - animaciones nuevas solo con `transform` y `opacity` (FR-653), en 390 px:
    - un `@keyframes` nuevo solo puede tocar `transform`, `translate`, `scale`, `rotate` y `opacity`;
    - una transición nueva no puede tocar geometría (ancho, alto, márgenes, posición) ni filtros;
    - las transiciones de color, borde, sombra y la luz táctil de FR-601 se permiten y quedan anotadas;
    - las transiciones se leen declaradas, con las animaciones en pausa, para no depender del momento;
  - CLS < 0,1 con la CPU 4× más lenta en home, Sobre mí, Servicios y el caso 12, en los tres anchos;
  - INP < 200 ms con la CPU 4× más lenta, en 390 px: cuenta la espera y el procesamiento de cada interacción, y el
    pintado se anota (en Chromium sin GPU no es representativo).
- `mobile-targets`: 44 × 44 px o más en cada control nuevo, también con las hojas y el menú abiertos.
- `mobile-captures`: una captura por página, idioma y tema, adjunta al reporte. En el completo, las 6 páginas clave
  en oscuro.
- `desktop-regression`: en todas las páginas, a 1280 y 1440 px, nada de lo móvil se ve ni cambia el cristal.
- **Comparación con una base**: con `E2E_BASELINE_URL`, `desktop-regression` compara capturas píxel a píxel contra un
  build anterior a la 006, y `mobile-budgets` da por nuevas solo las animaciones que la base no tenía. Sin la
  variable, la comparación se salta y la regla de animaciones mira solo las piezas móviles de la 006.
  - Para levantar la base: `git archive 9e69236` en una carpeta temporal, `npm ci`, `next build` y
    `next start --port 3119`. 9e69236 es el último merge antes de M0.

## Cómo se elige el nivel

- `playwright.config.ts` lee `E2E_TIER` (`fast`, `full` o `exhaustive`).
  - Si no está, usa el nombre del script de npm (`npm_lifecycle_event`). Por eso los tres scripts de `package.json`
    tienen el mismo cuerpo.
  - Sin ninguno de los dos, el nivel es `exhaustive`.
- **Tag `@exhaustive`**: lo lleva una prueba que solo corre en el nivel exhaustivo, y el nivel completo la excluye con
  `grepInvert`.
  - Si una lane suma una prueba pesada, como un barrido de anchos, la marca con `test('…', { tag: '@exhaustive' }, …)`.
  - Las demás pruebas nuevas entran solas al nivel completo.
- **Pruebas congeladas de otras lanes**: no se tocan. El nivel completo las selecciona desde la configuración:
  - con `testIgnore`, los dos archivos de barridos;
  - con `grepInvert`, los otros dos barridos y las rutas de contraste fuera del subconjunto;
  - con un `grepInvert` propio de móvil y sin JS, lo que en el nivel completo solo corre en escritorio.

## Un solo build

- El servidor de las e2e corre `next build` y `next start`, sin el `prebuild` de npm: lint, tipos y unitarias ya
  corrieron antes.
- **Reutilizar el build**: si `.next/BUILD_ID` es más nuevo que todo lo que entra al build, no compila.
  - Lo que entra al build: `app`, `components`, `content`, `lib`, `public`, `styles`, `next.config.ts`, `proxy.ts`,
    `mdx-components.tsx`, `tsconfig.json`, `package-lock.json` y los `.env`.
  - Sirve también el build de `npm run verify`.
  - Al arrancar, Playwright dice si compiló o reutilizó.
- `E2E_REBUILD=1` obliga a compilar. Úsalo si copiaste archivos conservando su fecha.
- `E2E_REUSE_SERVER=1` usa un servidor que ya responde en `E2E_PORT` en vez de levantar otro. Por ejemplo, un
  `npx next start --port 3117` que dejaste abierto. Sin la variable, un puerto ocupado es un error, como hasta hoy.

## Pruebas que esperan a otra lane

Las auditorías de P7 están escritas contra la spec y los contratos, antes de que las demás lanes integren.

- **Se salta con motivo**: una prueba cuyo código todavía no existe dice
  `pendiente: <archivo> llega con <lane>; se audita al integrar`.
- **El criterio**: es la existencia del archivo de la lane, no la respuesta del servidor. En cuanto el archivo entra,
  la prueba es estricta.
- **Enlaces**: la auditoría de interacción no sigue un enlace a una ruta pendiente, como "Ahora" del footer a `/now`.
  Comprueba que se puede activar.
- **Al cerrar la integración (T502)**: la corrida no debe tener ningún "pendiente".

| Prueba | Espera a |
|---|---|
| `/now` en humo, responsive, interacción, contraste y axe | P1 (T422) |
| OG del home y de `/now` | P1 (T420, T423) |
| OG de Sobre mí, Servicios, Portafolio, los casos y Contacto | P2, P3, P4 y P5 |
| INP del terminal | P2 (T436) |
| Respuesta de reacciones | P5 (T477) |
| `/llms.txt` y herramientas WebMCP | P6 (T490, T493) |
