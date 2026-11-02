# Contrato: shell visual, tokens glass y puntos de extensión

**Dueño**: L0 (salvo lo indicado) · **Estado**: congelado en el tag `l0-frozen`

## Layouts

- **No existe `app/layout.tsx`.** El layout raíz es `app/[lang]/layout.tsx` (L0), porque es el único
  que conoce el idioma para `<html lang>`. Renderiza, en este orden:
  `<html lang={lang} class={montserrat.variable}>`, el script en línea de tema e intro en `<head>`
  (research R-09), el skip link, `<Background />` e `<Intro name role skipLabel />` desde
  `@/components/motion`, y dentro de `<ToastProvider>`: `<SiteHeader>`, `<FloatMenu>`,
  `<main id="main" tabIndex={-1}>`, `<SiteFooter>` (con `<BackToTop>` adentro, como en 2023) y
  `<ExperienceRoot lang />` desde `@/components/experience`. Los textos de la intro salen del
  namespace `common`.
- Montserrat se carga con `next/font/google` en `styles/fonts.ts` (variable `--cw-font-montserrat`,
  pesos reales, autoalojada en build, sin llamadas en runtime). `public/fonts/Montserrat` solo tenía
  el peso Regular; se conserva pero no se usa.
- `app/global-error.tsx` (L0) define su propio `<html>` y `<body>`. En Next 16.4 recibe
  `{ error: unknown; retry: () => void }`.
- Rutas desconocidas bajo un idioma (`/es/lo-que-sea`) caen en `app/[lang]/[...rest]/page.tsx` (L0),
  que renderiza la vista 404 con identidad desde el servidor (`noindex`, `force-dynamic`), así se ve
  sin JS.
- `app/[lang]/not-found.tsx` (L0) atiende los `notFound()` de las páginas de las demás lanes. Nota de
  Next 16.4 verificada en L0: una respuesta de `notFound()` llega con estado 404 y un shell HTML de
  error; la UI de `not-found.tsx` (con header y footer) la pinta el cliente. Sin JS esa respuesta se ve
  vacía. No depende de la estructura de layouts: pasa igual con `app/layout.tsx` y con
  `globalNotFound`.
- Las páginas de la lane L3 bajo `inbox` usan su propio sub-layout (`app/[lang]/inbox/layout.tsx`, L3).

### Atributos de `<html>` (los fija el script en línea antes del primer pintado)

| Atributo | Valores | Sin JS |
|----------|---------|--------|
| `data-js` | presente | ausente |
| `data-theme` | `dark` \| `light` (guardado en `cw-theme`, si no la preferencia del sistema) | ausente: el CSS sigue `prefers-color-scheme` |
| `data-intro` | `pending` (no vista en la sesión) \| `seen` | ausente: no hay intro |

El script también escucha `cw:theme-change`, aplica el tema y lo guarda en `localStorage`. El servidor
no renderiza `data-theme` ni `data-intro`; `<html>` lleva `suppressHydrationWarning`.

## Stubs que L0 crea y entrega a otra lane al congelarse

| Archivo | Firma | Dueño tras L0 |
|---------|-------|---------------|
| `components/motion/index.ts` | `Background(): JSX.Element`, `Intro(props: { name: string; role: string; skipLabel: string }): JSX.Element`, `BackgroundIntensity(props: { value: 'full' \| 'subtle' }): null`, `AtomLoader(props: { label: string }): JSX.Element`, `DotsLoader(props: { label: string }): JSX.Element` | L2 |
| `components/experience/index.ts` | `ExperienceRoot(props: { lang: Locale }): JSX.Element \| null` | L5 |

- Los stubs renderizan lo mínimo válido y nunca rompen el build.
- La dueña puede implementarlos como Client Components o como Server Components, incluso `async`
  (por ejemplo, `ExperienceRoot` puede leer el namespace `experience` con `getDictionary`). El layout
  solo depende de las props. `tests/contract/signatures.ts` lo verifica en `npm run typecheck`
  (acepta `JSX.Element | null` o una promesa de eso).
- `ExperienceRoot` se monta dentro de `ToastProvider`, así puede usar `useToast()`.

## Eventos DOM (comunicación entre lanes sin importarse)

| Evento | Quién lo despacha | Quién escucha |
|--------|-------------------|---------------|
| `cw:open-palette` | Botón del header y atajo Ctrl/⌘+K (L0) | `ExperienceRoot` (L5) |
| `cw:open-assistant` | Botón flotante (L5) y palette (L5) | `ExperienceRoot` (L5) |
| `cw:theme-change` `{ detail: 'dark' \| 'light' }` | Toggle de tema (L0) y palette (L5) | Script de tema (L0); `Background` lo escucha para recolorear (L2) |

Helpers en `lib/events.ts` (L0), sobre `window`:

```ts
emit('cw:theme-change', 'light'); emit('cw:open-palette')
const off = on('cw:theme-change', (theme) => { ... }) // el handler recibe el detail
```

`lib/events.ts` también exporta `PREFERENCE_KEYS` (`cw-theme`, `cw-intro-seen`, `cw-capsule-found`),
`isTheme()` y los tipos `Theme`, `CwEventMap`.

## Tokens (`styles/tokens.scss`, L0)

Variables CSS en `:root` (tema oscuro por defecto), `:root[data-theme='dark']`,
`:root[data-theme='light']` y `@media (prefers-color-scheme: light) { :root:not([data-theme]) }`:

```
--cw-bg, --cw-fg, --cw-fg-muted, --cw-accent, --cw-accent-fg, --cw-focus, --cw-danger, --cw-icon-filter
--cw-glass-{subtle|standard|strong}-bg
--cw-glass-{subtle|standard|strong}-blur
--cw-glass-saturate, --cw-glass-border, --cw-glass-shadow, --cw-glass-radius
--cw-glass-solid-{subtle|standard|strong}-bg
--cw-space-{1..8}, --cw-radius-{sm|md|lg}, --cw-z-{base|header|menu|dialog|intro|toast}
--cw-font-sans, --cw-text-{xs|sm|md|lg|xl|2xl|3xl}
--cw-duration-{fast|base|slow}, --cw-ease
--cw-header-h, --cw-container-max, --cw-intro-accent
```

- Blanco y negro como base: `--cw-accent` es el blanco (oscuro) o el negro (claro). `--cw-danger` solo
  para errores de formulario. `--cw-intro-accent` es el verde `#25ED9E` del bloque de la intro 2023.
- `--cw-icon-filter` invierte en tema claro los íconos PNG blancos de 2023 (clase `.cw-icon-img`).
- El glass oscuro arranca en opacidad 0,55 (research R-08).
- Fallback sólido en `@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))`
  y `@media (prefers-reduced-transparency: reduce)`: los `--cw-glass-*-bg` toman el valor sólido y el
  desenfoque pasa a 0. Ningún componente tiene que repetir el fallback.
- `tests/contract/tokens.test.ts` falla si un tema pierde un token del contrato.

## Sass para CSS Modules

`next.config.ts` agrega `styles/` a `sassOptions.loadPaths`, así cualquier `*.module.scss` puede hacer:

```scss
@use 'glass' as *;        // @include glass(subtle | standard | strong); glass-solid($variant)
@use 'breakpoints' as bp; // @include bp.up(md) { ... }  @include bp.down(lg) { ... }; bp.bp(md)
@use 'layout';            // @include layout.container; layout.visually-hidden; layout.focus-ring
```

Breakpoints en `styles/_breakpoints.scss`: `sm 480`, `md 768`, `lg 992`, `xl 1248` (valores 2023).
`styles/tokens.scss` y `styles/globals.scss` emiten CSS: solo los importa el layout raíz.

Clases globales disponibles: `.cw-container` (ancho máximo 1248 px con los márgenes de 2023),
`.cw-visually-hidden`, `.cw-js-only` (se oculta sin JS), `.cw-icon-img` y `.cw-skip-link`.

## Primitivas (`components/ui/`, L0)

| Componente | Props clave |
|------------|-------------|
| `GlassSurface` | `as?` (`div`, `section`, `article`, `aside`, `header`, `footer`, `nav`, `li`, `ul`, `ol`, `form`, `span`, `figure`), `variant?: 'subtle' \| 'standard' \| 'strong'` (por defecto `standard`), `className?`, props nativos |
| `Button` | `variant?: 'glass' \| 'solid' \| 'ghost'`, `size?: 'sm' \| 'md' \| 'lg'`, todos los props nativos; `buttonClassName({ variant, size, className })` da el mismo estilo a un `<Link>` |
| `Dialog` | `open`, `onClose`, `labelledBy`, `describedBy?`, `className?`, `children` (sobre `<dialog>` nativo con `showModal()`; Esc y clic en el fondo cierran; el foco vuelve solo) |
| `Separator` | `tone?: 'light' \| 'dark'` (sin `tone` sigue el color del tema) |
| `VisuallyHidden` | `as?: 'span' \| 'div' \| 'h2' \| 'p'` |
| `Icon` | `name` (`menu`, `close`, `back`, `arrow-up`, `sun`, `moon`, `search`, `globe`, `external`, `check`, `alert`, `copy`), `size?`, `title?` (sin `title` es decorativo) |
| `FormField` | `label` (puede llevar un enlace), `error?`, `hint?`, `id?`, `inline?` (casillas), `children`: un único control; FormField le pone `id`, `aria-describedby` y `aria-invalid`, y da estilo glass a `input`, `textarea` y `select` |
| `Toast` | `ToastProvider` (ya montado en el layout) y `useToast()`: `success(message, title?)`, `error(message, title?)`, `dismiss(id)` (reemplaza a SweetAlert) |

`components/ui/index.ts` reexporta todo. `Dialog`, `FormField` y `Toast` son Client Components.

## Shell (`components/shell/`, L0)

- `SiteHeader`: logo, navegación (6 secciones), "Regresar" en páginas de detalle (3 segmentos o más,
  por ejemplo `/es/portfolio/3`), botón de palette, `LangSwitch`, `ThemeToggle` y botón del menú
  (menos de 992 px).
- `FloatMenu`: `<div id="cw-float-menu" popover="auto">`, abierto por el botón del header con
  `popovertarget`. Funciona sin JS; con JS enfoca el primer enlace al abrir, se cierra al navegar y Esc
  devuelve el foco al botón.
- `LangSwitch`: enlace al mismo path en el otro idioma (`prefetch={false}`); al hacer clic guarda
  `cw-lang` con `rememberLocale()`.
- `ThemeToggle` y `PaletteTrigger` llevan `.cw-js-only`: sin JS no aparecen.
- `SiteFooter`: `BackToTop` ("VOLVER ARRIBA" con flecha, como en 2023), redes de `site.socials`
  (oculta `href: null`; externas en pestaña nueva), copyright C-01 y enlace a `/[lang]/privacy` (L3).

### Assets de `public/assets/icons/` que usa el shell (LC debe conservar estas rutas)

`brandLogo.png`, `brandLogoX2.png`, `linkedInIcon.png`, `instagramIcon.png`, `githubCircle.png`,
`gmailIcon.png`, `facebookIcon.png`.

### Atributos `data-cw-*` para pruebas de otras lanes

`data-cw-glass="<variante>"` en toda superficie glass (header, footer, menú, diálogos, toasts y
`GlassSurface`), útil para la prueba de contraste de L2; `data-cw-float-menu`, `data-cw-menu-button`,
`data-cw-lang-switch`, `data-cw-theme-toggle`, `data-cw-palette-trigger`, `data-cw-back`,
`data-cw-back-to-top`, `data-cw-not-found`, y en los stubs `data-cw-background`, `data-cw-intro` y
`data-cw-loader`.

## Reglas de estilo

- Cada componente usa su propio `*.module.scss` junto al archivo.
- Las lanes MUST NOT editar `styles/**` (L0). Si falta un token, se pide como enmienda a L0.
