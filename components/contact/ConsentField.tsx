import Link from 'next/link'
import { FormField } from '@/components/ui/FormField'
import { VisuallyHidden } from '@/components/ui/VisuallyHidden'
import styles from './ConsentField.module.scss'

export type ConsentLabels = { text: string; readPolicy: string; newTab: string }

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
    <div className={styles.consent} data-cw-consent-field="">
      <FormField inline error={error} label={labels.text} className={styles.field}>
        <input type="checkbox" name={name} value="on" required data-cw-consent="" />
      </FormField>
      <p className={styles.policy}>
        <Link href={href} target="_blank" rel="noopener" prefetch={false} data-cw-consent-policy="">
          {labels.readPolicy}
          <VisuallyHidden> {labels.newTab}</VisuallyHidden>
        </Link>
      </p>
    </div>
  )
}
