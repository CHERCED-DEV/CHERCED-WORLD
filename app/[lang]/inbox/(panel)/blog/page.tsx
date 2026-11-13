import { notFound } from 'next/navigation'
import { BlogStudio } from '@/components/admin/editorial/BlogStudio'
import styles from '@/components/admin/editorial/Editorial.module.scss'
import adminStyles from '@/components/admin/admin.module.scss'
import { adminText } from '@/components/admin/labels'
import { SessionExpired } from '@/components/admin/Views'
import { editorialCopy } from '@/content/editorial'
import { getAdminSession } from '@/lib/auth/guard'
import { editorialStorage, listDrafts } from '@/lib/data/editorial'
import { blogPosts, publishedPosts } from '@/lib/blog/source'
import { summaryOf } from '@/lib/editorial/published'
import { isLocale } from '@/lib/i18n'
import { logServerError } from '@/lib/security/log'
import type { EditorialDraft } from '@/lib/editorial/model'

export const dynamic = 'force-dynamic'

export default async function BlogStudioPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  if (!(await getAdminSession())) return <SessionExpired text={await adminText(lang)} />
  const copy = editorialCopy[lang]
  const storage = editorialStorage()
  let drafts: EditorialDraft[] | null = null
  try { drafts = await listDrafts() } catch (error) { logServerError('editorial.list', error) }
  const [posts, published] = await Promise.all([blogPosts(lang), publishedPosts()])
  return <section className={adminStyles.section}>
    <header><h1 className={adminStyles.sectionTitle}>{copy.title}</h1><p>{copy.intro}</p></header>
    {drafts && storage !== 'unavailable' ? <BlogStudio lang={lang} initialDrafts={drafts} initialPublished={published.map(summaryOf)} storage={storage} /> : <p role="alert">{copy.unavailable}</p>}
    <section className={adminStyles.section} aria-labelledby="published-articles"><h2 id="published-articles">{copy.published}</h2><p className={styles.note}>{copy.existing}</p><ul className={styles.published}>{posts.map(post => <li key={post.id}><strong>{post.title}</strong><a href={`/${lang}/blog/${post.id}`} target="_blank" rel="noopener noreferrer">{copy.publicLink}<span className="cw-visually-hidden">: {post.title}</span></a></li>)}</ul></section>
  </section>
}
