# Implementation Plan: Barrido de coherencia y UX

**Branch**: `lane/UX` | **Date**: 2026-11-07 | **Spec**: [spec.md](./spec.md)

**Input**: [spec.md](./spec.md), a partir del doc 12 del handoff privado y de la [idea](./idea.md)

## Summary

Se pule lo que ya existe en cinco bloques, en el orden del autor. Los llamados a la acción se ordenan con una acción
principal por contexto ("Descargar CV" con su enlace al otro idioma) y LinkedIn vuelve a ser un perfil, no un CV. El
lenguaje se alinea con la regla del autor (en español, todo en español salvo tecnologías, productos y cargos). La
tipografía deja de justificar y de guionar en el mixin de texto corrido, y un ayudante (`typeset`) protege ".NET" y
"AI-First" y marca los términos en inglés. Los espacios y las superposiciones se arreglan en los componentes que ya
existen, y el móvil sube a 12 px y 44 px. Tres e2e nuevas en `tests/e2e/ux/` fijan lo medible.

## Technical Context

**Language/Version**: TypeScript 5.9, Next.js 16.4.3 (App Router), React 19

**Primary Dependencies**: las del repo. Ninguna nueva

**Storage**: N/A (contenido como datos en `content/`)

**Testing**: Vitest (`tests/unit/ux/`), Playwright 1.64 (`tests/e2e/ux/`) en `desktop-chromium`, `mobile-chromium` (a 375
px con `setViewportSize`) y `no-js`

**Target Platform**: Vercel (el proyecto existente; push a `main` despliega)

**Project Type**: sitio web

**Performance Goals**: sin JS de cliente nuevo salvo dos observadores pequeños (puntos de escena y botón del asistente)

**Constraints**: sin tokens, paleta, fuentes, intro ni fondo nuevos; sin infraestructura, variables de entorno ni
dependencias; sin imágenes nuevas salvo la versión por idioma del diagrama de Synergos (L8), que sale del SVG que ya
existe

**Scale/Scope**: 12 páginas en ES y EN, 15 casos y 5 posts

## Constitution Check

| Principio | Cómo se cumple |
|---|---|
| I. Evolución, no reemplazo | Todo es pulido sobre lo que hay. Las rutas no cambian. La banda del portafolio conserva su lugar y su título (E10) |
| II. Glass sobre movimiento | No se tocan tokens ni glass; la banda nueva usa `GlassSurface`, `GridLines`, `CornerMarks` y `Scanline`. El botón del asistente reducido conserva su cristal, y con movimiento reducido no anima |
| III. Seguridad real | Nada de datos ni de endpoints. El CV ya publicado sigue igual |
| IV. Contenido como datos, SSR | Los textos nuevos viven en `content/` y en los diccionarios, en ES y EN. El enlace al otro idioma y el banner salen en el HTML del servidor (e2e `no-js`) |
| V. Rendimiento y accesibilidad | 12 px de texto y 44 px de toque en móvil; `lang="en"` en los términos en inglés; el enlace del CV lleva `hreflang` y `lang` |
| VI. Calidad verificable | e2e de texto justificado, texto pequeño y botones tapados, más unitarias por cada cambio de contenido |
| VII. Lanes con propiedad exclusiva | La lane UX es dueña de lo que toca esta spec (tabla de abajo). Las enmiendas de contrato se listan |
| VIII. Simplicidad operativa | Sin infraestructura ni variables. Dos SVG en vez de uno es la pieza móvil más chica para L8 |

## Research (decisiones)

- **R-1001 LinkedIn es un perfil**: el texto de `CvLink` cambia a "Perfil de LinkedIn" y el componente se usa solo en el
  pop-up. `CvActions` deja de incluirlo por defecto (`linkedin` opcional). *Alternativa descartada*: un componente
  nuevo, que duplicaría el de hoy.
- **R-1002 El enlace al otro idioma vuelve como en 52fcd77**: se recupera el marcado de `CvDownload` y los estilos
  `.alternate`/`.label`, con el formato en minúsculas (L7) y a 12 px.
- **R-1003 C6 sin fuente**: `specs/009-synergos-showcase/fuente-publica.md` lista "cerrada" en la columna de estado sin
  definirla; el hito "Siete verticales con su flujo medido" no dice que las líneas estén cerradas. Se quita la etiqueta
  "cerrada" y queda el avance. "Activa" y "en pausa" se entienden solos y se quedan.
- **R-1004 C3 fijo**: la cifra es un dato del autor (CV), así que vive en `content/site.ts` (`about.experienceYears`) y
  no se calcula. Se retiran `webSince` y `fullYearsSince`, que quedan sin uso.
- **R-1005 Texto corrido en un mixin**: E1 y T1 se arreglan en `site.prose`; ningún componente justifica por su cuenta.
- **R-1006 `typeset`**: un ayudante de render (`components/site/typeset.tsx`) que devuelve nodos: NBSP antes de ".NET"
  (T2), "AI-First" sin corte (T3) y, en español, los términos en inglés en `<span lang="en">` (T1). Se aplica donde se
  pinta texto corrido; el contenido, el asistente, `llms.txt` y el JSON-LD no cambian.
- **R-1007 E3 sin esconder el asistente**: el botón se reduce a ícono cuando se baja de la primera pantalla y se
  expande al volver arriba o al enfocarlo; en escritorio la raíz suma `scroll-padding-bottom` del alto del botón para
  que el foco no deje un CTA debajo. *Alternativa descartada*: ocultarlo al ver el footer, que deja al visitante sin
  asistente al final de cada página.
- **R-1008 E4 en la raíz**: en Sobre mí la raíz suma la barra de escenas a `scroll-padding-top`, así cualquier destino
  (escena, lóbulo, cifra o carta) queda debajo de la barra con 12 px de aire. Las escenas conservan su margen.
- **R-1009 E9 por época**: el filtro ordena por el primer proyecto (según `order`) que usa cada tecnología y, dentro de
  él, por el orden en que el caso las lista. Así arranca por Synergos (.NET 8, C#, ASP.NET Core, Umbraco 13, Angular…).
- **R-1010 M2 solo en el celular**: el agrupado "Aplicado en" / "Aprendido en" y "Ver todas" se ven por debajo de 768
  px; en escritorio la fila de fuentes no cambia, para no sumar alto a Sobre mí (tope de la R3).
- **R-1011 L8 por idioma**: `ImageRef.localizedSrc` opcional y `imageSrc(image, lang)`; el caso 12 usa
  `synergos-es.svg` y `synergos-en.svg`, cada uno con su `title` y su `desc`.

## Enmiendas de contrato (`content/types.ts`)

| Tipo | Cambio | Consumidores |
|---|---|---|
| `RecruitersContent` | `motivation: Localized` (C2) | `RecruitersBlock`, pruebas `pc2` |
| `SiteContent['about']` | `experienceYears: number` (C3) | `aboutFigures`, pruebas `p2` y `r3` |
| `ImageRef` | `localizedSrc?: Localized` (L8) | `CaseStudy`, `portfolio/projects.ts`, `lib/content/image.ts` |

## Archivos de la lane

`components/ui/CvLink.*`, `components/site/**` (Home, Sobre mí, Servicios, Portafolio, Synergos, `_site.scss`,
`typeset.tsx`), `components/shell/SiteFooter.*`, `components/experience/ExperienceClient.*`, `components/blog/**` (solo
estilos de toque), `components/ailab/shell/LabPage.module.scss`, `app/[lang]/{aboutMe,contactMe,page}.tsx`,
`content/**`, `lib/content/image.ts`, `public/assets/imgs/projects/synergos-{es,en}.svg`, `tests/unit/ux/`,
`tests/e2e/ux/` y las pruebas existentes que cambian por diseño (listadas en `tasks.md`).
