import type { RecruitersContent } from '@/content/types'
import { sharedText } from '@/components/ui/sharedText'
import type { Locale } from '@/lib/i18n'
import { RECRUITERS_ID, RecruitersBlock } from './RecruitersBlock'
import { RecruitersDialog } from './RecruitersDialog'

export type RecruitersEntryProps = {
  lang: Locale
  content: RecruitersContent
  writeHref: string
  withCv?: boolean
  className?: string
}

export function RecruitersEntry({ lang, content, writeHref, withCv = true, className }: RecruitersEntryProps) {
  return (
    <RecruitersDialog
      label={content.title[lang]}
      closeLabel={sharedText(lang, 'common', 'dialog.close')}
      labelledBy={`${RECRUITERS_ID}-title`}
      className={className}
    >
      <RecruitersBlock lang={lang} content={content} writeHref={writeHref} withCv={withCv} bare />
    </RecruitersDialog>
  )
}

export function RecruitersFallback({ lang, content, writeHref, withCv = true, compact = false }: RecruitersEntryProps & { compact?: boolean }) {
  return (
    <noscript>
      <RecruitersBlock lang={lang} content={content} writeHref={writeHref} withCv={withCv} compact={compact} id={`${RECRUITERS_ID}-static`} />
    </noscript>
  )
}
