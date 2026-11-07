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

## Decisiones que siguen pendientes

- BLOG: el autor aprobó incorporar post6 cuando pasara las validaciones. Se corrigieron sus referencias al SVG retirado por la 010, usando la variante de cada idioma. `verify` pasó con 1.976 unitarias, 27 omitidas y 130 páginas; también 152 e2e del blog y cuatro auditorías de contraste del nuevo post. Preparado para integrar localmente; no autoriza desplegar a main.
- Synergos fase 2: el autor aprobó la subpágina, el boceto, las 18 entradas del atlas y P-905 a P-909. La implementación continúa en lane/SYN2; las aprobaciones se registran en su spec.
- Cuarta escena de Sobre mí: T960 requiere la entrevista y aprobación del contenido. No se inventaron respuestas.
- SEO: compra de dominio, tokens y acciones en Search Console son tareas del autor; no se ejecutaron.

## Prioridad inmediata

1. Resolver el fallo RSC/404 preservando los contratos B6/T940; mantener el escáner estricto.
2. Repetir el escaneo de privacidad y completar la suite full sobre el resultado final.
3. Cerrar T1064 solo cuando exista evidencia completa.
4. Incorporar el artículo validado y continuar Synergos fase 2 con las decisiones ya confirmadas del autor.
