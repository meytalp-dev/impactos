import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadNavigatorState, resetNavigatorState, saveNavigatorState } from '../lib/storage'

describe('navigator storage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

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

  it('fails closed without throwing when browser storage is unavailable', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })

    expect(() => saveNavigatorState({ version: 1, answers: {} })).not.toThrow()
    expect(() => resetNavigatorState()).not.toThrow()
    expect(loadNavigatorState()).toBeNull()
  })

  it('does not crash when storage writes or removals are rejected', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
    expect(() => saveNavigatorState({ version: 1, answers: {} })).not.toThrow()
    vi.restoreAllMocks()

    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked') })
    expect(() => resetNavigatorState()).not.toThrow()
  })
})
