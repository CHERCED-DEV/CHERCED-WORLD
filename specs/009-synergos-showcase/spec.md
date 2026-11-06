# Feature Specification: Synergos, el showcase

**Feature Branch**: `009-synergos-showcase`, sobre `007-pulido-y-conversion`

**Created**: 2026-11-06

**Status**: Draft, aprobado en boceto por el autor

**Input**: el autor, al ver el boceto de la línea de ensamblaje: "esto debería ser por sí mismo una página… para ampliar
sobre esto, que es básicamente mi master product, mi showcase". El boceto aprobado está en
[`../007-pulido-y-conversion/bocetos/linea-de-ensamblaje.html`](../007-pulido-y-conversion/bocetos/linea-de-ensamblaje.html).

## Principio

Rige el de la 002: se enriquece, no se reemplaza. Tokens, paleta (negro, blanco y `#25ED9E`), tipografía, cristal y el
fondo animado no se tocan (D1). ES y EN en todo. Cero invención: solo los datos de [fuente-publica.md](./fuente-publica.md).
El repo raíz de Synergos sigue privado hasta el MVP; la página enlaza solo lo público.

## Página `/[lang]/synergos`

1. **Hero**: "Synergos" y la idea "el octavo negocio cuesta menos que el primero" (ya es el resumen del caso 12). Botones:
   catálogo en vivo, código (los tres repos) y el caso de estudio.
2. **Qué es**: las tres capas (CDN de componentes Angular y Preact, Umbraco 13 que compone, backend .NET con sus
   servicios), reusando el diagrama del caso 12 (`cdn`, `umbraco`, `micro-frontends`).
3. **Los verticales**: una tarjeta por vertical, con una frase y su estado.
4. **La línea de ensamblaje**: el diagrama del boceto, renderizado en el servidor como SVG. En móvil, los carriles van en
   vertical y bajan hacia el director. Con movimiento reducido, sin pulsos.
5. **Hitos del MVP y cifras**, con la fecha del conteo visible.
6. **Cómo se construye**: enlaces al caso 13 ("Director y líneas") y a Synergos.Fabrica.

## Accesos

Home ("Ahora trabajo en", en la tarjeta de Synergos), el caso 12, la paleta (`> synergos`), el footer, el sitemap, el
asistente y `llms.txt`. El menú principal no cambia sin aprobación del autor.

## Requisitos

- **FR-901**: la página se renderiza en el servidor y se lee completa sin JS.
- **FR-902**: el diagrama tiene una alternativa en texto (lista de líneas con su estado y tareas).
- **FR-903**: la página tiene metadatos, imagen OG propia con la plantilla de la 004 y JSON-LD (`SoftwareApplication` o
  `CreativeWork` enlazado a la `Person`).
- **FR-904**: los datos viven en un solo archivo de contenido (`content/synergos-showcase.ts`), con la fecha del conteo,
  para actualizarlos a mano en cada release.
- **FR-905**: responsive de 320 a 2560 px, axe sin violaciones serias, teclado y movimiento reducido.

## Preguntas al autor

| # | Pregunta | Por defecto |
|---|---|---|
| P-901 | ¿Actualizar las cifras del sitio a 140+ ADR y 6.600+ tests (hoy dicen 130+ y 2.300+)? | Sí, con la fecha |
| P-902 | "31 piezas" no se pudo verificar en el repo. ¿Sigue valiendo? | Se deja como está |
| P-903 | ¿"Synergos" entra al menú principal? | No, por ahora |

## Idea en espera: patrones aplicados (2026-11-06)

El autor quiere mostrar conocimiento de patrones como en las láminas de "20 microservices patterns", sin saturar. Propuesta:
no es una galería genérica (la lámina de referencia tiene autor y derechos), sino un "atlas de patrones aplicados":
solo los que el autor usó de verdad (saga, BFF, composición de APIs, consumidor idempotente, outbox, anti-corruption
layer, strangler fig, mensajería por eventos…), cada uno con su evidencia: el caso, la ADR o el código. Vive dentro del
showcase de Synergos y de los casos, no como otra sección suelta. Se especifica con el autor cuando cierre la 009.

## Fase 2: la arquitectura por dentro (pedido del autor, 2026-11-06)

El autor quiere detallar, con la misma calidad del showcase:

- cómo maneja los frameworks: Angular (y Preact) aislados en la CDN, que alimentan las vistas Razor de Umbraco;
- las composiciones en Umbraco y la "sinergia tecnológica" (C# y TypeScript con el mismo linaje de diseño);
- el diseño atómico y los componentes;
- la accesibilidad;
- el embebido y BroadcastChannel / `postMessage` entre ventanas.

Fuentes publicables: los repos públicos Synergos.CMS y Synergos.UI (README, ADR, código). Si el embebido viene del
trabajo en el empleador, se cuenta solo la arquitectura, anonimizada, sin nombres ni cifras (regla de la 004). Se arma
con una entrevista corta y un boceto, después de integrar la fase 1, y puede alimentar el atlas de patrones aplicados.
