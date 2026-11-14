export const FUN_STORAGE_KEY = 'cw-fun-wakes'

export const FUN_CALM_AFTER_MS = 60_000

export const FUN_POWER_AT_MS = 30_000

export const FUN_POWER_MS = 3_000

export const FUN_BYE_MS = 2_400

export const FUN_POKE_MS = 480

export const FUN_POKE_RADIUS = 200

export const FUN_ANNOUNCE_GAP_MS = 8_000

export const FUN_MAX_LEVEL = 3

export const FUN_BASE_LINES = [1, 2, 3, 4, 5, 6, 7, 8] as const

export const FUN_LEVEL_LINES = [11, 12] as const

export const FUN_HINT_LINE = 9

export const FUN_BEG_LINE = 10

export type FunPace = { lineMs: number; pokeMs: number; rate: number }

export const FUN_PACE: Readonly<Record<number, FunPace>> = {
  1: { lineMs: 7_000, pokeMs: 1_800, rate: 5 },
  2: { lineMs: 6_000, pokeMs: 1_400, rate: 6.5 },
  3: { lineMs: 5_000, pokeMs: 1_100, rate: 8 },
}

export const FUN_POWERED = { line: 0.8, poke: 0.7, rate: 1.5, minLineMs: 4_000, minPokeMs: 700 } as const

export const FUN_GUIDE_AFTER = 6

export const FUN_RUN_SPEED = 900

export const FUN_GUIDE_TAP_MS = 650

export const FUN_GUIDE_GRACE_MS = 1_200

export const FUN_GUIDE_JUMP_MS = 450

export const FUN_GUIDE_GIVE_UP_MS = 4_000

export const FUN_GUIDE_ARRIVE_MS = 8_000

export const FUN_GUIDE_CHEER_MS = 1_400

export const FUN_GUIDE_LINES = [1, 2, 3] as const

export const FUN_GUIDE_HUSH_MS = 4_500

export const FUN_ME_GO_AT = 4

export const FUN_ME_LINES = [1, 2, 3, 4, 5, 6, 7, 8] as const

export const FUN_ME_OUCH_MS = 700
