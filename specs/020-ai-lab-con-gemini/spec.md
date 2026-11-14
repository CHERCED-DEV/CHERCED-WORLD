# 020 — AI Lab con Gemini: base común y refinamiento del laboratorio

Pedido del autor, 2026-11-14, después de probar a Mini Cherced con Gemini: "consideremos refinar todo el AI Lab,
creemos specs por proyecto y démosle con todas las capacidades que nos pueda suministrar esta nueva integración con
Gemini". Esta spec es la base que usan las 021 a 028. Va primero.

Estado: spec. No construida.

## Qué resuelve

Hoy solo V5 usa Gemini, con piezas propias. Antes de sumar siete proyectos más, el laboratorio necesita una sola
manera de llamar a Gemini, de cobrar topes y de contarle al visitante qué sale de su equipo.

## Requisitos

- **FR-2001 Un cliente de Gemini en el servidor** (`lib/ai/gemini/`): texto, imagen, voz (TTS) y tokens de Live, con
  la clave solo en el servidor, tiempo máximo por llamada y errores de Google traducidos a "no disponible" (402 sin
  saldo, 403 tope, 429 cuota). Los modelos y voces viven en un archivo de configuración versionado.
- **FR-2002 Topes por experimento.** Cada experimento declara su límite por visitante y por día en
  `lib/security/rate-limit.ts`, y su tope de salida (tokens, segundos de audio, imágenes). En local no aplican.
- **FR-2003 Consentimiento único para "corre en Google".** Un mismo diálogo, como el de las descargas, dice qué se
  envía a Google, por cuánto tiempo y que el sitio no lo guarda. Vale para la sesión y se puede retirar con "Borrar lo
  que el laboratorio guardó".
- **FR-2004 Insignia y tema.** Los experimentos con Gemini llevan la insignia "Corre en Google (Gemini)" y se agrupan
  en un tema nuevo del AI Lab, "Con Gemini", sin mezclarlos con los que corren en el navegador.
- **FR-2005 Transparencia de costo.** Cada tarjeta dice el modelo y cuánto cuesta un uso típico, sacado de la
  configuración, no escrito a mano.
- **FR-2006 Modo apagado y simulador.** Sin `GEMINI_API_KEY`, cada experimento dice que no está activo (Vercel) o usa
  un simulador (local), como V5.
- **FR-2007 Registro del gasto para el autor.** El panel suma por experimento cuántos usos hubo en el día. No guarda
  contenido del visitante, solo contadores.

## Refinamiento del laboratorio

- Revisar el orden y el texto del hero con 4 temas más el nuevo "Con Gemini".
- La privacidad general del laboratorio pasa de "casi todo en tu navegador" a dos bloques claros: lo que corre en tu
  equipo y lo que corre en Google.
- Revisar en celular las tarjetas con escenario grande (V5 y las que vengan).

## Proyectos que dependen de esta base

| Spec | Proyecto |
|---|---|
| 021 | "Escuchar este post" con voz de Gemini |
| 022 | Pixélate: tu foto como chibi pixel art |
| 023 | Subtítulos en vivo español ↔ inglés |
| 024 | De captura a componentes |
| 025 | De idea a spec, ADR y haiku del commit |
| 026 | Texto → diagrama |
| 027 | El panel con Gemini |
| 028 | Mini Cherced en todo el sitio |

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-2001 | ¿Tope global diario de gasto en el sitio, además del saldo prepagado? | 10 conversaciones de voz y 30 usos de los demás al día |
| P-2002 | ¿El tema "Con Gemini" va primero en el AI Lab? | Sí, es lo más vistoso |
