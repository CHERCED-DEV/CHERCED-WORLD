import type { ProfileReason } from '@/lib/data/types'
import type { Locale } from './types'

export type AccountError = 'unconfigured' | 'expired' | 'cancelled' | 'failed' | 'blocked' | 'rate_limited'

export type ProfileFieldKey = 'country' | 'city' | 'role' | 'company' | 'linkedin' | 'github' | 'languages' | 'reason' | 'reasonNote'

export type AccountPanelCopy = {
  since: string
  lastLogin: string
  profileTitle: string
  profileIntro: string
  edit: string
  cancel: string
  save: string
  saving: string
  saved: string
  empty: string
  fields: Record<ProfileFieldKey, { label: string; purpose: string; placeholder?: string }>
  countryPlaceholder: string
  reasons: Record<ProfileReason, string>
  noReason: string
  fieldErrors: Record<'invalid' | 'tooLong' | 'tooMany' | 'required', string>
  consent: string
  consentNote: string
  consentTitle: string
  consentButton: string
  locked: string
  photoTitle: string
  photoIntro: string
  photoPick: string
  photoUseUpload: string
  photoGoogle: string
  photoNone: string
  photoSave: string
  photoPreview: string
  photoSaved: string
  photoErrors: Record<'read' | 'tooBig' | 'invalid' | 'tooLarge' | 'noGoogle' | 'noUpload', string>
  prefsTitle: string
  prefsIntro: string
  prefLang: string
  prefTheme: string
  auto: string
  langNames: Record<'es' | 'en', string>
  themeNames: Record<'dark' | 'light', string>
  prefsSave: string
  prefsSaved: string
  activityTitle: string
  commentsTitle: string
  commentsEmpty: string
  commentStatus: Record<'pending' | 'approved' | 'rejected', string>
  reply: string
  deleteComment: string
  commentDeleted: string
  postsTitle: string
  postsEmpty: string
  postStatus: Record<'draft' | 'review' | 'published', string>
  consentsTitle: string
  consentsIntro: string
  consentNames: Record<'signIn' | 'profile' | 'comments', string>
  consentVersion: string
  consentCount: string
  consentNone: string
  withdraw: string
  withdrawText: string
  withdrawConfirm: string
  withdrawn: string
  dataTitle: string
  dataIntro: string
  download: string
  actionErrors: Record<'validation' | 'rate_limited' | 'unavailable' | 'unauthorized' | 'not_found' | 'consent_required', string>
}

export type AccountCopy = {
  metaTitle: string
  signIn: string
  myAccount: string
  title: string
  intro: string
  benefits: string[]
  google: string
  off: string
  localTitle: string
  localNote: string
  localName: string
  localEmail: string
  localSubmit: string
  ownerLink: string
  privacy: string
  privacyLink: string
  signedInTitle: string
  email: string
  permissions: string
  noPermissions: string
  permissionNames: Record<'posts' | 'messages' | 'comments', string>
  panel: string
  signOut: string
  deleteSummary: string
  deleteText: string
  deleteConfirm: string
  deleted: string
  ownerTitle: string
  ownerText: string
  errors: Record<AccountError, string>
  commentAs: string
  commentSignIn: string
  dashboard: AccountPanelCopy
}

export const accountCopy: Record<Locale, AccountCopy> = {
  es: {
    metaTitle: 'Mi cuenta',
    signIn: 'Ingresar',
    myAccount: 'Mi cuenta',
    title: 'Ingresar',
    intro: 'Entra con tu cuenta de Google. No hace falta crear otra contraseña.',
    benefits: [
      'Comentas en el blog sin escribir tu nombre ni tu correo.',
      'Si te invité al equipo, desde aquí entras al panel.',
    ],
    google: 'Continuar con Google',
    off: 'El ingreso con Google todavía no está activo. Vuelve pronto.',
    localTitle: 'Simulador de Google · solo local',
    localNote: 'En tu máquina no hay credenciales de Google, así que aquí simulas la cuenta con la que entrarías.',
    localName: 'Nombre',
    localEmail: 'Correo de Gmail',
    localSubmit: 'Entrar como esta cuenta',
    ownerLink: '¿Eres el autor? Entra con tu contraseña',
    privacy: 'Guardo tu nombre, tu correo, el enlace a tu foto de Google y las fechas en que ingresas. Lo explico en la',
    privacyLink: 'política de privacidad',
    signedInTitle: 'Estás dentro',
    email: 'Correo',
    permissions: 'Permisos en el panel',
    noPermissions: 'Ninguno. Puedes comentar en el blog con tu cuenta.',
    permissionNames: { posts: 'Escribir posts', messages: 'Leer mensajes', comments: 'Moderar comentarios' },
    panel: 'Ir al panel',
    signOut: 'Cerrar sesión',
    deleteSummary: 'Borrar mi cuenta',
    deleteText:
      'Se borran tu cuenta, tus sesiones, tu perfil, tu foto, tus comentarios y tus borradores. Los posts invitados que ya publiqué siguen firmados con tu nombre; para retirarlos, escríbeme. No se puede deshacer.',
    deleteConfirm: 'Sí, borrar mi cuenta',
    deleted: 'Tu cuenta, tu perfil y tus comentarios se borraron.',
    ownerTitle: 'Estás dentro como autor',
    ownerText: 'Tienes la sesión del panel abierta con tu contraseña.',
    errors: {
      unconfigured: 'El ingreso con Google todavía no está activo.',
      expired: 'El ingreso tardó demasiado o se interrumpió. Intenta de nuevo.',
      cancelled: 'Cancelaste el ingreso con Google.',
      failed: 'No se pudo completar el ingreso. Intenta de nuevo.',
      blocked: 'Esta cuenta está bloqueada.',
      rate_limited: 'Demasiados intentos. Espera unos minutos.',
    },
    commentAs: 'Comentas como {name}, con tu cuenta de Google.',
    commentSignIn: 'Ingresa con Google para no escribir tus datos',
    dashboard: {
      since: 'En el sitio desde',
      lastLogin: 'Último ingreso',
      profileTitle: 'Tu perfil',
      profileIntro: 'Todo es opcional y solo lo vemos tú y yo. Cada dato dice para qué lo uso.',
      edit: 'Editar perfil',
      cancel: 'Cancelar',
      save: 'Guardar perfil',
      saving: 'Guardando…',
      saved: 'Perfil guardado.',
      empty: 'Sin completar',
      fields: {
        country: { label: 'País', purpose: 'Para saber desde dónde me leen: el idioma, el horario de una llamada y lo que escribo.' },
        city: { label: 'Ciudad', purpose: 'Lo mismo, con más detalle si quieres darlo.' },
        role: { label: 'Rol o profesión', purpose: 'Para saber si me lee un reclutador, un líder técnico o un colega.' },
        company: { label: 'Empresa', purpose: 'Para saber para quién trabajas si me escribes por una vacante o un servicio.' },
        linkedin: { label: 'LinkedIn', purpose: 'Para conocerte antes de responderte.', placeholder: 'linkedin.com/in/tu-perfil' },
        github: { label: 'GitHub', purpose: 'Lo mismo, si eres de código.', placeholder: 'tu-usuario' },
        languages: { label: 'Idiomas', purpose: 'Para saber en qué idioma hablarte. Hasta 6.' },
        reason: { label: 'Qué te trae al sitio', purpose: 'Para saber qué buscas y mejorar lo que te muestro.' },
        reasonNote: { label: 'Cuéntame más', purpose: 'Opcional, hasta 280 caracteres.' },
      },
      countryPlaceholder: 'Sin elegir',
      reasons: {
        hiring: 'Busco talento',
        services: 'Quiero contratar un servicio',
        learning: 'Quiero aprender',
        collaborate: 'Quiero colaborar',
        curious: 'Solo curiosidad',
        other: 'Otro',
      },
      noReason: 'Sin elegir',
      fieldErrors: {
        invalid: 'Revisa este dato.',
        tooLong: 'Es demasiado largo.',
        tooMany: 'Elige hasta 6.',
        required: 'Marca la casilla para poder guardar.',
      },
      consent:
        'Autorizo a Camilo Hernández a guardar estos datos para lo que dice cada campo. Puedo verlos, corregirlos, descargarlos y borrarlos aquí cuando quiera.',
      consentNote: 'Ley 1581 de 2012. Nada de esto es obligatorio ni sale en páginas públicas.',
      consentTitle: 'Antes de guardar tu perfil',
      consentButton: 'Autorizar',
      locked: 'Para guardar, primero autoriza arriba.',
      photoTitle: 'Tu foto',
      photoIntro:
        'Opcional. Tu navegador la recorta a 256 px y le quita los metadatos, como la ubicación, antes de enviarla. Nunca sale en páginas públicas.',
      photoPick: 'Subir una foto',
      photoUseUpload: 'Usar la que subí',
      photoGoogle: 'Usar la de Google',
      photoNone: 'Sin foto',
      photoSave: 'Guardar foto',
      photoPreview: 'Así se verá',
      photoSaved: 'Foto guardada.',
      photoErrors: {
        read: 'No pude leer esa imagen. Prueba con JPG o PNG.',
        tooBig: 'La imagen pesa más de 15 MB.',
        invalid: 'Esa imagen no sirve. Prueba con otra.',
        tooLarge: 'La foto quedó demasiado pesada. Prueba con otra.',
        noGoogle: 'Tu cuenta de Google no tiene foto.',
        noUpload: 'Primero sube una foto.',
      },
      prefsTitle: 'Preferencias',
      prefsIntro: 'Se aplican cuando las guardas y cuando abres Mi cuenta en otro dispositivo.',
      prefLang: 'Idioma del sitio',
      prefTheme: 'Tema',
      auto: 'Automático',
      langNames: { es: 'Español', en: 'English' },
      themeNames: { dark: 'Oscuro', light: 'Claro' },
      prefsSave: 'Guardar preferencias',
      prefsSaved: 'Preferencias guardadas.',
      activityTitle: 'Tu actividad',
      commentsTitle: 'Comentarios',
      commentsEmpty: 'Aún no has comentado con tu cuenta.',
      commentStatus: { pending: 'En revisión', approved: 'Publicado', rejected: 'Rechazado' },
      reply: 'Respuesta del autor',
      deleteComment: 'Borrar este comentario',
      commentDeleted: 'Comentario borrado.',
      postsTitle: 'Posts invitados',
      postsEmpty: 'Aún no tienes borradores.',
      postStatus: { draft: 'Borrador', review: 'En revisión', published: 'Publicado' },
      consentsTitle: 'Tus autorizaciones',
      consentsIntro: 'Lo que aceptaste y cuándo.',
      consentNames: { signIn: 'Ingreso con Google', profile: 'Tu perfil y tu foto', comments: 'Comentarios del blog' },
      consentVersion: 'Aviso del {version}',
      consentCount: '{count} autorizados, el último el {date}',
      consentNone: 'Aún no has guardado tu perfil.',
      withdraw: 'Retirar autorización',
      withdrawText: 'Se borran tu perfil, tu foto y tus preferencias. Tu cuenta y tus comentarios siguen.',
      withdrawConfirm: 'Sí, retirar y borrar mi perfil',
      withdrawn: 'Retiraste la autorización. Tu perfil y tu foto se borraron.',
      dataTitle: 'Tus datos',
      dataIntro: 'Descarga todo lo que el sitio guarda de ti, o bórralo.',
      download: 'Descargar mis datos (JSON)',
      actionErrors: {
        validation: 'Revisa los datos marcados.',
        rate_limited: 'Demasiados cambios seguidos. Espera unos minutos.',
        unavailable: 'No se pudo guardar. Intenta de nuevo.',
        unauthorized: 'Tu sesión venció. Vuelve a ingresar.',
        not_found: 'Eso ya no existe.',
        consent_required: 'Marca la casilla de autorización para guardar.',
      },
    },
  },
  en: {
    metaTitle: 'My account',
    signIn: 'Sign in',
    myAccount: 'My account',
    title: 'Sign in',
    intro: 'Sign in with your Google account. No new password needed.',
    benefits: [
      'Comment on the blog without typing your name or email.',
      'If I invited you to the team, this is where you get into the panel.',
    ],
    google: 'Continue with Google',
    off: "Google sign-in isn't active yet. Check back soon.",
    localTitle: 'Google simulator · local only',
    localNote: "There are no Google credentials on this machine, so here you simulate the account you'd sign in with.",
    localName: 'Name',
    localEmail: 'Gmail address',
    localSubmit: 'Sign in as this account',
    ownerLink: 'Are you the author? Sign in with your password',
    privacy: 'I keep your name, your email, the link to your Google photo and the dates you sign in. It is explained in the',
    privacyLink: 'privacy policy',
    signedInTitle: "You're signed in",
    email: 'Email',
    permissions: 'Panel permissions',
    noPermissions: 'None. You can comment on the blog with your account.',
    permissionNames: { posts: 'Write posts', messages: 'Read messages', comments: 'Moderate comments' },
    panel: 'Go to the panel',
    signOut: 'Sign out',
    deleteSummary: 'Delete my account',
    deleteText:
      'Your account, sessions, profile, photo, comments and drafts are deleted. Guest posts I already published stay signed with your name; to take them down, write to me. This cannot be undone.',
    deleteConfirm: 'Yes, delete my account',
    deleted: 'Your account, your profile and your comments were deleted.',
    ownerTitle: "You're signed in as the author",
    ownerText: 'Your panel session is open with your password.',
    errors: {
      unconfigured: "Google sign-in isn't active yet.",
      expired: 'Sign-in took too long or was interrupted. Try again.',
      cancelled: 'You cancelled the Google sign-in.',
      failed: "Sign-in couldn't be completed. Try again.",
      blocked: 'This account is blocked.',
      rate_limited: 'Too many attempts. Wait a few minutes.',
    },
    commentAs: "You're commenting as {name}, with your Google account.",
    commentSignIn: 'Sign in with Google so you don’t have to type your details',
    dashboard: {
      since: 'On the site since',
      lastLogin: 'Last sign-in',
      profileTitle: 'Your profile',
      profileIntro: 'Everything is optional and only you and I see it. Each field says what I use it for.',
      edit: 'Edit profile',
      cancel: 'Cancel',
      save: 'Save profile',
      saving: 'Saving…',
      saved: 'Profile saved.',
      empty: 'Not filled in',
      fields: {
        country: { label: 'Country', purpose: 'To know where my readers are: the language, the time of a call and what I write about.' },
        city: { label: 'City', purpose: 'The same, in more detail if you want to share it.' },
        role: { label: 'Role or profession', purpose: 'To know whether a recruiter, a tech lead or a peer is reading.' },
        company: { label: 'Company', purpose: 'To know who you work for if you write about a role or a service.' },
        linkedin: { label: 'LinkedIn', purpose: 'To get to know you before I reply.', placeholder: 'linkedin.com/in/your-profile' },
        github: { label: 'GitHub', purpose: 'The same, if you write code.', placeholder: 'your-username' },
        languages: { label: 'Languages', purpose: 'To know which language to use with you. Up to 6.' },
        reason: { label: 'What brings you here', purpose: 'To know what you are looking for and improve what I show you.' },
        reasonNote: { label: 'Tell me more', purpose: 'Optional, up to 280 characters.' },
      },
      countryPlaceholder: 'Not chosen',
      reasons: {
        hiring: "I'm hiring",
        services: 'I want to hire a service',
        learning: 'I want to learn',
        collaborate: 'I want to collaborate',
        curious: 'Just curious',
        other: 'Something else',
      },
      noReason: 'Not chosen',
      fieldErrors: {
        invalid: 'Check this field.',
        tooLong: 'It is too long.',
        tooMany: 'Choose up to 6.',
        required: 'Tick the box to save.',
      },
      consent:
        'I authorize Camilo Hernández to store this data for what each field says. I can see, correct, download and delete it here whenever I want.',
      consentNote: 'Colombian Law 1581 of 2012. None of this is required, and none of it appears on public pages.',
      consentTitle: 'Before you save your profile',
      consentButton: 'Authorize',
      locked: 'To save, authorize above first.',
      photoTitle: 'Your photo',
      photoIntro:
        'Optional. Your browser crops it to 256 px and strips its metadata, such as location, before sending it. It never appears on public pages.',
      photoPick: 'Upload a photo',
      photoUseUpload: 'Use the one I uploaded',
      photoGoogle: 'Use my Google photo',
      photoNone: 'No photo',
      photoSave: 'Save photo',
      photoPreview: 'This is how it will look',
      photoSaved: 'Photo saved.',
      photoErrors: {
        read: "I couldn't read that image. Try a JPG or PNG.",
        tooBig: 'The image is larger than 15 MB.',
        invalid: "That image doesn't work. Try another one.",
        tooLarge: 'The photo came out too heavy. Try another one.',
        noGoogle: 'Your Google account has no photo.',
        noUpload: 'Upload a photo first.',
      },
      prefsTitle: 'Preferences',
      prefsIntro: 'They apply when you save them and when you open My account on another device.',
      prefLang: 'Site language',
      prefTheme: 'Theme',
      auto: 'Automatic',
      langNames: { es: 'Español', en: 'English' },
      themeNames: { dark: 'Dark', light: 'Light' },
      prefsSave: 'Save preferences',
      prefsSaved: 'Preferences saved.',
      activityTitle: 'Your activity',
      commentsTitle: 'Comments',
      commentsEmpty: "You haven't commented with your account yet.",
      commentStatus: { pending: 'In review', approved: 'Published', rejected: 'Rejected' },
      reply: "Author's reply",
      deleteComment: 'Delete this comment',
      commentDeleted: 'Comment deleted.',
      postsTitle: 'Guest posts',
      postsEmpty: "You don't have drafts yet.",
      postStatus: { draft: 'Draft', review: 'In review', published: 'Published' },
      consentsTitle: 'Your authorizations',
      consentsIntro: 'What you accepted and when.',
      consentNames: { signIn: 'Google sign-in', profile: 'Your profile and photo', comments: 'Blog comments' },
      consentVersion: 'Notice of {version}',
      consentCount: '{count} authorized, the last one on {date}',
      consentNone: "You haven't saved your profile yet.",
      withdraw: 'Withdraw authorization',
      withdrawText: 'Your profile, photo and preferences are deleted. Your account and comments stay.',
      withdrawConfirm: 'Yes, withdraw and delete my profile',
      withdrawn: 'You withdrew your authorization. Your profile and photo were deleted.',
      dataTitle: 'Your data',
      dataIntro: 'Download everything the site keeps about you, or delete it.',
      download: 'Download my data (JSON)',
      actionErrors: {
        validation: 'Check the highlighted fields.',
        rate_limited: 'Too many changes in a row. Wait a few minutes.',
        unavailable: "It couldn't be saved. Try again.",
        unauthorized: 'Your session expired. Sign in again.',
        not_found: 'That no longer exists.',
        consent_required: 'Tick the authorization box to save.',
      },
    },
  },
}

export function isAccountError(value: unknown): value is AccountError {
  return typeof value === 'string' && ['unconfigured', 'expired', 'cancelled', 'failed', 'blocked', 'rate_limited'].includes(value)
}
