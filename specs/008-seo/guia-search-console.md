# Guía para el autor: dominio, Vercel, Search Console y Bing (008)

Esto lo hace Camilo con sus cuentas. El repo ya quedó listo: el origen canónico vive en una sola constante, el sitemap,
`robots.txt`, el JSON-LD, el RSS y `llms.txt` la usan, y el meta tag de verificación está preparado y vacío.

**Orden recomendado**: §1 Search Console en el dominio de hoy (para tener el "antes") → §2 comprar y conectar el
dominio → §3 cambiar la constante → §4 redirección permanente → §5 Search Console en el dominio nuevo → §6 Bing →
§7 enlaces desde los perfiles → §8 medir.

## 1. Search Console en `cherced-world.vercel.app` (antes del dominio)

Sirve para medir el "antes" de la tabla FR-860 y para avisarle a Google del cambio de dirección más adelante.

1. Entra a [Search Console](https://search.google.com/search-console) con tu cuenta de Google.
2. "Agregar propiedad" → **Prefijo de URL** → `https://cherced-world.vercel.app/`. (La opción "Dominio" pide DNS, y el
   DNS de `vercel.app` no es tuyo).
3. Elige el método **Etiqueta HTML**. Google muestra algo como
   `<meta name="google-site-verification" content="ABC123..." />`. Copia **solo** el valor de `content`.
4. En el repo, abre `lib/seo/verification.ts` y pon ese valor en `google`:

   ```ts
   export const SEARCH_VERIFICATION: SearchVerification = {
     google: 'ABC123...',
     bing: null,
   }
   ```

   No es un secreto (Google lo lee en el HTML público) y no hace falta ninguna variable de entorno.
5. Commit y push a `main`. Cuando Vercel termine de desplegar, vuelve a Search Console y pulsa **Verificar**.
6. No borres ese valor después: si la etiqueta desaparece, la propiedad deja de estar verificada.
7. En "Sitemaps", envía `sitemap.xml`. En "Inspección de URLs", pide la indexación de `/es`, `/en`, `/es/aboutMe` y
   `/es/synergos`.

## 2. Comprar el dominio y conectarlo en Vercel

1. Compra el dominio en el registrador que prefieras (P-801).
2. Vercel → el proyecto → **Settings → Domains → Add**. Agrega el dominio raíz (`tudominio.com`) y `www.tudominio.com`.
   Deja como principal el raíz y que `www` redirija a él (Vercel lo propone así).
3. En el registrador, crea los registros DNS que Vercel muestra en esa misma pantalla (normalmente un registro `A` para
   el raíz y un `CNAME` para `www`). Vercel emite el certificado HTTPS solo.
4. Espera a que Vercel marque el dominio como "Valid Configuration".

## 3. Cambiar el origen canónico en el repo (una línea)

1. En `lib/site-url.ts`, cambia la constante, con `https://` y sin barra final:

   ```ts
   export const SITE_ORIGIN = 'https://tudominio.com'
   ```

2. `npm run build` en local (corre lint, tipos y pruebas). Las pruebas de `tests/unit/seo` siguen en verde: no dependen
   del dominio de hoy.
3. Opcional: en Vercel, cambia el **valor** de la variable que ya existe `VERCEL_URL_CORS` al dominio nuevo, para que
   las vistas previas también apunten ahí. No crees variables nuevas. En producción manda la constante.
4. Commit y push a `main`. Al desplegar, la canónica, el `hreflang`, el sitemap, `robots.txt`, el JSON-LD, el RSS,
   `llms.txt` y las imágenes OG salen con el dominio nuevo.

## 4. Redirección permanente desde `cherced-world.vercel.app`

Para no perder lo ganado, cada URL vieja debe responder 301 hacia la misma ruta en el dominio nuevo.

1. Vercel → **Settings → Domains** → en `cherced-world.vercel.app`, **Edit** → **Redirect to** → `tudominio.com`, con
   código **301** (o 308: los dos son permanentes y Google los trata igual).
2. No borres `cherced-world.vercel.app` del proyecto: tiene que seguir existiendo para poder redirigir.
3. Comprueba que conserva la ruta:

   ```sh
   curl -I https://cherced-world.vercel.app/es/aboutMe
   ```

   Debe decir `301` (o `308`) y `location: https://tudominio.com/es/aboutMe`.
4. Si Vercel no deja redirigir el dominio `vercel.app` desde esa pantalla, no lo resuelvas por tu cuenta en el código:
   la alternativa es una redirección por host en `next.config.ts`, y eso es un cambio de la 008 que necesita tu visto
   bueno.

## 5. Search Console en el dominio nuevo

1. "Agregar propiedad" → **Dominio** → `tudominio.com`. Verifica con el registro **TXT** que Google te da, en el DNS del
   registrador. Esta propiedad cubre `https`, `http` y `www`, y no necesita el meta tag.
2. Envía `https://tudominio.com/sitemap.xml` en "Sitemaps".
3. En la propiedad vieja (`https://cherced-world.vercel.app/`): **Configuración → Cambio de dirección** → elige la
   propiedad nueva. Si la herramienta no lo permite para un subdominio de `vercel.app`, la redirección 301 del §4 basta.
4. Pide la indexación de Home en ES y EN y de Sobre mí en la propiedad nueva.

## 6. Bing Webmaster Tools

1. Entra a [Bing Webmaster Tools](https://www.bing.com/webmasters).
2. Lo más corto: **Importar desde Google Search Console**. Trae los sitios verificados y sus sitemaps.
3. Si prefieres verificar aparte: método **Etiqueta meta** → copia el `content` de `msvalidate.01` en `bing` dentro de
   `lib/seo/verification.ts`, commit y push; o el registro `CNAME` que Bing indique en el DNS del dominio nuevo.
4. Envía el sitemap si no se importó.

## 7. Enlaces desde tus perfiles

Los buscadores unen la entidad "Camilo Hernández" con el sitio cuando los perfiles enlazan la misma URL que el `sameAs`
del JSON-LD enlaza de vuelta.

- **LinkedIn** (`linkedin.com/in/cherced`): el sitio en "Información de contacto" → Sitio web, y una tarjeta en
  "Destacados".
- **GitHub** (`CHERCED-DEV`): el campo "Website" del perfil y el README del perfil. En los repos `Synergos.CMS`,
  `Synergos.UI` y `Synergos.Fabrica`, el campo "Website" del repo con `https://tudominio.com/es/synergos`.
- **Platzi** (`platzi.com/p/Cherced`): el enlace a tu sitio en el perfil.
- El nombre igual en todos: "Camilo Hernández" (P-706 de la 007).
- Cuando cambies de dominio, actualiza estos enlaces al dominio nuevo.

## 8. Medir (tabla FR-860 de la spec)

1. Search Console → **Rendimiento → Resultados de búsqueda**.
2. Filtro **Consulta → Contiene** con el texto de cada búsqueda (Q1 a Q13). Periodo: últimos 28 días.
3. Anota la **posición media**, los clics y las impresiones, con la fecha, en la columna "Antes" de la tabla.
4. Repite a las 8 semanas del dominio nuevo y llena "Después".
5. No midas buscando en tu propio navegador: los resultados cambian por tu historial y tu ubicación. La fuente es
   Search Console.
6. Revisa los datos estructurados en la [prueba de resultados enriquecidos](https://search.google.com/test/rich-results)
   con `/es`, `/es/aboutMe`, `/es/portfolio/12` y `/es/blog/post4`, y en el [validador de schema.org](https://validator.schema.org/).
   Lo esperado: `WebSite` y `Person` en Home, `ProfilePage` en Sobre mí, `CreativeWork` y `BreadcrumbList` en el caso,
   `BlogPosting` y `BreadcrumbList` en el post, sin errores.

## Lo que no hay que hacer

- Crear variables de entorno nuevas o servicios de medición (Analytics, píxeles): la constitución lo prohíbe (VIII) y
  Search Console basta.
- Borrar `cherced-world.vercel.app` del proyecto o quitar el token de verificación.
- Cambiar el dominio en otro archivo que no sea `lib/site-url.ts`.
