# Bootstrap לסוכנים — אבני יסוד 26.5.2026 ערב

מסמך זה נועד לפתיחת שיחות Claude/Cursor חדשות עם סוכן ייעודי למשימה ספציפית.
**העתיקי את הסעיף הרלוונטי כראשון בשיחה החדשה.**

---

## 🟢 קונטקסט-על שמשותף לכל הסוכנים

```
את/ה סוכן עבודה לפרויקט "אבני יסוד" — מערכת תרגול דיגיטלית-אדפטיבית לרכישת קריאה בעברית בכיתה א'.

מנהלת הפיתוח: מיטל פלג.

### 📍 איפה אתה עובד — חובה לאמת לפני כל פעולה

**ריפו:** `meytalp-dev/impactos`
**נתיב מקומי:** `c:/Users/meyta/Downloads/impactos/avnei-yesod/`

⚠️ **לא** ב-`ort-presentation-builder`. **לא** ב-`Downloads/edura`. **לא** בריפו אחר.

לפני כל פעולה ראשונה:
```bash
cd c:/Users/meyta/Downloads/impactos && git fetch origin && git status
```

אם `pwd` לא מתחיל ב-`c:/Users/meyta/Downloads/impactos` — **עצור ותתריע למיטל**.

כל הקבצים שמוזכרים במסמך הזה (architecture-mvp.md, F.21A-spec, agent-bootstraps.md, וכו') הם **תחת `impactos/avnei-yesod/`**, לא תחת ריפו אחר.

### המסגרת הפדגוגית (חידוד 26.5.2026 ערב — חובה לזכור!)
- משרד החינוך (תוכנית תשפ"ו, פרופ' שני) קובע את היעדים
- ראמ"ה — כזרוע המדידה של משה"ח — בודקת אותם (10 משימות + 3 פעימות)
- אבני יסוד = התרגול הדיגיטלי-האדפטיבי שמכין למבדק ראמ"ה — לא מבנה עצמאי

### אזהרות אסור-לחזור-עליהן
- ❌ Shatil & Share 2003 לא הציעו שלבים (זו הזיה — המאמר עוסק במנבאים בלבד)
- ❌ Share & Bar-On 2018 = 3 פאזות (Triplex), לא 6 שלבים. 6 שלבים שייכים למשה"ח (סינתזה)
- ❌ "18 אותיות מ-22" = רף "תקין" של ראמ"ה, לא ממוצע אמפירי

### ⚠️ קבצים DEPRECATED — לא לבסס עליהם תוכן (עודכן 27.5.2026 לילה)
הקבצים הבאים הם **גרסה 1.0** של הארכיטקטורה (מבוססת "9 מיומנויות"). **רובם הועברו לארכיון** (27.5.2026 לילה) — `avnei-yesod/_archive/v1-legacy/`:

**🗄️ ארכוב מלא ב-`_archive/v1-legacy/` (לא לקרוא אלא אם נחוץ היסטורית):**
- `_archive/v1-legacy/sales/` — 5 קבצים (presentation/proposal-municipal/onepager/pricing-summary + 2 PDF)
- `_archive/v1-legacy/partners-qa.html`
- `_archive/v1-legacy/engine/` — 3 קבצים (demo.html · diagnostic.html · pedagogy-grade1.html)
- `_archive/v1-legacy/curriculum/` — 2 קבצים (pedagogy-master.md · literacy-grade1-2-yearly.html)
- ראה [`_archive/v1-legacy/README.md`](../_archive/v1-legacy/README.md) להסבר מלא

**נשארו במקום עם banner DEPRECATED:**
- `spec.html` — מקושר ממקומות רבים, banner צהוב בראש מסביר ומפנה למסמכי-אם
- `index.html` · `README.md` — **עודכנו 27.5 לילה** ל-5 סטרנדים (לא DEPRECATED יותר)

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

## 🚀 סוכן 5 — משימה F.21A code: מסך מורה בשפת ראמ"ה (P0 · M · חוסם פיילוט)

**רמת קושי:** M (8-12 שעות) · **עדיפות:** P0 (deliverable מרכזי ללקוחות B2B)
**תלות:** A.1 ✅ · A.3 ✅ · A.4 ✅ · A0.3 ✅ — **כולן ב-origin, ה-API מוכן**

### 📍 איפה אתה עובד

**ריפו:** `meytalp-dev/impactos`
**נתיב מקומי:** `c:/Users/meyta/Downloads/impactos/avnei-yesod/`

⚠️ **לא** ב-`ort-presentation-builder`. **לא** ב-`Downloads/edura`.

לפני כל פעולה:
```bash
cd c:/Users/meyta/Downloads/impactos && git fetch origin && git status
```

### המשימה

בניית קובץ HTML חדש `underwater-app/teacher-rama.html` — דשבורד מורה שמציג כיתה בשפת **10 משימות ראמ"ה × 3 פעימות**, לא בשפת המשחקונים הפנימיים.

זה **לא מחליף** את `teacher-live.html` הקיים — שניהם חיים זה לצד זה. teacher-live נשאר כ-"view דיאגנוסטי", teacher-rama הוא ה-deliverable למורה.

### מסמך-אם חובה לקרוא ראשון (לפני קוד)

**`_handoff/2026-05-27-F21A-ux-spec.md`** (~544 שורות, 12 סעיפים + 2 נספחים)

הוא מכיל wireframes ASCII, מיפוי data→UI, behavior specs ל-Confidence indicators ול-Pulse toggle, ו-Acceptance Criteria מלאים.

### 5 החלטות UX שנסגרו (לא לפתוח מחדש)

| # | פריט | החלטה |
|---|---|---|
| 1 | מבנה תצוגה ראשי | טבלה (תלמידות × משימות, צבע פר תא) |
| 2 | `checkRamaTaskStatus` aggregation | **Min** — החלש מבין הסטרנדים מנצח (קונסרבטיבי) |
| 3 | תחילת פעימה 1 | **1.9.2026** |
| 4 | PIN | cosmetic לפיילוט (4521). מיטל תחלק ידנית. |
| 5 | inline או קובץ נפרד? | **קובץ נפרד** `teacher-rama.html` |

### API חדש שאתה בונה — `checkRamaTaskStatus`

זה הגרעין. הוא **לא קיים היום**. יש `checkMastery(studentId, islandId)` פר-אי — אבל F.21A דורש פר-משימת-ראמ"ה (אחת ל-1+ איים).

**חתימה:**
```js
AvneiMasteryCheck.checkRamaTaskStatus(studentId, ramaTaskId)
  → { status: 'pass'|'near'|'fail'|'cold',
      value: 22, threshold: 18,
      confidence: 'high'|'med'|'low',
      contributingIslands: [3, ...],
      reason: 'BKT 92%, fluency steady, 22/22 letters above threshold' }
```

**מימוש:**
- iterate על האיים המתאימים ב-`ISLAND_TO_RAMA` (כבר קיים ב-`mastery-check.js`)
- aggregation = **Min** (החלש מנצח)
- `cold` אם פחות מ-10 ניסיונות בסטרנד הרלוונטי
- threshold מ-spec משימת ראמ"ה — ראה נספח A ב-spec
- `near` = 80-99% מהרף (ניתן לכייל בפיילוט)
- מיקום: **הרחבה** של `js/shared/mastery-check.js` (לא קובץ חדש)

### Privacy Gate

- PIN client-side, `sessionStorage`, hash SHA-256 hard-coded
- ראה §6 ב-spec — implementation מוצע כבר כתוב שם
- **אין link** ל-`teacher-rama.html` משום מסך תלמידה (חוסם דליפה ב-pilot)

### קבצים שאתה יוצר/משנה

| קובץ | סטטוס | מה |
|---|---|---|
| `underwater-app/teacher-rama.html` | **חדש** | המסך המלא |
| `underwater-app/js/shared/mastery-check.js` | **הרחבה** | + `checkRamaTaskStatus` |
| `underwater-app/js/components/rama-status-view.js` | חדש (אופציונלי) | מודולריזציה אם ה-HTML גדל מעל ~800 שורות |

### אסור לגעת ב-

- `bkt.js`, `epa.js`, `event-logger.js`, `profile-classifier.js`
- 5 משחקוני אי 3 הקיימים (`stage-3-shell/house/rescue/trail-resh/storm.html`)
- `teacher-live.html` (נשאר כפי שהוא — DEPRECATED אבל לא מוסר)
- מסמכי-אם (architecture-mvp / literacy-grade1-2-yearly / pedagogy-integration-framework / llm-pitfalls / F21A-spec עצמו) בלי אישור פר-קובץ ממיטל

### אזהרות אסור-לחזור-עליהן

- ❌ לא להוסיף שורה "9 מיומנויות" בשום מקום בקוד או UI — הסקופ הוא **5 סטרנדים BKT**
- ❌ לא לציין "6 שלבי Share & Bar-On" — אלה משה"ח, לא Share
- ❌ לא לקבל החלטות פדגוגיות עצמאיות (סיווג near/fail/pass לפי spec — אבל שינוי סף = שואלים את מיטל)
- ❌ לא לדחוף ל-git בלי אישור מפורש ממיטל
- RTL מלא — sticky column **בימין** (לא בשמאל)

### Acceptance Criteria (מ-§12 ב-spec)

- [ ] `teacher-rama.html` קיים, רץ ללא שגיאות JS
- [ ] PIN gate חוסם כניסה. PIN נכון → גישה
- [ ] Class View — כל הילדות, 10 עמודות משימה, ביטחון פר תלמידה
- [ ] Pulse toggle — Daily ↔ Snapshot
- [ ] לחיצה על שם תלמידה → Student View
- [ ] Student View — 5 strands + 22 letters + EPA + 10 RAMA tasks
- [ ] Confidence indicators (✅🟡⚫) בכל המקומות הרלוונטיים
- [ ] רענון 3 שניות (זהה ל-teacher-live)
- [ ] RTL מלא, sticky column מימין
- [ ] מובייל — גלילה אופקית עם sticky
- [ ] **אין** קישור ל-teacher-rama משום מסך תלמידה
- [ ] `checkRamaTaskStatus` קיים, מחזיר ערכים לפי §5
- [ ] בדיקה ידנית עם 3 הפרסונות (מאיה/נועה/שירה)

### בסיום

1. עדכן את ה-tracker: `_handoff/2026-05-26-architecture-tasks-tracker.html` (שורה 455 — F.21A ⭐ → ✅)
2. הוסף בלוק חדש **בראש** `_handoff/agent-completion-log.md` לפי התבנית
3. הוסף קבוצה חדשה ב-`_handoff/pending-commits.md` 🟡 ("F.21A code — ממתין לאישור push ממיטל")
4. דווח למיטל: "F.21A code מוכן. 3 פרסונות לבדיקה: `teacher-rama.html?demo=1`. ממתין לאישור push."
5. **אל תדחוף לפני אישור.**

---

## 🚀 סוכן 7 — משימות E.17 + E.18: Event Logger + Data Export (P0 · M · תשתית פיילוט)

**רמת קושי:** M (4-6 שעות, שתי משימות צמודות) · **עדיפות:** P0 (חוסם פיילוט אמיתי)
**תלות:** A0.2 ✅ (`rama_task_alignment` + `peima_target` כבר ב-item schema) · A.1+A.3+A.4 ✅ (BKT/EPA חיים)

### 📍 איפה אתה עובד

**ריפו:** `meytalp-dev/impactos`
**נתיב מקומי:** `c:/Users/meyta/Downloads/impactos/avnei-yesod/`

⚠️ **לא** ב-`ort-presentation-builder`. **לא** ב-`Downloads/edura`.

לפני כל פעולה:
```bash
cd c:/Users/meyta/Downloads/impactos && git fetch origin && git status
```

### הקונטקסט והרציונל

**הבעיה:** הפיילוט בלי דאטה = פיילוט עקר. המורה תשחק עם המערכת, ילדות יצברו ניסיונות, אבל אין דרך לאסוף את הדאטה ל:
- מחקר פדגוגי (האם המערכת באמת מקדמת קריאה?)
- דוח לעירייה/מנהל ביה"ס
- כיול thresholds (האם רף 80% של `near` בנכון?)
- ניתוח דפוסי EPA רחבים יותר מ-3 ימים

**מה כבר עובד:** `event-logger.js` שומר 17 שדות פר אירוע ב-localStorage. שדה מערכת `state.events` נצבר ועובר ל-BKT+EPA. מצוין.

**מה חסר:**
1. **E.17:** 3 תיוגים קריטיים שעוד לא באירוע — `strand_id`, `rama_task_alignment`, `peima_target`
2. **E.18:** UI לייצוא הדאטה ל-CSV (פיילוט) → Apps Script ל-Google Sheet (post-pilot)

### החלטות סגורות (לא לפתוח מחדש)

| # | פריט | החלטה |
|---|---|---|
| 1 | איך נוסיף `strand_id` לכל אירוע? | **mapping אוטומטי** ב-event-logger (`ISLAND_TO_STRAND[island_id]`) — אין שינוי במשחקונים |
| 2 | איך נוסיף `rama_task_alignment` ו-`peima_target`? | **דרך ה-item** — המכניקה מעבירה את הפריט המלא (או 2 השדות) ל-`logActivityResult`. עדכון 5 קבצי משחקונים נדרש. |
| 3 | פורמט ייצוא | **CSV** ראשון (פשוט, ידני, פיילוט קטן). Apps Script POST = שלב ב' אחרי הפיילוט. |
| 4 | היכן ה-UI? | **קובץ נפרד** `data-export.html` — לא לדרוס את `teacher-rama.html` |
| 5 | אבטחה | **אותו PIN gate** של teacher-rama (sessionStorage, hash) — דאטה רגיש זהה |
| 6 | מי רואה? | **רק המורה** (PIN). הילדה לא רואה את עצמה. |

### מה לבנות

## חלק 1 — E.17: Event Logger ל-3 תיוגים חסרים

### 1.1 — הוספת `ISLAND_TO_STRAND` mapping ב-event-logger.js

זה mapping של 22 איים ל-5 סטרנדים. מקור: `architecture-mvp.md` או `pedagogy-integration-framework.md` (חפש "סטרנד" + "אי"). אם לא ברור — שאל את מיטל לפני שאתה ממציא.

```js
// strand_id: 1=פונולוגיה, 2=מורפולוגיה, 3=שפה דבורה, 4=קריאה+הבנה, 5=כתיבה
const ISLAND_TO_STRAND = {
  1: 1,    // אי 1 → פונולוגיה (השלמה אחרי קריאת מסמכי-אם)
  2: 1,    // אי 2 (שונית גלי הצליל) → פונולוגיה
  3: 1,    // אי 3 (זיהוי אותיות) → פונולוגיה
  // ... וכן הלאה ל-22
};
```

### 1.2 — הוספת 3 שדות באירוע

ב-`logActivityResult`, להוסיף לאחר שדה `secondary_island_ids`:

```js
strand_id:            ISLAND_TO_STRAND[ISLAND_ID_CURRENT] || null,
rama_task_alignment:  result.rama_task_alignment || null,  // מהפריט
peima_target:         result.peima_target || null,         // מהפריט
```

### 1.3 — עדכון 5 קבצי המשחקונים הקיימים באי 3 + 12 החדשים מ-D.15

כל מכניקה (`mechanic-tap-all.js`, `mechanic-pick.js`, `mechanic-memory-pair.js`, `mechanic-sort-by-letter.js`) שמקבלת פריט מ-JSON וקוראת ל-`AvneiEventLogger.logActivityResult({...})` — להעביר גם:
```js
rama_task_alignment: item.rama_task_alignment,  // קיים ב-JSON מ-A0.2
peima_target: item.peima_target                  // קיים ב-JSON מ-A0.2
```

ב-5 משחקוני האי האמנותיים (`stage-3-shell/house/rescue/trail-resh/storm.html`) — חיפוש אחר `logActivityResult` והעברת השדות.

### 1.4 — בדיקות

קובץ `scripts/test-event-logger-fields.js`:
- אירוע חדש כולל 20 שדות (17 + 3 חדשים)
- `strand_id` נכון פר-אי (לפחות 3 איים בודקים)
- `rama_task_alignment` עובר מהפריט
- `peima_target` עובר מהפריט
- Backwards compat: אירועים ישנים בלי 3 השדות עדיין נטענים (null)

---

## חלק 2 — E.18: Data Export UI

### 2.1 — קובץ חדש `underwater-app/data-export.html`

מבנה:

```
┌──────────────────────────────────────────────────────────┐
│ HEADER                                                    │
│ ייצוא נתוני פיילוט · אבני יסוד · כיתה א/3               │
│ [← חזרה ל-teacher-rama]                                  │
├──────────────────────────────────────────────────────────┤
│ FILTERS                                                   │
│ תלמידה: [כל הילדות ▼]  טווח: [מ ___ עד ___]            │
│ פעימה: [● כל הפעימות]  משימת ראמ"ה: [כל המשימות ▼]    │
│ סטטוס: ☑ נכון ☑ לא נכון                                  │
├──────────────────────────────────────────────────────────┤
│ SUMMARY                                                   │
│ 1,247 אירועים נטענו  ·  4 תלמידות  ·  3-27.5.2026        │
│ 78% accuracy  ·  זמן תגובה חציוני: 1.4 שנ'              │
├──────────────────────────────────────────────────────────┤
│ TABLE PREVIEW (10 שורות אחרונות)                          │
│ ┌──────────┬───────┬──────┬──────┬───────┬─────┬───────┐│
│ │ timestamp│ student│ item │ strd │ rama │ ok  │ ms    ││
│ ├──────────┼───────┼──────┼──────┼───────┼─────┼───────┤│
│ │ ...      │ ...   │ ...  │ ...  │ ...   │ ... │ ...   ││
│ └──────────┴───────┴──────┴──────┴───────┴─────┴───────┘│
├──────────────────────────────────────────────────────────┤
│ [📥 הורד CSV]    [📋 העתק ל-clipboard]                   │
└──────────────────────────────────────────────────────────┘
```

### 2.2 — לוגיקת ייצוא

```js
function exportToCSV(events) {
  const headers = ['timestamp', 'student_id', 'session_id', 'island_id',
                   'strand_id', 'rama_task_alignment', 'peima_target',
                   'activity_type', 'item_id', 'target_letter',
                   'is_correct', 'attempts', 'response_time_ms',
                   'hint_used', 'auto_hint_triggered', 'noni_guidance_used',
                   'supportLevel'];
  const rows = events.map(e => headers.map(h =>
    typeof e[h] === 'string' ? `"${e[h].replace(/"/g, '""')}"` : (e[h] ?? '')
  ).join(','));
  const csv = '﻿' + headers.join(',') + '\n' + rows.join('\n');  // BOM ל-Excel
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `avnei-yesod-events-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}
```

### 2.3 — PIN gate

זהה ל-teacher-rama.html — העתק את הקוד מ-§584-623 ב-teacher-rama.html. אותו PIN, אותו hash, אותו sessionStorage key. **לא קישור מ-teacher-rama** (privacy — את לא רוצה שמורה תגלה בטעות שאפשר לייצא הכל). הגישה רק דרך URL ישיר `data-export.html`.

### 2.4 — בדיקות

- [ ] PIN gate חוסם
- [ ] CSV נוצר עם BOM (Excel פותח עברית נכון)
- [ ] שמות עמודות באנגלית (תואם Sheet)
- [ ] פילטרים עובדים (תלמידה / טווח תאריכים / פעימה / משימת ראמ"ה / סטטוס)
- [ ] טבלת preview מציגה 10 שורות אחרונות
- [ ] Summary מחושב נכון (count + accuracy + median ms)
- [ ] בדיקה ידנית עם 100+ אירועים sample

### אסור לגעת ב-

- `bkt.js`, `epa.js`, `mastery-check.js`, `profile-classifier.js`
- `teacher-rama.html` (לא לערבב — קובץ של F.21A)
- מסמכי-אם
- A.5 ליבה (`isInColdStart`) — סוכן 5 עובד על UI שלו

### אזהרות

- ❌ לא להמציא `ISLAND_TO_STRAND` mapping — לקרוא ממסמכי-אם או לשאול את מיטל
- ❌ לא לדחוף ל-git בלי אישור מפורש ממיטל
- ❌ CSV בעברית — חובה BOM (`﻿`) בתחילת הקובץ, אחרת Excel מציג ג'יבריש
- RTL מלא ב-`data-export.html`
- מסלול עתידי: Apps Script POST ל-Sheet — **לא בסקופ E.18**, רק מציינים `// TODO: E.18B Apps Script POST` בקוד

### Acceptance Criteria

**E.17:**
- [ ] `ISLAND_TO_STRAND` mapping מ-22 איים → 5 סטרנדים (מקור מאומת)
- [ ] 3 שדות חדשים באירוע: `strand_id`, `rama_task_alignment`, `peima_target`
- [ ] 5 משחקונים אמנותיים + 17 D.15 מעבירים את 2 שדות הפריט
- [ ] `test-event-logger-fields.js` עובר (5+ assertions)
- [ ] Backwards compat: אירועים ישנים בלי 3 השדות עדיין נטענים ל-BKT/EPA

**E.18:**
- [ ] `data-export.html` קיים, רץ ללא שגיאות
- [ ] PIN gate חוסם, PIN נכון פותח
- [ ] CSV מיוצא נכון עם BOM (עברית קריאה ב-Excel)
- [ ] 5 פילטרים עובדים
- [ ] Summary מחושב נכון
- [ ] טבלת preview מציגה 10 שורות
- [ ] בדיקה ידנית: ייצוא + פתיחה ב-Excel + ספירת שורות תואמת

### בסיום

1. עדכן tracker: ✅ E.17 + ✅ E.18 ב-`_handoff/2026-05-26-architecture-tasks-tracker.html`
2. הוסף בלוק חדש בראש `_handoff/agent-completion-log.md`
3. הוסף קבוצה חדשה ב-`_handoff/pending-commits.md` 🟡 ("E.17+E.18 — ממתין לאישור push")
4. דווח: "E.17+E.18 מוכן. שלח לי שאני אבדוק `data-export.html` עם PIN ואייצא CSV ראשון. ממתין לאישור push."
5. **אל תדחוף לפני אישור.**

---

## הוספת bootstraps נוספים
ככל שמיטל תאשר משימות נוספות מהמסלול הקריטי — נוסיף סוכנים נוספים כאן.
המסלול הקריטי: A0.2 → A0.3 → A0.4 → A.1-6 → B → C → ...
