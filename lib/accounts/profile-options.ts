export const PROFILE_CONSENT_VERSION = '2026-11-14'

export const AVATAR_SIZE = 256

export const AVATAR_MAX_BYTES = 50 * 1024

export const AVATAR_INPUT_MAX_BYTES = 15 * 1024 * 1024

export const PROFILE_TEXT_MAX = 80

export const REASON_NOTE_MAX = 280

export const PROFILE_LANGUAGES_MAX = 6

export const PROFILE_LANGUAGES = ['es', 'en', 'pt', 'fr', 'de', 'it', 'ca', 'nl', 'zh', 'ja', 'ko', 'ar'] as const

export const COUNTRY_CODES = (
  'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD ' +
  'CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF ' +
  'GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN ' +
  'KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA ' +
  'NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI ' +
  'SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI ' +
  'VN VU WF WS YE YT ZA ZM ZW'
).split(' ')

export function sizedGooglePicture(url: string, size = AVATAR_SIZE): string {
  return url.replace(/=s\d+(-c)?$/, `=s${size}-c`)
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const letters = parts.length > 1 ? [parts[0]!, parts[parts.length - 1]!] : parts.slice(0, 1)
  return letters.map((part) => Array.from(part)[0]!.toUpperCase()).join('') || '·'
}

export function displayCountry(code: string | null, lang: string): string | null {
  if (!code) return null
  try {
    return new Intl.DisplayNames([lang], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}

export function displayLanguage(code: string, lang: string): string {
  try {
    const name = new Intl.DisplayNames([lang], { type: 'language' }).of(code) ?? code
    return name.charAt(0).toLocaleUpperCase(lang) + name.slice(1)
  } catch {
    return code
  }
}

export function countryOptions(lang: string): Array<{ code: string; name: string }> {
  return COUNTRY_CODES.map((code) => ({ code, name: displayCountry(code, lang) ?? code })).sort((a, b) => a.name.localeCompare(b.name, lang))
}
