import { buttonClassName } from '@/components/ui/Button'
import { GlassSurface } from '@/components/ui/GlassSurface'
import { deleteMessage, setMessageStatus } from '@/lib/actions/admin'
import type { MessageRecord } from '@/lib/data/types'
import styles from './admin.module.scss'
import { ActionButton, ConfirmButton } from './ActionButton'
import { ConsentDetail } from './ConsentDetail'
import { confirmLabels, formatDateTime, resultLabels, type AdminText } from './labels'
import { mailtoHref } from './mailto'

function MessageItem({ message, text }: { message: MessageRecord; text: AdminText }) {
  const { tr, lang } = text
  const results = resultLabels(text)
  const phone = message.phone === null || message.phone === '' ? null : String(message.phone)

  return (
    <li>
      <GlassSurface as="article" variant="subtle" className={styles.item} data-cw-message={message.id} data-status={message.status}>
        <header className={styles.itemHeader}>
          <h3 className={styles.itemTitle}>{message.name}</h3>
          <span className={styles.badge}>{tr(`admin.status.${message.status}`)}</span>
        </header>
        <dl className={styles.details}>
          <dt>{tr('admin.field.email')}</dt>
          <dd>{message.email}</dd>
          <dt>{tr('admin.field.phone')}</dt>
          <dd>{phone ?? tr('admin.field.noPhone')}</dd>
          <dt>{tr('admin.field.date')}</dt>
          <dd>
            <time dateTime={message.createdAt.toISOString()}>{formatDateTime(message.createdAt, lang)}</time>
          </dd>
          <ConsentDetail consentAt={message.consentAt} text={text} />
        </dl>
        <p className={styles.body}>{message.message}</p>
        <div className={styles.actions}>
          <a href={mailtoHref(message.email, tr('admin.reply.subject'))} className={buttonClassName({ variant: 'solid', size: 'sm' })} data-cw-reply="">
            {tr('admin.reply')}
          </a>
          {message.status === 'unread' ? (
            <ActionButton action={setMessageStatus.bind(null, message.id, 'read')} label={tr('admin.action.markRead')} results={results} name="read" />
          ) : null}
          {message.status === 'read' ? (
            <ActionButton action={setMessageStatus.bind(null, message.id, 'unread')} label={tr('admin.action.markUnread')} results={results} name="unread" />
          ) : null}
          {message.status === 'archived' ? (
            <ActionButton action={setMessageStatus.bind(null, message.id, 'read')} label={tr('admin.action.unarchive')} results={results} name="unarchive" />
          ) : (
            <ActionButton action={setMessageStatus.bind(null, message.id, 'archived')} label={tr('admin.action.archive')} results={results} name="archive" />
          )}
          <ConfirmButton
            action={deleteMessage.bind(null, message.id)}
            label={tr('admin.action.delete')}
            results={results}
            confirm={confirmLabels(text, 'message')}
            name="delete"
          />
        </div>
      </GlassSurface>
    </li>
  )
}

export function MessageList({ messages, text }: { messages: MessageRecord[]; text: AdminText }) {
  if (messages.length === 0) {
    return <p className={styles.empty}>{text.tr('admin.messages.empty')}</p>
  }
  return (
    <ul className={styles.list} data-cw-messages="">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} text={text} />
      ))}
    </ul>
  )
}
