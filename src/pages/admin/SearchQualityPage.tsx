import { Play } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { evalCases } from '@/features/search/eval-cases'
import { tierLabels } from '@/features/search/relevance'
import { runSearch, type SearchHit } from '@/features/search/search-api'
import { cn } from '@/lib/cn'

interface CaseResult {
  hits: SearchHit[]
  semantic: boolean
  error?: boolean
}

/** Admin tool: runs the fixed test questions through the real search and shows how well it does. */
export function SearchQualityPage() {
  const [results, setResults] = useState<Record<number, CaseResult>>({})
  const [running, setRunning] = useState(false)

  async function runAll() {
    setRunning(true)
    setResults({})
    // One after another: gentle on the Edge Function's CPU budget and the order is easy to follow.
    for (const [index, testCase] of evalCases.entries()) {
      try {
        const { hits, semantic } = await runSearch(testCase.query)
        setResults((current) => ({ ...current, [index]: { hits, semantic } }))
      } catch {
        setResults((current) => ({
          ...current,
          [index]: { hits: [], semantic: false, error: true },
        }))
      }
    }
    setRunning(false)
  }

  // --- scoring -----------------------------------------------------------------------------
  const scored = evalCases.map((testCase, index) => {
    const result = results[index]
    if (!result)
      return { testCase, result, rank: null as number | null, pass: null as boolean | null }
    if (testCase.expected === null) {
      // "No answer" question: fine if nothing is returned or the best hit is only a weak guess.
      const pass = result.hits.length === 0 || result.hits[0].tier === 'low'
      return { testCase, result, rank: null, pass }
    }
    const position = result.hits.findIndex((h) => h.slug === testCase.expected)
    const rank = position === -1 ? 0 : position + 1
    return { testCase, result, rank, pass: rank >= 1 && rank <= 3 }
  })

  const withAnswer = scored.filter((s) => s.testCase.expected !== null && s.result)
  const withoutAnswer = scored.filter((s) => s.testCase.expected === null && s.result)
  const top1 = withAnswer.filter((s) => s.rank === 1).length
  const top3 = withAnswer.filter((s) => s.pass).length
  const quiet = withoutAnswer.filter((s) => s.pass).length
  const semanticUsed = scored.some((s) => s.result?.semantic)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b px-4 py-6 sm:px-8">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-semibold tracking-tight">Suchqualität</h1>
          <p className="text-[13px] text-fg-muted">
            {evalCases.length} Testfragen gegen die echte Suche. Diese Läufe werden nicht im
            Suchprotokoll gespeichert.
          </p>
        </div>
        <Button onClick={() => void runAll()} disabled={running}>
          <Play className="size-4" aria-hidden="true" />
          {running ? 'Tests laufen…' : 'Alle Tests ausführen'}
        </Button>
      </div>

      <div className="flex flex-col gap-6 px-4 py-6 sm:px-8">
        {withAnswer.length + withoutAnswer.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Richtig auf Platz 1" value={`${top1} / ${withAnswer.length}`} />
            <Stat label="Richtig in den Top 3" value={`${top3} / ${withAnswer.length}`} />
            <Stat
              label="Ohne Antwort: kein starker Treffer"
              value={`${quiet} / ${withoutAnswer.length}`}
            />
          </div>
        )}
        {!semanticUsed && Object.keys(results).length > 0 && (
          <p
            role="status"
            className="rounded-md border border-warn/30 bg-warn-soft px-4 py-3 text-sm text-warn"
          >
            Die KI-Suche war nicht aktiv (nur Stichwortsuche). Prüfe, ob die Edge Functions
            erreichbar sind.
          </p>
        )}

        <div className="overflow-x-auto rounded-lg border bg-raised">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-surface text-left text-xs font-medium text-fg-subtle">
                <th className="px-4 py-3">Frage</th>
                <th className="px-4 py-3">Erwartet</th>
                <th className="px-4 py-3">Ergebnis</th>
                <th className="px-4 py-3">Top 3</th>
              </tr>
            </thead>
            <tbody>
              {scored.map(({ testCase, result, rank, pass }, index) => (
                <tr key={index} className="border-b align-top last:border-0">
                  <td className="px-4 py-3.5 font-medium">„{testCase.query}“</td>
                  <td className="px-4 py-3.5 text-[13px] text-fg-muted">
                    {testCase.expected ?? <span className="text-fg-subtle">– keine Antwort –</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    {!result && <span className="text-fg-subtle">{running ? '…' : '–'}</span>}
                    {result?.error && <Badge variant="err">Fehler</Badge>}
                    {result && !result.error && pass !== null && (
                      <div className="flex flex-col items-start gap-1">
                        <Badge variant={pass ? 'ok' : 'err'}>
                          {pass ? 'bestanden' : 'nicht bestanden'}
                        </Badge>
                        {testCase.expected !== null && (
                          <span className="text-xs text-fg-subtle">
                            {rank ? `Platz ${rank}` : 'nicht gefunden'}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <ol className="flex flex-col gap-1">
                      {result?.hits.slice(0, 3).map((hit) => (
                        <li
                          key={hit.id}
                          className={cn(
                            'text-[13px]',
                            hit.slug === testCase.expected
                              ? 'font-semibold text-fg'
                              : 'text-fg-muted',
                          )}
                        >
                          {hit.title}{' '}
                          <span className="text-xs text-fg-subtle">
                            · {tierLabels[hit.tier]}
                            {hit.similarity !== null && ` · ${hit.similarity.toFixed(3)}`}
                          </span>
                        </li>
                      ))}
                      {result && !result.error && result.hits.length === 0 && (
                        <li className="text-[13px] text-fg-subtle">keine Treffer</li>
                      )}
                    </ol>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border bg-raised p-5">
      <span className="text-[13px] text-fg-muted">{label}</span>
      <span className="text-3xl font-semibold tracking-tight tabular-nums">{value}</span>
    </div>
  )
}
