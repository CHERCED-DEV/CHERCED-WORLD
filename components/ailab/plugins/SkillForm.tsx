'use client'

import { useId, useMemo, useRef, useState, type FormEvent } from 'react'
import type { LabDemoProps, LabTranslate } from '@/components/ailab/shell/types'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { downloadText } from '@/lib/ailab/skill/download'
import {
  SKILL_DESCRIPTION_MAX,
  SKILL_FIELDS,
  SKILL_FILE_NAME,
  SKILL_NAME_MAX,
  checkSkill,
  generateSkillMd,
  suggestName,
  type SkillErrorCode,
  type SkillField,
  type SkillInput,
} from '@/lib/ailab/skill/generate'
import styles from './Plugins.module.scss'

const ERROR_KEYS: Record<SkillField, Partial<Record<SkillErrorCode, string>>> = {
  name: {
    required: 'ailab.a3.error.name.required',
    tooLong: 'ailab.a3.error.name.tooLong',
    format: 'ailab.a3.error.name.format',
    reserved: 'ailab.a3.error.name.reserved',
  },
  description: {
    required: 'ailab.a3.error.description.required',
    tooLong: 'ailab.a3.error.description.tooLong',
    markup: 'ailab.a3.error.description.markup',
  },
  steps: { required: 'ailab.a3.error.steps.required' },
}

const EMPTY: SkillInput = { name: '', description: '', steps: '' }

function errorText(t: LabTranslate, field: SkillField, code: SkillErrorCode | undefined, input: SkillInput): string | undefined {
  if (!code) return undefined
  const key = ERROR_KEYS[field][code]
  if (!key) return undefined
  const count = field === 'name' ? [...input.name.trim()].length : [...input.description.trim()].length
  return t(key, { max: field === 'name' ? SKILL_NAME_MAX : SKILL_DESCRIPTION_MAX, count })
}

export function SkillForm({ t }: LabDemoProps) {
  const [input, setInput] = useState<SkillInput>(EMPTY)
  const [tried, setTried] = useState(false)
  const [status, setStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const stepsRef = useRef<HTMLTextAreaElement>(null)
  const base = useId().replace(/:/g, '')
  const check = useMemo(() => checkSkill(input), [input])
  const stepsHeading = t('ailab.a3.file.steps')
  const preview = useMemo(() => generateSkillMd(check.skill, { stepsHeading }), [check.skill, stepsHeading])
  const shown = tried ? check.errors : {}
  const suggestion = shown.name === 'format' || shown.name === 'reserved' ? suggestName(input.name) : null

  const change = (field: SkillField, value: string) => {
    setInput((current) => ({ ...current, [field]: value }))
    setStatus(null)
  }

  const fillExample = () => {
    setInput({ name: t('ailab.a3.example.name'), description: t('ailab.a3.example.description'), steps: t('ailab.a3.example.steps') })
    setStatus(null)
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTried(true)
    if (!check.ok) {
      const first = SKILL_FIELDS.find((field) => check.errors[field])
      const control = first === 'name' ? nameRef.current : first === 'description' ? descriptionRef.current : stepsRef.current
      control?.focus()
      setStatus({ tone: 'error', text: t('ailab.a3.invalid') })
      return
    }
    downloadText(SKILL_FILE_NAME, generateSkillMd(check.skill, { stepsHeading }))
    setStatus({ tone: 'ok', text: t('ailab.a3.downloaded', { name: check.skill.name }) })
  }

  return (
    <div className={styles.demo} data-cw-skill-form="">
      <p className={styles.lead}>{t('ailab.a3.intro')}</p>
      <div className={styles.formGrid}>
        <form className={styles.form} noValidate onSubmit={submit} aria-describedby={`${base}-local`}>
          <FormField label={t('ailab.a3.name.label')} hint={t('ailab.a3.name.hint', { max: SKILL_NAME_MAX })} error={errorText(t, 'name', shown.name, input)}>
            <input
              ref={nameRef}
              type="text"
              name="name"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              value={input.name}
              onChange={(event) => change('name', event.target.value)}
              data-cw-skill-field="name"
            />
          </FormField>
          {suggestion ? (
            <p className={styles.suggest} data-cw-skill-suggest="">
              <span>{t('ailab.a3.suggest', { name: suggestion })}</span>
              <Button variant="ghost" size="sm" onClick={() => change('name', suggestion)} data-cw-skill-use-suggestion="">
                {t('ailab.a3.useSuggestion')}
              </Button>
            </p>
          ) : null}
          <FormField
            label={t('ailab.a3.description.label')}
            hint={t('ailab.a3.description.hint', { max: SKILL_DESCRIPTION_MAX })}
            error={errorText(t, 'description', shown.description, input)}
          >
            <textarea
              ref={descriptionRef}
              name="description"
              rows={3}
              value={input.description}
              onChange={(event) => change('description', event.target.value)}
              data-cw-skill-field="description"
            />
          </FormField>
          <FormField label={t('ailab.a3.steps.label')} hint={t('ailab.a3.steps.hint')} error={errorText(t, 'steps', shown.steps, input)}>
            <textarea
              ref={stepsRef}
              name="steps"
              rows={4}
              value={input.steps}
              onChange={(event) => change('steps', event.target.value)}
              data-cw-skill-field="steps"
            />
          </FormField>
          <div className={styles.actions}>
            <Button type="submit" variant="solid" data-cw-skill-download="">
              {t('ailab.a3.download')}
            </Button>
            <Button variant="ghost" onClick={fillExample} data-cw-skill-example="">
              {t('ailab.a3.example')}
            </Button>
          </div>
          <p id={`${base}-local`} className={styles.hint}>
            {t('ailab.a3.local')}
          </p>
          <p
            className={status?.tone === 'error' ? styles.statusError : styles.status}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            data-cw-skill-status={status?.tone ?? ''}
          >
            {status?.text ?? ''}
          </p>
        </form>
        <section className={styles.preview} aria-labelledby={`${base}-preview`} data-cw-skill-preview="" data-valid={check.ok ? 'true' : 'false'}>
          <header className={styles.previewHead}>
            <h5 id={`${base}-preview`} className={styles.fileName}>
              {t('ailab.a3.preview')}
            </h5>
            <span className={check.ok ? styles.validBadge : styles.pendingBadge} data-cw-skill-valid={check.ok ? 'true' : 'false'}>
              {check.ok ? t('ailab.a3.valid') : t('ailab.a3.pending')}
            </span>
          </header>
          <pre className={styles.previewCode} tabIndex={0} aria-label={t('ailab.a3.preview')} data-cw-skill-markdown="">
            <code>{preview}</code>
          </pre>
          <p className={styles.hint}>{t('ailab.a3.where', { name: check.errors.name ? t('ailab.a3.where.placeholder') : check.skill.name })}</p>
        </section>
      </div>
    </div>
  )
}

export default SkillForm
