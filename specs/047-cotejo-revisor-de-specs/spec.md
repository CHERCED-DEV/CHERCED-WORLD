# 047 — Cotejo: revisor de specs local y determinista

Pedido del autor, 26 de noviembre de 2026 (línea [041](../041-pruebame-en-vivo/spec.md), ola 2, línea L6). Para
líderes técnicos, QA y equipos que trabajan con specs escritas o ampliadas por agentes, y para el entrevistador que
quiere ver una herramienta de IA aplicada con números. Depende de la propuesta
[014](../014-gestor-de-specs/propuesta.md) y de su [medición](../014-gestor-de-specs/medicion/README.md).

Estado: borrador para aprobación del autor. Nada se implementa sin su visto bueno
([aprobacion.md](../041-pruebame-en-vivo/aprobacion.md)).

## Qué hace

Cotejo confronta una spec consigo misma y con el código. Encuentra, sin gastar tokens de LLM, cinco fallas:
- contradicciones;
- duplicados;
- ambigüedad;
- referencias rotas;
- requisitos que el producto probablemente ya tiene.

Cada hallazgo trae su evidencia y cómo refutarlo. Vive en un repo propio, abierto y con licencia MIT. Llega de cinco
formas:
- una CLI;
- una GitHub Action que anota el PR;
- una skill de Claude Code;
- un servidor MCP local;
- una demo en el navegador del AI Lab.

Su núcleo determinista sale primero como paquete estable, porque la 046 lo usa.

## Qué prueba en la entrevista

- **Prueba 2, problemas de negocio resueltos:** el *documentation sprawl* le cuesta horas a cualquier equipo que
  recibe specs largas. Cotejo muestra cuánto revisa en cuánto tiempo, con qué precisión y cuántos tokens le ahorra al
  agente.
- **Prueba 3, código de calidad:** repo abierto con pruebas, métricas por detector, reporte reproducible byte por byte
  y un corpus con verdad conocida.
- **Prueba 4, entrega rápida con IA:** es un gate barato antes de implementar, en CI y para agentes.
- **Públicos:** el AI Engineer remoto (modelos pequeños donde sirven, deterministas donde no), el senior full-stack
  (herramienta de equipo, CI, SARIF) y el consultor (un producto que una empresa puede usar mañana).

## Caso de negocio

- **Problema:** llegan specs de más de 10.000 líneas, muchas escritas por agentes, y nadie alcanza a revisarlas antes
  de estimar. Se repiten cinco fallas:
  - contradicciones internas;
  - requisitos que ya existen;
  - duplicados;
  - términos vagos;
  - referencias rotas.

  El Thoughtworks Technology Radar del 4 de noviembre de 2026 puso *AI-driven documentation sprawl* en «Caution». Un
  benchmark del 3 de septiembre de 2026 mostró que el mejor LLM comercial detecta el 47 % de los defectos que marcan
  los expertos (investigación de la 014, R-1401 y R-1404).
- **Para quién:**
  - el líder técnico o arquitecto que recibe la spec;
  - QA;
  - quien la escribe, sea persona o agente;
  - los equipos que usan Spec Kit, Kiro u OpenSpec.
- **Qué ahorra:**
  - **En la medición de la 014:** la capa determinista revisó una spec de 9.992 líneas en 0,23 s de CPU.
  - **Tokens del agente:** el resumen compacto de los hallazgos cabe en unos pocos miles de tokens, frente a los unos
    300.000 de la spec completa. Es una estimación que se mide con el reporte real (SC-4712).
- **Cómo se mide:**
  - precisión y recall por detector en tres corpus;
  - el tiempo que tarda una persona en encontrar los defectos sembrados de la muestra, con y sin Cotejo (SC-4710);
  - el tamaño de la spec frente al tamaño del resumen.

## Historias de usuario

### Historia 1 — La spec contra sí misma, en un segundo (P1)

El entrevistador abre la tarjeta «Cotejo» en el AI Lab y carga la spec de muestra (unas 600 líneas con defectos
sembrados). En menos de un segundo, sin descargar nada, ve los hallazgos de la capa determinista. Cada uno resalta sus
líneas y desglosa su puntaje. También ve en vivo la precisión y el recall contra la verdad de la muestra.

**Por qué esta prioridad:** es la demo de dos minutos y el mensaje central: lo que más duele se resuelve sin modelo.

**Prueba independiente:** la demo con la muestra en un navegador sin red después de cargar la página.

**Escenarios:**

1. **Dado** la muestra cargada, **cuando** corre la capa determinista, **entonces** aparecen las contradicciones de
   valor y de polaridad, los duplicados, las referencias rotas y los términos vagos con su evidencia (archivo, línea,
   id y fragmento original).
2. **Dado** un hallazgo, **cuando** el entrevistador lo abre, **entonces** ve la regla, el puntaje desglosado, por qué
   es un problema y cómo refutarlo.
3. **Dado** que pega su propia spec, **cuando** corre el análisis, **entonces** el texto no sale del dispositivo y la
   pantalla lo dice.

### Historia 2 — Un gate en CI con anotaciones en el PR (P1)

Un equipo agrega la Action de Cotejo a su repo. En cada PR que toca specs, Cotejo analiza las unidades cambiadas y sube
un SARIF. GitHub muestra los hallazgos como anotaciones en el PR.

**Por qué esta prioridad:** es lo que convierte la herramienta en producto para una empresa.

**Prueba independiente:** la Action en el propio repo de Cotejo, sobre un PR de prueba con una spec defectuosa.

**Escenarios:**

1. **Dado** un PR que agrega una contradicción de valor, **cuando** corre la Action, **entonces** el PR muestra una
   anotación en las dos líneas en conflicto.
2. **Dado** más de 1.000 hallazgos, **cuando** se arma el SARIF, **entonces** van los 1.000 más severos y el resumen
   dice cuántos quedaron fuera.

### Historia 3 — El agente lee el resumen, no la spec (P2)

Una persona trabaja con Claude Code. La skill de Cotejo corre la CLI y le pasa al agente el resumen compacto: un
hallazgo por línea con la cita mínima. El servidor MCP local hace lo mismo para cualquier cliente MCP.

**Por qué esta prioridad:** muestra que el autor construye herramientas para agentes, no solo con agentes.

**Prueba independiente:** el servidor MCP con un cliente de prueba por stdio sobre la muestra.

**Escenarios:**

1. **Dado** una spec de 10.000 líneas, **cuando** el agente pide el resumen, **entonces** recibe menos del 5 % de los
   tokens de la spec completa.
2. **Dado** que el cliente pide un archivo fuera de la carpeta raíz, **cuando** llama a la herramienta, **entonces** se
   rechaza.

### Historia 4 — «Posiblemente implementado» (P2)

Cotejo compara cada requisito con el repo (código, pruebas, textos de la interfaz, specs y ADR anteriores). Para los
que probablemente ya existen, devuelve los tres archivos más probables con los términos que coincidieron y el puntaje
de cada método. Nunca dice «ya existe» a secas.

**Por qué esta prioridad:** es el hallazgo más caro de encontrar tarde, pero el menos preciso de los cinco.

**Prueba independiente:** 20 requisitos del portafolio contra el índice del sitio.

**Escenarios:**

1. **Dado** el requisito «el blog tiene feed RSS», **cuando** se busca en el repo del sitio, **entonces** aparece
   `app/[lang]/feed.xml/` entre los tres primeros.
2. **Dado** un requisito que no existe, **cuando** se busca, **entonces** su puntaje queda bajo y la pantalla no afirma
   nada.

### Historia 5 — Capas semánticas opcionales, con consentimiento (P3)

El entrevistador enciende los embeddings (118 MB, la misma caché del buscador A5) y, si acepta, el modelo NLI (339 MB
en español u 87 MB en inglés). Ve qué ordenan bien (paráfrasis) y qué se les escapa (contradicciones semánticas), con
su tiempo y su peso a la vista.

**Por qué esta prioridad:** muestra criterio sobre cuándo un modelo sirve y cuándo no, pero es caro en descarga.

**Prueba independiente:** la capa con modelos de prueba pequeños en la suite del repo de Cotejo.

**Escenarios:**

1. **Dado** que no aceptó la descarga, **cuando** abre la demo, **entonces** no se baja ningún modelo y la capa
   determinista funciona completa.
2. **Dado** que aceptó, **cuando** corre la capa NLI, **entonces** la salida es una lista ordenada para revisar, no un
   veredicto, y la pantalla lo dice.

### Historia 6 — La 046 usa el núcleo (P1)

La línea 046 importa el núcleo determinista como paquete con versión fija. Le pasa una spec breve generada por un
modelo y recibe el reporte en milisegundos, con el perfil `breve`.

**Por qué esta prioridad:** la 046 no puede arrancar sin esto.

**Prueba independiente:** la prueba de contrato del paquete, que también corre en el repo del sitio.

**Escenarios:**

1. **Dado** una spec breve con un criterio que no cubre ningún requisito, **cuando** se analiza con el perfil `breve`,
   **entonces** sale un hallazgo `error` en esa línea.
2. **Dado** el mismo texto dos veces, **cuando** se analiza, **entonces** el JSON tiene el mismo sha256.

## Casos límite

- **Spec sin plantilla reconocida:** se analiza igual, sin las reglas de estructura, y el reporte lo dice.
- **Specs de este repo:** usan el estilo propio (`FR-NNxx`, `SC-NNxx`, tabla de `P-NNxx`), no la plantilla completa de
  Spec Kit. Hay un perfil `cherced` para que no salgan cientos de falsos «falta sección».
- **«ó», «ñ» y tildes:** los límites de palabra van en Unicode (lección de la 014: el `\b` de JavaScript se saltaba
  «óptimo»).
- **Números con unidades distintas** (15 min frente a 900 s): se normalizan antes de comparar valores.
- **Una spec enorme en el navegador:** la demo acepta hasta 3.000 líneas pegadas. Más que eso se analiza con la CLI.
- **Sin WebGPU:** las capas semánticas corren en WASM, con un aviso de que tardan más.
- **Archivos «imán»** como `content/projects.ts`, que lo mencionan todo: bajan de peso en «posiblemente implementado».
- **La Action en un fork sin permisos de code scanning:** deja el reporte como artefacto y un resumen en el log.

## Requisitos

- **FR-4701** Repo público propio, `CHERCED-DEV/cotejo`, con licencia MIT, en TypeScript. El núcleo corre en Node 20+
  y en un Web Worker sin cambios.
- **FR-4702** Núcleo determinista (`cotejo-core`): sin red, sin sistema de archivos y sin modelos; entra texto y sale
  un reporte. Es la primera entrega, con versión semántica y API estable (contrato en el plan).
- **FR-4703** Reglas del núcleo:

  | Familia | Qué revisa |
  |---|---|
  | Estructura | Secciones obligatorias por perfil (`speckit`, `cherced`, `breve`), secciones vacías, `[NEEDS CLARIFICATION]`, `TBD` y `TODO` pendientes |
  | IDs | Formato, repetidos, requisitos sin criterio y criterios sin requisito |
  | Referencias | IDs inexistentes, anclas rotas y enlaces a archivos que no existen |
  | Glosario | Acrónimos sin definir, términos definidos y no usados, variantes del mismo término |
  | Números y unidades | Cantidades con unidad normalizada, números sin unidad en atributos con dimensión, el mismo atributo con valores distintos |
  | Lenguaje | Diccionarios ES y EN de vagos, subjetivos, escapatorias, superlativos y «y/o» |
  | Duplicados | Exactos por hash del texto normalizado y casi exactos por shingles de 5 caracteres con Jaccard de 0,9 o más |
  | Contradicción de valor | La misma frase con los números enmascarados y otro número |
  | Polaridad opuesta | Las mismas palabras de contenido, una con negación y otra sin |

- **FR-4704** Las reglas y los diccionarios son datos, en YAML con el estilo de las reglas de Vale. Un equipo los
  extiende sin tocar código. El núcleo los recibe ya cargados como objetos, sin leer archivos.
- **FR-4705** Cuatro salidas del mismo resultado:
  - **JSON** con esquema versionado, que es la fuente de verdad;
  - **SARIF 2.1.0**, ordenado por severidad, hasta 1.000 resultados;
  - **Markdown**;
  - **resumen compacto para agentes**, con un hallazgo por línea y la cita mínima.
- **FR-4706** Cada hallazgo trae:
  - id, regla y capa;
  - severidad `error`, `warning` o `note`, la misma escala de SARIF;
  - puntaje con sus componentes: 1,0 si es un hecho, o un peso fijo y documentado si es un indicio (un término vago
    vale 0,7);
  - evidencia: archivo, línea, id y fragmento original;
  - por qué es un problema, cómo refutarlo y su huella sha256.
- **FR-4707** Reproducibilidad:
  - la misma entrada, configuración y modelos dan el mismo sha256 del JSON;
  - cada reporte trae un bloque con la versión, el hash de la configuración, el id y el sha256 de cada modelo, la
    versión de ONNX Runtime, el hash de la entrada y los tiempos por capa;
  - cero llamadas de red al analizar.
- **FR-4708** Embeddings, opcionales (`--semantica`):
  - `multilingual-e5-small` int8 (118 MB);
  - para cada unidad, sus 5 vecinos con coseno de 0,86 o más;
  - el coseno solo propone candidatos, nunca decide.
- **FR-4709** NLI, opcional:
  - `mDeBERTa-v3-base-xnli-multilingual-nli-2mil7` int8 para español (339 MB) y `nli-deberta-v3-xsmall` int8 para
    inglés (87 MB);
  - solo sobre los candidatos de los embeddings, con los cinco recortes de costo de la 014 (3 vecinos, filtro léxico,
    un sentido primero, lotes por longitud y caché por huella del par);
  - la salida es una lista ordenada, no un veredicto.
- **FR-4710** Trazabilidad contra el repo, «posiblemente implementado»:
  - BM25 (MiniSearch) sobre código, pruebas, textos de la interfaz, specs y ADR anteriores;
  - puente de glosario de español a los nombres del código;
  - búsqueda literal de los IDs de la spec en las pruebas;
  - baja de peso para los archivos imán;
  - devuelve los tres archivos más probables con los términos y el puntaje de cada método.
- **FR-4711** Línea base: el equipo marca hallazgos como aceptados o descartados. Se guardan por huella en un archivo
  del repo analizado, y las corridas siguientes muestran solo lo nuevo.
- **FR-4712** Formas de entrega:
  - CLI `npx cotejo analizar spec.md --repo ../app --salida sarif` (alias `analyze`);
  - GitHub Action con SARIF;
  - skill de Claude Code que corre la CLI y lee el resumen;
  - servidor MCP local por stdio, con las herramientas `cotejo_analizar` y `cotejo_resumen`, de solo lectura sobre una
    carpeta raíz declarada.
- **FR-4713** Demo en el AI Lab (tarjeta A11, camino A, todo en el navegador):
  - una muestra de unas 600 líneas con defectos sembrados y su verdad;
  - capa determinista instantánea y sin descarga;
  - embeddings opcionales, que comparten la caché con A5;
  - NLI con consentimiento explícito, como los tamaños de Whisper;
  - caja de cristal que resalta líneas y desglosa el puntaje;
  - precisión y recall en vivo;
  - «posiblemente implementado» contra un índice BM25 del sitio, versionado con su fecha;
  - todo en un Worker, con movimiento reducido y teclado completo.
- **FR-4714** Corpus:
  - **sintético**: el generador de la 014 (Python, semilla fija), que se muda al repo de Cotejo y se corre con tres
    semillas;
  - **difícil**: escrito por personas, sin material de ninguna empresa, y reportado aparte;
  - **PURE** (Ferrari, Spagnolo y Gnesi, RE 2017), que se descarga al medir y no se versiona si su licencia no lo
    permite.
- **FR-4715** Métricas publicadas en el README del repo y en el caso de estudio:
  - precisión, recall y F1 por detector y por corpus;
  - tiempo por capa, RAM pico y MB descargados;
  - reproducibilidad;
  - tokens que se ahorra el agente.
- **FR-4716** Perfil `breve` para specs cortas generadas (la 046):
  - título, problema, incluye y no incluye;
  - requisitos `R-n`, criterios `C-n` que cubren requisitos y preguntas `Q-n` con valor por defecto;
  - reglas de cobertura entre `R` y `C`.
- **FR-4717** Caso de estudio en el sitio, con la forma de los casos:
  - el problema, en general y sin datos de ninguna empresa;
  - la decisión central: determinista primero, modelos pequeños solo sobre candidatos y ningún token de LLM en el
    camino crítico;
  - los números;
  - lo que no funcionó: el BM25 sin puente entre spec en español y código en inglés, y el NLI con contradicciones
    semánticas;
  - los enlaces al repo, a la demo y a la investigación.
- **FR-4718** CI de CHERCED-WORLD: un workflow nuevo corre Cotejo sobre las specs que cambian en cada PR y sube el
  SARIF. Es informativo y no bloquea (P-4712).
- **FR-4719** Reglas, mensajes y diccionarios en español y en inglés desde el primer día.
- **FR-4720** Seguridad de la CLI, la Action y el MCP:
  - solo leen;
  - nunca ejecutan nada del repo analizado;
  - rechazan rutas fuera de la carpeta raíz;
  - no mandan nada por red.

## Entidades clave

- **Unidad:** un requisito, criterio, historia o párrafo, con id estable y posición exacta.
- **Regla:** id, familia, severidad, peso, diccionario y mensajes ES y EN.
- **Hallazgo:** lo de FR-4706.
- **Reporte:** versión del esquema, bloque de reproducibilidad, hallazgos, conteos y tiempos.
- **Perfil:** `speckit`, `cherced` o `breve`; las secciones e IDs que espera.
- **Línea base:** huellas aceptadas o descartadas, con quién y cuándo.
- **Corpus:** documentos con defectos sembrados y su verdad.

## Criterios de éxito

Las metas vienen de la propuesta de la 014; la columna del spike, de su medición:

| ID | Detector | Meta en el sintético | Meta en el difícil o en PURE | Spike |
|---|---|---|---|---|
| SC-4701 | IDs repetidos, referencias rotas, duplicados exactos | P y R = 1,00 | — | 1,00 / 1,00 |
| SC-4702 | Acrónimos y términos vagos | P y R de 0,95 o más | P de 0,80 o más en PURE | 1,00 / 1,00 |
| SC-4703 | Contradicciones de valor y polaridad | P y R de 0,95 o más | P de 0,80 o más y R de 0,70 o más | 1,00 / 1,00 |
| SC-4704 | Casi duplicados (embeddings y NLI) | Precisión en los 50 primeros de 0,60 o más y R de 0,90 o más | Precisión en los 50 primeros de 0,40 o más | R = 0,95 con P de unos 0,08 |
| SC-4705 | Contradicciones semánticas (NLI) | R de 0,50 o más como candidatos ordenados | Se mide, sin meta | 1 de 10 |
| SC-4706 | Posiblemente implementado (20 requisitos del sitio) | 8 de 10 o más en los 5 primeros, con el puente que sale del glosario | — | 5/10 sin puente y 9/10 con un puente a mano |

- **SC-4707** Costo en una laptop de 4 núcleos para 10.000 líneas:
  - la capa determinista, en 1 s o menos;
  - todo, en 5 min o menos en frío y en 1 min o menos con caché;
  - 2 GB de RAM o menos.
- **SC-4708** Dos corridas seguidas dan el mismo sha256 del JSON, y una prueba que bloquea la red pasa durante el
  análisis.
- **SC-4709** En la demo, la capa determinista sobre la muestra de 600 líneas tarda 300 ms o menos en el Worker con el
  perfil móvil, sin bajar los fps del fondo (SC-205). Abrir la demo tiene un INP de 200 ms o menos.
- **SC-4710** El autor busca a mano los defectos sembrados de la muestra, cronometrado, con y sin Cotejo. Se publican
  la diferencia de tiempo y los defectos encontrados; no hay meta fija.
- **SC-4711** La prueba de contrato del núcleo pasa en el repo de Cotejo y en el del sitio con la misma versión.
- **SC-4712** El resumen compacto de una spec de 10.000 líneas mide menos del 5 % de sus tokens, contados con el mismo
  estimador en los dos lados.

## No incluye

- Decidir si un requisito es correcto, factible o necesario para el negocio: eso es juicio humano.
- Reescribir la spec sola.
- Un LLM en el camino crítico. El LLM local que redacta explicaciones queda fuera de esta versión y, cuando exista,
  vendrá apagado y fuera del hash de reproducibilidad.
- El modo diferencia contra la rama base. Sí entra la línea base.
- Símbolos de código con tree-sitter, y entrada desde Word o Confluence.
- Una interfaz web propia fuera del AI Lab.
- Mandar la spec pegada en la demo a un servidor.
- Material de cualquier empresa en los corpus.
- Publicar en npm sin la decisión del autor (P-4710).
- Gasto de API: el costo de modelos remotos es cero.

## Costo y topes

- **API de modelos:** 0 USD. No pesa en el tope mensual de la 041.
- **Descargas de la demo:**
  - capa determinista, 0 MB;
  - embeddings, 118 MB, compartidos con A5;
  - NLI, 339 MB en español u 87 MB en inglés, solo con consentimiento.
- **CI:** minutos de GitHub Actions, que son gratis en repos públicos.
- **Topes por visitante:** no aplican, porque nada corre en el servidor.

## Estación en la ruta de 10 minutos

- **Estación:** «Cotejo: la spec contra sí misma», archivo `content/ailab/cotejo/station.ts`. Prueba principal: 2.
  También prueba la 3 y la 4 (`alsoProves: [3, 4]`).
- **Tiempo:** 2 minutos.
- **Qué hace el entrevistador:**
  1. Carga la muestra.
  2. Abre una contradicción y un «posiblemente implementado».
  3. Mira la precisión y el recall en vivo.
  4. Descarga el SARIF.
- **Evidencia que se lleva al acta:**
  - los hallazgos por familia y el tiempo de la corrida;
  - la precisión y el recall contra la verdad;
  - el enlace al repo y al último run de la Action.

## Evals

No hay un modelo en el camino crítico, así que las evals de esta spec son las métricas de los corpus (FR-4714 y
FR-4715):
- corren en el CI del repo de Cotejo con el corpus sintético;
- el corpus difícil y PURE corren a mano y se reportan aparte;
- el tablero de la 045 muestra la última corrida.

## Supuestos

- El generador de corpus y el script de medición de la 014 sirven como punto de partida del repo de Cotejo. Son
  propios del autor y ya están en este repo.
- `@huggingface/transformers` (4.3.2, ya instalado en el sitio) carga los mismos modelos en Node y en el navegador.
- El sitio consume el paquete desde un tarball publicado como asset de un release de GitHub, con su hash en el lock.
  No hace falta cuenta de npm para empezar.
- El autor puede escribir, o conseguir de colegas, pares de requisitos de prueba sin material de ninguna empresa.

## Preguntas abiertas

Las nueve preguntas de la propuesta de la 014, con su valor por defecto, más tres nuevas:

| ID | Pregunta | Por defecto |
|---|---|---|
| P-4701 | ¿El nombre «Cotejo» va? | Sí |
| P-4702 | ¿Proyecto aparte y abierto? | Sí: `CHERCED-DEV/cotejo` con MIT (P-4106), y el sitio consume el paquete |
| P-4703 | ¿Las specs llegan en español, en inglés o mezcladas? | Las dos desde el primer día. El NLI por defecto lo elige el idioma de la spec |
| P-4704 | ¿Formato de entrada principal? | `spec.md` de Spec Kit y el estilo propio de este repo. EARS después |
| P-4705 | ¿Quién escribe el corpus difícil? | El autor, con 60 pares para empezar (no 200), reportados aparte. No los escribe el mismo agente que escribe las reglas |
| P-4706 | ¿El NLI de 339 MB se baja en la demo? | Sí, solo con consentimiento explícito |
| P-4707 | ¿«Posiblemente implementado» mira solo el código? | No: también las pruebas, los textos de la interfaz, las specs y los ADR anteriores |
| P-4708 | ¿Se empaqueta para agentes? | Sí: skill de Claude Code y servidor MCP local |
| P-4709 | ¿Prioridad? | Ola 2 de la línea 041, en paralelo con la 043 |
| P-4710 | ¿Se publica en npm? | Todavía no: tarball en los releases de GitHub. Si el autor quiere npm, crea la cuenta y se publica como paquete con alcance |
| P-4711 | ¿Se suma el caso de estudio a los casos del sitio? | Sí, como caso de 2026, cuando estén las métricas reales |
| P-4712 | ¿Cotejo bloquea PRs en CHERCED-WORLD? | No: solo informa con SARIF |
| P-4713 | ¿En qué tema del AI Lab va la tarjeta A11? | «Arquitectura» (`architecture`), junto al simulador de sagas |
| P-4714 | ¿Quién crea el repo público `CHERCED-DEV/cotejo`? | La línea, con la cuenta CHERCED-DEV, solo después del visto bueno explícito del autor, porque es una publicación |
