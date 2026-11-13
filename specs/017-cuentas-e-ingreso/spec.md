# Spec 017 · Cuentas e ingreso con Google

Estado: en construcción, pendiente de revisión del autor antes de subir a dev.
Pedido del autor (2026-11-13): "quiero que la gente pueda ingresar", con cuatro usos (escribir posts invitados,
comentar con su cuenta, ayudarle con el panel y un botón de ingreso visible), ingreso con la cuenta de Gmail y
"luego yo lo reviso y digo si entra o no".

## Actores

- **Autor.** Entra con su contraseña, como hoy. Ve y decide todo.
- **Equipo.** Una cuenta de Google cuyo correo el autor agregó en el panel, con uno o más permisos: escribir posts,
  leer mensajes y moderar comentarios.
- **Lector.** Cualquier cuenta de Google. Comenta sin escribir su nombre ni su correo.

## Requisitos

- **FR-1701 · Botón visible.** La barra del sitio muestra "Ingresar", en escritorio y en el dock del celular, y
  lleva a `/{lang}/account`. Con sesión dice "Mi cuenta". La barra lo sabe por una cookie de pista sin datos
  personales, igual que el sobre del buzón.
- **FR-1702 · Ingreso con Google.** OpenID Connect con código de autorización, PKCE, `state` y `nonce`, escrito con
  `fetch` y `node:crypto`, sin dependencias nuevas. Solo entran cuentas con el correo verificado por Google. Se
  guardan el identificador de Google (`sub`), el correo, el nombre y las fechas de alta y de último ingreso. No se
  guardan foto ni tokens de Google.
- **FR-1703 · Sin configuración.** Si faltan las variables de Google, en Vercel la página dice que el ingreso aún no
  está activo. En local sin base de datos aparece un simulador marcado "solo local" para probar el flujo completo. El
  simulador no existe con base de datos ni en Vercel.
- **FR-1704 · Mi cuenta.** Muestra nombre, correo y permisos, con "Ir al panel" si los tiene, "Cerrar sesión" y
  "Borrar mi cuenta". Borrar quita la cuenta, sus sesiones y sus comentarios.
- **FR-1705 · Comentar con cuenta.** Con sesión, el formulario no pide nombre ni correo: usa los de la cuenta. La
  moderación no cambia. Sin sesión, el formulario de siempre sigue igual.
- **FR-1706 · Personas.** Una pestaña del panel, solo para el autor:
  - dar permisos a un correo y cambiarlos o quitarlos;
  - ver las cuentas;
  - bloquear, desbloquear y borrar cuentas.
- **FR-1707 · Equipo en el panel.** Cada persona del equipo ve solo las pestañas de sus permisos. Ajustes y Personas
  son solo del autor. Cada página y cada acción comprueba el permiso en el servidor.
- **FR-1708 · Posts invitados.** Quien tiene "escribir posts" ve solo sus borradores y no puede publicar: tiene
  "Enviar a revisión". El autor ve "En revisión · nombre" y decide si lo publica. Si lo publica, el post sale firmado
  con el nombre del invitado.
- **FR-1709 · El autor no cambia.** La contraseña del autor, el código de configuración y sus sesiones siguen igual.
- **FR-1710 · Sesiones de cuenta.** Cookie `httpOnly` propia, con 12 horas de inactividad y 7 días como máximo, igual
  que el autor. Bloquear o borrar una cuenta cierra sus sesiones.

## Supuestos y excepciones

- **A-1701 · Excepción pedida por el autor.** Esta spec rompe la regla de "sin variables de entorno nuevas" con dos:
  `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`. No hay infraestructura nueva: las cuentas viven en la misma base.
- **A-1702 · Pasos del autor en Google Cloud.**
  1. Crear un cliente OAuth de tipo "Aplicación web".
  2. Registrar como URI de redirección `https://<dominio>/api/auth/google/callback` para dev y para producción, y
     `http://localhost:3000/api/auth/google/callback` para local.
  3. Publicar la pantalla de consentimiento con los alcances `openid`, `email` y `profile`.
  4. Poner las dos variables en Vercel.
- **A-1703 · Privacidad.** La política suma una sección sobre el ingreso con Google. El texto queda para la revisión
  P-06 del autor.
- **A-1704 · Verificación del token.** El `id_token` llega directo del endpoint de tokens de Google por TLS. Por eso
  se validan `iss`, `aud`, `exp`, `nonce` y `email_verified` sin verificar la firma (OpenID Connect Core 3.1.3.7).

- **A-1705 · Enmienda de contrato.** `BlogPostingJsonLd['author']` deja de ser solo `{ '@id' }`. En un post invitado
  es `{ '@type': 'Person', name }`, para no atribuirle al autor un texto que no escribió. Los posts del autor siguen
  con el mismo `@id` del Person del sitio. El contrato se actualizó en `tests/unit/q0/signatures.ts`.
- **A-1706 · Respuestas del autor.** Moderar comentarios no incluye responder: la respuesta sale publicada como "del
  autor", así que solo la escribe el autor.

## Fuera de alcance

- Registro con contraseña para lectores, porque sin proveedor de correo no hay verificación ni recuperación.
- Notificaciones por correo al equipo.
- Que el lector reaccione con su cuenta: las reacciones siguen anónimas.
