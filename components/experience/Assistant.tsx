'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Icon } from '@/components/ui/Icon'
import { cx } from '@/components/ui/cx'
import { detectLanguage, MAX_QUESTION_LENGTH, type AssistantAnswer } from '@/lib/assistant'
import type { Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/translate'
import styles from './Assistant.module.scss'
import { getAssistant } from './assistant-runtime'
import type { AssistantStatus } from './ExperienceClient'
import type { ExperienceLabels } from './labels'

export type AssistantProps = {
  lang: Locale
  labels: ExperienceLabels
  open: boolean
  status: AssistantStatus
  onStatus: (status: AssistantStatus) => void
  onClose: () => void
}

type Message =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'bot'; answer: AssistantAnswer }
  | { id: number; role: 'error' }

type WithoutId<T> = T extends unknown ? Omit<T, 'id'> : never

type NewMessage = WithoutId<Message>

const SUGGESTIONS = ['assistant.suggestion.1', 'assistant.suggestion.2', 'assistant.suggestion.3']

export function Assistant({ lang, labels, open, status, onStatus, onClose }: AssistantProps) {
  const titleId = useId()
  const introId = useId()
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const nextId = useRef(0)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (!open) return
    let alive = true
    getAssistant(lang).then(
      () => alive && onStatus('ready'),
      () => alive && onStatus('unavailable'),
    )
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    return () => {
      alive = false
      cancelAnimationFrame(frame)
    }
  }, [open, lang, onStatus])

  const push = (message: NewMessage) => {
    nextId.current += 1
    const id = nextId.current
    setMessages((list) => [...list, { ...message, id } as Message])
  }

  const ask = async (raw: string) => {
    const question = raw.trim().slice(0, MAX_QUESTION_LENGTH)
    if (!question || pending) return
    push({ role: 'user', text: question })
    setInput('')
    setPending(true)
    try {
      const assistant = await getAssistant(detectLanguage(question, lang))
      push({ role: 'bot', answer: assistant.answer(question) })
      onStatus('ready')
    } catch {
      push({ role: 'error' })
      onStatus('unavailable')
    } finally {
      setPending(false)
    }
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void ask(input)
  }

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId} describedBy={introId} className={styles.assistant}>
      <div className={styles.body} data-cw-assistant="">
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {t(labels, 'assistant.open')}
          </h2>
          <button type="button" className={styles.close} aria-label={t(labels, 'assistant.close')} onClick={onClose}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <p id={introId} className={styles.intro}>
          {t(labels, 'assistant.intro')}
        </p>

        {status === 'unavailable' ? (
          <p role="alert" className={styles.unavailable} data-cw-assistant-unavailable="">
            <Icon name="alert" size={18} />
            {t(labels, 'assistant.unavailable')}
          </p>
        ) : null}

        <div role="log" aria-live="polite" aria-relevant="additions" aria-label={t(labels, 'assistant.open')} className={styles.log}>
          {messages.map((message) => {
            if (message.role === 'user') {
              return (
                <div key={message.id} className={cx(styles.message, styles.user)}>
                  <span className="cw-visually-hidden">{t(labels, 'assistant.you')}: </span>
                  <p>{message.text}</p>
                </div>
              )
            }
            if (message.role === 'error') {
              return (
                <div key={message.id} className={cx(styles.message, styles.bot)}>
                  <span className="cw-visually-hidden">{t(labels, 'assistant.bot')}: </span>
                  <p>{t(labels, 'assistant.unavailable')}</p>
                </div>
              )
            }
            const { answer } = message
            return (
              <div
                key={message.id}
                className={cx(styles.message, styles.bot)}
                lang={answer.lang}
                data-cw-answer-kind={answer.kind}
              >
                <span className="cw-visually-hidden">{t(labels, 'assistant.bot')}: </span>
                <p>{answer.text}</p>
                {answer.links.length > 0 ? (
                  <div className={styles.sources}>
                    <span className={styles.sourcesTitle}>{t(labels, 'assistant.sources')}</span>
                    <ul className={styles.links}>
                      {answer.links.map((link) => (
                        <li key={link.href}>
                          {link.external ? (
                            <a
                              href={link.href}
                              className={styles.link}
                              {...(link.href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
                            >
                              {link.label}
                              {link.href.startsWith('mailto:') ? null : <Icon name="external" size={14} />}
                            </a>
                          ) : (
                            <Link href={link.href} className={styles.link} onClick={onClose}>
                              {link.label}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )
          })}
          {pending ? (
            <div className={cx(styles.message, styles.bot, styles.pending)} aria-busy="true">
              <p>{t(labels, 'assistant.thinking')}</p>
            </div>
          ) : null}
        </div>

        {messages.length === 0 ? (
          <div className={styles.suggestions}>
            <p className={styles.suggestionsTitle}>{t(labels, 'assistant.suggestions')}</p>
            <ul>
              {SUGGESTIONS.map((key) => (
                <li key={key}>
                  <button type="button" className={styles.chip} onClick={() => void ask(t(labels, key))}>
                    {t(labels, key)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <form className={styles.form} onSubmit={onSubmit}>
          <label htmlFor={inputId} className="cw-visually-hidden">
            {t(labels, 'assistant.input')}
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            className={styles.input}
            placeholder={t(labels, 'assistant.placeholder')}
            autoComplete="off"
            enterKeyHint="send"
            maxLength={MAX_QUESTION_LENGTH}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            data-cw-assistant-input=""
          />
          <Button type="submit" variant="solid" disabled={pending || input.trim() === ''}>
            {t(labels, 'assistant.send')}
          </Button>
        </form>
      </div>
    </Dialog>
  )
}
