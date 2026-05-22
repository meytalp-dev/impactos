# מסמכי הנחיות Claude Code

מסמך זה מכיל שני briefים נפרדים:
1. **Design System Implementation Brief** — מדריך כללי ליישום.
2. **MVP Build Brief** — תכנית עבודה ספציפית לבנייה ראשונה.

---

# חלק א' — Design System Implementation Brief

## מטרה
לבנות מערכת React/HTML/CSS אינטראקטיבית לילדי א׳-ב׳ לתרגול קריאה וכתיבה בעברית, בעולם חזותי בשם "עומק הים המואר". המערכת צריכה להיות רגועה, רכה, נגישה, תומכת RTL, ומותאמת לטאבלטים בינוניים.

## Stack מומלץ
* React
* TypeScript
* CSS Modules או Tailwind עם CSS variables
* SVG inline components
* Framer Motion רק אם לא פוגע בביצועים
* Web Speech / TTS abstraction layer
* prefers-reduced-motion support

## CSS Variables בסיסיות

```css
:root {
  --water-main: #A8E8FF;
  --water-secondary: #73D9D1;
  --water-soft: #8DDFFF;
  --mint: #B8F2CF;
  --sea-green: #8ED9B8;
  --coral: #FFA98D;
  --shell-pink: #FFD3D8;
  --sand: #F8E3D6;
  --stone: #DAD6C9;
  --lavender: #D9D2FF;
  --peach: #FFC8AE;
  --hint: #FFE7A8;
  --success: #7CE7B4;
  --warm-white: #FFF9F4;
  --pearl-currency: #FFF4C2;

  --radius-sm: 16px;
  --radius-md: 24px;
  --radius-lg: 28px;
  --radius-pill: 999px;

  --space-xs: 8px;
  --space-s: 16px;
  --space-m: 24px;
  --space-l: 32px;
  --space-xl: 48px;
  --space-xxl: 64px;
}
```

## Component Architecture

יש לבנות את המערכת כרכיבים חוזרים:

```txt
/components
  /layout
    AppShell
    StudentSceneLayout
    TeacherDashboardLayout
  /ocean
    BubbleStream
    LightRays
    Seaweed
    PlanktonParticles
    SceneTransitionBubbles
  /noni
    NoniCharacter
    NoniGesture
    NoniSpeechBubble
  /ui
    BubbleButton
    PrimaryButton
    SecondaryButton
    ActivityCard
    PictureCard
    ReadingCard
    HintBubble
    ProgressShell
  /learning
    TapMatchActivity
    DragBuildActivity
    TraceWriteActivity
    SharedReadActivity
    MiniTaskActivity
    MemorySortActivity
  /map
    OceanMap
    EnvironmentNode
    MasterySouvenir
  /home
    NoniHome
    PearlStore
    SouvenirShelf
```

## Global Rules
* כל המסכים לתלמידים ב־RTL.
* אין שימוש בצבע אדום למשוב.
* כל טעות מובילה לעזרה, לא לענישה.
* אין אנימציות מהירות או מפחידות.
* לא להעמיס יותר מדי פריטים במסך.
* כל פעילות צריכה לעבוד גם במצב reduced motion.
* כל אלמנט מגע לפחות `56x56px`.
* כל אנימציה חייבת להיות ניתנת לכיבוי/הפחתה.

## Data Model בסיסי לסביבה

```ts
type EnvironmentStage = {
  id: number;
  title: string;
  pedagogicGoal: string;
  palette: string[];
  sceneType: 'reef' | 'cave' | 'lagoon' | 'seaweed-field' | 'sand-writing' | 'home';
  activityTypes: Array<'tap-match' | 'drag-build' | 'trace-write' | 'shared-read' | 'mini-task' | 'memory-sort'>;
  souvenir: {
    name: string;
    icon: string;
    animation: string;
  };
  prerequisites: number[];
};
```

## Feedback State Model

```ts
type FeedbackState =
  | { type: 'idle' }
  | { type: 'success'; message?: string; awardPearl?: boolean }
  | { type: 'tryTogether'; attempt: 1 }
  | { type: 'hint'; attempt: 2; targetId?: string }
  | { type: 'showAnswer'; attempt: 3; answerId: string };
```

## Animation Performance
* להשתמש ב־transform ו־opacity ככל האפשר.
* להימנע מאנימציות layout כבדות.
* particles צריכים להיות מוגבלים במספר.
* בטאבלטים בינוניים לשמור על 60fps.
* לא להפעיל יותר מדי SVG filters.

## Accessibility
* תמיכה מלאה במגע.
* אפשרות לשמיעה חוזרת.
* ניגודיות גבוהה מספיק בין טקסט לרקע.
* reduced motion.
* טקסטים קצרים וברורים.
* אפשרות להגדלת טקסט פדגוגי.

## First Build Recommendation
לבנות תחילה Vertical Slice אחד מלא:
1. מסך מפה בסיסי.
2. בית נוני בסיסי.
3. סביבת שלב 1 — מפרץ הבועות המזמרות.
4. פעילות tap-match.
5. פעילות drag-build בסיסית.
6. פידבק טעות מדורג.
7. הענקת פנינה כמטבע.
8. הופעת מזכרת שליטה שאינה פנינה.

לאחר שה־Vertical Slice עובד, להרחיב לשאר השלבים.

---

# חלק ב' — Build Brief ל־Claude Code — גרסת MVP ראשונה

מסמך זה הוא גרסת עבודה ממוקדת לפיתוח ראשוני. המטרה אינה לבנות את כל 22 השלבים מיד, אלא ליצור Vertical Slice איכותי שמוכיח את חוויית המוצר, השפה העיצובית, מנגנון הפידבק והבסיס הפדגוגי.

## 1. מטרת ה־MVP
לבנות אב־טיפוס אינטראקטיבי של מערכת תרגול קריאה וכתיבה בעברית לכיתות א׳-ב׳, בעולם חזותי בשם "עומק הים המואר", עם הדמות המלווה נוני התמנון.

ה־MVP צריך להדגים:
* חוויית תלמיד/ה רגועה, ידידותית ולא שיפוטית.
* סביבת למידה תת־ימית ב־SVG flat-vector.
* תרגול עברית ב־RTL.
* פידבק מדורג ללא כישלון.
* שימוש בפנינים כמטבע רך בלבד.
* מזכרת שליטה ייחודית שאינה פנינה.
* בסיס לדשבורד מורה עם קבוצות תרגול.

## 2. מה לבנות בגרסה הראשונה

### חובה ב־MVP
* מסך פתיחה לתלמיד/ה.
* מסך מפה בסיסי של עומק הים המואר.
* מסך פעילות אחד מלא: שלב 1 — מפרץ הבועות המזמרות.
* מעטפת משחק אחת מלאה: tap-match.
* גרסה בסיסית של drag-build.
* מנגנון פידבק מדורג: טעות 1, טעות 2, טעות 3.
* הענקת פנינה כמטבע לאחר הצלחה/רצף הצלחות.
* הופעת מזכרת שליטה: טבעת הד.
* בית נוני בסיסי עם מדף מזכרות ואוצר פנינים.
* דשבורד מורה בסיסי עם קבוצות מומלצות.

### לא לבנות עדיין
* לא לבנות את כל 22 השלבים.
* לא לבנות חנות פנינים מלאה.
* לא לבנות BKT אמיתי מלא בשלב ראשון; להשתמש במודל mock או rule-based פשוט.
* לא לבנות מערכת משתמשים מלאה.
* לא לבנות גרפים מורכבים למורה.
* לא לבנות אנימציות כבדות או תלת־ממד.

## 3. Stack מומלץ
יש לבנות את המערכת ב־React + TypeScript.

אפשרויות עיצוב:
* Tailwind CSS עם CSS variables.
* או CSS Modules.

אנימציה:
* CSS animations כברירת מחדל.
* Framer Motion רק עבור מעברים פשוטים, אם לא פוגע בביצועים.

גרפיקה:
* SVG inline components.
* אין להשתמש בתמונות ריאליסטיות.
* כל העולם צריך להיות flat-vector, פסטלי, רגוע.

## 4. חוקי עיצוב שאסור לשבור

### חובה
* RTL מלא.
* צבעים רגועים בלבד.
* דמות נוני עדינה, תומכת ולא "מורה".
* כל טעות מובילה לעזרה.
* כל הצלחה מקבלת פידבק שקט.
* נוני תמיד מגיב בעדינות.
* פנינים הן מטבע בלבד.
* מזכרות שליטה הן אובייקטים ייחודיים לכל סביבה.

### אסור
* אסור X אדום.
* אסור Game Over.
* אסור הורדת חיים.
* אסור צליל שלילי.
* אסור צבע אדום כפידבק שגיאה.
* אסור כריש/סערה/חושך/דיו שחור.
* אסור עומס טקסט.
* אסור חוויית ארקייד מוגזמת.

## 5. פלטת צבעים ליישום

```css
:root {
  --water-main: #A8E8FF;
  --water-secondary: #73D9D1;
  --water-soft: #8DDFFF;
  --water-depth: #63CFE5;

  --mint: #B8F2CF;
  --sea-green: #8ED9B8;
  --coral: #FFA98D;
  --shell-pink: #FFD3D8;
  --sand: #F8E3D6;
  --stone: #DAD6C9;

  --lavender: #D9D2FF;
  --peach: #FFC8AE;
  --hint: #FFE7A8;
  --success: #7CE7B4;
  --warm-white: #FFF9F4;
  --pearl-currency: #FFF4C2;

  --text-main: #26505C;
  --text-soft: #4D6F78;

  --radius-sm: 16px;
  --radius-md: 24px;
  --radius-lg: 28px;
  --radius-pill: 999px;

  --space-xs: 8px;
  --space-s: 16px;
  --space-m: 24px;
  --space-l: 32px;
  --space-xl: 48px;
  --space-xxl: 64px;
}
```

## 6. מבנה תיקיות מומלץ

```
/src
  /components
    /layout
      AppShell.tsx
      StudentSceneLayout.tsx
      TeacherDashboardLayout.tsx

    /ocean
      BubbleStream.tsx
      LightRays.tsx
      Seaweed.tsx
      PlanktonParticles.tsx
      SceneTransitionBubbles.tsx
      SoftRipple.tsx
      PedagogicGlow.tsx

    /noni
      NoniCharacter.tsx
      NoniSpeechBubble.tsx
      NoniGesture.tsx

    /ui
      PrimaryButton.tsx
      SecondaryButton.tsx
      BubbleButton.tsx
      ActivityCard.tsx
      PictureCard.tsx
      HintBubble.tsx
      PearlCounter.tsx

    /learning
      TapMatchActivity.tsx
      DragBuildActivity.tsx
      FeedbackController.tsx

    /map
      OceanMap.tsx
      EnvironmentNode.tsx
      MasterySouvenir.tsx

    /home
      NoniHome.tsx
      SouvenirShelf.tsx
      PearlTreasure.tsx

    /teacher
      TeacherDashboard.tsx
      GroupCard.tsx
      StudentLearningProfile.tsx

  /data
    stages.ts
    sampleStudents.ts
    activities.ts

  /hooks
    useFeedbackState.ts
    useReducedMotion.ts
    usePearls.ts
    useStudentProgress.ts

  /styles
    tokens.css
    animations.css
    global.css
```

## 7. מודל דאטה בסיסי

```ts
export type ActivityType =
  | 'tap-match'
  | 'drag-build'
  | 'trace-write'
  | 'shared-read'
  | 'mini-task'
  | 'memory-sort';

export type EnvironmentStage = {
  id: number;
  title: string;
  pedagogicGoal: string;
  palette: string[];
  sceneType: 'reef' | 'cave' | 'lagoon' | 'seaweed-field' | 'sand-writing' | 'home';
  activityTypes: ActivityType[];
  souvenir: {
    name: string;
    icon: string;
    animation: string;
  };
  prerequisites: number[];
};

export type StudentProgress = {
  studentId: string;
  currentStageId: number;
  completedStageIds: number[];
  pearls: number;
  souvenirs: string[];
  skillMastery: Record<string, number>;
};
```

## 8. מודל פידבק

```ts
export type FeedbackState =
  | { type: 'idle' }
  | { type: 'success'; message?: string; awardPearl?: boolean }
  | { type: 'tryTogether'; attempt: 1 }
  | { type: 'hint'; attempt: 2; targetId?: string }
  | { type: 'showAnswer'; attempt: 3; answerId: string };
```

### לוגיקת פידבק
* ניסיון נכון: success.
* טעות ראשונה: tryTogether.
* טעות שנייה: hint.
* טעות שלישית: showAnswer ולאחר מכן חזרה.
* אין מצב failure.

## 9. שלב 1 ל־MVP — מפרץ הבועות המזמרות

### מטרה פדגוגית
מיפוי צליל־דיבור והברות.

### מה רואים
* מפרץ רדוד ובהיר.
* בועות שקופות עם הברות/צלילים.
* נוני בצד ימין, מחזיק בועה קטנה.
* אצות ואלמוגים נמוכים.
* בועות רקע וקרני אור.

### פעילות tap-match
הילד/ה שומע/ת צליל או הברה, ולוחץ/ת על הבועה המתאימה.

### פעילות drag-build בסיסית
הילד/ה גורר/ת שתי בועות הברה קרובות כדי לחבר אותן.

### דוגמאות תוכן

```ts
const stage1Items = [
  { id: 'ba', label: 'בַּ', audioText: 'בַּ' },
  { id: 'ma', label: 'מַ', audioText: 'מַ' },
  { id: 'la', label: 'לַ', audioText: 'לַ' },
  { id: 'sha', label: 'שָׁ', audioText: 'שָׁ' }
];
```

### פידבק הצלחה
* הבועה מאירה בטורקיז.
* נוני מרים זרוע בשקט.
* 4–6 בועות זהב קטנות עולות.
* פנינה אחת מתווספת לאוצר אם מוגדר awardPearl.

### פידבק טעות
* ניסיון ראשון: נוני אומר "ננסה יחד".
* ניסיון שני: הבועה הנכונה מקבלת glow צהוב.
* ניסיון שלישי: התשובה מוצגת, הילד/ה לוחץ/ת עליה שוב.

### מזכרת שליטה
**טבעת הד** — טבעת מים קטנה וזוהרת שמופיעה על המפה ועל מדף בית נוני.

## 10. מסכים לבנייה ב־MVP

### 1. StudentWelcomeScreen
כולל:
* רקע ים.
* נוני idle.
* ברכה אישית.
* כפתור "נתחיל".
* PearlCounter קטן.

### 2. OceanMapScreen
כולל:
* 3 nodes בלבד בשלב MVP: שלב 1 פעיל, שלב 2 מעורפל, שלב 3 מעורפל.
* מזכרת שליטה אם שלב 1 הושלם.
* נוני ליד השלב הפעיל.

### 3. StageOneActivityScreen
כולל:
* TapMatchActivity.
* BubbleStream.
* NoniCharacter.
* FeedbackController.
* PearlCounter.
* כפתור שמע חוזר.

### 4. NoniHomeScreen
כולל:
* נוני.
* מדף מזכרות.
* אוצר פנינים.
* חלון ים.
* ללא חנות מלאה בשלב ראשון.

### 5. TeacherDashboardScreen
כולל:
* כרטיסי קבוצות mock.
* תלמידים לדוגמה.
* המלצת פעילות.
* ללא גרפים כבדים.

## 11. דשבורד מורה — נתוני mock מומלצים

```ts
const teacherGroups = [
  {
    id: 'group-1',
    name: 'מתרגלים צליל ואות',
    recommendation: 'מפרץ הבועות המזמרות',
    studentCount: 6,
    stageId: 1
  },
  {
    id: 'group-2',
    name: 'מחברים הברות למילים',
    recommendation: 'שונית החיבורים',
    studentCount: 5,
    stageId: 5
  },
  {
    id: 'group-3',
    name: 'מחזקים שטף',
    recommendation: 'להקת דגי המילים',
    studentCount: 4,
    stageId: 6
  }
];
```

## 12. אנימציות חובה ב־MVP

### BubbleStream
* בועות עולות מ־3 נקודות.
* גדלים שונים.
* opacity משתנה.
* reduced motion: להשאיר בועות איטיות בלבד.

### LightRays
* קרני אור מלמעלה.
* תנועה איטית ימינה־שמאלה.

### Noni Idle
* נשימה עדינה.
* מצמוץ כל 4–7 שניות.
* תנועת זרועות קלה.

### Tap Feedback
* squash קצר.
* ripple קטן.
* glow לפי מצב.

### Scene Transition
* בועות מכסות חלק מהמסך.
* מעבר רך למסך הבא.

## 13. נגישות וביצועים

### נגישות
* כל כפתור לפחות 56x56px.
* תמיכה ב־RTL.
* טקסטים קצרים.
* אפשרות לשמיעה חוזרת.
* ניגודיות טובה בין אות/מילה לרקע.
* reduced motion.

### ביצועים
* להשתמש ב־transform ו־opacity.
* להימנע מ־SVG filters כבדים.
* להגביל חלקיקים.
* לשמור על 60fps בטאבלטים בינוניים.

## 14. Prompt מוכן להדבקה ל־Claude Code

```
Build a React + TypeScript MVP for an early Hebrew reading and writing practice system for grades 1–2.

The product world is called "עומק הים המואר" — a calm, bright underwater world.
The guide character is "נוני", a gentle friendly octopus. Noni is not a teacher, not silly, and not overly energetic. Noni supports the child calmly.

Visual style:
- SVG flat-vector.
- Calm pastel palette.
- Inspired by Lingumi, Khan Kids, and Sago Mini.
- No realism, no complex 3D.
- No scary sea creatures, no sharks, no storms, no dark ink.
- RTL interface.

Core pedagogy:
- The child practices Hebrew reading skills in short 15–25 minute sessions.
- Progress is mastery-based.
- There is no failure state.
- Mistake 1: show "ננסה יחד" with Noni offering a tentacle.
- Mistake 2: show a soft visual hint with yellow glow.
- Mistake 3: show the correct answer, then let the child repeat.
- Never use red X, Game Over, life loss, negative sound, or shame language.

Build the MVP with these screens:
1. StudentWelcomeScreen
2. OceanMapScreen
3. StageOneActivityScreen for "מפרץ הבועות המזמרות"
4. NoniHomeScreen
5. TeacherDashboardScreen

Stage 1: "מפרץ הבועות המזמרות"
Pedagogic goal: mapping speech sounds and syllables.
The scene should include a calm shallow underwater bay, floating syllable bubbles, soft coral, seaweed, light rays, and Noni on the right side.

Build one full activity type:
- tap-match: the child hears a syllable and taps the matching bubble.

Build a basic second activity:
- drag-build: the child drags two syllable bubbles together.

Include:
- BubbleStream component.
- LightRays component.
- NoniCharacter with idle, point, help, and softCelebrate states.
- BubbleButton component.
- FeedbackController component.
- PearlCounter component.
- MasterySouvenir component.

Pearls:
- Pearls are only a soft currency.
- They are not mastery badges.

Mastery souvenir for stage 1:
- "טבעת הד" — a glowing water echo ring.

Teacher dashboard:
- Use mock data.
- Show recommended groups with non-judgmental names:
  "מתרגלים צליל ואות"
  "מחברים הברות למילים"
  "מחזקים שטף"
- Do not use labels like weak, failing, red, or at-risk.

Use CSS variables for the design tokens:
--water-main: #A8E8FF;
--water-secondary: #73D9D1;
--water-soft: #8DDFFF;
--mint: #B8F2CF;
--coral: #FFA98D;
--sand: #F8E3D6;
--lavender: #D9D2FF;
--hint: #FFE7A8;
--success: #7CE7B4;
--warm-white: #FFF9F4;
--pearl-currency: #FFF4C2;

Performance:
- Use CSS animations with transform and opacity.
- Support prefers-reduced-motion.
- Avoid heavy SVG filters.
- Keep the interface smooth for mid-range school tablets.

Please implement the MVP as a clean, component-based React app with sample data and a polished calm UI.
```

## 15. Definition of Done ל־MVP

ה־MVP ייחשב מוכן כאשר:
* תלמיד/ה יכול/ה להיכנס למסך פתיחה.
* לעבור למפה.
* להיכנס לשלב 1.
* לבצע tap-match.
* לקבל פידבק מדורג בשלוש רמות.
* לקבל פנינה כמטבע.
* לראות את מזכרת השליטה "טבעת הד".
* להגיע לבית נוני ולראות את המזכרת.
* המורה יכולה לראות דשבורד mock עם קבוצות מומלצות.
* כל הממשק עובד RTL.
* אין שימוש בשפה/צבע/אייקון של כישלון.
* יש תמיכה ב־reduced motion.
