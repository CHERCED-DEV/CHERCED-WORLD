---
description: Calcula la hidratación de una receta y dice si está en un rango razonable
argument-hint: <archivo de la receta>
---

Lee la receta de $ARGUMENTS.

1. Usa la herramienta `escalar_receta` del servidor `recetas` sin peso de masa: así solo calcula los porcentajes y la hidratación.
2. Responde en una línea: la hidratación en porcentaje y si cae entre 55 % y 85 %.
3. Si la receta no trae los gramos de cada ingrediente, pídelos: no los supongas.
