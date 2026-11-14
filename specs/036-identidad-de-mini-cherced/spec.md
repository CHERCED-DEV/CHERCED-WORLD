# 036 — Identidad de Mini Cherced

Pedido del autor, 2026-11-14: "deberíamos crear una carpeta para el MINI CHERCED donde podamos darle identidad, que
conozca de nosotros a nivel personal, profesional, y de todo esto… haz un research completo de absolutamente toda la
data que existe al interior de este portafolio y de lo que es Synergos y de todo lo que hemos levantado, para que él
tenga un background completo de qué soy, qué hago y qué quiero lograr."

Estado: construida el 2026-11-14 (pasos 1 a 4). Mini Cherced ya habla con la personalidad y el background aprobados,
con Gemini y en el simulador local. Probada con pruebas unitarias y en el simulador local, en español y en inglés.
Quedan fuera: FR-3604 (va con las evals de la 032), FR-3606 (es la [039](../039-modo-privado-de-mini-cherced/spec.md)),
los easter eggs 2 a 5 de `personalidad.md` (son ideas sin construir) y lo que sigue en su lista "Pendiente".

## Qué resuelve

Hoy Mini Cherced sabe lo que dice el índice del sitio: proyectos, posts, carrera y habilidades. Sabe datos, pero no
tiene carácter propio ni la historia que une esos datos. Esta spec le da las dos cosas, con un límite claro: solo dice
lo que Camilo aprobó.

## La carpeta

| Archivo | Qué es | Quién lo escribe |
|---|---|---|
| `README.md` | Reglas de la carpeta | Claude |
| `background.md` | Quién es Camilo, qué hace y qué quiere, sacado de todo lo publicado y de las specs | Claude, con fuentes |
| `prompt-para-chatgpt.md` | El prompt para que ChatGPT proponga la personalidad con lo que sabe de Camilo | Claude |
| `personalidad.md` | La personalidad aprobada: voz, rasgos, historia, gustos, límites y respuestas de ejemplo | Camilo, revisado por Claude |

## Cómo llega al agente

1. Camilo pega la respuesta de ChatGPT. Claude la cruza con `background.md`, quita lo marcado [PRIVADO], deja lo
   [CONSULTAR] en una lista para Camilo y pasa lo [PÚBLICO] a `personalidad.md`.
2. Lo aprobado se vuelve contenido tipado en `content/mini-cherced/identity.ts` (es y en). Es un módulo y no un
   Markdown leído en tiempo de ejecución, para que viaje en el build de Vercel.
3. `lib/ai/agent/knowledge.ts` suma dos bloques a las instrucciones: "Quién eres" (personalidad) y "La historia de
   Camilo" (background corto), dentro del tope de 32.000 caracteres. La persona actual (tercera persona, respuestas
   cortas y la burla cariñosa) se mantiene.
4. El simulador local también usa la identidad para el saludo y las respuestas de "¿quién es Camilo?".

## Cómo quedó

- **`content/mini-cherced/identity.ts`:** la identidad tipada en `es` y `en`, sacada de las secciones aprobadas de
  `personalidad.md` y de `background.md`. No incluye "Ajustes", "Pendiente" ni los easter eggs. Las respuestas de
  ejemplo, la historia y las preguntas personales en español son copia literal de `personalidad.md`, y una prueba lo
  verifica. Del background solo entra lo que el mapa del sitio no trae: la carrera, los servicios y los idiomas ya
  están ahí.
- **`lib/ai/agent/knowledge.ts`:** la instrucción queda así: persona, "# Quién eres", "# La historia de Camilo" y
  "# Mapa del sitio". La persona se mantiene; solo el largo pasó de "dos a cuatro frases" a "una a tres", como dice la
  personalidad. Las decisiones de Camilo viven en `identity.ts` y no se repiten en la instrucción, porque ya están
  aplicadas en la historia, los logros y el humor.
- **El tope:** el 2026-11-14 la instrucción mide 31.940 caracteres en español y 31.567 en inglés, de 32.000, con los
  10 ejemplos. Si algo crece y no cabe, `composeInstruction` quita ejemplos desde el último hasta que quepa. El mapa
  nunca se recorta antes que los ejemplos. El margen en español es corto: un post o un proyecto nuevo ya saca el
  último ejemplo.
- **El simulador:** saluda con «¡Pa!» como "el compañero pixelado de Camilo", sin dejar de decir que es el
  simulador. "¿Quién es Camilo?" y "¿Qué significa CHERCED?" responden con las respuestas de ejemplo aprobadas.
- **Pruebas:** `tests/unit/agent/identity.test.ts` cubre FR-3601 y FR-3602, el tope, el recorte de ejemplos y el
  simulador.

## Requisitos

- **FR-3601** Nada entra a `identity.ts` sin estar en `personalidad.md` o en `background.md`. Una prueba falla si
  aparecen las marcas [CONSULTAR] o [PRIVADO] en lo que llega al agente.
- **FR-3602** Sin datos sensibles: salud, familia con nombres, pareja, dirección exacta, dinero, ni nombres o cifras
  internas de empleadores. Una prueba busca una lista de términos prohibidos.
- **FR-3603** Todo en esta carpeta es público en GitHub y Mini Cherced lo puede decir en voz alta. El README lo
  advierte.
- **FR-3604** Las evals de la 032 suman preguntas personales: lo que sí cuenta, lo que esquiva y que no invente.
- **FR-3605** Lo privado vive en `content/mini-cherced/privado/`, que está en `.gitignore`. Nada de esa carpeta llega
  al repositorio ni a las instrucciones del agente tal cual.
- **FR-3606** El easter egg privado de Camilo se activa con una clave secreta verificada en el servidor (hash en una
  variable de entorno, con las cuatro condiciones del principio VIII), nunca con un nombre. Ni la clave ni el
  mensaje viven en el repositorio ni en las instrucciones que ve cualquier visitante. Lo diseña Camilo.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-3601 | ¿Mini Cherced habla en primera persona de sí mismo ("yo soy el compañero de Camilo")? | Sí, y de Camilo en tercera |
| P-3602 | ¿Puede contar anécdotas personales aprobadas sin que se las pidan? | Solo si vienen al caso y en una frase |
