# Continuidad con Codex — 2026-11-07

## Estado guardado

Se conservaron los cambios pendientes en las ramas originales:

- `28c93b9`, `dev`: configuración de arranque de Claude.
- `c02aa84`, `lane/BLOG`: artículo post6 en ES/EN y sus pruebas.
- `a6f2d16`, `lane/UX`: ajuste del mapa y pruebas del barrido.

Se revisaron 43 directorios de trabajo Git; ninguno tenía cambios pendientes después de esos commits.

## Integración local en dev

- `09c19ff`: integra `lane/UX`, conservando las correcciones de idioma, fondo y tema que ya estaban en `dev`, además de Instagram en el JSON-LD.
- `c1fd5ba`: integra únicamente las especificaciones y evidencias de `lane/SYN2`; la fase 2 de Synergos todavía no está implementada.
- `449aa88`: corrige dos pruebas de integración: `llms.txt` usa la descripción vigente del diccionario; la prueba del reflejo espera la hidratación antes de mover el puntero.
- `f3efc7f`: incorpora el artículo bilingüe aprobado, con imágenes localizadas que existen en la versión actual del sitio.
- `c61b647`: incorpora la fase 2 de Synergos aprobada: ruta ES/EN, tres diagramas SSR con alternativa en texto, 18 patrones con fuentes, decisiones descartadas y fábrica; enlaces desde Synergos y los casos, paleta, asistente, sitemap y llms. Conserva los contratos y estilos existentes.

No se hizo push ni se modificó main. No se usó git reset, stash, clean ni operaciones para descartar cambios.

## Validación ejecutada

| Comprobación | Resultado |
|---|---|
| Blog, selección unitaria | 122 pruebas aprobadas |
| UX antes de integrar | lint, tipos, 1.963 pruebas aprobadas, 27 omitidas y build de 120 páginas |
| UX, navegador: CV, mapa, barrido y humo | 222 aprobadas, 276 omitidas por dispositivo/modo |
| dev después de integrar | lint, tipos, 1.963 pruebas aprobadas, 27 omitidas y build de 120 páginas |
| Auditoría de dependencias | sin vulnerabilidades altas ni críticas; 8 moderadas en herramientas de desarrollo |
| Navegador full en dev | 603 aprobadas, 3 fallidas, 1 interrumpida, 400 omitidas; 3.756 no llegaron a ejecutarse por el límite de tres fallos |
| Repetición dirigida de llms.txt y reflejo, tras corregir las pruebas | las 2 aprobadas; lint de ambos archivos aprobado |
| BLOG antes de integrar | verify: 1.976 unitarias, 27 omitidas y 130 páginas; 152 e2e y 4 auditorías de contraste de post6 |
| Synergos fase 2 con BLOG integrado | verify: 1.988 unitarias, 27 omitidas, build de 132 páginas; sin vulnerabilidades altas ni críticas |
| Ajuste final de búsqueda de proyectos | 131 unitarias relacionadas, lint de los archivos modificados y nuevo build aprobados |
| Navegador, Synergos fases 1/2 y paleta | 74 aprobadas, 47 omitidas y 2 fallos al escribir artefactos por falta de disco; repetición de ambas: 2 aprobadas |
| dev después de integrar artículo y arquitectura | verify aprobado: lint, tipos, 1.988 unitarias, 27 omitidas, 132 páginas y auditoría sin altas ni críticas |

Falta cerrar la suite completa. T1064 de la 010 permanece sin marcar.

Playwright no encontró su Chromium esperado en este equipo. Las pruebas de navegador se ejecutaron con el Chrome instalado y una configuración temporal externa al repositorio. No se cambió la configuración versionada ni se instalaron navegadores.

## Fallo pendiente: 404 con navegación RSC

El escaneo de privacidad falló por estado HTTP 500 en `/en/portfolio/999`, no por encontrar datos de visitantes en esa respuesta.

Reproducción sobre el build de producción de Next.js 16.4.3:

- GET `/en/portfolio/999` sin cabecera RSC: 404, HTML en inglés, con noindex.
- GET a la misma URL con `RSC: 1`: 500, text/plain; el servidor registra `Expected RSC response, got text/html`.
- También se reprodujo en `/es/portfolio/999`, `/en/portfolio/99`, `/en/blog/missing` y `/es/blog/tag/no-such-tag`.
- Un caso válido responde 200 tanto como documento HTML como en RSC.
- Una ruta totalmente desconocida como `/es/not-existing` sí responde 404 con contenido RSC.

Se probaron dos ajustes acotados, sin éxito. Ambos se deshicieron editando exclusivamente las líneas del experimento. La configuración, el proxy y las rutas quedaron exactamente como antes de los experimentos. No se añadieron excepciones al escaneo de privacidad ni se ocultó el 500.

La [documentación de Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/not-found) describe el 404 global para estructuras con un segmento dinámico en la raíz, como la de este proyecto. Sustituirlo implica revisar la decisión B6/T940 de la 007 y comprobar todos sus contratos de idioma, estado HTTP, identidad, SEO y navegación. No se ha hecho esa sustitución.

## Estado de decisiones y pendientes

- BLOG: post6 ya está integrado localmente y validado. No autoriza desplegar a main.
- Synergos fase 2: subpágina, boceto, 18 entradas y P-905 a P-909 aprobados; implementación integrada localmente y validada. T0929 conserva la revisión final del autor de la página terminada. T0924 no aplica porque el autor excluyó la experiencia del empleo.
- Cuarta escena de Sobre mí: T960 requiere la entrevista y aprobación del contenido. No se inventaron respuestas.
- SEO: compra de dominio, tokens y acciones en Search Console son tareas del autor; no se ejecutaron.

## Prioridad inmediata

1. Resolver el fallo RSC/404 preservando los contratos B6/T940; mantener el escáner estricto.
2. Repetir el escaneo de privacidad y completar la suite full sobre el resultado final.
3. Cerrar T1064 solo cuando exista evidencia completa.
4. Registrar la revisión final del autor de Synergos (T0929). El artículo y la implementación ya están incorporados.

## Espacio de disco y vista previa

El disco C llegó a unos 110 MB libres y Playwright no pudo guardar dos trazas. Se recuperó espacio aplicando compresión NTFS reversible únicamente a las cachés `.next` de SYN2, BLOG y dev; no se eliminaron archivos. Ambas comprobaciones se repitieron con éxito. El espacio libre sigue siendo limitado.

Vista previa local de la implementación: `http://localhost:3261/es/synergos/arquitectura` y su versión `/en/`. El servidor usa el build validado de SYN2, cuyo contenido coincide con la integración de dev. Las capturas finales de escritorio, móvil e inglés claro están en los outputs del chat.
