# 011 — Continuidad, edición privada y scroll progresivo

Pedido del autor: 2026-11-08. Continuar sobre lo construido, corregir hallazgos, conciliar seguimiento, recuperar el acceso al buzón, añadir un dashboard para escribir artículos e introducir scroll-driven CSS en Synergos. Pruebas proporcionales al riesgo y avances continuos.

## Alcance y decisiones

- FR-1101: el CTA del caso cabe en su columna a 320 px en ES/EN sin reducir el área táctil ni eliminar texto.
- FR-1102: las rutas inexistentes de proyectos, posts y etiquetas devuelven 404 en HTML y RSC, conservando idioma, identidad y noindex. Las rutas válidas y las redirecciones de etiquetas no cambian.
- FR-1103: el icono de buzón abre siempre `/[lang]/inbox`, también en un navegador nuevo. La cookie `cw-author` es una pista visual, nunca autorización. Se conserva la sesión existente y la verificación en servidor.
- FR-1104: el panel conserva mensajes, moderación y configuración; añade Blog con borradores privados, título, descripción, idioma, etiquetas, contenido, vista previa y exportación.
- FR-1105: guardar verifica autorización, valida límites y usa control de versión optimista para no sobrescribir otra pestaña. Los errores conservan el texto del editor. No se ejecutan HTML, JSX ni expresiones del borrador.
- FR-1106: Mongo existente en entornos configurados; archivo privado persistente `.local/` en desarrollo sin Mongo. Sin Mongo en Vercel, fallo explícito: nunca fingir que se guardó. Sin proveedores, variables de entorno ni dependencias nuevos.
- FR-1107: alcance inicial editorial: borradores y exportación Markdown para revisión e incorporación al contenido versionado. Guardar no publica. Se consultó al autor la alternativa de publicar directamente; hasta una decisión distinta se conserva el modelo público actual. Los seis artículos existentes no se reescriben.
- FR-1108: progreso de lectura y trazos del sistema ligados al scroll en ambas páginas de Synergos usando CSS. Sin captura del scroll, sin desplazamiento artificial ni contenido oculto. `@supports` y `prefers-reduced-motion` conservan la experiencia estática. Navegación, anclas y diagramas de texto permanecen operables.
- FR-1109: seguimiento distingue trabajo histórico, sustituciones, implementación, validación y aprobación del autor. No convertir casillas antiguas en trabajo nuevo ni marcar tareas sin evidencia.

## Enmiendas de contrato acotadas

A-1101 (shell, sucesora de T944): el acceso al panel deja de depender de `cw-author`. Se actualizan los consumidores y pruebas de ese enlace. No cambia el contrato de sesión ni las respuestas privadas.

A-1102 (routing, complemento de T940/B6): el proxy encamina contenidos inexistentes al 404 global mediante reescritura interna; conserva la URL del visitante, los parámetros estáticos, el idioma y las cabeceras RSC. Evita la rama del framework que devolvía HTML dentro de una respuesta RSC. No se agrega catch-all ni se relaja el escáner. Los catálogos públicos existentes siguen siendo la fuente de IDs.

A-1103 (datos privados): repositorio editorial adicional, separado de los contratos congelados `Repos` y `PostMeta`; los borradores no entran en sitemap, RSS, búsqueda, asistente ni APIs públicas. No cambia el principio de contenido publicado tipado y versionado. La publicación directa requeriría registrar su decisión y contrato antes de implementarla.

## Propiedad y validación

Una sola implementación activa, sin agentes ni editores concurrentes. Foundation integra los cambios de shell/proxy; editorial posee `lib/editorial`, `lib/data/editorial.ts`, `lib/actions/editorial.ts`, `components/admin/editorial`, la ruta privada y sus pruebas; Synergos posee sus estilos/componentes; portfolio el CTA. Se reutiliza el checkout `dev` existente por continuidad de la integración autorizada.

Validaciones: tipos/lint; pruebas dirigidas de acceso y concurrencia editorial, escape de preview, rutas 404 HTML/RSC, CTA 320/375, panel móvil/escritorio, enlaces y scroll con movimiento reducido; una compilación final. No repetir suites globales sin motivo. T1064 sigue independiente hasta tener su evidencia completa.

## Fuentes técnicas

- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timeline
- https://nextjs.org/docs/app/api-reference/file-conventions/not-found

Aplicación de constitución: I, se conservan rutas e identidad; III, autorización del editor en servidor y borradores privados; VII, propiedad explícita y sin trabajo concurrente; VIII, misma infraestructura y publicación versionada.
