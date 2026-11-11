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
  - [x] Medios.
    - [x] U3: acciones visibles al abrir "Para reclutadores" en celular.
    - [x] U4: el cargo actual de la carrera no se corta sin señal en escritorio (desvanecido cuando hay más y alto máximo de 820 px).
    - [x] U5: mesa de peloteo completa en celular (se centra al quedar lista y al jugar).
    - [x] U6: textos de los diagramas del AI Lab de 12 px o más (leyendas HTML en celular; V3 en HTML).
    - [x] U7: patrones con título en español y nombre canónico en inglés; "seams", "back", "design system" y "showcase" traducidos en el texto.
    - [x] U8: panel de capas sin estado vacío y usable al tacto.
    - [x] U9: "Ver qué recibes" y "Quiero esto" de 44 px (ya medían 44 en reposo; los 39–43 eran de la tarjeta encogida al apilarse; queda en `toque.spec.ts`).
    - [x] U10: "Synergos por dentro" enlazado desde "Ahora trabajo en", en el inicio.
  - [x] Bajos (U13 y U15 a U18 hechos el 2026-11-11; quedan en `tests/e2e/r1/bajos.spec.ts`).
    - [x] U11: ↗ solo en enlaces externos (→ a otra página, ↓ dentro de la misma).
    - [x] U12: no era el mismo caso: el inicio de `/synergos` lleva al caso 12 y "Cómo se construye", al 13. El del 13 dice ahora "Leer este caso".
    - [x] U13: por debajo de 768 px, las verticales de `/synergos` aparecen sin retraso; en escritorio la cuadrícula sigue escalonada.
    - [x] U14: los nombres de las líneas y de los showcases se quedan; los términos en inglés también (regla del autor en la 010). Solo se corrigió "funciona por completo".
    - [x] U15: los compuestos con guion quedan enteros en el H1 y las tarjetas de Servicios, los títulos del blog (tarjeta y post) y `/now` (`typeset` con `keepHyphens`).
    - [x] U16: en tema claro, la "/" de "18 /" usa el verde oscuro que ya usa el Rally (#0b6e47) y queda fuera del lector de pantalla.
    - [x] U17: el 404 de un post, de una etiqueta o de un caso suma "Ver todos los posts" o "Ver el portafolio" debajo de "Volver al inicio". El proxy marca la sección y borra la que mande el cliente.
    - [x] U18: en `/now`, "Synergos, rumbo a producción" y "El AI Lab de este sitio" enlazan a su página, sin botones nuevos.
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
- [x] R2.2 Servicios: precios "a convenir". Hecho el 2026-11-11 con una sola pregunta frecuente, "¿Cuánto cuesta un servicio?", antes de la de costos de la IA. Las tarjetas siguen sin `priceRange` y no hay cifras. Cierra P-421 de la 004.
- [x] R2.3 SEO en página para búsquedas de desarrollador con nicho y ubicación (P-802). Hecho el 2026-11-11: las
  descripciones de Home (y del `Person`) y de Sobre mí suman "AI Engineer", "Armenia, Colombia" y Angular. El autor
  eligió no decir "desarrollador" en las descripciones para conservar la identidad de la 004. La tabla FR-860 suma
  Q14 a Q18 (enmienda en la spec 008).
- [x] R2.4 Cifras de Synergos al día (fase 2). Revisado el 2026-11-11: todas salen de `content/synergos.ts` (31
  piezas, 20 capacidades, 9 orquestadores, más de 6.600 tests y más de 140 ADR, contados el 2026-11-05). La fecha de
  la vitrina dejó de ser una copia, y una prueba vigila que el piso de tests no pase del conteo exacto (6.675). El
  "2.353" del post 6 es la cifra fechada del 6 de agosto y el post ya dice "más de 6.600" para noviembre.
- [ ] R2.5 CV regenerado con las dos cuentas de GitHub (lo hace el agente del autor) y reemplazado en el sitio.
- [ ] R2.6 Post 2 (si el autor lo quiere en el release, D-R2).
- [ ] R2.7 "Ahora trabajo en" (home) dice "Desde feb 2026" porque toma solo el cargo AI-First. El autor pide sumar su etapa anterior en la misma empresa (Development Solutions Engineer, desde 2025-03): la fecha debe salir del primer cargo continuo en la empresa actual, no del último. Pedido el 2026-11-11 para después, no para ya.
- [ ] R2.9 Botón de WhatsApp para que escriban directo al autor (pedido el 2026-11-11, para más adelante). El autor aprobó el 2026-11-11 que el número quede público (enlace `wa.me`). Falta que lo dé y decidir dónde va sin duplicar llamados (Contacto, pop-up de reclutadores o el botón flotante) y cómo se mide.
- [ ] R2.8 Deuda vista al integrar R2.1 (falla igual sin la escena nueva): `tests/e2e/p2/brain-mobile.spec.ts:71` en celular. A 375 px el nombre de un lóbulo no cabe en su círculo, y a 390 y 412 px la lluvia del mapa queda desfasada unos 450 px del mapa tras abrir "Ver todas". Probable efecto del texto mínimo de 12 px (010). Revisar en R1.2.

## R3 — Specs abiertas y deuda
- [ ] R3.1 AI Lab: T723 y T761 medidos; decisión sobre T730/T734.
- [ ] R3.2 002 T228.
- [x] R3.3a `/blog/catalog` volvía 404 desde la 011 (el proxy lo trataba como post inexistente); corregido el 2026-11-11, y la prueba de anterior y siguiente pasa a post6.
- [ ] R3.3 Deuda de la suite exhaustiva (reglas de auditoría, presupuestos de fps e INP). Intermitente visto el 2026-11-11: `tests/e2e/p4/cases.spec.ts:436` (contraste del botón "Todos" del filtro en tema claro durante su transición; pasa al repetir). También el 2026-11-11, al integrar C2 y C8 de la 013: `tests/e2e/r0/shell-v2.spec.ts` "Volver arriba" falla al llegar al final de `/es/aboutMe` en celular (también con teclado) y, a veces, de `/es/blog/catalog` en escritorio. Son páginas que C2 y C8 no tocan, y el catálogo pasó en la primera corrida. La fluidez del fondo del inicio (`integration/performance.spec.ts`, exhaustiva) da 30 fps contra 50 en escritorio, con C8 y sin C8 (medido en el mismo build). Al cerrar los bajos de R1.2: `tests/e2e/l1/site.spec.ts:219` (carrusel con teclado en celular) a veces no salta del primer proyecto al último con la flecha izquierda. Falló 1 de 6 veces sin C2 y 2 de 4 con C2, con una sola prueba a la vez. Causa probable: la espera de 120 ms de `onScroll` en `ProjectsExplorer.tsx` se cumple a mitad del scroll suave y devuelve el índice 0. El LCP de `/es` en celular dio 2672 ms contra 2500 en la corrida con 4 workers y pasa solo.
- [ ] R3.4 Buzón para visitantes según D-R1.
- [x] R3.5 (C1, C4 y barras hechos y aprobados por el autor el 2026-11-11; C2 y C8, el paso del hero a "Ahora trabajo en", hechos y aprobados el mismo día: "Quedan así", T1309) Spec 013, animaciones guiadas por scroll (`../013-scroll-driven/`): C1 llenado del índice de Sobre mí (espera la segunda opinión de la sesión hija), C2 imagen del carrusel en celular y C4 ruta de "Hacia dónde voy" que se traza; las barras de lectura se ven con movimiento reducido, sin efectos. El autor decidió el 2026-11-11 que entra antes del release.

## R4 — Endurecer
- [ ] R4.1 Revisión de seguridad de lo nuevo.
- [ ] R4.2 Rendimiento, accesibilidad, sin JS y SEO en la vista previa.
- [ ] R4.3 Suite exhaustiva en verde con la máquina libre.
- [ ] R4.4 Notas del release y QA final del autor.

## R5 — Publicar
- [ ] R5.1 Confirmación del autor y `dev` → `main`.
- [ ] R5.2 Smoke en producción.
- [ ] R5.3 Después del release: dominio, Search Console, Bing, enlaces, medición, X4b.
