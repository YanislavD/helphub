/**
 * Turns a title into a URL-friendly slug:
 *   "Passwort zurücksetzen – so geht's!"  →  "passwort-zuruecksetzen-so-geht-s"
 * German umlauts are spelled out (ü → ue) instead of just dropped, as in German URLs.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip remaining accents (é → e)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '')
}
