import {
  ArrowDown,
  ArrowUp,
  CircleCheck,
  FileText,
  Search,
  Ticket,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { buttonStyles } from '@/components/ui/button-styles'
import { SearchChart } from '@/features/dashboard/SearchChart'
import {
  useOverview,
  useRatings,
  useTimeseries,
  useTopQueries,
  useUnansweredQueries,
  useViewsByCategory,
} from '@/features/dashboard/hooks'
import type { ArticleRating } from '@/features/dashboard/api'
import { cn } from '@/lib/cn'

const periods = [7, 30, 90] as const

const dayFormat = new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit' })

/** "up/down/flat" badge. `goodWhenUp` lets "fewer tickets" count as good news. */
function Delta({
  value,
  unit,
  goodWhenUp = true,
}: {
  value: number | null
  unit: string
  goodWhenUp?: boolean
}) {
  if (value === null) return <Badge>neu im Zeitraum</Badge>
  if (value === 0) return <Badge>unverändert</Badge>
  const up = value > 0
  const good = up === goodWhenUp
  return (
    <Badge variant={good ? 'ok' : 'warn'}>
      {up ? (
        <ArrowUp className="size-3" aria-hidden="true" />
      ) : (
        <ArrowDown className="size-3" aria-hidden="true" />
      )}
      {Math.abs(value)} {unit} ggü. Vorperiode
    </Badge>
  )
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return Math.round(((current - previous) / previous) * 100)
}

function rate(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100)
}

/** "Dashboard" for agents and admins (design screen 8). */
export function DashboardPage() {
  const [days, setDays] = useState<(typeof periods)[number]>(30)
  const [chartView, setChartView] = useState<'chart' | 'table'>('chart')

  const overview = useOverview(days)
  const series = useTimeseries(days)
  const top = useTopQueries(days)
  const unanswered = useUnansweredQueries(days)
  const ratings = useRatings()
  const views = useViewsByCategory()

  const o = overview.data
  const successRate = o ? rate(o.clicked, o.searches) : 0
  const successRatePrev = o ? rate(o.clickedPrev, o.searchesPrev) : 0

  const rated = ratings.data ?? []
  const best = rated.slice(0, 3)
  // "Least helpful": the worst ones, but never an article that is already in the best list.
  const worst = rated.slice(3).slice(-3).reverse()

  const maxViews = Math.max(1, ...(views.data ?? []).map((c) => c.views))
  const maxTop = Math.max(1, ...(top.data ?? []).map((t) => t.searches))

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b px-4 py-6 sm:px-8">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-[13px] text-fg-muted">
            Was Mitarbeitende suchen – und wo noch Artikel fehlen.
          </p>
        </div>
        <div
          role="group"
          aria-label="Zeitraum"
          className="flex gap-0.5 rounded-md border bg-hover p-[3px]"
        >
          {periods.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={days === p}
              onClick={() => setDays(p)}
              className={cn(
                'h-[30px] rounded-[7px] px-3 text-[13px] transition',
                days === p
                  ? 'border bg-overlay text-fg shadow-sm'
                  : 'border border-transparent text-fg-muted hover:text-fg',
              )}
            >
              {p} Tage
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6 px-4 py-6 sm:px-8">
        {overview.isError && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-err/30 bg-err-soft p-4 text-sm text-err"
          >
            <span>Die Dashboard-Daten konnten nicht geladen werden.</span>
            <Button variant="secondary" size="sm" onClick={() => void overview.refetch()}>
              Erneut versuchen
            </Button>
          </div>
        )}

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            label="Suchanfragen"
            icon={<Search className="size-4" aria-hidden="true" />}
            value={o ? o.searches.toLocaleString('de-DE') : null}
            footer={o && <Delta value={percentChange(o.searches, o.searchesPrev)} unit="%" />}
          />
          <Kpi
            label="Erfolgsquote"
            icon={<CircleCheck className="size-4" aria-hidden="true" />}
            value={o ? `${successRate} %` : null}
            hint="Anteil der Suchen, bei denen ein Ergebnis geöffnet wurde"
            footer={
              o && (
                <Delta
                  value={o.searchesPrev === 0 ? null : successRate - successRatePrev}
                  unit="Pp"
                />
              )
            }
          />
          <Kpi
            label="Offene Tickets"
            icon={<Ticket className="size-4" aria-hidden="true" />}
            value={o ? o.openTickets.toLocaleString('de-DE') : null}
            footer={o && <Badge>{o.newTickets} neu im Zeitraum</Badge>}
          />
          <Kpi
            label="Artikel"
            icon={<FileText className="size-4" aria-hidden="true" />}
            value={o ? o.publishedArticles.toLocaleString('de-DE') : null}
            footer={
              o && (
                <Badge>
                  {o.draftArticles} {o.draftArticles === 1 ? 'Entwurf' : 'Entwürfe'}
                </Badge>
              )
            }
          />
        </div>

        {/* Chart + top queries */}
        <div className="flex flex-wrap items-stretch gap-4">
          <section className="flex min-w-0 flex-[2_1_560px] flex-col rounded-lg border bg-raised px-6 pt-5 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold tracking-tight">
                  Suchanfragen im Zeitverlauf
                </h2>
                <span className="text-[13px] text-fg-muted">
                  Anfragen pro Tag · letzte {days} Tage
                </span>
              </div>
              <div
                role="group"
                aria-label="Ansicht"
                className="flex gap-0.5 rounded-md border bg-hover p-[3px]"
              >
                {(['chart', 'table'] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    aria-pressed={chartView === view}
                    onClick={() => setChartView(view)}
                    className={cn(
                      'h-[30px] rounded-[7px] px-3 text-[13px] transition',
                      chartView === view
                        ? 'border bg-overlay text-fg shadow-sm'
                        : 'border border-transparent text-fg-muted hover:text-fg',
                    )}
                  >
                    {view === 'chart' ? 'Diagramm' : 'Tabelle'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2 min-h-[270px]">
              {series.isPending && (
                <div className="mt-4 h-[250px] animate-pulse rounded-md bg-hover" />
              )}
              {series.isError && (
                <p role="alert" className="py-10 text-center text-sm text-err">
                  Nicht geladen.
                </p>
              )}
              {series.data && series.data.every((p) => p.searches === 0) && (
                <p className="py-16 text-center text-sm text-fg-muted">
                  In diesem Zeitraum gab es noch keine Suchanfragen.
                </p>
              )}
              {series.data && series.data.some((p) => p.searches > 0) && chartView === 'chart' && (
                <SearchChart points={series.data} />
              )}
              {series.data && series.data.some((p) => p.searches > 0) && chartView === 'table' && (
                <div className="mt-3 max-h-[250px] overflow-y-auto rounded-md border">
                  <table className="w-full border-collapse text-sm">
                    <thead className="sticky top-0 bg-surface text-left text-xs text-fg-subtle">
                      <tr>
                        <th className="px-4 py-2 font-medium">Tag</th>
                        <th className="px-4 py-2 text-right font-medium">Suchen</th>
                        <th className="px-4 py-2 text-right font-medium">ohne Treffer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...series.data].reverse().map((p) => (
                        <tr key={p.day} className="border-t">
                          <td className="px-4 py-1.5">{dayFormat.format(new Date(p.day))}</td>
                          <td className="px-4 py-1.5 text-right tabular-nums">{p.searches}</td>
                          <td className="px-4 py-1.5 text-right text-fg-muted tabular-nums">
                            {p.withoutResults}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="flex min-w-0 flex-[1_1_320px] flex-col rounded-lg border bg-raised p-6">
            <h2 className="text-lg font-semibold tracking-tight">Top-Suchbegriffe</h2>
            <span className="mb-4 text-[13px] text-fg-muted">Letzte {days} Tage</span>
            {top.isPending && <Skeleton rows={5} />}
            {top.data?.length === 0 && <Empty>Noch keine Suchen.</Empty>}
            <ol className="flex flex-col gap-3.5">
              {top.data?.map((t) => (
                <li key={t.term}>
                  <Link
                    to={`/search?q=${encodeURIComponent(t.term)}`}
                    className="group flex flex-col gap-1.5"
                  >
                    <span className="flex items-center justify-between gap-3 text-[13px]">
                      <span className="truncate font-medium group-hover:text-accent-hi">
                        {t.term}
                      </span>
                      <span className="text-fg-muted tabular-nums">{t.searches}</span>
                    </span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-hover-2">
                      <span
                        className="block h-full rounded-full bg-accent"
                        style={{ width: `${(t.searches / maxTop) * 100}%` }}
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Unanswered + helpfulness */}
        <div className="flex flex-wrap items-start gap-4">
          <section className="min-w-0 flex-[3_1_480px] overflow-hidden rounded-lg border bg-raised">
            <div className="flex flex-col gap-1 px-6 pt-5 pb-3">
              <h2 className="flex flex-wrap items-center gap-2.5 text-lg font-semibold tracking-tight">
                Suchen ohne Ergebnis <Badge variant="warn">Fehlende Artikel</Badge>
              </h2>
              <span className="text-[13px] text-fg-muted">
                Dazu hatten wir keinen überzeugenden Treffer – hier fehlt vermutlich eine Anleitung.
              </span>
            </div>
            {unanswered.isPending && (
              <div className="px-6 pb-5">
                <Skeleton rows={4} />
              </div>
            )}
            {unanswered.data?.length === 0 && (
              <div className="px-6 pb-6">
                <Empty>Super – alle Suchen hatten einen passenden Treffer.</Empty>
              </div>
            )}
            <ul className="flex flex-col p-3 pt-0">
              {unanswered.data?.map((u, i) => (
                <li
                  key={u.term}
                  className={cn(
                    'flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md px-3 py-3',
                    i % 2 === 1 && 'bg-hover',
                  )}
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[13px] font-semibold">„{u.term}“</span>
                    {u.lastAt && (
                      <span className="text-xs text-fg-subtle">
                        zuletzt {dayFormat.format(new Date(u.lastAt))}
                      </span>
                    )}
                  </div>
                  <span className="text-[13px] whitespace-nowrap text-fg-muted tabular-nums">
                    {u.searches} Suchen
                  </span>
                  <Link
                    to={`/agent/articles/new?title=${encodeURIComponent(u.term.charAt(0).toUpperCase() + u.term.slice(1))}`}
                    className={buttonStyles('secondary', 'sm')}
                  >
                    Artikel erstellen
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex min-w-0 flex-[2_1_380px] flex-col gap-4">
            <RatingList
              title="Am hilfreichsten"
              icon={<ThumbsUp className="size-[18px] text-ok" aria-hidden="true" />}
              items={best}
              loading={ratings.isPending}
              empty="Noch keine Bewertungen."
            />
            <RatingList
              title="Am wenigsten hilfreich"
              icon={<ThumbsDown className="size-[18px] text-warn" aria-hidden="true" />}
              items={worst}
              loading={ratings.isPending}
              empty="Sobald mehr als drei Artikel bewertet sind, erscheinen hier die schwächsten."
              improve
            />
          </div>
        </div>

        {/* Views by category */}
        <section className="rounded-lg border bg-raised p-6">
          <h2 className="text-lg font-semibold tracking-tight">Aufrufe nach Kategorie</h2>
          <span className="mb-4 block text-[13px] text-fg-muted">
            Alle veröffentlichten Artikel, gesamt
          </span>
          {views.isPending && <Skeleton rows={4} />}
          <ul className="grid gap-x-10 gap-y-4 md:grid-cols-2">
            {views.data?.map((c) => (
              <li key={c.id} className="flex flex-col gap-1.5">
                <span className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="font-medium">
                    {c.name}{' '}
                    <span className="font-normal text-fg-subtle">· {c.articles} Artikel</span>
                  </span>
                  <span className="text-fg-muted tabular-nums">
                    {c.views.toLocaleString('de-DE')}
                  </span>
                </span>
                <span className="h-1.5 overflow-hidden rounded-full bg-hover-2">
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${(c.views / maxViews) * 100}%` }}
                  />
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}

function Kpi({
  label,
  icon,
  value,
  hint,
  footer,
}: {
  label: string
  icon: ReactNode
  value: string | null
  hint?: string
  footer: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-raised p-5" title={hint}>
      <div className="flex items-center justify-between text-[13px] text-fg-muted">
        <span>{label}</span>
        <span className="text-fg-subtle">{icon}</span>
      </div>
      {value === null ? (
        <div className="h-10 w-24 animate-pulse rounded-md bg-hover-2" />
      ) : (
        <span className="text-4xl leading-10 font-semibold tracking-[-0.03em] tabular-nums">
          {value}
        </span>
      )}
      <div className="min-h-[22px]">{footer}</div>
    </div>
  )
}

function Skeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-5 animate-pulse rounded-sm bg-hover-2" />
      ))}
    </div>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-fg-muted">{children}</p>
}

function RatingList({
  title,
  icon,
  items,
  loading,
  empty,
  improve,
}: {
  title: string
  icon: ReactNode
  items: ArticleRating[]
  loading: boolean
  empty: string
  improve?: boolean
}) {
  return (
    <section className="overflow-hidden rounded-lg border bg-raised">
      <h2 className="flex items-center gap-2.5 px-6 pt-5 pb-2 text-lg font-semibold tracking-tight">
        {icon}
        {title}
      </h2>
      <ul className="flex flex-col p-3 pt-0">
        {loading && (
          <li className="px-3 py-3">
            <Skeleton rows={2} />
          </li>
        )}
        {!loading && items.length === 0 && (
          <li className="px-3 py-4 text-sm text-fg-muted">{empty}</li>
        )}
        {items.map((item) => (
          <li key={item.articleId} className="flex items-center gap-3 rounded-md px-3 py-2.5">
            <Link
              to={`/articles/${item.slug}`}
              className="min-w-0 flex-1 truncate text-[13px] hover:text-accent-hi"
            >
              {item.title}
            </Link>
            <span
              className={cn(
                'text-[13px] font-semibold tabular-nums',
                improve && item.rate < 70 ? 'text-warn' : 'text-fg',
              )}
              title={`${item.helpful} von ${item.total} positiv`}
            >
              {item.rate} %
            </span>
            {improve && (
              <Link to={`/agent/articles`} className={buttonStyles('ghost', 'sm')}>
                Überarbeiten
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
