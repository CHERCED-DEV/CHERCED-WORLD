# Tareas — 011

- [x] T1100 Registrar el alcance y las enmiendas acotadas de continuidad.
- [x] T1101 Adaptar el CTA de casos a su columna, sin reducir el texto ni el objetivo táctil.
- [x] T1102 Corregir el encaminamiento de contenidos inexistentes; comprobación inicial HTML/RSC 404 y válidos 200.
- [x] T1103 Acceso al buzón independiente de cookies y nueva pestaña Blog dentro del panel autenticado.
- [x] T1104 Editor privado, persistencia, control de versiones, vista previa segura y exportación; sin publicación implícita.
- [x] T1105 CSS progresivo ligado al scroll para Synergos, respetando movimiento reducido.
- [x] T1106 Conciliar decisiones y sustituir únicamente pendientes históricos con evidencia inequívoca.
- [x] T1107 Validar comportamiento integrado, recorrido editorial, responsive y compilación final. 2026-11-11: `npm run build` en verde (1.999 unitarias), e2e de editorial, 404, shell, dock, buzón, UX, Synergos y cambio de idioma en verde (283 pasan). Se ajustaron dos pruebas que seguían el comportamiento anterior del buzón (A-1101) y la búsqueda del contenido del editor tras recargar. El proxy queda en Node con un chunk de 247 KB; los posts se cargan aparte.
- [x] T1108 Revisión visual del autor del refinamiento y recorrido de scroll. Aprobada el 2026-11-12 (R1.3 de la 012).

T1101–T1105 describen implementación; T1107 conserva su validación final separada. No cierran T0929 ni T1064.
