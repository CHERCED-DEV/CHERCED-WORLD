export const OPEN_MINI_CHERCED = 'cw:open-mini-cherced'

export const HEARD_EVENT = 'cw:mini-cherced-heard'

export const POKE_EVENT = 'cw:mini-cherced-poke'

export type AgentRequest = { id: number; text: string }

export function openMiniCherced(): void {
  window.dispatchEvent(new CustomEvent(OPEN_MINI_CHERCED))
}

export function askMiniCherced(text: string): void {
  window.dispatchEvent(new CustomEvent(OPEN_MINI_CHERCED, { detail: { ask: text } }))
}
