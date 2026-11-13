import type { Metadata, ResolvingMetadata } from 'next'
import { notFound } from 'next/navigation'
import { PostPageView, postMetadata } from '@/components/blog/post/PostPage'
import { resolvePost } from '@/lib/blog'
import { postIds } from '@/lib/content'
import { isLocale } from '@/lib/i18n'

type Props = { params: Promise<{ lang: string; id: string }> }

export const revalidate = 3600

export const dynamicParams = false

export function generateStaticParams() {
  return postIds().map((id) => ({ id }))
}

async function resolve(params: Props['params']) {
  const { lang, id } = await params
  if (!isLocale(lang)) return null
  const post = await resolvePost(id, lang)
  return post ? { lang, id, post } : null
}

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const resolved = await resolve(params)
  return resolved ? postMetadata(resolved, parent) : {}
}

export default async function PostPage({ params }: Props) {
  const resolved = await resolve(params)
  if (!resolved) notFound()
  return <PostPageView {...resolved} />
}
