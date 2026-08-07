export type SlideLayout =
  | 'cover'
  | 'statement'
  | 'comparison'
  | 'map'
  | 'activity'
  | 'demo'
  | 'families'
  | 'summary'

export type SlideVariant =
  | 'route-map'
  | 'tool-overload'
  | 'problem'
  | 'route-comparison'
  | 'junction-map'
  | 'standard'

type SlideBase = {
  id: string
  section: string
  title: string
  duration: number
  eyebrow?: string
  body?: string
  bullets?: string[]
  speakerNotes: string[]
  interaction?: string
  revealSteps?: string[]
  visual?: Record<string, unknown>
}

export type SlideDefinition =
  | (SlideBase & { layout: 'cover'; variant: 'route-map' })
  | (SlideBase & { layout: 'statement'; variant: 'tool-overload' | 'problem' })
  | (SlideBase & { layout: 'comparison'; variant: 'route-comparison' })
  | (SlideBase & { layout: 'map'; variant: 'junction-map' })
  | (SlideBase & { layout: 'activity' | 'demo' | 'families' | 'summary'; variant: 'standard' })

export function clampSlideIndex(index: number, slideCount: number): number {
  if (!Number.isFinite(index) || slideCount <= 0) return 0
  return Math.min(Math.max(Math.trunc(index), 0), slideCount - 1)
}

export function clampRevealIndex(index: number, revealCount: number): number {
  if (!Number.isFinite(index) || revealCount <= 0) return 0
  return Math.min(Math.max(Math.trunc(index), 0), revealCount)
}
