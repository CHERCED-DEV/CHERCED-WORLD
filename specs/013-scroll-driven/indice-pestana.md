# Navegación de secciones: pestaña fija y puntos (013, fuera de C1 a C8)

Empezó como el índice de Sobre mí. El autor lo probó en su teléfono y lo pidió como estándar de navegación de todas las
páginas con varias secciones: arriba la pestaña con la sección actual y su línea de progreso, y a la derecha los puntos
para saltar. Pidió reutilizarlo, sin componentes nuevos.

## El componente

`components/site/section-nav/` (antes `components/site/about/SceneNav*`, movido con `git mv`):

- `SectionNav.tsx` pinta la pestaña y los puntos. Recibe `label` y `sections` (`{ id, label }` ya traducidos). El
  número sale de la posición. No sabe de qué página es.
- `model.ts` reúne la lógica pura:
  - estado abierta o compacta;
  - geometría del compactado;
  - sección más visible;
  - filtro de ids seguros (máximo 12);
  - `localizeSections` para que cada página pase etiquetas ES/EN;
  - el CSS que liga cada sección con su línea.
- `SectionNav.module.scss` tiene los estilos. Los atributos `data-cw-scene-*` se conservan: son el contrato de las
  pruebas existentes.

La línea de progreso de C1 ya no depende de la página:

- El componente emite un `<style>` que da a cada sección `view-timeline: --cw-section-N` (dentro de `@supports` y
  `prefers-reduced-motion: no-preference`).
- Ese `<style>` también funciona sin JS.
- La hoja del componente pone `timeline-scope` en `:root` y une cada enlace y cada punto con su línea por
  `data-cw-scene-index`.

## Dónde se usa

Cada página pasa sus secciones como datos y solo agrega `id` a las secciones que no lo tenían, sin mover nada:

| Página | Secciones |
| --- | --- |
| Sobre mí | Quién soy, Carrera, Lo que sé, Hacia dónde voy |
| Servicios | Resumen, Para quién, Servicios, Proceso, Casos, Preguntas, Hablemos (casos y preguntas solo si existen) |
| Caso del portafolio | Resumen, Destacados, En vivo, Contexto, Mi rol, Decisiones, Resultado, Tecnologías (las que tenga el caso) |
| `/synergos` | Synergos, Qué es, Verticales, Línea de ensamblaje, Hitos, Cómo se construye |
| AI Lab | Un enlace por tema, con los ids que ya tenía cada sección |
| `/now` | Ahora, los bloques que tenga y Mis lemas |

- Quedan fuera las páginas cortas (Contacto, Privacidad, 404), el inicio (lo lleva la sesión del scroll del inicio) y
  `/synergos/arquitectura`, que lo monta su sesión.
- En el blog no se tocó nada: abajo está la propuesta.

## Comportamiento (igual en todas)

- **Celular y tableta (< 768 px).**
  - La pestaña va pegada al borde izquierdo, 8 px bajo el header, recta contra el marco y redonda en la punta.
  - Mide 48 px de alto y sus enlaces 46 px.
  - Nunca pasa de `100vw - 14px`, así que la punta no se corta aunque la página no tenga contenedor.
- **Al bajar se compacta** en el número y la sección actual, con su línea. **Al subir, al tocarla o con el foco de
  teclado se despliega.** El toque que la despliega no navega.
- **La sección activa es la última que cruzó la línea de lectura** (`activeHeading` y `spyLine` de `lib/blog/progress`,
  las mismas del índice del blog).
  - La línea está bajo el header, a un cuarto de la pantalla.
  - Al final de la página se marca la última sección a la vista.
  - Antes se elegía la sección con más proporción visible. Eso perdía las secciones muy altas, como "patrones" de
    `/synergos/arquitectura`, que mide unos 7000 px en el celular.
- **El indicador de la sección activa se desliza** (FLIP con `transform`).
- **Etiquetas en minúscula en < 768 px.** Si no caben, la pista se desplaza con un desvanecido y la activa queda
  centrada.
- **Tab no mueve la página** (`scroll-margin-block` amplio en los enlaces). El foco no queda tapado (WCAG 2.4.11).
- **Escritorio (≥ 768 px):**
  - centrada, en mayúsculas, con números y sin compactarse;
  - limitada al ancho del contenedor;
  - las etiquetas largas se acortaron en los datos de la página (Destacados, En vivo, Decisiones, Verticales, Hitos).
- **Puntos (< 480 px):** uno por sección, fuera del orden de Tab, y se ocultan sobre el pie.
- **Sobre el pie la pestaña también se aparta.** Fuera de Sobre mí la pestaña es sticky dentro de `main`, sin relleno
  abajo, así que al final de la página bajaba hasta tapar lo último, como el CTA de Servicios. Ahora se desvanece cuando
  aparece el pie, salvo que tenga el foco de teclado.
- **Movimiento reducido:** no se compacta ni anima, y el indicador salta. **Sin JS:** queda fija y entera.
- Sin blur propio en celular (presupuesto de 3), solo `translate`, `transform` y `opacity` (FR-653), y sin colores,
  tokens ni dependencias nuevas.

## El botón flotante sobre los puntos

- Es la **barra de herramientas de Vercel** (Vercel Toolbar).
- Vercel la inyecta solo en las vistas previas (`vercel.live/_next-live/feedback`), a media altura en el borde derecho.
- No es del sitio y no sale en producción, así que no se toca el código.
- En el teléfono se puede arrastrar, ocultar desde su menú o apagar para las vistas previas en la configuración del
  proyecto en Vercel. Esa configuración es del autor.

## Propuesta para el blog (pendiente del autor)

Hoy un post tiene:

- el índice lateral (`Toc`) desde 1248 px;
- un botón flotante que abre el índice en una hoja (`TocSheet`) debajo de 1248 px;
- la barra de lectura arriba (`ReadingProgress`).

Hay dos formas de unificarlo sin duplicar acciones:

- **A (recomendada).**
  - Debajo de 1248 px, la pestaña reemplaza el botón flotante.
  - Compacta muestra el título actual (h2) con la línea de progreso de lectura, que reemplaza la barra de arriba.
  - Al tocarla abre la misma hoja con todos los títulos, porque los títulos de los posts son largos para una fila.
  - El índice lateral de escritorio no cambia.
- **B.** La pestaña completa como en las otras páginas, solo con los h2, más los puntos. Se retiran la hoja y la barra.
  Con títulos largos la fila se desplaza mucho.

## Pruebas

- **Unitarias:** `tests/unit/rel/section-nav.test.ts` cubre:
  - estado y geometría;
  - sección más visible;
  - ids seguros y límite;
  - `localizeSections`;
  - el CSS de las líneas;
  - que el componente no nombre ninguna página;
  - el marcado sin JS y la guarda de movimiento.
- **E2E de Sobre mí** (`tests/e2e/rel/indice-pestana.spec.ts`): anchos de 375, 390 y 412 px, ES y EN, toque, indicador,
  movimiento reducido, teclado y axe en claro y oscuro.
- **E2E del estándar, en la misma prueba:** recorre Sobre mí, Servicios (ES y EN), un caso, `/synergos`, AI Lab y
  `/now`, en celular, escritorio y sin JS. Revisa que:
  - cada enlace lleve a una sección que existe;
  - haya un punto por sección;
  - la pestaña quede fija y no tape el h1;
  - al bajar se compacte con el número correcto, y no haya violaciones de axe;
  - en escritorio quepa sin desplazarse.

## Hallazgos fuera de este cambio

- **Altura a 1440 px.** `p2/about.spec.ts:209` mide 3585 px contra un tope de 3529 en ES. Los 56 px de más coinciden con
  el botón "No tocar" del pie (015).
- **AI Lab:** el héroe ya tiene enlaces a los temas, así que arriba de la página hay dos accesos a lo mismo. Hay que
  decidir si se retiran los del héroe.
