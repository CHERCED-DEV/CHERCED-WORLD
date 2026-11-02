<!--
Sync Impact Report
- Version change: 1.0.0 → 2.0.0 (MAJOR: se elimina la gobernanza externa de Factoria) → 2.0.1 (PATCH:
  el principio III acepta sesiones con token opaco validado en servidor además de tokens firmados, sin
  cambiar su intención)
- Principios modificados:
  VI. Calidad verificable: la referencia a la política "testing" de Factoria y la cadena
      security-scan → pruebas → documentación pasan a un gate de calidad propio del proyecto.
- Secciones renombradas: "Restricciones técnicas y cumplimiento Factoria" → "Restricciones técnicas".
- Secciones eliminadas: dependencia de Factoria, Compliance Gate y Azure DevOps como fuente funcional.
  Motivo: Factoria y las demás herramientas corporativas son de Sistecredito y no se usan en proyectos
  personales (decisión del autor, 2026-11-01).
- TODOs resueltos: TODO(FACTORIA_CONTEXT) y TODO(ADO_CONTEXT) quedan sin objeto.
  TODO(FACTORIA_BFF_TENSION) se resuelve: la app accede a la base existente desde una capa de datos que
  solo corre en el servidor (sección "Restricciones técnicas").
- Plantillas dependientes: sin cambios; leen esta constitución en tiempo de ejecución.
-->

# CHERCED-WORLD Constitution

## Core Principles

### I. Evolución, no reemplazo (NON-NEGOTIABLE)

CHERCED-WORLD evoluciona; no se reemplaza por otro sitio. Toda entrega MUST conservar la identidad
reconocible del portafolio de 2023:

- Las rutas públicas existentes (`/`, `/aboutMe`, `/services`, `/portfolio`, `/portfolio/[id]`, `/blog`,
  `/blog/[id]`, `/contactMe`, `/inbox`) MUST seguir respondiendo. Si una ruta cambia de forma, la antigua
  MUST redirigir de forma permanente a la nueva.
- Las piezas firma MUST existir en la versión evolucionada, mejoradas pero reconocibles: intro
  "CHERCED / Front-End Developer", fondo animado de partículas ("GlitteringSea"), loaders de átomo y
  puntos, separadores, menú flotante móvil, botón "Back to top", logo de marca y tipografía Montserrat.
- La paleta base blanco/negro MUST seguir siendo la identidad dominante; el glassmorfismo se construye
  encima, no la sustituye.
- El contenido (experiencia, proyectos, cursos, servicios, posts) MUST migrarse, no reescribirse desde
  cero. Se permiten correcciones de ortografía y de falsos amigos ("Actually" → "Present",
  "Idioms" → "Languages") que conserven la voz del autor.
- Toda funcionalidad nueva MUST ser aditiva y vivir dentro del lenguaje visual existente.

**Rationale**: el valor del proyecto es su historia y su personalidad. Un rediseño que no se reconozca
como CHERCED-WORLD es un proyecto nuevo y queda fuera de alcance.

### II. Glass sobre movimiento

El glassmorfismo es la firma visual de la evolución y MUST convivir con las animaciones de fondo sin
sacrificar legibilidad ni rendimiento:

- Toda superficie translúcida MUST usar design tokens centralizados (desenfoque, opacidad, borde,
  saturación, sombra, radio). Los componentes MUST NOT definir valores de glass sueltos.
- El texto sobre superficies glass MUST cumplir contraste WCAG 2.2 AA (4.5:1 para texto normal, 3:1 para
  texto grande) en cualquier fotograma del fondo animado.
- Cuando el navegador no soporte desenfoque de fondo, o el usuario pida menos transparencia, las
  superficies MUST caer a una variante sólida equivalente.
- Con `prefers-reduced-motion`, las animaciones de fondo y de entrada MUST detenerse o reducirse a
  transiciones de opacidad.
- Las animaciones de fondo MUST tener un ciclo de vida gestionado: una sola instancia activa, pausa cuando
  la pestaña está oculta o el lienzo fuera de pantalla, y liberación de recursos al desmontar.

**Rationale**: el GlitteringSea original duplicaba su bucle en cada visita y nunca liberaba listeners.
El glass solo luce si el fondo se mueve con fluidez y el texto se sigue leyendo.

### III. Seguridad real, cero cartón (NON-NEGOTIABLE)

- Los secretos, credenciales y claves MUST NOT viajar al cliente ni quedar versionados en el repositorio.
- La autenticación MUST resolverse en el servidor con sesiones expirables y no falsificables: token
  opaco aleatorio validado contra el servidor, o token firmado. El estado de UI nunca es prueba de
  sesión.
- Cada endpoint o dato protegido MUST verificar autorización en el servidor. Ocultar un botón no es
  control de acceso.
- Los datos personales de visitantes (correo, teléfono, mensaje) MUST ser visibles solo para el
  administrador. Las respuestas públicas MUST NOT incluirlos, tampoco en datos serializados para
  hidratación.
- Toda entrada pública (contacto, comentarios, asistente IA) MUST validarse en el servidor y tener
  limitación de frecuencia y protección anti-spam.
- El asistente IA MUST responder únicamente con información pública del portafolio y MUST resistir
  instrucciones del usuario que intenten extraer datos privados, prompts de sistema o credenciales.

**Rationale**: la versión 2023 tenía credenciales en el bundle, un `||` en el login y un inbox
serializado en la página aunque la pantalla pidiera iniciar sesión.

### IV. Contenido como datos, renderizado en servidor

- El contenido MUST modelarse como datos tipados y versionados, con una única fuente de verdad por tipo
  de contenido.
- Las páginas públicas MUST entregar su contenido principal renderizado desde el servidor. Un rastreador
  sin JavaScript MUST ver títulos, textos y enlaces.
- El almacenamiento del navegador MUST NOT usarse como fuente de contenido. Solo guarda preferencias del
  visitante (idioma, tema, easter eggs descubiertos).
- La aplicación MUST NOT llamarse a sí misma por HTTP para leer sus propios datos ni introducir
  latencia artificial.
- Español e inglés MUST tener paridad de contenido. Una página publicada en un idioma sin traducción
  MUST indicarlo de forma explícita.

**Rationale**: la versión 2023 cargaba el "CMS" en localStorage y renderizaba `null` en el servidor,
así que el SEO prometido nunca existió.

### V. Rendimiento y accesibilidad medibles

Cada página pública MUST cumplir, medido en perfil móvil de gama media:

- Largest Contentful Paint ≤ 2,5 s, Cumulative Layout Shift ≤ 0,1, Interaction to Next Paint ≤ 200 ms.
- Puntaje de accesibilidad automatizado ≥ 95 y cero violaciones críticas.
- La intro de marca MUST NOT bloquear el contenido más de 1,5 s, MUST poder saltarse y MUST mostrarse
  como máximo una vez por sesión.
- Toda interacción MUST ser operable con teclado y lector de pantalla, incluidos menú flotante,
  carruseles, modales, command palette y asistente IA.

**Rationale**: el loader fijo de 4,5 s y los `setTimeout` decorativos ya no se aceptan. Los
presupuestos convierten "se siente rápido" en algo verificable.

### VI. Calidad verificable

- Cada historia de usuario MUST tener pruebas automatizadas que demuestren sus escenarios de aceptación
  críticos antes de considerarse terminada. Las pruebas son proporcionales al riesgo: más en seguridad,
  datos personales y contratos; menos en decoración.
- Los contratos compartidos (tipos de contenido, contratos de API, design tokens) MUST tener pruebas de
  contrato que fallen si un consumidor y un proveedor divergen.
- Antes de integrarse, cada lane MUST pasar el gate de calidad: lint, verificación de tipos, pruebas,
  build de producción y auditoría de dependencias sin vulnerabilidades altas ni críticas. La
  documentación afectada MUST actualizarse en el mismo cambio.

**Rationale**: la versión 2023 no tenía pruebas, y sus validaciones de Mongoose (`require` en lugar de
`required`) nunca se ejecutaron sin que nadie lo notara.

### VII. Líneas de trabajo con propiedad exclusiva (NON-NEGOTIABLE)

El trabajo se ejecuta en paralelo con agentes, y MUST hacerse sin solapes:

- Cada tarea MUST pertenecer a exactamente una línea de trabajo (lane).
- Cada lane MUST declarar un conjunto de rutas propias disjunto del de cualquier otra lane. Una lane
  MUST NOT modificar rutas de otra.
- Los artefactos compartidos (contratos de contenido, contratos de API, design tokens, layout raíz,
  configuración del proyecto, dependencias) MUST pertenecer a una única lane "Foundation" y MUST
  congelarse antes de que arranquen las demás.
- Cambiar un artefacto congelado MUST hacerse con una enmienda de contrato registrada en el plan,
  ejecutada por la lane Foundation y comunicada a las lanes consumidoras.
- Cada lane MUST poder probarse de forma aislada contra los contratos congelados, con dobles de prueba
  para lo que provean otras lanes.
- El orden de integración de lanes MUST quedar definido en `tasks.md`.

**Rationale**: dos agentes que editan el mismo archivo producen conflictos y regresiones silenciosas.
La propiedad exclusiva es lo que hace posible el paralelismo.

### VIII. Simplicidad operativa (NON-NEGOTIABLE)

Es un portafolio personal, no una plataforma. La complejidad MUST ser la mínima que cumpla cada
escenario de aceptación:

- Desplegar MUST ser un push (o merge) a `main`: el proyecto existente en Vercel compila y publica solo.
  Un despliegue MUST NOT requerir pasos manuales, scripts adicionales ni consolas externas.
- MUST NOT añadirse infraestructura nueva: ni servicios, ni bases de datos, ni colas, ni proveedores
  externos que requieran cuentas o claves nuevas.
- MUST NOT añadirse variables de entorno nuevas en Vercel. Se reutilizan las existentes (conocidas en el
  código: `MONGODB_INTEGRAL_DB`, `VERCEL_URL_CORS`). La configuración no secreta MUST vivir versionada
  dentro del repositorio. Un secreto nuevo nunca se versiona (principio III), así que una
  funcionalidad que lo necesite MUST rediseñarse o salir del alcance.
- Toda dependencia nueva MUST justificar por qué la plataforma o el framework no resuelven lo mismo.
- Ante dos diseños que cumplen, MUST elegirse el que tenga menos piezas móviles.

**Rationale**: el autor quiere un sitio que se mantenga solo. Cada servicio o variable de más es algo
que se rompe en silencio el día que nadie lo está mirando.

## Restricciones técnicas

- Stack: Next.js 16 y React 19 con App Router y TypeScript estricto, desplegado en el proyecto de Vercel
  que ya existe.
- Proyecto personal: MUST NOT usarse herramientas, servicios, conectores ni identidades corporativas
  (Factoria, Azure DevOps, Datadog o Fluid Attacks de Sistecredito, ni correos de empleadores).
- Datos: la aplicación accede a la base de datos existente solo desde código que corre en el servidor,
  concentrado en una única capa de datos. Ningún módulo que llegue al cliente MUST importar esa capa.
- Documentación en español, con términos técnicos en inglés. Sin comentarios en el código fuente salvo
  que el framework o una herramienta los requiera.

## Flujo de trabajo y quality gates

1. `/speckit.specify` → `/speckit.clarify` (opcional) → `/speckit.plan` → `/speckit.tasks` organizado
   por lanes → `/speckit.analyze` → `/speckit.implement` por lane.
2. Cada lane trabaja en su propia rama o worktree y entrega su propio PR. Un PR MUST tocar solo rutas
   de su lane. `main` es producción: todo lo que se integra a `main` se despliega solo, así que un PR
   MUST estar listo para producción al integrarse.
3. Definition of Done de una tarea: escenarios de aceptación cubiertos por pruebas, presupuestos del
   principio V sin regresión, gate de calidad del principio VI en verde, documentación actualizada y
   cero rutas ajenas modificadas.
4. Ninguna lane se integra si rompe un contrato congelado. La lane Foundation se integra primero y el
   resto sigue el orden de `tasks.md`.

## Governance

- Esta constitución prevalece sobre cualquier otra práctica del repositorio.
- Enmiendas: se proponen por escrito con su motivación, se registran en el Sync Impact Report y
  requieren aprobación del autor del proyecto.
- Versionado semántico: MAJOR si se elimina o redefine un principio; MINOR si se añade un principio o
  sección o se amplía materialmente su guía; PATCH para aclaraciones y redacción.
- Revisión de cumplimiento: cada plan, cada `tasks.md` y cada PR MUST verificar los principios I, III,
  VII y VIII de forma explícita.

**Version**: 2.0.1 | **Ratified**: 2026-11-01 | **Last Amended**: 2026-11-01
