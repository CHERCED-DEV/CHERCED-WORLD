# Tareas: 050 — Agente de operaciones para una pyme

**Entrada**: [spec.md](./spec.md) y [plan.md](./plan.md). **Línea**: L9, ola 3.

**Arranca cuando**: la 050 está aprobada por el autor y la etiqueta congelada de la 043 (puerto) está integrada en
`dev`.

**Formato**: `- [ ] TNNxx [P] [USn] Descripción — archivos: … — cubre: FR-…`. `US1` a `US5` son las historias H1 a H5
de la spec.

## Fase 0: enmiendas de la base (las hace el integrador)

- [ ] T5001 Sumar `B1` a `LAB_EXPERIMENT_IDS` — archivos: `content/types.ts` — cubre: FR-5015
- [ ] T5002 Entrada `B1` del catálogo y sus textos `ailab.b1.*` — archivos: `content/ailab/catalog.ts`, `content/i18n/{es,en}/ailab.json` — cubre: FR-5001, FR-5015
- [ ] T5003 Acciones de límite `pymeTurn` y `pymeTurnDaily` — archivos: `lib/security/rate-limit.ts` — cubre: FR-5010
- [ ] T5004 `TYPICAL_USE.pymeTurn` y la línea `B1` del gasto — archivos: `lib/ai/models.ts`, `lib/ai/spend.ts` — cubre: FR-5011
- [ ] T5005 Espacio de i18n `pyme` — archivos: `lib/i18n/server.ts` — cubre: FR-5015
- [ ] T5006 Script `evals:pyme` y rutas propias `evals/pyme.eval.ts` y `tests/e2e/pyme.spec.ts` — archivos: `package.json` — cubre: FR-5014
- [ ] T5007 Etiquetar `050-base` y anotar la enmienda en el plan de la 041 — archivos: `specs/041-pruebame-en-vivo/plan.md`

## Fase 1: preparación

- [ ] T5010 Negocio ficticio Girasol de Papel en ES y EN (zonas, franjas, horario, reglas de descuento y preguntas frecuentes), para aprobación del autor (P-5002) — archivos: `content/ailab/pyme/business.ts`, `content/ailab/pyme/faq.ts` — cubre: FR-5001
- [ ] T5011 [P] Catálogo ficticio de unos 15 productos con precio en COP y máximo por pedido — archivos: `content/ailab/pyme/catalog.ts` — cubre: FR-5001
- [ ] T5012 [P] Agenda base con reservas de clientes ficticios — archivos: `content/ailab/pyme/agenda.ts` — cubre: FR-5002
- [ ] T5013 [P] Textos de la interfaz — archivos: `content/i18n/{es,en}/pyme.json` — cubre: FR-5015

## Fase 2: H1, cotizar y proponer un pedido (P1)

- [ ] T5020 [US1] Pruebas primero: cotización (líneas, domicilio por zona y total), reglas de descuento, máximos y guarda de cifras — archivos: `tests/unit/pyme/quote.test.ts`, `tests/unit/pyme/money-guard.test.ts` — cubre: FR-5003, FR-5004
- [ ] T5021 [US1] Cálculo de la cotización en el servidor — archivos: `lib/ai/pyme/quote.ts` — cubre: FR-5004
- [ ] T5022 [US1] Reglas de descuento cerradas — archivos: `lib/ai/pyme/discounts.ts` — cubre: FR-5003, FR-5004
- [ ] T5023 [US1] Guarda de cifras de dinero contra la última cotización — archivos: `lib/ai/pyme/money-guard.ts` — cubre: FR-5004
- [ ] T5024 [US1] Esquemas y ejecución de las herramientas — archivos: `lib/ai/pyme/tools.ts` — cubre: FR-5003
- [ ] T5025 [US1] Instrucción con reglas fijas y mensajes del cliente como datos — archivos: `lib/ai/pyme/prompt.ts` — cubre: FR-5009
- [ ] T5026 [US1] Ciclo de turno con hasta 3 pasos de herramienta por el puerto, reintento único y tope mensual — archivos: `lib/ai/pyme/turn.ts` — cubre: FR-5003, FR-5010
- [ ] T5027 [US1] Simulador con reglas para las frases de los guiones — archivos: `lib/ai/pyme/simulator.ts` — cubre: FR-5016
- [ ] T5028 [US1] Ruta del turno con origen, largo, máximo de mensajes, límites y modo apagado — archivos: `app/api/ailab/pyme/turn/route.ts` — cubre: FR-5010
- [ ] T5029 [US1] Chat del cliente y tarjeta de cotización — archivos: `components/ailab/pyme/CustomerChat.tsx`, `components/ailab/pyme/QuoteCard.tsx` — cubre: FR-5004, FR-5015

## Fase 3: H2, ser el dueño y aprobar (P1)

- [ ] T5030 [US2] Pruebas primero: acción pendiente, «ya quedó» prohibido con pendientes, revalidación al aprobar, franja ocupada mientras tanto y rechazo con motivo — archivos: `tests/unit/pyme/actions.test.ts` — cubre: FR-5005, FR-5006
- [ ] T5031 [US2] Acciones pendientes y revalidación contra la agenda base y la sesión — archivos: `lib/ai/pyme/actions.ts` — cubre: FR-5005, FR-5006
- [ ] T5032 [US2] Ruta de aprobación sin modelo — archivos: `app/api/ailab/pyme/approve/route.ts` — cubre: FR-5006
- [ ] T5033 [US2] Tablero del dueño y cambio de papel accesible — archivos: `components/ailab/pyme/OwnerBoard.tsx`, `components/ailab/pyme/RoleSwitch.tsx` — cubre: FR-5007, FR-5015
- [ ] T5034 [US2] Contenedor de la tarjeta con el estado de la sesión en memoria — archivos: `components/ailab/pyme/PymeStage.tsx` — cubre: FR-5008

## Fase 4: H3, tratar de sacarle algo (P1)

- [ ] T5040 [US3] Pruebas primero: la agenda solo devuelve franjas libres, la guarda de salida busca datos de la agenda, y un mensaje con forma de orden del sistema no cambia reglas — archivos: `tests/unit/pyme/redteam.test.ts` — cubre: FR-5002, FR-5009
- [ ] T5041 [US3] Disponibilidad sin datos de otros clientes — archivos: `lib/ai/pyme/availability.ts` — cubre: FR-5002, FR-5003
- [ ] T5042 [US3] Guarda de salida contra nombres y datos de la agenda ficticia — archivos: `lib/ai/pyme/actions.ts` — cubre: FR-5002

## Fase 5: H4, la caja de cristal (P2)

- [ ] T5050 [US4] Pruebas de la traza y del enmascarado de teléfonos y correos — archivos: `tests/unit/pyme/trace.test.ts` — cubre: FR-5011
- [ ] T5051 [US4] Enmascarado — archivos: `lib/ai/pyme/mask.ts` — cubre: FR-5011
- [ ] T5052 [US4] Traza por turno y botón «Cómo atendió» — archivos: `lib/ai/pyme/trace.ts`, `components/ailab/pyme/PymeTrace.tsx` — cubre: FR-5011

## Fase 6: H5, fuera de horario (P3)

- [ ] T5060 [US5] Interruptor y aviso de aprobación en la mañana, sin cambiar reglas — archivos: `lib/ai/pyme/prompt.ts`, `components/ailab/pyme/PymeStage.tsx` — cubre: FR-5012

## Fase final: pulido

- [ ] T5070 Guion pregenerado de respaldo, reproducible paso a paso — archivos: `content/ailab/pyme/script.ts` — cubre: FR-5013
- [ ] T5071 Batería de al menos 40 casos ES y EN con guiones de varios turnos — archivos: `content/ailab/pyme/evals/battery.ts` — cubre: FR-5014
- [ ] T5072 Calificador con reglas y prueba que falla con descuentos indebidos, fugas o acciones sin aprobación en la última corrida — archivos: `lib/ai/pyme/evals/grade.ts`, `tests/unit/pyme/evals.test.ts`, `content/ailab/pyme/evals/results.json` — cubre: FR-5014
- [ ] T5073 Corredor manual de la batería con proveedor elegible — archivos: `evals/pyme.eval.ts` — cubre: FR-5014
- [ ] T5074 [P] Estación «Sé el dueño: un cliente pide y tú apruebas» — archivos: `content/ailab/pyme/station.ts` — cubre: FR-4101
- [ ] T5075 [P] Prueba e2e con el simulador en escritorio y 390×844 — archivos: `tests/e2e/pyme.spec.ts` — cubre: FR-5015
- [ ] T5076 Capturas del celular (390×844 y WebKit) del AI Lab contra la última vista aprobada — cubre: FR-4108
- [ ] T5077 Sección «Cómo quedó» en la spec — archivos: `specs/050-agente-de-operaciones-pyme/spec.md`

## Dependencias y orden

- La fase 0 va antes de todo (integrador). La fase 1 va antes de las fases 2 a 6.
- La fase 2 va antes de la 3, porque las acciones nacen de las herramientas.
- La fase 4 depende de las fases 2 y 3. La fase 5 puede ir en paralelo con la 4 después de la 2.
- La fase 6 va después de la 3.
- La fase final va al cierre. Al integrar, el integrador registra la demo (`l9-pyme.ts`) y la estación.

## Validación final

- [ ] `npx vitest run tests/unit/pyme`, `npm run lint` y `npm run typecheck` en verde.
- [ ] `npx playwright test tests/e2e/pyme.spec.ts` en verde con el simulador.
- [ ] La primera corrida de `npm run evals:pyme` la hace o la autoriza el autor (unos 0,40 USD).
- [ ] Búsqueda de nombres internos y datos reales en el diff antes del push (SC-4104).
