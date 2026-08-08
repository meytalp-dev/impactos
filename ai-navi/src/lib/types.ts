export type ToolFamilyId =
  | 'thinking-conversation'
  | 'research-sources'
  | 'documents-knowledge'
  | 'presentations-design'
  | 'image'
  | 'video-audio'
  | 'data'
  | 'building-code'
  | 'automation-agents'

export type TaskType =
  | 'brainstorm'
  | 'write'
  | 'research'
  | 'summarize'
  | 'analyze'
  | 'design'
  | 'present'
  | 'create-image'
  | 'create-video'
  | 'transcribe'
  | 'build'
  | 'automate'

export type InputType =
  | 'none'
  | 'idea'
  | 'short-text'
  | 'text'
  | 'document'
  | 'documents'
  | 'data'
  | 'image'
  | 'audio'
  | 'video'
  | 'web-links'

export type OutputType =
  | 'text'
  | 'answer'
  | 'document'
  | 'presentation'
  | 'image'
  | 'video'
  | 'audio'
  | 'report'
  | 'table'
  | 'website'
  | 'app'
  | 'process'
  | 'automation'

export type Priority = 'speed' | 'quality' | 'accuracy' | 'sources' | 'design' | 'creativity' | 'control' | 'privacy' | 'price' | 'ease'
export type PrivacyAnswer = 'public' | 'internal' | 'sensitive' | 'no' | 'yes' | 'unsure' | 'maybe'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type TimeAvailable = 'under-10-minutes' | 'under-one-hour' | 'several-hours' | 'one-day-or-more' | 'more-than-10-minutes'
export type PricingModel = 'free' | 'freemium' | 'paid'
export type AudienceContext = 'education' | 'management' | 'entrepreneurship' | 'marketing' | 'social-organizations' | 'general'

export interface ToolFamily {
  id: ToolFamilyId
  title: string
  description: string
}

export interface AITool {
  id: string
  name: string
  familyId: ToolFamilyId
  description: string
  pricingModel: PricingModel
  lastReviewed: string
  caution: string
  tags: string[]
  taskTypes?: TaskType[]
  inputTypes?: InputType[]
  outputTypes?: OutputType[]
  strengths?: Priority[]
  difficulty?: Difficulty
  generalPurpose?: boolean
  hebrewSupport?: boolean
  privacyLevel?: 'standard' | 'caution' | 'organizationOnly'
  roleKeywords?: string[]
}

export interface RouteStep {
  order: number
  title: string
  role: string
  primaryToolIds: string[]
  alternativeToolIds: string[]
  instruction: string
}

export interface PreparedRoute {
  id: string
  title: string
  inputTypes: InputType[]
  taskTypes: TaskType[]
  outputType: OutputType
  context: AudienceContext
  audience: string
  steps: RouteStep[]
  warning: string
  finalOutput: string
  starterPrompt: string
}

export interface NavigatorAnswers {
  taskType?: TaskType
  taskTypes?: TaskType[]
  inputType?: InputType
  inputTypes?: InputType[]
  outputType?: OutputType
  priority?: Priority
  privacy?: PrivacyAnswer
  difficulty?: Difficulty
  context?: AudienceContext
  taskText?: string
  audience?: string
  priorities?: Priority[]
  timeAvailable?: TimeAvailable
}

export interface PersistedNavigatorState {
  version: 1
  answers: NavigatorAnswers
  mode?: 'intro' | 'questions' | 'privacy-gate'
  currentStep?: number
  taskText?: string
  privacyConfirmed?: boolean
  complete?: boolean
}

export interface TaskExample {
  id: string
  context: AudienceContext
  title: string
  description: string
  routeId: string
}
