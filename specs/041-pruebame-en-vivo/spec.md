# 041 — Pruébame en vivo: capacidades para entrevistas y proyectos de IA (paraguas)

Pedido del autor, 26 de noviembre de 2026. Quiere que el sitio «hable mejor de mí como desarrollador e ingeniero y me
ayude en entrevistas». Pide dos cosas:
- capacidades que demuestren su conocimiento en vivo frente a un entrevistador;
- proyectos de IA «que generen valor real a las empresas»: MCPs, agentes y herramientas «de todo tipo».

También pide aprender de un proyecto que le regaló un arquitecto. La línea se trabaja spec-driven: primero el upstream
completo, con el autor como entrevistador humano antes de implementar.

Estado: upstream en borrador del 26 de noviembre de 2026, con la entrevista hecha ([entrevista.md](./entrevista.md)).
Ninguna spec hija se implementa sin el visto bueno del autor. Se aprueban una por una en [aprobacion.md](./aprobacion.md).

## Qué ordena esta spec

Esta es la spec paraguas. Define:
- para quién es la línea;
- la prueba de los 10 minutos;
- qué ya existe y se reutiliza;
- las nueve specs hijas y sus olas;
- las reglas que valen para todas.

El cómo vive en [plan.md](./plan.md) y las tareas por línea en [tasks.md](./tasks.md). Lo aprendido del proyecto de
referencia que compartió el arquitecto está en [research.md](./research.md): la versión pública y genérica. El informe
completo es privado y Git lo ignora.

## Para quién

Lo dijo el autor en la entrevista (pregunta 1):

| Público | Qué busca | Qué tiene que ver |
|---|---|---|
| Entrevistador de una empresa de producto con equipo remoto | AI Engineer o Applied AI Engineer | Agentes, MCP, evals, costo y observabilidad, funcionando |
| Líder técnico de una empresa de Colombia o Latam | Senior full-stack que mete IA al producto | Producto bien hecho, código real y entrega |
| Empresa o profesional que evalúa contratar a Camilo como consultor | Alguien que le resuelva un problema concreto | Caso de negocio, costo por tarea y una demo que se pueda comprar |

**No incluye:** Tech Lead ni arquitecto como cargo. La arquitectura se muestra como habilidad en los casos y en el
diseño de cada pieza, no como el rol que se busca.

## La prueba de los 10 minutos

En 10 minutos con el sitio, el entrevistador tiene que poder comprobar cuatro cosas (pregunta 2):

1. **Agentes que funcionan.** Le da una tarea a un agente y ve en vivo las herramientas que usa, la traza, el costo y
   las evals que lo miden. También puede intentar romperlo.
2. **Problemas de negocio resueltos.** Casos con números: el problema de una empresa, la solución con IA, el costo por
   tarea y el ahorro, con una demo que lo reproduce con datos ficticios.
3. **Código de calidad.** Código real explicado, pruebas, arquitectura y trazabilidad de la spec al código.
4. **Entrega rápida con IA.** El proceso spec-driven con agentes a la vista: de una idea a spec, plan, tareas, gates y
   código.

Cada spec hija dice cuál de las cuatro pruebas demuestra y entra como estación (o parte de una) en la ruta de la 042.

## Lo que ya existe y se reutiliza

Esta línea no reescribe nada de esto. Lo ordena en una ruta y suma lo que falta.

| Pieza | Spec | Prueba que ya sirve |
|---|---|---|
| Mini Cherced, el agente de voz que conoce el sitio | 018, 028, 036 | 1 |
| ¿Encajo en tu vacante? (A6) | 029 | 2 |
| Modo entrevista con tres pistas y acta | 030 | 1 |
| Caja de cristal del agente: traza, tokens y costo | 031 | 1 |
| Evals públicas y red team de Mini Cherced | 032 | 1 |
| Pitch de 60 segundos por caso | 033 | 2 |
| Diseño de sistemas en vivo | 034 | 1, 3 |
| Recorrido por el código | 035 | 3 |
| Trazas del AI Lab con cuenta (`lab_events`) | 038 | 1 |
| AI Lab: 18 experimentos en `content/ailab/catalog.ts` | 003, 020 | 1 |
| Casos, decisiones y pitches (`content/projects.ts`, `content/pitches.ts`) | 004, 033 | 2 |
| Vitrina de Synergos y su arquitectura | 009 | 3, 4 |
| De idea a spec, ADR y haiku (A7) | 025 | 4 |
| Propuesta de Cotejo, el revisor de specs, con su medición | 014 | 2, 3, 4 |

## Specs hijas

Los costos son estimados y cada spec hija los detalla.

| Spec | Qué hace | Pruebas | Ola | Depende de | Costo de API estimado | Llaves nuevas |
|---|---|---|---|---|---|---|
| [042](../042-ruta-de-10-minutos/spec.md) Ruta de 10 minutos | Modo entrevistador: cuatro estaciones, pruebas que él controla y un acta al final | 1, 2, 3, 4 | 1 | 029–035 | Casi cero (reusa) | Ninguna |
| [044](../044-mcp-publico-del-portafolio/spec.md) MCP público del portafolio | El entrevistador conecta su propio cliente de IA a un MCP remoto de solo lectura | 1, 3 | 1 | Índice público, 029 | Cero en modelos | Ninguna |
| [045](../045-tablero-de-ingenieria/spec.md) Tablero de ingeniería vivo | Métricas reales del repo: pruebas, specs ligadas a commits, despliegues, rendimiento y gasto de IA | 3, 4 | 1 | 032, 038 | Cero | Ninguna |
| [043](../043-tres-proveedores-y-arena/spec.md) Tres proveedores y arena | Puerto común Gemini, Claude y OpenAI, con enrutamiento por costo, fallback, tope mensual y una arena que los compara con evals | 1, 3 | 2 | 032 | Unos 0,013 USD por comparación en vivo con Gemini y Claude, más OpenAI cuando se elija su modelo | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` |
| [047](../047-cotejo-revisor-de-specs/spec.md) Cotejo | Revisor de specs local y determinista: CLI, GitHub Action, skill, MCP y demo en el navegador | 2, 3, 4 | 2 | 014 | Cero | Ninguna |
| [046](../046-del-pedido-a-la-spec-con-gates/spec.md) Del pedido a la spec con gates | Redactor, chequeos deterministas, revisores con rúbrica de otro proveedor, verificación adversarial, recomendación y decisión humana | 1, 4 | 2 | 043, núcleo de 047 | Entre 0,02 y 0,04 USD por corrida | Ninguna más |
| [048](../048-base-de-conocimiento-honesta/spec.md) Base de conocimiento honesta | MCP y agente sobre los documentos de una empresa ficticia: fuente, nivel de confianza y «no encontré» | 1, 2 | 3 | 043, 044 | Unos 0,004 USD por pregunta; el MCP no gasta | Ninguna más |
| [049](../049-plugins-por-profesion/spec.md) Plugins por profesión | Despacho (abogados) y Obra (ingeniero estructural) como productos: agente, MCP, evals y horas ahorradas | 2 | 3 | 043, 044 | Unos 0,008 USD por pregunta en Despacho y 0,003 USD por entrada en Obra | Ninguna más |
| [050](../050-agente-de-operaciones-pyme/spec.md) Agente de operaciones pyme | Cotiza, agenda y responde por una pyme ficticia, con aprobación humana antes de cada acción | 1, 2 | 3 | 043 | Unos 0,025 USD por conversación | Ninguna más |

## Olas y líneas de trabajo

Respuesta de la pregunta 9: cada spec es una línea de trabajo, un subagente en su propio worktree que reporta a este
chat. La sesión principal orquesta e integra. Las olas ordenan dependencias, no una fila: una línea arranca cuando su
spec está aprobada y sus dependencias están integradas.

- **Ola 1, sin llaves nuevas y con costo casi cero:**
  - L1 Ruta de 10 minutos (042);
  - L2 MCP público (044);
  - L3 Tablero de ingeniería (045).

  Las tres corren en paralelo.
- **Ola 2, modelos:**
  - L4 Tres proveedores y arena (043) y L6 Cotejo (047) arrancan en paralelo;
  - L5 Del pedido a la spec (046) arranca cuando estén integrados el puerto de modelos de la 043 y el núcleo
    determinista de la 047.
- **Ola 3, negocio:**
  - L7 Base honesta (048), L8 Plugins por profesión (049) y L9 Agente pyme (050);
  - todas sobre el puerto de la 043 y, la 048 y la 049, sobre el MCP de la 044.
- **Paralelismo:** como máximo tres líneas a la vez (P-4103), para cuidar el límite semanal y los despliegues del plan
  gratuito de Vercel.
- **Integración:** un push a `dev` por ola integrada. `main` solo con confirmación explícita del autor.

El detalle de las rutas de cada línea, los contratos que se congelan y el orden de integración están en
[plan.md](./plan.md).

## Reglas para todas las specs hijas

- **FR-4101** Cada spec hija declara qué pruebas de las cuatro demuestra y entrega su estación para la ruta de la 042.
- **FR-4102** Solo datos ficticios. No aparecen:
  - empresas reales, clientes ni precios de proveedores reales;
  - material de empleadores;
  - material del proyecto de referencia.

  Lo ficticio se marca como ficticio en pantalla.
- **FR-4103** Tope de gasto de IA para toda la línea, sumando los tres proveedores: la meta es 10 USD al mes y el techo
  duro, 25 USD (unos COP 82.000 con la TRM de 3.297 del 11 de noviembre de 2026).
  - Al pasar de 10 USD, el panel avisa.
  - Al llegar a 25 USD, todo lo que gasta API pasa a modo apagado con su mensaje hasta el mes siguiente.
  - Cada demo tiene además su tope por visitante, y cada proveedor su prepago o alerta de presupuesto (principio VIII).
  - Lo implementa la 043. Hasta entonces rigen los topes actuales de `lib/security/rate-limit.ts`.
- **FR-4104** Cada llave nueva cumple las cuatro condiciones del principio VIII:
  - está en la tabla del README;
  - vive solo en el servidor;
  - sin ella, la funcionalidad queda en modo apagado (en local, con simulador);
  - tiene tope de costo.

  Las crea el autor y nunca se leen sus valores.
- **FR-4105** Cada demo con modelo trae:
  - sus evals versionadas, como la 032 (al menos hechos, citas válidas y rechazos);
  - su caja de cristal, como la 031 (traza, tokens y costo).
- **FR-4106** Lo caro se pregenera una vez y se cachea. En local, cada demo tiene un simulador sin costo.
- **FR-4107** Del proyecto de referencia solo se aprende. No se copian a este repo ni a Synergos:
  - código, prosa ni diagramas;
  - nombres internos, hosts ni corpus.

  Lo público se cuenta con palabras propias, como patrones de la industria, y con crédito genérico. La decisión de
  integrar algo queda para después (P-4105).
- **FR-4108** Todo va en español y en inglés, es accesible (principio V) y se revisa en el celular contra la última
  vista aprobada. No se tocan las secciones aprobadas:
  - el hero del inicio;
  - las tres escenas de Sobre mí;
  - el genoma;
  - las tarjetas de carrera;
  - el móvil de la 006.

  Lo nuevo va en lugares nuevos.
- **FR-4109** Seguridad:
  - las entradas públicas se validan en el servidor y tienen límite (principio III);
  - los MCP y los agentes solo exponen información pública;
  - toda acción de un agente que cambie algo pide aprobación humana antes.
- **FR-4110** Pruebas:
  - solo las de lo que cambia, nunca la suite exhaustiva;
  - sin gastar la API real sin permiso del autor: las pruebas usan simuladores y dobles.

## Criterios de éxito de la línea

- **SC-4101** Una persona que no conoce el sitio termina la ruta de la 042 en 10 minutos o menos y se lleva un acta
  que marca las cuatro pruebas con evidencia enlazada. Se mide cronometrando al autor y a dos personas más.
- **SC-4102** El gasto real de IA de la línea no pasa de 25 USD en ningún mes, y en un mes típico queda en 10 USD o
  menos.
- **SC-4103** Cada spec hija construida tiene evals versionadas y su última corrida se ve en el tablero de la 045.
- **SC-4104** El repo público tiene cero datos reales de empresas o clientes y cero texto del proyecto de referencia.
  Antes de cada push se busca en el diff una lista de nombres prohibidos, que vive en la carpeta privada.
- **SC-4105** Las secciones aprobadas no cambian. Se comparan capturas del celular (390×844 y WebKit) contra la última
  vista aprobada.

## Constitución

La línea cabe en la constitución 3.0.0:
- las llaves nuevas van por el principio VIII;
- las líneas de trabajo, por el VII;
- las entradas públicas, por el III.

Sí propongo una enmienda MINOR (3.1.0) con dos reglas nuevas: el material de terceros o corporativo, y el tope mensual
total de IA. Está en [enmienda-constitucion.md](./enmienda-constitucion.md) y solo se aplica si el autor la aprueba.

## Riesgos principales

El detalle y las mitigaciones están en [plan.md](./plan.md).

| Riesgo | Mitigación |
|---|---|
| Nueve specs son mucho alcance | Aprobación spec por spec, olas por dependencia y entregas pequeñas por línea |
| El límite semanal corta líneas a la mitad, como el 8 de noviembre de 2026 | Máximo tres líneas a la vez, commits de avance en su rama y tareas cortas |
| Cada push a `dev` es un despliegue del plan gratuito de Vercel | Un push por ola integrada |
| El gasto de API se dispara | Tope por visitante, tope mensual total, prepago por proveedor y pregenerado |
| El proyecto de referencia es material de terceros sin licencia de uso público | FR-4107, informe privado y búsqueda de nombres prohibidos antes de cada push |
| El MCP público se abusa | Solo lectura, sin datos personales, límite por IP y respuestas cacheadas |
| Inyección de instrucciones en los agentes de las olas 2 y 3 | Evals de red team en cada demo y aprobación humana de acciones |
| Lo nuevo amontona secciones aprobadas | FR-4108 y capturas del celular antes de cada vista previa |

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-4101 | ¿Cómo se llama la línea en el sitio? | «Pruébame en vivo» / "Try me live" |
| P-4102 | ¿Dónde está la entrada a la ruta sin tocar secciones aprobadas? | Un enlace de texto en la ventana «Para reclutadores» (como el de los pitches de la 033) y un acceso al inicio del AI Lab |
| P-4103 | ¿Cuántas líneas en paralelo como máximo? | Tres |
| P-4104 | ¿Cómo se acredita al arquitecto en lo público? | Crédito genérico, sin nombre, hasta que él autorice otra cosa |
| P-4105 | ¿Confirmas con el arquitecto que las ideas generales se pueden usar en proyectos personales públicos? | Hasta confirmarlo, solo patrones genéricos de la industria (los que también aparecen en Spec Kit, OpenSpec o la literatura de LLM-as-judge), sin mecanismos calcados |
| P-4106 | ¿Cotejo y los servidores MCP de los plugins van en repos aparte? | Sí: repos públicos con licencia MIT, y el sitio los consume como paquete |
