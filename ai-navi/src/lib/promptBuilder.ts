import type { NavigatorAnswers } from './types'
import type { RecommendationResult } from './recommendationEngine'
import { audienceContextLabels } from './context'
import { formatSelectedInputs } from './inputLabels'

export function buildPrompt(answers: NavigatorAnswers, result: RecommendationResult): string {
  const priorities = [...new Set([...(answers.priorities ?? []), ...(answers.priority ? [answers.priority] : [])])].slice(0, 2)
  const checks = ['איכות: ודא/י דיוק, עקביות והתאמה לקהל.']
  if (answers.taskType === 'research' || answers.taskTypes?.includes('research') || result.routeId === 'current-information-with-sources') checks.push('מקורות: צרף/י מקורות ראשוניים, קישורים ותאריכים לבדיקה.')
  if (answers.privacy && answers.privacy !== 'public') checks.push('פרטיות: אל תכלול/י מידע רגיש ללא אישור מדיניות הארגון.')
  return [
    `משימה: ${answers.taskText?.trim() || result.taskSummary}`,
    `הקשר: ${answers.context ? audienceContextLabels[answers.context] : 'שימוש כללי'}; קהל: ${answers.audience?.trim() || 'קהל היעד שנבחר'}`,
    `קלט: ${formatSelectedInputs(answers)}; פלט רצוי: ${answers.outputType ?? 'לא צוין'}.`,
    `עדיפויות: ${priorities.length ? priorities.join(', ') : 'איכות ובהירות'}.`,
    ...checks,
  ].join('\n')
}
