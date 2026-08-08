import type { Difficulty, InputType, OutputType, PrivacyAnswer, Priority, TaskType, TimeAvailable } from '../lib/types'

export type NavigatorQuestionId = 'taskTypes' | 'inputTypes' | 'outputType' | 'priorities' | 'timeAvailable' | 'difficulty' | 'privacy'

export type NavigatorOptionValue = TaskType | InputType | OutputType | Priority | TimeAvailable | Difficulty | PrivacyAnswer

export interface NavigatorQuestion {
  id: NavigatorQuestionId
  progressLabel: string
  title: string
  reason: string
  selection: 'single' | 'multiple'
  maxSelections?: number
  options: { value: NavigatorOptionValue; label: string }[]
}

export const navigatorQuestions: NavigatorQuestion[] = [
  {
    id: 'taskTypes', progressLabel: 'סוג המשימה', title: 'מה סוג המשימה?', selection: 'multiple',
    reason: 'סוג המשימה עוזר להתאים דרך עבודה — מתכנון וניהול ועד יזמות, שיווק ושימוש כללי.',
    options: [
      { value: 'brainstorm', label: 'חשיבה ותכנון' }, { value: 'research', label: 'מחקר' },
      { value: 'write', label: 'כתיבה' }, { value: 'analyze', label: 'ניתוח' }, { value: 'design', label: 'עיצוב' },
      { value: 'create-image', label: 'תמונה' }, { value: 'create-video', label: 'וידאו או אודיו' },
      { value: 'present', label: 'מצגת' }, { value: 'build', label: 'בניית אפליקציה' }, { value: 'automate', label: 'אוטומציה' },
    ],
  },
  {
    id: 'inputTypes', progressLabel: 'חומר גלם', title: 'איזה חומר גלם כבר יש לך?', selection: 'multiple',
    reason: 'חומר הגלם קובע אם כדאי להתחיל מאפס, לארגן מידע קיים או לנתח נתונים.',
    options: [
      { value: 'none', label: 'אין לי חומר גלם' }, { value: 'idea', label: 'רעיון' }, { value: 'short-text', label: 'טקסט קצר' },
      { value: 'document', label: 'מסמך' }, { value: 'documents', label: 'כמה מסמכים' }, { value: 'data', label: 'נתונים' },
      { value: 'image', label: 'תמונה' }, { value: 'audio', label: 'אודיו' }, { value: 'video', label: 'וידאו' },
      { value: 'web-links', label: 'קישורים או אתרים' },
    ],
  },
  {
    id: 'outputType', progressLabel: 'תוצר', title: 'איזה תוצר תרצי לקבל?', selection: 'single',
    reason: 'התוצר הרצוי ממקד את המסלול ומונע בחירה בכלי שלא מתאים לסיום העבודה.',
    options: [
      { value: 'answer', label: 'תשובה' }, { value: 'document', label: 'מסמך' }, { value: 'presentation', label: 'מצגת' },
      { value: 'image', label: 'תמונה' }, { value: 'video', label: 'וידאו' }, { value: 'audio', label: 'אודיו' },
      { value: 'table', label: 'טבלה' }, { value: 'report', label: 'דוח' }, { value: 'website', label: 'אתר' },
      { value: 'app', label: 'אפליקציה' }, { value: 'process', label: 'תהליך אוטומטי' },
    ],
  },
  {
    id: 'priorities', progressLabel: 'עדיפויות', title: 'מה הכי חשוב לך?', selection: 'multiple', maxSelections: 2,
    reason: 'עד שתי עדיפויות עוזרות לאזן בין מהירות, איכות, עלות, פרטיות ושליטה.',
    options: [
      { value: 'speed', label: 'מהירות' }, { value: 'quality', label: 'איכות' }, { value: 'accuracy', label: 'דיוק' },
      { value: 'sources', label: 'מקורות' }, { value: 'design', label: 'עיצוב' }, { value: 'ease', label: 'קלות' },
      { value: 'price', label: 'מחיר' }, { value: 'privacy', label: 'פרטיות' }, { value: 'control', label: 'שליטה' },
    ],
  },
  {
    id: 'timeAvailable', progressLabel: 'זמן', title: 'כמה זמן יש לך?', selection: 'single',
    reason: 'הזמן הזמין משפיע על מספר השלבים ועל עומק הבדיקה שכדאי לתכנן.',
    options: [
      { value: 'under-10-minutes', label: 'עד 10 דקות' }, { value: 'under-one-hour', label: 'עד שעה' },
      { value: 'several-hours', label: 'כמה שעות' }, { value: 'one-day-or-more', label: 'יום או יותר' },
    ],
  },
  {
    id: 'difficulty', progressLabel: 'ניסיון', title: 'מה רמת הניסיון שלך?', selection: 'single',
    reason: 'רמת הניסיון עוזרת להציע מסלול ברור בלי להעמיס צעדים טכניים מיותרים.',
    options: [
      { value: 'beginner', label: 'מתחילה' }, { value: 'intermediate', label: 'בינונית' }, { value: 'advanced', label: 'מתקדמת' },
    ],
  },
  {
    id: 'privacy', progressLabel: 'פרטיות', title: 'האם יש במשימה מידע אישי או רגיש?', selection: 'single',
    reason: 'הפרטיות קובעת אילו חומרים מותר לשתף ואילו אישורים צריך לפני העלאה לכלי.',
    options: [
      { value: 'no', label: 'לא' }, { value: 'maybe', label: 'אולי' }, { value: 'yes', label: 'כן' }, { value: 'unsure', label: 'לא בטוחה' },
    ],
  },
]
