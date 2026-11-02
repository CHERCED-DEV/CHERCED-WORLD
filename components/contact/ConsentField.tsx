import Link from 'next/link'
import { FormField } from '@/components/ui/FormField'
import { VisuallyHidden } from '@/components/ui/VisuallyHidden'

export type ConsentLabels = { before: string; link: string; after: string; newTab: string }

export function ConsentField({
  labels,
  href,
  error,
  name = 'consent',
}: {
  labels: ConsentLabels
  href: string
  error?: string
  name?: string
}) {
  return (
    <FormField
      inline
      error={error}
      label={
        <>
          {labels.before}
          <Link href={href} target="_blank" rel="noopener" prefetch={false}>
            {labels.link}
            <VisuallyHidden> {labels.newTab}</VisuallyHidden>
          </Link>
          {labels.after}
        </>
      }
    >
      <input type="checkbox" name={name} value="on" required data-cw-consent="" />
    </FormField>
  )
}
