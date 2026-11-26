'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import type { GuestExperience } from '@/lib/ai/agent/guest'
import type { Locale } from '@/lib/i18n/config'

const Experience = dynamic(() => import('./GuestExperience'), { ssr: false })

const Back = dynamic(() => import('./GuestExperience').then((module) => module.GuestBack), { ssr: false })

type GuestReply = { off: true } | { off: false; experience: GuestExperience }

function signedIn(): boolean {
  return document.cookie.split(';').some((part) => part.trim() === 'cw-reader=1')
}

export function GuestLoader({ lang }: { lang: Locale }) {
  const [reply, setReply] = useState<GuestReply | null>(null)

  useEffect(() => {
    if (!signedIn()) return
    let alive = true
    fetch('/api/guest', { cache: 'no-store' })
      .then((response) => (response.ok ? (response.json() as Promise<GuestReply>) : null))
      .then((data) => {
        if (alive && data) setReply(data)
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  if (!reply) return null
  if (reply.off) return <Back lang={lang} />
  return <Experience lang={lang} experience={reply.experience} />
}
