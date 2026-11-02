# Contrato: shell visual, tokens glass y puntos de extensión

**Dueño**: L0 (salvo lo indicado) · **Estado**: se congela al cerrar L0

## Layouts

- **No existe `app/layout.tsx`.** El layout raíz es `app/[lang]/layout.tsx` (L0), porque es el único
  que conoce el idioma para `<html lang>`. Renderiza `<html lang={lang} data-theme data-intro>`,
  Montserrat con `next/font/local` (`public/fonts/Montserrat`), el script en línea de tema e intro
  (research R-09), `<Background />` e `<Intro />` desde `@/components/motion`, `<SiteHeader>`,
  `<FloatMenu>`, `<main id="main">`, `<SiteFooter>`, `<BackToTop>` y `<ExperienceRoot lang />` desde
  `@/components/experience`. Los textos de la intro salen del namespace `common`.
- `app/global-error.tsx` (L0) define su propio `<html>` y `<body>`. Las rutas desconocidas caen en
  `app/[lang]/not-found.tsx`, porque `proxy.ts` antepone el idioma a toda ruta.
- Las páginas de la lane L3 bajo `inbox` usan su propio sub-layout (`app/[lang]/inbox/layout.tsx`, L3).

## Stubs que L0 crea y entrega a otra lane al congelarse

| Archivo | Firma | Dueño tras L0 |
|---------|-------|---------------|
| `components/motion/index.ts` | `export function Background(): JSX.Element`, `export function Intro(props: { name: string; role: string; skipLabel: string }): JSX.Element`, `export function BackgroundIntensity(props: { value: 'full' \| 'subtle' }): null`, `export function AtomLoader(props: { label: string }): JSX.Element`, `export function DotsLoader(props: { label: string }): JSX.Element` | L2 |
| `components/experience/index.ts` | `export function ExperienceRoot(props: { lang: Locale }): JSX.Element \| null` | L5 |

Los stubs renderizan lo mínimo válido (`null` o un `div` vacío accesible) y nunca rompen el build.

## Eventos DOM (comunicación entre lanes sin importarse)

| Evento | Quién lo despacha | Quién escucha |
|--------|-------------------|---------------|
| `cw:open-palette` | Botón del header y atajo Ctrl/⌘+K (L0) | `ExperienceRoot` (L5) |
| `cw:open-assistant` | Botón flotante (L5) y palette (L5) | `ExperienceRoot` (L5) |
| `cw:theme-change` `{ detail: 'dark' \| 'light' }` | Toggle de tema (L0) y palette (L5) | Script de tema (L0); `Background` lo escucha para recolorear (L2) |

Helpers en `lib/events.ts` (L0): `emit(name, detail?)` y `on(name, handler): () => void`.

## Tokens (`styles/tokens.scss`, L0)

Variables CSS en `:root[data-theme='dark']` y `:root[data-theme='light']`:

```
--cw-bg, --cw-fg, --cw-fg-muted, --cw-accent, --cw-focus
--cw-glass-{subtle|standard|strong}-bg
--cw-glass-{subtle|standard|strong}-blur
--cw-glass-saturate, --cw-glass-border, --cw-glass-shadow, --cw-glass-radius
--cw-space-{1..8}, --cw-radius-{sm|md|lg}, --cw-z-{base|header|menu|dialog|intro|toast}
--cw-font-sans, --cw-text-{xs|sm|md|lg|xl|2xl|3xl}
--cw-duration-{fast|base|slow}, --cw-ease
```

Fallback sólido en `@supports not (backdrop-filter: blur(1px))` y
`@media (prefers-reduced-transparency: reduce)` (research R-08).

## Primitivas (`components/ui/`, L0)

| Componente | Props clave |
|------------|-------------|
| `GlassSurface` | `as?`, `variant: 'subtle' \| 'standard' \| 'strong'`, `className?` |
| `Button` | `variant: 'glass' \| 'solid' \| 'ghost'`, `size`, todos los props nativos |
| `Dialog` | `open`, `onClose`, `labelledBy`, `children` (sobre `<dialog>` nativo, research R-11) |
| `Separator` | `tone: 'light' \| 'dark'` (evolución de los separadores 2023) |
| `VisuallyHidden`, `Icon` | |
| `FormField` | `label`, `error?`, `hint?`, `children` |
| `Toast` | `useToast()`: `success`, `error` (reemplaza a SweetAlert) |

Mixin Sass `glass($variant)` en `styles/_glass.scss` para CSS Modules de cualquier lane.

## Reglas de estilo

- Cada componente usa su propio `*.module.scss` junto al archivo.
- Las lanes MUST NOT editar `styles/**` (L0). Si falta un token, se pide como enmienda a L0.
- Breakpoints en `styles/_breakpoints.scss`: `sm 480`, `md 768`, `lg 992`, `xl 1248` (valores 2023).
