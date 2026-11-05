# Contrato M0: base móvil de la 006

**Dueño**: M0 · **Estado**: congelado en el tag `m0-frozen` · **Base**: [contracts-r0.md de la
002](../002-refinamiento-impoluto/contracts-r0.md), [contracts-p0.md de la 004](../004-contenido-presente/contracts-p0.md),
[spec.md](./spec.md) y [plan.md](./plan.md)

**Tag**: `m0-frozen` apunta al último commit de `lane/M0`, con `npm run verify` y las e2e de r0, p0 y m0 en verde.

Todo lo de la 001, la 002 y la 004 sigue vigente. M0 agrega capas que solo actúan en `< md` (767,98 px), con
`(pointer: coarse)` o con atributos que el escritorio no tiene. **En escritorio nada cambia**: `glass()` emite lo mismo,
`GlassSurface` sin las props nuevas se renderiza igual y el header conserva su orden y sus medidas
(`tests/unit/r0/*`, `tests/unit/m0/*` y `tests/e2e/m0/desktop-regression.spec.ts`). Las lanes P2, P6 y la 005 programan
contra este documento. Si falta algo, se pide como enmienda a M0.

## 1. Tokens nuevos (`styles/tokens.scss`)

### Compartidos (`:root`)

| Grupo | Tokens | Uso |
|---|---|---|
| Blur móvil | `--cw-glass-standard-blur-sm` 10px · `--cw-glass-strong-blur-sm` 16px | En `< md`, `--cw-glass-standard-blur` y `--cw-glass-strong-blur` toman estos valores (P-604). `subtle` se queda en 8px. |
| Luz táctil | `--cw-touch-fade` 300ms | Lo que tarda en apagarse el destello del borde al soltar. |
| Barrido | `--cw-sweep-duration` 700ms · `--cw-sweep-angle` 115deg · `--cw-sweep-edge` 1,5px | Duración del respaldo de una vez, ángulo de la franja y grosor del anillo que recorre. |
| Profundidad | `--cw-float-1` 4px · `--cw-float-2` 8px · `--cw-float-3` 12px | Desfase máximo de cada nivel, hacia arriba y hacia abajo. |
| Hoja | `--cw-sheet-duration` 300ms · `--cw-sheet-gap` (`max(2.5rem, safe-area-top + 1rem)`) · `--cw-sheet-radius` 24px | La hoja mide como máximo `100dvh − gap − teclado`. |
| Dock | `--cw-dock-button` 44px · `--cw-dock-pad` 6px · `--cw-dock-h` (56px) · `--cw-dock-offset` 12px · `--cw-dock-space` · `--cw-dock-duration` 260ms · `--cw-z-dock` 150 | `--cw-dock-space` = alto del dock + 2 × margen + `safe-area-inset-bottom` (80px sin área segura). Es el espacio que se reserva abajo. |

### Por tema (`dark-theme` y `light-theme`, los dos definen los mismos)

| Token | Oscuro | Claro | Uso |
|---|---|---|---|
| `--cw-glass-{subtle,standard,strong}-tint` | negro 0,55 / 0,65 / 0,78 | blanco 0,6 / 0,7 / 0,82 | Copia exacta del fondo translúcido de la 001. Lo usa el presupuesto para devolverle el cristal a lo marcado. |
| `--cw-glass-sweep` | blanco 0,9 | negro 0,38 | Centro de la franja del barrido (con `--cw-glass-spot-accent` a los lados). |
| `--cw-sheet-scrim` | negro 0,55 | negro 0,32 | Fondo de `::backdrop` de las hojas. Sin desenfoque. |

## 2. Presupuesto de blur (FR-602, R-601)

En `< md` hay **como máximo 3 superficies con `backdrop-filter` a la vista**: el header o el dock, la hoja abierta y la
tarjeta activa.

- **Por defecto, sólido.** En `< md`, `--cw-glass-*-bg` pasan al fondo sólido de cada tema y una regla global quita el
  `backdrop-filter` (`!important`) a todo elemento que no sea:
  - `[data-cw-blur]`;
  - `dialog[open]` (diálogos y hojas abiertos);
  - `:popover-open` (el menú y otros popovers abiertos).
  
  Lo que queda sin desenfoque conserva borde, grano, profundidad y luz: es el mismo respaldo sólido que ya se usaba con
  transparencia reducida, y que `tests/unit/r0/glass-budget.test.ts` ya cubre en contraste.
- **Marcar una superficie**: `<GlassSurface blur>` o `data-cw-blur=""`. La marca devuelve el tinte translúcido (a ella y
  a sus hijos) y el desenfoque real. **Úsala solo en lo que cuenta para el presupuesto**: P2 la pone en la tarjeta activa
  del mapa, y ya la llevan el header, el dock y las hojas.
- **Transparencia reducida y navegadores sin blur**: lo marcado también vuelve al sólido.
- **Escritorio**: sin cambios. La marca no hace nada en `≥ md`.
- **Desenfoque en un pseudo-elemento**: `@include glass-backdrop($variant)` emite solo el `backdrop-filter`. El header
  (en `< md` con JS) y el dock lo usan en `::before` para no convertirse en bloque contenedor de sus hijos `fixed`. La
  regla global no toca pseudo-elementos: cuéntalos tú si los usas.
- `tests/e2e/m0/blur-budget.spec.ts` recorre 12 páginas a 375 px de arriba abajo y cuenta elementos y pseudo-elementos
  visibles con un `backdrop-filter` distinto de `none` y de `blur(0px)`.

## 3. Mixins Sass

| Mixin | Archivo | Qué emite |
|---|---|---|
| `glass($variant)` | `_glass.scss` | **Sin cambios.** |
| `glass-light` | `_glass.scss` | Suma la regla táctil: con `(pointer: coarse) and (prefers-reduced-motion: no-preference)`, `&[data-cw-touching]` lleva `--cw-light-x/y` a `--cw-mx/my` y `--cw-spot-mix` a 1. El hover de mouse sigue igual. |
| `glass-edge` | `_glass.scss` | En táctil, el destello se apaga en `--cw-touch-fade`. |
| `glass-backdrop($variant)` | `_glass.scss` | Solo el `backdrop-filter` de la variante (para `::before`). |
| `glass-sweep` | `_glass.scss` | Pinta la **capa** del barrido (no el host): anillo enmascarado de `--cw-sweep-edge`, franja diagonal en `::before` que se mueve solo con `transform`. Oculta en escritorio y con movimiento reducido. En `< md` usa `view-timeline` dentro de `@supports (animation-timeline: view())`; sin soporte, anima una vez cuando la capa recibe `data-cw-sweep="in"`. `globals.scss` ya lo aplica a `[data-cw-sweep]`. |
| `glass-float($level)` | `_glass.scss` | Niveles 1, 2 y 3. En `< md`, sin movimiento reducido y con `animation-timeline: view()`, anima `translate` de `+n` a `−n` px (`--cw-float-n`) mientras la tarjeta cruza el viewport. Sin soporte, la tarjeta queda quieta. Otro nivel lanza error. `globals.scss` lo aplica a `[data-cw-float="1|2|3"]`. |
| `glass-budget` | `_glass.scss` | La regla global de §2. Solo la incluye `globals.scss`. |
| `sheet-panel`, `sheet-entry($selector)`, `sheet-grip` | `_sheet.scss` | Anclaje abajo, `100dvh`, áreas seguras, transición de `transform` y `opacity`, `@starting-style`, cierre por `data-state="closing"`, arrastre por `--cw-sheet-drag` y fundido con movimiento reducido. Los usan `BottomSheet` y `Dialog mobileSheet`. |
| `dock-space` | `_layout.scss` | Con `:root[data-js]` en `< md`: `body { padding-bottom: --cw-dock-space }` y `scroll-padding-bottom`. Solo la incluye `globals.scss`. |

Reglas:

- `glass-float` usa la propiedad individual `translate`, no `transform`: así no pisa el `transform` de `Reveal`, del hover
  ni de la pulsación.
- `glass-sweep` y `glass-float` traen sus `@keyframes`. Dentro de un `.module.scss` los nombres se localizan solos.

## 4. Luz táctil (`lib/fx/pointer-light.ts`, EM-01)

| Export | Forma |
|---|---|
| `startTouchLight(env = window)` | Igual que `startPointerLight`: cuenta usuarios y nunca registra más de un juego de listeners. Devuelve la función que lo suelta. |
| `TOUCH_LIGHT_QUERY` | `'(pointer: coarse) and (prefers-reduced-motion: no-preference)'` |
| `TOUCHING_ATTRIBUTE` | `'data-cw-touching'` |

- **No hay API nueva para las superficies**: todo `[data-cw-light]` (o `GlassSurface light`) recibe la luz táctil.
- `pointerdown` táctil y primario escribe `--cw-mx` y `--cw-my` en el `[data-cw-light]` más cercano y en sus ancestros
  `[data-cw-light]`, y les pone `data-cw-touching`. `pointermove` actualiza en un `requestAnimationFrame`.
  `pointerup` y `pointercancel` quitan el atributo, y el CSS lo desvanece en unos 300 ms. Cuando el navegador toma el
  gesto para hacer scroll (`pointercancel`), el reflejo se apaga.
- `PointerLight` (montado una vez en el layout) arranca las dos fuentes. `startPointerLight` no cambió: sigue ignorando
  el toque (`tests/unit/r0/fx.test.ts`).
- Una tablet con mouse y puntero principal fino no activa la luz táctil.

## 5. Barrido y profundidad (`GlassSurface`, FR-604 y FR-605)

```tsx
<GlassSurface as="article" variant="standard" edge grain depth light sweep float={2}>…</GlassSurface>
```

| Prop | Tipo | Efecto |
|---|---|---|
| `sweep` | `boolean` | Agrega `<Sweep />` como **último hijo**: `<span aria-hidden="true" data-cw-sweep="">`. El host necesita `position` distinta de `static` y `border-radius` (`GlassSurface` ya es `relative`). No lo uses con `as="ul"` ni `as="ol"`. |
| `float` | `1 \| 2 \| 3` | `data-cw-float="n"`. |
| `blur` | `boolean` | `data-cw-blur=""` (§2). |

- `glassMotionAttributes({ float, blur })` devuelve los atributos para quien no usa el componente.
- Sin el componente: pon `<Sweep />` (de `components/ui`) dentro del host y `data-cw-float="n"` en la tarjeta.
- `observeSweep(element, env = window)` (`lib/fx/reveal.ts`) es el respaldo de una vez: con soporte de
  `animation-timeline` o con movimiento reducido no hace nada; si no, un `IntersectionObserver` con umbral 0,35 pone
  `data-cw-sweep="in"` y deja de observar. `Sweep` ya lo llama.

## 6. Háptica (`lib/fx/haptics.ts`, FR-606)

`tap(env = window): boolean` llama `navigator.vibrate(8)` una vez, solo si la API existe y no hay movimiento reducido.
Nunca lanza errores: sin API, sin `window`, bloqueada o con movimiento reducido devuelve `false`. Llámalo en el handler
del toque que elige (lóbulo, carta), no en `pointerdown`.

## 7. Gesto horizontal (`lib/fx/swipe.ts`, FR-610)

| Export | Forma |
|---|---|
| `useSwipe(ref, { onPrev?, onNext?, onMove?, onEnd?, threshold? = 48, enabled? = true })` | Hook. Deslizar a la izquierda es `next` y a la derecha, `prev`. |
| `attachSwipe(element, options)` | La versión imperativa; devuelve la función que suelta los listeners. |
| `swipeAxis(dx, dy, slop = 10)` | `'x' \| 'y' \| null` |
| `swipeResult(dx, dy, threshold = 48)` | `'prev' \| 'next' \| null`: pide el umbral y que el gesto sea más horizontal que vertical. |
| `SWIPE_THRESHOLD`, `SWIPE_SLOP`, tipo `SwipeDirection` | |

- Pone `touch-action: pan-y` en el elemento si no traía uno, y lo quita al soltar. Si el gesto es más vertical, gana el
  scroll de la página.
- Tras un deslizamiento se traga el `click` que le sigue: tocar sigue siendo tocar.
- **Todo gesto necesita su botón** (FR-652). `BottomSheet` ya los trae (§9).

## 8. Viewport (`lib/fx/viewport.ts`)

| Export | Forma |
|---|---|
| `useScrollDirection()` | `'up' \| 'down'`. Un solo listener pasivo compartido, agrupado en un cuadro, con umbral de 12 px y "subir" siempre en los primeros 64 px. |
| `useKeyboardInset()` | Píxeles que el teclado del sistema le quita al viewport (`visualViewport`). 0 en el servidor. |
| `useKeyboardOpen()` | `true` desde 120 px. |
| `useMediaQuery(query, serverValue = false)` | Con `useSyncExternalStore`. |
| `nextScrollState`, `keyboardInset`, `isKeyboardOpen`, `createScrollDirectionStore`, `createKeyboardInsetStore` | Las funciones puras y los stores, para pruebas. |

## 9. `BottomSheet` (`components/ui/BottomSheet.tsx`, FR-603, R-602)

```tsx
<BottomSheet
  open={open}
  onClose={() => setOpen(false)}
  labelledBy="lobe-sheet-title"
  title={lobe.name}
  closeLabel={labels.close}
  onSwipe={(direction) => setIndex(step(direction))}
  navLabels={{ prev: labels.prev, next: labels.next }}
  counter={`${index + 1} / ${lobes.length}`}
>
  …
</BottomSheet>
```

| Prop | Tipo | Notas |
|---|---|---|
| `open`, `onClose` | `boolean`, `() => void` | Controlado. `onClose` llega por arrastre, Esc, "Cerrar" o un toque en el fondo; el padre pone `open={false}` y la hoja anima la salida antes de cerrar. |
| `labelledBy` | `string` | Obligatorio. Con `title`, la hoja pinta `<h2 id={labelledBy} tabIndex={-1}>`; sin `title`, pon tú un elemento con ese `id` dentro de `children`. |
| `closeLabel` | `string` | Nombre accesible del botón "Cerrar" (`dialog.close` de `common`). |
| `title?` | `ReactNode` | |
| `describedBy?` | `string` | |
| `onSwipe?` | `(direction: 'prev' \| 'next') => void` | Activa el deslizamiento horizontal en el cuerpo. |
| `navLabels?` | `{ prev, next }` | Con `onSwipe`, pinta los botones "Anterior" y "Siguiente" (44 px o más). |
| `counter?` | `ReactNode` | Entre los dos botones, con `aria-live="polite"`. |
| `initialFocus?` | `RefObject<HTMLElement \| null>` | Por defecto, el foco va al título (o al elemento `labelledBy`). |
| `className?`, `bodyClassName?` | `string` | |

Comportamiento:

- `<dialog>` nativo con `showModal()`: `aria-modal="true"`, el resto queda inerte y el foco queda atrapado. Al cerrar, el
  foco vuelve al control que la abrió.
- Lleva `data-cw-sheet`, `data-cw-glass="strong"` y `data-cw-blur`: cristal `strong` con grano, profundidad y borde.
- Sube con `transform` en 300 ms (`@starting-style`) y baja con `data-state="closing"`. Con movimiento reducido entra y
  sale con un fundido de `opacity`, sin desplazamiento.
- **Arrastre**: la zona de arriba (agarradera y título, `[data-cw-sheet-drag]`, `touch-action: none`) sigue al dedo con
  `--cw-sheet-drag`. Cierra al pasar `min(120 px, 25 % del alto)` o con un tirón rápido (0,6 px/ms y 24 px); si no,
  vuelve a su sitio. Los botones de esa zona no arrancan arrastre. `shouldDismissSheet` y `attachSheetDrag` están en
  `lib/fx/sheet.ts`.
- **Medidas**: en `< md` ocupa el ancho completo; desde `md`, hasta 640 px centrada. Su alto máximo es
  `100dvh − --cw-sheet-gap − teclado`, el cuerpo (`[data-cw-sheet-body]`) hace scroll por dentro con
  `overscroll-behavior: contain` y el relleno respeta `env(safe-area-inset-*)`. Con el teclado abierto sube lo que mide
  el teclado (`--cw-keyboard-inset`).
- En `< md`, con una hoja abierta, la página de atrás no se desplaza y el dock se aparta.
- Atributos para pruebas: `data-cw-sheet`, `data-cw-sheet-drag`, `data-cw-sheet-close`, `data-cw-sheet-body`,
  `data-cw-sheet-nav`, `data-cw-sheet-prev` y `data-cw-sheet-next`.

## 10. `Dialog mobileSheet` (T811)

`<Dialog mobileSheet …>`: el mismo `Dialog` de hoy. Con la prop, en `< md`:

- se ancla abajo, a todo el ancho, con la misma presentación de `sheet-panel` y una agarradera
  (`[data-cw-sheet-drag]`) que cierra arrastrando;
- Esc y el toque en el fondo cierran como antes;
- en `≥ md` se ve como el diálogo centrado de siempre. Rotar el teléfono no remonta el contenido.

Sin la prop, el marcado es idéntico al de la 004. En `< md`, **todos** los `::backdrop` de `Dialog` dejan de desenfocar
(presupuesto); el diálogo abierto sí desenfoca.

## 11. `FormField floating` (FR-609)

`<FormField floating label="Correo">…</FormField>`:

- solo actúa en `< md` con JS: la etiqueta se pone dentro del campo y flota arriba (con `transform`) al enfocar o
  cuando hay valor;
- `htmlFor`, `aria-describedby` y el error se anuncian igual;
- si el `input` o el `textarea` no traen `placeholder`, recibe uno neutro (`" "`) para que el CSS sepa si está vacío. Un
  placeholder propio se oculta hasta enfocar;
- `select` siempre lleva la etiqueta arriba. Con `inline` no hace nada. Sin JS y en escritorio, la etiqueta queda donde
  estaba.

## 12. Dock (`components/shell/Dock.tsx`, FR-607, FR-608, EM-05)

**El dock son los mismos controles del header**, reubicados en `< md` con JS. No hay botones duplicados: `[data-cw-menu-button]`,
`[data-cw-palette-trigger]` y `[data-cw-theme-toggle]` siguen siendo únicos y siguen dentro de `header#header`.

- `SiteHeader` monta `<Dock>` alrededor de búsqueda, `DockAssistant`, idioma, buzón, tema y menú. En escritorio y sin
  JS el envoltorio es `display: contents`, así que el header se ve y se recorre igual que en la 004.
- En `< md` con `:root[data-js]` (desde el primer pintado, sin saltos): una píldora de cristal `strong`
  (`[data-cw-dock-bar]`, con `data-cw-blur`) fija abajo al centro con **búsqueda, asistente, tema y menú**, de 44 × 44 px
  y en ese orden (el mismo del DOM y del Tab).
- **Idioma** sigue oculto bajo `lg`, como hoy. **El buzón** se queda arriba a la derecha, en la franja del header (EM-05).
- `DockAssistant` (`[data-cw-dock-assistant]`, `aria-haspopup="dialog"`) emite `cw:open-assistant`. Solo se ve en el
  dock. El menú abre el `popover` que ya existe; la búsqueda emite `cw:open-palette`; el tema, `cw:theme-change`.
- `:root[data-cw-dock]` existe mientras el dock está activo (`< md` con JS): vale `shown` o `hidden`. Se esconde
  (`hidden`) al bajar y vuelve al subir; también con el teclado del sistema abierto. Con movimiento reducido no se mueve
  con el scroll.
- Además se aparta (con `translate`, sin tocar el atributo) mientras la intro está activa y mientras hay un
  `dialog[open]`. Si el foco está dentro del dock, no se esconde.
- `body` reserva abajo `--cw-dock-space` y los toasts suben esa misma distancia: nada queda debajo del dock.
- `dockState(direction, keyboardOpen, reducedMotion)` y `DOCK_ATTRIBUTE` se exportan para pruebas.

**P6 (T818)**: oculta el botón flotante del asistente con
`:global(:root[data-cw-dock]) .fab { display: none }` dentro de `bp.down(md)` en `ExperienceClient.module.scss`. Hasta
entonces se ve al lado del dock. Las e2e de L5 que hacen clic en `[data-cw-assistant-button]` en móvil deben pasar a
`[data-cw-dock-assistant]`.

## 13. Textos (FR-655, A-601)

M0 **no necesitó claves nuevas**: el dock reutiliza `menu.open`, `palette.open`, `theme.dark` (de `common`) y
`assistant.open` (de `experience`, con `sharedText`). `BottomSheet` recibe sus textos por props (`closeLabel`,
`navLabels`); `common` ya tiene `dialog.close`. Si P2 necesita "Anterior", "Siguiente" o el contador en `site.json`,
eso sigue siendo la enmienda A-601 del orquestador.

## 14. Atributos `data-cw-*` nuevos

`data-cw-blur`, `data-cw-touching`, `data-cw-sweep` (`""` o `in`), `data-cw-float` (`1`, `2`, `3`), `data-cw-sheet`,
`data-cw-sheet-drag`, `data-cw-sheet-close`, `data-cw-sheet-body`, `data-cw-sheet-nav`, `data-cw-sheet-prev`,
`data-cw-sheet-next`, `data-cw-floating`, `data-cw-dock-bar`, `data-cw-dock-assistant` y, en `:root`, `data-cw-dock`
(`shown` o `hidden`).

## 15. Pruebas que protegen este contrato

| Prueba | Qué cuida |
|---|---|
| `tests/unit/m0/pointer-light-touch.test.ts` | Luz táctil: listeners pasivos compartidos, host y ancestros, rAF, `pointercancel`, sin mouse ni toques secundarios, apagado con movimiento reducido |
| `tests/unit/m0/haptics.test.ts` | `vibrate(8)` una vez, como método, nunca con movimiento reducido ni sin API |
| `tests/unit/m0/swipe.test.ts` | Umbral, eje, `pan-y`, el scroll vertical gana, el clic tras deslizar se descarta |
| `tests/unit/m0/viewport.test.ts` | Dirección con histéresis, store de un listener, inset del teclado y estado del dock |
| `tests/unit/m0/sheet-drag.test.ts` | Umbral de cierre, tirón, resistencia hacia arriba, `pointercancel` y botones |
| `tests/unit/m0/styles.test.ts` | Blur 10 y 16 px solo en `< md`, tintes iguales a la 001, respaldos, regla del presupuesto, luz táctil, barrido y profundidad solo con `transform`/`translate`, espacio del dock y hoja con `100dvh` |
| `tests/unit/m0/components.test.ts` | `GlassSurface` por defecto igual, `sweep`/`float`/`blur`, `FormField floating`, `BottomSheet`, `Dialog mobileSheet` y el header con el dock |
| `tests/e2e/m0/sheet.spec.ts` | Toque, teclado, Esc, arrastre, deslizar y botones, fondo, `100dvh`, rotación, dock apartado, presupuesto con la hoja abierta, fundido con movimiento reducido y `Dialog mobileSheet` (SC-606) |
| `tests/e2e/m0/dock.spec.ts` | 375, 390 y 412 px, 44 px, nombres, buzón arriba, bajar y subir, foco, final de página, cada acción, movimiento reducido y sin JS |
| `tests/e2e/m0/blur-budget.spec.ts` | 3 o menos a 375 px en 12 páginas de arriba abajo, menú abierto, tarjetas sólidas y transparencia reducida (SC-602) |
| `tests/e2e/m0/desktop-regression.spec.ts` | 1280 y 1440 px sin dock ni marcas, header como en la 004 y diálogos iguales; con `M0_BASELINE_URL`, capturas píxel a píxel contra un build de la base (SC-601) |

Las e2e de la hoja usan un arnés (`tests/e2e/m0/harness/`) que compila `BottomSheet`, `Dialog` y `FormField` con Vite
(la dependencia que ya trae Vitest) y lo inyecta en una página real: ninguna página usa la hoja todavía.

## 16. Impacto en pruebas de otras lanes

| Prueba | Qué pasa | Quién la ajusta |
|---|---|---|
| `tests/e2e/r4/post-reading.spec.ts` › "la cita inicial va en cristal…" (`mobile-chromium`) | Pide `backdropFilter` con `blur` en la cita y los bloques de código a 390 px. Por FR-602 ya no desenfocan en `< md`: son cristal sólido | Orquestador o P7: en `mobile-chromium`, aceptar `none` con fondo sólido, o que la 005 marque con `data-cw-blur` las que cuenten |
| `tests/e2e/l5/experience.spec.ts` y las que hacen clic en `[data-cw-assistant-button]` en móvil | Siguen en verde con M0; fallarán cuando P6 oculte el botón flotante (T818) | P6 |
| `tests/e2e/integration/support/controls.ts` | El inventario verá `[data-cw-dock-assistant]`. Por `aria-haspopup="dialog"` cae en la regla "botón de diálogo" | — |
| Demo del blog (`components/blog/mdx/GlassDemo`) | En `< md` sus tarjetas se ven sólidas | La 005 decide si marca alguna con `data-cw-blur` |

## 17. Desviaciones del plan

| ID | Qué | Por qué |
|---|---|---|
| D-M1 | El dock no es un componente aparte con botones propios: es el grupo de controles del header, reubicado con CSS. El buzón, que va en medio en el DOM, se queda arriba con `position: fixed`, y el header pasa su desenfoque a `::before` en `< md` con JS | Las e2e congeladas de L0, L2, L5 y P7 hacen clic en `[data-cw-menu-button]`, `[data-cw-palette-trigger]` y `[data-cw-theme-toggle]` en móvil. Con botones duplicados chocaba el modo estricto de Playwright, y ocultar los del header rompía esas pruebas. Así cada control sigue siendo único, el orden del Tab en escritorio no cambia y no hay salto al hidratar |
| D-M2 | El presupuesto no cambia `glass()`: cambia los tokens en `< md` y agrega una regla global con `!important` | `tests/unit/r0/glass-mixins.test.ts` exige que `glass()` emita lo mismo. La regla cubre también los módulos de las demás lanes sin tocarlos |
| D-M3 | Los diálogos y popovers abiertos cuentan como "la hoja abierta" sin marca | El menú y los diálogos de P6 conservan su cristal sin esperar a la fase 2 |
| D-M4 | `BottomSheet` suma `closeLabel`, `title`, `navLabels`, `counter`, `describedBy` y `bodyClassName` al contrato del plan | Los botones de cada gesto (FR-652) y los textos ES/EN sin claves nuevas |
| D-M5 | El barrido necesita un hijo (`<Sweep />`), no solo un mixin | `::before` y `::after` ya los usan `glass-edge` y `glass-light`, y un anillo que se queda quieto con una franja que se mueve, animando solo `transform`, pide dos cajas |
| D-M6 | Con movimiento reducido el dock no se esconde con el scroll | Aparecer y desaparecer al bajar es movimiento; el espacio reservado evita que tape contenido |
| D-M7 | La comparación píxel a píxel con la 004 solo corre con `M0_BASELINE_URL` | Las capturas guardadas en el repo quedarían viejas al integrar P2 y P4. Sin la variable corre la parte estructural |
| D-M8 | A-601 no se aplicó y M0 no la necesitó | §13 |
| D-M9 | `viewport` del layout no declara `viewportFit: 'cover'` | `app/**` no es de M0. Sin eso, en iOS `env(safe-area-inset-*)` vale 0 y Safari deja la franja de la barra de inicio fuera de la página: el diseño funciona igual. Si el autor quiere que el dock y la hoja lleguen al borde, es una enmienda de una línea en `app/[lang]/layout.tsx` |

## 18. Para P2 (mapa compacto) y P6 (dock)

**P2 (T820 a T825)**:

- Abre el panel del lóbulo con `BottomSheet` y pásale `onSwipe`, `navLabels` y `counter`: el deslizamiento y los botones
  ya vienen. Llama `tap()` en el toque que elige el lóbulo.
- Marca con `data-cw-blur` solo la tarjeta activa: el header y la hoja ya cuentan, y el dock se aparta con la hoja
  abierta.
- Si el mapa usa `GlassSurface`, `float` y `sweep` ya funcionan en `< md`.
- El mapa no debe quedar debajo del dock: el `body` ya reserva el espacio, pero un elemento `fixed` propio debe sumar
  `--cw-dock-space`.

**P6 (T818 y fase 2)**:

- T818: §12. El dock se activa por CSS desde el primer pintado; `:root[data-cw-dock]` aparece al hidratar.
- `mobileSheet` en `CommandPalette` y `Assistant` (T835): pasa `mobileSheet` al `Dialog` y usa `useKeyboardInset()`
  si el campo necesita subir más.
- La cascada del menú (T836) puede marcar el menú con `data-cw-blur`, aunque abierto ya cuenta como popover.
