# 012 — Tareas del Release 1

Ver `plan.md`. Cada tarea lleva su código en los commits.

## R0 — Consolidar
- [x] R0.1 Revisión y validación de la 011 (T1107) y commit en `dev`.
- [x] R0.2 legal-workspace: anonimizar municipio e inspección en la copia limpia; push forzado al repo privado.
  2026-11-11: `CHERCED-DEV/legal-workspace` (privado) queda con un solo commit, 4e21fdd, sin datos personales ni el
  municipio real. Se borró la rama de backlog. El repo local original y dos bundles de respaldo conservan la historia
  vieja en el equipo del autor.
- [x] R0.3 Limpiar worktrees y ramas de lanes integradas. 2026-11-11: se quitaron 42 worktrees integrados; las ramas
  `lane/*` quedan como historial.

## R1 — UX de las páginas nuevas
- [ ] R1.1 Auditoría con códigos U1… (375/390/412/768/1440, claro/oscuro, ES/EN, WebKit).
- [ ] R1.2 Pulido por código, sin reconstruir; las e2e de la 010 cubren las páginas nuevas.
- [ ] R1.3 Revisión visual del autor: scroll de Synergos (T1108) y página completa (T0929).

## R2 — Contenido
- [ ] R2.1 T960 "Hacia dónde voy": borrador ES/EN, aprobación del autor, escena integrada.
- [ ] R2.2 Servicios: precios "a convenir".
- [ ] R2.3 SEO en página para búsquedas de desarrollador con nicho y ubicación (P-802).
- [ ] R2.4 Cifras de Synergos al día (fase 2).
- [ ] R2.5 CV regenerado con las dos cuentas de GitHub (lo hace el agente del autor) y reemplazado en el sitio.
- [ ] R2.6 Post 2 (si el autor lo quiere en el release, D-R2).

## R3 — Specs abiertas y deuda
- [ ] R3.1 AI Lab: T723 y T761 medidos; decisión sobre T730/T734.
- [ ] R3.2 002 T228.
- [ ] R3.3 Deuda de la suite exhaustiva (reglas de auditoría, presupuestos de fps e INP).
- [ ] R3.4 Buzón para visitantes según D-R1.

## R4 — Endurecer
- [ ] R4.1 Revisión de seguridad de lo nuevo.
- [ ] R4.2 Rendimiento, accesibilidad, sin JS y SEO en la vista previa.
- [ ] R4.3 Suite exhaustiva en verde con la máquina libre.
- [ ] R4.4 Notas del release y QA final del autor.

## R5 — Publicar
- [ ] R5.1 Confirmación del autor y `dev` → `main`.
- [ ] R5.2 Smoke en producción.
- [ ] R5.3 Después del release: dominio, Search Console, Bing, enlaces, medición, X4b.
