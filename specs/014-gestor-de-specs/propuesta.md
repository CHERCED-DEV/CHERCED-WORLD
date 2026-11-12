# Propuesta 014: Cotejo, un gestor de specs que corre en local

**Estado**: propuesta del 2026-11-12, para que el autor decida. Se apoya en la [investigación](./investigacion.md) y
en una medición hecha en esta máquina ([medicion/](./medicion/)). No toca el código del sitio.

**Nombre provisional**: *Cotejo*, de "cotejar": confrontar un documento con otro (la spec consigo misma y la spec con
el código). Es un nombre de trabajo; el autor decide.

> "Es mejor tener algo en local que funcione muy bien y no algo que consuma demasiados tokens." — el autor

## 1. El problema y para quién es

**El problema.** Llegan specs de más de 10.000 líneas, muchas escritas o ampliadas por agentes, y nadie alcanza a
revisarlas antes de implementar. Traen cinco fallas que se repiten:

1. **Contradicciones internas**: la sesión expira a los 15 minutos en un lado y a los 30 en otro, o algo "DEBE"
   permitirse aquí y "NO DEBE" allá.
2. **Requisitos que el producto ya tiene**: la spec pide como nuevo algo que está en el código hace tiempo.
3. **Duplicados**: copias exactas y paráfrasis de lo mismo con otro ID.
4. **Ambigüedad**: "rápido", "fácil de usar", "si es posible", "según corresponda".
5. **Referencias rotas**: IDs que no existen, anclas muertas, acrónimos y términos sin definir.

La industria lo confirma. El Thoughtworks Radar del 2026-11-04 puso *AI-driven documentation sprawl* en Caution: specs
verbosas, contradictorias y sin quality gate. Y un benchmark del 2026-09-03 mostró que el mejor LLM comercial solo
detecta el 47 % de los defectos que marcan los expertos (investigación, R-1401 y R-1404).

**Para quién.**

| Quién | Qué necesita | Cómo lo usa |
|---|---|---|
| Líder técnico o arquitecto que recibe la spec | Saber qué contradice qué y qué ya existe antes de estimar | CLI sobre la spec y el repo; lee el reporte |
| QA | Requisitos verificables y sin duplicados para derivar casos de prueba | Reporte de lenguaje y de números sin unidad |
| Quien escribe la spec (producto o un agente) | Corregir antes de entregar | Ciclo corto: corre, corrige, vuelve a correr |
| Equipo que usa Spec Kit, Kiro u OpenSpec | Un gate barato en CI antes de `implement` | GitHub Action con SARIF; anotaciones en el PR |
| El agente de código | Contexto corto y confiable | Lee el reporte (KB) en lugar de la spec completa (cientos de KB) |

**Lo que no es.** No decide si un requisito es correcto, factible o necesario para el negocio: eso es juicio humano, y
la investigación muestra que tampoco lo logran los LLM grandes. No reescribe la spec sola. No reemplaza la revisión:
la ordena y la abarata.

## 2. Principios

1. **Local**: nada sale de la máquina al analizar. Los modelos se descargan una vez y se fijan con su hash.
2. **Reproducible**: la misma entrada, la misma configuración y los mismos modelos dan el mismo reporte, byte por
   byte en la misma máquina. Los puntajes se redondean a tres decimales y los umbrales son fijos.
3. **Determinista primero**: un modelo entra solo donde una regla no alcanza, y solo sobre candidatos ya filtrados.
4. **Explicable**: cada hallazgo trae la regla, la evidencia (archivo, línea y fragmento), el puntaje desglosado y
   cómo refutarlo.
5. **Cero tokens de LLM en el camino crítico**. Un LLM local opcional puede redactar una explicación, pero nunca
   decide ni cambia la severidad.
6. **Español e inglés** desde el primer día.

## 3. Arquitectura por capas

```text
spec.md / carpeta de specs ──► C0 Ingesta ──► C1 Determinista ──────────────────► Reporte
                                   │              │  estructura, IDs, refs, glosario,  (JSON, SARIF,
                                   │              │  lenguaje, duplicados exactos y     Markdown)
                                   │              │  contradicciones de valor y              ▲
                                   │              │  polaridad (frase enmascarada)           │
                                   │              ▼                                          │
                                   │         C2 Embeddings locales: proponen candidatos      │
                                   │              │ (k vecinos; el coseno no decide)         │
                                   │              ▼                                          │
                                   │         C3 NLI pequeño: ordena casi duplicados y ───────┤
                                   │         contradicciones semánticas (opcional, caro)     │
                                   ▼                                                         │
repo de código ──► índice (git ls-files, rutas, textos i18n) ──► C4 Trazabilidad ────────────┘
                   BM25 + puente de glosario es→en               ("posiblemente implementado")
                                                  C5 LLM local opcional: solo redacta
```

### C0. Ingesta y normalización

- Lee Markdown y reconoce las plantillas de Spec Kit (`spec.md`, `plan.md`, `tasks.md`), Kiro (`requirements.md` con
  EARS) y OpenSpec. Otras fuentes (Word, Confluence) entran convertidas a Markdown con pandoc.
- Parte el documento en **unidades** con ID estable y posición exacta: requisito, criterio de aceptación, historia y
  párrafo.
- Normaliza (NFKC, minúsculas y sin tildes) solo para comparar. La evidencia siempre muestra el texto original.

### C1. Capa determinista (sin modelo, en milisegundos)

| Familia | Reglas | Base |
|---|---|---|
| Estructura | Secciones obligatorias por plantilla, secciones vacías, jerarquía de títulos, marcadores `[NEEDS CLARIFICATION]`, `TBD` y `TODO` pendientes | Plantilla de Spec Kit |
| IDs | Formato, IDs repetidos, requisitos sin criterio de aceptación o sin tarea | 29148 §5.2.6 (completo) |
| Referencias | IDs inexistentes, anclas rotas, enlaces a archivos que no existen; enlaces externos con lychee, opcional | — |
| Glosario | Acrónimos sin definir, términos definidos y no usados, variantes del mismo término | 29148 §5.2.6 (comprensible) |
| Números y unidades | Cantidades con unidad normalizada (ms, s, min; MB, MiB), números sin unidad en atributos con dimensión, el mismo atributo con valores distintos | 29148 §5.2.5 (verificable) |
| Lenguaje | Diccionarios ES/EN de vagos, subjetivos, escapatorias, superlativos, comparativos y "y/o"; varios verbos modales en una oración | 29148 §5.2.7, QuARS, Smella |
| Duplicados exactos y casi exactos | Hash del texto normalizado; *shingles* de 5 caracteres con Jaccard ≥ 0,9 para copiar y pegar con cambios mínimos | Juergens et al., ICSE 2010 |
| Contradicción de valor | Agrupa por la frase con los números enmascarados: la misma frase con otro número es un conflicto | Medido: 20/20 sin falsos positivos |
| Polaridad opuesta | Agrupa por las palabras de contenido sin modales ni negación: las mismas palabras, una con "NO" y otra sin, es un conflicto | Medido: 19/19 sin falsos positivos |

Dos lecciones del spike para esta capa:

- **Los límites de palabra van en Unicode.** El `\b` de JavaScript es ASCII y no ve el límite antes de "ó", así que
  "óptimo" se escapaba.
- **Las reglas de valor y polaridad van sobre la frase enmascarada, no sobre pares parecidos por coseno.** Sobre pares
  por coseno dieron 354 falsos positivos; enmascaradas, ninguno.

Los diccionarios viven en YAML, con el formato de las reglas de Vale, para que cada equipo los extienda sin tocar
código.

### C2. Embeddings locales: casi duplicados y candidatos

- `multilingual-e5-small` en `int8` (118 MB), el mismo modelo que ya está en el catálogo del AI Lab.
- Cada unidad se vuelve un vector. Para cada una se toman sus *k* vecinos más cercanos por coseno (k = 5, coseno
  ≥ 0,86).
  - Medido: 2.177 requisitos se vectorizan en 158 s de CPU y se comparan todos contra todos (2,37 millones de pares) en
    9 s.
- **El coseno no decide, solo propone.**
  - Medido: en una spec de plantilla, el 99 % de los pares cae entre 0,85 y 0,95, y el coseno solo da una precisión de
    0,005 para casi duplicados.
  - Como filtro, en cambio, conserva el 97,5 % de las paráfrasis y el 93,9 % de las contradicciones.
- Los pares que C1 ya resolvió se sacan; el resto pasa a C3.

### C3. NLI pequeño, solo para candidatos

- Español: `mDeBERTa-v3-base-xnli-multilingual-nli-2mil7` en `int8` (339 MB). Inglés: `nli-deberta-v3-xsmall` en
  `int8` (87 MB).
- Corre en los dos sentidos (A→B y B→A).
  - Si la probabilidad de **contradicción** pasa el umbral, hay hallazgo.
  - Si hay **implicación en los dos sentidos** con coseno alto, es un **casi duplicado**.
- Nunca corre sobre todos los pares: solo sobre los candidatos de C2. Esa es la diferencia entre minutos y horas.
- Antes del NLI, los modales pasan a minúsculas ("DEBE" → "debe"). Medido: en paráfrasis el F1 sube de 0,33 a 0,51
  con umbral 0,8; en contradicciones no cambia.
- **Su salida es una lista ordenada para revisar, no un veredicto.** Medido con `mDeBERTa`:
  - ordena bien las paráfrasis: con implicación doble ≥ 0,5 encuentra 38 de 40, pero entre muchos parecidos que no son
    duplicados (precisión de 0,08); con ≥ 0,8 acierta siempre, pero solo encuentra 8;
  - detectó 1 de 10 contradicciones semánticas.
- **Es la capa cara**: entre 0,46 y 1,03 s por par con la CPU saturada, de 1 a 2 horas para 7.603 candidatos. Para
  entrar en la meta de 5 minutos:
  1. menos candidatos: k = 3 y un filtro léxico que descarte pares cuyas palabras de contenido no se solapan;
  2. un solo sentido primero, y el segundo solo si el primero da contradicción o implicación;
  3. lotes ordenados por longitud, para no rellenar con *padding*;
  4. caché por huella del par, así que en CI con el modo diferencia solo corren los pares nuevos;
  5. WebGPU o GPU cuando haya.
- Hay que volver a medir con la máquina libre antes de dar un número.

### C4. Trazabilidad contra el repo: "esto ya existe"

- Índice del repo con `git ls-files`: código, rutas, textos de la interfaz (i18n), nombres de pruebas y ADR.
  Opcionalmente, símbolos con tree-sitter.
- **BM25 primero** (MiniSearch), con tokens partidos en camelCase y snake_case. El índice de 627 archivos se arma en
  0,5 s de CPU.
- **Puente de idioma**: el glosario de la spec mapea términos en español a los nombres del código ("tema oscuro" →
  `theme`, `dark`; "paleta de comandos" → `palette`, `command`). Medido: sube el acierto en el top 5 de 5/10 a 9/10
  (techo optimista, ver sección 5).
- **Archivos "imán"**: se baja el peso de los archivos de datos que lo mencionan todo, como `content/projects.ts`, que
  salió primero en 5 de las 10 consultas que no existen.
- **Embeddings del repo: opcionales e incrementales.**
  - Medido: 42 minutos para 1.902 fragmentos con la máquina saturada, y no mejoraron el acierto (3/10).
  - Si se usan, se calculan una vez, se guardan por hash de archivo y se fusionan con BM25 por *reciprocal rank
    fusion*.
- **Búsqueda literal** con ripgrep de los IDs de la spec en el código y las pruebas: si `FR-012` aparece en un test,
  ese requisito ya tiene cobertura.
- El resultado nunca es "ya existe" a secas: es "posiblemente implementado", con los tres archivos más probables, los
  términos que coincidieron y el puntaje de cada método.
  - Medido: ningún método separa "existe" de "no existe" por umbral, porque los rangos de puntaje se cruzan.
- **Siguiente prueba**: comparar primero contra specs y ADR anteriores del mismo repo (español contra español) y
  seguir sus enlaces al código, antes de buscar directo en el código.

### C5. LLM local opcional (apagado por defecto)

- Un modelo *instruct* de 1 a 4 B parámetros en GGUF con llama.cpp u Ollama.
- Redacta una oración de explicación o una sugerencia de reescritura para un hallazgo que ya existe.
- La salida se restringe con JSON Schema. No crea ni borra hallazgos y no cambia puntajes. Queda fuera del cálculo de
  reproducibilidad.

### Modo línea base y modo diferencia

- **Línea base**: como en los linters, el equipo marca hallazgos como aceptados o descartados. Se guardan por la
  huella del fragmento y las corridas siguientes muestran solo lo nuevo.
- **Diferencia**: en CI analiza solo las unidades que cambiaron frente a la rama base, más sus vecinos. Así sigue el
  modelo *spec-anchored* de OpenSpec sin reanalizar 10.000 líneas en cada PR.

## 4. Formato del reporte

Tres salidas del mismo resultado:

1. **JSON** con esquema versionado: la fuente de verdad.
2. **SARIF 2.1.0**: GitHub Code Scanning lo muestra como anotaciones en el PR. Admite hasta 1.000 resultados por
   carga, así que se ordena por severidad.
3. **Markdown o HTML** para leer: resumen por familia y lista de hallazgos con evidencia.

Ejemplo de hallazgo:

```json
{
  "id": "CT-0007",
  "regla": "contradiccion.valor",
  "capas": ["C1"],
  "severidad": "alta",
  "puntaje": 0.95,
  "componentes": {
    "regla": "misma frase salvo el número: 15 frente a 30 minutos",
    "frase_enmascarada": "la sesion del vendedor en el carrito debe expirar tras # minutos de inactividad"
  },
  "evidencia": [
    { "archivo": "spec.md", "linea": 812, "id": "NFR-0031", "fragmento": "La sesión del vendedor en el carrito DEBE expirar tras 15 minutos de inactividad." },
    { "archivo": "spec.md", "linea": 4377, "id": "NFR-0164", "fragmento": "La sesión del vendedor en el carrito DEBE expirar tras 30 minutos de inactividad." }
  ],
  "por_que": "Dos requisitos fijan valores distintos para la misma cantidad.",
  "como_refutar": "Si aplican a perfiles o canales distintos, dilo en el texto o márcalo como excepción.",
  "huella": "sha256:9c1f…"
}
```

- **Puntaje**:
  - una regla determinista da 1,0 si es un hecho (un ID no existe) o un peso fijo y documentado si es un indicio (un
    término vago vale 0,7);
  - un hallazgo de modelo muestra las probabilidades crudas (coseno, contradicción e implicación) y el umbral que
    usó.
- **Bloque de reproducibilidad** en cada reporte:
  - versión de la herramienta y hash de la configuración;
  - ID y sha256 de cada modelo, y versión de ONNX Runtime;
  - hash de la entrada y tiempos por capa.
- **Para el agente**: un resumen compacto, con un hallazgo por línea y la cita mínima, que se lee con pocos tokens.

## 5. MVP chico y medible

### Alcance

- **Entrada**: una spec en Markdown (Spec Kit `spec.md` o equivalente) en español o inglés, y opcionalmente la ruta a
  un repo.
- **Capas**:
  - **C1 completa** (salvo estructura por plantilla, que en el MVP es solo la de Spec Kit): es el núcleo y lo primero
    que se entrega;
  - C2 y C3 con los modelos de arriba, detrás de una opción (`--semantica`) y con los recortes de costo de C3;
  - C4 con BM25 y el puente del glosario; los embeddings del repo quedan como opción.
- **Salida**: JSON, Markdown y SARIF.
- **Fuera del MVP**: C5, el modo diferencia, tree-sitter, Word y Confluence, y la interfaz web propia (la demo del AI
  Lab hace ese papel).

### Corpus de prueba

1. **Sintético con verdad conocida**: el generador de [medicion/](./medicion/) produce una spec de 9.992 líneas con
   2.177 requisitos y 226 defectos sembrados, con semilla fija y en español:
   - 30 duplicados exactos y 40 paráfrasis;
   - 49 contradicciones: 19 de polaridad, 20 numéricas y 10 semánticas escritas a mano;
   - 25 referencias rotas y 9 IDs repetidos;
   - 13 acrónimos sin definir, 58 términos vagos y 2 términos del glosario sin uso.
   En el MVP se corre con tres semillas y se reporta el promedio; el spike usó una sola (14).
2. **Difícil, escrito por personas**: unas 200 parejas de requisitos (paráfrasis, contradicciones sutiles y "parecidos
   pero distintos") escritas por el autor o por colegas, sin material de ninguna empresa. Este corpus mide de verdad;
   el sintético comparte autor con las reglas y por eso infla los resultados.
3. **Público**: PURE (Ferrari, Spagnolo y Gnesi, RE 2017; 79 documentos y 34.268 oraciones en inglés) para medir la
   tasa de falsos positivos de C1 en specs reales.

### Métricas

- Precisión, recall y F1 por detector.
- Para la traza, aciertos en el top 5 en los requisitos que existen y puntaje bajo en los que no.
- Tiempo por capa, pico de RAM y MB de modelos descargados.
- Reproducibilidad: dos corridas seguidas dan el mismo sha256 del JSON.
- Tokens que se ahorra el agente: tamaño de la spec frente al tamaño del resumen compacto.

### Criterios de aceptación del MVP

Son propuestas, para que el autor las ajuste:

| Detector | Meta en el corpus sintético | Meta en el corpus difícil | Spike (sintético) |
|---|---|---|---|
| IDs repetidos, referencias rotas, duplicados exactos | P y R = 1,00 | — | 1,00 / 1,00 |
| Acrónimos y términos vagos | P ≥ 0,95 y R ≥ 0,95 | P ≥ 0,80 en PURE | 1,00 / 1,00 |
| Contradicciones de valor y polaridad (C1) | P y R ≥ 0,95 | P ≥ 0,80 y R ≥ 0,70 | 1,00 / 1,00 |
| Casi duplicados (C2 + C3) | Precisión en los 50 primeros ≥ 0,60 y R ≥ 0,90 | Precisión en los 50 primeros ≥ 0,40 | R = 0,95 con P ≈ 0,08, o P = 1,00 con R = 0,20, según el umbral |
| Contradicciones semánticas (C3) | R ≥ 0,50 como candidatos ordenados | Se mide, sin meta | 1/10 |
| "Ya existe" (repo de este sitio, 20 requisitos) | Top 5 ≥ 8/10 con el puente que sale del glosario | — | 5/10 sin puente; 9/10 con puente escrito a mano |
| Costo para 10.000 líneas en una laptop de 4 núcleos | C1 ≤ 1 s; todo ≤ 5 min en frío y ≤ 1 min con caché; ≤ 2 GB | — | C1: 0,23 s. Todo: de 1 a 2 h por el NLI con la CPU saturada |
| Reproducibilidad | Mismo hash en dos corridas; cero llamadas de red al analizar | — | Mismos candidatos (7.669) y hallazgos en corridas repetidas; falta el hash del reporte |

Para los casi duplicados la meta pasa de "precisión con umbral" a "precisión en los 50 primeros", porque el spike
muestra que el valor está en el orden y no en un corte.

### Lo que ya midió el spike

Medición completa en [medicion/README.md](./medicion/README.md). En resumen:

1. **Lo determinista resolvió lo que más duele** (contradicciones de valor y polaridad, duplicados, referencias,
   lenguaje) con **0,23 s de CPU** para 9.992 líneas. Es el núcleo del producto y lo que se muestra primero en la
   demo.
2. **Los embeddings proponen bien y deciden mal**: 97,5 % de las paráfrasis entre los candidatos, pero el coseno no
   separa nada en una spec de plantilla.
3. **El NLI pequeño es la parte cara y la menos precisa en español.** Sirve para ordenar paráfrasis y no para
   contradicciones semánticas: detectó 1 de 10. El MVP lo trata como opcional y ordenado, con los recortes de costo
   de C3.
4. **"Ya existe" depende del vocabulario, no del modelo.** BM25 con un puente es→en llegó a 9/10, mientras que los
   embeddings del repo costaron 42 min y dieron 3/10. Ningún puntaje separa "existe" de "no existe", así que el
   reporte entrega candidatos con evidencia.
5. **Ahorro de tokens para el agente**: la spec son del orden de 300.000 tokens (estimado). El resumen compacto de un
   hallazgo por línea para los 176 hallazgos de C1 cabe en unos pocos miles. Es un orden de magnitud estimado: falta
   medirlo con el reporte real.

## 6. Stack sugerido

| Pieza | Elección | Por qué |
|---|---|---|
| Lenguaje | **TypeScript**, un núcleo que corre en Node 20+ y en el navegador (Web Worker) | La CLI y la demo del AI Lab usan el mismo código, no una maqueta. El sitio ya usa transformers.js y MiniSearch |
| Modelos | Transformers.js 4.x sobre ONNX Runtime, en `int8` | El mismo motor en Node y en el navegador; WebGPU cuando hay |
| Markdown | `unified` y `remark` (mdast) | Posiciones exactas de línea y columna para la evidencia |
| Búsqueda | MiniSearch (BM25) con puente de glosario; embeddings opcionales con fusión RRF | Sin servicios e índice en memoria. Medido: el índice de 627 archivos sale en 0,5 s de CPU |
| Código | `git ls-files`, ripgrep si está instalado y `web-tree-sitter` después del MVP | Determinista y rápido |
| Reglas | YAML con el estilo de Vale | Extensible por cada equipo |
| Distribución | `npx cotejo analizar spec.md --repo ../app --salida sarif`; GitHub Action; skill de Claude Code que corre la CLI y lee el resumen compacto | Se usa en local, en CI y con agentes |
| Pruebas | Vitest y el corpus sintético como *fixture* | La métrica es parte de la suite |
| Generador del corpus | Python, como en el spike | Cumple el "un poco de Python" del AI Lab (003) |

**Alternativa considerada**: hacer el núcleo en Python con spaCy, que lematiza y etiqueta mejor el español. Se
descarta para el MVP porque obliga a mantener dos implementaciones (Python en la CLI y JS en la demo). Si las reglas de
lenguaje necesitan análisis sintáctico, se evalúa un etiquetador POS pequeño en ONNX.

## 7. Cómo se muestra en el portafolio

### Caso de estudio

Sigue la forma de los casos del sitio:

- **Problema**: el *documentation sprawl*, en términos generales, sin datos de ninguna empresa.
- **Decisión central**: determinista primero, modelos pequeños solo sobre candidatos y ningún token de LLM en el
  camino crítico.
- **Números**: tiempo y RAM por capa, MB de modelos, precisión y recall por detector, y tokens que se ahorra el agente.
- **Qué no funcionó**: por ejemplo, la traza solo con BM25 entre una spec en español y código en inglés (sección 5).
  Mostrar el límite da más credibilidad que esconderlo.
- **Enlaces**: al repo abierto, a la demo y a esta investigación.

### Demo en el AI Lab

Es un experimento nuevo del catálogo de la 003. Va por el **camino A**: todo corre en el navegador, sin servidor ni
llaves, y no hace falta infraestructura nueva.

- **Entrada**: una spec de ejemplo de unas 600 líneas con defectos sembrados. También se puede pegar una propia, que
  no sale del dispositivo.
- **Capas que se encienden de a una**, con su tiempo y su peso de descarga a la vista:
  - **C1**, la protagonista: instantánea y sin descarga. Ya resuelve contradicciones de valor y polaridad, duplicados,
    referencias y lenguaje. El mensaje de la demo es que lo que más duele se resuelve sin modelo;
  - **C2**: `multilingual-e5-small` (118 MB), el mismo de A5 "Buscador semántico", así que la caché se comparte;
  - **C3**, opcional: NLI de 339 MB con consentimiento explícito, como los tamaños de Whisper (87 MB en una muestra en
    inglés). Muestra con honestidad qué ordena bien (paráfrasis) y qué se le escapa (contradicciones semánticas).
- **Caja de cristal**, como `GlassBoxSearch`: cada hallazgo resalta las líneas en la spec y desglosa el puntaje (coseno,
  regla y probabilidad NLI).
- **Precisión en vivo**: como la muestra trae su verdad, la demo calcula precisión y recall en el navegador.
- **"Ya existe" contra el propio sitio**: una spec de 20 requisitos del portafolio contra un índice BM25 del repo,
  generado en el build sin modelos. Muestra, por ejemplo, que el feed RSS ya existe en `app/[lang]/feed.xml/`.
- **Restricciones del sitio**:
  - movimiento reducido y teclado completo, como las demás demos;
  - la inferencia corre en un Worker para no bajar los fps del fondo (SC-205);
  - los modelos se bajan de `huggingface.co`, el host que ya usa el catálogo.

## 8. Riesgos y preguntas abiertas

### Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| El corpus sintético comparte autor con las reglas y sobreestima la precisión | Alto | Corpus difícil escrito por personas y PURE; reportar los tres por separado |
| Las contradicciones semánticas son difíciles: la literatura reporta menos acierto en conflictos, y el spike detectó 1 de 10 | Alto | Presentarlas como candidatos ordenados para revisión humana, no como veredictos; medir la precisión en el top *k* |
| El NLI es la capa cara: de 1 a 2 horas para 7.603 candidatos con `mDeBERTa` y la CPU saturada | Alto | Opcional (`--semantica`), los cinco recortes de C3, y volver a medir con la máquina libre antes de prometer tiempos |
| El NLI multilingüe es grande (339 MB) y su autor lo marca "viejo"; `xsmall` en español dice "contradicción" a casi todo | Medio | Evaluar NLI multilingües más nuevos con el mismo arnés de medición; `xsmall` solo para specs en inglés |
| Spec en español y código en inglés: BM25 falla | Medio | Puente desde el glosario. Medido: de 5/10 a 9/10, un techo optimista. Los embeddings del repo no ayudaron (3/10) y cuestan 42 min |
| Las specs con plantilla suben el coseno de todo y aparecen "parecidos pero distintos" | Medio | Medido: el 99 % de los pares cae entre 0,85 y 0,95. El coseno solo propone; deciden las reglas enmascaradas de C1 y, en segundo lugar, el NLI |
| Diferencias de punto flotante entre CPU | Bajo | Redondeo, umbrales fijos y versión de ONNX Runtime fijada |
| Los agentes traen un `/analyze` mejor | Medio | El valor es lo determinista y local; además, Cotejo puede alimentar ese `/analyze` con menos tokens |
| Se cuela un LLM al camino crítico "porque explica mejor" | Medio | C5 apagado por defecto y fuera del hash de reproducibilidad |

### Preguntas para el autor

1. **Nombre**: ¿"Cotejo" va, o prefieres otro?
2. **Repositorio**: ¿proyecto aparte y abierto (MIT, como Spec Kit y OpenSpec), con el sitio consumiendo el paquete?
3. **Idioma**: ¿las specs que te llegan son en español, en inglés o mezcladas? Eso decide qué NLI va por defecto.
4. **Formato de entrada principal**: ¿`spec.md` de Spec Kit, `requirements.md` en EARS, o documentos exportados de
   Word o de un wiki?
5. **Corpus difícil**: ¿puedes escribir o conseguir unas 200 parejas de requisitos de prueba sin material de ninguna
   empresa?
6. **Demo**: ¿aceptas que el NLI de 339 MB se baje con consentimiento, o la demo se queda en reglas y embeddings
   (118 MB, compartidos con el buscador A5)?
7. **"Ya existe"**: ¿debe mirar solo el código, o también las pruebas, los ADR y las specs anteriores?
8. **Agentes**: ¿lo empaquetamos también como skill o plugin de Claude Code, en la línea de tus plugins por
   profesión, para que el agente lea el reporte y no la spec?
9. **Prioridad**: ¿entra después del Release 1 (012), como experimento de la ola 2 del AI Lab?
