export interface EvalCase {
  query: string
  /** slug of the article that should be found; null = there is NO article for this question */
  expected: string | null
}

/**
 * Test questions for the search-quality page (written the way employees actually phrase problems:
 * vague, without technical terms). The slugs belong to supabase/seed.sql + seed_extra.sql.
 * Extend this list whenever search produces a bad result – it doubles as a regression test.
 */
export const evalCases: EvalCase[] = [
  // Questions that should find a specific article
  { query: 'ich komme nicht in meinen PC rein', expected: 'windows-passwort-zuruecksetzen' },
  { query: 'ich habe mein Passwort vergessen', expected: 'windows-passwort-zuruecksetzen' },
  { query: 'mein Konto ist gesperrt', expected: 'konto-gesperrt-fehlversuche' },
  { query: 'VPN geht von zu Hause nicht', expected: 'vpn-verbindet-nicht-fehler-809' },
  { query: 'der Drucker druckt nichts', expected: 'drucker-druckt-nicht' },
  { query: 'Papier klemmt im Drucker', expected: 'drucker-papierstau' },
  { query: 'Outlook startet nicht', expected: 'outlook-startet-nicht-oder-haengt' },
  { query: 'im Teams Meeting hört mich keiner', expected: 'teams-kein-ton-mikrofon' },
  { query: 'Kamera geht in Teams nicht', expected: 'teams-kamera-funktioniert-nicht' },
  { query: 'Laptop lädt nicht', expected: 'laptop-laedt-nicht-netzteil-akku' },
  { query: 'Bildschirm bleibt schwarz', expected: 'bildschirm-bleibt-schwarz' },
  { query: 'ich brauche ein neues Programm', expected: 'software-installation-beantragen' },
  { query: 'Internet für Besucher', expected: 'wlan-gast-verbinden' },
  { query: 'Laufwerk Z fehlt', expected: 'netzlaufwerk-z-fehlt' },
  { query: 'Postfach voll', expected: 'outlook-postfach-voll' },
  // Questions without an answer in the knowledge base – search must NOT claim a strong match
  { query: 'Wie beantrage ich Urlaub', expected: null },
  { query: 'Dienstreise Spesenabrechnung', expected: null },
  { query: 'Kaffeemaschine kaputt', expected: null },
]
