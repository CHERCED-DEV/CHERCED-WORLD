# 026 — Texto → diagrama (A9)

Del catálogo de la 003 (A9, variante B), habilitado por la 018. Depende de la 020.

Estado: spec. No construida.

## Qué hace

"Un BFF que llama a tres servicios y una cola" se vuelve un diagrama de arquitectura en vivo, con el estilo visual de
la arquitectura de Synergos del sitio. Se puede pedir un cambio ("agrega un caché") y el diagrama se actualiza.

## Cómo

- Gemini de texto con salida estructurada: nodos, conexiones y grupos en JSON con esquema.
- El sitio dibuja el diagrama con su propio SVG; nunca ejecuta código generado por el modelo.
- Exportar como SVG o PNG.

## Costo estimado

- Menos de 0,01 USD por diagrama.

## Requisitos

- **FR-2601** Esquema validado en el servidor y límite de 40 nodos.
- **FR-2602** Pedir cambios sobre el diagrama actual, con historial de deshacer.
- **FR-2603** Accesible: el diagrama tiene una descripción en texto y una lista navegable de nodos.
- **FR-2604** Consentimiento de la 020.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-2601 | ¿Reutilizar el dibujo de la arquitectura de Synergos o uno nuevo en pixel art? | Reutilizar el de Synergos |
