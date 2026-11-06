# Fuente pública de Synergos (conteo del 5 de noviembre de 2026)

Datos sacados en solo lectura del tablero de Synergos (`specs/LINEAS.md`, `specs/DECISIONES.md` y el `tasks.md` de cada
línea) y de los repos Synergos.CMS y Synergos.UI. Solo va aquí lo que se puede publicar. **No se publican**: proveedores,
costos ni pasos de infraestructura de Producción; textos legales en borrador (como la retención de la historia clínica);
rutas locales, datos de prueba, códigos de compra ni hashes; nada del repo raíz más allá de estas cifras.

## Las 14 líneas

| id | nombre | qué hace | estado | tareas hechas / total |
|---|---|---|---|---|
| 001 | Núcleo | La maquinaria genérica que usan todos los verticales: saga, puerta del CMS, pasos y contratos | activa | 102 / 104 |
| 002 | Producción | Que la app salga a producción y se pueda volver a desplegar sin consola, con ensayo | activa | 59 / 59 |
| 003 | Salud | La cita médica y después el módulo de salud entero, en 8 incrementos | activa | 58 / 66 |
| 012 | Blogs/Social | Una red de publicaciones con comentarios y moderación, compuesta por páginas desde Umbraco | activa | 18 / 37 |
| 004 | Tienda | La compra con devolución | cerrada | 49 / 58 |
| 005 | Alquiler | Renta de equipos con garantía retenida | cerrada | 49 / 49 |
| 006 | Viajes y Hoteles | Estadía, vuelo y auto en una sola reserva, con reembolso | cerrada | 43 / 44 |
| 008 | Propiedades | La visita con franjas reales | cerrada | 36 / 41 |
| 009 | Gobierno | El trámite: radicar, revisar, decidir y notificar | cerrada | 41 / 50 |
| 010 | Educación | La matrícula a un curso con pago y devolución | cerrada | 38 / 38 |
| 011 | Booking | La reserva de un servicio por franja, con cobro | cerrada | 41 / 44 |
| 013 | Seller | La consola del personal de la tienda: pedidos, despacho y devoluciones | cerrada | 30 / 38 |
| 014 | Piloto Lego | Partir la tienda en capas y componerla por páginas desde Umbraco | cerrada | 22 / 22 |
| 007 | Eventos | La puerta del recinto y la transferencia | en pausa | 1 / 59 |

## El MVP

- Un único release con todo completo: Salud con su módulo entero y Blogs con su plan, más las piezas del núcleo que
  piden. Hasta entonces nada se despliega, y producción solo sale con una etiqueta de release que pone el director.
- No hay fecha publicada.

| Hito | Estado |
|---|---|
| Núcleo genérico: saga, puerta del CMS, consentimiento, auditoría, firma, documentos y notificaciones | hecho |
| Tienda compuesta por piezas desde Umbraco (piloto Lego) | hecho |
| Siete verticales con su flujo medido (Alquiler, Viajes, Gobierno, Educación, Booking, Propiedades y Seller) | hecho |
| Despliegue sin consola, con ensayo | hecho |
| Salud I1: la cita real de punta a punta | hecho |
| Salud I2: la historia clínica | en curso |
| Blogs I3: Umbraco compone la red por páginas | en curso |
| Salud I3 a I8 y Blogs I4 a I6 | pendiente |
| Release único con etiqueta | pendiente |

## Cifras

- 14 líneas con su spec.
- 587 de 709 tareas cerradas (subestima lo pendiente: Salud I3 a I8 y parte de Blogs aún no tienen tareas escritas).
- Más de 6.600 tests automáticos en el backend (6.675 en tres suites).
- 92 gates de arquitectura.
- Más de 140 ADR escritas.
- Backend: 20 servicios `Api` y 10 `Bff`.

## Enlaces públicos

- Catálogo de elementos en vivo: https://synergos-ui.synergos-labs.workers.dev/
- Código: https://github.com/CHERCED-DEV/Synergos.CMS · https://github.com/CHERCED-DEV/Synergos.UI ·
  https://github.com/CHERCED-DEV/Synergos.Fabrica
