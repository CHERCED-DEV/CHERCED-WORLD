# 041 — Tareas de la línea: orquestación e integración

**Entrada:** [spec.md](./spec.md), [plan.md](./plan.md) y el `tasks.md` de cada spec hija.

Aquí van solo las tareas de la sesión principal: aprobación, base de cada ola, lanzamiento, integración, entrega y
limpieza. Las tareas de producto están en el `tasks.md` de cada spec (T42xx a T50xx).

**Formato:** `- [ ] T41xx [P] Descripción — archivos o ramas — cubre`. `[P]` marca lo que puede ir en paralelo.
**[autor]** marca lo que hace o decide el autor.

## Fase 0: Upstream (26 de noviembre de 2026)

- [x] T4101 Entrevista de 10 preguntas, una a la vez, con recomendación — `entrevista.md`
- [x] T4102 Spec paraguas con públicos, prueba de los 10 minutos, specs hijas, olas y reglas — `spec.md` — cubre: FR-4101 a FR-4110
- [x] T4103 [P] Specs, planes y tareas de la ola 1 (042, 044 y 045), redactados por una línea interna
- [x] T4104 [P] Specs, planes y tareas de la ola 2 (043, 047 y 046), redactados por una línea interna
- [x] T4105 [P] Specs, planes y tareas de la ola 3 (048, 049 y 050), redactados por una línea interna
- [x] T4106 Lectura del proyecto de referencia. Informe privado en `privado/` (ignorado por `.gitignore` y `.git/info/exclude`) y versión pública genérica — `research.md` — cubre: FR-4107
- [x] T4107 Enmienda propuesta 3.1.0, sin aplicar — `enmienda-constitucion.md`
- [x] T4108 Plan de orquestación y estas tareas — `plan.md`, `tasks.md`
- [x] T4109 Revisión de coherencia entre las nueve specs (numeración, contratos, rutas, costos y nombres prohibidos) y paquete de aprobación — `aprobacion.md`
- [x] T4110 Commit con la identidad personal, fetch, rebase sobre `origin/dev` y push a `dev`, sin force. Solo documentos: no cambia el build

## Fase 1: Aprobación del autor

- [ ] T4111 **[autor]** Aprobar, pedir cambios o rechazar cada spec hija — `aprobacion.md`
- [ ] T4112 **[autor]** Decidir la enmienda 3.1.0. Si se aprueba, aplicarla en `.specify/memory/constitution.md` con su Sync Impact Report
- [ ] T4113 **[autor]** Responder las preguntas abiertas que no quiera dejar por defecto (P-4101 a P-4106 y las de cada spec)
- [ ] T4114 **[autor]** Consultar con el arquitecto si las ideas generales se pueden usar en proyectos personales públicos y con qué crédito — P-4105

## Fase 2: Ola 1 (042, 044 y 045)

- [x] T4120 Script local de nombres prohibidos: lee `specs/041-pruebame-en-vivo/privado/nombres-prohibidos.txt` y revisa las líneas agregadas del diff contra `origin/dev`. Sale con 0 si está limpio, 1 si hay nombres y 2 si falta la lista. No corre en CI, porque la lista no es pública — `scripts/check-private-names.mjs` — cubre: SC-4104
- [x] T4121 Base F1: aplicar las enmiendas a archivos compartidos de las specs aprobadas de la ola 1, con lint, typecheck y pruebas de lo tocado. Commit y etiqueta `041-base-ola1` — cubre: constitución VII
  - Entran:
    - E-4201, E-4402 y E-4501: namespaces de i18n, con JSON vacíos que después llenan las líneas;
    - E-4204: `export` de `clock`;
    - E-4401: acciones del MCP;
    - E-4502: reporte JSON de Vitest en el `prebuild` y `metrics:history`;
    - E-4503: `.engineering/` en `.gitignore`;
    - la prueba de contrato de i18n ampliada;
    - el tipo `RouteStation` congelado en `content/ailab/route/stations.ts`, para que la L2 y la L3 declaren sus estaciones sin esperar a la L1.
  - El sitemap, el README y las entradas de interfaz (E-4202, E-4203, E-4205, E-4206, E-4403, E-4404, E-4406 y E-4504) van al integrar, cuando las páginas ya existen (T4129).
- [x] T4122 Crear los worktrees `.worktrees/L1-ruta`, `.worktrees/L2-mcp` y `.worktrees/L3-ingenieria` desde `041-base-ola1`, con el junction de `node_modules` hecho antes de lanzar
- [x] T4123 [P] Lanzar la L1 (042) en segundo plano, con el brief y la primera línea del junction
- [x] T4124 [P] Lanzar la L2 (044)
- [x] T4125 [P] Lanzar la L3 (045)
- [x] T4126 Integrar la L1 en `integracion-041`. Desde aquí, el registro `content/ailab/route/index.ts` es compartido
- [x] T4127 Integrar la L2 y sumar su estación al registro
- [x] T4128 Integrar la L3 y sumar su estación al registro
- [x] T4129 Entradas a la ruta (P-4102): un enlace de texto en la ventana «Para reclutadores» y un acceso al inicio del AI Lab, sin rehacer esas secciones — cubre: FR-4108
- [x] T4130 Validación de la ola: lint, typecheck, `npx vitest run`, `npx next build`, los tres e2e de la ola con 2 workers y el script de nombres prohibidos
- [x] T4131 Capturas del celular (390×844 y WebKit) del AI Lab, la ventana «Para reclutadores» y las páginas nuevas, contra la última vista aprobada — cubre: SC-4105
- [x] T4132 Push de la ola 1 a `dev` (fetch, rebase, push sin force) y esperar la vista previa de Vercel
- [x] T4133 Borrar los worktrees de la ola 1 con `cmd /c rmdir` (primero el junction), `git worktree prune` y las ramas locales

## Fase 3: Ola 2 (043, 047 y 046)

- [ ] T4140 **[autor]** Crear `ANTHROPIC_API_KEY` y `OPENAI_API_KEY` con límite de gasto en cada consola, y ponerlas en Vercel (Production y Preview, Sensitive). Se puede construir sin ellas, con simulador
- [ ] T4141 Base F2: enmiendas de las specs aprobadas de la ola 2, incluidas las filas del README y los precios por proveedor. Etiqueta `041-base-ola2`
- [ ] T4142 [P] Crear los worktrees y lanzar la L4 (043) y la L6 (047)
- [ ] T4143 Integrar la L4 y congelar el puerto de modelos y el techo mensual (`041-puerto-modelos`)
- [ ] T4144 Recibir la primera versión del paquete de Cotejo con su núcleo determinista e integrar la demo de la L6 (`041-nucleo-cotejo`)
- [ ] T4145 Crear el worktree y lanzar la L5 (046) cuando T4143 y T4144 estén hechas
- [ ] T4146 Integrar la L5
- [ ] T4147 **[autor]** Si quiere, autorizar una corrida real de la arena y de las evals de la ola. Sin su permiso no se gasta API
- [ ] T4148 Validación de la ola (igual que T4130), push a `dev` y limpieza de worktrees
- [x] T4149 Upstream de la 051 (Forja), sumada el 26 de noviembre: entrevista corta de cuatro preguntas, spec, plan,
  tareas y su bloque en `aprobacion.md`
- [x] T4156 [P] Si se aprueba la 051, lanzar la L10 (fase A) en el repo externo `C:\Users\HITMA\Desktop\forja`, sin
  worktree del sitio ni base nueva. Cuenta para el máximo de tres líneas. Fase A construida el mismo día; ver «Cómo
  quedó (fase A)» en la 051

## Fase 4: Ola 3 (048, 049 y 050)

- [ ] T4150 Base F3: enmiendas de las specs aprobadas de la ola 3. Etiqueta `041-base-ola3`
- [ ] T4151 [P] Crear los worktrees y lanzar la L7 (048), la L8 (049) y la L9 (050)
- [ ] T4152 Integrar la L7, la L8 y la L9, en ese orden, con sus estaciones
- [ ] T4153 **[autor]** Revisar los datos ficticios de la empresa, de los casos de Despacho y Obra y de la pyme antes de publicarlos — cubre: FR-4102
- [ ] T4154 Validación de la ola, push a `dev` y limpieza de worktrees
- [ ] T4155 Fase B de la 051, cuando el autor cierre P-4105: base con E-5101 a E-5106, worktree `.worktrees/L10-kit`,
  integración con su estación y sus evals en el tablero, validación y push

## Fase 5: Cierre de la línea

- [ ] T4160 **[autor]** Cronometrar la ruta con él mismo y dos personas más — cubre: SC-4101
- [ ] T4161 Revisar el gasto real del mes contra la meta y el techo — cubre: SC-4102
- [ ] T4162 Comprobar que cada spec construida tiene evals y que su última corrida está en el tablero — cubre: SC-4103
- [ ] T4163 Sección «Cómo quedó» en esta spec y en `specs/seguimiento-*.md`
- [ ] T4164 **[autor]** Confirmar de forma explícita si algo pasa a `main`

## Dependencias y orden

- La fase 1 bloquea todo lo demás. Cada línea depende de que su spec esté aprobada.
- Ola 1: T4121 → T4122 → T4123, T4124 y T4125 en paralelo → T4126 → T4127 y T4128 → T4129 a T4133.
- Ola 2: T4141 → T4142 (L4 ∥ L6) → T4143 y T4144 → T4145 (L5) → T4146 → T4148.
- Ola 3: necesita la 043 integrada (puerto) y la 044 integrada (MCP) → T4150 → T4151 → T4152 → T4154.
- Máximo tres líneas activas a la vez. Una ola puede empezar antes de que termine la anterior solo si sus dependencias
  ya están integradas y hay cupo.
