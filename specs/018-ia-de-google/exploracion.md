# 018 — IA de Google en el sitio (exploración)

Pedido del autor, 2026-11-14: al configurar Google para la 017 vio "Crear clave de API de Gemini" en la consola y
pidió explorar qué integraciones con la IA de Google puede tener el sitio y abrir líneas de trabajo.

Estado: exploración. No hay nada construido ni decidido.

## Dos maneras de usar Gemini

### 1. Gemini Nano dentro de Chrome (sin llave)

Chrome trae un modelo pequeño de Gemini que corre en el equipo del visitante. La página lo llama con APIs del
navegador: no hay llave, ni costo, ni servidor, y nada sale del equipo. Cabe en el camino A de la 003 tal como está:
el principio VIII y FR-320 no cambian.

- **APIs estables:** Summarizer, Translator y Language Detector desde Chrome 138, y la Prompt API para páginas web
  desde Chrome 148. Writer, Rewriter y Proofreader siguen en prueba para desarrolladores.
- **Dónde funciona:** solo en Chrome de escritorio, con Windows 10 u 11, macOS 13 o posterior, Linux o un Chromebook
  Plus. No funciona en Android ni en iPhone. Translator y Language Detector tampoco funcionan en celular.
- **Qué pide al equipo:** 22 GB libres, y una GPU con más de 4 GB de memoria o 16 GB de RAM con 4 núcleos. El modelo se
  descarga una vez y solo con una conexión sin límite de datos.

### 2. La API de Gemini (con llave)

Corre en los servidores de Google. Hay modelos de texto (Flash y Flash-Lite), de voz (TTS), de transcripción, de
traducción en vivo, de embeddings y de imágenes ("Nano Banana").

- **Cuota gratis:** el texto, la voz, la transcripción y los embeddings la tienen. Las imágenes no.
- **La condición que importa:** en la cuota gratis, Google usa lo que se le envía y lo que responde para mejorar sus
  productos. Con la facturación activa, no lo usa. Al activar la facturación se cobra todo el uso del proyecto.
- **Lo que choca:** la llave es un secreto nuevo con una variable nueva en Vercel (`GEMINI_API_KEY`), y un proveedor
  externo con clave nueva. El principio VIII (NON-NEGOTIABLE) lo prohíbe. Es el camino B de la 003, que sigue abierto
  (P-3a). Para usarlo, el autor tiene que aprobar una enmienda, como hizo con Google en la 017.

## Líneas de trabajo

### L1 — Gemini Nano en el navegador (camino A; se puede empezar ya)

- **L1.1 Respuestas en el buscador por significado (A5).** Hoy el buscador corre en el navegador y muestra los
  fragmentos que encontró con su puntaje. Con la Prompt API, Gemini Nano escribe una respuesta corta que cita esos
  fragmentos, sin salir del equipo: "pregúntale a mi portafolio" sin servidor. Donde no hay Nano, queda como hoy.
- **L1.2 Resumen de cada post** con la Summarizer API: los puntos clave antes de leer. El botón sale solo donde la API
  está disponible.
- **L1.3 Traducir un comentario** escrito en otro idioma, con Language Detector y Translator. Solo en escritorio.
- **L1.4 Ficha nueva del AI Lab: "Gemini Nano en tu navegador".** Dice si el equipo lo puede correr, pide permiso
  antes de descargar (regla de la 003) y mide el tiempo de respuesta. Se contrasta con Whisper y los embeddings que ya
  corren con WASM.

Riesgo: buena parte de las visitas llega desde el celular y no lo verá. Cada pieza se esconde donde no hay Nano y no
cambia nada para ese visitante.

### L2 — Herramientas del panel para el autor y su equipo (camino B, uso interno)

Solo las usan el autor y quien tenga permiso en Personas (017).

- **L2.1 Traducir el borrador** de español a inglés o al revés. El sitio exige los dos idiomas, y los posts invitados
  también los necesitan.
- **L2.2 Revisar el borrador** contra las reglas de estilo del sitio (como C-02) antes de enviarlo a revisión o de
  publicarlo.
- **L2.3 Proponer** la descripción, las etiquetas y el texto alternativo de las imágenes.
- **L2.4 Ordenar los comentarios pendientes** por probabilidad de spam, para moderar más rápido. Se envía solo el
  texto del comentario, sin nombre ni correo.

L2.1 a L2.3 envían un borrador que va a ser público, así que la cuota gratis podría servir. L2.4 envía texto de
visitantes y pide facturación. Sin llave, L2.1 y L2.3 se pueden hacer con Translator y Summarizer de Chrome cuando el
autor usa el panel desde el computador.

### L3 — "Escuchar este post" con voz natural (camino B, al escribir el post)

- Hoy la voz es la del navegador (V3, camino A). Con la voz de Gemini se genera el audio de cada post en cada idioma
  una sola vez (V3, camino B).
- Sin infraestructura nueva, el audio solo cabe en el repo (`public/`), con unos MB por post. Los posts publicados
  desde el panel (016) viven en la base y no tendrían audio sin un almacenamiento nuevo.
- La llave puede quedarse en la máquina del autor: un script genera el audio y el audio se versiona. Vercel no
  necesita la variable.

### L4 — Experimentos con Gemini para visitantes (camino B, ola 3 del AI Lab)

El catálogo de la 003 ya los tiene, a la espera del camino B:
- V5 Habla con mi portafolio: voz → texto → búsqueda → respuesta → voz.
- V6 Subtítulos en vivo de español a inglés (Gemini tiene un modelo de traducción en vivo).
- A6 Screenshot → componentes (visión), A7 De idea a spec, A8 Generador de ADR, A9 Texto → diagrama, A12
  Investigador y C3 Haiku del commit.

Qué exigen: la llave en el servidor, el límite por IP (ya existe en `lib/security/rate-limit.ts`), un tope de tokens
por respuesta, una alerta de presupuesto en Google Cloud, facturación activa para que lo que escribe el visitante no
se use para entrenar, consentimiento antes de enviar, una sección nueva en Privacidad y una enmienda de FR-320.

## Decisiones del autor

1. **Proyecto de Google Cloud.** Recomendación: uno nuevo, "cherced-world", para el ingreso (017) y para Gemini, y
   dejar "Get It Done Deployed" aparte. La pantalla de consentimiento muestra el nombre de la app del proyecto, y así
   las llaves, las cuotas y la facturación no se mezclan con lo de antes.
2. **Camino B (P-3a).** ¿Se enmienda el principio VIII para permitir `GEMINI_API_KEY`? Sin esa enmienda solo caben L1
   y L3 con la llave en la máquina del autor.
3. **Cuota gratis o facturación.** La cuota gratis sirve para lo que se va a publicar igual. Lo que escribe un
   visitante pide facturación con un tope de presupuesto.
4. **Cuándo.** Lo que suba a `dev` antes del paso a `main` sale con el release y suma QA. Recomendación: no mover el
   release; construir en local y subir después, o sumarlo a la lista de QA.

## Recomendación

Empezar por L1.1. No necesita llave, costo ni enmienda, reutiliza el buscador por significado que ya corre en el
navegador y muestra RAG en el equipo del visitante, que es lo que promete el AI Lab. Después, L1.2. L2 y L4 esperan
las decisiones 2 y 3.

## Fuentes (consultadas el 2026-11-14)

- Chrome, Built-in AI APIs: https://developer.chrome.com/docs/ai/built-in-apis
- Chrome, requisitos de hardware: https://developer.chrome.com/docs/ai/get-started
- Gemini API, precios y cuota gratis: https://ai.google.dev/gemini-api/docs/pricing
- Gemini API, términos: https://ai.google.dev/gemini-api/terms
