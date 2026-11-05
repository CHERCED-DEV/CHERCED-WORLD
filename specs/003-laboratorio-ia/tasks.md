# Tasks: Laboratorio de IA (003)

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Catálogo**: [catalogo.md](./catalogo.md) · **Base**:
la 004 integrada · **Rama**: `003-laboratorio-ia`

**Alcance**: solo lo que no depende del camino B ni de un [confirmar]. Las historias HC-1 a HC-6 de la spec no tienen
tareas.

**Formato**: `- [ ] T7xx [P] [USx] Descripción con ruta`.

- `[P]` marca una tarea que puede correr en paralelo con las demás de su lane.
- **BLOQUEADA** lleva la pregunta que la frena.

**Reglas para todas las lanes**:

- Worktree `.worktrees/X<n>`, rama `lane/X<n>` y solo sus rutas.
- Cierra con `npm run verify` y sus e2e en verde, con su `E2E_PORT` (3130 a 3135).
- Las pruebas no descargan modelos: usan dobles de los workers. Las mediciones con modelos reales se hacen en la vista
  previa.
- Los datos de las vitrinas son inventados. Sin nombres internos del empleador, material de clientes ni rutas privadas.

## Precondición (orquestador)

- [ ] T701 Confirmar que la 004 está integrada. Crear la rama `003-laboratorio-ia` y los worktrees `.worktrees/X0` a
  `.worktrees/X5`.

## X0 Foundation del laboratorio (va primero y congela con `x0-frozen`)

Rutas: `app/[lang]/ai-lab/**`, `components/ailab/shell/**`, `lib/ailab/core/**`, `content/ailab/catalog.ts`,
`content/i18n/{es,en}/ailab.json`, `tests/unit/x0/**` y `tests/e2e/x0/**`, más los archivos de las enmiendas A-701 a
A-708.

- [ ] T702 A-701: `'ailab'` en `namespaces` de `lib/i18n/config.ts`, y `content/i18n/{es,en}/ailab.json` con el copy
  base de la spec y las etiquetas de estado, dónde corre, consentimiento, borrado y temas (FR-370).
- [ ] T703 A-702: `LabTheme`, `LabStatus`, `LabDownload` y `LabExperiment` en `content/types.ts` (plan, modelo de
  datos).
- [ ] T704 [US1] `content/ailab/catalog.ts` con los 11 experimentos del alcance (FR-302):
  - pesos de research §2 a §4;
  - privacidad por experimento;
  - tarjetas Decisión · Por qué · Trade-off sacadas de idea.md y research.md, sin datos nuevos y con revisión del
    autor;
  - fragmento de código y `repoPath` en este repo, que es público.
- [ ] T705 [US1] Shell en `components/ailab/shell/` (FR-303, FR-304):
  - `LabPage.tsx`, con grupos por tema;
  - `LabCard.tsx`, con las ranuras `demo`, `how` y `code`, y la demo cargada con `next/dynamic` y `ssr: false`;
  - `StatusBadge.tsx` y `RunsInBadge.tsx`;
  - el aviso sin JS (`ailab.noscript`).
- [ ] T706 [US1] `app/[lang]/ai-lab/page.tsx`, con `pageMetadata` y renderizado en el servidor, y
  `app/[lang]/ai-lab/opengraph-image.tsx` con la plantilla de la 004 (FR-301).
- [ ] T707 [P] [US1] Consentimiento: `components/ailab/shell/ConsentDialog.tsx` y `lib/ailab/core/consent.ts`
  (FR-310, FR-311):
  - `requestDownload({ experiment, resource, bytes, host })`;
  - consentimiento por experimento y por sesión, que se puede retirar.
- [ ] T708 [P] Harness de workers en `lib/ailab/core/worker.ts` (FR-330, R-706):
  - `createLabWorker`, con mensajes con tipo;
  - pausa con `visibilitychange`, cancelación con `AbortSignal` y terminación al cerrar;
  - como máximo dos activos a la vez.
- [ ] T709 [P] [US1] Almacenamiento en `lib/ailab/core/store.ts` (FR-312, FR-313):
  - `labStore` sobre IndexedDB `cw-ailab`, con versión;
  - `clearAll()`, que también borra la caché de modelos;
  - el botón "Borrar lo que el laboratorio guardó" en `LabPage.tsx`;
  - funciona sin almacenamiento disponible (modo privado).
- [ ] T710 A-703: "Abrir el AI Lab" en el registro de comandos y `runPaletteCommand(id)` exportado, en
  `components/experience/palette-model.ts`.
- [ ] T711 [P] A-704: mover `AdrCards` de `components/site/portfolio/` a `components/ui/AdrCards.tsx` y actualizar la
  importación del caso de estudio.
- [ ] T712 [P] A-705 y A-707: enlace a `/ai-lab` en `components/shell/SiteFooter.tsx`, y `/ai-lab` en `PUBLIC_PATHS` de
  `app/sitemap.ts`.
- [ ] T713 [P] A-706: sección del laboratorio en la política de privacidad, en `content/site.ts`: qué se descarga, qué
  queda en el navegador, cómo borrarlo y que nada se envía (FR-322).
- [ ] T714 A-708: `@huggingface/transformers` en `package.json`, con la justificación del plan (FR-371). P-3k quedó
  aprobada por el autor el 2026-11-04. Se fija la versión exacta y solo se importa dentro de los workers.
- [ ] T715 Pruebas:
  - `tests/unit/x0/consent.test.ts`, `store.test.ts` y `worker.test.ts`;
  - `tests/e2e/x0/ai-lab.spec.ts`: 0 descargas al cargar (SC-301), sin JS, cancelar el consentimiento, borrar, ES y EN.
- [ ] T716 `npm run verify` y las e2e de x0, p0 y p6 en verde. Tag `x0-frozen`.
- [ ] T717 **BLOQUEADA (P-3h)**: la entrada "AI Lab" en el menú principal, entre Portafolio y Blog. Es una enmienda del
  header (`components/shell/`), cuando el autor lo apruebe.

## X1 Voz (después de `x0-frozen`)

Rutas: `components/ailab/voice/**`, `lib/ailab/voice/**`, `content/ailab/voice-commands.ts`, `tests/unit/x1/**` y
`tests/e2e/x1/**`.

- [ ] T720 [US2] Worker de Whisper en `lib/ailab/voice/whisper.worker.ts` (FR-350, R-701):
  - modelos tiny, base y small;
  - WebGPU si existe y, si no, WASM;
  - el consentimiento viene de `requestDownload` antes de cargar.
- [ ] T721 [P] [US2] Exportación `.txt` y `.srt` en `lib/ailab/voice/export.ts`, con pruebas unitarias del formato SRT.
- [ ] T722 [US2] `components/ailab/voice/Transcriber.tsx`:
  - grabar con `MediaRecorder` o subir un archivo;
  - marcas de tiempo y tiempo medido en el equipo;
  - micrófono negado → ofrecer subir;
  - aviso para audios de más de 10 minutos;
  - selector de modelo de respaldo.
- [ ] T723 [US2] Medir SC-303 en la vista previa, en un portátil de gama media, y fijar el modelo por defecto en
  `content/ailab/catalog.ts` (R-701). Se mide cuando la máquina no esté corriendo la suite.
- [ ] T724 [US5] Navega hablando (FR-351, R-702):
  - `content/ailab/voice-commands.ts`;
  - el emparejador de `lib/ailab/voice/commands.ts`;
  - `components/ailab/voice/VoiceNav.tsx`, con `runPaletteCommand`, alternativa escrita y anuncio del comando
    ejecutado.
- [ ] T725 [P] [US10] Texto → voz (FR-359, FR-321): `lib/ailab/voice/tts.ts` y `components/ailab/voice/TextToVoice.tsx`.
  - Voces por idioma.
  - Aviso si la voz elegida es en línea (`localService === false`).
  - Reproducir, pausar y detener desde el teclado.
- [ ] T726 [P] [US10] Motor de lectura de posts (FR-359):
  - `readPost(target, lang)` en `lib/ailab/voice/tts.ts`, que lee solo el cuerpo, sin código ni texto alternativo
    decorativo;
  - una demo con un post de ejemplo;
  - es el contrato que usará la tarea T628 de la 005.
- [ ] T727 **BLOQUEADA (P-3e)**: nombrar el dictador de voz del autor y enlazar su repo en V1. Por defecto, el copy va
  sin nombre.
- [ ] T728 Pruebas y cierre:
  - `tests/unit/x1/commands.test.ts`: frases en ES y EN y desconocidas;
  - `tests/e2e/x1/voice.spec.ts`: con worker doble, teclado, alternativa escrita y aviso de voz en línea;
  - `npm run verify` y e2e de x1 en verde.

## X2 Plugins y búsqueda (después de `x0-frozen`)

Rutas: `components/ailab/plugins/**`, `components/ailab/search/**`, `lib/ailab/skill/**`, `lib/ailab/search/**`,
`content/ailab/plugin-example/**`, `tests/unit/x2/**` y `tests/e2e/x2/**`.

- [ ] T730 [US8] Medir el costo en el build de precalcular los vectores de e5-small (R-703): tiempo extra y si el
  modelo se baja en cada build. Se mide en la vista previa, no en esta máquina mientras corra la suite. El resultado
  decide T734.
- [ ] T731 [P] [US3] Anatomía de un plugin (FR-352):
  - `content/ailab/plugin-example/` con un plugin neutral (`plugin.json`, una skill, un comando, un hook y un servidor
    MCP de ejemplo);
  - `components/ailab/plugins/PluginExplorer.tsx`, con `role="tree"` y una explicación por archivo.
- [ ] T732 [P] [US3] Crea tu skill (FR-353): `lib/ailab/skill/generate.ts`, que valida `name` y `description` y genera
  el `SKILL.md`, y `components/ailab/plugins/SkillForm.tsx`, con errores por campo y descarga desde el navegador.
- [ ] T733 [US8] Caja de cristal en modo palabras (FR-357): `lib/ailab/search/glassbox.ts`, sobre el cliente del índice
  que ya existe, y `components/ailab/search/GlassBoxSearch.tsx`, con fragmento, puntaje, fuente y enlace. Sin el PDF
  del CV.
- [ ] T734 [US8] Modo por significado, **condicionado a T730 y a P-3k**: vectores precalculados en el build, un worker de
  embeddings con consentimiento y la comparación de rankings. Si T730 no cumple el umbral de R-703, se cierra sin hacerse.
- [ ] T735 **BLOQUEADA (P-3c)**: mostrar la estructura del plugin para abogados del autor en vez del ejemplo neutral,
  sin nada del material de la clienta.
- [ ] T736 Pruebas y cierre:
  - `tests/unit/x2/skill.test.ts`: el 100 % de los `SKILL.md` de prueba valida (SC-307);
  - `tests/unit/x2/glassbox.test.ts`;
  - `tests/e2e/x2/plugins.spec.ts`: árbol con teclado y formulario;
  - `npm run verify` y e2e de x2 en verde.

## X3 Simulaciones y vitrinas (después de `x0-frozen`)

Rutas: `components/ailab/saga/**`, `components/ailab/showcases/**`, `lib/ailab/saga/**`, `lib/ailab/pyodide/**`,
`content/ailab/showcases/**`, `tests/unit/x3/**` y `tests/e2e/x3/**`.

- [ ] T740 [P] [US4] Motor de saga en `lib/ailab/saga/engine.ts` (FR-354):
  - tres pasos deterministas (vuelo, hotel y auto) y un cobro;
  - fallo inyectable en cualquier paso;
  - compensación en orden inverso, que distingue reserva de apartado;
  - pruebas de cada punto de fallo.
- [ ] T741 [US4] `components/ailab/saga/SagaSimulator.tsx`: diagrama, bitácora de texto con `aria-live` y movimiento
  reducido sin animación.
- [ ] T742 [P] [US9] Despacho: `content/ailab/showcases/despacho.ts`, con un caso **ficticio**, hechos con su prueba y
  cronología, y `components/ailab/showcases/DespachoShowcase.tsx`, con la línea "datos inventados". El autor revisa el
  caso antes de integrar.
- [ ] T743 [US9] Obra (FR-358, R-705):
  - `content/ailab/showcases/obra.ts`, con una bitácora y precios **de ejemplo**;
  - `lib/ailab/pyodide/worker.ts`, con Pyodide 0.29.0 desde jsDelivr y numpy;
  - `lib/ailab/pyodide/estimate.py`;
  - `components/ailab/showcases/ObraShowcase.tsx`, con consentimiento, recálculo al cambiar un valor y el código que
    corrió.
- [ ] T744 Pruebas y cierre:
  - `tests/unit/x3/saga.test.ts` y `obra-data.test.ts` (precios marcados como ejemplo);
  - `tests/e2e/x3/showcases.spec.ts`, con el worker de Pyodide doble;
  - `npm run verify` y e2e de x3 en verde.

## X4 Juegos (después de `x0-frozen`)

Rutas: `components/ailab/games/**`, `lib/ailab/games/**`, `tests/unit/x4/**` y `tests/e2e/x4/**`.

- [ ] T750 [P] [US6] Física determinista en `lib/ailab/games/physics.ts`: paso fijo, rebotes y saque, con pruebas
  unitarias.
- [ ] T751 [P] [US6] Red propia en `lib/ailab/games/net.ts` (R-704): 2 capas de 16 neuronas, forward y gradientes, con
  una prueba de gradiente numérico.
- [ ] T752 [US6] Rival por refuerzo en `lib/ailab/games/rival.worker.ts` (FR-355, R-704): REINFORCE con línea base.
  Una simulación de prueba comprueba SC-304 (+30 puntos porcentuales de devolución en 20 rallies).
- [ ] T753 [US6] `components/ailab/games/Rally.tsx` y `BrainPanel.tsx` (FR-341, FR-342):
  - canvas con paletas de cristal y bola de partículas;
  - teclado, mouse y toque;
  - pausa con tecla, con botón y con la pestaña oculta;
  - neuronas que se encienden y curva de aprendizaje;
  - marcador con `aria-live`;
  - modo "mira a la IA entrenar sola", con resumen en texto;
  - con movimiento reducido, sin estelas ni temblores.
- [ ] T754 [US7] Clon por imitación en `lib/ailab/games/clone.ts` y el modo clon en `Rally.tsx` (FR-356): grabación de
  rallies, entrenamiento en el worker, aviso de listo y métrica de parecido.
- [ ] T755 [P] [US6] [US7] Persistencia con `labStore`: estado versionado de rival y clon, reinicio y descarte de
  versiones viejas (FR-313).
- [ ] T756 [US6] Adaptación (FR-332): baja la frecuencia del entrenamiento, y después la calidad visual, antes que los
  fps.
- [ ] T757 Pruebas y cierre:
  - `tests/unit/x4/physics.test.ts`, `net.test.ts` y `rival-sim.test.ts`;
  - `tests/e2e/x4/games.spec.ts`: teclado, pausa con la pestaña oculta, movimiento reducido y anuncio del marcador;
  - `npm run verify` y e2e de x4 en verde.

## X5 QA del laboratorio (en paralelo; corre completa al integrar)

Rutas: `tests/e2e/x5/**`.

- [ ] T760 [P] Auditoría de red:
  - 0 bytes de modelos, pesos o `.wasm` antes del consentimiento (SC-301);
  - 0 peticiones con audio, texto, archivos o movimientos del visitante (SC-305, FR-320).
- [ ] T761 [P] fps del fondo y INP con cada experimento activo (SC-302, FR-331, SC-204, SC-205). Se mide en la vista previa con
  la GPU real.
- [ ] T762 [P] axe en la página y en cada experimento abierto (SC-306).
- [ ] T763 [P] Responsive de 320 a 2560 px de `/ai-lab`, en ES y EN.
- [ ] T764 [P] Teclado, alternativas en texto de la voz y movimiento reducido en los 11 experimentos (FR-340,
  FR-342).
- [ ] T765 Estabilizar lo que salga de T760 a T764.

## Integración (orquestador)

- [ ] T770 Integrar en orden X0 → X3 → X2 → X1 → X4 → X5, con `npm run verify` después de cada merge.
- [ ] T771 Correr la suite completa **3 veces seguidas en verde**.
- [ ] T772 Desplegar la vista previa, revisarla con el autor y cortar a `main` solo con su confirmación explícita.
- [ ] T773 Desbloquear a medida que se resuelvan sus preguntas:
  - T717 (P-3h), T727 (P-3e) y T735 (P-3c). T714 se desbloqueó: P-3k quedó aprobada el 2026-11-04;
  - T734, según T730;
  - avisar a la 005 para desbloquear su T628 si P-505 queda en el camino A.
- [ ] T774 Para HC-1 a HC-6, abrir una iteración de plan y tareas cuando el autor resuelva P-3a, P-3b, P-3d, P-3f, P-3i
  o P-3j. Esta lista no tiene código.

## Dependencias y orden

- **T701** abre todo, y **X0 (T702 a T716)** bloquea a X1 a X5.
- **X1**: T720 → T722 → T723, y T720 → T724.
- **X2**: T730 → T734.
- **X4**: T750 y T751 → T752 → T753 → T754.
- **Entre lanes**: solo los contratos del plan.

## Estrategia

- **MVP**: X0, X3 y X2 sin T734. Con eso, la página, el simulador de sagas, las vitrinas, el plugin, el generador de
  skills y la caja de cristal, todo sin descargas pesadas salvo Obra.
- **Después**: X1 (voz) y X4 (juegos).
- **QA (X5)** cierra todo.

## Análisis cruzado (2026-11-04)

`/speckit.analyze` sobre spec, plan y tasks de la 003:

| ID | Severidad | Hallazgo | Resolución |
|---|---|---|---|
| F1 | Alta | Guardar el modelo de J1 y J2 en el navegador roza el principio IV ("solo preferencias") | Interpretación registrada en la spec y el plan: es progreso del visitante, equivalente a los easter eggs descubiertos; nunca contenido del sitio, y se borra con un botón (FR-312, FR-313) |
| F2 | Alta | `@huggingface/transformers` es una dependencia nueva (principio VIII) | Justificada en el plan (Complexity Tracking). Queda como P-3k, con un respaldo definido. T714 bloqueada |
| F3 | Media | La spec decía que se llega al laboratorio desde `/now`, pero `/now` (004) no tiene enlaces en sus datos | FR-301 corregido: paleta y footer. El texto de `/now` ya menciona el AI Lab |
| F4 | Media | La línea de privacidad del handoff ("se procesan y se descartan") sugiere un servidor | Ajustada al camino A en el copy base |
| F5 | Media | A5 "por significado" pedía precalcular vectores en el build, con un costo sin medir | Condicionado a la medición T730 (R-703); BM25 es la base |
| F6 | Baja | V3 es la base de una tarea bloqueada de la 005 (T628) | Contrato `readPost` en T726, y aviso en T773 |
| F7 | Baja | FR-320, FR-331, FR-340 y FR-371 no tenían tarea con referencia explícita | Referencias agregadas en T714, T760, T761 y T764 |

**Cobertura**: los 30 requisitos funcionales y los 7 criterios de éxito de la spec tienen al menos una tarea. Hay 57
tareas:

- 4 bloqueadas: T717 (P-3h), T727 (P-3e), T735 (P-3c) y T734, condicionada a T730. T714 se desbloqueó con P-3k;
- 2 de medición en la vista previa: T723 y T730.
