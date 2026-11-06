import { createInterface } from 'node:readline'

const TOOL = {
  name: 'scale_recipe',
  description: "Works out the baker's percentages and the hydration of a recipe, and scales it to another dough weight if you ask.",
  inputSchema: {
    type: 'object',
    properties: {
      ingredients: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            grams: { type: 'number', exclusiveMinimum: 0 },
            type: { type: 'string', enum: ['flour', 'liquid', 'other'] },
          },
          required: ['name', 'grams', 'type'],
        },
      },
      target_dough_g: { type: 'number', exclusiveMinimum: 0 },
    },
    required: ['ingredients'],
  },
}

function round(value, decimals = 1) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function gramsOf(ingredients, type) {
  return ingredients.filter((item) => type === undefined || item.type === type).reduce((sum, item) => sum + item.grams, 0)
}

function scaleRecipe({ ingredients = [], target_dough_g: target } = {}) {
  const flour = gramsOf(ingredients, 'flour')
  if (flour <= 0) throw new Error('The recipe needs at least one flour with its grams.')
  const factor = target ? target / gramsOf(ingredients) : 1
  return {
    hydration: round((gramsOf(ingredients, 'liquid') / flour) * 100),
    factor: round(factor, 4),
    ingredients: ingredients.map((item) => ({
      name: item.name,
      percentage: round((item.grams / flour) * 100),
      grams: item.grams,
      scaled: round(item.grams * factor),
    })),
  }
}

function send(message) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', ...message })}\n`)
}

function handle({ id, method, params }) {
  if (id === undefined) return
  if (method === 'initialize') {
    return send({
      id,
      result: {
        protocolVersion: params?.protocolVersion ?? '2025-06-18',
        capabilities: { tools: {} },
        serverInfo: { name: 'recipes', version: '0.1.0' },
      },
    })
  }
  if (method === 'ping') return send({ id, result: {} })
  if (method === 'tools/list') return send({ id, result: { tools: [TOOL] } })
  if (method === 'tools/call' && params?.name === TOOL.name) {
    try {
      const result = scaleRecipe(params.arguments)
      return send({ id, result: { content: [{ type: 'text', text: JSON.stringify(result) }] } })
    } catch (error) {
      return send({ id, result: { content: [{ type: 'text', text: error.message }], isError: true } })
    }
  }
  return send({ id, error: { code: -32601, message: `Unknown ${method} ${params?.name ?? ''}`.trim() } })
}

createInterface({ input: process.stdin }).on('line', (line) => {
  if (!line.trim()) return
  try {
    handle(JSON.parse(line))
  } catch {
    send({ id: null, error: { code: -32700, message: 'The message is not JSON.' } })
  }
})
