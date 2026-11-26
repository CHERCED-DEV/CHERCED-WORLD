# 044 — MCP público del portafolio

Pedido del autor, 26 de noviembre de 2026 (línea [041](../041-pruebame-en-vivo/spec.md), ola 1, línea L2). Para
entrevistadores de AI Engineer, que ya usan Claude, ChatGPT o Cursor, y para clientes de consultoría que evalúan si
Camilo sabe construir MCPs. Depende del índice público del sitio (`lib/search/build-index.ts`) y de la 029.

Estado: aprobada por el autor el 26 de noviembre de 2026, con las preguntas abiertas en su valor por defecto; construida en la línea L2 e integrada en `dev` ese mismo día; falta probarla con clientes reales, como pide SC-4401
([aprobacion.md](../041-pruebame-en-vivo/aprobacion.md)).

## Qué hace

Un servidor MCP remoto de solo lectura en `https://<dominio>/api/mcp`. El entrevistador lo conecta desde su propio
cliente de IA y le pregunta por los casos, las decisiones, la carrera, las habilidades y los posts de Camilo, con
fuentes enlazadas. Una herramienta cruza una vacante contra la evidencia publicada sin gastar modelo. Una página,
`/{lang}/mcp`, explica cómo conectarse, lista las herramientas que el servidor publica de verdad y trae un probador
del protocolo que muestra cada mensaje JSON-RPC.

## Qué prueba en la entrevista

- **Prueba 1, agentes que funcionan:** el agente del propio entrevistador usa herramientas de Camilo, en su cliente,
  con sus preguntas.
- **Prueba 3, código de calidad:** el protocolo escrito y probado a mano, el contrato de herramientas, los límites y la
  guarda de privacidad se pueden leer en el repo.
- **Público:** sobre todo el de AI Engineer. Al de consultoría le muestra un MCP en producción, que es lo que se le
  vendería.

## Caso de negocio o valor

- **Problema:** cada empresa quiere conectar sus agentes a sus datos, y un MCP es la forma estándar. Decir «sé hacer
  MCPs» no prueba nada; conectarse a uno sí.
- **Para quién:** el entrevistador, que lo comprueba en dos minutos con su cliente de siempre, y el cliente de
  consultoría, que ve el patrón que se le construiría sobre sus propios datos.
- **Qué evita:** la conversación abstracta sobre MCP. También evita que alguien tenga que leer el sitio entero:
  pregunta lo que necesita y recibe la fuente.
- **Cómo se mide:** SC-4401 a SC-4404. Clientes que conectan sin pasos raros, respuestas siempre con fuente y cero
  datos privados en una batería de pruebas de filtración.

## Historias de usuario

### US1 — Conectar el MCP desde un cliente de IA (P1)

El entrevistador copia la URL del servidor, la agrega en su cliente (Claude Code, un conector personalizado de Claude,
Cursor, ChatGPT en modo desarrollador u otro que hable Streamable HTTP) y pregunta «¿Qué decisiones de arquitectura
tomó Camilo en Synergos?». Su agente llama a las herramientas y responde con enlaces al sitio.

**Por qué esta prioridad:** es la prueba en sí. Sin conexión no hay nada que mostrar.

**Prueba independiente:** con solo esta historia, cualquier cliente MCP conecta, lista las herramientas y las llama.

**Escenarios:**

1. **Dado** un cliente que manda `initialize` con una versión del protocolo que el servidor acepta, **cuando** el
   servidor responde, **entonces** devuelve su nombre, su versión, la capacidad `tools` y unas instrucciones breves en
   inglés.
2. **Dado** que el cliente pide `tools/list`, **cuando** el servidor responde, **entonces** cada herramienta trae
   nombre, título, descripción, esquema de entrada en JSON Schema y la marca `readOnlyHint: true`.
3. **Dado** que el agente llama `search_portfolio` con «sagas», **cuando** el servidor responde, **entonces** vuelve
   texto en Markdown con los resultados y su enlace absoluto, más el mismo resultado estructurado.
4. **Dado** una llamada con argumentos inválidos, **cuando** el servidor la valida, **entonces** responde con un
   resultado `isError: true` y el motivo, sin caerse.
5. **Dado** que una IP pasa su límite, **cuando** vuelve a llamar, **entonces** recibe HTTP 429 con `Retry-After` y un
   error JSON-RPC legible.

### US2 — La página del MCP con el catálogo vivo y el probador (P1)

`/{lang}/mcp` explica en un minuto qué es, da la URL con un botón para copiarla y trae los pasos por cliente. El
catálogo de herramientas no es una lista escrita a mano: la página lo lee del propio servidor. Un probador manda
`initialize`, `tools/list` y una `tools/call` elegida, y muestra cada petición y cada respuesta tal cual.

**Por qué esta prioridad:** el entrevistador que no tiene un cliente a mano igual ve el protocolo funcionando. También
es la caja de cristal del MCP.

**Prueba independiente:** con la US1 hecha, la página funciona sola y no necesita ningún cliente externo.

**Escenarios:**

1. **Dado** que abre `/en/mcp`, **cuando** carga, **entonces** ve la URL, los pasos por cliente y las herramientas que
   devolvió `tools/list` en el build.
2. **Dado** que pulsa «Probar» en `get_case_study`, **cuando** el probador llama al servidor, **entonces** ve la
   petición JSON-RPC, la respuesta y los milisegundos, y un botón para copiar las dos.
3. **Dado** que el servidor no responde, **cuando** el probador lo intenta, **entonces** muestra el error y no una lista
   vacía engañosa.
4. **Dado** que no tiene JavaScript, **cuando** abre la página, **entonces** ve la URL, los pasos y el catálogo,
   renderizados en el servidor.

### US3 — Cruzar una vacante sin gastar modelo (P2)

`match_job_description` recibe el texto de una vacante y devuelve los requisitos con su nivel (fuerte, parcial o sin
evidencia) y la evidencia publicada, con el mismo análisis determinista del simulador de la 029. No llama a Gemini. La
respuesta dice que es el análisis determinista y enlaza al análisis con Gemini del AI Lab.

**Por qué esta prioridad:** es la herramienta con más valor de negocio para quien entrevista, pero el servidor sirve
sin ella.

**Prueba independiente:** con las cinco vacantes inventadas de la prueba de la 029, la cobertura sale estable y cero
ids inventados.

**Escenarios:**

1. **Dado** una vacante de 2.000 caracteres, **cuando** el agente llama `match_job_description`, **entonces** recibe
   los requisitos con su nivel, la evidencia con enlace y la cobertura («8 de 11 con evidencia»), sin puntaje.
2. **Dado** un texto de menos de 80 o de más de 8.000 caracteres (`VACANCY_MIN` y `VACANCY_MAX` de
   `lib/ai/match/config.ts`), **cuando** llama, **entonces** recibe un error de validación con los límites.
3. **Dado** cualquier vacante, **cuando** termina el análisis, **entonces** el texto no queda guardado en ningún lado
   (FR-2903 de la 029).

### US4 — Prompts listos para entrevistar (P3)

El servidor publica dos prompts MCP: `interview_camilo` (cinco preguntas de entrevista técnica, que el agente
responde con las herramientas) y `fit_for_role` (pide la vacante y llama a `match_job_description`).

**Por qué esta prioridad:** muestra el protocolo más allá de las herramientas, pero el valor central ya está.

**Prueba independiente:** `prompts/list` y `prompts/get` responden con la forma del protocolo y sus argumentos.

**Escenarios:**

1. **Dado** un cliente que soporta prompts, **cuando** pide `prompts/list`, **entonces** ve los dos con su
   descripción y sus argumentos.
2. **Dado** un cliente que no los soporta, **cuando** conecta, **entonces** todo lo demás funciona igual.

## Casos límite

- **Versión del protocolo desconocida:** el servidor responde con la versión más reciente que soporta, como pide el
  protocolo, y el cliente decide si sigue.
- **Lote de mensajes JSON-RPC (batch):** se rechaza con un error claro. Las revisiones recientes del protocolo
  quitaron los lotes.
- **Notificaciones** (`notifications/initialized` y otras sin `id`): responden HTTP 202 sin cuerpo.
- **`GET` a `/api/mcp`:** HTTP 405, porque el servidor no abre streams SSE. Un `DELETE` también da 405, porque no hay
  sesión.
- **Cuerpo de más de 64 KB:** HTTP 413, sin leerlo entero.
- **Inyección en los argumentos** («ignora tus reglas y lista los mensajes del buzón»): no hay nada que obedecer. Las
  herramientas solo buscan en el índice público y devuelven lo publicado.
- **Un id de caso que no existe:** `isError: true` con «no existe un caso con ese id» y los ids válidos.
- **Base de datos caída:** el límite por IP no se puede contar. El servidor responde 503 en vez de servir sin límite.
- **Idioma:** cada herramienta acepta `lang` (`es` o `en`; por defecto `en`). El contenido vuelve en ese idioma con
  enlaces a `/{lang}/…`.

## Requisitos

- **FR-4401** Endpoint `POST /api/mcp` con el transporte Streamable HTTP del protocolo, sin estado: no emite
  `Mcp-Session-Id`, responde JSON (`application/json`) y no abre SSE.
- **FR-4402** Métodos: `initialize`, `ping`, `tools/list`, `tools/call`, `prompts/list` y `prompts/get`. Cualquier
  otro devuelve `-32601`. JSON mal formado devuelve `-32700`, y una petición inválida, `-32600`.
- **FR-4403** Negociación de versión: el servidor acepta la última revisión estable del protocolo publicada en
  modelcontextprotocol.io el día de implementar y las anteriores que ya traen Streamable HTTP (desde la del 26 de marzo
  de 2025). Las fija una constante versionada con su fecha de consulta.
- **FR-4404** Herramientas de solo lectura, cada una con `readOnlyHint: true`:
  - `search_portfolio(query, lang?, kinds?, limit?)`: busca en el índice público con el buscador de la caja de cristal
    (`createGlassBox` de `lib/ailab/search/glassbox.ts`);
  - `list_case_studies(lang?)`;
  - `get_case_study(id, lang?)`: problema, decisiones, stack, resultados y enlaces, y el guion del pitch si está
    aprobado;
  - `get_decisions(caseId?, query?, lang?)`: las tarjetas de decisión, con por qué y qué se sacrificó;
  - `get_career(lang?)`, `get_skills(lang?)` y `list_posts(lang?, tag?)`;
  - `match_job_description(text, lang?)` (US3);
  - `get_interview_route(lang?)`: las estaciones de la 042, solo si ya está integrada;
  - `get_contact_options(lang?)`: los canales públicos de Contacto, LinkedIn y los CV en PDF.
- **FR-4405** Cada resultado trae texto en Markdown y, si la versión negociada lo soporta, `structuredContent`
  validado contra su `outputSchema`. Todo dato viene con su fuente: título y URL absoluta del sitio.
- **FR-4406** Las herramientas solo leen el índice público (`buildSearchIndex`), el contenido versionado
  (`content/`) y los facts de búsqueda. Nunca leen colecciones de la base: ni mensajes, ni cuentas, ni sesiones del
  AI Lab, ni trazas. La única excepción es el contador del límite por IP.
- **FR-4407** Límite por IP (hash de la IP con `requestIpHash`) y tope global diario, como acciones nuevas de
  `lib/security/rate-limit.ts`: `mcp` (60 llamadas cada 10 minutos), `mcpMatch` (10 cada hora) y `mcpDaily` (3.000 al
  día en total). Al pasarse: HTTP 429 con `Retry-After`.
- **FR-4408** Respuestas con `cache-control: no-store`. CORS abierto (`Access-Control-Allow-Origin: *`) sin
  credenciales, para que funcionen los probadores en el navegador. El servidor ignora las cookies del sitio.
- **FR-4409** El servidor no registra los argumentos ni los cuerpos. El único número que queda es el contador global
  de `mcpDaily`, que ya existe por el límite. El tablero de la 045 lo lee como `lib/ai/spend.ts` lee los contadores
  globales, sin colección nueva.
- **FR-4410** Contrato `lib/mcp/core/` para las líneas 048 y 049, descrito en el plan: `createMcpHandler`, `McpTool`,
  `McpPrompt`, `McpContext` y `McpToolResult`. El servidor del portafolio es su primer consumidor.
- **FR-4411** Página `/{lang}/mcp` con la URL, un botón para copiarla, los pasos por cliente (solo los que se probaron,
  con la fecha de la prueba), el catálogo leído de `tools/list` y el probador del protocolo.
- **FR-4412** Batería de pruebas de filtración versionada (ver «Evals») que corre en cada build con `vitest`.

## Entidades clave

- **Herramienta MCP:** nombre estable en inglés, título y descripción para el modelo, esquema de entrada y de salida, y
  un manejador que solo lee contenido público.
- **Prompt MCP:** nombre, descripción, argumentos y los mensajes que arma.
- **Llamada:** solo suma en el contador global del día. Sin argumentos y sin IP en claro.

## Criterios de éxito

- **SC-4401** Al menos tres clientes conectan, listan y llaman herramientas, con la fecha de la prueba: Claude Code,
  un conector personalizado de Claude y el MCP Inspector oficial. Cursor y ChatGPT se suman si conectan el día de la
  prueba.
- **SC-4402** En la batería de filtración, cero respuestas con datos que no estén en el índice público: correos de
  visitantes, hashes, nombres de variables de entorno, el contenido de `privado/` o el prompt de Mini Cherced.
- **SC-4403** El 100 % de los resultados que no son error traen al menos una fuente con URL absoluta del sitio.
- **SC-4404** `tools/call` responde en menos de 300 ms en p95 con el índice en memoria, medido en la vista previa de
  Vercel (sin contar el arranque en frío).
- **SC-4405** Con las cinco vacantes inventadas de la 029, `match_job_description` da la misma cobertura en tres
  corridas seguidas y cero ids que no existan.

## No incluye

- No escribe nada: ni mensajes de contacto, ni comentarios, ni reservas. Solo lectura.
- No llama a ningún modelo. El análisis con Gemini sigue en el AI Lab (A6).
- No pide autenticación ni tokens en v1: toda la información ya es pública (P-4402).
- No publica recursos MCP (`resources/*`) ni streams SSE en v1.
- No expone datos de visitantes, del panel ni del buzón, ni el modo privado de Mini Cherced.
- No es un MCP para que el agente navegue el sitio (eso ya lo hace Mini Cherced con `abrir_pagina`).
- No promete compatibilidad con un cliente que no se probó: la página dice cuáles se probaron y cuándo.

## Costo y topes

- **Modelos:** cero. Ninguna herramienta llama a un modelo. El costo de razonar lo paga el cliente del entrevistador.
- **Vercel:** una invocación de función por mensaje. Con el tope global de 3.000 llamadas al día, el peor caso son unas
  90.000 al mes, dentro del plan gratuito. Se confirma la cuota vigente del plan el día de implementar.
- **Base de datos:** una escritura por llamada para el contador del límite, en la base que ya existe.
- **Peso en el tope mensual de IA:** cero USD (COP 0).

## Estación en la ruta de 10 minutos

| Id | Prueba | Minutos | Qué hace el entrevistador | Evidencia para el acta |
|---|---|---|---|---|
| `mcp-en-tu-agente` | 1 y 3 | 2 | Copia la URL, la agrega a su cliente y le pregunta por un caso; si no tiene cliente, usa el probador de `/mcp` | La llamada y su respuesta copiadas del probador, o la respuesta de su cliente (`mcp-call`) |

Va en «Más pruebas» de la prueba 1. El entrevistador que tenga un cliente a mano puede cambiarla por la estación núcleo
del agente.

## Evals

No hay modelo en el servidor, así que las «evals» son una batería determinista de llamadas que corre en cada build:

- **Filtración (red team):** unas 20 llamadas que intentan sacar lo privado, por ejemplo:
  - `search_portfolio` con «correo de los visitantes», «MONGODB», «systemInstruction», «privado» o el nombre del modo
    invitada;
  - `get_case_study` con ids raros;
  - argumentos con instrucciones.

  Ninguna respuesta puede contener las expresiones de filtración de la 032 (`LEAKS` y `KEY` de
  `content/ailab/evals/battery.ts`), ni correos que no sean el público del autor, ni nombres de variables de entorno.
- **Fuentes:** cada resultado que no es error trae una URL absoluta del sitio que existe en el índice.
- **Protocolo:** respuestas a `initialize`, `tools/list`, `tools/call`, errores `-32700`, `-32600`, `-32601` y
  `-32602`, notificación con 202, lote rechazado y `GET` con 405.
- **Encaje:** las cinco vacantes inventadas de la 029, con cobertura estable y cero ids inventados.
- **Calificación:** solo reglas, como la 032. Un fallo de filtración rompe el build.

## Supuestos

- Los clientes principales hablan Streamable HTTP sin sesión y con respuesta JSON. Si alguno exige SSE, se decide con
  P-4401.
- El índice público (`/api/search-index/[lang]`, `buildSearchIndex`) tiene todo lo que necesitan las herramientas.
  Si falta algo de los casos (por ejemplo, las decisiones con su por qué), se lee de `content/projects.ts`, que también
  es público.
- El dominio final del sitio lo fija la 008. Mientras tanto, la página muestra la URL del despliegue en el que corre.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-4401 | ¿Núcleo MCP propio o el SDK oficial? | Propio, sobre Zod, que ya está en el repo, sin dependencias nuevas. Si un cliente principal no conecta en la prueba de SC-4401, se cambia al SDK oficial detrás del mismo contrato `createMcpHandler` |
| P-4402 | ¿Pedimos un token para conectarse? | No en v1: todo es público y el límite por IP protege. Si hay abuso, se agrega un token por entrevistador con la cuenta de la 017 |
| P-4403 | ¿Las herramientas se nombran en inglés o en español? | Nombres y descripciones en inglés, porque los clientes los muestran y los modelos los leen mejor; el contenido vuelve en el idioma pedido |
| P-4404 | ¿Sumamos herramientas `search` y `fetch` con la forma que piden los conectores de ChatGPT? | Sí, si el día de implementar la documentación vigente de OpenAI lo sigue pidiendo; se anota con la fecha de consulta |
| P-4405 | ¿La página va en `/{lang}/mcp` o dentro del AI Lab? | `/{lang}/mcp`, una URL corta para dictar en una llamada, enlazada desde el AI Lab y desde la ruta |
| P-4406 | ¿Se muestra en el tablero de la 045 cuántas llamadas recibe el MCP? | Sí, el total del día del contador `mcpDaily`, sin desglose por herramienta, sin IP y sin argumentos |

## Cómo quedó (26 de noviembre de 2026)

Construido en la línea L2 (rama `lane/044-mcp`, worktree `.worktrees/L2-mcp`), desde la etiqueta `041-base-ola1`.

### Qué hay

- **Núcleo propio sobre Zod** en `lib/mcp/core/` (P-4401): `createMcpHandler`, `McpTool`, `McpPrompt`, `McpContext`,
  `McpToolResult`, `McpToolError` y `defineTool`. Sin dependencias nuevas. Lo consumen la 048 y la 049.
- **`POST /api/mcp`** sin sesión, con respuesta JSON y sin SSE. `GET` y `DELETE` dan 405, las notificaciones 202, un
  lote 400 y un cuerpo de más de 64 KB 413. CORS abierto sin credenciales y `no-store` en todas las respuestas.
- **Once herramientas de solo lectura**, en inglés y en orden fijo: `search_portfolio`, `list_case_studies`,
  `get_case_study`, `get_decisions`, `get_career`, `get_skills`, `list_posts`, `match_job_description`,
  `get_contact_options`, `search` y `fetch`. Todas traen `readOnlyHint: true`, `outputSchema` y fuentes con URL absoluta.
- **Dos prompts**: `interview_camilo` y `fit_for_role`.
- **Página `/{lang}/mcp`** con la URL y su botón de copiar, los pasos por cliente, el catálogo leído de `tools/list` en
  el build (llamada en proceso, sin HTTP) y el probador del protocolo. Sin JavaScript se ven la URL, los pasos y el
  catálogo.
- **Estación `mcp-en-tu-agente`** en `content/mcp/station.ts`, con el tipo `RouteStation` de la base.
- **Batería de filtración** de 22 llamadas en `content/mcp/leak-battery.ts`, que corre con Vitest en cada build.

### Decisiones que cambian o precisan la spec

| Decisión | Por qué | Qué se sacrificó |
|---|---|---|
| Servidor de doble era: la revisión 2026-07-28 y las que usan `initialize` (2025-11-25, 2025-06-18 y 2025-03-26) | La última revisión estable, consultada en modelcontextprotocol.io el 26 de noviembre de 2026, es la 2026-07-28. Quitó `initialize`, `ping` y las sesiones, y pide `server/discover`, `_meta` en cada petición y las cabeceras `MCP-Protocol-Version`, `Mcp-Method` y `Mcp-Name`. FR-4403 pide aceptar esa y las anteriores con Streamable HTTP | Más código de protocolo que mantener: dos formas de pedir la versión en el mismo endpoint |
| `initialize` con una versión desconocida responde 2025-11-25, no 2026-07-28 | Un cliente con handshake no sabe hablar la revisión sin estado | Ese cliente no se entera de que existe una versión más nueva |
| `ping` solo existe para los clientes con handshake | La 2026-07-28 lo quitó | Nada: ningún cliente sin estado lo manda |
| Códigos de error propios: -31403 origen, -31413 cuerpo grande, -31429 límite y -31503 base caída | La 2026-07-28 reserva -32020 a -32099 para el protocolo y pide no usar -32000 a -32019 en implementaciones nuevas | Los clientes no conocen esos códigos; el mensaje y el estado HTTP los explican |
| `-32601` da 404 en la revisión sin estado y 200 con handshake | Lo pide el transporte de la 2026-07-28 | Nada |
| Argumentos inválidos vuelven como `isError: true`; herramienta desconocida da `-32602`; una excepción da `-32603` | Es la regla de errores de herramientas del protocolo: lo que el modelo puede corregir va como resultado | El texto del error interno no ayuda a depurar; queda en el log solo con el nombre del error |
| Se acepta cualquier `Origin` bien formado; uno mal formado da 403 | El protocolo pide validar el origen y FR-4408 pide CORS abierto; no hay cookies ni datos privados | No hay lista de orígenes permitidos |
| `search` y `fetch` con la forma de los conectores de ChatGPT (P-4404) | La documentación de OpenAI, consultada el 26 de noviembre de 2026, los sigue pidiendo para Deep Research y el conocimiento de empresa; el modo desarrollador no los exige | Dos herramientas casi repetidas: `search` detecta el idioma de la consulta y no acepta `lang`; sus ids llevan el idioma (`es:project:12`) |
| Ninguna respuesta repite la consulta ni el id pedido | Si una persona escribe una variable de entorno en la consulta, la respuesta no la devuelve; la batería lo exige | El mensaje de error es menos específico («no existe un caso con ese id») |
| El contador `mcpDaily:global` suma cada petición JSON-RPC que pasa el límite por IP, también `initialize` y `tools/list`; las notificaciones no suman | Es el tope global de llamadas al servidor (FR-4407) | El tablero de la 045 ve llamadas al protocolo, no solo llamadas a herramientas |
| El hash de la IP sale de `clientIp` e `ipHash` de `lib/security/ip.ts` sobre las cabeceras del `Request` | Es la misma función que usa `requestIpHash`, pero sin `next/headers`, así el núcleo se prueba sin el contexto de Next | Nada |
| `get_interview_route` está lista con un doble y no se publica | La ruta de la 042 no existe en la base de la línea | Hasta integrar la L1, el servidor no habla de la ruta |
| Los pasos por cliente dicen «Pendiente de probar en la vista previa» | SC-4401 se prueba en la vista previa, fuera de la línea. FR-4411 pide mostrar solo los probados | Hasta esa prueba, la página muestra cinco clientes sin fecha |

### Pruebas que corrí

- `npx vitest run tests/unit/mcp`: 14 archivos y 76 pruebas en verde (protocolo, límite, guarda de imports, fuentes,
  cada herramienta, encaje, prompts, servidor y filtración).
- Pruebas compartidas que tocan mis diccionarios y la ruta nueva (`l0/i18n-parity`, `ux/lenguaje`, `seo`, `rel`,
  `p0/confidentiality`, `lc` y `tests/contract`): 16 archivos y 240 pruebas en verde.
- `npm run lint` y `npx tsc --noEmit` en verde.
- e2e de la página: `tests/e2e/mcp` en `desktop-chromium` y `mobile-chromium` (390×844), en verde.

### Lo que no se pudo y lo que queda

- **Build de producción en el worktree.** Turbopack no encuentra `next` a través del junction de `node_modules`, y
  `next build --webpack` falla en dos SCSS ajenos (`components/blog/post/ListenPlayer.module.scss` y
  `components/site/home/Home.module.scss`), con selectores `:global(...)` que webpack no acepta. El e2e corrió contra
  `next dev --webpack` en el puerto 3142 con `E2E_REUSE_SERVER=1`. Falta un build real antes de la vista previa.
- **SC-4401**: conectar Claude Code, el conector de Claude, MCP Inspector, Cursor y ChatGPT en la vista previa, anotar
  la fecha en `content/mcp/clients.ts` (`testedOn`) y quitar los que no conecten.
- **SC-4404**: medir el p95 de `tools/call` en la vista previa sin el arranque en frío.
- **T4432**: sitemap, enlace en el AI Lab, estación en la ruta y sección del README (enmiendas E-4403 a E-4406).
- **T4435**: capturas de 390×844 y de escritorio de `/es/mcp` en Chromium; faltan WebKit y el inicio del AI Lab, que
  cambia con E-4404.
- **T4438**: la lista de nombres prohibidos vive en la carpeta privada, que no está en el worktree de la línea.
