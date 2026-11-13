# 016 — Publicar posts desde el panel

Pedido del autor, 2026-11-12: "lo de escribir blogs y publicarlos". Ante la pregunta "¿Construyo la publicación de
posts desde el panel?", respondió: "Sí, constrúyela". Esta spec registra la decisión y el contrato que A-1103 (011)
exige antes de publicar directo.

## Decisión

El Taller del blog (`/[lang]/inbox/blog`) publica y despublica. Un post publicado desde el panel se guarda en la
base del sitio (la misma Mongo de los mensajes, `MONGODB_INTEGRAL_DB`) y sale en el blog sin compilar ni hacer
commit. Los seis posts del repo no cambian: siguen tipados y versionados en `content/posts`.

No se agregan proveedores, variables de entorno ni dependencias.

## Requisitos

- **FR-1601 Publicar.** Desde un borrador guardado, "Publicar" lo deja visible en el blog. Si el borrador tiene cambios
  sin guardar, primero se guarda. Para publicar hacen falta título, descripción y contenido. "Actualizar publicación"
  vuelve a publicar el mismo post con el contenido nuevo. Conserva la URL y la fecha, y marca la fecha de
  actualización. "Despublicar" lo saca del blog y conserva el borrador.
- **FR-1602 URL.** `/{lang}/blog/p-{slug}`. El slug sale del título con el mismo `slugify` de las etiquetas, lleva un
  máximo de 60 caracteres y no cambia al actualizar. El prefijo `p-` es el contrato con el proxy: los ids que no lo
  llevan y no están en el registro siguen yendo al 404 (FR-1102). Un id con `p-` que no existe da 404 desde la
  página.
- **FR-1603 Dónde aparece.** En la portada del blog, el catálogo, las etiquetas, el RSS, el sitemap, los posts
  relacionados y anterior/siguiente, con comentarios y reacciones. En el otro idioma aparece como los posts sin
  traducción (`fallback`). El buscador del sitio y el de significado lo incluyen en el siguiente deploy, porque su
  índice se arma al compilar.
- **FR-1604 Contenido.** Markdown seguro: títulos (`##`, `###`), párrafos, listas, citas, bloques de código, código
  en línea, negrita, cursiva y enlaces `http(s)` o del propio sitio. No se ejecutan HTML, JSX ni componentes. Se
  usan los mismos componentes que los posts del repo (títulos con ancla, bloque de código con copiar, citas y
  enlaces), así que el índice, el tiempo de lectura y la pestaña de lectura funcionan igual.
- **FR-1605 Portada.** Portada generada (`cover: 'generated'`), la misma de post6. La imagen para redes es la
  generada de cada post.
- **FR-1606 Etiquetas.** Solo se publican las del catálogo (`content/posts/tags.ts`), en el idioma del post. Las
  demás se avisan en el panel y no se publican, porque una etiqueta sin catálogo no tiene página.
- **FR-1607 Seguridad.** Publicar y despublicar exigen sesión de administrador, validan con zod y comprueban la
  versión del borrador (no se publica una versión vieja). El slug no puede chocar con otro post. Leer los
  publicados nunca rompe el blog: si la base falla, el blog muestra los posts del repo y registra el error.
- **FR-1608 Frescura.** Publicar, actualizar o despublicar revalida el blog (`/[lang]/blog` y todo lo de abajo), el
  RSS y el sitemap. Las páginas de post se generan bajo demanda y se guardan una hora (ISR), como las del repo.
- **FR-1609 Almacenamiento.** Igual que los borradores (FR-1106): Mongo donde está configurada; archivo privado
  `.local/` en desarrollo sin Mongo; en Vercel sin Mongo, publicar falla de forma explícita y el blog sigue con los
  del repo.

## Enmiendas

- **A-1601 (sobre A-1103):** lo publicado desde el panel sí entra al sitemap, al RSS y a las páginas públicas. Los
  borradores siguen fuera de todo lo público.
- **A-1602 (proxy, sobre A-1102):** `/{lang}/blog/p-…` se reescribe a la página interna `/{lang}/blog/publicado`
  con el id en la cabecera `x-cw-published-id`. El proxy borra esa cabecera de cualquier petición que llegue con
  ella. `/{lang}/blog/publicado` directo sigue yendo al 404, porque no es un post. El resto del contrato no cambia.
- **A-1603 (rutas):** no se abre ninguna ruta dinámica. Next aplica a toda la ruta el `dynamicParams = false` de
  cualquier segmento, y con el layout `/[lang]` en `false` un id nuevo bajo `/blog/[id]` daba 404. Abrir el layout
  rompía el 404 con identidad de rutas como `/wp-login.php`. Por eso los publicados entran por la reescritura y una
  página interna sin parámetros (`force-dynamic`). La ruta de etiquetas genera todas las del catálogo; las que
  ningún post usa salen en 404 hasta que se publica uno, y publicar las revalida.

## Fuera de alcance

Imágenes subidas, traducción automática, programar la publicación y editar los seis posts del repo desde el panel.
