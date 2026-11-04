import type { ComponentType, JSX, ReactNode } from 'react'
import type * as Experience from '@/components/experience'
import type * as Motion from '@/components/motion'
import type * as Ui from '@/components/ui'
import type * as Content from '@/lib/content'
import type * as Admin from '@/lib/actions/admin'
import type * as Auth from '@/lib/actions/auth'
import type * as Comments from '@/lib/actions/comments'
import type * as Contact from '@/lib/actions/contact'
import type { ActionResult } from '@/lib/actions/result'
import type * as Data from '@/lib/data'
import type { CommentStatus, MessageStatus, PublicComment, Repos } from '@/lib/data/types'
import type * as Events from '@/lib/events'
import type * as I18n from '@/lib/i18n'
import type * as I18nServer from '@/lib/i18n/server'
import type * as Validation from '@/lib/validation'
import type { CapsuleEntry, Locale, Localized, PostMeta, Project, SiteContent } from '@/content/types'

type Expect<T extends true> = T
type Is<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false
type Fits<A, B> = [A] extends [B] ? true : false

type RenderResult = JSX.Element | null | Promise<JSX.Element | null>
type FormAction = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>

export type _MotionContract = [
  Expect<Fits<typeof Motion.Background, () => RenderResult>>,
  Expect<Fits<typeof Motion.Intro, (props: { name: string; role: string; skipLabel: string }) => RenderResult>>,
  Expect<Fits<typeof Motion.BackgroundIntensity, (props: { value: 'full' | 'subtle' }) => null>>,
  Expect<Fits<typeof Motion.AtomLoader, (props: { label: string }) => RenderResult>>,
  Expect<Fits<typeof Motion.DotsLoader, (props: { label: string }) => RenderResult>>,
]

export type _ExperienceContract = Expect<Fits<typeof Experience.ExperienceRoot, (props: { lang: Locale }) => RenderResult>>

export type _UiContract = [
  Expect<Fits<typeof Ui.useToast, () => { success: (message: string) => void; error: (message: string) => void }>>,
  Expect<Fits<Parameters<typeof Ui.Dialog>[0], { open: boolean; onClose: () => void; labelledBy: string; children: ReactNode }>>,
  Expect<Is<Ui.GlassVariant, 'subtle' | 'standard' | 'strong'>>,
  Expect<Is<Ui.ButtonVariant, 'glass' | 'solid' | 'ghost'>>,
]

export type _ActionsContract = [
  Expect<Fits<typeof Contact.submitContact, FormAction>>,
  Expect<Fits<typeof Comments.submitComment, FormAction>>,
  Expect<Fits<typeof Comments.getApprovedComments, (postId: string) => Promise<PublicComment[]>>>,
  Expect<Fits<typeof Auth.login, FormAction>>,
  Expect<Fits<typeof Auth.logout, FormAction>>,
  Expect<Fits<typeof Auth.completeSetup, FormAction>>,
  Expect<Fits<typeof Auth.changePassword, FormAction>>,
  Expect<Fits<typeof Admin.setMessageStatus, (id: string, status: MessageStatus) => Promise<ActionResult>>>,
  Expect<Fits<typeof Admin.deleteMessage, (id: string) => Promise<ActionResult>>>,
  Expect<Fits<typeof Admin.setCommentStatus, (id: string, status: CommentStatus) => Promise<ActionResult>>>,
  Expect<Fits<typeof Admin.setCommentReply, (id: string, text: string | null) => Promise<ActionResult>>>,
  Expect<Fits<typeof Admin.deleteComment, (id: string) => Promise<ActionResult>>>,
  Expect<
    Is<
      ActionResult,
      | { ok: true; data: void }
      | {
          ok: false
          error: 'validation' | 'rate_limited' | 'unavailable' | 'unauthorized' | 'not_found' | 'consent_required'
          fieldErrors?: Record<string, string>
          retryAfterMs?: number
        }
    >
  >,
]

export type _DataContract = [
  Expect<Fits<typeof Data.getRepos, () => Repos>>,
  Expect<Fits<typeof Data.registerRepoFactory, (factory: () => Repos) => void>>,
  Expect<Is<keyof PublicComment, 'id' | 'userName' | 'comment' | 'createdAt' | 'authorReply'>>,
]

export type _I18nContract = [
  Expect<Is<I18n.Locale, 'es' | 'en'>>,
  Expect<Is<Locale, I18n.Locale>>,
  Expect<Is<I18n.Namespace, 'common' | 'site' | 'motion' | 'contact' | 'admin' | 'privacy' | 'blog' | 'experience' | 'home' | 'portfolio'>>,
  Expect<Fits<typeof I18nServer.getDictionary, (lang: Locale, ns: I18n.Namespace) => Promise<Record<string, string>>>>,
  Expect<Fits<typeof I18n.t, (dict: Record<string, string>, key: string, vars?: Record<string, string | number>) => string>>,
  Expect<Fits<typeof I18n.localizedPath, (lang: Locale, path: string) => string>>,
  Expect<Fits<typeof I18n.switchLocalePath, (pathname: string, to: Locale) => string>>,
  Expect<
    Fits<
      typeof I18n.alternates,
      (path: string) => { canonical: string; languages: Record<Locale | 'x-default', string> }
    >
  >,
]

export type _ContentContract = [
  Expect<Fits<typeof Content.getSite, () => SiteContent>>,
  Expect<Fits<typeof Content.getProjects, () => Project[]>>,
  Expect<Fits<typeof Content.getProject, (id: string) => Project | null>>,
  Expect<Fits<typeof Content.getAllTechnologies, () => string[]>>,
  Expect<Fits<typeof Content.getCapsule, () => CapsuleEntry[]>>,
  Expect<Fits<typeof Content.postIds, () => string[]>>,
  Expect<Fits<typeof Content.listPosts, (lang: Locale) => Promise<(PostMeta & { fallback: boolean })[]>>>,
  Expect<
    Fits<
      typeof Content.loadPost,
      (id: string, lang: Locale) => Promise<{ Content: ComponentType; meta: PostMeta; fallback: boolean } | null>
    >
  >,
  Expect<Fits<typeof Content.pick<string>, (value: Localized<string>, lang: Locale) => string>>,
]

export type _EventsContract = [
  Expect<Is<Events.CwEventName, 'cw:open-palette' | 'cw:open-assistant' | 'cw:theme-change'>>,
  Expect<Is<Events.CwEventMap['cw:theme-change'], 'dark' | 'light'>>,
  Expect<Fits<typeof Events.on, (name: 'cw:theme-change', handler: (detail: 'dark' | 'light') => void) => () => void>>,
]

export type _ValidationContract = [
  Expect<Fits<keyof Validation.ContactInput, 'name' | 'email' | 'phone' | 'message' | 'consent'>>,
  Expect<Fits<keyof Validation.CommentInput, 'postId' | 'userName' | 'email' | 'comment' | 'consent'>>,
  Expect<Is<Validation.ContactInput['phone'], string | null>>,
]
