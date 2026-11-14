# 019 — El chibi lleva al AI Lab, y "AI Lab" brilla

Pedido del autor, 2026-11-14, "para después": dos cosas sobre el huevo "Cuidado, no tocar" (015) y la entrada al AI
Lab.

Cómo se trabaja: es una línea aparte de la 018, pero en el mismo checkout y en `dev`, sin worktree ni instalaciones
nuevas. Sus commits llevan el prefijo `019`.

## 1. El chibi corre al AI Lab

- Cuando el chibi está despierto, después de unas 6 interacciones del visitante (clics, toques o teclas en la página),
  deja lo que está haciendo, corre hasta el enlace "AI Lab" de la navegación, lo "toca" y lleva al visitante al AI Lab.
- Al llegar dice frases en el tono del huevo, por ejemplo: "Mira nada más, qué bonito", "Qué bien hecho, mira todo
  esto", "Aquí es donde debes estar, el resto de la página vale madres".
- Si el enlace no está a la vista (menú cerrado, celular), abre el camino que haga falta o va al dock.
- Respeta lo que ya existe: Esc o "Quieto" lo detienen al instante, y con `prefers-reduced-motion` no corre: salta.
- Si el visitante ya está en el AI Lab, no lo lleva a ningún lado; solo celebra.

## 2. "AI Lab" más vistoso

- El enlace "AI Lab" de la navegación lleva rayos dorados animados para que llame la atención ("uy, ¿qué es eso?").
- Sin romper el sistema de diseño (negro, blanco y `#25ED9E`): el dorado es un acento solo de esta entrada.
- Con `prefers-reduced-motion` queda un brillo quieto. El contraste del texto no baja.

## Preguntas abiertas

| ID | Pregunta | Por defecto |
|---|---|---|
| P-1901 | ¿Cuenta como interacción cualquier clic o solo los que el chibi "pica"? | Cualquier clic, toque o tecla |
| P-1902 | ¿Lo hace una vez por visita o cada vez que se despierta? | Una vez por despertar |
| P-1903 | ¿Los rayos van en todas las páginas o solo hasta que el visitante entra al AI Lab por primera vez? | Siempre |
