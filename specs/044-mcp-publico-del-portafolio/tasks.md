# Tareas: 044 — MCP público del portafolio

**Entrada:** [spec.md](./spec.md) y [plan.md](./plan.md). **Línea:** L2, ola 1, rama `lane/l2-mcp`.

Formato: `- [ ] TNNxx [P] [USn] Descripción — archivos: … — cubre: FR-…`. `[P]` significa que corre en paralelo con
las otras `[P]` de la misma fase.

## Fase 0 — Enmiendas de la base (las hace el integrador)

- [x] T4401 Acciones `mcp`, `mcpMatch` y `mcpDaily` — archivos: `lib/security/rate-limit.ts` — cubre: E-4401, FR-4407
- [x] T4402 Namespace `mcp` en i18n — archivos: `lib/i18n/config.ts`, `lib/i18n/server.ts` — cubre: E-4402
- [x] T4403 Etiqueta `044-base` en la rama base después de T4401 y T4402

## Fase 1 — Preparación

- [x] T4404 Rama `lane/l2-mcp` y worktree `.worktrees/l2-mcp` desde `044-base`, con la junction de `node_modules`
  creada antes de arrancar la sesión de la línea
- [x] T4405 Consultar en modelcontextprotocol.io la última revisión estable del protocolo y anotarla con su fecha —
  archivos: `lib/mcp/core/protocol.ts` — cubre: FR-4403
- [x] T4406 [P] Diccionarios de la página — archivos: `content/i18n/es/mcp.json`, `content/i18n/en/mcp.json` — cubre:
  FR-4411

## Fase 2 — US1: el núcleo del protocolo (va primero: es el contrato de la 048 y la 049)

- [x] T4407 [P] [US1] Pruebas de contrato del protocolo que fallan: `initialize` con negociación de versión, `ping`,
  `tools/list` con JSON Schema y `readOnlyHint`, `tools/call` válida e inválida (`isError`), `-32700`, `-32600`,
  `-32601`, `-32602`, notificación con 202, lote rechazado, `GET` y `DELETE` con 405, cuerpo de más de 64 KB con 413 y
  `OPTIONS` con CORS — archivos: `tests/unit/mcp/protocol.test.ts` — cubre: FR-4401, FR-4402, FR-4403, FR-4408
- [x] T4408 [P] [US1] Prueba de la guarda de imports: `lib/mcp/servers/**` no importa `@/lib/data` y solo
  `lib/mcp/core/limit.ts` lo hace — archivos: `tests/unit/mcp/privacy-imports.test.ts` — cubre: FR-4406
- [x] T4409 [US1] Tipos del contrato — archivos: `lib/mcp/core/types.ts` — cubre: FR-4410
- [x] T4410 [US1] Constantes del protocolo y formas de mensaje — archivos: `lib/mcp/core/protocol.ts` — cubre: FR-4402,
  FR-4403
- [x] T4411 [US1] Zod a JSON Schema con `z.toJSONSchema` — archivos: `lib/mcp/core/schema.ts` — cubre: FR-4404
- [x] T4412 [US1] Límite por IP y global, con 429, `Retry-After` y 503 si la base no responde — archivos:
  `lib/mcp/core/limit.ts`, `tests/unit/mcp/limit.test.ts` — cubre: FR-4407
- [x] T4413 [US1] `createMcpHandler` hasta que T4407 pase — archivos: `lib/mcp/core/handler.ts` — cubre: FR-4401,
  FR-4402, FR-4408, FR-4410

## Fase 3 — US1: las herramientas del portafolio

- [x] T4414 [P] [US1] Fuentes con URL absoluta y título — archivos: `lib/mcp/servers/portafolio/sources.ts`,
  `tests/unit/mcp/sources.test.ts` — cubre: FR-4405
- [x] T4415 [P] [US1] `search_portfolio` sobre `createGlassBox`, con un máximo de 10 resultados y recortes de 220
  caracteres — archivos: `lib/mcp/servers/portafolio/tools/search.ts`, `tests/unit/mcp/tools/search.test.ts` — cubre:
  FR-4404, FR-4405
- [x] T4416 [P] [US1] `list_case_studies` y `get_case_study`, con el pitch solo si está aprobado — archivos:
  `lib/mcp/servers/portafolio/tools/cases.ts`, `tests/unit/mcp/tools/cases.test.ts` — cubre: FR-4404, FR-4405
- [x] T4417 [P] [US1] `get_decisions` — archivos: `lib/mcp/servers/portafolio/tools/decisions.ts`,
  `tests/unit/mcp/tools/decisions.test.ts` — cubre: FR-4404
- [x] T4418 [P] [US1] `get_career`, `get_skills` y `list_posts` — archivos:
  `lib/mcp/servers/portafolio/tools/profile.ts`, `tests/unit/mcp/tools/profile.test.ts` — cubre: FR-4404
- [x] T4419 [P] [US1] `get_contact_options` con los canales públicos y los CV en PDF — archivos:
  `lib/mcp/servers/portafolio/tools/contact.ts`, `tests/unit/mcp/tools/contact.test.ts` — cubre: FR-4404
- [x] T4420 [US1] Servidor del portafolio con sus instrucciones y la ruta `/api/mcp` — archivos:
  `lib/mcp/servers/portafolio/index.ts`, `app/api/mcp/route.ts` — cubre: FR-4401, FR-4404

## Fase 4 — US3: el encaje con una vacante

- [x] T4421 [US3] Pruebas que fallan: límites de 80 y 8.000 caracteres, las cinco vacantes inventadas de la 029 con la
  misma cobertura en tres corridas, cero ids inventados y nada guardado — archivos: `tests/unit/mcp/tools/match.test.ts`
  — cubre: FR-4404, SC-4405
- [x] T4422 [US3] `match_job_description` sobre `simulateMatch`, con el límite `mcpMatch` y el enlace al A6 — archivos:
  `lib/mcp/servers/portafolio/tools/match.ts` — cubre: FR-4404

## Fase 5 — US2: la página con el catálogo y el probador

- [x] T4423 [P] [US2] Pasos por cliente, solo los probados y con su fecha — archivos: `content/mcp/clients.ts` — cubre:
  FR-4411
- [x] T4424 [US2] `McpConnect` con la URL, el botón de copiar y los pasos — archivos: `components/mcp/McpConnect.tsx`,
  `components/mcp/Mcp.module.scss` — cubre: FR-4411
- [x] T4425 [US2] `McpCatalog`, renderizado en el servidor desde `tools/list` del propio servidor (llamada en proceso,
  sin HTTP a sí mismo, principio IV) — archivos: `components/mcp/McpCatalog.tsx` — cubre: FR-4411
- [x] T4426 [US2] `McpTester`: `initialize`, `tools/list` y una `tools/call` elegida, con la petición, la respuesta, los
  milisegundos, «Copiar» y el error visible — archivos: `components/mcp/McpTester.tsx` — cubre: FR-4411
- [x] T4427 [US2] Página y metadatos en los dos idiomas — archivos: `app/[lang]/mcp/page.tsx`,
  `app/[lang]/mcp/opengraph-image.tsx` — cubre: FR-4411

## Fase 6 — US4: los prompts

- [x] T4428 [US4] `interview_camilo` y `fit_for_role`, con `prompts/list` y `prompts/get` — archivos:
  `lib/mcp/servers/portafolio/prompts.ts`, `tests/unit/mcp/prompts.test.ts` — cubre: FR-4402

## Fase 7 — Pulido

- [x] T4429 Batería de filtración: unas 20 llamadas con los `LEAKS` y `KEY` de la 032, correos que no son el público,
  nombres de variables de entorno y `privado/`; un fallo rompe el build — archivos: `content/mcp/leak-battery.ts`,
  `tests/unit/mcp/leaks.test.ts` — cubre: FR-4412, SC-4402, SC-4403
- [x] T4430 [P] Estación `mcp-en-tu-agente` con el contrato `RouteStation` de la 042 — archivos: `content/mcp/station.ts`
  — cubre: FR-4101 de la 041
- [x] T4431 e2e de la página: catálogo renderizado, probador con una llamada real a la función local, error visible
  con el servidor caído, teclado y axe — archivos: `tests/e2e/mcp/mcp.spec.ts` — cubre: FR-4411
- [ ] T4432 Integrador: sitemap, enlace en el AI Lab, estación en la ruta y sección del README — archivos:
  `app/sitemap.ts`, `components/ailab/shell/LabPage.tsx`, `content/ailab/route/index.ts`, `README.md` — cubre: E-4403,
  E-4404, E-4405, E-4406
- [ ] T4433 Prueba de conexión en la vista previa con Claude Code, un conector personalizado de Claude y el MCP
  Inspector (y Cursor y ChatGPT si conectan), con la fecha anotada en `content/mcp/clients.ts` — cubre: SC-4401
- [ ] T4434 Medir p95 de `tools/call` en la vista previa sin contar el arranque en frío — cubre: SC-4404
- [ ] T4435 Capturas de 390×844 y WebKit de `/mcp` y del inicio del AI Lab contra la última vista aprobada — cubre:
  FR-4108 de la 041
- [ ] T4436 Sección «Cómo quedó» en la spec — archivos: `specs/044-mcp-publico-del-portafolio/spec.md`

## Dependencias y orden

- Fase 0 antes de todo. La fase 2 (el núcleo) antes de las fases 3 a 6.
- Las fases 3 y 4 van en paralelo; la 5 necesita la 3 (el catálogo lista herramientas reales); la 6 es independiente
  una vez esté la fase 2.
- T4430 necesita el contrato `042-estaciones`. Si la L1 todavía no se integró, la estación se escribe contra el tipo
  de la spec y se suma al registro cuando exista.
- `get_interview_route` (FR-4404) se activa solo después de integrar la L1. Hasta entonces no aparece en `tools/list`.
- Al integrarse, la línea deja la etiqueta `044-mcp` con el contrato congelado para la 048 y la 049.

## Validación final

- [ ] T4437 `npx vitest run tests/unit/mcp`, `npm run lint`, `npm run typecheck` y
  `npx playwright test tests/e2e/mcp/mcp.spec.ts` en verde; sin la suite exhaustiva y sin gastar API
- [ ] T4438 Búsqueda de nombres internos en el diff antes del push (SC-4104 de la 041)
