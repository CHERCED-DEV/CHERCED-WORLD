# Investigación 014: gestor de specs local

Investigación del 2026-11-12 para la [propuesta](./propuesta.md). Las fuentes se consultaron ese día. Cada afirmación
lleva una marca:

| Marca | Qué significa |
|---|---|
| **[V]** | Verificado: leí la fuente primaria (el texto completo o, en artículos, el resumen oficial) |
| **[S]** | Secundario: viene de un resumen, una reseña o una página de terceros; no leí la fuente primaria |
| **[M]** | Medido por mí en esta máquina el 2026-11-12, con el método de [medicion/](./medicion/) |
| **[O]** | Opinión o inferencia mía |

Las versiones de las herramientas salen de la API de GitHub (`releases/latest`) consultada el 2026-11-12 [V].

## Resumen

- **El problema ya tiene nombre en la industria.** El Thoughtworks Technology Radar del 2026-11-04 puso
  *AI-driven documentation sprawl* en **Caution**: los agentes y las herramientas de SDD generan Markdown largo,
  contradictorio y sin mantener, y esa documentación casi nunca pasa por quality gates ni CI [V]. Es justo lo que vio
  el autor.
- **Las herramientas de SDD ordenan el flujo, no controlan la calidad del documento.** Spec Kit, Kiro, Tessl, BMAD y
  OpenSpec estructuran el trabajo del agente. Sus revisiones (`/speckit.analyze`, `/speckit.checklist`) son prompts
  para el mismo LLM que escribió la spec [S]. Ninguna trae un verificador determinista ni compara la spec contra el
  código [O].
- **Los LLM comerciales no sirven solos como revisores de requisitos.** Un benchmark del 2026-09-03 (10 modelos de
  OpenAI y Anthropic, 100 corridas) encontró que el mejor detecta en la mediana solo el **47 %** de los defectos que
  marcan los expertos y marca en falso el **11 %**. Los de necesidad y corrección se escapan casi siempre [V].
- **La investigación da una receta por capas que corre en una laptop.** Reglas y diccionarios para la ambigüedad
  (QuARS, Smella, Paska), detección de clones para los duplicados (Juergens et al., ICSE 2010), NLI pequeño para las
  contradicciones (Fazelnia et al., RE 2024) y recuperación BM25 o con embeddings para la trazabilidad [V].
- **Lo determinista cubre casi todo, y en menos de un segundo.** En una laptop de 2020 y con una spec sintética de
  9.992 líneas, la capa sin modelo encontró duplicados, IDs repetidos, referencias rotas, términos vagos y las 39
  contradicciones de valor y polaridad con 0,23 s de CPU [M].
- **Los modelos pequeños solo sirven para proponer y ordenar**, y son la parte cara. Con la CPU compartida, el NLI
  multilingüe tardaría de una a dos horas en revisar todos los candidatos, y no detectó 9 de las 10 contradicciones
  semánticas [M] ([R-1405](#r-1405-qué-es-determinista-qué-necesita-modelo-y-cuánto-cuesta)).
- **El hueco de mercado es la combinación** [O]: local, determinista primero, a escala de 10.000 líneas, en español
  y contra el repositorio real. Las suites clásicas (DOORS, Jama, Polarion) son de pago, en la nube y pensadas para
  inglés. La IBM RQA, por ejemplo, no admite caracteres fuera de ASCII [S].

## R-1401 El problema descrito en términos generales

- Las specs crecen hasta más de 10.000 líneas porque el agente escribe más rápido de lo que el equipo revisa.
  Böckeler (Thoughtworks, en martinfowler.com, 2025-10-15) cuenta que Spec Kit le generó "muchos" archivos Markdown,
  repetitivos entre sí y con el código existente, y concluye que prefiere revisar código antes que esos archivos [V].
- **Requisitos que ya existen:** en esa misma prueba, el paso de investigación de Spec Kit describió clases que ya
  estaban en el código. Luego el agente tomó esas notas como especificación nueva y las volvió a generar, creando
  duplicados [V]. Es el caso "la spec pide lo que el producto ya tiene", documentado por una fuente externa.
- **Contradicciones y contexto podrido:** el Radar (2026-11-04) advierte que los agentes leen ADR y specs viejas o
  contradictorias, que consumen contexto y dan información poco confiable. Propone tratar el Markdown como artefacto
  de primera clase y podarlo de forma deliberada [V].
- **Revisión semántica:** el mismo Radar puso en **Assess** la *semantic review of AI-edited prose*, que usa un LLM
  para encontrar cambios de hechos, afirmaciones en conflicto y criterios de aceptación redefinidos entre versiones de
  un documento [V]. Valida la necesidad, pero la resuelve con un LLM [O].
- **Lo que se perdió al pasar a lenguaje natural:** Böckeler compara la spec-as-source con el MDD. Con una spec
  parseable, dice, se podía dar al autor mucho apoyo para escribir specs "válidas, completas y consistentes"; con el
  lenguaje natural del LLM ese apoyo se pierde [V]. Este proyecto recupera una parte de ese apoyo sin volver al
  DSL [O].

## R-1402 Herramientas de spec-driven development

### Qué hace cada una

| Herramienta | Quién y cuándo | Modelo de trabajo | Qué revisa de la spec | Fuente |
|---|---|---|---|---|
| **GitHub Spec Kit** | GitHub; anunciado el 2025-09-02 (Den Delimarsky). v1.4.0 del 2026-11-10 | `constitution` → `specify` → `plan` → `tasks` → `implement`, con `clarify`, `analyze` y `checklist` opcionales | `/speckit.analyze`: revisión de solo lectura de `spec.md`, `plan.md` y `tasks.md` contra la constitución. Busca deriva de terminología, duplicados, ambigüedad y requisitos sin tarea. Es un prompt al LLM | [S] skills comunitarios; [V] versión |
| **Kiro** | AWS; preview a mediados de 2025, GA el 2025-11-17 | `requirements.md` (historias y criterios en EARS) → `design.md` → `tasks.md`, con aprobación humana por fase. IDE derivado de Code OSS y CLI | La GA anunció *property-based testing* para la corrección de la spec | [S] |
| **Tessl** | Tessl; productos lanzados en septiembre de 2025 | Apunta a *spec-anchored* y explora *spec-as-source*: una spec por archivo de código, marcado "GENERATED FROM SPEC - DO NOT EDIT" | En 2026 el registro pasó a ser de *skills* versionados y evaluados | [V] Böckeler; [S] reseñas 2026 |
| **BMAD Method** | BMad Code; v6.12.4 del 2026-10-14 | Agentes con rol (PM, arquitecto, etc.) que producen brief, PRD y arquitectura antes del código | Depende de los agentes | [S]; [V] versión |
| **OpenSpec** | Fission-AI; v2.0.0 del 2026-11-11 | `propose` → `apply` → `archive`. Los cambios son deltas sobre una spec persistente | El Radar la pasó de Assess (2026-04-15) a **Trial** (2026-11-04) por funcionar bien en *brownfield* | [V] Radar |

### Qué resuelven y qué no

- **Resuelven** el orden del trabajo, el contexto que recibe el agente y la trazabilidad spec → tareas. Según el Radar
  (2026-04-15), los equipos que usaron Spec Kit en *brownfield* encontraron problemas antes con el ciclo
  spec → plan → tareas → código → revisión [V].
- **No resuelven** la calidad de la spec como documento [O]:
  - toda revisión pasa por el mismo modelo, que no es determinista: dos corridas dan resultados distintos y cada
    revisión de 10.000 líneas cuesta tokens;
  - no comparan la spec con el código, salvo que el agente lea el repo, y Böckeler mostró que aun así puede ignorar
    lo que encontró [V];
  - no hay un formato de spec estándar: Böckeler lo señala y nota que la definición de SDD "sigue en movimiento" [V].

### Críticas recientes al hype

- **Böckeler (martinfowler.com, 2025-10-15)** [V]:
  - distingue tres niveles: *spec-first*, *spec-anchored* y *spec-as-source*. Todas las herramientas son
    *spec-first*; Spec Kit crea una rama por spec, así que en la práctica no es *spec-anchored*;
  - con Kiro, un bug pequeño se convirtió en 4 historias de usuario con 16 criterios de aceptación: "un mazo para
    partir una nuez";
  - pregunta si dan una "falsa sensación de control": el agente ignora instrucciones o las sigue con demasiado celo;
  - compara con el MDD: el *spec-as-source* puede quedarse con lo peor de los dos mundos, inflexibilidad y no
    determinismo;
  - cierra con *Verschlimmbesserung*: empeorar algo al intentar mejorarlo.
- **Thoughtworks Radar** [V]:
  - Spec Kit en **Assess** (2026-04-15): *instruction bloat* hasta el *context rot*, chequeos defensivos innecesarios
    y Markdown tan verboso que sube la carga cognitiva. Saca más provecho quien ya tiene buenas prácticas de código
    limpio y arquitectura;
  - OpenSpec en **Trial** (2026-11-04): la cautela de siempre, porque los agentes generan Markdown "de forma
    prolífica";
  - *AI-driven documentation sprawl* en **Caution** (2026-11-04): ilusión de calidad, una "gran bola de lodo
    documental".
- **"Es cascada con otro nombre"**: el debate vive sobre todo en blogs y en Hacker News, sin estudios empíricos [S].
  - En contra del hype: una spec delgada deja huecos que el agente llena solo, y una detallada exige respuestas antes
    de que el equipo sepa lo suficiente [S].
  - A favor: Marc Brooker (2026-04-09) dice que el error es creer que la spec adelanta todo el diseño; la idea es
    subir el diseño a un ciclo iterativo donde lo que se revisa es la spec [S]. Un artículo de Scrum.org reconoce que
    sí se vuelve cascada si se busca una spec "a prueba de balas" desde el inicio [S].
- **Lectura propia** [O]: la crítica de fondo no es "specs sí o no", sino que una spec que nadie puede revisar no da
  control. Un verificador determinista y barato ataca justo eso: hace revisables las specs largas sin volver a
  pagarle al LLM por cada revisión.

## R-1403 Gestión de requisitos clásica y normas

### Herramientas

| Herramienta | Qué ofrece para la calidad del requisito | Límites relevantes | Fuente |
|---|---|---|---|
| **IBM DOORS Next + RQA** | Requirements Quality Assistant: NLP de Watson con indicadores alineados con INCOSE; un socio habla de 11 puntajes que cubren más del 80 % de la guía | No revisa requisitos de más de 1.000 caracteres. **No admite caracteres fuera de ASCII**, así que el español con tildes queda fuera. Un socio dice que el SaaS de IBM se descontinuó | [S] docs de IBM y socios |
| **Jama Connect Advisor** | Puntúa requisitos contra las reglas de INCOSE y los patrones EARS, uno por uno o en lote | Complemento de Jama Connect Cloud. El algoritmo no es público y no hay benchmarks independientes | [S] material del fabricante |
| **Polarion (Siemens)** | Trazabilidad requisito → work item → prueba. La calidad del texto llega con integraciones como QVscribe | Enterprise, sin plan gratis | [S] |
| **QVscribe (QRA)** | Chequeos de claridad y ambigüedad: palabras vagas, voz pasiva, pronombres, plantillas EARS y glosario propio. Automatiza 24 de las 44 reglas de INCOSE que evaluó un artículo de NLP4RE; el resto exige juicio humano | De pago | [S] |
| **ReqView** | Herramienta liviana, con requisitos en un formato abierto que se puede versionar en Git | Sin análisis de calidad del texto comparable | [S] |

**Patrón común** [O]: la industria de requisitos lleva más de 20 años resolviendo la calidad del texto con reglas y
diccionarios, no con modelos generativos. Son herramientas de pago, en la nube, en inglés y para equipos de sistemas
regulados. Ninguna recupera trazas contra el código por similitud: los enlaces se mantienen a mano.

### ISO/IEC/IEEE 29148:2018

La norma *Systems and software engineering — Life cycle processes — Requirements engineering* (2.ª edición, 2018,
confirmada en 2024) ordena la calidad en cuatro cláusulas [V, por la tabla de contenido de la muestra oficial]:

- **5.2.5** características de un requisito individual;
- **5.2.6** características de un conjunto de requisitos;
- **5.2.7** criterios de lenguaje;
- **5.2.8** atributos del requisito.

El texto completo es de pago. Las listas que siguen salen de mi conocimiento de la norma y las contrasté con resúmenes
secundarios [S]:

- **Requisito individual (5.2.5):** necesario, apropiado, inequívoco, completo, singular, factible, verificable,
  correcto y conforme.
- **Conjunto (5.2.6):** completo, consistente, factible, comprensible y validable.
- **Lenguaje (5.2.7):** evitar superlativos, lenguaje subjetivo, pronombres vagos, adverbios y adjetivos ambiguos,
  términos abiertos no verificables ("pero no limitado a", "como mínimo"), comparativos, escapatorias ("si es
  posible", "según corresponda") y afirmaciones en negativo.

**INCOSE Guide to Writing Requirements v4** (julio de 2023) baja la norma a reglas concretas: entre 40 y 42 reglas
según la fuente, y 15 características (C1 a C15) [S]. **EARS** (Mavin et al., Rolls-Royce, RE'09) da cinco patrones con
palabra clave (ubicuo, `WHEN`, `WHILE`, `IF … THEN`, `WHERE`). Kiro lo usa para los criterios de aceptación [S].

### Qué característica se puede automatizar y con qué [O]

| Característica (29148) | Determinista | Modelo local pequeño | Juicio humano |
|---|---|---|---|
| Singular (una sola cosa por requisito) | Conjunciones y varios verbos modales por oración | — | — |
| Inequívoco | Diccionario de vagos y escapatorias, pronombres sin antecedente | Ambigüedad sutil (Paska usa reglas; los LLM suben el recall pero bajan la precisión) | Sí, al cerrar |
| Verificable | Números sin unidad, comparativos sin referencia | — | — |
| Conforme | Plantilla (EARS, `DEBE`), estructura, IDs | — | — |
| Completo (conjunto) | Referencias e IDs rotos, glosario, TBD/TODO | — | Sí |
| Consistente (conjunto) | Duplicados exactos, mismo atributo con números distintos, polaridad opuesta | Casi duplicados (embeddings), contradicciones semánticas (NLI) | Sí, siempre |
| Necesario | — | "Ya existe en el código" (recuperación) | **Sí**: el benchmark de 2026 muestra que ni los LLM grandes lo detectan |
| Correcto, factible, apropiado | — | — | **Sí** |

## R-1404 Investigación en NLP para requisitos (NLP4RE)

### Smells y ambigüedad

- **QuARS** (CNR-ISTI, Fabbrini, Fusani, Gnesi y Lami, desde 2001): análisis léxico y sintáctico guiado por
  diccionarios (vaguedad, subjetividad, opcionalidad) que marca la oración y la palabra que revela el defecto.
  Deja fuera la pragmática, que depende del lector [S].
- **Smella** (Femmer et al., JSS 2017; arXiv 1611.08847): smells derivados de los criterios de lenguaje de la 29148.
  Probado en tres contextos industriales y uno universitario, con **59 % de precisión y 82 % de recall** promedio y
  mucha variación. Útil como complemento de la revisión, no como reemplazo [V].
- **Paska** (Veizaga, Shin y Briand, IEEE TSE 2024; arXiv 2305.07097): NLP clásico (lematización, POS, parsing de
  constituyentes, glosario y Tregex) más el lenguaje controlado Rimay. Probado en **2.725 requisitos de 13 sistemas
  del dominio financiero**, con **89 % de precisión y de recall** en la detección (versión v1 del preprint) [S].
  Es la mejor evidencia de que las reglas bien hechas alcanzan alta precisión sin LLM [O].
- **ChatGPT contra QuARS** (Fantechi, Gnesi y Semini, NLP4RE 2023): estudio preliminar en cuatro documentos. ChatGPT
  responde distinto cada vez que se le repite la pregunta [S].
- **LLM con contexto de proyecto** (Poulsen et al., *Proceedings of the Design Society*, 2026): 246 requisitos del
  telescopio James Webb, cada uno con una variante con ambigüedad inducida. Sin contexto, el LLM da muchos falsos
  positivos en requisitos bien escritos; con contexto, menos [S].
- **Benchmark de LLM comerciales** (Shefa, Salado, Wach y Topcu, arXiv 2609.03230, 2026-09-03): 10 modelos, dos
  familias y cinco generaciones cada una, 100 corridas, dos conjuntos de requisitos y cinco temperaturas, contra una
  verdad experta basada en INCOSE [V]:
  - el mejor detecta el **47 %** de los defectos (mediana) y marca en falso el **11 %**;
  - casi nunca ve los de necesidad y corrección;
  - un modelo más nuevo no garantiza ser mejor;
  - la temperatura casi no cambia los errores, así que son deficiencias del modelo y no ruido;
  - concluye que hoy sirven como apoyo con humano en el ciclo, no como evaluadores autónomos.
- **Teoría** (Frattini et al., *Requirements Engineering* 28, 2023): la investigación en calidad de requisitos es
  sobre todo normativa y casi no conecta una regla con su impacto en el desarrollo [V, resumen]. Para el proyecto:
  medir qué hallazgos acepta el equipo, no solo cuántas reglas saltan [O].

### Duplicados

- **Juergens et al.** (ICSE 2010, "Can clone detection support quality assessments of requirements
  specifications?"): aplicaron detección de clones de código a **28 especificaciones industriales con 8.667 páginas**.
  Encontraron redundancia real de copiar y pegar y evaluaron qué tanto sirven los detectores de clones existentes [V].
  Los duplicados exactos y casi exactos se resuelven con hashing y n-gramas, sin modelo [O].
- **SR-BERT** (Malik et al., arXiv 2301.03709): duplicados y conflictos como clasificación de pares, con un bi-encoder
  Sentence-BERT que abarata la comparación de todos contra todos [S].

### Contradicciones

- **NLI en requisitos** (Fazelnia, Koscinski, Herzog y Mirakhorli, RE 2024; arXiv 2405.05135): un requisito como
  premisa y el otro como hipótesis. El NLI supera a métodos clásicos, a modelos con prompts, a LLM tipo chatbot y a
  modelos probabilísticos en clasificación, defectos y conflictos. En conflictos rinde menos que en las otras dos
  tareas [V].
- **ALICE** (Gärtner y Göhlich, *Automated Software Engineering*, 2024): árbol de decisión de siete preguntas, lógica
  formal y prompts a GPT. Supera al LLM solo; una página secundaria habla de 60 % de las contradicciones detectadas
  (sin verificar) [S].
- **S3CDA** (Malik y Cevik, arXiv 2206.13690): coseno entre embeddings para proponer candidatos y luego cruce de
  entidades del dominio. Es la misma idea de "embeddings para filtrar y algo más preciso para decidir" [S].

### Trazabilidad requisito → código

- **IR clásico** (Oliveto, Gethers, Poshyvanyk y De Lucia, ICPC 2010): VSM, LSI y Jensen-Shannon resultan casi
  equivalentes; LDA rinde menos, pero captura algo que los otros no [S]. Otros estudios no muestran un ganador entre
  BM25, VSM y LSI: depende del conjunto de datos [S].
- **LiSSA** (Fuchß, Hey, Keim et al., ICSE 2025): RAG con LLM, primero recupera candidatos y luego el LLM clasifica.
  Supera al estado del arte en tareas con código, pero los autores dicen que aún falta para usarlo en la práctica [S].
- **R2Code** (Wang et al., COMPSAC 2026; arXiv 2604.22432): LLM con recuperación adaptativa. +7,4 % de F1 y hasta
  41,7 % menos tokens que la línea base [V].
- **Lectura propia** [O]: el estado del arte con LLM siempre empieza por recuperar. La recuperación local (BM25 más
  embeddings) es la parte barata y explicable; la clasificación con LLM es opcional y se puede dejar para pocos
  candidatos.

## R-1405 Qué es determinista, qué necesita modelo y cuánto cuesta

Lo medí el 2026-11-12 [M]:

- **Máquina**: una laptop de 2020 con Intel Core i5-10300H (4 núcleos, 8 hilos) y 32 GB, solo CPU.
- **Corpus**: una spec sintética en español de 9.992 líneas, con 2.177 requisitos y 226 defectos sembrados.
- **Librerías**: las mismas del sitio (Transformers.js 4.3.2 y MiniSearch 7.2.0).
- **Dos advertencias**:
  - la CPU estuvo al 100 % por otra sesión que corría la suite e2e, así que los tiempos de reloj son una cota
    pesimista;
  - escribí el corpus y los detectores, así que la precisión de C1 es optimista.

El detalle y cómo reproducirlo están en [medicion/README.md](./medicion/README.md).

| Tarea | Cómo | ¿Modelo? | Costo medido para ~10.000 líneas | Precisión / recall en el corpus sintético |
|---|---|---|---|---|
| Estructura, IDs y referencias rotas | Parser y conjuntos | No | Todo C1 junto: **0,23 s de CPU y 86 MB** | 1,00 / 1,00 |
| Duplicados exactos | Hash del texto normalizado | No | (en C1) | 1,00 / 1,00 |
| Términos vagos y acrónimos sin definir | Diccionarios con límites Unicode | No | (en C1) | 1,00 / 1,00 |
| Contradicción numérica y de polaridad | Agrupar por la frase con el número o la negación enmascarados | No | (en C1) | 1,00 / 1,00 (39 de 39) |
| Candidatos a casi duplicado | Embeddings `e5-small` y k vecinos | Sí, 118 MB | 158 s de CPU para los 2.177 embeddings y 9 s para comparar 2,37 M de pares | El coseno no separa: P = 0,005. Como filtro deja pasar el 97,5 % |
| Decidir casi duplicado o contradicción semántica | NLI en los dos sentidos | Sí, 87 a 339 MB | 0,15 a 1,03 s por par; de 1 a 2 horas para los 7.603 candidatos con `mDeBERTa` y la CPU saturada | Paráfrasis: R = 0,95 con P ≈ 0,08, o P = 1,00 con R = 0,20. Contradicciones (C1 + NLI ≥ 0,9): P ≈ 1,00 y R = 0,82. Semánticas: 1 de 10 |
| "Ya existe" en el código | BM25 sobre 627 archivos | No | Índice en 0,5 s de CPU y consultas en ms | 5/10 en el top 5; 9/10 con un puente de glosario es→en |
| "Ya existe" con embeddings | `e5-small` por fragmentos de 40 líneas | Sí | **42 min** de reloj para 1.902 fragmentos | 3/10: no ayuda |

**Conclusiones** [O, sobre la medición]:

1. Lo que más le duele al autor (contradicciones de valores, polaridad, duplicados y referencias) se resuelve **sin
   modelo y en menos de un segundo**.
2. Los modelos pequeños sirven para **proponer y ordenar** candidatos, no para dictaminar. Su costo está en el NLI y en
   indexar el repo, y ahí hay que recortar: menos candidatos, un solo sentido, lotes por longitud, caché por par y
   análisis por diferencia en CI.
3. Las contradicciones semánticas en español siguen siendo de revisión humana. Un NLI de 279 M no las ve, y el
   benchmark de 2026 muestra que los LLM grandes tampoco detectan bien lo que exige juicio.
4. Para "ya existe", la palanca no es un modelo más grande, sino el **puente de vocabulario** entre la spec en español
   y los identificadores en inglés, y bajar el peso de los archivos "imán".

## R-1406 Opciones locales

| Pieza | Versión (2026-11-12) | Para qué sirve aquí | Notas |
|---|---|---|---|
| **ONNX Runtime** | v1.31.1 (2026-10-26) | Corre embeddings y NLI en CPU, en WASM en el navegador y con WebGPU | Modelos `int8` |
| **Transformers.js** | 4.3.2 (2026-10-28) | El mismo código corre en Node y en el navegador. La v4 reescribió el backend de WebGPU en C++ con el equipo de ONNX Runtime | El sitio ya lo usa en el AI Lab [V] |
| **llama.cpp** | v0.9.0 (2026-11-04) | LLM local en GGUF, solo si se quiere explicar o reescribir un hallazgo | Convierte un JSON Schema en gramática GBNF y restringe la salida [S] |
| **Ollama** | v0.40.16 (2026-11-09) | Interfaz simple sobre llama.cpp | Su `format` acepta JSON Schema [S] |
| **ripgrep** | 15.2.0 (2026-07-15) | Búsqueda literal de IDs, rutas y nombres en el repo | Rápido y determinista |
| **tree-sitter** | v0.27.2 (2026-11-07) | Extraer símbolos (rutas, componentes, funciones) para indexar el código por unidades | Tiene binding WASM para el navegador |
| **MiniSearch** | 7.2.0 | BM25 en JavaScript | El sitio ya lo usa en el buscador [V] |
| **Vale** | — | Linter de prosa con reglas en YAML (MIT) | Su formato de reglas sirve de modelo para los diccionarios [S] |
| **lychee** | v0.24.2 (2026-05-01) | Verificar enlaces externos de la spec | Opcional |

**Modelos pequeños candidatos:**

| Modelo | Tamaño | Idiomas | Para qué | Fuente |
|---|---|---|---|---|
| `multilingual-e5-small` | 118 MB en `int8` (ONNX) | ~100, incluido español | Casi duplicados y trazas. Ya está en el catálogo del AI Lab | [V] HF y catálogo del sitio |
| EmbeddingGemma | 308 M parámetros; menos de 200 MB de RAM con QAT; 2K tokens; dimensiones de 768 a 128 | Más de 100 | Alternativa más precisa | [S] Google, 2025-09-04 |
| Qwen3-Embedding-0.6B | 0,6 B; 32K de contexto; MMTEB 64,33 | Multilingüe | Trazas contra código (contexto largo) | [S] arXiv 2506.05176, junio de 2025 |
| `nli-deberta-v3-xsmall` | 87 MB en `int8`; 22 M en el backbone y 48 M en los embeddings | Inglés | NLI muy barato para specs en inglés. 91,64 % en SNLI y 87,77 % en MNLI-mm | [S] tarjeta del modelo |
| `mDeBERTa-v3-base-xnli-multilingual-nli-2mil7` | 279 M; 339 MB en `int8` | Unos 100, incluido español | NLI para specs en español. Su autor lo marca "viejo" | [S] tarjeta y colección |
| Qwen3-Reranker-0.6B | 0,6 B | Multilingüe | Reordenar candidatos de traza | [S] |

**Determinismo** [O]:

- Las reglas, el BM25 y el hashing son deterministas por construcción.
- Un modelo ONNX en CPU con los mismos pesos, el mismo hilo y la misma máquina da los mismos números. Entre CPU
  distintas puede variar en el último decimal, así que el reporte redondea los puntajes y fija los umbrales.
- Un LLM local con temperatura 0 y semilla fija se acerca al determinismo, pero no lo garantiza: el *batching* y el
  orden de las operaciones de punto flotante cambian el resultado. Un artículo de ingeniería de enero de 2026 lo
  documenta comparando dos motores [S]. Por eso el LLM queda fuera del camino crítico.

## R-1407 Hueco y posicionamiento

- **Lo que ya existe** [O]:
  - prototipos de investigación sólidos (Smella, Paska, LiSSA) que no están empaquetados para el Markdown de SDD;
  - suites de requisitos de pago, en la nube y en inglés;
  - herramientas de SDD que delegan la revisión al LLM.
- **Lo que falta** [O]: un verificador local, reproducible y explicable que entienda las specs de Spec Kit, Kiro y
  OpenSpec, funcione en español y cruce la spec con el repo.
- **Riesgo de que el hueco se cierre** [O]: los agentes podrían traer un `/analyze` mejor. Aun así, ese seguiría
  siendo un LLM. El Radar recomienda revisar cada tanto si todavía hace falta herramienta de SDD aparte de las
  capacidades nativas de los agentes [V]. La diferencia que se sostiene es la determinista, que no gasta tokens.

## Fuentes

Consultadas el 2026-11-12. Fecha de publicación entre paréntesis.

**SDD y críticas**

- Birgitta Böckeler, ["Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl"](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html), martinfowler.com (2025-10-15) [V]
- Thoughtworks Technology Radar, [GitHub Spec Kit](https://www.thoughtworks.com/radar/languages-and-frameworks/github-spec-kit), Assess (2026-04-15) [V]
- Thoughtworks Technology Radar, [OpenSpec](https://www.thoughtworks.com/radar/tools/openspec), Trial (2026-11-04) [V]
- Thoughtworks Technology Radar, [AI-driven documentation sprawl](https://www.thoughtworks.com/radar/techniques/ai-driven-documentation-sprawl), Caution (2026-11-04) [V]
- Thoughtworks Technology Radar, [Semantic review of AI-edited prose](https://www.thoughtworks.com/radar/techniques/semantic-review-of-ai-edited-prose), Assess (2026-11-04) [V]
- Thoughtworks Technology Radar, [Spec-driven development](https://www.thoughtworks.com/radar/techniques/spec-driven-development), Assess (2025-11) [S: no cargó]
- Den Delimarsky, ["Spec-driven development with AI: Get started with a new open source toolkit"](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/), GitHub Blog (2025-09-02) [S]
- [github/spec-kit](https://github.com/github/spec-kit), v1.4.0 (2026-11-10) [V]
- Kiro, ["Kiro is generally available"](https://kiro.dev/blog/general-availability/) (2025-11-17, según [SiliconANGLE](https://siliconangle.com/2025/11/17/aws-launches-kiro-general-availability-team-features-cli-support/)) [S]
- Tessl, ["Tessl launches spec-driven framework and registry"](https://tessl.io/blog/tessl-launches-spec-driven-framework-and-registry/) (2025-09) [S]; [reseña "The Spec-as-Source Bet"](https://codemyspec.com/blog/tessl-review) (2026-06) [S]
- [bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD), v6.12.4 (2026-10-14) [V]
- [Fission-AI/OpenSpec](https://github.com/Fission-AI/OpenSpec), v2.0.0 (2026-11-11) [V]
- Marc Brooker, ["Waterfall vs spec"](https://brooker.co.za/blog/2026/04/09/waterfall-vs-spec) (2026-04-09) [S: no cargó]
- Scrum.org, ["Spec-driven development isn't waterfall unless you're using it that way"](https://www.scrum.org/resources/blog/spec-driven-development-isnt-waterfall-unless-youre-using-it-way) [S]

**Gestión de requisitos y normas**

- ISO/IEC/IEEE 29148:2018, [muestra oficial con la tabla de contenido](https://cdn.standards.iteh.ai/samples/72089/62bb2ea1ef8b4f33a80d984f826267c1/ISO-IEC-IEEE-29148-2018.pdf) y [ficha ISO](https://www.iso.org/standard/72089.html) [V]
- INCOSE, [Guide to Writing Requirements v4, hoja resumen](https://www.incose.org/docs/default-source/working-groups/requirements-wg/guidetowritingrequirements/incose_rwg_gtwr_v4_summary_sheet.pdf) (2023-06/07) [S: la descarga dio 403]
- IBM, [RQA: arquitectura](https://www.ibm.com/docs/SS3UPN/com.ibm.help.rm.assist.doc/topics/c_rqa_architecture.html) y [uso en DOORS Next](https://www.ibm.com/support/knowledgecenter/SS3UPN/com.ibm.help.rm.assist.doc/topics/t_running_rqa.html?view=kc) [S]; [REQUISIS, reemplazo del SaaS](https://requisis.com/en/saas-doors-dng/rqa-saas.html) [S]
- Jama Software, [Jama Connect Advisor](https://www.jamasoftware.com/platform/jama-connect/jama-connect-advisor/) y [blog del 2025-03-20](https://www.jamasoftware.com/blog/2025/03/20/utilize-artificial-intelligence-and-natural-language-processing-to-produce-high-quality-requirements-with-jama-connect-advisor/) [S]
- QRA, [QVscribe](https://qracorp.com/qvscribe/) [S]; [artículo NLP4RE con la cobertura de INCOSE](https://ceur-ws.org/Vol-2584/NLP4RE-paper3.pdf) [S]
- [Comparación Polarion y ReqView en TrustRadius](https://www.trustradius.com/compare-products/polarion-alm-vs-reqview) [S]
- [EARS en Wikipedia](https://en.wikipedia.org/wiki/Easy_Approach_to_Requirements_Syntax) y [guía de Alistair Mavin](https://alistairmavin.com/ears/) [S]

**NLP4RE**

- H. Femmer et al., ["Rapid quality assurance with Requirements Smells"](https://arxiv.org/abs/1611.08847), JSS (preprint 2016-11-27) [V]
- A. Veizaga, S. Y. Shin, L. Briand, ["Automated Smell Detection and Recommendation in Natural Language Requirements"](https://arxiv.org/abs/2305.07097), IEEE TSE 50(4) (2024) [S]
- A. Fantechi, S. Gnesi, L. Semini, ["Rule-based NLP vs ChatGPT in Ambiguity Detection, a Preliminary Study"](https://iris.cnr.it/retrieve/7238ae6b-6489-4874-8e75-02505f5983e1/prod_482040-doc_198323.pdf), NLP4RE @ REFSQ (2023-04) [S]
- QuARS, [ERCIM News 58](https://ercim.eu/publication/Ercim_News/enw58/lami.html) [S]
- J. Shefa, A. Salado, P. Wach, T. G. Topcu, ["Two Truths and A Lie? Benchmarking Off-the-Shelf LLMs for Requirements Quality Assessment"](https://arxiv.org/abs/2609.03230), arXiv (2026-09-03) [V]
- Poulsen et al., ["Context-aware large language models for ambiguity detection in requirements"](https://www.cambridge.org/core/services/aop-cambridge-core/content/view/E3685BED3A8F7EC801E42CA699D392A7), Proceedings of the Design Society (2026) [S]
- Bashir, Ferrari et al., ["Requirements Ambiguity Detection and Explanation with LLMs: An Industrial Study"](https://conf.researchr.org/details/icsme-2025/icsme-2025-industry-track/8/Requirements-Ambiguity-Detection-and-Explanation-with-LLMs-An-Industrial-Study), ICSME (2025) [S]
- J. Frattini et al., ["Requirements quality research: a harmonized theory, evaluation, and roadmap"](https://arxiv.org/abs/2309.10355), Requirements Engineering 28 (2023) [V, resumen]
- E. Juergens et al., ["Can clone detection support quality assessments of requirements specifications?"](https://arxiv.org/abs/1711.05472), ICSE (2010) [V]
- G. Malik et al., ["Transfer learning for conflict and duplicate detection in software requirement pairs"](https://arxiv.org/abs/2301.03709) (2023) [S]
- G. Malik, M. Cevik et al., [S3CDA](https://arxiv.org/abs/2206.13690) (2022) [S]
- M. Fazelnia, V. Koscinski, S. Herzog, M. Mirakhorli, ["Lessons from the Use of Natural Language Inference (NLI) in Requirements Engineering Tasks"](https://arxiv.org/abs/2405.05135), RE (2024) [V]
- A. Gärtner, D. Göhlich, ["Automated requirement contradiction detection through formal logic and LLMs"](https://link.springer.com/article/10.1007/s10515-024-00452-x), Automated Software Engineering (2024) [S]
- R. Oliveto, M. Gethers, D. Poshyvanyk, A. De Lucia, ["On the equivalence of information retrieval methods for automated traceability link recovery"](https://www.cs.wm.edu/~denys/pubs/ICPC10-traceability.pdf), ICPC (2010) [S]
- T. Merten et al., ["Do Information Retrieval Algorithms for Automated Traceability Perform Effectively on Issue Tracking System Data?"](https://se.ifi.uni-heidelberg.de/fileadmin/pdf/publications/2016_Merten_Kraemer_Mager_Schell_Buersner_Paech_Do.pdf), REFSQ (2016) [S]
- D. Fuchß, T. Hey, J. Keim et al., ["LiSSA: Toward Generic Traceability Link Recovery through Retrieval-Augmented Generation"](https://fuchss.org/conferences/icse25/), ICSE (2025) [S]
- Y. Wang et al., ["R2Code: A Self-Reflective LLM Framework for Requirements-to-Code Traceability"](https://arxiv.org/abs/2604.22432), COMPSAC (2026) [V]

**Ejecución local y modelos**

- [huggingface/transformers.js](https://github.com/huggingface/transformers.js/releases), 4.3.2 (2026-10-28) [V]; [Transformers.js v4](https://huggingface.co/blog/transformersjs-v4) [S]
- [microsoft/onnxruntime](https://github.com/microsoft/onnxruntime), v1.31.1 (2026-10-26) [V]
- [ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp), v0.9.0 (2026-11-04) [V]; [gramáticas y JSON Schema](https://www.mintlify.com/ggml-org/llama.cpp/advanced/grammars) [S]
- [ollama/ollama](https://github.com/ollama/ollama), v0.40.16 (2026-11-09) [V]
- Visokio, ["Engineering for determinism: a tale of two local LLM inference engines"](https://visokio.com/2026/01/26/engineering-for-determinism-a-tale-of-two-local-llm-inference-engines/) (2026-01-26) [S]
- [BurntSushi/ripgrep](https://github.com/BurntSushi/ripgrep), 15.2.0 (2026-07-15) [V]; [tree-sitter](https://github.com/tree-sitter/tree-sitter), v0.27.2 (2026-11-07) [V]; [lychee](https://github.com/lycheeverse/lychee), v0.24.2 (2026-05-01) [V]
- [Vale](https://vale.sh/) [S]
- Google, ["Introducing EmbeddingGemma"](https://developers.googleblog.com/en/introducing-embeddinggemma/) (2025-09-04) [S]
- Qwen, ["Qwen3 Embedding"](https://arxiv.org/abs/2506.05176) (2025-06) [S]
- Modelos en Hugging Face (tamaños leídos de la API de archivos el 2026-11-12) [V]: [Xenova/multilingual-e5-small](https://huggingface.co/Xenova/multilingual-e5-small), [Xenova/nli-deberta-v3-xsmall](https://huggingface.co/Xenova/nli-deberta-v3-xsmall), [MoritzLaurer/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7](https://huggingface.co/MoritzLaurer/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7); tarjeta de [cross-encoder/nli-deberta-v3-xsmall](https://huggingface.co/cross-encoder/nli-deberta-v3-xsmall) [S]
