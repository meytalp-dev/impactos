import { preparedRoutes } from '../data/routes'
import { aiTools } from '../data/tools'
import type { AITool, NavigatorAnswers, PreparedRoute, RouteStep } from './types'
import { isToolPermitted, scoreTool } from './scoring'
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

const routeOverlap = (route: PreparedRoute, answers: NavigatorAnswers) => {
  let score = 0
  if (answers.taskType && route.taskTypes.includes(answers.taskType)) score += 1
  if (answers.inputType && route.inputTypes.includes(answers.inputType)) score += 1
  if (answers.outputType === route.outputType) score += 1
  if (answers.context === route.context) score += 0.25
  const text = answers.taskText?.toLowerCase() ?? ''
  if (route.id === 'survey-to-insights' && /(survey|סקר|שאלון)/.test(text)) score += 1
  if (route.id === 'current-information-with-sources' && /(current|עדכני|מקור)/.test(text)) score += 1
  return score
}

const findTool = (id: string) => aiTools.find((tool) => tool.id === id)
const sortedByScore = (tools: AITool[], answers: NavigatorAnswers, role: string) =>
  tools.map((tool) => ({ tool, score: scoreTool(tool, answers, role) }))
    .filter(({ tool }) => isToolPermitted(tool, answers))
    .sort((left, right) => right.score.total - left.score.total || left.tool.id.localeCompare(right.tool.id))

const safeToolIds = (ids: string[], answers: NavigatorAnswers, role: string, used = new Set<string>()) => {
  const candidates = ids.map(findTool).filter((tool): tool is AITool => Boolean(tool))
  const first = sortedByScore(candidates, answers, role).find(({ tool }) => !used.has(tool.id))?.tool
  if (first) used.add(first.id)
  return first?.id
}

const toStep = (step: RouteStep, route: PreparedRoute, answers: NavigatorAnswers, used: Set<string>): RecommendedStep => {
  const primaryToolId = safeToolIds([...step.primaryToolIds, ...step.alternativeToolIds], answers, step.role, used)
  const alternativeToolIds = [...step.primaryToolIds, ...step.alternativeToolIds]
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
    input: answers.inputType ?? 'קלט שהמשתמש מספק',
    output: route.finalOutput,
    whatAiDoes: step.instruction,
    whatHumanDoes: 'מגדיר/ה הקשר, בוחן/ת את התוצר ומקבל/ת את ההחלטה הסופית.',
    whatToCheck: route.warning,
  }
}

const genericRoute = (answers: NavigatorAnswers): PreparedRoute => ({
  id: 'generic', title: 'מסלול כללי', inputTypes: [], taskTypes: [], outputType: answers.outputType ?? 'text', context: answers.context ?? 'general', audience: 'משתמשים בחינוך, ניהול, יזמות, שיווק ושימוש כללי.',
  steps: [
    { order: 1, title: 'הגדירו את המשימה', role: 'מנסח משימה', primaryToolIds: ['chatgpt'], alternativeToolIds: ['claude', 'gemini'], instruction: 'נסחו מטרה, קהל, קלט ותוצאה רצויה.' },
    { order: 2, title: 'הכינו תוצר ראשון', role: 'יוצר תוצר', primaryToolIds: familyToolIds(answers), alternativeToolIds: ['chatgpt', 'canva', 'lovable'], instruction: 'הכינו טיוטה ראשונית ובקשו חלופות.' },
  ],
  warning: 'בדקו דיוק, פרטיות והתאמה לקהל לפני שימוש בתוצר.', finalOutput: 'טיוטה ראשונית לבדיקת אדם.', starterPrompt: 'עזור/י לי להגדיר משימה, קהל, קלט ותוצר רצוי לפני יצירת טיוטה.',
})

function familyToolIds(answers: NavigatorAnswers): string[] {
  const family = answers.outputType === 'app' ? 'building-code' : answers.outputType === 'presentation' ? 'presentations-design' : answers.outputType === 'image' ? 'image' : answers.outputType === 'automation' ? 'automation-agents' : 'thinking-conversation'
  return aiTools.filter((tool) => tool.familyId === family).map((tool) => tool.id).slice(0, 3)
}

export function recommendRoute(answers: NavigatorAnswers): RecommendationResult {
  const rankedRoutes = preparedRoutes.map((route) => ({ route, overlap: routeOverlap(route, answers) }))
    .sort((left, right) => right.overlap - left.overlap)
  const selected = rankedRoutes[0]?.overlap > 0 ? rankedRoutes[0].route : genericRoute(answers)
  const used = new Set<string>()
  const steps = selected.steps.map((step) => toStep(step, selected, answers, used))
  const toolIds = steps.flatMap((step) => step.primaryToolId ? [step.primaryToolId] : []).slice(0, 4)
  const wantedOrganizationTool = selected.steps.flatMap((step) => [...step.primaryToolIds, ...step.alternativeToolIds]).map(findTool).some((tool) => tool?.privacyLevel === 'organizationOnly')
  const warnings = [selected.warning]
  if (answers.privacy === 'sensitive' || answers.privacy === 'internal' || answers.privacy === 'yes' || answers.privacy === 'unsure') warnings.push('מידע רגיש או לא ודאי: אל תעלו אותו לכלי ציבורי ללא אישור מדיניות הארגון.')
  if (answers.privacy === 'maybe') warnings.push('ייתכן שיש מידע רגיש: בדקו הרשאות ומדיניות ארגונית לפני העלאה.')
  if (wantedOrganizationTool) warnings.push('כלי ארגוני לא הוצג כהמלצה ציבורית; פנו למדיניות ולכלים המאושרים בארגון.')
  const alternatives = {
    fast: toolIds.slice(0, 2),
    professional: [...toolIds].reverse().slice(0, 2),
    budget: [...toolIds].filter((id) => ['free', 'freemium'].includes(findTool(id)?.pricingModel ?? '')).slice(0, 2),
  }
  const result: RecommendationResult = {
    routeId: selected.id,
    selectedRouteId: selected.id,
    taskSummary: answers.taskText?.trim() || `מסלול ${selected.title}: ${answers.inputType ?? 'קלט'} אל ${answers.outputType ?? selected.outputType}.`,
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
