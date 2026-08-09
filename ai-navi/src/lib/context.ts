import type { AudienceContext } from './types'

export const audienceContextLabels: Record<AudienceContext, string> = {
  education: 'חינוך',
  management: 'ניהול',
  entrepreneurship: 'יזמות',
  marketing: 'שיווק',
  'social-organizations': 'ארגונים חברתיים',
  general: 'שימוש כללי',
}

export function isAudienceContext(value: unknown): value is AudienceContext {
  return typeof value === 'string' && Object.hasOwn(audienceContextLabels, value)
}
