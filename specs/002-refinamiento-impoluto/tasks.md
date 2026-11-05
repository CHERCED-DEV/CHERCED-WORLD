# Plan y tasks: Refinamiento impoluto (002)

**Spec**: [spec.md](./spec.md) · **Base**: todo lo integrado en `001-evolutivo-cherced-world` · **Rama**:
`002-refinamiento-impoluto`

## Enfoque técnico

- **Cristal v2 por capas, sobre los tokens actuales.**
  - El mixin `glass($variant)` no cambia.
  - Se agregan capas opcionales: `glass-edge` (borde con brillo especular por degradado cónico), `glass-grain`
    (esmerilado con un `feTurbulence` SVG en data URI, opacidad ≤ 0,05) y `glass-depth` (sombra interna y
    externa en dos niveles).
  - `glass-light` es un reflejo radial que sigue al puntero con las variables `--cw-mx` y `--cw-my`, que
    actualiza un único listener pasivo en `lib/fx/pointer-light.ts`, con `requestAnimationFrame` y sin
    re-render de React.
- **Grafismos** como componentes sin JS en `components/ui/graphics/`: `GridLines`, `Hairline`,
  `CornerMarks`, `GlowOrb` y `Scanline`. Son decorativos (`aria-hidden`) y están solo en blanco, negro y
  `#25ED9E`.
- **Movimiento:**
  - Transiciones entre páginas con la View Transitions API, que Next 16 admite con `experimental.viewTransition`
    y React 19.2 con `<ViewTransition>`; si el navegador no la soporta, la navegación funciona igual.
  - `Reveal` con `IntersectionObserver`; el contenido se ve completo sin JS.
  - Tokens nuevos de duración y curva.
- **Tipografía:** escala fluida con `clamp()`, tokens `--cw-display-*` y `--cw-leading-*`, sin cambiar los
  existentes.
- **Embebido:** `ProjectEmbed`, con `iframe` diferido dentro de un marco de dispositivo, `sandbox` y un
  respaldo con la captura a los 10 s.
- **Buzón:**
  - `GET /api/inbox-count` devuelve solo `{ unread }`, con `revalidate` de 30 s y la base existente.
  - El header lo consulta al montar y cada 60 s con la pestaña visible.
- Cero dependencias nuevas, salvo que alguna lane lo justifique con el principio VIII y el orquestador lo
  apruebe.

## Lanes (propiedad exclusiva)

| Lane | Alcance | Rutas propias | Depende de |
|------|---------|---------------|------------|
| **R0** Sistema de diseño y shell | Cristal v2, grafismos, tokens de movimiento y tipografía, `Reveal`, transiciones, header (buzón, D-01), footer, endpoint del buzón, tipos (E-02) y namespaces nuevos `home` y `portfolio` | `styles/**`, `components/ui/**`, `components/shell/**`, `lib/fx/**`, `lib/i18n/**`, `app/[lang]/layout.tsx`, `app/api/inbox-count/**`, `content/types.ts`, `content/i18n/*/common.json`, `next.config.ts`, `tests/unit/r0/**`, `tests/e2e/r0/**` | — |
| **R1** Home | Hero editorial, "Ahora trabajo en", grafismos del home | `app/[lang]/page.tsx`, `components/site/HomeBanner*`, `components/site/home/**`, `content/i18n/*/home.json`, `tests/*/r1/**` | R0 |
| **R2** Portafolio y casos de estudio | Carrusel corregido (D-02), galería, stack visual, resultados, `ProjectEmbed` (D-03) | `app/[lang]/portfolio/**`, `components/site/portfolio/**`, `content/projects.ts`, `content/i18n/*/portfolio.json`, `public/assets/imgs/projects/**`, `tests/*/r2/**` | R0 |
| **R3** Sobre mí y servicios | Línea de tiempo de carrera, cifras destacadas, servicios refinados | `app/[lang]/aboutMe/**`, `app/[lang]/services/**`, `components/site/about/**`, `components/site/services/**`, `components/site/{SectionTitle,format,metadata,lang}*`, `components/site/_site.scss`, `content/i18n/*/site.json`, `tests/*/r3/**` | R0 |
| **R4** Blog | Post 5 (lo escribe el orquestador), lectura refinada, D-05 | `app/[lang]/blog/**`, `components/blog/**`, `lib/blog/**`, `mdx-components.tsx`, `content/posts/**`, `content/i18n/*/blog.json`, `tests/*/l4/**`, `tests/*/r4/**` | R0 |
| **R5** QA impoluto | Auditoría de interacción (US1), responsive 320–2560 en todas las páginas, excepción del buzón en el escaneo de privacidad, estabilizar D-04 | `tests/e2e/integration/**`, `tests/e2e/l3/**`, `tests/e2e/l5/**`, `tests/e2e/l0/**`, `playwright.config.ts` | R0 (corre la auditoría al final) |

Las lanes 001 (motion, experience, contact, admin, lib/data, lib/actions) quedan **congeladas**. Si una
lane 002 necesita cambiarlas, lo pide como enmienda al orquestador.

## Tasks

### R0 (va primero y congela al terminar con el tag `r0-frozen`)
- [ ] T201 Tokens nuevos de tipografía fluida, movimiento y grafismos en `styles/tokens.scss`, sin tocar los existentes
- [ ] T202 Mixins `glass-edge`, `glass-grain`, `glass-depth` y `glass-light` en `styles/_glass.scss`, con fallback sólido que conserva borde y grano
- [ ] T203 `lib/fx/pointer-light.ts` (un listener, rAF, sin re-render; se apaga con movimiento reducido y en táctil)
- [ ] T204 `GlassSurface` con props opcionales `edge`, `grain`, `depth` y `light`, que por defecto quedan como hoy
- [ ] T205 Grafismos en `components/ui/graphics/` y `Reveal` en `components/ui/Reveal.tsx`
- [ ] T206 Transiciones entre páginas (View Transitions) en `app/[lang]/layout.tsx` y `next.config.ts`
- [ ] T207 D-01: `BackToTop` con scroll real a 0 y foco en `main`; prueba e2e desde el final de cada página
- [ ] T208 Buzón en el header y `GET /api/inbox-count` (`{ unread }`, revalidate 30 s, polling cada 60 s con pestaña visible); enlace al panel
- [ ] T209 Header y footer refinados con cristal v2 y grafismos, sin cambiar su estructura
- [ ] T210 Enmienda E-02 en `content/types.ts` (`gallery?`, `highlights?` en `Project`) y namespaces `home` y `portfolio` sembrados
- [ ] T211 `npm run verify` y e2e de l0 y r0 en verde, más el tag `r0-frozen`

### R1, R2, R3 y R4 (en paralelo después de `r0-frozen`)
- [ ] T220 R1: hero editorial con grafismos y "Ahora trabajo en"; banner intacto en contenido
- [ ] T221 R2: carrusel con imagen completa (D-02), galería, stack visual, resultados y `ProjectEmbed` (D-03)
- [ ] T222 R3: línea de tiempo de carrera, cifras destacadas públicas y servicios con cristal v2
- [ ] T224 R3 (US6c): "Sobre mí" en tres escenas con índice fijo, y el mapa cerebral Matrix sobre cristal (lóbulos, neuronas, fuentes, panel terminal, lluvia acotada), con respaldo completo sin JS, chips en móvil y pruebas e2e de teclado, sin JS, móvil y movimiento reducido
  - Enmienda E-03 (orquestador, 2026-11-04): R3 puede tocar `content/types.ts` solo para agregar `skills.lobes?`, y pasa a ser dueña de `content/site.ts`. `content/projects.ts` lo lee pero no lo edita (es de R2)
- [ ] T225 R3: correcciones de la auditoría del autor en "Sobre mí"
  - Índice fijo que tapa títulos, huecos en Carrera cuando la animación no corre, texto justificado, títulos de lóbulos duplicados para lectores de pantalla, íconos servidos a 3840 px, contraste de etiquetas grises y bloques vacíos que se muestran
  - "Aprendiendo ahora": Azure AI Foundry, Semantic Kernel y RAG salen de las barras y del chat (decisión del autor, 2026-11-04). E-03 se amplía con `skills.learningNow?`
- [x] T226 Orquestador: enlaces a la página actual (logo, Privacidad, buzón) suben al inicio, y "Regresar" en la configuración del panel lleva al inicio del sitio (hallazgos de R5)
- [ ] T227 Pendiente: que las rutas desconocidas respondan 404 sin perder el contenido sin JS
  - Con el layout raíz en `[lang]`, `notFound()` deja el cuerpo vacío sin JS. Next 16 documenta `global-not-found.tsx`, que es experimental, para este caso. El intento 8e1e074 se revirtió en 86d7634; hoy responde 200 con `noindex`
  - Revisar también el 404 de `/es/portfolio/no-existe`, que tiene el mismo cuerpo vacío sin JS desde la 001
- [ ] T229 R3: corrección de skills (decisiones del autor D7 y D9, 2026-11-04)
  - Ningún skill se borra: vuelven React, Next.js, Node.js, MongoDB y Figma, y Arquitectura se completa con Clean Architecture, SOLID, patrones de diseño y sistemas distribuidos
  - "Oficio" se reemplaza por "Prácticas de ingeniería" e "Idiomas y negocio" (6 lóbulos)
  - Niveles con chips de años de uso, aprobados tal como los propuso el autor
- [ ] T228 Pendiente (L3 congelada): al guardar una respuesta, el panel muestra un instante la anterior, y cada acción de moderación dispara de 8 a 15 prefetch extra (`components/admin/ReplyEditor.tsx`, `lib/actions/admin.ts`)
- [ ] T223 R4: lectura refinada (portada, índice flotante, citas, código), post 5 integrado e investigación de D-05

### R5 (en paralelo; corre su auditoría completa al integrar)
- [ ] T230 Auditoría de interacción: inventario de controles por página y efecto verificable de cada uno
- [ ] T231 Responsive de 320 a 2560 px en todas las páginas (panel, catálogo, 404 y los 12 casos)
- [ ] T232 Escaneo de privacidad con la excepción del número del buzón
- [ ] T233 D-04: estabilizar moderación (L3) y tema desde la palette (L5); 3 corridas completas en verde

### Cierre (2026-11-05)

- R0 a R5 integradas, más T225, T226 y T229. Vista previa desplegada en Vercel desde `002-refinamiento-impoluto`.
- Suite completa sobre 52b06c4:
  - Verify en verde.
  - Corrida 1: en verde, con 0 fallos.
  - Corrida 2: 804 pasaron y 1 falló. Fue la fluidez del fondo en móvil, medida mientras otra lane instalaba dependencias.
    Repetida 3 veces con la máquina libre: 3/3 en verde.
  - Corrida 3: se cortó en la prueba 399/1578 por el apagado del equipo, sin fallos hasta ese punto.
- El autor decidió no repetir el ritual de 3 corridas y pasar a una suite por niveles desde la 004 (T510). Con esto,
  FR-212 queda cubierto: D-04 se estabilizó con 3 corridas de R5 y la suite completa pasó.
- Siguen pendientes:
  - T227: el 404 con estado real.
  - T228: el destello del panel en L3.
  - US9: el museo 2023.
  - El paso a `main`, que espera la confirmación explícita del autor.

### Integración (orquestador)
- [ ] T240 Integrar en orden R0 → R3 → R1 → R2 → R4 → R5, correr verify y la suite completa 3 veces, desplegar la vista previa y revisarla con el autor
