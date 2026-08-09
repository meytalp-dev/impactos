import type { AITool, Difficulty, InputType, NavigatorAnswers, OutputType, Priority, TaskType, ToolFamilyId } from './types'
import { getSelectedInputTypes } from './inputLabels'

export interface ScoreReason {
  name: string
  points: number
}

export interface ScoreBreakdown {
  toolId: string
  total: number
  reasons: ScoreReason[]
}

interface ToolProfile {
  taskTypes: TaskType[]
  inputTypes: InputType[]
  outputTypes: OutputType[]
  difficulty: Difficulty
  generalPurpose: boolean
}

const profiles: Record<ToolFamilyId, ToolProfile> = {
  'thinking-conversation': { taskTypes: ['brainstorm', 'write', 'summarize', 'analyze', 'research'], inputTypes: ['idea', 'text', 'documents'], outputTypes: ['text', 'document', 'report'], difficulty: 'beginner', generalPurpose: true },
  'research-sources': { taskTypes: ['research', 'summarize'], inputTypes: ['idea', 'text', 'web-links'], outputTypes: ['report', 'document', 'text'], difficulty: 'beginner', generalPurpose: false },
  'documents-knowledge': { taskTypes: ['summarize', 'research', 'write'], inputTypes: ['documents', 'text'], outputTypes: ['document', 'report', 'text'], difficulty: 'beginner', generalPurpose: false },
  'presentations-design': { taskTypes: ['present', 'design'], inputTypes: ['idea', 'text', 'documents', 'data'], outputTypes: ['presentation', 'image', 'document'], difficulty: 'beginner', generalPurpose: false },
  image: { taskTypes: ['create-image', 'design'], inputTypes: ['idea', 'text', 'image'], outputTypes: ['image'], difficulty: 'intermediate', generalPurpose: false },
  'video-audio': { taskTypes: ['create-video', 'transcribe'], inputTypes: ['idea', 'text', 'audio', 'video'], outputTypes: ['video', 'audio', 'document'], difficulty: 'intermediate', generalPurpose: false },
  data: { taskTypes: ['analyze', 'summarize'], inputTypes: ['data', 'documents'], outputTypes: ['report', 'document'], difficulty: 'intermediate', generalPurpose: false },
  'building-code': { taskTypes: ['build', 'design'], inputTypes: ['idea', 'text'], outputTypes: ['app'], difficulty: 'intermediate', generalPurpose: false },
  'automation-agents': { taskTypes: ['automate', 'analyze'], inputTypes: ['text', 'documents', 'data'], outputTypes: ['automation'], difficulty: 'intermediate', generalPurpose: false },
}

export const hasStrictPrivacyRequirement = (privacy: NavigatorAnswers['privacy']) =>
  privacy === 'internal' || privacy === 'sensitive' || privacy === 'yes' || privacy === 'unsure' || privacy === 'maybe'

export const isToolPermitted = (tool: AITool, answers: NavigatorAnswers) =>
  tool.privacyLevel !== 'organizationOnly' && !(hasStrictPrivacyRequirement(answers.privacy) && tool.privacyLevel === 'caution')

export function scoreTool(tool: AITool, answers: NavigatorAnswers, role: string): ScoreBreakdown {
  const profile = profiles[tool.familyId]
  const taskTypes = tool.taskTypes ?? profile.taskTypes
  const inputTypes = tool.inputTypes ?? profile.inputTypes
  const outputTypes = tool.outputTypes ?? profile.outputTypes
  const difficulty = tool.difficulty ?? profile.difficulty
  const generalPurpose = tool.generalPurpose ?? profile.generalPurpose
  const priorities = [...new Set([...(answers.priorities ?? []), ...(answers.priority ? [answers.priority] : [])])]
  const selectedTaskTypes = [...new Set(answers.taskTypes?.length ? answers.taskTypes : answers.taskType ? [answers.taskType] : [])]
  const selectedInputTypes = getSelectedInputTypes(answers)
  const reasons: ScoreReason[] = []
  const add = (name: string, points: number) => reasons.push({ name, points })

  for (const taskType of selectedTaskTypes) {
    if (taskTypes.includes(taskType)) add(`task match: ${taskType}`, 5)
  }
  for (const inputType of selectedInputTypes) {
    if (inputTypes.includes(inputType)) add(`input match: ${inputType}`, 4)
  }
  if (answers.outputType && outputTypes.includes(answers.outputType)) add('output match', 5)

  const keywords = [...(tool.roleKeywords ?? []), ...tool.tags, tool.name, tool.description].map((value) => value.toLowerCase())
  const roleWords = role.toLowerCase().split(/[\s,./־-]+/).filter((word) => word.length > 1)
  if (roleWords.some((word) => keywords.some((keyword) => keyword.includes(word)))) add('role keyword', 2)

  for (const priority of priorities) {
    if (tool.strengths?.includes(priority)) add(`strength: ${priority}`, 3)
  }
  if (priorities.includes('price')) {
    if (tool.pricingModel === 'free') add('free price', 3)
    else if (tool.pricingModel === 'freemium') add('freemium price', 1)
  }
  if ((priorities.includes('ease') || answers.difficulty === 'beginner') && difficulty === 'beginner') add('beginner fit', 3)
  if ((priorities.includes('speed') || answers.timeAvailable === 'under-10-minutes') && (difficulty === 'beginner' || generalPurpose)) add('speed fit', 2)
  if (answers.difficulty === 'beginner' && difficulty === 'advanced') add('advanced difficulty mismatch', -6)
  if (answers.difficulty === 'intermediate' && difficulty === 'advanced') add('advanced difficulty mismatch', -2)
  if (tool.hebrewSupport === true) add('Hebrew support', 2)
  if (tool.hebrewSupport === false) add('no Hebrew support', -3)
  if (answers.privacy === 'maybe' && tool.privacyLevel === 'caution') add('privacy uncertainty', -5)
  if (!isToolPermitted(tool, answers)) add('privacy policy blocks public recommendation', -1000)

  return { toolId: tool.id, total: reasons.reduce((total, reason) => total + reason.points, 0), reasons }
}
