import {
  AppWindow,
  FileText,
  Globe,
  Lock,
  Mail,
  Monitor,
  Printer,
  type LucideIcon,
} from 'lucide-react'

/** The `icon` column in `categories` stores a name; this maps it to a real component. */
const icons: Record<string, LucideIcon> = {
  globe: Globe,
  printer: Printer,
  lock: Lock,
  'app-window': AppWindow,
  monitor: Monitor,
  mail: Mail,
  'file-text': FileText,
}

export function getCategoryIcon(name: string): LucideIcon {
  return icons[name] ?? FileText
}
