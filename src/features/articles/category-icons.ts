import {
  AppWindow,
  Cloud,
  FileText,
  Globe,
  Headphones,
  Lock,
  Mail,
  Monitor,
  Printer,
  Server,
  ShieldCheck,
  Smartphone,
  Users,
  Wifi,
  type LucideIcon,
} from 'lucide-react'

/**
 * The `icon` column in `categories` stores a name; this maps it to a real component.
 * The admin icon picker offers exactly these names.
 */
const icons: Record<string, { icon: LucideIcon; label: string }> = {
  globe: { icon: Globe, label: 'Globus' },
  wifi: { icon: Wifi, label: 'WLAN' },
  printer: { icon: Printer, label: 'Drucker' },
  lock: { icon: Lock, label: 'Schloss' },
  shield: { icon: ShieldCheck, label: 'Schild' },
  'app-window': { icon: AppWindow, label: 'Fenster' },
  monitor: { icon: Monitor, label: 'Monitor' },
  smartphone: { icon: Smartphone, label: 'Smartphone' },
  headphones: { icon: Headphones, label: 'Headset' },
  mail: { icon: Mail, label: 'E-Mail' },
  server: { icon: Server, label: 'Server' },
  cloud: { icon: Cloud, label: 'Cloud' },
  users: { icon: Users, label: 'Personen' },
  'file-text': { icon: FileText, label: 'Dokument' },
}

export const categoryIconNames = Object.keys(icons)

export function getCategoryIcon(name: string): LucideIcon {
  return icons[name]?.icon ?? FileText
}

export function getCategoryIconLabel(name: string): string {
  return icons[name]?.label ?? 'Dokument'
}
