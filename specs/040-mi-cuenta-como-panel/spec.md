# 040 — Mi cuenta como panel

Pedido del autor, 2026-11-14: "Acá deberíamos poder cargar la imagen de perfil y, bueno, mucha data, país, todo eso,
que la persona vea como un dashboard de su información completa".

Estado: aprobada por el autor el 2026-11-14 con los valores por defecto ("Sí, construye"). Construida.

Depende de:
- **017:** cuentas, sesiones, comentarios con cuenta y posts invitados.

Enmienda:
- **FR-1702 (017):** "no se guardan foto ni tokens de Google" pasa a "no se guardan tokens de Google; de la foto se
  guarda solo el enlace que manda Google (claim `picture`)".
- **FR-1704 (017):** "Mi cuenta" deja de ser una tarjeta y pasa a ser el panel de esta spec. Borrar la cuenta borra
  también el perfil, la foto y los borradores de posts invitados.

Se conecta con:
- **038:** "Mis conversaciones" y la actividad del AI Lab entran en la sección "Tu actividad" de este panel cuando la
  038 se construya. Esta spec no las construye ni deja un hueco vacío a la vista.

## Qué resuelve

Hoy "Mi cuenta" muestra nombre, correo, permisos, "Cerrar sesión" y "Borrar mi cuenta". La persona no sabe qué más
guarda el sitio de ella, ni puede contar quién es. El autor no sabe quién lo lee.

Con esta spec, "Mi cuenta" es un panel con todo lo que el sitio sabe de la persona:
- su perfil, que ella llena si quiere;
- lo que ha hecho en el sitio;
- lo que autorizó y cuándo;
- sus datos para descargar o borrar.

## Qué datos se piden

Todos son opcionales. Cada campo muestra debajo, en una línea, para qué sirve. Nada del perfil es público: lo ven la
persona y el autor (P-4003).

| Dato | Cómo se pide | Para qué sirve |
|---|---|---|
| Foto de perfil | Subida, o la de Google, o ninguna (iniciales) | Que tu panel sea tuyo y que el autor te reconozca en Personas |
| País | Lista de países (ISO 3166-1) | Saber desde dónde me leen, para el idioma, el horario de una llamada y lo que escribo |
| Ciudad | Texto, 80 caracteres | Lo mismo, con más detalle si quieres darlo |
| Rol o profesión | Texto, 80 caracteres | Saber si me lee un reclutador, un líder técnico o un colega |
| Empresa | Texto, 80 caracteres | Saber para quién trabajas, si me escribes por una vacante o un servicio |
| LinkedIn | Enlace a `linkedin.com/in/…` | Conocerte antes de responderte |
| GitHub | Usuario de GitHub | Lo mismo, si eres de código |
| Idiomas | Casillas, hasta 6 de una lista de 12 | Saber en qué idioma hablarte |
| Qué te trae al sitio | Una opción y una nota de 280 caracteres | Saber qué buscas y mejorar lo que te muestro |
| Idioma del sitio | Español, inglés o automático | Que el sitio se abra en tu idioma en cualquier dispositivo |
| Tema | Oscuro, claro o automático | Que el sitio se vea como prefieres en cualquier dispositivo |

**Qué te trae al sitio** (P-4009): busco talento, quiero contratar un servicio, quiero aprender, quiero colaborar,
solo curiosidad u otro.

**Idiomas** (P-4010): español, inglés, portugués, francés, alemán, italiano, catalán, neerlandés, chino, japonés,
coreano y árabe. Los nombres salen de `Intl.DisplayNames` en el idioma de la página, sin dependencias.

**Preferencias.** Se aplican al guardarlas y la primera vez que se abre "Mi cuenta" en cada sesión del navegador.
Ingresar lleva a "Mi cuenta" por defecto, así que ahí se aplican en un dispositivo nuevo:
- el idioma lleva a `/{idioma}/account`; la cookie de idioma la pone el sitio al navegar, como hoy;
- el tema se aplica con el evento `cw:theme-change` que ya existe.

Después de esa primera vez, la persona puede cambiar de idioma o de tema a mano sin que el panel la devuelva.
"Automático" deja que decida el dispositivo, como hoy.

## Qué ve la persona

En escritorio, una cabecera y dos columnas de tarjetas de cristal. En celular, una sola columna sin scroll horizontal
a 320 y 375 px.

1. **Cabecera.** Foto o iniciales, nombre, correo, "En el sitio desde" y último ingreso, permisos del panel, "Ir al
   panel" si los tiene, y "Cerrar sesión".
2. **Autorización.** Mientras la persona no haya autorizado, un bloque con la casilla de la Ley 1581 aparece debajo de
   la cabecera, y los botones de guardar del perfil, la foto y las preferencias quedan desactivados. Autorizar crea el
   perfil vacío con la fecha y la versión del aviso.
3. **Tu perfil.** Los datos de arriba, en modo lectura. Con "Editar perfil" se abre el formulario. Al guardar vuelve a
   modo lectura con un aviso. Lo que está vacío dice "Sin completar".
4. **Tu foto.** Tres opciones: "Subir una foto", "Usar la de Google" (si la cuenta tiene una) y "Sin foto". Al subir,
   se ve una vista previa recortada antes de guardar.
5. **Preferencias.** Idioma y tema.
6. **Tu actividad.**
   - **Comentarios:** post con enlace, fecha, estado (en revisión, publicado o rechazado), el texto y la respuesta del
     autor si la hay. Cada uno con "Borrar este comentario" (P-4007).
   - **Posts invitados:** solo si tiene el permiso o algún borrador. Título, idioma, fecha y estado (borrador, en
     revisión o publicado, con enlace).
   - **Mis conversaciones y AI Lab:** llegan con la 038.
   - Sin actividad, la sección lo dice en una línea.
7. **Tus autorizaciones.** Lo que aceptaste y cuándo:
   - el ingreso con Google, con la fecha de alta de la cuenta;
   - el perfil, con la fecha y la versión del aviso;
   - los comentarios: cuántos autorizaste y la fecha del último;
   - las trazas del AI Lab, cuando exista la 038.

   Para el perfil hay "Retirar autorización", que borra el perfil y la foto y deja la cuenta.
8. **Tus datos.**
   - **"Descargar mis datos (JSON)".** Baja un archivo con todo lo de arriba (formato abajo).
   - **"Borrar mi cuenta".** Lo de hoy, con el borrado en cascada de abajo y un texto que dice qué se borra.

## Dónde se guarda la foto

**Recomendación: opción A, en MongoDB**, y la foto de Google como alternativa que la persona elige.

| | A. MongoDB, menos de 50 KB | B. Vercel Blob | C. Solo la URL de Google |
|---|---|---|---|
| Infraestructura | La base que ya existe | Un almacén nuevo en Vercel | Ninguna |
| Variable nueva | No | Sí, `BLOB_READ_WRITE_TOKEN`, con sus 4 condiciones | No |
| Subir una foto propia | Sí | Sí | No |
| Borrado en cascada | Un `deleteOne` en la misma base | Una llamada aparte que puede fallar sola | Nada que borrar |
| Quién puede verla | Solo quien tiene sesión, por una ruta del servidor | URL pública si alguien la obtiene | URL de Google |
| Costo | 50 KB por cuenta: 2.000 cuentas son 100 MB de los 512 MB gratis de Atlas | Plan gratis con tope; hay que vigilarlo | Cero |

**Por qué A:**
- Cumple el principio VIII sin excepciones: no hay infraestructura nueva ni variables nuevas.
- El borrado en cascada es atómico con el resto de la cuenta.
- La foto no queda en una URL pública.
- C no cumple el pedido: el autor quiere que la persona cargue su imagen.

**Cómo se procesa, en el navegador:**
1. La persona elige una imagen de hasta 15 MB.
2. El navegador la recorta al centro, la reduce a 256 × 256 px y la codifica en WebP. Si el navegador no sabe
   codificar WebP (Safari), usa JPEG.
3. Si pasa de 50 KB, baja la calidad hasta que quepa.
4. Al volver a codificarla se pierden los metadatos EXIF, incluida la ubicación GPS de la foto. Eso es parte del
   aviso.

Así no hace falta procesar imágenes en el servidor ni sumar dependencias.

**Qué comprueba el servidor:**
- que haya sesión de cuenta y autorización del perfil;
- el límite de frecuencia;
- que pese 50 KB o menos;
- que sea WebP o JPEG de verdad, por sus primeros bytes, no por lo que diga el navegador.

**Cómo se sirve:** `GET /api/account/avatar`, solo a la persona dueña y al autor. Con `content-type` fijo,
`nosniff`, `cache-control: private` y una versión en la URL para refrescarla.

**La foto de Google:** el ingreso guarda en `accounts.picture` el enlace que manda Google, solo si es `https` y de
`googleusercontent.com`. Se muestra con `<img referrerpolicy="no-referrer">`, sin pasar por el optimizador de
imágenes de Vercel. Las cuentas que ya existen la guardan en su próximo ingreso, cuando ya vieron el aviso nuevo.

## Ley 1581 de 2012

- **Autorización previa, expresa e informada (art. 9).** Antes de guardar su perfil, su foto o sus preferencias, la
  persona marca una casilla: «Autorizo a Camilo Hernández a guardar estos datos para lo que dice cada campo. Puedo
  verlos, corregirlos, descargarlos y borrarlos aquí cuando quiera». Se guardan la fecha y la versión del aviso.
- **Deber de informar (art. 12).**
  - Cada campo dice para qué sirve.
  - El aviso dice quién es el responsable, que todo es opcional y dónde ejercer los derechos.
- **La foto.** Una foto de la cara puede ser un dato sensible (art. 5). Por eso:
  - es opcional, y el aviso lo dice (art. 6);
  - nunca se usa para identificar a nadie;
  - no se comparte;
  - no sale en páginas públicas (P-4004).
- **Derechos (art. 8).** "Mi cuenta" es el canal para todos:
  - conocer: el panel y la descarga en JSON;
  - actualizar y rectificar: "Editar perfil";
  - prueba de la autorización: "Tus autorizaciones";
  - revocar la autorización y pedir la supresión: "Retirar autorización" y "Borrar mi cuenta".

  El correo de contacto sigue para quien no quiera usar el panel.
- **Borrado en cascada.** "Borrar mi cuenta" borra:
  - la cuenta;
  - sus sesiones;
  - el perfil y la foto;
  - sus comentarios;
  - sus borradores de posts invitados;
  - con la 038, sus trazas y su consentimiento del AI Lab.

  Los posts invitados ya publicados siguen firmados con su nombre, y el aviso de borrar lo dice (P-4006).
- **Política de privacidad (`content/site.ts`).**
  - "Si ingresas con tu cuenta de Google" pasa a decir que se guarda el enlace a la foto de Google.
  - Se suma la sección "Tu perfil en Mi cuenta": qué datos, para qué cada uno, quién los ve, cuánto tiempo (hasta que
    los borres o borres la cuenta) y cómo ejercer los derechos desde "Mi cuenta".
  - "Cómo consultar o eliminar tus datos" suma "Mi cuenta" junto al correo.
  - Cambia `privacy.updatedAt`.
  - El texto queda para la revisión P-06 del autor, como en la 017.
- **El aviso de ingresar.** En `content/account.ts` dice "Guardo solo tu nombre, tu correo y las fechas…". Pasa a
  incluir el enlace a la foto de Google.

## Modelo de datos

**`accounts` (existente), un campo nuevo:**

```ts
picture: string | null   // enlace de la foto de Google; se actualiza en cada ingreso
```

**`account_profiles` (colección nueva):** un documento por cuenta, solo si la persona guardó algo.

```ts
{
  _id: string,                    // accounts._id
  country: string | null,         // ISO 3166-1 alfa-2, 'CO'
  city: string | null,            // máx. 80
  role: string | null,            // máx. 80
  company: string | null,         // máx. 80
  linkedin: string | null,        // 'https://www.linkedin.com/in/slug'
  github: string | null,          // usuario, sin URL
  languages: string[],            // máx. 6 códigos de la lista
  reason: 'hiring' | 'services' | 'learning' | 'collaborate' | 'curious' | 'other' | null,
  reasonNote: string | null,      // máx. 280
  preferences: { lang: 'es' | 'en' | null, theme: 'dark' | 'light' | null },   // null = automático
  photo: 'upload' | 'google' | 'none',
  avatar: { data: Binary, type: 'image/webp' | 'image/jpeg', bytes: number, updatedAt: Date } | null,
  consent: { version: string, acceptedAt: Date },   // '2026-11-14'
  createdAt: Date,
  updatedAt: Date
}
```

- **Por qué una colección aparte y no campos en `accounts`:** cada visita con sesión lee la cuenta. La foto, de hasta
  50 KB, no debe viajar en esa lectura. Además, "Retirar autorización" y el borrado en cascada son un solo
  `deleteOne`.
- **Lecturas:** el perfil se lee con proyección sin `avatar`. La ruta de la foto lee solo `avatar`.
- **Índices:** solo `_id`, que Mongo crea solo.

**`comments` (existente), un índice nuevo** para "Tu actividad":
- `accountId_recent`: `{ accountId: 1, createdAt: -1 }`, parcial con `{ accountId: { $type: 'string' } }`.

El código crea el índice al conectarse, como ya hace con `googleSub_unique`, así que el nombre debe ser exactamente
ese.

**En Atlas no hay que crear nada a mano.** MongoDB crea `account_profiles` con el primer perfil que se guarda, y el
código crea `accountId_recent` la primera vez que lista los comentarios de una cuenta. Basta con que el usuario de la
base tenga el rol `readWrite`. Si no pudiera crear el índice, el error queda en el log y la lista funciona igual, solo
más lenta. Para crearlo a mano, en `comments`:
- nombre `accountId_recent`;
- llaves `{ accountId: 1, createdAt: -1 }`;
- filtro parcial `{ accountId: { $type: 'string' } }`.

En local sin base, todo vive en memoria, como el resto de la 017.

## Acciones del servidor

Todas validan con Zod, comprueban la sesión de cuenta en el servidor y responden con el `ActionResult` que ya existe.

| Acción | Qué hace | Límite por cuenta |
|---|---|---|
| `grantProfileConsent` | Guarda la autorización y crea el perfil vacío | 30 por hora |
| `saveProfile` | Guarda los campos del perfil. Sin autorización responde `consent_required` | 30 por hora |
| `uploadAvatar` | Guarda la foto procesada y pone `photo: 'upload'` | 10 por hora |
| `setPhotoSource` | Elige entre la subida, la de Google o ninguna. Con "ninguna" borra la foto subida | 30 por hora |
| `savePreferences` | Guarda idioma y tema, y pone la cookie de idioma | 30 por hora |
| `withdrawProfile` | Retira la autorización: borra el perfil y la foto | — |
| `deleteOwnComment` | Borra un comentario propio. Si no es suyo, `not_found` | 30 por hora |
| `deleteOwnAccount` | La de hoy, con la cascada nueva | — |

Rutas:
- **`GET /api/account/avatar`:** la foto de la persona. El autor pasa `?account=<id>` para Personas.
- **`GET /api/account/export`:** el JSON, con `content-disposition: attachment`, `no-store` y 10 por hora.

**El JSON de "Descargar mis datos":**

```ts
{
  exportedAt, site: 'CHERCED-WORLD', version: 1,
  account: { id, email, name, googleSub, picture, createdAt, lastLoginAt },
  permissions: Permission[],
  profile: { ...campos, preferences, photo, consent } | null,
  avatar: { type, bytes, updatedAt, dataUrl } | null,
  comments: Array<{ postId, comment, lang, status, consentAt, createdAt, authorReply }>,
  guestPosts: Array<{ id, title, lang, status, createdAt, updatedAt, url }>,
  consents: Array<{ kind, version, acceptedAt }>
}
```

Nunca incluye tokens, hashes de sesión ni datos de otras personas.

## Lo que ve el autor

En el panel, pestaña **Personas**, cada cuenta muestra además una línea: la foto o las iniciales, el país, el rol, la
empresa y qué la trae. Solo el autor ve Personas, como hoy. El equipo no ve perfiles.

## Requisitos

- **FR-4001** Todo dato del perfil es opcional, dice para qué sirve y se guarda solo con la autorización de la Ley
  1581, con fecha y versión.
- **FR-4002** Nada del perfil es público. Lo ven la persona y el autor. Las respuestas públicas y los datos de
  hidratación de otras páginas no lo incluyen.
- **FR-4003** La foto se procesa en el navegador a 256 px y 50 KB o menos. El servidor rechaza lo que pese más o no
  sea WebP o JPEG por sus primeros bytes.
- **FR-4004** La foto se sirve solo por `GET /api/account/avatar`, a la dueña y al autor, con `cache-control:
  private`.
- **FR-4005** "Mi cuenta" muestra perfil, foto, preferencias, actividad, autorizaciones y datos. En celular, a 320 y
  375 px, no hay scroll horizontal.
- **FR-4006** "Descargar mis datos" baja un JSON con todo lo que el sitio guarda de la persona y nada de otras.
- **FR-4007** "Borrar mi cuenta" borra en cascada cuenta, sesiones, perfil, foto, comentarios y borradores.
  "Retirar autorización" borra solo perfil y foto.
- **FR-4008** El ingreso guarda el enlace de la foto de Google, solo si es `https` de `googleusercontent.com`.
- **FR-4009** La política de privacidad y el aviso de ingresar se actualizan en el mismo cambio.
- **FR-4010** El diseño es el de hoy: cristal sobre el fondo, negro, blanco y `#25ED9E`, Montserrat. La barra del
  sitio, el ícono de "Mi cuenta" y los comentarios públicos no cambian.
- **FR-4011** Pruebas:
  - unitarias del repositorio de perfiles en memoria;
  - de las validaciones de Zod;
  - de las acciones: sin sesión, sin autorización, límites, borrado de un comentario ajeno y cascada;
  - de la detección de WebP y JPEG por bytes;
  - E2E de "Mi cuenta" con el simulador de ingreso local: llenar el perfil, subir una foto, descargar el JSON, borrar
    un comentario, retirar la autorización, borrar la cuenta, y celular a 375 px.

## Fuera de alcance

- Mostrar la foto en comentarios públicos o en la barra del sitio (P-4004, P-4005).
- Que Mini Cherced use el perfil (P-4008).
- Mensajes de contacto en "Tu actividad": el formulario de contacto no usa la cuenta.
- Procesar imágenes en el servidor.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-4001 | ¿Dónde se guarda la foto? | En MongoDB, menos de 50 KB (opción A) |
| P-4002 | ¿Se muestra la foto de Google sin que la persona la elija? | Sí, si la cuenta tiene una, hasta que suba otra o elija "Sin foto" |
| P-4003 | ¿Quién ve el perfil? | La persona y el autor en Personas. El equipo no |
| P-4004 | ¿La foto sale junto a los comentarios públicos? | No |
| P-4005 | ¿La foto reemplaza el ícono de "Mi cuenta" en la barra? | No, la barra no cambia |
| P-4006 | Al borrar la cuenta, ¿qué pasa con los posts invitados publicados? | Siguen publicados con su nombre; el aviso lo dice; para retirarlos escribe al autor |
| P-4007 | ¿Se puede borrar un comentario propio desde Mi cuenta? | Sí |
| P-4008 | ¿Mini Cherced usa el perfil (rol, empresa, qué te trae)? | No en esta spec; lo decide una spec futura con su propia autorización |
| P-4009 | ¿Las opciones de "Qué te trae al sitio"? | Busco talento, contratar un servicio, aprender, colaborar, curiosidad u otro |
| P-4010 | ¿La lista de idiomas? | Los 12 de arriba |
