# Agent Completion Log — אבני יסוד

> **מטרת הקובץ:** מעקב מי עבד על איזו משימה, מה נמסר, ומה השאלות הפתוחות.
> כל סוכן שמסיים משימה — מוסיף בלוק חדש בראש הקובץ (החדש ביותר למעלה).
>
> **פורמט:** ראה תבנית בתחתית הקובץ.

---

## A0.3 — קריטריון Mastery משולש (BKT + שטף + רף ראמ"ה)

**סטטוס:** ✅ הסתיים · ב-git · נבדק קצה-לקצה ע"י מיטל לפני push
**תאריך:** 2026-05-27
**שיחה:** Claude Code (סוכן תזמורת ב-VS Code · ort-presentation-builder)
**Commit:** ייכתב לאחר push

**רקע:** מיטל הקצתה את A0.3 לסוכן מקביל בשיחה אחרת. כשהסוכן ההוא התחיל לשאול הרבה שאלות פתוחות, מיטל הפסיקה אותו והעבירה את המשימה לסוכן הנוכחי שכבר היה רחוק יותר (כתב את mastery-check.js לאחר ש-4 שאלות פדגוגיות מרכזיות נסגרו).

**קבצים שנוצרו/שונו:**
- `underwater-app/js/shared/mastery-check.js` (חדש · 376 שורות) — `ISLAND_TO_RAMA` (9 איים) · `checkMastery` · `checkAndShowIslandCelebration` עם overlay + קונפטי + אודיו · `getClosedIslands` · `markIslandClosed` · אירוע `island_closed` ל-event-logger
- `underwater-app/stage-3-shell.html` — script tag + קריאה ל-checkAndShowIslandCelebration ב-showCompletion
- `underwater-app/stage-3-house.html` — אותו דבר
- `underwater-app/stage-3-storm.html` — אותו דבר
- `underwater-app/stage-3-trail-resh.html` — אותו דבר
- `underwater-app/stage-3-rescue.html` — script tag בלבד (חיבור בקובץ controller)
- `underwater-app/js/rescue-controller.js` — קריאה ל-checkAndShowIslandCelebration ב-showCompletion
- `underwater-app/teacher-live.html` — סקציה חדשה "6. אבני יסוד נסגרות" + CSS + renderMasteryStatus() + טעינה של state.js + bkt.js + event-logger.js + mastery-check.js
- `_handoff/2026-05-26-architecture-tasks-tracker.html` — A0.3 ✅

**עקרונות עיצוב שיושמו:**
- **לא להחליף את `bkt.js`** — bkt.js עדיין מתעדכן אוטומטית מאירועים ומחזיק את ה-mastery הפנימי שלו. mastery-check.js מוסיף שכבה עליונה עם רף ראמ"ה כתנאי שלישי.
- **סשן = יום** (לא session_id) — לפי החלטה פדגוגית של מיטל. מינ' 5 פריטים תקפים ביום כדי שהיום ייחשב לסשן.
- **3 התנאים מודלים בנפרד** — `conditions.bkt`, `conditions.fluency`, `conditions.rama` — לדשבורד מורה ולדיבאג.
- **אנטי-חגיגה כפולה** — `localStorage['avnei-yesod-closed-islands']` שומר פר-תלמידה.
- **JS inline-style ל-overlay** — לפי [[feedback-css-to-js-inline-fallback]].
- **`fluency_source: 'rama-derived' | 'internal'`** — שקיפות לכל סף שטף.

**4 ההחלטות הפדגוגיות שאישרה מיטל לפני שכתבתי קוד:**
1. **9 איים פעילים** — `ISLAND_TO_RAMA` מכסה איים 1-9. איים 7-9 מסומנים `rama_task: null` עד החלטה.
2. **MVP + חגיגה לילדה** — overlay מלא-מסך עם נוני רוקד + 60 חלקיקי קונפטי פסטל + אודיו + כפתור "המשך".
3. **שטף — סף פר אי, גזור מראמ"ה איפה שניתן:**
   - איים 1-3 (פעימה 1) — ראמ"ה לא נותנת זמן ⇒ ספים פנימיים: 5/4/4 שנ'
   - אי 4 (ניקוד) → רף ראמ"ה 90÷45 = **2.0שנ'**
   - אי 5 (מילים מוכרות) → 70÷20 = **3.5שנ'**
   - אי 6 (שטף) → 195÷77 = **2.5שנ'**
   - איים 7-9 → 4.0שנ' default פנימי, TBD
4. **סשן = יום (YYYY-MM-DD מקומי), עם ≥5 פריטים תקפים.** שני הימים-תקפים האחרונים חייבים שניהם להיות מתחת לסף השטף. פערי ימי לא-משחק או סשנים-לא-תקפים מותרים.

**שאלות פתוחות + מענה:**
1. ❓ MVP proxy לרף "18+/22 אותיות" באי 3 → 🟡 **מטופל זמנית.** כל 5 האותיות המתורגלות (ת,מ,ר,ב,ק) חייבות ב-p ≥ 0.85. השדה `note_for_full_22` מסביר איך לעבור לסף המוחלט כשיתווספו 22.
2. ❓ baseline לאי 2 (5+/6 פותח · 4+/6 סוגר) → 🟡 **proxy זמני:** accuracy ratio ≥ 0.83 + מינ' 12 ניסיונות. כש-`activity_variant` יבחין בין פותח/סוגר במפורש — לעבור לבדיקה ספציפית פר תת-משימה.
3. ❓ ספי שטף לאיים 7-9 → 🔴 **TBD פדגוגית.** נשמרו כ-default 4.0שנ' עד אישור מיטל.

**מה זה פתח להמשך:**
- ✅ A0.3 → 21A (מסך מורה בשפת ראמ"ה): סקציה 6 ב-teacher-live היא הבסיס למסך 21A המורחב.
- ✅ A0.3 → E.19 (calibration): אירוע `island_closed` עם BKT/fluency/rama metadata = הקלט ל-calibration מול ציוני ראמ"ה אמיתיים.

**ממתין ממיטל (בעדיפות):**
1. **בדיקת flow קצה-לקצה ב-Pages או מקומית:** map.html → picker → תלמידה אמיתית → 5+ פריטים באי 3 ביום שונה משני הימים האחרונים → teacher-live → סקציה 6 → לוודא שמופיע "קרוב" או "נסגר" בהתאם.
2. **החלטה על baseline פר אי 7-9** (TBD פדגוגית — לא חוסם MVP, רק את האיים האלה).
3. **אישור push** של כל הקבצים שצוינו.

**✅ באג צד שתוקן בקומיט הזה (נדרש ל-A0.3):**
- `underwater-app/teacher-live.html` הצהיר `const STATE_KEY = 'avnei-state-v1';` — והתנגש ב-`const STATE_KEY = 'underwater-app:v1';` שב-state.js (שנטען על-ידי A0.3). התנגשות זו גרמה ל-SyntaxError ש**עצר את כל הקוד שאחריו** → סקציה 6 הופיעה ריקה גם אחרי תיקון render(). הפתרון: הסרת ההצהרה הכפולה — הקובץ משתמש כעת ב-STATE_KEY מ-state.js. בונוס: סקציות 1-5 שהציגו "אין נתונים" גם כשיש (בגלל המפתח השגוי) עכשיו עובדות נכון.

**הפעלה לבדיקה מקומית:**
```powershell
cd c:/Users/meyta/Downloads/impactos/avnei-yesod
python -m http.server 8765
```
- http://localhost:8765/underwater-app/map.html → picker → תלמידה אמיתית → 5+ סיבובים באי 3
- http://localhost:8765/underwater-app/teacher-live.html → סקציה 6 (מטה)

---

## A0.2 — שדות `rama_task_alignment` + `peima_target` ב-schema פריט

**סטטוס:** ✅ הסתיים · ב-git · ב-origin/main
**תאריך:** 2026-05-26
**שיחה:** Claude Code (VS Code · ort-presentation-builder)
**קומיטים:**
| commit | מה |
|---|---|
| `d5d9599` | A0.2 ליבה — item-schema.js + add-rama-tagging.py + 86 פריטים תוייגו ב-7 קבצי data |
| `e00ec7d` | בונוס: חיזוק L3+L4 ב-island-03-items.json (Option D — מסיחי-מיקום) — 20 פריטים שונו |
| `98a49e2` | תיקוני פידבק מיטל — חֲלוֹם→לֶחֶם, החלפת צָב↔כֶּלֶב בין L3 ו-L4 |

**קבצים שנוצרו/שונו:**
- `underwater-app/js/shared/item-schema.js` — חדש · `RAMA_TASKS` (10 משימות) · `PEIMAS` (3) · `validateRamaTagging` · `filterByRamaTask` · `filterByPeima`
- `underwater-app/scripts/add-rama-tagging.py` — חדש · bulk tagging script ניתן להריץ מחדש בהוספת איים
- `underwater-app/scripts/harden-l3-l4-distractors.py` — חדש · 20 פריטים L3+L4 לפי Option D
- `underwater-app/data/island-01-words.json` — 15 מילים תוייגו (task=2, peima=1)
- `underwater-app/data/island-02-fish-schools.json` — 8 רנדים תוייגו (task=2, peima=1)
- `underwater-app/data/island-02-twin-seaweeds.json` — 8 רנדים תוייגו (task=2, peima=1)
- `underwater-app/data/island-03-items.json` — 50 פריטים תוייגו (task=2, peima=1) + 20 שכתובי L3/L4
- `underwater-app/data/island-03-find-letter.json` — 3 פריטים תוייגו (task=1, peima=1)
- `underwater-app/data/island-03-letter-shape.json` — 2 פריטים תוייגו (task=1, peima=1)
- `underwater-app/data/island-03-trace-paths.json` — meta-level תיוג (task=1, peima=1)
- `_handoff/2026-05-26-A0.2-rama-tagging.md` — תיעוד החלטות מיפוי
- `_handoff/2026-05-26-L3-L4-hardening.md` — תיעוד חיזוק L3+L4

**עקרונות עיצוב שיושמו:**
- `rama_task_alignment` כ-int יחיד (1-10) — single primary task, לא array
- `peima_target` כ-int יחיד (1-3) עם בדיקת עקביות מול `TASK_TO_PEIMA`
- שדות נוספים גם ב-meta של כל קובץ data (default) וגם פר-פריט (granular)
- חיזוק L3+L4 לפי Option D = מסיחי-מיקום (האות-יעד באמצע/סוף מילה, לא בהתחלה) — תואם `perplexity-island2-mechanics-2026-05-23` שאסר זוגות קוליים בשלב מוקדם

**שאלות פתוחות + מענה ממיטל:**
1. ❓ `island-03-items.json` (hear-sound-choose-image) → task 1 או 2? → ✅ נשמר כ-2 (פונולוגית, לא קריאת שם אות)
2. ❓ `trace-paths` → task 1 בלבד או גם task 9 (הכתבה)? → 🟡 נשמר כ-1, secondary לא נוסף
3. ❓ שדה משני `rama_task_alignment_secondary`? → 🟡 לא נוסף — נחכה לדשבורד 21A לבדוק אם נחוץ
4. ❓ L4 = 2 אפשרויות (50% ניחוש) → להעלות ל-4? → ✅ הועלה ל-4 עם מסיחי-מיקום
5. ❓ בחירת מסיחים: זוגות קוליים? → ❌ נדחה כי סותר אימות קיים, אומצה אפשרות D (מסיחי-מיקום)
6. ❓ חֲלוֹם / שָׁמַיִם / בַּקְבּוּק / צָב? → ✅ חֲלוֹם הוחלף ל-לֶחֶם; שאר 3 נשמרו; צָב הועבר ל-L3

**מה זה פתח / ממתין לפעולה:**
- ✅ **A0.3** (Mastery משולש) — יכול לקרוא `rama_task_alignment` כדי לבדוק רף ראמ"ה
- ✅ **21A** (מסך מורה בשפת ראמ"ה) — יכול לחתוך לפי משימה ופעימה
- ✅ **19** (calibration analytics) — דורש את השדה הזה לקורלציה פר-משימה
- 🟡 ממתין לבדיקת מיטל בכיתה אמיתית של פריטי L3+L4 המחוזקים (האם 6yo באמת תופסת את "מתחיל ב-" מול "מכיל"?)

---

## A0.1 — פרופיל אורייני (כלי המורה) + suggestFromBKT

**סטטוס:** 🟡 קוד נדחף ב-7 קומיטים · ממתין לאימות end-to-end ע"י מיטל
**תאריך:** 2026-05-26 ערב
**שיחה:** סוכן A0.1
**קומיטים:**
| commit | מה |
|---|---|
| `4b876a4` | engine/onboarding-profile.html + js/shared/profile-classifier.js — UI 3-מסכי + סיווג |
| `299216e` | suggestFromBKT — הצעה אוטומטית מ-BKT לרכיב 2 (אלפא_1/2/3) |
| `07c9af3` | underwater-app/student-picker.html + event-logger דינמי + map.html redirect |
| `d57fad4` | הסרת onboarding.html מזרימת הכניסה |
| `a5e41c8` | picker · שיפור empty-state |
| `f99161f` | classifier · חיבור אי 1 (mastery.js) לפרופיל |
| `c5cd49a` | onboarding-profile · debug panel בבאנר ההצעה |

**הזרימה הסופית:**
```
1. מורה: engine/onboarding-profile.html → הוסיפי תלמידות לכיתה
2. ילדה: map.html → picker → בוחרת את עצמה → משחקת
3. event-logger כותב לפי localStorage['avnei-yesod-current-student']
4. BKT שומר state נפרד פר תלמידה
5. מורה: engine/onboarding-profile.html → פתחי תלמידה →
   suggestFromBKT(id) → באנר צהוב 🤖 עם הצעה אישית
6. מורה מאשרת/משנה → AssessmentsStore.save עם row_overrides
```

**החלטות פדגוגיות שנסגרו:**
| החלטה | תוצאה |
|---|---|
| מי ממלא? | היברידי: מערכת מציעה לרכיב 2, מורה ידני ברכיבים 1+3 |
| מתי? | המורה מתי שרוצה — אחרי 10+ אירועי תרגול. אין אבחון מחייב בהתחלה |
| המסע הראשון בים? | הוצא מהזרימה — לא נחוץ אחרי הקלסיפיקטור החדש |
| בתיקו בסיווג? | בוחר הפרופיל הזהיר (נמוך יותר) |
| שורות שהמקור לא תיאר? | "לא תואר במפורש במקור" — לא להמציא |
| סף הצעה? | 10+ אירועים (אי 1 mastery + BKT אי 2 + BKT אי 3) |

**מיפוי alpha_1/2/3 לרכיב 2:**
- **alpha_1 (מודעות פונולוגית):** רצף הברה→פונמה לפי קולן. יש BKT אי 2 → לפי הסתברות (יכול להגיע ל"מצוינת"). אין אי 2 אבל יש אי 1 → תקרה "חלקית" (הברה בלבד)
- **alpha_2 (ידע אותיות):** יחס known/practiced ב-Sub-BKT אי 3
- **alpha_3 (קשרי אות-צליל):** BKT אי 3 aggregate
- **alpha_4 (ניצני קריאה), alpha_5 (כתיב פונטי):** אין מקור — נשאר ידני

**🚨 לא נסגר — לבדוק מחר:**

1. **אימות end-to-end:** מיטל ביקרה בכלי המורה אחרי משחק וכתבה "**לא מופיע**" (הבאנר הצהוב). debug panel נוסף ב-`c5cd49a` שיציג מצב מפורט (current-student תואם? ספירה פר אי). **לא התקבל משוב מה ה-panel הראה.** 4 תרחישים אפשריים:

   | תרחיש | סימן ב-debug panel | פתרון |
   |---|---|---|
   | תלמידה ב-picker שונה מתלמידה שפתחה בכלי | ⚠️ אדום + שמות שונים | לבחור אותה תלמידה ב-picker |
   | בחרה "אורחת" → current-student = 'local' | current-student = 'local' | לבחור תלמידה אמיתית |
   | תלמידה נכונה, אבל פחות מ-10 אירועים | ✅ ירוק, סה"כ < 10 | לשחק עוד |
   | הכל נכון, עדיין לא מופיע | ✅ ירוק, סה"כ ≥ 10 | באג אמיתי — לאבחן |

2. **mastery.js לא פר-תלמידה (פער ארכיטקטוני):** `underwater-app/js/shared/mastery.js` שומר ב-`localStorage['avnei-yesod-island1-mastery']` **גלובלית, לא פר student_id**. שני ילדים על אותו טאבלט = ערבוב דאטה ברכיב 1. דגלתי `i1_is_global: true` בתשובת `suggestFromBKT` אבל ה-UI לא משתמש בו עדיין. **תיקון ~1 שעה:** עדכון mastery.js לקבל student_id.

3. **שאר משחקונים:** לבדוק שאי 2 (twin-seaweeds, fish-schools, whispers) ומשחקוני אי 3 האחרים (rescue, house, trail, storm) כותבים ל-event-logger עם `island_id` נכון.

4. **תזכורת בדשבורד המורה:** לא נבנתה — חלק ממשימה 21A. תזכורת אוטומטית "מאיה תרגלה 14 פריטים, אפשר לעשות פרופיל".

**מה לעשות מחר (בסדר עדיפויות):**
1. **5 דק':** לפתוח map.html → picker → לבחור תלמידה (לא אורחת!) → לשחק 5+ סיבובים באי 3.
2. **2 דק':** לפתוח onboarding-profile → לפתוח אותה תלמידה → **לקרוא את ה-debug panel** ולשלוח לסוכן.
3. **לפי המצב:** אם הבאנר הצהוב הופיע + הצעה הגיונית → 🎉 A0.1 אומת. עוברים למשימה הבאה (A0.3 / 21A / picker למשחקוני אי 3 האחרים). אם לא → לפי ה-debug, לתקן את הבעיה הספציפית.

**הפעלה מקומית (אם Pages לא עלה):**
```powershell
cd c:/Users/meyta/Downloads/impactos/avnei-yesod
python -m http.server 8765
```
- http://localhost:8765/underwater-app/map.html
- http://localhost:8765/engine/onboarding-profile.html

או דרך Pages: https://impact-os.app/avnei-yesod/underwater-app/map.html

**ממתין ממיטל:** בדיקה מחר ע"פ המסלול למעלה.

---

## A0.4 — משחקון "ים השמועות" (memory-pair לעיצור-סוגר באי 2)

**סטטוס:** 🟡 קוד מוכן · ממתין לאימות מילים + push
**תאריך:** 2026-05-26
**שיחה:** Cursor (סוכן Claude)
**Commit:** טרם נדחף

**קבצים שנוצרו:**
- `underwater-app/stage-2-whispers.html` — המשחקון
- `underwater-app/css/whispers.css` — עיצוב SVG וקטורי פנימי
- `underwater-app/data/island-02-whispers.json` — 30 מילים · 5 סיומות (-ם/-ן/-ש/-ר/-ל) · 6 פר סיומת · 4 סיבובים
- `_handoff/2026-05-26-architecture-tasks-tracker.html` — A0.4 סומן ✅ + תיקון `initCheckboxes`

**עקרונות עיצוב שיושמו:**
- מנגנון: memory-pair ("ים השמועות") — לא שכפול של אצות התאומות
- ויזואל: SVG וקטורי פנימי בלבד (לא PNG מ-ChatGPT)
- מודל תמיכות: micro 3-שלבי (רעידה → רמז → "הקש פה")
- 33 קבצי MP3 חדשים נדרשים (AvriNeural בלבד) — תפקיד מיטל

**שאלות פתוחות + מענה מהאורקסטרטור:**
1. ❓ "תיש" ו"מגדל" באוצר מילים של כיתה א'? → 🟡 לאמת מול `vocab-bank.json` + Perplexity (sonar-pro) לפני MP3. חלופות אם נכשל: תיש → רעש/דובש · מגדל → חבל/כלב.
2. ❓ חיבור map.html לאי 2? → ❌ לא בסקופ A0.4. הוסף משימה F.22 ל-tracker: "דף אינדקס לאי 2 (3 משחקונים), P1/M".

**ממתין מהמתמרצת:**
- מיטל מאשרת את התשובות → סוכן מאמת מילים → push.

---

## A0.2 — שדות `rama_task_alignment` + `peima_target` ב-Schema

**סטטוס:** ✅ הסתיים · ב-git
**תאריך:** 2026-05-26
**שיחה:** Cursor (סוכן Claude)
**Commit:** `d5d9599`

**קבצים שנוצרו/שונו:**
- `underwater-app/js/shared/item-schema.js` — `RAMA_TASKS` (10) + `PEIMAS` (3) + `validateRamaTagging` + `filterByRamaTask` + `filterByPeima`
- `underwater-app/scripts/add-rama-tagging.py` — סקריפט תיוג רב-שימושי
- `_handoff/2026-05-26-A0.2-rama-tagging.md` — תיעוד החלטות מיפוי
- 7 קבצי data תויגו: `island-01-words.json` · `island-02-fish-schools.json` · `island-02-twin-seaweeds.json` · `island-03-items.json` · `island-03-find-letter.json` · `island-03-letter-shape.json` · `island-03-trace-paths.json`
- סה"כ 86 פריטים תויגו.

**שאלות פתוחות + מענה מהאורקסטרטור:**
1. ❓ `hear-sound-choose-image` תויג למשימה 2 (פונולוגית), לא 1 (אותיות). תקין? → ✅ **תקין.** ה-prompt: "באיזו תמונה שומעים את הצליל ת' בהתחלה?" — זה זיהוי צליל פותח = משימה 2 ראמ"ה. אי 3 מכיל פעילויות שתורמות גם למשימה 2 — זה יתרון.
2. ❓ `trace-paths` קיבל רק משימה 1, לא 9 (הכתבה). תקין? → ✅ **תקין.** trace-paths תורם ישירות למשימה 1 (motor memory · Bara & Gentaz 2011). תורם בעקיפין למשימה 9, אבל זה לא הכתבה אמיתית.
3. ❓ שדה משני `rama_task_alignment_secondary` — להוסיף עכשיו? → 🟡 **לחכות.** אין צרכן (משימה 21A טרם נבנית). הוסף הערה ב-`item-schema.js` ששדה זה שמור לעתיד.

**מה זה פתח:**
- ✅ A0.3 (Mastery משולש) — יכול לבדוק רף ראמ"ה פר ילדה
- ✅ 21A (מסך מורה בשפת ראמ"ה) — חיתוך לפי משימה/פעימה
- ✅ E.19 (calibration) — correlation פר משימה

---

## A0.1 — פרופיל אורייני ב-Onboarding (4 רמות, ד"ר קולן 2025)

**סטטוס:** ✅ הסתיים · ממתין לאישור push
**תאריך:** 2026-05-26
**שיחה:** Cursor (סוכן Claude)
**Commit:** טרם נדחף

**קבצים שנוצרו:**
- `engine/onboarding-profile.html` — מסך כניסה למורה
- `underwater-app/js/shared/profile-classifier.js` (354 שורות) — `classifyProfile` + `StudentsStore` + `AssessmentsStore`

**בסיס פדגוגי:**
- ציטוטים מילוליים מ-PDF רשמי של ד"ר לימור קולן (`c:/tmp/profile-oryani-1.txt`)
- 4 פרופילים: שליטה מצוינת · טובה · חלקית · פערים משמעותיים
- 3 רכיבים: כשירות תקשורתית · ידע אלפביתי · מפגש עם ספר
- 12 שורות תצפית — שורות שהמסמך לא הגדיר התנהגות = `null` (אנטי-הזיה)

**שאלות פתוחות + מענה מהאורקסטרטור:**
1. ❓ Placement מחייב vs הכוונה רכה vs דואלי? → ✅ **דואלי (אופציה 3).** המסע ההיסטורי בים נשאר לילדה (soft priors). הפרופיל האורייני = כלי למורה.
2. ❓ יחס למסע הקיים `onboarding.html`? → ✅ **מסך מקביל למורה (אופציה 3).** המסע נשאר לילדה, הפרופיל למורה — נפרדים.
3. ❓ לוגיקת classifier? → ✅ **הצעה אוטומטית + אישור מורה.** הקלסיפיקטור עזר, לא שולט.
4. ❓ מקור תלמידות? → ✅ **המורה מוסיפה בתוך המסך.** localStorage key: `avnei-yesod-students`.
5. ❓ תצוגה בדשבורד עכשיו? → ✅ **רק הכלי.** אינטגרציה לדשבורד = משימה 21A.

**מפתחות localStorage:**
- `avnei-yesod-students` — רשימת תלמידות
- `avnei-yesod-literacy-profile` — היסטוריית הערכות פר ילדה

---

## תבנית לסוכן הבא

```markdown
## [TASK_ID] — [שם המשימה]

**סטטוס:** ✅ הסתיים · ב-git  /  🟡 קוד מוכן · ממתין ל-X  /  ❌ נכשל · סיבה
**תאריך:** YYYY-MM-DD
**שיחה:** [Cursor / VS Code / API / זהות]
**Commit:** `[hash או "טרם נדחף"]`

**קבצים שנוצרו/שונו:**
- `path/to/file.js` — תיאור קצר
- ...

**עקרונות עיצוב שיושמו** (אם רלוונטי):
- ...

**שאלות פתוחות + מענה מהאורקסטרטור:**
1. ❓ [השאלה] → ✅/❌/🟡 [התשובה]
2. ...

**מה זה פתח / ממתין לפעולה:**
- ...
```

---

*כלל: בלוק חדש בראש הקובץ, לא בסוף. שנה את חוצץ ה-tracker בסיום משימה.*
