import type { Detail, Stats } from '../types'

export const compact = (n: number): string =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(n)

// cache hit = share of all input tokens served from the prompt cache
export const hit = (s: Stats): number | null =>
  s.input + s.cached === 0 ? null : Math.round((s.cached / (s.input + s.cached)) * 100)

export const left = (s: Stats): string =>
  [
    `Tokens: In: ${compact(s.input + s.cached)}`,
    `Out: ${compact(s.output)}`,
    hit(s) === null ? null : `Cache: ${hit(s)}%`,
  ]
    .filter(Boolean)
    .join(', ')

export const right = (s: Stats): string => (s.usd === null ? '' : `Session Cost: $${s.usd.toFixed(2)}`)

// one string for the status line, which has no left/right ends
export const line = (s: Stats): string => [left(s), right(s)].filter(Boolean).join(' | ')

export const dur = (ms: number): string => {
  const t = Math.round(ms / 1000)
  return t >= 60 ? `${Math.floor(t / 60)}m${String(t % 60).padStart(2, '0')}s` : `${t}s`
}

export const detailLine = (d: Detail, usd: number | null): string =>
  d.turns === 0
    ? ''
    : [
        d.lastMs === null ? null : `Last turn: ${dur(d.lastMs)}${d.lastUsd === null ? '' : ` $${d.lastUsd.toFixed(2)}`}`,
        `Total time: ${dur(d.ms)}`,
        `Turns: ${d.turns}`,
        usd === null ? null : `Avg: $${(usd / d.turns).toFixed(2)}/turn`,
      ]
        .filter(Boolean)
        .join(', ')

// Short form for the status line, which truncates long text: the most useful figures come first.
export const statusText = (s: Stats, d: Detail, withDetail: boolean): string =>
  [
    s.usd === null ? null : `Session $${s.usd.toFixed(2)}`,
    `In ${compact(s.input + s.cached)}`,
    `Out ${compact(s.output)}`,
    hit(s) === null ? null : `Cache ${hit(s)}%`,
    ...(withDetail && d.turns > 0
      ? [
          d.lastMs === null ? null : `Last ${dur(d.lastMs)}${d.lastUsd === null ? '' : ` $${d.lastUsd.toFixed(2)}`}`,
          s.usd === null ? null : `Avg $${(s.usd / d.turns).toFixed(2)}`,
          `${d.turns} turns`,
        ]
      : []),
  ]
    .filter(Boolean)
    .join(' · ')
