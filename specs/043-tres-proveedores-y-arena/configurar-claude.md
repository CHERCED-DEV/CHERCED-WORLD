# Activar Claude en el puerto de modelos

Mientras no hagas estos pasos, el sitio funciona igual:
- **En dev y producción**, la arena muestra lo pregenerado y la columna de Claude dice «no activo» en lo que corra en
  vivo. El puerto prueba con Gemini y OpenAI.
- **En tu máquina**, sin ninguna llave, responde el simulador.

Nadie más que tú ve ni copia la llave. Esta guía no la pide ni la lee.

## 1. La llave

1. Entra a la consola de Claude (<https://platform.claude.com/>) con la cuenta que va a pagar.
2. Crea un workspace solo para el sitio, por ejemplo **cherced-world**. Así el gasto y los límites quedan aparte de
   cualquier otra cosa tuya.
3. En ese workspace, crea una llave de API con un nombre que diga para qué es (por ejemplo `vercel-cherced-world`).
   Cópiala una sola vez, directo a Vercel (paso 3). No la pegues en el chat ni en ningún archivo del repo.

## 2. Prepago y tope (P-4309)

1. En **Billing**, carga **5 USD** de créditos.
2. Deja la **recarga automática apagada**. Así el saldo es el tope: cuando llega a cero, la API responde un error, el
   puerto pasa al siguiente proveedor y no se cobra más.
3. Si la consola ofrece un límite de gasto mensual por workspace, ponle 5 USD también.
4. Además del saldo, el sitio tiene sus propios topes: 3 comparaciones por cuenta al día, 10 en total al día y el techo
   mensual de 25 USD para todas las demos nuevas (lo ves en el panel, en **Gasto**).

## 3. Ponerla en Vercel

En **Settings → Environment Variables** del proyecto:

| Nombre | Valor | Entornos |
|---|---|---|
| `ANTHROPIC_API_KEY` | la llave | Production y Preview, con **Sensitive** activado |

Después, en **Deployments**, abre el último despliegue de `dev` y elige **Redeploy**.

## 4. En tu máquina (solo para `npm run arena:run`)

Agrega la línea a `.env.local`, en la raíz del proyecto (no se versiona):

```
ANTHROPIC_API_KEY=tu-llave
```

`npm run arena:run` gasta de verdad: unos 0,16 USD con Gemini y Claude, más OpenAI cuando tenga llave. Córrelo solo
cuando quieras refrescar la arena.

## 5. Comprobarlo

En el AI Lab, abre «Arena de modelos», entra con tu cuenta y corre una tarea en vivo. La columna de Claude debe traer
el modelo que respondió (por ejemplo `claude-sonnet-5-5`) y su costo. En el panel, la tarjeta del tope mensual suma
ese gasto en la fila de Claude.
