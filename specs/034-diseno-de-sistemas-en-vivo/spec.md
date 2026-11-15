# 034 — Diseño de sistemas en vivo con Mini Cherced

Pedido del autor, 2026-11-14 (funcionalidades para entrevistas). La pista "Diseño de sistemas" del modo entrevista
(030). Depende de la 026 (dibujo de diagramas) y la 018 (Live).

Estado: construida el 2026-11-15 como la pista "Diseño de sistemas" del modo entrevista (030), con su propio dibujante de diagramas (la 026 sigue pendiente).

## Qué hace

El entrevistador plantea un problema ("diseña un acortador de URLs para 10 millones de usuarios"). Mini Cherced hace
dos o tres preguntas de alcance, como en una entrevista real, y luego dibuja la arquitectura paso a paso mientras la
explica. Cada decisión aparece como una tarjeta de decisión (decisión, por qué y qué se sacrifica), el mismo formato
de los casos del portafolio. El entrevistador puede objetar ("¿y si se cae la cola?") y el diagrama cambia.

## Cómo

- Sesión Live de V5 con una herramienta nueva, `actualizar_diagrama(diagrama)`: el agente manda el diagrama completo
  como JSON con esquema (nodos, conexiones y grupos) y el sitio lo dibuja con el motor de la 026. Nunca se ejecuta
  código del modelo.
- Herramienta `registrar_decision(decision, por_que, sacrificio)` para las tarjetas.
- Se apoya en los patrones de la arquitectura de Synergos publicada en el sitio, y los cita cuando aplican.

## Costo

- Como V5: ~0,10 USD por sesión de 5 minutos. Con reanudación (030) llega a 10 minutos.

## Requisitos

- **FR-3401** Esquema del diagrama validado en el navegador; un diagrama inválido se ignora y el agente recibe el error.
- **FR-3402** Máximo 30 nodos y 5 grupos.
- **FR-3403** Exportar el diagrama (SVG) y las decisiones (Markdown) al terminar.
- **FR-3404** Las tarjetas de decisión usan el mismo componente de las decisiones de los casos.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-3401 | ¿Problemas sugeridos? | 5 clásicos (acortador, chat, feed, pagos, buscador) y uno libre |

## Cómo quedó (2026-11-15)

- **Pista:** "Diseño de sistemas" se activa en el modo entrevista con 6 problemas sugeridos en ES y EN (P-3401):
  acortador, chat, feed, pagos, buscador y una plataforma componible tipo Synergos. También se puede preguntar libre.
- **Instrucción:** primero dos o tres preguntas de alcance; después el diagrama paso a paso, las decisiones y los
  patrones de Synergos citados con `mostrar_fuente`.
- **Herramientas:**
  - `actualizar_diagrama`: el diagrama completo como JSON. Se valida con Zod: ids únicos, conexiones a nodos que
    existen, máximo 30 nodos y 5 grupos (FR-3401, FR-3402). Uno inválido se ignora y el agente recibe el motivo.
  - `registrar_decision`: decisión, por qué y sacrificio.
- **Dibujo:** `lib/ai/agent/design.ts` acomoda los nodos por capas, de izquierda a derecha, y `DesignBoard` los dibuja
  en SVG con grupos, flechas y etiquetas. Nunca se ejecuta código del modelo. No depende de la 026: cuando exista, se
  puede cambiar el dibujante.
- **Decisiones (FR-3404):** usan `AdrCards`, el mismo componente de los casos.
- **Exportar (FR-3403):** el diagrama en SVG y las decisiones en Markdown. El acta de la entrevista suma las decisiones
  y el diagrama en Mermaid.
- **Simulador:** en local muestra un diagrama y una decisión de ejemplo, para revisar la pizarra sin gastar.
- **Pendiente:** objetar y redibujar solo se prueba con Gemini de verdad, y la reanudación para pasar de 5 minutos es
  la misma pendiente de la 030.
