export type Stats = {
  model: string | null
  input: number
  output: number
  cached: number
  usd: number | null
}

export type Detail = {
  turns: number
  ms: number
  lastMs: number | null
  prevUsd: number | null
  // true from a turn's start until its first cost reading lands
  fresh?: boolean
  lastUsd: number | null
}

export type Prefs = { detail: boolean | null; display: 'band' | 'status' | null }

declare module 'claude-code' {
  interface PluginState {
    'usage-meter': { stats: Stats; detail: Detail; prefs: Prefs }
  }
}
