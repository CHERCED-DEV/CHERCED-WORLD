# 018 — IA de Google: el agente de voz y el AI Lab con Gemini

Pedido del autor, 2026-11-14: "vámonos por lo grande. Vamos a hacer la integración con crear la clave de API de
Gemini, con todo eso". Cambia la regla de Vercel ("ahora sí quiero tocar cosas en Vercel. Poner secretos") y pide
"potenciar todo lo que es la parte del IA Lab. Hagamos cosas súper locas y bonitas. Potenciemos como un chat de voz
que tenga un agente que sepa de lo que tenemos en toda la aplicación web, que podamos hablar al respecto, que sea
animado, pero me gusta mucho el pixel art".

La exploración previa está en `exploracion.md`. La configuración de la clave, en `configurar-gemini.md`.

## Decisiones tomadas

- **Constitución 3.0.0.** El principio VIII permite proveedores gestionados por API y variables nuevas en Vercel con
  cuatro condiciones: tabla en el README, secreto solo en el servidor, modo apagado y tope de costo. P-3a de la 003
  queda en camino mixto.
- **Una sola variable:** `GEMINI_API_KEY`, en Production y Preview, marcada como Sensitive. El autor la crea en el
  proyecto de Google Cloud "cherced-world", que también tendrá el cliente OAuth de la 017.
- **Facturación activa y alerta de presupuesto.** Así Google no usa lo que dicen los visitantes para mejorar sus
  productos. La suscripción Gemini Pro del autor es de la app de Gemini; la API se cobra aparte.
- **La cara del agente es el chibi de la 015.** El personaje pixel art del autor (barba, gafas de escudo y camiseta
  negra) ya existe con su sistema de sprites en `components/fun/`. El agente lo reutiliza y le suma boca, gestos y
  escenario. Nada copiado de juegos o personajes existentes.

## Olas

| Ola | Qué | Estado |
|---|---|---|
| 1 | **V5 "Habla con mi portafolio"**: el agente de voz pixel art que conoce todo el sitio | Funciona en local con Gemini (2026-11-14); falta Vercel y la prueba del autor con su voz |
| 2 | El agente fuera del AI Lab: despertarlo desde el chibi del pie o desde una entrada propia | Spec `../028-mini-cherced-en-todo-el-sitio/` |
| 3 | Experimentos nuevos con Gemini en el AI Lab | Specs `../022-pixelate/` a `../026-texto-a-diagrama/` |
| 4 | Herramientas del panel (traducir, revisar y proponer) y audio natural de los posts | Specs `../027-panel-con-gemini/` y `../021-escuchar-con-gemini/` |

Desde el 2026-11-14 cada proyecto tiene su spec, y todas dependen de la base común `../020-ai-lab-con-gemini/` (pedido
del autor: "creemos specs por proyecto y démosle con todas las capacidades que nos pueda suministrar esta nueva
integración con Gemini"). Las secciones de abajo quedan como historial de la exploración.

### Siguiente: "Escuchar este post" con voz de Gemini (pedido del autor, 2026-11-14)

- El lector de V3 y de "Escuchar este post" usa las voces del navegador, que suenan robóticas: "el motor de lectura es
  muy básico, debería ser más humano, por eso debemos ponerle Gemini". Se cambia por la voz TTS de Gemini, generada en
  el servidor por fragmento y guardada en la caché de Vercel, para que cada fragmento se pague una sola vez.
- Bug visto por el autor en la tarjeta V3: los selectores de voz y velocidad no se dejan usar, y el de velocidad se
  sale por la derecha.

### Ola 3, experimentos propuestos

- **Pixélate:** subes una foto y sale tu versión chibi en pixel art, con la paleta del sitio (modelo de imagen de
  Gemini; no tiene cuota gratis).
- **V6 Subtítulos en vivo** de español a inglés mientras hablas (modelo de traducción en vivo).
- **A6 Screenshot → componentes:** la captura de una interfaz y qué piezas de Synergos usar (visión).
- **A7 De idea a spec** y **A8 Generador de ADR**, al estilo de los specs y ADR de este mismo repo.
- **A9 Texto → diagrama** generado.
- **C3 Haiku del commit.**

## Ola 1: V5 "Habla con mi portafolio"

### Historia

Un visitante abre la tarjeta V5 en el AI Lab, acepta que su voz va a Google y habla con el chibi del autor. El
agente responde con voz, en el idioma en que le hablen, sobre lo que hay en el sitio: proyectos, Synergos, posts,
servicios, carrera y el propio AI Lab. Mientras habla, el chibi mueve la boca al ritmo del audio; mientras escucha,
reacciona; mientras busca, piensa. Si el visitante pide ver algo, el agente lo lleva a esa página.

### Requisitos

- **FR-1801 Conversación de voz en tiempo real** con la Live API de Gemini, con interrupciones: si el visitante habla
  encima, el agente se calla y escucha.
- **FR-1802 También por texto.** Un campo para escribir, con la respuesta en voz y en subtítulos. Un botón silencia la
  voz y deja solo el texto.
- **FR-1803 Subtítulos** de lo que dice el visitante y de lo que responde el agente.
- **FR-1804 Conoce el sitio.** La instrucción de sistema lleva un mapa del sitio armado desde el contenido tipado
  (páginas, casos, posts, servicios y experimentos), y el agente tiene dos herramientas que corren en el navegador:
  - `buscar_en_el_sitio(consulta)`: el índice de búsqueda que ya existe, con los fragmentos y su URL;
  - `abrir_pagina(ruta)`: lleva al visitante a una página del sitio. Solo acepta rutas que existen.
- **FR-1805 Honestidad.** Dice que es una IA con la cara del autor, no el autor. No promete precios, fechas ni
  disponibilidad: para eso manda a Contacto. Solo usa información pública del sitio (principio III).
- **FR-1806 La clave nunca llega al navegador.** El servidor pide a Google un token temporal de un solo uso, con el
  modelo, la voz, la instrucción y las herramientas fijados. El navegador habla directo con Google usando ese token.
- **FR-1807 Topes.** Cada visitante abre pocas conversaciones por hora (límite por IP en el servidor). Cada
  conversación dura como máximo unos minutos: el token vence y el escenario lo dice.
- **FR-1808 Consentimiento.** Antes de pedir el micrófono, el escenario dice que la voz y el texto van a Google y no se
  guardan en el sitio. Sin aceptar, no se conecta.
- **FR-1809 Modo apagado y simulador.** Sin `GEMINI_API_KEY`, en Vercel la tarjeta dice que la conversación todavía no
  está activa. En local hay un simulador por texto: el chibi responde con los resultados del índice y la voz del
  navegador, para probar el escenario sin Google.
- **FR-1810 Pixel art.** Escenario pixel art con los colores del sitio (negro, blanco y `#25ED9E`): el chibi, su
  globo de diálogo y un medidor de voz en bloques. Respeta `prefers-reduced-motion`.
- **FR-1811 Accesible.** Se usa con teclado, los subtítulos son una región viva, y el estado (escuchando, pensando,
  hablando) se anuncia en texto.
- **FR-1812 Privacidad.** La página de Privacidad suma una sección sobre el agente de voz.

### Probado en local el 2026-11-14

- El servidor obtiene el token de un solo uso y el navegador abre la sesión con Gemini Live.
- Voz: una grabación de "Hola, Mini Cherced, ¿qué es Synergos?" entró como micrófono; Gemini la transcribió y
  respondió con voz y subtítulos.
- Texto: "¿Qué es la vida?" → "¡Eres raro, pero está bien! Para mí, la vida es como un loop infinito de aprendizaje…"
  (pedido del autor: a las preguntas fuera del sitio responde con una burla cariñosa y luego de verdad).
- Errores de Google mostrados como "Gemini no está disponible": 402 sin saldo, 403 tope de gasto, 429.
- En local (`NODE_ENV=development`) no aplican los topes por hora y por día, para poder probar.

### Seguridad, privacidad y costo

- El servidor valida el origen, aplica el límite por IP y no devuelve nada de la clave. Si Google falla, responde un
  error genérico.
- El token se pide con `uses: 1`, un vencimiento corto y la configuración bloqueada, así que nadie puede cambiar el
  modelo, la instrucción ni las herramientas desde el navegador.
- Las herramientas corren en el navegador con datos públicos: no hay endpoint nuevo que exponga datos.
- El sitio no guarda audio, texto ni transcripciones.
- El escaneo de credenciales de las e2e suma `GEMINI_API_KEY` y el formato de las claves de Google.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-1801 | ¿Cómo se llama el agente? | "Mini Cherced" |
| P-1802 | ¿Qué voz de Gemini usa? | "Puck", alegre |
| P-1803 | ¿Cuántas conversaciones por visitante y cuánto dura cada una? | 3 por hora por visitante, 10 al día en total y 5 minutos cada una (`lib/security/rate-limit.ts`) |
| P-1804 | ¿La ola 2 pone al agente fuera del AI Lab? ¿Dónde? | Solo en el AI Lab hasta que decidas |
| P-1805 | ¿Cuándo sube a `dev`: antes o después del paso a `main` del Release 1? | Después, o sumado al QA si lo pides |
