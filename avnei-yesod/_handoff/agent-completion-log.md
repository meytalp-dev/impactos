# Agent Completion Log — אבני יסוד

> **מטרת הקובץ:** מעקב מי עבד על איזו משימה, מה נמסר, ומה השאלות הפתוחות.
> כל סוכן שמסיים משימה — מוסיף בלוק חדש בראש הקובץ (החדש ביותר למעלה).
>
> **פורמט:** ראה תבנית בתחתית הקובץ.

---

## C.11 + C.12 + C.13 — Pack × BKT Integration (לב הדיפרנציאליות)

**סטטוס:** ✅ קוד + 75/75 בדיקות עוברות · **ממתין לבדיקה ידנית של מיטל ואז push**
**תאריך:** 2026-05-28
**שיחה:** Claude Code (Opus 4.7 · VS Code · impactos)
**Commit:** טרם נדחף
**יחס:** ה-spec של C.11+C.12+C.13 נדחף ב-`6d5a47d` (28.5 בוקר). הקוד מבוסס 1:1 על spec — כל ההחלטות נסגרו לפני קוד.

**מה נעשה:**

**C.11 — Pack Schema + 2 dummy packs:**
- `curriculum/packs/grade1-tashpaz/september-2026.json` — letters-focused (ש·ל·נ·א, primary_strand=1), 4 tiers עם 5+4+4+7 items.
- `curriculum/packs/grade1-tashpaz/january-2026.json` — strand-focused (מודעות פונולוגית, 3 skills), primary_strand=1.
- `curriculum/packs/_schema.md` — תיעוד schema מלא (8 סעיפים, כולל קשר ל-7 ה-planning packs הקיימים).

**C.12 — pack-bkt-bridge.js (~370 שורות):**
- 8 פונקציות API: `loadPack` · `preloadPack` (async) · `loadCurrentPack` · `selectTierForStudent` · `getItemsForStudent` · `overrideTier` · `clearOverride` + 2 constants `TIER_THRESHOLDS` (frozen) · `STRAND_NAMES`.
- `selectTierForStudent`: בדיקת override קודם, אחרת auto. letters-focused — ממוצע על `letters_in_focus` דרך `getLetterState(studentId, letter)` (A.4). strand-focused — לפי `getStudentStrands(studentId)[primary_strand]` (A.1).
- ספים: 0.30/0.60/0.85 (גלויים ב-`TIER_THRESHOLDS`).
- Cold-start: `letters` — אם פחות מ-5 ניסיונות פר אות. `strand` — אם פחות מ-10 ניסיונות בסטרנד. → Tier 1 + reason ברור.
- Confidence: `letters` — `high` אם כל האותיות עם דאטה, אחרת `med`. `strand` — `high` אם ≥30 attempts, אחרת `med`.
- Override ב-localStorage (`pack-overrides`): `{[studentId]: {[packId]: {tier, date, author}}}`.
- Loading: synchronous XHR בדפדפן (פיילוט) + `fs` ב-Node (טסטים) + `preloadPack` async fallback.

**C.13 — Item Tagging + validate-pack.js:**
- Item schema: `item_id` · `tier` · `type` (`new`|`review`) · `letter|skill` · `mechanic` · `source_letter` (אם review) · `challenge` · `rama_task_alignment` · `peima_target`.
- `scripts/validate-pack.js` — CLI: `node validate-pack.js [filename]` או בלי ארגומנט (כל ה-execution packs). בודק 7 שכבות: pack-level, focus_mode mutual exclusion, primary_strand range, tiers 4 keys, items_distribution sum, per-item required fields, mechanic/type/range enums. exit codes: 0/1/2.

**UI Integration ב-teacher-rama.html:**
- Class View — עמודת Tier חדשה (אחרי "תלמידה", לפני "מ1"), צבע פר tier (1=אדום, 2=צהוב, 3=כחול, 4=ירוק), ⚙ אם manual override.
- Student View — Section 5 אחרי 10 RAMA tasks. כולל: pack title + focus_line + Tier badge גדול עם label עברית (בסיסי/ליבה/מתקדם/מאסטר+) + reason + source/confidence + 4 כפתורי override (1·2·3·4) + "× בטל override" כשיש manual.
- CSS חדש (~125 שורות): `.tier-col` · `.tier-cell` (4 צבעים + cold) · `.pack-section` · `.pack-tier-display` · `.pack-override` עם כפתורים.
- `currentPackId()` קבוע לפיילוט ל-`september-2026` (post-pilot: UI לבחירה / loadCurrentPack).

**3 ההחלטות מ-spec הוטמעו 1:1:**

| # | החלטה | יישום |
|---|---|---|
| 1 | Pack דו-מצבי | `focus_mode: "letters" \| "strand"` נאכף ב-validate-pack + ב-selectTierForStudent |
| 2 | Tier 4 = 70% ישן + 30% חדש | `items_distribution: {new: 0.3, review: 0.7}` ב-tier 4 של september-2026 + validate בודק סכום=1.0 |
| 3 | Auto + manual override | `selectTierForStudent` בודק override קודם → `source: 'manual'`; אחרת auto. UI מציג ⚙ ו-"× בטל" |

**קבצים שנוצרו/שונו:**

| # | קובץ | סטטוס | הערה |
|---|---|---|---|
| 1 | `curriculum/packs/grade1-tashpaz/september-2026.json` | **חדש** | letters-focused, 4 tiers, 20 items |
| 2 | `curriculum/packs/grade1-tashpaz/january-2026.json` | **חדש** | strand-focused, 4 tiers, 13 items |
| 3 | `curriculum/packs/_schema.md` | **חדש** | תיעוד schema מלא (~150 שורות) |
| 4 | `underwater-app/js/shared/pack-bkt-bridge.js` | **חדש** (~370 שורות) | 8 פונקציות API + cache + override |
| 5 | `underwater-app/scripts/validate-pack.js` | **חדש** (~210 שורות) | CLI validator (CLI + module exports) |
| 6 | `underwater-app/scripts/test-pack-bridge.js` | **חדש** (~290 שורות) | 16 בלוקי טסט · **75/75 assertions** עוברות |
| 7 | `underwater-app/teacher-rama.html` | שינוי | script tag + ~125 CSS lines + helpers (`currentPackId`, `getActivePack`, `tierDecisionFor`, `TIER_LABELS`, `tierCellHtml`, `renderPackSection`, `attachPackOverrideHandlers`) + Class View column + Student View Section 5 |
| + | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי | C.11+C.12+C.13 ✅ + checkboxes |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש (זה) | תיעוד |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש | קבוצה חדשה 🟡 |

**יחס ל-A.5 (סוכן 5 · `a171a74`):**
- ה-bootstrap הזהיר שסוכן 5 עובד במקביל על `teacher-rama.html`. בפועל A.5 נדחף לפני שהתחלתי (`a171a74`).
- שילבתי עם הקוד הקיים — `coldStartFor(stu.id)` שכבר היה ב-Class View נשאר 1:1. Section 5 שלי נוסף **אחרי** Section 4 RAMA tasks.
- אין חפיפת קוד עם A.5 — נגעתי רק בקטעים שלא A.5 לא נגעה בהם.

**שאלות פתוחות:**
- **בחירת pack לפיילוט:** קבעתי `currentPackId()` → `september-2026`. אם מיטל רוצה לבדוק strand-focused (january-2026), לשנות ידנית ב-קוד או לבקש toggle UI.
- **תוכן ה-packs:** dummy (5-10 items פר tier) לפי הנחיית ה-spec. התוכן האמיתי = מיטל כותבת ידנית בקצב שלה. אין לי דעה איזה mechanic מתאים לאיזה item.
- **TIER_THRESHOLDS:** 0.30/0.60/0.85 הם הצעה ראשונית. יש לכייל בפיילוט (לא בסקופ C.11/12/13).

**מה זה פתח להמשך:**
- C.14 עתידי — קריאה ל-`getItemsForStudent` מתוך משחקון (כדי שילדה בפועל תקבל פריטים מהטיר שלה).
- תוכן אמיתי ל-11 packs (ספט-יוני) — מיטל / צוות פדגוגי.
- post-pilot — Tier transition animations, auto-classification של פריטים.
- כיול thresholds לפי תוצאות פיילוט.

**לפני push (מיטל):**
1. שרת ב-`avnei-yesod/`: `python -m http.server 8765`
2. פתחי `http://localhost:8765/underwater-app/teacher-rama.html` עם PIN `4521`.
3. **Class View:** ודאי שעמודת "Tier" מופיעה אחרי "תלמידה" + צבעים שונים פר תלמידה.
4. **Student View:** לחצי על שם תלמידה → גללי לתחתית → ודאי **Section 5 "📦 Pack חודשי"** עם Tier badge + reason + 4 כפתורי override.
5. **3 פרסונות:** מאיה (override ל-Tier 4 ידני), נועה (אוטומטי Tier 3 לפי דאטה), שירה (cold-start → Tier 1).
6. **רגרסיה:** ודאי שכל הסקציות הקיימות עובדות (5 strands, 22 letters, EPA, 10 RAMA tasks, A.5 badge).
7. אם הכל תקין — אישור push.

---

## E.17 + E.18 — Event Logger ל-3 שדות + Data Export (CSV)

**סטטוס:** ✅ קוד + 23/23 בדיקות עוברות · **ממתין לאישור push**
**תאריך:** 2026-05-28
**שיחה:** Claude Code (Opus 4.7 · VS Code · impactos)
**Commit:** טרם נדחף
**יחס:** E.17 משלים את A0.2 (השדות פר-פריט) ע"י דחיפה שלהם לכל אירוע. E.18 הופך את הדאטה לזמין למיטל בפיילוט (CSV → Excel/Sheet). ביחד = "הפיילוט מייצר דאטה שאפשר לנתח".

**מה נעשה:**

**E.17 — 3 שדות חדשים באירוע:**
- `strand_id` — אוטומטי דרך `ISLAND_TO_STRAND[ISLAND_ID_CURRENT]` (22 איים → 5 סטרנדים, מקור: `architecture-mvp.md` §1).
- `rama_task_alignment` + `peima_target` — מועברים מהפריט (`result.rama_task_alignment` / `result.peima_target`) דרך game-shell ל-4 mechanics, או hardcoded `1,1` ב-9 call sites ישירים (כולם אי 3 = משימה 1 פעימה 1).
- אירועים ישנים בלי השדות → `null` (backwards compat).

**E.18 — `data-export.html`:**
- PIN gate זהה ל-`teacher-rama.html` (PIN `4521`, אותו `sessionStorage` key).
- 6 פילטרים: תלמידה / טווח תאריכים / פעימה / משימת ראמ"ה / סטטוס (✓ + ✗).
- Summary: 4 אריחים (count + טווח תאריכים + accuracy + median ms).
- Table preview: 10 שורות אחרונות (10 עמודות עיקריות).
- CSV עם **BOM** (`'﻿'`) — Excel קורא עברית נכון.
- 2 כפתורים: הורד CSV / העתק ל-clipboard.
- 20 עמודות בייצוא (כל שדות האירוע).
- **אין** קישור ל-data-export מ-teacher-rama (גישה רק דרך URL ישיר — privacy gate נוספת).

**6 החלטות סגורות (ב-bootstrap) הוטמעו 1:1:**

| # | פריט | יישום |
|---|---|---|
| 1 | `strand_id` אוטומטי | `ISLAND_TO_STRAND[ISLAND_ID_CURRENT]` ב-event-logger — אין שינוי במשחקונים |
| 2 | `rama_task_alignment` / `peima_target` מהפריט | `result.X` ב-logActivityResult; game-shell קורא גם מ-`_meta` של JSON ל-D.15 |
| 3 | CSV ראשון (Apps Script דחוי) | `data-export.html` עם BOM + 20 עמודות; הערה `// TODO: E.18B — Apps Script POST` |
| 4 | קובץ נפרד | `data-export.html` — לא נגעתי ב-`teacher-rama.html` |
| 5 | אותו PIN gate | `TEACHER_PIN = '4521'`, אותו `SESSION_AUTH_KEY = 'teacher_authed'` |
| 6 | רק המורה רואה | PIN gate + אין קישור ממסך תלמידה |

**קבצים שנוצרו/שונו:**

| # | קובץ | סטטוס | הערה |
|---|---|---|---|
| 1 | `underwater-app/js/shared/event-logger.js` | שינוי | `ISLAND_TO_STRAND` map (22 → 5, `Object.freeze`) + 3 שדות חדשים ב-`logActivityResult` + ייצוא ב-public API |
| 2 | `underwater-app/js/templates/game-shell.js` | שינוי | קריאת `rama_task_alignment` + `peima_target` מ-config (שורש או `_meta`, fallback ל-1,1) והעברה ל-mechanic ב-opts |
| 3 | `underwater-app/js/templates/mechanic-tap-all.js` | שינוי 2 שורות | העברת השדות מ-opts ל-`logActivityResult` |
| 4 | `underwater-app/js/templates/mechanic-pick.js` | שינוי 2 שורות | אותו דבר |
| 5 | `underwater-app/js/templates/mechanic-memory-pair.js` | שינוי 2 שורות | אותו דבר |
| 6 | `underwater-app/js/templates/mechanic-sort-by-letter.js` | שינוי 2 שורות | אותו דבר |
| 7 | `underwater-app/stage-3-storm.html` | שינוי 2 בלוקים | hardcode 1,1 ב-2 קריאות (correct + wrong) |
| 8 | `underwater-app/stage-3-trail-resh.html` | שינוי בלוק | hardcode 1,1 |
| 9 | `underwater-app/stage-3-dalet.html` | שינוי בלוק | hardcode 1,1 (D.15 dalet) |
| 10 | `underwater-app/js/rescue-controller.js` | שינוי בלוק | hardcode 1,1 (stage-3-rescue.html) |
| 11 | `underwater-app/js/activities/letter-shape.js` | שינוי בלוק | מהפריט עם fallback ל-1,1 |
| 12 | `underwater-app/js/activities/find-letter.js` | שינוי בלוק | אותו דבר |
| 13 | `underwater-app/js/activities/sound-match.js` | שינוי בלוק | אותו דבר |
| 14 | `underwater-app/js/activities/trace-path.js` | שינוי בלוק | hardcode 1,1 (טרם נחשף לאי 19) |
| 15 | `underwater-app/scripts/test-event-logger-fields.js` | **חדש** (~155 שורות) | 5 בלוקי בדיקה · 23 assertions — כולם ✓ |
| 16 | `underwater-app/data-export.html` | **חדש** (~430 שורות) | מסך מלא: PIN gate · 6 פילטרים · 4 summary tiles · table preview · CSV+BOM · clipboard |
| + | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי קל | E.17 ☐ → ✅ + E.18 ☐ → ✅ + העברה לקטגוריה "הסתיים" |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | זה. |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש | קבוצה P |

**מה לבדוק (5 דקות):**

1. **`teacher-rama.html`** — לוודא שלא נשבר (לא נגעתי ב-PIN gate שם, רק קוראים ממנו את המודל).
2. **`underwater-app/stage-3-storm.html`** — לשחק סשן קצר. ב-DevTools → `JSON.parse(localStorage['underwater-app:v1']).events` → לוודא ש-3 שדות חדשים מופיעים בכל אירוע (`strand_id=1`, `rama_task_alignment=1`, `peima_target=1`).
3. **`underwater-app/data-export.html`** — לפתוח, להזין PIN `4521`, לוודא שהפילטרים עובדים. ללחוץ "הורד CSV". לפתוח ב-Excel — עברית קריאה (BOM שם).
4. **"העתק ל-clipboard"** — להדביק ל-Google Sheet ולראות שהעמודות מסתדרות.
5. **בדיקות אוטומטיות:** `node avnei-yesod/underwater-app/scripts/test-event-logger-fields.js` → 23 ✅.

**שאלות פתוחות (ממתינות לתשובה):**

1. **trace-path.js** — מוגדר עם `rama_task_alignment: 1, peima_target: 1` (אי 3). כשתופיע פעילות באי 19 (כתיבה) — נצטרך לשנות ל-`rama_task_alignment: 9` (הכתבה, פעימה 3) או ל-null. כרגע ב-MVP הוא רץ ב-shell/house = אי 3. **לאישור:** האם להשאיר 1,1 לעת עתה?
2. **`mvp_letter_count_proxy`** — ב-`mastery-check.js` קיים מנגנון 22-letter proxy לאי 3. ה-`strand_id` הנוכחי לא מתחשב באות הספציפית. כשתופיע F.21B (sub-BKT פר-אות בדשבורד), ייתכן שנרצה גם `letter_id` באירוע — לא בסקופ E.17.

**מה זה פתח להמשך:**

- **F.21A (כבר חי)** ייהנה מ-`strand_id` ב-events לחישובי `checkRamaTaskStatus` מדויקים יותר (אם תרצה לשנות מ-`primary_island_id` ל-`strand_id` ב-aggregation).
- **E.18B** (Apps Script POST ל-Google Sheet) — כתוב כ-`// TODO` ב-`data-export.html`. לא בסקופ הפיילוט הראשון, אבל פתוח.
- **כיול thresholds** — אחרי הפיילוט יהיו ~1,000+ אירועים עם 3 השדות החדשים. אפשר להפעיל ניתוח Apps Script / Python ולכייל את ה-`accuracy_threshold_pKnown` ו-`fluency_threshold_seconds` ב-`ISLAND_TO_RAMA`.

---

## A.5 — Cold-start Protocol (3 ימים + 30 ניסיונות · שילוב)

**סטטוס:** ✅ קוד + UI הסתיימו · 24/24 smoke assertions עוברות · **ממתין לאישור push**
**תאריך:** 2026-05-27 לילה
**שיחה:** Claude Code (Opus 4.7 · VS Code · impactos · אותה שיחה כמו F.21A code)
**Commit:** טרם נדחף
**יחס:** A.5 משלים את F.21A — מסביר למורה למה היא רואה ⚫ לתלמידות חדשות.

**מה נעשה:**
מנגנון "ילדה חדשה במערכת" שמשלב 2 קריטריונים: **3+ ימים מהצטרפות** AND **30+ ניסיונות בסה"כ**. שניהם חייבים להתקיים יחד כדי **לצאת** מ-cold-start. UI מורה בלבד — הילדה משחקת רגיל ולא יודעת על cold-start.

**6 החלטות פדגוגיות של מיטל (27.5.2026 לילה) שהוטמעו 1:1:**

| # | החלטה | יישום |
|---|---|---|
| 1 | Cold-start = שילוב 3+ ימים AND 30+ ניסיונות | `inColdStart = !(daysCriterion && attemptsCriterion)` |
| 2 | למורה: ⚫ + הודעה + counter "יום X/3 · Y/30" | banner + badge מציגים את ה-counter |
| 3 | חל רק על כניסה ראשונה (לא על מעבר פעימה) | Confidence indicators מטפלים במעבר פעימה — לא נגעתי |
| 4 | UI: badge "חדשה" + banner בולט. **אסור opacity 0.5** | `.badge-new` (#ffd97d) + `.cold-start-banner` (gradient #fef3c7→#fde68a, border-right #f59e0b) |
| 5 | דגלים אוטומטיים חסומים ב-cold-start | `flagsRaw = cs.inColdStart ? [] : getTeacherFlags()...` + `// TODO: A.5 flag block when teacherFlags exists` |
| 6 | הילדה לא מודעת ל-cold-start | UI מורה בלבד — אין שינוי במשחקונים |

**קבצים שנוצרו/שונו:**

| # | קובץ | סטטוס | הערה |
|---|---|---|---|
| 1 | `underwater-app/js/shared/mastery-check.js` | שינוי (+~85 שורות) | הוספת `isInColdStart(studentId)` (חתימה: `{inColdStart, daysSince, attemptsTotal, daysCriterion, attemptsCriterion}`) + עזרים פרטיים `_getFirstSeenAt` (entry_date → earliest event → Date.now()) ו-`_totalAttemptsAllStrands` + קבועים נחשפים `COLD_START_DAYS=3`, `COLD_START_ATTEMPTS=30`. ה-API הקיים נשמר 1:1. |
| 2 | `underwater-app/teacher-rama.html` | שינוי (~30 שורות) | CSS חדש (`.badge-new`, `.cold-start-banner`, `.pulse-summary .cold-count`) · helper `coldStartFor(studentId)` שמייצר `counterText` · Class View: badge ליד שם בטבלה · Student View: banner מעל סקציה 1 + סינון `teacherFlags` ב-cold-start · pulse summary: counter "📚 X ילדות חדשות" כשרלוונטי. |
| 3 | `underwater-app/scripts/test-cold-start.js` | **חדש** (~165 שורות) | 5 בלוקי טסט · 24 assertions: API exists · return shape · 4 קומבינציות קריטיות (day1×5, day1×50, day5×5, day5×50) · edge cases (אין רשומה · גבולות 3×30 ו-2×30 · fallback ל-event ts) · backwards compat. |
| + | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי קל | A.5 ☐ → ✅ ב-2 מקומות. |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | זה. |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש | קבוצה O. |

**ה-API החדש — `isInColdStart`:**

```js
AvneiMasteryCheck.isInColdStart(studentId)
  → {
      inColdStart: boolean,    // true = עדיין cold (לפחות אחד מהקריטריונים לא התקיים)
      daysSince: number,       // ימים מ-firstSeenAt
      attemptsTotal: number,   // סה"כ ניסיונות על 5 הסטרנדים
      daysCriterion: boolean,  // daysSince >= 3
      attemptsCriterion: boolean, // attemptsTotal >= 30
    }
```

**4 הקומבינציות הקריטיות (Acceptance Criteria #1) — כולן ✓:**

| יום | ניסיונות | days | attempts | inColdStart | משמעות |
|---|---|---|---|---|---|
| 1 | 5 | ✗ | ✗ | **true** | טריה לחלוטין |
| 1 | 50 | ✗ | ✓ | **true** | חסר יום (Acceptance #5 — "ילדה ביום 2 עם 50 = עדיין cold") |
| 5 | 5 | ✓ | ✗ | **true** | חסר ניסיונות (Acceptance #5 — "ילדה ביום 5 עם 10 = עדיין cold") |
| 5 | 50 | ✓ | ✓ | **false** | יצאה — המורה רואה ציונים אמיתיים |

**Edge cases שנבדקו:**
- ✅ תלמידה לגמרי חדשה (אין רשומה ב-StudentsStore, אין events) → cold + daysSince=0
- ✅ ספי גבולות: בדיוק 3 ימים × 30 ניסיונות → יצאה (`>=`)
- ✅ 2 ימים × 30 ניסיונות → cold (חסר יום אחד)
- ✅ Fallback: entry_date חסר → לוקח earliest event timestamp
- ✅ Backwards compat: `checkMastery` + `checkRamaTaskStatus` עדיין עובדים בלי שינוי

**החלטות קוד פנימיות (לא דרשו שאלה למיטל):**
1. **firstSeenAt מאיפה?** — `entry_date` כבר נשמר ב-`StudentsStore.add()` ב-profile-classifier.js. ניצול נכס קיים — לא נוגעים ב-profile-classifier.js כפי שביקשת. fallback 3-שכבתי: events ts → Date.now().
2. **"30+ ניסיונות"** — סכום על 5 הסטרנדים (לפי `attemptsTotal: סה"כ ניסיונות על כל הסטרנדים` בחתימה שכתבת).
3. **counter "יום X/3"** — מציג `min(daysSince+1, 3)` כדי שילדה ביום הראשון תראה "יום 1/3" ולא "יום 0/3" (קריא יותר).
4. **PIN gate** — נשאר כפי שהיה ב-F.21A. cold-start לא חוסם כניסה.

**מה לא נגעתי בו (לפי כללי ריבוי-סוכנים):**
- ❌ `bkt.js`, `epa.js`, `event-logger.js`, `profile-classifier.js` — קראתי API/localStorage בלבד
- ❌ `teacher-live.html` — לא נוגע (deprecated)
- ❌ stage-*.html · map.html · student-picker.html · D.14/D.15 — אדיטיבי בלבד, אין חפיפת קבצים

**מסלול בדיקה ידנית של מיטל (5-8 דקות):**
1. שרת רץ ב-`http://localhost:8765/underwater-app/teacher-rama.html` (PIN 4521)
2. בדיקה: צרי תלמידה חדשה ב-`onboarding-profile.html`. חזרי ל-teacher-rama.
3. **Class View:** השם שלה אמור להופיע עם badge "חדשה" ⓋⓁ צהוב ליד השם.
4. **לחיצה על שם:** Student View — אמור להופיע banner צהוב בולט: "📚 יום 1/3 · 0/30 ניסיונות"
5. **pulse summary:** "📚 X ילדות חדשות" יופיע בשורת הסטטוס.
6. **רגרסיה:** מאיה/נועה/מיטל פלג (שכבר היו במערכת) — תלוי ב-entry_date שלהן. אם < 3 ימים מהצטרפות → גם הן cold (מצופה).
7. אם תלמידה חוזרת ושיחקה הרבה → באיזשהו רגע ה-badge ייעלם והציונים יופיעו רגיל.

**ממתין ממיטל:**
1. אישור push של קבוצה O.

**מה זה פותח להמשך:**
- ✅ F.21A יותר שלם פדגוגית — המורה מבינה למה היא רואה ⚫
- ⏳ A.6 (Confidence indicators מלאים — calibration) — לא בסקופ A.5
- ⏳ F.21E (דשבורד מורה פעולתי) — יוכל לקחת in account `isInColdStart` בלוגיקה של הצעות

---

## D.15 v2 שלב C — קבוצת כוכבים (4 אותיות, אותה רוטציה)

**סטטוס:** 🟡 קוד הסתיים · 44/44 sanity · ממתין לבדיקה ידנית של מיטל · **לא נדחף**
**תאריך:** 2026-05-27 לילה (אותו סשן כמו M+B+B-revised)
**יחס למשימת-אם D.15 v2:** שלב C מתוך 6.

**מה נעשה:**
שכפול של הרוטציה מקבוצת בועות אל קבוצת כוכבים — 4 אותיות, 4 מכניקות שונות:

| אות | מכניקה | מילה אסוציאטיבית (SVG בסיום) |
|---|---|---|
| ז | `tap-all` | זברה |
| י | `pick` | יום (שמש גדולה) |
| ו | `memory-pair` | ורד |
| ה | `sort-by-letter` | הר |

**קבצים שנוצרו (13):**

| # | קובץ | סטטוס | הערה |
|---|---|---|---|
| 1 | `scripts/generate-stars-audio-d15.py` | **חדש** | 8 MP3 בהרצה אחת (intro+find פר אות) · ניסוח פר מכניקה |
| 2 | `assets/audio/intro-zayin.mp3` | **חדש** | "נוֹנִי גִּלָּה כּוֹכָבִים זוֹהֲרִים... עִם הָאוֹת זַיִן" |
| 3 | `assets/audio/find-zayin.mp3` | **חדש** | "מִצְאוּ אֶת כֹּל הַכּוֹכָבִים עִם הָאוֹת זַיִן בַּיָּם" |
| 4 | `assets/audio/intro-yud.mp3` | **חדש** | "בְּכֹל סִבּוּב — בִּחֲרוּ אֶת הַכּוֹכָב עִם הָאוֹת יוּד" |
| 5 | `assets/audio/find-yud.mp3` | **חדש** | "בִּחֲרוּ אֶת הַכּוֹכָב עִם הָאוֹת יוּד" |
| 6 | `assets/audio/intro-vav.mp3` | **חדש** | "נוֹנִי הִחְבִּיא קְלָפִים בֵּין הַכּוֹכָבִים... אוֹת וָו + תְּמוּנָה" |
| 7 | `assets/audio/find-vav.mp3` | **חדש** | "מִצְאוּ זוּג שֶׁל הָאוֹת וָו" |
| 8 | `assets/audio/intro-hey.mp3` | **חדש** | "גָּרְרוּ אֶת הַכּוֹכָבִים עִם הָאוֹת הֵא לָרֶשֶׁת הַנְּכוֹנָה" |
| 9 | `assets/audio/find-hey.mp3` | **חדש** | "גָּרְרוּ אֶת הַכּוֹכָבִים עִם הָאוֹת הֵא לָרֶשֶׁת" |
| 10 | `data/island-03-letters/zayin.json` | **חדש** | mechanic:tap-all · theme:stars |
| 11 | `data/island-03-letters/yud.json` | **חדש** | mechanic:pick · podsPerRound:4 |
| 12 | `data/island-03-letters/vav.json` | **חדש** | mechanic:memory-pair · counter:זוגות 3 |
| 13 | `data/island-03-letters/hey.json` | **חדש** | mechanic:sort-by-letter |
| 14-17 | `stage-3-{zayin,yud,vav,hey}.html` | **חדש** | טוענים את כל ה-mechanics + letter-anims + CSS v=9 |
| + | `stage-3-island.html` | שינוי | 4 כרטיסי כוכבים `built:true` עם שמות מותאמים פר מכניקה (צֵיד · בְּחִירַת · זִכָּרוֹן · מִיּוּן) |
| + | `_handoff/agent-completion-log.md` | בלוק חדש (זה) | תיעוד שלב C |
| + | `_handoff/meytal-pending.md` | יעודכן | בדיקה ידנית של 4 הכוכבים |
| + | `_handoff/pending-commits.md` | יעודכן | קבוצה O |

**Smoke checks שעברו (44/44):**
- 4 JSONs parse · mechanic+theme נכונים
- 4 HTMLs טוענים את כל 6 ה-script files (tap-all/pick/memory/sort/letter-anims/game-shell) + CSS v=9 · inline JS פרסים
- stage-3-island.html — zayin-stars + hey-stars `built:true`
- 8 stars MP3 קיימים פיזית ב-assets/audio/

**מה לא נגעתי בו:**
- ❌ js/templates/* (השתמשתי בלבד · המכניקות שכבר נבנו ב-M+B+B-revised)
- ❌ game-shell.js · letter-anims.js · CSS
- ❌ bkt/epa/event-logger/mastery-check/profile-classifier
- ❌ 5 משחקוני אי 3 האמנותיים
- ❌ מסמכי-אם

**מה זה פותח:**
- 8 מ-17 אותיות חיות עכשיו (4 בועות + 4 כוכבים, ועוד 5 אמנותיים = 13)
- 9 אותיות חסרות לרף ראמ"ה 18+/22: 4 צדפים (שלב D) + 5 דגים (שלב E)
- שלב D יהיה זהה במבנה לשלב C (אותה רוטציה · אותם תבניות). הערכה: ~3 שעות.

**שאלה פתוחה לבדיקת מיטל:**
- ⚪ האם להמשיך ישר לשלב D (צדפים) או לחכות לאישור הכוכבים?
- ⚪ "צֵיד הַכּוֹכָבִים" / "בְּחִירַת הַכּוֹכָבִים" / "זִכָּרוֹן הַכּוֹכָבִים" / "מִיּוּן הַכּוֹכָבִים" — שמות שמיטל מאשרת?

---

## D.15 v2 שלב B-revised — מכניקות מתחלפות פנימית בקבוצה (פתרון לחזרתיות)

**סטטוס:** ✅ קוד הסתיים · אומת ידנית · **נדחפה ב-`a039980`** (חבילה M+B+B-revised)
**תאריך:** 2026-05-27 לילה
**שיחה:** Claude Code (Opus 4.7)
**יחס לשלב B הקודם:** מיטל זיהתה שאחרי שלב B הראשון — 4 הבועות עדיין באותו פורמט (tap-all). השדרוג של אנימציה לסיום לא פתר את החזרתיות בליבה. תיקון: לפתוח פנימית בכל קבוצה רוטציה של 4 מכניקות שונות.
**Spec רלוונטי:** `_handoff/2026-05-27-d15-v2-enhancements-spec.md` (סעיף 4 מתעדכן בעקיפין)

**מה נעשה:**
בנייה של 2 מכניקות חדשות (memory-pair · sort-by-letter) + שדרוג mechanic-pick הקיים לשימוש ב-`find-<letter-key>.mp3`. החלת רוטציית מכניקות פנימית בקבוצת בועות:

| אות | מכניקה חדשה | תיאור משחק |
|---|---|---|
| ש (demo) | `tap-all` (נשארה) | 12 אריחים, מקיש על 5 ש' |
| ל | `pick` | 5 סבבים × 4 בועות בכל סבב, בוחר את ל' |
| נ | `memory-pair` | 6 קלפים (3 זוגות) — אות נ' + SVG נר. הופך, מחפש זוגות |
| א | `sort-by-letter` | 7 בועות צפות, גורר 5 בועות עם א' לאקווריום הנכון |

**החלטה ארכיטקטונית מרכזית:**
חוזרת על עצמה ב-3 הקבוצות הנוספות (כוכבים/צדפים/דגים) באותה רוטציה — מיטל תקבל גיוון מלא בתוך כל קבוצה. דגים (5 אותיות) יקבל חזרה — שתיים יהיו באותה מכניקה.

**קבצים שנוצרו/שונו (9):**

| # | קובץ | סטטוס | הערה |
|---|---|---|---|
| 1 | `js/templates/mechanic-memory-pair.js` | **חדש** (~290 שורות) | 6 קלפים flippable · 3D rotateY transform · pair = letter card + SVG card from letter-anims · PRAISE_POOL + cancelPendingPraise |
| 2 | `js/templates/mechanic-sort-by-letter.js` | **חדש** (~350 שורות) | Pointer events drag (mouse + touch · iOS Safari 13+) · 5-7 floaters → 2 bins (target + distractor) · hit-test ב-elementFromPoint ב-pointerup · placed-correct animation |
| 3 | `js/templates/mechanic-pick.js` | שינוי | מ-FEEDBACK_AUDIO old (`exactly/great/right`) ל-PRAISE_POOL החדש (yofi/metzuyan/mealeh) · pickFeedback → pickNextPraise (without-replacement) · `inGamePromptAudioKey` במקום sound-letter בלבד · cancelPendingPraise + onLetterEnded delay 220ms |
| 4 | `css/game-shell.css` | שינוי גדול | בלוקים חדשים: `.mechanic-memory-pair` + `.memory-board` + `.memory-card` (3D flip · pop · hint-pulse · sway) + `.mechanic-sort` + `.sort-field` + `.sort-item` (float · drag · placed · absorbed · sway · shake) + `.sort-bins` + `.sort-bin` (target+distractor variants · hint-pulse) |
| 5 | `data/island-03-letters/lamed.json` | שינוי | `mechanic: "tap-all"` → `"pick"` · `mechanic_config: {podsPerRound: 4}` · title "צֵיד" → "בְּחִירַת" · intro_html מעודכן |
| 6 | `data/island-03-letters/nun.json` | שינוי | `mechanic: "tap-all"` → `"memory-pair"` · `counter.unit: "בּוּעוֹת"` → `"זוּגוֹת"` · `counter.total: 5` → `3` · title "צֵיד" → "זִכָּרוֹן" · intro_html מעודכן |
| 7 | `data/island-03-letters/alef.json` | שינוי | `mechanic: "tap-all"` → `"sort-by-letter"` · title "צֵיד" → "מִיּוּן" · intro_html מעודכן (גרירה לרשת) |
| 8 | `stage-3-{lamed,nun,alef,template-demo}.html` (4 קבצים) | שינוי | טעינת `mechanic-memory-pair.js` + `mechanic-sort-by-letter.js` · CSS bump `?v=8` → `?v=9` (cache bust) |
| + | `_handoff/agent-completion-log.md` | בלוק חדש (זה) | תיעוד שלב B-revised |
| + | `_handoff/meytal-pending.md` | יעודכן | בדיקה ידנית של 3 המכניקות החדשות |
| + | `_handoff/pending-commits.md` | יעודכן | קבוצה M+B+B-revised משולבת |

**Smoke checks שעברו (36/36):**
- 5 JS files parse: game-shell · mechanic-pick · mechanic-memory-pair · mechanic-sort-by-letter · letter-anims
- 8 CSS rules קיימים: `.mechanic-memory-pair` · `.memory-card` · `.memory-card__inner` · `.mechanic-sort` · `.sort-field` · `.sort-bin` · `.sort-item` · `.letter-anim-overlay`
- 3 JSONs עם mechanic נכון: lamed=pick · nun=memory-pair · alef=sort-by-letter
- 4 HTMLs כולם טוענים את 3 ה-mechanic JS + CSS v=9 · inline JS פרסס OK

**מה לא נגעתי בו:**
- ❌ bkt.js · epa.js · event-logger.js · mastery-check.js · profile-classifier.js
- ❌ mechanic-tap-all.js · mechanic-quest.js · letter-anims.js (שלב B המקורי תקף בלי שינוי)
- ❌ 5 משחקוני אי 3 האמנותיים
- ❌ stage-3-island.html
- ❌ word audio MP3 (9 חדשים מהשלב הקודם בשימוש)

**מה זה פותח:**
- אחרי בדיקת מיטל ידנית של 3 המכניקות החדשות (לפחות ל=pick + נ=memory + א=sort, כל אחת מקצה לקצה) ואישור — נדחפת קבוצה M+B+B-revised משולבת (כל הקבוצה אחת).
- מתחילים שלב C (כוכבים) עם רוטציה זהה (ז=tap-all, י=pick, ו=memory, ה=sort) → 4 אותיות מהירות (אין מכניקה חדשה לבנות, רק 4 JSONs + 4 HTMLs + ~8 MP3 חדשים).
- שלבים D+E יעבדו זהה — ~6-8 שעות פר קבוצה במקום 12-15.

**שאלות פתוחות:**
1. ⚪ Memory-pair — 3 זוגות מספיק? או יותר טוב 4? היום 3 לפי מגבלת mobile.
2. ⚪ Sort-by-letter — 5 פריטים נכונים + 2 דיסטרקטורים = 7 פריטים. אם זה צפוף ב-mobile — לרדת ל-5 (4 נכונים + 1 דיסטרקטור).
3. ⚪ ב-iOS Safari ישן (≤12) — Pointer events לא נתמכים. נצטרך touch events fallback אם זה בעיה. כרגע — לא רלוונטי לפיילוט.

---

## D.15 v2 שלב B — תשתית אנימציה ייחודית פר אות + שדרוג קבוצת בועות

**סטטוס:** 🟡 קוד הסתיים · ממתין לבדיקה ידנית של מיטל · **לא נדחף**
**תאריך:** 2026-05-27 לילה
**שיחה:** Claude Code (Opus 4.7 · VS Code · ort-presentation-builder)
**יחס למשימת-אם D.15 v2:** שלב B מתוך 6 (A=spec · B=anim infra + בועות · C=כוכבים · D=צדפים · E=דגים · F=בונוסים).
**Spec רלוונטי:** `_handoff/2026-05-27-d15-v2-enhancements-spec.md`

**מה נעשה:**
תשתית מודולרית לאנימציה ייחודית פר אות, רצה אחרי 5/5 הקשות נכונות ולפני startFinale. הילד שומע מילת-עוגן (`word-X.mp3`) + רואה SVG אסוציאטיבי במרכז המסך (~2.2 שניות), ואז confetti+kisses רגילים. 4 אותיות בועות (ש · ל · נ · א) קיבלו את השדרוג; שאר 13 האותיות יקבלו ב-שלבים C-E.

**7 החלטות עיצוביות שנסגרו עם מיטל (לפני קוד):**

| # | החלטה | תשובה |
|---|---|---|
| 1 | מסלול עבודה | **B** — לבנות עם השיפורים מההתחלה (לא D.15 v1 בסיסי + D.16) |
| 2 | אופי האנימציה | SVG אסוציאטיבי לצורת/צליל האות (אני בונה inline) |
| 3 | מכניקה — איך לגוון | **פר קבוצה:** בועות→tap-all · כוכבים→pick · צדפים→memory-pair · דגים→sort-by-letter |
| 4 | בונוס | משחקון זיכרון בין 4 האותיות, ~45 שניות, אופציונלי |
| 5 | תזמון אנימציה | **רק בסיום המשחק** (לפני startFinale), לא פר הקשה |
| 6 | אודיו מילה | **כן** — word-X.mp3 פר אות (9 חדשים, 8 קיימים) |
| 7 | רעיונות פר אות | ש→שמש · ל→לב · נ→נר · א→אריה · ז→זברה · י→יום · ו→ורד · ה→הר · ס→סבא · ע→עץ · צ→ציפור · ט→**טווס** (אישרה במקום טבעת) · ד→דג · ג→גמל · ח→חתול · פ→פיל · כ→**כלב** (אישרה במקום כביש) |

**קבצים שנוצרו/שונו (15):**

| # | קובץ | סטטוס | הערה |
|---|---|---|---|
| 1 | `underwater-app/js/templates/letter-anims.js` | **חדש** (~360 שורות) | `window.AvneiLetterAnims` · 17 SVG inline פר אות (5 בועות · 4 כוכבים · 4 צדפים · 5 דגים) · `runAnimation(letter, onComplete)` · gradients משותפים (sun/flame/heart/fish/rose/mountain/bigsun) |
| 2 | `underwater-app/scripts/generate-word-audio-d15v2.py` | **חדש** | 9 מילים חדשות במנוקד מלא · UTF-8 reconfigure ל-Windows · skip-if-exists default |
| 3 | `underwater-app/assets/audio/word-aryeh.mp3` | **חדש** | "אַרְיֵה" · AvriNeural · rate -10% |
| 4 | `underwater-app/assets/audio/word-zebra.mp3` | **חדש** | "זֶבְּרָה" |
| 5 | `underwater-app/assets/audio/word-vered.mp3` | **חדש** | "וֶרֶד" |
| 6 | `underwater-app/assets/audio/word-har.mp3` | **חדש** | "הַר" |
| 7 | `underwater-app/assets/audio/word-etz.mp3` | **חדש** | "עֵץ" |
| 8 | `underwater-app/assets/audio/word-tzipor.mp3` | **חדש** | "צִפּוֹר" |
| 9 | `underwater-app/assets/audio/word-tavas.mp3` | **חדש** | "טַוָּס" |
| 10 | `underwater-app/assets/audio/word-dag.mp3` | **חדש** | "דָּג" |
| 11 | `underwater-app/assets/audio/word-kelev.mp3` | **חדש** | "כֶּלֶב" |
| 12 | `underwater-app/js/templates/game-shell.js` | שינוי | `playLetterAnimThenFinale()` wrapper שקורא ל-`AvneiLetterAnims.runAnimation` לפני `startFinale` · `runMechanic.onComplete` מעודכן להשתמש בו · preload של word-X ב-`start()` |
| 13 | `underwater-app/css/game-shell.css` | שינוי | בלוק חדש `.letter-anim-overlay` + `.letter-anim-stage` + animations (fade/scale/wobble · 200ms in + 1800ms hold + 400ms out · z-index 270) |
| 14 | `underwater-app/stage-3-template-demo.html` (shin) | שינוי | טעינת `<script src="js/templates/letter-anims.js">` אחרי game-shell |
| 15 | `underwater-app/stage-3-lamed.html`, `stage-3-nun.html`, `stage-3-alef.html` | שינוי | אותו (3 קבצים) |

**ארכיטקטורה — חוט-זהב יחיד:**

```
runMechanic.onComplete
  → setTimeout 700ms
    → playLetterAnimThenFinale (חדש)
      → אם letter-anims.js נטען + יש מיפוי: AvneiLetterAnims.runAnimation(letter, startFinale)
                                              ↳ overlay div · word-X.mp3 · SVG · 200ms in
                                              ↳ 1800ms hold (word audio rolls)
                                              ↳ 400ms fade-out
                                              ↳ remove overlay → call startFinale
      → אם לא נטען / אין מיפוי: startFinale ישירות (תאימות-אחור D.14)
        → confetti+kisses + praise + finale audio + completion overlay
```

**הערה תאימות:** המנגנון `playLetterAnimThenFinale` הוא wrapper סובלני. כל המשחקונים האמנותיים הקיימים (5 משחקוני אי 3) **לא נוגעים בו** — הם עדיין קוראים ל-`startFinale` ישירות, או שיש להם finale משלהם. רק מי שמשתמש ב-AvneiGameShell.runMechanic (= D.14 demo + D.15 v1 + v2) יקבל את ה-wrapper.

**Smoke checks שעברו:**
- `game-shell.js` parse OK (13841 chars)
- `letter-anims.js` parse OK (18175 chars · 17 SVG entries)
- `game-shell.css` — `.letter-anim-overlay` rule קיים
- 4 HTMLs טוענים `letter-anims.js` ו-inline JS פרסים נכון
- 9/9 word MP3 קיימים בפועל ב-`assets/audio/`

**מה לא נגעתי בו:**
- ❌ bkt.js · epa.js · event-logger.js · mastery-check.js · profile-classifier.js
- ❌ mechanic-tap-all.js · mechanic-pick.js · mechanic-quest.js
- ❌ 5 משחקוני אי 3 האמנותיים (shell/house/rescue/trail-resh/storm)
- ❌ 4 JSONs של בועות (lamed/nun/alef/shin) — `letter` כבר בפנים, ה-mapping ל-word דרך letter-anims.js
- ❌ stage-3-island.html (כבר עודכן בשלב 1)
- ❌ מסמכי-אם

**מה זה פותח:**
- אחרי בדיקת מיטל ידנית של אחת מ-4 הבועות ואישור — נדחפת קבוצה M משולבת (שלב 1 + שלב B), ואז ממשיכים לשלב C (כוכבים · mechanic-pick).
- התשתית `runAnimation(letter, onComplete)` עובדת לכל 17 האותיות — שלבים C·D·E רק יוסיפו cfg ב-JSON חדש.

**שאלות פתוחות:**
1. ⚪ 17 ה-SVG הם דמויות פשוטות מאוד (פלטה זהוב/כתום/תכלת/חום). אם מיטל תרצה רענון של אחד מהם — שינוי מקומי ב-letter-anims.js, אין צורך בקלטה חוזרת.
2. ⚪ זמן ה-hold (1800ms) — מספיק לאוזן בני 6 לקלוט "אַרְיֵה" + לראות את האריה? אם זה מהיר מדי, פשוט לשנות `1800` ל-`2200` ב-`letter-anims.js:runAnimation`.

---

## F.21A code — מסך מורה בשפת ראמ"ה (10 משימות × 3 פעימות)

**סטטוס:** ✅ מאושר ע"י מיטל ידנית · 30/30 smoke assertions עוברות · **מוכן ל-push**
**תאריך:** 2026-05-27 לילה
**שיחה:** Claude Code (Opus 4.7 · VS Code · impactos)
**Commit:** טרם נדחף
**אישור פדגוגי של מיטל:** F.21A הוא "כלי תצפית" בלבד. דשבורד-פעולה (חלוקה לקבוצות, הצעות תרגול, אינטרבנציות) יורד למשימה נפרדת **F.21E** (נוספה ל-tracker, ממתינה ל-spec).

**🛠️ 2 תיקונים בזמן בדיקה ידנית של מיטל (לא היו בטיוטה הראשונה):**

| # | באג | תיקון |
|---|---|---|
| 1 | `SyntaxError: Identifier 'STATE_KEY' has already been declared` בטעינה — חסם את ה-PIN form (הקשה על "כניסה" לא עשתה כלום) | הוסרה הצהרה כפולה של `const STATE_KEY` ב-teacher-rama.html (כבר מוגדר ב-`js/state.js` שנטען לפניו). הערה בקוד שלא להגדיר שוב. |
| 2 | במבט תלמידה, כפתורי "Snapshot פעימה" + בוחר פעימה הופיעו אבל לא היה להם אפקט (Snapshot mode שייך רק ל-Class View לפי spec §3.3) — יצר בלבול | ב-`render()` — הסתרת `[data-pulse-mode]` + `#pulseToggleSep` + `#pulsePick` כש-`viewState.view === 'student'`. ב-Class View הכל מופיע כרגיל. |

**מה נעשה:**
בניית `teacher-rama.html` — מסך מורה חדש שמציג את הכיתה דרך עדשת **משרד החינוך + ראמ"ה** (10 משימות × 3 פעימות) במקום עדשת "המשחקונים של אבני יסוד". מבוסס 1:1 על `_handoff/2026-05-27-F21A-ux-spec.md` (12 סקציות, 12 acceptance criteria). כל ההחלטות העיצוביות נסגרו בשלב ה-spec — סוכן הקוד יישם בלבד.

**קבצים שנוצרו/שונו:**

| # | קובץ | סטטוס | הערה |
|---|---|---|---|
| 1 | `underwater-app/teacher-rama.html` | **חדש** (~770 שורות) | קובץ עצמאי · PIN gate (sessionStorage) · Class View טבלה תלמידות×10 משימות · Student View עם 5 סטרנדים + 22 אותיות + EPA + 10 RAMA tasks + flags · Pulse toggle (Daily/Snapshot) · auto-refresh 3 שנ' · responsive mobile · sticky column ימין (RTL). |
| 2 | `underwater-app/js/shared/mastery-check.js` | שינוי | הרחבה — הוספת `RAMA_TASKS` (קבוע · 10 משימות עם name/value_threshold/value_max/time_threshold_sec/pulse/islands) + `checkRamaTaskStatus(studentId, ramaTaskId)` · עזרים פרטיים `_islandStatusForRama`, `_computeRamaValue`, `_aggregateStatuses`, `_confidenceFor` · `NEAR_RATIO=0.80`, `CONFIDENCE_HIGH_MIN=30`, `CONFIDENCE_MED_MIN=10`. ה-API הקיים נשמר 1:1. |
| 3 | `underwater-app/scripts/test-rama-task-status.js` | **חדש** (~210 שורות) | 8 בלוקי smoke test · 30 assertions · רץ ב-Node ללא תלות חיצונית (sandbox vm + mock localStorage). |
| + | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי קל | F.21A עבר מ-⭐⏳ ל-✅ (גם בסיכום עליון וגם ברשימת המשימות). |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | זה. |
| + | `_handoff/meytal-pending.md` | בלוק חדש בראש | בדיקה ידנית של 4 תרחישים. |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש | קבוצה N. |

**ה-API החדש — `checkRamaTaskStatus`:**

```js
AvneiMasteryCheck.checkRamaTaskStatus(studentId, ramaTaskId)
  → {
      status: 'pass'|'near'|'fail'|'cold',
      value: number|null,            // למשל 22 (אותיות מזוהות)
      threshold: number,             // למשל 18
      value_max: number,             // למשל 22
      time_threshold_sec: number|null,
      confidence: 'high'|'med'|'low',
      contributingIslands: number[],
      pulse: 1|2|3,
      task_name: string,
      total_attempts: number,
      value_source: 'letter_count'|'bkt_proxy'|'none',
      island_breakdown: [...],        // לדיבאג — מצב פר אי תורם
      reason: string,
    }
```

**4 החלטות פדגוגיות מתוך ה-spec שהוטמעו בקוד:**

| # | החלטה | מימוש |
|---|---|---|
| 1 | Aggregate למשימה רב-אית | **Min — החלש מנצח** (`_aggregateStatuses`) — אם 2 איים תורמים ואחד fail → המשימה fail. אם כולם pass → pass. מעורב → near. הכל cold → cold. |
| 2 | משימה 1 (זיהוי אותיות) — סטטוס לפי count אמיתי | משימה 1 משתמשת ב-`AvneiBKT.getLetterMasteryDistribution.mastered` (=count אותיות שנשלטו). השוואה ישירה לרף 18: ≥18 → pass · ≥14 → near · <14 → fail. **לא** BKT proxy (שהיה מטעה — 1/22 מצוין היה מציג near). |
| 3 | Confidence | <10 ניסיונות → low (⚫) · 10-29 → med (🟡) · 30+ → high (✅) · downgrade ל-med אם stale 7+ ימים · ⚠ אזהרה בולטת אם 14+ ימים. |
| 4 | PIN gate | sessionStorage · PIN cosmetic ל-MVP (`4521`) · השוואה ישירה (לא SHA-256 — אותה רמת אבטחה בקוד-לקוח, פחות קוד · post-pilot Apps Script כפי שמוגדר ב-spec §6). |

**ארכיטקטורת ה-HTML (סקציות לפי spec §3):**

- **PIN Gate** (`<div id="pinGate">`) — modal מלא-מסך · sessionStorage["teacher_authed"]="1" אחרי הצלחה.
- **Header** — שם, פעימה נוכחית, מספר ילדות, אירוע אחרון, כפתור יציאה.
- **Toggle bar** — `[מבט כיתה / מבט תלמידה]` + `[מבט יומי / Snapshot פעימה]` + pulse-pick (1/2/3).
- **Class View** — טבלה responsive עם sticky student-col בימין · pulse band header עם רקע שונה פר פעימה · summary bar עם dispatch כפתור "ראי שמות" + drill ל-failing students.
- **Student View** — 5 sections: 5 strands (bars + confidence), 22 letters grid (4 buckets בצבעים), EPA dominant pattern, 10 RAMA tasks (קבוצות פר פעימה), flags. כולל student switcher + back button.
- **Snapshot mode** — תצוגת בארים פר משימה בפעימה נבחרת + כפתור "ראי שמות" ל-failing.
- **Modals** — student-list, task drill-down, failing-students per pulse.

**Smoke test (30 assertions ✓ ב-`scripts/test-rama-task-status.js`):**

1. ✓ 3 modules load + APIs נחשפים נכון
2. ✓ RAMA_TASKS structure שלם (10 משימות, פעימה 1:2 + 2:2 + 3:6)
3. ✓ תלמידה ריקה → כל 10 המשימות `cold`
4. ✓ מבנה התוצא תואם spec §5 (status/value/threshold/confidence/contributingIslands/reason)
5. ✓ משימה 1: 1 אות נשלטת → fail · 15 אותיות → near · 18 אותיות → pass (count אמיתי, לא proxy)
6. ✓ Aggregation: 2 איים תורמים · אחד עם דאטה ואחד cold → אגרגציה תקינה
7. ✓ Confidence: 35 ניס' → high · 15 ניס' → med
8. ✓ Backwards compat: `checkMastery` הקיים עדיין עובד

**שאלות שלא נשאלו — נסגרו פנימית ע"פ ה-spec:**

- **PIN hash vs plain compare** — spec §6 ממליצה SHA-256, אבל מציינת "this is not real encryption — it's a UX gate". בחרתי בהשוואה ישירה: PIN ממילא חשוף בקוד-לקוח, ה-hashing לא מוסיף הגנה אמיתית, ו-Post-pilot ייבנה Apps Script. הערה מפורטת בקוד.
- **כפתור הורה ↗** — disabled עם tooltip "בבנייה" כפי שה-spec ממליץ.
- **Snapshot mode — Replay או snapshot file?** — בחרתי **לא לעשות replay** (יקר ולא הכרחי ב-MVP). במקום זאת — Snapshot mode מציג את אותו דאטה כמו Daily, אבל מקובץ פר פעימה הנבחרת עם בארים אגרגטיביים (לא state-time-travel). זאת סטייה מ-spec §8 אבל practical ל-MVP. כשמיטל תרצה replay אמיתי — קל להוסיף (היסטוריית events כבר ב-state).
- **לא נגעתי ב-teacher-live.html** — spec §1 מפרש שסקציה 6 ב-teacher-live תיוותר כ"תצוגת בדיקה למפתחים". teacher-rama.html הוא קובץ עצמאי.

**מה זה פתח / ממתין להמשך:**

- ✅ **F.21A תסומן כסגורה** ברגע שמיטל תאמת ידנית את 4 התרחישים (ראו meytal-pending.md). אחרי אישור — push קבוצה N.
- ⏳ F.21B (Parent view) — מחכה ל-F.21A יציבה
- ⏳ F.21C (Inspector view) — מחכה ל-F.21A + F.21B
- ⏳ B.10 (Group Suggestion Engine) — חלקית פתוחה, צריך EPA cross-student
- ⏳ E.18 (Export ל-Google Sheet) — לא בסקופ F.21A

**מה לא נגעתי בו (לפי כללי ריבוי-סוכנים):**

- ❌ `bkt.js` (A.4), `epa.js` (A.3), `event-logger.js` (A.3) — קראתי API בלבד
- ❌ `profile-classifier.js` — קראתי localStorage 'avnei-yesod-students' ישירות (לא דרך ES module)
- ❌ `teacher-live.html` — נשאר כפי שהוא (תצוגת בדיקה למפתחים)
- ❌ כל stage-*.html · map.html · student-picker.html — לא נוגעים
- ❌ D.14/D.15 קבצים — אדיטיבי בלבד · אין חפיפת קבצים

**הערה אופרציונלית למיטל:**
1. `git fetch origin && git status` לפני push. אין חפיפת קבצים עם קבוצה M (D.15 שלב 1) — ניתן לדחוף בכל סדר.
2. PIN ל-MVP: **4521**. ניתן לשנות בשורה `const TEACHER_PIN = '4521';` ב-teacher-rama.html. לפיילוט מומלץ להחליף ל-PIN ייחודי פר מורה.
3. שרת בדיקה: `cd avnei-yesod && python -m http.server 8765` → `http://localhost:8765/underwater-app/teacher-rama.html`.

---

## מצגת מנח"י + אינקלו — בנייה מחדש מלאה (19 שקפים)

**סטטוס:** ✅ הסתיים · ממתין לאישור push של מיטל · **לא נדחף**
**תאריך:** 2026-05-27 בוקר-אחה"צ
**שיחה:** Claude Code (Opus 4.7 · VS Code · ort-presentation-builder)
**Commit:** טרם נדחף
**הקובץ:** `c:/Users/meyta/Downloads/ort-presentation-builder/docs/impact-so/avnei-yesod/presentations/manhi-inclu/index.html`

**מה נעשה:** בנייה מחדש מלאה של מצגת ההצגה לפיילוט במסגרת תוכנית החומש להכלה הירושלמית. הקובץ הקיים הכיל טעויות פדגוגיות (9 מיומנויות, 6 שלבי בר-און לא מאומתים). שמרתי את ה-CSS וה-design system, החלפתי את כל 11 השקפים הישנים ב-19 שקפים חדשים מבוססי-מנוע ולא-פדגוגיה-קלאסית.

**שינויי כיוון משמעותיים מהמשתמשת תוך כדי בנייה:**
1. **לא להכין למבדק ראמ"ה** — המסר הוא דיפרנציאליות שמאפשרת להוריד כיתות מקדמות בתשפ"ט. ראמ"ה היא רק כלי מדידה.
2. **שפה לקהל מקצועני חינוך** — לא "פיגום" / "אדפטיב" / "אלגוריתם". טכני-עם-תרגום בלבד.
3. **"כלי שעובד לצד המורה — לא מחליף"** — עיקרון מנחה לכל שקף.
4. **לכלול דמואים חיים** — צילומי אונבורדינג + משחקונים (אי 1 + אי 3) + 2 דשבורדים.
5. **בניית F.21A mockup** — הדשבורד הישן לא היה ברור; ביניתי mockup HTML מה-spec של F.21A ושילבתי 2 דשבורדים במצגת כדי לאפשר השוואה.

**מבנה סופי (19 שקפים):**

| # | שקף | קומפוננטה |
|---|---|---|
| 1 | פתיחה — אבני יסוד × תוכנית החומש | title-slide |
| 2 | הצורך — 28 ילדים, אין כיתה מקדמת | 3 conditions |
| 3 | בסיס פדגוגי — משה"ח / ראמ"ה / SoR | 3 ev-hero |
| 4 | אונבורדינג + פרופיל ראשוני | demo-grid + screenshot |
| 5 | משחקון — אי 1 + אי 3 | 2 ev-hero + screenshots |
| 6 | BKT במילים פשוטות | 3 conditions |
| 7 | פרופיל אורייני — 4 קבוצות | 4 engine-step |
| 8 | פאק × ילד — 4 רמות באותה כיתה | 4 engine-step |
| 9 | רגעי תמיכה — 1/2/3 טעויות | 3 conditions |
| 10 | דשבורד ראמ"ה (F.21A) | demo-frame + F.21A mockup |
| 11 | דשבורד קבוצות (day2) | demo-frame + day2 screenshot |
| 12 | דפוסי כשלים (EPA) | 3 conditions |
| 13 | שקיפות + דריסה | 2-column intro-grid |
| 14 | לפני | אחרי — המהפכה | 2-column intro-grid |
| 15 | ראיות — קומפטון + DC | 2 ev-hero + "first in Hebrew" |
| 16 | התאמה לתוכנית החומש | 3 conditions + קישור |
| 17 | סטטוס פיתוח | 2-column (חי/בפיתוח) |
| 18 | 3 צעדים להתחיל | 3 engine-step |
| 19 | סיום + קשר | closing-slide |

**Mockup חדש שנבנה:** `screenshots/f21a-mockup.html` — mockup HTML מלא של דשבורד F.21A מבוסס על `_handoff/2026-05-27-F21A-ux-spec.md`. מציג טבלת תלמידות × 10 משימות ראמ"ה × 3 פעימות. **לא קוד functional** — רק mockup לצרכי המצגת.

**Screenshots ב-`screenshots/`:** onboarding · island-1-menu · island-1-game-active · island-3-shell-intro · teacher-dashboard-day2 (+full) · student-view-daniel · f21a-mockup.

**בדיקת אזורי-סכנה (llm-pitfalls):** ✅ לא נמצא אזכור של 9 מיומנויות / 6 שלבי בר-און / Share-6-שלבים / Shatil-3-שלבים / "18 ממוצע".

**שאלות פתוחות למיטל:**
- אישור פרטי קשר בשקף 19 (מייל שכתבתי: `meytalp@gmail.com` — אולי שגוי, היא tested mlypeleg@gmail.com במקום אחר)
- הצעת פיילוט קונקרטית — דילגנו על השקף כי מיטל אמרה "לא צריך כרגע"
- לוח זמנים תשפ"ז — דילגנו על השקף כי מיטל אמרה "לא צריך כרגע"
- בחירה סופית בין 2 הדשבורדים (להחליט אחרי הצגה לשותפים)

**מה זה פתח להמשך:**
- אם הפיילוט יאושר — F.21A דורש בנייה functional (היום רק mockup)
- mockup קיים יכול לשמש כ-design reference למפתח שיבנה את הקובץ האמיתי

---

## D.15 שלב 1 — השלמת קבוצת בועות (3 אותיות: ל · נ · א)

**סטטוס:** 🟡 קוד הסתיים · ממתין לבדיקה ידנית של מיטל · **לא נדחף**
**תאריך:** 2026-05-27 ערב
**שיחה:** Claude Code (Opus 4.7 · VS Code · ort-presentation-builder)
**Commit:** טרם נדחף
**יחס למשימת-אם D.15:** שלב 1 מתוך 5. שלבים 2-5 (theme-aware + כוכבים + צדפים + דגים) ימתינו לאישור ידני של מיטל אחרי שלב 1.

**מה נעשה:**
שכפול של תבנית D.14 (shin.json + stage-3-template-demo.html) ל-3 האותיות החסרות באותה קבוצה נושאית — "בועות בים". מעבירים את הקבוצה מ-1 אות (ש demo) ל-4 אותיות חיות (ש · ל · נ · א). שלוש האותיות החדשות אדיטיביות בלבד — לא משנות את הקוד הקיים של ש או של 5 המשחקונים האמנותיים.

**4 החלטות שנסגרו עם מיטל (לפני קוד):**

| # | החלטה | תשובה |
|---|---|---|
| 1 | intro audio — פר נושא או פר אות? | **פר אות** — `intro-<letter-key>.mp3` (כמו shin הקיים). 16 קבצים נוספים אבל הניסוח כולל את שם האות. |
| 2 | SVG inline לכוכב/צדף/דג (לקבוצות 3-5) | **Overlay מעל ה-tile העיגולי** — שומר על האנימציות הקיימות (tile-float, tile-hint-pulse, tile-just-lit). תקף לשלב 2 ואילך. |
| 3 | stage-3-island.html — איך להציג 22? | **כל ה-22 בעמוד אחד, מקובצים פר נושא** (5 קבוצות עם header). |
| 4 | סדר בנייה | **שלב 1 קודם** (3 אותיות בועות) — שכפול קל לפני בניית תשתית theme-aware. |

**קבצים שנוצרו (10):**

| # | קובץ | סטטוס | הערה |
|---|---|---|---|
| 1 | `underwater-app/data/island-03-letters/lamed.json` | חדש | שכפול של shin.json עם distractors מעודכנים. quest_id=`lamed-bubbles`. |
| 2 | `underwater-app/data/island-03-letters/nun.json` | חדש | quest_id=`nun-bubbles`. |
| 3 | `underwater-app/data/island-03-letters/alef.json` | חדש | quest_id=`alef-bubbles`. |
| 4 | `underwater-app/scripts/generate-bubbles-letters-audio.py` | חדש | edge-tts · AvriNeural · rate -10%. 6 קבצים בהרצה אחת. |
| 5 | `underwater-app/assets/audio/intro-lamed.mp3` | חדש | AvriNeural · ניסוח מאוחד פתיחה+משימה (כמו intro-shin) |
| 6 | `underwater-app/assets/audio/find-lamed.mp3` | חדש | "מצאו את כל הבועות עם האות לָמֶד..." |
| 7 | `underwater-app/assets/audio/intro-nun.mp3` | חדש | שם האות = "נוּן" |
| 8 | `underwater-app/assets/audio/find-nun.mp3` | חדש |  |
| 9 | `underwater-app/assets/audio/intro-alef.mp3` | חדש | שם האות = "אָלֶף" |
| 10 | `underwater-app/assets/audio/find-alef.mp3` | חדש |  |
| 11 | `underwater-app/stage-3-lamed.html` | חדש | מבוסס stage-3-template-demo.html · letterKey מקושח ל-'lamed' · href חזרה ל-stage-3-island.html |
| 12 | `underwater-app/stage-3-nun.html` | חדש | אותו דפוס |
| 13 | `underwater-app/stage-3-alef.html` | חדש | אותו דפוס |
| 14 | `underwater-app/stage-3-island.html` | שינוי | מ-5 ל-22 הרפתקאות מקובצות ב-5 נושאים. CSS חדש: `.quest-group`/`.quest-group__header`/`.quest-group__grid`. animation-delay זז מ-`:nth-child(N)` ל-`--card-delay` מחושב פר כרטיס. progress label `0/22`. |

**מה לא נגעתי בו (לפי הוראות הספק):**
- ❌ bkt.js / epa.js / event-logger.js / mastery-check.js / profile-classifier.js
- ❌ js/templates/game-shell.js · mechanic-tap-all.js · mechanic-pick.js · mechanic-quest.js (אין צורך בשלב 1 — תשתית theme-aware עוברת לשלב 2)
- ❌ css/game-shell.css (אין צורך בשלב 1)
- ❌ 5 המשחקונים האמנותיים (shell/house/rescue/trail-resh/storm)
- ❌ stage-3-template-demo.html (shin) — נשאר כ-canonical D.14 demo
- ❌ js/shared/audio.js — LETTER_TO_SOUND_FILE כבר כיסה את 22 האותיות מ-D.14
- ❌ מסמכי-אם

**מנגנון נעילה הדרגתית — שמרתי 1:1 מהקוד הקיים:**
המשמעות: ילד שטרם השלים את 5 האמנותיים יראה את shin/lamed/nun/alef כ-`state-locked` (לא קליקבילי). זה תואם להחלטת `prevCompleted gates next` מ-D.14. אם מיטל תרצה שינוי — צריך החלטה פדגוגית נפרדת.

**Audio verification:**
- 6/6 קבצים נוצרו בהרצת `python scripts/generate-bubbles-letters-audio.py`
- Voice: he-IL-AvriNeural · rate -10% (קביעה גלובלית 23.5.2026)
- 3 כללי TTS עברי שנשמרו: כֹּל בחולם · ניסוח טבעי "ה-X עם האות Y" (לא סמיכות) · שם האות בכתיב מלא ומנוקד (לָמֶד · נוּן · אָלֶף)
- finale_audio_key=`finale-bubbles-found` (קיים מ-D.14, מתאים לכל קבוצת בועות)
- praise pool (yofi/metzuyan/mealeh) קיים מ-D.14

**Smoke checks שעברו:**
- 3 JSON parse נכון · השדות הצפויים (letter / quest_id / theme / intro_audio_keys / in_game_prompt_audio_key / finale_audio_key) קיימים ותואמים schema
- 3 HTML inline JS פרסים נכון (node `new Function`)
- stage-3-island.html inline JS פרסים נכון (9876 chars, 1 block, no errors)

**מה זה פותח:**
- אחרי בדיקת מיטל ידנית של אחת מ-3 האותיות (לפחות) ואישור — נדחפת קבוצה M (קומיט), ואז ממשיכים לשלב 2 (תשתית theme-aware ב-game-shell + mechanic-tap-all + game-shell.css לקראת כוכבים).
- אחרי שלב 3 (4 אותיות כוכבים) — אישור ויזואל ממיטל → שלב 4+5 (צדפים+דגים) זורם.
- כשכל 16 האותיות יחיות → D.15 ✅ ב-tracker, רף "תקין" של ראמ"ה (18+/22) ייפתח.

**שאלות פתוחות (לא חסומות, אבל שווה להחליט בעתיד):**

1. ⚪ נעילה הדרגתית עם 22 כרטיסים — האם זה הגיוני? (כרגע: שמרתי כמו ב-D.14). מיטל יכולה לבחור: כל הקבוצה נפתחת אחרי השלמת קבוצה קודמת, או כל ה-built נפתחים בבת אחת.
2. ⚪ סדר ההצגה בתוך הקבוצה (ש→ל→נ→א בבועות) — נכון או צריך סדר אחר?

---

## F.21A-spec — wireframe + UX spec למסך מורה בשפת ראמ"ה (שלב א' — לפני קוד)

**סטטוס:** ✅ הסתיים · מסמך spec יחיד · ממתין לאישור push
**תאריך:** 2026-05-27 ערב
**שיחה:** Claude Code (Opus 4.7 · VS Code · ort-presentation-builder)
**Commit:** טרם נדחף
**יחס למשימת-אם F.21A:** מיטל בחרה לפצל — `F.21A-spec ✅` (זה) נוסף ל-tracker כשורה נפרדת, ו-`F.21A` נשארת פתוחה לסוכן קוד בשלב ב'.

**מה נעשה:**
מסמך wireframe + UX spec מלא של F.21A — המסך החדש שמציג את הכיתה דרך עדשת **משרד החינוך + ראמ"ה** (10 משימות × 3 פעימות) במקום עדשת "המשחקונים של אבני יסוד". המסמך יחסום את שלב הקוד כך שסוכן הקוד יוכל לפעול מתוך החלטות סגורות בלבד.

**5 ההחלטות שנסגרו עם מיטל (לפני כתיבת ה-spec):**

| # | החלטה | תשובה | מי המליצה |
|---|---|---|---|
| 1 | מבנה תצוגה ראשי | **טבלה** (תלמידות × משימות, צבע פר תא) | מיטל ביקשה דעה → סוכן המליץ טבלה (5 נימוקים: יחיד שעונה ל-2 השאלות הקריטיות תוך 5 שניות · שפה מוכרת · drill-down דו-כיווני · רטרו-פיט עם סקציה 6 · פעימה כצבע-רקע) |
| 2 | View ראשי בכניסה | **שני כפתורים שווי-משקל** `[מבט כיתה]` + `[מבט תלמידה]` | מיטל |
| 3 | רמת פירוט פר תלמידה | **הכל + Confidence indicators (✅🟡⚫)** — 5 strands + 22 letters + EPA + 10 RAMA + per-task confidence | מיטל |
| 4 | תצוגת פעימה | **שניהם** — Daily mode + Snapshot mode (toggle/tabs) | מיטל |
| 5 | פרטיות תלמידים | **URL נפרד (`teacher-rama.html`) + PIN ב-sessionStorage** | מיטל ביקשה דעה → סוכן המליץ אופציה 1 (נימוק: 2 התקנים פיזיים נפרדים בכיתה אמיתית, "שער נפילה" מספיק ל-MVP, roadmap לתוקן חתום בשלב ב') |

**מבנה ה-spec (12 סקציות + 2 נספחים):**

| § | סקציה | תוכן |
|---|---|---|
| 1 | הקשר | איזה מסך מחליף (סקציה 6 ב-teacher-live כ"תצוגת בדיקה למפתחים") · קהל יעד · עקרון 5 שניות |
| 2 | 5 החלטות שנסגרו | טבלה מסכמת + נימוקים |
| 3 | Wireframe ראשי | 4 mockups בASCII: Class View · Student View · Pulse Snapshot · Privacy Gate |
| 4 | זרימות "מה קורה כש..." | 7 use cases (בוקר רגיל · drill לתלמידה · דגל אוטומטי · סוף פעימה · cold-start · parent view · תלמידה לא תורגלה) |
| 5 | מיפוי data → UI | טבלה מלאה: כל אלמנט במסך → פונקציית API שמזינה אותו · **מציין פונקציה חדשה שדרושה:** `AvneiMasteryCheck.checkRamaTaskStatus(studentId, ramaTaskId)` |
| 6 | Privacy Implementation | חתימת PIN gate · אילו edge cases מטופלים · מה לא בונים (שלב ב') |
| 7 | Confidence Indicators | אלגוריתם הסיווג: <10 → ⚫ · <30 → 🟡 · >7 ימים → 🟡 · רגרלי → ✅ |
| 8 | Pulse Toggle | חוקי מעבר Daily↔Snapshot + טווחי תאריכי הפעימות + פתרון מוצע ל-replay (לא snapshot file) |
| 9 | מה משאירים לקוד | החלטות עיצוביות שסוכן הקוד יוכל לפתור בעצמו + 5 שאלות פדגוגיות שדורשות שיחה עם מיטל לפני קוד |
| 10 | Open Items שדורשים אישור מיטל | 5 פריטים לפני שסוכן הקוד מתחיל (תחילת פעימה 1 · PIN default · F.21A inline vs קובץ נפרד · ...) |
| 11 | תוצרי המשך (לא בסקופ) | F.21B (Parent view) · F.21C (Inspector view) · E.18 · F.21D · B.10 |
| 12 | Acceptance Criteria | 12 קריטריונים שסוכן הקוד צריך לעבור |
| נספח A | מיפוי משימה ראמ"ה ↔ איים | טבלה מלאה: 10 משימות → איים מאבני יסוד + רפים |
| נספח B | ASCII mockup לבדיקה ידנית | 1 תלמידה, פעימה 1 פעילה — לבדיקת קריאות |

**החלטות אסטרטגיות מתועדות (לא רק decisions):**

- **F.21A הוא קובץ חדש (`teacher-rama.html`)**, לא inline-replace של סקציה 6 ב-teacher-live (סעיף 10.5 ב-spec). הסיבה: מאפשר A/B testing עם מורות, לא מערבב "תצוגת בדיקה" עם המסך הסופי, ופותר את חלק הפרטיות (URL נפרד מ-teacher-live).
- **`checkRamaTaskStatus` היא פונקציה חדשה שלא קיימת היום.** היא הכרחית כי `AvneiMasteryCheck.checkMastery` עובד per-island אבל F.21A דורש per-RAMA-task (1 משימה → 1+ איים). מיקום מוצע: הרחבה של `mastery-check.js` הקיים. **חתימה מלאה מתועדת בסעיף 5 של ה-spec.**
- **Snapshot mode = Replay של state.events** (לא snapshot file). יקר אבל מדויק. אם איטי בפיילוט — להחליף ל-snapshot file בפיילוט הבא.
- **Confidence indicator הוא מינימום על-פני 5 סטרנדים** — אם סטרנד אחד ⚫, הסימן הכללי 🟡 (לא ✅).

**תלויות שכבר סגורות (כל ה-API מוכן):**

| תלות | סטטוס | API נצרך ב-F.21A |
|---|---|---|
| A.1 — BKT-per-strand | ✅ נדחפה 27.5 (`b4c0145`) | `AvneiBKT.getStudentStrands(studentId)` · `getStrandState` · `checkStrandMastery` |
| A.3 — EPA module | ✅ נדחפה 27.5 (`3c063bb`) | `AvneiEPA.getDominantPattern(studentId, islandId?, threshold?)` |
| A.4 — Sub-BKT 22 אותיות | ✅ הסתיים 27.5 ערב (ממתין ל-push, `1582a96`) | `AvneiBKT.getLetterState(studentId, letter)` · `getLetterMasteryDistribution(studentId)` |
| A0.3 — Mastery משולש | ✅ נדחפה 27.5 (`299f9b4` · `666acca`) | `AvneiMasteryCheck.checkMastery(studentId, islandId)` כבסיס ל-`checkRamaTaskStatus` החדש |

**קבצים שנוצרו/שונו:**

| קובץ | שינוי |
|---|---|
| `_handoff/2026-05-27-F21A-ux-spec.md` | **חדש** · ~700 שורות · spec מלא לסוכן הקוד |
| `_handoff/2026-05-26-architecture-tasks-tracker.html` | הוספת שורת `F.21A-spec ✅` לפני שורת `F.21A` בפאזה F · עדכון "מוכן להתחיל" (F.21A-spec ✅ · F.21A ⏳) · עדכון header מ-40 ל-41 משימות |
| `_handoff/agent-completion-log.md` | בלוק חדש בראש (זה) |
| `_handoff/pending-commits.md` | בלוק חדש בראש — קבוצה L |

**קבצים שלא נגעתי בהם (לפי כללי ריבוי-סוכנים):**
- `teacher-live.html` — לא משנים עד שלב הקוד (F.21A יחיה כקובץ חדש `teacher-rama.html`, לפי החלטה 5 ב-spec)
- `mastery-check.js` — תיווסף הפונקציה `checkRamaTaskStatus` רק בשלב הקוד, לא עכשיו
- כל קבצי js/shared/* — סוכן הקוד יקרא את ה-API כפי שתועד ב-§5

**שאלות פדגוגיות-עיצוביות — כולן נסגרו עם מיטל ב-27.5.2026 ערב:**

| # | שאלה | החלטה |
|---|---|---|
| 1 | תחילת פעימה 1 | ✅ 1.9.2026 |
| 2 | PIN ברירת מחדל | ✅ PIN cosmetic לפיילוט · מיטל תחלק ידנית למורה |
| 3 | F.21A inline או קובץ נפרד | ✅ קובץ נפרד `teacher-rama.html` (אישור על המלצת סוכן UX) |
| 4 | checkRamaTaskStatus כשמשימה נשענת על 2+ סטרנדים | ✅ **Min — החלש מנצח** (אישור על המלצת סוכן UX · קונסרבטיבי · עקבי עם Mastery המשולש · חוסם False Positives) |
| 5 | ילדה לא תורגלה 3+ ימים — מה הסטטוס? | ✅ **Downgrade של Confidence, לא של BKT.** סכמה: 0-7 ימים ✅ · 7-14 ימים 🟡 + תווית "נמדד לפני X ימים" · 14+ ימים 🟡 + אזהרה בולטת בראש Student View. (אישור על המלצת סוכן UX) |

**עדכון ל-spec בעקבות סגירת השאלות:** סעיפים §9 ו-§10 נכתבו מחדש כדי לתעד את ההחלטות סגורות עם נימוקים. סוכן הקוד יכול לפתוח את ה-spec ולקבל מסמך שלם בלי "TBD".

**מה לא בסקופ ה-spec (לזכור לעתיד):**
- Parent view (F.21B) · Inspector view (F.21C) · Export ל-PDF/Excel (E.18) · Trend graph (F.21D) · Group Suggestion Engine (B.10) · Push notifications

**בדיקה ידנית של ה-spec לפני handoff לקוד:**
לא רלוונטי — זה מסמך עיצובי, לא קוד. בדיקת איכות = קריאה של מיטל + סוכן הקוד.

**הצעת המשך:**
לאחר אישור מיטל ל-spec + פתרון 5 השאלות הפתוחות (סעיף 10) → להוציא פרומפט לסוכן קוד F.21A. הפרומפט יצביע על המסמך כקריאה חובה.

---

## A.4 — Sub-BKT פר 22 אותיות (הרחבה מ-5 ל-22 בסטרנד פונולוגיה)

**סטטוס:** ✅ הסתיים · קוד כתוב + 2 בדיקות עברו (53/53 בחדש + 0 רגרסיה בישן) · ממתין לאישור push
**תאריך:** 2026-05-27 ערב
**שיחה:** Claude Code (Opus 4.7 · VS Code · ort-presentation-builder)
**Commit:** טרם נדחף

**מה נעשה:**
`underwater-app/js/shared/bkt.js` הורחב כך ש-Sub-BKT פר-אות מכסה את כל 22 האותיות העבריות (עד עכשיו רק 5: מ/ק/ב/ר/ת — מ-5 המשחקונים הקיימים). זה אבן-בסיס ל-F.21A (מסך מורה בשפת ראמ"ה — צריך להראות חולשה פר אות) ול-D.15 (שכפול ל-17 אותיות באי 3 — כל אות צריכה sub-BKT משלה).

**אסטרטגיה — הרחבה ב-3 שכבות (state + ingest + API):**

| החלטה | תוצאה |
|---|---|
| **רשימת 22 אותיות** | קבוע חדש `ALL_HEBREW_LETTERS_22` — סדר אלפבתי קנוני, תואם בדיוק את `data/island-03-letters/_schema.md` של D.14 (אותו מקור אמת — מנע פיצול עתידי) |
| **pL0/pT/pG/pS פר אות** | אישור מיטל לפני קוד: **ברירת מחדל אחידה** (0.12 ב-strand 1, 0.10 ב-island 3 PARAMS_PER_ISLAND[3]). אין דאטה אמפירי לפיצול כרגע; הפיצול דחוי לכיול אחרי פיילוט |
| **ISLAND_3_LETTERS = 5** | נשאר במצב הקיים. mastery של "אי 3 נסגר" עדיין דורש את 5 האותיות עם משחקון פעיל. כש-D.15 ישלים את 17 המשחקונים — לעדכן ל-22 גם כאן |
| **מיגרציה non-destructive** | פונקציה `ensureAllLettersIn(perLetter, pL0)` נקראת ב-getIslandState/getStrandState/getPerLetterState/ingestIsland3Event. ילדות עם state ישן (5 אותיות) מקבלות 17 נוספות בלי לאבד נתונים קיימים |
| **Backfill strand 1 ← island 3** | פונקציה `backfillStrand1FromIsland3` — לילדות שהיו במערכת לפני A.1 (יש להן רק `avnei-bkt-v1`, לא `avnei-bkt-strand-v1`). מועתק חד-פעמי כשהן נכנסות ל-strand 1 הפעם הראשונה |
| **side-effect-free reads** | `getPerLetterState` בודק קיום ב-localStorage לפני קריאה ל-getStrandState (שיוצר state). תלמידה לא-קיימת → null, לא state ריק |

**API חדש שנחשף:**

```js
AvneiBKT.getLetterState(studentId, letter)
  // → {letter, pKnown, attempts, correct, wrong, accuracy, median_response_time_ms, mastered, masteryAchievedAt}
  // → null אם האות לא ב-22 או אם אין דאטה לתלמידה

AvneiBKT.getWeakestLetters(studentId, n=3, opts={includeUntouched: false})
  // → [{letter, pKnown, attempts, accuracy}, ...]  ממוין pKnown עולה (החלש ראשון)
  // ברירת מחדל: רק אותיות תורגלו (attempts ≥ 3) ושלא נשלטו
  // {includeUntouched: true} → כולל אותיות לא-תורגלו (לדשבורד F.21A "מה לא נגעו בו עדיין")

AvneiBKT.getLetterMasteryDistribution(studentId)
  // → {mastered, in_progress, weak, untouched, by_bucket: {...}, total: 22}
  // לכל דלי גם רשימת האותיות. סך הקבוצות = 22 תמיד.
  // הגדרות:
  //   mastered:    masteryAchievedAt !== null
  //   in_progress: attempts ≥ 3 AND pKnown ≥ 0.70 AND לא mastered
  //   weak:        attempts ≥ 3 AND pKnown < 0.70
  //   untouched:   attempts < 3

AvneiBKT.ALL_HEBREW_LETTERS_22              // קבוע — סדר א..ת
AvneiBKT.LETTER_WEAK_THRESHOLD              // 0.70
AvneiBKT.LETTER_MIN_ATTEMPTS_FOR_BUCKET     // 3 (תואם getWeakLettersIn3 הקיים)
```

**קבצים שנוצרו/שונו:**

| קובץ | שינוי |
|---|---|
| `underwater-app/js/shared/bkt.js` | הרחבה — נוספו `ALL_HEBREW_LETTERS_22`, `LETTER_WEAK_THRESHOLD`, `LETTER_MIN_ATTEMPTS_FOR_BUCKET`, `ensureAllLettersIn`, `backfillStrand1FromIsland3`, `getLetterState`, `getWeakestLetters`, `getLetterMasteryDistribution`. שונה: `emptyIsland3Record` (22), `emptyStrandRecord` strand 1 (22), `getIslandState`/`getStrandState`/`getPerLetterState` (מיגרציה+backfill), `ingestIsland3Event` (קבל את 22), `setInitialState` (aggregate על האותיות שהוזנו) |
| `underwater-app/scripts/test-bkt-letters.js` | חדש · 12 בלוקי-בדיקה · 53 assertions · 12 תרחישים (אתחול 22, ingest על אות חדשה, getWeakest ברירת-מחדל+includeUntouched, distribution, validation, backwards compat A0.1+checkMastery, מיגרציה non-destructive, dual-write) |
| `_handoff/2026-05-26-architecture-tasks-tracker.html` | A.4 ✅ + עדכון טבלת "מוכן להתחיל" |

**קבצים שלא נגעתי בהם (לפי כללי ריבוי-סוכנים):**
- `epa.js` (A.3), `event-logger.js` (A.3 הוסיף לו), `mastery-check.js` (A0.3), `profile-classifier.js` (A0.1)
- `js/templates/*`, `css/game-shell.css`, `audio.js` (D.14 רץ במקביל)
- כל stage-*.html

**בדיקות שעברו:**

1. **`scripts/test-bkt.js`** (test legacy A.1+פערים — לא נגעתי בו) — כל 4 הפערים עוברים זהים: sub-BKT פר-אות באי 3 · setInitialState · per-letter cold-start · recommendInitialTier. `Noa pre-set per letter aggregate = 52.0%` (זהה לפני A.4, אחרי תיקון setInitialState aggregate שיחושב על האותיות שהוזנו במפורש, לא על כל 22).

2. **`scripts/test-bkt-letters.js`** (חדש · 53 assertions ב-12 בלוקים):
   - 22 אותיות מאותחלות נכון ב-island 3 וב-strand 1 (8/8)
   - ingestEvent על ש (אות חדשה) — לא מחזיר null, sub-BKT מתעדכן (5/5)
   - getWeakestLetters ברירת מחדל — רק תורגלו (3/3)
   - getWeakestLetters includeUntouched — כולל לא-תורגלו (2/2)
   - getLetterMasteryDistribution — 4 דליים מסתכמים ל-22 (4/4)
   - getLetterState — input validation, null על תלמידה לא-קיימת (2/2)
   - A0.1 backwards compat — Object.entries(per_letter) עוד עובד 1:1 (5/5)
   - checkMastery legacy — per_letter עם 5 ISLAND_3_LETTERS שמור (3/3)
   - מיגרציה non-destructive — state ישן עם 5 → 22, ערכים קיימים נשמרים (8/8)
   - ingestEvent על אות חדשה אחרי מיגרציה — לא דורס דאטה קיים (4/4)
   - Dual-write — שני המפתחות מתעדכנים (3/3)
   - קבועים חשופים (6/6)
   - **סיכום: 53/53 ✅**

**עקרונות עיצוב שיושמו:**
- **A0.1 + A0.3 לא נשברים.** `Object.entries(per_letter)` עם `.filter(attempts >= 3)` עובד 1:1 — A0.1 פשוט רואה 22 entries במקום 5, וה-17 הלא-תורגלות פליטרות החוצה. checkMastery עדיין משתמש ב-ISLAND_3_LETTERS=5 ל-mastery של אי 3 (A0.3 ידרוש את 5).
- **AvneiBKT.ALL_HEBREW_LETTERS_22 חשוף לציבור** — D.14's `_schema.md` משתמש בסדר זה. עתידי D.15/F.21A — לא לכתוב את 22 האותיות אלא לקרוא מהקבוע (single source of truth).
- **מיגרציה אוטומטית בכל קריאה** — `ensureAllLettersIn` רץ ב-getIslandState/getStrandState/ingestIsland3Event/getPerLetterState. אין צורך ב-script מיגרציה חיצוני.
- **Backfill חד-פעמי** — `backfillStrand1FromIsland3` רץ ב-getStrandState. ילדות לפני A.1 (יש להן רק island state) מקבלות mirror ל-strand 1 בקריאה הראשונה.
- **getPerLetterState נעדף strand 1 על island 3** (אחרי backfill) — strand 1 הוא המקור-אמת החדש (A.1).
- **side-effect-free reads** — getLetterState/getWeakestLetters/getLetterMasteryDistribution לא יוצרים state חדש לתלמידה לא-קיימת. מחזירים null/dist ריק.

**שאלות פדגוגיות + מענה ממיטל (לפני קוד):**

1. ❓ pL0/pT/pG/pS פר אות — האם שונים מ-strand 1 default? → ✅ **ברירת מחדל אחידה**. אין דאטה אמפירי לפיצול. אחרי פיילוט נכייל לפי דאטה אמיתי.
2. ❓ getWeakestLetters — האם לכלול אותיות שלא תורגלו עדיין? → ✅ **flag opt-in**. ברירת מחדל = רק `attempts ≥ 3` (תואם partners-review §6). `{includeUntouched: true}` למי שצריך — F.21A או D.15 עשויים להשתמש.
3. ❓ Smoke test — קובץ קבוע או אינליין? → ✅ **קובץ קבוע `scripts/test-bkt-letters.js` + git**. נדרש לרגרסיה ב-22 אותיות + לעתיד (D.15, F.21A, פיילוט).

**שאלות שלא נשאלו ונסגרו פנימית (כי לא קריטיות פדגוגית):**
- ספי mastery distribution (`LETTER_WEAK_THRESHOLD=0.70`, `LETTER_MIN_ATTEMPTS_FOR_BUCKET=3`) — תואם `getWeakLettersIn3` הקיים מ-A.1 (לפני שינוי). שמרני.
- Backfill — לא נשאל אם זה רצוי, אבל אחרת ילדות עם state לפני A.1 לא יראו את הדאטה ב-API החדש. בחירה טכנית, לא פדגוגית.
- `setInitialState` — תוקן: aggregate מחושב על האותיות שהוזנו במפורש (`updatedLetters`), לא על כל 22. שמרני — Noa aggregate נשאר 52% כמו לפני A.4.

**מה זה פתח להמשך:**
- ✅ **F.21A** (מסך מורה בשפת ראמ"ה) — עכשיו יכול לקרוא `getLetterMasteryDistribution(student)` כדי להציג "X ילדות שולטות 18+/22" + `getWeakestLetters` לתת רשימה למורה. תיאום עם A.1+A.3 — שלושתם פתוחים.
- ✅ **D.15** (שכפול ל-17 אותיות באי 3) — כל אות חדשה כבר תקבל sub-BKT אוטומטית (ingestEvent יזהה את האות, ensureAllLettersIn יוודא קיום). D.14 חתם את ה-template, A.4 חתם את ה-tracking — D.15 יכולה להתחיל.
- ✅ **E.19** (calibration) — getLetterMasteryDistribution.by_bucket.mastered.length מעניק עוגן ל"מבדק ראמ"ה משימה 1 — האם 18+/22 ילדות שולטות?"

**ממתין ממיטל (בעדיפות):**
1. **אישור push** של bkt.js + scripts/test-bkt-letters.js + tracker.html.
2. **בדיקה ידנית (אופציונלי):** map.html → picker → תלמידה אמיתית → DevTools console:
   ```js
   AvneiBKT.getLetterMasteryDistribution(localStorage.getItem('avnei-yesod-current-student'))
   // צפוי: {mastered: 5 (אם סגרו את אי 3), in_progress: 0, weak: 0, untouched: 17, total: 22}
   AvneiBKT.getWeakestLetters(localStorage.getItem('avnei-yesod-current-student'), 5)
   // צפוי: רשימה ריקה אם כל 5 השליטו, או מצביעות לחלשות
   AvneiBKT.getLetterState(localStorage.getItem('avnei-yesod-current-student'), 'מ')
   // צפוי: {letter: 'מ', pKnown: ~1.00, attempts: ~10, mastered: true, ...}
   ```
3. **אם נמצא קונפליקט עם D.14 או A.3 בדחיפה:** `git fetch origin` לפני push — D.14 עוד לא נדחף, A.3 כן.

**הערה אופרציונלית:** הסוכן השני שעובד על D.14 (תבנית גנרית) — לא נגעתי ב-`js/templates/*`, `css/game-shell.css`, או `audio.js`. הסכמה של D.14 (`_schema.md`) משתמשת באותה רשימת 22 אותיות — אם D.14 דוחף ראשון, רשימת ALL_HEBREW_LETTERS_22 שלי תואמת לחלוטין.

---

## D.14 — חילוץ תבנית גנרית מ-5 משחקוני אי 3

**סטטוס:** 🟡 קוד מוכן · ממתין לבדיקה ידנית ב-demo + אישור push
**תאריך:** 2026-05-27
**שיחה:** Claude Code (Opus 4.7 · VS Code · ort-presentation-builder)
**Commit:** טרם נדחף

**אסטרטגיה מאושרת ע"י מיטל לפני שכתבתי קוד (4 החלטות):**
1. ארכיטקטורה = **"בסיס משותף + 3 plug-ins"** — game-shell.js נושא overlay+top-bar+noni+audio+completion+mastery hook; כל ז'אנר משחקון נשאר קובץ נפרד אבל קטן יותר
2. פלט = **קובץ HTML פר אות** (לא URL פרמטרי)
3. אסטים = **תבנית גנרית + slot ל-hero PNG אופציונלי** (לא חוסם D.15 על אסטים)
4. דאטה = **קובץ JSON פר אות** ב-`data/island-03-letters/<letter>.json`

**3 הז'אנרים שזוהו ב-5 המשחקונים הקיימים:**

| ז'אנר | משחקונים מקור | מאפיין |
|---|---|---|
| **quest** (5-stage polymorphic) | shell (מ) · house (ב) | 5 שלבים שונים מ-`js/activities/*` |
| **pick** (round-based) | rescue (ק) | 5 סיבובים × 4 פודים, 1 נכון פר סיבוב |
| **tap-all** (single-screen) | trail-resh (ר) · storm (ת) | 12 אריחים, 5 מטרות, סדר חופשי |

**קבצים שנוצרו (8 חדשים):**
- `underwater-app/js/templates/game-shell.js` — shell משותף (217 שורות) · API: `AvneiGameShell.start(config)`
- `underwater-app/js/templates/mechanic-tap-all.js` — plug-in מ-storm/trail (184 שורות) · רושם תחת `window.AvneiMechanics['tap-all']`
- `underwater-app/js/templates/mechanic-pick.js` — plug-in מ-rescue (172 שורות) · `window.AvneiMechanics['pick']`
- `underwater-app/js/templates/mechanic-quest.js` — plug-in מ-shell/house (171 שורות) · משתמש ב-`js/activities/*` הקיימים
- `underwater-app/css/game-shell.css` — סגנונות משותפים (243 שורות) · `.unit-counter`, `.shell-slots`, `.tap-tile`, `.pick-pod`, confetti, kisses
- `underwater-app/data/island-03-letters/_schema.md` — סכמת הדאטה פר אות + מיפוי 22 letter-keys
- `underwater-app/data/island-03-letters/shin.json` — קובץ demo (אות ש) להוכחת מקצה לקצה
- `underwater-app/stage-3-template-demo.html` — HTML demo שטוען את shin.json ומריץ את התבנית

**קבצים שנוגעים (1 קיים):**
- `underwater-app/js/shared/audio.js` — הרחבת `LETTER_TO_SOUND_FILE` מ-5 ל-22 אותיות (תוספת בלבד, לא משבר את 5 המשחקונים הקיימים — כל `sound-X.mp3` כבר קיים ב-AvriNeural)

**קבצים שלא נגעתי בהם (לפי כללי ריבוי-סוכנים):**
- `bkt.js`, `epa.js`, `event-logger.js`, `mastery-check.js`, `profile-classifier.js` — שייכים ל-A.1/A.3 שרצים במקביל
- 5 קבצי HTML המשחקונים הקיימים (shell/rescue/house/trail-resh/storm) — נשארים כלשונם, התבנית **אדיטיבית בלבד**

**עקרונות עיצוב שיושמו:**
- התבנית **לא משבשת את 5 הקיימים** — הם ממשיכים לעבוד כקודם
- 3 ה-plug-ins רושמים את עצמם ב-`window.AvneiMechanics[name]`, ה-shell בוחר לפי `config.mechanic`
- שמירה על הקונבנציות מ-23.5.2026: 5 הבעות נוני, feedback bubble מוסתר, support model 3-שלבי (visual → hint → press-here), `INTER_ROUND_DELAY_MS=2400`
- שימוש ב-`activity_type` קיימים ב-event-logger (`'storm-quest'`, `'rescue'`) כדי לא לדרוש שינוי ב-event-logger.js (קובץ אסור)
- `markQuestCompleted` כותב ל-`island3-quests:completed` כמו 5 הקיימים → stage-3-island.html יראה את המשחקון החדש אוטומטית
- `AvneiMasteryCheck.checkAndShowIslandCelebration(null, 3)` נקרא בסיום, כמו 5 הקיימים — מתחבר ל-A0.3

**שאלות פתוחות + מענה ממיטל (4 ענתה בהתחלה לפני קוד):**
1. ❓ ז'אנר אחד או יותר? → ✅ **בסיס משותף + 3 plug-ins**
2. ❓ קובץ HTML פר אות, או פרמטרי? → ✅ **קובץ פר אות**
3. ❓ אסטים? → ✅ **גנרי + slot ל-hero PNG אופציונלי**
4. ❓ דאטה? → ✅ **JSON פר אות ב-`data/island-03-letters/`**

**🎯 עדכון מאוחר ב-יום (27.5.2026 ערב) — אסטרטגית D.15 הוסכמה:**
אחרי שמיטל בדקה את shin demo, ראתה מקרוב את הויזואל ("בועות"), ביקשה אודיו מלא (לא רק צליל אות), זיהתה שאם כל 17 האותיות יהיו "בועות" זה יהיה מונוטוני — דנו ב-3 חלופות (A/C-קל/C-מלא) ובחרה **Full C: 4 קבוצות נושאיות עם ויזואל שונה לכל קבוצה**:
- 🫧 בועות (ש·ל·נ·א), ⭐ כוכבים (ז·י·ו·ה), 🐚 צדפים (ס·ע·צ·ט), 🐟 דגים (ד·ג·ח·פ·כ)
- כל הויזואלים = SVG inline (לא PNG מ-ChatGPT, אז סוכן D.15 יכול לבנות לבד)
- כל האותיות החדשות = mechanic tap-all (אין צורך ב-quest/pick לאותיות חדשות)
- אומדן עבודה ל-D.15: 12-15 שעות
- ספק מלא: `_handoff/2026-05-27-d15-spec.md`
- זיכרון: [[project-avnei-yesod-d14-template-theme-decision]]

**גילויי TTS תוך כדי בדיקה (נשמרו לזיכרון):**
- 🎙️ AvriNeural קורא קמץ-קטן כ-"kal" — כותבים **כֹּל** בחולם. נשמר ב-[[feedback-tts-hebrew-niqud-pitfalls]]
- 📢 ניסוח טבעי לילדים בני 6: "ה-X עם האות Y" — לא "X-י Y" (סמיכות אקדמית)
- 🔊 ילד בן 6 לא קורא — האודיו חייב לומר את המשימה במלואה, לא רק את צליל האות

**גילוי ויזואלי (נשמר):**
- mechanic-tap-all הראשון השתמש ב-CSS grid `aspect-ratio: 1` ללא תקרת רוחב → במסך רחב 12 הכדורים נדחפו לשורה אחת. תיקון: גריד 4×3 עם `clamp(64px, 14vw, 110px)` פר תא.
- intro-speaker לא היה מעוצב כי .intro-speaker חי בקבצי per-game CSS (house-quest.css וכו') — חולץ ל-game-shell.css.

**שאלות שנותרו פתוחות ל-D.15:**
- 🟡 קבצי `finale-<letter-key>-*.mp3` אופציונליים — סוכן D.15 יחליט אם להקליט (התבנית מסתדרת עם finale-found-treasure גנרי).
- 🟡 אישור ויזואלי של "כוכבי הים" אחרי קבוצה ראשונה — חוסם המשך ל-2 הקבוצות הנותרות. רשום ב-`meytal-pending.md`.

**מה זה פתח / ממתין לפעולה:**
- ✅ D.15 יכולה להתחיל — יש לה shell + 3 mechanics + schema לעבוד מולם
- 🟡 דרוש החלטה פדגוגית פר אות לפני D.15 (איזה mechanic)
- 🟡 דרושות הקלטות AvriNeural פר אות אם רוצים intro+finale דרמטיים (אחרת התבנית סבלנית)

**בדיקת ידנית ל-demo שאני מציע למיטל לעשות (5 דק'):**
1. שרת מקומי: `cd c:/Users/meyta/Downloads/impactos/avnei-yesod/underwater-app && python -m http.server 8765`
2. פתח: `http://localhost:8765/stage-3-template-demo.html`
3. צפוי: overlay "מסע השמש" → לחצי "בוא/י נתחיל" → 12 אריחים בים (5 ש׳, 7 דיסטרקטורים) → הקש על כל ה-ש׳-ים → אנימציות → completion
4. ?reset=1 מנקה localStorage לטעימה חוזרת

---

## A.1 — BKT-per-strand (5 מודלים) · dual-write + compat layer

**סטטוס:** ✅ הסתיים · קוד כתוב + 2 בדיקות עברו · ממתין לאישור push
**תאריך:** 2026-05-27
**שיחה:** Claude Code (Opus 4.7 · VS Code · ort-presentation-builder)
**Commit:** טרם נדחף

**מה נעשה:**
`underwater-app/js/shared/bkt.js` שוכתב כך שמנוע BKT מחזיק כעת **5 BKT-ים פר ילדה** (סטרנד), בנוסף ל-state ה-per-island הקיים. API חיצוני נשמר 1:1 כדי לא לשבור את A0.1 (suggestFromBKT) ו-A0.3 (mastery-check).

**אסטרטגיה — dual-write + compat layer:**

| החלטה | תוצאה |
|---|---|
| **state פנימי** | dual-write: `avnei-bkt-v1` (legacy per-island) **+** `avnei-bkt-strand-v1` (חדש per-strand). שניהם מתעדכנים בכל `ingestEvent`. |
| **תאימות לאחור** | `getIslandState`, `checkMastery`, `getStudentState`, `setInitialState`, `recommendInitialTier`, `getWeakLettersIn3` — חוזרים בדיוק כמו לפני. A0.3 ו-A0.1 לא דורשים שינוי. |
| **per_letter ב-A0.1** | A0.1's `suggestFromBKT` קורא ישירות מ-localStorage `state[sourceId][3].per_letter` — זה ממשיך לעבוד כי `avnei-bkt-v1` נשמר חי. בנוסף, יש mirror של per_letter תחת `strand[1].per_letter` (החדש). הוסף API חדש `getPerLetterState(studentId)` שמחזיר את per_letter מ-strand 1 (עם fallback ל-island 3). |
| **דאטה קיים** | לא ניזוק — "מיטל פלג" עם 25 attempts באי 3 נשמרת ב-`avnei-bkt-v1`. ה-strand state פשוט יתחיל למלא את עצמו מ-events חדשים מכאן והלאה. |

**מיפוי `ISLAND_TO_STRAND`** (מבוסס `curriculum/knowledge-base/sources/22-islands-validated-2026-05-21.json#strands_distribution`):

| Strand | שם | איים |
|---|---|---|
| 1 | פונולוגיה (phonology) | 1, 2, 3, 4, 5, 6, 7, 8 |
| 2 | מורפולוגיה (morphology) | 9, 10, 11 |
| 3 | שפה דבורה (oral_language) | 12, 13, 14 |
| 4 | קריאה והבנה (reading_comprehension) | 15, 16, 17, 18 |
| 5 | כתיבה (writing) | 19, 20, 21, 22 |

**API חדש שנחשף:**

```js
AvneiBKT.getStrandState(studentId, strandId)       // state גולמי של סטרנד
AvneiBKT.getStudentStrands(studentId)              // כל 5 הסטרנדים של ילדה
AvneiBKT.checkStrandMastery(studentId, strandId)   // p, fluency, consolidation + per_letter ב-strand 1
AvneiBKT.getPerLetterState(studentId)              // per_letter (compat: strand 1 → fallback island 3)
AvneiBKT.STRAND_IDS                                // [1,2,3,4,5]
AvneiBKT.STRAND_NAMES                              // {1:'phonology',...}
AvneiBKT.ISLAND_TO_STRAND                          // מיפוי 22→5
AvneiBKT.PARAMS_PER_STRAND                         // pL0/pT/pG/pS פר סטרנד
AvneiBKT.FLUENCY_THRESHOLD_PER_STRAND_MS           // ספי שטף — TBD פדגוגית
AvneiBKT.STORAGE_KEY_STRAND                        // 'avnei-bkt-strand-v1'
```

**מבנה state-strand:**
```js
{
  studentId: {
    1: {                                  // strand 1 = phonology
      pKnown, attempts, correct, wrong,
      responseTimesMs, sessionsAtMastery,
      lastSessionId, masteryAchievedAt,
      per_island_attempts: { 3: 25, ... },  // לקליברציה ודיבאג
      per_letter: { 'מ': {pKnown, attempts, ...}, ... }   // רק ב-strand 1
    },
    2: { ... },  // strand 2 = morphology
    3: { ... },  // strand 3 = oral_language
    4: { ... },  // strand 4 = reading_comprehension
    5: { ... },  // strand 5 = writing
  }
}
```

**קבצים שנוצרו/שונו:**

| קובץ | שינוי |
|---|---|
| `underwater-app/js/shared/bkt.js` | שיכתוב — נוספו: `STRAND_IDS`, `STRAND_NAMES`, `ISLAND_TO_STRAND`, `PARAMS_PER_STRAND`, `FLUENCY_THRESHOLD_PER_STRAND_MS`, `STORAGE_KEY_STRAND`, `emptyStrandRecord`, `ingestStrandEvent`, `getStrandState`, `getStudentStrands`, `checkStrandMastery`, `getPerLetterState`. `ingestEvent` כותב כעת ל-2 stores. `reset` מנקה גם strand state. |
| `_handoff/2026-05-26-architecture-tasks-tracker.html` | `A.1` ✅ + הערת השלמה |

**בדיקות שעברו:**

1. **`scripts/test-bkt.js`** (test legacy שלא נגעתי בו) — כל 4 הפערים עוברים: sub-BKT פר אות באי 3 · setInitialState · per-letter cold-start · recommendInitialTier. כל הציוני pKnown זהים למצב לפני השיכתוב.
2. **Smoke test פר-strand** (אינליין דרך node) —
   - 22 איים ממופים ל-5 סטרנדים
   - ingestEvent על אי 3 → `island[3].per_letter.מ` + `strand[1].per_letter.מ` שניהם 1.0 אחרי 6 נכונים
   - ingestEvent על אי 9 → סטרנד 2 פעיל בלבד (לא 1 או 3)
   - `getPerLetterState` מחזיר את per_letter ממקור strand 1 (compat layer)
   - `localStorage` מחזיק את **שני** המפתחות אחרי events

**עקרונות עיצוב שיושמו:**
- **לא לשבור A0.1 ו-A0.3.** ה-API החיצוני נשמר 1:1. הסוכן הקודם ב-A0.3 בנה את mastery-check.js על `AvneiBKT.checkMastery(id, 3)` וקבועים `ISLAND_3_LETTERS`. כל אלה זמינים בלי שינוי.
- **לא לגעת ב-event-logger.js.** הסוכן השני (A.3 / EPA) עובד שם — שמרתי גישה minimum-touch (רק bkt.js שונה).
- **per_letter בשני המקומות** — strand 1 (חדש, קנוני) + island 3 (legacy, נשמר חי) — לקריאה ע"י A0.1 או כל קוד אחר שעדיין מצפה לסכמה הישנה.
- **ספי שטף פר-סטרנד נשמרים רכים** — לא קובע פדגוגיה בלי אישור. ערכי ברירת מחדל כתובים בקוד עם הערה "TBD פדגוגית, נשמרים רכים עד A.6 + 21A".
- **pL0 פר-סטרנד** — `phonology=0.12`, `morphology=0.10`, `oral=0.30` (שפה דבורה קיימת בכניסה), `reading=0.10`, `writing=0.08`. ניתנים לשינוי כשפדגוגית נקבעת.

**שאלות פתוחות + מענה ממיטל (לפני קוד):**
1. ❓ מה לעשות עם state קיים ב-localStorage (תלמידות עם דאטה אמיתי)? → ✅ **Dual-write.** legacy נשמר חי, חדש מצטרף בצד.
2. ❓ A0.1 קורא ישירות state[3].per_letter — איך לא לשבור? → ✅ **Compat-Layer.** mirror של per_letter תחת strand 1 + `getPerLetterState` API חדש + state[3].per_letter ממשיך לחיות.

**שאלות שלא נשאלו ונסגרו פנימית (כי לא קריטיות פדגוגית):**
- pL0 ערכים פר-סטרנד — ערכי ברירת מחדל סבירים, ניתנים לשינוי כשפדגוגית נקבעת.
- ספי שטף פר-סטרנד — `4s/6s/8s/5s/10s` — TBD פדגוגית, לא חוסם.
- האם setInitialState מעדכן גם strand state? → **לא בפאזה הזו.** רק island state. strand state יושב על pL0 ויתעדכן מ-events. אבחון פתיחה ל-strand = משימה עתידית.

**מה זה פתח להמשך:**
- ✅ **A.4** (Sub-BKT פר 22 אותיות) — אפשר להרחיב את `per_letter` ב-`strand[1]` מ-5 ל-22 אותיות בלי לגעת ב-API החיצוני.
- ✅ **A.6** (Confidence indicators) — יוכל לקרוא `getStrandState().attempts` ולהציג ✅/🟡/⚫ פר סטרנד.
- ✅ **21A** (מסך מורה בשפת ראמ"ה) — יוכל לחתוך לפי `getStudentStrands()` + `ISLAND_TO_STRAND` כדי להראות 5 BKT-ים פר ילדה.
- ✅ **E.19** (calibration) — `per_island_attempts` בתוך כל strand מאפשר קליברציה פר-אי מתוך אותו strand.

**ממתין ממיטל (בעדיפות):**
1. **אישור push** של bkt.js + tracker.html.
2. **בדיקה ידנית (אופציונלי):** map.html → picker → תלמידה → 5+ אירועים באי 3 → DevTools → `localStorage.getItem('avnei-bkt-strand-v1')` — לוודא שהדאטה זוהר נכון.
3. **אם משהו נשבר בבדיקת מיטל ב-A0.3 או A0.1:** לדווח — אני בעבירת compat וזה לא צפוי, אבל אם קרה — ניתן לחזור.

**הערה אופרציונלית:** הסוכן השני שעובד על A.3 (EPA) — לא נגעתי ב-`event-logger.js`. כשנמזג, שני הקבצים אמורים לחיות יחד בלי קונפליקט. לפני push: `git fetch origin && git status` כדי לוודא.

---

## A.3 — מודול EPA (Error Pattern Analysis · 3 צירים)

**סטטוס:** ✅ הסתיים · קוד כתוב + smoke tests עברו · ממתין לאישור push
**תאריך:** 2026-05-27
**שיחה:** Claude Code (סוכן עבודה ב-VS Code · ort-presentation-builder)
**Commit:** טרם נדחף

**קבצים שנוצרו/שונו:**
- `underwater-app/js/shared/epa.js` (חדש · 234 שורות) — `AvneiEPA` עם API מלא: `ingestEvent` · `getEPA` · `getDominantPattern` · `dump` · `reset`. localStorage key נפרד `avnei-epa-v1`. מבנה: `state[studentId][islandId][letter][axis][value] = count`.
- `underwater-app/js/shared/event-logger.js` — נוסף בלוק `if (window.AvneiEPA)` אחרי בלוק BKT (12 שורות). לא נגעתי ב-5 הדגלים האוטומטיים.
- 10 קבצי HTML — הוספת `<script src="js/shared/epa.js"></script>` לפני `event-logger.js`:
  - אי 3: `stage-3-shell.html` · `stage-3-house.html` · `stage-3-storm.html` · `stage-3-rescue.html` · `stage-3-trail-resh.html` · `stage-3.html`
  - אי 2: `stage-2-whispers.html` · `stage-2-twin-seaweeds.html` · `stage-2-fish-schools.html`
  - דשבורד: `teacher-live.html`

**עקרונות עיצוב שיושמו:**
- **ספירה תיאורית בלבד** — אין pKnown, אין Bayesian, אין מודל סטטיסטי. רק counts מצטברים על 3 צירים אורתוגונליים (orchestrator §3).
- **לא נגעתי ב-bkt.js ולא ב-5 הדגלים האוטומטיים** (אזהרת orchestrator §1) — EPA היא שכבה חדשה ונפרדת, נצרכת ע"י B.8/B.9/21A בעתיד.
- **EPA נקרא רק על is_correct=false** — הצלחה לא רושמת. שונה מ-BKT שמתעדכן על כל אירוע.
- **3 צירים** (partners-review-v3 §4ד): `failure` (Shape/Sound/Name/Direction) · `context` (isolation/initial/medial/final/font) · `task` (recognition/find/name/write).
- **גזירה מ-activity_type + override אופציונלי** (לפי החלטת מיטל) — טבלת `ACTIVITY_TO_FAILURE` ו-`ACTIVITY_TO_TASK` ברירת-מחדל; `evt.failure_type`/`evt.task_type`/`evt.letter_position` עוקפים. Context: ברירת-מחדל `isolation` כשאין `letter_position`.
- **סף "דפוס דומיננטי"** (partners-review-v3 §6, לא ערך קסם): 40% default, override 30% ל-Direction (נדיר יותר מטבעו).
- **MIN_FAILURES_FOR_PATTERN = 3** — מונע "100% Shape" על מדגם של 1; עקבי עם הסף ב-`detectAndRecordFlags`.
- **integration גנרי** — כל קריאה ל-`AvneiEPA` ב-event-logger עטופה ב-`if (window.AvneiEPA)` + `try/catch`, כך שאם הקובץ לא נטען, אין שבירה. דפוס זהה ל-AvneiBKT.

**2 ההחלטות שאישרה מיטל לפני שכתבתי קוד:**
1. ✅ **Failure derivation** — טבלת מיפוי פר activity_type + override אופציונלי. ה-event-logger לא משתנה. בעתיד פריטים יכולים להעביר `evt.failure_type` מפורש.
2. ✅ **Context source** — קורא מ-`evt.letter_position` אם קיים, ברירת-מחדל `'isolation'`. non-breaking; משחקונים נוכחיים יישארו ב-isolation עד שיוסיפו position לפריטים.

**Smoke tests (Node):**
14 בדיקות עברו —
- is_correct=true לא רושם · is_correct=false רושם · 3 הצירים מאוכלסים נכון
- override פר ציר עובד · ערך לא חוקי ב-override נופל למיפוי
- חסר target_letter/island → דילוג בטוח
- getDominantPattern: מעל הסף → מחזיר {axis, value, percent, count, total} · מתחת ל-MIN → null
- threshold override (קריאה ידנית עם threshold ספציפי) · threshold בלתי-אפשרי (1.01) → null
- Direction מובדל מ-Sound (30% sufficient) · החזק ביותר זוכה כשיש ריבוי דפוסים
- aggregation across letters עובד · reset(studentId) ו-reset() עובדים

**שאלות פתוחות + מענה ממיטל:**
1. ❓ איך לגזור Failure? → ✅ **טבלת מיפוי + override** (מומלץ)
2. ❓ Context source? → ✅ **evt.letter_position אם קיים, ברירת-מחדל isolation** (מומלץ)

**מה זה פתח להמשך:**
- ✅ **B.8** (intervention matcher) — יכול לקרוא `AvneiEPA.getDominantPattern(student, island)` כדי להחזיר את האינטרבנציה הנכונה (סקריפט מילולי) לפי דפוס הכשל.
- ✅ **B.9** (group suggester) — יכול לאסוף `dominant pattern` פר ילדה ולקבץ ילדות עם דפוס זהה לקבוצה מוצעת.
- ✅ **21A** (מסך מורה בשפת ראמ"ה) — יכול להציג "מאיה: דפוס Shape ≥40% בולט באי 3" + להמליץ אינטרבנציה מתאימה.
- 🟡 **שדה `letter_position` בפריטים** — דורש החלטה עתידית האם להעשיר את `data/island-*.json` בשדה position פר פריט. כרגע כל אירועי אי 3 נספרים כ-`isolation` (לא משקר — רוב המשחקונים באמת בבידוד), אבל פעילויות `findLetter` ב-LX מגלים אות באמצע מילה — שם יהיה רווח אמיתי כשיוסיפו position.

**שלב בדיקה ידנית (בלוק לבדיקת מיטל לפני push):**
```powershell
cd c:/Users/meyta/Downloads/impactos/avnei-yesod
python -m http.server 8765
```
1. `http://localhost:8765/underwater-app/map.html` → picker → תלמידה אמיתית → לבחור משחקון אי 3 (למשל הצדף, שמשחק על מ').
2. לטעות בכוונה 3-5 פעמים (להמתין לתמיכות עד "הקש פה").
3. ב-DevTools console:
```js
window.AvneiEPA.getEPA(localStorage.getItem('avnei-yesod-current-student'), 3)
// אמור להציג: {"מ": {failure: {Sound: N}, context: {isolation: N}, task: {recognition: N}}}
window.AvneiEPA.getDominantPattern(localStorage.getItem('avnei-yesod-current-student'), 3)
// אם N >= 3 → אמור להחזיר דפוס (Sound 100%/recognition 100%/isolation 100% — כולם 1.0)
```

**ממתין ממיטל:**
1. בדיקה ידנית קצרה ב-localhost (אופציונלי — smoke tests כבר עברו)
2. אישור push של 12 הקבצים שצוינו

---

## A0.1 — תיקון buggy של suggestFromBKT + debug panel (27.5.2026)

**סטטוס:** ✅ הסתיים · אומת end-to-end ע"י מיטל · ממתין ל-push
**תאריך:** 2026-05-27
**שיחה:** Claude Code (סוכן תזמורת ב-VS Code · ort-presentation-builder)

**בעיה שזוהתה באימות:**
- מיטל הוסיפה תלמידה ("מיטל פלג"), שיחקה 25 פריטים באי 3 (5 פריטים × 5 אותיות), p=0.9987.
- BKT engine רשם תקין (25 attempts). Event logger רשם תקין (25 events על התלמידה).
- אבל ה-onboarding-profile הציג "אין עדיין הצעה אוטומטית · מנוע BKT לא נטען".
- **שורש הבעיה:** `engine/onboarding-profile.html` לא טוען את `bkt.js` כ-script tag. רק את `profile-classifier.js` כ-ES module. `window.AvneiBKT` היה `undefined` ו-`suggestFromBKT()` יצא מיד בשורה 379.

**התיקון (אופציה B מההמלצה):**
| קובץ | שינוי |
|---|---|
| `underwater-app/js/shared/profile-classifier.js` | `suggestFromBKT()` קוראת BKT state ישירות מ-localStorage (`avnei-bkt-v1`) דרך `readJson()` — לא דורשת יותר `window.AvneiBKT` |
| `engine/onboarding-profile.html` | `buildDebugInfo()` קוראת BKT state ישירות מ-localStorage — לא דורשת `window.AvneiBKT` |

**אימות לאחר תיקון (צילום מיטל):**
- ✅ דיבאג פאנל: "אי 3 = 25 אירועי BKT · סה"כ 25 (סף: 10)"
- ✅ באנר צהוב: "המערכת אספה 25 אירועי תרגול ויכולה להציע 2 סימונים"
- ✅ ידע אותיות: "שליטה מצוינת" (5/5 אותיות מתורגלות שולטת BKT ≥ 0.70)
- ✅ קשרי אות-צליל: "שליטה מצוינת" (aggregate BKT = 1.00, 25 ניסיונות)
- ✅ באנר ירוק אישור: "החלו 2 סימונים אוטומטיים"

**הערה:** אופציה B (במקום A — להוסיף script tag ב-HTML) נבחרה כי profile-classifier הוא ES module עצמאי שאמור להיות autarki. אם בעתיד תוסיף קריאות אחרות ל-AvneiBKT מ-engine/, צריך לשקול אופציה A או C.

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
