# Feature Specification: Pulido y conversión

**Feature Branch**: `007-pulido-y-conversion` (sobre `003-laboratorio-ia`, que integra la 002, la 004, la 005, la 006 y
el laboratorio)

**Created**: 2026-11-06

**Status**: Draft

**Input**: orden de trabajo del autor del 2026-11-06, a partir de la auditoría de la vista previa (handoff privado,
`11-auditoria-preview-2026-11-06.md`): "el preview quedó muy bien. Ahora toca pulir y convertir. No es una
reconstrucción." Cinco bloques, en orden, cada uno con pruebas, `verify` en verde y vista previa al cerrar.

## Principio rector

Rige el de la 002: se enriquece, no se reemplaza. No se tocan los tokens, la paleta, la tipografía, la intro, los
títulos enmarcados ni la animación del fondo (D1). Todo texto visible va en ES y EN. Cero invención: cada dato sale del
handoff o de lo que el autor confirme. Nada interno del empleador sin su confirmación, nada del material de clientes y
ningún dato personal sensible.

## Verificación en el código (2026-11-06)

| # | Hallazgo de la auditoría | Lo que dice el código | Consecuencia |
|---|---|---|---|
| B1 | El CV en PDF no existe | Decisión de la 004 (P-406): el botón lleva a LinkedIn, porque el CV trae cifras del empleador | El autor revoca esa decisión el 2026-11-06: el PDF se publica **tal como está**, con sus cifras. Las cifras siguen sin publicarse en el texto del sitio (bloque 2) |
| B2 | Títulos en inglés en `/es` | `Project.title` es un `string`, no un `Localized` | El título pasa a admitir `Localized`, con un ayudante por idioma para todos los que lo leen |
| B3 | Época 2024–2026 en los casos 13 a 15 | `PROJECT_ERAS` solo tiene `2024-2026` y `2022-2023`, y alimenta el filtro del portafolio | Se agrega la época `2026` y los tres casos pasan a ella |
| B7 | `og:image` apunta a otro preview | `metadataBase` ya usa `getSiteUrl()`. Next.js 16 (`getSocialImageMetadataBaseFallback`) reemplaza a propósito la base de las imágenes `opengraph-image` por `VERCEL_BRANCH_URL` cuando `VERCEL_ENV === 'preview'`. En producción usa `metadataBase` | En producción, `og:image` ya sale con el dominio de producción. Se fija con una prueba de `getSiteUrl` en producción y se documenta que una vista previa muestra su propia imagen |
| B10 | Título `<-CHERCED-WORLD->` | La plantilla del título vive en el layout de `[lang]` | Home: "Camilo Hernández · Software Solutions Engineer · AI-First"; el resto: "Página · Camilo Hernández" |
| B14 | El mapa cerebral se oculta a 375 px | A 375 px se oculta el SVG de escritorio y se ve el compacto (346 px) con 6 lóbulos de 76 px, el de la 006 que el autor aprobó | No es un bug. Del bloque 5 queda el ajuste fino que pida el autor |

## Bloques

### Bloque 1: arreglos rápidos y visibles (P1)

- **FR-701**: `public/cv/Camilo_Hernandez_CV.pdf` es el CV oficial (D5), sin cambios. Home, Sobre mí y Contacto muestran
  "Descargar CV (PDF)" / "Download CV (PDF)" junto al botón de LinkedIn, con el peso del archivo y `download`.
  **Cambia con FR-701b.**
- **FR-701b** (T911, 2026-11-06): el CV se descarga en español o en inglés. `public/cv/camilo-hernandez-cv-es.pdf` y
  `public/cv/camilo-hernandez-cv-en.pdf` son copias exactas de los PDF del autor y se guardan como
  `Camilo_Hernandez_CV_ES.pdf` y `Camilo_Hernandez_CV_EN.pdf`; el PDF de FR-701 se retira. El botón "Descargar CV" /
  "Download CV" ofrece el PDF del idioma de la página y, al lado, un enlace al otro idioma ("English version" /
  "Versión en español", con `hreflang` y `lang`); cada uno dice "PDF · peso". Lo mismo en el pop-up de reclutadores.
  La paleta tiene "Descargar CV en español" y "Download CV in English" (con sus equivalentes en cada idioma) y `>cv`
  baja el del idioma de la página; el asistente, `get_cv` y la sección `## CV` de `llms.txt` dan los dos PDF y
  LinkedIn; el JSON-LD `Person` enlaza el PDF del idioma en `subjectOf` (`DigitalDocument`, `application/pdf`).
- **FR-702**: la paleta tiene la acción "> descargar CV" / "> download CV", en ES y EN.
- **FR-703**: en producción, `og:image`, el canonical y el sitemap usan el mismo origen (`cherced-world.vercel.app`).
- **FR-704**: los casos 13, 14 y 15 tienen título en ES: "Director y líneas: agentes de IA en paralelo", "Espacio de
  trabajo legal" y "Puente de eventos: AWS → Azure", en su página, en Servicios → Casos, en `llms.txt`, en el
  asistente, en el mapa cerebral y en su imagen OG.
- **FR-705**: la época de los casos 13, 14 y 15 es 2026, también en el filtro del portafolio.
- **FR-706**: el `<title>` de Home es "Camilo Hernández · Software Solutions Engineer · AI-First" y el de cada página,
  "Página · Camilo Hernández".

### Bloque 2: atraer reclutadores (P1, después de las respuestas del autor)

- **FR-710**: bloque "Para reclutadores" / "For recruiters" en Home y Contacto: roles (P-701), remoto, UTC−5, abierto a
  reubicación, inglés B1 (B2 en uso profesional frecuente) y los botones Descargar CV, LinkedIn y Escríbeme.
- **FR-711**: sección de Certificaciones: Fundamentos de Arquitectura de Software (Platzi, nov 2025) y "140+ cursos
  certificados" con enlace al perfil de Platzi (P-703).
- **FR-712**: "Ver código" en cada caso con repo público (P-702).
- **FR-713**: no se publican cifras internas del empleador, testimonios ni nombres de aerolíneas sin confirmación (P-707).

### Bloque 3: asistente y datos (P2)

- **FR-720** (B4): el asistente busca también en contexto, decisiones y resultados de cada caso. Aceptación: "¿Cómo
  maneja Synergos las sagas?" responde con la compensación de sagas y cita el caso.
- **FR-721** (B5): el asistente respeta las mayúsculas originales (.NET 8, ASP.NET Core, Nx).
- **FR-722** (B11): el inglés se expresa como nivel, no como porcentaje, en el asistente y en el lóbulo.
- **FR-723** (B8): un catálogo único de tecnologías con alias (.NET = .NET 8 = ASP.NET Core → familia .NET), y los
  conteos "en N proyectos" se calculan desde ese catálogo.

### Bloque 4: correcciones menores (P2)

- **FR-730** (B6): 404 real para rutas inexistentes, incluido `/es/portfolio/99`. Es la T227 de la 002.
- **FR-731** (B9): etiquetas del blog bilingües `{ es, en }`.
- **FR-732** (B12): la ciudad de HYROX en `/now` (P-705).
- **FR-733** (B13): el nombre del autor, igual en todo el sitio, el JSON-LD y `llms.txt` (P-706).

### Bloque 5: después (P3)

- **FR-740**: el ajuste fino del móvil que pida el autor sobre lo que ya entregó la 006.
- **FR-741**: el primer post del calendario, "Lo que 2.353 tests no vieron", en ES y EN, con cifras del handoff. Es la
  Q4 de la 005 (P-501 queda resuelta: se arranca con este post).

## Fuera de alcance

- El SEO a fondo y el dominio propio: van en una spec aparte (008), pedida por el autor el 2026-11-06. Lo que esta
  spec toque de SEO (títulos, `og:image`, nombre en el JSON-LD) se hace de forma que la 008 lo reuse.
- El ping-pong (X4b de la 003), que va de último.

## Preguntas al autor

| # | Pregunta | Bloquea |
|---|---|---|
| P-700 | ¿Publicar el CV en PDF con las cifras del empleador? **Resuelta el 2026-11-06: sí, tal como está** | — |
| P-701 | ¿Qué roles busca? | FR-710 |
| P-702 | ¿Qué repos son públicos? ¿Los casos de evaluación de legal-workspace son sintéticos? (P-420) | FR-712 |
| P-703 | ¿URL del perfil de Platzi? | FR-711 |
| P-704 | El CV enlaza `github.com/Cherced` y el sitio, `github.com/CHERCED-DEV`. ¿Cuál es el bueno? Los PDF en ES y EN del 2026-11-06 siguen con `github.com/Cherced` | — |
| P-705 | ¿HYROX en São Paulo o en Río de Janeiro, y con qué fecha? | FR-732 |
| P-706 | ¿"Camilo Hernández" con tilde en todo el sitio? | FR-733 |
| P-707 | ¿Prueba social (aerolíneas del CV, recomendaciones de LinkedIn)? | FR-713 |

## Criterios de éxito

- **SC-701**: `GET /cv/Camilo_Hernandez_CV.pdf` responde 200 con `application/pdf`, y el archivo es idéntico byte a byte
  al CV oficial. **Con FR-701b**: `GET /cv/camilo-hernandez-cv-{es,en}.pdf` responde 200 con `application/pdf`, cada
  archivo es idéntico byte a byte al PDF del autor (su SHA-256 está fijado en `tests/unit/cv2`) y el viejo da 404.
- **SC-702**: ningún texto visible en `/es` dice "Director & lines", "Legal workspace" ni "Event bridge".
- **SC-703**: los `<title>` siguen FR-706 en ES y EN.
- **SC-704**: `verify` y las e2e en verde al cerrar cada bloque, y una vista previa por bloque.
