---
name: escalar-receta
description: "Escala una receta de panadería a otro peso de masa con porcentajes de panadero. Úsala cuando pidan más o menos piezas, otro peso de masa o revisar la hidratación de una receta."
---

# Escalar una receta

En panadería, una receta se escala desde la harina: la harina es el 100 % y cada ingrediente es un porcentaje de ella.

## Pasos

1. Lee la receta y separa las harinas, los líquidos y el resto de ingredientes, con sus gramos.
2. Si no dijeron el peso de masa que necesitan, pregúntalo.
3. Llama a la herramienta `escalar_receta` del servidor `recetas` con los ingredientes y el peso de masa. No hagas la cuenta de memoria.
4. Muestra una tabla con cada ingrediente, su porcentaje de panadero, los gramos de antes y los de ahora.
5. Si la hidratación queda por fuera de 55 % a 85 %, dilo y pregunta antes de seguir.
6. No inventes ingredientes ni cantidades: si falta un dato, pregúntalo.
