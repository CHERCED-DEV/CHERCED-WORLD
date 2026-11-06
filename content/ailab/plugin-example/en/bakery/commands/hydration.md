---
description: Works out the hydration of a recipe and says whether it is in a reasonable range
argument-hint: <recipe file>
---

Read the recipe in $ARGUMENTS.

1. Use the `scale_recipe` tool of the `recipes` server with no dough weight: that way it only works out the percentages and the hydration.
2. Answer in one line: the hydration as a percentage and whether it falls between 55 % and 85 %.
3. If the recipe does not list the grams of each ingredient, ask for them: do not guess.
