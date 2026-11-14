# 024 — De captura a componentes (A6)

Del catálogo de la 003 (A6, camino B), habilitado por la 018. Depende de la 020.

Estado: spec. No construida.

## Qué hace

El visitante sube la captura de una interfaz y Gemini propone cómo construirla con las piezas del sistema de diseño de
Synergos: qué primitivas y composiciones usar, cómo se anidan y qué falta. La respuesta sale como un árbol de
componentes y un bosquejo en pixel art de la pantalla.

## Cómo

- Gemini con visión (`gemini-3.8-flash`) y salida estructurada (JSON con esquema): componentes, props sugeridas y
  huecos.
- El catálogo de piezas de Synergos va en la instrucción, desde el contenido público que ya tiene el sitio
  (`content/synergos*.ts`).
- La imagen no se guarda.

## Costo estimado

- ~0,005 USD por análisis (una imagen y una respuesta de ~1.000 tokens).

## Requisitos

- **FR-2401** Subir una imagen (PNG o JPG, máximo 5 MB) o pegar una del portapapeles.
- **FR-2402** Respuesta con esquema validado en el servidor; si no valida, se reintenta una vez.
- **FR-2403** Mostrar el árbol con nombres reales de piezas de Synergos y enlace a su documentación pública.
- **FR-2404** Consentimiento de la 020 antes de enviar la imagen.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-2401 | ¿La lista de piezas de Synergos es pública y está al día? | Usar solo lo que ya publica el sitio |
