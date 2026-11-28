# Especificación de la funcionalidad: Sala de lectura de la bitácora

**Rama**: `900-sala-de-lectura` | **Creada**: 2026-11-27 | **Estado**: Borrador

**Entrada**: «Quiero que leer la bitácora se sienta como una sala de lectura: que quien llega encuentre, guarde y siga lo que le interesa, en español y en inglés».

> Muestra inventada para la demo de Cotejo en el AI Lab. La bitácora, sus lectores y su autora son ficticios. Esta spec trae defectos sembrados a propósito, y su verdad vive junto a este archivo.

## Contexto

La bitácora existe desde hace cuatro años. La escribe una sola autora, que publica sobre arquitectura de software, pruebas y trabajo con agentes.

Hoy cada artículo es una página larga con un título, el texto y los comentarios al final. Quien llega desde un enlace no sabe cuánto le falta, no puede guardar el artículo y no se entera de lo nuevo si no vuelve a la portada.

La autora quiere que la lectura sea el centro y que todo lo demás se pueda quitar sin romperla. Por eso esta spec separa cada pieza en su propia historia, con su prueba independiente.

Nada de lo que pide esta spec usa un servicio de pago ni un servidor nuevo. Lo que necesita un servidor, como el boletín o los comentarios, usa el que la bitácora ya tiene.

## Escenarios de usuario y pruebas

La bitácora publica artículos técnicos largos, en español y en inglés. Esta spec reúne lo que pasa alrededor del texto: leer, seguir, guardar, buscar, conversar, escuchar y leer sin red.

### Historia de usuario 1: Leer un artículo de principio a fin (Prioridad: P1)

Una lectora llega a un artículo largo desde un enlace compartido. Quiere saber cuánto le falta, saltar a la sección que le interesa y copiar un fragmento de código sin seleccionarlo a mano.

Esta historia persigue la mejor experiencia de lectura en un celular, que es donde se abre la mayoría de los enlaces compartidos.

**Por qué esta prioridad**: casi todas las visitas entran por un artículo y no por la portada, así que la lectura es el corazón de la bitácora.

**Prueba independiente**: se abre un artículo de 3.000 palabras en un celular de gama media y se recorre completo con el teclado y con el dedo.

**Escenarios de aceptación**:

1. **Dado** un artículo abierto, **cuando** la lectora baja por la página, **entonces** una barra de progreso indica qué parte del texto lleva leída.
2. **Dado** un artículo con cinco secciones, **cuando** la lectora abre la tabla de contenido, **entonces** ve los cinco títulos y cada uno la lleva a su sección.
3. **Dado** un bloque de código, **cuando** la lectora pulsa «Copiar», **entonces** el código queda en el portapapeles y un aviso lo confirma.
4. **Dado** que la lectora llegó al final del artículo, **cuando** pulsa «Volver arriba», **entonces** la página sube al título sin recargarse.
5. **Dado** un artículo con versión en inglés, **cuando** la lectora cambia de idioma, **entonces** llega a la misma sección en la otra versión.

### Historia de usuario 2: Seguir la bitácora sin volver a buscarla (Prioridad: P1)

Un lector quiere enterarse de cada entrada nueva sin visitar la portada todos los días. Puede usar su lector de feeds, recibir un correo o aceptar un aviso del navegador.

Hoy la bitácora solo tiene el feed. El boletín por correo y los avisos del navegador son nuevos, y los dos piden permiso antes de mandar nada.

**Por qué esta prioridad**: quien se suscribe vuelve; sin suscripción, cada visita depende de que alguien comparta el enlace.

**Prueba independiente**: se publica una entrada de prueba y se comprueba que llega por los tres canales a una cuenta de prueba.

**Escenarios de aceptación**:

1. **Dado** un lector de feeds con la dirección del feed en español, **cuando** se publica una entrada, **entonces** la entrada aparece con su título, su resumen y su enlace.
2. **Dado** que un lector escribe su correo en el formulario del boletín, **cuando** lo envía, **entonces** recibe un mensaje con un enlace de confirmación.
3. **Dado** un enlace de confirmación vencido, **cuando** el lector lo abre, **entonces** la página le explica cómo pedir uno nuevo.
4. **Dado** que el lector aceptó los avisos del navegador, **cuando** se publica una entrada, **entonces** recibe un aviso con el título de la entrada.
5. **Dado** un correo del boletín, **cuando** el lector pulsa «Darme de baja», **entonces** deja de recibirlo sin escribir su contraseña.

### Historia de usuario 3: Guardar un artículo para después (Prioridad: P2)

Una lectora encuentra un artículo en el trabajo y quiere leerlo en la noche, en otro dispositivo. Lo guarda en su lista de lectura con un toque.

Al terminarlo, lo marca como leído y la lista se limpia sola. Si cambia de bitácora, se lleva sus enlaces en un archivo.

**Por qué esta prioridad**: hoy esa lectora se manda el enlace por correo a sí misma, y la mitad de las veces lo pierde en su bandeja.

**Prueba independiente**: se guardan tres artículos en un navegador y se revisa la lista en otro, con la misma cuenta.

**Escenarios de aceptación**:

1. **Dado** un artículo abierto, **cuando** la lectora pulsa «Guardar», **entonces** el artículo aparece primero en su lista de lectura.
2. **Dado** un artículo ya guardado, **cuando** la lectora lo marca como leído, **entonces** sale de la lista y queda en su historial.
3. **Dado** una lista de lectura llena, **cuando** la lectora intenta guardar otro artículo, **entonces** la pantalla le pide que borre uno antes.
4. **Dado** una lista de lectura con artículos, **cuando** la lectora la exporta, **entonces** descarga un archivo OPML con los enlaces.
5. **Dado** un artículo guardado que la autora despublicó, **cuando** la lectora abre su lista, **entonces** ese artículo aparece tachado con la fecha en que salió.
6. **Dado** una lectora sin cuenta, **cuando** guarda un artículo, **entonces** la pantalla le avisa que la lista vive solo en ese navegador.

### Historia de usuario 4: Encontrar lo que ya se publicó (Prioridad: P2)

Un lector recuerda un artículo sobre colas de mensajes, pero no su título. Escribe dos palabras en el buscador y filtra por la etiqueta «arquitectura».

Al final de cada artículo, la bitácora le sugiere otros tres del mismo tema, para que siga leyendo sin volver a buscar.

**Por qué esta prioridad**: la bitácora tiene más de 200 entradas y la portada solo muestra las diez últimas.

**Prueba independiente**: se buscan 20 artículos conocidos por una palabra de su cuerpo y se anota en qué puesto aparece cada uno.

**Escenarios de aceptación**:

1. **Dado** el buscador abierto, **cuando** el lector escribe «colas mensajes», **entonces** el artículo sobre colas aparece entre los tres primeros resultados.
2. **Dado** la página de una etiqueta, **cuando** el lector la abre, **entonces** ve solo las entradas con esa etiqueta, de la más nueva a la más vieja.
3. **Dado** una búsqueda sin resultados, **cuando** termina, **entonces** la pantalla sugiere tres etiquetas con entradas.
4. **Dado** el final de un artículo, **cuando** el lector llega a él, **entonces** ve tres artículos relacionados con su título y su fecha.

### Historia de usuario 5: Conversar con la autora (Prioridad: P3)

Una lectora quiere agradecer un artículo o corregir un dato. Reacciona con un emoji sin crear cuenta, o deja un comentario que la autora revisa desde el back office antes de publicarlo.

La autora contesta los comentarios desde el mismo panel, y su respuesta queda debajo del comentario original.

**Por qué esta prioridad**: los comentarios traen correcciones útiles, pero sin moderación se llenan de publicidad.

**Prueba independiente**: se deja un comentario de prueba y se sigue su paso por la moderación hasta que se publica.

**Escenarios de aceptación**:

1. **Dado** un artículo, **cuando** la lectora pulsa una reacción, **entonces** el contador sube en uno y la reacción queda marcada en su navegador.
2. **Dado** un comentario nuevo, **cuando** la lectora lo envía, **entonces** la pantalla le dice que la autora lo revisará antes de publicarlo.
3. **Dado** un comentario pendiente, **cuando** la autora lo aprueba desde el backoffice, **entonces** aparece debajo del artículo con su fecha.
4. **Dado** un comentario con un enlace, **cuando** llega de madrugada, **entonces** queda en espera [NEEDS CLARIFICATION: ¿quién lo modera si la autora está fuera?].
5. **Dado** un comentario publicado, **cuando** la autora lo responde, **entonces** su respuesta aparece debajo con la marca «Autora».
6. **Dado** un comentario rechazado, **cuando** la lectora vuelve al artículo, **entonces** no lo ve publicado y recibe un correo que le explica por qué.

### Historia de usuario 6: Leer sin conexión (Prioridad: P3)

Un lector viaja en bus y pierde la señal a mitad de un artículo. Quiere terminar de leerlo sin red, y que la bitácora se instale como PWA en su celular.

**Por qué esta prioridad**: llega después de lo demás, porque la mayoría lee con conexión.

**Prueba independiente**: se abre un artículo, se corta la red del dispositivo y se sigue leyendo hasta el final.

**Escenarios de aceptación**:

1. **Dado** un artículo abierto con red, **cuando** se corta la conexión, **entonces** el texto y sus imágenes siguen en pantalla.
2. **Dado** un artículo de la lista de lectura, **cuando** el lector abre la PWA sin red, **entonces** el artículo carga desde la copia del dispositivo.
3. **Dado** que el lector instaló la PWA, **cuando** se publica una entrada, **entonces** la copia del dispositivo se actualiza si es posible.
4. **Dado** un artículo que nunca se abrió con red, **cuando** el lector lo busca sin conexión, **entonces** la pantalla le dice que esa copia no existe.
5. **Dado** que vuelve la conexión, **cuando** el lector sigue en el artículo, **entonces** los comentarios nuevos se cargan sin recargar la página.

### Historia de usuario 7: Escuchar un artículo (Prioridad: P3)

Un lector quiere escuchar un artículo mientras camina, con la pantalla apagada. Pulsa «Escuchar» y la voz lee el texto sin los bloques de código.

**Por qué esta prioridad**: abre la bitácora a quien no puede leer en ese momento, aunque no es la forma principal de consumirla.

**Prueba independiente**: se escucha un artículo con dos bloques de código y se comprueba que la voz los salta y lo dice.

**Escenarios de aceptación**:

1. **Dado** un artículo abierto, **cuando** el lector pulsa «Escuchar», **entonces** la voz empieza por el título y sigue por los párrafos en orden.
2. **Dado** un artículo en reproducción, **cuando** el lector pulsa «Pausa», **entonces** la voz se detiene y retoma desde la misma frase.
3. **Dado** un bloque de código, **cuando** la voz llega a él, **entonces** anuncia que hay código y salta al párrafo siguiente.
4. **Dado** un artículo en reproducción, **cuando** el lector cambia de página, **entonces** la voz se detiene y el botón vuelve a decir «Escuchar».
5. **Dado** un artículo en inglés, **cuando** el lector pulsa «Escuchar», **entonces** la voz usa el idioma del artículo y no el del navegador.

### Historia de usuario 8: Seguir una serie de artículos (Prioridad: P2)

La autora escribe series de cuatro o cinco partes. Una lectora que llega a la tercera parte quiere ver dónde está y pasar a la siguiente sin buscarla.

**Por qué esta prioridad**: las series son lo más leído de la bitácora, y hoy cada parte se encuentra por separado.

**Prueba independiente**: se abre la parte del medio de una serie y se navega a la anterior y a la siguiente.

**Escenarios de aceptación**:

1. **Dado** un artículo de una serie, **cuando** la lectora lo abre, **entonces** ve el nombre de la serie y en qué parte está.
2. **Dado** la última parte de una serie, **cuando** la lectora llega al final, **entonces** ve un enlace a la primera parte en lugar de «Siguiente».
3. **Dado** una serie con una parte nueva, **cuando** la autora la publica, **entonces** las partes anteriores enlazan a ella sin que nadie las edite.
4. **Dado** el índice de una serie, **cuando** la lectora lo abre, **entonces** ve todas las partes con su título y marca las que ya leyó en ese navegador.

### Historia de usuario 9: Leer en el otro idioma (Prioridad: P2)

Una lectora de habla inglesa llega a un artículo en español desde un buscador. Quiere la versión en inglés y, si no existe, saberlo antes de empezar a leer.

La bitácora marca en cada artículo qué idiomas tiene, y el cambio de idioma la lleva a la misma sección del otro texto.

**Por qué esta prioridad**: la mitad de las visitas llega desde fuera del país, y hoy esas lectoras no saben que existe la otra versión.

**Prueba independiente**: se abre un artículo con las dos versiones y otro con una sola, y se cambia de idioma en los dos.

**Escenarios de aceptación**:

1. **Dado** un artículo con dos versiones, **cuando** la lectora abre el selector de idioma, **entonces** ve las dos opciones y la actual marcada.
2. **Dado** un artículo con una sola versión, **cuando** la lectora cambia de idioma, **entonces** llega a la portada del otro idioma con un aviso que lo explica.
3. **Dado** un buscador externo, **cuando** indexa un artículo, **entonces** encuentra el enlace a su versión en el otro idioma.

### Historia de usuario 10: Compartir un artículo (Prioridad: P3)

Un lector quiere mandar un artículo a su equipo. Copia el enlace de una sección y, al pegarlo en un chat, aparece una tarjeta con el título y la imagen del artículo.

**Por qué esta prioridad**: cada enlace compartido trae visitas nuevas, pero la bitácora ya se puede compartir copiando la dirección.

**Prueba independiente**: se copia el enlace de una sección, se pega en un chat de prueba y se revisa la tarjeta que aparece.

**Escenarios de aceptación**:

1. **Dado** un título de sección, **cuando** el lector pulsa su ancla, **entonces** la dirección de la página cambia a la de esa sección.
2. **Dado** el enlace de un artículo, **cuando** se pega en un chat, **entonces** aparece la imagen del artículo con su título.
3. **Dado** un artículo sin imagen propia, **cuando** se comparte, **entonces** la tarjeta usa la imagen general de la bitácora.

### Historia de usuario 11: Publicar sin romper la lectura (Prioridad: P3)

La autora publica una entrada nueva desde el back office. Quiere que el feed, el mapa del sitio, la serie y los avisos se pongan al día solos, sin tocar cada pieza.

**Por qué esta prioridad**: hoy publicar es un paso, y la sala de lectura no debe convertirlo en cinco.

**Prueba independiente**: se publica una entrada de una serie y se revisan el feed, el mapa del sitio, el índice de la serie y el aviso de prueba.

**Escenarios de aceptación**:

1. **Dado** una entrada lista, **cuando** la autora pulsa «Publicar», **entonces** la entrada aparece en el feed, en el mapa del sitio y en su serie.
2. **Dado** una entrada publicada con un error, **cuando** la autora la corrige, **entonces** el feed muestra la versión corregida sin duplicarla.
3. **Dado** una entrada que la autora despublica, **cuando** pasa la siguiente publicación, **entonces** la entrada sale del feed y del buscador.

### Historia de usuario 12: Leer con lector de pantalla (Prioridad: P2)

Un lector ciego recorre la bitácora con su lector de pantalla y el teclado. Quiere saltar entre secciones, saber cuánto lleva y oír los avisos de copiado o guardado sin perder su lugar.

Cada pieza nueva de la sala de lectura se prueba así antes de publicarse, y no solo con el ratón.

**Por qué esta prioridad**: la sala de lectura suma controles en cada artículo, y cada control nuevo puede dejar fuera a quien no ve la pantalla.

**Prueba independiente**: se lee un artículo completo con un lector de pantalla, sin ratón, y se usan todos sus controles.

**Escenarios de aceptación**:

1. **Dado** la tabla de contenido, **cuando** el lector la recorre con el teclado, **entonces** oye el título de cada sección y cuál es la actual.
2. **Dado** un bloque de código, **cuando** el lector activa «Copiar» con el teclado, **entonces** oye «Copiado» y el foco se queda en el botón.
3. **Dado** una reacción, **cuando** el lector llega a ella, **entonces** oye su nombre en texto y cuántas personas la dejaron.
4. **Dado** la barra de progreso, **cuando** recibe el foco, **entonces** el lector oye el porcentaje que lleva leído.

### Casos límite

- Un artículo sin secciones no muestra la tabla de contenido, y la barra de progreso sigue funcionando.
- Un artículo traducido a medias muestra un aviso en el idioma que falta, con un enlace a la versión completa.
- Un correo que ya está suscrito recibe un recordatorio en lugar de un segundo enlace de confirmación.
- Una reacción repetida desde el mismo navegador no suma dos veces.
- Si el feed tiene más de 50 entradas, solo publica las 50 últimas.
- Un comentario con más de 2.000 caracteres se rechaza con un mensaje que dice el límite.
- La búsqueda con tildes o sin ellas da los mismos resultados: «migración» y «migracion» son la misma palabra.
- Sin JavaScript, el artículo se lee completo; la lista de lectura y las reacciones avisan que necesitan JavaScript.
- Una serie con una parte sin publicar muestra esa parte como «Próximamente», sin enlace.
- Un artículo sin artículos relacionados no muestra el bloque de sugerencias.
- Si la voz del navegador no está disponible, el botón «Escuchar» no aparece.
- Un título de sección repetido en el mismo artículo recibe un ancla con un número al final, para que cada enlace lleve a su sitio.
- Un lector que se da de baja del boletín y vuelve a suscribirse pasa otra vez por la doble confirmación.
- Un artículo borrado sale del feed, del mapa del sitio y de las listas de lectura en la siguiente publicación.
- Un enlace compartido a una sección que ya no existe lleva al inicio del artículo, con un aviso discreto arriba.
- Un aviso del navegador que llega con el celular bloqueado muestra solo el título, sin el resumen.

## Requisitos

### Requisitos funcionales

#### Lectura

- **FR-001**: Cada artículo DEBE mostrar una barra de progreso de lectura que avance con el desplazamiento.
- **FR-002**: Cada artículo con tres secciones o más DEBE mostrar una tabla de contenido con un enlace a cada sección.
- **FR-003**: Cada bloque de código DEBE tener un botón para copiar su contenido al portapapeles.
- **FR-004**: Cada artículo DEBE mostrar el tiempo estimado de lectura antes del primer párrafo.
- **FR-005**: Al final de cada artículo DEBE aparecer un botón para volver arriba.
- **FR-006**: El lector DEBE poder cambiar entre tema claro y tema oscuro desde cualquier página.
- **FR-007**: El texto del artículo DEBE tener un contraste adecuado sobre cualquier fondo.
- **FR-008**: El lector DEBE poder cambiar el tamaño de la letra del artículo sin perder su posición.
- **FR-009**: La página de un artículo DEBE mostrarse completa en 2 s o menos en un celular de gama media.
- **FR-010**: Cada artículo DEBE ofrecer el cambio de idioma a su versión en inglés, cuando exista.

#### Suscripción

- **FR-011**: La bitácora DEBE publicar un feed RSS por idioma con sus últimas entradas.
- **FR-012**: El feed DEBE actualizarse rápidamente después de publicar una entrada.
- **FR-013**: El formulario del boletín DEBE pedir solo el correo y el idioma preferido.
- **FR-014**: La suscripción al boletín DEBE usar doble confirmación: un correo con un enlace que el lector abre para activarla.
- **FR-015**: El enlace de confirmación de la suscripción DEBE vencer a las 24 horas.
- **FR-016**: El boletín DEBE salir por correo y/o como aviso del navegador, según lo que elija el lector.
- **FR-017**: Cada correo del boletín DEBE traer un enlace para darse de baja con un solo clic.
- **FR-014**: El lector DEBE poder darse de baja de los avisos del navegador desde la misma página donde los activó.
- **FR-018**: El enlace de confirmación de la suscripción DEBE vencer a las 48 horas.

#### Lista de lectura

- **FR-019**: El lector DEBE poder guardar un artículo en su lista de lectura con un solo toque.
- **FR-020**: Un lector DEBE poder guardar hasta 50 artículos en su lista de lectura.
- **FR-021**: La lista de lectura DEBE ser intuitiva y mostrar primero lo último que se guardó.
- **FR-022**: La lista de lectura DEBE sincronizarse entre los dispositivos del mismo lector.
- **FR-023**: El lector DEBE poder exportar su lista de lectura en varios formatos.
- **FR-024**: El historial de lectura DEBE vivir solo en el navegador del lector.
- **FR-025**: Un lector DEBE poder guardar hasta 100 artículos en su lista de lectura.

#### Búsqueda y etiquetas

- **FR-026**: El buscador DEBE encontrar una palabra aunque el lector la escriba sin tildes.
- **FR-027**: El buscador de la bitácora DEBE incluir las entradas en borrador.
- **FR-028**: El lector DEBE poder filtrar las entradas por etiqueta desde cada artículo.
- **FR-029**: El tiempo de espera del buscador DEBE ser de 800 por consulta.
- **FR-030**: El buscador DEBE mostrar los resultados en cuanto el lector deja de escribir, sin pulsar un botón.
- **FR-031**: El buscador de la bitácora NO DEBE incluir las entradas en borrador.
- **FR-032**: El buscador DEBE encontrar una palabra aunque el lector la escriba sin tildes.

#### Conversación

- **FR-033**: El lector DEBE poder reaccionar a una entrada sin crear una cuenta.
- **FR-034**: Cada comentario DEBE pasar por la moderación de la autora antes de publicarse.
- **FR-035**: El formulario de comentarios DEBE ser fácil de usar en un celular.
- **FR-036**: El límite de comentarios por lector y por hora queda TBD.
- **FR-037**: La autora DEBE poder responder un comentario desde el back office, con la regla de FR-099.

#### Series, audio y descubrimiento

- **FR-038**: Cada artículo de una serie DEBE mostrar el nombre de la serie con enlaces a la parte anterior y a la siguiente.
- **FR-039**: El lector DEBE poder escuchar el artículo en voz alta, con un botón para pausar y seguir.
- **FR-040**: Al final de cada artículo DEBEN aparecer tres artículos relacionados por sus etiquetas.
- **FR-041**: La bitácora DEBE publicar un mapa del sitio con cada artículo y su versión en el otro idioma.
- **FR-042**: Cada artículo DEBE tener una imagen para redes sociales con su título y la fecha.

#### Sin conexión

- **FR-043**: La bitácora DEBE poder instalarse como PWA en un celular.
- **FR-044**: Un artículo abierto DEBE seguir legible si se corta la conexión.
- **FR-045**: Un lector DEBE recibir un aviso del navegador cuando se publique una entrada, si lo aceptó antes.

#### Idiomas y compartir

- **FR-046**: Cada artículo DEBE decir en qué idiomas está disponible, junto a su fecha de publicación.
- **FR-047**: Un artículo sin traducción DEBE avisarlo en el otro idioma, con un enlace a la versión que existe.
- **FR-048**: Cada título de sección DEBE tener un ancla que el lector pueda copiar.
- **FR-049**: El enlace de un artículo pegado en un chat DEBE mostrar una tarjeta con su título y su imagen.

#### Privacidad

- **FR-050**: El boletín DEBE borrar el correo de quien se da de baja en 30 días o menos.
- **FR-051**: Las reacciones DEBEN guardarse sin el correo ni el nombre de quien reacciona.
- **FR-052**: El formulario de comentarios DEBE explicar qué se publica y qué queda privado antes de enviarlo.

#### Accesibilidad

- **FR-053**: La tabla de contenido DEBE anunciar al lector de pantalla la sección en la que está.
- **FR-054**: Los avisos de «Copiado» y de «Guardado» DEBEN leerse en el lector de pantalla sin mover el foco.
- **FR-055**: Cada reacción DEBE tener un nombre en texto además de su emoji.

#### Agregados en la revisión

- **FR-56**: Desde todas las páginas, quien lee DEBE poder alternar el modo oscuro y el modo claro.
- **FR-057**: El servidor DEBE conservar durante 90 días las páginas que abrió cada lector.
- **FR-058**: Antes de empezar el texto, la entrada DEBE indicar cuántos minutos toma leerla.
- **FR-059**: El lector DEBE poder guardar un artículo en su lista de lectura con un solo toque o clic.

### Requisitos no funcionales

- **NFR-001**: La página de un artículo DEBE mostrarse completa en 2500 milisegundos o menos en un celular de gama media.
- **NFR-002**: Toda la sala de lectura DEBE poder usarse solo con el teclado, con el foco siempre visible.
- **NFR-003**: Con «reducir movimiento» activo, la barra de progreso y los avisos DEBEN aparecer sin animación.
- **NFR-004**: El boletín DEBE guardar solo el correo, el idioma y la fecha de confirmación de cada lector.
- **NFR-005**: Los avisos del navegador DEBEN funcionar en los navegadores de escritorio y de celular, etc.
- **NFR-006**: Cada página de artículo DEBE cargar 300 kB o menos de JavaScript al abrirse.

### Entidades clave

- **Lector**: quien visita la bitácora, con cuenta o sin ella.
- **Artículo**: una entrada publicada, con su idioma, sus etiquetas y su fecha.
- **Serie**: un grupo ordenado de artículos que la autora publica por partes.
- **Suscripción**: el correo de un lector, su idioma y el estado de su doble confirmación.
- **Lista de lectura**: los artículos que un lector guardó, en el orden en que los guardó.
- **Comentario**: texto de un lector sobre un artículo, con su estado de moderación.
- **Reacción**: un emoji que un lector deja en un artículo, una vez por navegador.
- **Boletín**: el correo que sale con cada entrada nueva hacia quienes lo confirmaron.
- **Aviso del navegador**: la notificación que recibe un lector que la aceptó, con el título de la entrada.

## Criterios de éxito

### Resultados medibles

- **SC-001**: En un celular de gama media, la barra de progreso sigue el desplazamiento a 60 cuadros por segundo, sin saltos visibles.
- **SC-002**: El 90 % de las suscripciones al boletín se confirma dentro del primer día.
- **SC-003**: Tres de cada cuatro lectores que guardan un artículo lo abren otra vez en los siete días siguientes.
- **SC-004**: En la prueba de los 20 artículos conocidos, 18 aparecen entre los tres primeros resultados.
- **SC-005**: La autora resuelve cada comentario en 24 horas o menos desde que llega.
- **SC-006**: Ningún comentario con publicidad queda publicado más de una hora.
- **SC-007**: La página de un artículo cumple NFR-009 en las tres plantillas de la bitácora.
- **SC-008**: Con la red cortada, el 100 % de los artículos de la lista de lectura se abre completo.
- **SC-009**: El puntaje de accesibilidad automático de cada plantilla es de 95 o más, sin errores críticos.
- **SC-010**: La mitad de quienes terminan la primera parte de una serie abre la segunda.
- **SC-011**: Ocho de cada diez lectores que pulsan «Escuchar» oyen al menos un minuto.
- **SC-012**: Cuatro de cada cinco lectoras que llegan a un artículo sin traducción usan el enlace a la versión que existe.
- **SC-013**: La tarjeta de un enlace compartido muestra el título completo en los tres chats de prueba.
- **SC-014**: Treinta días después de una baja, la base del boletín ya no tiene ese correo.

### Cómo se sigue cada criterio

| Cómo se mide | Criterio | Cada cuánto |
|---|---|---|
| Grabación del rendimiento en el celular de prueba mientras se baja por un artículo | SC-001 | En cada entrega |
| Suscripciones confirmadas sobre suscripciones pedidas | SC-002 | Cada semana |
| Artículos guardados que se vuelven a abrir | SC-003 | Cada mes |
| La prueba de los 20 artículos conocidos | SC-004 | En cada entrega |
| Hora de llegada y hora de decisión de cada comentario | SC-005 | Cada semana |
| Revisión de los comentarios publicados con enlaces | SC-006 | Cada día |
| La prueba de lectura en modo avión | SC-008 | En cada entrega |
| La auditoría automática de las tres plantillas | SC-009 | En cada entrega |
| Lecturas de la segunda parte sobre lecturas completas de la primera | SC-010 | Cada mes |
| Clics en el enlace a la versión que existe | SC-012 | Cada mes |

## Supuestos

- La autora publica una o dos entradas por semana, en español y en inglés.
- El correo del boletín sale por un proveedor de envíos que la bitácora ya usa; esta spec no elige uno.
- Las reacciones se cuentan por navegador y no por persona: un lector con dos navegadores puede reaccionar dos veces.
- La lista de lectura no DEBE sincronizarse entre los dispositivos del mismo lector.
- La lectura sin conexión usa la copia que el navegador guardó de cada artículo abierto.
- La voz que lee los artículos es la del navegador, así que su acento cambia de un equipo a otro.
- Las imágenes de los artículos ya tienen texto alternativo; esta spec no lo reescribe.
- El back office ya identifica a la autora con su cuenta, y esta spec no cambia cómo entra.

## Dependencias

## Fuera de alcance

- Pagos, suscripciones de pago o contenido exclusivo para suscriptores.
- Un editor de artículos nuevo: la autora sigue escribiendo como hoy.
- Comentarios anidados de más de un nivel.
- Traducción automática de los artículos: cada versión la escribe la autora.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| Q-01 | ¿El boletín sale cada semana o con cada entrada? | Con cada entrada |
| Q-02 | ¿Los comentarios piden cuenta? | No: piden un nombre y un correo que no se publica |
| Q-03 | ¿Los artículos relacionados salen de las etiquetas o del texto? | De las etiquetas |
| Q-04 | ¿La copia sin conexión incluye los comentarios? | No: solo el texto y las imágenes |
| Q-05 | ¿El aviso del navegador se pide en la primera visita? | No: después de guardar o terminar un artículo |

## Glosario

- **Back office**: el panel privado donde la autora publica y modera.
- **Barra de progreso**: la franja que avanza mientras se lee un artículo (`ReadingProgress`).
- **Tabla de contenido**: la lista de secciones de un artículo, con un enlace a cada una (`Toc`, `TocSheet`).
- **Tiempo estimado de lectura**: los minutos que toma leer un artículo, calculados por sus palabras (`readingTime`).
- **Doble confirmación**: alta en el boletín que solo queda activa cuando el lector abre el enlace que recibe por correo.
- **Lectura guiada**: recorrido de cinco artículos que la autora arma para quien empieza.
- **Etiqueta**: palabra que agrupa artículos del mismo tema (`tag`).
- **Artículos relacionados**: los tres artículos que se sugieren al final de otro, por sus etiquetas (`RelatedPosts`).
- **Serie**: ver «Entidades clave»; en el código, su navegación es `SeriesNav`.

## Acrónimos

- **RSS**: formato de suscripción que leen los lectores de feeds.
- **SMTP**: protocolo con el que sale el correo del boletín.

## Notas de diseño

La sala de lectura no cambia cómo se escribe un artículo: cambia lo que pasa alrededor del texto. Cada pieza nueva tiene que poder apagarse sin romper la lectura, porque el texto manda.

Los bordes de cada pieza están en [Casos límite](#bordes-de-la-sala), y cada historia trae su prueba independiente.

### Lectura

La barra de progreso mide el texto del artículo y no la página completa: los comentarios y el pie no cuentan. Así, llegar al último párrafo es llegar al cien por ciento.

La tabla de contenido se arma con los títulos de segundo y tercer nivel. En el celular se abre desde un botón fijo abajo, y en pantallas anchas queda a la derecha del texto.

El botón de copiar vive en la esquina del bloque de código y dice «Copiado» durante dos segundos, con un aviso para el lector de pantalla.

El cambio de tema respeta lo que pidió el sistema operativo la primera vez, y desde ahí recuerda la elección del lector en su navegador.

### Suscripción

El boletín y los avisos del navegador comparten una regla: nada sale sin que el lector lo haya pedido, y darse de baja cuesta un clic.

El feed lleva el resumen de cada entrada y no el texto completo, para que quien lo lee entre a la bitácora y vea los comentarios.

### Lista de lectura

La lista de lectura vive en la cuenta del lector. Quien no tiene cuenta la usa en su navegador y la pierde si borra los datos del sitio.

Exportar la lista produce un archivo con el título, el enlace y la fecha en que se guardó cada artículo, en el orden de la lista.

### Búsqueda

El buscador corre en el navegador sobre un índice que se genera al publicar. La consulta se queda en el dispositivo de quien busca.

Los artículos relacionados se eligen por las etiquetas que comparten; con un empate, gana el más nuevo.

La página de una etiqueta lista sus entradas de la más nueva a la más vieja, con veinte por página y un enlace a la siguiente.

### Conversación

Normalmente, la autora revisa los comentarios una vez al día, en la mañana.

Un comentario rechazado no se borra en el momento: queda 30 días en el back office por si la autora cambia de opinión, y después se elimina.

Las reacciones son seis emojis fijos. Un lector puede dejar una de cada una por artículo, y quitarla con un segundo toque.

### Rendimiento

La barra de progreso y la tabla de contenido se calculan una vez al cargar y se actualizan con el desplazamiento, sin volver a medir el texto.

Las imágenes de cada artículo cargan cuando están por entrar en pantalla, y cada una trae su ancho y su alto para que el texto no salte.

### Accesibilidad

Cada control nuevo tiene nombre para el lector de pantalla y se alcanza con la tecla Tab, en el mismo orden en que se ve.

La barra de progreso no depende del color: también dice el porcentaje leído cuando recibe el foco.

### Series y audio

Cada parte de una serie sabe cuál la precede y cuál la sigue, y el bloque de la serie aparece arriba y abajo del artículo.

La lectura en voz alta usa la voz del navegador, sin descargar nada, y resalta el párrafo que se está leyendo.

Los bloques de código no se leen en voz alta: la voz dice «aquí hay un bloque de código» y pasa al párrafo siguiente.

### Sin conexión

La copia sin conexión guarda el texto y las imágenes de cada artículo abierto, y se borra cuando el artículo pasa un mes sin abrirse.

La PWA no pide permisos al instalarse: los avisos del navegador se piden aparte, después de que el lector guarda o termina un artículo.

### Idiomas

Cada artículo trae en sus metadatos el enlace a su versión en el otro idioma, para que los buscadores relacionen las dos.

El aviso de traducción faltante se escribe en el idioma de quien lo va a leer y no en el del artículo.

### Privacidad

El boletín guarda lo mínimo para funcionar. Darse de baja borra el correo; no lo marca como inactivo.

Las reacciones se cuentan en el servidor con un número por artículo y por emoji, sin datos de quien reacciona.

### Publicación

Publicar una entrada genera de una vez el feed, el mapa del sitio, el índice del buscador y el índice de su serie. Si un paso falla, la entrada no sale y el back office dice cuál fue.

Corregir una entrada publicada conserva su dirección y su fecha de publicación, y suma una fecha de actualización que el feed también muestra.

### Medición

Los criterios de éxito se revisan cada semana en una tabla del back office, con la cifra de la semana y la de la anterior.

Las pruebas manuales se repiten en cada entrega con los mismos dispositivos, para que las cifras se puedan comparar.

Una cifra que empeora dos semanas seguidas abre una tarea para la siguiente entrega, con el criterio que la mide.

## Decisiones

| Decisión | Por qué | Qué se sacrifica |
|---|---|---|
| El buscador corre en el navegador | La consulta no sale del dispositivo y no hay un servidor de búsqueda que mantener | El índice pesa más a medida que crecen las entradas |
| El boletín usa doble confirmación | Nadie recibe correos que no pidió, y la lista queda limpia | Una parte de los lectores no confirma nunca |
| La voz es la del navegador | No descarga nada y funciona sin red | El acento cambia de un equipo a otro |
| Los comentarios se moderan antes de publicarse | La publicidad no llega a verse | Un comentario legítimo espera hasta la revisión |
| La lista de lectura vive en la cuenta | El lector la encuentra en cualquier equipo con su cuenta | Quien no tiene cuenta la pierde al borrar los datos del sitio |

## Pruebas manuales

| Prueba | Dispositivo | Qué se mira |
|---|---|---|
| Leer un artículo completo | Celular de gama media | La barra de progreso, la tabla de contenido y el botón de volver arriba |
| Suscribirse y darse de baja | Escritorio | El correo de confirmación, su vencimiento y el enlace de baja |
| Guardar y exportar | Dos navegadores | La lista de lectura y el archivo exportado |
| Buscar sin tildes | Celular | Los tres primeros resultados de diez búsquedas conocidas |
| Moderar un comentario | Back office | El paso de pendiente a publicado y la respuesta de la autora |
| Leer sin red | Celular en modo avión | El texto, las imágenes y el aviso de copia faltante |

## Plan de entregas

| Entrega | Qué incluye | Duración |
|---|---|---|
| 1 | Barra de progreso, tabla de contenido, botón de copiar y volver arriba | 2 semanas |
| 2 | Feed por idioma y boletín con doble confirmación | 3 semanas |
| 3 | Lista de lectura y su exportación | 10 días hábiles |
| 4 | Buscador, etiquetas, relacionados y reacciones | 4 semanas |
| 5 | Comentarios con moderación y respuestas de la autora | 1 semana |
| 6 | Series, lectura en voz alta y lectura sin conexión | 5 semanas |

## Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Los avisos del navegador se sienten invasivos | Medio | Se piden solo después de que el lector guarda o termina un artículo |
| El boletín cae en la carpeta de correo no deseado | Alto | Doble confirmación y un remitente propio del dominio de la bitácora |
| La lista de lectura crece sin control | Bajo | Tope por lector y aviso antes de llenarse |
| Los comentarios se llenan de publicidad | Alto | Moderación previa y un límite por hora |
| La voz del navegador lee mal los términos en inglés | Bajo | El botón «Escuchar» avisa que la voz es la del equipo |

## Historial de cambios

| Fecha | Cambio |
|---|---|
| 2026-11-20 | Primera versión, con las historias 1 a 6 |
| 2026-11-24 | Se suman las historias 7 y 8, con sus requisitos de series y audio |
| 2026-11-27 | Se suman idiomas, compartir, privacidad y accesibilidad, y la revisión agrega cuatro requisitos al final |
