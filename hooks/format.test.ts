import { test, expect } from 'claude-code/testing'
import { statusText, compact, detailLine, dur, left, line, right } from './format'

test('compact', () => {
  expect(compact(999)).toBe('999')
  expect(compact(12345)).toBe('12.3k')
  expect(compact(2_500_000)).toBe('2.5M')
})

test('line', () => {
  const s = { model: 'opus', input: 200, output: 300, cached: 800, usd: 0.5 }
  expect(left(s)).toBe('Tokens: In: 1.0k, Out: 300, Cache: 80%')
  expect(right(s)).toBe('Session Cost: $0.50')
  expect(line(s)).toBe('Tokens: In: 1.0k, Out: 300, Cache: 80% | Session Cost: $0.50')
})

test('line without data', () => {
  const s = { model: null, input: 0, output: 0, cached: 0, usd: null }
  expect(line(s)).toBe('Tokens: In: 0, Out: 0')
})

test('detail', () => {
  expect(dur(42_000)).toBe('42s')
  expect(dur(190_000)).toBe('3m10s')
  const d = { turns: 4, ms: 190_000, lastMs: 42_000, prevUsd: 1, lastUsd: 0.12 }
  expect(detailLine(d, 1)).toBe('Last turn: 42s $0.12, Total time: 3m10s, Turns: 4, Avg: $0.25/turn')
  expect(detailLine({ ...d, turns: 0 }, null)).toBe('')
})

test('status text', () => {
  const s = { model: null, input: 200, output: 300, cached: 800, usd: 1 }
  const d = { turns: 4, ms: 190_000, lastMs: 42_000, prevUsd: 1, lastUsd: 0.12 }
  expect(statusText(s, d, false)).toBe('Session $1.00 · In 1.0k · Out 300 · Cache 80%')
  expect(statusText(s, d, true)).toBe('Session $1.00 · In 1.0k · Out 300 · Cache 80% · Last 42s $0.12 · Avg $0.25 · 4 turns')
})
