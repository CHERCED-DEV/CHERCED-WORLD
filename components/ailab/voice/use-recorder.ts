'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AUDIO_CONSTRAINTS, micIssue, micPermission, micSupported, pickRecordingType, type MicIssue } from '@/lib/ailab/voice/recorder'

export type RecorderStatus = 'idle' | 'requesting' | 'recording'

export type Recording = { blob: Blob; seconds: number }

export type RecorderOptions = {
  maxSeconds: number
  onRecording: (recording: Recording) => void
  onAutoStop?: () => void
}

const TICK_MS = 200

export function useRecorder({ maxSeconds, onRecording, onAutoStop }: RecorderOptions) {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [issue, setIssue] = useState<MicIssue | null>(() => (micSupported() ? null : 'unsupported'))
  const [seconds, setSeconds] = useState(0)
  const latest = useRef({ onRecording, onAutoStop, maxSeconds })
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const startedAt = useRef(0)
  const ticker = useRef<number | null>(null)
  const wantStop = useRef(false)
  const discard = useRef(false)
  const session = useRef(0)

  useEffect(() => {
    latest.current = { onRecording, onAutoStop, maxSeconds }
  })

  useEffect(() => {
    let alive = true
    if (!micSupported()) return
    void micPermission().then((state) => {
      if (alive && state === 'denied') setIssue('denied')
    })
    return () => {
      alive = false
    }
  }, [])

  const releaseStream = useCallback(() => {
    if (ticker.current !== null) window.clearInterval(ticker.current)
    ticker.current = null
    for (const track of stream.current?.getTracks() ?? []) track.stop()
    stream.current = null
    recorder.current = null
  }, [])

  const stop = useCallback((options: { discard?: boolean } = {}) => {
    discard.current = Boolean(options.discard)
    const current = recorder.current
    if (!current) {
      wantStop.current = true
      return
    }
    if (current.state !== 'inactive') current.stop()
  }, [])

  const start = useCallback(async () => {
    if (recorder.current || status === 'requesting') return
    if (!micSupported()) {
      setIssue('unsupported')
      return
    }
    session.current += 1
    const mine = session.current
    wantStop.current = false
    discard.current = false
    setStatus('requesting')
    let media: MediaStream
    try {
      media = await navigator.mediaDevices.getUserMedia({ audio: AUDIO_CONSTRAINTS })
    } catch (error) {
      if (session.current === mine) {
        setIssue(micIssue(error))
        setStatus('idle')
      }
      return
    }
    if (session.current !== mine) {
      for (const track of media.getTracks()) track.stop()
      return
    }
    setIssue(null)
    stream.current = media
    const type = pickRecordingType((value) => MediaRecorder.isTypeSupported(value))
    let created: MediaRecorder
    try {
      created = new MediaRecorder(media, type ? { mimeType: type } : undefined)
    } catch (error) {
      releaseStream()
      setIssue(micIssue(error))
      setStatus('idle')
      return
    }
    const chunks: Blob[] = []
    created.addEventListener('dataavailable', (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    })
    created.addEventListener('stop', () => {
      const elapsed = (performance.now() - startedAt.current) / 1000
      const blob = new Blob(chunks, { type: created.mimeType || type || 'audio/webm' })
      releaseStream()
      setStatus('idle')
      setSeconds(0)
      if (!discard.current) latest.current.onRecording({ blob, seconds: elapsed })
    })
    recorder.current = created
    startedAt.current = performance.now()
    created.start(250)
    setStatus('recording')
    setSeconds(0)
    ticker.current = window.setInterval(() => {
      const elapsed = (performance.now() - startedAt.current) / 1000
      setSeconds(elapsed)
      if (elapsed >= latest.current.maxSeconds && recorder.current?.state === 'recording') {
        latest.current.onAutoStop?.()
        recorder.current.stop()
      }
    }, TICK_MS)
    if (wantStop.current) created.stop()
  }, [releaseStream, status])

  useEffect(
    () => () => {
      session.current += 1
      discard.current = true
      if (recorder.current && recorder.current.state !== 'inactive') recorder.current.stop()
      for (const track of stream.current?.getTracks() ?? []) track.stop()
      if (ticker.current !== null) window.clearInterval(ticker.current)
    },
    [],
  )

  return { status, issue, seconds, start, stop, supported: issue !== 'unsupported' }
}
