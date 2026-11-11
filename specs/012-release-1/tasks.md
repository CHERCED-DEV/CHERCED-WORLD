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
- [x] R1.1 Auditoría con códigos U1… (375/390/412/768/1440, claro/oscuro, ES/EN, WebKit). Hecha el 2026-11-11: 18 hallazgos, 2 altos, 8 medios y 8 bajos; documento privado `docs/handoff-2026-11-04/13-auditoria-paginas-nuevas.md`.
- [ ] R1.2 Pulido por código, sin reconstruir; las e2e de la 010 cubren las páginas nuevas.
  - [x] Altos (hechos el 2026-11-11). U1: los trazos ligados al scroll no avanzan en `/synergos` ni en el hero de la arquitectura (el `overflow: hidden` del cristal los congela; `overflow: clip` lo resuelve). U2: el backend de Synergos usa un solo vocabulario, "20 capacidades · 9 orquestadores" (desbloquea R2.4).
  - [x] C0 (alto, de la segunda opinión de la 013; hecho el 2026-11-11 con `:has(:focus-visible)`, que saca al frente la tarjeta con foco de teclado): en el celular, el mazo apilado de Servicios tapa el foco de teclado (WCAG 2.4.11): 7 de 12 acciones en Chromium y 8 de 12 en WebKit quedan bajo la tarjeta siguiente.
  - [ ] Medios.
    - [x] U3: acciones visibles al abrir "Para reclutadores" en celular.
    - [x] U4: el cargo actual de la carrera no se corta sin señal en escritorio (desvanecido cuando hay más y alto máximo de 820 px).
    - [x] U5: mesa de peloteo completa en celular (se centra al quedar lista y al jugar).
    - [x] U6: textos de los diagramas del AI Lab de 12 px o más (leyendas HTML en celular; V3 en HTML).
    - [x] U7: patrones con título en español y nombre canónico en inglés; "seams", "back", "design system" y "showcase" traducidos en el texto.
    - [x] U8: panel de capas sin estado vacío y usable al tacto.
    - [x] U9: "Ver qué recibes" y "Quiero esto" de 44 px (ya medían 44 en reposo; los 39–43 eran de la tarjeta encogida al apilarse; queda en `toque.spec.ts`).
    - [x] U10: "Synergos por dentro" enlazado desde "Ahora trabajo en", en el inicio.
  - [ ] Bajos.
    - [x] U11: ↗ solo en enlaces externos (→ a otra página, ↓ dentro de la misma).
    - [x] U12: no era el mismo caso: el inicio de `/synergos` lleva al caso 12 y "Cómo se construye", al 13. El del 13 dice ahora "Leer este caso".
    - U13: verticales más rápidas en celular.
    - [x] U14: los nombres de las líneas y de los showcases se quedan; los términos en inglés también (regla del autor en la 010). Solo se corrigió "funciona por completo".
    - U15: compuestos partidos en el guion.
    - U16: contraste de la barra "18/" en claro.
    - U17: 404 de post o caso con salida contextual.
    - U18: `/now` enlaza lo que menciona.
  - [ ] Decisiones del autor, 2026-11-11.
    - U7: cada patrón con título en español y debajo el nombre canónico en inglés.
    - U10: a "Synergos por dentro" se llega desde "Ahora trabajo en", en el inicio.
    - U12: el caso de estudio aparece una sola vez en `/synergos`.
    - U14: "Booking", "Seller", "Blogs/Social", "Despacho" y "Obra" son nombres propios y no se traducen.
  - [ ] Pruebas que propone la auditoría:
    - U1: el trazo cambia con el scroll.
    - U2: mismo vocabulario en las cuatro páginas.
    - U6: texto SVG dentro de `aria-hidden`.
    - U9: los dos botones en `toque.spec.ts`.
- [ ] R1.3 Revisión visual del autor: scroll de Synergos (T1108) y página completa (T0929).

## R2 — Contenido
- [x] R2.1 T960 "Hacia dónde voy": borrador ES/EN, aprobación del autor, escena integrada.
- [ ] R2.2 Servicios: precios "a convenir".
- [ ] R2.3 SEO en página para búsquedas de desarrollador con nicho y ubicación (P-802).
- [ ] R2.4 Cifras de Synergos al día (fase 2).
- [ ] R2.5 CV regenerado con las dos cuentas de GitHub (lo hace el agente del autor) y reemplazado en el sitio.
- [ ] R2.6 Post 2 (si el autor lo quiere en el release, D-R2).
- [ ] R2.7 "Ahora trabajo en" (home) dice "Desde feb 2026" porque toma solo el cargo AI-First. El autor pide sumar su etapa anterior en la misma empresa (Development Solutions Engineer, desde 2025-03): la fecha debe salir del primer cargo continuo en la empresa actual, no del último. Pedido el 2026-11-11 para después, no para ya.
- [ ] R2.8 Deuda vista al integrar R2.1 (falla igual sin la escena nueva): `tests/e2e/p2/brain-mobile.spec.ts:71` en celular. A 375 px el nombre de un lóbulo no cabe en su círculo, y a 390 y 412 px la lluvia del mapa queda desfasada unos 450 px del mapa tras abrir "Ver todas". Probable efecto del texto mínimo de 12 px (010). Revisar en R1.2.

## R3 — Specs abiertas y deuda
- [ ] R3.1 AI Lab: T723 y T761 medidos; decisión sobre T730/T734.
- [ ] R3.2 002 T228.
- [ ] R3.3 Deuda de la suite exhaustiva (reglas de auditoría, presupuestos de fps e INP). Intermitente visto el 2026-11-11: `tests/e2e/p4/cases.spec.ts:436` (contraste del botón "Todos" del filtro en tema claro durante su transición; pasa al repetir).
- [ ] R3.4 Buzón para visitantes según D-R1.
- [ ] R3.5 Spec 013, animaciones guiadas por scroll (`../013-scroll-driven/`): C1 llenado del índice de Sobre mí (espera la segunda opinión de la sesión hija), C2 imagen del carrusel en celular y C4 ruta de "Hacia dónde voy" que se traza; las barras de lectura se ven con movimiento reducido, sin efectos. El autor decidió el 2026-11-11 que entra antes del release.

## R4 — Endurecer
- [ ] R4.1 Revisión de seguridad de lo nuevo.
- [ ] R4.2 Rendimiento, accesibilidad, sin JS y SEO en la vista previa.
- [ ] R4.3 Suite exhaustiva en verde con la máquina libre.
- [ ] R4.4 Notas del release y QA final del autor.

## R5 — Publicar
- [ ] R5.1 Confirmación del autor y `dev` → `main`.
- [ ] R5.2 Smoke en producción.
- [ ] R5.3 Después del release: dominio, Search Console, Bing, enlaces, medición, X4b.
