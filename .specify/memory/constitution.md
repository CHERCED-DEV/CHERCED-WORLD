<!--
Sync Impact Report
- Version change: (plantilla sin ratificar) → 1.0.0
- Principios definidos (nuevos):
  I. Evolución, no reemplazo (NON-NEGOTIABLE)
  II. Glass sobre movimiento
  III. Seguridad real, cero cartón (NON-NEGOTIABLE)
  IV. Contenido como datos, renderizado en servidor
  V. Rendimiento y accesibilidad medibles
  VI. Calidad verificable
  VII. Líneas de trabajo con propiedad exclusiva (NON-NEGOTIABLE)
  VIII. Simplicidad operativa (NON-NEGOTIABLE)
- Secciones añadidas: "Restricciones técnicas y cumplimiento Factoria", "Flujo de trabajo y quality gates"
- Secciones eliminadas: ninguna
- Plantillas dependientes: plan-template.md, spec-template.md y tasks-template.md leen esta constitución
  en tiempo de ejecución; no se modificaron.
- TODOs diferidos:
  - TODO(FACTORIA_CONTEXT): las políticas, ADRs y Golden Rules de la factory "next" deben cargarse con
    get_factory_context("next") antes de /speckit.plan. El MCP de Factoria requería autenticación el
    2026-11-01, así que su contenido no está transcrito aquí y no se debe suponer.
  - TODO(ADO_CONTEXT): la consulta a Azure DevOps falló el 2026-11-01 ("fetch failed"); repetirla antes
    del plan por si existen work items relacionados.
  - TODO(FACTORIA_BFF_TENSION): la regla BFF de la factory "next" (sin acceso directo a BD) y el
    principio VIII (sin servicios nuevos, reutilizar la BD que ya existe) están en tensión. Se resuelve
    en /speckit.plan con el contexto de Factoria cargado. Ningún artefacto la da por resuelta antes.
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
- La autenticación MUST resolverse en el servidor con sesiones firmadas y expirables. El estado de UI
  nunca es prueba de sesión.
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
- Después de cada cambio de código MUST ejecutarse la cadena: security-scan → pruebas → documentación.
- Cobertura, herramientas y umbrales de prueba se rigen por la política `testing` de Factoria, no por
  esta constitución.

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

## Restricciones técnicas y cumplimiento Factoria

- Modo de trabajo: **Full-Stack (Next.js 16 + React 19)**, factory `next` de Factoria.
- Las políticas (`security`, `testing`, `coding-standards`), los ADRs y las Golden Rules de la factory
  `next` son vinculantes y prevalecen sobre cualquier preferencia de este documento. MUST cargarse desde
  el MCP de Factoria con `get_factory_context("next")`. Las reglas de Factoria MUST NOT suponerse ni
  transcribirse de memoria.
- Regla BFF de la factory `next`: la aplicación Next.js no accede directamente a bases de datos. El
  principio VIII prohíbe servicios nuevos y pide reutilizar la base de datos existente. Esa tensión
  MUST resolverse en `/speckit.plan` con el contexto de Factoria cargado (TODO(FACTORIA_BFF_TENSION)), y
  la resolución MUST quedar registrada en el plan como decisión explícita.
- `/speckit.plan` MUST pasar el Compliance Gate de Factoria (Gate 1: políticas; Gate 2: ADRs y estructura
  ADR-001; Gate 3: workflow cargado) antes de producir arquitectura.
- Documentación generada en español, con términos técnicos en inglés. Sin comentarios en el código
  fuente salvo que el framework o una herramienta los requiera.
- Azure DevOps es la fuente funcional (work items, criterios de aceptación). Las escrituras en Azure
  DevOps, Datadog o Fluid Attacks solo ocurren cuando el autor lo pide.

## Flujo de trabajo y quality gates

1. `/speckit.specify` → `/speckit.clarify` (opcional) → `/speckit.plan` con Compliance Gate →
   `/speckit.tasks` organizado por lanes → `/speckit.analyze` → `/speckit.implement` por lane.
2. Cada lane trabaja en su propia rama o worktree y entrega su propio PR. Un PR MUST tocar solo rutas
   de su lane. `main` es producción: todo lo que se integra a `main` se despliega solo, así que un PR
   MUST estar listo para producción al integrarse.
3. Definition of Done de una tarea: escenarios de aceptación cubiertos por pruebas, presupuestos del
   principio V sin regresión, security-scan limpio, documentación actualizada y cero rutas ajenas
   modificadas.
4. Ninguna lane se integra si rompe un contrato congelado. La lane Foundation se integra primero y el
   resto sigue el orden de `tasks.md`.

## Governance

- Esta constitución prevalece sobre cualquier otra práctica del repositorio, excepto las políticas,
  ADRs y Golden Rules de Factoria, que prevalecen sobre ella.
- Enmiendas: se proponen por escrito con su motivación, se registran en el Sync Impact Report y
  requieren aprobación del autor del proyecto.
- Versionado semántico: MAJOR si se elimina o redefine un principio; MINOR si se añade un principio o
  sección o se amplía materialmente su guía; PATCH para aclaraciones y redacción.
- Revisión de cumplimiento: cada plan, cada `tasks.md` y cada PR MUST verificar los principios I, III,
  VII y VIII de forma explícita.

**Version**: 1.0.0 | **Ratified**: 2026-11-01 | **Last Amended**: 2026-11-01
