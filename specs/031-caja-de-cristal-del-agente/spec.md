# 031 — Caja de cristal del agente

Pedido del autor, 2026-11-14 (funcionalidades para entrevistas). Para líderes técnicos que quieren ver ingeniería,
no solo una demo. Depende de la 018.

Estado: construida el 2026-11-14. Probada en el simulador local (escritorio y celular) y con pruebas unitarias del
camino con Gemini; falta verla en una conversación real cuando la clave nueva esté en Vercel.

## Cómo quedó

- `lib/ai/pricing.ts`: precios de Gemini por millón de tokens (consultados el 2026-11-14 en la página oficial) y la
  TRM de 3.297 pesos del 2026-11-11. Es la configuración versionada que pide FR-3103 y que usará la 020.
- `lib/ai/agent/usage.ts` lee `usageMetadata` (por modalidad: texto, audio, imagen) y calcula el costo.
- `lib/ai/agent/trace.ts` arma los turnos: pregunta, fin de habla (señal `voiceActivity` de Gemini o el envío del
  texto), primer audio, herramientas con sus argumentos, resultados, puntaje y milisegundos, tokens, costo e
  interrupciones. Resume turnos, latencia p50 y p95, tokens y costo, y exporta el JSON.
- `components/ailab/agent/TracePanel.tsx`: el botón "Cómo pensó (n)", cerrado por defecto, con `aria-expanded`.
- En el simulador también funciona: muestra la búsqueda con sus puntajes y el costo en cero.

## Pendiente

- Probar con Gemini Live de verdad que `usageMetadata` llega una vez por turno, como en la prueba del 2026-11-14.

## Qué hace

Debajo de la conversación con Mini Cherced, un panel "Cómo pensó" muestra, por cada respuesta, la traza completa: qué
herramientas llamó y con qué argumentos, qué encontró, cuánto tardó, cuántos tokens usó y cuánto costó. Es la misma
idea de "caja de cristal" del buscador A5, aplicada al agente.

## Qué muestra cada turno

- **Tiempos:** desde que el visitante deja de hablar hasta el primer audio (latencia percibida) y la duración total.
- **Herramientas:** `buscar_en_el_sitio("…")` → los resultados con su puntaje; `abrir_pagina("…")` → la ruta.
- **Tokens:** entrada, salida y audio, desde el `usageMetadata` que manda la Live API.
- **Costo estimado:** en USD y COP, calculado con los precios de la configuración (020).
- **Modelo y voz.**
- Un resumen de la sesión: turnos, latencia p50 y p95, tokens y costo total.

## Requisitos

- **FR-3101** Todo se calcula en el navegador con los mensajes que ya llegan por la sesión; no se manda nada nuevo al
  servidor y no se guarda.
- **FR-3102** El panel está cerrado por defecto y se abre con un botón accesible.
- **FR-3103** Los precios salen de la configuración versionada, con su fecha de consulta.
- **FR-3104** Exportar la traza de la sesión como JSON.

## Costo

- Cero: usa datos que la sesión ya recibe.

## Por qué sirve en una entrevista

Muestra observabilidad, control de costos y diseño de herramientas de un agente, que es lo que se pregunta en roles
de AI Engineer.
