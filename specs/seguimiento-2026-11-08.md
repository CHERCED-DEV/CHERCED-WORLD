# Seguimiento conciliado — 2026-11-08

Base de auditoría: `dev` 365c99b. Las casillas históricas no equivalen a funcionalidades ausentes.

| Spec | Estado conciliado | Trabajo siguiente |
|---|---|---|
| 001 | Histórica: plataforma, seguridad, contenido y shell están implementados; sus 58 casillas abiertas mezclan hotfix 2023 y aceptación original. | Validar criterios concretos antes de certificar la lista completa; no rehacer la migración. |
| 002 | Histórica y ampliada por 006/007/010. | El 404 de T227 sigue bajo T940 y corrección 011. |
| 003 | Laboratorio implementado con pruebas parciales; 59 casillas sin reconciliar individualmente. | Separar modelos reales, medición y funcionalidades futuras; no dar por verificado lo que solo usa dobles. |
| 004 | Contenido presente; decisiones posteriores de 007/010 prevalecen donde existe enmienda. | Verificación de fuente/privacidad, no reescritura masiva. |
| 005 | Blog y artículo post6 aprobados e integrados. | Nuevo flujo editorial privado en 011; publicaciones existentes siguen versionadas. |
| 006 | Base móvil presente y continuada por 007/010. | Ajuste fino T950/011, sin reemplazar mazo, escenas ni dock. |
| 007 | T962 absorbida por 009. T970/T971 superadas en lo visible por FR-1001–1005 de 010. T944 recibe A-1101. | T950/T961 continúan en 011. T960 necesita entrevista y contenido del autor. |
| 008 | Respuestas P-801–807 registradas; Instagram implementado. T865 conciliada. | Dominio, tokens, Search Console, Bing, enlaces externos y medición de ocho semanas dependen de sus acciones/datos. |
| 009 | Fases implementadas; T0929 sigue pendiente del autor. | Scroll progresivo y refinamiento 011; no modificar las 18 entradas ni publicar información privada. |
| 010 | Implementación del barrido presente. T1064 no certificada globalmente. | Corregir 404, ampliar inventario a arquitectura/post6 y cierre proporcional; no afirmar full verde. |
| 011 | Iteración activa de continuidad, edición privada y scroll. | Validación integrada y revisión visual. |

## Evidencias usadas para las sustituciones

- 009 `spec.md`, Input y apartados Página/Accesos: declara explícitamente la evolución del boceto de T962 a showcase propio; `SynergosView.tsx` y `AssemblyLine.tsx` implementan esa experiencia.
- 010 `spec.md`, Verificación y FR-1001–FR-1005: declara la reversión visible de T970 y reemplazo del enlace en Sobre mí. Es una decisión vigente, no una regresión que deba deshacerse.
- 008 `spec.md`, Respuestas del autor del 2026-11-07: registra P-801/802/803/806/807 y deja el resto a criterio del orquestador. Los trabajos externos permanecen abiertos.
- Auditoría 2026-11-08: lint/tipos, 1.990 unitarias, 180 e2e seleccionadas; 96 combinaciones de layout y reproducción del 404/RSC. No equivale a certificar las 348 casillas antiguas.

Los documentos de continuidad del 7 conservan su valor histórico. Su afirmación inicial de “sin push” fue superada por la orden de desplegar a desarrollo: 365c99b se publicó en `origin/dev`, Preview de Vercel confirmado exitoso. `main` no se modificó.
