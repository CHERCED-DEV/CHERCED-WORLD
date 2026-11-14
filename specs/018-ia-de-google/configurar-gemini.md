# Activar Gemini

Mientras no hagas estos pasos, el sitio funciona igual:
- **En dev y producción**, el agente de voz del AI Lab dice que todavía no está activo.
- **En tu máquina** aparece un simulador por texto, sin Google.

## 1. La clave

1. En <https://console.cloud.google.com/>, entra al proyecto **cherced-world**.
2. Crea la clave con "Crear clave de API de Gemini" (o en <https://aistudio.google.com/api-keys>, eligiendo ese
   proyecto).
3. En **APIs y servicios → Credenciales**, abre la clave y en **Restricciones de API** deja solo **Generative Language
   API**. No le pongas restricción de sitios web: la usa el servidor de Vercel, no el navegador.
4. No la compartas por chat ni la pegues en ningún archivo del repo.

## 2. Facturación y tope

Lo que funcionó el 2026-11-14:

1. **Vincular el proyecto a la cuenta de facturación.** En <https://console.cloud.google.com/billing/projects>, fila
   de cherced-world: **⋮ → Cambiar facturación**. Con la facturación activa, Google no usa lo que dicen los visitantes
   para mejorar sus productos.
2. **Cargar saldo prepagado en AI Studio.** En <https://aistudio.google.com/billing> → **Comprar créditos** (mínimo
   5 USD). Sin saldo, Gemini responde 402 "prepayment credits depleted". Se cargaron COP 60.000.
3. **Recarga automática desactivada.** Así el saldo es el tope: cuando llega a cero, Gemini se detiene y no cobra más.
   El saldo vence a los 12 meses y no se reembolsa.
4. **Sin "límite de inversión" en Cloud.** La cuenta está en pesos (COP): un límite de "10" son 10 pesos, y se rompió
   con la primera prueba (403 "Spend cap breached"). El monto de ese límite no se puede editar después; hubo que
   borrarlo. Si algún día se quiere uno, va en pesos (por ejemplo 40.000).
5. La suscripción Gemini Pro es de la app de Gemini y no paga la API.

## 3. Ponerla en Vercel

En **Settings → Environment Variables** del proyecto:

| Nombre | Valor | Entornos |
|---|---|---|
| `GEMINI_API_KEY` | la clave | Production y Preview, con **Sensitive** activado |

Después, en **Deployments**, abre el último despliegue de `dev` y elige **Redeploy**. Producción la toma con el
release.

## 4. En tu máquina

Crea `.env.local` en la raíz del proyecto (no se versiona) con:

```
GEMINI_API_KEY=tu-clave
```

Reinicia `npm run dev`. Con la clave, el agente usa Google de verdad; sin ella, el simulador.

## 5. Comprobarlo

Abre el AI Lab, busca "Habla con mi portafolio" y dale a "Probar". Debe pedirte permiso para el micrófono y saludarte
con voz.
