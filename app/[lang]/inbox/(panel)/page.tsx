import '@/lib/data/mongo/register'
import { notFound } from 'next/navigation'
import styles from '@/components/admin/admin.module.scss'
import { FilterGroup } from '@/components/admin/FilterBar'
import { adminText } from '@/components/admin/labels'
import { pickParam, queryHref } from '@/components/admin/query'
import { MessageList } from '@/components/admin/MessageList'
import { SessionExpired } from '@/components/admin/Views'
import { guardPanel } from '@/components/admin/gate'
import { getRepos } from '@/lib/data'
import type { MessageSort } from '@/lib/data/types'
import { isLocale, localizedPath } from '@/lib/i18n'

type Props = {
  params: Promise<{ lang: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const VIEWS = ['inbox', 'unread', 'archived', 'all'] as const
const SORTS = ['newest', 'oldest', 'name'] as const satisfies readonly MessageSort[]

export const dynamic = 'force-dynamic'

export default async function MessagesPage({ params, searchParams }: Props) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const text = await adminText(lang)
  const actor = await guardPanel(lang, 'messages')
  if (!actor) return <SessionExpired text={text} />

  const query = await searchParams
  const view = pickParam(query.view, VIEWS, 'inbox')
  const sort = pickParam(query.sort, SORTS, 'newest')
  const status = view === 'unread' || view === 'archived' ? view : 'all'
  const all = await getRepos().messages.list({ status, sort })
  const messages = view === 'inbox' ? all.filter((message) => message.status !== 'archived') : all
  const base = localizedPath(lang, '/inbox')
  const { tr } = text

  return (
    <section className={styles.section} aria-labelledby="messages-title">
      <h2 id="messages-title" className={styles.sectionTitle}>
        {tr('admin.messages.title')}
      </h2>
      <div className={styles.toolbar}>
        <FilterGroup
          label={tr('admin.filter.label')}
          current={view}
          options={VIEWS.map((value) => ({ value, label: tr(`admin.filter.${value}`), href: queryHref(base, { view: value, sort }) }))}
        />
        <FilterGroup
          label={tr('admin.sort.label')}
          current={sort}
          options={SORTS.map((value) => ({ value, label: tr(`admin.sort.${value}`), href: queryHref(base, { view, sort: value }) }))}
        />
      </div>
      <MessageList messages={messages} text={text} />
    </section>
  )
}
