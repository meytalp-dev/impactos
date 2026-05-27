# Bootstrap לסוכנים — אבני יסוד 26.5.2026 ערב

מסמך זה נועד לפתיחת שיחות Claude/Cursor חדשות עם סוכן ייעודי למשימה ספציפית.
**העתיקי את הסעיף הרלוונטי כראשון בשיחה החדשה.**

---

## 🟢 קונטקסט-על שמשותף לכל הסוכנים

```
את/ה סוכן עבודה לפרויקט "אבני יסוד" — מערכת תרגול דיגיטלית-אדפטיבית לרכישת קריאה בעברית בכיתה א'.

הריפו: meytalp-dev/impactos · נתיב מקומי: c:/Users/meyta/Downloads/impactos/avnei-yesod/
מנהלת הפיתוח: מיטל פלג.

### המסגרת הפדגוגית (חידוד 26.5.2026 ערב — חובה לזכור!)
- משרד החינוך (תוכנית תשפ"ו, פרופ' שני) קובע את היעדים
- ראמ"ה — כזרוע המדידה של משה"ח — בודקת אותם (10 משימות + 3 פעימות)
- אבני יסוד = התרגול הדיגיטלי-האדפטיבי שמכין למבדק ראמ"ה — לא מבנה עצמאי

### אזהרות אסור-לחזור-עליהן
- ❌ Shatil & Share 2003 לא הציעו שלבים (זו הזיה — המאמר עוסק במנבאים בלבד)
- ❌ Share & Bar-On 2018 = 3 פאזות (Triplex), לא 6 שלבים. 6 שלבים שייכים למשה"ח (סינתזה)
- ❌ "18 אותיות מ-22" = רף "תקין" של ראמ"ה, לא ממוצע אמפירי

### ⚠️ קבצים DEPRECATED — לא לבסס עליהם תוכן (עודכן 27.5.2026 לילה)
הקבצים הבאים הם **גרסה 1.0** של הארכיטקטורה (מבוססת "9 מיומנויות"). הם נשארים ב-repo לצרכי המשכיות ויזואלית, אבל **אינם מקור-אמת**:

**מצגות וויזואלים ישנים:**
- `spec.html` (טיוטה ויזואלית v1) — מכיל banner DEPRECATED בראש
- `index.html` · `README.md` — מתארים 9 מיומנויות
- `sales/presentation-municipal.html` · `sales/proposal-municipal.html` · `sales/proposal-onepager.html` · `partners-qa.html` — מצגות מכירה ישנות
- `engine/demo.html` · `engine/diagnostic.html` · `engine/pedagogy-grade1.html` — engine ישן
- `curriculum/pedagogy-master.md` · `curriculum/literacy-grade1-2-yearly.html` — תיעוד פדגוגי ישן

**🆕 קוד פעיל באפליקציה — אבל ארכיטקטורת v1, לא לבסס דשבורד חדש:**
- `underwater-app/teacher-live.html` — דשבורד מורה v1 (פר-משחקון, 5 אותיות, בלי BKT-per-strand). **מסך מורה חדש מתוכנן כ-`teacher-rama.html`** לפי `_handoff/2026-05-27-F21A-ux-spec.md`. אם סוכן מתבקש לבנות "דשבורד מורה" — חובה לקרוא את ה-spec של F.21A קודם.

**מקורות-אמת מעודכנים (חובה לבסס עליהם):**
- `architecture-mvp.md` — ארכיטקטורה (5 סטרנדים + BKT + EPA + sub-BKT פר אות)
- `curriculum/pedagogy-integration-framework.md` — מסגרת פדגוגית v2.3
- `curriculum/literacy-grade1-2-yearly.md` — תוכנית שנתית (עם הבהרה "9 מיומנויות = תיעוד פדגוגי, המערכת = 5 BKT-ים")
- `curriculum/llm-pitfalls.md` — תיעוד 3 הטעויות (Shatil/Bar-On/18 אותיות)
- `_handoff/2026-05-27-F21A-ux-spec.md` — UX spec למסך מורה החדש (teacher-rama.html)
- `_handoff/2026-05-27-d15-spec.md` — spec לשכפול 17 אותיות חסרות באי 3

### כללי עבודה גלובליים
- לא להחליט פדגוגית באופן עצמאי — בספק לשאול את מיטל
- לא לדחוף ל-git בלי אישור מפורש של מיטל
- לא לעדכן מסמכי-אם (architecture-mvp.md, pedagogy-integration-framework.md, literacy-grade1-2-yearly.md) בלי אישור
- אסור להמציא ציטוטים אקדמיים — אם אין PDF, לסמן [verification-pending]
- AvriNeural בלבד לכל TTS חדש (לא Hila)
- PIL transparency + crop&center חובה על כל PNG מ-ChatGPT

### מסמכים שחובה לקרוא לפני שמתחילים
1. `_handoff/orchestrator-handoff-2026-05-26-evening.md` — סטטוס תזמורת
2. `_handoff/2026-05-26-partners-review-v3.md` — המסמך הפדגוגי + טכני המלא
3. `_handoff/2026-05-25-architecture-tasks.md` — דף המשימות (עודכן 26.5)
4. הזיכרון: `avnei-yesod-master` + `project-avnei-yesod-architecture-mvp` + `project-avnei-yesod-pedagogy-integration`

### בסיום המשימה (חובה — אל תדלג על אף שלב)
1. עדכן את ה-tracker: `_handoff/2026-05-26-architecture-tasks-tracker.html` (סמן את ה-checkbox של המשימה)
2. הוסף בלוק חדש **בראש** `_handoff/agent-completion-log.md` לפי התבנית שבסוף הקובץ. כלול:
   - סטטוס (✅ הסתיים / 🟡 ממתין ל-X / ❌ נכשל)
   - תאריך, שיחה (Cursor / VS Code / API), commit hash (או "טרם נדחף")
   - רשימת קבצים שנוצרו/שונו עם תיאור קצר
   - שאלות פתוחות + מענה שקיבלת ממיטל (אם היו)
   - מה זה פתח להמשך / ממתין לפעולה
3. כתוב סיכום קצר למיטל
4. חכה לאישור לפני git push
```

---

## 🚀 סוכן 1 — משימה A0.2: שדות ראמ"ה ב-Schema של פריט

**רמת קושי:** S (עד שבוע) · **עדיפות:** P0 · **תלות:** אין · **מי תלוי בה:** A0.3, A0.4, 21A, 19

### המשימה
הוספת 2 שדות חדשים ל-schema של פריט תרגול, וחיבורם לכל הקוד הקיים.

### שדות חדשים

```js
{
  // שדות קיימים...
  rama_task_alignment: 1-10,    // לאיזו ממ-10 משימות ראמ"ה הפריט תורם
  peima_target: 1-3             // באיזו פעימה רלוונטי (1=ספט-אוק, 2=ינו-פבר, 3=מאי-יוני)
}
```

### מפת המשימות של ראמ"ה (לעיון בעת תיוג פריטים)

| משימה | תוכן | פעימה |
|---|---|---|
| 1 | קריאת שמות אותיות | 1 |
| 2 | מודעות פונולוגית (פותח/סוגר) | 1 |
| 3 | הבנת טקסט מושמע | 2 |
| 4 | מודעות לשונית | 2 |
| 5 | קריאת 45 צירופים מנוקדים | 3 |
| 6 | קריאת 20 מילים מוכרות | 3 |
| 7 | קריאת 20 מילים לא-מוכרות | 3 |
| 8 | קריאת סיפור "השבלול" | 3 |
| 9 | הכתבת 10 מילים | 3 |
| 10 | הבנת הנקרא | 3 |

### צעדים

1. **קובץ קיים? חדש?** ראשית בדוק אם יש `js/shared/item-schema.js` — אם לא, צור אותו.
2. **הוסף את 2 השדות לסכמה** עם בדיקת תקינות בסיסית (integer בטווח).
3. **עדכן את 5 קבצי המשחקונים באי 3** להוסיף את השדות לכל פריט. כל 5 שייכים למשימה 1 ופעימה 1 (זיהוי אותיות):
   - `underwater-app/stage-3-shell.html` (מ)
   - `underwater-app/stage-3-rescue.html` (ק)
   - `underwater-app/stage-3-house.html` (ב)
   - `underwater-app/stage-3-trail-resh.html` (ר)
   - `underwater-app/stage-3-storm.html` (ת)
   → כולם: `rama_task_alignment: 1, peima_target: 1`
4. **עדכן את `js/shared/event-logger.js`** — בכל אירוע שנשמר, להעתיק את 2 השדות מהפריט.
5. **בדיקה ידנית:** הפעל סשן בכל אחד מהמשחקונים, בדוק שב-localStorage האירועים מכילים את 2 השדות.

### קריטריון סיום
- [ ] schema מעודכן ב-`js/shared/item-schema.js`
- [ ] 5 קבצי משחקונים מעודכנים עם השדות
- [ ] Event logger כותב את השדות בכל אירוע
- [ ] בדיקה ידנית עברה ב-5 משחקונים
- [ ] tracker.html מעודכן (✅ A0.2)
- [ ] **בלוק חדש נוסף בראש `_handoff/agent-completion-log.md`**

### בסיום
1. עדכן את `_handoff/agent-completion-log.md` (בלוק חדש בראש הקובץ לפי התבנית שבסוף)
2. דווח למיטל: "A0.2 מוכן — 5 משחקונים מתויגים למשימה 1 ראמ"ה. ממתין לאישור push."
3. **אל תדחוף ל-git לפני אישור.**

---

## 🚀 סוכן 2 — משימה A0.3: קריטריון Mastery משולש

**רמת קושי:** S · **עדיפות:** P0 · **תלות:** A0.2 חייב להסתיים קודם

### המשימה
פיתוח לוגיקה שמחליטה מתי ילדה "סוגרת אי", לפי 3 תנאים יחד.

### 3 התנאים

1. **p(BKT) > 0.90** — הציון של ה-BKT עבור הסטרנד הראשי של האי
2. **שטף עומד** — זמן תגובה חציוני יציב ב-2 סשנים רצופים (פחות מ-X שניות פר פריט)
3. **רף ראמ"ה במשימה המקבילה** — לדוגמה: באי 3 (זיהוי אותיות) — Sub-BKT של 18+/22 אותיות מעל 0.85

### צעדים

1. צור `js/shared/mastery-check.js` עם function ראשי: `checkMastery(student_id, island_id) → {met: boolean, conditions: {bkt, fluency, rama}}`
2. הוסף מיפוי `ISLAND_TO_RAMA` בקובץ: לכל אי 1-22, מהי משימת ראמ"ה ומהו הרף.
3. חבר ל-flow קיים — כשילדה מסיימת סשן, ה-flow קורא ל-checkMastery ומעדכן `closed_islands` ב-localStorage.
4. הוסף ל-`teacher-live.html` תצוגה: "מאיה — אי 3 נסגר ✅" / "נועה — אי 3 פתוח, חסר שטף".

### קריטריון סיום
- [ ] `mastery-check.js` מחזיר תוצאה מדויקת ב-3 תנאים
- [ ] מיפוי ISLAND_TO_RAMA מוגדר ל-9 איים פעילים
- [ ] flow מסיום סשן קורא ומעדכן
- [ ] **בלוק חדש נוסף בראש `_handoff/agent-completion-log.md`**
- [ ] tracker מציג אילו איים נסגרו (✅)
- [ ] tracker.html מעודכן (✅ A0.3)

---

## 🚀 סוכן 3 — משימה A0.1: פרופיל אורייני ב-Onboarding

**רמת קושי:** M · **עדיפות:** P0 · **תלות:** אין (יכול לרוץ במקביל ל-A0.2)

### המשימה
מסך כניסה ראשון לילדה — אבחון פרופיל אורייני לפי ד"ר לימור קולן (משה"ח 2025).

### 4 הרמות

| פרופיל | מאפיינים | היכן מתחילה |
|---|---|---|
| שליטה מצוינת | כל האותיות + רמת פונמה + כתיב פונטי מלא | אי 3 + אי 2 (דילוג על אי 1) |
| שליטה טובה | רוב האותיות + רמת צירוף/פונמה | אי 3 + אי 2 בקצב רגיל |
| שליטה חלקית | חלק מהאותיות + רמת הברה/צירוף | אי 1 → אי 2 → אי 3 |
| פערים משמעותיים | פערים ברכיבים | התערבות אינטנסיבית באי 1 |

### צעדים

1. **בנה `engine/onboarding-profile.html`** — מסך אחד עם 3 משימות מהירות (5-7 דקות):
   - אבחון אותיות (כמה מ-22 מזהה)
   - אבחון מודעות פונולוגית בסיסית
   - אבחון כשירות תקשורתית קצרה (אופציונלי)
2. **בנה `js/shared/profile-classifier.js`** — function שמחזיר entry_profile (1-4) לפי תוצאות
3. **שמור ל-localStorage** את הפרופיל + תאריך
4. **חבר ל-flow** — בכניסה ראשונה, הילדה מועברת ל-onboarding לפני שהמערכת מציעה משחקון

### חשוב
- **לא להחליט פדגוגית** על תוכן המשימות בעצמך — לקרוא קודם את `curriculum/pedagogy-integration-framework.md` ולשאול את מיטל
- **AvriNeural בלבד** לכל הקראה במסך
- לא להציג ציון למורה לפני יום 4 (Cold-start — משימה A.5 שתבוצע בנפרד)

### קריטריון סיום
- [ ] onboarding-profile.html פעיל
- [ ] profile-classifier.js מחזיר תוצאה תקינה ב-4 פרופילים
- [ ] entry_profile נשמר ב-localStorage
- [ ] flow מפנה ל-onboarding בכניסה ראשונה
- [ ] tracker.html מעודכן (✅ A0.1)
- [ ] **בלוק חדש נוסף בראש `_handoff/agent-completion-log.md`**

---

## 🚀 סוכן 4 — משימה D.15: שכפול ל-17 אותיות באי 3 (P0 · M · חוסם פיילוט)

**רמת קושי:** M (12-15 שעות, מומלץ לפצל לסשנים)
**עדיפות:** P0 (חוסם פיילוט — חוסם רף "תקין" של 18+/22 אותיות במבדק ראמ"ה)
**תלות:** D.14 ✅ (התבנית הגנרית קיימת ב-`js/templates/`, demo חי ב-`stage-3-template-demo.html`)

### הקונטקסט
D.14 בנתה shell + 3 mechanics + demo (אות ש, נושא בועות). D.15 משלימה ל-22 אותיות באי 3 (5 אמנותיים קיימים + 16 חדשים) דרך **4 קבוצות נושאיות** שאישרה מיטל ב-27.5.

### החלוקה הסגורה ל-4 קבוצות

| נושא | אותיות | counter.unit | finale audio key |
|---|---|---|---|
| 🫧 בועות בים *(ש כבר חי)* | ש · ל · נ · א | בּוּעוֹת | finale-bubbles-found |
| ⭐ כוכבי הים | ז · י · ו · ה | כּוֹכָבִים | finale-stars-collected |
| 🐚 צדפי החוף | ס · ע · צ · ט | צְדָפִים | finale-shells-opened |
| 🐟 להקת הדגים | ד · ג · ח · פ · כ | דָּגִים | finale-fish-gathered |

נשאר לבנייה: 16 משחקונים (ש כבר חי).

### מסמכים שחובה לקרוא לפני קוד
1. **`_handoff/2026-05-27-d15-spec.md`** — הספק המלא של D.15 (מסמך-האם)
2. `data/island-03-letters/_schema.md` — סכמת JSON + מדיניות 4 הנושאים
3. `data/island-03-letters/shin.json` — תבנית-מאסטר להעתקה
4. `_handoff/orchestrator-handoff-2026-05-27-evening.md` (+ חדש יותר אם יש)
5. זיכרון:
   - `project-avnei-yesod-d14-template-theme-decision` (Full C + חלוקה)
   - `feedback-tts-hebrew-niqud-pitfalls` (3 כללי TTS עברי)
   - `feedback-avnei-yesod-correct-answer-audio-pattern` (דפוס B)
   - `feedback-avnei-yesod-visible-text-niqud` (ניקוד מלא בכל טקסט)
   - `feedback-image-generation-meytal-task` (SVG inline כן, PNG לא)

### סדר בנייה (לעצור אחרי כל שלב לאישור מיטל)

1. **השלמת קבוצת בועות** (3 אותיות: ל·נ·א) — שכפול קל של shin.json
2. **תשתית theme-aware** — שדה `theme` ב-JSON → game-shell → mechanic. SVG inline פר נושא ב-game-shell.css (כוכב/צדף/דג — לא PNG)
3. **קבוצת כוכבים** (4 אותיות: ז·י·ו·ה) → **לעצור · אישור ויזואל ממיטל**
4. **צדפים** (4 אותיות)
5. **דגים** (5 אותיות)

### יצירת קבצים פר אות

1. `data/island-03-letters/<letter-key>.json` — בסיס shin.json, להחליף: `letter`, `letter_key`, `quest_id`, `distractors`, `theme`, `intro_audio_keys` (קובץ אחד מאוחד), `in_game_prompt_audio_key`, `finale_audio_key`, `title` (מנוקד), `intro_html` (מנוקד), `completion` (מנוקד)
2. `stage-3-<letter-key>.html` — בסיס stage-3-template-demo.html
3. MP3 פר אות: `find-<letter-key>.mp3` בלבד
4. MP3 פר קבוצה (פעם אחת): `intro-<theme>.mp3` + `finale-<theme>-X.mp3`

**Mechanic לכל 16 האותיות החדשות = tap-all בלבד.**

### אזהרות חזקות אסור-לחזור-עליהן

- AvriNeural בלבד · rate `-10%`
- **כֹּל** בחולם (לא כָּל בקמץ-קטן — AvriNeural קורא "kal")
- **"יוֹפִי" בלבד** (לא "יוֹפִי גָּדוֹל" — "גָּדוֹל" מבוטא רע)
- "הָאוֹת X" + "הַ-נושא עם הָאוֹת" (לא "אַלְמוּגֵי X" — סמיכות אקדמית לא מובנת לבני 6)
- **כל טקסט גלוי = מנוקד** (title/counter/intro/completion/aria/כפתורים)
- **intro = קובץ MP3 אחד מאוחד פר נושא** (לא 2). iOS Safari לא מאפשר רצף audio אחרי setTimeout/onended
- אחרי הקשה נכונה: רק צליל-אות + שבח רנדומלי (praise-yofi/metzuyan/mealeh, pick-without-replacement). **לא מילה** — word_pool שייך רק למכניקות עם תמונות
- במעבר בין אודיו: `addEventListener('ended', ...)` ולא `playSequence` (לא עוצר אודיו קודם)

### אסור לגעת ב-

- `bkt.js`, `epa.js`, `event-logger.js`, `mastery-check.js`, `profile-classifier.js`
- 5 משחקוני אי 3 האמנותיים: stage-3-shell/house/rescue/trail-resh/storm.html
- stage-3-template-demo.html (נשאר כ-canonical demo של D.14)
- מסמכי-אם בלי אישור פר-קובץ (architecture-mvp/literacy-grade1-2-yearly/pedagogy-integration-framework/llm-pitfalls)

### עדכון נדרש: map + island index

`stage-3-island.html` צריך לכלול את כל 22 הכרטיסים אחרי D.15. לקרוא איך הוא בנוי כיום לפני שינוי.

### קריטריון סיום

- [ ] 16 קבצי JSON חדשים ב-`data/island-03-letters/`
- [ ] 16 קבצי HTML חדשים בשורש underwater-app
- [ ] ~25 קבצי MP3 חדשים (intro פר נושא × 4 + find פר אות × 17 + finale פר נושא × 4)
- [ ] 3 SVG inline חדשים (stars/shells/fish) ב-`game-shell.css`
- [ ] שדה `theme` ב-game-shell.js + mechanic-tap-all.js
- [ ] stage-3-island.html מציג את כל 22 הכרטיסים
- [ ] localStorage `island3-quests:completed` מתעדכן לכל אות
- [ ] רגרסיה ב-5 הקיימים — בלי שבר
- [ ] `rama_task_alignment: 1` + `peima_target: 1` בכל JSON חדש
- [ ] tracker.html ✅ D.15
- [ ] בלוק חדש ב-agent-completion-log.md
- [ ] קבוצה חדשה ב-pending-commits.md (סמן 🟡)

### בסיום

1. דווחי למיטל סיכום + מה לבדוק
2. ⚠️ לפני git push: `git fetch origin && git status`
3. אם הויזואל של "כוכבים" (שלב 3) נסגר אצל מיטל — להמשיך לצדפים+דגים. אם לא — איטרציה עד אישור.

---

## הוספת bootstraps נוספים
ככל שמיטל תאשר משימות נוספות מהמסלול הקריטי — נוסיף סוכנים נוספים כאן.
המסלול הקריטי: A0.2 → A0.3 → A0.4 → A.1-6 → B → C → ...
