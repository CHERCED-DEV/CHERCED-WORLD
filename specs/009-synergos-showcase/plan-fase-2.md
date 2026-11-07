# Plan de integración de la fase 2

Las decisiones P-904 a P-909, el boceto y las 18 entradas fueron aprobados por el autor el 2026-11-07.

La implementación amplía los componentes y contratos existentes. Conserva las rutas actuales, Montserrat, GlitteringSea y los tokens de cristal, sin dependencias ni configuración de infraestructura nuevas.

## Contratos compartidos

- `Project.patterns` es opcional y enlaza los casos 12 y 13 con las anclas del atlas, sin duplicar explicaciones.
- `SynergosFacts.designSystem` es opcional; el conteo actual se centraliza en `content/synergos.ts`, con fecha 2026-11-05. El backend cuenta 20 capacidades y 9 orquestadores desplegables, excluyendo bibliotecas compartidas.
- `AssistantFacts.architecture` es opcional. El índice proyecta los datos públicos; el asistente no importa contenido del servidor y conserva sus reglas de rechazo.
- La paleta recibe un comando adicional; no cambia la navegación principal. Sitemap, llms y metadatos incluyen ambas rutas localizadas.

## Secuencia y validación

Datos tipados y confidencialidad; vista SSR y diagramas con alternativa nativa en texto; atlas y enlaces; contratos y fábrica; accesos y SEO; validación automática y visual; integración local en dev.

La rama BLOG se integra antes de la validación final para comprobar el artículo y la arquitectura juntos. No se publica ni se modifica main. La revisión final del autor (T0929) sigue separada de la aprobación del boceto. El fallo RSC de rutas inexistentes ya documentado sigue impidiendo declarar cerrada la validación global de la spec 010.
