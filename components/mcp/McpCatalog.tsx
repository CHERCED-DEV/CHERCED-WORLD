import { GlassSurface } from '@/components/ui/GlassSurface'
import type { McpPromptDescriptor, McpToolDescriptor } from '@/lib/mcp/core/handler'
import { fillLabel, type McpCatalogLabels } from './labels'
import { McpTryButton } from './McpTryButton'
import styles from './Mcp.module.scss'

type Param = { name: string; type: string; required: boolean; description: string | null }

type Schema = { type?: unknown; enum?: unknown; items?: unknown; description?: unknown; properties?: unknown; required?: unknown }

function typeOf(schema: Schema): string {
  if (Array.isArray(schema.enum)) return schema.enum.map(String).join(' | ')
  if (schema.type === 'array' && schema.items && typeof schema.items === 'object') return `${typeOf(schema.items as Schema)}[]`
  return typeof schema.type === 'string' ? schema.type : 'any'
}

export function toolParams(inputSchema: Record<string, unknown>): Param[] {
  const schema = inputSchema as Schema
  const properties = schema.properties && typeof schema.properties === 'object' ? (schema.properties as Record<string, Schema>) : {}
  const required = Array.isArray(schema.required) ? schema.required.map(String) : []
  return Object.entries(properties).map(([name, property]) => ({
    name,
    type: typeOf(property),
    required: required.includes(name),
    description: typeof property.description === 'string' ? property.description : null,
  }))
}

type Props = { tools: McpToolDescriptor[]; prompts: McpPromptDescriptor[]; labels: McpCatalogLabels }

export function McpCatalog({ tools, prompts, labels }: Props) {
  return (
    <GlassSurface as="section" className={styles.panel} aria-labelledby="mcp-catalog-title" data-cw-mcp-catalog="">
      <h2 id="mcp-catalog-title" className={styles.h2}>
        {labels.title}
      </h2>
      <p className={styles.muted}>{labels.lead}</p>
      <h3 className={styles.h3}>{fillLabel(labels.tools, { count: tools.length })}</h3>
      <ul className={styles.tools}>
        {tools.map((tool) => {
          const params = toolParams(tool.inputSchema)
          return (
            <li key={tool.name} className={styles.tool} data-cw-mcp-tool={tool.name}>
              <div className={styles.toolHead}>
                <h4 className={styles.toolName}>
                  <code>{tool.name}</code>
                </h4>
                <span className={styles.badge}>{labels.readOnly}</span>
              </div>
              <p className={styles.toolTitle}>{tool.title}</p>
              <p className={styles.muted}>{tool.description}</p>
              {params.length > 0 ? (
                <>
                  <p className={styles.paramsLabel}>{labels.params}</p>
                  <dl className={styles.params}>
                    {params.map((param) => (
                      <div key={param.name}>
                        <dt>
                          <code>{param.name}</code> <span className={styles.paramType}>{param.type}</span>{' '}
                          <span className={styles.paramFlag}>{param.required ? labels.required : labels.optional}</span>
                        </dt>
                        {param.description ? <dd>{param.description}</dd> : null}
                      </div>
                    ))}
                  </dl>
                </>
              ) : (
                <p className={styles.muted}>{labels.noParams}</p>
              )}
              <McpTryButton tool={tool.name} text={labels.try} label={fillLabel(labels.tryLabel, { tool: tool.name })} />
            </li>
          )
        })}
      </ul>
      <h3 className={styles.h3}>{fillLabel(labels.prompts, { count: prompts.length })}</h3>
      <ul className={styles.tools}>
        {prompts.map((prompt) => (
          <li key={prompt.name} className={styles.tool} data-cw-mcp-prompt={prompt.name}>
            <h4 className={styles.toolName}>
              <code>{prompt.name}</code>
            </h4>
            <p className={styles.toolTitle}>{prompt.title}</p>
            <p className={styles.muted}>{prompt.description}</p>
            <p className={styles.paramsLabel}>{labels.params}</p>
            <dl className={styles.params}>
              {prompt.arguments.map((argument) => (
                <div key={argument.name}>
                  <dt>
                    <code>{argument.name}</code> <span className={styles.paramFlag}>{argument.required ? labels.required : labels.optional}</span>
                  </dt>
                  <dd>{argument.description}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </GlassSurface>
  )
}