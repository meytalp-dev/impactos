# Brief ל-ChatGPT — כתיבת F.21E UX Spec

> **למיטל:** העתיקי את כל מה שמתחת לקו הראשון של `---` כפרומפט פתיחה ל-ChatGPT (Claude / GPT-5 / סוכן UX).
>
> **המטרה:** ChatGPT יחזיר קובץ `_handoff/2026-05-29-F21E-ux-spec.md` — spec עיצובי (markdown + ASCII wireframes) שייכנס לסוכן קוד ייעודי בשלב הבא (L+, 12-15 שעות).
>
> **לא מצופה מ-ChatGPT:** קוד · החלטות פדגוגיות עצמאיות · שינוי APIs · מעורבות ב-content (60 MOY · 5 scripts · packs).

---

# כתיבת F.21E UX Spec — "מסך פעולה בוקר" למורה

## 1. הקשר — מה אנחנו בונים

"אבני יסוד" = מערכת תרגול אדפטיבית לרכישת קריאה בעברית בכיתה א'. המערכת חיה (כל המנועים — BKT/EPA/sub-BKT/MOY/B.7/B.8/B.9 — פעילים ועוברים 503/503 טסטים). הגענו לשלב **pre-pilot** — מתחילים להכין את המסכים הסופיים ל-soft launch עם כיתה אחת (4-5 ילדות) בספטמבר 2026.

**F.21E = המסך החסר האחרון לפיילוט.** הוא דשבורד בוקר למורה: היא פותחת אותו לפני שיעור, **3 דקות**, ויוצאת עם **תכנית פעולה קונקרטית** לשיעור הקרוב.

## 2. הפיצול הקריטי — F.21A (קיים) ↔ F.21E (חדש)

קיים בפרויקט מסך מורה בשם **F.21A** (`teacher-rama.html`). זה מסך **תצפית** בלבד:

> F.21A עונה על: "מי דורש תשומת לב?" + "מי לא מוכנה לפעימה הבאה?"
> F.21A **לא** עונה על: "מה לעשות בשיעור הבא בכיתה הזו?"

**F.21E עונה על המה-לעשות.** הוא לא מחליף את F.21A — הוא **מסך חדש ונפרד** (URL נפרד). מורה תיכנס ל-F.21E בבוקר לתכנון; ל-F.21A תיכנס כשהיא צריכה הוכחה למפקחת/הורה.

> ⚠️ **אסור ל-spec להציע למזג בין השניים, או להחליף את F.21A.** השאר את F.21A כפי שהוא.

## 3. הקהל — מורה כיתה א' (לא ילדה, לא מפקחת, לא הורה)

- **שפת התצוגה: פשוטה — "שורה תחתונה".** לא BKT, לא EPA, לא sub-BKT, לא strands, לא confidence intervals. כן: "שולטת היטב", "טועה באמצע מילים", "ילדה חדשה — עדיין לומדים אותה", "מבדק ראמ"ה אמצע שנה — נכשלה בהבנת טקסט מושמע".
- **בלי ניקוד** במסך מורה (ניקוד = רק במסכי ילדה).
- **קונטקסט שימוש:** בבוקר עם קפה, 3 דקות, רוצה תכנית פעולה — לא לקרוא דוחות.

## 4. תשתיות חיות שצריך לבנות עליהן

חשוב מאוד שה-spec של ChatGPT **לא ימציא מחדש** דברים שכבר חיים. שלוש שכבות חיות:

### 4.1 B.7 — Targeted Reading Interventions
- 5 דפוסי אינטרבנציה ב-`underwater-app/js/shared/interventions/*.json`:
  `phonological` · `letter_knowledge` · `decoding` · `fluency` · `letter_cluster`
- כל אינטרבנציה = scripts פדגוגיים מובנים (HOOK · MODELING · GUIDED · INDEPENDENT · FINALE) — 10-15 דקות × 4-5 ימים שבועיים (Tier-2 evidence-based).
- API: `window.AvneiInterventions.detectForStudent(sid)` → רשימת patterns רלוונטיים פר תלמידה.
- ל-F.21E: יש כבר Modal של B.7 פתוח דרך `openInterventionModal(group)` ב-teacher-rama. **אסור לבנות modal חדש — לעשות reuse.**

### 4.2 B.8 — Intervention Matcher
- API: `window.AvneiInterventionMatcher`
  - `matchForStudent(sid)` → `{pattern_id, confidence, source: 'epa'|'moy'|'combined', reason, details}` או null.
  - `matchForGroup(sids[])` → דפוס משותף לקבוצה + evidence.
- מאחד EPA + MOY signals. **EPA מנצח על MOY במקרה של disagreement.**

### 4.3 B.9 — Group Suggestion Engine
- API: `window.AvneiGroupSuggester.suggestGroups(studentIds[], opts)` → `[{pattern_id, students[3-5], confidence, evidence}, ...]` (עד 5 קבוצות).
- **B.9 כבר הוסיף Section למסך teacher-rama** — "🌅 קבוצות בוקר מוצעות" עם כרטיסיות + "📋 פתחי קבוצה".
- > ⚠️ **F.21E לא צריך לבנות מחדש את ה-Morning Group Section.** הוא קיים. F.21E יכול: (א) לעשות לו embed/reuse עם styling חדש, (ב) להחליף אותו ב-version עשיר יותר ולסמן את ה-Section ב-teacher-rama כ-fallback. ה-spec יכריע איזה מהשניים.

### 4.4 MOY-Lite (Middle of Year)
- 60 פריטים מאושרים פדגוגית, חיים ב-`engine/moy-items.json`.
- API: `window.AvneiAssessments.getMOYStatus(sid)` → סטטוס MOY פר תלמידה + `suggested_intervention` שנשמר אוטומטית אחרי 2 fails (פר MOY × B.7 link).
- ל-F.21E: צריך להציג alerts (מי נכשלה, מי מחכה לתאריך repeat, מי טרם ביצעה).

### 4.5 Weakness Targeting (C.12B) + Pack×BKT (C.11-13)
- API: `window.AvneiPackBridge.getNextPackForStudent(sid)` (וריאנט) → pack מותאם.
- ל-F.21E: סיכום "אילו אותיות כל ילדה תרגלה השבוע / צריכה לתרגל" — שילוב עם 22 letters sub-BKT.

## 5. הסקופ של F.21E

### 5.1 מה ה-spec חייב לכלול

הצעת **components** בסדר חשיבות:

| # | Component | מה הוא עושה | מקור הדאטה |
|---|---|---|---|
| 1 | **Hero / סיכום יום** | בראש המסך, שורה אחת: "היום — 29.5: 3 קבוצות מומלצות · 2 תלמידות בודדות · פעימה 1" | אגריגציה של B.9 + B.8 |
| 2 | **Action List — קבוצות בוקר** | 3-5 כרטיסיות (לפי B.9) — "פתחי קבוצה" → modal B.7. + סימון אילו קבוצות בוצעו כבר השבוע. | `AvneiGroupSuggester.suggestGroups()` |
| 3 | **תלמידות בודדות שלא בקבוצה** | תלמידות עם `suggested_intervention` אבל אין group≥3. badge "ממתינה לקבוצה" + הצעה מה לעשות בינתיים (e.g. שילוב ב-pack מותאם). | `AvneiInterventionMatcher.matchForStudent()` פר sid + filter "לא נכנסה ל-B.9" |
| 4 | **MOY Alerts** | מי נכשלה במשימה 3/4, מי מחכה לתאריך repeat, מי לא ביצעה. | `AvneiAssessments.getMOYStatus()` |
| 5 | **Weakness Letters Targeting** | אילו אותיות כל ילדה צריכה לתרגל (top 3 חלשות פר ילדה). תצוגה compact — לא טבלה. | sub-BKT 22 letters + Pack×BKT |
| 6 | **Quick Actions** | לחיצה על שם ילדה → Student View של F.21A (history-aware, ראה memory). פתיחת modal B.7 ישירות. | navigation |

### 5.2 מה לא בסקופ

- ❌ סטטיסטיקה של 22 letters / strands / EPA פר ילדה — זה ב-F.21A.
- ❌ Snapshot של פעימות (BOY/MOY/EOY) — זה ב-F.21A.
- ❌ Confidence indicators (✅🟡⚫) — שפה טכנית מדי.
- ❌ Calibration / E.19 — post-pilot.
- ❌ Modal חדש ל-B.7 — לעשות reuse.
- ❌ שינוי API של B.7/B.8/B.9/MOY — קריאה בלבד.
- ❌ שינוי F.21A — הוא תצפית, נשאר כפי שהוא.
- ❌ ילדים: F.21E לא מציג מסך לתלמידה. אין ניקוד.

## 6. החלטות UX שצריכות תשובה ב-spec

ChatGPT אמור להציע **שתי אופציות לפחות פר החלטה** ולנמק:

1. **F.21E URL נפרד או tab ב-teacher-rama?**
   - אופציה A: `/avnei-yesod/underwater-app/teacher-action.html` (URL נפרד · PIN gate משותף).
   - אופציה B: tab/view-toggle בתוך teacher-rama (3 כפתורים בראש: `מבט כיתה ▣ ` / `מבט תלמידה ▢` / `🌅 פעולה ▢`).
2. **Hero — אגריגטיבי או lean?**
   - A: KPI tiles ("3 קבוצות · 2 בודדות · 4 MOY alerts").
   - B: משפט אחד פרוזה ("היום, מאיה ונועה זקוקות לאינטרבנציה פונולוגית — מוצע לפתוח אותן כקבוצה").
3. **B.9 Section — embed או replace?**
   - A: F.21E עושה reuse של ה-`renderMorningGroupSuggestions()` הקיים.
   - B: F.21E כותב version עשיר יותר; ה-Section ב-teacher-rama נשאר כ-fallback.
4. **Filter/State:**
   - האם צריך filter פר פעימה (1/2/3)? פר תאריך?
   - מה קורה כש-class ריקה? כש-אין הצעות (כל הילדות "תקינות")?
5. **Mobile-first?** המורה צפויה לפתוח על טלפון בדרך לבית-ספר (RTL · קומפקטי). או desktop-first?
6. **Refresh strategy:** F.21E רץ מ-localStorage. האם button "🔄 רענן" ידני, או auto-refresh כל X דקות, או on-focus?

## 7. עקרונות שאסור לעבור עליהם

- **שפה פשוטה** (memory `feedback-avnei-yesod-teacher-language-simplicity`): לא BKT, לא EPA, לא strands.
- **PIN gate** — F.21E מוגן ב-PIN (כמו F.21A · `sessionStorage avnei-rama-auth=1`). אם PIN תקף ל-F.21A → ולידי גם ל-F.21E.
- **ניווט חזרה** (memory `feedback-avnei-yesod-cross-screen-navigation-uses-history-back`): שימוש ב-`history.back()` ולא ב-`location.href`. F.21E ל-Student View ב-F.21A → history-aware.
- **RTL מלא** (עברית).
- **אסור ניקוד** במסך מורה.
- **F.21A נשאר** — F.21E חי לצידו, לא במקומו.

## 8. Deliverable מבוקש

קובץ אחד: **`_handoff/2026-05-29-F21E-ux-spec.md`** — markdown + ASCII wireframes.

המבנה (לפי מבנה F.21A ב-`2026-05-27-F21A-ux-spec.md` שיש בריפו):

```
# F.21E — דשבורד פעולת בוקר למורה
## Wireframe + UX Spec · 29.5.2026 · שלב א' (לפני קוד)

§1 הקשר — איפה F.21E יושב (F.21E vs F.21A · מי משתמש · מתי · השאלה שעונים)
§2 ההחלטות שצריכות תשובה ממיטל (6 ההחלטות מ-§6 לעיל — עם המלצה לכל אחת)
§3 Wireframes — Default View
   3.1 Hero
   3.2 Action List (Morning Groups)
   3.3 תלמידות בודדות
   3.4 MOY Alerts
   3.5 Weakness Letters
§4 Data integration — איזה API נצרך מאיפה (B.7/B.8/B.9/MOY/Pack×BKT)
§5 Empty / Loading / Error states
§6 Mobile + RTL handling
§7 Acceptance criteria לקוד
§8 Out of scope (מה לא נבנה ב-F.21E)
§9 Open questions למיטל
```

**אורך משוער:** 200-400 שורות. דומה ל-F.21A ux-spec.

## 9. Reference materials (בריפו · יש לקרוא לפני כתיבה)

קבצים שכדאי ש-ChatGPT יקבל (או יבקש שמיטל תדביק לו):

1. **`_handoff/2026-05-27-F21A-ux-spec.md`** — דוגמא למבנה spec רצוי.
2. **`_handoff/2026-05-28-pre-pilot-roadmap.md`** — איפה F.21E בסדר הכולל.
3. **`underwater-app/teacher-rama.html`** — F.21A הקיים + B.9 Morning Section (לראות מה כבר עומד).
4. **`underwater-app/js/shared/group-suggester.js`** — B.9 API.
5. **`underwater-app/js/shared/intervention-matcher.js`** — B.8 API.
6. **`underwater-app/js/shared/interventions.js` + `interventions/*.json`** — B.7.
7. **`avnei-yesod/curriculum/pedagogy-integration-framework.md`** — עקרונות פדגוגיים.

## 10. השאלה לפני שמתחילים

לפני שChatGPT יוצא לכתיבה — מומלץ שיציג למיטל:
1. **רשימת 3-5 שאלות הבהרה** שלא נסגרו בbrief הזה.
2. **המלצה מנומקת על §6 שאלה 1** (URL נפרד vs tab) — זו ההחלטה הקריטית ביותר.
3. **table of contents** של ה-spec לפני שכותב את הסעיפים.

## 11. אסור

- לכתוב קוד (HTML/CSS/JS) ב-spec. רק תיאור + ASCII.
- לשנות תוכן של B.7 interventions / MOY items / packs.
- להמליץ למזג F.21A ↔ F.21E.
- להוסיף "תכונות חכמות" שלא ב-roadmap (ML suggestions, AI tutor, וכו').
- להחליט פדגוגית עצמאית.
- שפה טכנית במסך עצמו (BKT, EPA, וכו').

## 12. בספק

שאלי את מיטל — היא קוראת פעיל וזמינה לתשובות מהירות (5-15 דק').

---

*Brief זה מוכן להעתקה ל-ChatGPT (או לסוכן UX אחר). תוצר מצופה: `_handoff/2026-05-29-F21E-ux-spec.md`.*
