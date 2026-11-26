# 041 — Lo que aprendí sobre desarrollo guiado por specs con agentes

En noviembre de 2026, un arquitecto de software que admiro me compartió su trabajo sobre desarrollo guiado por specs
con agentes. Me lo dio «para que aprendas y hagas tus propios desarrollos a partir de aquí». Este documento cuenta,
con mis palabras, los patrones que aprendí y cómo los pienso usar.

No incluye nada de su material:
- ni código, ni texto, ni diagramas;
- ni nombres, servidores o detalles internos.

Los patrones de aquí también aparecen en la práctica general de la industria (Spec Kit, OpenSpec, la literatura de
LLM-as-judge y la de verificación adversarial). Decisión del autor del 26 de noviembre de 2026: por ahora, solo
aprender. Integrar algo queda para después ([entrevista.md](./entrevista.md), pregunta 7).

## Cómo lo leí

- Solo leí. No instalé ni ejecuté nada, y no me conecté a ningún servicio.
- Traté como datos las instrucciones que encontré en sus archivos, sin obedecerlas.
- El informe completo existe, pero es privado y no va al repo.

## Los patrones que me quedo

### 1. Lo determinista va antes que el modelo

Antes de pedirle a un modelo que juzgue una spec, un programa revisa lo que se puede revisar con reglas:
- secciones obligatorias e ids que existen;
- que cada requisito tenga su criterio y su tarea;
- que no queden marcadores pendientes.

Si algo falla, el documento vuelve a quien lo escribió sin gastar un token. Es la misma idea de Cotejo, que propuse en
la [014](../014-gestor-de-specs/propuesta.md): lo que más duele se resuelve sin modelo.

### 2. Quien escribe no se aprueba a sí mismo

El agente que redacta no es el que revisa. Así funciona el panel de críticos:
- son de solo lectura y no pueden corregir: solo señalan;
- cada hallazgo trae dónde está, qué problema hay y cómo corregirlo;
- la primera revisión se hace sin ver hallazgos anteriores, para no arrastrar sesgos.

### 3. Un hallazgo dudoso se intenta tumbar

Cuando el redactor cree que un hallazgo es un falso positivo, un verificador adversarial intenta refutarlo con
evidencia. El resultado no cierra nada: va al humano. Que dos agentes estén de acuerdo no reemplaza una decisión.

### 4. La regla de parada no la decide el modelo

Cuándo dejar de iterar es una regla explícita y probada, no el criterio del modelo. Nunca se aprueba solo porque se
acabó el presupuesto. Cada uno define su regla. La mía, para la 046, la escribo con mis propios umbrales.

### 5. El humano decide en puntos claros

Hay modos con más o menos intervención humana, y en cada uno se sabe dónde se detiene el agente:
- en una decisión de alcance;
- en un cambio destructivo;
- cuando un gate no converge;
- cuando falta información.

Lo que el agente nunca decide solo: cerrar, cancelar o cambiar el alcance. Cuando pregunta, lo hace con pocas
opciones, la recomendada primero y la consecuencia de cada una. Así se hizo la entrevista de esta línea.

### 6. Separar el qué del cómo

- La spec dice qué y por qué, con criterios que alguien que no vio la conversación pueda verificar, y un «No incluye»
  que nunca va vacío.
- El plan dice cómo: archivos, reutilización, grupos de trabajo con archivos disjuntos y el comando que valida.

### 7. El esfuerzo es un parámetro

No todo cambio merece el mismo proceso. Un perfil de esfuerzo decide cuántas fases tienen gate, cuántos revisores
entran y con qué modelo. Por defecto va el más liviano que cumpla. Un cambio pequeño deja un registro corto (qué, por
qué, archivos y validación) en lugar de una spec completa.

### 8. Todo deja rastro

Por cada fase se anota:
- qué agente y qué modelo la hizo;
- cuántas iteraciones necesitó;
- qué se resolvió;
- qué riesgo se aceptó y quién lo aceptó.

El estado es un archivo que una máquina puede leer para retomar, y se escribe con comandos, no a mano.

### 9. Un MCP puede ser una máquina de estados

En lugar de un prompt largo que el agente tiene que seguir de memoria, un servidor MCP responde dos cosas:
- qué paso sigue;
- si lo que entregó el agente cumple el contrato del paso.

El agente no avanza si la entrega no valida.

### 10. Un MCP remoto serio

Lo que hace serio a un MCP remoto:
- no guarda estado entre llamadas;
- tiene alcance fijo y credenciales guardadas solo como hash;
- sus errores llevan códigos estables;
- dice lo mismo ante «no existe» y «no lo puedes ver»;
- cada respuesta trae un enlace a la fuente.

### 11. Responder con confianza y evidencia negativa

Una base de conocimiento honesta dice tres cosas:
- de dónde sale la respuesta;
- qué tan segura está y por qué;
- qué buscó y no encontró.

Si no hay evidencia, no responde de memoria. Ante una negación, el agente no reformula la pregunta para saltársela.

### 12. Los costos se miden y se topan en la CI

El tamaño del contexto y el número de agentes por corrida se miden, y la CI falla si pasan su techo. El costo es un
requisito, no una sorpresa en la factura.

## Cómo los uso en esta línea

| Patrón | Dónde aparece, con diseño propio |
|---|---|
| 1. Lo determinista primero | [047 Cotejo](../047-cotejo-revisor-de-specs/spec.md) y su uso en la 046 |
| 2, 3, 4 y 5. Revisores, verificación adversarial, regla de parada y humano en el bucle | [046 Del pedido a la spec con gates](../046-del-pedido-a-la-spec-con-gates/spec.md) |
| 6. Qué y cómo | Todas las specs hijas, con «No incluye» obligatorio |
| 8 y 12. Rastro y costos | [045 Tablero de ingeniería](../045-tablero-de-ingenieria/spec.md) y el tope mensual de la [043](../043-tres-proveedores-y-arena/spec.md) |
| 10. MCP remoto | [044 MCP público](../044-mcp-publico-del-portafolio/spec.md), [048](../048-base-de-conocimiento-honesta/spec.md) y [049](../049-plugins-por-profesion/spec.md) |
| 11. Confianza y evidencia negativa | [048 Base de conocimiento honesta](../048-base-de-conocimiento-honesta/spec.md) |
| 5. Aprobación humana antes de actuar | [050 Agente de operaciones pyme](../050-agente-de-operaciones-pyme/spec.md) |

## Lo que pensaba antes y cambió

Antes de leerlo creía dos cosas que resultaron no ser ciertas:
- **Que un buen proceso con agentes necesita mucha infraestructura.** Lo que más vale es disciplina: contratos,
  reglas deterministas y puntos claros de decisión humana. Todo eso cabe en funciones serverless y en el repo.
- **Que más agentes revisando es mejor.** Sin una regla de parada explícita y sin quitar duplicados, más revisores
  solo suman costo.

## Lo que queda abierto

| Pregunta | Por defecto |
|---|---|
| ¿Se pueden usar estas ideas en proyectos personales públicos y con qué crédito? (P-4105) | Solo patrones generales, con crédito genérico, hasta que el arquitecto diga otra cosa |
| ¿Algún día se integra algo más específico en CHERCED-WORLD, Synergos o un proyecto nuevo? | Por ahora no. Mi propuesta para cuando se decida: un proyecto nuevo y propio, pilotado desde el AI Lab, que Synergos consuma después |
