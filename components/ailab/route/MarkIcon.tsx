import type { RouteMark } from '@/lib/ailab/route/progress'

export function MarkIcon({ mark, className }: { mark: RouteMark; className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false" data-mark={mark}>
      {mark === 'checked' ? (
        <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      ) : mark === 'failed' ? (
        <path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      ) : (
        <circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
      )}
    </svg>
  )
}
