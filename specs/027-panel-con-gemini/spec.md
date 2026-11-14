# 027 — El panel con Gemini

Línea L2 de la exploración de la 018, para el autor y su equipo (017). Depende de la 020.

Estado: spec. No construida.

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
