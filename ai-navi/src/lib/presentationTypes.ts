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
  | 'option-cloud'
  | 'role-modes'
  | 'route-kinds'
  | 'route-plan'
  | 'choice-grid'
  | 'family-map'
  | 'family-group'
  | 'navigator'
  | 'takeaways'

export type SlideInteraction = 'choice-game' | 'missing-step' | 'privacy-game' | 'budget-game'

export type LabeledItem = {
  label: string
  detail?: string
  meta?: string
}

export type RouteStep = {
  label: string
  detail?: string
}

export type FamilyItem = {
  name: string
  use: string
  line: 'blue' | 'peach' | 'sage'
}

export type AudienceExample = {
  audience: string
  task: string
}

export type RouteMapVisual = { kind: 'route-map'; routes: string[] }
export type ToolOverloadVisual = { kind: 'tool-overload'; tools: string[] }
export type RouteComparisonVisual = { kind: 'route-comparison'; waze: string[]; aiNavi: string[] }
export type OptionCloudVisual = {
  kind: 'option-cloud'
  items: LabeledItem[]
  example?: string
  instruction?: string
  message?: string
}
export type RoleModesVisual = { kind: 'role-modes'; items: LabeledItem[]; message?: string }
export type RoutePlanVisual = { kind: 'route-plan'; steps: RouteStep[]; outcome?: string; tradeoff?: string }
export type ChoiceGridVisual = {
  kind: 'choice-grid'
  prompt: string
  choices: LabeledItem[]
  answer: string
  footer?: string
}
export type FamilyMapVisual = { kind: 'family-map'; families: FamilyItem[]; message?: string }
export type NavigatorVisual = { kind: 'navigator'; questions: string[]; examples: AudienceExample[] }
export type TakeawaysVisual = { kind: 'takeaways'; keyPhrases: string[]; takeaways: string[]; cta: string; href: string }

type SlideBase = {
  id: string
  section: string
  title: string
  duration: number
  eyebrow?: string
  body?: string
  bullets?: string[]
  speakerNotes: string[]
  interaction?: SlideInteraction
  interactionPrompt?: string
  revealSteps?: string[]
}

export type SlideDefinition =
  | (SlideBase & { layout: 'cover'; variant: 'route-map'; visual: RouteMapVisual })
  | (SlideBase & { layout: 'statement'; variant: 'tool-overload'; visual: ToolOverloadVisual })
  | (SlideBase & { layout: 'statement'; variant: 'problem' })
  | (SlideBase & { layout: 'comparison'; variant: 'route-comparison'; visual: RouteComparisonVisual })
  | (SlideBase & { layout: 'map'; variant: 'junction-map' })
  | (SlideBase & { layout: 'map'; variant: 'option-cloud'; visual: OptionCloudVisual })
  | (SlideBase & { layout: 'comparison'; variant: 'role-modes' | 'route-kinds'; visual: RoleModesVisual })
  | (SlideBase & { layout: 'demo'; variant: 'route-plan'; visual: RoutePlanVisual })
  | (SlideBase & { layout: 'activity'; variant: 'choice-grid'; interaction: SlideInteraction; visual: ChoiceGridVisual })
  | (SlideBase & { layout: 'families'; variant: 'family-map' | 'family-group'; visual: FamilyMapVisual })
  | (SlideBase & { layout: 'summary'; variant: 'navigator'; visual: NavigatorVisual })
  | (SlideBase & { layout: 'summary'; variant: 'takeaways'; visual: TakeawaysVisual })

export function clampSlideIndex(index: number, slideCount: number): number {
  if (!Number.isFinite(index) || slideCount <= 0) return 0
  return Math.min(Math.max(Math.trunc(index), 0), slideCount - 1)
}

export function clampRevealIndex(index: number, revealCount: number): number {
  if (!Number.isFinite(index) || revealCount <= 0) return 0
  return Math.min(Math.max(Math.trunc(index), 0), revealCount)
}
