import 'server-only'

export { SCRYPT_PARAMS, SALT_BYTES, hashPassword, verifyPassword, burnPasswordCheck } from './password'
export {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  SESSION_TOKEN_BYTES,
  SESSION_TOUCH_INTERVAL_MS,
  newSessionToken,
  hashSessionToken,
  isWellFormedToken,
  startSession,
  resolveSession,
  endSession,
} from './session'
export {
  SETUP_CODE_TTL_MS,
  generateSetupCode,
  formatSetupCode,
  hashSetupCode,
  setupLogLine,
  ensureSetupCode,
  verifySetupCode,
  type SetupCodeState,
} from './setup'
export { UnauthorizedError, getAdminSession, requireAdmin, readSessionToken, signIn, signOut, endAllSessions } from './guard'
export { changePasswordSchema, loginSchema, type ChangePasswordInput } from './schemas'
