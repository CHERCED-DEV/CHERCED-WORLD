# Quickstart: Evolutivo CHERCED-WORLD 2026

## Correr en local

```bash
npm install
```

```bash
npm run dev
```

- Sin `MONGODB_INTEGRAL_DB` en el entorno, la app usa los repositorios en memoria: todo funciona y los
  datos se pierden al reiniciar.
- Para usar la base real en local, crea `.env.local` (ignorado por git) con `MONGODB_INTEGRAL_DB=<uri>`.
  En Vercel no se toca nada: la variable ya existe.

## Scripts

| Script | Qué hace |
|--------|----------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (`prebuild` corre lint, typecheck y unitarias) |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc --noEmit` |
| `npm test` | Vitest (unitarias y contrato) |
| `npm run e2e` | Playwright contra un build local |
| `npm run verify` | lint + typecheck + test + build + `npm audit --audit-level=high` |

## Primer acceso de administrador

1. Despliega (o corre en local) y abre `/es/inbox`.
2. En los logs (Vercel → proyecto → Logs, o la terminal en local) aparece
   `[CHERCED-WORLD] Código de configuración inicial: XXXX-XXXX (vence <fecha>)`.
3. Escribe el código y una contraseña de 12 caracteres o más. Desde ese momento la configuración inicial
   desaparece.
4. Si olvidas la contraseña, borra el documento `admin` de la colección `admin_credentials` desde la
   consola de tu base de datos y vuelve al paso 1.

## Publicar un post

1. Crea `content/posts/<id>/es.mdx` (y `en.mdx` si quieres los dos idiomas) con `export const meta`.
2. Regístralo en `content/posts/registry.ts`.
3. Haz merge a `main`. Vercel despliega solo.

## Escenarios de validación (antes del corte)

| # | Escenario | Criterio |
|---|-----------|----------|
| 1 | Recorrer las 9 rutas de 2023 sin prefijo | Cada una redirige y responde 200 (SC-001) |
| 2 | Recorrer `/es/*` y `/en/*` con JS desactivado | Título y texto visibles (SC-003) |
| 3 | Navegar 10 veces y volver al home | Un solo canvas, fluidez estable (SC-006) |
| 4 | Activar reducir movimiento y reducir transparencia | Fondo estático, superficies sólidas |
| 5 | Enviar contacto sin casilla, con casilla y 4 veces seguidas | Bloqueo, éxito y rate limit (US3) |
| 6 | Pedir `/api/admin/updates` y `/es/inbox` sin sesión | 401 / login, cero datos (SC-007) |
| 7 | Mensaje desde otro navegador con el panel abierto | Aparece en ≤ 10 s (SC-008) |
| 8 | Comentar, aprobar y responder | Aparece con distintivo, sin correo (US6) |
| 9 | Ctrl/⌘+K → "blog" → Enter; comando secreto | Navega; abre la cápsula (US9) |
| 10 | 40 preguntas de referencia y 15 de manipulación al asistente | ≥ 90 % / 100 % (SC-012) |
| 11 | `npm run verify` y `npm run e2e` | Todo en verde |

## Despliegue

- **Hotfix 2023**: merge de `hotfix/cerrar-exposicion-datos` a `main`, con confirmación del autor.
- **Corte**: merge de `001-evolutivo-cherced-world` a `main`, con confirmación del autor, después de
  revisar la vista previa de Vercel de la rama.
