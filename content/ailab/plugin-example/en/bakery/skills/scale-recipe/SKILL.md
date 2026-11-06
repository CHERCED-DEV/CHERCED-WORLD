---
name: scale-recipe
description: "Scales a bread recipe to another dough weight with baker's percentages. Use it when someone asks for more or fewer pieces, a different dough weight or a hydration check."
---

# Scale a recipe

In baking, a recipe is scaled from the flour: the flour is 100 % and every ingredient is a percentage of it.

## Steps

1. Read the recipe and split the flours, the liquids and the rest of the ingredients, with their grams.
2. If they did not say the dough weight they need, ask for it.
3. Call the `scale_recipe` tool of the `recipes` server with the ingredients and the dough weight. Do not do the math from memory.
4. Show a table with each ingredient, its baker's percentage, the grams before and the grams now.
5. If the hydration falls outside 55 % to 85 %, say so and ask before going on.
6. Do not make up ingredients or amounts: if something is missing, ask for it.
