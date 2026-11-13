# Activar el ingreso con Google

Mientras no hagas estos pasos, el sitio funciona igual que hoy:
- **En dev y producción**, "Mi cuenta" dice que el ingreso con Google todavía no está activo.
- **En tu máquina** aparece un simulador para probar el flujo sin Google.

## 1. Crear el cliente OAuth

1. Entra a <https://console.cloud.google.com/> con la cuenta de Google que quieras usar como dueña del proyecto.
2. Crea un proyecto, por ejemplo "cherced-world".
3. En **APIs y servicios → Pantalla de consentimiento de OAuth**:
   - Tipo de usuario: **Externo**.
   - Nombre de la app: "CHERCED-WORLD". Correo de asistencia: el tuyo.
   - Alcances: solo `openid`, `email` y `profile`. No hace falta ninguno más.
   - Enlace a la política de privacidad: `https://cherced-world.vercel.app/es/privacy`. Esa página existe en
     producción desde el release. Mientras tanto puedes poner la de dev
     (`https://cherced-world-git-dev-cherceddevs-projects.vercel.app/es/privacy`) y cambiarla después.
4. **Publica la app** (pasa de "Prueba" a "En producción"). Con solo esos tres alcances Google no pide verificación. En
   modo de prueba únicamente pueden entrar las cuentas que agregues a mano.
5. En **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth**:
   - Tipo de aplicación: **Aplicación web**.
   - **URI de redireccionamiento autorizados**, los tres, copiados tal cual:
     - `https://cherced-world.vercel.app/api/auth/google/callback` (producción)
     - `https://cherced-world-git-dev-cherceddevs-projects.vercel.app/api/auth/google/callback` (dev)
     - `http://localhost:3000/api/auth/google/callback` (tu máquina)
   - **Orígenes autorizados de JavaScript:** déjalo vacío. El ingreso pasa por el servidor.
   - Si algún día cambias a un dominio propio, agrega también su `https://<dominio>/api/auth/google/callback`.
6. Google te muestra el **ID de cliente** y el **secreto**. No los compartas por chat.

## 2. Ponerlos en Vercel

En el proyecto de Vercel, en **Settings → Environment Variables**, agrega dos variables para Production y Preview:

| Nombre | Valor |
|---|---|
| `GOOGLE_CLIENT_ID` | el ID de cliente |
| `GOOGLE_CLIENT_SECRET` | el secreto |

Vercel no las aplica a lo que ya está desplegado: hacen falta en un despliegue nuevo.
- **Dev:** en **Deployments**, abre el último despliegue de `dev` y elige **Redeploy**, o espera el siguiente push.
- **Producción:** las toma con el release (`dev` → `main`).

Para comprobarlo, abre `https://cherced-world-git-dev-cherceddevs-projects.vercel.app/es/account`. Debe salir el botón
"Continuar con Google". En el panel, la pestaña **Personas** dice "El ingreso con Google está activo".

Entra siempre por la dirección fija de dev. La dirección de cada despliegue (la que lleva letras al azar) no está
registrada en Google, que respondería `redirect_uri_mismatch`.

## 3. En tu máquina (opcional)

Si quieres probar con Google de verdad en local, crea `.env.local` en la raíz del proyecto con las mismas dos
variables. Sin ellas, local usa el simulador.

## 4. Dar permisos

En el panel, en **Personas**, escribe el correo de Gmail de quien quieras sumar y marca sus permisos:
- **Escribir posts.** Escribe borradores y te los envía a revisión. Tú decides si se publican.
- **Leer mensajes.** Ve el buzón de contacto, con los datos personales de quien te escribió.
- **Moderar comentarios.** Aprueba o rechaza comentarios. Las respuestas como autor siguen siendo solo tuyas.

Esa persona entra por "Ingresar", con su cuenta de Google, y ve solo lo que le diste.
