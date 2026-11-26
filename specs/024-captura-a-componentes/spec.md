# 024 — De captura a componentes (A6)

Del catálogo de la 003 (A6, camino B), habilitado por la 018. Depende de la 020.

Estado: construida el 2026-11-15 como tarjeta **A8** (la A6 ya era «¿Encajo en tu vacante?»). Ver «Cómo quedó».

## Qué hace

El visitante sube la captura de una interfaz y Gemini propone cómo construirla con las piezas del sistema de diseño de
Synergos: qué primitivas y composiciones usar, cómo se anidan y qué falta. La respuesta sale como un árbol de
componentes y un bosquejo en pixel art de la pantalla.

## Cómo

- Gemini con visión (`gemini-3.8-flash`) y salida estructurada (JSON con esquema): componentes, props sugeridas y
  huecos.
- El catálogo de piezas de Synergos va en la instrucción, desde el contenido público que ya tiene el sitio
  (`content/synergos*.ts`).
- La imagen no se guarda.

## Costo estimado

- ~0,005 USD por análisis (una imagen y una respuesta de ~1.000 tokens).

## Requisitos

- **FR-2401** Subir una imagen (PNG o JPG, máximo 5 MB) o pegar una del portapapeles.
- **FR-2402** Respuesta con esquema validado en el servidor; si no valida, se reintenta una vez.
- **FR-2403** Mostrar el árbol con nombres reales de piezas de Synergos y enlace a su documentación pública.
- **FR-2404** Consentimiento de la 020 antes de enviar la imagen.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-2401 | ¿La lista de piezas de Synergos es pública y está al día? | Usar solo lo que ya publica el sitio |

## Cómo quedó (2026-11-15)

- **Tarjeta A8** en «Con Gemini», después de A7. El ID cambió porque la A6 ya la usa «¿Encajo en tu vacante?» (029).
- **P-2401** Synergos no publica la lista de sus piezas, así que no se inventa: A8 usa el sistema de diseño de **este
  sitio**, que es público en el repo (`content/ailab/ui-pieces.ts`: 20 piezas con su archivo), ordenado en las capas
  atómicas de Synergos (primitiva, composición, módulo). Cada pieza del árbol enlaza a su código en GitHub (FR-2403).
- **FR-2401** Se sube, se arrastra o se pega una imagen (PNG, JPG o WebP, hasta 5 MB). El navegador la reduce a 1.024 px
  en JPEG antes de enviarla, para gastar menos y no chocar con el límite de cuerpo de Vercel. También hay «Usar una captura
  de ejemplo» (un panel de administración de un proyecto propio) para probar sin subir nada.
- **FR-2402** `POST /api/ailab/shot` manda la imagen a `gemini-3.8-flash` con visión y un esquema: nodos con `pieza`
  (solo ids del catálogo o «nueva»), `padre`, `props`, `caja` en una cuadrícula de 32 y `huecos`. Zod valida piezas,
  padres, ids repetidos y ciclos, y ajusta las cajas; si no valida, reintenta una vez.
- La respuesta se ve como árbol numerado, un bosquejo en pixel art (cajas verdes; las piezas nuevas en amarillo y con
  línea punteada) y la lista de lo que falta. Se descarga como JSON.
- **FR-2404** Pide el consentimiento único de Gemini (020). La imagen no se guarda.
- Topes: 5 análisis por visitante al día y 60 en total. El gasto sale en el panel.
- Sin la clave de Gemini, el simulador devuelve el análisis de la captura de ejemplo.
- Tests: `tests/unit/x0/gemini-shot.test.ts`; el catálogo, la página del laboratorio y los e2e de teclado y de tarjetas
  cuentan 16 experimentos. El guardián T760 ahora deja que las tarjetas de Gemini hablen solo con rutas `/api/` del sitio.
- **Probada con Gemini real (2026-11-26):** la captura de ejemplo dio en 20 s un árbol válido de 10 nodos y dos huecos honestos (no hay barra lateral ni tabla de datos en el sistema).
