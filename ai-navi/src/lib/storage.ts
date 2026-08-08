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
    const persisted: PersistedNavigatorState = { version: 1, answers: state.answers as PersistedNavigatorState['answers'] }
    if (state.mode === 'intro' || state.mode === 'questions' || state.mode === 'privacy-gate') persisted.mode = state.mode
    if (typeof state.currentStep === 'number' && Number.isInteger(state.currentStep) && state.currentStep >= 0 && state.currentStep <= 6) persisted.currentStep = state.currentStep
    if (typeof state.taskText === 'string') persisted.taskText = state.taskText
    if (typeof state.privacyConfirmed === 'boolean') persisted.privacyConfirmed = state.privacyConfirmed
    if (typeof state.complete === 'boolean') persisted.complete = state.complete
    return persisted
  } catch {
    return null
  }
}

export function saveNavigatorState(state: PersistedNavigatorState): void {
  const storage = availableStorage()
  if (!storage) return
  storage.setItem(STATE_KEY, JSON.stringify({ ...state, version: 1, answers: state.answers }))
}

export function resetNavigatorState(): void {
  const storage = availableStorage()
  if (!storage) return
  storage.removeItem(STATE_KEY)
}
