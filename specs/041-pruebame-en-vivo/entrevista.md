# 041 — Entrevista del upstream

Entrevista hecha el 26 de noviembre de 2026, una pregunta a la vez y con una recomendación en cada una. El autor
respondió como entrevistador humano. Cada respuesta dice qué decide para las specs.

## 1. Rol y empresa

- **Pregunta:** ¿qué rol y qué tipo de empresa quieres conquistar primero?
- **Recomendación:** AI Engineer remoto en empresas de producto (EE. UU., Europa o Latam con pago en USD).
- **Respuesta:** «todas menos tech lead o arqui, como cargo, busco más estar del lado de desarrollo; me encanta la
  arquitectura y me encanta hacer cosas como las que dice el apartado, pero no quiero trabajar de eso».
- **Decide:** tres públicos: AI Engineer remoto, senior full-stack con IA (Colombia y Latam) y clientes de consultoría
  independiente. Tech Lead y arquitecto no son cargo objetivo. La arquitectura se muestra como habilidad, no como rol.

## 2. Lo que se comprueba en 10 minutos

- **Pregunta:** en 10 minutos con el sitio, ¿qué debe quedarle comprobado al entrevistador?
- **Recomendación:** agentes que funcionan y problemas de negocio resueltos.
- **Respuesta:** las cuatro opciones.
- **Decide:** la ruta de 10 minutos cubre cuatro pruebas:
  1. agentes que funcionan;
  2. problemas de negocio resueltos;
  3. código de calidad;
  4. entrega rápida con IA.

## 3. Capacidades nuevas del sitio

- **Pregunta:** ¿qué capacidades nuevas le sumamos al sitio?
- **Recomendación:** la ruta de 10 minutos como columna.
- **Respuesta:** las cuatro opciones.
- **Decide:** cuatro specs:
  - la ruta de 10 minutos (042);
  - el MCP público del portafolio (044);
  - del pedido a la spec con gates (046);
  - el tablero de ingeniería vivo (045).

## 4. Proyectos de IA con valor real

- **Pregunta:** ¿qué proyectos de IA con valor real construimos?
- **Recomendación:** Cotejo y la base de conocimiento honesta.
- **Respuesta:** las cuatro opciones.
- **Decide:** cuatro specs:
  - Cotejo, el revisor de specs (047);
  - la base de conocimiento honesta (048);
  - los plugins por profesión (049);
  - el agente de operaciones pyme (050).

  Todas van con datos ficticios, caso de negocio, costo y demo en el sitio.

## 5. Tope mensual de gasto en API

- **Pregunta:** ¿cuál es el tope mensual de gasto en API para toda esta línea?
- **Recomendación:** 10 USD al mes.
- **Respuesta:** «entre 10 y 25».
- **Decide:** meta de 10 USD al mes y techo duro de 25 USD (unos COP 82.000 con la TRM de 3.297 del 11 de noviembre de
  2026), sumando todos los proveedores. Al pasar de 10 USD, el panel avisa. Al llegar a 25 USD, lo que gasta API se
  apaga hasta el mes siguiente.

## 6. Proveedores de modelos

- **Pregunta:** ¿con qué proveedores de modelos trabajamos?
- **Recomendación:** Gemini y Claude detrás de un puerto común con fallback.
- **Respuesta:** «de hecho quiero hasta integrarle OpenAI, y Claude, cosas bien vacanas y boladas».
- **Decide:** tres proveedores (Gemini, Claude y OpenAI) detrás de un puerto común, con enrutamiento por costo,
  fallback y una arena que los compara con las mismas evals (043). Son dos llaves nuevas, `ANTHROPIC_API_KEY` y
  `OPENAI_API_KEY`, que el autor crea, con las cuatro condiciones del principio VIII.

## 7. Qué hacer con lo aprendido del proyecto de referencia

- **Contexto dado antes de preguntar:** la lectura mostró que es material de terceros sin licencia de uso público:
  - trae nombres y servidores de otra organización;
  - no tiene archivo de licencia;
  - trae texto dirigido a agentes.

  No se ejecutó nada ni se contactó ningún servidor. El detalle está en el informe privado.
- **Pregunta:** ¿qué hacemos con lo aprendido?
- **Recomendación:** un motor propio nuevo, escrito desde cero, que crece desde Cotejo.
- **Respuesta:** «Solo aprender por ahora».
- **Decide:**
  - hay informe de aprendizaje y nada se integra;
  - no hay motor propio derivado del proyecto de referencia en esta línea;
  - Cotejo (047) sigue siendo la propuesta propia de la 014, anterior a la lectura;
  - la spec 046 se diseña con patrones genéricos de la industria, sin calcar mecanismos;
  - la decisión de integrar queda abierta (P-4105).

## 8. Publicación del informe

- **Pregunta:** ¿cómo guardamos el informe, si CHERCED-WORLD es público?
- **Recomendación:** el informe completo en una carpeta privada que Git ignora. En el repo, un resumen público y
  genérico con crédito sin nombre.
- **Respuesta:** la recomendada.
- **Decide:**
  - El informe completo va en `specs/041-pruebame-en-vivo/privado/`, que Git ignora.
  - `research.md` es público y genérico:
    - sin nombres internos, hosts, código ni mecanismos calcados;
    - con crédito «a un arquitecto que admiro».

## 9. Ola 1

- **Pregunta:** ¿qué entra en la ola 1?
- **Recomendación:** la ruta de 10 minutos, el MCP público y el tablero de ingeniería.
- **Respuesta:** «podríamos crear de cada cosa líneas de trabajo internas a este chat, y que se le reporten a este
  chat, para que las vayamos orquestando y así hacer mejor todo y crecer rápido».
- **Decide:**
  - Cada spec es una línea de trabajo: un subagente en su propio worktree que reporta a este chat.
  - La sesión principal orquesta e integra.
  - Las olas ya no son una fila: ordenan dependencias.
  - Las líneas sin dependencias pendientes corren en paralelo.
  - Se mantienen las tres olas propuestas, con un máximo de tres líneas a la vez por defecto (P-4103).

## 10. Cómo se aprueba el downstream

- **Pregunta:** ¿cómo apruebas el downstream?
- **Recomendación:** un paquete por ola.
- **Respuesta:** spec por spec.
- **Decide:**
  - Cada spec hija tiene su propia casilla en [aprobacion.md](./aprobacion.md).
  - Una línea arranca solo cuando su spec está aprobada y sus dependencias están integradas.
