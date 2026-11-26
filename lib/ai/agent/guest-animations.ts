export const GUEST_ANIMATIONS = ['hearts', 'house', 'gavel', 'hug', 'alert', 'stare', 'frown', 'indignant', 'sparkles', 'laugh', 'desks'] as const

export type GuestAnimation = (typeof GUEST_ANIMATIONS)[number]
