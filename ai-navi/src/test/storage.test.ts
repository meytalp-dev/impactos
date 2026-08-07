import { afterEach, describe, expect, it } from 'vitest'
import { loadNavigatorState, resetNavigatorState, saveNavigatorState } from '../lib/storage'

describe('navigator storage', () => {
  afterEach(() => localStorage.clear())

  it('round-trips a valid versioned navigator state', () => {
    const state = { version: 1, answers: { taskType: 'research', inputType: 'web-links' } } as const

    saveNavigatorState(state)

    expect(loadNavigatorState()).toEqual(state)
  })

  it('returns null for corrupt JSON or a wrong schema version', () => {
    localStorage.setItem('ai-navi:navigator-state:v1', '{not json')
    expect(loadNavigatorState()).toBeNull()

    localStorage.setItem('ai-navi:navigator-state:v1', JSON.stringify({ version: 2, answers: {} }))
    expect(loadNavigatorState()).toBeNull()
  })

  it('resets only the versioned navigator-state key', () => {
    localStorage.setItem('ai-navi:navigator-state:v1', JSON.stringify({ version: 1, answers: {} }))
    localStorage.setItem('ai-navi:other:v1', 'remove')
    localStorage.setItem('unrelated-key', 'keep')

    resetNavigatorState()

    expect(localStorage.getItem('ai-navi:navigator-state:v1')).toBeNull()
    expect(localStorage.getItem('ai-navi:other:v1')).toBe('remove')
    expect(localStorage.getItem('unrelated-key')).toBe('keep')
  })
})
