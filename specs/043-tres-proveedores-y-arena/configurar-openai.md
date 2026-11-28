# Activar OpenAI en el puerto de modelos

Mientras no hagas estos pasos, el sitio funciona igual:
- **En dev y producción**, la arena muestra lo pregenerado y la columna de OpenAI dice «no activo» en lo que corra en
  vivo. El puerto prueba con Gemini y Claude.
- **En tu máquina**, sin ninguna llave, responde el simulador.

Nadie más que tú ve ni copia la llave. Esta guía no la pide ni la lee.

## 0. Antes: aprobar los modelos (P-4301)

Los modelos de OpenAI que usa el puerto están por aprobar. Están en `lib/ai/providers/models.ts` y sus precios, con la
fecha de consulta, en `lib/ai/pricing.ts`:

| Tarea | Modelo propuesto | Precio por millón de tokens (entrada / salida) |
|---|---|---|
| `cheap` | `gpt-6-luna` | 0,10 / 0,50 USD |
| `balanced` | `gpt-6.2-sol` | 2 / 10 USD |
| `strong` | `gpt-6.2-astra` | 8 / 40 USD |

Precios de <https://developers.openai.com/api/docs/pricing>, consultados el 2026-11-27, tarifa Standard y contexto de
hasta 272.000 tokens. Si prefieres otros, se cambian en esos dos archivos; un modelo sin precio nunca se llama.

## 1. La llave

1. Entra a la plataforma de OpenAI con la cuenta que va a pagar.
2. Crea un proyecto solo para el sitio, por ejemplo **cherced-world**, para que el gasto y los límites queden aparte.
3. En ese proyecto, crea una llave de API con un nombre que diga para qué es (por ejemplo `vercel-cherced-world`).
   Si la plataforma deja limitar los modelos del proyecto, deja solo los tres de la tabla.
4. Cópiala una sola vez, directo a Vercel (paso 3). No la pegues en el chat ni en ningún archivo del repo.

## 2. Prepago y tope (P-4309)

1. En **Billing**, carga **5 USD** de créditos.
2. Deja la **recarga automática apagada**. Así el saldo es el tope: cuando llega a cero, la API responde un error, el
   puerto pasa al siguiente proveedor y no se cobra más.
3. Si el proyecto ofrece un presupuesto o límite mensual, ponle 5 USD también.
4. Además del saldo, el sitio tiene sus propios topes: 3 comparaciones por cuenta al día, 10 en total al día y el techo
   mensual de 25 USD para todas las demos nuevas (lo ves en el panel, en **Gasto**).

## 3. Ponerla en Vercel

En **Settings → Environment Variables** del proyecto:

| Nombre | Valor | Entornos |
|---|---|---|
| `OPENAI_API_KEY` | la llave | Production y Preview, con **Sensitive** activado |

Después, en **Deployments**, abre el último despliegue de `dev` y elige **Redeploy**.

## 4. En tu máquina (solo para `npm run arena:run`)

Agrega la línea a `.env.local`, en la raíz del proyecto (no se versiona):

```
OPENAI_API_KEY=tu-llave
```

`npm run arena:run` gasta de verdad. Córrelo solo cuando quieras refrescar la arena; al terminar dice el costo total en
USD y COP.

## 5. Comprobarlo

En el AI Lab, abre «Arena de modelos», entra con tu cuenta y corre una tarea en vivo. La columna de OpenAI debe traer el
modelo que respondió y su costo. En el panel, la tarjeta del tope mensual suma ese gasto en la fila de OpenAI.
