import type { LucideIcon } from 'lucide-react'
import { AppWindow, Globe, Lock, Mail, Monitor, Printer } from 'lucide-react'

export interface Category {
  slug: string
  name: string
  description: string
  icon: LucideIcon
}

/**
 * Static placeholder data. In stage 3 this moves to the `categories` table in Supabase
 * (the icon column then stores a name like "globe" that we map to a component).
 */
export const categories: Category[] = [
  {
    slug: 'netzwerk-vpn',
    name: 'Netzwerk & VPN',
    description: 'WLAN, VPN, Internetverbindung',
    icon: Globe,
  },
  { slug: 'drucker', name: 'Drucker', description: 'Drucken, Scannen, Papierstau', icon: Printer },
  {
    slug: 'konten-passwoerter',
    name: 'Konten & Passwörter',
    description: 'Anmeldung, Sperrung, MFA',
    icon: Lock,
  },
  {
    slug: 'software',
    name: 'Software',
    description: 'Installation, Updates, Lizenzen',
    icon: AppWindow,
  },
  { slug: 'hardware', name: 'Hardware', description: 'Laptop, Monitor, Zubehör', icon: Monitor },
  {
    slug: 'email-teams',
    name: 'E-Mail & Teams',
    description: 'Outlook, Kalender, Meetings',
    icon: Mail,
  },
]

export const exampleQueries = [
  'Ich komme nicht in meinen PC rein',
  'VPN verbindet nicht',
  'Drucker druckt nicht',
  'Outlook startet nicht',
  'Kein Ton in Teams',
]
