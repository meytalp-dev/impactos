# Handoff — סוכן 27: Interventions Code Integration (PARTIAL → FULL)

> **מיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש. סוכן קצר וזריז — מחליף 5 JSON files שהסוכן הפדגוגי 21 הכין, מעדכן `_meta`, מריץ tests.
>
> **חשוב לפני שאת מפעילה:** ודאי ש-5 ה-JSON files של הסוכן הפדגוגי נמצאים אצלך בtemporary location (downloads / clipboard).

---

## משימה

הסוכן הפדגוגי 21 השלים את העמקת 5 קבצי intervention scripts מ-`PARTIAL` (~10K chars) ל-`FULL` (~64K chars · פי 6.6). תפקידך = להחליף את הקבצים הקיימים תחת `avnei-yesod/underwater-app/interventions/` ולוודא שאפס נשבר.

**אומדן:** 30-60 דק' (החלפה + tests + ידנית).

## הקשר

5 ה-scripts הם הליבה הפדגוגית של B.7 — כשהמערכת מזהה דפוס משותף ל-3-4 ילדות, היא מציעה למורה script מובנה (HOOK · MODEL · GUIDED · INDEPENDENT · CHECK). הסוכן הפדגוגי הוסיף `examples_to_use` · `differentiation` · `troubleshooting` לכל stage.

**5 באגים פדגוגיים שתוקנו (לעיון):**
1. phonological: "ארבעה צלילים" → "חמישה" (שגיאת ספירה ב-שֶׁמֶש)
2. letter_knowledge: ב/פ → צ/ץ ב-CONFUSED_PAIRS examples + מֵץ → קַיִץ
3. decoding: חידוד "מיקום אות" vs "ניחוש לפי הקשר" (6 מקומות)
4. fluency: "מי קוראת מהר" → "קריאה זורמת" (7 מקומות) + "Tier 2" → "Tier 3 selective"
5. letter_cluster: ללבן → למיון + תורבבי → ערבבי

## קבצי-מקור — חובה לקרוא לפני עבודה

1. **5 קבצים קיימים (לפני):** `avnei-yesod/underwater-app/interventions/{phonological,letter-knowledge,decoding,fluency,letter-cluster}.json`
   - לפני החלפה: לקרוא ולוודא מבנה (id, duration_minutes, stages, evidence)
2. **5 קבצי FULL (שלך מהפדגוגי):** מיטל תספק (clipboard / downloads / paste). לקרוא ולוודא:
   - שדות הקיימים נשמרו (id, pattern_id, duration_minutes, success_criterion, evidence)
   - שדות חדשים נוספו (examples_to_use, differentiation, troubleshooting)
   - אפס שינוי ב-placeholders ({personalized_letters}, {personalized_first_letter}, {class_name}, {teacher_name})
3. **Bootstrap הפדגוגי (לזכר):** `_handoff/2026-05-29-interventions-deepening-pedagogical-agent-prompt.md`
4. **Code חי:** `avnei-yesod/underwater-app/js/shared/interventions.js` — קריאה בלבד.
   - `interpolateScript` (~line 200-250?) — לוודא שה-placeholders עדיין עובדים.
   - `CONFUSED_PAIRS` (~line 70-90) — לוודא שלא צריך עדכון לפי letter_knowledge החדש.
5. **Tests:** `avnei-yesod/underwater-app/scripts/test-interventions.js` (78/78 ✓ לפני).

## משימות (להריץ ברצף)

### Phase A — Pre-check (5 דק')

1. ☐ `git fetch origin && git status` — וודא שאין שינויים פעילים ב-interventions/* או interventions.js.
2. ☐ קרא את 5 הקבצים הנוכחיים — שמור snapshot של ה-structure (id list per file).
3. ☐ הריצי `test-interventions.js` baseline — לוודא 78/78 ✓ לפני שאת נוגעת.

### Phase B — Replace 5 JSONs (15 דק')

4. ☐ קבלי את 5 הקבצים מ-מיטל (clipboard / paste / file paths).
5. ☐ **אחד-אחד** — עברי על כל קובץ:
   - השווי id-list של stages (חייב להיות `hook`, `model`, `guided`, `independent`, `check`)
   - השווי placeholder names — אסור לשינוי
   - השווי `pattern_id` ו-`pattern_name_he` — חייב להיות זהה
   - השווי `evidence` array — אם הוסר משהו = לעצור ולשאול
6. ☐ אם הכל OK — `Write` את הקובץ החדש (החלפה מלאה).
7. ☐ עדכן `_meta` בקובץ (אם השדה קיים):
   ```json
   "_meta": {
     "version": "FULL",
     "deepened_by": "סוכן 21 פדגוגי",
     "deepened_date": "2026-05-29",
     "chars_before": 1800,
     "chars_after": 7400,
     "fixes_applied": ["ארבעה צלילים → חמישה", ...]
   }
   ```
   אם השדה לא קיים — להוסיף.

### Phase C — Run Tests + interpolateScript Check (15 דק')

8. ☐ הריצי `node avnei-yesod/underwater-app/scripts/test-interventions.js` — חייב **78/78 ✓** (או יותר אם הסוכן הפדגוגי הוסיף testable claims).
9. ☐ **בדיקה ספציפית ל-`interpolateScript`:** קרא את ה-stages של letter_cluster + letter_knowledge — חפשי placeholders:
   - `{personalized_letters}` · `{personalized_first_letter}` (בעיקר letter_cluster)
   - אם יש placeholders חדשים שלא קיימים ב-`interpolateScript` → לדווח למיטל **לעצור**.
10. ☐ **בעיית "שׁ" ב-letter_cluster:** הסוכן הפדגוגי ייתכן הוסיף הערה ספציפית על האות "שׁ" (עם נקודת shin). `getLetterMasteryDistribution()` מחזיר אותיות ללא ניקוד ("ש"). בדקי:
    ```js
    // grep ל-"שׁ" או "שׂ" ב-letter-cluster.json
    grep -c 'שׁ\|שׂ' avnei-yesod/underwater-app/interventions/letter-cluster.json
    ```
    אם > 0 → לוודא ש-`interpolateScript` מנרמל ש→שׁ או להפך. אם לא — לדווח.

### Phase D — Regression Tests (5 דק')

11. ☐ הריצי כל 15+ test suites — וודאי 0 רגרסיות:
    ```
    test-bkt, test-bkt-letters, test-cold-start, test-event-logger-fields,
    test-group-suggester, test-interventions, test-intervention-matcher,
    test-moy-assessments, test-moy-intervention-link, test-pack-bridge,
    test-rama-task-status, test-weakness-targeting, test-f21e-helpers,
    test-letter-targets, test-skill-units
    ```

### Phase E — Manual Verification (10 דק')

12. ☐ פתחי `http://localhost:8765/underwater-app/teacher-rama.html` עם PIN 4521.
13. ☐ צרי תלמידות mock (אם אין) או השתמשי בקיימות — חפשי "פתחי קבוצת תמיכה" / Morning Group Section.
14. ☐ לחצי לפתוח modal של B.7 — וודאי שה-script המוצג הוא הגרסה החדשה ה-FULL:
    - יש examples_to_use עם 3-5 דוגמאות
    - יש differentiation (struggling + advanced)
    - יש troubleshooting
15. ☐ אם הכל נראה תקין → ✅. אם יש text חתוך / placeholders שלא הוחלפו → לדווח למיטל.

### Phase F — Handoff

16. ☐ עדכן `_handoff/agent-completion-log.md` — בלוק חדש בראש:
    ```
    ## סוכן 27 — Interventions Code Integration (29.5.2026)
    
    5 קבצי intervention עברו מ-PARTIAL ל-FULL.
    - chars_before: ~9,700 → chars_after: ~63,900 (× 6.6)
    - 5 באגים פדגוגיים תוקנו (מאת סוכן 21 פדגוגי)
    - tests: 15/15 ✓ · 0 רגרסיות
    - manual: B.7 modal מציג תוכן FULL
    ```
17. ☐ דווחי למיטל: "סוכן 27 סיים · 5 JSONs מוחלפים · X/X tests · ממתין לאישור push".
18. ☐ **אל תדחפי בלי אישור.**

## Acceptance Criteria

- [ ] 5 קבצי interventions/*.json במצב `FULL` (כל אחד ≥ 5K chars).
- [ ] `_meta.version: "FULL"` בכל הקבצים.
- [ ] `id` של 5 stages זהה (hook/model/guided/independent/check).
- [ ] `pattern_id` · `pattern_name_he` · `evidence` — לא שונים.
- [ ] **0 placeholders חדשים** שלא ב-interpolateScript.
- [ ] **0 רגרסיות** ב-15+ test suites.
- [ ] B.7 modal פותח ומציג תוכן FULL ידנית.

## אסור לך

- ❌ לערוך `interventions.js` (logic) — קריאה בלבד.
- ❌ לערוך `CONFUSED_PAIRS` ב-interventions.js — הסוכן הפדגוגי תיקן בתוך letter_knowledge.json בלבד.
- ❌ לערוך `teacher-rama.html` או `teacher-action.html`.
- ❌ לערוך JSONs אחרים (moy-items, packs, וכו').
- ❌ לדחוף ל-git בלי אישור.
- ❌ להמציא שינויים נוספים — replace הוא operation מכני.
- ❌ "תכונות חכמות" שלא ב-spec — לא להוסיף `audio_url`, לא לרפקטר.

## בספק

שאלי את מיטל. במיוחד אם:
- placeholder חדש מופיע ב-JSON שלא קיים ב-interpolateScript.
- evidence array השתנה (מקור הוסר).
- "שׁ" / "שׂ" mismatch עם getLetterMasteryDistribution.
- test נשבר אחרי החלפה — **לעצור ולשאול**, אל תחבר fix.

## תיאום עם סוכנים פעילים

- סוכן 26 (MOY IPA fix): רץ ב-VS Code אחר. אין חפיפה (moy-items שונה לחלוטין מ-interventions/*).
- סוכן 23 (packs): סיים.
- סוכן 25 (a11y): סיים.

**לפני edit:** `git fetch origin && git status`.

---

*Bootstrap סוכן 27 — סוכן קוד קצר וזריז. אחרי הסיום: B.7 עם תוכן FULL · המורה מקבלת scripts פדגוגיים מוכנים-לשימוש.*
