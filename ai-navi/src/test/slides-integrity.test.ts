import { describe, expect, it } from 'vitest'
import { slides } from '../data/slides'

const expectedSequence = [
  ['cover', 75],
  ['tool-overload', 75],
  ['real-problem', 75],
  ['waze-metaphor', 75],
  ['six-junctions', 75],
  ['junction-task', 90],
  ['junction-input', 90],
  ['junction-output', 90],
  ['junction-priorities', 120],
  ['junction-involvement', 90],
  ['junction-route-kind', 90],
  ['demo-task', 90],
  ['demo-junctions', 120],
  ['demo-fast-route', 120],
  ['demo-professional-route', 120],
  ['demo-advanced-route', 120],
  ['game-choose-route', 210],
  ['game-missing-step', 180],
  ['game-sensitive', 240],
  ['game-budget', 270],
  ['families-map', 120],
  ['families-1-3', 150],
  ['families-4-6', 150],
  ['families-7-9', 180],
  ['navigator-walkthrough', 300],
  ['summary', 300],
] as const

function visibleDeckCopy(): string {
  return JSON.stringify(slides.map(({ speakerNotes: _speakerNotes, ...slide }) => slide))
}

describe('sixty-minute AI NAVI deck integrity', () => {
  it('keeps the exact unique 26-slide sequence and 60:15 running time', () => {
    expect(slides.map(({ id, duration }) => [id, duration])).toEqual(expectedSequence)
    expect(new Set(slides.map(({ id }) => id)).size).toBe(26)
    expect(slides.reduce((total, slide) => total + slide.duration, 0)).toBe(3615)
  })

  it('gives every slide two to five useful presenter notes', () => {
    for (const slide of slides) {
      expect(slide.speakerNotes.length, slide.id).toBeGreaterThanOrEqual(2)
      expect(slide.speakerNotes.length, slide.id).toBeLessThanOrEqual(5)
      expect(slide.speakerNotes.every((note) => note.trim().length > 0), slide.id).toBe(true)
    }
  })

  it('marks the four audience activities with their exact interaction kinds', () => {
    expect(slides.filter(({ interaction }) => interaction).map(({ id, interaction }) => [id, interaction])).toEqual([
      ['game-choose-route', 'choice-game'],
      ['game-missing-step', 'missing-step'],
      ['game-sensitive', 'privacy-game'],
      ['game-budget', 'budget-game'],
    ])
  })

  it('keeps the decision messages and responsible-use guardrails visible', () => {
    const copy = visibleDeckCopy()
    for (const phrase of [
      'אותה משימה עם חומר גלם שונה עשויה לדרוש כלי אחר',
      'בוחרים רק שניים',
      'מתקדם הוא לא תמיד נכון',
      'המדיניות הארגונית קודמת לכל המלצה',
      'ביקורת אנושית אינה שלב אופציונלי',
      'מה המשימה שלך היום?',
    ]) {
      expect(copy, phrase).toContain(phrase)
    }
  })

  it('covers all nine tool families without turning the deck into a brand wall', () => {
    const copy = visibleDeckCopy()
    for (const family of [
      'חשיבה ושיחה',
      'מחקר ומקורות',
      'מסמכים וידע ארגוני',
      'מצגות ועיצוב',
      'תמונה',
      'וידאו ואודיו',
      'נתונים',
      'בנייה וקוד',
      'אוטומציה וסוכנים',
    ]) {
      expect(copy, family).toContain(family)
    }
    expect(copy).not.toContain('קיר לוגואים')
  })

  it('shows examples for education, management, entrepreneurship, marketing, and general use', () => {
    const copy = visibleDeckCopy()
    for (const context of ['חינוך', 'ניהול', 'יזמות', 'שיווק', 'שימוש כללי']) {
      expect(copy, context).toContain(context)
    }
  })
})
