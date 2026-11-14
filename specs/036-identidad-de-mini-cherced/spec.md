# 036 — Identidad de Mini Cherced

Pedido del autor, 2026-11-14: "deberíamos crear una carpeta para el MINI CHERCED donde podamos darle identidad, que
conozca de nosotros a nivel personal, profesional, y de todo esto… haz un research completo de absolutamente toda la
data que existe al interior de este portafolio y de lo que es Synergos y de todo lo que hemos levantado, para que él
tenga un background completo de qué soy, qué hago y qué quiero lograr."

Estado: en curso. La carpeta [content/mini-cherced/](../../content/mini-cherced/README.md) tiene el background y la
personalidad aprobada en lo público (2026-11-14). Faltan las decisiones pendientes de Camilo y conectarla al agente
(pasos 2 a 4).

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
