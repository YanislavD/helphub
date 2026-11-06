/**
 * Makes a user's file name safe to use inside a storage path: lower case, only a-z 0-9 and "-",
 * the extension is kept (letters/digits only). "Mein Bild (1).PNG" → "mein-bild-1.png".
 */
export function safeFileName(name: string): string {
  const dot = name.lastIndexOf('.')
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')
  const ext =
    dot > 0
      ? name
          .slice(dot + 1)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '')
          .slice(0, 8)
      : ''
  return `${base || 'datei'}${ext ? `.${ext}` : ''}`
}
