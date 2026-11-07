# Feature Specification: Barrido de coherencia y UX

**Feature Branch**: `lane/UX`, sobre `dev` (6a61aee)

**Created**: 2026-11-07

**Status**: Draft

**Input**: orden de trabajo del autor del 2026-11-07, a partir del barrido de coherencia, UX, responsive y lenguaje
(handoff privado, `12-barrido-coherencia-y-ux.md`): "Pulir, no reconstruir […] CTAs, lenguaje, tipografía, espacios y
superposiciones, móvil, en ese orden, con pruebas y verify en verde". Sigue a la [idea](./idea.md) de esta spec.

## Principio rector

Rige el de la 002: se pule, no se reconstruye. No se tocan los tokens, la paleta, la tipografía, la intro ni la
animación del fondo (D1). Todo texto visible va en ES y EN. Cero invención: cada texto nuevo sale de lo que ya dice el
sitio, del doc 12, del CV o de una respuesta del autor. Lo que el doc 12 marca como "muy bien" (§8) no se toca, y se
construye sobre lo que el autor ya aprobó (las tres escenas de Sobre mí, el mazo de carrera, el pop-up "Para
reclutadores" con sus certificaciones, los bullets de LinkedIn en las tarjetas de experiencia).

Regla de idioma del autor (C7, 2026-11-07): "todo lo que esté en inglés se queda en inglés, y cuando activemos español,
todo va a ser en español". En las páginas en español no queda texto en inglés salvo nombres de tecnologías, de
productos y de cargos.

## Verificación en el código (2026-11-07)

| # | Hallazgo del doc 12 | Lo que dice el código | Consecuencia |
|---|---|---|---|
| A1–A5 | "Ver mi CV en LinkedIn" en Home, Sobre mí, Contacto y el pop-up; falta "Descargar CV" en Sobre mí | `CvActions` pone "Descargar CV" y `CvLink` (LinkedIn) juntos; `AboutDescription` solo tiene `CvLink` desde T971; el enlace al otro idioma se quitó en T970 | `CvActions` pasa a "Descargar CV" + enlace al otro idioma; LinkedIn sale de los botones y queda como "Perfil de LinkedIn" solo en el pop-up. Revierte T970 en lo visible |
| A6 | Dos llamados en la tarjeta de Synergos de Home | `HomeNow` pinta "Ver caso de estudio" y `ShowcaseLink` en la misma tarjeta | La tarjeta de Synergos deja solo `ShowcaseLink` ("Conoce Synergos"); las demás tarjetas no cambian |
| C3 | "7+ años" en el sitio y "6 años" en el CV | `aboutFigures` calcula los años desde el primer cargo web (2019) | El autor eligió el dato del CV: 6, fijo, sin la nota "desde 2019" |
| C6 | "CERRADA · 49/58" se lee como incompleta | `fuente-publica.md` de la 009 usa "cerrada" sin definirla, y el MVP no la menciona | No hay fuente que aclare el estado: se quita la etiqueta "cerrada" y queda solo el avance |
| E1, T1 | Texto justificado y guionado agresivo | El mixin `prose` de `components/site/_site.scss` declara `text-align: justify` y `hyphens: auto` | Se corrige en el mixin: alineado a la izquierda y `hyphens: manual` en todo el texto corrido |
| E2 | El dock tapa el final del contenido | `layout.dock-space` ya da `padding-bottom` al `body` y `scroll-padding-bottom` a la raíz | Ya cumple; queda fijado con la e2e de botones tapados |
| E8 | Bloque vacío al final del footer en el celular | `.inner` del footer suma 76 px (para el botón del asistente) y el `body` suma el alto del dock | En el celular el footer absorbe el espacio del dock y deja de sumar los 76 px |
| L7 | "PDF · 175 KB" en pantalla | El botón pone todo en mayúsculas (`text-transform`) | El formato del PDF no se transforma: "PDF · 175 kB" |
| L8 | Etiquetas bilingües en el diagrama de Synergos | `synergos.svg` trae las etiquetas en los dos idiomas | Una imagen por idioma, `ImageRef.localizedSrc` y un ayudante `imageSrc` |
| M1 | Lóbulos del mapa a 9 px | `clamp(8px, 2.3vw, 10.5px)` en el mapa compacto | 12 px y nodos más grandes |

## Bloques

### Bloque 1: llamados a la acción (§1 y §7 del doc 12)

- **FR-1001** (A1): el hero de Home tiene "Descargar CV" / "Download CV" (PDF del idioma de la página, con formato y
  peso) y al lado un enlace pequeño al otro idioma: "English version" / "Versión en español", con `hreflang`, `lang` y
  su peso. Sin botón de LinkedIn: LinkedIn sigue como ícono en la fila social.
- **FR-1002** (A2): "Quién soy" en Sobre mí tiene "Descargar CV" con su enlace al otro idioma, en el lugar donde estaba
  "Ver mi CV en LinkedIn". La altura de Sobre mí a 1440 px sigue bajo el tope de `tests/e2e/r3/brain.spec.ts`.
- **FR-1003** (A3): Contacto tiene el formulario, "Descargar CV" con su enlace al otro idioma y los íconos de correo y
  LinkedIn. Sin botón de LinkedIn.
- **FR-1004** (A4): el pop-up "Para reclutadores" ofrece los dos PDF visibles (el del idioma de la página como botón y
  el otro como enlace), "Perfil de LinkedIn" / "LinkedIn profile" y "Escríbeme". Conserva las certificaciones y se
  sigue abriendo con el enlace de texto (T972, T973).
- **FR-1005** (A5): el texto "Ver mi CV en LinkedIn" desaparece de todo el sitio: el enlace a LinkedIn se llama "Perfil
  de LinkedIn" / "LinkedIn profile" en el pop-up, el asistente, el índice de búsqueda y `llms.txt`, y la acción de la
  paleta es "Ver mi perfil de LinkedIn" / "See my LinkedIn profile". La paleta conserva una sola acción de descarga
  (T970).
- **FR-1006** (A6): la tarjeta de Synergos en "Ahora trabajo en" (Home) tiene un solo llamado, "Conoce Synergos" /
  "Explore Synergos", hacia `/synergos`.

### Bloque 2: coherencia y lenguaje (§2 y §3)

- **FR-1010** (C1): "Roles que busco", en este orden: frontend de alta calidad con Angular; full stack con énfasis en el
  front (.NET + Angular); AI Engineer con arneses de IA, skills y automatizaciones; apoyo al arquitecto de software
  (diseño, decisiones técnicas y ADR). Sin "Software Architect" ni liderazgo de equipos (respuesta del autor).
- **FR-1011** (C2): la frase de las fábricas de software sale de la lista y queda en una línea aparte: "Me motivan los
  equipos donde pueda mejorar su fábrica de software o proponer lineamientos, experimentos y plantillas."
- **FR-1012** (C3): la cifra de años de Sobre mí es 6, fija (dato del CV), sin la nota "desde 2019". Contacto dice
  "Llevo 6 años construyendo para la web" en vez de "desde 2019".
- **FR-1013** (C4): en "En cifras" de Sobre mí, las cifras de ADR y tests de Synergos llevan la fecha del conteo
  ("a nov 2026" / "as of Nov 2026"), sin cambiar los números.
- **FR-1014** (C5): "master product" sale del sitio. ES: "Synergos, mi proyecto insignia" / "Conoce Synergos". EN:
  "Synergos, my flagship project" / "Explore Synergos". Aplica al título y la descripción de `/synergos`, los botones de
  Home, Sobre mí y el caso 12, la paleta, `llms.txt` y el JSON-LD.
- **FR-1015** (C6): las líneas de Synergos no dicen "cerrada": muestran solo su avance ("49 de 58 tareas"). "Activa" y
  "en pausa" se quedan; la leyenda y el resumen dejan de nombrar "cerradas".
- **FR-1016** (C7): el footer en español dice "Sobrino oficial del tío Bob · SOLID viene de familia."; en inglés no
  cambia. La terminal del mapa dice "sobrino del tío Bob" en español.
- **FR-1017** (L1): "componible" / "componibles" en vez de "composable(s)" en español.
- **FR-1018** (L2): en español se traducen los conceptos de las skills y se dejan las tecnologías y los productos
  (Accesibilidad · WCAG, Arquitectura componible, Arquitectura orientada a eventos, Modernización de legado, Desarrollo
  guiado por especificaciones, y los demás conceptos de los lóbulos).
- **FR-1019** (L3): un solo término, "arnés de IA", con "(harness)" la primera vez, en Servicios y en "Para reclutadores".
- **FR-1020** (L4): la primera vez en cada página, "desarrollo guiado por especificaciones (Spec-Driven Development)";
  después basta "spec-driven".
- **FR-1021** (L5): "AI-First" solo en el cargo; en el texto corrido, "AI-first". Una prueba lo fija.
- **FR-1022** (L6): "B1 (B2 en uso profesional frecuente)" / "B1 (B2 in regular professional use)" en el pop-up, el
  lóbulo y el asistente.
- **FR-1023** (L7): el botón del CV dice "PDF · 175 kB" en pantalla y en su etiqueta accesible.
- **FR-1024** (L8): el diagrama de Synergos tiene una versión por idioma, en el portafolio y en el caso de estudio.

### Bloque 3: tipografía (§4)

- **FR-1030** (T1): el texto corrido usa `hyphens: manual`; en las páginas en español, los términos en inglés del texto
  corrido van en `<span lang="en">`.
- **FR-1031** (T2): espacio de no separación antes de ".NET" en el texto corrido.
- **FR-1032** (T3): "AI-First" no se parte en el guion (título de la carta de carrera y hero).

### Bloque 4: espacios y superposiciones (§5)

- **FR-1040** (E1): cero texto justificado en todo el sitio.
- **FR-1041** (E2): a 375 px ningún botón primario queda tapado por el dock al llevarlo a la vista.
- **FR-1042** (E3): el botón "Pregúntale a mi portafolio" se reduce a ícono al bajar por la página y deja margen
  inferior para el foco, así que no tapa los CTA de la carrera ni de Servicios.
- **FR-1043** (E4): en Sobre mí, la barra de escenas no tapa lo que se lleva a la vista (lóbulos, cifras, cartas).
- **FR-1044** (E5): los puntos de escena se ocultan cuando el footer entra en pantalla.
- **FR-1045** (E6): las cuatro cifras alinean igual su número.
- **FR-1046** (E7): la carta de carrera del celular ajusta su alto al contenido.
- **FR-1047** (E8): el footer del celular deja solo el espacio del dock bajo sus enlaces.
- **FR-1048** (E9): el filtro de tecnologías del portafolio arranca por lo más reciente (.NET, Angular, Umbraco…) y dice
  "NEXT.JS", como los skills.
- **FR-1049** (E10): la banda de "Proyectos" del portafolio deja la foto de la montaña y conserva el concepto de banner
  con el sistema de diseño actual (cristal, rejilla, esquinas y línea de barrido), sin imágenes nuevas.
- **FR-1049a** (E11, reporte del autor en Android a ~412 px): en `/synergos` y en el caso 12, el diagrama de capas no
  deja un panel vacío en el celular: el panel del rol no ocupa espacio hasta que se toca una capa. "Api" y "Bff" pasan a
  "servicios de API" y "servicios BFF" / "API services" y "BFF services".
- **FR-1049b** (E12, mismo reporte): en Contacto, el separador entre los llamados y el formulario deja de tener un hueco
  de aire arriba y abajo en el celular.

### Bloque 5: móvil (§6)

- **FR-1050** (M1): las etiquetas de los lóbulos miden al menos 12 px.
- **FR-1051** (M2): las fuentes del mapa miden 44 px de alto; en el celular se agrupan en "Aplicado en" / "Aprendido en"
  y se ven las primeras 6 con "Ver todas".
- **FR-1052** (M3): los enlaces de "Casos" en Servicios tienen 44 px de área táctil.
- **FR-1053** (M4): etiquetas del blog, "Suscríbete por RSS" y el índice del post: 44 px.
- **FR-1054** (M5): "Lee la política de privacidad" del AI Lab: 44 px.
- **FR-1055** (M6): ningún texto visible de menos de 12 px a 375 px (categorías de los casos, estados de las líneas de
  Synergos y el resto que encuentre la e2e).

## Fuera de alcance

- La sección 8 del doc 12 ("Lo que está muy bien").
- Regenerar el CV en PDF o LinkedIn con las cifras nuevas (C3, C4): lo hace el autor.
- La cuarta escena de Sobre mí y el resto de lo pendiente de la 007.

## Preguntas al autor

| # | Pregunta | Respuesta (2026-11-07) |
|---|---|---|
| C1 | Orden y texto de "Roles que busco" | Front, full stack, AI Engineer y apoyo al arquitecto; nada de "Software Architect" ni de liderar |
| C3 | ¿"desde 2019" o un número de años? | Lo que diga el CV: 6 años |
| C6 | ¿Qué significa "Cerrada"? | El autor tampoco lo entendió; si la fuente no lo aclara, se quita la etiqueta |
| C7 | ¿Se traduce el footer? | Sí: en español todo va en español |
| E10 | ¿Se queda la foto de la montaña? | No: se quita y se conserva el concepto de banner con el sistema de diseño |

## Criterios de éxito

- **SC-1001**: ningún elemento visible dice "Ver mi CV en LinkedIn" ni "master product" en ES ni en EN.
- **SC-1002**: Home, Sobre mí, Contacto y el pop-up bajan los dos PDF, cada uno con su nombre de archivo.
- **SC-1003**: `tests/e2e/ux` en verde: cero texto justificado en todas las páginas; cero texto visible de menos de
  12 px a 375 px; ningún botón primario tapado por el dock ni por el botón del asistente a 375 px.
- **SC-1004**: Sobre mí a 1440 px sigue bajo el tope de altura de la R3.
- **SC-1005**: `npm run verify` y `E2E_TIER=full` en verde, y capturas de cada página a 375, 768 y 1440 px en tema claro y
  oscuro.
