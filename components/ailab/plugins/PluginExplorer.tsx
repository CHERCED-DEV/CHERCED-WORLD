'use client'

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type FocusEvent } from 'react'
import type { LabDemoProps } from '@/components/ailab/shell/types'
import { CodeBlock } from '@/components/blog/mdx/CodeBlock'
import { pluginExample, pluginFileHref, type PluginExampleFile, type PluginPartKind } from '@/content/ailab/plugin-example'
import styles from './Plugins.module.scss'
import { buildTree, fileIds, folderIds, treeKey, type FileTree, type TreeNode } from './tree'

const KIND_KEYS: Record<PluginPartKind, string> = {
  manifest: 'ailab.a2.kind.manifest',
  skill: 'ailab.a2.kind.skill',
  command: 'ailab.a2.kind.command',
  hooks: 'ailab.a2.kind.hooks',
  'hook-script': 'ailab.a2.kind.hookScript',
  mcp: 'ailab.a2.kind.mcp',
  'mcp-server': 'ailab.a2.kind.mcpServer',
}

const FENCES: Record<PluginExampleFile['language'], string> = { json: 'json', markdown: 'md', javascript: 'js' }

function Chevron() {
  return (
    <svg className={styles.chevron} width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M4 2.5 7.5 6 4 9.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FileGlyph() {
  return (
    <svg className={styles.glyph} width="12" height="14" viewBox="0 0 12 14" aria-hidden="true" focusable="false">
      <path d="M1.5 1.5h6l3 3v8h-9z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

type ItemProps = {
  id: string
  tree: FileTree
  expanded: ReadonlySet<string>
  focused: string
  selected: string
  domId: (id: string) => string
  register: (id: string, element: HTMLLIElement | null) => void
  onRow: (node: TreeNode) => void
}

function TreeItem({ id, tree, expanded, focused, selected, domId, register, onRow }: ItemProps) {
  const node = tree.nodes.get(id)!
  const folder = node.kind === 'folder'
  const open = folder && expanded.has(id)
  const siblings = node.parent ? tree.nodes.get(node.parent)!.children : tree.roots
  const labelId = `${domId(id)}-label`
  return (
    <li
      ref={(element) => register(id, element)}
      id={domId(id)}
      role="treeitem"
      aria-level={node.level}
      aria-setsize={siblings.length}
      aria-posinset={siblings.indexOf(id) + 1}
      aria-expanded={folder ? open : undefined}
      aria-selected={folder ? undefined : selected === id}
      aria-labelledby={labelId}
      tabIndex={focused === id ? 0 : -1}
      className={styles.item}
      data-cw-plugin-node={node.kind}
      data-cw-plugin-path={id}
    >
      <span
        id={labelId}
        className={styles.row}
        style={{ paddingInlineStart: `calc(${node.level - 1} * 1.1rem + 0.5rem)` }}
        onClick={() => onRow(node)}
        data-selected={!folder && selected === id ? '' : undefined}
      >
        {folder ? <Chevron /> : <FileGlyph />}
        <span className={styles.name}>{folder ? `${node.name}/` : node.name}</span>
      </span>
      {open ? (
        <ul role="group" className={styles.group}>
          {node.children.map((child) => (
            <TreeItem
              key={child}
              id={child}
              tree={tree}
              expanded={expanded}
              focused={focused}
              selected={selected}
              domId={domId}
              register={register}
              onRow={onRow}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export function PluginExplorer({ lang, t }: LabDemoProps) {
  const example = useMemo(() => pluginExample(lang), [lang])
  const tree = useMemo(() => buildTree(example.root, example.files.map((file) => file.path)), [example])
  const firstFile = fileIds(tree)[0]!
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set(folderIds(tree)))
  const [focused, setFocused] = useState(tree.roots[0]!)
  const [selected, setSelected] = useState(firstFile)
  const [announce, setAnnounce] = useState(false)
  const items = useRef(new Map<string, HTMLLIElement>())
  const moveFocus = useRef(false)
  const revealPanel = useRef(false)
  const panelRef = useRef<HTMLElement>(null)
  const base = useId().replace(/:/g, '')
  const domId = (id: string) => `${base}-${id.replace(/[^\w-]/g, '_')}`
  const file = example.files.find((item) => `${example.root}/${item.path}` === selected) ?? example.files[0]!
  const panelId = `${base}-panel`

  useEffect(() => {
    if (!moveFocus.current) return
    moveFocus.current = false
    items.current.get(focused)?.focus()
  }, [focused, expanded])

  useEffect(() => {
    if (!revealPanel.current) return
    revealPanel.current = false
    const panel = panelRef.current
    if (!panel || panel.getBoundingClientRect().top < window.innerHeight * 0.75) return
    const smooth = window.matchMedia('(prefers-reduced-motion: no-preference)').matches
    panel.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' })
  }, [selected])

  const register = (id: string, element: HTMLLIElement | null) => {
    if (element) items.current.set(id, element)
    else items.current.delete(id)
  }

  const toggle = (id: string, open?: boolean) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (open ?? !next.has(id)) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const focusNode = (id: string) => {
    moveFocus.current = true
    setFocused(id)
  }

  const select = (id: string) => {
    setSelected(id)
    setAnnounce(true)
  }

  const onRow = (node: TreeNode) => {
    focusNode(node.id)
    if (node.kind === 'folder') toggle(node.id)
    else {
      revealPanel.current = true
      select(node.id)
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const move = treeKey(tree, expanded, focused, event.key)
    if (!move) return
    event.preventDefault()
    if (move.expand) toggle(move.expand, true)
    if (move.collapse) toggle(move.collapse, false)
    if (move.toggle) toggle(move.toggle)
    if (move.select) select(move.select)
    if (move.focus) focusNode(move.focus)
  }

  const onFocus = (event: FocusEvent<HTMLUListElement>) => {
    const id = (event.target as HTMLElement).closest<HTMLElement>('[data-cw-plugin-path]')?.dataset.cwPluginPath
    if (id && id !== focused) setFocused(id)
  }

  return (
    <div className={styles.demo} data-cw-plugin-explorer={lang}>
      <p className={styles.lead}>{t('ailab.a2.intro')}</p>
      <p className={styles.hint}>{t('ailab.a2.keys')}</p>
      <div className={styles.explorer}>
        <div className={styles.treeWrap}>
          <ul
            role="tree"
            aria-label={t('ailab.a2.tree')}
            aria-controls={panelId}
            className={styles.tree}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            data-cw-plugin-tree=""
          >
            {tree.roots.map((id) => (
              <TreeItem
                key={id}
                id={id}
                tree={tree}
                expanded={expanded}
                focused={focused}
                selected={selected}
                domId={domId}
                register={register}
                onRow={onRow}
              />
            ))}
          </ul>
        </div>
        <section ref={panelRef} id={panelId} className={styles.panel} aria-labelledby={`${panelId}-title`} data-cw-plugin-file={file.path}>
          <header className={styles.panelHead}>
            <span className={styles.kind}>{t(KIND_KEYS[file.kind])}</span>
            <h5 id={`${panelId}-title`} className={styles.fileName}>
              {file.path.split('/').at(-1)}
            </h5>
            <p className={styles.path}>
              <span>
                {example.root}/{file.path}
              </span>
              <a href={pluginFileHref(example, file.path)} target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>
                {t('ailab.a2.repo')}
              </a>
            </p>
          </header>
          <div className={styles.explain}>
            <div className={styles.explainBlock} data-cw-plugin-what="">
              <p className={styles.label}>{t('ailab.a2.what')}</p>
              <p>{file.what}</p>
            </div>
            <div className={styles.explainBlock} data-cw-plugin-trade="">
              <p className={styles.label}>{t('ailab.a2.trade')}</p>
              <p>{file.trade}</p>
            </div>
          </div>
          <div className={styles.code} data-wrap={file.language === 'markdown' ? '' : undefined}>
            <CodeBlock labels={{ copy: t('ailab.a2.copy'), copied: t('ailab.a2.copied'), copyError: t('ailab.a2.copyError') }}>
              <code className={`language-${FENCES[file.language]}`}>{file.content}</code>
            </CodeBlock>
          </div>
        </section>
      </div>
      <p className="cw-visually-hidden" role="status" aria-live="polite" aria-atomic="true" data-cw-plugin-status="">
        {announce ? t('ailab.a2.opened', { file: file.path.split('/').at(-1) ?? file.path }) : ''}
      </p>
      <p className={styles.next}>
        <a href="#lab-a3" className={styles.inlineLink} data-cw-plugin-next="">
          {t('ailab.a2.next')}
        </a>
      </p>
    </div>
  )
}

export default PluginExplorer
