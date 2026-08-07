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

export type InputType = 'idea' | 'text' | 'documents' | 'data' | 'image' | 'audio' | 'video' | 'web-links'

export type OutputType =
  | 'text'
  | 'document'
  | 'presentation'
  | 'image'
  | 'video'
  | 'audio'
  | 'report'
  | 'app'
  | 'automation'

export type Priority = 'speed' | 'quality' | 'creativity' | 'control' | 'privacy'
export type PrivacyAnswer = 'public' | 'internal' | 'sensitive'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced'
export type PricingModel = 'free' | 'freemium' | 'paid'
export type AudienceContext = 'education' | 'management' | 'entrepreneurship' | 'marketing' | 'general'

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
  inputType?: InputType
  outputType?: OutputType
  priority?: Priority
  privacy?: PrivacyAnswer
  difficulty?: Difficulty
  context?: AudienceContext
}

export interface TaskExample {
  id: string
  context: AudienceContext
  title: string
  description: string
  routeId: string
}
