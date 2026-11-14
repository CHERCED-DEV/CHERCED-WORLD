# 019 — El chibi lleva al AI Lab, y "AI Lab" brilla

Pedido del autor, 2026-11-14: dos cosas sobre el huevo "Cuidado, no tocar" (015) y la entrada al AI Lab.

Estado: construida el 2026-11-14 con los valores por defecto de las preguntas abiertas.

Cómo se trabaja: es una línea aparte de la 018, en el mismo checkout y en `dev`, sin worktree ni instalaciones nuevas.
Sus commits llevan el prefijo `019`.

## Qué enlace es "AI Lab"

En el sitio hay un solo enlace "AI Lab" fijo: el del pie, junto a "Ahora" y "Privacidad"
(`components/shell/SiteFooter.tsx`, `data-cw-footer-ai-lab`). Vive en el layout de `/[lang]`, así que sale en todas
las páginas. La barra de arriba y el menú no lo tienen (sus seis entradas no cambian).

La 019 trabaja sobre ese enlace y no agrega una entrada nueva a la barra ni al menú, porque se construye sobre lo
construido: la barra, el menú del celular y el dock ya están aprobados. Si el autor lo quiere también arriba, es la
pregunta P-1904.

## 1. El chibi corre al AI Lab

### Historia

Como visitante que despertó al chibi, después de un rato de usar la página el chibi deja lo que hace, corre hasta el
enlace "AI Lab", lo "toca" y me lleva al laboratorio. Allá me dice algo en el tono del huevo.

### Cómo funciona

1. **Cuenta.** Mientras el chibi está despierto (no quieto ni yéndose), cuenta las interacciones del visitante con la
   página: cada clic o toque (`pointerdown`) y cada tecla (`keydown`).
   - No cuentan las que van al propio huevo: el botón "Cuidado, no tocar" y "Quieto".
   - No cuentan Esc, las teclas modificadoras solas (Shift, Ctrl, Alt, Meta, CapsLock) ni la tecla sostenida.
   - No cuenta escribir en un campo (`input`, `textarea`, `select` o un editable).
   - Solo cuentan los eventos reales del navegador (`isTrusted`).
2. **Arranca.** A la sexta interacción (`FUN_GUIDE_AFTER = 6`) dice "¡Ven! Te muestro lo bueno." y sale.
3. **A dónde va.**
   - Si el enlace "AI Lab" del pie está a la vista, va a su lado.
   - Si no (el pie quedó fuera de la pantalla, sobre todo en el celular), va al dock: en el celular, la barra de
     abajo; en escritorio, los botones de la barra de arriba. Apunta al botón del menú, o al último botón del dock
     que se vea entero, y se para encima o debajo, donde quepa.
   - Si no ve ninguno de los dos (el dock del celular se escondió al bajar), espera y vuelve a mirar en la siguiente
     interacción.
4. **Corre.** Va a velocidad constante (`FUN_RUN_SPEED`, unos 900 px/s) moviendo las piernas, y sigue al enlace si el
   visitante hace scroll mientras corre. Mientras corre, el puntero y el foco no lo distraen.
5. **Toca.** Al llegar finge el toque con el "¡pic!" de siempre sobre el enlace (o sobre el botón del menú en el
   dock) y, un momento después (`FUN_GUIDE_TAP_MS`), lleva al visitante a `/{lang}/ai-lab` con el router de Next.
   Entre el "¡Ven!" y la navegación pasan al menos `FUN_GUIDE_GRACE_MS` (1,2 s) para que Esc alcance a detenerlo.
6. **Llega.** En el AI Lab salta de gusto y dice una de estas frases:
   - "Mira nada más, qué bonito." / "Look at that. So pretty."
   - "Qué bien hecho, mira todo esto." / "So well made. Look at all of this."
   - "Aquí es donde debes estar, el resto de la página vale madres." / "This is where you belong. The rest of the site?
     Who cares."
   La frase queda a la vista unos segundos (`FUN_GUIDE_HUSH_MS`) antes de que vuelvan las automáticas. Después sigue
   siendo el mismo cansón de siempre: persigue, pica y habla.

### Casos

- **Ya está en el AI Lab** (`/{lang}/ai-lab` o una ruta debajo). A la sexta interacción no lo lleva a ningún lado:
  salta y dice "¡Ya estás donde es! Mira nada más, qué bonito." / "You're already in the right place! Look at that."
- **Navegación lenta.** Si el AI Lab tarda en cargar, a los `FUN_GUIDE_ARRIVE_MS` (8 s) vuelve a lo suyo, y celebra
  igual cuando la página llega.
- **Una vez por despertar.** Lo hace una sola vez cada vez que lo despiertan, la complete o no. Si lo detienen, no lo
  vuelve a intentar hasta el próximo despertar.
- **Esc o "Quieto".** Lo detienen al instante, también a mitad de carrera: se queda donde está (con movimiento
  reducido, en su esquina), hace pucheros y no navega. Pasa lo mismo si se va (botón pasado el minuto).
- **Movimiento reducido** (`prefers-reduced-motion`). No corre: salta de su esquina al lado del enlace (o del dock),
  toca y navega. Al llegar vuelve a su esquina y habla. No hay saltos animados.
- **No arrastra trabajo a medias.** No sale si el visitante está escribiendo (foco en un campo), si hay un campo de
  texto con algo escrito dentro de `main`, si hay un diálogo o el menú abierto, o si está en el panel privado
  (`/{lang}/inbox`). En esos casos espera a la siguiente interacción.
- **Sin JS.** No hay chibi (015), así que no hay nada que contar.

### Qué cambia de la 015

La 015 prometía que el muñeco "solo finge": no dispara clics, no navega ni mueve el foco. La 019 abre una sola
excepción, pedida por el autor: una navegación del router a `/{lang}/ai-lab`, una vez por despertar. Sigue sin
disparar clics, sin enviar formularios y sin mover el foco. La navegación vive en un archivo aparte
(`components/fun/guide.ts`), y la guarda de pruebas verifica que es la única.

## 1b. Picarlo a él

Pedido del autor después de probarlo, 2026-11-14: "si le dan clic a donde está él, que reaccione a esos clics y diga
cosas chistosas, y al cuarto clic se vaya corriendo y diga lo que ya dice para entrar a AI Lab".

- **Se deja agarrar.** Cuando el puntero está encima de él, deja de perseguirlo, así se le puede dar clic. Solo los
  píxeles pintados del muñeco reciben el clic; el resto de la capa sigue sin recibir el puntero.
- **No estorba.** Como ahora recibe el clic, nunca se para debajo del puntero por su cuenta: cerca del borde derecho o
  de abajo se pasa al otro lado del mouse, y con el dedo, si no cabe arriba, se pone debajo. Con movimiento reducido,
  en escritorio su esquina queda encima del botón del asistente para no taparlo.
- **Reacciona.** Cada clic o toque sobre él lo hace encogerse con la boca abierta y decir una frase chistosa, sin
  repetir la anterior:
  - "¡Ay! Eso no es un botón, soy yo." / "Ouch! That's not a button, that's me."
  - "¿Me estás picando a mí? Qué confianza." / "Are you poking me? Bold move."
  - "Cosquillas no, que me reinicio." / "No tickling, I'll reboot."
  - "Pica más suave, que soy de pixel." / "Gently, I'm made of pixels."
  - "Si me picas, te pico. Así funciona el karma." / "Poke me and I poke back. That's karma."
  - "Error 418: soy una tetera. Mentira, soy yo." / "Error 418: I'm a teapot. Kidding, it's me."
  - "Eso no estaba en los requisitos." / "That wasn't in the requirements."
  - "¿Ves? Por eso no se toca." / "See? That's why you don't touch."
- **Al tercero avisa:** "Uno más y te llevo a donde está lo bueno." / "One more and I'll take you to the good stuff."
- **Al cuarto** (`FUN_ME_GO_AT = 4`) arranca la misma carrera de la parte 1: "¡Ven! Te muestro lo bueno.", corre,
  toca y lleva al AI Lab. Si ya está en el AI Lab, celebra. Si la página está ocupada (trabajo a medias, diálogo
  abierto), dice una frase y lo vuelve a intentar en el siguiente clic.
- Los clics sobre él tienen su propia cuenta: no suman a las seis interacciones de la página, y las seis no suman a
  sus cuatro. Lo que pase primero lo lleva; sigue siendo una vez por despertar.
- **Quieto.** Si lo picas mientras está quieto, dice "Shh, estoy castigado. No me hagas reír." y no cuenta.
- **Después de llevarte**, los clics sobre él siguen sacando frases chistosas.
- **Movimiento reducido.** Se le puede picar en su esquina; reacciona sin encogerse y al cuarto clic salta.
- El clic sobre él no llega a lo que haya debajo, y no dispara clics sintéticos.

## 2. "AI Lab" brilla

- El enlace "AI Lab" del pie lleva rayos dorados que giran despacio detrás de la palabra, más un brillo suave que
  respira. Solo esa entrada; "Ahora" y "Privacidad" siguen igual.
- Sale en todas las páginas, siempre (P-1903), porque el pie vive en el layout.
- El dorado es una excepción del autor solo para esta entrada. No entra a los tokens del sistema de diseño (negro,
  blanco y `#25ED9E`) ni al chibi, cuya aura sigue verde, nunca dorada.
- **Contraste.** El texto no baja: pasa de `--cw-fg-muted` a `--cw-fg` (blanco en oscuro, negro en claro), con un
  halo del color del fondo alrededor de las letras. Los rayos tienen el centro vacío y no pasan por detrás de la
  palabra.
- **Tema claro.** El dorado se oscurece para que se vea sobre el fondo blanco.
- **Movimiento reducido.** Los rayos y el brillo quedan quietos.

## Requisitos

- **FR-1901** Con el chibi despierto, cuenta clics, toques y teclas del visitante con las exclusiones de arriba.
- **FR-1902** A la sexta interacción corre al enlace "AI Lab" del pie si está a la vista; si no, al dock.
- **FR-1903** Finge el toque y navega a `/{lang}/ai-lab` con el router, sin clics sintéticos ni robar el foco.
- **FR-1904** Al llegar dice una de las tres frases del autor, en ES y EN, por la región `role="status"`.
- **FR-1905** Si ya está en el AI Lab, solo celebra.
- **FR-1906** Una vez por despertar.
- **FR-1907** Esc o "Quieto" lo detienen al instante y cancelan la navegación (WCAG 2.2.2).
- **FR-1908** Con movimiento reducido salta en vez de correr.
- **FR-1909** No navega con trabajo a medias, con un diálogo o el menú abierto, ni en el panel privado.
- **FR-1910** El enlace "AI Lab" del pie lleva rayos dorados animados, solo esa entrada y en todas las páginas.
- **FR-1911** El texto del enlace no baja de contraste; con movimiento reducido el brillo queda quieto.
- **FR-1912** Con el puntero encima, deja de perseguirlo; solo sus píxeles pintados reciben el clic.
- **FR-1913** Cada clic sobre él saca una frase chistosa sin repetir la anterior, en ES y EN; al tercero avisa.
- **FR-1914** Al cuarto clic sobre él arranca la carrera al AI Lab (o celebra si ya está ahí), una vez por despertar.
- **FR-1915** Quieto, responde que está castigado y no cuenta.

## Archivos

- `content/fun.ts`: `FUN_GUIDE_AFTER`, `FUN_RUN_SPEED`, los tiempos (`FUN_GUIDE_*_MS`) y las frases.
- `content/i18n/{es,en}/fun.json`: `fun.guide.*` y `fun.me.*` (las frases de cuando lo pican).
- `components/fun/logic.ts`: la lógica pura (contador, una vez, ya en el AI Lab, Esc, a dónde ir, carrera, y la
  respuesta a cada clic sobre él).
- `components/fun/guide.ts`: el gancho del navegador (escucha, mide, navega).
- `components/fun/Buddy.tsx` y `Buddy.module.scss`: la carrera, el salto y la pose de celebrar.
- `components/shell/SiteFooter.tsx` y `SiteFooter.module.scss`: la clase `aiLab` con los rayos.

## Pruebas

- Unitarias (`tests/unit/fun/guia-al-ai-lab.test.ts`): contador y exclusiones, una vez por despertar, ya en el AI Lab,
  Esc y "Quieto" a mitad de carrera, espera con trabajo a medias, a dónde ir, carrera a velocidad constante, textos en
  ES y EN, y la guarda de que la única navegación es la del guía.
- E2E (`tests/e2e/fun/guia-al-ai-lab.spec.ts`), una corrida a la vez, nivel `full`:
  - escritorio: seis clics, corre al enlace del pie, navega y dice una frase del autor, sin clics sintéticos;
  - escritorio: con el pie fuera de vista va al dock de arriba;
  - teclas: seis teclas también cuentan;
  - Esc a mitad de carrera lo detiene y no vuelve a intentarlo;
  - ya en el AI Lab solo celebra;
  - movimiento reducido: salta y navega;
  - celular: va al dock de abajo y navega;
  - el brillo: solo en "AI Lab", con animación, el texto en `--cw-fg`, y quieto con movimiento reducido;
  - picarlo: se deja agarrar, reacciona, avisa al tercero y al cuarto lleva al AI Lab, en escritorio y celular;
  - picarlo quieto: dice que está castigado y no corre.
- Verificación en el navegador: escritorio y celular a 375 px, con movimiento normal y reducido.

## Preguntas abiertas

| ID | Pregunta | Por defecto (aplicado) |
|---|---|---|
| P-1901 | ¿Cuenta como interacción cualquier clic o solo los que el chibi "pica"? | Cualquier clic, toque o tecla, salvo los del propio huevo y escribir en un campo |
| P-1902 | ¿Lo hace una vez por visita o cada vez que se despierta? | Una vez por despertar |
| P-1903 | ¿Los rayos van en todas las páginas o solo hasta que el visitante entra al AI Lab por primera vez? | Siempre |
| P-1904 | ¿Se agrega "AI Lab" a la barra de arriba y al menú, o basta el del pie? | Basta el del pie; la barra y el menú no cambian |
