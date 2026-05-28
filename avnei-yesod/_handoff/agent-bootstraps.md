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

## 🚀 סוכן 8 — משימות C.11 + C.12 + C.13: Pack × BKT Integration (P0 · L · לב הדיפרנציאליות)

**רמת קושי:** L (10-14 שעות, 3 משימות צמודות) · **עדיפות:** P0 (לב הדיפרנציאליות של אבני יסוד)
**תלות:** A.1 ✅ · A.4 ✅ · A0.2 ✅ · D.14 ✅ · F.21A ✅ — כולן ב-origin

### 📍 איפה אתה עובד

**ריפו:** `meytalp-dev/impactos`
**נתיב מקומי:** `c:/Users/meyta/Downloads/impactos/avnei-yesod/`

⚠️ **לא** ב-`ort-presentation-builder`. **לא** ב-`Downloads/edura`.

לפני כל פעולה:
```bash
cd c:/Users/meyta/Downloads/impactos && git fetch origin && git status
```

### מסמך-אם חובה לקרוא ראשון (לפני קוד)

**`_handoff/2026-05-28-C11-C12-C13-pack-bkt-spec.md`** (~400 שורות, 9 סעיפים + דוגמאות JSON מלאות)

הוא מכיל:
- §3 schema של Pack JSON + 2 דוגמאות (letters-focused + strand-focused)
- §4 API מלא של `pack-bkt-bridge.js` (8 פונקציות) + קוד מומלץ ל-`selectTierForStudent`
- §5 schema לפריט + `validate-pack.js`
- §6 UI Integration ב-teacher-rama (Section 5 + עמודת Tier)
- §7 Acceptance Criteria — 18 פריטים מדויקים

**אל תתחיל לכתוב קוד לפני שקראת את כל ה-spec.**

### 3 ההחלטות הסגורות (מ-§2 ב-spec)

| # | החלטה |
|---|---|
| 1 | Pack **דו-מצבי** — `focus_mode: "letters"` או `"strand"` |
| 2 | **Tier 4 = 70% ישן + 30% חדש** (חיזוק עמוק) |
| 3 | **אוטומטי + מורה רואה ויכולה להחליף ידנית** (override ב-localStorage) |

### TIER_THRESHOLDS (לא לשנות)

```
p < 0.30        → Tier 1
0.30 ≤ p < 0.60 → Tier 2
0.60 ≤ p < 0.85 → Tier 3
p ≥ 0.85        → Tier 4
```

לחשוף כ-`AvneiPackBridge.TIER_THRESHOLDS` (יש לכייל בפיילוט — לא בסקופ שלך).

### סדר ביצוע מומלץ (מ-§9)

1. **C.11** — Pack schema + 2 dummy packs (`september-2026.json` letters-focused + `january-2026.json` strand-focused) + `_schema.md`
2. **C.13** — Item tagging ב-2 ה-packs + `validate-pack.js`
3. **C.12** — `pack-bkt-bridge.js` + `test-pack-bridge.js` (15+ assertions)
4. **UI** — Section 5 ב-Student View ב-teacher-rama.html + עמודת Tier ב-Class View
5. **בדיקה ידנית** — 3 פרסונות (מאיה Tier 4 manual, נועה Tier 3 auto, שירה Tier 1 cold)

### קבצים שאתה יוצר/משנה

| קובץ | סטטוס | מה |
|---|---|---|
| `curriculum/packs/grade1-tashpaz/september-2026.json` | חדש | Pack letters-focused (ש·ל·נ·א) |
| `curriculum/packs/grade1-tashpaz/january-2026.json` | חדש | Pack strand-focused (מודעות פונולוגית) |
| `curriculum/packs/_schema.md` | חדש | תיעוד schema |
| `underwater-app/js/shared/pack-bkt-bridge.js` | חדש | ~300 שורות, 8 פונקציות API |
| `underwater-app/scripts/validate-pack.js` | חדש | CLI validator |
| `underwater-app/scripts/test-pack-bridge.js` | חדש | בדיקות אוטומטיות |
| `underwater-app/teacher-rama.html` | **הרחבה** | Section 5 + עמודת Tier (זהירות — סוכן 5 אולי עוד פעיל על A.5) |

### ⚠️ קריטי — תיאום עם סוכנים פעילים

**סוכן 5 עובד על A.5 (cold-start) ב-`teacher-rama.html` במקביל אליך.** לפני שאתה נוגע ב-`teacher-rama.html`:

1. `git fetch origin && git pull origin main`
2. בדוק אם A.5 כבר נדחף (חיפוש ב-`pending-commits.md` "A.5" → סטטוס)
3. אם A.5 עוד לא נדחף — תיידע את מיטל ושאל אם להמתין או להתחיל מ-C.11+C.12 (לא UI)

### אסור לגעת ב-

- `bkt.js`, `epa.js`, `mastery-check.js`, `event-logger.js`, `profile-classifier.js` (קוראים בלבד)
- 22 קבצי משחקונים (stage-3-*.html) — קריאה ל-`getItemsForStudent` היא post-MVP
- מסמכי-אם (architecture-mvp / literacy-grade1-2-yearly / pedagogy-integration-framework / llm-pitfalls)
- ה-spec עצמו (`2026-05-28-C11-C12-C13-pack-bkt-spec.md`)

### אזהרות

- ❌ **לא להמציא תוכן ל-2 ה-packs** — הם dummy לבדיקה. שדה `items` יכול להיות עם 5-10 פריטים בסיסיים בלבד. **התוכן האמיתי = מיטל כותבת ידנית בקצב שלה**
- ❌ **לא לשנות TIER_THRESHOLDS** — חושף בלבד, לא משנה (כיול = פיילוט)
- ❌ **לא לבנות auto-classification** של פריט לטיר (manual בלבד — § 5.1)
- ❌ **לא לקרוא ל-`getItemsForStudent` מתוך משחקון** — זה C.14 עתידי, לא בסקופ
- ❌ **לא לדחוף ל-git בלי אישור מפורש ממיטל**
- RTL מלא ב-UI
- שמות פונקציות באנגלית, comments בעברית

### Acceptance Criteria (קצר — המלא ב-§7 של ה-spec)

**C.11:**
- [ ] 2 packs dummy (letters + strand)
- [ ] `_schema.md` תיעוד
- [ ] `validate-pack.js` עובד

**C.12:**
- [ ] `pack-bkt-bridge.js` — 8 פונקציות API
- [ ] cold-start → Tier 1 + reason
- [ ] override flow עובד (set+get+clear)
- [ ] `test-pack-bridge.js` — 15+ assertions ירוקות

**C.13:**
- [ ] manual tagging ב-2 ה-packs
- [ ] schema לפריט מתועד

**UI:**
- [ ] Section 5 ב-Student View — Tier + reason + confidence + 4 כפתורי override
- [ ] עמודת Tier בטבלת Class View — עם ⚙ ל-manual
- [ ] לחיצת override שומרת ל-localStorage + רענון מיידי

### בסיום

1. עדכן tracker: ✅ C.11 + ✅ C.12 + ✅ C.13 ב-`_handoff/2026-05-26-architecture-tasks-tracker.html`
2. הוסף בלוק חדש בראש `_handoff/agent-completion-log.md`
3. הוסף קבוצה חדשה ב-`_handoff/pending-commits.md` 🟡 ("C.11+C.12+C.13 — ממתין לאישור push")
4. דווח: "C.11+C.12+C.13 מוכן. 2 packs לדוגמה + bridge + UI. ממתין לאישור push."
5. **אל תדחוף לפני אישור.**

---

## 🚀 סוכן 9 — משימת B.7: Targeted Reading Interventions (P0 · M · חוויית מורה)

**רמת קושי:** M (8-12 שעות) · **עדיפות:** P0 (משלים את F.21A — "פתחי קבוצת תמיכה" תעבוד באמת)
**תלות:** A.3 ✓ · A.4 ✓ · F.21A ✓ — כולן ב-origin

### 📍 איפה אתה עובד

**ריפו:** `meytalp-dev/impactos`
**נתיב מקומי:** `c:/Users/meyta/Downloads/impactos/avnei-yesod/`

⚠️ **לא** ב-`ort-presentation-builder`. **לא** ב-`Downloads/edura`.

לפני כל פעולה:
```bash
cd c:/Users/meyta/Downloads/impactos && git fetch origin && git status
```

### מסמך-אם חובה לקרוא ראשון

**`_handoff/2026-05-28-B7-interventions-spec.md`** (~340 שורות, 10 סעיפים)

מכיל: 5 דפוסים מעודכנים (Phonological / Letter Knowledge / Decoding / Fluency / Letter-cluster) · 5 שלבי script (Rosenshine 2012) · UI integration ב-teacher-rama · 8 מקורות מאומתים (IES Foorman 2016 + NRP 2000 + Wanzek 2003 + Elbaum 2000 וכו').

### 5 ההחלטות הסגורות (28.5)

| # | פריט | תשובה |
|---|---|---|
| 1 | 5 דפוסים | Phonological / Letter Knowledge / Decoding / Fluency / Letter-cluster |
| 2 | גודל קבוצה | 3-4 ילדות |
| 3 | משך | 10-15 דק' × 4-5 ימים שבועיים |
| 4 | מבנה script | 5 שלבים (Hook → Model → Guided → Independent → Success Check) |
| 5 | פורמט | Hybrid — Modal preview + PDF export |

### ⚠️ קריטי — תיאום עם סוכן 8

**סוכן 8 (C.11+C.12+C.13) עובד על `teacher-rama.html` במקביל אליך.** לפני שאתה נוגע ב-`teacher-rama.html`:
1. `git fetch origin && git pull origin main`
2. בדוק אם סוכן 8 כבר דחף (חיפוש "C.11" ב-`pending-commits.md`)
3. אם סוכן 8 עוד לא דחף — תיידע את מיטל ושאל אם להמתין

### קבצים שאתה יוצר/משנה

| קובץ | סטטוס | מה |
|---|---|---|
| `js/shared/interventions.js` | חדש | API + trigger detection |
| `interventions/phonological.json` | חדש | script פר דפוס |
| `interventions/letter-knowledge.json` | חדש | script פר דפוס |
| `interventions/decoding.json` | חדש | script פר דפוס |
| `interventions/fluency.json` | חדש | script פר דפוס |
| `interventions/letter-cluster.json` | חדש | script פר דפוס |
| `underwater-app/teacher-rama.html` | **הרחבה** | Modal preview + trigger banners |
| `scripts/test-interventions.js` | חדש | בדיקות אוטומטיות |

### אזהרות

- ❌ לא להמציא תוכן פדגוגי — הצמד ל-templates ב-§5 של ה-spec
- ❌ לא לשנות EPA או sub-BKT — קריאה בלבד
- ❌ לא לדחוף בלי אישור
- PDF export: jsPDF + עברית RTL (BIDI-safe)
- 5.5 (Letter-cluster) — אותיות מותאמות פר ילדה דרך `getLetterMasteryDistribution()`

### Acceptance Criteria (מ-§7 ב-spec)

- [ ] 5 JSON files פר דפוס
- [ ] `interventions.js` API
- [ ] EPA + sub-BKT triggers ב-F.21A מציעים אינטרבנציה
- [ ] Modal preview + כפתור PDF
- [ ] PDF בעברית קריאה (RTL, BIDI-safe)
- [ ] `state.interventions` תיעוד פר תלמידה
- [ ] בדיקה ידנית: 3 דפוסים שונים

### בסיום

1. עדכן tracker: ✅ B.7
2. בלוק חדש ב-agent-completion-log.md
3. קבוצה חדשה ב-pending-commits.md 🟡
4. דווח: "B.7 מוכן. ממתין לאישור push."
5. **אל תדחוף לפני אישור.**

---

## 🚀 סוכן 10 — משימת MOY: Middle of Year Diagnostic (P0 · M · חוסם פיילוט בפעימה 2)

**רמת קושי:** M (6-8 שעות) · **עדיפות:** P0 (חוסם פיילוט בינואר-פברואר)
**תלות:** A.1 ✓ · A.3 ✓ · A.4 ✓ · A.5 ✓ · F.21A ✓ — כולן ב-origin

### 📍 איפה אתה עובד

**ריפו:** `meytalp-dev/impactos`
**נתיב מקומי:** `c:/Users/meyta/Downloads/impactos/avnei-yesod/`

⚠️ **לא** ב-`ort-presentation-builder`. **לא** ב-`Downloads/edura`.

לפני כל פעולה:
```bash
cd c:/Users/meyta/Downloads/impactos && git fetch origin && git status
```

### מסמך-אם חובה לקרוא ראשון

**`_handoff/2026-05-28-MOY-diagnostic-spec.md`** (~310 שורות, 9 סעיפים)

מכיל: 4 החלטות סגורות · MOY-Lite אינטראקטיבי (לא תחליף למבדק 1-on-1 הרשמי) · `state.assessments` schema · חוקי repeat 5-6 שבועות (לפי `madrich-mivdak-kriah-grade1.txt:247`).

### 4 ההחלטות הסגורות (28.5)

| # | פריט | תשובה |
|---|---|---|
| 1 | מי מנהלת? | MOY הרשמי = 1-on-1 (ראמ"ה). MOY-Lite שלנו = התלמידה לבד, עצמאי |
| 2 | מתי? | חלון ינו-פבר, גמיש פר ילדה |
| 3 | אם נכשלת? | תיעוד + B.7 + repeat 5-6 שבועות |
| 4 | תוצאות נשמרות איפה? | `state.assessments` נפרד (לא ב-events) |

### ⚠️ קריטי — תיאום עם סוכן 8 ו-9

שלושתכם נוגעים ב-`teacher-rama.html`:
- סוכן 8 — Section 5 (Pack × Tier)
- סוכן 9 — Modal של אינטרבנציות
- אתה (סוכן 10) — Section 6 (MOY status)

**לפני שאתה נוגע ב-teacher-rama:**
1. `git fetch origin && git pull origin main`
2. וודא ש-C.11+C.12+C.13 + B.7 כבר דחפו
3. אם לא — בקש ממיטל להמתין או שאל אילו סוכנים פעילים

### קבצים שאתה יוצר/משנה

| קובץ | סטטוס | מה |
|---|---|---|
| `engine/moy-screener.html` | חדש | UI התלמידה |
| `js/shared/assessments.js` | חדש | API: recordMOYAttempt, getMOYStatus, getDueAssessments |
| `engine/moy-items.json` | חדש | 2-3 dummy items פר משימה (משימה 3 + 4) |
| `underwater-app/teacher-rama.html` | **הרחבה** | Section 6 — סטטוס MOY + טריגר הפעלה |
| `scripts/test-moy-assessments.js` | חדש | בדיקות אוטומטיות |

### Item Pool — חוק ראמ"ה קריטי

**⚠️ פריטי MOY-Lite חייבים להיות שונים מפריטי תרגול רגיל!** (לפי ראמ"ה — שימוש בפריטי המבדק כתרגול "יפגע במידת הדיוק"). סוכן הקוד יבנה 2-3 dummy items. **תוכן מלא של 60 פריטים = משימה פדגוגית של מיטל**, לא בסקופ שלך.

### אזהרות

- ❌ לא להציג ציון לתלמידה (זה evaluation, לא תרגול)
- ❌ לא להשתמש בפריטי תרגול רגילים
- ❌ לא לערבב assessments עם events רגילים — שני localStorage keys שונים
- ❌ לא לדחוף בלי אישור
- AvriNeural בלבד לאודיו (כל המשימות מבוססות שמיעה)
- RTL מלא

### Acceptance Criteria (מ-§7 ב-spec)

- [ ] `engine/moy-screener.html` רץ ללא שגיאות
- [ ] `state.assessments` schema פעיל, נשמר ל-localStorage נפרד
- [ ] משימה 3 (הבנת טקסט מושמע) עובדת עם 2-3 dummy items
- [ ] משימה 4 (מודעות לשונית) עובדת עם 2-3 dummy items
- [ ] Audio AvriNeural נטען
- [ ] לא מציג ציון לילדה — רק "סיימת"
- [ ] Section 6 ב-teacher-rama Student View — סטטוס + כפתור + אזהרה "לא תחליף למבדק הרשמי"
- [ ] חוקי repeat: `next_review_due = +5 שבועות` אם fail
- [ ] API: `recordMOYAttempt` · `getMOYStatus` · `getDueAssessments`
- [ ] `test-moy-assessments.js` — 10+ assertions

### בסיום

1. עדכן tracker: ✅ MOY (קבוצה חדשה בטראקר — "U" או "V")
2. בלוק חדש ב-agent-completion-log.md
3. קבוצה חדשה ב-pending-commits.md 🟡
4. דווח: "MOY-Lite מוכן. 2-3 dummy items. ממתין לאישור push + תוכן מלא ממיטל."
5. **אל תדחוף לפני אישור.**

---

## 🚀 סוכן 11 — משימת C.12B: Weakness Targeting Engine (P0 · M · incremental על rev1)

**רמת קושי:** M (4-6 שעות) · **עדיפות:** P0 (חוסר זה = "Tier system" אבל לא דיפרנציאלי אמיתי)
**תלות:** סוכן 8 חייב לדחוף קבוצה T (rev1 — Pack × BKT bridge בסיסי) **לפני** שאתה מתחיל.

### 📍 איפה אתה עובד

**ריפו:** `meytalp-dev/impactos`
**נתיב מקומי:** `c:/Users/meyta/Downloads/impactos/avnei-yesod/`

⚠️ **לא** ב-`ort-presentation-builder`. **לא** ב-`Downloads/edura`.

לפני כל פעולה:
```bash
cd c:/Users/meyta/Downloads/impactos && git fetch origin && git status
```

### 🎯 המשימה בקצרה

מוסיף **Weakness Targeting layer** מעל ה-Pack × BKT bridge שסוכן 8 בנה. **לא דורס** את הקוד הקיים — מוסיף יכולת חדשה.

**מה הוא עושה:** ילדה שיצאה מספטמבר עם sub-BKT(מ)=0.32 — בנובמבר בפאק חיריק, המערכת מעדיפה מילים שמכילות מ (מָיִם, מָלֵא) על-פני מילים אחרות (גִיר, קִיר).

### מסמך-אם חובה לקרוא ראשון

**`_handoff/2026-05-28-C11-C12-C13-pack-bkt-spec-rev2.md`** (~370 שורות) — revision של ה-spec המקורי

במיוחד:
- §5 — Bridge API החדש (`selectItemsForStudent` + `getWeakLetters`)
- §6 — שינויים נדרשים בקוד הקיים של סוכן 8 (תפקיד שלך)
- §4 — Item Schema החדש (`letters_involved`)

**שים לב:** ה-spec הקיים `2026-05-28-C11-C12-C13-pack-bkt-spec.md` (rev1) **לא מתבטל**. אתה מוסיף **layer** מעליו — לא דורס. rev2 §11 מציין מה מבוטל מ-rev1 (`items_distribution`, `type:review`, `source_letter`, `source_island`).

### 7 ההחלטות הסגורות (rev2 §2)

| # | פריט | החלטה |
|---|---|---|
| 1 | Tier model | Tier = **רמה של אותו תוכן** (לא תוכן שונה) |
| 2 | Max weak letters | **Top-3** הכי חלשות |
| 3 | Threshold | **p < 0.40** |
| 4 | Min attempts | **5+** |
| 5 | TARGETED_RATIO פר Tier | **30% / 70% / 75% / 70%** |
| 6 | שדה ב-item | **`letters_involved`** (רחב — כל האותיות במילה) |
| 7 | הפעלה | **אוטומטית** — לפי `allows_weakness_targeting` flag |

### מה לבנות (סדר מומלץ)

#### שלב 1 — `bkt.js` הרחבה (1-1.5 שעות)
הוסף `AvneiBKT.getWeakLetters(studentId, options)`:
```js
AvneiBKT.getWeakLetters = function(studentId, options = {}) {
  const { threshold = 0.40, minAttempts = 5, max = 3 } = options;
  const dist = getLetterMasteryDistribution(studentId);
  return Object.entries(dist)
    .filter(([letter, data]) => data.pKnown < threshold && data.attempts >= minAttempts)
    .sort((a, b) => a[1].pKnown - b[1].pKnown)  // מהחלשה ביותר
    .slice(0, max)
    .map(([letter]) => letter);
};
```

#### שלב 2 — `pack-bkt-bridge.js` עדכון (2 שעות)
- **שינוי שם:** `getItemsForStudent` → `selectItemsForStudent` (שמור backward-compat: alias מ-getItemsForStudent ל-selectItemsForStudent)
- **הוסף constants:**
  ```js
  const WEAKNESS_THRESHOLD = 0.40;
  const MIN_ATTEMPTS_FOR_WEAK = 5;
  const MAX_WEAK_LETTERS_TARGETED = 3;
  const TARGETED_RATIO = { 1: 0.30, 2: 0.70, 3: 0.75, 4: 0.70 };
  ```
- **לוגיקת weakness targeting:**
  - אם `pack.allows_weakness_targeting !== true` → החזרה רגילה (כל הפריטים)
  - אם `weakLetters.length === 0` → החזרה רגילה
  - אחרת: סינון 2 קבוצות (targeted + general), interleave לפי drill-sandwich

#### שלב 3 — Packs קיימים (30 דק')
עדכן את 2 ה-dummy packs של סוכן 8:
- `curriculum/packs/grade1-tashpaz/september-2026.json` → הוסף `"allows_weakness_targeting": false`
- `curriculum/packs/grade1-tashpaz/january-2026.json` → הוסף `"allows_weakness_targeting": false`
- **כל פריט קיים** → הוסף `letters_involved: ["X"]` (האות של הפריט, או כל האותיות במילה אם יש)

#### שלב 4 — `validate-pack.js` עדכון (30 דק')
- בדוק שאם `allows_weakness_targeting: true` → כל item מכיל `letters_involved` non-empty
- בדוק ש-`letters_involved` הוא array של letters מ-22 (א-ת)

#### שלב 5 — `_schema.md` עדכון (15 דק')
תיעוד `letters_involved` + `allows_weakness_targeting` + Constants

#### שלב 6 — בדיקות חדשות `test-weakness-targeting.js` (1-1.5 שעות)
- ילדה ללא weak letters → `selectItemsForStudent` מחזיר רגיל
- ילדה עם 1 weak letter → 70% מהפריטים מטורגטים
- ילדה עם 5 weak letters → רק top-3 משמשים
- threshold=0.40 עובד (0.39 = weak, 0.41 = strong)
- min_attempts=5 עובד
- `allows_weakness_targeting: false` → תמיד החזרה רגילה
- Backwards compat: `getItemsForStudent` alias עדיין עובד

### ⚠️ קריטי — מה לא לעשות

- ❌ **אל תשנה את ה-Tier model הקיים** (rev1 → rev2). זה משימה נפרדת (C.12C עתידי) ואין סיבה להעמיס עליך.
- ❌ **אל תדרוס את הקוד של סוכן 8** — `selectTierForStudent`, `overrideTier`, `getOverride` נשארים כמו שהם
- ❌ **אל תדרוס את ה-UI ב-teacher-rama.html** — לא תפקידך
- ❌ **אל תכתוב תוכן פדגוגי חדש** — ה-dummy packs ישארו כפי שהם, רק עם `letters_involved` נוסף
- ❌ **לא לדחוף בלי אישור מפורש**

### אסור לגעת ב-

- `bkt.js` — רק הוספה של `getWeakLetters`, לא שינוי של פונקציות קיימות
- `epa.js`, `event-logger.js`, `mastery-check.js`, `profile-classifier.js`
- `teacher-rama.html`
- 22 משחקוני stage-3-*.html
- מסמכי-אם

### Acceptance Criteria

- [ ] `AvneiBKT.getWeakLetters` מיוצא ב-bkt.js
- [ ] `selectItemsForStudent` ב-pack-bkt-bridge.js
- [ ] Constants חשופים (`WEAKNESS_THRESHOLD`, `TARGETED_RATIO`, ...)
- [ ] 2 packs מעודכנים: `allows_weakness_targeting` + `letters_involved` בכל item
- [ ] `validate-pack.js` בודק את 2 השדות החדשים
- [ ] `test-weakness-targeting.js` — 12+ assertions ירוקות
- [ ] Backwards compat: כל הבדיקות הקיימות (75/75 של סוכן 8) עדיין ירוקות
- [ ] `_schema.md` מעודכן

### בסיום

1. עדכן tracker: ✅ C.12B
2. בלוק חדש ב-`_handoff/agent-completion-log.md`
3. קבוצה חדשה ב-`_handoff/pending-commits.md` 🟡 ("C.12B Weakness Targeting — ממתין לאישור push")
4. דווח: "C.12B מוכן. ל-bridge יש עכשיו weakness targeting. Test suite 87+/87 ירוק. ממתין לאישור push."
5. **אל תדחוף לפני אישור.**

---

## הוספת bootstraps נוספים
ככל שמיטל תאשר משימות נוספות מהמסלול הקריטי — נוסיף סוכנים נוספים כאן.
המסלול הקריטי: A0.2 → A0.3 → A0.4 → A.1-6 → B → C → ...
