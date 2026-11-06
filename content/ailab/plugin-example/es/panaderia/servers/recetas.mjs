import { createInterface } from 'node:readline'

const HERRAMIENTA = {
  name: 'escalar_receta',
  description: 'Calcula los porcentajes de panadero y la hidratación de una receta, y la escala a otro peso de masa si se lo pides.',
  inputSchema: {
    type: 'object',
    properties: {
      ingredientes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            nombre: { type: 'string' },
            gramos: { type: 'number', exclusiveMinimum: 0 },
            tipo: { type: 'string', enum: ['harina', 'liquido', 'otro'] },
          },
          required: ['nombre', 'gramos', 'tipo'],
        },
      },
      masa_objetivo_g: { type: 'number', exclusiveMinimum: 0 },
    },
    required: ['ingredientes'],
  },
}

function redondear(valor, decimales = 1) {
  const factor = 10 ** decimales
  return Math.round(valor * factor) / factor
}

function gramosDe(ingredientes, tipo) {
  return ingredientes.filter((item) => tipo === undefined || item.tipo === tipo).reduce((suma, item) => suma + item.gramos, 0)
}

function escalarReceta({ ingredientes = [], masa_objetivo_g: objetivo } = {}) {
  const harina = gramosDe(ingredientes, 'harina')
  if (harina <= 0) throw new Error('La receta necesita al menos una harina con sus gramos.')
  const factor = objetivo ? objetivo / gramosDe(ingredientes) : 1
  return {
    hidratacion: redondear((gramosDe(ingredientes, 'liquido') / harina) * 100),
    factor: redondear(factor, 4),
    ingredientes: ingredientes.map((item) => ({
      nombre: item.nombre,
      porcentaje: redondear((item.gramos / harina) * 100),
      gramos: item.gramos,
      escalados: redondear(item.gramos * factor),
    })),
  }
}

function enviar(mensaje) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', ...mensaje })}\n`)
}

function atender({ id, method, params }) {
  if (id === undefined) return
  if (method === 'initialize') {
    return enviar({
      id,
      result: {
        protocolVersion: params?.protocolVersion ?? '2025-06-18',
        capabilities: { tools: {} },
        serverInfo: { name: 'recetas', version: '0.1.0' },
      },
    })
  }
  if (method === 'ping') return enviar({ id, result: {} })
  if (method === 'tools/list') return enviar({ id, result: { tools: [HERRAMIENTA] } })
  if (method === 'tools/call' && params?.name === HERRAMIENTA.name) {
    try {
      const resultado = escalarReceta(params.arguments)
      return enviar({ id, result: { content: [{ type: 'text', text: JSON.stringify(resultado) }] } })
    } catch (error) {
      return enviar({ id, result: { content: [{ type: 'text', text: error.message }], isError: true } })
    }
  }
  return enviar({ id, error: { code: -32601, message: `No conozco ${method} ${params?.name ?? ''}`.trim() } })
}

createInterface({ input: process.stdin }).on('line', (linea) => {
  if (!linea.trim()) return
  try {
    atender(JSON.parse(linea))
  } catch {
    enviar({ id: null, error: { code: -32700, message: 'El mensaje no es JSON.' } })
  }
})
