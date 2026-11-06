export type MicIssue = 'denied' | 'no-mic' | 'unsupported' | 'busy' | 'error'

export type MicEnv = {
  isSecureContext?: boolean
  navigator?: { mediaDevices?: { getUserMedia?: unknown }; permissions?: { query?: unknown } }
  MediaRecorder?: unknown
}

export const RECORDING_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'] as const

export const AUDIO_CONSTRAINTS: MediaTrackConstraints = { channelCount: 1, echoCancellation: true, noiseSuppression: true }

function currentEnv(): MicEnv {
  return typeof window === 'undefined' ? {} : (window as unknown as MicEnv)
}

export function micSupported(env: MicEnv = currentEnv()): boolean {
  if (env.isSecureContext === false) return false
  if (typeof env.navigator?.mediaDevices?.getUserMedia !== 'function') return false
  return typeof env.MediaRecorder === 'function'
}

export function micIssue(error: unknown): MicIssue {
  const name = error && typeof error === 'object' && 'name' in error ? String((error as { name: unknown }).name) : ''
  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return 'denied'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
      return 'no-mic'
    case 'NotReadableError':
    case 'TrackStartError':
    case 'AbortError':
      return 'busy'
    case 'NotSupportedError':
      return 'unsupported'
    default:
      return 'error'
  }
}

export function pickRecordingType(isTypeSupported?: (type: string) => boolean): string | undefined {
  if (!isTypeSupported) return undefined
  return RECORDING_TYPES.find((type) => {
    try {
      return isTypeSupported(type)
    } catch {
      return false
    }
  })
}

export async function micPermission(env: MicEnv = currentEnv()): Promise<PermissionState | null> {
  const query = env.navigator?.permissions?.query
  if (typeof query !== 'function') return null
  try {
    const status = (await query.call(env.navigator?.permissions, { name: 'microphone' as PermissionName })) as PermissionStatus
    return status.state
  } catch {
    return null
  }
}
