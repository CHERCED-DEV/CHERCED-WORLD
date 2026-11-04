import { isValidElement, type ReactNode } from 'react'
import { highlight, type LanguageName } from 'sugar-high'
import { lang as normalizeLanguage } from 'sugar-high/lang'
import { textContent } from '@/lib/blog/outline'
import { CopyButton, type CopyLabels } from '../CopyButton'
import styles from './CodeBlock.module.scss'

type CodeChildProps = { className?: string; children?: ReactNode }

export type ParsedCodeBlock = { code: string; fence: string | null; language: LanguageName }

const FENCE = /(?:^|\s)language-([\w#+.-]+)/

export function readCodeBlock(children: ReactNode): ParsedCodeBlock {
  const child = isValidElement<CodeChildProps>(children) ? children : null
  const code = textContent(child ? child.props.children : children).replace(/\r?\n$/, '')
  const fence = FENCE.exec(child?.props.className ?? '')?.[1] ?? null
  const language = (fence ? normalizeLanguage(fence) : undefined) ?? 'plaintext'
  return { code, fence, language }
}

export function CodeBlock({ children, labels }: { children?: ReactNode; labels?: CopyLabels }) {
  const { code, fence, language } = readCodeBlock(children)
  const html = highlight(code, { lang: language })

  return (
    <div className={styles.block} data-cw-code={language}>
      <div className={styles.toolbar}>
        <span className={styles.label}>
          <span className={styles.dots} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          {fence ? <span className={styles.language}>{fence}</span> : null}
        </span>
        {labels ? <CopyButton text={code} labels={labels} /> : null}
      </div>
      <pre className={styles.pre} tabIndex={0}>
        <code dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  )
}
