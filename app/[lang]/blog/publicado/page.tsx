import type { Metadata, ResolvingMetadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { PostPageView, postMetadata, type ResolvedPost } from '@/components/blog/post/PostPage'
import { resolvePost } from '@/lib/blog'
import { isPublishedId, PUBLISHED_HEADER } from '@/lib/editorial/published-id'
import { isLocale } from '@/lib/i18n'

type Props = { params: Promise<{ lang: string }> }

export const dynamic = 'force-dynamic'

async function resolve(params: Props['params']): Promise<ResolvedPost | null> {
  const { lang } = await params
  if (!isLocale(lang)) return null
  const id = (await headers()).get(PUBLISHED_HEADER)
  if (!id || !isPublishedId(id)) return null
  const post = await resolvePost(id, lang)
  return post ? { lang, id, post } : null
}

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const resolved = await resolve(params)
  return resolved ? postMetadata(resolved, parent) : {}
}

export default async function PublishedPostPage({ params }: Props) {
  const resolved = await resolve(params)
  if (!resolved) notFound()
  return <PostPageView {...resolved} />
}
