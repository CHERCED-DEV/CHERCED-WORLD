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
- [x] R1.2 Pulido por código, sin reconstruir; las e2e de la 010 cubren las páginas nuevas.
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
  - [x] Decisiones del autor, 2026-11-11 (aplicadas en U7, U10, U12 y U14).
    - U7: cada patrón con título en español y debajo el nombre canónico en inglés.
    - U10: a "Synergos por dentro" se llega desde "Ahora trabajo en", en el inicio.
    - U12: el caso de estudio aparece una sola vez en `/synergos`.
    - U14: "Booking", "Seller", "Blogs/Social", "Despacho" y "Obra" son nombres propios y no se traducen.
  - [x] Pruebas que propone la auditoría (U1 y U6 en `tests/e2e/rel/pulido-r12.spec.ts`, U6 también revisa que el texto
    del SVG quede en `aria-hidden`; U2 en `tests/unit/rel/vocabulario.test.ts`; U9 en `tests/e2e/ux/toque.spec.ts`):
    - U1: el trazo cambia con el scroll.
    - U2: mismo vocabulario en las cuatro páginas.
    - U6: texto SVG dentro de `aria-hidden`.
    - U9: los dos botones en `toque.spec.ts`.
- [x] R1.3 Revisión visual del autor: scroll de Synergos (T1108) y página completa (T0929). Aprobada por el autor el
  2026-11-12 en la vista previa a9cwsnuqq.

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
- [ ] R2.5 CV regenerado con las dos cuentas de GitHub (lo hace el agente del autor) y reemplazado en el sitio. El 2026-11-12 el autor
  decidió esperar el CV nuevo antes de publicar. Al llegar: reemplazar los PDF de `public/cv/` (ES y EN), actualizar
  `bytes` en `content/site.ts` y correr las pruebas del CV; después, la exhaustiva (R4.3).
- [x] R2.6 Post 2 (si el autor lo quiere en el release, D-R2). Decisión del autor del 2026-11-12: sale después del release.
- [x] R2.7 (hecho el 2026-11-12: `continuousStart` encadena los cargos de la misma empresa con hasta un mes de hueco; Sistecrédito dice "Desde mar 2025") "Ahora trabajo en" (home) dice "Desde feb 2026" porque toma solo el cargo AI-First. El autor pide sumar su etapa anterior en la misma empresa (Development Solutions Engineer, desde 2025-03): la fecha debe salir del primer cargo continuo en la empresa actual, no del último. Pedido el 2026-11-11 para después, no para ya.
- [ ] R2.9 Botón de WhatsApp para que escriban directo al autor (pedido el 2026-11-11, para más adelante). El autor aprobó el 2026-11-11 que el número quede público (enlace `wa.me`). Falta que lo dé y decidir dónde va sin duplicar llamados (Contacto, pop-up de reclutadores o el botón flotante) y cómo se mide.
- [x] R2.8 (hecho el 2026-11-11: el círculo del lóbulo en celular mide al menos 7,5 em, unos 90 px, para que
  "ARQUITECTURA" y "ARCHITECTURE" quepan con la letra de 12 px; la lluvia no estaba desfasada: la prueba comparaba la
  caja del mapa de antes del toque, que desplaza la página, y ahora mide las dos juntas) Deuda vista al integrar R2.1 (falla igual sin la escena nueva): `tests/e2e/p2/brain-mobile.spec.ts:71` en celular. A 375 px el nombre de un lóbulo no cabe en su círculo, y a 390 y 412 px la lluvia del mapa queda desfasada unos 450 px del mapa tras abrir "Ver todas". Probable efecto del texto mínimo de 12 px (010). Revisar en R1.2.

## R3 — Specs abiertas y deuda
- [x] R3.1 AI Lab: T723 y T761 medidos; decisión sobre T730/T734. Hecho el 2026-11-11 en la vista previa, en este
  portátil (i5-10300H; GPU integrada Intel UHD, activada en Chromium sin ventana con `--enable-gpu --use-angle=d3d11`):
  - T723: Whisper base transcribe 30 s de voz en español en 15 y 16 s con WASM (SC-303 pide 60). Base sigue por
    defecto.
  - T761: el fondo va a 60 fps con cada uno de los 11 experimentos abierto. El INP al abrir va de 32 a 152 ms, salvo J1,
    que varió de 40 a 232 ms en cuatro mediciones. Según los Long Animation Frames, el retraso está en pintar el
    escenario nuevo (lienzo y cristal), no en código: el manejador tarda 4 ms. Abrir en una transición no sirve,
    porque los demos cargan con Suspense y la transición espera el chunk. Queda anotado en R3.3.
  - T730: 196 fragmentos ES y EN se vectorizan en 13 a 14 s con `onnxruntime-node`, que ya está en el proyecto.
    Cumple R-703 si el modelo se guarda en `.next/cache`. T734 (el modo por significado) queda para después del
    release por ser una función nueva; la ficha de A5 en el AI Lab ya no dice "todavía no medí".
- [x] R3.2 002 T228 (hecho el 2026-11-11): al guardar, el panel muestra la respuesta nueva con `useOptimistic` y el
  editor se cierra en la misma transición, así que ya no asoma la anterior. Una acción de moderación dejó de disparar
  21 precargas: el panel y el shell no precargan dentro de `/inbox`. Queda en `tests/e2e/l3/admin.spec.ts`.
- [x] R3.3a `/blog/catalog` volvía 404 desde la 011 (el proxy lo trataba como post inexistente); corregido el 2026-11-11, y la prueba de anterior y siguiente pasa a post6.
- [ ] R3.3 Deuda de la suite exhaustiva (reglas de auditoría, presupuestos de fps e INP). Avance del 2026-11-11:
  - Las pruebas de rendimiento miden con la GPU real: los 30 fps eran del render por software, y las 16 pasan.
  - El carrusel con teclado ya no vuelve al primer proyecto a mitad del salto: ignora las posiciones intermedias
    hasta el destino (6 de 6).
  - "Volver arriba": la prueba baja hasta el final real de la página ya armada (55 de 55).
  - El contraste de casos espera a que terminen las transiciones antes de medir.
  - Las pruebas de teclado y de axe del AI Lab juegan J1 y J2 en vez de esperar "muy pronto".
  - La del buscador en inglés acepta que la página de arquitectura salga primero ante "sagas".
  - Queda: el LCP del celular se pasa de 2,5 s solo con varias pruebas a la vez (pasa solo); J1 al abrirse (R3.1).
  - `tests/e2e/l3/public.spec.ts:188` espera que el sitio público no enlace `/inbox`, pero desde la 011 el ícono del
    buzón lleva ahí. Se resuelve con la decisión D-R1 (R3.4).

  Historial: Intermitente visto el 2026-11-11: `tests/e2e/p4/cases.spec.ts:436` (contraste del botón "Todos" del filtro en tema claro durante su transición; pasa al repetir). También el 2026-11-11, al integrar C2 y C8 de la 013: `tests/e2e/r0/shell-v2.spec.ts` "Volver arriba" falla al llegar al final de `/es/aboutMe` en celular (también con teclado) y, a veces, de `/es/blog/catalog` en escritorio. Son páginas que C2 y C8 no tocan, y el catálogo pasó en la primera corrida. La fluidez del fondo del inicio (`integration/performance.spec.ts`, exhaustiva) da 30 fps contra 50 en escritorio, con C8 y sin C8 (medido en el mismo build). Al cerrar los bajos de R1.2: `tests/e2e/l1/site.spec.ts:219` (carrusel con teclado en celular) a veces no salta del primer proyecto al último con la flecha izquierda. Falló 1 de 6 veces sin C2 y 2 de 4 con C2, con una sola prueba a la vez. Causa probable: la espera de 120 ms de `onScroll` en `ProjectsExplorer.tsx` se cumple a mitad del scroll suave y devuelve el índice 0. El LCP de `/es` en celular dio 2672 ms contra 2500 en la corrida con 4 workers y pasa solo.
- [x] R3.4 Buzón para visitantes según D-R1. Decisión del autor del 2026-11-12: el visitante va a Contacto y el autor,
  con su marca (`cw-author`, la que deja el inicio de sesión), al panel. El panel sigue entrando por URL directa.
  Es el comportamiento de la T944 de la 007, que la 011 había cambiado.
- [x] R3.5 (C1, C4 y barras hechos y aprobados por el autor el 2026-11-11; C2 y C8, el paso del hero a "Ahora trabajo en", hechos y aprobados el mismo día: "Quedan así", T1309) Spec 013, animaciones guiadas por scroll (`../013-scroll-driven/`): C1 llenado del índice de Sobre mí (espera la segunda opinión de la sesión hija), C2 imagen del carrusel en celular y C4 ruta de "Hacia dónde voy" que se traza; las barras de lectura se ven con movimiento reducido, sin efectos. El autor decidió el 2026-11-11 que entra antes del release.
- [x] R3.6 Diseño del inicio y del portafolio, ítems 1 a 5 de la auditoría de diseño del 2026-11-12 (pedido del autor:
  "Limpia y sigue 1–5"). Hecho el mismo día, más el desborde P1 del blog en inglés. **Aprobado por el autor en su
  teléfono el 2026-11-12 ("Aprobado")**, sobre c67d996:
  - **1, vitrina en el inicio:** un panel "Proyectos destacados" debajo de "Ahora trabajo en", sin tocar el hero.
    Usa el mismo cristal y el mismo encabezado. Trae los 3 primeros casos por orden sin Synergos ni los que ya
    enlaza "Ahora trabajo en", y un enlace "Ver los 15 proyectos". En el celular son filas con miniatura y en
    pantallas anchas, 3 columnas. C8 sigue con dos paradas: el snap del panel quedó solo en `.now .panel` y su
    `scroll-margin-block-end` sube de 100rem a 300rem, porque debajo hay entre 1.230 y 1.360 px.
  - **2, hero del portafolio:** como el de Synergos: "15 proyectos · 2022–2026" (se calcula de las épocas), la caja
    PORTAFOLIO y la primera frase destacada con el resto atenuado (máx. 68ch). Se quitó la banda "PROYECTOS" y
    el `h2` queda solo para lectores de pantalla. La primera tarjeta pasa de y≈1.167 a 607 en el celular a 390 y de
    934 a 698 a 1440.
  - **3, carrusel en el celular:** épocas y tecnologías en una sola fila deslizable y fija (61 px, antes 194). El
    "Mostrando los 15 proyectos" sale de la parte fija, y la tarjeta mide 588 px y cabe entre la barra y el dock a
    375, 390 y 412.
  - **4, tablet:** la imagen y el texto se apilan hasta 992 px (`lg`), y el botón no pasa del ancho de la tarjeta.
  - **5, carrusel:** todas las tarjetas miden lo mismo, la imagen va en una fila de alto fijo y el botón queda
    abajo. Los puntos van dentro de la barra de controles y "¡Y muchos más por venir!" es una línea atenuada.
  - **P1:** con `keepHyphens`, `typeset` dejaba entero "Spec-Driven Development" y el título de post4 se salía a
    375. Ahora solo "Spec-Driven" queda sin cortar.
  Quedan para que el autor decida: los ítems 6 a 12 (el 7 y el 11 necesitan su texto), y si el blog adopta la
  navegación estándar (A o B) y se quitan los enlaces de temas del hero del AI Lab.

## R4 — Endurecer
- [x] R4.1 Revisión de seguridad de lo nuevo. La revisión (solo lectura) terminó el 2026-11-11: no hay nada alto.
  Arreglos hechos el 2026-11-12 (M1, B2, B1, B5 y B7):
  - [x] **M1 (media):** cambiar la contraseña no cierra las otras sesiones del panel. Además, una sesión que se usa cada
    12 h no vence nunca (`lib/actions/auth.ts:124`, `lib/auth/guard.ts:48-52`, `lib/auth/session.ts:59-61`).
    Arreglo: `deleteAllSessions()` en el repo, y en `changePassword` borrar todas e iniciar una nueva. Opcional:
    tope absoluto desde `createdAt`.
  - [x] **B2:** `/api/admin/updates` devuelve los registros completos. El sondeo solo usa `id` y `updatedAt`, así que
    `changedSince` debe traer solo eso (`lib/data/mongo/messages.ts:70-75`, `comments.ts:92-97`).
  - [x] **B1:** no hay cabeceras de seguridad. Hecho con `frame-ancestors 'self'` y no `'none'`, porque el caso 2 muestra el sitio en vivo
    dentro de su propia página. Agregar `headers()` en `next.config.ts` con `frame-ancestors 'none'`,
    `base-uri 'self'`, `object-src 'none'`, `nosniff`, `Referrer-Policy` y `Permissions-Policy`, sin `script-src`
    estricto (los scripts inline lo impiden sin nonces).
  - [x] **B5** (en parte): el antispam del contacto acepta un `renderedAt` futuro o muy viejo (`lib/security/anti-spam.ts:21-26`).
    Rechazarlos y firmar el valor con `hmacHex`. Hecho: se rechaza una hora más de 5 minutos en el futuro. Queda sin
    hacer firmar la hora, que solo serviría en Contacto (en los comentarios la pone el navegador), y no se pone
    vencimiento, para que nadie pierda un mensaje por dejar la página abierta.
  - [x] **B7:** subir scrypt de N=2^15 a 2^17 (`lib/auth/password.ts:5`); los hashes viejos siguen validando.
  - Se aceptan o quedan para después:
    - B3: Pyodide desde jsDelivr sin verificar integridad; B2 reduce el riesgo.
    - B4: el límite por IP no agrupa IPv6 por /64.
    - B6: cualquiera puede restar reacciones; es un contador decorativo.
  Bien hechos: la sesión (token de 32 bytes con hash, cookie httpOnly/secure/lax), scrypt con comparación en tiempo
  constante, el setup con código de un solo uso, `requireAdmin` en cada acción, zod con límites, el escape del
  resaltado de código y del JSON-LD, y los workers del AI Lab solo después del consentimiento. Las rutas API
  heredadas responden 410.
- [x] R4.2 Rendimiento, accesibilidad, sin JS y SEO en la vista previa. La accesibilidad completa va con la exhaustiva
  (R4.3, al final). Barrido del 2026-11-11: se revisaron con curl
  las 92 URLs del sitemap de la vista previa n2un7d4fo. Están limpios el código 200, `lang`, un `h1`, los títulos,
  las descripciones, las canónicas, el `hreflang`, el JSON-LD, los `alt`, el contenido sin JS y 131 de 133 enlaces.
  Pendiente para mañana, en este orden:
  1. [x] El 404 sale en Vercel sin `<meta name="robots" content="noindex">`. Next la pone solo cuando al renderizar
     ya sabe que el estado es 404, y en Vercel no lo sabe. Se deja así: la respuesta es HTTP 404, y Google no indexa
     un 404. Declararla duplicaba la etiqueta en local y rompía seis pruebas (2026-11-12).
  2. [x] (2026-11-12) "Regresar" en las 28 páginas de etiqueta lleva a `/[lang]/blog/tag`, que es 404. `parentPath`
     (`components/shell/nav.ts`) debe mandar a `/[lang]/blog`.
  3. [x] (2026-11-12) `/privacy` pierde `og:image`, `og:url`, `og:locale` y `twitter:card` grande, porque su `openGraph` reemplaza el
     del layout. Hay que usar `pageMetadata` (`components/site/metadata.ts`), como las otras páginas.
  4. [x] (2026-11-12, `switchLocaleKeepingTag`) Menor: el cambio de idioma en 20 etiquetas con slug traducido pasa por un 308; sin JS, las reacciones quedan
     en "cargando". Revisado el 2026-11-12: no pasa en el navegador. Las reacciones y "Deja un comentario" llevan
     `cw-js-only` y el CSS los oculta sin JS; "Opciones de correo" cambia a un enlace `mailto`. El barrido con curl
     no aplicaba el CSS.
  5. Para la decisión D-R1 (R3.4): `/es/inbox/setup` muestra a cualquiera el formulario de crear la contraseña de
     administrador. Está protegido por el código de un solo uso de los logs, pero el ícono del buzón lleva ahí.
  Rendimiento: las 16 pruebas de rendimiento pasan con la GPU (R3.3). Accesibilidad: falta la corrida completa de
  la exhaustiva (R4.3).
- [ ] R4.3 Suite exhaustiva en verde con la máquina libre. **Decisión del autor del 2026-11-12: se corre, pero NO bloquea
  el release.** Corre en paralelo (sesión aparte), y lo que encuentre se arregla después de publicar. Para el release
  bastan las unitarias, lint y typecheck (que Vercel corre antes de compilar) más las e2e de lo que se toca. La corrida completa quedó lanzada el 2026-11-11 sobre
  c79606b (3 workers). Si su resultado no quedó anotado aquí, hay que relanzarla mañana con
  `E2E_TIER=exhaustive E2E_PORT=3200 npx playwright test --workers=3`.
- [ ] R4.4 Notas del release y QA final del autor. Borrador de las notas, con la lista de QA para el teléfono y la
  tablet, en `notas-del-release.md` (2026-11-12). Falta el QA del autor.
- [x] R4.5 P2 de la exhaustiva (2026-11-12): sin JS, en Contacto el bloque para reclutadores quedaba dentro de un
  `<noscript>` de 50 px en la columna centrada, y "Perfil de LinkedIn" desbordaba a 375, 390 y 412 px. El
  `<noscript>` ahora ocupa todo el ancho de la columna (`PageSection.module.scss`).
- [x] R4.6 Volver arriba al cambiar de página (pedido del autor, 2026-11-12: "estoy en el footer, le doy a Now o a IA
  Lab y él no me devuelve hasta la parte de arriba"). Pasaba en las páginas con la pestaña de navegación (Now, AI Lab,
  Servicios, casos y Synergos), no en Privacidad. Dos causas:
  - La pestaña sticky era el primer hijo de la página y su `scroll-padding-top` la dejaba "fuera" del área útil.
    Next llamaba `scrollIntoView` sobre cada hijo del fragmento, y en la pestaña sticky eso devolvía la página al
    final. Ahora `SectionNav` recibe la página como `children` y todo va en un solo `<div data-cw-section-page>`, como
    ya hacía Sobre mí.
  - `html` tiene `scroll-behavior: smooth`, y sin `data-scroll-behavior="smooth"` Next no lo apaga al navegar: subía
    animando casi 1,5 s desde el pie. Se agregó el atributo en `app/[lang]/layout.tsx`.
  Medido en 22 navegaciones (escritorio y celular, desde el pie y desde el menú): todas quedan en 0. La prueba está
  en `tests/e2e/rel/volver-arriba.spec.ts`.
- [x] R4.7 Hallazgos de la exhaustiva (2026-11-12):
  - **N1:** el contraste de la pestaña en tema oscuro era un falso positivo. `auditContrast` medía justo después de
    hacer scroll; la pestaña se escondía al llegar al pie y su texto quedaba medido contra el contenido de abajo.
    Ahora espera 450 ms después de cada scroll (`tests/e2e/integration/support/contrast.ts`).
  - **P3:** "Proyectos destacados" se veía atenuado mientras entraba, por `cw-home-arrive`. Esa animación quedó solo
    en el panel de "Ahora trabajo en".
  - **P4:** a 320 px, la fecha de la respuesta del autor a un comentario se salía. `.meta` ahora hace
    `flex-wrap`.
  - El INP de los lóbulos de `/es/aboutMe` a 375 px era carga: con la máquina libre pasó 9 de 9.
  - FR-320: la prueba del laboratorio permite solo el GET de `/api/search-vectors/{lang}`, que no envía datos del
    visitante. Es una decisión técnica de la sesión principal, pendiente del visto bueno del autor.

## R5 — Publicar
- [ ] R5.1 Confirmación del autor y `dev` → `main`.
- [ ] R5.2 Smoke en producción.
- [ ] R5.3 Después del release: dominio, Search Console, Bing, enlaces, medición, X4b.
