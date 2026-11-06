/**
 * Only allow redirects to paths inside our own app. The target comes from the URL (?redirect=…),
 * so an attacker could craft a link to //evil.com or /\evil.com ("open redirect"). Anything that is not a
 * plain absolute path falls back to the home page.
 */
export function safeRedirect(value: string | null): string {
  if (!value) return '/'
  if (!value.startsWith('/')) return '/'
  if (value.startsWith('//') || value.includes('\\')) return '/'
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f]/.test(value)) return '/'
  return value
}
