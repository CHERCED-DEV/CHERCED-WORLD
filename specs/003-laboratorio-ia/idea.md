# Idea 003: Laboratorio de IA

**Estado**: idea registrada el 2026-11-04. No se especifica ni se construye hasta integrar la 002.
La spec formal, el plan y las tareas (solo camino A) están en [spec.md](spec.md), [plan.md](plan.md) y
[tasks.md](tasks.md).

## Lo que pidió el autor

- Una página o capacidad de **transcripción de textos** desde la web.
- Un **resource y research**: aplicaciones sencillas que muestren capacidades de IA.
- Dejar claro que el autor **crea plugins según la profesión**, porque ya lo ha hecho:
  - **Abogados**: skills de Claude Code que generan documentos, analizan el material del caso y
    contrastan hipótesis.
  - **Ingeniero estructural**: un asistente que lee las bitácoras de sus hojas de dibujo, ayuda con los
    cálculos y arma el estimado con precios reales del mercado colombiano y de sus proveedores.
- **Python en el proyecto**, en pequeño.
- **Cinco aplicativos** que usen IA como demostración.

## Candidatos a los cinco aplicativos (borrador del orquestador)

| # | Aplicativo | Qué demuestra |
|---|------------|---------------|
| 1 | Transcriptor web: audio o voz a texto, con marcas de tiempo y exportación `.txt` / `.srt` | Voz a texto |
| 2 | Investigador: una pregunta, fuentes y un resumen con citas | Research con fuentes |
| 3 | Vitrina "Despacho": un caso ficticio convertido en hechos con prueba y una cronología | Plugin para abogados |
| 4 | Vitrina "Obra": una bitácora de ejemplo convertida en cantidades y un estimado en COP | Plugin para ingeniería estructural, con Python |
| 5 | Buscador semántico del blog y del CV, por significado y no por palabras | Embeddings y RAG |

Las vitrinas 3 y 4 usan solo datos inventados. Nunca material de casos reales, datos de clientes ni listas
de precios de proveedores.

## Tensión con las reglas actuales

La constitución y el autor piden **cero infraestructura nueva y cero variables nuevas en Vercel**. Una IA
"de verdad" necesita un modelo. Hay dos caminos y el autor tiene que elegir uno:

- **A. Todo en el navegador**: modelos abiertos que corren en el equipo del visitante (WebGPU / WASM),
  y Python en el navegador con Pyodide.
  - A favor: sin llaves, sin costo por uso, sin servidor nuevo y privado por diseño.
  - En contra: primera descarga pesada, depende del equipo del visitante, y modelos pequeños.
- **B. Una sola llave de IA** como excepción explícita a la regla, con funciones de Vercel (Python o Node)
  en el mismo proyecto.
  - A favor: modelos grandes y resultados vistosos.
  - En contra: costo por uso, necesita límites de abuso (la base ya existe) y rompe "cero variables nuevas".

También existe un camino mixto: A por defecto, y B solo para 2 y 3 si el autor acepta la excepción.

## Catálogo de experimentos (2026-11-04)

El handoff del autor del 2026-11-04 propone 27 experimentos agrupados en tres olas, más un backlog. La propuesta
WebMCP del mismo día suma un experimento más (A13, "Este sitio es agent-ready"). El resumen, con la
etiqueta de camino A o B de cada uno, está en [catalogo.md](catalogo.md).

- **La decisión A/B sigue abierta.** El catálogo no la toma: solo marca qué exige cada experimento.
- **Dos experimentos quedan [confirmar]**: R2 ("Arma una página con mis piezas", si el CDN de Synergos es público) y A1
  (el servidor MCP del portafolio).
- **Cobertura**: V1 es la app 1, A12 la 2, A4 la 3 y la 4, y A5 la 5.

## Preguntas que la investigación debe responder

1. ¿Puede este proyecto Next.js 16 en Vercel servir funciones Python (`api/*.py`) en el mismo despliegue,
   sin configuración nueva en el panel? ¿Qué límites tienen (tamaño, tiempo, memoria) en el plan actual?
2. Transcripción en el navegador: ¿Whisper con Transformers.js (WebGPU / WASM)? ¿Qué tamaño de modelo,
   qué velocidad en un portátil promedio y en móvil, y en qué idiomas (es / en)? ¿Sirve la Web Speech API
   como respaldo y en qué navegadores?
3. Pyodide: ¿cuánto pesa, cuánto tarda en arrancar y qué paquetes (numpy, pandas) sirven para los cálculos
   de la vitrina 4?
4. Embeddings en el navegador para la 5: ¿qué modelo pequeño (por ejemplo MiniLM multilingüe), qué tamaño
   tiene y se puede precalcular el índice en el build?
5. Research sin llave: ¿es viable con un modelo en el navegador y fuentes fijas, o la app 2 obliga a B?
6. ¿Cómo encaja con la CSP, con el rendimiento (SC-204 / SC-205) y con la regla de no usar herramientas
   corporativas?
