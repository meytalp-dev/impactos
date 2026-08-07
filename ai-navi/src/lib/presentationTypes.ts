export type SlideLayout =
  | 'cover'
  | 'statement'
  | 'comparison'
  | 'map'
  | 'activity'
  | 'demo'
  | 'families'
  | 'summary'

export type SlideDefinition = {
  id: string
  section: string
  title: string
  duration: number
  layout: SlideLayout
  eyebrow?: string
  body?: string
  bullets?: string[]
  speakerNotes: string[]
  interaction?: string
  revealSteps?: string[]
  visual?: Record<string, unknown>
}

export function clampSlideIndex(index: number, slideCount: number): number {
  if (!Number.isFinite(index) || slideCount <= 0) return 0
  return Math.min(Math.max(Math.trunc(index), 0), slideCount - 1)
}

export function clampRevealIndex(index: number, revealCount: number): number {
  if (!Number.isFinite(index) || revealCount <= 0) return 0
  return Math.min(Math.max(Math.trunc(index), 0), revealCount)
}
