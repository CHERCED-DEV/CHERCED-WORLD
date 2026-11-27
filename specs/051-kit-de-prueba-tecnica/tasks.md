# Tareas: 051 — Forja

**Entrada**: [spec.md](./spec.md) y [plan.md](./plan.md) | **Línea**: L10 | **Ola**: 2

Formato: `- [ ] ID [P] [Historia] Descripción — archivos: … — cubre: …`.
- **[P]:** se puede hacer en paralelo con otras tareas de la misma fase.
- **US1 a US6:** las historias de la spec.
- **[autor]:** lo hace o lo decide el autor.
- Las rutas que empiezan con `forja/` son del repo nuevo; las demás, del sitio.

Ninguna tarea de la línea llama a un modelo. Las corridas reales de evals las autoriza el autor (P-5105).

## Fase 0: Decisiones y repo

- [x] T5101 [autor] Aprobar la 051 y confirmar P-5101 (nombre) en `aprobacion.md`. Aprobada el 26 de noviembre de
  2026, con «Forja» por defecto
- [ ] T5102 [autor] Crear el repo privado `CHERCED-DEV/forja` (P-5102). Mientras tanto, la línea trabaja en un repo git
  local en `C:\Users\HITMA\Desktop\forja`, con commits firmados con el correo personal del autor
- [x] T5103 Investigación R-5101 a R-5105, con fuente y fecha, anotada en el `plan.md` de esta spec antes de escribir
  código

## Fase 1: Base del repo

- [x] T5104 Monorepo con npm workspaces, TypeScript estricto, Vitest, lint y esbuild — archivos: `forja/package.json`,
  `forja/tsconfig.json`, `forja/packages/forja-core/package.json`
- [x] T5105 [P] README en español y en inglés, con la regla de transparencia antes de las instrucciones, y el `LICENSE`
  MIT preparado para la fase B — archivos: `forja/README.md`, `forja/README.en.md`, `forja/LICENSE` — cubre: FR-5101,
  FR-5114
- [x] T5106 [P] CI: lint, typecheck, pruebas y build de los `dist/`, que falla si los `dist/` versionados no coinciden
  con el build — archivos: `forja/.github/workflows/ci.yml`

## Fase 2: `forja-core` (US1 y US3, P1)

Pruebas primero:

- [x] T5107 [P] [US1] `parseRequirements`: ids `R-NN`, criterio, prioridad y cita. Reporta ids repetidos, requisitos sin
  criterio y prioridades inválidas — archivos: `forja/packages/forja-core/src/requirements.ts` y su prueba — cubre:
  FR-5103
- [x] T5108 [P] [US1] `SpecChecker` y `minimalChecker`: palabras vagas en ES y EN, criterio por requisito y
  duplicados exactos — archivos: `forja/packages/forja-core/src/checks.ts` y su prueba — cubre: FR-5103
- [x] T5109 [P] [US3] `coverageMatrix`: convención de nombres, varios tests por requisito, «sin cubrir» con motivo y ids
  de prueba que no existen en la spec — archivos: `forja/packages/forja-core/src/matrix.ts` y su prueba — cubre:
  FR-5109, SC-5102
- [x] T5110 [P] [US3] `deliveryMarkdown` y `deliveryProblems` en ES y EN, con todas las secciones de US3 — archivos:
  `forja/packages/forja-core/src/delivery.ts` y su prueba — cubre: FR-5109, FR-5101
- [x] T5111 [P] [US3] `validateLog` y el esquema de la bitácora: sin contenido de archivos ni valores que parezcan
  llaves — archivos: `forja/packages/forja-core/src/log.ts` y su prueba — cubre: FR-5109, FR-5110
- [x] T5112 [P] `parsePack` y el esquema de `pack.json` — archivos: `forja/packages/forja-core/src/pack.ts` y su
  prueba — cubre: FR-5107

## Fase 3: El plugin (US1 y US2, P1)

- [x] T5113 [US2] Manifiesto, marketplace y `.mcp.json` con el MCP del portafolio (044), según R-5101 — archivos:
  `forja/.claude-plugin/marketplace.json`, `forja/plugins/forja/.claude-plugin/plugin.json`,
  `forja/plugins/forja/.mcp.json` — cubre: FR-5114
- [x] T5114 [US1] Comando `/forja` y skill orquestadora: fases, archivos de `forja/`, modos, reparto del tiempo,
  recorte por prioridad y retoma — archivos: `forja/plugins/forja/commands/forja.md`,
  `forja/plugins/forja/skills/forja/SKILL.md` — cubre: FR-5102, FR-5105, FR-5108. Al implementar, `/forja` quedó
  como la skill misma, sin `commands/` (R-5101)
- [x] T5115 [P] [US1] Subagentes arquitecto, constructor, verificador y revisor, cada uno con sus herramientas
  permitidas y lo que no puede hacer. El arquitecto cita precedentes con `get_decisions` de la 044 cuando aplican —
  archivos: `forja/plugins/forja/agents/*.md` — cubre: FR-5104
- [x] T5116 [P] [US3] Hooks de bitácora y de guardas, con pruebas sobre eventos de ejemplo: escritura fuera de la
  carpeta, `git push`, `rm -rf`, `.env*` e instalación desde un registro que no es el oficial — archivos:
  `forja/plugins/forja/hooks/hooks.json`, `forja/packages/forja-core/src/guards.ts` y su prueba — cubre: FR-5110
- [x] T5117 [P] [US2] Arranque: comprueba Node, git y el SDK del stack, y avisa si los minutos son menos de 15 —
  archivos: `forja/packages/forja-core/src/preflight.ts` y su prueba — cubre: US2 (escenario 3), FR-5108
- [x] T5118 Empaquetar los scripts en `dist/` con esbuild y probar que corren con `node` en una carpeta sin
  `node_modules` — archivos: `forja/plugins/forja/dist/*.mjs`, `forja/scripts/build-dist.mjs`

## Fase 4: Los packs (US1, P1)

Cada pack se verifica creando un proyecto con su comando y corriendo sus comandos de verificación en la máquina del
autor. Si falta un SDK, la línea lo reporta y sigue con los demás.

- [x] T5119 [P] [US1] Pack Angular — archivos: `forja/plugins/forja/skills/pack-angular/**` — cubre: FR-5107
- [x] T5120 [P] [US1] Pack .NET (C#) — archivos: `forja/plugins/forja/skills/pack-dotnet/**` — cubre: FR-5107
- [x] T5121 [P] [US1] Pack Next.js con React — archivos: `forja/plugins/forja/skills/pack-nextjs/**` — cubre: FR-5107
- [x] T5122 [P] [US1] Pack NestJS — archivos: `forja/plugins/forja/skills/pack-nestjs/**` — cubre: FR-5107

## Fase 5: Evals con verdad oculta (US5, P2)

- [x] T5123 [US5] Cinco encargos de muestra inventados, marcados como ficticios, cada uno con su suite de aceptación
  oculta — archivos: `forja/evals/encargos/**` — cubre: FR-4102
- [x] T5124 [US5] Corredor: copia solo el enunciado a una carpeta limpia fuera del repo, corre Forja, aplica la suite
  oculta y escribe el resultado. Se prueba con un agente de prueba que entrega una solución fija — archivos:
  `forja/evals/corredor/**` y su prueba — cubre: SC-5101
- [x] T5125 [P] [US5] Corridas de control con un defecto sembrado por encargo — archivos:
  `forja/evals/encargos/*/defecto.md` — cubre: SC-5103
- [x] T5126 [P] [US1] Prueba de red: todas las llamadas del plugin a los MCP quedan registradas y ninguna lleva el
  encargo ni el código — archivos: `forja/evals/privacidad/**` — cubre: FR-5106, SC-5105
- [ ] T5127 [autor] Autorizar las corridas reales con su Claude Code (P-5105)
- [ ] T5128 Corridas reales de los cinco encargos y de los controles. Los resultados van a `forja/evals/resultados/`
  con fecha, cliente y modelo — cubre: SC-5101, SC-5103

## Fase 6: Corrida grabada (US6, P2)

- [x] T5129 Script que convierte una corrida (bitácora, `forja/*.md` y `ENTREGA.md`) en `recorded-run.json` para la
  página — archivos: `forja/scripts/grabar-corrida.mjs` y su prueba
- [ ] T5130 Grabar una corrida real de punta a punta, elegida por el autor entre las de T5128

## Fase 7: Cierre de la fase A

- [x] T5131 Sección «Cómo quedó (fase A)» en la spec, con la investigación de T5103, las pruebas corridas y lo que
  falta — archivos: `specs/051-kit-de-prueba-tecnica/spec.md`
- [ ] T5132 [autor] Usar Forja en una entrevista o en un ensayo con pantalla compartida y anotar qué faltó

## Fase B: Publicación (después de P-4105)

- [ ] T5133 [autor] Cerrar P-4105 y hacer público el repo `CHERCED-DEV/forja` con licencia MIT
- [ ] T5134 Primer release con el tarball de `forja-core`
- [ ] T5135 El integrador aplica E-5101 a E-5106 y etiqueta la base — archivos: los de la tabla de enmiendas del plan
- [ ] T5136 [US4] MCP del kit, pruebas primero: herramientas, prompts, límites y batería de protocolo, filtración y
  fuentes — archivos: `app/api/mcp/kit/route.ts`, `lib/mcp/servers/kit/**`, `tests/unit/kit/**` — cubre: FR-5111,
  FR-5112
- [ ] T5137 [US6] Página `/{lang}/kit` en ES y EN, legible sin JavaScript: transparencia, instalación, otros clientes,
  corrida grabada y evals — archivos: `app/[lang]/kit/**`, `components/kit/**`, `content/kit/**`,
  `content/i18n/{es,en}/kit.json` — cubre: FR-5113
- [ ] T5138 Agregar el MCP del kit al `.mcp.json` del plugin y publicar un release del plugin — archivos:
  `forja/plugins/forja/.mcp.json`
- [ ] T5139 E2E de la página y del MCP en el puerto 3150, en escritorio, celular y sin JavaScript — archivos:
  `tests/e2e/kit/**`
- [ ] T5140 El integrador aplica E-5107 y E-5108: la estación y las evals en el tablero
- [ ] T5141 [autor] Cronometrar la instalación con dos personas (SC-5104) y probar un cliente distinto de Claude Code
  (SC-5106)
- [ ] T5142 Validación, capturas del celular contra la última vista aprobada, push a `dev` y «Cómo quedó (fase B)»

## Dependencias y orden

- T5101 bloquea todo. T5102 no bloquea: la línea puede empezar en local.
- Fase 1 → fase 2 → fases 3 y 4 en paralelo → fase 5 → fase 6 → fase 7.
- `cotejoChecker` se suma cuando Cotejo (047) publique su núcleo. Hasta entonces, `minimalChecker`.
- La fase B necesita T5133. T5136 necesita la base de T5135.
- La L10 cuenta para el máximo de tres líneas a la vez de la 041.

## Validación final

- **Fase A:** `npm run lint`, `npm run typecheck`, `npx vitest run` y `npm run build` en el repo de Forja. Los cuatro
  packs verificados, el corredor en seco y la prueba de red en verde.
- **Fase B:** la validación de una ola de la 041, más la batería del MCP del kit en el build del sitio.
