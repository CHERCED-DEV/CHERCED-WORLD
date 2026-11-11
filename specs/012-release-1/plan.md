# 012 — Release 1: plan de trabajo hasta publicar

**Pedido del autor (2026-11-11):** "Refinemos todo el proyecto en cuanto a la experiencia de usuario de las páginas
nuevas, que usemos lo que ya venimos construyendo, el sistema de diseño, que mejoremos los contenidos y que
continuemos dándole a las specs. Quiero que finalicemos un release para publicar."

**Release 1** = `dev` pasa a `main` y queda en producción en `cherced-world.vercel.app`. Hoy `main` sigue con el sitio
de 2023 más el hotfix de privacidad. El paso a `main` solo ocurre con la confirmación explícita del autor.

## Principios (heredados, no se negocian)

- Pulir, no reconstruir. Construir sobre lo construido: nada nuevo recarga ni reacomoda una sección aprobada (Home,
  las tres escenas de Sobre mí, el genoma, el mazo de carrera, el móvil de la 006). Una acción vive en un solo lugar.
- Sistema de diseño intacto (D1): tokens, paleta negro/blanco/`#25ED9E`, tipografía, intro y fondo animado no se tocan.
- ES y EN siempre; en español no hay inglés salvo tecnologías y productos (L2, C7).
- Cero invención; nada interno de Sistecrédito salvo los bullets de LinkedIn que el autor aprobó en la carrera.
- Sin infraestructura, proveedores, variables de entorno ni dependencias nuevas. Nunca la base de producción.
- Se revisa en el celular como lo ve el autor: 375, 390 y 412 px, más WebKit (iPhone), además de 768 y 1440.
- Pocas lanes a la vez: el límite semanal de uso cortó dos lanes el 2026-11-08. Una lane de código por zona del sitio.

## Fases

### R0 — Consolidar lo que está a medias
| Código | Trabajo | Listo cuando |
|---|---|---|
| R0.1 | Revisar la 011 de GPT antes del commit: el proxy que reescribe al 404 (que no meta el registro de posts entero en cada petición), el editor privado (autorización en servidor, vista previa sin ejecutar HTML, sin publicar) y el acceso al buzón | Revisión escrita, lint, tipos, unitarias y e2e dirigidas en verde; commit en `dev` (T1107) |
| R0.2 | legal-workspace: anonimizar el municipio y la inspección en la copia limpia y reemplazar el repo privado con push forzado (decisión del autor del 2026-11-07) | Cero coincidencias de los datos; `git ls-remote` muestra solo el commit limpio |
| R0.3 | Limpiar worktrees y ramas de lanes ya integradas | `git worktree list` solo con lo vivo |

### R1 — UX de las páginas nuevas
Páginas: `/synergos`, `/synergos/arquitectura`, el post 6, `/now`, `/ai-lab` y sus demos (incluida la mesa de peloteo
base), el 404, "Para reclutadores", Servicios y el panel privado del buzón (solo el autor).

| Código | Trabajo | Listo cuando |
|---|---|---|
| R1.1 | Auditoría con el método del doc 12 (capturas y mediciones a 375/390/412/768/1440, claro y oscuro, ES y EN, más WebKit). Cada hallazgo con código U1, U2… | Documento de hallazgos en la carpeta privada del handoff y tareas en esta spec |
| R1.2 | Pulido por código con los componentes y tokens existentes, sin rehacer secciones | Las e2e de la 010 (sin texto justificado, ≥12 px, sin CTA tapado) cubren también estas páginas |
| R1.3 | Revisión visual del autor: el scroll de Synergos (T1108) y la página completa (T0929) | Visto bueno del autor |

### R2 — Contenido
| Código | Trabajo | Listo cuando |
|---|---|---|
| R2.1 | T960 "Hacia dónde voy": 3 o 4 tarjetas de cristal y un mapa, sin fechas, con las respuestas del 2026-11-07 (robótica por aprendizaje propio con IA, biometanización desde su ponencia con una empresa belga, Synergos como fábrica de software de "Legos", frontends de marca) | Borrador ES/EN aprobado por el autor y escena integrada sin tocar las otras tres |
| R2.2 | Servicios: precios "a convenir"; contacto por el formulario | Sin cifras inventadas |
| R2.3 | SEO en página: títulos y descripciones para búsquedas de desarrollador con nicho y ubicación (P-802), coherentes con el contenido | Tabla FR-860 actualizada |
| R2.4 | Cifras de Synergos al día según la fase 2 (`countedAt` 2026-11-05; 9 orquestadores, no 10 BFF) | Una sola cifra en todo el sitio |
| R2.5 | CV: el agente del autor regenera los PDF con las dos cuentas de GitHub; se reemplazan en `public/cv/` | Pruebas de tamaño y huella actualizadas |
| R2.6 | Post 2 "Un gate que nunca falló no vigila nada" (opcional para el release) | Aprobado por el autor o pasa a después |

### R3 — Specs abiertas y deuda
| Código | Trabajo | Listo cuando |
|---|---|---|
| R3.1 | AI Lab: medir en la vista previa el modelo y el INP de los demos (T723, T761); decidir si la búsqueda por significado (T730/T734) entra o queda para después | Medición registrada en la 003 |
| R3.2 | 002 T228: el panel de moderación ya no muestra un instante la respuesta anterior | e2e del panel en verde |
| R3.3 | Deuda de la suite exhaustiva: reglas de la auditoría para los botones del cerebro y los demos del AI Lab; presupuestos de fps e INP calibrados para no fallar por carga | Auditoría de interacción en verde en móvil y escritorio |
| R3.4 | El ícono del buzón para visitantes (decisión del autor, ver abajo) | Comportamiento acordado con su prueba |

### R4 — Endurecer el release
| Código | Trabajo | Listo cuando |
|---|---|---|
| R4.1 | Revisión de seguridad de lo nuevo: editor y su API, proxy, sesión, formularios; `npm audit` sin altas | Sin hallazgos altos abiertos |
| R4.2 | Rendimiento, accesibilidad y SEO en la vista previa: LCP, CLS e INP; axe en todas las páginas; sin JS; sitemap, canonical y hreflang | Presupuestos cumplidos o desviaciones explicadas |
| R4.3 | Una corrida de la suite exhaustiva con la máquina libre | En verde, o cada fallo restante explicado y aceptado por el autor |
| R4.4 | Notas del release en español y QA final del autor en su teléfono y su tablet | Visto bueno del autor |

### R5 — Publicar
| Código | Trabajo | Listo cuando |
|---|---|---|
| R5.1 | Confirmación explícita del autor; `dev` → `main`; push a `main` (Vercel despliega producción) | Despliegue de producción exitoso |
| R5.2 | Smoke en producción: rutas, 404, CV, formulario, buzón, cambio de idioma con el fondo vivo | Todo responde |
| R5.3 | Después del release: dominio (lo compra el autor), Search Console y Bing, enlaces desde LinkedIn, GitHub y Platzi, medición de ocho semanas, X4b (el peloteo chistoso, al final) | Seguimiento en 008 y 003 |

## Decisiones del autor que faltan

- **D-R1, el buzón para visitantes.** La 011 lo manda siempre a `/[lang]/inbox`, así que un visitante cae en el inicio
  de sesión. Opciones: (a) como está; (b) el ícono solo se ve con la marca del autor; (c) visitante a Contacto y autor
  al panel, entrando por URL directa en un navegador nuevo.
- **D-R2.** ¿El post 2 entra en el release o después?
- **R1.3 y R2.1** necesitan su visto bueno visual y del texto.

## Orden de trabajo

R0 → R1.1 (auditoría) → R1.2 y R2 en paralelo, por zonas que no se pisan → R3 → R4 → visto bueno del autor → R5.
