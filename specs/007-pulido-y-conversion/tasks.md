# Tasks: Pulido y conversión (007)

**Spec**: [spec.md](./spec.md) · **Rama**: `007-pulido-y-conversion`, sobre `003-laboratorio-ia`

**Formato**: `- [ ] T9xx [Bloque] Descripción con ruta`. Cada bloque cierra con `npm run verify`, las e2e de lo que toca
y `test:fast` en verde, y una vista previa con la lista de cambios para el autor.

## Bloque 1: arreglos rápidos y visibles

- [x] T901 [B1] `public/cv/Camilo_Hernandez_CV.pdf`, copia exacta del CV oficial (P-700 resuelta), y `site.profile.cv.pdf`
  con su ruta y su peso en `content/site.ts` y `content/types.ts`.
- [x] T902 [B1] `components/ui/CvLink.tsx`: `CvDownload` ("Descargar CV (PDF)" / "Download CV (PDF)", con `download` y el
  peso) y `CvActions`, que pone los dos botones juntos. Se usa en Home (`HomeBanner`), Sobre mí (`AboutDescription`) y
  Contacto (`contactMe/page.tsx`).
- [x] T903 [B1] Paleta: comando `download` en `components/experience/palette-model.ts`, la acción "> descargar CV" /
  "> download CV" con sus palabras clave, y el contexto `cvPdf` en `ExperienceClient` y `CommandPalette`.
- [x] T904 [B1] El asistente (`lib/assistant/engine.ts`), el índice (`lib/search/build-index.ts`), la capacidad `get_cv`
  (`lib/capabilities/**`) y `llms.txt` ofrecen también el PDF.
- [x] T905 [B7] Prueba de `getSiteUrl` con las variables de producción de Vercel, y nota en la spec sobre la vista previa
  (Next.js usa `VERCEL_BRANCH_URL` para `opengraph-image` cuando `VERCEL_ENV === 'preview'`).
- [x] T906 [B2] `Project.title` admite `Localized`, con `projectTitle(project, lang)`. Títulos en ES de los casos 13, 14
  y 15, y todos los lectores del título actualizados: portafolio, caso, Servicios → Casos, OG, `llms.txt`, asistente,
  índice, capacidades y mapa cerebral.
- [x] T907 [B3] Época `2026` en `PROJECT_ERAS`, con su copy en ES y EN, y los casos 13, 14 y 15 en ella.
- [x] T908 [B10] `<title>`: Home "Camilo Hernández · Software Solutions Engineer · AI-First"; el resto "Página · Camilo
  Hernández".
- [x] T909 Pruebas unitarias y e2e de T901 a T908; las que esperaban solo LinkedIn se actualizan.
- [x] T910 `verify`, `test:fast`, push de la rama y vista previa con la lista de cambios.

## Bloque 2: atraer reclutadores (espera P-701 a P-703 y P-707)

- [x] T920 [FR-710] Bloque "Para reclutadores" en Home y Contacto.
- [x] T921 [FR-711] Sección de Certificaciones.
- [x] T922 [FR-712] "Ver código" en los casos con repo público.

## Bloque 3: asistente y datos

- [ ] T930 [B4] El asistente busca en contexto, decisiones y resultados de cada caso, con la prueba de las sagas.
- [ ] T931 [B5] Mayúsculas originales en las respuestas.
- [ ] T932 [B11] Inglés como nivel.
- [ ] T933 [B8] Catálogo único de tecnologías con alias y conteos calculados.

## Bloque 4: correcciones menores

- [ ] T940 [B6] 404 real (T227 de la 002), también para `/es/portfolio/99`.
- [ ] T941 [B9] Etiquetas del blog bilingües.
- [x] T942 [B12] Ciudad de HYROX (P-705).
- [x] T943 [B13] Nombre unificado (P-706).

## Bloque 5: después

- [ ] T950 Ajuste fino del móvil que pida el autor sobre la 006.
- [ ] T951 Post "Lo que 2.353 tests no vieron", en ES y EN (Q4 de la 005).

## Pedidos del autor del 2026-11-06 (después del bloque 2)

- [ ] T911 [B1b] CV en español y en inglés: `public/cv/camilo-hernandez-cv-{es,en}.pdf` desde los PDF del handoff, sin
  cambiarlos. Botón principal con el PDF del idioma de la página y enlace secundario al otro idioma (con `hreflang`),
  formato y peso; dos acciones en la paleta; el asistente responde con los dos; `llms.txt` y JSON-LD. e2e de las dos
  descargas. Va `para más adelante`.
- [x] T944 El buzón del header debe llevar al autor a leer sus mensajes, no solo a Contacto (la 004 lo había mandado a
  Contacto para todos).
