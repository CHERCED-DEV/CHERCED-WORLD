# Tasks: Barrido de coherencia y UX (010)

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Rama**: `lane/UX`, sobre `dev` (6a61aee)

**Formato**: `- [ ] T10xx [Código] Descripción con ruta`. Una tarea por código del doc 12. Cada bloque cierra con su
commit (`fix(010)`, `feat(010)`, `test(010)` o `docs(010)`) y las pruebas que toca; la lane cierra con `npm run verify`,
`E2E_TIER=full` (puerto 3146, 2 workers) y las capturas a 375, 768 y 1440 px en tema claro y oscuro.

## Fase 0: especificar

- [x] T1000 `specs/010-barrido-ux/`: spec, plan y esta lista, con las respuestas del autor a C1, C3, C6, C7 y E10.

## Bloque 1: llamados a la acción

- [x] T1001 [A1] Home: `CvActions` con "Descargar CV" y el enlace al otro idioma (`components/ui/CvLink.tsx`, como en
  52fcd77), sin el botón de LinkedIn (`components/site/HomeBanner.tsx`).
- [x] T1002 [A2] Sobre mí: "Descargar CV" con su enlace al otro idioma en "Quién soy"
  (`components/site/about/AboutDescription.tsx`), bajo el tope de alto de la R3.
- [x] T1003 [A3] Contacto: "Descargar CV" con su enlace y los íconos de correo y LinkedIn (`app/[lang]/contactMe/page.tsx`).
- [x] T1004 [A4] "Para reclutadores": los dos PDF visibles, "Perfil de LinkedIn" y "Escríbeme"
  (`components/site/home/RecruitersBlock.tsx`).
- [x] T1005 [A5] "Ver mi CV en LinkedIn" pasa a "Perfil de LinkedIn" en `common.json`, la paleta (`experience.json`), el
  asistente, el índice y `llms.txt`.
- [x] T1006 [A6] Un solo llamado en la tarjeta de Synergos de Home (`components/site/home/HomeNow.tsx`).
- [x] T1007 Pruebas: `tests/unit/cv2`, `tests/e2e/cv2` y las que esperaban LinkedIn en los botones o un solo PDF.

## Bloque 2: coherencia y lenguaje

- [x] T1010 [C1] "Roles que busco" en el orden y con el texto del autor (`content/site.ts`).
- [x] T1011 [C2] La línea de las fábricas de software fuera de la lista (`RecruitersContent.motivation`).
- [x] T1012 [C3] Años fijos en 6, sin "desde 2019" (`about.experienceYears`, `figures.ts`, Contacto).
- [x] T1013 [C4] "a nov 2026" en las cifras de ADR y tests de Sobre mí.
- [x] T1014 [C5] "Proyecto insignia" / "flagship project" y "Conoce Synergos" / "Explore Synergos"
  (`content/synergos-showcase.ts`, paleta).
- [x] T1015 [C6] Sin la etiqueta "cerrada" en las líneas de Synergos (`components/site/synergos/*`).
- [x] T1016 [C7] Footer en español y "sobrino del tío Bob" en la terminal (`common.json`, `SiteFooter.tsx`,
  `content/terminal.ts`).
- [x] T1017 [L1] "Componible(s)" en español.
- [x] T1018 [L2] Conceptos de las skills en español (`label` en `content/site.ts`), sin romper los proyectos por skill.
- [x] T1019 [L3] "Arnés de IA (harness)" en Servicios y en "Para reclutadores".
- [x] T1020 [L4] "Desarrollo guiado por especificaciones (Spec-Driven Development)" la primera vez en cada página.
- [x] T1021 [L5] Prueba de "AI-First" solo en cargos.
- [x] T1022 [L6] "B1 (B2 en uso profesional frecuente)".
- [x] T1023 [L7] "PDF · 175 kB" en pantalla (`CvLink.module.scss`).
- [x] T1024 [L8] Diagrama de Synergos por idioma (`synergos-{es,en}.svg`, `ImageRef.localizedSrc`, `imageSrc`).
- [x] T1025 Pruebas unitarias de contenido (`tests/unit/ux/lenguaje.test.ts`) y ajuste de las existentes.

## Bloque 3: tipografía

- [x] T1030 [T1] `hyphens: manual` en `site.prose` y `<span lang="en">` en los términos en inglés (`typeset`).
- [x] T1031 [T2] NBSP antes de ".NET" (`typeset`).
- [x] T1032 [T3] "AI-First" sin corte en la carta de carrera y el hero.

## Bloque 4: espacios y superposiciones

- [x] T1040 [E1] `text-align: left` en `site.prose`.
- [ ] T1041 [E2] Verificación del dock con la e2e de botones tapados.
- [x] T1042 [E3] Botón del asistente reducido a ícono al bajar y `scroll-padding-bottom` en escritorio.
- [x] T1043 [E4] `scroll-padding-top` con la barra de escenas en Sobre mí.
- [x] T1044 [E5] Puntos de escena ocultos con el footer en pantalla (`SceneNav.tsx`).
- [x] T1045 [E6] Cifras alineadas (`AboutFigures.tsx`).
- [x] T1046 [E7] Alto de la carta de carrera del celular ajustado al contenido (236 px → 12,5 rem, medido: la carta
  más alta pide 193 px a 320 px).
- [x] T1047 [E8] Footer del celular sin el bloque vacío.
- [x] T1048 [E9] Filtro del portafolio por época y "NEXT.JS".
- [x] T1049 [E10] Banda de "Proyectos" sin la foto, con el sistema de diseño; se borra `mobilePortfolio.png`.
- [x] T1058 [E11] El panel del rol del diagrama de capas no ocupa espacio en el celular hasta que se toca una capa
  (`LiveDiagram.module.scss`); "servicios de API" y "servicios BFF" en `content/synergos-showcase.ts`.
- [x] T1059 [E12] Contacto en el celular: el separador sin margen y menos espacio entre la información y el formulario
  (`PageSection.module.scss`).

## Bloque 5: móvil

- [ ] T1050 [M1] Lóbulos a 12 px o más.
- [ ] T1051 [M2] Fuentes a 44 px, agrupadas y con "Ver todas" en el celular.
- [ ] T1052 [M3] Enlaces de "Casos" a 44 px.
- [ ] T1053 [M4] Etiquetas, RSS e índice del blog a 44 px.
- [ ] T1054 [M5] Enlace de privacidad del AI Lab a 44 px.
- [ ] T1055 [M6] Texto visible de 12 px o más a 375 px.

## Pruebas y cierre

- [ ] T1060 `tests/e2e/ux/justificado.spec.ts`: cero texto justificado en cada página, ES y EN, escritorio y celular.
- [ ] T1061 `tests/e2e/ux/texto-minimo.spec.ts`: cero texto visible de menos de 12 px a 375 px.
- [ ] T1062 `tests/e2e/ux/botones-tapados.spec.ts`: ningún botón primario tapado por el dock ni por el botón del
  asistente a 375 px (y por el asistente a 768 y 1440 px).
- [ ] T1063 Capturas de cada página a 375, 768 y 1440 px en tema claro y oscuro (handoff privado,
  `capturas-barrido-ux/`).
- [ ] T1064 `npm run verify` y `E2E_TIER=full` en verde.
