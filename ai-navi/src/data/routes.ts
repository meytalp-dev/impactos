import type { PreparedRoute } from '../lib/types'

export const preparedRoutes: PreparedRoute[] = [
  {
    id: 'document-to-presentation', title: 'מסמך למצגת', inputTypes: ['documents', 'text'], taskTypes: ['summarize', 'present'], outputType: 'presentation', context: 'management', audience: 'מנהלים, מרצים וצוותים שרוצים להפוך מסר למסך.',
    steps: [
      { order: 1, title: 'חלצו את המסר', role: 'עורך תוכן', primaryToolIds: ['chatgpt'], alternativeToolIds: ['claude', 'gemini'], instruction: 'בקשו מתווה קצר עם מסר מרכזי לכל שקופית.' },
      { order: 2, title: 'בנו טיוטת מצגת', role: 'מעצב מצגות', primaryToolIds: ['gamma'], alternativeToolIds: ['canva'], instruction: 'העבירו את המתווה ובחרו עיצוב נקי לקהל.' },
    ], warning: 'בדקו שכל נתון, ציטוט ומסר משקפים את המסמך המקורי.', finalOutput: 'טיוטת מצגת עריכה עם מסר מרכזי וברור.', starterPrompt: 'הפוך/י את המסמך למתווה מצגת: מסר מרכזי, כותרת ורעיון חזותי לכל שקופית.' },
  {
    id: 'topic-to-lesson', title: 'נושא לשיעור', inputTypes: ['idea', 'text'], taskTypes: ['brainstorm', 'write'], outputType: 'document', context: 'education', audience: 'מורים, מדריכים ומנחי למידה.',
    steps: [
      { order: 1, title: 'הגדירו יעד למידה', role: 'מתכנן למידה', primaryToolIds: ['chatgpt'], alternativeToolIds: ['claude', 'gemini'], instruction: 'נסחו יעד, פעילות פתיחה ושאלות חשיבה.' },
      { order: 2, title: 'המחישו את הרעיון', role: 'מעצב חומרי למידה', primaryToolIds: ['canva'], alternativeToolIds: ['napkin'], instruction: 'צרו המחשה פשוטה שמתאימה לגיל ולקשר.' },
    ], warning: 'התאימו את התוכן לגיל, לתוכנית הלימודים ולשיקול דעת פדגוגי.', finalOutput: 'תוכנית שיעור ראשונית עם פעילות וחומר המחשה.', starterPrompt: 'בנה/י שיעור בנושא [נושא] לקהל [גיל או קבוצה], עם יעד למידה, פתיחה, פעילות וסיכום.' },
  {
    id: 'survey-to-insights', title: 'שאלון לתובנות', inputTypes: ['data', 'text'], taskTypes: ['analyze', 'summarize'], outputType: 'report', context: 'management', audience: 'מנהלים, צוותי שירות, ארגונים חברתיים ומובילי קהילות.',
    steps: [
      { order: 1, title: 'נקו וסקרו את הנתונים', role: 'אנליסט נתונים', primaryToolIds: ['excel-copilot'], alternativeToolIds: ['chatgpt'], instruction: 'זהו מגמות, חריגים ושאלות להמשך בדיקה.' },
      { order: 2, title: 'נסחו תובנות', role: 'יועץ החלטות', primaryToolIds: ['claude'], alternativeToolIds: ['gemini'], instruction: 'הפכו ממצאים לתובנות והמלצות זהירות.' },
    ], warning: 'הימנעו ממסקנות על מדגם קטן ושמרו על פרטיות המשיבים.', finalOutput: 'סיכום תובנות עם שאלות והצעות להמשך.', starterPrompt: 'נתח/י את תוצאות השאלון, הצג/י מגמות, חריגים, מגבלות ושלוש שאלות להמשך.' },
  {
    id: 'idea-to-post', title: 'רעיון לפוסט', inputTypes: ['idea', 'text'], taskTypes: ['brainstorm', 'write'], outputType: 'text', context: 'marketing', audience: 'צוותי שיווק, יזמים ויוצרי תוכן.',
    steps: [
      { order: 1, title: 'חדדו זווית', role: 'אסטרטג תוכן', primaryToolIds: ['chatgpt'], alternativeToolIds: ['claude', 'gemini'], instruction: 'בחרו קהל, מסר, פתיח וקריאה לפעולה.' },
      { order: 2, title: 'צרו נכס חזותי', role: 'מעצב תוכן', primaryToolIds: ['canva'], alternativeToolIds: ['adobe-firefly'], instruction: 'הכינו דימוי תומך שאינו מחליף את המסר.' },
    ], warning: 'בדקו דיוק, טון מותג וזכויות שימוש לפני פרסום.', finalOutput: 'טיוטת פוסט עם פתיח, גוף וקריאה לפעולה.', starterPrompt: 'כתוב/י פוסט לקהל [קהל] על [רעיון], בטון [טון], עם פתיח מסקרן וקריאה לפעולה.' },
  {
    id: 'text-to-image', title: 'טקסט לתמונה', inputTypes: ['text', 'idea'], taskTypes: ['create-image', 'design'], outputType: 'image', context: 'marketing', audience: 'משווקים, מרצים ויוצרים הזקוקים להמחשה.',
    steps: [
      { order: 1, title: 'כתבו תיאור חזותי', role: 'מנהל אמנותי', primaryToolIds: ['chatgpt'], alternativeToolIds: ['gemini'], instruction: 'פרטו נושא, סגנון, קומפוזיציה ואווירה.' },
      { order: 2, title: 'צרו וריאציות', role: 'יוצר חזותי', primaryToolIds: ['adobe-firefly'], alternativeToolIds: ['midjourney'], instruction: 'צרו כמה כיוונים ובחרו את המתאים למסרים.' },
    ], warning: 'הימנעו מהצגת תמונה שנוצרה כאילו היא תיעוד אמיתי.', finalOutput: 'תמונה נבחרת ותיאור הטקסט ששימש ליצירתה.', starterPrompt: 'צור/י תיאור תמונה עבור [נושא]: סגנון, תאורה, קומפוזיציה, צבעים וללא טקסט מוטמע.' },
  {
    id: 'idea-to-video', title: 'רעיון לסרטון', inputTypes: ['idea', 'text'], taskTypes: ['create-video', 'design'], outputType: 'video', context: 'marketing', audience: 'צוותי שיווק, הסברה והדרכה.',
    steps: [
      { order: 1, title: 'בנו תסריט קצר', role: 'תסריטאי', primaryToolIds: ['claude'], alternativeToolIds: ['chatgpt'], instruction: 'חלקו את הרעיון לפתיח, מהלך וסיום.' },
      { order: 2, title: 'צרו סקיצה חזותית', role: 'במאי יצירה', primaryToolIds: ['runway'], alternativeToolIds: ['google-veo'], instruction: 'צרו ניסיון קצר ובדקו אם המסר מובן ללא הסבר נוסף.' },
    ], warning: 'בדקו זכויות, הסכמות ודיוק לפני שימוש בדמויות או בקולות.', finalOutput: 'סקיצת וידאו קצרה ותסריט עבודה.', starterPrompt: 'כתוב/י תסריט קצר לסרטון על [רעיון], עם פתיח, שלושה שוטים וסיום ברור.' },
  {
    id: 'documents-to-summary', title: 'כמה מסמכים לסיכום', inputTypes: ['documents'], taskTypes: ['summarize', 'research'], outputType: 'document', context: 'general', audience: 'צוותים, חוקרים וכל מי שצריך תמונת מצב מהירה.',
    steps: [
      { order: 1, title: 'ארגנו את החומרים', role: 'אוצר ידע', primaryToolIds: ['notebooklm'], alternativeToolIds: ['claude'], instruction: 'העלו חומרים מורשים ובקשו נושאים משותפים ושאלות פתוחות.' },
      { order: 2, title: 'ערכו תקציר', role: 'עורך', primaryToolIds: ['chatgpt'], alternativeToolIds: ['gemini'], instruction: 'הפכו את הממצאים לתקציר מובנה לקהל היעד.' },
    ], warning: 'שמרו על הרשאות המסמכים ובדקו שהתקציר אינו משמיט הסתייגויות חשובות.', finalOutput: 'תקציר מאורגן של עיקרי הדברים, מחלוקות ושאלות פתוחות.', starterPrompt: 'סכם/י את המסמכים לפי נושאים משותפים, הבדלים, נקודות החלטה ושאלות להמשך.' },
  {
    id: 'current-information-with-sources', title: 'מידע עדכני עם מקורות', inputTypes: ['idea', 'web-links'], taskTypes: ['research', 'summarize'], outputType: 'report', context: 'general', audience: 'אנשי מקצוע, יזמים ומקבלי החלטות.',
    steps: [
      { order: 1, title: 'אספו מקורות', role: 'חוקר', primaryToolIds: ['perplexity'], alternativeToolIds: ['gemini'], instruction: 'בקשו מקורות מגוונים ועדכניים סביב שאלה ממוקדת.' },
      { order: 2, title: 'בדקו וסכמו', role: 'עורך מחקר', primaryToolIds: ['claude'], alternativeToolIds: ['chatgpt'], instruction: 'השוו בין המקורות וסמנו אי־ודאות או מחלוקת.' },
    ], warning: 'הסתמכו על המקור המקורי כשאפשר; תוצאות חיפוש אינן תחליף לבדיקה.', finalOutput: 'סיכום קצר עם קישורים למקורות והסתייגויות.', starterPrompt: 'חפש/י מידע עדכני על [נושא], הצג/י מקורות, תאריכים, הסכמה ומחלוקות.' },
  {
    id: 'idea-to-app', title: 'רעיון לאפליקציה', inputTypes: ['idea', 'text'], taskTypes: ['build', 'design'], outputType: 'app', context: 'entrepreneurship', audience: 'יזמים, צוותי מוצר וקהילות שבונות פתרון.',
    steps: [
      { order: 1, title: 'הגדירו בעיה ומשתמש', role: 'מנהל מוצר', primaryToolIds: ['chatgpt'], alternativeToolIds: ['claude'], instruction: 'נסחו משתמש, בעיה, ערך ופעולה ראשונה.' },
      { order: 2, title: 'בנו אב־טיפוס', role: 'מפתח מוצר', primaryToolIds: ['lovable'], alternativeToolIds: ['bolt', 'replit'], instruction: 'צרו מסך ראשון ובדקו אותו עם משתמשים.' },
    ], warning: 'אב־טיפוס אינו מוצר מוכן; בדקו נגישות, אבטחה וצרכי משתמשים לפני השקה.', finalOutput: 'תיאור מוצר ואב־טיפוס ראשוני לבדיקה.', starterPrompt: 'עזור/י להגדיר אפליקציה ל[קהל] שפותרת את [בעיה]: ערך, מסך ראשון וזרימת משתמש.' },
  {
    id: 'recording-to-summary', title: 'הקלטה לסיכום', inputTypes: ['audio', 'video'], taskTypes: ['transcribe', 'summarize'], outputType: 'document', context: 'management', audience: 'צוותים, מנהלים ומנחי פגישות.',
    steps: [
      { order: 1, title: 'תמללו את ההקלטה', role: 'מתמלל', primaryToolIds: ['elevenlabs'], alternativeToolIds: ['gemini'], instruction: 'צרו תמלול ושמרו סימון של דוברים כאשר אפשר.' },
      { order: 2, title: 'חלצו החלטות', role: 'מנהל פגישה', primaryToolIds: ['claude'], alternativeToolIds: ['chatgpt'], instruction: 'סמנו החלטות, משימות ושאלות פתוחות.' },
    ], warning: 'קבלו הסכמה להקלטה, ובדקו את התמלול מול הדוברים וההקשר.', finalOutput: 'סיכום פגישה עם החלטות, בעלים ומשימות להמשך.', starterPrompt: 'על בסיס התמלול, הכין/י סיכום: החלטות, משימות, בעלי אחריות ושאלות פתוחות.' },
  {
    id: 'data-to-management-report', title: 'נתונים לדוח הנהלה', inputTypes: ['data', 'documents'], taskTypes: ['analyze', 'present'], outputType: 'report', context: 'management', audience: 'מנהלים וצוותי תפעול הזקוקים לתמונת מצב.',
    steps: [
      { order: 1, title: 'בדקו את הטבלה', role: 'אנליסט נתונים', primaryToolIds: ['excel-copilot'], alternativeToolIds: ['chatgpt'], instruction: 'זהו שינוי, חריגה ומגבלה בנתונים.' },
      { order: 2, title: 'ספרו את הסיפור', role: 'יועץ הנהלה', primaryToolIds: ['gamma'], alternativeToolIds: ['canva'], instruction: 'בנו דוח תמציתי של ממצא, משמעות ושאלת החלטה.' },
    ], warning: 'ודאו הגדרות מדדים, טווחי זמן ודיוק חישובים לפני קבלת החלטה.', finalOutput: 'טיוטת דוח הנהלה עם תובנות ושאלות החלטה.', starterPrompt: 'נתח/י את הנתונים לדוח הנהלה: מגמות, חריגים, מגבלות, משמעות והחלטות אפשריות.' },
  {
    id: 'recurring-process-to-automation', title: 'תהליך חוזר לאוטומציה', inputTypes: ['text', 'documents'], taskTypes: ['automate', 'analyze'], outputType: 'automation', context: 'entrepreneurship', audience: 'מנהלים, יזמים וצוותי תפעול.',
    steps: [
      { order: 1, title: 'מפו את התהליך', role: 'מנתח תהליכים', primaryToolIds: ['chatgpt'], alternativeToolIds: ['claude'], instruction: 'פרטו טריגר, קלט, החלטות, חריגים ותוצאה רצויה.' },
      { order: 2, title: 'בנו אוטומציה מבוקרת', role: 'בונה אוטומציה', primaryToolIds: ['make'], alternativeToolIds: ['zapier', 'n8n'], instruction: 'התחילו בניסוי קטן עם בדיקת שגיאות ואישור אנושי.' },
    ], warning: 'בדקו הרשאות, מידע אישי ותוכנית טיפול בכשל לפני הפעלה רחבה.', finalOutput: 'מפת תהליך ואוטומציה ראשונית לבחינה.', starterPrompt: 'מפה/י את התהליך הבא לאוטומציה: טריגר, קלט, צעדים, חריגים, אישור אנושי ופלט.' },
]
