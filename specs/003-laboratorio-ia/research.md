# Research 003: cómo montar el laboratorio de IA

Investigación del 2026-11-04. Responde las preguntas de [idea.md](idea.md). Lo marcado "sin verificar" se
mide en un preview antes de especificar.

## Hallazgos

### 1. Python en Vercel
- Los `.py` en `/api` son funciones Python, con `requirements.txt` o `pyproject.toml` y Python 3.12 por
  defecto ([runtime](https://vercel.com/docs/functions/runtimes/python),
  [api-directory](https://vercel.com/docs/functions/runtimes/python/api-directory)).
- La doc **no confirma** que funcione bajo el preset Next.js (sin verificar). Hay que probarlo con una
  función mínima en un preview.
- "Services" (Beta) sí lo soporta, pero cambia la estructura del despliegue. Se descarta.
- Límites en Hobby: 2 GB de memoria, 300 s de duración, 500 MB de bundle Python y 4,5 MB de cuerpo
  ([límites](https://vercel.com/docs/functions/limitations)).
- Conclusión: Python en servidor no hace falta para las demos. **Pyodide** cubre "Python en pequeño" sin
  servidor.

### 2. Transcripción en el navegador
Whisper con Transformers.js, modelos `onnx-community/whisper-*`:

| Modelo | int8 | fp16 |
|--------|-----:|-----:|
| tiny   | ≈41 MB | ≈76 MB |
| base   | ≈77 MB | ≈146 MB |
| small  | ≈249 MB | ≈485 MB |

- WebGPU sigue siendo experimental en Transformers.js
  ([README](https://github.com/huggingface/transformers.js)).
- Velocidad en portátil y móvil, y calidad en español, sin verificar. La expectativa es que small sea el
  mínimo decente en español.
- La Web Speech API manda el audio a un servicio del navegador, salvo `processLocally`, que es
  experimental. Solo sirve para micrófono en vivo y no da tiempos fiables para `.srt`
  ([MDN](https://developer.mozilla.org/docs/Web/API/Web_Speech_API)).

### 3. Pyodide (v0.29.0)
- Núcleo ≈12 MB, numpy 3,1 MB, pandas 5,3 MB, con carga bajo demanda (`loadPackage`).
- Corre en un web worker de tipo módulo ([doc](https://pyodide.org/en/stable/usage/webworker.html)).
- Arranque en frío sin verificar.

### 4. Embeddings
- `multilingual-e5-small` y `paraphrase-multilingual-MiniLM-L12-v2` pesan ≈118 MB en int8.
- El índice se puede precalcular en el build: en el navegador solo se embebe la consulta.
- La alternativa sin descarga es BM25 sobre el índice de búsqueda que ya existe.

### 5. Research sin llave
- WebLLM exige WebGPU.
- El Prompt API de Chrome (Gemini Nano) existe solo en Chrome de escritorio 148+, y pide más de 22 GB
  libres y una GPU con más de 4 GB ([doc](https://developer.chrome.com/docs/ai/prompt-api)).
- **Una pregunta libre con citas fiables no es realista sin llave.** Sí es viable un investigador sobre
  fuentes curadas que cite extractos literales, sin generación libre.

### 6. Camino B (una llave)
- Un Route Handler en Node, con la llave solo en el servidor y un límite por IP hash en MongoDB (índice
  TTL), más un tope diario propio.
- El Spend Management de Vercel es solo para Pro y no frena el gasto con proveedores externos.
- Rompe dos reglas de la constitución: pide una variable nueva y un proveedor con cuenta propia. Necesita
  una enmienda explícita.

## Recomendación

**Camino A (todo en el navegador) como base:**

| App | Cómo |
|-----|------|
| 1. Transcriptor | Whisper small, con tiny o base como respaldo en equipos modestos |
| 3. Despacho | Determinista sobre un caso ficticio, sin modelo |
| 4. Obra | Pyodide en worker |
| 5. Buscador semántico | e5-small con índice precalculado, o BM25 |

**App 2 (investigador):** sin llave, sobre fuentes curadas con extractos citados. Con generación libre
solo si el autor acepta el camino B como excepción.

## Riesgos y reglas

- Hoy no hay CSP. Si se agrega, debe permitir `wasm-unsafe-eval`, workers `blob:` y los CDN de pesos
  (Hugging Face, jsDelivr).
- Los modelos se cargan solo al entrar al laboratorio y con consentimiento del visitante (el tamaño se
  muestra antes de descargar). La inferencia va en workers para no bajar los fps del fondo animado
  (SC-204 / SC-205).
- Los pesos de terceros no requieren cuenta. Pasan de 100 MB por archivo, así que no van en `public/`.

## Decisión pendiente del autor (al arrancar la 003)

Camino A puro, o A + B solo para el investigador.
