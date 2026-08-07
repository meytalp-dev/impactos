import type { TaskExample } from '../lib/types'

export const taskExamples: TaskExample[] = [
  { id: 'lesson-plan', context: 'education', title: 'תכנון שיעור', description: 'הפיכת נושא לפעילות למידה מותאמת.', routeId: 'topic-to-lesson' },
  { id: 'leadership-report', context: 'management', title: 'דוח הנהלה', description: 'הצגת תובנות והחלטות מתוך נתונים.', routeId: 'data-to-management-report' },
  { id: 'product-prototype', context: 'entrepreneurship', title: 'אב־טיפוס למוצר', description: 'בדיקת רעיון עם מסך ראשון ומשתמשים.', routeId: 'idea-to-app' },
  { id: 'campaign-post', context: 'marketing', title: 'פוסט לקמפיין', description: 'ניסוח מסר ותמונה תומכת לפרסום.', routeId: 'idea-to-post' },
  { id: 'community-survey-insights', context: 'social-organizations', title: 'תובנות ממשוב קהילתי', description: 'הפיכת שאלון משוב של קהילה לתובנות ולצעדי המשך.', routeId: 'survey-to-insights' },
  { id: 'research-summary', context: 'general', title: 'סיכום מידע', description: 'איסוף מקורות ותקציר לצורך אישי או מקצועי.', routeId: 'current-information-with-sources' },
]
