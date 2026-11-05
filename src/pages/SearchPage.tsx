import { useSearchParams } from 'react-router-dom'
import { PagePlaceholder } from '@/components/PagePlaceholder'

export function SearchPage() {
  const [params] = useSearchParams()
  const query = params.get('q')

  return (
    <PagePlaceholder
      title="Suchergebnisse"
      description={
        query
          ? `Suche nach „${query}“ – die Ergebnisse kommen in Etappe 5 und 6.`
          : 'Hier erscheinen später alle Artikel und Suchergebnisse.'
      }
    />
  )
}
