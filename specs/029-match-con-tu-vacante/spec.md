# 029 — ¿Encajo en tu vacante?

Pedido del autor, 2026-11-14: "pensemos en cosas que pueden ser muy útiles y atractivas para entrevistas de trabajo…
funcionalidades muy exactas". Para reclutadores. Depende de la 020.

Estado: construida el 2026-11-14 como el experimento A6 del AI Lab, en el tema "Agentes y plugins". Probada con
el simulador local (escritorio, celular, inglés, resumen imprimible y Contacto) y con pruebas unitarias que simulan
a Gemini; falta un análisis real cuando la clave nueva esté en Vercel.

## Cómo quedó

- Ruta `app/api/ailab/match/route.ts`: revisa el origen, el largo (80 a 8.000 caracteres) y los cupos (5 por
  visitante al día y 50 en total), y responde con la tabla ya limpia.
- `lib/ai/match/catalog.ts`: el catálogo de evidencia sale del índice público del sitio, más una entrada por cada
  decisión de los casos (`decision:{caso}-{n}`).
- `lib/ai/match/sanitize.ts`: esquema de salida para Gemini, validación con Zod y la guarda: los ids que no existen se
  descartan y el requisito sin ids queda "sin evidencia". La pantalla dice cuántas referencias se descartaron.
- `lib/ai/match/analyze.ts`: un reintento si la respuesta no cumple el esquema; suma el costo de ambos intentos.
- `lib/ai/generate.ts`: el primer pedazo del cliente de Gemini de la 020 (`generateContent` con JSON).
- Sin clave, en local, un simulador compara cada requisito con el buscador del sitio, sin Google y sin costo.
- El resumen en PDF usa la impresión del navegador sobre una hoja de una página, sin dependencias nuevas.
- "Escríbele a Camilo sobre este rol" abre Contacto con `?vacante=` y el mensaje ya escrito; no envía nada.

## Pendiente

- **P-2901:** el atajo desde "Para reclutadores" del inicio no se hizo. Es una sección aprobada y lo decide el autor.
- **FR-2903:** por ahora el "contador diario" son los cupos del límite de uso. El contador por experimento en el panel
  es de la 020 (FR-2007).
- El panel de la 020 sigue pendiente.

## Qué hace

El reclutador pega la descripción de una vacante y en unos segundos ve, requisito por requisito, qué evidencia hay en
el sitio de que Camilo lo cumple, con enlace a esa evidencia, y qué no está cubierto. Sale un resumen de una página
para compartir con su equipo.

## Flujo exacto

1. **Entrada.** Un campo de texto para pegar la vacante (máximo 8.000 caracteres). No acepta URL: el servidor no sale
   a buscar páginas de terceros.
2. **Análisis.** El servidor manda la vacante y el índice público del sitio (proyectos, casos, decisiones, carrera,
   habilidades y posts, cada uno con su id) a Gemini (`gemini-3.8-flash`) con salida estructurada:
   `{ rol, requisitos: [{ texto, tipo: obligatorio|deseable, nivel: fuerte|parcial|sin_evidencia, evidencia: [docId], nota }], preguntas: [3] }`.
3. **Guarda contra inventos.** El servidor descarta cualquier `docId` que no exista en el índice. Un requisito sin ids
   válidos queda como "sin evidencia", diga lo que diga el modelo.
4. **Resultado.**
   - Tabla con cada requisito, su nivel (fuerte, parcial o sin evidencia, con color y texto) y los enlaces a la
     evidencia (el caso, la decisión o el post exacto).
   - Cobertura: "8 de 11 requisitos con evidencia; 6 de 7 obligatorios".
   - "Pregúntale esto en la entrevista": 3 preguntas para sondear los huecos.
   - Un aviso fijo: es un análisis automático sobre lo publicado y no reemplaza la entrevista.
5. **Exportar.** "Descargar resumen" abre una versión imprimible de una página ("Camilo × {rol}") lista para guardar
   como PDF desde el navegador, sin dependencias nuevas.
6. **Contactar.** "Escríbele a Camilo sobre este rol" lleva a Contacto con el asunto ya puesto. No se envía nada solo.

## Costo y topes

- ~0,01 USD por análisis. Tope: 5 por visitante al día y 50 en total.

## Requisitos

- **FR-2901** Salida estructurada validada en el servidor (esquema) y reintento único si no valida.
- **FR-2902** Ningún `docId` inexistente llega a la pantalla.
- **FR-2903** La vacante no se guarda; el autor solo ve un contador diario.
- **FR-2904** Funciona en español y en inglés, según el idioma de la vacante.
- **FR-2905** Con teclado y lector de pantalla: la tabla tiene encabezados y el nivel no depende solo del color.
- **FR-2906** Prueba con 5 vacantes de ejemplo inventadas: cobertura estable y cero ids inventados.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-2901 | ¿Se muestra también en la entrada "Para reclutadores" del inicio? | Sí, como acceso directo |
| P-2902 | ¿Mostrar una nota numérica de encaje? | No: cobertura de requisitos, sin puntaje |
