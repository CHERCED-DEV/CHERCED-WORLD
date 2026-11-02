import { formatDateTime, type AdminText } from './labels'

export function ConsentDetail({ consentAt, text }: { consentAt: Date | null; text: AdminText }) {
  return (
    <>
      <dt>{text.tr('admin.field.consent')}</dt>
      <dd data-cw-consent-at={consentAt ? consentAt.toISOString() : 'legacy'}>
        {consentAt ? (
          <time dateTime={consentAt.toISOString()}>{formatDateTime(consentAt, text.lang)}</time>
        ) : (
          text.tr('admin.consent.legacy')
        )}
      </dd>
    </>
  )
}
