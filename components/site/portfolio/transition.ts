export const PROJECT_MEDIA_PREFIX = 'project-media-'

export function projectMediaName(id: string): string {
  return `${PROJECT_MEDIA_PREFIX}${id.replace(/[^A-Za-z0-9_-]/g, '-')}`
}

type ClickLike = { button: number; altKey: boolean; ctrlKey: boolean; metaKey: boolean; shiftKey: boolean; defaultPrevented: boolean }

let pendingShare: string | null = null

export function isPlainClick(event: ClickLike): boolean {
  return event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.defaultPrevented
}

export function markSharedNavigation(name: string): void {
  pendingShare = name
}

export function takeSharedNavigation(name: string): boolean {
  const hit = pendingShare === name
  pendingShare = null
  return hit
}
