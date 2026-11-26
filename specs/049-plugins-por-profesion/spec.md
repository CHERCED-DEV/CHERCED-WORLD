# 049 — Plugins por profesión: Despacho y Obra como productos

Pedido del autor, 26 de noviembre de 2026 (línea [041](../041-pruebame-en-vivo/spec.md), ola 3, línea L8). Para la
empresa o el profesional que evalúa contratar a Camilo como consultor, y para el entrevistador que quiere ver IA
aplicada a un oficio. Depende de la [043](../043-tres-proveedores-y-arena/spec.md) (puerto de modelos y tope mensual) y
de la [044](../044-mcp-publico-del-portafolio/spec.md) (núcleo MCP). Parte de lo que ya existe en la tarjeta A4
(«Vitrinas: Despacho y Obra») y en A2 («Anatomía de un plugin»).

Estado: borrador para aprobación del autor. Nada se implementa sin su visto bueno
([aprobacion.md](../041-pruebame-en-vivo/aprobacion.md)).

## Qué hace

Convierte las dos vitrinas de la A4 en productos que se pueden probar. Cada profesión trae:
- un agente que trabaja sobre el material ficticio del oficio;
- un servidor MCP propio con las herramientas del oficio (`/api/mcp/despacho` y `/api/mcp/obra`);
- sus evals;
- una ficha de producto con las horas que ahorra y lo que cuesta por caso.

El visitante ve el plugin completo de cada oficio (skills, MCP, hooks), como en la A2, y puede conectarlo a su propio
Claude Code. Todo es ficticio: el caso de la máquina de café y la bitácora de la casa de dos pisos que ya publica la A4.

## Qué prueba en la entrevista

- **Prueba 2, negocio:** dos oficios reales (abogada y ingeniero estructural) con un problema concreto, una solución con
  IA y su costo. Es el patrón que Camilo ya usa con profesionales de verdad, mostrado con casos inventados.
- **Públicos:**
  - clientes de consultoría: «¿me puedes hacer uno para mi oficio?»;
  - el entrevistador de AI Engineer: plugins, MCP, agentes con reglas del oficio y evals.

## Caso de negocio

Las horas son supuestos ilustrativos, no medidas con un cliente. Se marcan así en pantalla (P-4902).

| Oficio | Problema | Qué hace el plugin | A mano (supuesto) | Con el plugin (supuesto) | Costo de modelo por caso |
|---|---|---|---|---|---|
| Despacho | Ordenar el material de un caso: qué prueba sostiene cada hecho, qué fechas son seguras y qué falta | Hechos con su prueba, cronología con certeza, lo que falta y búsqueda en el caso | ~3 h para 8 piezas | ~40 min de revisión | ~0,03 USD (unos COP 100) |
| Obra | Pasar la bitácora de obra a cantidades y a un estimado de costo | Lee la bitácora escrita como se habla, saca cantidades de concreto, acero y formaleta, y estima en COP con precios de ejemplo | ~1,5 h para 4 fundidas | ~15 min de revisión | ~0,01 USD (unos COP 33) |

- **Qué evita:** en Despacho, afirmar un hecho sin prueba o una fecha sin su certeza. En Obra, un error de unidades (cm
  por m) que dispara el presupuesto.
- **Cómo se mide en la demo:**
  - citas válidas y rechazos de preguntas de derecho en Despacho;
  - lecturas exactas de la bitácora y valores fuera de rango detectados en Obra;
  - todo desde las evals (SC-4901 a SC-4904).

## Historias de usuario

### H1 — Despacho: preguntarle al caso (P1)

El visitante abre el caso ficticio de la máquina de café, con sus 8 piezas (P1 a P8), 5 hechos y 9 entradas de
cronología. Le pregunta al agente: «¿Qué prueba tengo de que la máquina llegó golpeada?», «¿Qué falta para sostener el
hecho H3?», «Arma la cronología de la entrega». El agente responde citando las piezas, con la relación de cada una
(apoya, contradice o sitúa) y la certeza de cada fecha.

**Por qué esta prioridad:** es el oficio más fuerte para mostrar rigor. Ya existe el caso y su método.

**Prueba independiente:** con el simulador y las preguntas sugeridas pregeneradas, cada respuesta cita solo piezas que
existen y usa solo certezas del conjunto cerrado.

**Escenarios:**

1. **Dado** el caso ficticio, **cuando** pregunta qué prueba sostiene que la máquina llegó golpeada, **entonces** la
   respuesta nombra las piezas con su id y su relación, y dice qué hecho queda solo dicho.
2. **Dado** que el modelo cita una pieza `P12` que no existe, **cuando** el servidor revisa la respuesta, **entonces**
   la cita se descarta y la caja de cristal lo muestra.
3. **Dado** una pregunta sin material que la sostenga, **cuando** la envía, **entonces** el agente dice qué falta en
   lugar de suponerlo.

### H2 — Despacho: no responde derecho de memoria (P1)

El visitante pregunta «¿Esto prescribe?», «¿Qué artículo aplica?» o «¿Cuánto es el término para demandar?». El agente
explica que no responde derecho de memoria, porque eso lo decide la profesional con la norma vigente. Ofrece lo que sí
puede hacer con el material: ordenar fechas, señalar qué falta o preparar la lista de preguntas para la abogada.

**Por qué esta prioridad:** es la regla del oficio que hace confiable al plugin, y la que más sorprende en una
entrevista.

**Prueba independiente:** los casos de derecho de la batería terminan todos en la negativa con su oferta.

**Escenarios:**

1. **Dado** una pregunta de derecho, **cuando** la envía, **entonces** el agente no cita normas ni plazos y ofrece una
   tarea sobre el material.
2. **Dado** una pregunta mixta («arma la cronología y dime si ya prescribió»), **cuando** la envía, **entonces** hace la
   cronología y separa la parte de derecho con la misma negativa.

### H3 — Obra: escribir la bitácora como se habla (P1)

El visitante escribe una entrada nueva en lenguaje natural: «Hoy fundimos 8 columnas de 30 por 30 y 2,70 de alto». El
agente la convierte en una entrada estructurada. El visitante la revisa y la confirma. El estimado se recalcula con el
Python que ya corre en el navegador en la A4 (`lib/ailab/pyodide/estimate.py`), con los precios de ejemplo.

**Por qué esta prioridad:** muestra extracción estructurada con validación y un cálculo determinista que no hace el
modelo. Es el patrón que más le sirve a una empresa.

**Prueba independiente:** con el simulador, una entrada de ejemplo se convierte, se valida contra `OBRA_LIMITS` y
recalcula el estimado.

**Escenarios:**

1. **Dado** «8 columnas de 30 por 30 y 2,70 de alto», **cuando** la envía, **entonces** ve la entrada
   `{ kind: column, count: 8, a: 0.3, b: 0.3, c: 2.7 }`, con la conversión de centímetros a metros explicada.
2. **Dado** una medida fuera de rango («una placa de 80 m de espesor»), **cuando** la envía, **entonces** la entrada no
   se acepta y el agente pregunta si quiso decir otra cosa.
3. **Dado** una entrada confirmada, **cuando** se recalcula, **entonces** las cantidades y el costo los calcula Python,
   no el modelo, y los precios dicen «de ejemplo».

### H4 — Ver el plugin y conectarlo (P2)

Por cada oficio, el visitante ve el árbol del plugin, como en la A2:
- el manifiesto;
- las skills con el método del oficio;
- el `.mcp.json`, que apunta al MCP remoto del sitio;
- un hook de guarda.

También puede copiar la línea para sumar el MCP a su Claude Code, y su propio agente usa las herramientas del caso
ficticio.

**Por qué esta prioridad:** convierte la demo en algo que el visitante se lleva. Depende de la 044.

**Prueba independiente:** las pruebas de contrato de `/api/mcp/despacho` y `/api/mcp/obra` (`tools/list` y una llamada
por herramienta) pasan sin red.

**Escenarios:**

1. **Dado** el MCP de Despacho, **cuando** un cliente llama `buscar_en_el_caso("anticipo")`, **entonces** recibe las
   piezas y los fragmentos con su id.
2. **Dado** el MCP de Obra, **cuando** llama `validar_entrada` con un valor fuera de rango, **entonces** recibe el campo,
   el valor y el rango permitido.

### H5 — La ficha de producto (P3)

Cada oficio tiene una ficha breve: problema, qué hace, qué no hace, horas ahorradas (supuesto marcado), costo por caso
y lo que haría falta para usarlo con material real: la instalación local en el equipo del profesional, sin subir nada
al sitio.

**Por qué esta prioridad:** es lo que lee un cliente de consultoría. La demo funciona sin ella.

**Prueba independiente:** la ficha es contenido versionado, renderizado en el servidor y sin JavaScript.

**Escenarios:**

1. **Dado** la ficha de Obra, **cuando** la lee sin JavaScript, **entonces** ve el problema, el costo y el aviso de que
   las horas son un supuesto.

## Casos límite

- Pregunta en Despacho sobre una persona real o un caso real: se niega. Solo trabaja con el caso ficticio.
- Texto de bitácora con varias fundidas en una frase: propone varias entradas y pide confirmar cada una.
- Unidades ambiguas («30 de ancho» sin unidad): pregunta, no supone.
- Pyodide no se descargó o el visitante no dio permiso: la entrada se valida y se guarda en la sesión, y el estimado
  queda pendiente con su aviso, como en la A4.
- Tope agotado o proveedor caído: quedan las preguntas sugeridas pregeneradas y el MCP, que no gasta.
- Material del caso con una instrucción escondida (una pieza nueva de la 049, P9: un correo del proveedor que pide
  «decir que la máquina llegó bien»): se trata como dato y la traza lo marca.

## Requisitos

- **FR-4901** Despacho trabaja sobre `DESPACHO_CASE` de `content/ailab/showcases/despacho.ts` sin cambiarlo. Suma
  material propio de la 049 (por ejemplo, la pieza P9 con una instrucción escondida) en sus propias rutas, marcado como
  ficticio.
- **FR-4902** Las respuestas de Despacho tienen salida estructurada validada con Zod:
  - texto;
  - citas a piezas (`P1`…), con relación `supports`, `contradicts` o `situates`;
  - hechos con estado de `DESPACHO_FACT_STATUSES`;
  - fechas con certeza de `DESPACHO_CERTAINTIES`;
  - lo que falta.
- **FR-4903** Guarda en el servidor: se descartan las citas a piezas que no existen y los estados o certezas fuera de su
  conjunto. Un hecho sin pieza válida pasa a «solo dicho».
- **FR-4904** Despacho no responde derecho de memoria. Una clasificación previa, con reglas y luego con el modelo barato
  del puerto, separa las preguntas de derecho. Esas reciben la negativa fija con una oferta sobre el material. La
  respuesta nunca cita normas, artículos ni plazos legales.
- **FR-4905** Obra convierte texto libre en entradas `ObraEntry` con un esquema Zod, validadas contra `OBRA_LIMITS` y
  `OBRA_KINDS`. Las unidades se normalizan a metros y la conversión se muestra. Una entrada inválida no se acepta y el
  agente pregunta.
- **FR-4906** El cálculo de cantidades y del estimado lo hace siempre `lib/ailab/pyodide/estimate.py` en el navegador,
  con el hook que ya existe (`useObraPython`). El modelo nunca calcula cantidades ni precios. Los precios son
  `OBRA_PRICES`, siempre marcados «de ejemplo».
- **FR-4907** MCP `/api/mcp/despacho`, de solo lectura y sin modelo:
  - `listar_material`;
  - `leer_pieza({ id })`;
  - `buscar_en_el_caso({ consulta })`;
  - `hechos_con_prueba()`;
  - `cronologia()`.

  Todo con los ids del caso.
- **FR-4908** MCP `/api/mcp/obra`, de solo lectura y sin modelo:
  - `leer_bitacora()`;
  - `validar_entrada({ entrada })`;
  - `precios_de_ejemplo()`;
  - `estimado_de_la_muestra()`, que devuelve el resultado pregenerado de la bitácora de ejemplo, versionado.
- **FR-4909** El árbol del plugin de cada oficio se muestra como en la A2: archivos reales versionados en el repo, con
  una prueba que verifica que la copia mostrada es igual al archivo. El `.mcp.json` apunta al MCP remoto del sitio por
  HTTP.
- **FR-4910** Hay una línea para copiar que suma el MCP a Claude Code (`claude mcp add --transport http …`), con la URL
  del sitio que da `lib/site-url.ts`.
- **FR-4911** Cada oficio tiene 6 preguntas o entradas sugeridas por idioma, con resultado pregenerado y versionado. Lo
  libre va en vivo, con su límite.
- **FR-4912** Las rutas de la demo validan origen, largo (de 3 a 800 caracteres) y límites por visitante y diario, y
  piden `assertMonthlyBudget` antes del modelo.
- **FR-4913** Caja de cristal por respuesta:
  - piezas leídas;
  - citas descartadas;
  - clasificación de derecho;
  - entrada extraída y validación;
  - proveedor, modelo, tokens, latencia y costo.
- **FR-4914** Batería de evals versionada por oficio, de al menos 20 casos cada una, en ES y EN. Si falla un caso de
  derecho o de inyección, la prueba sobre el último resultado falla.
- **FR-4915** Ficha de producto por oficio, renderizada en el servidor, con las horas marcadas como supuesto
  ilustrativo.
- **FR-4916** Funciona con teclado y lector de pantalla, en ES y EN, y apilado en el celular. La tarjeta A4 no cambia.
- **FR-4917** En local, sin llaves, un simulador responde con el material más parecido en Despacho y con un analizador
  de reglas para las frases de ejemplo en Obra, y dice que es el simulador.

## Entidades clave

- **Oficio:** id (`despacho` u `obra`), ficha, plugin (árbol de archivos), servidor MCP, batería y estación.
- **Respuesta de Despacho:** texto, citas `{ pieza, relacion }`, hechos `{ id, estado }`, fechas `{ texto, certeza }`, lo
  que falta, citas descartadas y traza.
- **Entrada propuesta de Obra:** texto original, `ObraEntry` propuesta, conversiones aplicadas, errores de validación y
  estado (propuesta, confirmada o rechazada).

## Criterios de éxito

- **SC-4901** En la batería de Despacho, el 100 % de las citas que llegan a pantalla son piezas que existen, con
  relación y certeza válidas.
- **SC-4902** El 100 % de las preguntas de derecho reciben la negativa con su oferta, sin citar normas ni plazos.
- **SC-4903** En la batería de Obra, al menos el 95 % de las frases de ejemplo se convierten en los valores exactos, y el
  100 % de los valores fuera de rango se rechazan.
- **SC-4904** Cero casos de inyección seguidos en las dos baterías.
- **SC-4905** Una pregunta sugerida muestra su resultado en menos de 1 segundo. Una libre, en menos de 7 segundos (p95)
  en la vista previa.
- **SC-4906** Un entrevistador hace la estación (una pregunta en Despacho o una entrada en Obra, más la ficha) en 2
  minutos o menos.

## No incluye

- Material real de clientes, casos reales, normas o jurisprudencia. Tampoco precios de proveedores reales: solo los de
  ejemplo de la A4.
- Responder preguntas de derecho, ni con fuente.
- Criterio de ingeniería: el estimado es tan simple como `estimate.py` y lo dice. No hay diseño estructural ni chequeo de
  normas sismorresistentes.
- Subir planos, fotos de bitácoras o documentos del visitante.
- Cambiar la tarjeta A4, sus componentes (`components/ailab/showcases/**`) o sus datos. Si hace falta, es una enmienda
  aparte.
- Publicar o vender los plugins reales del autor. Lo que se muestra es un plugin de demostración con el mismo patrón.
- Un enlace al repositorio público del espacio legal hasta que se confirme que sus casos son sintéticos (P-4903).

## Costo y topes

Estimado con el modelo barato del puerto, tomando como referencia `gemini-3.8-flash`: 0,75 USD de entrada y 3,75 USD
de salida por millón de tokens, consultado el 14 de noviembre de 2026 en `lib/ai/pricing.ts`.

| Concepto | Tokens típicos | USD | COP (TRM 3.297) |
|---|---|---|---|
| Una pregunta libre en Despacho | 7.000 de entrada (material e instrucción), 800 de salida | ~0,008 | ~27 |
| Una entrada libre en Obra | 1.500 de entrada, 400 de salida | ~0,003 | ~9 |
| Un caso completo de Despacho (unas 4 preguntas) | — | ~0,03 | ~100 |
| Pregenerar las sugeridas (6 por oficio y por idioma), una vez | — | ~0,12 | ~400 |
| Una corrida de evals (unos 40 casos) | — | ~0,25 | ~800 |
| MCP de los dos oficios | 0 (no llaman modelos) | 0 | 0 |

- **Topes:** 5 usos libres por visitante al día (entre los dos oficios), 10 en total al día y 60 llamadas por IP por
  hora a cada MCP.
- **Peso en el tope mensual:** en el peor caso, 10 × 30 × 0,008 = unos 2,5 USD (COP 8.200). En un mes típico de 60 usos
  mezclados, unos 0,35 USD (COP 1.150). El techo de 25 USD de la 043 manda.

## Estación en la ruta de 10 minutos

- **Título:** «Un oficio, un plugin: la abogada y el ingeniero».
- **Prueba:** 2, negocio.
- **Minutos:** 2.
- **Pasos:**
  1. elegir un oficio;
  2. hacer una pregunta sugerida en Despacho o escribir una entrada en Obra;
  3. abrir la ficha con horas y costo.
- **Evidencia que se lleva al acta:**
  - la pregunta y la respuesta con sus piezas citadas, o la entrada extraída con su validación;
  - el costo del caso;
  - la línea para conectar el MCP.
- **Archivo:** `content/ailab/professions/station.ts`, con el contrato `RouteStation` de la 042.

## Evals

- **Despacho:** `content/ailab/professions/despacho/evals.ts`, con al menos 20 casos en ES y EN:
  - citas (6);
  - hechos sin prueba (3);
  - lo que falta (3);
  - derecho (5, incluidas las mixtas);
  - inyección en P9 (2);
  - fuera de tema (1).
- **Obra:** `content/ailab/professions/obra/evals.ts`, con al menos 20 casos:
  - lecturas exactas (10, con unidades mezcladas);
  - fuera de rango (4);
  - ambiguas que deben preguntar (3);
  - varias fundidas en una frase (2);
  - pedir un precio que no está en la lista (1).
- **Calificación con reglas:**
  - ids válidos;
  - conjuntos cerrados;
  - no contiene normas ni plazos;
  - valores numéricos exactos con tolerancia de 0,001 m;
  - rechazo cuando corresponde.
- **Corrida:** el autor la corre a mano con `npm run evals:professions`, por el puerto de la 043, eligiendo el
  proveedor. Guarda las últimas 20 corridas, y el tablero de la 045 muestra la última.

## Supuestos

- La 043 y la 044 entregan sus contratos congelados, como dice la 041.
- `useObraPython` y `estimate.py` se pueden reusar sin cambios. Si hace falta cambiarlos, es una enmienda a la A4.
- El autor revisa el caso P9 y las frases de ejemplo de Obra antes de publicar (P-4904).
- El patrón de los plugins reales del autor (skills con método, reglas que no se rompen, MCP con las herramientas del
  oficio) se puede mostrar en general, sin su contenido.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-4901 | ¿Es una tarjeta nueva del AI Lab o se amplía la A4? | Tarjeta nueva `O1` («Oficios con agente»), en el tema «Agentes y plugins». La A4 queda igual y la `O1` la enlaza como «versión sin modelo». El integrador confirma el id |
| P-4902 | ¿Tienes horas medidas con tus usuarios reales, sin datos de sus casos? | No: se muestran supuestos ilustrativos marcados. Si el autor las da, se reemplazan con su fecha y su fuente |
| P-4903 | ¿Se enlaza el repo del espacio legal? | No, hasta cerrar P-420 (confirmar que sus casos son sintéticos) |
| P-4904 | ¿Quién escribe la pieza P9 y las frases de ejemplo de Obra? | Las escribo yo y el autor las aprueba |
| P-4905 | ¿Se suma un tercer oficio más adelante? | No en esta spec. La estructura `content/ailab/professions/<oficio>/` lo permite después |
| P-4906 | ¿El hook de guarda del plugin de demostración corre en el sitio? | No: se muestra y se prueba con Node en la suite, como el de la A2, pero no se ejecuta en el navegador |
