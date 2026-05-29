# Handoff — F.21E Code Agent (סשן חדש)

> **מיטל:** העתיקי את כל מה שמתחת לקו הראשון של `---` כפרומפט פתיחה לסשן Claude Code חדש (בעדיפות Opus 4.7 · 1M).

---

## משימה

לבנות את **F.21E — דשבורד פעולת בוקר למורה** ב-`underwater-app/teacher-action.html` — מסך חדש לפי ה-spec המאושר.

**אומדן:** L+ (12-15 שעות). כולל UI + לוגיקה + helper מקומי + integration עם 5 APIs קיימים + tests + לינק קטן ב-teacher-rama.

## הקשר

"אבני יסוד" = מערכת תרגול אדפטיבית לרכישת קריאה בעברית בכיתה א'. **חוסם פיילוט אחרון לפני content + E2E + soft launch ספטמבר 2026.**

F.21E = "מסך פעולה בוקר": מורה פותחת בבוקר → 3 דקות → תכנית פעולה. נפרד ל-100% מ-F.21A (`teacher-rama.html`) שהוא תצפית בלבד.

## קבצי-מקור — חובה לקרוא לפני עבודה

1. **Spec המאושר (מקור-האמת):** `avnei-yesod/_handoff/2026-05-29-F21E-ux-spec-v2.md` — 13 סעיפים + §15 תשובות מיטל. **כל החלטה צריכה להגיע ממנו.**
2. **F.21A הקיים:** `underwater-app/teacher-rama.html` — לדגום:
   - PIN gate (`sessionStorage avnei-rama-auth=1`)
   - Boot pattern (`setTimeout(boot, 0)` ב-IIFE — Finding B fix)
   - DOM structure של B.9 Morning Section (CSS `.mg-section`/`.mg-card`/`.mg-conf-pill`)
   - `_activeGroups` pattern + `openInterventionModal(group)` reuse
   - URL pattern של Student View (`?student=<sid>`)
3. **5 APIs חיים שצריך לצרוך** (קריאה בלבד · לא לשנות):
   - `underwater-app/js/shared/group-suggester.js` — `AvneiGroupSuggester.suggestGroups`
   - `underwater-app/js/shared/intervention-matcher.js` — `AvneiInterventionMatcher.matchForStudent` + `matchForGroup`
   - `underwater-app/js/shared/interventions.js` — `AvneiInterventions.detectForStudent` + `openInterventionModal`
   - `underwater-app/js/shared/assessments.js` — `AvneiAssessments.getMOYStatus`
   - `underwater-app/js/shared/pack-bkt-bridge.js` (או הקובץ עם `AvneiPackBridge`) — `getNextPackForStudent`
4. **sub-BKT data ל-22 אותיות:** `bkt.js` — קריאה בלבד למבנה raw data כדי לכתוב `getTopWeakLetters` helper. **אל תשנה את bkt.js.**
5. **Test pattern לדוגמה:** `underwater-app/scripts/test-group-suggester.js` — סוכן 18 כתב 77/77 assertions ל-B.9. סגנון תואם.
6. **Memory feedback (חובה):**
   - `feedback-avnei-yesod-teacher-language-simplicity` — אסור BKT/EPA/strands/confidence. "שולטת היטב", "טועה באמצע מילים".
   - `feedback-avnei-yesod-cross-screen-navigation-uses-history-back` — חזרה דרך `history.back()`, לא `location.href`.

## החלטות שכבר נסגרו (לא לפתוח מחדש)

לפי spec §1-§13 ו-§15:

| נושא | החלטה |
|---|---|
| URL | `teacher-action.html` נפרד (לא tab ב-teacher-rama) |
| PIN gate | משותף עם F.21A (`avnei-rama-auth=1`) |
| Class selector | mockup קבוע "כיתה א'1" בפיילוט (אין dropdown אמיתי) |
| Hero | hybrid — משפט אחד + 3-4 KPI tiles |
| Hero greeting | משתנה לפי שעת היום (§5.2 table) |
| Hero copy | 4 rules table ב-§9.4 + priority של MOY≥2 |
| B.9 Section ב-teacher-rama | נשאר כפי שהוא + לינק "🌅 עברי לפעולה →" **תמיד** מופיע בראשו |
| Mobile/Desktop | mobile-first עם הרחבת desktop (2 עמודות) |
| Refresh | כפתור ידני + on-focus, אין auto-refresh |
| Execution tracking | UI flag בלבד, `localStorage avnei-action-log-v1`, **לא משפיע על B.9** |
| Modal B.7 | **reuse בלבד** של `openInterventionModal(group)` הקיים |
| Letters בכרטיס קבוצה | רק אם `pattern_id ∈ {letter_knowledge, letter_cluster}` |
| Section "אותיות שכדאי לשלב" | top-3 חלשות פר תלמיד.ה (כל אחד.ת בשורה) |
| שפת copy | "תלמידים" (זכר רבים, ניטרלי) · "אמצע שנה" ב-UI (`MOY` בקוד) · "תרגול אישי קצר" (לא "pack מותאם") |
| Open Q של מיטל | 5 שאלות נסגרו ב-§15 |

## משימות (להריץ ברצף)

### Phase A — Setup + Helper (1-2h)

1. ☐ קראי את כל קבצי המקור לעיל.
2. ☐ צרי `underwater-app/teacher-action.html` עם skeleton: `<head>` + meta RTL + viewport + PIN gate script + boot IIFE (העתיקי pattern מ-teacher-rama).
3. ☐ העתיקי את ה-script tags של 5 ה-APIs מ-teacher-rama (לפי הסדר ההיררכי: bkt → assessments → epa → interventions → intervention-matcher → group-suggester → pack-bkt-bridge).
4. ☐ כתבי helper מקומי `getTopWeakLetters(sid, n=3)` בתוך teacher-action.html:
   - קוראת raw sub-BKT data של 22 אותיות מ-`state.bkt[sid].letters` (אם זה השם — בדקי ב-bkt.js).
   - ממיינת לפי `pKnown` עולה.
   - מחזירה עד n אותיות (תווים, לא objects).
   - אם אין data → `[]`.
5. ☐ helper מקומי שני `groupLetterOverlap(students[])`:
   - לכל תלמיד.ה רץ `getTopWeakLetters(sid, 5)`.
   - מחזיר intersection של כל הרשימות. אם < 3 אותיות → לא להציג בכרטיס.

### Phase B — Header + Hero (2-3h)

6. ☐ Header: כפתור חזרה (`history.back()`) · כותרת "דשבורד פעולת בוקר" · "כיתה א'1" קבוע · תאריך עברי (`he-IL` locale) · כפתור "🔄 רענון".
7. ☐ Hero: ברכה לפי שעה (§5.2 table) + משפט לפי rules (§9.4 table) + 4 KPI tiles.
   - KPI חישוב:
     - "קבוצות היום": `AvneiGroupSuggester.suggestGroups(students).length`
     - "ללא קבוצה": תלמידים שיש להם `matchForStudent` אבל לא בקבוצה ≥3
     - "התראות": MOY alerts פתוחות
     - "בוצעו השבוע": `avnei-action-log-v1` filter `completedAt >= startOfWeek`
8. ☐ Empty Hero state: §7.2-7.5 — בלי לעזוב מסך ריק.

### Phase C — Action List (קבוצות בוקר) (3-4h)

9. ☐ `renderActionList(suggestions)` — כרטיסים לפי §3.4 + §5.3:
   - כותרת: "קבוצה {n} · {pattern_name_he}"
   - תלמידים: מופרדים בנקודה אמצעית
   - "למה עכשיו?" — תרגום של `evidence.by_source` לשפה פשוטה
   - "אותיות רלוונטיות:" — רק אם `pattern_id ∈ {letter_knowledge, letter_cluster}` ו-`groupLetterOverlap >= 3`
   - 2 כפתורים: "פתחי תרגול" (`openInterventionModal` reuse) + "סמני כבוצע" (toggle execution log)
   - badge סטטוס: "טרם בוצע היום" / "בוצע היום" / "בוצע השבוע"
10. ☐ עד 5 כרטיסים. אם 0 → §7.2 empty state.

### Phase D — תלמידים ללא קבוצה (2-3h)

11. ☐ `renderSoloStudents()`:
   - לכל תלמיד.ה רץ `matchForStudent(sid)`.
   - filter: בעלי intervention שלא נמצאים ב-suggestion של ≥3.
   - כרטיס פר תלמיד.ה: שם · צורך בשפה פשוטה · badge "ממתינ.ה לקבוצה" · microcopy: "כרגע יש צורך בתרגול, אבל אין מספיק תלמידים לפתיחת קבוצה מתאימה. בינתיים כדאי לתת תרגול אישי קצר." · כפתור "פתחי תרגול אישי" · לינק שם → Student View
12. ☐ אם 0 → §7.3.

### Phase E — MOY Alerts + Letters Section + ביצוע (2-3h)

13. ☐ `renderMoyAlerts()`:
   - לכל תלמיד.ה רץ `getMOYStatus(sid)`.
   - filter: failed, awaiting repeat, or `suggested_intervention` exists.
   - כרטיס: שם · משימה · סוג ההתראה (שפה פשוטה) · 3 כפתורים: "פתחי תרגול" · "סמני שטופל" · "מבט תלמיד.ה".
   - אם 0 → §7.4.
14. ☐ `renderLettersSection()`:
   - לכל תלמיד.ה: `שם: {top3 letters}` (compact, שורה אחת).
   - אם 0 תלמידים → לא להציג בכלל.
15. ☐ `renderExecutionTracking()` — sidebar widget: "X סומנו · Y פתוחות" (השבוע).

### Phase F — Integration + Polish (1-2h)

16. ☐ ב-`teacher-rama.html`: בראש Section `#morningGroupSuggestions` הוסיפי לינק קטן:
   ```html
   <a href="teacher-action.html" class="mg-action-link">🌅 עברי לפעולה →</a>
   ```
   הלינק מופיע **תמיד**, גם כשאין קבוצות (לפי §15 שאלה 4).
17. ☐ Refresh strategy: כפתור ידני + `window.addEventListener('focus', refresh)` + לא auto-refresh.
18. ☐ RTL מלא + responsive (CSS grid 2 cols ≥ 1024px · 1 col < 1024px) + 44px touch targets במובייל.

### Phase G — Tests (2h)

19. ☐ צרי `underwater-app/scripts/test-f21e-helpers.js` בסגנון `test-group-suggester.js`:
   - mock של `state.bkt` + `AvneiGroupSuggester` + `AvneiInterventionMatcher` + `AvneiAssessments`.
   - assertions: `getTopWeakLetters` (empty · normal · n=3 · pKnown ordering) · `groupLetterOverlap` (3+ · 0 · single student) · Hero rules (4 מצבים + MOY≥2 priority) · greeting by hour · execution log read/write/filter.
   - יעד: 50+ assertions.
20. ☐ הריצי `node scripts/test-f21e-helpers.js` → 100% ✓.
21. ☐ הריצי את כל ה-suites הקיימים שאת קוראת ל-APIs שלהם — וודאי **0 רגרסיות**:
   - `test-group-suggester.js` (77/77) · `test-intervention-matcher.js` (57/57) · `test-interventions.js` (78/78) · `test-moy-assessments.js` (51/51) · `test-moy-intervention-link.js` (51/51) · `test-pack-bridge.js` (75/75) · `test-weakness-targeting.js` (38/38) · `test-bkt.js` · `test-bkt-letters.js` (53/53) · `test-cold-start.js` · `test-event-logger-fields.js` (23/23) · `test-rama-task-status.js`.

### Phase H — Verification ידני (חוץ-טסטים)

22. ☐ פתחי `teacher-action.html` ב-browser → PIN → תהנהוג.
23. ☐ וודאי שכפתור "פתחי תרגול" מ-card → modal B.7 הקיים נפתח (לא חדש).
24. ☐ לחיצה על שם תלמיד.ה → `teacher-rama.html?student=<sid>` → Student View נטען.
25. ☐ סמני "בוצע" → badge מתעדכן → רענון → סטטוס נשאר.
26. ☐ ב-teacher-rama → ראי לינק "🌅 עברי לפעולה" → קליק → ניווט → `history.back()` חוזר.

### Phase I — Handoff

27. ☐ עדכון `_handoff/2026-05-26-architecture-tasks-tracker.html` — F.21E ☐ → ✅.
28. ☐ עדכון `_handoff/agent-completion-log.md` — בלוק חדש בראש בסגנון הקיים (סוכן 19?).
29. ☐ עדכון `_handoff/pending-commits.md`.
30. ☐ commit message (HEREDOC):
    ```
    F.21E — Action Dashboard (UI + helpers · code agent)

    מסך חדש teacher-action.html — דשבורד פעולת בוקר למורה.
    מבוסס על spec v2 (_handoff/2026-05-29-F21E-ux-spec-v2.md).

    UI:
      Hero (greeting by hour · 4 rules · KPI tiles)
      Action List (B.9 cards · reuse openInterventionModal)
      תלמידים ללא קבוצה (B.8 filter)
      MOY Alerts
      אותיות שכדאי לשלב (helper local)
      Execution tracking (UI flag only, avnei-action-log-v1)

    Helpers מקומיים (in-file):
      getTopWeakLetters(sid, n=3) — מ-sub-BKT 22
      groupLetterOverlap(students)

    Integration:
      teacher-rama.html — לינק "🌅 עברי לפעולה" בראש B.9 Section

    אסור (לא נגעתי):
      bkt.js · group-suggester.js · intervention-matcher.js ·
      interventions.js · assessments.js · pack-bkt-bridge.js ·
      interventions/*.json · moy-items.json · F.21A functionality
      (רק 1 לינק נוסף)

    אימות: XYZ/XYZ ✓ (test-f21e-helpers חדש + רגרסיה 503/503)
    ```

## Acceptance Criteria

מ-spec §10.1-10.12 — כולם חובה:

- [ ] `teacher-action.html` חדש קיים.
- [ ] F.21A נשאר זהה functionally (רק 1 לינק נוסף ב-Section header).
- [ ] PIN gate משותף עובד.
- [ ] "כיתה א'1" טקסט קבוע (אין dropdown אמיתי).
- [ ] עד 5 קבוצות מ-B.9. כפתור "פתחי תרגול" → modal B.7 הקיים. אין modal חדש.
- [ ] אותיות בכרטיס קבוצה רק עבור `letter_knowledge`/`letter_cluster`.
- [ ] תלמידים ללא קבוצה — באזור נפרד, פעולה זמנית "תרגול אישי קצר".
- [ ] MOY alerts עם פעולה מוצעת + סימון "טופל".
- [ ] `getTopWeakLetters` helper מקומי — לא משנה bkt.js, לא חושף pKnown.
- [ ] Execution log: `avnei-action-log-v1` schema פשוט · UI flag בלבד · לא משפיע על B.9.
- [ ] שפה: 0 BKT/EPA/strands/confidence במסך. 0 ניקוד.
- [ ] RTL מלא · mobile-first · touch targets 44px · 2 cols ≥ 1024px.
- [ ] `history.back()` לחזרה · URL pattern של Student View.
- [ ] empty/loading/error states מכוסים (§7.1-7.7).
- [ ] בכל תרחיש — אין מסך ריק בלי הסבר.
- [ ] **0 רגרסיות** בכל suites קיימים.
- [ ] test-f21e-helpers ✓ 100%.

## אסור (לא לגעת ב)

- ❌ `bkt.js` / `epa.js` / `assessments.js` / `interventions.js` / `intervention-matcher.js` / `group-suggester.js` / `pack-bkt-bridge.js` / `mastery-check.js` / `event-logger.js` / `profile-classifier.js` — **קריאה בלבד**.
- ❌ `interventions/*.json` (5 קבצים) — content של מיטל.
- ❌ `moy-intervention-map.json` · `moy-items.json` (60 פריטים).
- ❌ `teacher-rama.html` — **למעט 1 לינק נוסף ב-Section header**.
- ❌ `moy-screener.html` · `screener.html` · `data-export.html`.
- ❌ 22 `stage-3-*.html` · onboarding · 7 planning packs · 2 dummy packs.
- ❌ 7 untracked `curriculum/packs/grade1-tashpaz/{month}.json` · `engine/demo-day2/` · `perplexity-shatil-share-2003-validation-2026-05-25.json` (תוכן של מיטל).
- ❌ מסמכי-אם (`architecture-mvp.md` · `pedagogy-integration-framework.md` · `literacy-grade1-2-yearly.md` וכו').
- ❌ "תכונות חכמות" שלא ב-spec (ML, AI suggestions, tutor, calibration).
- ❌ multi-class אמיתי (בפיילוט = mockup בלבד).
- ❌ השפעת execution על B.9 (post-pilot).
- ❌ ניקוד.
- ❌ modal חדש ל-B.7.
- ❌ שינוי APIs קיימים.

## בספק

- **שאלה פדגוגית** → שאלי את מיטל לפני קוד.
- **שאלת מינוח / שפת מסך** → דבק.י בטבלת §15 + memory `teacher-language-simplicity`. אם בכל זאת ספק → מיטל.
- **שאלה ארכיטקטונית** (איך לבנות) → את החלטה. תיעדי את הרציונל ב-completion log.
- **API חסר / מנגנון שלא מצאת** → לא להמציא. שאלי את מיטל / קראי את ה-spec שוב.

## תיאום עם סוכנים פעילים

נכון ל-29.5 בוקר: **אין סוכנים פעילים אחרים** (המסלול הראשון נסגר אתמול). את היחידה.

לפני push: `git fetch origin && git status` — וודאי שאין conflict עם פעילות שלא צפויה.

---

*Bootstrap זה מובנה מ-spec v2 + 4 spec-bootstraps של MOY-Lite שנעשו אתמול. מבנה תואם.*
