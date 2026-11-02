import '@/lib/data/mongo/register'
import { notFound } from 'next/navigation'
import styles from '@/components/admin/admin.module.scss'
import { CommentList } from '@/components/admin/CommentList'
import { FilterGroup } from '@/components/admin/FilterBar'
import { adminText } from '@/components/admin/labels'
import { pickParam, queryHref } from '@/components/admin/query'
import { SessionExpired } from '@/components/admin/Views'
import { getAdminSession } from '@/lib/auth/guard'
import { postIds } from '@/lib/content'
import { getRepos } from '@/lib/data'
import { isLocale, localizedPath } from '@/lib/i18n'

type Props = {
  params: Promise<{ lang: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const VIEWS = ['pending', 'approved', 'rejected', 'all'] as const

export const dynamic = 'force-dynamic'

export default async function CommentsPage({ params, searchParams }: Props) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const text = await adminText(lang)
  if (!(await getAdminSession())) return <SessionExpired text={text} />

  const view = pickParam((await searchParams).view, VIEWS, 'pending')
  const comments = await getRepos().comments.listForModeration({ status: view })
  const base = localizedPath(lang, '/inbox/comments')
  const { tr } = text

  return (
    <section className={styles.section} aria-labelledby="comments-title">
      <h2 id="comments-title" className={styles.sectionTitle}>
        {tr('admin.comments.title')}
      </h2>
      <div className={styles.toolbar}>
        <FilterGroup
          label={tr('admin.filter.label')}
          current={view}
          options={VIEWS.map((value) => ({ value, label: tr(`admin.filter.${value}`), href: queryHref(base, { view: value }) }))}
        />
      </div>
      <CommentList comments={comments} text={text} postIds={postIds()} />
    </section>
  )
}
