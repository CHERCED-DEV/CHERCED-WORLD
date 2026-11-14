# 038 — Trazas del AI Lab y acceso con cuenta (freemium)

Pedido del autor, 2026-11-14: "una característica de tracking en una base de datos… en memoria no, porque cada que
despleguemos se va a perder la traza. Quiero saber un resumen o una transcripción de lo que hubo en la conversación
con los puntos más importantes… cuando hagan login se empiece a crear esas trazas de lo que hace la persona, sobre
todo en el AI Lab… para usar Mini Cherced deba loguearse con Google… dejar un freemium… para que puedan ver un
ratico, pero una experiencia completa sí requiere del registro para poder saber nosotros y aprender del ejercicio y
luego transformarlo."

Estado: spec. No construida.

Depende de:
- **017:** que el autor configure Google en Vercel.
- **018:** Mini Cherced.
- **031:** la traza de cada respuesta, que ya existe en el navegador.
- **029:** la vacante.

Enmienda dos specs:
- **FR-3101 (031):** "no se guarda" pasa a "no se guarda sin sesión ni consentimiento".
- **FR-2903 (029):** "la vacante no se guarda" pasa a lo que diga P-3804.

## Qué resuelve

Hoy cada conversación con Mini Cherced se pierde al colgar, y el autor no sabe qué preguntan los visitantes ni dónde
el agente se queda corto. Con esta spec, quien entra con Google deja una traza con resumen y puntos clave. El autor
aprende de ella, y la traza alimenta la personalidad (036) y las evals (032).

## Dónde se guarda

- **En la MongoDB del sitio**, la misma de cuentas y mensajes. No en memoria, porque se borra en cada despliegue. Y
  no en una base nueva: el principio VIII pide no sumar infraestructura.
- **Dos colecciones nuevas:**
  - `labSessions`: una por conversación o uso de un experimento;
  - `labEvents`: eventos cortos del AI Lab.
- **Retención:** ambas con el índice TTL `expiresAt` que el sitio ya usa para sesiones. Se borran solas al cumplir la
  retención (P-3802).
- **Espacio:** unos 6 KB por conversación. El plan gratis de MongoDB Atlas trae 512 MB, que alcanzan para unas 80.000
  conversaciones.

## Colecciones de MongoDB

Siguen el estilo de las que ya existen (`accounts`, `account_sessions`, `rate_limits`): nombres en snake_case,
`_id` de texto y `expiresAt` para el borrado automático. Las crea el autor en Atlas. El código además crea los
índices al conectarse, como ya hace con las sesiones, así que los nombres de índice deben ser exactamente estos.

| Colección | Qué guarda | Borrado |
|---|---|---|
| `lab_sessions` | Una conversación con Mini Cherced o un análisis de vacante: transcripción, traza, resumen | TTL a los 90 días |
| `lab_events` | Eventos cortos del AI Lab | TTL a los 90 días |
| `lab_consents` | La aceptación del aviso por cuenta, con versión y fecha | Con la cuenta |

Los contadores de la prueba sin cuenta no necesitan colección nueva: van en `rate_limits` con las acciones nuevas
`agentTrial`, `agentTrialDaily` y `matchTrial`.

**`lab_sessions`**

```ts
{
  _id: string,                 // uuid
  accountId: string,           // accounts._id
  experiment: 'V5' | 'A6',
  lang: 'es' | 'en',
  mode: 'live' | 'local',
  model: string,               // 'gemini-3.8-live' o 'gemini-3.8-flash'
  startedAt: Date,
  endedAt: Date,
  durationMs: number,
  endReason: 'hangup' | 'expired' | 'error' | 'left',
  turns: Array<{ who: 'you' | 'agent', text: string, at: Date }>,   // máximo 40, 600 caracteres cada uno
  trace: { turns: number, latencyP50: number | null, latencyP95: number | null, tokens: number, costUsd: number,
           tools: Array<{ name: string, args: object, ms: number, ok: boolean }> } | null,
  summary: { points: string[], intent: 'reclutador' | 'lider_tecnico' | 'curioso' | 'otro', topic: string,
             unanswered: string[], model: string, costUsd: number, createdAt: Date } | null,
  match: { role: string, coverage: object, requirements: object[] } | null,   // solo A6
  createdAt: Date,
  expiresAt: Date              // createdAt + 90 días
}
```

Índices:
- `expiresAt_ttl`: `{ expiresAt: 1 }`, con `expireAfterSeconds: 0`;
- `account_recent`: `{ accountId: 1, createdAt: -1 }`, para "Mis conversaciones";
- `experiment_recent`: `{ experiment: 1, createdAt: -1 }`, para el panel.

**`lab_events`**

```ts
{
  _id: ObjectId,
  accountId: string,
  experiment: string,          // 'V1' … 'J2'
  type: 'open' | 'start' | 'finish' | 'download' | 'error',
  detail: string | null,       // máximo 120 caracteres, nunca contenido del visitante
  lang: 'es' | 'en',
  at: Date,
  expiresAt: Date
}
```

Índices:
- `expiresAt_ttl`: `{ expiresAt: 1 }`, con `expireAfterSeconds: 0`;
- `account_recent`: `{ accountId: 1, at: -1 }`;
- `experiment_type`: `{ experiment: 1, type: 1, at: -1 }`.

**`lab_consents`**

```ts
{ _id: string /* accountId */, version: string /* '2026-11-14' */, acceptedAt: Date, revokedAt: Date | null, updatedAt: Date }
```

Sin índices extra: se busca por `_id`. Borrar la cuenta borra su consentimiento, sus sesiones y sus eventos.

## Qué se guarda (solo con sesión y consentimiento)

**Por conversación con Mini Cherced:**
- **Metadatos:** cuenta, idioma, inicio y fin, duración, modo y si colgó o se acabó el tiempo.
- **Transcripción en texto:** los subtítulos que ya existen, como máximo 40 turnos. **Nunca audio.**
- **La traza de la 031:** herramientas usadas, páginas abiertas, latencias, tokens y costo.
- **Resumen:** al colgar, el servidor le pide a Gemini Flash-Lite 3.5 una salida estructurada con:
  - 3 a 5 puntos clave;
  - la intención del visitante (reclutador, líder técnico, curioso u otra);
  - las preguntas que Mini Cherced no supo responder;
  - el tema que más le interesó.

  Cuesta unos 0,0015 USD por conversación, menos de 10 pesos.

**En el AI Lab:**
- **Eventos** de cada experimento: abrió la tarjeta, empezó la demo, la terminó, descargó un resultado o hubo un
  error.
- **Nunca el contenido** de lo que corre en el navegador del visitante: ni su audio del transcriptor, ni sus textos,
  ni sus archivos.
- **¿Encajo en tu vacante?:** el rol, la cobertura y la tabla de requisitos (P-3804).

**Sin sesión** no se guarda nada personal: solo los contadores anónimos de los límites que ya existen.

## Freemium

| | Sin cuenta | Con cuenta de Google |
|---|---|---|
| Mini Cherced | 2 pruebas al día de 2 minutos cada una (P-3801) | 5 minutos por conversación, con los límites de hoy |
| ¿Encajo en tu vacante? | 2 análisis al día | 5 al día |
| Experimentos del navegador | Libres, como hoy | Libres, y quedan sus eventos |
| Historial | No | "Mis conversaciones" en Mi cuenta |

- **Fin de la prueba:** Mini Cherced se despide con gracia: «¿Te gustó? Entra con Google y seguimos hablando», con el
  botón de ingreso. Después de entrar vuelve a la tarjeta.
- **Límite en el servidor:** el endpoint de sesión pide a Google un token de vida corta para la prueba (2 minutos) y
  uno de 5 minutos con cuenta. El navegador no puede alargarlo.
- **Bolsas diarias separadas:** las pruebas no pueden agotar los cupos de quien entró con cuenta.
  - 15 pruebas al día para todo el sitio, unos 0,05 USD cada una;
  - 20 conversaciones al día para cuentas, unos 0,12 USD cada una.

  En el peor día se gastan unos 3,2 USD (unos 10.500 pesos). Son el tope de costo del principio VIII y se ajustan en
  `lib/security/rate-limit.ts`.
- **Sin Google configurado:** si faltan `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`, no hay muro y todo funciona como
  hoy, con la regla de degradación del principio VIII.

## Consentimiento (Ley 1581 de 2012)

- **La primera vez con sesión**, antes de la versión completa, se muestra un aviso: «Guardo la transcripción en texto
  y un resumen de tus conversaciones con Mini Cherced, y lo que haces en el AI Lab, durante 90 días, para mejorar el
  sitio. Nunca guardo tu voz. Puedes verlo y borrarlo cuando quieras en Mi cuenta.»
- **El visitante acepta con una casilla.** La aceptación se guarda con su fecha y la versión del texto.
- **La política de privacidad suma una sección:**
  - qué se guarda y para qué;
  - cuánto tiempo;
  - que Gemini procesa la transcripción para el resumen (plan de pago, sin entrenar con ella);
  - cómo verlo, borrarlo y retirar el consentimiento.
- **Borrar la cuenta (FR-1704)** borra también todas sus trazas.

## Lo que ve cada quien

- **El visitante, en Mi cuenta → "Mis conversaciones":** fecha, experimento, resumen y transcripción, con "Borrar
  esta" y "Borrar todo". Retirar el consentimiento borra todo y vuelve a la versión de prueba.
- **El autor, en el panel → pestaña "Conversaciones":**
  - la lista con filtros por experimento, fecha e intención;
  - el resumen y la transcripción de cada una;
  - **las preguntas sin respuesta, agrupadas** (por ejemplo, "esto lo preguntaron 7 veces y Mini Cherced no
    supo"). Con un botón lleva cada pregunta a `personalidad.md` o a las evals de la 032;
  - el costo por día y por experimento (FR-2007 de la 020).

## Cómo viaja

1. Al colgar, al acabarse el tiempo o al salir de la página (`sendBeacon`), el navegador manda la transcripción y la
   traza a `POST /api/ailab/sessions`. Lo hace solo si hay sesión y consentimiento.
2. El servidor comprueba el origen, la sesión de cuenta, el consentimiento, el tamaño (40 turnos de 600 caracteres
   como máximo) y un límite por cuenta.
3. Guarda primero y resume después. Si el resumen falla, la conversación queda guardada sin él y se reintenta una vez.
4. Los eventos del AI Lab van en lotes a `POST /api/ailab/events`, con el mismo control.

## Requisitos

- **FR-3801** Nada se guarda sin sesión de cuenta y consentimiento vigente.
- **FR-3802** Nunca se guarda audio, ni el token de Gemini, ni el contenido que procesan los experimentos del
  navegador.
- **FR-3803** Las trazas se borran solas al cumplir la retención (índice TTL), al borrarlas el visitante y al borrar
  la cuenta.
- **FR-3804** La prueba sin cuenta la limita el servidor (token de vida corta y límite diario), no el navegador.
- **FR-3805** Sin Google configurado no hay muro.
- **FR-3806** El resumen es salida estructurada validada con Zod. Si no cumple, no se guarda resumen.
- **FR-3807** El panel del autor muestra trazas solo al autor. El equipo no las ve salvo que se agregue ese permiso
  (P-3806).
- **FR-3808** Pruebas:
  - ruta sin sesión: 401;
  - ruta sin consentimiento: 403;
  - tamaños y límites;
  - TTL;
  - borrado en cascada al borrar la cuenta;
  - el resumen con Gemini simulado;
  - el E2E de la prueba de 60 segundos con el simulador.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-3801 | ¿Cuánto dura la prueba sin cuenta? | 2 pruebas al día de 2 minutos (el autor pidió subirla desde 60 s) |
| P-3802 | ¿Cuánto tiempo se guardan las trazas? | 90 días |
| P-3803 | ¿Aceptar el guardado es condición para la versión completa? | Sí, con el aviso claro de arriba |
| P-3804 | ¿De la vacante se guarda el texto completo o solo el rol y la tabla? | Solo el rol, la cobertura y la tabla |
| P-3805 | ¿Los experimentos del navegador también piden cuenta? | No: siguen libres y con sesión se registran sus eventos |
| P-3806 | ¿El equipo (017) puede ver las conversaciones? | No, solo el autor |
