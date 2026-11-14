# 039 — Modo privado de Mini Cherced

Pedido del autor, 2026-11-14: una experiencia distinta de Mini Cherced para una persona especial que él invita,
"extraordinariamente cariñosa, bromista, cómplice y llena de sorpresas".

Estado: spec. No construida. El contenido lo escribió el autor y vive en `content/mini-cherced/privado/`, que Git
ignora. **Esta spec es pública a propósito: describe el mecanismo y no dice para quién es ni qué dice.**

Depende de:
- **018:** Mini Cherced;
- **036:** la identidad;
- **017:** el ingreso con Google, que es el acceso del modo (P-3901).

## El principio

El código del modo es público, como todo el repositorio, pero genérico: un "modo invitado" que no sabe nada hasta que
el servidor verifica el acceso. **Ni el nombre, ni las frases, ni las escenas viven en el código, en el bundle del
navegador ni en las instrucciones que recibe cualquier visitante.** No basta con decirle al modelo "no lo cuentes": si
el contenido no está en la sesión de un visitante, no hay forma de sacárselo.

## Cómo funciona

1. **Acceso con su cuenta de Google** (P-3901, decidido por el autor el 2026-11-14). La invitada toca "Ingresar" y
   entra con Google, como cualquier cuenta de la 017.
   - El documento de `guest_modes` guarda el hash SHA-256 de su correo, con la sal `GUEST_EMAIL_SALT`; ni su correo
     ni su nombre aparecen en claro.
   - Al resolver la sesión de cuenta, el servidor compara el hash del correo verificado por Google con ese y activa el
     modo.
   - No hay cookie aparte ni clave que recordar: el modo dura lo que dura la sesión de cuenta (7 días como máximo).
   - "Salir del modo" deja ver el sitio normal sin cerrar la sesión, y "Cerrar sesión" termina todo.
2. **Contenido en el servidor.** La persona, las frases aprobadas, las escenas, los disparadores y el mensaje final
   viven en MongoDB, en la colección `guest_modes`, que solo lee el servidor. El autor la carga desde su archivo privado
   con un script local (`npm run guest:upload`), que lee `privado/`, arma el JSON y lo valida con Zod.
3. **Mini Cherced invitado.** Con la sesión de la invitada, `POST /api/agent/session` pide a Google un token cuya
   `systemInstruction` bloqueada trae la persona del modo invitado. Los tokens de los demás visitantes nunca la
   traen.
4. **Sorpresas en el navegador.**
   - Con la sesión de la invitada, `GET /api/guest` entrega al cliente solo lo que la experiencia necesita:
     disparadores, textos de las escenas y posiciones de las estrellas.
   - Con cualquier otra sesión o sin sesión responde 404, para no revelar que el modo existe.
5. **Nada se guarda.** Las conversaciones del modo invitado no entran a las trazas de la 038 ni a ningún registro.
6. **Transparencia.** La invitada tiene una vista "Lo que Camilo preparó para ti", con todo el contenido. Un botón
   "Quiero que retires algo" le manda un mensaje al buzón del autor.

## Experiencia

Viene del documento privado del autor, por fases:

1. **Hablar con ella.** Mini Cherced con la persona del modo invitado:
   - el tono se adapta a lo que ella expresa, sin diagnosticar emociones;
   - frases aprobadas, sin inventar recuerdos;
   - las respuestas espontáneas.

   Es lo de mayor valor y lo primero.
2. **La bienvenida y los easter eggs.**
   - Una escena de entrada propia y reacciones a palabras clave.
   - Las palabras se detectan en los subtítulos o en el texto, del lado del cliente, con la lista que entrega
     `/api/guest`.
   - Animaciones 2D nuevas sobre el sprite actual: corazones, una casita, una toga, un abrazo, una alerta de sistema y
     ojos que miran fijo. Cuando exista la 037, pasan a vóxeles.
3. **La misión.**
   - Cinco estrellas escondidas por el sitio, visibles solo en el modo invitado.
   - El progreso se guarda en el navegador y se puede repetir.
   - Al completarlas, una escena final hablada.

## Requisitos

- **FR-3901** Ningún dato del modo (nombre, frases, escenas, disparadores) aparece en el repositorio, en el bundle del
  navegador ni en tokens de otros visitantes. Un chequeo local, fuera del repositorio, busca el nombre en el build
  antes de cada push.
- **FR-3902** Sin la sesión de la invitada, `/api/guest` responde 404 y la sesión del agente es la de cualquier
  visitante.
- **FR-3903** El acceso se verifica en el servidor con la cuenta de Google (correo verificado, comparado por hash con
  sal). Escribir "soy X" en el chat no activa nada.
- **FR-3904** Las conversaciones del modo no se guardan. "Salir del modo" borra el progreso de las estrellas.
- **FR-3905** La invitada puede ver todo lo preparado y pedir que se retire algo.
- **FR-3906** Mini Cherced habla del autor en tercera persona y nunca presenta un texto generado como escrito por él.
- **FR-3907** `GUEST_EMAIL_SALT` es la única variable nueva y cumple el principio VIII:
  - va en la tabla del README;
  - es solo del servidor;
  - sin ella el modo no existe.
- **FR-3908** El modo necesita el ingreso con Google de la 017 configurado en Vercel. Sin él, el modo no existe y el
  sitio sigue igual.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-3901 | ¿Cómo entra la invitada? | **Decidido:** con su cuenta de Google |
| P-3902 | ¿Dónde vive el contenido? | En MongoDB (`guest_modes`), cargado por un script local desde `privado/` |
| P-3903 | ¿Cuánto dura el acceso? | Lo que dura la sesión de cuenta: 7 días, y se renueva al volver a entrar |
