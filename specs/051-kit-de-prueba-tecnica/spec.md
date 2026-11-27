# 051 — Forja: de la spec de una prueba técnica a una solución probada

Pedido del autor, 26 de noviembre de 2026 (línea [041](../041-pruebame-en-vivo/spec.md), ola 2, línea L10). Para el
entrevistador que entrega una prueba técnica y quiere ver, no oír, cómo trabaja Camilo con agentes, y para equipos que
quieren un arnés que lleve un encargo acotado de la spec al código con pruebas. Depende de la 044 (núcleo MCP, ya
integrado) y del núcleo determinista de la 047 (Cotejo). El MCP de la 044 se queda como está: Forja lo usa.

Estado: en curso. Aprobada el 26 de noviembre de 2026; la fase A está construida y medida en un repo aparte, la fase B espera a P-4105 y la fase C, la firma CHERCED, está aprobada y en construcción.
Las preguntas abiertas van con su valor por defecto, y las corridas reales las autoriza el autor (P-5105). Detalle en
«Cómo quedó (fase A)» y en [aprobacion.md](../041-pruebame-en-vivo/aprobacion.md).

## Qué hace

Forja es un arnés de agentes que recibe la spec de una prueba técnica y entrega una solución que compila, pasa sus
pruebas y trae un informe de entrega. En una entrevista se usa así:

1. El entrevistador comparte la prueba: un texto, un Markdown o un PDF.
2. Camilo la corre compartiendo pantalla, o el entrevistador instala Forja en su propio Claude Code con dos comandos.
   El plugin trae su comando, sus skills, sus subagentes, sus hooks y la conexión a los MCP del sitio.
3. Se corre `/forja reto.md --stack angular --minutos 45`.
4. Forja trabaja por fases:
   1. lee la prueba y la normaliza en requisitos con id, criterio verificable y prioridad, con sus supuestos;
   2. decide la arquitectura con sus razones y divide el trabajo en tareas;
   3. construye con pruebas primero;
   4. verifica: build, lint, pruebas y una matriz requisito → prueba;
   5. le pide a un revisor que no escribió el código que intente tumbar la entrega;
   6. deja `ENTREGA.md`.
5. El entrevistador lee la entrega, corre las pruebas él mismo y pregunta por cualquier decisión: cada una está escrita
   con lo que sacrifica.

Conoce cuatro stacks por medio de packs: Angular, .NET (C#), Next.js con React y NestJS. Las fases son las mismas para
los cuatro.

Tiene cuatro partes:
- **El plugin**, en un repo propio (`CHERCED-DEV/forja`): comando, skills, subagentes, hooks, packs, encargos de
  muestra con su suite de aceptación oculta y el corredor de evals.
- **El MCP del kit**, en `/api/mcp/kit` del sitio, sobre el núcleo de la 044: packs vigentes y validadores
  deterministas, sin modelo. Para las decisiones de Camilo usa el MCP del portafolio que ya existe (`get_decisions`).
- **La página** `/{lang}/kit`: qué es, la regla de transparencia, cómo instalarlo, una corrida grabada de punta a punta
  y los resultados de las evals.
- **Otros clientes** (Cursor, ChatGPT en modo desarrollador u otro cliente MCP): conectan el MCP del kit y usan el
  prompt `solve_technical_test`. Corren el mismo flujo con menos automatización, porque no tienen subagentes ni hooks.

## Qué prueba en la entrevista

- **Prueba 4, entrega rápida con IA:** la prueba técnica del propio entrevistador, resuelta en vivo dentro de su
  tiempo y con evidencia.
- **Prueba 1, agentes que funcionan:** un arnés con fases, roles separados, hooks y MCP propios, que corre en la
  máquina de otro.
- **Prueba 3, código de calidad:** la solución trae pruebas que nombran cada requisito, con lint y build en verde. El
  repo de Forja tiene sus propias pruebas y evals con verdad oculta.
- **Públicos:**
  - el AI Engineer: arneses, skills y automatización con agentes, que es el rol que Camilo busca;
  - el senior full-stack: cuatro stacks con convenciones de verdad;
  - el consultor: un arnés que un equipo puede usar mañana para katas, pruebas internas o features pequeñas.

## Caso de negocio o valor

- **Problema:** una prueba técnica mide un rato de código a mano. No muestra lo que hoy vale: diseñar el trabajo para
  que los agentes lo hagan bien, con control y con evidencia.
- **Para quién:**
  - el entrevistador, que en una sesión ve el arnés y su resultado sobre su propia prueba;
  - el equipo que contrata, que puede reutilizar Forja con sus pruebas;
  - el cliente de consultoría, que ve cómo se lleva una spec a código verificable.
- **Qué evita:** la discusión abstracta sobre «uso IA para programar». Aquí la IA trabaja a la vista, con reglas, y
  cada decisión queda escrita.
- **Cómo se mide:** SC-5101 a SC-5107. Encargos de muestra resueltos contra una suite que Forja no ve, cobertura de
  requisitos, minutos, instalación cronometrada y cero datos de la prueba en el servidor del autor.

## Decisiones del autor (26 de noviembre de 2026)

| Pregunta | Respuesta |
|---|---|
| ¿Quién corre el kit en la entrevista? | Ambos. Camilo comparte pantalla y el entrevistador puede instalarlo en su máquina para repetirlo y auditar cada paso |
| ¿En qué clientes funciona desde la primera versión? | Plugin de Claude Code con skills, subagentes y hooks. El mismo flujo, con menos automatización, como prompts y herramientas MCP para otros clientes |
| ¿Qué stacks en la primera versión? | Angular, .NET (C#), Next.js con React y NestJS |
| ¿Y el proyecto de referencia? | Diseño propio desde ya, sin copiar nada. Consultar con el arquitecto (P-4105) es requisito antes de publicar Forja |

## Historias de usuario

### US1 — Resolver una prueba técnica de una (P1)

Camilo recibe una prueba: «API de reservas para una sala de reuniones, con .NET, en 60 minutos». Corre
`/forja reto.md --stack dotnet --minutos 60`. Forja normaliza la prueba, anota los supuestos, planifica, construye con
pruebas primero, verifica, pasa por el revisor y entrega.

**Por qué esta prioridad:** es la promesa.

**Prueba independiente:** con solo esta historia y un pack, un encargo de muestra queda resuelto y verificado sin
intervención.

**Escenarios:**

1. **Dado** una prueba con requisitos sueltos en prosa, **cuando** Forja la lee, **entonces** escribe `forja/spec.md`
   con cada requisito numerado (`R-01`, `R-02`…), su criterio verificable, su prioridad y la cita breve de la prueba de
   donde sale. Aparte, lista los supuestos y las ambigüedades.
2. **Dado** una ambigüedad que bloquea, como el formato de una respuesta que la prueba no dice, **cuando** el modo es
   «de una», **entonces** toma la opción más simple que cumple la letra de la prueba, la anota como supuesto con su
   alternativa y sigue.
3. **Dado** el plan, **cuando** termina, **entonces** `forja/plan.md` trae:
   - la arquitectura elegida, con sus decisiones (qué se eligió, por qué y qué se sacrifica);
   - la estructura de carpetas del pack;
   - las tareas, cada una con los requisitos que cubre y los archivos que toca.
4. **Dado** una tarea, **cuando** el constructor la hace, **entonces** primero escribe la prueba que nombra el
   requisito, la ve fallar, y después escribe el código mínimo hasta verla pasar.
5. **Dado** que se acerca el límite de minutos y quedan tareas, **cuando** el orquestador lo detecta, **entonces**
   termina la tarea en curso, corta por prioridad y lo deja escrito en la entrega. Nunca entrega algo que no compila.
6. **Dado** el final de la construcción, **cuando** verifica, **entonces** corre build, lint y pruebas con los comandos
   del pack y arma la matriz requisito → prueba. Si algo falla, lo arregla o lo declara.

### US2 — El entrevistador lo instala y lo repite en su máquina (P1)

El entrevistador abre `/{lang}/kit`, pega dos comandos en su Claude Code y corre Forja sobre su propia prueba o sobre
un encargo de muestra.

**Por qué esta prioridad:** es lo que vuelve creíble la prueba, porque no depende de la máquina de Camilo.

**Prueba independiente:** una persona que no conoce Forja la instala y la arranca siguiendo solo la página (SC-5104).

**Escenarios:**

1. **Dado** Claude Code, **cuando** agrega el marketplace del repo de Forja e instala el plugin, **entonces** quedan
   disponibles el comando, las skills, los subagentes, los hooks y la conexión a los MCP, sin editar archivos a mano.
2. **Dado** que los MCP del sitio no responden, **cuando** corre Forja, **entonces** sigue con los packs que trae el
   plugin y lo anota en la entrega.
3. **Dado** que a la máquina le falta el SDK del stack (por ejemplo, .NET), **cuando** Forja revisa las herramientas al
   empezar, **entonces** lo dice con el comando oficial de instalación y no instala nada por su cuenta.

### US3 — Una entrega que el entrevistador puede auditar (P1)

**Prueba independiente:** con una corrida terminada, una persona encuentra en `ENTREGA.md`, sin abrir el código, qué se
pidió, qué se cubrió y cómo comprobarlo.

**Escenarios:**

1. **Dado** una corrida terminada, **cuando** el entrevistador abre `ENTREGA.md`, **entonces** ve:
   - qué se pidió y qué se entregó;
   - la matriz requisito → prueba → estado;
   - las decisiones, con lo que sacrifican;
   - los supuestos;
   - cómo correrlo y cómo correr sus pruebas;
   - los minutos por fase;
   - lo que falta;
   - con qué cliente y qué modelo se hizo.
2. **Dado** la bitácora (`forja/bitacora.jsonl`), **cuando** la revisa, **entonces** cada fase, cada subagente y cada
   comando quedan con su hora. No guarda el contenido de los archivos ni secretos.
3. **Dado** un requisito sin prueba, **cuando** se arma la matriz, **entonces** sale como «sin cubrir», con su motivo.
   La matriz nunca lo esconde.

### US4 — Otros clientes de IA (P2)

Un entrevistador con Cursor o con ChatGPT en modo desarrollador conecta el MCP del kit y pide el prompt
`solve_technical_test`.

**Prueba independiente:** con un cliente MCP que no es Claude Code, el prompt lleva a una entrega con matriz.

**Escenarios:**

1. **Dado** un cliente MCP que no es Claude Code, **cuando** usa el prompt con la prueba, el stack y los minutos,
   **entonces** su agente sigue las mismas fases, usa las herramientas del kit para el pack, los chequeos y la matriz, y
   entrega `ENTREGA.md` con el mismo formato.
2. **Dado** la página, **cuando** el entrevistador busca su cliente, **entonces** ve qué clientes se probaron y en qué
   fecha, y que sin subagentes ni hooks la verificación y la bitácora dependen de ese cliente.

### US5 — Evals con verdad oculta (P2)

Forja se mide con encargos de muestra inventados: uno por stack y uno que cruza front y back. Cada uno trae una suite de
aceptación que Forja no ve durante la corrida.

**Prueba independiente:** el corredor de evals, con un agente de prueba que entrega una solución fija, aplica la suite
oculta y anota el resultado sin llamar a ningún modelo.

**Escenarios:**

1. **Dado** un encargo de muestra, **cuando** el corredor copia solo su enunciado a una carpeta limpia fuera del repo y
   corre Forja, **entonces** al final aplica la suite oculta y anota cuántas pruebas pasan, los minutos, las
   intervenciones humanas y los requisitos cubiertos.
2. **Dado** una corrida terminada, **cuando** se publica, **entonces** va al tablero de la 045 (`publishedEvals`) con su
   fecha, su cliente y su modelo.

### US6 — La página con la corrida grabada (P2)

`/{lang}/kit` muestra en dos minutos una corrida real grabada: la prueba, la spec normalizada, el plan, la bitácora
resumida, la matriz y el enlace al resultado. Se lee sin JavaScript.

**Prueba independiente:** la página se construye solo con la corrida grabada y los resultados versionados, sin
llamar a nada en vivo.

## Casos límite

- **La prueba prohíbe IA:** Forja no se usa en esa prueba. Se muestra aparte, con un encargo de muestra. La página lo
  dice: se usa a la vista y con permiso (FR-5101).
- **Prueba enorme o vaga:** Forja propone un recorte por prioridad que cabe en los minutos y lo anota como supuesto. En
  el modo «con pausas», se lo pregunta al entrevistador.
- **Stack sin pack (Vue, Spring o Go, por ejemplo):** corre las fases sin pack y lo dice en la entrega. Sin las
  convenciones ni los comandos de verificación del pack, la calidad baja.
- **La prueba trae su propio repo base:** Forja trabaja sobre él y respeta sus convenciones. El pack solo llena lo que
  falta.
- **Datos sensibles en la prueba,** como el nombre de la empresa o URLs internas: nunca salen de la máquina. El MCP del
  kit no los recibe, salvo que alguien llame `check_spec` con el texto desde otro cliente (FR-5106).
- **Sin internet:** el plugin trae sus packs. Solo falla lo que el stack necesite bajar, como sus paquetes.
- **Un comando destructivo,** como borrar fuera de la carpeta, `git push` o `rm -rf`: un hook lo bloquea y lo anota.
- **Menos de 15 minutos:** avisa al empezar y propone el mínimo del stack.
- **El modelo del cliente se queda sin cupo a mitad de corrida:** la entrega se escribe con lo que hay, marca la fase
  en la que se cortó y dice cómo retomar.

## Requisitos

- **FR-5101** Transparencia. Forja se usa a la vista y con permiso del entrevistador. La entrega dice que la hizo
  Forja, con qué cliente y modelo, y qué decidió una persona. La página y el README lo dicen antes de las
  instrucciones.
- **FR-5102** Fases fijas: leer, planificar, construir, verificar, revisar y entregar. Cada fase deja su archivo en
  `forja/`, dentro del proyecto de la solución. El orquestador no salta fases.
- **FR-5103** Requisitos normalizados con id (`R-NN`), criterio verificable, prioridad y cita de origen. Antes de
  planificar, corren sobre la spec normalizada los chequeos deterministas del núcleo de Cotejo (047): ambigüedad,
  contradicciones, duplicados y criterios que no se pueden verificar. Mientras Cotejo no esté publicado, corre una
  versión mínima propia detrás de la misma interfaz: ids, un criterio por requisito y palabras vagas.
- **FR-5104** Roles separados en subagentes:
  - **arquitecto:** escribe el plan;
  - **constructor:** uno por grupo de tareas que no comparten archivos, hasta tres en paralelo;
  - **verificador:** corre build, lint y pruebas, y arma la matriz;
  - **revisor:** lee la spec y el código con contexto nuevo e intenta tumbar la entrega.

  Quien construye no aprueba lo que construyó. Lo que el revisor encuentra se arregla o queda escrito en la entrega.
- **FR-5105** Modos:
  - **«de una»,** por defecto: anota los supuestos y sigue;
  - **«con pausas»** (`--con-pausas`): se detiene después de la spec y después del plan para que una persona apruebe.

  Si se recorta el alcance por los minutos, la decisión siempre queda escrita.
- **FR-5106** Local primero. El texto de la prueba y el código nunca se envían al servidor del autor:
  - en el plugin, los chequeos, la matriz y la plantilla corren en local con `forja-core`;
  - el MCP del kit solo recibe lo que una herramienta pide de forma explícita, como el stack o una lista de ids y
    nombres de pruebas;
  - el MCP no guarda argumentos ni cuerpos;
  - `check_spec` existe para otros clientes y solo corre si alguien lo llama.
- **FR-5107** Packs por stack (Angular, .NET, Next.js y NestJS). Cada uno trae:
  - la versión fijada, con su fecha;
  - el comando oficial para crear el proyecto;
  - la estructura de carpetas y la arquitectura por defecto, con sus decisiones;
  - el corredor de pruebas, el lint y el formato;
  - los comandos de verificación;
  - la convención para nombrar los requisitos en las pruebas;
  - los errores típicos del stack.

  El plugin trae los packs, y el MCP sirve la versión vigente.
- **FR-5108** El tiempo es un parámetro (`--minutos`, 30 por defecto, mínimo 15). El orquestador reparte el presupuesto
  por fase, mide el tiempo real y corta por prioridad. Nunca entrega algo que no compila.
- **FR-5109** Entrega: `ENTREGA.md` en el idioma de la prueba (español o inglés), con las secciones de US3, más
  `forja/bitacora.jsonl`, que escriben los hooks.
- **FR-5110** Guardas por hooks:
  - solo se escribe dentro de la carpeta de la solución;
  - se bloquean `git push`, los borrados fuera de la carpeta y la lectura de `.env*` y de llaves;
  - los paquetes se instalan solo con el gestor del stack y desde su registro oficial.

  Toda acción bloqueada queda en la bitácora.
- **FR-5111** MCP del kit en `/api/mcp/kit`, sobre `createMcpHandler` de la 044, de solo lectura y sin modelo:
  - `list_stack_packs()` y `get_stack_pack(stack)`;
  - `check_spec(text, lang?)`: los chequeos de FR-5103, sin guardar el texto;
  - `coverage_matrix(requirements, tests)`: cruza ids con nombres de pruebas de forma determinista;
  - `get_delivery_template(lang)`;
  - los prompts `solve_technical_test(spec, stack, minutes)` y `review_delivery(spec, delivery)`.

  Para las decisiones de arquitectura de Camilo, el plugin y el prompt usan `get_decisions` del MCP del portafolio
  (044), con su fuente.
- **FR-5112** Límites: una acción por visitante propia (`mcpKit`), el tope diario compartido (`mcpDaily`) y una acción
  aparte para `check_spec` (`mcpKitCheck`). Las respuestas de transporte son las mismas de la 044.
- **FR-5113** Página `/{lang}/kit` en español y en inglés:
  - qué es Forja y la regla de transparencia;
  - la instalación en Claude Code;
  - la conexión desde otros clientes: solo los probados, con su fecha;
  - la corrida grabada y los resultados de las evals;
  - el enlace al repo.

  Se lee sin JavaScript.
- **FR-5114** Repo `CHERCED-DEV/forja` con licencia MIT, como monorepo con npm workspaces, igual que Cotejo. Contiene:
  - el plugin y su marketplace;
  - el paquete determinista `forja-core`: normalizar ids, matriz de cobertura, plantilla de entrega y validación de la
    bitácora;
  - los packs;
  - los encargos de muestra con su suite oculta, y el corredor de evals.

  El sitio consume `forja-core` por tarball del release, con versión exacta.
- **FR-5115** Publicación en dos tiempos:
  - **Antes de cerrar P-4105:** el repo es privado y Forja corre solo en la máquina de Camilo, con pantalla
    compartida. El sitio no cambia.
  - **Con P-4105 cerrada:** el repo se hace público y se construyen en el sitio el MCP del kit, la página, la tarjeta
    del AI Lab y la estación de la ruta.
- **FR-5116** Diseño propio. Nombres, fases, formatos y textos son de Forja. Lo que se parece a otros arneses se cuenta
  como patrón general, con palabras propias (la 041 los lista en `research.md`). Nada sale del proyecto de referencia
  (FR-4107).

## Entidades clave

- **Encargo:** la prueba técnica recibida tal cual, más su stack y sus minutos.
- **Requisito:** id `R-NN`, texto, criterio verificable, prioridad y cita de origen en el encargo.
- **Decisión:** qué se eligió, qué alternativas había, por qué y qué se sacrifica.
- **Tarea:** id, requisitos que cubre, archivos que toca y grupo de paralelismo.
- **Pack:** stack, versión y fecha, comandos, estructura, convenciones y errores típicos.
- **Entrega:** `ENTREGA.md`, con la matriz, y la bitácora.
- **Corrida de eval:** encargo, cliente, modelo, minutos, intervenciones, requisitos cubiertos y resultado de la suite
  oculta.

## Criterios de éxito

- **SC-5101** En los cinco encargos de muestra, en modo «de una» y sin intervención:
  - la solución compila y pasa su lint y sus pruebas;
  - pasa al menos el 80 % de la suite oculta;
  - la corrida termina dentro de sus minutos, con un margen del 10 %.
- **SC-5102** En cada entrega, el 100 % de los requisitos aparece en la matriz: cubierto por una prueba que lo nombra,
  cubierto por un comando que corrió Forja y pasó, o «sin cubrir» con su motivo.
- **SC-5103** En una corrida de control con un defecto sembrado a propósito, el revisor lo encuentra en tres de tres
  corridas.
- **SC-5104** Dos personas que no conocen Forja la instalan y la arrancan en Claude Code en 5 minutos o menos, solo con
  la página.
- **SC-5105** En modo local, cero bytes del encargo o del código llegan al servidor del autor. Lo comprueba una prueba
  que registra todas las llamadas del plugin a los MCP.
- **SC-5106** Al menos un cliente distinto de Claude Code (Cursor o ChatGPT en modo desarrollador) corre el prompt
  `solve_technical_test` y llega a una entrega con matriz. Se anota la fecha de la prueba.
- **SC-5107** Peso en el tope mensual de IA del sitio: cero USD.

## No incluye

- No resuelve pruebas a escondidas ni ayuda a ocultar el uso de IA.
- No llama a ningún modelo desde el sitio: razona el modelo del cliente de quien lo corre.
- No es un motor para gobernar los cambios del backlog de una empresa: resuelve un encargo acotado y entrega.
- No despliega la solución ni hace push: la deja lista en la máquina.
- No trae más packs que los cuatro de la v1.
- No sube el encargo ni el código a ningún servicio, ni guarda corridas de terceros.
- No promete compatibilidad con un cliente que no se probó.

## Costo y topes

- **Modelos del sitio:** cero. Forja razona con el modelo del cliente de quien la corre, sea el Claude Code de Camilo o
  el del entrevistador.
- **Corridas de eval:** con el Claude Code del autor en local, fuera del tope de la línea. Solo corren cuando él las
  autoriza (P-5105).
- **Vercel:** una invocación por mensaje MCP, con `mcpKit`, `mcpKitCheck` y el tope compartido `mcpDaily`.
- **GitHub:** Actions del repo. Los tarballs van en los releases, sin registro de paquetes ni cuenta nueva.
- **Peso en el tope mensual de IA:** cero USD (COP 0).

## Estación en la ruta de 10 minutos

| Id | Prueba | Minutos | Qué hace el entrevistador | Evidencia para el acta |
|---|---|---|---|---|
| `forja-de-una` | 4, y también 1 y 3 | 2 | Ve la corrida grabada en `/kit`, abre la matriz y la bitácora de la entrega, y decide si quiere correrla sobre su prueba | La matriz requisito → prueba de la corrida grabada (`kit-matrix`) |

Va en «Más pruebas» de la prueba 4, con `alsoProves: [1, 3]`. La corrida en vivo sobre la prueba del entrevistador
queda fuera de los 10 minutos. Entra al registro cuando el sitio publique Forja (FR-5115).

## Evals

- **Encargos de muestra:** cinco, inventados y marcados como ficticios, cada uno con su suite de aceptación oculta:
  - Angular: un tablero de tareas con filtros;
  - .NET: una API de reservas;
  - Next.js: un catálogo con carrito;
  - NestJS: una API de inventario con validación;
  - cruzado: un front en Angular contra una API en NestJS.
- **Métricas:**
  - suite oculta aprobada (%);
  - requisitos cubiertos (%);
  - minutos totales y por fase;
  - intervenciones humanas;
  - problemas que encontró el revisor y si eran reales.
- **Control del revisor:** una corrida por encargo con un defecto sembrado (SC-5103).
- **Calificación:** solo reglas y la suite oculta. Ningún modelo califica a otro.
- **Determinista en CI:** `forja-core` (ids, matriz, plantilla y bitácora) corre en el repo de Forja. Cuando se
  publique, el MCP del kit corre en el build del sitio con su batería de protocolo, filtración y fuentes, como la 044.

## Supuestos

- Claude Code sigue admitiendo plugins con comandos, skills, subagentes, hooks y MCP, instalables desde un marketplace
  en un repo de GitHub. Se confirma contra la documentación vigente el día de implementar.
- Los cuatro stacks tienen una CLI oficial para crear el proyecto y correr sus pruebas sin cuenta ni llave.
- La máquina que corre Forja tiene Node 20 o más reciente, porque los scripts del plugin lo usan. Tres de los cuatro
  stacks ya lo piden; para .NET, el arranque lo comprueba.
- El núcleo de Cotejo sale como paquete estable en la ola 2 (contrato de la 047).
- El MCP de la 044 se queda tal cual. El del kit es un servidor aparte sobre el mismo núcleo.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-5101 | ¿Nombre público? | «Forja», con el lema «de la spec a la solución probada» («from spec to tested solution») |
| P-5102 | ¿Quién crea el repo `CHERCED-DEV/forja`? | El autor, privado hasta cerrar P-4105. Después se hace público con licencia MIT |
| P-5103 | ¿Modo por defecto? | «De una», con los supuestos anotados. «Con pausas» va con una bandera |
| P-5104 | ¿Los packs se publican también como skills estándar para otros clientes que lean `SKILL.md`? | Sí, si el día de implementar hay clientes que los leen. Se anota cuáles y la fecha |
| P-5105 | ¿Quién autoriza y paga las corridas de eval? | El autor, con su Claude Code en local, corrida por corrida |
| P-5106 | ¿Qué versión de cada stack? | La estable vigente el día de implementar, fijada con su fecha. Se revisa cada trimestre |
| P-5107 | ¿La página va en `/{lang}/kit` o dentro del AI Lab? | `/{lang}/kit`, corta para dictar en una llamada, con la tarjeta A13 en «Agentes y plugins» del AI Lab |
| P-5108 | ¿Cuántos minutos por defecto? | 30, con un mínimo de 15 |

## Cómo quedó (fase A, 26 de noviembre de 2026)

Construida en la línea L10, en el repo local `C:\Users\HITMA\Desktop\forja` (rama `main`, commits `6e64223` a
`75b7b13`, sin remoto). El sitio no cambia.

### Qué hay

- **`forja-core`**, TypeScript estricto y sin dependencias en tiempo de ejecución: `parseRequirements`,
  `minimalChecker` detrás de `SpecChecker`, `coverageMatrix`, `coverageFromResults` y `orphanTests`, `parseTestReport`
  (JUnit, TRX y JSON de Jest), `deliveryMarkdown` y `deliveryProblems` en ES y EN, `validateLog` y `serializeEvent`,
  `parsePack`, las guardas (`evaluateToolUse`), el arranque (`preflight`), los chequeos del plan y el reparto del tiempo.
  `cotejoChecker` espera a que Cotejo publique su núcleo.
- **El plugin** en `plugins/forja/`, con su marketplace en la raíz del repo:
  - la skill `forja`, que es el comando `/forja` (o `/forja:forja`): seis fases, dos modos, reparto del tiempo, recorte
    por prioridad y retoma, con sus formatos en `formatos.md`;
  - los subagentes `arquitecto`, `constructor`, `verificador` y `revisor`; el verificador y el revisor no editan, y solo
    el arquitecto llama a `get_decisions`;
  - hooks de guardas y bitácora, activos solo mientras hay una corrida abierta;
  - siete scripts empaquetados en `dist/`, que corren con `node` sin `node_modules`;
  - `.mcp.json` con el MCP del portafolio por HTTP. El del kit llega en la fase B.
- **Cuatro packs** verificados el 26 de noviembre de 2026: .NET 10 LTS, NestJS 12, Next.js 16.4.6 y Angular 21.2.31.
- **Cinco encargos de muestra ficticios**, cada uno con su suite oculta de caja negra, su solución de referencia y su
  defecto sembrado para el control del revisor.
- **El corredor de evals**, la prueba de privacidad y el script que convierte una corrida en `recorded-run.json`.

### Decisiones que cambian o precisan la spec

| Decisión | Por qué | Qué se sacrificó |
|---|---|---|
| `/forja` es una skill; no hay `commands/forja.md` | La documentación vigente dice que los comandos son el formato viejo y que las skills los reemplazan | Nada: se invoca igual |
| Las guardas solo actúan con una corrida activa | Los hooks de un plugin corren en toda sesión donde está activo | Lo que pasa fuera de una corrida no queda en la bitácora |
| Los scripts toman la raíz de la carpeta donde corren | El Bash del agente no recibe `${CLAUDE_PLUGIN_ROOT}` como variable | Se corren desde la raíz de la solución o con `--raiz` |
| La bitácora suma `kind: 'mcp'` y `bytes` | SC-5105 pide registrar cada llamada a los MCP | Un tipo más en el esquema |
| Las guardas también bloquean nombres propios, URLs, correos y códigos del encargo hacia los MCP y las URLs | El nombre de la empresa o una URL interna son cortos y una comparación por fragmentos largos no los ve | Un tema general que use un nombre propio del encargo queda bloqueado |
| Angular 21.2.31 (LTS hasta mayo de 2027) en lugar de 22.3 | Angular 22 pide Node 22.22.3 y la máquina de la demo tiene Node 20.19 | Lo nuevo de Angular 22 |
| .NET 10 LTS en lugar de .NET 11 | .NET 11 salió el 10 de noviembre como STS y su soporte termina el mismo día que el de .NET 10 | Lo nuevo de .NET 11 |
| Vitest 4.1.12, jsdom 27.4.0 y TypeScript 6.0.3 | Vitest 5 y jsdom 28 piden Node 22; typescript-eslint no soporta TypeScript 7 | Lo nuevo de esas versiones |
| El pack NestJS quita la telemetría, el despliegue y las instrucciones para agentes que trae la plantilla | Forja es local primero y la corrida la gobierna el pack | Las skills oficiales de Nest |
| El pack Next.js usa `useSyncExternalStore` para el carrito | El lint de Next 16 rechaza un `setState` dentro de un efecto | El servidor siempre renderiza el carrito vacío |
| Las suites de front usan `playwright-core` con el Chrome instalado | Es lo más liviano: no descarga navegadores | Validar exige Chrome |
| Para la fase B, el prompt `solve_technical_test` también va como herramienta | ChatGPT en modo desarrollador solo documenta herramientas | Una herramienta casi repetida |
| Un requisito verificado por comando cuenta como cubierto (decisión del autor, 27 de noviembre) | El build, el arranque, el lint y el README quedaban siempre sin cubrir en las cinco corridas, aunque Forja los comprobaba | El comando prueba menos que una prueba: el revisor busca los que pasarían aunque el criterio fallara |

### Investigación (R-5101 a R-5105), consultada el 26 de noviembre de 2026

| Id | Fuente | Hallazgo |
|---|---|---|
| R-5101 | code.claude.com/docs: referencia de plugins, componentes, CLI, marketplace, hooks y skills | Manifiesto en `.claude-plugin/plugin.json`; las skills reemplazan a `commands/`; los agentes de un plugin ignoran `hooks`, `mcpServers` y `permissionMode`; `claude plugin validate <ruta> --strict` solo lee |
| R-5102 | cursor.com/docs/context/skills y la página de skills de Claude Code | Cursor lee `SKILL.md` desde `.agents/skills`, `.cursor/skills` y `.claude/skills`; fuera de Claude Code solo valen seis campos del frontmatter. Codex y Copilot sin confirmar |
| R-5103 | Registro npm, blog de .NET y su política de soporte | Angular 22.3.0 (Node 22.22.3), NestJS CLI 12.0.15, Next.js 16.4.6, .NET 11 STS desde el 10 de noviembre de 2026 y .NET 10 LTS hasta el 14 de noviembre de 2028 |
| R-5104 | code.claude.com/docs, modo sin interfaz | `claude -p` con `--plugin-dir`, `stream-json`, `--permission-mode dontAsk` y `--allowedTools`; `--bare` apaga los hooks del plugin, así que no se usa. La documentación nombra `--permission-prompts none`, que el CLI 2.1.202 no tiene y el 2.1.332 sí; `dontAsk` sirve en los dos |
| R-5105 | cursor.com/docs/context/mcp y la ayuda de OpenAI sobre el modo desarrollador | Cursor lista los prompts como soportados; ChatGPT solo documenta herramientas |

### Pruebas que se corrieron

- En el repo de Forja: `npm run lint`, `npm run typecheck`, `npx vitest run` (20 archivos y 161 pruebas en verde,
  ninguna saltada) y `npm run build`, con `dist/` igual al build. El integrador las repitió el mismo día, en verde, y
  revisó el repo y sus mensajes de commit en busca de nombres privados y secretos: cero hallazgos.
- `claude plugin validate` del marketplace y del plugin con `--strict`, en verde. La versión instalada (2.1.202) solo
  revisa manifiestos, así que la estructura del plugin la revisa una prueba propia.
- Cada pack: proyecto creado con su CLI en una carpeta temporal y build, lint, pruebas y reporte tal como están en su
  `pack.json`. Los cuatro en verde.
- Cada suite oculta: 100 % contra su referencia (13, 15, 7, 7 y 11 pruebas), y el defecto sembrado hace fallar las
  pruebas esperadas.
- El corredor, en seco con un agente de prueba que entrega una solución fija, y el control del revisor con revisiones
  fijas.
- La prueba de privacidad: un MCP falso registra todo lo que recibe. Solo llegaron los temas generales, cada llamada
  quedó en la bitácora y ninguna llevó el encargo, sus datos sensibles ni código. Los scripts del plugin no abrieron
  ninguna conexión de red.

### Primera corrida real (27 de noviembre de 2026)

El autor la autorizó el 26 de noviembre. El primer intento no arrancó: el CLI de la máquina no tenía sesión, y al
lanzarlo desde una sesión de Claude Code heredó sus variables. No hubo modelo ni costo. Los commits `92a35d7` y
`43c26aa` aíslan la corrida: sin la configuración ni los MCP del usuario, fuera de su perfil, con una identidad git
neutra, sin heredar la sesión que la lanza y revisando `claude auth status` antes de empezar. El autor inició sesión,
el CLI pasó de 2.1.202 a 2.1.332 y la corrida se repitió.

| Métrica | Resultado |
|---|---|
| Encargo | `nestjs-inventario` (ficticio), con 11 requisitos |
| Cliente y modelo | Claude Code 2.1.332 con `claude-opus-5-5`, modo «de una» |
| Suite oculta | 15 de 15 (100 %) |
| Requisitos cubiertos | 10 de 11. R-11, un `should` (pruebas, lint y README), no tiene una prueba que lo nombre y quedó con su motivo |
| Minutos | 19,3 de 45: leer 0,6, planificar 1,4, construir 5,4, verificar 4,8, revisar 5,8 y entregar 0,6 |
| Intervenciones y denegaciones | 0 y 0 |
| Revisor | 8 hallazgos (1 alto, 2 medios y 5 bajos). Se arreglaron 7 y el otro quedó escrito en la entrega |
| Costo informado | 3,51 USD, dentro del plan del autor y fuera del tope de la línea |

Lo que mostró:

- **El revisor encontró un error real:** la validación rechazaba precios válidos de más de 131 072 con dos decimales.
  Se arregló antes de entregar.
- **El encargo y las herramientas son datos:** la CLI de Nest escribe en su salida una instrucción para los agentes de
  código (vincular su telemetría). Forja no la siguió, quitó la telemetría como dice el pack y lo anotó en la entrega.
- **Dos huecos de las guardas, cerrados en `a3870d4`:** el revisor cerró su servidor de prueba con
  `taskkill //F //IM node.exe`, que cierra también los procesos de Node de la persona, y los subagentes escribieron
  logs en `/tmp`. Las guardas ahora bloquean cerrar procesos por nombre y redirigir fuera de la carpeta. Repetidas
  contra las 119 llamadas de la corrida, bloquean esas 5 y ninguna otra. La skill y los subagentes cierran sus
  servidores por PID o por puerto y dejan los logs en `forja/tmp/`.
- **Plugins cargados:** además de Forja, el CLI cargó cuatro plugins `cc-plugin-*` que el autor no instaló. Ninguno se
  invocó.
- **Detalles menores:** la tabla de minutos de `ENTREGA.md` ponía 0 en entregar, porque se escribe antes de cerrar esa
  fase (arreglado en `c8f5652`), y `npm` avisa que algunas herramientas de Nest piden Node 22.
- **Validador:** con el CLI 2.1.332, `claude plugin validate --strict` revisa los componentes (5 hooks, el MCP, 5
  skills y 4 subagentes) y pasa. Para publicar en el directorio de plugins avisa que faltan un ícono,
  `privacyPolicyUrl` y los hosts en `network.hosts`.

El resultado y su grabación están en `forja/evals/resultados/` (commit `438c6bb`).

### Las cinco corridas y los cinco controles (27 de noviembre de 2026)

El autor autorizó el resto de la serie el mismo día («Sí, todas»). Todas corrieron con Claude Code 2.1.332 y
`claude-opus-5-5`, en modo «de una», una detrás de otra y con el mismo aislamiento que la primera.

| Encargo | Suite oculta | Requisitos cubiertos | Minutos | Bloqueos de las guardas | Costo informado |
|---|---|---|---|---|---|
| `nestjs-inventario` | 15 de 15 | 10 de 11 | 19,3 de 45 | 0 (antes de `a3870d4`) | 3,51 USD |
| `dotnet-reservas` | 13 de 13 | 10 de 12 | 18,1 de 60 | 3, los tres de más | 3,48 USD |
| `nextjs-catalogo` | 7 de 7 | 8 de 11 | 13,8 de 60 | 0 | 2,98 USD |
| `angular-tablero` | 7 de 7 | 7 de 10 | 14,7 de 45 | 0 | 2,81 USD |
| `cruzado-turnos` | 11 de 11 (8 de 11 con la suite sin corregir) | 11 de 12 | 24,8 de 90 | 0 | 4,97 USD |

Ninguna tuvo intervenciones. Todas terminaron con menos de la mitad de sus minutos, y cada entrega pone todos sus
requisitos en la matriz, cubiertos o con su motivo. SC-5101 y SC-5102 se cumplen.

**Controles del revisor (SC-5103).** En los cinco encargos el subagente `forja:revisor` encontró el defecto sembrado, y
en todos es su primer hallazgo (H-01): el filtro de stock bajo con `<` en vez de `<=`, las reservas de hasta 5 horas,
el carrito escrito en `sessionStorage`, el filtro que no pliega el título y el 409 que no mira la fecha. El código quedó
igual a la referencia con el defecto: el revisor no cambió nada. Cada control tardó entre 1,5 y 3,5 minutos y costó
entre 0,34 y 0,39 USD informados. Son cinco de cinco, y el criterio pedía tres de tres.

Lo que mostró la serie:

- **Tres bloqueos de más en `dotnet-reservas`.** Dos comandos asignaban `$root` a la carpeta y escribían logs en
  `"$root\forja\tmp"`, y las guardas tomaban toda ruta con una variable como si estuviera fuera. El tercero borraba
  `forja/reportes` con `-ErrorAction SilentlyContinue`, y el valor de la opción contaba como otra carpeta. El commit
  `88240fa` resuelve las variables que el mismo comando asigna con un valor fijo, sigue tomando como fuera las que no
  puede resolver y revisa `-RedirectStandardOutput` y `-RedirectStandardError`. Repetidas contra las 119 llamadas de la
  corrida, ya no bloquean ninguna. Las tres corridas siguientes no tuvieron bloqueos.
- **Un defecto de la suite oculta de `cruzado-turnos`.** Contaba todas las opciones del `select` de hora y esperaba 16
  o 18. La solución pone primero una opción deshabilitada, que el enunciado no prohíbe y la referencia no tiene, así que
  la validación no lo mostró. El commit `484bd5f` cuenta solo las opciones habilitadas con forma `HH:MM`. La suite se
  revalidó: 11 de 11 con la referencia, y F-04 sigue fallando con el defecto sembrado. El resultado guarda las dos
  notas.
- **El revisor no deja pasar evidencia engañosa.** En `angular-tablero` una prueba nombraba R-08 (el build) sin
  comprobarlo, y la matriz lo daba por cubierto. Forja le quitó el nombre a la prueba y dejó R-08 sin cubrir, verificado
  por comando. En `cruzado-turnos` encontró que las pruebas e2e de la API no corrían con `npm test`.
- **Los requisitos sin cubrir son siempre los mismos:** el arranque o el build, y los `should` de pruebas, lint y
  README. Forja los comprueba a mano o por comando, pero ninguna prueba los nombra, así que la matriz los contaba como
  sin cubrir. El autor decidió el mismo día que un comando verificado cuente como cubierto (ver abajo).
- **La voz de los textos.** La solución de `cruzado-turnos` usó voseo («Elegí una hora»). La fase C lo cubre.
- **Procesos y archivos.** Ninguna corrida dejó servidores escuchando ni escribió fuera de su carpeta. Los servidores de
  prueba se cerraron por PID o por puerto. El SDK de .NET escribe sus propios logs de workloads en `%TEMP%`, fuera del
  alcance de las guardas.

Los resultados, las grabaciones de las cinco corridas y los controles están en `forja/evals/resultados/` (commits
`36df4c9`, `365a144`, `72ae39b`, `884e187` y `4277a0d`).

### Lo que no se pudo y lo que queda

- **Sesión interactiva:** el plugin ya corrió de punta a punta sin interfaz (`claude -p`), con sus subagentes y sus
  hooks. Falta verlo en una sesión interactiva, con pantalla compartida.
- **Corrida grabada (T5130):** el autor eligió la de `cruzado-turnos` el 27 de noviembre, la más completa (Angular
  contra NestJS). Se repitió el mismo día con la regla nueva (abajo), autorizada por el autor («Sí, una corrida»), y
  esa es la que va en la página: suite oculta 11 de 11, 14 de 14 requisitos (R-13 y R-14 cubiertos por comando), 27,6
  de 90 minutos, 4,60 USD informados, sin intervenciones, denegaciones ni bloqueos. El verificador escribió un script
  propio para comprobar el arranque con `PORT` y cerró la API por su PID. El revisor dejó 6 hallazgos bajos y se
  arreglaron 5. `forja/evals/resultados/elegida.json` apunta a su grabación, su resultado y su control, y guarda la
  corrida anterior. La grabación anota solo el stack principal (`angular`), así que la página muestra los dos stacks
  del encargo, que van en `elegida.json`.
- **Requisitos verificados por comando:** el autor decidió que cuenten como cubiertos, y el commit `816dfea` de Forja
  lo construye. `comando.mjs` corre el comando de uno o más requisitos, lo revisa antes con las mismas guardas, y anota
  en `forja/comandos.json` su código, la hora y los milisegundos. La matriz toma la última corrida de cada comando: si
  todas pasan, el requisito queda «cubierto por comando» con el comando exacto, y si alguna falla queda sin cubrir con
  ese motivo. Una prueba que falla pesa más que un comando que pasa. Las guardas no dejan escribir a mano
  `forja/comandos.json` ni `forja/matriz.json`, y el revisor busca comandos que pasarían aunque el criterio fallara.
  Las cinco corridas de la serie se midieron con la regla anterior. La repetición de `cruzado-turnos` ya usó la nueva
  (`dbc7edb`).
- **Publicar en el directorio de plugins:** un ícono, `privacyPolicyUrl` y `network.hosts`, en la fase B.
- **Límite de las guardas:** son hooks y no un sandbox. No revisan por dentro código arbitrario como `node -e`.
- **Node 20 llegó al fin de su soporte en abril de 2026.** Con Node 22, los packs pasan a Angular 22, Vitest 5 y jsdom
  28.
- **El MCP del portafolio:** solo existe en la vista previa de `dev`, así que en producción la skill sigue sin él y lo
  anota en la entrega.
- **Repo en GitHub (T5102):** el remoto `CHERCED-DEV/forja` lo crea el autor.

## Fase C (evolutiva): la firma CHERCED

Propuesta por el autor el 27 de noviembre de 2026, al ver las corridas reales: «quisiera que se llevara el design
system de nosotros, como para que tenga una firma de alto valor». Aprobada el mismo día con los valores por defecto
(«Apruebo la fase C con los valores por defecto»).

**Qué cambia.** Los fronts que construye Forja (Angular, Next.js y el `web/` del cruzado) salen con el sistema de
diseño del sitio. Las APIs no cambian. Quien abre la solución reconoce el trabajo del autor sin leer el README. La
firma trae:

- los tokens `--cw-*` de color en tema claro y oscuro, con el acento verde;
- el vidrio de `_glass.scss`, con su versión sólida para `prefers-reduced-transparency`;
- Montserrat para el texto y Silkscreen para los acentos;
- los espaciados, los radios y los breakpoints;
- la voz de los textos: español neutro con tuteo («Elige una hora», no «Elegí una hora»). La corrida de
  `cruzado-turnos` usó voseo.

**Cómo se construye.**

- **Una skill nueva, `forja:firma-cherced`.** El constructor la carga después del pack del stack. Trae los tokens como
  CSS custom properties y unos patrones base escritos para cada stack: campos, `select`, botones, tarjetas, listas,
  mensajes de error y estados vacíos. No copia los componentes de React del sitio: los escribe en el idioma de cada
  stack, ordenados en las capas del catálogo `content/ailab/ui-pieces.ts` (primitiva, composición, módulo).
- **Un solo origen.** Un script del repo de Forja exporta los tokens de `styles/tokens.scss` a la skill, con la fecha y
  el commit del sitio de donde salen. Una prueba falla si la copia no dice de dónde viene.
- **Sin hosts nuevos.** Las fuentes se instalan como paquetes del registro oficial (`@fontsource/montserrat` y
  `@fontsource/silkscreen`), sin CDN en tiempo de ejecución.
- **La entrega lo dice.** `ENTREGA.md` suma la decisión «Diseño: firma CHERCED», con su alternativa y lo que se
  sacrifica.

**Reglas.**

- **El encargo manda.** Si trae un diseño, una marca o una librería de componentes, o pide no usar ninguna, Forja no
  aplica la firma y lo anota como supuesto.
- **Los contratos no se tocan.** Los `data-testid`, las rutas y los textos que pide el enunciado quedan igual, y las
  suites ocultas tienen que pasar igual que sin la firma.
- **Accesibilidad AA en los dos temas:** contraste de los pares de tokens, foco visible y `prefers-reduced-motion` para
  el vidrio y las animaciones.

**Criterios de éxito.**

- **SC-5108** Las tres corridas de front con la firma pasan su suite oculta igual que sin ella.
- **SC-5109** Los pares de tokens de texto y fondo cumplen AA en los dos temas, medido con un chequeo determinista en el
  repo de Forja.
- **SC-5110** La firma suma 3 minutos o menos a la fase construir, de media, en las tres corridas.

**Preguntas abiertas.**

| ID | Pregunta | Respuesta (27 de noviembre, valor por defecto) |
|---|---|---|
| P-5109 | ¿Qué sistema de diseño? | El de CHERCED-WORLD, que es público en este repo. El de Synergos no publica sus piezas (P-2401) |
| P-5110 | ¿Va encendida por defecto? | Sí, cuando el encargo no dice nada de diseño, y `--sin-firma` la apaga. La otra opción es apagada, con `--firma` |
| P-5111 | ¿Lleva un crédito visible dentro de la app? | No: la firma es el diseño. El crédito va en `ENTREGA.md` y en el README. La otra opción es una línea discreta en el pie |
| P-5112 | ¿Cuándo se construye? | Después de cerrar las corridas y los controles de la fase A. Se construye en el repo privado y se publica con la fase B, después de P-4105 |

**Costo.** Cero en el sitio. Las tres corridas de front que la miden las autoriza el autor (P-5105), y cada una informa
unos 3 USD dentro de su plan.

### Cómo va (27 de noviembre de 2026)

Construida en el repo de Forja (commits `3d29f98` a `ac0ea3b`). Faltan las tres corridas que la miden.

- **Skill `forja:firma-cherced`:** los tokens, `base.css` con los patrones `cw-*` (contenedor, título, etiqueta pixel,
  superficie de vidrio, formulario, campo, botones, tarjeta, lista, error y vacío), la voz de los textos y las reglas.
  Las fuentes son `@fontsource-variable/montserrat` 5.3.0 y `@fontsource/silkscreen` 5.3.0, sin scripts de instalación
  y con licencia OFL-1.1.
- **Un solo origen:** `exportar-firma.mjs` convierte `styles/tokens.scss` y `styles/_breakpoints.scss` a CSS plano y deja
  en `origen.json` el commit del sitio (`114d01e`, del 5 de noviembre), la fecha y la huella. Una prueba falla si la
  copia cambia sin su origen o si queda SCSS sin convertir.
- **SC-5109 cumplido:** los 16 pares de texto y fondo pasan AA en los dos temas (texto entre 6,66 y 21; foco 21). El
  verde de acento da 1,53 sobre fondo claro, así que la skill lo deja solo para decorar.
- **Encendida por defecto:** `fase iniciar` la deja encendida y `--sin-firma` la apaga. El orquestador la instala una
  vez al crear el proyecto, los constructores de front cargan la skill y la entrega anota la decisión, una nota con el
  commit de origen y una línea en el README de la solución.
- **Vista en Chrome:** una página de muestra con los patrones, en tema oscuro, claro y a 375 px, carga las dos fuentes,
  no tiene scroll horizontal y deja las etiquetas y los controles alineados.
- **Validación:** 190 pruebas, lint, typecheck, `check:dist` y `claude plugin validate --strict` en verde.
