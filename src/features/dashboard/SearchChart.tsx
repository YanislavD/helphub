import { useState, type PointerEvent } from 'react'
import type { DayPoint } from './api'

const W = 780
const H = 270
const X0 = 40
const X1 = 770
const Y_TOP = 20
const Y_BOTTOM = 220

const dayFormat = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short' })
const longDayFormat = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long' })

/** A "nice" axis step (1, 2, 5, 10, 20, 50 …) so the grid lines land on round numbers. */
function niceStep(rawStep: number): number {
  if (rawStep <= 1) return 1
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const normalized = rawStep / magnitude
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return nice * magnitude
}

/**
 * Smooth line through the points. Between two points we draw a cubic curve whose control points
 * have the same y as their own end point – the curve flattens at every point, so it can never
 * overshoot (a count of 0 never dips below the axis).
 */
function smoothPath(points: Array<[number, number]>): string {
  if (points.length === 0) return ''
  let d = `M${points[0][0]},${points[0][1]}`
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1]
    const [x1, y1] = points[i]
    const mid = (x0 + x1) / 2
    d += ` C${mid},${y0} ${mid},${y1} ${x1},${y1}`
  }
  return d
}

/** Line/area chart "searches per day" (design screen 8) with a hover crosshair and tooltip. */
export function SearchChart({ points }: { points: DayPoint[] }) {
  const [hover, setHover] = useState<number | null>(null)

  const max = Math.max(0, ...points.map((p) => p.searches))
  const step = niceStep(Math.max(1, max) / 4)
  const yMax = Math.max(step * 4, Math.ceil(max / step) * step)

  const xAt = (i: number) =>
    points.length <= 1 ? (X0 + X1) / 2 : X0 + (i * (X1 - X0)) / (points.length - 1)
  const yAt = (value: number) => Y_BOTTOM - (value / yMax) * (Y_BOTTOM - Y_TOP)

  const coords = points.map((p, i): [number, number] => [xAt(i), yAt(p.searches)])
  const line = smoothPath(coords)
  const area = coords.length
    ? `${line} L${coords.at(-1)![0]},${Y_BOTTOM} L${coords[0][0]},${Y_BOTTOM} Z`
    : ''

  const ticks = Array.from({ length: yMax / step + 1 }, (_, i) => i * step)
  const labelEvery = Math.max(1, Math.ceil(points.length / 6))

  function handleMove(event: PointerEvent<SVGRectElement>) {
    const svg = event.currentTarget.ownerSVGElement
    if (!svg || points.length === 0) return
    const box = svg.getBoundingClientRect()
    const x = ((event.clientX - box.left) / box.width) * W
    const index = Math.round(((x - X0) / (X1 - X0)) * (points.length - 1))
    setHover(Math.min(points.length - 1, Math.max(0, index)))
  }

  const active = hover !== null ? points[hover] : null
  const tipX = hover !== null ? xAt(hover) : 0
  const tipLeft = tipX > W * 0.7

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full"
      role="img"
      aria-label={`Liniendiagramm: Suchanfragen pro Tag, Maximum ${max}`}
    >
      <defs>
        <linearGradient id="chart-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--accent)', stopOpacity: 0.32 }} />
          <stop offset="1" style={{ stopColor: 'var(--accent)', stopOpacity: 0 }} />
        </linearGradient>
      </defs>

      {/* grid + y labels */}
      {ticks.map((tick) => (
        <g key={tick}>
          <line
            x1={X0}
            x2={X1}
            y1={yAt(tick)}
            y2={yAt(tick)}
            style={{ stroke: tick === 0 ? 'var(--border-2)' : 'var(--border)' }}
          />
          <text
            x={X0 - 10}
            y={yAt(tick) + 4}
            fontSize="12"
            textAnchor="end"
            style={{ fill: 'var(--fg-subtle)' }}
          >
            {tick}
          </text>
        </g>
      ))}

      {/* x labels */}
      {points.map((p, i) =>
        i % labelEvery === 0 ? (
          <text
            key={p.day}
            x={xAt(i)}
            y={H - 10}
            fontSize="12"
            textAnchor="middle"
            style={{ fill: 'var(--fg-subtle)' }}
          >
            {dayFormat.format(new Date(p.day))}
          </text>
        ) : null,
      )}

      <path d={area} fill="url(#chart-area)" />
      <path
        d={line}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ stroke: 'var(--accent-hi)' }}
      />

      {/* hover layer */}
      {active && hover !== null && (
        <g pointerEvents="none">
          <line
            x1={tipX}
            x2={tipX}
            y1={Y_TOP}
            y2={Y_BOTTOM}
            strokeDasharray="3 3"
            style={{ stroke: 'var(--fg-subtle)' }}
          />
          <circle
            cx={tipX}
            cy={yAt(active.searches)}
            r="5"
            strokeWidth="2"
            style={{ fill: 'var(--accent-hi)', stroke: 'var(--raised)' }}
          />
          <g
            transform={`translate(${tipLeft ? tipX - 142 : tipX + 12} ${Math.max(Y_TOP, yAt(active.searches) - 24)})`}
          >
            <rect
              width="130"
              height="62"
              rx="10"
              style={{ fill: 'var(--overlay)', stroke: 'var(--border-2)' }}
            />
            <text x="12" y="20" fontSize="12" style={{ fill: 'var(--fg-subtle)' }}>
              {longDayFormat.format(new Date(active.day))}
            </text>
            <text x="12" y="38" fontSize="13" fontWeight="600" style={{ fill: 'var(--fg)' }}>
              {active.searches} Suchanfragen
            </text>
            <text x="12" y="54" fontSize="12" style={{ fill: 'var(--fg-subtle)' }}>
              {active.withoutResults} ohne Treffer
            </text>
          </g>
        </g>
      )}

      <rect
        x={X0}
        y={Y_TOP}
        width={X1 - X0}
        height={Y_BOTTOM - Y_TOP}
        fill="transparent"
        onPointerMove={handleMove}
        onPointerLeave={() => setHover(null)}
      />
    </svg>
  )
}
