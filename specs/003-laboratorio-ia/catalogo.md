# Catálogo 003: experimentos del AI Lab

**Estado**: catálogo propuesto el 2026-11-04, a partir del handoff del autor de esa fecha (privado, fuera del repo).
No es una spec: es insumo para especificar la 003. Si algo choca, mandan [idea.md](idea.md) y
[research.md](research.md).

## La decisión A/B sigue abierta

El autor todavía no eligió entre el camino A, el B o uno mixto (idea.md, "Tensión con las reglas actuales"). Por eso
cada experimento lleva su etiqueta de camino:

| Etiqueta | Significado |
|---|---|
| **A** | Corre en el navegador del visitante. Cumple la constitución tal como está |
| **B** | Necesita un servidor propio o una llave de IA. Solo se construye si el autor aprueba la excepción, con una enmienda al principio VIII |
| **A·B** | Tiene una variante A, y una B más vistosa si el autor aprueba la excepción |
| **[confirmar]** | Depende de un dato que solo el autor puede dar |

Un servicio Python en un servidor propio también es infraestructura nueva para este proyecto: cuenta como B.

## Ola 1: todo A, dentro de la constitución

| # | Experimento | Qué hace | Camino | Cubre de la idea |
|---|---|---|---|---|
| V1 | Transcriptor | Graba o sube un audio y obtiene el texto con marcas de tiempo; exporta `.txt` y `.srt` | A: Whisper con Transformers.js | App 1 |
| V4 | Navega hablando | "Llévame al blog", "cambia a tema claro", "descarga el CV": la voz se vuelve un comando de la paleta (004, FR-451) | A, con Whisper local. La Web Speech API manda el audio a un servicio del navegador (research §2), así que no cumple "nada sale del dispositivo" | — |
| A2 | Anatomía de un plugin | Explorador de un plugin de Claude Code: `plugin.json`, skills (`SKILL.md`), comandos, hooks y MCP. Al tocar cada archivo, explica para qué sirve | A: estático. Ver P-3c | Plugins por profesión |
| A3 | Crea tu propio skill | Un formulario que genera un `SKILL.md` válido para descargar | A | Plugins por profesión |
| R1 | Simulador de sagas | Reservas vuelo, hotel y auto; en mitad del cobro "matas" un servicio y ves cómo se reescribe la compensación | A: simulación, sin IA | — |
| C5 | `llms.txt` | Un archivo para que las IAs lean bien el portafolio | A: archivo estático | — |

## Ola 2

| # | Experimento | Qué hace | Camino | Cubre de la idea |
|---|---|---|---|---|
| A5 | Buscador semántico (Ask my portfolio v2) | Busca por significado en el blog, los proyectos y la carrera (los datos del sitio, no el PDF del CV: 004, FR-422), y muestra los fragmentos recuperados y su puntaje ("caja de cristal"). Reemplaza la búsqueda por palabras del chat actual | A·B: A con un índice precalculado en el build (e5-small) o BM25; B si responde con un LLM | App 5 |
| A4 | Vitrinas por profesión | "Despacho": un caso ficticio convertido en hechos con prueba y cronología. "Obra": una bitácora de ejemplo convertida en cantidades y un estimado en COP, con Pyodide | A·B: A con resultados pregenerados; B en vivo. Solo datos inventados | Apps 3 y 4 |
| V2 | Texto → voz | Escribe y escucha con varias voces en español e inglés | A·B: A con la Web Speech API; B con voces neuronales | — |
| V3 | Escuchar los posts | Cada post tiene versión en audio. Es la base de "Escuchar este post" (005, US5) | A·B: A con síntesis en vivo en el navegador; B con audio pregenerado. Pregenerar exige un motor en el build: es B, salvo que se demuestre un motor sin llave | — |
| A1 | Servidor MCP del portafolio | Cualquiera conecta su Claude al sitio y pregunta por proyectos, skills, posts y experiencia (`get_projects`, `get_skills`, `get_posts`, `get_experience`) | **[confirmar]**: es una ruta de solo lectura en el mismo Next.js, sin llave de IA, y podría caber en la constitución sin la excepción B | — |

## Ola 3: solo si el autor aprueba el camino B

| # | Experimento | Qué hace | Camino | Cubre de la idea |
|---|---|---|---|---|
| V5 | Habla con mi portafolio | Pregunta en voz y responde en voz (voz → texto → búsqueda → voz), con el tiempo de cada etapa | A·B: A con BM25 o embeddings. En esta ola va la variante con LLM (B) | — |
| A6 | Screenshot → componentes | Subes la captura de una interfaz y la IA propone qué piezas del design system de Synergos usar | B: modelo con visión | — |
| A7 | De idea a spec | Una línea de idea genera `spec.md`, `plan.md` y `tasks.md` al estilo Spec Kit | B | — |
| A8 | Generador de ADR | Describes una decisión y sale el ADR: contexto, opciones, trade-off y disparador de revisión | B | — |
| A12 | Investigador | Una pregunta, fuentes y un resumen con citas | A·B: A sobre fuentes curadas con extractos citados (research §5); B con generación libre | App 2 |

## Sin ola asignada (backlog)

El handoff no les asigna ola. Se priorizan al especificar la 003.

| # | Experimento | Qué hace | Camino |
|---|---|---|---|
| V6 | Subtítulos en vivo ES → EN | Hablas en español y aparecen subtítulos en inglés | B: traducción de calidad |
| R2 | Arma una página con mis piezas | Arrastras bloques `<synergos-*>` reales y la página se compone en vivo | A, **[confirmar]**: solo si el CDN de Synergos es público y la CSP lo permite |
| R3 | El gate mutante | Rompes una regla de arquitectura con un clic, el build se pone rojo y dice por qué; la restauras y vuelve a verde | A: Pyodide o JS |
| R4 | Simulador de líneas de agentes | Carriles que avanzan en paralelo: chocan cuando no hay dueño de archivo y dejan de chocar cuando lo hay | A |
| A9 | Texto → diagrama | "Un BFF que llama a tres servicios y una cola" se vuelve un diagrama en vivo | A·B: A con plantillas; B generado |
| A10 | Repetición de una sesión de agentes | Línea de tiempo animada de una sesión real, limpia de datos: qué leyó el agente, qué herramientas usó, qué cambió y dónde lo frenó el humano | A: datos estáticos. **[confirmar]** qué sesión |
| A11 | Chat en tu GPU | Un modelo pequeño en el navegador comparado con un chat de servidor: calidad contra privacidad | A: WebLLM, que exige WebGPU (research §5) |
| C1 | `ask` en el terminal | En `~/camilo/brain` (004, FR-461): `ask "¿por qué Angular y no React?"` responde con A5 | A, depende de A5 |
| C2 | "Explícamelo como…" | Un mismo proyecto explicado para un reclutador, un CTO o una mamá | A·B: A con textos escritos a mano; B generado |
| C3 | Haiku del commit | Pegas un diff y sale un mensaje de commit serio y un haiku | B |
| C4 | Konami code | Las partículas del fondo se reordenan y dibujan el logo o el diagrama de Synergos. No cambia la animación de siempre (D1) | A |

**Total**: 27 experimentos (6 en la ola 1, 5 en la ola 2, 5 en la ola 3 y 11 en el backlog).

**Las cinco apps de la idea quedan cubiertas**: V1 es la app 1, A12 la 2, A4 la 3 y la 4, y A5 la 5.

## Formato de cada tarjeta

- **Pruébalo**: la demo.
- **Cómo funciona**: un diagrama pequeño y tarjetas Decisión · Por qué · Trade-off, con el mismo componente de la 004
  (FR-442).
- **El código**: un fragmento real y el enlace al repo, si es público.
- **Etiquetas**: estado (`stable`, `beta` o `experiment`) y dónde corre ("Corre en tu navegador" o "Corre en mi
  servidor").
- **Privacidad**: "No guardo tu audio ni tu texto".

El copy base ES/EN del laboratorio está en el handoff del autor y pasa a la spec 003 cuando se especifique.

## Reglas para cualquier experimento

1. Las vitrinas usan solo datos inventados. Nunca material de casos reales, datos de clientes ni precios de proveedores.
2. Ningún nombre interno del empleador.
3. Si usa servidor (camino B): verificación anti-bots, límites de tamaño y de peticiones, nada se guarda, tope de gasto y
   un "modo descanso" amable al llegar al tope.
4. Respeta la CSP (si se agrega) y los presupuestos de la 002 (SC-204 y SC-205). Los modelos pesados se cargan solo cuando
   el visitante abre el experimento, con su tamaño a la vista y su consentimiento, y la inferencia corre en workers
   (research, "Riesgos y reglas").
5. Cada demo se puede usar con teclado, y todo lo que es de voz tiene una alternativa en texto.

## Relación con otras specs

- **004**: los comandos de voz (V4) y "Abrir el AI Lab" usan el registro de comandos de la paleta (FR-451); C1 usa el
  terminal (FR-461); las tarjetas usan el componente ADR (FR-442).
- **005**: "Escuchar este post" depende de V3.
- **002, T225**: Azure AI Foundry, Semantic Kernel y RAG están en "Aprendiendo ahora". Solo pasan a skills si A5 o A12
  los usan de verdad y el autor lo confirma.

## Preguntas abiertas

| ID | Pregunta | Origen |
|---|---|---|
| P-3a | ¿Camino A, B o mixto? | idea.md; handoff, pregunta 17 |
| P-3b | ¿Se aprueba el servidor MCP del portafolio (A1)? **[confirmar]** | Handoff, pregunta 18 |
| P-3c | ¿"Anatomía de un plugin" muestra la estructura del plugin para abogados del autor o un plugin de ejemplo neutral? | Handoff, pregunta 19 |
| P-3d | ¿El CDN de Synergos es público para "Arma una página con mis piezas" (R2)? **[confirmar]** | Handoff, pregunta 20 |
| P-3e | ¿Se puede nombrar en público el dictador de voz del autor, la base real de V1 y V2? ¿Tiene repo público? | Handoff, pregunta 9 |
| P-3f | ¿Qué sesión de agentes se usa en A10, y quién la limpia de datos? **[confirmar]** | Handoff |
| P-3g | ¿El AI Lab es también el proyecto con el que el autor aprende RAG, Semantic Kernel y Azure AI Foundry (A5, A12)? | Handoff |
| P-3h | ¿El AI Lab entra al menú entre Portafolio y Blog, en `/[lang]/ai-lab`? | Handoff |
