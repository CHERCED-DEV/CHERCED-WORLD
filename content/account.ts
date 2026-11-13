import type { Locale } from './types'

export type AccountError = 'unconfigured' | 'expired' | 'cancelled' | 'failed' | 'blocked' | 'rate_limited'

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
    privacy: 'Guardo solo tu nombre, tu correo y las fechas en que ingresas. Lo explico en la',
    privacyLink: 'política de privacidad',
    signedInTitle: 'Estás dentro',
    email: 'Correo',
    permissions: 'Permisos en el panel',
    noPermissions: 'Ninguno. Puedes comentar en el blog con tu cuenta.',
    permissionNames: { posts: 'Escribir posts', messages: 'Leer mensajes', comments: 'Moderar comentarios' },
    panel: 'Ir al panel',
    signOut: 'Cerrar sesión',
    deleteSummary: 'Borrar mi cuenta',
    deleteText: 'Se borran tu cuenta, tus sesiones y tus comentarios. No se puede deshacer.',
    deleteConfirm: 'Sí, borrar mi cuenta',
    deleted: 'Tu cuenta y tus comentarios se borraron.',
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
    privacy: 'I only keep your name, your email and the dates you sign in. It is explained in the',
    privacyLink: 'privacy policy',
    signedInTitle: "You're signed in",
    email: 'Email',
    permissions: 'Panel permissions',
    noPermissions: 'None. You can comment on the blog with your account.',
    permissionNames: { posts: 'Write posts', messages: 'Read messages', comments: 'Moderate comments' },
    panel: 'Go to the panel',
    signOut: 'Sign out',
    deleteSummary: 'Delete my account',
    deleteText: 'Your account, your sessions and your comments are deleted. This cannot be undone.',
    deleteConfirm: 'Yes, delete my account',
    deleted: 'Your account and your comments were deleted.',
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
  },
}

export function isAccountError(value: unknown): value is AccountError {
  return typeof value === 'string' && ['unconfigured', 'expired', 'cancelled', 'failed', 'blocked', 'rate_limited'].includes(value)
}
