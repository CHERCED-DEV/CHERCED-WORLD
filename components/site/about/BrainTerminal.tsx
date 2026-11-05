'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { TerminalLine } from '@/content/terminal'
import styles from './Brain.module.scss'
import { completeBrainInput, resolveBrainCommand, terminalNames, TERMINAL_HISTORY, type TerminalTable } from './terminalInput'

export type BrainTerminalLabels = { input: string; hint: string; output: string }

type Entry = { id: number; command: string; lines: TerminalLine[] }

export type BrainTerminalProps = {
  table: TerminalTable
  lobeIds: readonly string[]
  labels: BrainTerminalLabels
  onLobe: (id: string) => void
}

export function BrainTerminal({ table, lobeIds, labels, onLobe }: BrainTerminalProps) {
  const [value, setValue] = useState('')
  const [entries, setEntries] = useState<Entry[]>([])
  const nextId = useRef(0)
  const logRef = useRef<HTMLDivElement>(null)
  const inputId = useId()
  const hintId = useId()
  const names = terminalNames(table, lobeIds)

  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [entries])

  const push = (command: string, lines: TerminalLine[]) => {
    nextId.current += 1
    const entry = { id: nextId.current, command, lines }
    setEntries((current) => [...current, entry].slice(-TERMINAL_HISTORY))
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const command = value.slice(0, table.maxInput).trim()
    const result = resolveBrainCommand(value, table, lobeIds)
    setValue('')
    switch (result.kind) {
      case 'empty':
        return
      case 'clear':
        setEntries([])
        return
      case 'lobe':
        onLobe(result.id)
        push(command, [])
        return
      default:
        push(command, result.lines)
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      if (value === '') return
      event.preventDefault()
      event.stopPropagation()
      setValue('')
      return
    }
    if (event.key !== 'Tab' || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) return
    const completion = completeBrainInput(value, names, table.maxInput)
    if (completion === null || completion === value) return
    event.preventDefault()
    setValue(completion)
  }

  return (
    <div className={styles.shell} data-cw-term-shell="">
      <div
        ref={logRef}
        className={styles.shellLog}
        role="log"
        aria-live="polite"
        aria-label={labels.output}
        tabIndex={entries.length > 0 ? 0 : undefined}
        data-cw-term-output=""
      >
        {entries.map((entry) => (
          <div key={entry.id} className={styles.shellEntry} data-cw-term-entry="">
            <p className={styles.shellEcho}>
              <span className={styles.prompt} aria-hidden="true">
                ${' '}
              </span>
              {entry.command}
            </p>
            {entry.lines.map((line, index) => (
              <p key={index} className={styles.shellLine} lang={line.lang} data-cw-term-line="">
                {line.href ? (
                  <Link href={line.href} className={styles.termLink}>
                    {line.text}
                  </Link>
                ) : (
                  line.text
                )}
              </p>
            ))}
          </div>
        ))}
      </div>
      <form className={styles.shellForm} onSubmit={onSubmit} data-cw-term-form="">
        <label htmlFor={inputId} className="cw-visually-hidden">
          {labels.input}
        </label>
        <span className={styles.prompt} aria-hidden="true">
          $
        </span>
        <input
          id={inputId}
          className={styles.shellInput}
          type="text"
          value={value}
          maxLength={table.maxInput}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="enter"
          aria-describedby={hintId}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          data-cw-term-input=""
        />
      </form>
      <p id={hintId} className={styles.shellHint}>
        {labels.hint}
      </p>
    </div>
  )
}
