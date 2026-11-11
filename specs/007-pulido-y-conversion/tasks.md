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

- [x] T930 [B4] El asistente busca en contexto, decisiones y resultados de cada caso, con la prueba de las sagas.
- [x] T931 [B5] Mayúsculas originales en las respuestas.
- [x] T932 [B11] Inglés como nivel.
- [x] T933 [B8] Catálogo único de tecnologías con alias y conteos calculados.

## Bloque 4: correcciones menores

- [x] T940 [B6] 404 real (T227 de la 002), también para `/es/portfolio/99`. `app/global-not-found.tsx` con el layout
  de `[lang]` y `NotFoundView`; sin ruta comodín y con `dynamicParams = false` en el layout, los casos y los posts. 404
  con el HTML completo, con y sin JS, en el idioma de la URL (`x-cw-lang` desde el proxy).
- [x] T941 [B9] Etiquetas del blog bilingües. Catálogo `{ es, en }` en `content/posts/tags.ts`, slug propio por idioma y
  308 desde los slugs viejos o del otro idioma (enmienda en `specs/005-blog/contracts-q0.md` §3.1). Índice, filtros,
  páginas de etiqueta, tarjetas, post, RSS, sitemap, búsqueda y asistente las muestran en el idioma de la página.
- [x] T942 [B12] Ciudad de HYROX (P-705).
- [x] T943 [B13] Nombre unificado (P-706).

## Bloque 5: después

- [ ] T950 Ajuste fino del móvil que pida el autor sobre la 006.
- [x] T951 Post "Lo que 2.353 tests no vieron", en ES y EN (Q4 de la 005).
  - Aprobado por el autor el 2026-11-07. Integración validada con `verify`, 152 e2e del blog y cuatro auditorías de
    contraste del post en escritorio/móvil y ambos temas. El despliegue a producción sigue separado.

## Pedidos del autor del 2026-11-06 (después del bloque 2)

- [x] T911 [B1b] CV en español y en inglés: `public/cv/camilo-hernandez-cv-{es,en}.pdf` desde los PDF del handoff, sin
  cambiarlos. Botón principal con el PDF del idioma de la página y enlace secundario al otro idioma (con `hreflang`),
  formato y peso; dos acciones en la paleta; el asistente responde con los dos; `llms.txt` y JSON-LD. e2e de las dos
  descargas (FR-701b, `tests/unit/cv2` y `tests/e2e/cv2`). Enmendada por T970: el botón visible baja solo el PDF
  del idioma de la página.
- [x] T944 El buzón del header debe llevar al autor a leer sus mensajes, no solo a Contacto (la 004 lo había mandado a
  Contacto para todos).
- [x] T960 Cuarta escena de Sobre mí, "Hacia dónde voy": entrevista al autor ([entrevista-hacia-donde-voy.md](./entrevista-hacia-donde-voy.md)),
  copy en ES y EN con su visto bueno, la escena con el cristal que ya existe y su entrada en el SceneNav.
- [ ] T961 Las mejoras que el autor vio en la vista previa (pendiente que las cuente).
- [x] T962 [Sustituida por la 009; conciliado 2026-11-08, ver `../seguimiento-2026-11-08.md`] "Hacia el MVP: la línea de ensamblaje" en el caso de Synergos: diagrama vivo de las líneas de agentes que
  convergen en el release, con hitos reales sacados de la carpeta de Synergos (solo lectura), y un acceso desde Home.
  Boceto primero; se construye con el visto bueno del autor. La raíz de Synergos no se publica hasta el MVP.

## Correcciones del autor del 2026-11-07 (rama `dev`)

El autor revisó la vista previa en el celular: "construyamos sobre lo construido, no avanzar destruyendo lo construido".

- [x] T970 Enmienda a T911: "Descargar CV" baja solo el PDF del idioma de la página. Sin enlace al otro idioma en
  Home, Contacto ni "Para reclutadores", y una sola acción de descarga en la paleta. El JSON-LD, `llms.txt`
  y el asistente siguen conociendo los dos PDF.
- [x] T971 "Quién soy" vuelve a su forma anterior a la 007: retrato a un lado, texto, "Ver mi CV en LinkedIn" y las
  cifras. "Descargar CV" ya está en Home y no se repite aquí ("no había por qué volverlo a poner en el about"). El
  botón "Ver mi master product" vuelve justo debajo de las cifras (donde lo dejó S1).
- [x] T972 Enmienda a T921: las certificaciones pasan de "Quién soy" al pop-up "Para reclutadores". En "Lo que sé"
  ya estaban como fuentes (Platzi Master, Fundamentos de Arquitectura y el perfil de Platzi).
- [x] T973 "Para reclutadores" es un enlace de texto que abre el pop-up, no un botón grande; el hero del celular
  vuelve a respirar y la señal de scroll queda sobre el dock.
- [x] T974 Rama `dev`: integra la 007, `main` (Node 22) y `lane/X4` (la base del peloteo; X4b sigue al final).
- [x] T975 Las tarjetas de experiencia abiertas muestran los bullets de LinkedIn (los mismos del CV), en ES y EN, en
  vez del párrafo resumen: Sistecrédito (las dos etapas), Synergos Labs, FLYR, Newshore y Growup IT. El autor eligió
  publicar los de Sistecrédito tal cual LinkedIn, con cifras y proveedores (2026-11-07); el resto del sitio sigue sin
  cifras internas. Platzi Master y Squadra conservan su descripción porque no tienen bullets en LinkedIn.

