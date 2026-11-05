# Tasks: Móvil vivo (006)

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Base**: `004-contenido-presente` (P0 congelada y P3
integrada) · **Rama de la lane nueva**: `lane/M0`

**Formato**: `- [ ] T8xx [P] [USx] Descripción con ruta`.

- `[P]` marca una tarea que puede correr en paralelo con las demás de su lane.
- **BLOQUEADA** lleva lo que la frena.

**Reglas para todas las lanes**:

- Cada lane toca solo sus rutas (plan, tabla de lanes) y cierra con `npm run verify` y sus e2e en verde, con su puerto:
  M0 usa el 3118, y las P, los de la 004.
- Todo cambio va dentro de `< md`, `(hover: none)` o `(pointer: coarse)`, salvo lo que la spec dice que aplica a todos.
- Cada tarea visual se prueba en 375, 390 y 412 px, en tema oscuro y claro, sin JS y con movimiento reducido.
- La animación del fondo no se toca (D1). Sin dependencias nuevas.

## Precondición (orquestador)

- [ ] T801 Crear `.worktrees/M0` con la rama `lane/M0` desde `004-contenido-presente`.
  - Registrar las transferencias A-602 y A-603.
  - Aplicar A-601: las etiquetas ES y EN de la spec en `content/i18n/{es,en}/common.json` y `site.json` (FR-655).

## Fase 1: prototipo para el celular del autor

### M0 Base móvil (va primero y congela con `m0-frozen`)

Rutas: `styles/**`, `lib/fx/**`, `components/ui/**`, `components/shell/Dock*`, `components/shell/SiteHeader*`,
`tests/unit/m0/**`, `tests/e2e/m0/**` y `specs/006-movil-vivo/contracts-m0.md`.

- [ ] T802 [US2] Presupuesto de blur (FR-602, R-601):
  - blur de `< md` (10 y 16 px) en `styles/tokens.scss`;
  - en `styles/_glass.scss`, el desenfoque real en `< md` solo con `[data-cw-blur]`, y sólido con borde, grano y
    profundidad para el resto;
  - escritorio sin cambios.
- [ ] T803 [US1] Luz táctil (FR-601, R-604, EM-01):
  - en `lib/fx/pointer-light.ts`, `pointerdown` y `pointermove` táctiles bajo `(pointer: coarse) and
    (prefers-reduced-motion: no-preference)`, `data-cw-touching` en el host y desvanecimiento de unos 300 ms al soltar;
  - en `styles/_glass.scss`, `$-touch-light-query` y la opacidad ligada a `data-cw-touching`;
  - el mouse se comporta igual.
- [ ] T804 [P] [US4] Barrido (FR-604, R-603): mixin `glass-sweep` en `styles/_glass.scss` (entre 600 y 800 ms, una vez,
  `animation-timeline: view()` dentro de `@supports`) y respaldo de una vez en `lib/fx/reveal.ts`.
- [ ] T805 [P] [US4] Profundidad flotante (FR-605): mixin `glass-float($level)` (3 niveles, 12 px máximo, solo
  `transform`) y tokens en `styles/tokens.scss`.
- [ ] T806 [P] [US4] `components/ui/GlassSurface.tsx`: props opcionales `sweep`, `float` y `blur`, que por defecto quedan
  como hoy.
- [ ] T807 [P] [US5] `lib/fx/haptics.ts`: `tap()` con `navigator.vibrate?.(8)` y sin movimiento reducido (FR-606).
- [ ] T808 [P] `lib/fx/swipe.ts`: `useSwipe` con umbral, que cede al scroll vertical (FR-610).
- [ ] T809 [P] `lib/fx/viewport.ts`: `useScrollDirection` y `useKeyboardOpen` (`visualViewport`).
- [ ] T810 [US3] `components/ui/BottomSheet.tsx` y `BottomSheet.module.scss` (FR-603, R-602):
  - `<dialog>` con `showModal`, agarradera y título;
  - arrastre con Pointer Events y `transform`, Esc y "Cerrar";
  - foco devuelto al disparador;
  - `100dvh`, `env(safe-area-inset-*)` y `onSwipe`;
  - fundido con movimiento reducido.
- [ ] T811 [US3] `components/ui/Dialog.tsx`: prop opcional `mobileSheet`, que en `< md` lo presenta y lo cierra como
  `BottomSheet`. Los consumidores que no la piden no cambian.
- [ ] T812 [P] [US13] `components/ui/FormField.tsx`: variante opcional `floating`, con `htmlFor` intacto y el error
  anunciado como hoy (FR-609).
- [ ] T813 [US6] Dock (FR-607, FR-608, EM-05):
  - `components/shell/Dock.tsx` y `Dock.module.scss`: píldora `strong` con `[data-cw-blur]`, abajo al centro, solo en
    `< md` y con `:root[data-js]`;
  - botones de menú (`popoverTarget` del menú), búsqueda (`cw:open-palette`), asistente (`cw:open-assistant`) y tema;
  - se esconde al bajar y vuelve al subir; se oculta con el teclado o con una hoja abierta;
  - `:root[data-cw-dock]`.
- [ ] T814 [US6] `components/shell/SiteHeader.tsx` y `SiteHeader.module.scss`: montar el dock y, en `< md` con dock,
  ocultar menú, paleta y tema del header. El buzón se queda.
- [ ] T815 [P] [US6] Espacio inferior para el dock (`:root[data-cw-dock]`, altura más `safe-area`) en
  `styles/_layout.scss`. Toasts por encima del dock.
- [ ] T816 Pruebas:
  - `tests/unit/m0/pointer-light-touch.test.ts`, `haptics.test.ts`, `swipe.test.ts` y `viewport.test.ts`;
  - `tests/e2e/m0/sheet.spec.ts`: toque, teclado, Esc, arrastre y foco (SC-606);
  - `tests/e2e/m0/dock.spec.ts`: bajar y subir, final de página, sin JS y buzón visible;
  - `tests/e2e/m0/blur-budget.spec.ts`: 3 o menos en cada página a 375 px (SC-602);
  - `tests/e2e/m0/desktop-regression.spec.ts`: capturas de 1280 y 1440 px iguales a la 004 (SC-601).
- [ ] T817 Escribir `specs/006-movil-vivo/contracts-m0.md` con los contratos del plan y sus firmas finales. Correr
  `npm run verify` y las e2e de r0, p0 y m0. Tag `m0-frozen`.

### P6 (fase 1, mínimo para el dock)

- [ ] T818 [US6] En `components/experience/ExperienceClient.module.scss`, ocultar el botón flotante del asistente en
  `< md` cuando existe `:root[data-cw-dock]` (FR-608). El asistente se sigue abriendo con `cw:open-assistant`. Cerrar
  con `npm run verify` y las e2e de p6 y l5.

### P2 Mapa compacto (fase 1; después de `m0-frozen` y de cerrar T436 de la 004)

- [ ] T820 [US7] Mapa radial compacto en `< md` con JS (FR-620, R-605, EM-02):
  - en `components/site/about/brain.ts`, la disposición cuadrada 1:1 con el núcleo al centro y los 6 lóbulos de T229
    en círculo;
  - en `BrainMap.tsx` y `Brain.module.scss`, el SVG, las neuronas y las conexiones;
  - lóbulos de 64 px o más de diámetro visual y 44 × 44 px de área táctil;
  - sin scroll horizontal a 375 px.
- [ ] T821 [US7] Hoja del lóbulo (FR-621):
  - tocar un lóbulo pone `aria-pressed`, llama `tap()` y abre `BottomSheet` con el panel terminal (incluido el terminal
    en el que se escribe de la 004) y "Mis habilidades, en palabras";
  - la tarjeta activa lleva `[data-cw-blur]`.
- [ ] T822 [US7] Deslizar y "Anterior" y "Siguiente" en la hoja, con `useSwipe` y `onSwipe`, y el mapa de atrás sigue la
  selección (FR-622).
- [ ] T823 [P] [US7] Lluvia móvil en `components/site/about/rain.ts` (FR-623, R-606): acotada al mapa, con la mitad de
  columnas o menos, 12 fps o menos y en pausa fuera de pantalla o con la pestaña oculta.
- [ ] T824 [US7] Respaldos (FR-624): con movimiento reducido, el mapa estático sin lluvia, pulso ni giro (por defecto de
  P-601); sin JS, los chips y las listas de hoy en `BrainScene.tsx`.
- [ ] T825 Pruebas y cierre:
  - `tests/e2e/p2/brain-mobile.spec.ts` a 375, 390 y 412 px: mapa sin scroll horizontal, objetivos de 44 px o más,
    panel con 1 toque (SC-604, SC-605), hoja con teclado y Esc, deslizar y botones;
  - `tests/e2e/p2/brain-reduced.spec.ts`: 0 animaciones activas (SC-607);
  - `npm run verify` y e2e de p2 en verde.

### Vista previa de la fase 1 (orquestador)

- [x] T826 Integrar M0 → P6 (T818) → P2 (T820 a T825) en `004-contenido-presente`, correr `npm run verify` y la suite
  completa, y desplegar la vista previa de Vercel.
  - Hecho el 2026-11-05 en 68e22be: `test:fast` en verde (1121 unitarias y 58 de humo) y vista previa desplegada.
- [x] T827 **Revisión del autor en su celular** (SC-608).
  - Se confirman los blur móviles (P-604), el mapa estático con movimiento reducido (P-601), la háptica y el dock.
  - Los ajustes que pida van a M0 o P2 como tareas nuevas antes de abrir la fase 2.
  - Aprobada el 2026-11-05: el autor respondió "Me encanta, sigue", sin ajustes. P-601 y P-604 quedan con su valor
    por defecto.

## Fase 2: el resto, página por página (desbloqueada el 2026-11-05 con T827)

### P2 Sobre mí

- [ ] T830 [US8] Mazo en la mano bajo 992 px con JS, en `CareerDeck.tsx`, `deck.ts` y `About.module.scss` (FR-630,
  EM-03):
  - carta de arriba completa y las de atrás giradas entre −3° y 3° de forma determinista;
  - deslizar y "Siguiente" pasan la carta al fondo;
  - toque o Enter la abren en `BottomSheet`, con `tap()`;
  - contador "n / 8";
  - con movimiento reducido o sin JS, la línea de tiempo.
  - El corte en 992 px es el valor por defecto de P-602.
- [ ] T831 [P] [US9] Puntos de progreso de las escenas en `< sm`, en `SceneNav.tsx` (FR-631).
- [ ] T832 [P] [US9] "En cifras" 2×2 flotante, con `GlassSurface sweep float` y el `CountUp` que ya existe, en
  `AboutFigures.tsx`. Barrido del retrato en `AboutPortrait.tsx` (FR-632).
- [ ] T833 [P] [US9] Verificar en móvil que el texto de "Quién soy" está alineado a la izquierda (002, T225).
- [ ] T834 Pruebas y cierre: `tests/e2e/p2/deck-mobile.spec.ts` y `scenes-mobile.spec.ts`. `npm run verify` y e2e de
  p2.

### P6 Asistente, paleta y menú

- [ ] T835 [US14] `mobileSheet` en `CommandPalette.tsx` y `Assistant.tsx`, con `useKeyboardOpen` para que el campo quede
  sobre el teclado (FR-637).
- [ ] T836 [P] [US14] Cascada de entrada del menú (30 a 40 ms, cristal `strong`) en `components/shell/FloatMenu.tsx` y
  `FloatMenu.module.scss` (A-603). Con movimiento reducido, todos a la vez.
- [ ] T837 Pruebas y cierre: `tests/e2e/p6/mobile-sheets.spec.ts` (paleta y asistente con teclado virtual simulado) y
  `menu-cascade.spec.ts`. `npm run verify` y e2e de p6.

### P3 Servicios (se reabre)

- [ ] T838 [US11] Pila sticky de las 6 tarjetas en `< md`, en `ServicesView.tsx` y `Services.module.scss` (FR-634):
  - `top` escalonado;
  - la de atrás más pequeña y oscura, solo con `transform` y `opacity`;
  - sin apilar con movimiento reducido.
- [ ] T839 [P] [US11] Verificar en móvil que `ServiceCard.tsx` gira con un toque y con el botón visible "Ver qué
  recibes", y que `ServiceProcess.tsx` ilumina los pasos con el scroll.
- [ ] T840 Pruebas y cierre: `tests/e2e/p3/services-mobile.spec.ts`. `npm run verify` y e2e de p3.

### P4 Portafolio y casos

- [ ] T841 [US12] Carrusel con asomo, puntos de progreso, snap y botones en `< md`, en `ProjectsExplorer.tsx`,
  `carousel.ts` y `Portfolio.module.scss`.
- [ ] T842 [P] [US12] Chips de filtro sticky bajo el header, con conteo, en `ProjectsExplorer.tsx`.
- [ ] T843 [P] [US12] Galería deslizable con `useSwipe` (`CaseGallery.tsx`) y tarjetas ADR apiladas en `< md`
  (`CaseStudy.module.scss`).
- [ ] T844 [US12] Embebido a pantalla completa en `BottomSheet` en `< md`, con "Cerrar" y "Abrir en una pestaña nueva",
  en `ProjectEmbed.tsx` (FR-635).
- [ ] T845 Pruebas y cierre: `tests/e2e/p4/portfolio-mobile.spec.ts`. `npm run verify` y e2e de p4.

### P1 Home

- [ ] T846 [US10] Luz táctil y barrido inicial en el marco del banner (`HomeBanner.tsx`), sin mover el layout
  (FR-633).
- [ ] T847 [P] [US10] "Ahora trabajo en" con `GlassSurface float` (`components/site/home/HomeNow.tsx`) y respiración del
  indicador de scroll (`ScrollCue.tsx` y `Home.module.scss`).
- [ ] T848 Pruebas y cierre: `tests/e2e/p1/home-mobile.spec.ts`. `npm run verify` y e2e de p1.

### P5 Contacto

- [ ] T849 [US13] `FormField floating` y luz al enfocar en `ContactForm.tsx` y `ContactForm.module.scss` (FR-636). Sin
  JS, etiquetas completas.
- [ ] T850 Pruebas y cierre: `tests/e2e/p5/contact-mobile.spec.ts`. `npm run verify` y e2e de p5 y l3.

### P7 QA móvil

- [ ] T851 [P] Viewports de 375 y 412 px en `playwright.config.ts`, además del de 390 que ya existe. Capturas de cada
  página en ES y EN, en tema oscuro y claro.
- [ ] T852 [P] `tests/e2e/integration/mobile-patterns.spec.ts`:
  - cada hoja con toque, teclado y Esc;
  - mapa y mazo solo con botones;
  - sin JS y con movimiento reducido (FR-650, FR-652, SC-606, SC-607).
- [ ] T853 [P] Presupuestos en un Android de gama media, o en emulación con CPU ×4: INP < 200 ms y CLS < 0,1 en home,
  "Sobre mí", Servicios y un caso (SC-603). Blur de 3 o menos en todas las páginas (SC-602). Las animaciones nuevas
  usan solo `transform` y `opacity` (FR-653).
- [ ] T854 [P] No regresión de escritorio en todas las páginas a 1280 y 1440 px (FR-651, SC-601), y objetivos de 44 px
  o más en todo lo nuevo (FR-652, SC-605).
- [ ] T855 **BLOQUEADA (P-603)**: proyecto WebKit en `playwright.config.ts` para Safari. Hace falta descargar el navegador
  de pruebas.
- [ ] T856 Estabilizar lo que salga de T851 a T854.

### Blog (entrega a la 005)

- [ ] T857 Orquestador: al planear las tareas de la 005, agregar a Q1 las tarjetas con portada y `float={1}`, y a Q2 el
  índice en una hoja y la barra de progreso en el header, que pide una enmienda de M0 (plan, "Entrega a la 005";
  FR-638).

## Integración y cierre (orquestador)

- [ ] T858 Integrar la fase 2 en orden M0 (ajustes) → P2 → P6 → P3 → P4 → P1 → P5 → P7, con `npm run verify` después de
  cada merge. Revisar que `package.json` no suma dependencias ni hay variables nuevas (FR-654).
- [ ] T859 Correr la suite completa **3 veces seguidas en verde**.
- [ ] T860 Revisión final del autor en su celular. El corte a `main`, junto con la 004 o aparte, solo con su
  confirmación explícita.

## Dependencias y orden

- **T801** abre todo. **M0 (T802 a T817)** bloquea a T818 y a P2.
- **P2 en la fase 1** también espera a que cierre T436 de la 004 (el terminal), porque la hoja del lóbulo lo contiene.
- **La fase 2** espera a T827, la revisión del autor.
- **Dentro de M0**: T802 y T803 tocan `_glass.scss`, así que van en serie; T804 a T809 en paralelo; T810 → T811;
  T813 → T814.

## Estrategia

- **MVP (fase 1)**: M0, T818 y el mapa compacto (T820 a T825), en la vista previa del celular del autor.
- **Fase 2**: por valor para el autor, P2 (mazo) y P6 (hojas) primero, y después Servicios, Portafolio, Home y Contacto.

## Análisis cruzado (2026-11-05)

`/speckit.analyze` sobre spec, plan y tasks:

| ID | Severidad | Hallazgo | Resolución |
|---|---|---|---|
| F1 | Alta | El insumo nombra la luz con `--cw-light-x/y`, pero el código usa `--cw-mx` y `--cw-my` | La spec y el plan usan los nombres reales (C1, FR-601, R-604) |
| F2 | Alta | El insumo dice que el índice de escenas se oculta bajo 480 px. Solo se oculta el número: la barra sigue visible | US9 enriquece la barra con puntos de progreso en vez de "devolver" un índice que no falta |
| F3 | Media | El insumo propone chips con movimiento reducido en móvil, pero en escritorio el mapa se ve estático (002, US6c escenario 5) | Mapa estático por coherencia, con P-601 para que el autor confirme |
| F4 | Media | Servicios tiene 6 tarjetas (004, P-414) y el insumo hablaba de 5 | US11 y FR-634 dicen 6 |
| F5 | Media | El mazo solo existía desde 992 px, así que entre 768 y 991 px no había cartas ni mazo | El mazo cubre todo lo que está bajo 992 px (P-602) |
| F6 | Media | El [verificar] del índice del post quedó resuelto: bajo `xl` es un bloque al principio | Registrado en la spec y en la entrega a la 005 |
| F7 | Media | `FloatMenu` vive en `components/shell` (de M0), pero su cascada es de P6 | Transferencia explícita A-603 (EM-04) |
| F8 | Baja | Las etiquetas nuevas tocan `content/i18n`, que es de P0, congelada | Enmienda de contenido A-601 en T801, antes de `m0-frozen` |
| F9 | Baja | El insumo propone una barra de progreso del blog integrada al header, que toca `SiteHeader` (M0) y el blog (005) | Queda en la entrega a la 005 con una enmienda de M0 (T857) |
| F10 | Baja | FR-650 a FR-655 (transversales) no tenían tarea con referencia explícita | Referencias agregadas en T801, T852, T853, T854 y T858 |

**Cobertura**: los 30 requisitos funcionales y los 8 criterios de éxito tienen al menos una tarea. Hay 57 tareas:

- 1 bloqueada por pregunta: T855 (P-603);
- la fase 2 completa (T830 a T857), bloqueada por la revisión T827;
- las demás P-60x tienen un valor por defecto que no frena.
