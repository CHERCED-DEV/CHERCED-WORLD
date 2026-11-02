export function mailtoHref(email: string, subject: string): string {
  const address = email
    .trim()
    .split('@')
    .map((part) => encodeURIComponent(part))
    .join('@')
  return `mailto:${address}?subject=${encodeURIComponent(subject)}`
}
