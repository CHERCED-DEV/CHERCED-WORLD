# Idea: SEO y dominio propio (008)

**Pedido del autor (2026-11-06)**: "Otro spec que hay que trabajar es el SEO, que donde sea que tecleen yo salga de
primero. Pienso en algún momento comprarle un dominio a este aplicativo, entonces quiero aprovechar y explotar todo
esto."

**Estado**: idea. Va después de la 007; se especifica con Spec Kit (specify, clarify, plan, tasks, analyze).

## Qué se puede prometer y qué no

- **Sí**: salir primero cuando busquen el nombre del autor ("Camilo Hernández", "Camilo Hernández Cediel", "CHERCED",
  "cherced"), sus proyectos ("Synergos", "Synergos Labs") y búsquedas de nicho donde el sitio tenga contenido propio y
  profundo (por ejemplo "director y líneas agentes de IA", "sagas .NET micro-frontends", "spec-driven development con
  agentes").
- **No**: nadie puede garantizar el primer lugar para términos genéricos ("software architect", "desarrollador .NET").
  Ahí compiten sitios con años de autoridad. La spec lo dice así y mide lo que sí se controla.

## Lo que ya existe (002 a 007)

Canonical, sitemap con alternates ES/EN, `robots.txt`, JSON-LD `Person` y `BlogPosting`, `llms.txt`, imágenes OG por
página, RSS, títulos "Página · Camilo Hernández" (007, B10) y WebMCP.

## Lo que exploraría la spec

1. **Dominio propio**: el origen canónico vive en una sola constante del repo, así que cambiar de dominio es una línea
   más la configuración en Vercel. Redirección 301 permanente de `cherced-world.vercel.app` al dominio nuevo, para no
   perder lo ganado.
2. **Entidad**: JSON-LD `Person` con `sameAs` (LinkedIn, GitHub, Platzi), `ProfilePage` en Sobre mí y
   `WebSite` en Home; datos idénticos al CV y a LinkedIn (`05`, nombre según P-706).
3. **Contenido que posiciona**: el calendario editorial del blog (005, Q4) y los casos de estudio como páginas
   profundas, con títulos y descripciones pensados para lo que la gente busca.
4. **Técnico**: Core Web Vitals en el campo, `hreflang` revisado, datos estructurados válidos, imágenes con `alt`,
   enlaces internos entre casos, posts y servicios.
5. **Fuera del repo (los hace el autor, con su cuenta)**: Google Search Console y Bing Webmaster Tools (verificación del
   dominio), enlaces desde LinkedIn, GitHub y Platzi al dominio nuevo.
6. **Medición**: posición para una lista corta de búsquedas acordada con el autor, medida en Search Console antes y
   después.

## Preguntas para cuando arranque

- ¿Qué dominio piensa comprar y cuándo?
- ¿Qué búsquedas quiere ganar primero, con sus palabras?
- ¿Tiene ya Search Console o Analytics en algún sitio suyo?
