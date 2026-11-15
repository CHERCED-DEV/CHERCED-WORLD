# 035 — Recorrido por el código

Pedido del autor, 2026-11-14 (funcionalidades para entrevistas). Para el líder técnico que quiere ver código real.
Depende de la 020.

Estado: construida el 2026-11-15 en `/{lang}/ai-lab/codigo`, con las piezas de este sitio. Los repos de Synergos quedan para cuando sean públicos.

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

## Cómo quedó (2026-11-15)

- **Página propia:** `/{lang}/ai-lab/codigo`, enlazada desde Mini Cherced. Es una página aparte y no una tarjeta del
  catálogo, para no tocar los 13 experimentos.
- **Lista cerrada (FR-3501, P-3501):** `content/ailab/code-tour.ts`, con 6 piezas de este repo en la rama `dev`:
  - el cliente de Gemini Live, la caja de cristal y el simulador de sagas;
  - las guardas de sesión, el calificador de evals y la pizarra de diseño.

  Cualquier otro id responde 404. El archivo se lee de `raw.githubusercontent.com`; nunca de una URL libre.
- **Explicación:** `gemini-3.8-flash` con salida validada: resumen, de 3 a 6 secciones con su rango, hasta 3
  decisiones y 3 preguntas de entrevistador. Los rangos se validan contra el archivo y los inventados se descartan
  (FR-3503). Los archivos de más de 1.500 líneas se recortan (FR-3502).
- **Caché:** la explicación sin pregunta se guarda 7 días en la caché de datos de Vercel, así que cada pieza se paga una
  vez por idioma. Las preguntas libres ("¿por qué no usaste X?") se responden en vivo, con límite por IP.
- **Privacidad (FR-3504):** solo se envía código público, más la pregunta que escriba el visitante.
- **Simulador:** sin la clave, arma las secciones por cada `export` y lo dice.
- **Pendiente:** cambiar la rama a `main` después del release, y sumar Synergos cuando su repo sea público.
