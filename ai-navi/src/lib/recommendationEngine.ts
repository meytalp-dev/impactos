import { preparedRoutes } from '../data/routes'
import { aiTools } from '../data/tools'
import type { AITool, NavigatorAnswers, PreparedRoute, RouteStep } from './types'
import { hasStrictPrivacyRequirement, isToolPermitted, scoreTool } from './scoring'
import { buildPrompt } from './promptBuilder'

export interface RecommendedStep {
  role: string
  primaryToolId?: string
  alternativeToolIds: string[]
  whyFit: string
  input: string
  output: string
  whatAiDoes: string
  whatHumanDoes: string
  whatToCheck: string
}

export interface RecommendationResult {
  routeId: string
  selectedRouteId: string
  taskSummary: string
  steps: RecommendedStep[]
  toolIds: string[]
  recommendedToolIds: string[]
  alternatives: { fast: string[]; professional: string[]; budget: string[] }
  warnings: string[]
  humanChecks: string[]
  prompt: string
}

const selectedTaskTypes = (answers: NavigatorAnswers) =>
  [...new Set(answers.taskTypes?.length ? answers.taskTypes : answers.taskType ? [answers.taskType] : [])]
const selectedInputTypes = (answers: NavigatorAnswers) =>
  [...new Set(answers.inputTypes?.length ? answers.inputTypes : answers.inputType ? [answers.inputType] : [])]

const routeOverlap = (route: PreparedRoute, answers: NavigatorAnswers) =>
  selectedTaskTypes(answers).filter((taskType) => route.taskTypes.includes(taskType)).length
  + selectedInputTypes(answers).filter((inputType) => route.inputTypes.includes(inputType)).length
  + Number(Boolean(answers.outputType === route.outputType))

const findTool = (id: string) => aiTools.find((tool) => tool.id === id)
const uniqueIds = (ids: string[]) => [...new Set(ids)]
const sortedByScore = (tools: AITool[], answers: NavigatorAnswers, role: string) =>
  tools.map((tool) => ({ tool, score: scoreTool(tool, answers, role) }))
    .filter(({ tool }) => isToolPermitted(tool, answers))
    .sort((left, right) => right.score.total - left.score.total || left.tool.id.localeCompare(right.tool.id))

const safeToolIds = (ids: string[], answers: NavigatorAnswers, role: string, used = new Set<string>()) => {
  const candidates = uniqueIds(ids).map(findTool).filter((tool): tool is AITool => Boolean(tool))
  const first = sortedByScore(candidates, answers, role).find(({ tool }) => !used.has(tool.id))?.tool
  if (first) used.add(first.id)
  return first?.id
}

const toStep = (step: RouteStep, route: PreparedRoute, answers: NavigatorAnswers, used: Set<string>): RecommendedStep => {
  const primaryToolId = safeToolIds([...step.primaryToolIds, ...step.alternativeToolIds], answers, step.role, used)
  const alternativeToolIds = uniqueIds([...step.primaryToolIds, ...step.alternativeToolIds])
    .filter((id) => id !== primaryToolId)
    .map(findTool)
    .filter((tool): tool is AITool => tool !== undefined && isToolPermitted(tool, answers))
    .sort((left, right) => scoreTool(right, answers, step.role).total - scoreTool(left, answers, step.role).total || left.id.localeCompare(right.id))
    .map((tool) => tool.id)
  return {
    role: step.role,
    primaryToolId,
    alternativeToolIds,
    whyFit: `מתאים לשלב זה משום שהוא תומך ב${step.role} בהקשר שנבחר; זו התאמה למשימה ולא דירוג כללי.`,
    input: selectedInputTypes(answers).join(', ') || 'קלט שהמשתמש מספק',
    output: route.finalOutput,
    whatAiDoes: step.instruction,
    whatHumanDoes: 'מגדיר/ה הקשר, בוחן/ת את התוצר ומקבל/ת את ההחלטה הסופית.',
    whatToCheck: route.warning,
  }
}

const genericRoute = (answers: NavigatorAnswers): PreparedRoute => {
  const ranked = sortedByScore(aiTools, answers, 'generic stage').map(({ tool }) => tool)
  const first = ranked[0]
  const second = ranked.find((tool) => tool.familyId !== first?.familyId) ?? ranked[1]
  const remaining = ranked.filter((tool) => tool.id !== first?.id && tool.id !== second?.id)

  return {
    id: 'generic', title: 'מסלול כללי', inputTypes: [], taskTypes: [], outputType: answers.outputType ?? 'text', context: answers.context ?? 'general', audience: 'משתמשים בחינוך, ניהול, יזמות, שיווק ושימוש כללי.',
    steps: [
      { order: 1, title: 'התחילו בכלי המתאים ביותר', role: 'מוביל שלב ראשון', primaryToolIds: first ? [first.id] : [], alternativeToolIds: remaining.slice(0, 2).map((tool) => tool.id), instruction: 'הגדירו מטרה, קהל, קלט ותוצאה רצויה.' },
      { order: 2, title: 'צרו תוצר ראשון', role: 'יוצר תוצר', primaryToolIds: second ? [second.id] : [], alternativeToolIds: remaining.slice(2, 4).map((tool) => tool.id), instruction: 'הכינו טיוטה ראשונית ובקשו חלופות.' },
    ],
    warning: 'בדקו דיוק, פרטיות והתאמה לקהל לפני שימוש בתוצר.', finalOutput: 'טיוטה ראשונית לבדיקת אדם.', starterPrompt: 'עזור/י לי להגדיר משימה, קהל, קלט ותוצר רצוי לפני יצירת טיוטה.',
  }
}

const withPriority = (answers: NavigatorAnswers, priority: NavigatorAnswers['priority']): NavigatorAnswers => ({
  ...answers,
  priority,
  priorities: [...new Set([...(answers.priorities ?? []), priority].filter((value): value is NonNullable<NavigatorAnswers['priority']> => Boolean(value)))],
})

const selectAlternativeTools = (
  answers: NavigatorAnswers,
  used: Set<string>,
  strategy: 'fast' | 'professional' | 'budget',
) => {
  const strategyAnswers = strategy === 'fast' ? withPriority(answers, 'speed') : strategy === 'budget' ? withPriority(answers, 'price') : withPriority(answers, 'quality')
  return sortedByScore(aiTools, strategyAnswers, `${strategy} alternative`)
    .filter(({ tool }) => !used.has(tool.id))
    .sort((left, right) => {
      if (strategy === 'budget') {
        const leftBudget = left.tool.pricingModel === 'free' ? 0 : left.tool.pricingModel === 'freemium' ? 1 : 2
        const rightBudget = right.tool.pricingModel === 'free' ? 0 : right.tool.pricingModel === 'freemium' ? 1 : 2
        if (leftBudget !== rightBudget) return leftBudget - rightBudget
      }
      if (strategy === 'professional') {
        const leftSpecialized = left.tool.familyId === 'thinking-conversation' ? 1 : 0
        const rightSpecialized = right.tool.familyId === 'thinking-conversation' ? 1 : 0
        if (leftSpecialized !== rightSpecialized) return leftSpecialized - rightSpecialized
      }
      return right.score.total - left.score.total || left.tool.id.localeCompare(right.tool.id)
    })
    .reduce<string[]>((selected, { tool }) => {
      if (selected.length >= 2 || used.has(tool.id)) return selected
      used.add(tool.id)
      selected.push(tool.id)
      return selected
    }, [])
}

export function recommendRoute(answers: NavigatorAnswers): RecommendationResult {
  const rankedRoutes = preparedRoutes.map((route) => ({ route, overlap: routeOverlap(route, answers) }))
    .sort((left, right) => right.overlap - left.overlap)
  const selected = rankedRoutes[0]?.overlap > 0 ? rankedRoutes[0].route : genericRoute(answers)
  const used = new Set<string>()
  const steps = selected.steps.map((step) => toStep(step, selected, answers, used))
  const toolIds = uniqueIds(steps.flatMap((step) => step.primaryToolId ? [step.primaryToolId] : [])).slice(0, 4)
  const wantedOrganizationTool = selected.steps.flatMap((step) => [...step.primaryToolIds, ...step.alternativeToolIds]).map(findTool).some((tool) => tool?.privacyLevel === 'organizationOnly')
  const warnings = [selected.warning]
  if (hasStrictPrivacyRequirement(answers.privacy)) warnings.push('מידע רגיש או לא ודאי: אל תעלו אותו לכלי ציבורי ללא אישור מדיניות הארגון.')
  if (wantedOrganizationTool) warnings.push('כלי ארגוני לא הוצג כהמלצה ציבורית; פנו למדיניות ולכלים המאושרים בארגון.')
  const alternativeUsed = new Set(toolIds)
  const alternatives = {
    fast: selectAlternativeTools(answers, alternativeUsed, 'fast'),
    professional: selectAlternativeTools(answers, alternativeUsed, 'professional'),
    budget: selectAlternativeTools(answers, alternativeUsed, 'budget'),
  }
  const result: RecommendationResult = {
    routeId: selected.id,
    selectedRouteId: selected.id,
    taskSummary: answers.taskText?.trim() || `מסלול ${selected.title}: ${selectedInputTypes(answers).join(', ') || 'קלט'} אל ${answers.outputType ?? selected.outputType}.`,
    steps,
    toolIds,
    recommendedToolIds: toolIds,
    alternatives,
    warnings,
    humanChecks: ['בדקו דיוק ועקביות מול הקלט המקורי.', 'בדקו התאמה לקהל, לזכויות ולמדיניות הפרטיות.'],
    prompt: '',
  }
  result.prompt = buildPrompt(answers, result)
  return result
}
