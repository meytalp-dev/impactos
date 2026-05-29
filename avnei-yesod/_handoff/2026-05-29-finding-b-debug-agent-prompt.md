# Handoff — סוכן 20: Finding B Debug (TDZ on F5 refresh of teacher-rama)

> **מיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש.
>
> ⚠️ **לפני שאת מפעילה אותו:** ודאי שסוכן 1 (F.21E code) **דחף את teacher-rama.html ל-origin**. הסוכן הזה צריך לערוך את אותו קובץ — conflict ודאי אם סוכן 1 עדיין בעבודה.

---

## משימה

**Finding B** = baג של F5 refresh ב-`underwater-app/teacher-rama.html`. כשמורה הזינה PIN פעם אחת (`sessionStorage avnei-rama-auth=1`) ולחצה F5 → דף ריק / טבלה לא נטענת. **workaround שעובד:** clear sessionStorage (=PIN בכל refresh). **דורש debug עמוק ב-DevTools.**

לא חוסם פיילוט (workaround עובד), אבל **חוסם UX מקצועי לפני פיילוט אמיתי**. מורה לא יכולה להזין PIN בכל F5.

## הקשר

"אבני יסוד" = מערכת תרגול בעברית לכיתה א'. `teacher-rama.html` = מסך מורה ראמ"ה (F.21A — תצפית בכיתה). 1300+ שורות HTML עם vanilla JS, PIN gate ב-IIFE בראש הסקריפט.

## ההיסטוריה של הbאג

### Root cause כפי שזיהה סוכן 13 (28.5)
- IIFE של `initPinGate` קורא ל-`boot()` synchronously בשני נתיבים:
  1. PIN-bypass path (sessionStorage `avnei-rama-auth=1`) — שורה ~1217
  2. PIN-submit handler — שורה ~1230
- `boot()` → `render()` → `renderClassView()` → `renderInterventionTriggers()` נוגע ב-`let _activeGroups = []` שמוצהר **אחרי** ה-IIFE (שורה ~2332).
- TDZ exception → `body.innerHTML` לא מתעדכן → דף ריק.

### ניסיון 1 (סוכן 13, `bf258b5`) — לא פתר
הזיז declarations של `viewState`, `STUDENTS_KEY`, `PULSE_RANGES`, `STALE_*` לפני ה-IIFE. **אבל `_activeGroups` נשאר באמצע הסקריפט** (קשה להזיז בצורה נקייה כי תלוי בקבועים אחרים).

### ניסיון 2 (סוכן 15, `3ef476b`) — לא פתר
החליף `boot()` ב-`setTimeout(boot, 0)` בשני נתיבי ה-IIFE. הרציונל: דחיה ל-macrotask הבא → ה-`<script>` הנוכחי מסתיים → כל ה-`let`/`const` הגיעו → ה-TDZ הסתיים. בפועל — מיטל בדקה ידנית, **עדיין דף ריק**.

### Workaround שעובד
Clear `sessionStorage` (DevTools → Application → sessionStorage → delete `avnei-rama-auth`) → מורה מזינה PIN שוב → טוען תקין.

## קבצי-מקור — חובה לקרוא לפני עבודה

1. **הקובץ עצמו:** `avnei-yesod/underwater-app/teacher-rama.html` — שורות ~1200-1240 (IIFE) + ~2330-2340 (declaration של `_activeGroups`).
2. **agent-completion-log:** `avnei-yesod/_handoff/agent-completion-log.md` — חיפוש "Finding B" → 2 בלוקים של ניסיון לתיקון.
3. **תזכורת:** `feedback-avnei-yesod-cross-screen-navigation-uses-history-back` — לא רלוונטי לבאג, אבל לזכור: אם נוגעים ב-PIN flow, לוודא ש-history.back() עדיין עובד.

## מסלול עבודה מומלץ

### שלב 1: אבחון אמיתי ב-DevTools (לפני קוד!)

1. פתח את `teacher-rama.html` ב-Chrome עם DevTools (F12) פתוח.
2. Console — clear log + נקות `Preserve log` ✓.
3. הזן PIN → loaded טוב? ✓.
4. הקלד `F5`.
5. **תפוס את ה-exception המדויקת ב-Console:**
   - האם זה באמת `ReferenceError: Cannot access '_activeGroups' before initialization`?
   - או משהו אחר לגמרי (למשל: `TypeError`, `null is not an object`, או שגיאה ב-async loading)?
6. ב-Sources → set breakpoint בתחילת `boot()` → F5 → step through.
7. צלם screenshot של Console + stack trace.

⚠️ **אל תתחיל לכתוב קוד עד שזיהית את ה-exception בדיוק.** ייתכן שזה לא TDZ כלל — אולי בעיה ב-script tag loading (חדש מסוכנים 17/18 הוסיפו 2 script tags ל-intervention-matcher.js + group-suggester.js).

### שלב 2: בחירת fix לפי האבחון

| אבחון | פתרון מומלץ |
|---|---|
| **TDZ של `_activeGroups`** | להזיז `let _activeGroups = [];` לראש הסקריפט (לפני ה-IIFE) — כמו שעשה סוכן 13 ל-viewState. |
| **TDZ של משהו אחר** | להזיז את ה-declaration הספציפית לראש. |
| **script tag לא נטען** (intervention-matcher.js / group-suggester.js לא מוכן) | להוסיף `defer` או להמתין ל-`DOMContentLoaded`. |
| **race condition עם async** | להחליף `setTimeout(boot, 0)` ב-`queueMicrotask(boot)` או `requestAnimationFrame(boot)`. |
| **משהו לגמרי אחר** | לעצור ולשאול את מיטל. |

### שלב 3: אימות

1. הוסף Playwright test (אם יש framework, או manual recipe):
   - load `teacher-rama.html` (clear sessionStorage)
   - submit PIN 4521
   - F5
   - assert `body.innerHTML.includes('Class View')` (או label זהה)
2. רגרסיה: כל הטסטים הקיימים (12 suites · 503+ assertions) — חובה ירוקים.
3. בדיקה ידנית של מיטל אחרי — חובה לפני push.

## אסור לך

- ❌ לערוך שום קובץ אחר מלבד `teacher-rama.html` (וההוספות ל-handoff docs).
- ❌ לערוך את `group-suggester.js`, `intervention-matcher.js`, `assessments.js`, `interventions.js` — קריאה בלבד.
- ❌ לדחוף ל-git בלי אישור מפורש של מיטל + בדיקה ידנית שלה ב-F5.
- ❌ "להחליק" את ה-flow ע"י clear sessionStorage on boot — זה לא תיקון, זה הסתרת הbאג.
- ❌ לרפקטר את ה-IIFE — שמרי כפי שהוא, fix כירורגי בלבד.
- ❌ להוסיף "תכונות חכמות" שלא בסקופ הbאג.

## בספק

שאלי את מיטל. במיוחד אם:
- ה-exception ב-DevTools שונה ממה שתועד (לא TDZ של `_activeGroups`).
- כל ה-fixes שניסית לא עובדים → אולי root cause עמוק יותר.
- צריך לשנות את architecture של ה-IIFE (לדוגמה: לעקוף את ה-PIN gate flow).

## Acceptance Criteria

- [ ] **F5 על מצב PIN-authenticated** → הטבלה נטענת תקין.
- [ ] **F5 פעם נוספת** → עדיין נטענת תקין.
- [ ] **Clear sessionStorage + login** → עדיין עובד (workflow רגיל).
- [ ] כל הטסטים (12 suites · 503+) ירוקים.
- [ ] בדיקה ידנית של מיטל ✓.
- [ ] בלוק חדש ב-`_handoff/agent-completion-log.md` עם:
   - ה-exception המדויקת שתפסת ב-DevTools
   - ה-fix שיישמת
   - למה ה-fix ה-2 הקודמים לא הספיקו
- [ ] commit message: `Finding B closed — F5 refresh fix (סוכן 20)`.

## בסיום

1. דווחי למיטל סיכום + ה-exception שתפסת + ה-fix.
2. שלחי הוראת בדיקה ידנית: "פתחי teacher-rama, הזיני PIN, F5 → ספרי לי אם רואה את הטבלה".
3. ⚠️ **אל תדחפי לפני אישור ידני של מיטל** (לא טסטים בלבד — בעצם הbאג הזה לא נתפס ע"י הטסטים).
