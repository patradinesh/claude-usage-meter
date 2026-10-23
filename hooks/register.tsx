import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Detail, Prefs, Stats } from '../types'
import { detailLine, left, right, statusText } from './format'

const empty: Stats = { model: null, input: 0, output: 0, cached: 0, usd: null }
const noDetail: Detail = { turns: 0, ms: 0, lastMs: null, prevUsd: null, lastUsd: null }
const noPrefs: Prefs = { detail: null, display: null }
const stats = atom({ plugin: 'usage-meter', key: 'stats' } as const, empty)
const detail = atom({ plugin: 'usage-meter', key: 'detail' } as const, noDetail)
const prefs = atom({ plugin: 'usage-meter', key: 'prefs' } as const, noPrefs)

const HELP = `| Command | Effect |
| --- | --- |
| \`/usage-meter band\` | Row above the prompt |
| \`/usage-meter status\` | Status line (shows the plugin name) |
| \`/usage-meter detail on\` / \`off\` | Add or remove last turn time and cost, total time, turns and average cost |

**In/Out** tokens · **Cache** input read from cache · **Session** cost so far`

// Config options are the defaults; /usage-meter choices override them for the session.
async function view($: any, dDisplay: string, dDetail: boolean) {
  const p = await read($, prefs)
  return { display: p.display ?? dDisplay, detail: p.detail ?? dDetail }
}

async function text($: any, dDisplay: string, dDetail: boolean): Promise<string> {
  const [s, d, v] = await Promise.all([read($, stats), read($, detail), view($, dDisplay, dDetail)])
  return statusText(s, d, v.detail)
}

// Pins the status line when display is status, clears it otherwise.
async function sync($: any, dDisplay: string, dDetail: boolean) {
  const v = await view($, dDisplay, dDetail)
  $.ui.status(v.display === 'status' ? await text($, dDisplay, dDetail) : undefined)
}

export const register: Register = (on, options) => {
  const dDisplay = options.display === 'status' ? 'status' : 'band'
  const dDetail = options.detail === true

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'usage-meter', description: 'Choose where and how usage is shown' })
    // Choices made with /usage-meter in an earlier session.
    const saved = (await $.store.get('prefs')) as Partial<Prefs> | undefined
    if (saved) await update($, prefs, p => ({ ...p, ...saved }))
    await sync($, dDisplay, dDetail)
    return next(e)
  })

  on('command.run', { command: 'usage-meter' }, async ($, e) => {
    // Bare "band" or "status" is shorthand for "display band|status".
    const words = e.args
      .trim()
      .toLowerCase()
      .replace(/^(band|status)\b/, 'display $1')
      .split(/\s+/)
      .filter(Boolean)
    // Accept several pairs in one go: /usage-meter display status detail off
    for (let i = 0; i < words.length; i += 2) {
      const [key, value] = [words[i], words[i + 1]]
      if (key === 'display' && (value === 'band' || value === 'status')) {
        await update($, prefs, p => ({ ...p, display: value }))
      } else if (key === 'detail' && (value === 'on' || value === 'off')) {
        await update($, prefs, p => ({ ...p, detail: value === 'on' }))
      } else {
        return { text: HELP }
      }
    }
    await $.store.set('prefs', await read($, prefs))
    await sync($, dDisplay, dDetail)
    const v = await view($, dDisplay, dDetail)
    return { text: `**Display:** ${v.display} · **Detail:** ${v.detail ? 'on' : 'off'}\n\n${HELP}` }
  })

  // Engine pushes new figures after each turn: no polling, no model call, no tokens.
  on('session.measure', async ($, e, next) => {
    const s = await update($, stats, s => ({ ...s, usd: e.cost?.usd ?? s.usd }))
    // Cost of a turn = every rise in the session total between its start and the next start.
    await update($, detail, d => {
      const rise = s.usd !== null && d.prevUsd !== null && s.usd > d.prevUsd ? s.usd - d.prevUsd : 0
      return {
        ...d,
        prevUsd: s.usd ?? d.prevUsd,
        lastUsd: rise > 0 ? (d.fresh !== false ? rise : (d.lastUsd ?? 0) + rise) : d.lastUsd,
        fresh: rise > 0 ? false : d.fresh,
      }
    })
    await sync($, dDisplay, dDetail)
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    await update($, detail, d => ({ ...d, fresh: true }))
    return next(e)
  })

  // Running totals: add each finished turn's token counts (subagent turns included).
  on('turn.complete', async ($, e, next) => {
    const u = e.usage
    if (u) {
      await update($, stats, s => ({
        ...s,
        model: u.model,
        input: s.input + u.input_tokens + u.cache_creation_input_tokens,
        output: s.output + u.output_tokens,
        cached: s.cached + u.cache_read_input_tokens,
      }))
      await update($, detail, d => ({ ...d, turns: d.turns + 1, ms: d.ms + e.durationMs, lastMs: e.durationMs }))
      await sync($, dDisplay, dDetail)
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const v = await view($, dDisplay, dDetail)
    if (v.display === 'status' || e.props.hasSurvey) return next(e)
    const s = await read($, stats)
    const extra = v.detail ? detailLine(await read($, detail), s.usd) : ''
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        <Box justifyContent="space-between">
          <Text>{left(s)}</Text>
          <Text>{right(s)}</Text>
        </Box>
        {extra !== '' && <Text>{extra}</Text>}
      </Box>
    )
  })
}
