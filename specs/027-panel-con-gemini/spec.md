# 027 — El panel con Gemini

Línea L2 de la exploración de la 018, para el autor y su equipo (017). Depende de la 020.

Estado: construida el 2026-11-15 (ver «Cómo quedó»). La portada generada se descarga; guardarla en el sitio queda pendiente porque pide almacenamiento de imágenes.

## Qué hace

Herramientas de IA dentro del panel (`/inbox`) para escribir y moderar más rápido:

- **Traducir el borrador** de español a inglés o al revés, respetando el formato MDX. El sitio exige los dos idiomas y
  los posts invitados (017) también los necesitan.
- **Revisar el borrador** contra las reglas de estilo del sitio (por ejemplo C-02) antes de enviarlo a revisión o de
  publicarlo, con cada hallazgo señalado en su línea.
- **Proponer** la descripción, las etiquetas y el texto alternativo de las imágenes.
- **Ordenar los comentarios pendientes** por probabilidad de spam. Se envía solo el texto del comentario, sin nombre
  ni correo.
- **Portada generada** con el modelo de imagen, en el estilo de las portadas actuales, como alternativa al generador
  de SVG.

## Costo estimado

- Traducir o revisar un post: ~0,01 USD. Una portada: ~0,045 a 0,067 USD.

## Requisitos

- **FR-2701** Solo para el autor y para quien tenga el permiso "posts" o "comments" (017).
- **FR-2702** Nada se aplica solo: cada propuesta se acepta o se descarta.
- **FR-2703** La traducción conserva el MDX (componentes, enlaces y código) y lo valida antes de mostrarla.
- **FR-2704** Sin datos personales de visitantes en lo que va a Google.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-2701 | ¿Las reglas de estilo están escritas en un solo archivo que se pueda pasar como instrucción? | Reunirlas en uno |

## Cómo quedó (2026-11-15)

- **P-2701** Las reglas de estilo viven en un solo archivo, `content/style-rules.ts` (E-01 a E-12), reunidas de D-03 y
  §10 del inventario de la 001 y del estilo de los posts de 2026. Ese archivo va en la instrucción de traducir, revisar y
  proponer.
- **Asistente con Gemini** en el editor del blog (`components/admin/editorial/GeminiAssist.tsx`), para el autor y para
  quien tenga el permiso «posts» (FR-2701). Acciones de servidor en `lib/actions/editorial-ai.ts`:
  - **Traducir** al otro idioma conservando el Markdown. **FR-2703:** se compara la estructura (bloques de código,
    títulos, enlaces, imágenes y código en línea) y, si cambió, se avisa antes de aceptar. Aceptar crea un borrador nuevo
    en el otro idioma, sin guardar, para revisarlo.
  - **Revisar el estilo:** hallazgos con línea, regla, cita y sugerencia; la línea y la regla se validan con Zod contra
    el borrador y el archivo de reglas. «Ir a la línea» la selecciona en el editor.
  - **Proponer** descripción, etiquetas y texto alternativo de cada imagen, cada uno con su «Usar» o «Aplicar».
  - **Portada** con `gemini-3.1-flash-image` en el estilo del sitio (16:9, sin texto). Se muestra y se descarga en PNG;
    el sitio todavía no guarda portadas de imagen (pide almacenamiento), así que la portada SVG sigue siendo la del post.
- **Comentarios pendientes:** «Calificar con Gemini» en la vista de pendientes ordena por probabilidad de spam, con el
  motivo y un enlace a cada comentario. **FR-2704:** a Google va solo el texto del comentario, sin nombre, correo ni id.
- **FR-2702** Nada se aplica solo: todo es una propuesta que se usa o se descarta.
- Topes: 80 usos al día por persona del panel y 200 en total; portadas, 6 por persona y 12 en total. El gasto sale en el
  panel.
- Sin la clave de Gemini, cada acción responde con un ejemplo del simulador.
- Tests: `tests/unit/editorial/gemini-assist.test.ts`.
- **Probada con Gemini real (2026-11-26):** la revisión encontró el título genérico (E-12), «increíble y revolucionaria» (E-07) y la imagen sin alt (E-11), cada uno en su línea; la traducción conservó enlace, imagen y código; la portada salió en 16:9 con el estilo del sitio. Ajustes tras la prueba: reintento si la respuesta no valida, y el texto alternativo nunca vuelve vacío (se deduce del nombre del archivo y del texto). Ordenar spam no se probó en real por falta de comentarios de prueba.
