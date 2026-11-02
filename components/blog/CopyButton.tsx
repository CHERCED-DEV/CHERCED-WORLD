'use client'

import { useEffect, useState } from 'react'
import { buttonClassName } from '@/components/ui/Button'
import { cx } from '@/components/ui/cx'
import { Icon } from '@/components/ui/Icon'

export type CopyLabels = { copy: string; copied: string; copyError: string }

type Status = 'idle' | 'done' | 'error'

const RESET_MS = 2500

export function CopyButton({ text, labels, className }: { text: string; labels: CopyLabels; className?: string }) {
  const [status, setStatus] = useState<Status>('idle')

  useEffect(() => {
    if (status === 'idle') return
    const timer = window.setTimeout(() => setStatus('idle'), RESET_MS)
    return () => window.clearTimeout(timer)
  }, [status])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  const announcement = status === 'done' ? labels.copied : status === 'error' ? labels.copyError : ''

  return (
    <span className={cx('cw-js-only', className)}>
      <button
        type="button"
        className={buttonClassName({ variant: 'glass', size: 'sm' })}
        onClick={copy}
        data-cw-copy={status}
      >
        <Icon name={status === 'done' ? 'check' : 'copy'} size={16} />
        <span>{status === 'done' ? labels.copied : labels.copy}</span>
      </button>
      <span role="status" className="cw-visually-hidden">
        {announcement}
      </span>
    </span>
  )
}
