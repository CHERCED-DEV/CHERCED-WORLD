# Contrato R0: sistema de diseño v2 y shell

**Dueño**: R0 · **Estado**: congelado en el tag `r0-frozen` · **Base**: [ui-shell.md de la 001](../001-evolutivo-cherced-world/contracts/ui-shell.md)

Todo lo de la 001 sigue vigente. Esta iteración agrega capas encima: no cambia el nombre ni el valor de ningún
token existente, el mixin `glass()` emite exactamente lo mismo y `GlassSurface` sin props nuevas se renderiza
igual que antes. `tests/unit/r0/tokens.test.ts` y `tests/unit/r0/glass-mixins.test.ts` fallan si eso cambia.

Las lanes R1 a R5 programan contra este documento. Si falta algo, se pide como enmienda a R0.

## 1. Tokens nuevos (`styles/tokens.scss`)

### Compartidos (`:root`)

| Grupo | Tokens | Uso |
|-------|--------|-----|
| Display fluido | `--cw-display-sm` (28→40 px), `--cw-display-md` (34→60), `--cw-display-lg` (40→84), `--cw-display-xl` (44→120) | Títulos editoriales. Todos son `clamp()`; elige el tamaño por la longitud de la palabra más larga, no por la jerarquía. A 320 px, `xl` mide 44 px: una palabra de más de 9 letras en mayúsculas no cabe; usa `lg` o `md`. |
| Interlineado | `--cw-leading-display` 0,98 · `--cw-leading-tight` 1,1 · `--cw-leading-snug` 1,25 · `--cw-leading-body` 1,6 | |
| Tracking | `--cw-tracking-display` −0,025em · `--cw-tracking-label` 0,12em · `--cw-tracking-eyebrow` 0,28em | El eyebrow es el rótulo pequeño en mayúsculas sobre un título. |
| Ritmo | `--cw-measure` 68ch · `--cw-section-gap` `clamp(3rem, 2rem + 4vw, 6rem)` | Ancho máximo de lectura y separación entre secciones. |
| Duraciones | `--cw-duration-instant` 80ms · `--cw-duration-page` 320ms · `--cw-duration-reveal` 680ms · `--cw-duration-ambient` 9s | Se suman a `fast`/`base`/`slow` de la 001. |
| Curvas | `--cw-ease-out` · `--cw-ease-in` · `--cw-ease-in-out` · `--cw-ease-spring` | `--cw-ease` de la 001 sigue siendo la curva por defecto. `spring` tiene rebote: solo para microinteracciones. |
| Microinteracción | `--cw-stagger` 70ms · `--cw-reveal-distance` 14px · `--cw-press-scale` 0,97 · `--cw-hover-lift` −2px | |
| Cristal v2 | `--cw-glass-edge-width` 1px · `--cw-glass-edge-angle` 210deg · `--cw-glass-spot-size` 240px · `--cw-glass-light-size` 520px · `--cw-glass-grain-size` 160px | Geometría de las capas. |
| Grafismos | `--cw-graphic-accent` (= `--cw-intro-accent`, `#25ED9E`) · `--cw-graphic-cell` 56px | |

### Por tema (`dark-theme` y `light-theme`, los dos definen los mismos)

| Token | Oscuro | Claro |
|-------|--------|-------|
| `--cw-glass-edge-highlight` / `-soft` / `-shade` | blanco 0,55 / 0,16 / 0,02 | blanco 1 / 0,6 · negro 0,05 |
| `--cw-glass-spot` · `--cw-glass-spot-accent` | blanco 0,78 · verde 0,42 | negro 0,4 · verde 0,6 |
| `--cw-glass-spot-rest` (0 a 1) | 0,6: el destello del borde se ve en reposo, como un bisel | 0: solo aparece con hover |
| `--cw-glass-sheen` | blanco 0,014 | blanco 0,5 |
| `--cw-glass-grain` | ruido SVG: motas negras ≤ 0,05 y blancas ≤ 0,01 | motas negras ≤ 0,05 |
| `--cw-glass-depth` | sombra externa en dos niveles + interna | ídem, más suave |
| `--cw-graphic-line` · `--cw-graphic-line-strong` | blanco 0,07 · 0,24 | negro 0,07 · 0,22 |
| `--cw-graphic-glow` | verde 0,14 | verde 0,22 |

El reflejo interior del tema oscuro es casi invisible a propósito: cualquier aclarado detrás de texto blanco
baja el contraste, y el presupuesto del peor cuadro del fondo solo admite ~0,025 de blanco en total. En oscuro
el reflejo se ve en el borde (`spot`), no en el cuerpo. `tests/unit/r0/glass-budget.test.ts` calcula el peor
caso (partícula al tope, mar, cada variante, grano, reflejo y grafismos) y exige 4,5:1.

## 2. Mixins Sass (`@use 'glass' as *;`)

| Mixin | Qué emite | Ocupa |
|-------|-----------|-------|
| `glass($variant)` | Sin cambios respecto a la 001. | — |
| `glass-solid($variant)` | Sin cambios. | — |
| `glass-grain` | `background-image: var(--cw-glass-grain)` y su tamaño. | `background-image` |
| `glass-depth` | `box-shadow: var(--cw-glass-depth)` (reemplaza `--cw-glass-shadow`). | `box-shadow` |
| `glass-edge` | Borde especular interior de 1 px: gradiente cónico enmascarado al anillo, más el destello del puntero. `isolation: isolate`. | `::before` (z-index 1) |
| `glass-light` | Reflejo radial que sigue al puntero, detrás del contenido. `isolation: isolate`. | `::after` (z-index −1) |
| `glass-crystal($variant)` | `glass` + `grain` + `depth` + `edge` + `light`. | todo lo anterior |

Reglas:

- **Orden**: incluye las capas **después** de `glass()`. `glass()` usa el shorthand `background`, que borraría
  el grano si va después.
- **Host posicionado**: `edge` y `light` dibujan con `position: absolute; inset: 0`. El elemento debe tener
  `position` distinto de `static` (relative, sticky o fixed). El mixin no la fuerza para no romper hosts
  sticky o fixed. `GlassSurface` ya es `relative`.
- **Pseudo-elementos**: `edge` usa `::before` y `light` usa `::after`. Si tu elemento ya los usa, envuelve el
  contenido o usa solo `grain` y `depth`.
- **El borde va por dentro**: el anillo se dibuja dentro de la caja, pegado al borde de 1 px. Así no lo recorta
  un `overflow: hidden` ni crea scroll horizontal.
- **Seguir al puntero**: además de `glass-light`, el elemento necesita el atributo `data-cw-light`. Sin el
  atributo, el reflejo queda fijo en su posición de reposo (22 % 0 %, arriba a la izquierda).
- **Fallback sólido**: con `prefers-reduced-transparency` o sin `backdrop-filter`, el fondo pasa a sólido
  (tokens de la 001) y el borde, el grano, la profundidad y los grafismos se conservan.
- **Movimiento reducido y táctil**: el reflejo queda fijo. La regla de `:hover` vive dentro de
  `@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)`.

Ejemplo:

```scss
@use 'glass' as *;

.card {
  @include glass(standard);
  @include glass-grain;
  @include glass-depth;
  @include glass-edge;
  @include glass-light;
  position: relative;
}
```

```tsx
<article className={styles.card} data-cw-glass="standard" data-cw-light="">…</article>
```

## 3. `GlassSurface` (`components/ui/GlassSurface.tsx`)

Props nuevas, todas `boolean` y apagadas por defecto: `edge`, `grain`, `depth`, `light`. Con `light`, el
componente agrega `data-cw-light=""`. El resto de la API de la 001 no cambia.

```tsx
<GlassSurface as="article" variant="standard" edge grain depth light>…</GlassSurface>
```

`glassLayerClassName({ edge, grain, depth, light })` devuelve las mismas clases para quien necesite aplicarlas
sin el componente (por ejemplo, junto a `buttonClassName`).

## 4. Luz del puntero (`lib/fx/pointer-light.ts`)

- El layout raíz monta `<PointerLight />` (`components/ui/PointerLight.tsx`) una sola vez. **No lo montes de
  nuevo**: `startPointerLight()` cuenta usuarios y nunca registra más de un listener.
- Un único `pointermove` pasivo en `document`, agrupado en un `requestAnimationFrame`. En cada cuadro escribe
  `--cw-mx` y `--cw-my` (px, relativos al elemento) en el `[data-cw-light]` más cercano y en sus ancestros
  `[data-cw-light]`. No usa estado de React ni provoca renders.
- Se apaga solo si no se cumple `(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)`
  y vuelve si la preferencia cambia. Ignora punteros táctiles.
- Variables que lee el CSS: `--cw-light-x` y `--cw-light-y`, registradas con `@property` (`<length-percentage>`,
  heredables, reposo 22 % y 0 %) para que el reflejo se deslice con `--cw-duration-base`, y `--cw-spot-mix`
  (`<number>`), que lleva el destello del borde de `--cw-glass-spot-rest` a 1 con hover.

## 5. Grafismos (`components/ui/graphics/`)

Server Components sin JS. Todos renderizan un `<span aria-hidden="true" data-cw-graphic="…">`, no tienen texto
ni eventos y usan solo blanco, negro y `#25ED9E` (lo verifica `tests/unit/r0/tokens.test.ts`).

| Componente | Props (por defecto) | Qué es |
|------------|---------------------|--------|
| `GridLines` | `cell?: number` (56), `fade?: 'radial' \| 'top' \| 'bottom' \| 'none'` (`radial`), `accent?` | Retícula de líneas de 1 px que se desvanece. |
| `Hairline` | `orientation?: 'horizontal' \| 'vertical'`, `glint?` | Trazo de 1 px que se desvanece en los extremos; con `glint`, un destello verde en el centro. Va en el flujo (`display: block`, ancho o alto 100 %). |
| `CornerMarks` | `size?: number` (14), `inset?: number` (10), `accent?` | Cuatro esquinas tipo visor. Encima del contenido (z-index 1), en las esquinas. |
| `GlowOrb` | `tone?: 'accent' \| 'fg'`, `size?: 'sm' \| 'md' \| 'lg'` (160/320/560 px), `x?`, `y?` (`'50%'`), `pulse?` | Halo radial suave. Se recorta al host: nunca crea scroll horizontal. `pulse` respira cada 9 s. |
| `Scanline` | `axis?: 'x' \| 'y'`, `edge?: 'top' \| 'bottom'` (solo `x`), `delay?: number` (ms) | `x`: un cometa verde recorre un borde. `y`: un haz barre el área de arriba abajo. Ciclo de 9 s. |

Colocación:

- `GridLines`, `GlowOrb` y `Scanline` son capas absolutas (`inset: 0`, `z-index: -1`, `overflow: hidden`,
  `border-radius: inherit`). El host necesita `position: relative` y un contexto de apilamiento
  (`isolation: isolate`, o `backdrop-filter`, que ya lo crea en cualquier superficie glass). Así quedan sobre
  el fondo del host y debajo de su contenido.
- Con movimiento reducido, `Scanline` desaparece y `GlowOrb` deja de respirar.

Contraste (probado en `glass-budget.test.ts`):

- Sobre glass `standard` o `strong`, una capa de `GridLines` **o** un `GlowOrb` detrás de texto cumplen AA.
- Sobre glass `subtle`, o con retícula y halo juntos, no los pongas detrás de texto `--cw-fg-muted`.
- `Scanline axis="y"` nunca va sobre texto: úsalo sobre imágenes o zonas vacías.

## 6. `Reveal` (`components/ui/Reveal.tsx`)

```tsx
<Reveal as="section" delay={index * 70}>…</Reveal>
```

- Props: `as?` (`div` por defecto; también `section`, `article`, `aside`, `header`, `footer`, `li`, `ul`,
  `ol`, `p`, `span`, `figure`), `delay?: number` (ms; usa múltiplos de `--cw-stagger`) y los props nativos.
- El servidor lo renderiza visible (`data-cw-reveal=""`). Sin JS se ve completo.
- Al montar, un `IntersectionObserver` compartido (`lib/fx/reveal.ts`, `rootMargin: 0px 0px -10% 0px`) decide:
  lo que ya está en pantalla o por encima pasa a `shown` sin animación; lo que está debajo pasa a `pending`
  (oculto, fuera de la vista) y, al entrar, a `in` con una transición de opacidad y 14 px. Se revela una
  sola vez.
- Con movimiento reducido, todo queda en `shown`. El CSS también fuerza opacidad 1.
- No pongas tu propia `transition` en el mismo elemento: envuelve. No lo uses en el elemento LCP del hero.

## 7. Transiciones entre páginas

- `PageTransition` (`components/shell/PageTransition.tsx`) envuelve `children` dentro de `<main>` con
  `<ViewTransition key={pathname} enter="cw-page" exit="cw-page" default="none">` de React 19.3.
- Next 16.4 no necesita configuración: `experimental.viewTransition` ya no existe en su esquema y la guía
  (`node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`) dice que funciona sin configurar.
  `next.config.ts` no cambia.
- Animación: la página vieja se va en 140 ms y la nueva entra en 260 ms con 60 ms de retraso (320 ms en
  total). `:root` lleva `view-transition-name: none`: el header, el fondo animado y el footer siguen vivos y
  quietos; solo se anima el contenido de `main`. `::view-transition` no captura el puntero.
- Solo cambia con el `pathname`: `router.refresh()`, los formularios y las acciones no animan nada.
- Con movimiento reducido no hay animación. Sin soporte del navegador, la navegación funciona igual.
- **Efectos para las lanes**:
  - Al cambiar de ruta se remonta todo lo que está dentro de `main`, también los layouts anidados (por ejemplo
    `inbox/layout.tsx` al pasar de Mensajes a Comentarios). El estado de cliente de esos layouts se reinicia.
  - Durante esos 320 ms, el contenido nuevo de `main` no recibe clics (lo dibuja el navegador como
    instantánea). Playwright espera solo.
  - Puedes agregar elementos compartidos en tus páginas con `<ViewTransition name="…" share="…" default="none">`.
    No uses los nombres de clase `cw-page`.

## 8. Volver arriba (D-01)

- `BackToTop` sigue con `href="#header"` y el texto "VOLVER ARRIBA", como pide la e2e de L0. Con JS, un clic
  normal llama a `scrollToTop()`: sube a 0 (suave, o al instante con movimiento reducido) y mueve el foco a
  `#main` sin saltos. Los clics con modificadores siguen al enlace.
- Sin JS (o antes de hidratar), `#header` tiene `scroll-margin-top: 100000px`: el salto al fragmento termina
  en 0 aunque el header sea sticky.
- `scrollToTop(env?)` e `isPlainClick(event)` se exportan desde `lib/fx/scroll-top.ts` para cualquier otro
  control que necesite subir.

## 9. Buzón público (E-01)

### `GET /api/inbox-count`

- Respuesta: exactamente `{ "unread": number }` (entero ≥ 0). Nada más: ni nombres, ni correos, ni teléfonos,
  ni textos.
- `export const revalidate = 30`: se prerenderiza y se revalida cada 30 s (`cache-control: s-maxage=30, …`).
- Lee `getRepos().messages.countUnread()` tras importar `@/lib/data/mongo/register`. Si la base falla,
  responde `{ "unread": 0 }` y registra el error con `logServerError` (sin detalles sensibles).
- `x-robots-tag: noindex`.

### En el header

- `MailboxLink` (Client Component) es un enlace al panel `/[lang]/inbox` con el ícono `inbox`, entre el cambio
  de idioma y el tema. Sin JS es un enlace sin número.
- Consulta al montar y cada 60 s, solo con la pestaña visible; al volver a la pestaña consulta enseguida.
- Con 0 no muestra número. Con más de 99 muestra `99+`. El nombre accesible es "Buzón" o "Buzón, 3 mensajes
  sin leer" (`mailbox.label`, `mailbox.unreadOne`, `mailbox.unreadMany` en `common`).
- Atributos: `data-cw-mailbox` en el enlace y `data-cw-mailbox-badge` en el número. No uses `data-cw-count`:
  es una marca privada del escaneo de L3.
- El número del header puede ir hasta ~90 s detrás del panel (60 s de polling más 30 s de caché).

## 10. Eventos

No hay eventos DOM nuevos. Los de la 001 (`cw:open-palette`, `cw:open-assistant`, `cw:theme-change`) y
`lib/events.ts` no cambian. Las piezas nuevas se comunican por atributos y variables CSS:

| Canal | Quién escribe | Quién lee |
|-------|---------------|-----------|
| `data-cw-light` | El componente o la lane que quiere reflejo | `pointer-light` |
| `--cw-mx`, `--cw-my` | `pointer-light` | `glass-light` y `glass-edge` (vía `--cw-light-x/y`) |
| `data-cw-reveal` (`""`, `pending`, `in`, `shown`) | `Reveal` | CSS global |

## 11. Otros cambios de la UI

- `Icon` suma el nombre `inbox`.
- `Button`: hover con 1 px de elevación y halo verde suave; al presionar, `scale(var(--cw-press-scale))`. La
  variante `glass` suma grano. La API no cambia.
- Controles del header (`iconButton`, `pill`): borde que se ilumina, halo verde y pulsación. Bajo 360 px
  miden 40 px y se juntan, para que el header quepa a 320 px incluso con "Regresar".
- Header: grano, profundidad y una línea con destello (`Hairline glint`) en su borde **superior**. Logo con
  giro leve al hover. El subrayado de la navegación crece desde el centro y el activo lleva un destello verde.
  La estructura y los atributos `data-cw-*` de la 001 no cambian. En páginas de detalle (con "Regresar"), el
  atajo `Ctrl/⌘ + K` del botón de búsqueda se oculta para que el header quepa a 1280 px.
- El borde inferior del header se queda como en la 001 a propósito: el contenido pasa por debajo al hacer
  scroll, y cualquier brillo en esas filas (destello, halo o cometa) baja el contraste del texto que asoma
  justo debajo. **No pongas grafismos brillantes pegados al borde inferior de una superficie sticky.**
- Footer: grano, retícula que se desvanece desde arriba, halo verde centrado arriba, línea superior con
  destello, un cometa (`Scanline x`, borde superior) cada 9 s y un trazo fino entre redes y copyright.
- `FormField`: las casillas miden 24 × 24 px (antes 20), el mínimo de objetivo táctil de WCAG 2.2.
- Menú flotante: grano, retícula, línea bajo la barra superior y entrada escalonada de los enlaces.

## 12. Tipos e i18n (E-02)

- `Project` suma `gallery?: ImageRef[]` y `highlights?: Localized[]`. Son opcionales: el contenido actual no
  cambia.
- Namespaces nuevos `home` y `portfolio`, registrados en `lib/i18n/config.ts` y `lib/i18n/server.ts`, con
  archivos en `content/i18n/{es,en}/`. Claves sembradas: `home.nowWorking` y `portfolio.openLive`. R1 es dueña
  de `home.json` y R2 de `portfolio.json`: pueden agregar, renombrar o quitar claves, manteniendo la paridad
  es/en que exige `tests/unit/l0/i18n-parity.test.ts`.
- `tests/contract/signatures.ts` incluye los dos namespaces nuevos.

## 13. Atributos `data-cw-*` nuevos

`data-cw-light`, `data-cw-reveal`, `data-cw-graphic` (`grid`, `hairline`, `corners`, `orb`, `scanline`),
`data-cw-mailbox` y `data-cw-mailbox-badge`.

## 14. Pruebas que protegen este contrato

| Prueba | Qué cuida |
|--------|-----------|
| `tests/unit/r0/tokens.test.ts` | Tokens de la 001 intactos, tokens nuevos en ambos temas, grano ≤ 0,05, transición ≤ 350 ms, solo blanco/negro/verde |
| `tests/unit/r0/glass-budget.test.ts` | Contraste AA con grano, reflejo y grafismos en el peor cuadro del fondo y en el fallback sólido |
| `tests/unit/r0/glass-mixins.test.ts` | `glass()` sin cambios y salida de cada capa |
| `tests/unit/r0/fx.test.ts` | Un listener, rAF, variables locales, apagado con movimiento reducido o táctil; `Reveal`; `scrollToTop` |
| `tests/unit/r0/mailbox.test.ts` | Respuesta `{ unread }` sin datos personales, revalidate 30 s, polling con pestaña visible |
| `tests/unit/r0/components.test.ts` | `GlassSurface` por defecto igual, grafismos decorativos, `Reveal` visible en servidor, E-02 |
| `tests/e2e/r0/shell-v2.spec.ts` | D-01 desde el final de 15 páginas (escritorio, móvil, teclado, movimiento reducido y sin JS), buzón, transiciones, reflejo, axe del header y footer |
