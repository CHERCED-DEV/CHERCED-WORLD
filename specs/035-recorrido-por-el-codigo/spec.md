# 035 — Recorrido por el código

Pedido del autor, 2026-11-14 (funcionalidades para entrevistas). Para el líder técnico que quiere ver código real.
Depende de la 020.

Estado: spec. No construida.

## Qué hace

El visitante elige un archivo de los repos públicos del autor (este sitio y los de Synergos) o una pieza destacada
("el cliente de Gemini Live", "el motor de la caja de cristal", "el simulador de sagas"). Gemini explica qué hace, por
qué está escrito así y qué decisión de arquitectura refleja, con enlaces a las líneas exactas en GitHub. Se puede
preguntar "¿por qué no usaste X?".

## Cómo

- **Lista cerrada de repos y rutas** en la configuración. El servidor descarga el archivo crudo de GitHub solo si está
  en esa lista; nada de URLs libres.
- Gemini (`gemini-3.8-flash`) con el archivo y, si existen, la spec y el ADR relacionados del repo.
- Salida estructurada: resumen, secciones con rango de líneas, decisiones y preguntas sugeridas.
- La vista muestra el código con resaltado (el que ya usa el blog) y las explicaciones al lado, enlazadas a las líneas.

## Costo

- ~0,01 USD por explicación. Las piezas destacadas se pueden pregenerar y guardar como contenido (costo cero al
  visitante).

## Requisitos

- **FR-3501** Solo repos y rutas de la lista; cualquier otra ruta responde 404.
- **FR-3502** Archivo máximo de 1.500 líneas; si es más largo, se elige un rango.
- **FR-3503** Los rangos de líneas se validan contra el archivo antes de mostrarse.
- **FR-3504** Sin datos del visitante: solo envía código público.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-3501 | ¿Qué piezas destacadas? | Cliente de Live (018), caja de cristal (A5), sagas (R1), guardas de seguridad (R4.1) |
