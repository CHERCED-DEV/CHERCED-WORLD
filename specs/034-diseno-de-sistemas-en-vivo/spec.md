# 034 — Diseño de sistemas en vivo con Mini Cherced

Pedido del autor, 2026-11-14 (funcionalidades para entrevistas). La pista "Diseño de sistemas" del modo entrevista
(030). Depende de la 026 (dibujo de diagramas) y la 018 (Live).

Estado: spec. No construida.

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
