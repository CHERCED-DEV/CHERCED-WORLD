# Medición 014: cuánto cuesta cada capa en una laptop normal

Spike del 2026-11-12. No es el producto: es la prueba de que las capas de la [propuesta](../propuesta.md) caben en una
máquina normal, y una primera lectura de su precisión sobre un corpus con la verdad conocida.

## Qué se midió

| Archivo | Qué hace |
|---|---|
| [`generar_corpus.py`](./generar_corpus.py) | Genera una spec sintética en español de unas 10.000 líneas con defectos sembrados y su verdad (`truth.json`). Es determinista: con la misma semilla produce los mismos bytes |
| [`traza.json`](./traza.json) | 20 requisitos sobre este mismo sitio: 10 que ya existen en el repo (con los archivos esperados) y 10 que no |
| [`medir.mjs`](./medir.mjs) | Corre las capas C1 a C4 con las mismas librerías del sitio (Transformers.js 4.3.2 y MiniSearch 7.2.0) y mide tiempo de reloj, tiempo de CPU, pico de RAM, precisión y recall |
| [`traza_puente.mjs`](./traza_puente.mjs) | La traza con BM25, con y sin un puente de glosario es→en. No usa modelos |
| [`resumen.py`](./resumen.py) | Pasa el JSON de resultados a tablas |
| [`resultados.json`](./resultados.json) | Corrida final: C1 a C3 y C4 con BM25, con el NLI sobre muestra |
| [`resultados-traza.json`](./resultados-traza.json) | Primera corrida, solo la capa C4 (BM25, embeddings del repo y la fusión) |
| [`resultados-puente.json`](./resultados-puente.json) | La traza con BM25, con y sin puente |
| [`resultados-mdeberta-minusculas.json`](./resultados-mdeberta-minusculas.json) | `mDeBERTa` solo, con los modales en minúsculas ("debe" en lugar de "DEBE") antes del NLI |

## Cómo reproducirlo

Desde una carpeta temporal fuera del repo, con Node 20 o superior y un `node_modules` que tenga
`@huggingface/transformers@4.3.2` y `minisearch@7.2.0` (sirve el del sitio):

```bash
python -I generar_corpus.py ./corpus 14
```

```bash
node medir.mjs corpus/spec-sintetica.md corpus/truth.json <ruta-al-repo> resultados.json --sin-traza-emb --emb-cache=emb-req.bin --nli-muestra=600 --nli=Xenova/nli-deberta-v3-xsmall --nli=Xenova/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7
```

```bash
node traza_puente.mjs corpus/traza.json <ruta-al-repo> resultados-puente.json
```

Opciones de `medir.mjs`:

- `--sin-nli` salta C3;
- `--sin-traza-emb` salta los embeddings del repo, que cuestan 42 minutos;
- `--emb-cache=<archivo>` guarda o lee los embeddings de los requisitos;
- `--nli-muestra=<N>` corre el NLI sobre los positivos y N negativos al azar;
- `--nli-minusculas` pasa "DEBE" a "debe" antes del NLI.

Antes de medir, copia `traza.json` a `corpus/`, porque `medir.mjs` lo busca junto a `spec-sintetica.md`. Los modelos
se bajan una vez de `huggingface.co` a `./modelos`, y después la corrida no usa la red.

Huellas del corpus con la semilla 14. Dos ejecuciones seguidas del generador dan los mismos bytes:

- `spec-sintetica.md`: `e7dfc03ad0789a938964a49b95ff1998f0a1713d878d6a60f071e3f87a563bd0`
- `truth.json`: `79106662ce2e2bd52f64e0c2ee6c111bba34873256be1e89912e745e277c79c7`

El dominio del corpus es una tienda en línea con logística propia, elegido a propósito para que sea genérico.

## Condiciones de la medición: léelas antes que los números

- **Máquina**: laptop con Intel Core i5-10300H (4 núcleos y 8 hilos, de 2020), 32 GB de RAM, Windows 11 y Node
  20.19.0. Sin GPU en uso: todo corrió en CPU.
- **La máquina no estaba libre.** Mientras medía, otra sesión corría la suite e2e completa del sitio con Playwright
  (unos 20 navegadores headless) y varios servidores de Node. La CPU estuvo al 100 % todo el tiempo.
  - Por eso se reporta el **tiempo de CPU** del proceso además del de reloj. El de reloj es una **cota pesimista**.
  - ONNX Runtime usa varios hilos, así que su tiempo de CPU puede superar al de reloj y también se infla cuando los
    hilos esperan girando.
- **Los modelos ya estaban en la caché local.** La primera descarga (118 MB más 87 MB más 339 MB) no está en los
  tiempos.
- **El corpus sintético comparte autor con las reglas.** Lo escribí yo, igual que los detectores, así que la precisión
  de C1 está inflada. Sirve para ver que el mecanismo funciona y cuánto cuesta, no para prometer esa precisión en specs
  reales.

## Corpus

9.992 líneas (1,16 MB) y 2.186 unidades de requisito: 2.177 IDs únicos, 9 de ellos repetidos. Tiene 226 defectos
sembrados que se evalúan:

| Tipo | Cantidad |
|---|---|
| Duplicado exacto | 30 |
| Paráfrasis (casi duplicado) | 40 |
| Contradicción de polaridad ("DEBE" frente a "NO DEBE") | 19 |
| Contradicción numérica (el mismo atributo con otro valor) | 20 |
| Contradicción semántica escrita a mano (por ejemplo, "solo en la Unión Europea" frente a "replicar en EE. UU.") | 10 |
| Referencia rota (ID o ancla) | 25 |
| ID repetido | 9 |
| Acrónimo sin definir | 13 |
| Término vago | 58 |
| Término del glosario sin uso | 2 |

Además hay 15 números sin unidad que no se evalúan, porque no se distinguen de un conteo legítimo sin un diccionario
de dimensiones.

Con unos 4 caracteres por token (estimación, no lo medí con un tokenizador), la spec completa son del orden de
**300.000 tokens**: una sola lectura de un LLM ya cuesta eso, antes de razonar.

## Resultados

### Costo por capa (corrida final, `resultados.json`)

| Capa | Reloj | CPU | RAM pico del proceso | Nota |
|---|---|---|---|---|
| C1 determinista, 9.992 líneas | **0,33 s** | **0,23 s** | 86 MB | 176 hallazgos |
| C2 carga de `multilingual-e5-small` (`int8`, desde la caché) | 4,9 s | 3,2 s | 472 MB | 118 MB en disco |
| C2 embeddings de 2.177 requisitos | 141 s | 158 s | 591 MB | 65 ms por texto |
| C2 vecinos por coseno (2,37 millones de pares) | 18,7 s | 9,4 s | 891 MB | 7.669 candidatos (k = 5, coseno ≥ 0,86) |
| C2 filtro de lo que C1 ya resolvió | 0,14 s | 0,05 s | — | Pasan 7.603 pares al NLI; 36 ya los resolvió C1 |
| C3 NLI `nli-deberta-v3-xsmall`, 646 pares en los dos sentidos | 163 s | 233 s | 1,30 GB | 0,25 s por par (0,15 en otra corrida) |
| C3 NLI `mDeBERTa-v3-base-xnli`, 646 pares en los dos sentidos | 691 s | 604 s | 1,44 GB | 1,03 s por par (0,46 en otra corrida) |
| C4 índice BM25, 627 archivos y 63.673 líneas | 2,2 s | 0,5 s | — | — |
| C4 20 consultas BM25 | 0,16 s | 16 ms | — | — |
| C4 embeddings del repo, 1.902 fragmentos de 40 líneas | 42 min | no medido | 1,57 GB | Primera corrida (`resultados-traza.json`) |

- **La RAM** es el pico del proceso acumulado: los modelos quedan cargados.
- **Con `mDeBERTa` el reloj supera a la CPU**: el proceso esperó turno en una máquina saturada.
- **Los tiempos varían entre corridas**: el mismo NLI midió de 0,46 a 1,03 s por par según la carga. Hay que repetir
  todo con la máquina libre antes de citar un número absoluto.
- **Extrapolación del NLI a los 7.603 candidatos**, con la máquina saturada: unos 32 minutos con `xsmall` y de 1 a 2
  horas con `mDeBERTa`. Es lo único que no cabe en la meta de 5 minutos; la
  [propuesta](../propuesta.md#lo-que-ya-midió-el-spike) dice qué hacer con eso.

### Precisión y recall sobre el corpus sintético

El NLI corrió sobre una **muestra estratificada**: los 46 candidatos con verdad conocida y 600 de los 7.557 negativos,
elegidos al azar con semilla 14. Los falsos positivos de la muestra se multiplican por 12,6 para estimar los del total
(marcados "est.").

| Detector | Capa | Precisión | Recall |
|---|---|---|---|
| ID repetido | C1 | 1,00 | 1,00 (9/9) |
| Referencia rota (ID o ancla) | C1 | 1,00 | 1,00 (25/25) |
| Duplicado exacto | C1 | 1,00 | 1,00 (30/30) |
| Término vago | C1 | 1,00 | 1,00 (58/58) |
| Acrónimo sin definir | C1 | 1,00 | 1,00 (13/13) |
| Término del glosario sin uso | C1 | 1,00 | 1,00 (2/2) |
| Contradicción numérica ("misma frase salvo el número") | C1 | 1,00 | 1,00 (20/20) |
| Polaridad opuesta ("mismas palabras salvo la negación") | C1 | 1,00 | 1,00 (19/19) |
| Casi duplicado, solo coseno ≥ 0,93 | C2 | 0,005 | 0,975 |
| Casi duplicado, `mDeBERTa` con implicación doble ≥ 0,5 | C3 | 0,084 (est.) | 0,95 (38/40) |
| Casi duplicado, `mDeBERTa` con implicación doble ≥ 0,8 | C3 | 1,00 (est.) | 0,20 (8/40) |
| Contradicciones en total, C1 + `mDeBERTa` ≥ 0,9 | C1 + C3 | 1,00 (est.) | 0,816 (40/49) |
| Contradicciones en total, C1 + `mDeBERTa` ≥ 0,5 | C1 + C3 | 0,51 (est.) | 0,816 |
| Contradicciones en total, C1 + `xsmall` ≥ 0,9 | C1 + C3 | 0,011 (est.) | 0,898 |
| Solo las 10 semánticas, `mDeBERTa` ≥ 0,9 | C3 | — | 1/10 |
| Techo de candidatos (C2 con k = 5) | C2 | — | 0,975 casi duplicados; 0,939 contradicciones |

Lectura:

1. **C1 hace casi todo el trabajo, y es lo más barato.**
   - Detecta 39 de las 40 contradicciones que se encuentran, en 0,23 s de CPU.
   - El 1,00 es optimista (ver "Condiciones"), pero muestra que una regla bien hecha no necesita modelo.
2. **El coseno no decide.** En una spec escrita con plantilla, el 99 % de los pares cae entre 0,85 y 0,95. Los
   embeddings sirven para proponer candidatos, que es lo que la propuesta les pide, no para dictaminar.
3. **El NLI pequeño aporta poco en español y cuesta mucho.**
   - `mDeBERTa` con umbral 0,9 sumó 1 contradicción semántica y ningún falso positivo en la muestra. Con cero de 600,
     el límite superior al 95 % (regla de tres) es de unos 38 falsos positivos en el total.
   - `xsmall`, entrenado en inglés, dice "contradicción" casi siempre.
   - En paráfrasis, `mDeBERTa` muestra un balance claro: con implicación ≥ 0,5 encuentra 38 de 40 entre muchos
     parecidos; con ≥ 0,8 acierta siempre, pero solo encuentra 8. Sirve como lista ordenada para revisar, no como
     veredicto.
4. **Las contradicciones semánticas** ("solo en la Unión Europea" frente a "replicar en EE. UU.", "solo por correo" frente a
   "solo por SMS") se escapan casi todas. Coincide con la literatura: el conflicto es la tarea más difícil del NLI en
   requisitos (Fazelnia et al., 2024). Quedan para revisión humana, y el reporte debe decirlo.

### Prueba: modales en minúsculas antes del NLI (`resultados-mdeberta-minusculas.json`)

Hipótesis: los NLI se entrenan con oraciones descriptivas, no con "DEBE" en mayúsculas al estilo RFC 2119. Se repitió
`mDeBERTa` sobre la misma muestra pasando "DEBE", "DEBEN" y "NO DEBE" a minúsculas.

| Medida | "DEBE" tal cual | "debe" en minúsculas |
|---|---|---|
| Paráfrasis, implicación doble ≥ 0,8 | P 1,00 (est.) · R 0,20 | P 0,58 (est.) · R 0,45 |
| Paráfrasis, implicación doble ≥ 0,5 | P 0,08 (est.) · R 0,95 | P 0,07 (est.) · R 0,975 |
| Contradicciones semánticas con umbral 0,9 | 1/10 | 0/10 |

La hipótesis se cumple a medias:

- con minúsculas, la implicación sube y el balance en paráfrasis mejora (F1 de 0,33 a 0,51 con umbral 0,8);
- en contradicciones semánticas no cambia nada.

Normalizar el modal es barato y vale la pena dejarlo como opción del producto. No resuelve el problema de fondo.

### Trazabilidad "ya existe" (primera corrida, `resultados-traza.json`, y `traza_puente.mjs`)

20 requisitos en español sobre este sitio contra 627 archivos (63.673 líneas) de `app/`, `components/`, `lib/` y
`content/`:

| Método | Acierto en el top 5 (10 que existen) | Puntaje top 1: existen | Puntaje top 1: no existen | Costo |
|---|---|---|---|---|
| BM25 (MiniSearch) | **5/10** | 62,5 – 336,9 | 8,5 – 104,7 | Índice en 3,6 s; 20 consultas en 0,24 s |
| Embeddings e5-small, fragmentos de 40 líneas | **3/10** | coseno 0,864 – 0,902 | coseno 0,855 – 0,874 | 1.902 fragmentos: 42 min de reloj con la máquina saturada; 1,57 GB de RAM |
| Híbrido (RRF de los dos) | **5/10** | — | — | La suma de los dos |
| BM25 con puente de glosario es→en | **9/10** | 114,4 – 1.106,4 | 11,1 – 398,9 | Igual que BM25 |

Lectura:

1. **Aciertan los requisitos con un término técnico compartido** entre la spec y el código: RSS, Whisper, `llms.txt`,
   saga, robots.
2. **Fallan cuando el español no comparte palabras con los identificadores en inglés**: "paleta de comandos" frente a
   `CommandPalette`, "tema oscuro" frente a `ThemeToggle`, "reacciones" frente a `reactions`. Con el puente, 9/10.
   - El puente se escribió mirando las 20 consultas, así que ese 9/10 es un techo optimista.
   - En el producto, el puente sale del glosario de la spec y de un léxico es↔en genérico.
3. **Los embeddings genéricos por fragmento no ayudan aquí**: el coseno se aplana entre 0,85 y 0,90 para todo. Además
   son lo más caro de todo el spike.
4. **Ningún método separa "existe" de "no existe" por umbral**: los rangos de puntaje se cruzan. Un archivo "imán"
   (`content/projects.ts`, que describe todos los proyectos) aparece en el top 1 de 5 de las 10 consultas que no
   existen.
   - Por eso el reporte debe decir "posiblemente implementado: revisa estos archivos", con los términos que
     coincidieron.
   - Lo siguiente que hay que probar: bajar el peso de los archivos de datos, exigir que coincidan los términos clave en
     la ruta o en un identificador, y comparar primero contra specs anteriores (español contra español) antes que
     contra el código.

### Lo que corrigió el spike en el camino

La primera corrida encontró tres errores míos. Los dejo porque son lecciones para el producto:

1. **`\b` de JavaScript no sirve en español**: es ASCII, así que no ve el límite de palabra antes de "ó" y "óptimo" se
   escapaba. Los diccionarios usan límites Unicode explícitos (`(?<![\p{L}\p{N}])`).
2. **El generador creaba duplicados y contradicciones accidentales**: una plantilla sin objeto repetía el mismo texto.
   El detector los encontró (277 "falsos positivos" que en realidad eran duplicados reales) antes de que yo los viera.
   Ahora cada requisito no funcional es único.
3. **Aplicar las reglas de número y polaridad sobre pares por coseno da mucho ruido**: 354 falsos positivos, porque
   en una spec de plantilla todo se parece.
   - La versión final las aplica en C1 sobre la frase enmascarada: "la misma frase salvo el número" y "las mismas
     palabras salvo la negación".
   - Así se vuelven deterministas y precisas, y no dependen de los embeddings.
