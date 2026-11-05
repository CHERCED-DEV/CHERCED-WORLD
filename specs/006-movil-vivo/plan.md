# Implementation Plan: Móvil vivo

**Branch**: `006-movil-vivo`. Se integra sobre `004-contenido-presente`. | **Date**: 2026-11-05 | **Spec**: [spec.md](./spec.md)

## Summary

La 006 le da al móvil la vida que ya tiene el escritorio, sin tocar el escritorio. Funciona con capas nuevas sobre los
tokens y el cristal de hoy:

- luz que sigue al dedo;
- un presupuesto de desenfoque;
- una hoja de cristal que sube desde abajo;
- barrido de luz y profundidad por scroll;
- háptica opcional;
- un dock flotante.

Con esas piezas vuelven el mapa cerebral (compacto, con hoja) y las cartas de carrera (mazo en la mano). Después, cada
página recibe su tratamiento.

Se trabaja en dos fases:

- **Fase 1** es el prototipo que el autor prueba en su celular: la base M0, el mapa compacto de P2 y el ajuste mínimo
  de P6 para el dock.
- **Fase 2**, con su visto bueno, trae el resto.

## Technical Context

**Language/Version**: TypeScript 5.9 (estricto), Sass y Node.js 22.

**Primary Dependencies**: las de hoy. **Cero dependencias nuevas.** Todo se hace con:

- CSS: scroll-driven animations dentro de `@supports`, `position: sticky`, scroll snap, `dvh` y `env(safe-area-inset-*)`;
- APIs del navegador: Pointer Events, `IntersectionObserver`, `visualViewport`, `navigator.vibrate` y `<dialog>`
  nativo;
- la infraestructura de `lib/fx` que ya existe.

**Storage**: ninguno.

**Testing**: Vitest 5 para la lógica de `lib/fx`: luz táctil, umbral del gesto, dirección del scroll y háptica.
Playwright 1.64 con axe:

- el proyecto `mobile-chromium` que ya existe (390 × 844, con toque);
- viewports de 375 y 412 px;
- temas oscuro y claro;
- los proyectos `no-js` y de movimiento reducido.

WebKit queda fuera salvo P-603.

**Target Platform**: el proyecto de Vercel que ya existe. Móviles: Chrome Android y Safari iOS de las últimas 2
versiones.

**Project Type**: aplicación web en un solo proyecto Next.js.

**Performance Goals / presupuestos** (spec §SC):

- **Blur**: como máximo 3 superficies con `backdrop-filter` visibles a la vez en `< md`.
- **Interacción**: INP < 200 ms y CLS < 0,1 en un Android de gama media.
- **Animaciones**: solo `transform` y `opacity`. Nada de animar `top`, `height`, `filter` ni `backdrop-filter`.
- **Lluvia en móvil**: 12 fps o menos y la mitad de columnas o menos.
- **Fondo**: sigue a 50 fps o más (002, SC-205). D1: no se toca.

**Constraints**:
- Ningún cambio fuera de `< md`, `(hover: none)` o `(pointer: coarse)`, salvo los que la spec dice que aplican a
  todos.
- Respaldo sin JS y con movimiento reducido para todo lo nuevo.

**Scale/Scope**: 9 páginas públicas × 2 idiomas, 6 patrones y 2 fases.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Verificación | Estado |
|---|---|---|
| I. Evolución, no reemplazo | Todo es aditivo y vive en `< md`. Escritorio, rutas, piezas firma y contenido no cambian. Las enmiendas EM-01 a EM-03 cambian decisiones de la 002 solo en móvil y conservan sus respaldos | ✅ |
| II. Glass sobre movimiento | El presupuesto de 3 superficies con blur mantiene la fluidez. Respaldo sólido con transparencia reducida. Todo lo nuevo se apaga con movimiento reducido. La lluvia móvil se pausa fuera de pantalla | ✅ |
| III. Seguridad real | Sin entradas ni datos nuevos | ✅ |
| IV. Contenido como datos | Sin contenido nuevo, salvo etiquetas ES y EN de controles en `content/i18n`, sumadas como enmienda de P0 | ✅ |
| V. Rendimiento y accesibilidad | INP, CLS, objetivos de 44 px, foco atrapado en hojas, alternativa con botón a cada gesto y teclado en todo | ✅ |
| VI. Calidad verificable | `npm run verify` y e2e por lane. Capturas móviles y de escritorio para la no regresión. Suite completa 3 veces en verde | ✅ |
| VII. Propiedad exclusiva | M0 toma la base. Las tareas por página van a la lane que ya es dueña de esa ruta en la 004. FloatMenu pasa a P6 por enmienda (EM-04) | ✅ |
| VIII. Simplicidad operativa | Sin dependencias, servicios ni variables | ✅ |

## Cambios por archivo

| Archivo | Cambio | Lane | Fase |
|---|---|---|---|
| `styles/tokens.scss` | Blur de `< md` (10 y 16 px); tokens de barrido (duración y ángulo) y de profundidad (niveles y desfase máximo) | M0 | 1 |
| `styles/_glass.scss` | `$-touch-light-query` para `(pointer: coarse)` sin movimiento reducido; mixins `glass-sweep` y `glass-float($level)`; regla de presupuesto: en `< md`, el blur real solo con `[data-cw-blur]` | M0 | 1 |
| `styles/_layout.scss` | Espacio inferior cuando el dock está activo (`:root[data-cw-dock]`) | M0 | 1 |
| `lib/fx/pointer-light.ts` | Fuente táctil: `pointerdown` y `pointermove` con `touch` bajo la media táctil, `data-cw-touching` en el host y desvanecimiento al soltar | M0 | 1 |
| `lib/fx/reveal.ts` | Respaldo de una vez para el barrido, sin `animation-timeline` | M0 | 1 |
| `lib/fx/haptics.ts` (nuevo) | `tap()`: `navigator.vibrate?.(8)` sin movimiento reducido | M0 | 1 |
| `lib/fx/swipe.ts` (nuevo) | Gesto horizontal con umbral, que cede al scroll vertical | M0 | 1 |
| `lib/fx/viewport.ts` (nuevo) | Dirección del scroll y teclado abierto (`visualViewport`) | M0 | 1 |
| `components/ui/BottomSheet.tsx` y `.module.scss` (nuevos) | Hoja sobre `<dialog>` nativo, con agarradera, arrastre y `safe-area` | M0 | 1 |
| `components/ui/Dialog.tsx` y `.module.scss` | Prop opcional `mobileSheet`: en `< md` se presenta como hoja. Los consumidores que no la piden no cambian | M0 | 1 |
| `components/ui/FormField.tsx` y `.module.scss` | Variante opcional `floating` | M0 | 1 |
| `components/ui/GlassSurface.tsx` | Props opcionales `sweep`, `float` y `blur` | M0 | 1 |
| `components/shell/Dock.tsx` y `Dock.module.scss` (nuevos) | El dock de FR-607 | M0 | 1 |
| `components/shell/SiteHeader.tsx` y `.module.scss` | Montar el dock. En `< md` con dock, ocultar menú, paleta y tema del header. El buzón se queda | M0 | 1 |
| `components/experience/ExperienceClient.module.scss` | Ocultar el botón flotante del asistente en `< md` cuando hay dock | P6 | 1 |
| `components/site/about/BrainMap.tsx`, `BrainScene.tsx`, `Brain.module.scss`, `rain.ts` y `brain.ts` | Mapa radial compacto, hoja del lóbulo, deslizar, lluvia móvil y estático con movimiento reducido | P2 | 1 |
| `components/site/about/CareerDeck.tsx`, `deck.ts` y `About.module.scss` | Mazo en la mano bajo 992 px | P2 | 2 |
| `components/site/about/SceneNav.tsx`, `AboutFigures.tsx` y `AboutPortrait.tsx` | Puntos de progreso, figuras 2×2 flotantes y barrido del retrato | P2 | 2 |
| `components/site/HomeBanner.tsx`, `components/site/home/HomeNow.tsx`, `ScrollCue.tsx` y `Home.module.scss` | Barrido inicial, tarjetas flotantes y respiración | P1 | 2 |
| `components/site/services/ServicesView.tsx`, `ServiceCard.tsx`, `ServiceProcess.tsx` y `Services.module.scss` | Pila sticky y verificación del giro y de la línea de "Cómo trabajo" en móvil | P3 | 2 |
| `components/site/portfolio/ProjectsExplorer.tsx`, `carousel.ts`, `Portfolio.module.scss`, `CaseGallery.*`, `CaseStudy.*` y `ProjectEmbed.*` | Asomo, puntos, filtros sticky, galería deslizable, ADR apiladas y embebido en hoja | P4 | 2 |
| `components/contact/ContactForm.tsx` y `.module.scss` | Etiqueta flotante y luz al enfocar | P5 | 2 |
| `components/experience/CommandPalette.tsx`, `Assistant.tsx` y sus `.module.scss` | `mobileSheet` y `visualViewport` | P6 | 2 |
| `components/shell/FloatMenu.tsx` y `.module.scss` | Cascada de 30 a 40 ms. Pasa a P6 por EM-04 | P6 | 2 |
| `content/i18n/{es,en}/common.json` y `site.json` | Etiquetas del dock, de la hoja, del mazo y de los puntos | Enmienda de P0 (A-601) | 1 y 2 |
| `playwright.config.ts` y `tests/e2e/integration/**` | Viewports 375 y 412 px, auditorías móviles y no regresión de escritorio | P7 | 2 |

## Lanes

| Lane | Rutas en la 006 | Puerto e2e | Fase |
|---|---|---|---|
| **M0** Base móvil (nueva) | `styles/**`, `lib/fx/**`, `components/ui/**` (nuevos y las props opcionales de arriba), `components/shell/Dock*` y `components/shell/SiteHeader*`, `tests/unit/m0/**`, `tests/e2e/m0/**` y `specs/006-movil-vivo/contracts-m0.md` | 3118 | 1 |
| **P1** Home | Sus rutas de la 004 | 3111 | 2 |
| **P2** Sobre mí | Sus rutas de la 004 (`app/[lang]/aboutMe/**` y `components/site/about/**`) | 3112 | 1 (mapa) y 2 |
| **P3** Servicios (se reabre) | Sus rutas de la 004 | 3113 | 2 |
| **P4** Portafolio y casos | Sus rutas de la 004 | 3114 | 2 |
| **P5** Contacto | `components/contact/**` y `app/[lang]/contactMe/**` | 3115 | 2 |
| **P6** Asistente, paleta y menú | `components/experience/**` más `components/shell/FloatMenu*` (EM-04) | 3116 | 1 (botón del asistente) y 2 |
| **P7** QA | `tests/e2e/integration/**` y `playwright.config.ts` | 3117 | 2 |

**El blog no tiene lane en la 006.** La 005 es la dueña planeada de `components/blog/**` y de `app/[lang]/blog/**`, y
va a rehacer el índice, las tarjetas y la página del post. Una lane de la 006 sobre esas rutas chocaría con ella. La 006
entrega los patrones y la 005 los adopta (abajo).

**Orden**:

1. M0 arranca ya (P0 de la 004 está congelada) y congela con `m0-frozen` y `contracts-m0.md`.
2. P2 suma sus tareas de la fase 1 cuando cierra las suyas de la 004 (al menos el terminal, T436, porque la hoja del
   lóbulo lo contiene).
3. El orquestador integra M0 → P6 (fase 1) → P2 (fase 1) en `004-contenido-presente` y despliega la vista previa.
4. La fase 2 arranca solo con el visto bueno del autor (SC-608), en el orden M0 (ajustes) → P2 → P6 → P3 → P4 → P1 →
   P5 → P7.

## Contratos de M0 (se congelan en `contracts-m0.md`)

| Contrato | Forma |
|---|---|
| Luz táctil | Sin API nueva: toda superficie con `light` (o `[data-cw-light]`) la recibe. `data-cw-touching` mientras hay toque |
| Presupuesto de blur | `<GlassSurface blur>` o `[data-cw-blur]` marca una de las 3 superficies con desenfoque real en `< md`. El resto usa el sólido |
| `BottomSheet` | `{ open, onClose, labelledBy, children, onSwipe?: (dir: 'prev' \| 'next') => void, initialFocus? }`. Devuelve el foco al disparador |
| `Dialog mobileSheet` | El mismo `Dialog` de hoy. Con `mobileSheet`, en `< md` se ve y se cierra como `BottomSheet` |
| Barrido y profundidad | `<GlassSurface sweep float={1 \| 2 \| 3}>` o los mixins `glass-sweep` y `glass-float($level)` |
| Háptica | `tap()` de `lib/fx/haptics.ts` |
| Gesto | `useSwipe(ref, { onPrev, onNext, threshold })` de `lib/fx/swipe.ts` |
| Viewport | `useScrollDirection()` y `useKeyboardOpen()` de `lib/fx/viewport.ts` |
| Dock | Montado por `SiteHeader`. Emite `cw:open-palette` y `cw:open-assistant` (`lib/events.ts`) y abre el menú por `popover`. `:root[data-cw-dock]` está presente cuando el dock existe |
| `FormField floating` | Prop opcional: la etiqueta flota con foco o con valor, y sigue asociada con `htmlFor` |

## Enmiendas

| ID | Cambio | Dueño original | Ejecuta |
|---|---|---|---|
| A-601 | Etiquetas nuevas ES y EN en `common.json` (dock, hoja: "Cerrar", "Anterior" y "Siguiente") y en `site.json` (contador del mazo y puntos de escena) | 004 P0 (congelada) | El orquestador, como enmienda de contenido antes de `m0-frozen` |
| A-602 | M0 toma `styles/**`, `lib/fx/**`, `components/ui/**`, `components/shell/Dock*` y `components/shell/SiteHeader*` | 002 R0 y 004 P0 | Registro del orquestador (EM-04) |
| A-603 | `components/shell/FloatMenu*` pasa a P6 | 004 P0 | Registro del orquestador (EM-04) |

## Entrega a la 005 (blog)

La 006 no toca el blog. Al planear las tareas de la 005, el orquestador agrega a sus lanes:

- **Q1**: `PostCard` con portada y `GlassSurface float={1}`.
- **Q2**:
  - el índice "En este post" como botón flotante que abre un `BottomSheet` en `< xl`. Hoy, bajo `xl`, queda como
    bloque al principio del post (verificado);
  - la barra de progreso integrada al header en `< md`. Esto pide una enmienda de M0 sobre `SiteHeader`.

## Decisiones técnicas

| ID | Decisión | Alternativa descartada |
|---|---|---|
| R-601 | **Presupuesto de blur por opt-in.** En `< md`, `glass()` usa el sólido salvo con `[data-cw-blur]`. El header, el dock, la hoja abierta y la tarjeta activa del mapa llevan la marca. Una prueba cuenta los elementos visibles con `backdrop-filter` distinto de `none` | Medir y apagar el blur en tiempo real con JS: más caro y frágil |
| R-602 | **Hoja sobre `<dialog>` nativo** (`showModal`): foco atrapado, Esc e inercia del fondo sin código propio. El arrastre se hace con Pointer Events sobre la agarradera y `transform` | Una hoja con `div` y trampa de foco propia: más código y más riesgo de accesibilidad |
| R-603 | **Barrido y profundidad CSS-first** con `animation-timeline: view()` dentro de `@supports`. El barrido tiene respaldo de una vez con `IntersectionObserver` (`lib/fx/reveal.ts`). La profundidad no tiene respaldo: sin soporte queda quieta, sin JS | Animar con listeners de scroll: viola el presupuesto de INP |
| R-604 | **Luz táctil**: la misma variable que el mouse (`--cw-mx` y `--cw-my`) y una opacidad con `data-cw-touching`, con un solo listener pasivo y `requestAnimationFrame`, como hoy | Un mixin nuevo: duplica `glass-light` |
| R-605 | **Mapa compacto**: el mismo SVG de escritorio con otra disposición (cuadrado 1:1 y lóbulos en círculo), calculada en `brain.ts` desde los 6 lóbulos de T229 | Un componente aparte para móvil: duplica datos y lógica |
| R-606 | **Lluvia móvil**: el mismo `rain.ts` con parámetros por ancho (columnas ÷ 2, 12 fps), en pausa fuera de pantalla | Una imagen estática: pierde la vida que pidió el autor |
| R-607 | **WebKit fuera de Playwright** por ahora (P-603). Safari se valida en el celular del autor | Instalar WebKit: es una descarga que conviene pedir aparte |

## Complexity Tracking

Sin violaciones que justificar.
