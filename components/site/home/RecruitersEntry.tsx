import type { RecruitersContent } from '@/content/types'
import { Certifications } from '@/components/site/about/Certifications'
import { sharedText } from '@/components/ui/sharedText'
import { getSite } from '@/lib/content'
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

function RecruiterCertifications({ lang, headingId }: { lang: Locale; headingId: string }) {
  const { about } = getSite()
  return (
    <Certifications
      lang={lang}
      plain
      headingId={headingId}
      items={about.certifications ?? []}
      profileHref={about.courses.platzi.href}
      labels={{
        title: sharedText(lang, 'common', 'certifications.title'),
        profile: sharedText(lang, 'common', 'certifications.profile'),
        newTab: sharedText(lang, 'common', 'certifications.newTab'),
      }}
    />
  )
}

export function RecruitersEntry({ lang, content, writeHref, withCv = true, className }: RecruitersEntryProps) {
  return (
    <RecruitersDialog
      label={content.title[lang]}
      closeLabel={sharedText(lang, 'common', 'dialog.close')}
      labelledBy={`${RECRUITERS_ID}-title`}
      className={className}
    >
      <RecruitersBlock
        lang={lang}
        content={content}
        writeHref={writeHref}
        withCv={withCv}
        certifications={<RecruiterCertifications lang={lang} headingId={`${RECRUITERS_ID}-certifications`} />}
        bare
      />
    </RecruitersDialog>
  )
}

export function RecruitersFallback({ lang, content, writeHref, withCv = true, compact = false }: RecruitersEntryProps & { compact?: boolean }) {
  const id = `${RECRUITERS_ID}-static`
  return (
    <noscript>
      <RecruitersBlock
        lang={lang}
        content={content}
        writeHref={writeHref}
        withCv={withCv}
        compact={compact}
        id={id}
        certifications={<RecruiterCertifications lang={lang} headingId={`${id}-certifications`} />}
      />
    </noscript>
  )
}
