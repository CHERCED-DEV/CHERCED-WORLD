# 030 — Modo entrevista con Mini Cherced

Pedido del autor, 2026-11-14 (funcionalidades para entrevistas). Para entrevistadores. Depende de la 020 y extiende
V5 (018).

Estado: spec. No construida.

## Qué hace

El entrevistador elige un tipo de entrevista y le pregunta a Mini Cherced por voz o por texto. Mini Cherced responde
como lo haría un candidato bien preparado, pero solo con lo que está publicado, y mientras habla aparecen en pantalla
las fuentes de cada respuesta. Al final queda un acta descargable.

## Flujo exacto

1. **Elegir pista:** Conductual (método STAR), Técnica (frontend, arquitectura e IA aplicada) o Diseño de sistemas
   (lo hace la 034).
2. **Banco de preguntas.** Cada pista trae 8 preguntas sugeridas como botones ("Cuéntame un conflicto técnico y cómo lo
   resolviste", "¿Por qué Next.js y no Angular en tu portafolio?"…). También se puede preguntar libre.
3. **Respuesta con estructura.** En la pista conductual, la respuesta sigue Situación, Tarea, Acción y Resultado, y
   cada parte sale de un caso del portafolio. Si no hay un caso que la respalde, lo dice.
4. **Fuentes en pantalla.** Herramienta nueva `mostrar_fuente(docId)`. Cada vez que el agente usa un caso, una decisión
   o un post, aparece una tarjeta con su título y su enlace. Solo ids que existen en el índice.
5. **Cronómetro y turnos.** Un reloj de entrevista y la lista de preguntas hechas.
6. **Acta.** "Terminar entrevista" arma un acta en Markdown: preguntas, resumen de cada respuesta y fuentes citadas.
   Se descarga; no se guarda en el sitio.

## Reglas del agente en este modo

- Habla de Camilo en tercera persona y nunca inventa cifras, fechas, empleadores ni tecnologías.
- Ante preguntas de salario, disponibilidad o contrato, remite a Contacto.
- Ante preguntas trampa o fuera de lugar, conserva el tono de la 018 ("eres raro, pero está bien…").

## Costo y topes

- Como V5: ~0,10 USD por entrevista de 5 minutos. Una entrevista puede durar 10 minutos (dos sesiones encadenadas con
  reanudación de sesión).

## Requisitos

- **FR-3001** Tres pistas con su banco de preguntas en ES y EN, versionado como contenido.
- **FR-3002** `mostrar_fuente` acepta solo ids del índice; un id inexistente se ignora y se registra.
- **FR-3003** Acta descargable en Markdown con fecha, pista, preguntas y fuentes.
- **FR-3004** Reanudación de sesión para pasar de 5 minutos sin perder el contexto.
- **FR-3005** Evaluada con las evals de la 032 (pista conductual y técnica).

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-3001 | ¿Camilo escribe el banco de preguntas o lo propone Gemini y él lo aprueba? | Lo propongo yo y él lo aprueba |
