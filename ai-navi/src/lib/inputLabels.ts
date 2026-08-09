import type { InputType, NavigatorAnswers } from './types'

export const inputTypeLabels: Record<InputType, string> = {
  none: 'אין חומר גלם',
  idea: 'רעיון',
  'short-text': 'טקסט קצר',
  text: 'טקסט',
  document: 'מסמך',
  documents: 'כמה מסמכים',
  data: 'נתונים',
  image: 'תמונה',
  audio: 'אודיו',
  video: 'וידאו',
  'web-links': 'קישורים או אתרים',
}

const inputOrder = Object.keys(inputTypeLabels) as InputType[]

export function getSelectedInputTypes(answers: NavigatorAnswers): InputType[] {
  const selected = new Set(answers.inputTypes?.length ? answers.inputTypes : answers.inputType ? [answers.inputType] : [])
  return inputOrder.filter((inputType) => selected.has(inputType))
}

export function formatSelectedInputs(answers: NavigatorAnswers, fallback = 'לא צוין'): string {
  const labels = getSelectedInputTypes(answers).map((inputType) => inputTypeLabels[inputType])
  if (!labels.length) return fallback
  if (labels.length === 1) return labels[0]
  return `${labels.slice(0, -1).join(', ')} ו${labels.at(-1)}`
}
