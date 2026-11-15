export const OPEN_MINI_CHERCED = 'cw:open-mini-cherced'

export function openMiniCherced(): void {
  window.dispatchEvent(new CustomEvent(OPEN_MINI_CHERCED))
}
