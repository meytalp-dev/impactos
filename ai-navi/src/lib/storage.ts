import type { PersistedNavigatorState } from './types'

const KEY_PREFIX = 'ai-navi:'
const STATE_KEY = `${KEY_PREFIX}navigator-state:v1`

const availableStorage = () => typeof localStorage === 'undefined' ? null : localStorage

export function loadNavigatorState(): PersistedNavigatorState | null {
  const storage = availableStorage()
  if (!storage) return null
  try {
    const value: unknown = JSON.parse(storage.getItem(STATE_KEY) ?? 'null')
    if (!value || typeof value !== 'object') return null
    const state = value as Record<string, unknown>
    if (state.version !== 1 || !state.answers || typeof state.answers !== 'object' || Array.isArray(state.answers)) return null
    return { version: 1, answers: state.answers as PersistedNavigatorState['answers'] }
  } catch {
    return null
  }
}

export function saveNavigatorState(state: PersistedNavigatorState): void {
  const storage = availableStorage()
  if (!storage) return
  storage.setItem(STATE_KEY, JSON.stringify({ version: 1, answers: state.answers }))
}

export function resetNavigatorState(): void {
  const storage = availableStorage()
  if (!storage) return
  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index)
    if (key?.startsWith(KEY_PREFIX)) storage.removeItem(key)
  }
}
