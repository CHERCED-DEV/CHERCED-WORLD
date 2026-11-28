# 041 — Paquete de aprobación

Para el autor, como entrevistador humano. Respondió en la pregunta 10 que se aprueba spec por spec. Nada se implementa
sin su visto bueno: una línea arranca solo cuando su spec dice «Aprobada» aquí y sus dependencias están integradas.

## Cómo se aprueba

Responde en el chat, por ejemplo:
- «apruebo 042, 044 y 045»;
- «043 con cambios: sin OpenAI por ahora»;
- «rechazo 049».

Yo marco tu decisión con la fecha y tus palabras en el registro del final.

## Qué se va a hacer

1. Una **ruta de 10 minutos** ordena lo que el sitio ya tiene en cuatro pruebas: agentes, negocio, código y entrega.
   El entrevistador sale con un acta.
2. Se suman tres capacidades:
   - un **MCP público** que el entrevistador conecta desde su propio cliente de IA;
   - un **tablero de ingeniería** con métricas reales;
   - **del pedido a la spec**, con revisores de otro proveedor y decisión humana.
3. **Tres proveedores** (Gemini, Claude y OpenAI) detrás de un puerto común, con una arena que los compara con las
   mismas evals y un techo de 25 USD al mes para toda la línea.
4. Cuatro **proyectos con caso de negocio**, todos con datos ficticios:
   - Cotejo, el revisor de specs;
   - una base de conocimiento honesta;
   - Despacho y Obra como productos;
   - un agente de pyme con aprobación humana.
5. Todo como **líneas en paralelo**, como máximo tres a la vez, que reportan a este chat. Un push a `dev` por ola.

## Lo que ya decidiste en la entrevista

Está en [entrevista.md](./entrevista.md):
- **Públicos:** AI Engineer remoto, senior full-stack con IA y consultoría. No Tech Lead ni arquitecto como cargo.
- **La prueba de los 10 minutos:** las cuatro.
- **Capacidades:** las cuatro. **Proyectos:** los cuatro.
- **Gasto:** meta de 10 USD y techo de 25 USD al mes.
- **Proveedores:** Gemini, Claude y OpenAI.
- **Proyecto de referencia:** solo aprender por ahora. El informe es privado y lo público, genérico.
- **Modo de trabajo:** líneas internas que reportan aquí y aprobación spec por spec.

## Suposiciones que tomé por ti

Son los valores por defecto que más cambian el resultado si no los compartes. El resto está en la tabla de preguntas
de cada spec.

| # | Suposición | Dónde | Si está mal |
|---|---|---|---|
| 1 | La ruta vive en `/ai-lab/ruta` y entra por un enlace de texto en la ventana «Para reclutadores», como el de los pitches. Esa sección está aprobada | 041 P-4102, 042 FR-4210 | Queda solo el acceso desde el AI Lab |
| 2 | Hay una pastilla pequeña «Volver a la ruta» en las páginas de las estaciones mientras la ruta está activa | 042 P-4204 | Se quita y la ruta sigue funcionando |
| 3 | El MCP público va sin token en v1: es de solo lectura sobre lo publicado, con límite por IP. Su núcleo es propio, sin el SDK oficial | 044 P-4401, P-4402 | Se suma un token o se cambia al SDK. La 048 y la 049 heredan la decisión |
| 4 | El tablero publica el gasto de IA del mes y suma el reporte de Vitest al `prebuild` | 045 P-4503, P-4504 | El gasto queda solo en el panel y las pruebas se cuentan de otra forma |
| 5 | La arena en vivo y la 046 piden cuenta para correr en vivo; sin cuenta se ven las corridas grabadas | 043 P-4305, 046 P-4602 | Más gasto sin cuenta, o menos demos en vivo |
| 6 | El techo mensual se lleva en una colección nueva `ai_budget` de la MongoDB que ya existe | 043 FR-4308 | Sin ella no hay techo total, solo topes por visitante |
| 7 | Dos dependencias nuevas: `@anthropic-ai/sdk` y `openai` | 043 plan | Se llama a sus API con `fetch`, como hoy con Gemini |
| 8 | Cada consola tiene un límite de 5 USD sin recarga automática | 043 P-4309 | Más margen o menos |
| 9 | Cotejo va en un repo público nuevo, `CHERCED-DEV/cotejo`, con licencia MIT | 047 P-4714, 041 P-4106 | Queda dentro del sitio, sin CLI ni Action |
| 10 | Los datos ficticios son inventados por mí y los revisas antes de publicarlos: Rodamundo (bicicletas eléctricas), la floristería Girasol de Papel en Armenia y los casos de Despacho y Obra | 048 P-4802, 049 P-4904, 050 P-5002 | Se cambian por los tuyos |
| 11 | Las horas ahorradas de Despacho y Obra se muestran como supuestos marcados si no tienes mediciones reales | 049 P-4902 | Se muestran tus cifras, con su fuente |
| 12 | Como máximo tres líneas en paralelo | 041 P-4103 | Más rápido y con más riesgo de que el límite semanal corte líneas |

## Spec por spec

Las cifras de costo son estimadas, en USD, con la TRM de 3.297. El techo de 25 USD al mes manda sobre la suma de los
peores casos.

### 042 — Ruta de 10 minutos · ola 1 · L1

- **Qué hace:** cuatro estaciones en 10 minutos sobre lo que ya existe, un «Rómpelo» con la batería de red team y un
  acta en Markdown. Produce el contrato de estaciones.
- **Depende de:** 029–035 y 038, todas construidas.
- **Costo:** la ruta no gasta. Lo que abre cuesta unos 0,12 USD por entrevistador; 50 rutas al mes son unos 6 USD.
- **Llaves nuevas:** ninguna.
- **Tamaño:** 14 FR, 5 SC, 6 preguntas y 34 tareas.
- **Riesgo principal:** tocar la ventana «Para reclutadores» (suposiciones 1 y 2).
- **Necesita de ti:**
  - dos personas para cronometrar la ruta (SC-4201);
  - permiso para grabar una traza real de respaldo, unos 0,10 USD (P-4206).
- **Decisión:** ☑ Aprobada el 26 de noviembre de 2026 · ☐ Con cambios · ☐ Rechazada · ☐ Más tarde

### 044 — MCP público del portafolio · ola 1 · L2

- **Qué hace:** un MCP remoto de solo lectura en `/api/mcp`, sobre casos, decisiones, evidencia, carrera, posts y la
  ruta. Incluye un encaje con vacante sin gastar modelo (el simulador de la 029) y una página `/mcp` con
  instrucciones y el catálogo en vivo. Produce el núcleo MCP para la 048 y la 049.
- **Depende de:** el índice público y la 029.
- **Costo:** cero en modelos. El tope global es de 3.000 llamadas al día.
- **Llaves nuevas:** ninguna.
- **Tamaño:** 12 FR, 5 SC, 6 preguntas y 38 tareas.
- **Riesgo principal:** el abuso de un endpoint público. Se mitiga con solo lectura, límites, cero datos personales y
  pruebas de que no filtra nada privado.
- **Necesita de ti:** decidir la suposición 3.
- **Decisión:** ☑ Aprobada el 26 de noviembre de 2026 · ☐ Con cambios · ☐ Rechazada · ☐ Más tarde

### 045 — Tablero de ingeniería vivo · ola 1 · L3

- **Qué hace:** `/ingenieria` con métricas reales:
  - pruebas;
  - specs ligadas a commits;
  - despliegues;
  - presupuestos de rendimiento y accesibilidad;
  - evals;
  - gasto de IA del mes.

  La historia de git la toma un script local en cada ola.
- **Depende de:** 032 y 038. El gasto del mes por proveedor llega con la 043; hasta entonces usa `lib/ai/spend.ts`.
- **Costo:** cero.
- **Llaves nuevas:** ninguna.
- **Tamaño:** 12 FR, 5 SC, 6 preguntas y 41 tareas.
- **Riesgo principal:** mostrar números que no existen todavía. Por ejemplo, las evals de la 032 no tienen ninguna
  corrida publicada (`runs: []`). La spec lo dice en pantalla y no inventa porcentajes.
- **Necesita de ti:** decidir la suposición 4 y P-4502 (si el tablero reemplaza la estación núcleo «de spec a
  commit»).
- **Decisión:** ☑ Aprobada el 26 de noviembre de 2026 · ☐ Con cambios · ☐ Rechazada · ☐ Más tarde

### 043 — Tres proveedores y arena · ola 2 · L4

- **Qué hace:**
  - un puerto común con enrutamiento por costo, fallback, herramientas normalizadas y el techo mensual con aviso a
    10 USD y corte a 25 USD;
  - la arena (A10), que compara a los tres con las mismas evals y un juez de otro proveedor.

  Es la base de la 046 y de la ola 3.
- **Depende de:** 032 y 038.
- **Costo:**
  - unos 0,013 USD por comparación en vivo con Gemini y Claude, más OpenAI;
  - tope de 0,05 USD por comparación;
  - la corrida pregenerada, unos 0,16 USD más OpenAI.
- **Llaves nuevas:** `ANTHROPIC_API_KEY` y `OPENAI_API_KEY`. Las creas tú, con límite en cada consola.
- **Tamaño:** 19 FR, 9 SC, 9 preguntas y 53 tareas. Es la más grande.
- **Riesgo principal:** que los precios y los modelos cambien. Los de Claude son la referencia del 3 de noviembre de
  2026 y los de OpenAI quedan por elegir; se confirman el día de implementar.
- **Necesita de ti:**
  - las dos llaves y la colección `ai_budget` en Atlas;
  - aprobar la tabla de modelos por tarea (P-4301);
  - el aviso por el buzón (P-4304);
  - permiso para `arena:run`.
- **Decisión:** ☑ Aprobada el 27 de noviembre de 2026 · ☐ Con cambios · ☐ Rechazada · ☐ Más tarde

### 047 — Cotejo, revisor de specs · ola 2 · L6

- **Qué hace:** convierte en producto la propuesta de la 014:
  - un núcleo determinista y puro;
  - CLI, GitHub Action con SARIF, skill de Claude Code y MCP;
  - una demo en el AI Lab (A11), con modelos pesados solo si das consentimiento.

  Su núcleo lo consume la 046.
- **Depende de:** la 014.
- **Costo:** cero de API. Las descargas son opcionales: 118, 339 u 87 MB.
- **Llaves nuevas:** ninguna.
- **Tamaño:** 20 FR, 6 SC, 14 preguntas y 46 tareas. Es la que más preguntas abiertas tiene, porque recoge las 9 de
  la 014.
- **Riesgo principal:** el corpus sintético infla la precisión. Por eso pide un corpus difícil escrito por personas.
- **Necesita de ti:**
  - tu visto bueno explícito para crear el repo público (P-4714);
  - si se publica en npm (P-4710);
  - unos 60 pares de requisitos para el corpus difícil (P-4705).
- **Decisión:** ☑ Aprobada el 27 de noviembre de 2026 · ☐ Con cambios · ☐ Rechazada · ☐ Más tarde. El repo se
  construye en local y sin remoto hasta tu visto bueno para hacerlo público (P-4714).
- **P-4714:** ☑ visto bueno el 27 de noviembre. `CHERCED-DEV/cotejo` se crea público cuando el núcleo esté listo y
  revisado, con su código y el release que consume el sitio. npm sigue fuera (P-4710).

### 046 — Del pedido a la spec con gates · ola 2 · L5

- **Qué hace:** el entrevistador escribe un pedido y ve el recorrido completo:
  1. una spec breve;
  2. los chequeos deterministas de Cotejo;
  3. los revisores con rúbrica, de un proveedor distinto al redactor;
  4. la verificación de los hallazgos dudosos;
  5. una recomendación, nunca una aprobación automática;
  6. su decisión.

  Tiene un máximo de dos rondas y una regla de parada propia (A12).
- **Depende de:** el puerto de la 043 y el núcleo de la 047.
- **Costo:** de 0,02 a 0,04 USD por corrida, con tope de 0,05 USD. La batería de evals cuesta unos 0,40 USD.
- **Llaves nuevas:** ninguna más.
- **Tamaño:** 19 FR, 7 SC, 7 preguntas y 42 tareas.
- **Riesgo principal:** parecerse demasiado al proyecto de referencia. El diseño, el vocabulario y la regla de parada
  son propios y se basan en patrones generales de la industria (FR-4107).
- **Necesita de ti:**
  - permiso para `evals:gates` y para grabar tres corridas reales;
  - P-4605 (cómo suma su resultado al acta de la ruta).
- **Decisión:** ☑ Aprobada el 27 de noviembre de 2026 · ☐ Con cambios · ☐ Rechazada · ☐ Más tarde. Arranca cuando
  estén integrados el puerto de la 043 y el núcleo de Cotejo.

### 048 — Base de conocimiento honesta · ola 3 · L7

- **Qué hace:** el MCP `/api/mcp/empresa` y un agente (K1) sobre los documentos de Rodamundo, una empresa ficticia de
  bicicletas eléctricas. Cada respuesta trae su fuente, su nivel de confianza con la causa y lo que no encontró.
- **Depende de:** 043 y 044.
- **Costo:** unos 0,004 USD por pregunta; el MCP no gasta. Unos 0,40 USD en un mes típico.
- **Llaves nuevas:** ninguna más.
- **Tamaño:** 16 FR, 6 SC, 6 preguntas y 40 tareas.
- **Riesgo principal:** inyección de instrucciones dentro de los documentos. La batería de evals lo cubre.
- **Necesita de ti:** revisar el corpus ficticio antes de publicarlo (P-4802).
- **Decisión:** ☐ Aprobada · ☐ Con cambios · ☐ Rechazada · ☐ Más tarde

### 049 — Plugins por profesión · ola 3 · L8

- **Qué hace:** Despacho y Obra como productos (O1): agente, un MCP por profesión, evals y horas ahorradas por caso.
  Reusa sin cambios las vitrinas y el cálculo que ya existen. Despacho no responde derecho de memoria.
- **Depende de:** 043 y 044.
- **Costo:** unos 0,008 USD por pregunta en Despacho y 0,003 USD por entrada en Obra. Unos 0,35 USD en un mes típico.
- **Llaves nuevas:** ninguna más.
- **Tamaño:** 17 FR, 6 SC, 6 preguntas y 43 tareas.
- **Riesgo principal:** que se cuele material real de tus clientes o precios reales de proveedores. Todo es
  inventado y lo revisas tú.
- **Necesita de ti:**
  - las horas medidas, si las tienes (P-4902);
  - revisar los casos (P-4904);
  - no enlazar el repo del espacio legal hasta cerrar P-420 (P-4903).
- **Decisión:** ☐ Aprobada · ☐ Con cambios · ☐ Rechazada · ☐ Más tarde

### 050 — Agente de operaciones pyme · ola 3 · L9

- **Qué hace:** un agente (B1) que atiende por la floristería ficticia Girasol de Papel, de Armenia:
  - responde, cotiza con su catálogo, agenda y prepara pedidos;
  - toda acción espera tu aprobación en el papel del dueño;
  - trae un tablero del dueño y evals de red team.

  WhatsApp real queda como visión.
- **Depende de:** la 043.
- **Costo:** unos 0,025 USD por conversación. Unos 0,50 USD en un mes típico.
- **Llaves nuevas:** ninguna más.
- **Tamaño:** 16 FR, 7 SC, 6 preguntas y 41 tareas.
- **Riesgo principal:** que un cliente le saque al agente un descuento o los datos de otro cliente. Lo cubren las
  guardas en el servidor y el red team.
- **Necesita de ti:** revisar el catálogo, las reglas y la agenda ficticias (P-5002).
- **Decisión:** ☐ Aprobada · ☐ Con cambios · ☐ Rechazada · ☐ Más tarde

### 051 — Forja, de la spec de una prueba técnica a una solución probada · ola 2 · L10

Sumada el 26 de noviembre de 2026, después de integrar la ola 1, a pedido tuyo: «conecte este MCP a su máquina y
corra tal skill con tal capacidad y que la prueba técnica pueda resolverse de una».

- **Qué hace:** un arnés de agentes para pruebas técnicas:
  - `/forja reto.md --stack angular --minutos 45` lee la prueba y la normaliza en requisitos con id, planifica con
    decisiones escritas, construye con pruebas primero, verifica con una matriz requisito → prueba, pasa por un
    revisor que no escribió el código y deja `ENTREGA.md`;
  - plugin de Claude Code con comando, skills, subagentes, hooks y packs de Angular, .NET, Next.js y NestJS;
  - MCP del kit y prompt `solve_technical_test` para otros clientes;
  - evals con cinco encargos de muestra y una suite de aceptación que Forja no ve.

  Se usa a la vista y con permiso del entrevistador. El encargo y el código no salen de la máquina.
- **Depende de:** la 044 (ya integrada) y, si ya está, el núcleo de la 047.
- **Costo:** cero en el sitio, porque razona el modelo del cliente de quien la corre. Las corridas de evals usan tu
  Claude Code en local y solo corren con tu permiso.
- **Llaves nuevas:** ninguna.
- **Tamaño:** 16 FR, 7 SC, 8 preguntas y 42 tareas.
- **Riesgo principal:** que se parezca al proyecto de referencia o que se perciba como hacer trampa. Lo cubren el
  diseño propio (FR-5116), la regla de transparencia (FR-5101) y la publicación en dos tiempos (FR-5115): hasta
  cerrar P-4105, el repo es privado y Forja corre solo en tu máquina.
- **Necesita de ti:**
  - el nombre (P-5101, por defecto «Forja»);
  - crear el repo privado `CHERCED-DEV/forja` (P-5102), aunque la línea puede empezar en local;
  - autorizar las corridas reales de evals (P-5105);
  - cerrar P-4105 antes de la fase B.
- **Decisión:** ☑ Aprobada el 26 de noviembre de 2026 · ☐ Con cambios · ☐ Rechazada · ☐ Más tarde

### Enmienda de la constitución 3.0.0 → 3.1.0

- **Qué cambia:**
  - el techo mensual total de IA en el principio VIII;
  - el tratamiento del material de terceros o corporativo en las restricciones técnicas.

  Detalle en [enmienda-constitucion.md](./enmienda-constitucion.md).
- **No bloquea la ola 1.**
- **Decisión:** ☐ Aprobada · ☐ Con cambios · ☐ Rechazada · ☐ Más tarde

## Orden recomendado para aprobar

1. **042, 044 y 045.** No piden llaves y casi no gastan. Pueden arrancar apenas las apruebes.
2. **043, 047 y 051.** La 043 necesita tus llaves para usar Claude y OpenAI de verdad, pero se construye con
   simulador. La 047 no gasta nada, y la 051 tampoco: su fase A vive en un repo aparte y toma el núcleo de la 047
   cuando salga.
3. **046,** cuando la 043 y el núcleo de la 047 estén integrados.
4. **048, 049 y 050,** sobre la 043 y la 044.

## Riesgos que aceptas al aprobar

El detalle está en [plan.md](./plan.md). Los cinco que más pesan:
- **Alcance:** son diez specs y más de 410 tareas. La aprobación spec por spec y las olas lo contienen.
- **Límite semanal:** puede cortar líneas a la mitad. Por eso van tres a la vez como máximo, con commit por fase.
- **Gasto:** es real, pero tiene techo. Ninguna corrida que gaste se hace sin tu permiso.
- **Secciones aprobadas:** las entradas a la ruta tocan la ventana «Para reclutadores» y el AI Lab, solo con un
  enlace de texto cada una.
- **Material de terceros:** nada del proyecto de referencia entra al repo. Una lista privada de nombres revisa cada
  diff.

## Lo que necesita de ti

- [ ] Decidir cada spec y la enmienda (arriba).
- [ ] Consultar con el arquitecto si las ideas generales se pueden usar en proyectos públicos y con qué crédito
  (P-4105).
- [ ] Ola 2:
  - crear `ANTHROPIC_API_KEY` y `OPENAI_API_KEY` con límite en cada consola, siguiendo `configurar-claude.md` y
    `configurar-openai.md` de la 043 (5 USD de prepago y sin recarga automática);
  - crear la colección `ai_budget` en Atlas;
  - aprobar los modelos que propone la 043 (P-4301), con precios en USD por millón de tokens, entrada y salida,
    consultados el 27 de noviembre:
    - OpenAI: `gpt-6-luna` (0,10 / 0,50) para `cheap`, `gpt-6.2-sol` (2 / 10) para `balanced` y `gpt-6.2-astra`
      (8 / 40) para `strong`;
    - el `strong` de Gemini: `gemini-4-argon`, a 2 / 10 hasta el 30 de noviembre y a 4 / 20 desde el 1 de diciembre;
  - decidir el tope de la 046 con los tres proveedores: con 0,05 USD por corrida, para después de la ronda 1. Se puede
    subir el tope o aceptar que pare ahí;
  - Cotejo (047): probar las capas semánticas con los modelos reales (solo se probaron con dobles), confirmar el INP
    y los fps en un celular real sobre la vista previa, y cronometrarte con y sin Cotejo (T4739).
- [x] Dar el visto bueno para crear el repo público de Cotejo. Dado el 27 de noviembre.
- [ ] Forja (051): crear el repo privado `CHERCED-DEV/forja`, probarlo en una sesión tuya con pantalla compartida
  y, después de P-4105, hacer público el repo. Ya elegiste la corrida grabada (`cruzado-turnos`) y que los requisitos
  verificados por comando cuenten como cubiertos.
- [x] Forja, fase C (la firma CHERCED): aprobada el 27 de noviembre con los valores por defecto.
- [x] Forja, fase C: autorizar las tres corridas de front con la firma (P-5105). Autorizadas y corridas el 27 de
  noviembre.
- [x] Forja, fase C: decidir SC-5110. La firma subió la fase construir 3,07 minutos de media y el criterio pide 3 o
  menos; casi todo es variación entre corridas. Dado por cumplido el 27 de noviembre.
- [ ] Revisar los datos ficticios de la 048, la 049 y la 050 antes de publicarlos.
- [x] Decidir la actualización de seguridad de Next. El sitio usaba 16.4.3 y `npm audit` le marcaba siete avisos
  moderados (de 16.0.0 a 16.4.4). Los corrige 16.4.6, del 9 de noviembre, que no cambia de versión mayor y también
  trae `eslint-config-next` 16.4.6. Revisado el 27 de noviembre contra el código:
  - **No aplican cinco:** tres piden `'use cache'` y el sitio solo usa `unstable_cache`; otro pide Cache Components,
    que no está encendido; y el de respuestas reenviadas es para sitios propios, no para Vercel.
  - **Aplican poco dos:** el salto del rechazo de SVG en la optimización de imágenes (las SVG ya van con `unoptimized`
    y solo se sirven imágenes locales de `/assets` y `/capsule`) y el de cookies HttpOnly en rutas Edge (no hay rutas
    Edge declaradas).
  - **Hecho el 27 de noviembre:** `next`, `@next/mdx` y `eslint-config-next` en 16.4.6, en un cambio aparte. Los
    avisos de `next` desaparecen. `npm audit` sigue marcando siete moderados de otra cadena que ya estaba antes:
    `minimatch` dentro de `typescript-eslint`, que solo corre en el lint y no llega al sitio.
- [ ] Conseguir dos personas que cronometren la ruta.
- [ ] Autorizar, cuando quieras, las corridas que gastan:
  - la traza de respaldo, unos 0,10 USD;
  - `arena:run`, unos 0,16 USD más OpenAI;
  - `evals:gates`, unos 0,80 USD: la batería cuesta unos 0,60 (el plan calculaba 0,40) y las seis corridas grabadas,
    unos 0,20.

## Registro de decisiones

| Fecha | Spec | Decisión | Palabras del autor |
|---|---|---|---|
| 26 de noviembre de 2026 | 042, 044 y 045 | Aprobadas. Sus preguntas abiertas van con su valor por defecto | «Apruebo 042, 044 y 045» |
| 26 de noviembre de 2026 | 051 (nueva) | Pedida y entrevistada; queda para tu aprobación. La corren ambos; Claude Code más MCP; Angular, .NET, Next.js y NestJS; diseño propio, con P-4105 antes de publicar | «Eso del MCP está muy bacano, pero le falta» |
| 26 de noviembre de 2026 | 051 | Aprobada. Sus preguntas abiertas van con su valor por defecto; la fase B sigue esperando a P-4105 | «Apruebo la 051» |
| 27 de noviembre de 2026 | 051 | Corrida grabada: `cruzado-turnos` | «cruzado-turnos» |
| 27 de noviembre de 2026 | 051 | Los requisitos verificados por un comando que corrió Forja cuentan como cubiertos | «Sí, que cuenten» |
| 27 de noviembre de 2026 | 051, fase C | Aprobada con los valores por defecto de P-5109 a P-5112 | «Apruebo la fase C con los valores por defecto» |
| 27 de noviembre de 2026 | 051, fase C | Las tres corridas con la firma, autorizadas | «Sí, las tres» |
| 27 de noviembre de 2026 | 051, fase C | SC-5110 dado por cumplido (3,07 minutos de media contra 3, por variación entre corridas) | «Darlo por cumplido» |
| 27 de noviembre de 2026 | Next | Subir `next`, `@next/mdx` y `eslint-config-next` a 16.4.6 en un cambio aparte | «Sí, súbelo» |
| 27 de noviembre de 2026 | 043, 047 y 046 | Aprobadas, con sus preguntas abiertas en su valor por defecto. Siguen esperando lo que publica o gasta: las llaves, `ai_budget`, los modelos de OpenAI, el repo público de Cotejo, `arena:run` y `evals:gates`. La 048, la 049 y la 050 van después, en la ola 3 | «y sigue con las otras specs» |
| 27 de noviembre de 2026 | 047 | P-4714: crear el repo público `CHERCED-DEV/cotejo` cuando el núcleo esté listo | «Sí, créalo» |
