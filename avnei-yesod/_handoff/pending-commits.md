# קומיטים ממתינים — אבני יסוד
**📌 A1 נסגר 27.5.2026** · 3 קבוצות נדחפו (A · B · C). 2 נשארות חסומות על החלטות פדגוגיות (D · F).
**עדכון ולא קובץ חי** — לעדכונים עתידיים, צרו קובץ חדש מתוארך.

---

## 🟢 קבוצה Z2 — MOY × B.7 link (Smart hybrid · suggest+queue · after attempt 2 fail)

**סטטוס:** 🟢 הסתיים — 293/293 ✓ (51 חדש + 242 רגרסיה) · ממתין לבדיקה ידנית של מיטל ואז push
**תאריך:** 2026-05-28 ערב (סוכן 14 · אחרי סוכן 15)
**2 קבצים חדשים + 1 שינוי קוד + 3 handoff updates · חבילה קטנה (~440 שורות net)**

| # | קובץ | סטטוס | הערה |
|---|---|---|---|
| 1 | `underwater-app/js/shared/moy-intervention-map.json` | **חדש** (~55 שורות) | תיעוד 4 החלטות מיטל (Smart hybrid + queue + attempt 2 + UI שניהם) + priority list (letter_knowledge > letter_cluster > decoding > fluency > phonological) + notice_he פר משימה. נטען sync ע"י assessments.js עם fallback ל-DEFAULT_MAP פנימי. |
| 2 | `underwater-app/js/shared/assessments.js` | שינוי (+~140 שורות) | `loadInterventionMap()` (XHR+fs+cache) · `_tryEpaBktSuggestion(studentId, priority)` (קורא ל-AvneiInterventions.detectForStudent אם זמין) · `_computeSuggestionFromRec(rec, studentId, taskId?)` · public `getSuggestedInterventionForAssessment(studentId, taskId?)` · auto-save ב-`recordMOYAttempt` אם attempts.length≥2 AND latest=='fail' · `suggested_intervention` חשוף ב-`getMOYStatus`. |
| 3 | `underwater-app/scripts/test-moy-intervention-link.js` | **חדש** (~260 שורות) | 11 בלוקים · **51 assertions ✓** · Mock localStorage + AvneiInterventions (mock אופציונלי שמאפשר לבדוק גם fallback וגם EPA hit). |
| + | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי קל | +שורה בסקירה ✅ + +task חדש ב-פאזה F ("MOY × B.7 link") |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד MOY × B.7 link מלא |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו |

**מהות התוצר:**
חיבור פדגוגי בין 2 משימות שכבר היו ב-origin: MOY-Lite (סוכן 10 · `93dbd4a`) מודד תלמידה ב-attempts; B.7 (סוכן 9 · `0dbbf4e`) מספק 5 scripts ל-Tier-2 RTI קבוצתי. עד הסבב הזה — תלמידה שנכשלה ב-MOY קיבלה `next_review_due` (5 שבועות) אבל **אף הצעת אינטרבנציה לא נשמרה**. עכשיו: אחרי 2 כשלונות, `state.assessments[sid].suggested_intervention` מתמלא אוטומטית עם patternId + source + match_quality + notice — מוכן ל-UI להציג ב-Student View + לסכם ל-group≥3 ב-F.21A.

**יחס לקבוצות שכבר נדחפו / ממתינות:**

- ✅ סוכן 10 (MOY-Lite · `93dbd4a` + `7a70a03`) — `recordMOYAttempt` נשמר 1:1 (תוסף קטן + 4 שורות). `getMOYStatus` נשמר 1:1 (additive שדה אחד).
- ✅ סוכן 9 (B.7 · `0dbbf4e`) — `AvneiInterventions.detectForStudent` נקרא בלבד. לא נגעתי ב-`interventions.js` ולא ב-5 ה-JSONs.
- 🟡 קבוצה Z (סוכן 15 — F.21A Finding B `setTimeout(boot, 0)`) — חופף ב-`_handoff/` files בלבד (3 docs). **לא חופף ב-`teacher-rama.html`** — לא נגעתי. אם Z נדחפה ראשונה: `git pull --rebase` + פתור merge conflicts ב-3 docs בשמירת שתי התרומות.
- 🟡 קבוצה Y (סוכן 13 — Finding A + ניסיון Finding B) — חופף ב-3 docs. אותו טיפול.
- 🟡 קבוצה X (סוכן 10 — MOY-Lite) — נדחפה כבר (`93dbd4a` + `7a70a03`). אין חפיפת קוד; אני מרחיב את `assessments.js` שכבר ב-origin.
- 🟡 קבוצות W/V/U/T/S/R — אין חפיפת קוד. רק 3 docs.

**🎯 פונקציות חדשות שנחשפות:**
- `AvneiAssessments.getSuggestedInterventionForAssessment(studentId, taskId?)` → `{patternId, source, match_quality, based_on_failed_tasks, details?, notice?, confidence, generated_at}` או `null`
- `AvneiAssessments.loadInterventionMap()` → המפה המאושרת (cached)
- `state.assessments.moy[sid].suggested_intervention` נוסף ל-schema (additive — קוד ישן שלא מכיר את השדה לא יישבר).

**אסור לגעת ב- (לא נגעתי):**

- `engine/moy-screener.html` (auto-trigger ב-`recordMOYAttempt` עושה את העבודה)
- `underwater-app/teacher-rama.html` (סוכן 13/15 פעיל; UI badge בסבב הבא)
- `interventions.js` · `bkt.js` · `epa.js` · `mastery-check.js` · `event-logger.js` · `profile-classifier.js` · `pack-bkt-bridge.js`
- `interventions/*.json` (5 קבצים)
- 22 stage-3-*.html · 7 planning packs · 2 dummy packs · `screener.html`
- 7 untracked `curriculum/packs/grade1-tashpaz/{month}.json` + `engine/demo-day2/` + `perplexity-shatil-share-2003-validation-2026-05-25.json` (תוכן של מיטל)
- מסמכי-אם + 2 ה-specs

**מה לבדוק לפני push (5-7 דקות — בעיקר אוטומטי):**

```powershell
cd c:\Users\meyta\Downloads\impactos\avnei-yesod\underwater-app

# 1. הטסט החדש
node scripts/test-moy-intervention-link.js
# → 51/51 ✓

# 2. רגרסיות — 4 ה-suites המאומתים של סוכן 15 ממשיכים ירוקים
node scripts/test-moy-assessments.js          # → 51/51 ✓
node scripts/test-interventions.js            # → 78/78 ✓
node scripts/test-pack-bridge.js              # → 75/75 ✓
node scripts/test-weakness-targeting.js       # → 38/38 ✓

# סה"כ: 293/293 ✓
```

**בדיקה ידנית (אופציונלי · 3 דקות · מאמת auto-save ב-localStorage):**

1. שרת: `cd avnei-yesod && python -m http.server 8765`
2. `http://localhost:8765/engine/moy-screener.html?student=stu-test`
3. ענה לא נכון על כל השאלות (task 3+4) → "סיימת!".
4. DevTools → Console:
   ```js
   JSON.parse(localStorage['underwater-app:assessments']).moy['stu-test']
   ```
   - אחרי attempt 1: `attempts.length===1`, `suggested_intervention===null`.
5. רענן + הריץ שוב את ה-screener (attempt 2). ענה לא נכון שוב.
6. DevTools → Console — אותה שאילתה:
   - אחרי attempt 2: `attempts.length===2`, `latest_status==='fail'`, **`suggested_intervention === { patternId: 'phonological', source: 'moy_default_fallback', match_quality: 'partial', based_on_failed_tasks: ['task_3','task_4'], notice: '...', confidence: 'low', generated_at: <ts> }`**.
   - אם לתלמידה גם יש EPA pattern → `patternId` יכול להיות `letter_knowledge` (וכו') + `source='epa_bkt_pattern'` + `match_quality='good'`.

**אזהרות שמורות:**

- ❌ אין UI חדש — לא נדרשת רגרסיה ב-teacher-rama.
- ❌ אסור לשלב moy-screener.html — auto-trigger דרך `recordMOYAttempt` מספיק.
- ❌ אסור להציג את ה-suggestion לתלמידה — רק למורה (spec MOY §5.3: "אסור להציג ציון לילדה").
- 🟢 שום API ציבורי לא נשבר — additive שדה אחד ב-`getMOYStatus` (פונקציות ישנות שלא מכירות אותו פשוט יתעלמו).
- 🟢 fallback: אם `moy-intervention-map.json` לא נטען (קובץ חסר), DEFAULT_MAP פנימי מבטיח שהלוגיקה ממשיכה לעבוד.

**הצעת message לקומיט (HEREDOC):**

```
MOY × B.7 link — חיבור MOY-Lite fail → B.7 intervention suggestion

4 ההחלטות של מיטל (28.5.2026) הוטמעו 1:1:
  Mapping = (C) Smart hybrid — EPA/sub-BKT pattern אם קיים,
            אחרת phonological עם תווית partial + notice ייעודי
  Single↔Group = (γ) Suggest + queue —
            state.assessments[sid].suggested_intervention נשמר מיד;
            F.21A יציג רק כש-group≥3 (Tier-2 RTI נשמר)
  Timing = רק אחרי attempt 2 fail (spec MOY §6 — שני כשלונות)
  UI = שניהם — Student View (badge) + F.21A Class View (group action)

קוד:
  moy-intervention-map.json (חדש · ~55 שורות) — החלטות מאושרות
    + priority list (letter_knowledge > letter_cluster > decoding >
    fluency > phonological) + notice_he פר task_3/task_4.
  assessments.js (+~140 שורות):
    loadInterventionMap() — sync XHR/fs+cache · fallback DEFAULT_MAP
    _tryEpaBktSuggestion(sid, priority) — קורא AvneiInterventions
      .detectForStudent ובוחר best לפי priority list
    _computeSuggestionFromRec(rec, sid, taskId?) — ליבת ההחלטה
    getSuggestedInterventionForAssessment(sid, taskId?) — public API
    recordMOYAttempt: אחרי 2 fails — חישוב + שמירה אוטומטית
    getMOYStatus: חושף suggested_intervention ב-return

test-moy-intervention-link.js (חדש · ~260 שורות):
  11 בלוקים · 51/51 ✓ · Mock localStorage + AvneiInterventions
  אופציונלי (לבדוק גם fallback וגם EPA hit נפרדים).

לא נגעתי: moy-screener.html (auto-trigger ב-recordMOYAttempt עובד) /
teacher-rama.html (סוכן 13/15 פעיל; UI badge בסבב הבא) /
interventions.js / bkt.js / epa.js / mastery-check.js /
event-logger.js / pack-bkt-bridge.js / interventions/*.json /
22 stage-3-*.html / 7 packs / מסמכי-אם / 2 specs.

אימות: 293/293 ✓
  test-moy-intervention-link.js (חדש) — 51/51
  test-moy-assessments.js (רגרסיה) — 51/51
  test-interventions.js (רגרסיה) — 78/78
  test-pack-bridge.js (רגרסיה) — 75/75
  test-weakness-targeting.js (רגרסיה) — 38/38

Specs ב-_handoff/:
  2026-05-28-MOY-diagnostic-spec.md (סוכן 10 הבסיס)
  2026-05-28-B7-interventions-spec.md (סוכן 9 הבסיס)
  moy-intervention-map.json (החלטות סוכן 14 — אישרה מיטל)
```

---

## 🟢 קבוצה Z — F.21A Finding B נסגר (setTimeout(boot, 0))

**סטטוס:** 🟢 Finding B ✅ closed — ממתין לבדיקה ידנית של מיטל (F5 על מסך מאומת)
**תאריך:** 2026-05-28 ערב מאוחר (סוכן 15)
**1 קובץ קוד שונה + 3 handoff updates · חבילה זעירה (~4 שורות net)**

| # | קובץ | סטטוס | הערה |
|---|---|---|---|
| 1 | `underwater-app/teacher-rama.html` | שינוי | 2 שורות: `boot()` → `setTimeout(boot, 0)` ב-IIFE של PIN-gate (PIN-bypass + PIN-submit). פותר TDZ של `_activeGroups` בשורה ~2332. |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד התיקון |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו |
| + | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי קל | Finding B סומן closed |

**מהות התוצר:**
המשך ישיר לקבוצה Y (סוכן 13, `bf258b5`). סוכן 13 זיהה root cause נכון אבל לא יישם — הצעתו היתה לעטוף `boot()` ב-`setTimeout(boot, 0)`. סוכן 15 יישם.

**מנגנון:**
`setTimeout(fn, 0)` דוחה ל-macrotask הבא, אחרי שכל ה-`<script>` הנוכחי הסתיים. עד אז כל ה-`let _activeGroups = []` (שורה ~2332) ו-`let`/`const` declarations אחרים שבאמצע הסקריפט הגיעו → ה-TDZ הסתיים → `render() → renderInterventionTriggers()` יכול לגשת אליהם בבטחה.

**אימות אוטומטי:** 242/242 ✓ (4 suites).

**ממתין מהמתמרצת:** F5 ידני ב-browser → טבלה נטענת (לא דף ריק).

**יחס לקבוצות שכבר נדחפו / ממתינות:**
- ✅ קבוצה Y (Finding A · `bf258b5`) — לא נגעתי. הזזת declarations נשארה.
- 🟡 קבוצה W (C.12C, סוכן 12) — packs JSONs בלבד, אין חפיפה.
- 🟡 קבוצות אחרות — אין חפיפת קבצים.

**אסור לגעת ב- (לא נגעתי):**
- 7 `curriculum/packs/grade1-tashpaz/{month}.json` untracked (תוכן של מיטל).
- `engine/demo-day2/` untracked.
- `perplexity-shatil-share-2003-validation-2026-05-25.json` untracked.
- כל קוד אחר חוץ מ-2 השורות ב-`teacher-rama.html`.

---

## 🟡 קבוצה Y — B.7 Finding A סגור · F.21A Finding B ניסיון תיקון לא הצליח

**סטטוס:** 🟢 Finding A ✅ closed · 🔴 Finding B ❌ עדיין פתוח (push לשמר state הנוכחי ל-debugging הבא)
**תאריך:** 2026-05-28 ערב (סוכן 13)
**1 קובץ קוד שונה + 3 handoff updates · חבילה קטנה (~30 שורות net)**

| # | קובץ | סטטוס | הערה |
|---|---|---|---|
| 1 | `underwater-app/teacher-rama.html` | שינוי | 2 תיקונים: (A) helper `_getGroupSharedLetterDetails` שמחשב top-3 most-shared weak letters בקבוצה + העברה ל-`interpolateScript` כ-studentDetails ב-`openInterventionModal` וב-`printInterventionGroup`. (B) הזזת `const STUDENTS_KEY / PULSE_RANGES / STALE_*` ו-`let viewState` לפני ה-IIFE של PIN-gate (היו אחריו → TDZ ב-F5 refresh עם `sessionStorage auth=1`). |
| + | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי קל | B.7 — 2 findings סומנו closed |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד התיקונים + השפעה + tests pass |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו |

**מהות התוצר:**
התייחסות ל-2 ה-findings שתועדו ב-orchestrator סיכום ערב 28.5 (commit `fc4b5b7`, סוכן verification חיצוני):
- **Finding A** (B.7) — ✅ **closed (verified ידנית ע"י מיטל):** ב-Letter Cluster intervention, ה-script מכיל `{personalized_letters}` ו-`{personalized_first_letter}` ב-Materials/HOOK. `groupCommonDetails` ריק (האותיות פר-ילדה) → ה-placeholders נשארו כטקסט מילולי ב-Modal וב-PDF. תיקון: pre-compute top-3 most-shared weak letters בקבוצה (ע"י ספירת הופעות אותיות ב-`s.details.weak_letters` לכל הילדות) והעבר כ-`studentDetails` ל-`interpolateScript` (הסיגנאטורה כבר תמכה). הכרטיסים פר-ילדה ממשיכים להציג את האותיות הספציפיות שלה (לא שונה).
- **Finding B** (F.21A · pre-existing מ-`54e00ec`) — ❌ **עדיין פתוח · ניסיון תיקון לא הצליח:** השערה שלי היתה — IIFE `initPinGate` קרא ל-`boot()` synchronously ב-PIN-bypass path (`sessionStorage auth=1`), אבל `const STUDENTS_KEY` / `let viewState` הוצהרו אחריו → TDZ. **תיקון שניסיתי:** הזזת ה-declarations לפני ה-IIFE (אופציה 2 הנקייה מה-handoff). **תוצאה:** מיטל בדקה ידנית — F5 refresh עדיין שובר את הדף. הזזת `viewState`/`STUDENTS_KEY` לבדם לא הספיקה. **חשד שלי לroot cause האמיתי** (לחקירה בסבב הבא · לא תוקן עכשיו): יש עוד `let` declarations שמוצהרים הרבה אחרי IIFE ושנגישים מ-render() — בעיקר `let _activeGroups = []` ב-שורה 2332 (מוגדר ב-section של renderInterventionTriggers, באמצע הסקריפט). `boot()` → `render()` → `renderClassView()` → `renderInterventionTriggers()` שמתייחס ל-`_activeGroups` — אם הוא ב-TDZ → exception, body.innerHTML לא מתעדכן, דף ריק. הפתרון הסביר: לעטוף `boot()` ב-`setTimeout(boot, 0)` או `queueMicrotask(boot)` בשני המקומות ב-IIFE — יבטיח שכל ה-script tag הסתיים לפני שboot() רץ. **הקוד הנוכחי נשאר ככה לפי הוראת מיטל** — הזזת declarations לא רגרסיה, אולי צעד נכון לקראת פתרון, אולי לא; דחיפת ה"ניסיון" עוזרת ל-debugging הבא.

**יחס לקבוצות שכבר נדחפו / ממתינות:**
- ✅ B.7 (`0dbbf4e`) — תיקון UI fail-soft. ה-data של `letter-cluster.json` לא נגעתי בה. `js/shared/interventions.js` לא נגעתי בה (ה-signature `interpolateScript(script, groupCommonDetails, studentDetails)` כבר תומכת ב-`weak_letters` → `personalized_letters`).
- 🟡 F.21A (`54e00ec`) — ניסיתי fix, לא הצליח. הקוד נשאר במצב "declarations הוזזו" — Finding B עדיין דורש חקירה.
- ✅ MOY-Lite (`93dbd4a` + `7a70a03`, סוכן 10+12) — נדחפו לפני הסבב שלי. סוכן 12 גם תיקן `backToTeacher → history.back()` ב-`moy-screener.html` (`7a70a03`) שפתר תרחיש שונה של "דף ריק אחרי refresh" (מ-moy-screener). זה לא ה-Finding B שלנו — Finding B הוא F5 ידני על teacher-rama עצמה.
- 🟡 קבוצה W (C.12C, סוכן 12) — packs JSONs בלבד, אין חפיפת קוד.
- 🟡 קבוצות אחרות (V/U/T/S/R) — אין חפיפת קבצים.

**🎯 פונקציה חדשה שמתווספת ל-teacher-rama:**
`_getGroupSharedLetterDetails(group)` — internal helper, חוזרת `null` ל-patternId שאינו `letter_cluster`. לא נחשפת ל-window.

**אסור לגעת ב- (לא נגעתי):**
- `interventions.js` · `letter-cluster.json` · 4 ה-interventions/*.json אחרים
- `mastery-check.js` · `bkt.js` · `pack-bkt-bridge.js` · `assessments.js` · `state.js`
- `engine/moy-screener.html` / `engine/moy-items.json` (סוכן 12 פעיל שם)
- 7 `curriculum/packs/grade1-tashpaz/{month}.json` untracked + `perplexity-shatil-share-2003-validation-2026-05-25.json` (תוכן של מיטל)

**מה כבר אומת (לפני push):**

1. **בדיקות אוטומטיות** — כל 4 ה-suites ירוקים:
   - `test-interventions.js` → **78/78 ✓**
   - `test-pack-bridge.js` → **75/75 ✓**
   - `test-weakness-targeting.js` → **38/38 ✓**
   - `test-moy-assessments.js` → **51/51 ✓**
   - **סה"כ 242/242 ✓** (כולם רצים ב-Node — לא משקפים F5 בbrowser)
2. **Finding A — מאומת ידנית ע"י מיטל:** ✅ closed.
3. **Finding B — מאומת ידנית ע"י מיטל:** ❌ עדיין שובר. F5 → דף ריק.

**TODO לסבב הבא (Finding B — לא בסקופ של commit הזה):**
- אסוף DevTools Console output ממיטל אחרי F5 על מסך מאומת.
- בדוק את ה-`let _activeGroups = []` ב-שורה 2332 (TDZ candidate).
- אם זה הroot cause: עטף `boot()` ב-`setTimeout(boot, 0)` בשני המקומות ב-IIFE.
- בדוק אם dependencies חיצוניים (`AvneiBKT`, `AvneiMasteryCheck`, `AvneiInterventions`) נטענו בזמן.

**אזהרות שמורות:**
- ❌ אין להוסיף features. רק תיקון Finding A + ניסיון Finding B (שנשמר ב-state הנוכחי).
- ❌ אין לגעת ב-content/data של interventions.
- 🟢 RTL נשמר ✓
- 🟢 כל ה-API הציבורי לא השתנה ✓

---

## 🟡 קבוצה X — MOY-Lite: Middle of Year Diagnostic (תשתית · משימות 3+4)

**סטטוס:** 🟡 ממתין לבדיקה ידנית של מיטל ואז push
**תאריך:** 2026-05-28 ערב
**5 קבצים חדשים + 1 שינוי + 3 handoff updates · חבילה אחת**

| # | קובץ | סטטוס | הערה |
|---|---|---|---|
| 1 | `underwater-app/js/shared/assessments.js` | **חדש** (~220 שורות) | API חדש: `recordMOYAttempt` · `getMOYStatus` · `getDueAssessments` + 4 helpers · `STORAGE_KEY=underwater-app:assessments` (נפרד מ-events) |
| 2 | `engine/moy-screener.html` | **חדש** (~430 שורות) | UI תלמידה. AvriNeural mp3 + text fallback. לא מציג ציון לילדה. ?student=<id>. |
| 3 | `engine/moy-items.json` | **חדש** | 2-3 dummy items פר משימה 3 (קטע + שאלות) ו-4 (3 שאלות מודעות לשונית). תוכן מלא = של מיטל |
| 4 | `underwater-app/scripts/test-moy-assessments.js` | **חדש** (~250 שורות) | 10 בלוקים · **51/51 assertions ✓** |
| 5 | `underwater-app/teacher-rama.html` | שינוי | script tag חדש (`assessments.js?v=1`) + ~140 CSS lines + Section 6 ב-Student View (~115 JS) — סטטוס + 2 כפתורים + אזהרה "לא תחליף למבדק הרשמי" |
| + | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי קל | MOY-Lite ✅ ב-2 מקומות (סיכום + רשימת משימות) |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד MOY-Lite מלא (4 החלטות שהוטמעו, API חדש, יחס לקבוצות אחרות) |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו |

**מהות התוצר:**
מימוש 1:1 של `_handoff/2026-05-28-MOY-diagnostic-spec.md` — תשתית MOY-Lite שמדמה את משימות 3+4 של ראמ"ה (הבנת טקסט מושמע · מודעות לשונית), שומרת ל-`state.assessments.moy[sid].attempts[]`, ומציגה למורה ב-teacher-rama Section 6. **לא תחליף למבדק ראמ"ה הרשמי 1-on-1** — אלא תוסף ל-Tier 1 שמספק signal ל-BKT ול-teacher-rama. תוכן מלא (60 פריטים + 6 קטעי שמע) = משימה פדגוגית של מיטל, לא בסקופ סוכן הקוד.

**יחס לקבוצות שכבר נדחפו / ממתינות:**
- ✅ A.1 / A.3 / A.4 / A.5 / F.21A · B.7 (`0dbbf4e`) — קוראים בלבד.
- ✅ C.11+C.12+C.13 (`ea81ce6`) + C.12B (`9578194`) — Section 6 שלי **אחרי** Section 5 (Pack), בלי קונפליקט.
- 🟡 קבוצה W (C.12C) — עובדת על packs JSONs (`curriculum/packs/grade1-tashpaz/`). **אין חפיפת קבצי קוד.** רק handoff files (tracker + agent-completion-log + pending-commits) משותפים — אם W נדחפה ראשונה: `git pull --rebase`, פתור merge conflict בכל קובץ handoff בשמירת שתי התרומות.
- 🟡 קבוצה V (B.7) — אין חפיפת קבצים. הוספתי script tag נפרד אחרי `interventions.js?v=1`.
- 🟡 קבוצה U (C.12B) + T + S + R — אין חפיפת קבצים.

**🎯 פונקציות חדשות שנחשפות:**
`window.AvneiAssessments` עם 7 פונקציות + 3 constants. שמורות לעתיד: BOY/EOY API (state.boy / state.eoy כבר במבנה), F.21E (action dashboard), G.X (parent-view).

**אסור לגעת ב- (לא נגעתי):**
- `bkt.js` · `epa.js` · `mastery-check.js` · `event-logger.js` · `pack-bkt-bridge.js` · `interventions.js` · `state.js` (קוראים בלבד)
- 22 stage-3-*.html · onboarding · 5 packs · `engine/screener.html` (BOY הקיים)
- מסמכי-אם (`architecture-mvp.md` · `pedagogy-integration-framework.md` · `literacy-grade1-2-yearly.md` · `llm-pitfalls.md`)
- spec עצמו (`2026-05-28-MOY-diagnostic-spec.md`)

**מה לבדוק לפני push (10-15 דקות):**

1. שרת: `cd avnei-yesod && python -m http.server 8765`
2. `http://localhost:8765/underwater-app/teacher-rama.html` — PIN `4521`
3. **רגרסיה Student View:** סטרנדים, אותיות, EPA, RAMA tasks, Pack Section עדיין מתפקדים — לא נגעתי בהם.
4. בחרי תלמידה ב-Student View → גלגלי לסעיף החדש **"📋 הערכת אמצע שנה (MOY)"** (אחרי Section 5 — Pack).
5. וודאי שמופיע: סטטוס + אזהרה כתומה "לא תחליף למבדק הרשמי" + 2 כפתורים.
6. לחצי **"📋 הפעילי MOY-Lite"** → נטענת `moy-screener.html?student=<id>`.
7. במסך התלמידה: כפתור "התחילי" → טסק 3 (אם אין mp3 — fallback טקסט עם הסיפור על יוסי) → "הקשבתי" → 3 שאלות → טסק 4 → 3 שאלות → "מצוין, סיימת!".
8. **לוודא** שאין רמז על נכון/לא נכון בזמן הבחירה — רק מעבר חלק.
9. **לוודא** שאין ציון מוצג לילדה במסך הסיום — רק "מצוין, סיימת!".
10. לחצי "חזרה למסך המורה" → ב-Section 6 עכשיו מופיע סטטוס מעודכן (pass/near/fail + תאריך).
11. **בדיקה אוטומטית:** `cd underwater-app && node scripts/test-moy-assessments.js` → 51/51 ✓.
12. **רגרסיה:** `node scripts/test-cold-start.js && node scripts/test-interventions.js && node scripts/test-pack-bridge.js && node scripts/test-weakness-targeting.js` — כל הבדיקות הקיימות עדיין ירוקות.

**אזהרות שמורות מ-spec:**
- ❌ אין להציג ציון לילדה (evaluation, לא תרגול)
- ❌ אסור להשתמש בפריטי MOY-Lite כתרגול רגיל — זיהום BKT
- ❌ AvriNeural בלבד (כל המשימות מבוססות שמיעה)
- 🟢 RTL מלא ✓
- 🟢 פריטי dummy מסומנים `is_dummy: true` + אזהרה ב-`_meta` של ה-JSON

---

## 🟡 קבוצה W — C.12C עדכון Tier model ב-Dummy Packs (rev1 → rev2)

**סטטוס:** 🟡 ממתין לאישור push ממיטל (קוד + 113 בדיקות עוברות)
**תאריך:** 2026-05-28 ערב
**3 קבצים שונו + 3 handoff updates · חבילה קטנה · תלוי בקבוצה U (C.12B) שעדיין ממתינה לדחיפה**

| # | קובץ | סטטוס | הערה |
|---|---|---|---|
| 1 | `curriculum/packs/grade1-tashpaz/september-2026.json` | שינוי גדול | rev1 → rev2: Tier=רמה במקום Tier=תוכן. כל ה-tiers משתמשים באותן 4 אותיות (ש·ל·נ·א), רק המכניקה והאתגר משתנים. T1=tap-all no-distractors · T2=tap-all+pick with-distractor · T3=memory-pair+pick with-niqud · T4=memory-pair+sort discrimination. הוסרו `items_distribution`, `type:review`, `source_letter`, `source_island`. נשמרו `letters_involved` ו-`allows_weakness_targeting:false`. 19 פריטים סה"כ. |
| 2 | `curriculum/packs/grade1-tashpaz/january-2026.json` | שינוי גדול | rev1 → rev2: T1=פותח בלבד (no-distractor) · T2=פותח+סוגר (with-distractor) · T3=הברות (חלוקה/ספירה/התאמה with-niqud) · T4=פונמות (isolation/deletion/blending). שמר `focus_mode:strand` + `allows_weakness_targeting:false`. הוסיף `sub_skill` ב-כל פריט. 13 פריטים סה"כ. |
| 3 | `underwater-app/scripts/validate-pack.js` | שינוי מינימלי | הוסרה חובת `type` (בוטל ב-rev2). שינוי לוגיקת `letters` mode: דרוש `letter` בכל פריט (לא רק כש-`type:new`). הוסר check של `source_letter` (type:review בוטל). strand-focused לא השתנה. |
| + | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי קל | +שורת `C.12C` בפאזה C |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד C.12C מלא (rev2 model, מה השתנה, יחס ל-C.12B) |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו |

**מהות התוצר:**
ניקוי קצוות לבסיס Tier=רמה. סוכן 8 (C.11+C.12+C.13) בנה dummy packs לפי rev1 (Tier=תוכן: T1=אותיות מאיים קודמים, T2=הפאק החדש). אבל ה-spec rev2 (28.5) עבר ל-Tier=רמה (אותו תוכן, רמות קושי שונות) — מבוסס Cognitive Load Theory. C.12C מעדכן את 2 ה-dummy packs כך שמשקפים את ה-spec הסופי. **לא קוד — רק dummy data + תיקון validator מינימלי.** ה-bridge של C.12 + ה-weakness targeting של C.12B כבר תאימים ל-rev2 (לא נגעתי בקוד).

**יחס לקבוצות שכבר נדחפו / ממתינות:**
- ✅ קבוצה T (C.11+C.12+C.13 · `ea81ce6`) — לא דרסתי קוד. ה-packs שיניתי שונים בתכולה אבל אותו schema. ה-`getItemsForStudent` של C.12 ממשיך לעבוד.
- ✅ קבוצה U (C.12B · ממתין לדחיפה) — מוסיף ל-`letters_involved` ול-`allows_weakness_targeting:false` שכבר היו ב-rev1. ב-rev2 נשמרים אותם שדות. אין רגרסיה — 38/38 של test-weakness-targeting ממשיכים לעבור.
- ✅ קבוצה V (B.7) — אין חפיפת קבצים.
- 🟡 קבוצה S (E.17+E.18) — אין חפיפת קבצים.

**🎯 שינויי schema במסמכי-data:**
- אין שדות API חדשים — רק שינוי תוכן ב-dummy packs.
- `schema_version` ב-metadata עלה מ-`1.0` ל-`2.0` בשני ה-packs.
- נוסף `tier_model: "rev2"` ו-`spec_ref` ב-metadata.

**אסור לגעת ב- (לא נגעתי):**
- `pack-bkt-bridge.js` · `bkt.js` · `epa.js` · `mastery-check.js` · `event-logger.js` · `profile-classifier.js`
- `teacher-rama.html`
- 22 stage-3-*.html
- 7 ה-planning packs של מיטל (september.json/october.json/...january.json/february.json/march.json בלי suffix "-2026")
- מסמכי-אם (כולל spec rev2 עצמו)

**מה לבדוק לפני push (3 דקות — בדיקה אוטומטית בלבד, אין UI חדש):**

```bash
cd c:/Users/meyta/Downloads/impactos/avnei-yesod

# 1. Validation על 2 ה-packs המעודכנים
node underwater-app/scripts/validate-pack.js ../curriculum/packs/grade1-tashpaz/september-2026.json
node underwater-app/scripts/validate-pack.js ../curriculum/packs/grade1-tashpaz/january-2026.json
# → ✅ × 2

# 2. רגרסיה — C.12 (75/75)
node underwater-app/scripts/test-pack-bridge.js
# → 75/75 ✅

# 3. רגרסיה — C.12B (38/38)
node underwater-app/scripts/test-weakness-targeting.js
# → 38/38 ✅
```

**אין UI לבדיקה ידנית** — שינוי dummy data בלבד, ה-bridge לא נשבר.

**הצעת message לקומיט (HEREDOC):**
```
C.12C — עדכון Tier model ב-Dummy Packs (rev1 → rev2)

מימוש 1:1 של _handoff/2026-05-28-C11-C12-C13-pack-bkt-spec-rev2.md
§3 + §9 + §11. ניקוי קצוות לבסיס Tier=רמה (Cognitive Load Theory).

september-2026.json (letters-focused · ש·ל·נ·א):
  T1 בסיסי — tap-all בלבד · no-distractors · 5 פריטים
  T2 ליבה — tap-all + pick · with-distractor · 5 פריטים
  T3 מתקדם — memory-pair + pick · מילים שלמות עם ניקוד · 4 פריטים
  T4 מאסטר — memory-pair + sort-by-letter · discrimination · 5 פריטים
  כל ה-tiers על אותן 4 אותיות — רק רמת הקושי משתנה.

january-2026.json (strand-focused · מודעות פונולוגית):
  T1 בסיסי — מודעות פותח בלבד · no-distractors · 3 פריטים
  T2 ליבה — פותח + סוגר · with-distractor · 3 פריטים
  T3 מתקדם — הברות (חלוקה/ספירה/התאמה) · with-niqud · 3 פריטים
  T4 מאסטר — פונמות (isolation/deletion/blending) · 4 פריטים
  נשמר focus_mode:strand + strand_breakdown הקיים.

הוסרו (§11 — מבוטל מ-rev1):
  ❌ items_distribution: {new:0.3, review:0.7} ב-Tier 4
  ❌ type:"review" / type:"new" בכל פריט
  ❌ source_letter / source_island

נשמרו (מ-C.12B):
  ✅ letters_involved בכל פריט
  ✅ allows_weakness_targeting:false (ספטמבר+ינואר — עדיין אין היסטוריה)

validate-pack.js — תיקון מינימלי:
  הוסרה חובת `type` (בוטל ב-rev2).
  letters-focused: דורש `letter` בכל פריט (לא רק type:new).
  strand-focused: דורש `skill` (כקודם).

לא נגעתי: pack-bkt-bridge.js / bkt.js / epa.js / mastery-check.js /
event-logger.js / teacher-rama.html / 22 stage-3-*.html /
7 planning packs של מיטל (september.json וכו' בלי "-2026" suffix) /
מסמכי-אם / spec rev2 עצמו.

113 assertions עוברים:
  validate-pack ✓ 2/2 packs תקפים
  test-pack-bridge ✓ 75/75 (C.12 רגרסיה)
  test-weakness-targeting ✓ 38/38 (C.12B רגרסיה)

תלוי בקבוצה U (C.12B · ממתין לדחיפה) — אם U עדיין לא ב-origin,
לדחוף קודם U ואז W.
```

---

## 🟡 קבוצה V — B.7 Targeted Reading Interventions (חוויית מורה — משלים את F.21A)

**סטטוס:** 🟡 ממתין לבדיקה ידנית של מיטל ואז push
**תאריך:** 2026-05-28
**7 קבצים חדשים + 2 שינויים + 3 handoff updates · חבילה אחת**

| # | קובץ | סטטוס | הערה |
|---|---|---|---|
| 1 | `underwater-app/interventions/phonological.json` | **חדש** | מודעות פונולוגית · 5 שלבים (Rosenshine/Pearson&Gallagher) |
| 2 | `underwater-app/interventions/letter-knowledge.json` | **חדש** | ידיעת אותיות · placeholders {letter_a}{letter_b}{example_a}{example_b}{distinction} |
| 3 | `underwater-app/interventions/decoding.json` | **חדש** | פענוח לפי הקשר (תחילה/אמצע/סוף) · placeholder {target_letter} |
| 4 | `underwater-app/interventions/fluency.json` | **חדש** | שטף קריאה (≤25 שנ' / 10 מילים) |
| 5 | `underwater-app/interventions/letter-cluster.json` | **חדש** | חיזוק 3 אותיות חלשות פר ילדה · placeholders {personalized_letters}{personalized_first_letter} |
| 6 | `underwater-app/js/shared/interventions.js` | **חדש** (~580 שורות) | 8 פונקציות API + 4 constants · 5 detectors + group aggregation + interpolateScript + storage |
| 7 | `underwater-app/scripts/test-interventions.js` | **חדש** (~410 שורות) | 10 בלוקים · **78/78 assertions ✓** |
| 8 | `underwater-app/teacher-rama.html` | שינוי | script tag חדש (`interventions.js?v=1`) + ~210 CSS lines + `<div id="interventionTriggers">` ב-Class View + `<div id="iv-print-area">` בסוף body + ~310 JS lines (5 פונקציות UI חדשות) |
| + | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי קל | B.7 ⏳ → ✅ ב-2 מקומות (סיכום + רשימת משימות) |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד B.7 מלא (5 החלטות שהוטמעו, API חדש, יחס לקבוצות אחרות) |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו |

**מהות התוצר:**
B.7 משלים את F.21A — הכפתור "פתחי קבוצת תמיכה" במסך מורה כעת **עובד בפועל**. F.21A יודע להציג איזו תלמידה לא תקינה, B.7 יודע לזהות 3+ ילדות עם דפוס שגיאה משותף ולתת למורה script פדגוגי מוכן להדפסה (Tier-2 RTI). זה רגע חשוב — מהפך מ"דשבורד שמראה בעיות" ל"דשבורד שמציע פעולה ספציפית מבוססת מחקר".

**יחס לקבוצות שכבר נדחפו / ממתינות:**
- ✅ A.3 (EPA) · A.4 (Sub-BKT) · F.21A (`54e00ec`) — קוראים בלבד את ה-API שלהן. לא נגעתי בקבצים.
- ✅ A.5 (`a171a74`) — אין חפיפה. ה-banners של B.7 מעל הטבלה, לא בקונפליקט עם cold-start banner.
- ✅ C.11+C.12+C.13 (`ea81ce6`) — לא נגעתי. ה-modals נפרדים (`tier-modal` vs `iv-modal`). עמודת Tier ב-Class View נשארה כפי שהיא.
- 🟡 קבוצה U (C.12B) — אין חפיפת קבצים (קבוצה U רק שינתה pack-bkt-bridge.js + teacher-rama.html ב-renderClassView/Section 5, B.7 הוסיפה רק מעל ה-table).
- 🟡 קבוצה S (E.17+E.18) — אין חפיפת קבצים.

**🎯 פונקציות חדשות שנחשפות:**
`window.AvneiInterventions` עם 8 פונקציות + 4 constants. שמורה לעתיד: B.8 (matcher) · B.9 (group suggester) · F.21E (action dashboard).

**אסור לגעת ב- (לא נגעתי):**
- `bkt.js` · `epa.js` · `mastery-check.js` · `event-logger.js` · `profile-classifier.js` · `pack-bkt-bridge.js` (קוראים בלבד)
- 22 stage-3-*.html · onboarding · 5 packs קיימים
- מסמכי-אם (architecture-mvp / pedagogy-integration-framework / literacy-grade1-2-yearly / llm-pitfalls)
- spec עצמו (`2026-05-28-B7-interventions-spec.md`)

**מה לבדוק לפני push (10-15 דקות):**

1. שרת: `cd avnei-yesod && python -m http.server 8765`
2. `http://localhost:8765/underwater-app/teacher-rama.html` — PIN `4521`
3. **רגרסיה Class View:** עמודות + Tier + Cold-start badges עדיין מתפקדים (כל ה-features מ-F.21A/A.5/C.11-C.13 לא נשברו).
4. **B.7 banners — לבחון אם מופיעים:**
   - אם יש דאטה אמיתי של 3+ ילדות עם דפוס משותף — banner יופיע מעל הטבלה.
   - אם אין — אין banner. זה תקין (הקבוצה לא מספיק "פצועה" עדיין לאינטרבנציה).
   - לבדיקה זריזה: צרי 3 תלמידות + ב-localStorage הזריקי דאטה ל-BKT שיוצר טריגר (לדוגמה: 3 ילדות עם מ+ם < 0.40, או 3 ילדות עם sub-BKT.weak ≥ 3).
5. **לחיצה על "📋 פתחי קבוצת תמיכה":**
   - Modal נפתח עם title + ילדות + 5 שלבים מוצגים.
   - Placeholders מולאו אוטומטית (לדוגמה במ↔ם, ה-`{letter_a}` מוחלף ב-"מ").
6. **כפתור "📥 הורד / הדפסה ל-PDF":**
   - דיאלוג הדפסה של הדפדפן נפתח.
   - תצוגה מקדימה: דף אחד עם title + מטרה + ילדות + חומרים + 5 שלבים. RTL נכון, ניקוד שלם.
   - "Save as PDF" של Chrome/Edge נותן PDF נטיבי.
7. **כפתור "✓ סמני שביצעתי היום":**
   - 3 prompts (success_check, duration, note).
   - אחרי השמירה — modal נסגר ויוצר אירוע ב-localStorage:
   ```js
   JSON.parse(localStorage['avnei-interventions-v1'])
   ```
   צריך להציג record פר ילדה בקבוצה.
8. **טסטים אוטומטיים:**
   ```bash
   node avnei-yesod/underwater-app/scripts/test-interventions.js
   # → 78/78 ✅
   ```

**שאלות פתוחות:**
- **תוכן 5 ה-scripts:** המבנה 1:1 מ-spec, אבל התוכן יכול להיערך פדגוגית פר-קובץ-JSON ע"י מיטל בקצב שלה (אין שינוי קוד נדרש).
- **`target_letter` ב-Decoding:** ברירת מחדל = "ל". בעתיד אפשר להוסיף UI לבחירה.
- **cold-start gating:** A.5 משתיקה flags. ה-banners של B.7 כרגע לא משתיקות אצל cold-start — אם רוצים, P1 קל לסינון.

**לפני push (חובה — סביבת ריבוי-סוכנים):**
```
git fetch origin && git status
```

**הצעת message לקומיט (HEREDOC):**
```
B.7 — Targeted Reading Interventions (5 דפוסים · Tier-2 RTI)

מימוש 1:1 של _handoff/2026-05-28-B7-interventions-spec.md
(10 סעיפים, 8 acceptance criteria). 5 ההחלטות של מיטל (28.5) הוטמעו 1:1.

5 קבצי JSON ב-underwater-app/interventions/:
  phonological / letter-knowledge / decoding / fluency / letter-cluster
  כל אחד: 5 שלבים (Hook → Model → Guided → Independent → Success Check)
  Rosenshine 2012 + Pearson & Gallagher 1983 (I do/We do/You do)
  Placeholders: {letter_a}{letter_b}{example_a}{example_b}{distinction}
                {personalized_letters}{personalized_first_letter}{target_letter}

js/shared/interventions.js (~580 שורות):
  loadScript · preloadAll (sync XHR/fs · cache)
  detectForStudent — 5 detectors (Phonological/LetterKnowledge/Decoding/Fluency/LetterCluster)
  detectGroupTriggers — class-level (3+ ילדות עם דפוס משותף)
    Letter Knowledge — bucket פר זוג מ-CONFUSED_PAIRS (9 פדגוגיים)
    Decoding — bucket פר position
    Fluency — class P75 baseline
    Letter Cluster — אישי (אותיות פר ילדה)
  interpolateScript — deep clone + מילוי {placeholders}
  recordIntervention / getInterventionsFor / resetInterventions
  state.interventions ב-localStorage (avnei-interventions-v1)

UI ב-teacher-rama.html (אדיטיבי בלבד):
  ~210 שורות CSS (banners + modal + 5-stage cards + print stylesheet)
  Class View — div#interventionTriggers מעל הטבלה
    renderInterventionTriggers(students) → detectGroupTriggers + banners
    banner: אייקון + שם דפוס + ילדות + ביטחון + "📋 פתחי קבוצת תמיכה"
  openInterventionModal — preview עם 5 שלבים + meta + materials + history
  קבוצה captured ב-closure (snapshotGroup) — עמיד לאוטו-refresh
  re-render banners מושעה כש-modal פתוח (מונע השמטת reference)

PDF — window.print() עם print stylesheet (0 תלויות):
  printInterventionGroup → #iv-print-area + body.iv-printing + window.print()
  RTL+ניקוד עברי נטיביים · A4 מובטח · "Save as PDF" של הדפדפן

Success Check + תיעוד:
  promptInterventionDoneForGroup → 3 prompts קצרים
  שומר ב-localStorage: date / pattern / pattern_details / group_size /
    group_students / duration_minutes / success_check / teacher_note
  per_student_letters עבור Letter Cluster

scripts/test-interventions.js — 78/78 assertions ✓
  10 בלוקים — API surface · loadScript מ-fs · 5 detectors בנפרד ·
  detectGroupTriggers · interpolateScript · recordIntervention + storage
  Mock: localStorage + AvneiBKT + AvneiEPA

לא נגעתי: bkt.js / epa.js / mastery-check.js / event-logger.js /
profile-classifier.js / pack-bkt-bridge.js / 22 stage-3-*.html /
5 packs קיימים / מסמכי-אם.

Spec ב-_handoff/2026-05-28-B7-interventions-spec.md.
```

---

## 🟡 קבוצה U — C.12B Weakness Targeting (incremental על קבוצה T)

**סטטוס:** 🟡 ממתין לבדיקה ידנית של מיטל ואז push
**תאריך:** 2026-05-28 ערב
**4 קבצים שונו + 1 קובץ חדש + 3 handoff updates · חבילה אחת קטנה · תלוי בקבוצה T (ea81ce6 כבר ב-origin)**

| # | קובץ | סטטוס | הערה |
|---|---|---|---|
| 1 | `underwater-app/js/shared/bkt.js` | שינוי | +`getWeakLetters(studentId, options)` חדש (~30 שורות) — top-N אותיות חלשות עם threshold + minAttempts + max. ייצוא ב-API. |
| 2 | `underwater-app/js/shared/pack-bkt-bridge.js` | שינוי | +4 constants (`WEAKNESS_THRESHOLD`=0.40 · `MIN_ATTEMPTS_FOR_WEAK`=5 · `MAX_WEAK_LETTERS_TARGETED`=3 · `TARGETED_RATIO`={1:0.30,2:0.70,3:0.75,4:0.70}). +`selectItemsForStudent` עם drill-sandwich (`_interleaveDrill`). `getItemsForStudent` נשמר כ-alias (backward-compat). |
| 3 | `curriculum/packs/grade1-tashpaz/september-2026.json` | שינוי | `+allows_weakness_targeting:false` + `letters_involved` ב-20 פריטים |
| 4 | `curriculum/packs/grade1-tashpaz/january-2026.json` | שינוי | `+allows_weakness_targeting:false` + `letters_involved:[]` ב-13 פריטים (strand-mode, אין אותיות) |
| 5 | `underwater-app/scripts/validate-pack.js` | שינוי | +const `ALL_HEBREW_LETTERS_22`. בדיקת `allows_weakness_targeting` boolean. בדיקת `letters_involved`: חובה כש-flag=true, array תקין אחרת. |
| 6 | `curriculum/packs/_schema.md` | שינוי | גרסה 1.1: §2 +שדה pack, §4.3 +שדה item, §4.4 תיוג, §4.5 constants. |
| 7 | `underwater-app/scripts/test-weakness-targeting.js` | **חדש** (~290 שורות) | 14 בלוקי טסט · **38/38 assertions** עוברות. Part A (`getWeakLetters`) · Part B (`selectItemsForStudent`) · Part C (Constants). |
| + | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי קל | +שורת `C.12B` בפאזה C (עם תיאור מלא) |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד מלא (7 ההחלטות, קבצים, רגרסיות, שאלות פתוחות) |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו |

**מהות התוצר:**
מה שעד עכשיו היה "Tier system" יבש (כל ילדה ב-Tier 2 מקבלת אותם פריטים) הופך ל-**דיפרנציאלי אמיתי**. ילדה שיצאה מספטמבר עם `sub-BKT(מ)=0.32` תקבל בנובמבר (פאק חיריק, `allows_weakness_targeting:true`) 70% מהפריטים שמכילים מ — מָיִם, מָלֵא — במקום מילים אקראיות.

**יחס לקבוצות שכבר נדחפו / ממתינות:**
- ✅ קבוצה T (C.11+C.12+C.13 · `ea81ce6`) — בסיס. **לא דרסתי קוד שלה.** רק הוספתי layer.
- ✅ A.4 (`getLetterMasteryDistribution`/`getPerLetterState`) — `getWeakLetters` משתמש ב-`_resolvePerLetter` הפנימי שכבר עבד פר-אות עם backfill מ-island 3.
- 🟡 קבוצה S (E.17+E.18) — אין חפיפת קבצים.

**🎯 פונקציות חדשות שנחשפות:**
- `AvneiBKT.getWeakLetters(studentId, {threshold, minAttempts, max})` → `string[]`
- `AvneiPackBridge.selectItemsForStudent(studentId, packId)` → array of items (כולל Weakness Targeting)
- `AvneiPackBridge.{WEAKNESS_THRESHOLD, MIN_ATTEMPTS_FOR_WEAK, MAX_WEAK_LETTERS_TARGETED, TARGETED_RATIO}`

**אסור לגעת ב- (לא נגעתי):**
- `epa.js` · `mastery-check.js` · `event-logger.js` · `profile-classifier.js`
- `teacher-rama.html` (UI ל-Weakness Targeting = post-MVP, לפי הבריף)
- 22 קבצי משחקונים `stage-3-*.html`
- Tier model rev1 הקיים (לפי הבריף: rev2 = C.12C עתידי, לא בסקופ C.12B)
- מסמכי-אם
- spec rev2 עצמו

**מה לבדוק לפני push (5 דקות — בדיקה אוטומטית בלבד, אין UI חדש):**

```bash
cd c:/Users/meyta/Downloads/impactos/avnei-yesod

# 1. Smoke test חדש של C.12B
node underwater-app/scripts/test-weakness-targeting.js
# → 38/38 ✅

# 2. רגרסיה — C.12 עדיין ירוק
node underwater-app/scripts/test-pack-bridge.js
# → 75/75 ✅

# 3. רגרסיה — BKT letters (A.4) עדיין ירוק
node underwater-app/scripts/test-bkt-letters.js
# → 53/0 ✅

# 4. Validation על 2 ה-packs המעודכנים
node underwater-app/scripts/validate-pack.js
# → 2/2 תקפים ✅
```

**אין UI חדש לבדיקה ידנית** — `selectItemsForStudent` עדיין לא נקרא ממשחקון (זה C.14 עתידי). ה-API מוכן לקריאה ע"י המשחקונים בשלב הבא.

---

## 🟡 קבוצה T — C.11+C.12+C.13 (Pack × BKT Integration · לב הדיפרנציאליות)

**סטטוס:** 🟡 ממתין לבדיקה ידנית של מיטל ואז push
**תאריך:** 2026-05-28
**7 קבצים חדשים + 1 שינוי + 3 handoff updates · חבילה אחת**

| # | קובץ | סטטוס | הערה |
|---|---|---|---|
| 1 | `curriculum/packs/grade1-tashpaz/september-2026.json` | **חדש** | Pack letters-focused (ש·ל·נ·א) · 4 tiers · 20 items dummy |
| 2 | `curriculum/packs/grade1-tashpaz/january-2026.json` | **חדש** | Pack strand-focused (מודעות פונולוגית) · 4 tiers · 13 items dummy |
| 3 | `curriculum/packs/_schema.md` | **חדש** (~150 שורות) | תיעוד schema מלא (8 סעיפים) · כולל הסבר על היחס ל-7 ה-planning packs הקיימים |
| 4 | `underwater-app/js/shared/pack-bkt-bridge.js` | **חדש** (~370 שורות) | 8 פונקציות API + 2 constants · sync XHR לדפדפן · fs ל-Node · localStorage override |
| 5 | `underwater-app/scripts/validate-pack.js` | **חדש** (~210 שורות) | CLI: `node validate-pack.js [file]` · 7 שכבות validation · exit 0/1/2 |
| 6 | `underwater-app/scripts/test-pack-bridge.js` | **חדש** (~290 שורות) | 16 בלוקי טסט · **75/75 assertions** עוברות |
| 7 | `underwater-app/teacher-rama.html` | שינוי | script tag + ~175 CSS lines (+50 ל-modal) + 9 helpers JS + Class View column (sticky) + Student View Section 5 + **Tier modal** (תיקון 28.5) |
| + | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי קל | C.11+C.12+C.13 ✅ × 4 שורות (3 בפאזה C + 1 ב-"מוכן להתחיל") |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד מלא (3 ההחלטות שהוטמעו, קבצים, יחס ל-A.5, שאלות פתוחות) |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו |

**מהות התוצר:**
לב הדיפרנציאליות של אבני יסוד. עד עכשיו ה-BKT/EPA זרמו פנימה ויצרו ציון, אבל **אף אחד לא בחר תוכן אדפטיבי** — כל ילדה קיבלה את אותה חוויה. C.11+C.12+C.13 בונה את החיבור: Pack JSON (מה נלמד החודש) × BKT (איפה הילדה) → **Tier אישי** (איזה תוכן מתאים לה). + UI שמורה רואה ויכולה לדרוס.

**יחס לקבוצות שכבר נדחפו / ממתינות:**
- ✅ A.1 / A.3 / A.4 — bridge רק *קורא* את ה-API (`getStudentStrands` · `getLetterState`). לא נגעתי בקבצים.
- ✅ A.5 (`a171a74`) — bootstrap הזהיר על חפיפה ב-`teacher-rama.html`, בפועל A.5 נדחף לפני שהתחלתי. Section 5 שלי נוסף אחרי Section 4 (RAMA tasks); עמודת Tier נוספה בלי לשבור את `coldStartFor` הקיים.
- ✅ E.17+E.18 (`49df726`) — לא נגעתי ב-event-logger / data-export.
- ✅ F.21A (`54e00ec`) — `teacher-rama.html` הורחב, ה-API הקיים נשמר 1:1.
- ❌ D.15 (`e36a916`) — תחום שונה (assets/audio/stage-3-*).
- 🟡 קבוצה S (E.17+E.18) — אין חפיפת קבצים.

**🎯 פונקציות חדשות שנחשפות:**
`window.AvneiPackBridge` עם 8 פונקציות + 2 constants. שמורה לעתיד: C.14 (קריאה ממשחקון), F.21E (דשבורד פעולה — Tier בקבוצות).

**אסור לגעת ב- (לא נגעתי):**
- `bkt.js` · `epa.js` · `mastery-check.js` · `event-logger.js` · `profile-classifier.js` (קוראים בלבד)
- 22 קבצי משחקונים `stage-3-*.html` — קריאה ל-`getItemsForStudent` היא post-MVP (C.14)
- 7 ה-planning packs הקיימים (`september.json`, וכו') — לפי החלטת מיטל (28.5): "לבנות חדשים לצד הקיימים"
- מסמכי-אם (architecture-mvp / pedagogy-integration-framework / literacy-grade1-2-yearly / llm-pitfalls)
- spec עצמו (`2026-05-28-C11-C12-C13-pack-bkt-spec.md`)

**מה לבדוק לפני push (10 דקות — כולל סבב 1):**

1. שרת: `cd avnei-yesod && python -m http.server 8765`
2. `http://localhost:8765/underwater-app/teacher-rama.html` — PIN `4521`
3. **Class View — sticky (תיקון באג 1):** ודאי עמודת "Tier" בין "תלמידה" ל-"מ1". **גללי אופקית** — Tier נשארת מימין יחד עם תלמידה (לא נופלת שמאלה).
4. **Class View — modal (תיקון באג 2):** לחצי על תא Tier של נועה (למשל) → **modal עם פרטים מלאים**: Tier badge גדול, reason, confidence, 4 כפתורי override, "× בטל".
   - סגירה: כפתור ×, ESC, או לחיצה מחוץ.
   - לחיצה על "Tier 4" ב-modal → ⚙ מופיע בתא + modal נסגר אוטומטית.
5. **Student View — Section 5:** לחצי על שם תלמידה → Section 5 בתחתית. כפתורי override + "× בטל" עובדים גם כאן.
6. **3 פרסונות (חובה):**
   - מאיה — Tier 4 ידני (דרך modal או Student View) → ⚙ ב-Class View + source=manual.
   - נועה — אוטומטי לפי דאטה (סביר 2-3).
   - שירה — תלמידה חדשה ללא דאטה → Tier 1 + source=cold-start.
7. **רגרסיה:** Class table עדיין מתפקדת (10 משימות ראמ"ה), badge "חדשה" של A.5 עדיין מופיע, EPA + 22 letters עובדים.
8. **טסטים אוטומטיים:**
   ```bash
   node avnei-yesod/underwater-app/scripts/test-pack-bridge.js
   # → 75/75 ✅
   node avnei-yesod/underwater-app/scripts/validate-pack.js
   # → 2/2 ✅
   ```

**🐞 תיקוני סבב 1 (פידבק מיטל 28.5 · אחרי בדיקת Class View ראשונה):**

| # | באג | תיקון |
|---|---|---|
| 1 | עמודת Tier לא sticky — נופלת שמאלה בגלילה אופקית | CSS: `position: sticky; right: 140px; z-index: 3` ב-`.tier-col` ו-`z-index: 2` ב-`td.tier-cell`. `right: 140px` תואם ל-`min-width` של `student-col`. רקעים מפורשים פר tier (1/2/3/4/cold) ימשיכו לעבוד — לא יציצו שכבות מתחת. |
| 2 | reason לא נגיש (title attr לא עובד במובייל) | Modal מלא בלחיצה על `td.tier-cell`. בנוי בדינמיקה (innerHTML זהה ל-`renderPackSection`): Tier badge גדול + reason + pKnown + confidence + 4 כפתורי override + "× בטל". סגירה: כפתור ×, ESC, click outside. אחרי override → re-render + close. **title attr נשמר** כ-tooltip מהיר ב-hover ל-desktop. |

**קוד התיקונים (5 שינויים ב-`teacher-rama.html`):**
1. CSS — sticky על tier-col + tier-cell + `cursor:pointer` + `:hover` filter (~10 שורות נוספות)
2. CSS — `.tier-modal-backdrop` + `.tier-modal` + `.tm-head` + `.tm-close` + `.tm-body` (~50 שורות חדשות)
3. JS — `tierCellHtml(decision, studentId)` עכשיו עם `data-student` attr + הוספת "לחיצה לפרטים" ל-title
4. JS — `openTierModal(studentId)` + `closeTierModal()` + `_tierModalEscHandler` (~110 שורות חדשות)
5. JS — click handler ב-renderClassView מזהה `tier-cell` ופותח modal (3 שורות נוספות)

**שאלות פתוחות:**
- **בחירת pack לפיילוט:** `currentPackId()` קבוע ל-`september-2026`. אם רוצה לבדוק strand-focused (january-2026), לשנות ידנית בקוד או לבקש toggle UI (תוספת קטנה).
- **תוכן ה-packs:** dummy items לפי הנחיית ה-spec. התוכן האמיתי = מיטל כותבת ידנית בקצב שלה.

**לפני push (חובה — סביבת ריבוי-סוכנים):**
```
git fetch origin && git status
```

**הצעת message לקומיט (HEREDOC):**
```
C.11+C.12+C.13 — Pack × BKT Integration (לב הדיפרנציאליות)

מימוש 1:1 של _handoff/2026-05-28-C11-C12-C13-pack-bkt-spec.md
(9 סעיפים, 18 AC items). 3 ההחלטות של מיטל (28.5) הוטמעו 1:1.

C.11 — Pack Schema + 2 dummy packs:
  curriculum/packs/grade1-tashpaz/september-2026.json
    (letters-focused · 4 אותיות בועות · 4 tiers · 20 items)
  curriculum/packs/grade1-tashpaz/january-2026.json
    (strand-focused · 3 skills פונולוגיים · 4 tiers · 13 items)
  curriculum/packs/_schema.md (~150 שורות, 8 סעיפים)

C.12 — pack-bkt-bridge.js (~370 שורות):
  8 פונקציות API: loadPack · preloadPack · loadCurrentPack ·
    selectTierForStudent · getItemsForStudent · overrideTier ·
    clearOverride
  2 constants: TIER_THRESHOLDS (0.30/0.60/0.85, frozen) ·
    STRAND_NAMES (1-5)
  letters-focused — ממוצע על letters_in_focus דרך getLetterState
  strand-focused — לפי getStudentStrands()[primary_strand]
  Cold-start: letters <5 attempts פר אות · strand <10 → Tier 1
  Override ב-localStorage (`pack-overrides`)
  Sync XHR לדפדפן · fs ל-Node · preloadPack async fallback

C.13 — Item tagging + validate-pack.js:
  Item schema: item_id · tier · type · letter|skill · mechanic ·
    source_letter · challenge · rama_task_alignment · peima_target
  scripts/validate-pack.js — CLI · 7 שכבות validation · exit 0/1/2

UI ב-teacher-rama.html:
  Class View — עמודת Tier אחרי "תלמידה" (4 צבעים + ⚙ ל-manual)
  Student View — Section 5: Tier badge גדול + reason + confidence
    + 4 כפתורי override + "× בטל" כשמשתמשים manual
  ~125 שורות CSS חדשות · 7 helpers JS חדשים
  currentPackId() קבוע ל-september-2026 בפיילוט

75/75 smoke assertions ב-scripts/test-pack-bridge.js:
  16 בלוקים — API surface · constants · pickTier 4 גבולות ·
  loadPack מ-fs · cold-start (letters+strand) · partial data ·
  full data · few attempts · medium attempts · high attempts ·
  override flow (set+read+clear) · validation · getItemsForStudent ·
  fallbacks (no pack · no AvneiBKT) · edge cases.

2/2 packs validate-pack ✓.

לא נגעתי: bkt.js / epa.js / mastery-check.js / event-logger.js /
profile-classifier.js / 22 stage-3-*.html / 7 planning packs קיימים
(החלטת מיטל 28.5: "לבנות חדשים לצד הקיימים") / מסמכי-אם.

Spec ב-_handoff/2026-05-28-C11-C12-C13-pack-bkt-spec.md (6d5a47d).
```

---

## 🟡 קבוצה S — E.17 + E.18 (Event Logger ל-3 שדות + Data Export CSV)

**סטטוס:** 🟡 ממתין לאישור push ממיטל (5 דק' בדיקה)
**תאריך:** 2026-05-28
**16 קבצים (2 חדשים · 14 שינויים · 3 handoff updates) · חבילה אחת**

| # | קובץ | סטטוס שינוי | הערה |
|---|---|---|---|
| 1 | `underwater-app/js/shared/event-logger.js` | שינוי (~25 שורות) | `ISLAND_TO_STRAND` map (22 → 5, `Object.freeze`) + 3 שדות חדשים ב-`logActivityResult` (`strand_id` אוטומטי, `rama_task_alignment` ו-`peima_target` מ-result) + ייצוא ב-public API |
| 2 | `underwater-app/js/templates/game-shell.js` | שינוי (~15 שורות) | שליפת `rama_task_alignment` + `peima_target` מ-config (שורש או `_meta`, fallback ל-1,1) והעברה ל-mechanic ב-opts |
| 3 | `underwater-app/js/templates/mechanic-tap-all.js` | שינוי 2 שורות | העברת השדות מ-opts ל-`logActivityResult` |
| 4 | `underwater-app/js/templates/mechanic-pick.js` | שינוי 2 שורות | אותו דבר |
| 5 | `underwater-app/js/templates/mechanic-memory-pair.js` | שינוי 2 שורות | אותו דבר |
| 6 | `underwater-app/js/templates/mechanic-sort-by-letter.js` | שינוי 2 שורות | אותו דבר |
| 7 | `underwater-app/stage-3-storm.html` | שינוי 2 בלוקים | hardcode 1,1 ב-2 קריאות (correct + wrong) |
| 8 | `underwater-app/stage-3-trail-resh.html` | שינוי בלוק | hardcode 1,1 |
| 9 | `underwater-app/stage-3-dalet.html` | שינוי בלוק | hardcode 1,1 (D.15 dalet) |
| 10 | `underwater-app/js/rescue-controller.js` | שינוי בלוק | hardcode 1,1 (`stage-3-rescue.html`) |
| 11 | `underwater-app/js/activities/letter-shape.js` | שינוי בלוק | מהפריט עם fallback ל-1,1 (shell/house) |
| 12 | `underwater-app/js/activities/find-letter.js` | שינוי בלוק | אותו דבר |
| 13 | `underwater-app/js/activities/sound-match.js` | שינוי בלוק | אותו דבר |
| 14 | `underwater-app/js/activities/trace-path.js` | שינוי בלוק | hardcode 1,1 (עוד לא נחשף לאי 19) |
| 15 | `underwater-app/scripts/test-event-logger-fields.js` | **חדש** (~155 שורות) | 5 בלוקי בדיקה · **23 assertions עוברות** · ISLAND_TO_STRAND mapping + שדות חדשים + backwards compat |
| 16 | `underwater-app/data-export.html` | **חדש** (~430 שורות) | PIN gate (זהה ל-teacher-rama) · 6 פילטרים · 4 summary tiles · table preview · CSV+BOM · clipboard |
| + | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי קל | E.17 ☐ → ✅ + E.18 ☐ → ✅ + העברה לקטגוריה "הסתיים" |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד E.17+E.18 (6 החלטות שהוטמעו, 20 שדות באירוע, 23/23 בדיקות) |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו |

**מהות התוצר:**
E.17 דוחף 3 תיוגים קריטיים לכל אירוע פעילות (`strand_id` אוטומטי לפי `ISLAND_TO_STRAND` mapping של 22→5, ו-`rama_task_alignment` + `peima_target` מהפריט). E.18 הופך את הדאטה הזו לזמינה למורה דרך `data-export.html` — מסך עצמאי עם PIN gate, פילטרים מלאים, ו-CSV עם BOM ל-Excel. ביחד: "הפיילוט מייצר דאטה מתויגת שאפשר לנתח".

**יחס לקבוצות שכבר נדחפו / ממתינות:**
- ✅ A0.2 (`rama_task_alignment` + `peima_target` פר-פריט) — E.17 מסיים את ה-loop ע"י דחיפת השדות גם לאירועים
- ✅ A.1 / A.3 / A.4 — לא נגעתי. רק קורא אינדיקציה ל-BKT דרך `appendEvent` (כמו קודם)
- ✅ F.21A (`teacher-rama.html`) — לא נגעתי בקובץ. רק *קוראים* ממנו את ה-PIN gate
- ⏳ קבוצה R (A.5 Cold-start) — חופפת ב-`teacher-rama.html` אבל לא בקבצים שלי. אין קונפליקט
- ❌ אין חפיפת קבצים עם D.14/D.15 — תחום שונה (audio + UI)

**מה לבדוק לפני push (5 דקות):**

1. **`teacher-rama.html`** — לפתוח עם PIN `4521`, לוודא שלא נשבר (אף שינוי לא בקובץ הזה).
2. **`stage-3-storm.html`** או **`stage-3-dalet.html`** — לשחק סשן קצר.
3. **DevTools → Console:**
   ```js
   JSON.parse(localStorage['underwater-app:v1']).events.slice(-1)[0]
   ```
   לוודא שמופיעים: `strand_id: 1`, `rama_task_alignment: 1`, `peima_target: 1`.
4. **`data-export.html`** — לפתוח, PIN `4521`, ללחוץ "הורד CSV", לפתוח ב-Excel — עברית קריאה (BOM).
5. **בדיקות אוטומטיות:** `node avnei-yesod/underwater-app/scripts/test-event-logger-fields.js` → 23 ✅.

**שאלות פתוחות:**
- **`trace-path.js`** מוגדר 1,1 (אי 3). אם תופיע פעילות באי 19 (כתיבה) — נצטרך לשנות. כרגע OK.
- **`mvp_letter_count_proxy`** — לא בסקופ E.17. אם נוסיף `letter_id` באירוע בעתיד (F.21B) — תהיה התאמה נחוצה.

**לפני push (חובה — סביבת ריבוי-סוכנים):**
```
git fetch origin && git status
```

---

## 🟡 קבוצה R — A.5 Cold-start Protocol

**סטטוס:** 🟡 דורש בדיקת מיטל ידנית לפני push (5-8 דק')
**תאריך:** 2026-05-27 לילה
**3 קבצים (1 חדש + 2 שינויים + 3 handoff updates) · חבילה אחת**

| # | קובץ | סטטוס שינוי | הערה |
|---|---|---|---|
| 1 | `underwater-app/js/shared/mastery-check.js` | שינוי (+~85 שורות) | הוספת `isInColdStart(studentId)` + `COLD_START_DAYS=3` + `COLD_START_ATTEMPTS=30` + עזרים פרטיים `_getFirstSeenAt` ו-`_totalAttemptsAllStrands`. ה-API הקיים (checkMastery, checkRamaTaskStatus, ISLAND_TO_RAMA, RAMA_TASKS) נשמר 1:1. |
| 2 | `underwater-app/teacher-rama.html` | שינוי (~30 שורות) | CSS חדש (`.badge-new`, `.cold-start-banner`, `.cold-count`) · helper `coldStartFor(studentId)` · Class View: badge "חדשה" ליד שם בטבלה · Student View: banner בולט מעל סקציה 1 + סינון `teacherFlags` ב-cold-start (החלטה 5) · pulse summary counter "📚 X ילדות חדשות". |
| 3 | `underwater-app/scripts/test-cold-start.js` | **חדש** (~165 שורות) | 5 בלוקי טסט · 24 assertions · 4 קומבינציות קריטיות + edge cases + backwards compat. |
| + | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי קל | A.5 ☐ → ✅ ב-2 מקומות. |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד A.5 (6 החלטות פדגוגיות שהוטמעו, API חדש, edge cases). |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו. |

**מהות התוצר:**
A.5 Cold-start Protocol — מסביר למורה למה היא רואה ⚫ לתלמידות חדשות. שילוב של 2 קריטריונים (3+ ימים AND 30+ ניסיונות). שניהם חייבים להתקיים יחד כדי **לצאת** מ-cold-start. UI מורה בלבד — הילדה משחקת רגיל ולא יודעת על cold-start. משלים את F.21A שנדחפה הרגע (`54e00ec`).

**יחס לקבוצות שכבר נדחפו / ממתינות:**
- ✅ קבוצה N (F.21A code · `54e00ec`) — A.5 משלים את F.21A · אותם 2 קבצי קוד (`mastery-check.js` + `teacher-rama.html`) אבל אדיטיבי בלבד, אין שבירה
- ❌ אין חפיפת קבצים עם A.1/A.3/A.4 (BKT/EPA/Sub-BKT) — A.5 רק קורא ה-API שלהן
- ❌ אין חפיפת קבצים עם D.15 v2 (Q/P/O · stage-3-*, mechanic-*, letter-anims) — תחומים שונים לגמרי
- ❌ לא נגעתי ב-`profile-classifier.js` — ניצול `entry_date` הקיים ב-StudentsStore

**🎯 פונקציה חדשה שנחשפת:**
`AvneiMasteryCheck.isInColdStart(studentId)` — החזר: `{inColdStart, daysSince, attemptsTotal, daysCriterion, attemptsCriterion}`. בנוסף נחשפים הקבועים `COLD_START_DAYS` ו-`COLD_START_ATTEMPTS` כך ש-F.21E עתידי יוכל להשתמש באותם ספים בלי דבלקציה.

**לא חוסם דבר נוסף:** A.5 הוא tip של פירמידת "הסבר למורה את העדר הציון". F.21E (דשבורד פעולה) יוכל לבסס על isInColdStart לוגיקה של "אל תציע אינטרבנציה לתלמידה ב-cold-start".

**לפני push (חובה — סביבת ריבוי-סוכנים):**
```
git fetch origin && git status
```

**הצעת message לקומיט:**
```
A.5 — Cold-start Protocol (3 ימים + 30 ניסיונות · שילוב)

מנגנון "ילדה חדשה במערכת" שמסביר למורה למה היא רואה ⚫.
משלים את F.21A code (54e00ec).

mastery-check.js הורחב ב-isInColdStart(studentId):
  {inColdStart, daysSince, attemptsTotal,
   daysCriterion, attemptsCriterion}
שילוב: inColdStart=true כל עוד אחד הקריטריונים לא התקיים.
שניהם חייבים (days>=3 AND attempts>=30) כדי לצאת.

UI ב-teacher-rama.html:
  Class View — badge "חדשה" צהוב ליד שם בטבלה
  Student View — banner בולט בראש: "📚 יום X/3 · Y/30 ניסיונות"
  Pulse summary — counter "📚 X ילדות חדשות"
  Flags חסומים ב-cold-start (החלטה פדגוגית של מיטל)

לא נגעתי ב-profile-classifier.js — entry_date כבר נשמר ב-StudentsStore.
Fallback אם entry_date חסר: earliest event ts → Date.now().

24/24 smoke assertions ב-scripts/test-cold-start.js:
  - 4 קומבינציות קריטיות (day1×5, day1×50, day5×5, day5×50)
  - edge cases (אין רשומה, גבולות 3×30 ו-2×30, fallback)
  - backwards compat: F.21A tests עדיין עוברים (30/30)

6 החלטות פדגוגיות של מיטל (27.5 לילה) הוטמעו 1:1.
```

**מסלול בדיקה ידנית של מיטל לפני אישור push:**
1. שרת רץ ב-`http://localhost:8765/underwater-app/teacher-rama.html` (PIN 4521)
2. צרי תלמידה חדשה ב-`onboarding-profile.html`. חזרי ל-teacher-rama.
3. **Class View:** השם שלה מופיע עם badge "חדשה" צהוב ליד השם.
4. **Student View:** banner צהוב בולט "📚 יום 1/3 · 0/30 ניסיונות"
5. **Pulse summary:** שורת סטטוס עם "📚 X ילדות חדשות"
6. **רגרסיה:** תלמידות קיימות (מאיה/נועה/מיטל פלג) — תלוי ב-entry_date שלהן. אם < 3 ימים → גם הן cold (מצופה).

**אם נמצא באג** → איטרציה לפני push.
**אם הכל תקין** → push קבוצה R, A.5 נסגרת.

---

## ✅ קבוצה Q — D.15 v2 שלב E · קבוצת דגים (נדחפה 27.5 לילה · `e36a916`) — **D.15 סגורה!**

**סטטוס:** ✅ נדחפה · **17/17 אותיות D.15 חיות · רף ראמ"ה נפתח · חוסם פיילוט P0 נסגר**
**תאריך:** 2026-05-27 לילה
**משמעות אסטרטגית:** עם שלב E, **17/17 אותיות D.15 חיות** → רף ראמ"ה 18+/22 עובר (5 אמנותיים + 12 חדשים = 17 + עוד 5 אמנותיים = 22 סה"כ). חוסם פיילוט P0 נסגר.

**19 קבצים** (18 חדשים + 1 שינוי + 3 handoff updates)

| # | קובץ | סטטוס |
|---|---|---|
| 1 | `scripts/generate-fish-audio-d15.py` | חדש |
| 2-11 | `assets/audio/{intro,find}-{dalet,gimel,het,pey,kaf}.mp3` | 10 חדשים |
| 12-16 | `data/island-03-letters/{dalet,gimel,het,pey,kaf}.json` | 5 חדשים |
| 17-21 | `stage-3-{dalet,gimel,het,pey,kaf}.html` | 5 חדשים (cp+edit) |
| + | `stage-3-island.html` | שינוי — קבוצת דגים `built:true` |

הרוטציה: ד=tap-all · ג=pick · ח=memory-pair · פ=sort-by-letter · **כ=tap-all (חזרה לתחילה — אות 5)**.

5 אותיות > 4 מכניקות → כ' חוזרת ל-tap-all. סגירת מעגל.

לא נגעו ב-engine/mechanics/letter-anims/CSS — שכפול נטו של תבנית.

---

## ✅ קבוצה P — D.15 v2 שלב D · קבוצת צדפים (נדחפה 27.5 לילה · `98911af`)

**סטטוס:** 🟡 ממתין לאישור מיטל ידני / push (אחרי שלב C)
**תאריך:** 2026-05-27 לילה
**17 קבצים** (16 חדשים + 1 שינוי + 3 handoff updates)

| # | קובץ | סטטוס | הערה |
|---|---|---|---|
| 1 | `scripts/generate-shells-audio-d15.py` | **חדש** | 8 MP3 בהרצה אחת |
| 2-9 | `assets/audio/{intro,find}-{samekh,ayin,tzadi,tet}.mp3` | **8 חדשים** | AvriNeural |
| 10-13 | `data/island-03-letters/{samekh,ayin,tzadi,tet}.json` | **4 חדשים** | tap-all/pick/memory/sort · theme:shells |
| 14-17 | `stage-3-{samekh,ayin,tzadi,tet}.html` | **4 חדשים** | מבוססים על HTMLs מ-C (cp+edit letterKey+ucLetter) |
| + | `stage-3-island.html` | שינוי | קבוצת צדפים `built:true` עם שמות מותאמים פר מכניקה |
| + | `_handoff/{agent-completion-log,meytal-pending,pending-commits}.md` | שינוי | תיעוד |

**24/24 sanity tests.** לא נגעו ב-engine או mechanics — שכפול נטו של תבנית C.

**משמעות:** 12 מ-17 אותיות D.15 חיות (4 בועות + 4 כוכבים + 4 צדפים). נשארו 5 דגים (שלב E).

---

## ✅ קבוצה O — D.15 v2 שלב C · קבוצת כוכבים (נדחפה 27.5 לילה · `326b55c`)

**סטטוס:** ✅ נדחפה (לפני בדיקה ידנית של מיטל — אישרה push קודם → שלב D הבא)
**תאריך:** 2026-05-27 לילה (אחרי M+B+B-revised)
**17 קבצים (16 חדשים + 1 שינוי + 3 handoff updates) · חבילה אחת**

| # | קובץ | סטטוס | הערה |
|---|---|---|---|
| 1 | `underwater-app/scripts/generate-stars-audio-d15.py` | **חדש** | 8 MP3 בהרצה אחת · ניסוח פר מכניקה |
| 2-9 | `underwater-app/assets/audio/{intro,find}-{zayin,yud,vav,hey}.mp3` | **8 חדשים** | AvriNeural · rate -10% |
| 10-13 | `underwater-app/data/island-03-letters/{zayin,yud,vav,hey}.json` | **4 חדשים** | mechanic: tap-all/pick/memory-pair/sort-by-letter · theme:stars |
| 14-17 | `underwater-app/stage-3-{zayin,yud,vav,hey}.html` | **4 חדשים** | טוענים את כל ה-mechanics + letter-anims · CSS v=9 |
| + | `underwater-app/stage-3-island.html` | שינוי קל | קבוצת כוכבים: `built:true` ל-4 כרטיסים · שמות מותאמים פר מכניקה (צֵיד · בְּחִירַת · זִכָּרוֹן · מִיּוּן) |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד שלב C |
| + | `_handoff/meytal-pending.md` | בלוק חדש בראש | בדיקה ידנית של 4 הכוכבים |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו |

**מהות התוצר:**
שכפול של הרוטציה מקבוצת בועות (שלב B-revised) אל קבוצת כוכבים. אותה ארכיטקטורה — 4 מכניקות שונות פר אות — אבל עם נושא ויזואלי "כוכבי הים" וניסוח אודיו נושאי שונה. SVG האסוציאטיביים פר אות (זברה/יום/ורד/הר) כבר ב-letter-anims.js מ-M+B+B-revised.

**יחס לקבוצות שכבר נדחפו / ממתינות:**
- ❌ אין שינוי בקבצי engine או mechanics — שלב C משתמש בלבד במכניקות שכבר נדחפו ב-`a039980`
- ❌ אין חפיפת קבצים עם N (F.21A)
- ✅ תלות בקבוצה M+B+B-revised (`a039980`) — היא נדחפה כבר, אז אין חסימה

**🎯 איך זה משתלב במשימת-אם:**
8 מ-17 אותיות חיות עכשיו (4 בועות + 4 כוכבים). 9 חסרות לרף ראמ"ה 18+/22 (4 צדפים · 5 דגים). שלבי D+E יבואו זהים במבנה.

**לפני push (חובה — סביבת ריבוי-סוכנים):**
```
git fetch origin && git status
```

**הצעת message לקומיט:**
```
D.15 v2 שלב C — קבוצת כוכבים (4 אותיות, אותה רוטציה)

שכפול של הרוטציה מקבוצת בועות (M+B+B-revised) אל קבוצת
כוכבים. 4 אותיות, 4 מכניקות שונות:
  ז = tap-all       (צֵיד הַכּוֹכָבִים · זברה)
  י = pick          (בְּחִירַת הַכּוֹכָבִים · יום/שמש)
  ו = memory-pair   (זִכָּרוֹן הַכּוֹכָבִים · ורד)
  ה = sort-by-letter (מִיּוּן הַכּוֹכָבִים · הר)

4 JSONs חדשים · 4 HTMLs חדשים · 8 MP3 חדשים (intro+find פר
אות, ניסוח פר מכניקה). SVG אסוציאטיביים כבר ב-letter-anims.js
מ-M+B+B-revised — לא נגעו בקבצי engine או mechanics.

stage-3-island.html — 4 כרטיסי כוכבים עברו מ-coming-soon
ל-built:true עם שמות מותאמים פר מכניקה.

44/44 smoke tests. לא נגעו: bkt/epa/event-logger/mastery-check/
profile-classifier / כל קבצי js/templates / 5 משחקוני אי 3
האמנותיים / מסמכי-אם.

8 מ-17 אותיות חיות. נשאר: 4 צדפים (D) · 5 דגים (E) לרף 18+/22.
```

**מסלול בדיקה ידנית:** ראה meytal-pending.md → "🧪 D.15 v2 שלב C"

---

## ✅ קבוצה M+B+B-revised — D.15 שלב 1 + v2 שלב B + B-revised (נדחפה 27.5 לילה · `a039980`)

**עדכון 27.5 לילה:** הקבוצה הזו מאחדת עכשיו 3 שלבים: שלב 1 (ל·נ·א בסיסי) + שלב B (תשתית אנימציה ייחודית) + B-revised (3 מכניקות מתחלפות בקבוצת בועות).

**42 קבצים סה"כ** (~28 חדשים + ~10 שינויים + 4 handoff updates)

### B-revised — נוסף 27.5 לילה (8 קבצים)

| # | קובץ | סטטוס | הערה |
|---|---|---|---|
| 1 | `js/templates/mechanic-memory-pair.js` | **חדש** (~290 שורות) | 6 קלפים flip · pair = letter + SVG (מ-letter-anims) |
| 2 | `js/templates/mechanic-sort-by-letter.js` | **חדש** (~350 שורות) | Pointer events drag · 5-7 floaters → 2 bins |
| 3 | `js/templates/mechanic-pick.js` | שינוי | PRAISE_POOL חדש · inGamePromptAudioKey · without-replacement |
| 4 | `css/game-shell.css` | שינוי גדול | בלוקים `.mechanic-memory-pair` + `.mechanic-sort` + 8 sub-rules + animations |
| 5 | `data/island-03-letters/lamed.json` | שינוי | `mechanic: pick` · podsPerRound:4 |
| 6 | `data/island-03-letters/nun.json` | שינוי | `mechanic: memory-pair` · counter: זוגות 3 |
| 7 | `data/island-03-letters/alef.json` | שינוי | `mechanic: sort-by-letter` |
| 8 | 4 HTMLs (`stage-3-{lamed,nun,alef,template-demo}.html`) | שינוי | טעינת mechanic-memory-pair + mechanic-sort-by-letter · CSS v=8→v=9 |

**משמעות אסטרטגית:**
שלב B-revised פותר את ההערה של מיטל מ-27.5 לילה: "כל המשחקים עדיין באותו פורמט". עכשיו ב-כל קבוצה של 4 אותיות יש 4 מכניקות שונות (tap-all · pick · memory · sort), והרוטציה הזו תחזור בקבוצות הבאות (כוכבים/צדפים/דגים) — תוכנית ל-13 האותיות הנותרות תהיה זריזה יחסית כי המכניקות כבר בנויות.

**יחס לקבוצות שכבר נדחפו / ממתינות:**
- ❌ אין שינוי בקבצי ה-engine (bkt/epa/event-logger/mastery/profile)
- ❌ אין חפיפת קבצים עם קבוצה N (F.21A) — N נוגעת ב-`teacher-rama.html`/`mastery-check.js`, M+B נוגעת ב-`stage-3-*`/`game-shell.js`/`mechanic-*`/`letter-anims.js`/`css`
- ✅ M+B תלויה ב-D.14 (קבוצה J). אם D.14 עוד לא ב-`main`, צריך לדחוף קודם.

**🎯 פונקציות חדשות שנחשפות:**
- `window.AvneiMechanics['memory-pair']` — mount(root, opts)
- `window.AvneiMechanics['sort-by-letter']` — mount(root, opts)
- `window.AvneiLetterAnims.getAnimForLetter` + `runAnimation` (משלב B)

**הצעת message לקומיט מעודכן:**
```
D.15 שלב 1 + v2 שלב B + B-revised — בועות עם 4 מכניקות

חבילה משולשת: שלב 1 (3 אותיות חדשות) → שלב B (אנימציה
ייחודית פר אות + 9 word MP3) → B-revised (3 מכניקות
מתחלפות פנימית בקבוצה).

B-revised פותר את הערת מיטל מ-27.5 לילה: 4 הבועות לא
באותו פורמט יותר. עכשיו ש=tap-all · ל=pick · נ=memory-pair
· א=sort-by-letter. הרוטציה תחזור בכוכבים/צדפים/דגים.

2 מכניקות חדשות:
  mechanic-memory-pair.js (~290 שורות) — 6 קלפים flippable,
    3D rotateY transform · pair = אות + SVG מ-letter-anims
  mechanic-sort-by-letter.js (~350 שורות) — pointer events
    drag (mouse + iOS Safari 13+ touch) · 7 floaters → 2 bins,
    hit-test ב-elementFromPoint · placed/absorbed animations

mechanic-pick.js מעודכן: PRAISE_POOL חדש (yofi/metzuyan/mealeh)
במקום FEEDBACK_AUDIO old (exactly/great/right · קבצים לא קיימים).
without-replacement של שבחים. inGamePromptAudioKey במקום
sound-letter בלבד.

3 JSONs מעודכנים — lamed/nun/alef. בכל אחד mechanic + title +
intro_html חדשים. nun עבר ל-counter "זוגות 3" במקום "בועות 5".
4 HTMLs טוענים את 2 המכניקות החדשות + CSS bump ל-v=9.

CSS חדש (~280 שורות): .mechanic-memory-pair + .memory-card
(3D flip + pop) + .mechanic-sort + .sort-item (float/drag/
absorbed/sway) + .sort-bin (target+distractor + hint-pulse).

לא נגעו: bkt/epa/event-logger/mastery-check/profile-classifier
/ mechanic-tap-all / mechanic-quest / letter-anims / 5 משחקוני
אי 3 / stage-3-island.html.

36/36 smoke tests עוברים.
Spec: _handoff/2026-05-27-d15-v2-enhancements-spec.md
שלב הבא: C — כוכבים (אותה רוטציה, 4 JSONs+HTMLs+MP3 מהר).
```

**מסלול בדיקה ידנית של מיטל לפני אישור push:**
ראה meytal-pending.md → "🧪 D.15 v2 שלב B-revised — בדיקה ידנית של 3 מכניקות שונות בקבוצת בועות"

**אם נמצא באג** → איטרציה על המכניקה הספציפית.
**אם הכל תקין** → push מאוחד, מתחילים שלב C.

---

## 🟡 קבוצה M+B (תיאור קודם — לפני B-revised) — D.15 שלב 1 + v2 שלב B (משולבת)

**סטטוס:** 🟡 דורש בדיקת מיטל ידנית לפני push
**תאריך:** 2026-05-27 לילה
**הערה:** הקבוצה הזו מאחדת את שלב 1 הקיים (ל·נ·א בועות בסיסי) + שלב B החדש (תשתית אנימציה ייחודית פר אות + שדרוג 4 הבועות). מיטל ביקשה לבנות עם השיפורים מההתחלה (אופציה B) — לכן יוצאת חבילה אחת.

**29 קבצים (24 חדשים + 5 שינויים + 4 handoff updates) · חבילה אחת**

### שלב 1 — ל·נ·א בסיסי (כפי שכבר תועד בקבוצה M לפני)
- 3 JSONs · 3 HTMLs · 6 MP3 (intro+find פר אות) · scripts/generate-bubbles-letters-audio.py · stage-3-island.html מ-5 ל-22 הרפתקאות

### שלב B — תשתית אנימציה + שדרוג בועות (חדש)

| # | קובץ | סטטוס | הערה |
|---|---|---|---|
| 1 | `underwater-app/js/templates/letter-anims.js` | **חדש** (~360 שורות) | 17 SVG inline פר אות · `window.AvneiLetterAnims.runAnimation(letter, onComplete)` |
| 2 | `underwater-app/scripts/generate-word-audio-d15v2.py` | **חדש** | 9 מילים מנוקדות · UTF-8 reconfigure ל-Windows |
| 3-11 | `assets/audio/word-{aryeh,zebra,vered,har,etz,tzipor,tavas,dag,kelev}.mp3` | **9 חדשים** | AvriNeural · rate -10% |
| 12 | `underwater-app/js/templates/game-shell.js` | שינוי | `playLetterAnimThenFinale()` wrapper · preload של word-X |
| 13 | `underwater-app/css/game-shell.css` | שינוי | `.letter-anim-overlay` + animations + z-index 270 |
| 14-17 | 4 HTMLs (`stage-3-template-demo.html`, `stage-3-lamed.html`, `stage-3-nun.html`, `stage-3-alef.html`) | שינוי | טעינת `letter-anims.js` |
| + | `_handoff/2026-05-27-d15-v2-enhancements-spec.md` | **חדש** | spec מורחב v2 (4+3 החלטות עיצוביות סגורות + 17 רעיונות אסוציאטיביים) |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד שלב B |
| + | `_handoff/meytal-pending.md` | בלוק חדש בראש | בדיקה ידנית של שלב B |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו |

**יחס לקבוצות שכבר נדחפו / ממתינות:**
- ❌ אין חפיפת קבצים עם A.1 / A.3 / A.4 (BKT / EPA / Sub-BKT)
- ❌ אין חפיפת קבצים עם קבוצה N (F.21A code) — N נוגעת ב-`teacher-rama.html` / `mastery-check.js`, M+B נוגעת ב-`stage-3-*` / `game-shell.js` / `letter-anims.js`
- ✅ M+B תלויה ב-D.14 (קבוצה J) — אם D.14 עוד לא ב-`main`, צריך לדחוף אותה קודם

**🎯 פונקציה חדשה שנחשפת:**
`window.AvneiLetterAnims` — API עם `runAnimation(letter, onComplete)`. ייקרא אוטומטית מ-game-shell.js אחרי 5/5 הקשות, אם הקובץ נטען ב-HTML. תאימות-אחור: אם לא נטען — startFinale רץ ישירות (D.14 בלי שינוי).

**לפני push (חובה — סביבת ריבוי-סוכנים):**
```
git fetch origin && git status
```

**הצעת message לקומיט:**
```
D.15 שלב 1 + v2 שלב B — בועות (ש·ל·נ·א) עם אנימציה ייחודית

חבילה משולבת: שלב 1 הוסיף 3 אותיות בסיסיות (ל·נ·א) בקבוצת
בועות. שלב B הוסיף תשתית אנימציה ייחודית פר אות + שידרג
את 4 הבועות (כולל ש' demo) להשתמש בה.

ארכיטקטורה (שלב B):
  letter-anims.js (חדש · 17 SVG inline) →
    runAnimation(letter, onComplete) פותח overlay מרכזי,
    משחק word-X.mp3, מציג SVG ~2.2 שניות, fade-out, callback
  game-shell.js:
    playLetterAnimThenFinale() wrapper שקורא להפעלה לפני
    startFinale (אם letter-anims.js נטען). תאימות-אחור: D.14
    בלי letter-anims ייפול ישר ל-startFinale.
    preload של word-X.mp3 ב-start() למניעת latency.

9 קבצי word-X.mp3 חדשים (AvriNeural · rate -10%):
  aryeh · zebra · vered · har · etz · tzipor · tavas · dag · kelev
8 קיימים מהמאגר משמשים גם הם (shemesh · lev · ner · yom ·
saba · gamal · chatul · pil).

17 SVG אסוציאטיביים פר אות, פלטה זהוב/כתום/תכלת/חום
(תואמת ים): שמש · לב · נר · אריה · זברה · יום · ורד · הר
· סבא · עץ · ציפור · טווס · דג · גמל · חתול · פיל · כלב.
מיטל בחרה טווס במקום טבעת וכלב במקום כביש (27.5 לילה).

CSS חדש (.letter-anim-overlay) — radial gradient רקע
+ blur · z-index 270 (מתחת ל-confetti) · 200ms fade-in
+ 1800ms hold + 400ms fade-out · scale+wobble על ה-stage.

לא נגעו: bkt.js / epa.js / event-logger.js / mastery-check.js
/ profile-classifier.js / mechanic-*.js / 5 משחקוני אי 3
האמנותיים / 4 JSONs של הבועות (letter מספיק).

Spec מלא: _handoff/2026-05-27-d15-v2-enhancements-spec.md
שלב הבא: C — קבוצת כוכבים (mechanic-pick).
```

**מסלול בדיקה ידנית של מיטל לפני אישור push:**
ראה meytal-pending.md → "🧪 D.15 v2 שלב B — בדיקה ידנית של אנימציה ייחודית"

**אם נמצא באג** → איטרציה על האנימציה לפני push.
**אם הכל תקין** → push קבוצה M+B, מתחילים שלב C (כוכבים).

---

## 🟡 קבוצה N — F.21A code · מסך מורה בשפת ראמ"ה

**סטטוס:** 🟡 דורש בדיקת מיטל ידנית לפני push (4 תרחישים · 8-12 דק')
**תאריך:** 2026-05-27 לילה
**3 קבצים (2 חדשים + 1 שינוי + 4 handoff updates) · חבילה אחת**

| # | קובץ | סטטוס שינוי | הערה |
|---|---|---|---|
| 1 | `underwater-app/teacher-rama.html` | **חדש** (~770 שורות) | קובץ עצמאי בלי dependencies מעבר ל-shared/* הקיימים. PIN gate ב-sessionStorage (PIN=4521 cosmetic לפיילוט). Class View: טבלת תלמידות×10 משימות, sticky student-col בימין, pulse banding בכותרת, summary bar עם drill ל-failing. Student View: 5 sections (5 strands · 22 letters grid · EPA dominant · 10 RAMA tasks פר פעימה · flags). Pulse toggle Daily↔Snapshot. Auto-refresh 3 שנ' (זהה ל-teacher-live). Responsive mobile + grid sticky RTL. |
| 2 | `underwater-app/js/shared/mastery-check.js` | שינוי | הרחבה — הוספת `RAMA_TASKS` (קבוע · 10 משימות עם name/value_threshold/value_max/time_threshold_sec/pulse/islands) + `checkRamaTaskStatus(studentId, ramaTaskId)` (החזר: status/value/threshold/confidence/contributingIslands/reason כפי שמוגדר ב-spec §5) + 4 עזרים פרטיים (`_islandStatusForRama`, `_computeRamaValue`, `_aggregateStatuses`, `_confidenceFor`) + קבועים `NEAR_RATIO=0.80`, `CONFIDENCE_HIGH_MIN=30`, `CONFIDENCE_MED_MIN=10`. ה-API הקיים (`checkMastery`, `ISLAND_TO_RAMA` וכו') נשמר 1:1. |
| 3 | `underwater-app/scripts/test-rama-task-status.js` | **חדש** (~210 שורות) | 8 בלוקי smoke · 30 assertions · רץ ב-Node עם vm sandbox + mock localStorage · בודק: APIs נחשפים, RAMA_TASKS שלם, תלמידה ריקה→cold, מבנה תוצא תואם spec §5, status פדגוגי נכון (1 אות→fail · 15→near · 18→pass), aggregation min-wins, ספי confidence, backwards compat. |
| + | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי קל | F.21A עבר מ-⭐⏳ ל-✅ ב-2 מקומות (סיכום עליון + רשימת משימות). |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד F.21A code (כולל 4 החלטות פדגוגיות שהוטמעו, חתימת ה-API החדש, וכל מה שלא נגעתי בו). |
| + | `_handoff/meytal-pending.md` | בלוק חדש בראש | 4 תרחישי בדיקה ידנית (PIN gate · Class View · Student View · Pulse Snapshot) + רגרסיה ב-teacher-live. |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו. |

**מהות התוצר:**
F.21A code — מסך מורה חדש שמציג את הכיתה דרך עדשת **משרד החינוך + ראמ"ה** (10 משימות × 3 פעימות) במקום עדשת "המשחקונים של אבני יסוד" של teacher-live. מבוסס 1:1 על `_handoff/2026-05-27-F21A-ux-spec.md` (שנדחפה כקבוצה L). כל ההחלטות העיצוביות-עליונות נסגרו בשלב ה-spec — סוכן הקוד יישם בלבד.

**יחס לקבוצות שכבר נדחפו / ממתינות:**
- ❌ אין חפיפת קבצים עם A.1/A.3/A.4 (BKT/EPA/Sub-BKT) — F.21A code רק קורא את ה-API שלהן ולא נוגע בקבצים
- ❌ אין חפיפת קבצים עם D.14/D.15 (template + bubbles) — F.21A לא נוגע ב-stage-*, ב-game-shell, או ב-island-03-letters
- ✅ קבוצה L (F.21A-spec) — F.21A code מממש את ה-spec הזה, בלי לשנות אותו
- 🟡 קבוצה M (D.15 שלב 1) — ניתן לדחוף בכל סדר ביחס ל-N (אין חפיפה)

**🎯 פונקציה חדשה שנחשפת:**
`AvneiMasteryCheck.checkRamaTaskStatus(studentId, ramaTaskId)` — נדרשה ב-spec §5 כפונקציה לא-קיימת שדורשת בנייה. נבנתה כהרחבה של `mastery-check.js` הקיים (לא קובץ חדש), בלי לשבור את ה-API הקיים. נחשפת גם `RAMA_TASKS` כקבוע למקרה שדפים אחרים ירצו אותו.

**לא חוסם דבר נוסף:** F.21A הוא tip-of-pyramid עבור F.21B (Parent view) · F.21C (Inspector view) · B.10 (Group Suggestion). כולם ימתינו לפיילוט.

**לפני push (חובה — סביבת ריבוי-סוכנים):**
```
git fetch origin && git status
```

**הצעת message לקומיט (HEREDOC):**
```
F.21A code — מסך מורה בשפת ראמ"ה (10 משימות × 3 פעימות)

מימוש 1:1 של _handoff/2026-05-27-F21A-ux-spec.md (12 סקציות,
12 acceptance criteria). כל ההחלטות העיצוביות נסגרו ב-spec.

קובץ חדש: underwater-app/teacher-rama.html (~770 שורות, עצמאי)
  PIN gate (sessionStorage · PIN=4521 cosmetic לפיילוט)
  Class View — טבלת תלמידות × 10 משימות ראמ"ה
                sticky column ימין (RTL) · pulse banding בכותרת
                summary bar עם drill ל-failing students
  Student View — 5 sections:
                  5 strands (BKT bars + confidence)
                  22 letters grid (4 buckets בצבע)
                  EPA dominant pattern
                  10 RAMA tasks מקובצות פר פעימה
                  flags (אם קיימים)
  Pulse toggle Daily ↔ Snapshot (Snapshot מציג בארים אגרגטיביים
  פר פעימה נבחרת, לא state-time-travel — practical ל-MVP)
  Auto-refresh כל 3 שניות (זהה ל-teacher-live)
  Responsive mobile + sticky column RTL

הרחבת mastery-check.js:
  RAMA_TASKS (קבוע · 10 משימות × name/value_threshold/value_max/
              time_threshold_sec/pulse/islands)
  checkRamaTaskStatus(studentId, ramaTaskId) — החזר תואם spec §5:
    {status, value, threshold, confidence, contributingIslands, ...}
  עזרי aggregate (החלש מנצח · §10 ב-spec) ו-confidence (§7)
  API קיים נשמר 1:1 (checkMastery, ISLAND_TO_RAMA, וכו')

4 החלטות פדגוגיות שהוטמעו:
  1. Aggregate משימה רב-אית = Min (החלש מנצח)
  2. משימה 1 (זיהוי אותיות) — סטטוס לפי count אמיתי של אותיות
     שנשלטו (לא BKT proxy — 1/22 מצוין אינו "near 18")
  3. Confidence: <10→low · 10-29→med · 30+→high
     downgrade ל-med אם stale 7+ ימים · ⚠ אם 14+ ימים
  4. PIN: השוואה ישירה במקום SHA-256 (אותה רמת אבטחה בקוד-לקוח,
     post-pilot Apps Script לפי spec §6)

scripts/test-rama-task-status.js — 8 בלוקי smoke (30 assertions ✓)
  בודק: APIs · RAMA_TASKS structure · תלמידה ריקה → cold ·
  return shape · status פדגוגי (1/15/18) · aggregation min ·
  confidence thresholds · backwards compat.

לא נגעתי: bkt.js / epa.js / event-logger.js / teacher-live.html /
stage-*.html / map.html / student-picker.html / D.14/D.15 files.

קוראים API בלבד · spec ב-_handoff/2026-05-27-F21A-ux-spec.md
```

**מסלול בדיקה ידנית של מיטל לפני אישור push:**
1. `cd avnei-yesod && python -m http.server 8765`
2. `http://localhost:8765/underwater-app/teacher-rama.html` — PIN gate (4521)
3. Class View daily + Pulse Snapshot mode
4. Student View (לפחות תלמידה אחת)
5. רגרסיה: `teacher-live.html` עדיין עובד כרגיל

**אם נמצא באג** → איטרציה לפני push. **אם הכל תקין** → push קבוצה N.

---

## 🟡 קבוצה M — D.15 שלב 1 · 3 אותיות בועות (ל · נ · א)

**סטטוס:** 🟡 דורש בדיקת מיטל ידנית לפני push
**תאריך:** 2026-05-27 ערב
**14 קבצים (10 חדשים + 1 שינוי + 3 handoff updates) · חבילה אחת · לא לפצל**

| # | קובץ | סטטוס שינוי | הערה |
|---|---|---|---|
| 1 | `underwater-app/data/island-03-letters/lamed.json` | **חדש** | quest_id=`lamed-bubbles` · theme=`bubbles` · mechanic=`tap-all` · distractors מעודכנים (ש במקום ל) |
| 2 | `underwater-app/data/island-03-letters/nun.json` | **חדש** | quest_id=`nun-bubbles` |
| 3 | `underwater-app/data/island-03-letters/alef.json` | **חדש** | quest_id=`alef-bubbles` |
| 4 | `underwater-app/scripts/generate-bubbles-letters-audio.py` | **חדש** | edge-tts · 3 אותיות × 2 קבצים = 6 MP3 בהרצה אחת. שמות אותיות במנוקד מלא (לָמֶד / נוּן / אָלֶף) |
| 5 | `underwater-app/assets/audio/intro-lamed.mp3` | **חדש** | AvriNeural · rate -10% · ניסוח מאוחד פתיחה+משימה |
| 6 | `underwater-app/assets/audio/find-lamed.mp3` | **חדש** | "מצאו את כל הבועות עם האות לָמֶד בים" |
| 7 | `underwater-app/assets/audio/intro-nun.mp3` | **חדש** |  |
| 8 | `underwater-app/assets/audio/find-nun.mp3` | **חדש** |  |
| 9 | `underwater-app/assets/audio/intro-alef.mp3` | **חדש** |  |
| 10 | `underwater-app/assets/audio/find-alef.mp3` | **חדש** |  |
| 11 | `underwater-app/stage-3-lamed.html` | **חדש** | מבוסס stage-3-template-demo · letterKey='lamed' · href חזרה ל-stage-3-island.html |
| 12 | `underwater-app/stage-3-nun.html` | **חדש** | letterKey='nun' |
| 13 | `underwater-app/stage-3-alef.html` | **חדש** | letterKey='alef' |
| 14 | `underwater-app/stage-3-island.html` | שינוי | מ-5 ל-22 הרפתקאות מקובצות ב-5 נושאים · `.quest-group*` CSS חדש · animation-delay זז ל-`--card-delay` מחושב · progress label `0/22` |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד D.15 שלב 1 |
| + | `_handoff/meytal-pending.md` | בלוק חדש בראש | בדיקה ידנית של 3 אותיות + מסך אי 3 |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו |

**מהות התוצר:**
שלב 1 מתוך 5 של D.15. הקבוצה "בועות בים" עוברת מ-1 אות חיה (ש demo) ל-4 אותיות חיות (ש · ל · נ · א). אדיטיבי לחלוטין — לא נגע ב-game-shell / mechanic-tap-all / css / 5 משחקונים אמנותיים.

**יחס לקבוצות שכבר נדחפו / ממתינות:**
- ❌ אין חפיפת קבצים עם A.1 / A.3 / A.4 (BKT / EPA / Sub-BKT) — D.15 לא נוגע ב-js/shared
- ❌ אין חפיפת קבצים עם J (D.14) — D.14 כבר נדחפה כקבוצה J ב-`???` (טרם הומלצה ל-push בקובץ הזה — לוודא עם מיטל)
- D.15 שלב 1 משתמש בתבנית של D.14 (game-shell + mechanic-tap-all + shin.json template). אם D.14 עוד לא ב-`main` — חבילה זו דורשת ש-D.14 תידחף קודם.

**לא חוסם דבר נוסף:** התשתית theme-aware (לקבוצות 3-5) ובניית קבוצות כוכבים/צדפים/דגים יזרמו בקבוצות M.2, M.3, M.4, M.5 בנפרד.

**לפני push (חובה — סביבת ריבוי-סוכנים):**
```
git fetch origin && git status
```

**הצעת message לקומיט (HEREDOC):**
```
D.15 שלב 1 — קבוצת בועות שלמה: ש · ל · נ · א

הוספת 3 האותיות החסרות בקבוצת "בועות בים" של D.14.
הקבוצה עוברת מ-1 אות חיה (ש demo) ל-4 אותיות חיות.

3 קבצי JSON חדשים ב-data/island-03-letters/:
  lamed.json (quest_id=lamed-bubbles)
  nun.json   (quest_id=nun-bubbles)
  alef.json  (quest_id=alef-bubbles)

3 קבצי HTML חדשים מבוססים על stage-3-template-demo.html —
שכפול עם letterKey מקושח + href חזרה ל-stage-3-island.html
(לא map.html, כי האחר יהיה נכון רק עבור template-demo).

6 קבצי MP3 חדשים (AvriNeural · rate -10%):
  intro-{lamed,nun,alef}.mp3 — ניסוח מאוחד פתיחה+משימה
                                (iOS Safari-safe, כמו intro-shin)
  find-{lamed,nun,alef}.mp3  — הוראה במשחק

scripts/generate-bubbles-letters-audio.py מייצר את כל 6
בהרצה אחת. שמות אותיות במנוקד מלא (לָמֶד / נוּן / אָלֶף) לפי
[[feedback-tts-hebrew-niqud-pitfalls]].

stage-3-island.html שודרג מ-5 הרפתקאות (sequential) ל-22
מקובצות ב-5 נושאים. CSS חדש (.quest-group__*), animation-delay
מחושב פר כרטיס (--card-delay) במקום :nth-child(N) קשיח.
13 ההרפתקאות שטרם נבנו (כוכבים/צדפים/דגים) מסומנות
state-coming-soon.

נעילה הדרגתית נשמרה 1:1 — prevCompleted gates next.

4 החלטות שאישרה מיטל לפני קוד:
  intro audio = פר אות (כמו shin הקיים)
  SVG inline = Overlay מעל ה-tile (לשלב 2+)
  island map = 22 בעמוד אחד, מקובצים פר נושא
  סדר = שלב 1 (בועות) קודם, לפני תשתית theme-aware

לא נגעו: bkt.js / epa.js / event-logger.js / mastery-check.js
/ profile-classifier.js / js/templates/* / css/game-shell.css
/ 5 משחקוני אי 3 / stage-3-template-demo.html / מסמכי-אם.
```

**מסלול בדיקה ידנית של מיטל לפני אישור push:**
1. הפעלת `python -m http.server 8765` מ-`avnei-yesod/`
2. `http://localhost:8765/underwater-app/stage-3-island.html` — 22 הרפתקאות בעמוד אחד מקובצות
3. לפחות אחת מ-`stage-3-lamed.html` / `stage-3-nun.html` / `stage-3-alef.html` מקצה לקצה
4. רגרסיה ב-shin (`stage-3-template-demo.html` עדיין עובד)
5. רגרסיה ב-2 מ-5 המשחקונים האמנותיים (shell + storm)

**אם נמצא באג** → איטרציה לפני push. **אם הכל תקין** → push קבוצה M, מתחילים שלב 2 (תשתית theme-aware ב-game-shell + mechanic-tap-all + game-shell.css לקראת כוכבים).

---

## ✅ קבוצה L — F.21A-spec + D.15-spec · 2 מסמכי spec (נדחפה 27.5 ערב · `10f6a33`)

**סטטוס:** ✅ נדחפה
**תאריך:** 2026-05-27 ערב
**Commit:** `10f6a33`
**2 קבצים חדשים + 3 handoff updates · חבילה אחת**

| # | קובץ | סטטוס שינוי | הערה |
|---|---|---|---|
| 1 | `_handoff/2026-05-27-F21A-ux-spec.md` | **חדש** (~700 שורות) | wireframe + UX spec מלא ל-F.21A · 12 סקציות + 2 נספחים · 5 החלטות UX סגורות עם מיטל · 7 use cases · מיפוי API → UI · 12 acceptance criteria |
| 2 | `_handoff/2026-05-27-d15-spec.md` | **חדש** (~170 שורות) | spec מלא ל-D.15 (שכפול ל-17 אותיות באי 3) · נכתב ע"י סוכן D.14 לפני סגירה · P0 חוסם פיילוט · 4 קבוצות נושאיות סגורות (בועות/כוכבים/צדפים/דגים) · אומדן 12-15 שעות לסוכן ביצוע |
| + | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי קל | הוספת שורת `F.21A-spec ✅` לפני שורת `F.21A` בפאזה F · עדכון "מוכן להתחיל" · header 40 → 41 משימות |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד F.21A-spec |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו |

**מהות התוצר:**
מסמך spec שיחסום את שלב הקוד של F.21A. סוכן הקוד יקבל פרומפט שמצביע על המסמך כקריאה חובה. כל ההחלטות העיצוביות-עליונות סגורות; הקוד יישם בלבד.

**יחס לקבוצות שכבר נדחפו / ממתינות (I=A.1, H=A.3, K=A.4):**
- F.21A-spec לא נגעה בקבצי קוד כלל (רק markdown + HTML של tracker)
- אין חפיפת קבצים → אין קונפליקט merge עם A.1/A.3/A.4/D.14
- A.4 (קבוצה K, ממתינה ל-push) — F.21A-spec **קוראת ב-§5** את ה-API של A.4 (`getLetterMasteryDistribution`, `getLetterState`) כפונקציות מצופות; אם A.4 נדחפת **אחרי** L → אין בעיה (ה-API קיים בקוד גם אם לא ב-main בעת קריאת ה-spec). הסדר אינו קריטי.

**🎯 פונקציה חדשה שמסומנת ב-spec לבנייה בשלב הקוד:**
`AvneiMasteryCheck.checkRamaTaskStatus(studentId, ramaTaskId)` — הרחבה של `mastery-check.js` הקיים. חתימה מלאה בסעיף 5 של ה-spec. סוכן הקוד יבנה אותה כחלק מ-F.21A.

**לא חוסם דבר נוסף:** קבוצה L היא תיעוד, לא קוד. ניתן לדחוף ללא תלות במצב של K, J, או כל קבוצה אחרת.

**לפני push (חובה — סביבת ריבוי-סוכנים):**
```
git fetch origin && git status
```

**הצעת message לקומיט (HEREDOC):**
```
F.21A-spec · wireframe + UX spec למסך מורה בשפת ראמ"ה

מסמך עיצובי שחוסם את שלב הקוד של F.21A. F.21A נשארת
פתוחה ב-tracker; F.21A-spec נסגרת כשורה נפרדת (פיצול
שמיטל אישרה כדי לתעד ש"מוכן להתחיל" קוד).

5 החלטות UX שנסגרו עם מיטל לפני כתיבת ה-spec:
  - מבנה תצוגה ראשי = טבלה (תלמידות × משימות, צבע פר תא)
  - View ראשי = 2 כפתורים שווי-משקל בכניסה
  - רמת פירוט פר תלמידה = הכל + Confidence indicators
  - תצוגת פעימה = Daily mode + Snapshot mode (toggle)
  - פרטיות = URL נפרד (teacher-rama.html) + PIN בsessionStorage

תוצרים:
  spec יחיד: 12 סקציות + 2 נספחים
  4 ASCII mockups: Class View · Student View · Snapshot · PIN Gate
  7 use cases מתועדים
  מיפוי data → UI מלא לכל אלמנט במסך
  12 acceptance criteria לסוכן הקוד
  פונקציה חדשה מצוינת לבנייה: checkRamaTaskStatus

נגזרים מ-spec ל-handoff:
  5 שאלות פתוחות שעוד דורשות אישור מיטל לפני קוד
  (תחילת פעימה 1 · PIN default · inline vs קובץ נפרד · ...)
  
לא נגעו: teacher-live.html, mastery-check.js, כל js/shared.
F.21A יחיה כקובץ חדש teacher-rama.html (לא inline replace).
```

**מסלול בדיקה ידנית של מיטל לפני אישור push:**
1. קריאה של `_handoff/2026-05-27-F21A-ux-spec.md` מקצה לקצה
2. אישור שה-wireframes ב-§3 משקפים את הכוונה
3. אישור שהפיצול ל-`F.21A-spec ✅` + `F.21A ⏳` הוא הצורה הרצויה ב-tracker

**🟢 כל 5 השאלות הפתוחות נסגרו ב-27.5.2026 ערב:**
1. ✅ פעימה 1 = 1.9.2026
2. ✅ PIN cosmetic לפיילוט
3. ✅ `teacher-rama.html` קובץ נפרד (לא inline replace)
4. ✅ checkRamaTaskStatus aggregation = Min (החלש מנצח)
5. ✅ Practice gap = Downgrade Confidence (לא BKT) · 0-7 ✅ · 7-14 🟡 · 14+ 🟡 + אזהרה בולטת

ה-spec עודכן בהתאם (§9 + §10). סוכן קוד יכול להתחיל מיד אחרי push.

---

## ✅ קבוצה K — A.4 · Sub-BKT פר 22 אותיות (נדחפה 27.5 ערב · `1582a96`)

**סטטוס:** ✅ נדחפה ל-origin/main · 53/53 smoke tests עברו
**תאריך:** 2026-05-27 ערב
**Commit:** `1582a96` (`dac1595..1582a96`)
**1 קובץ שונה + 1 חדש + 2 handoff updates · חבילה אחת**

| # | קובץ | סטטוס שינוי | הערה |
|---|---|---|---|
| 1 | `underwater-app/js/shared/bkt.js` | שינוי מרכזי | הרחבה ל-22 אותיות · API חדש: getLetterState · getWeakestLetters · getLetterMasteryDistribution · מיגרציה אוטומטית + backfill מ-island 3 |
| 2 | `underwater-app/scripts/test-bkt-letters.js` | חדש (~220 שורות) | 12 בלוקי-בדיקה · 53 assertions · רגרסיה ל-22 אותיות + backwards compat A0.1/A0.3 + מיגרציה non-destructive |
| + | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי קל | A.4 ✅ · checkbox checked + עדכון טבלת "מוכן להתחיל" |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד A.4 |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו |

**יחס לקבוצות שכבר נדחפו (A.1 = `b4c0145`, A.3 = `3c063bb`):**
- A.4 משנה רק את `bkt.js` (קובץ של A.1 בלעדית) — לא קונפליקט עם A.3
- A.4 שומר 1:1 את ה-API של A.1 — `getStudentState`, `getIslandState`, `checkMastery`, `getStrandState`, `getStudentStrands`, `checkStrandMastery`, `getPerLetterState`, `setInitialState`, `recommendInitialTier` — כולם ממשיכים לעבוד
- A.4 לא נגע ב-`epa.js`/`event-logger.js`/`mastery-check.js`/`profile-classifier.js`

**יחס ל-D.14 (טרם נדחפה — קבוצה J):**
- D.14 הגדירה 22 letter-keys ב-`data/island-03-letters/_schema.md`. A.4 משתמש בדיוק באותה רשימת 22 אותיות (`ALL_HEBREW_LETTERS_22`) — single source of truth
- אין חפיפת קבצים → אין קונפליקט merge

**לא חוסם דבר נוסף:** A.4 פותח את F.21A (יכולה לקרוא `getLetterMasteryDistribution`) ואת D.15 (כל אות חדשה כבר מקבלת sub-BKT אוטומטית).

**לפני push (חובה — סביבת ריבוי-סוכנים):**
```
git fetch origin && git status
```

**הצעת message לקומיט (HEREDOC):**
```
A.4 — Sub-BKT פר 22 אותיות בסטרנד פונולוגיה

הרחבה מ-5 אותיות (מ/ק/ב/ר/ת — 5 המשחקונים הקיימים) ל-22
האותיות העבריות. ALL_HEBREW_LETTERS_22 הוא הרשימה הקנונית
היחידה — תואם בדיוק את data/island-03-letters/_schema.md
של D.14.

3 API חדשים נחשפים:
  getLetterState(studentId, letter)
  getWeakestLetters(studentId, n=3, {includeUntouched?})
  getLetterMasteryDistribution(studentId)
    → 4 דליים: mastered / in_progress / weak / untouched

מיגרציה non-destructive: state ישן עם 5 אותיות מתרחב
אוטומטית ל-22 בקריאה הראשונה. ערכי הניסיונות והנשלטות
הקיימים נשמרים. Backfill חד-פעמי מ-island 3 ל-strand 1
לילדות שהיו במערכת לפני A.1.

API חיצוני נשמר 1:1 — A0.1 (suggestFromBKT), A0.3
(mastery-check), event-logger ממשיכים לעבוד.

ISLAND_3_LETTERS עדיין = 5: mastery של "אי 3 נסגר"
דורש 5 משחקונים פעילים. ייעדכן ל-22 כש-D.15 ישלים את
17 המשחקונים החסרים.

Smoke tests:
  scripts/test-bkt.js          — 4/4 פערים A.1 עוברים זהים
  scripts/test-bkt-letters.js  — 53/53 חדשים עוברים
```

**מסלול בדיקה ידנית (אופציונלי — smoke tests מספיקים):**
```
cd c:/Users/meyta/Downloads/impactos/avnei-yesod
python -m http.server 8765
```
1. `http://localhost:8765/underwater-app/map.html` → picker → תלמידה אמיתית
2. שחק 2-3 משחקונים באי 3
3. DevTools console:
   ```js
   AvneiBKT.getLetterMasteryDistribution(localStorage.getItem('avnei-yesod-current-student'))
   AvneiBKT.getWeakestLetters(localStorage.getItem('avnei-yesod-current-student'), 5)
   AvneiBKT.getLetterState(localStorage.getItem('avnei-yesod-current-student'), 'מ')
   ```
   צפוי: distribution מציג mastered + untouched (17), getLetterState על מ עם attempts ו-pKnown אמיתיים

---

## 🟡 קבוצה J — D.14 · חילוץ תבנית גנרית מ-5 משחקוני אי 3 (עודכן 27.5.2026 ערב)

**סטטוס:** 🟡 דורש בדיקת מיטל ידנית ב-demo לפני push
**תאריך:** 2026-05-27 (עודכן ערב — Full C נבחר)
**12 קבצים חדשים + 1 שונה + 4 handoff updates · חבילה אחת · לא לפצל**

| # | קובץ | סטטוס שינוי | הערה |
|---|---|---|---|
| 1 | `underwater-app/js/templates/game-shell.js` | חדש (~225 שורות) | shell משותף · `AvneiGameShell.start(config)` · תומך ב-`inGamePromptAudioKey` |
| 2 | `underwater-app/js/templates/mechanic-tap-all.js` | חדש (~195 שורות) | plug-in מ-storm/trail · `window.AvneiMechanics['tap-all']` · משתמש ב-`inGamePromptAudioKey` |
| 3 | `underwater-app/js/templates/mechanic-pick.js` | חדש (172 שורות) | plug-in מ-rescue · `window.AvneiMechanics['pick']` |
| 4 | `underwater-app/js/templates/mechanic-quest.js` | חדש (171 שורות) | plug-in מ-shell/house · משתמש ב-js/activities/* קיימים |
| 5 | `underwater-app/css/game-shell.css` | חדש (~310 שורות) | sgylonot משותפים + 2 mechanics + confetti/kisses + `.intro-speaker` + `.start-btn` + bubbles theme |
| 6 | `underwater-app/data/island-03-letters/_schema.md` | חדש | סכמת JSON פר-אות + **Full C: 4 קבוצות נושאיות מאושרות** + חלוקת 17 אותיות |
| 7 | `underwater-app/data/island-03-letters/shin.json` | חדש | קובץ demo (אות ש) · נושא "בועות" · `theme: "bubbles"` |
| 8 | `underwater-app/stage-3-template-demo.html` | חדש | HTML demo שטוען shin.json ומריץ את התבנית |
| 9 | `underwater-app/scripts/generate-shin-demo-audio.py` | חדש | סקריפט edge-tts לייצור 3 קבצי MP3 לאות ש |
| 10 | `underwater-app/assets/audio/intro-shin-quest.mp3` | חדש | AvriNeural · "נוני מצא בועות זוהרות בים..." |
| 11 | `underwater-app/assets/audio/intro-shin-mission.mp3` | חדש | AvriNeural · "בואו תקישו על כל הבועות עם האות שין..." |
| 12 | `underwater-app/assets/audio/find-shin.mp3` | חדש | AvriNeural · "מצאו את כל הבועות עם האות שין בים." (in-game) |
| 13 | `underwater-app/js/shared/audio.js` | שינוי קל | `LETTER_TO_SOUND_FILE` מ-5 ל-22 אותיות (תוספת בלבד) |
| + | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי קל | D.14 ✅ |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד D.14 + עדכון 27.5 ערב על Full C |
| + | `_handoff/meytal-pending.md` | בלוק חדש בראש | בדיקת demo + אישור ויזואל "כוכבים" של D.15 |
| + | `_handoff/2026-05-27-d15-spec.md` | **חדש (קובץ חדש)** | ספק מלא ל-D.15 — 4 קבוצות, סדר בנייה, שורות אודיו, SVG inline guidelines |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו |

**יחס לקבוצות שכבר נדחפו / ממתינות (I=A.1, H=A.3, K=A.4):**
- D.14 לא נגעה בקבצי הליבה (bkt.js, epa.js, event-logger.js, mastery-check.js, profile-classifier.js)
- D.14 רק קוראת את ה-API שלהן (`AvneiBKT.*`, `AvneiEPA.ingestEvent`, `AvneiEventLogger.logActivityResult`, `AvneiMasteryCheck.checkAndShowIslandCelebration`)
- אין חפיפת קבצים → אין קונפליקט merge עם A.1/A.3/A.4

**🎯 החלטה אסטרטגית של D.15 נסגרה במהלך בדיקת D.14:** Full C — 4 קבוצות נושאיות (🫧בועות / ⭐כוכבים / 🐚צדפים / 🐟דגים), חלוקת 17 אותיות אושרה ע"י מיטל. הספק המלא ב-`_handoff/2026-05-27-d15-spec.md`.

**לא לדחוף עדיין כי:**
- 🟡 demo (`stage-3-template-demo.html`) דורש סבב בדיקה ידנית של מיטל מקצה לקצה לפני push (5-10 דק')
- ⚠️ ייתכן שתידרש התאמה אם הבדיקה הידנית מגלה רגרסיה ב-5 המשחקונים הקיימים (לא צפוי — התבנית אדיטיבית — אבל worth verifying)

**לפני push (חובה — סביבת ריבוי-סוכנים):**
```
git fetch origin && git status
```

**הצעת message לקומיט (HEREDOC):**
```
D.14 — חילוץ תבנית גנרית מ-5 משחקוני אי 3 + spec ל-D.15

ארכיטקטורה "בסיס משותף + 3 plug-ins" (שאישרה מיטל לפני קוד):

  game-shell.js   — overlay + top-bar + noni + audio + completion
                    + finale + mastery hook
  mechanic-tap-all  — N tiles, T targets (storm + trail extracted)
  mechanic-pick     — N rounds × M pods   (rescue extracted)
  mechanic-quest    — polymorphic stages  (shell + house extracted)

8 קבצי קוד חדשים + 1 שינוי ל-audio.js (LETTER_TO_SOUND_FILE
מ-5 ל-22 אותיות, כל sound-X.mp3 כבר קיים ב-AvriNeural).

Demo: stage-3-template-demo.html טוען shin.json ומריץ tap-all
על אות ש. 3 קבצי MP3 חדשים (intro-quest + intro-mission +
find-shin) נוצרו דרך scripts/generate-shin-demo-audio.py.

מהלך הבדיקה הציף 3 גילויים שנשמרו לזיכרון:
  - AvriNeural קורא קמץ-קטן כ-"kal" → כותבים "כֹּל" בחולם
  - ניסוח טבעי לבני 6: "ה-X עם האות Y", לא "X-י Y"
  - ילד בן 6 לא קורא → אודיו חייב לומר משימה מלאה

החלטת אסטרטגיה ל-D.15 הוסכמה במהלך הבדיקה: Full C — 4
קבוצות נושאיות (בועות/כוכבים/צדפים/דגים), 17 האותיות חולקו.
ספק מלא ב-_handoff/2026-05-27-d15-spec.md.

5 המשחקונים הקיימים (shell/house/rescue/trail-resh/storm) לא
נגעו. התבנית אדיטיבית בלבד.
```

**מסלול בדיקה ידנית שמיטל מבצעת לפני אישור push:**
1. `cd c:/Users/meyta/Downloads/impactos/avnei-yesod/underwater-app`
2. `python -m http.server 8765` (או `npx serve`)
3. פתח `http://localhost:8765/stage-3-template-demo.html`
4. צפוי:
   - overlay "מסע השמש"
   - מקיש על intro-speaker → לא משמיע (אין `intro-shin-*.mp3`) — זה תקין כברירת מחדל
   - לוחץ "בוא/י נתחיל"
   - 12 אריחים בים, 5 מהם עם ש׳
   - מקיש על כל ה-ש׳-ים בכל סדר → כל אחד מואר, נוני שמח, מונה עולה
   - אחרי 5 → finale עם confetti+kisses + completion overlay
5. בדיקת רגרסיה ב-5 הקיימים (חוזרים למפה ומשחקים shell/storm — לא אמורים להשתבש)

---

## ✅ קבוצה I — A.1 · BKT-per-strand (נדחפה 27.5.2026 · `b4c0145`)

**2 קבצים · ממתין לאישור מיטל:**

| # | קובץ | סטטוס שינוי | הערה |
|---|---|---|---|
| 1 | `underwater-app/js/shared/bkt.js` | שיכתוב | dual-write + compat layer + API חדש פר-strand |
| 2 | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי קל | A.1 ✅ |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד A.1 |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו |

**יחס לקבוצה H (A.3 EPA):**
- A.3 שינה את `event-logger.js` (12 שורות). אני לא נגעתי שם — אין קונפליקט.
- A.3 קורא ל-`AvneiBKT.ingestEvent` כרגיל; ה-dual-write שלי בולע את ה-event בשני המקומות.
- ניתן לדחוף את שתי הקבוצות בנפרד או יחד. סדר: H או I — לא משנה.

**לפני push (חובה — סביבת ריבוי-סוכנים):**
```
git fetch origin && git status
```

**הצעת message לקומיט (HEREDOC):**
```
A.1 — BKT-per-strand (5 מודלים) · dual-write + compat layer

bkt.js שוכתב כך שמנוע BKT מחזיק 5 BKT-ים פר ילדה (סטרנד),
בנוסף ל-state ה-per-island הקיים. API חיצוני נשמר 1:1 — A0.1
(suggestFromBKT) ו-A0.3 (mastery-check) ממשיכים לעבוד בלי שינוי.

Dual-write storage:
  avnei-bkt-v1         (legacy per-island — נשמר חי)
  avnei-bkt-strand-v1  (חדש per-strand — 5 BKT-ים פר ילדה)

API חדש:
  getStrandState, getStudentStrands, checkStrandMastery,
  getPerLetterState (compat layer ל-A0.1),
  ISLAND_TO_STRAND, STRAND_NAMES, PARAMS_PER_STRAND,
  FLUENCY_THRESHOLD_PER_STRAND_MS.

מיפוי (מ-22-islands-validated):
  strand 1 phonology    -> איים 1-8
  strand 2 morphology   -> איים 9-11
  strand 3 oral         -> איים 12-14
  strand 4 reading      -> איים 15-18
  strand 5 writing      -> איים 19-22

per_letter ב-island 3 ממשיך לחיות (legacy) + mirror תחת strand 1.
2 בדיקות עברו: test-bkt.js הקיים + smoke test פר-strand.
```

**אזהרה:** לא לערבב עם פאקים חודשיים / מסמכי-אם — אלה דורשים אישור פר-קובץ (F4 🔴).

---

## ✅ קבוצה H — A.3 · מודול EPA (נדחפה 27.5.2026 · `3c063bb`)

**12 קבצים · אחד חבילה אחת · לא לפצל:**

| # | קובץ | סטטוס שינוי | הערה |
|---|---|---|---|
| 1 | `underwater-app/js/shared/epa.js` | חדש (234 שורות) | מודול EPA — `window.AvneiEPA` |
| 2 | `underwater-app/js/shared/event-logger.js` | שינוי קל (12 שורות) | בלוק `if (window.AvneiEPA)` אחרי בלוק BKT |
| 3 | `underwater-app/stage-3-shell.html` | שורה אחת | `<script src="js/shared/epa.js">` |
| 4 | `underwater-app/stage-3-house.html` | שורה אחת | אותו דבר |
| 5 | `underwater-app/stage-3-storm.html` | שורה אחת | אותו דבר |
| 6 | `underwater-app/stage-3-rescue.html` | שורה אחת | אותו דבר |
| 7 | `underwater-app/stage-3-trail-resh.html` | שורה אחת | אותו דבר |
| 8 | `underwater-app/stage-3.html` | שורה אחת | אותו דבר |
| 9 | `underwater-app/stage-2-whispers.html` | שורה אחת | אותו דבר |
| 10 | `underwater-app/stage-2-twin-seaweeds.html` | שורה אחת | אותו דבר |
| 11 | `underwater-app/stage-2-fish-schools.html` | שורה אחת | אותו דבר |
| 12 | `underwater-app/teacher-live.html` | שורה אחת | אותו דבר |
| + | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי קל | A.3 ✅ |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד A.3 |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש | הקבוצה הזו |

**הצעת message לקומיט (HEREDOC):**
```
A.3 — מודול EPA (Error Pattern Analysis) · 3 צירים

ספירה תיאורית של טעויות פר ילדה×אי×אות על 3 צירים אורתוגונליים:
- failure (Shape/Sound/Name/Direction)
- context (isolation/initial/medial/final/font)
- task (recognition/find/name/write)

מודול חדש js/shared/epa.js בלי לגעת ב-bkt.js או 5 הדגלים האוטומטיים.
נקרא מ-event-logger.js אחרי AvneiBKT.ingestEvent, פעיל רק על is_correct=false.
threshold default 40% (Direction 30% override) לפי partners-review-v3 §6.
MIN_FAILURES_FOR_PATTERN=3 למניעת רעש על מדגם זעיר.

API: ingestEvent · getEPA · getDominantPattern · dump · reset
localStorage key נפרד: avnei-epa-v1
נצרך עתידית ע"י B.8 (intervention matcher), B.9 (group suggester), 21A.

14 smoke tests עברו ב-Node לפני push.
```

**אזהרה:** לא לערבב עם פאקים חודשיים / מסמכי-אם — אלה דורשים אישור פר-קובץ (F4 🔴).

---

## סיכום A1

| קבוצה | קבצים | Hash | תאריך |
|---|---|---|---|
| A — אי 3 · 70 PNG + CSS | 73 | `d48d6f8` | 26.5.2026 |
| B — handoff docs | 7 | `57778d8` | 26.5.2026 לילה |
| C — research + KB + library + vocab + ארכיון (+DEPRECATED) | 20 | `e3715bf` | 27.5.2026 |
| **סה"כ** | **100** | | |

**נשאר פתוח (חסום על החלטות):**
- D 🟡 — 6 קבצים (README/index/demo-day2) — ממתין לעדכון מסמכי-אם
- F 🔴 — 14 קבצים (מסמכי-אם + בר-און + פאקים + INVALIDATED) — דורש החלטות פר-קובץ

---

## ✅ קבוצה C — Research + KB sources + Library + Vocab + ארכיון v1/v2 (נדחפה 27.5.2026)

**Commit:** `e3715bf` · 20 קבצים

**מה נכלל:**
- 4 research mds ב-`curriculum/blueprint/islands/`
- 7 KB sources תקפים *(`22-islands-validated` + 6 perplexity validations)*
- 2 קבצי `docs/interventions/library-v1*.md`
- `curriculum/open-questions-for-experts.md`
- `curriculum/vocab-bank.json`
- 5 ארכיון v1/v2 *(2026-05-25 md+html+pdf · 2026-05-26-v2 md+html)* — **עם באנרי DEPRECATED** המפנים ל-v3

**מה לא נכלל (נשאר ב-F4 🔴):**
- `perplexity-shatil-share-2003-validation-2026-05-25.json` *(_INVALIDATED:true)*

---

## ✅ קבוצה B — handoff docs (נדחפה 26.5.2026 לילה)

**Commit:** `57778d8` · 7 קבצים (כולל מחיקת `2026-05-26-a0-1-handoff.md` ומיזוגו ל-agent-completion-log.md)

---

## ✅ קבוצה G — A0.3 · Mastery משולש (נדחפה 27.5.2026)

**קבצים שנדחפו (8):**
- `underwater-app/js/shared/mastery-check.js` (חדש)
- `underwater-app/stage-3-shell.html` · `stage-3-house.html` · `stage-3-storm.html` · `stage-3-trail-resh.html` · `stage-3-rescue.html` · `js/rescue-controller.js` — script tag + hook
- `underwater-app/teacher-live.html` — סקציה 6 + CSS + renderMasteryStatus + תיקון STATE_KEY ('avnei-state-v1' → 'underwater-app:v1' דרך state.js)
- `_handoff/2026-05-26-architecture-tasks-tracker.html` — A0.3 ✅

**הערה:** התיקון STATE_KEY שתוכנן כקומיט נפרד נכלל בקומיט הזה — בלעדיו A0.3 לא רץ (SyntaxError על הצהרה כפולה). באג צד-בונוס שתוקן: סקציות 1-5 ב-teacher-live שהציגו "אין נתונים" — עכשיו עובדות.

---

## 📌 כבר ב-git — 13 קומיטים מאז `bb8754a` (לא לדחוף שוב)

מאז שהתחלנו את הסקירה הזו, 13 קומיטים נוספים נדחפו ל-`main`:

| Hash | תיאור | קבצים שהיו ב"ממתינים" |
|---|---|---|
| `bb8754a` | partners doc v3 — 5 סטרנדים *(שלי)* | partners-review-v3.md |
| `4b876a4` | A0.1 · פרופיל אורייני ב-onboarding | onboarding-profile.html, profile-classifier.js |
| `1916fb6` | A0.4 · משחקון ים השמועות (יצירה ראשונית) | whispers.css, stage-2-whispers.html |
| `299216e` | A0.1 · הצעה אוטומטית מ-BKT | — |
| `2338b2c` | tracker + 3 docs | architecture-tasks-tracker.html, agent-completion-log.md, meytal-pending.md, pending-commits.md |
| `07c9af3` | A0.1 · student-picker | — |
| `7ad8e7b` | F.22 · דף אינדקס לאי 2 | — |
| `d57fad4` | A0.1 · הסרת onboarding.html | — |
| `a5e41c8` | A0.1 · picker empty-state | — |
| `0faa5ec` | A0.4 · whispers JSON fix *(שלי)* | island-02-whispers.json |
| `562a11d` | A0.4 · 29 MP3 AvriNeural | — |
| `f99161f` | A0.1 · classifier ↔ mastery.js | — |
| `1556c4f` | tracker · A0.4 note (29 MP3) | — |
| `942f148` | architecture-tasks.md — A0.4 + F.22 ✅ | _handoff/2026-05-25-architecture-tasks.md |
| `c5cd49a` | A0.1 · debug panel | (יצר את 2026-05-26-a0-1-handoff.md — מוטמע ב-log) |
| `f7b2406` | tracker · הוראות פרומפט מעודכנות | _handoff/2026-05-26-architecture-tasks-tracker.html |
| `e00ec7d` | **L3+L4 hardening (אפשרות D)** | **island-03-items.json + harden-l3-l4-distractors.py = קבוצה E** |
| `d48d6f8` | **אי 3 · 70 PNG + CSS** *(שלי)* | **כל קבוצה A** |

**מסקנה:** קבוצות 1, 2, A, E נסגרו במלואן. נשארו B (handoff docs), C (research+library+vocab+ארכיון), D (🟡), F (🔴).

---

## איך עוברים על המסמך (flow מעודכן)

1. **את מאשרת קבוצה ספציפית** ("דחוף קבוצה X").
2. **אני עושה `git fetch + sanity check`** (אם עברו >10 דק' מהסקירה).
3. **אני דוחף את הקבוצה הזו בלבד** וחוזר עם hash.
4. **את עוברת לקבוצה הבאה** — לא חזרה לסריקה מחדש.

קבוצות מסומנות 🔴 לא יוצעו לדחיפה.

---

## קבוצה A — 🟢 אי 3 · 70 PNG + 3 CSS (ready)

**קבצים (73):**
- 70 PNG ב-`engine/content/images/island-03/` *(אסטים PIL crop+center)*
- `underwater-app/css/house-quest.css` *(M)*
- `underwater-app/css/shell-quest.css` *(M)*
- `underwater-app/css/stage-3.css` *(M)*

**מצב:** ✅ ready.

**הודעת קומיט:** `אבני יסוד · אי 3 · 70 PNG (PIL crop+center) + CSS`

---

## קבוצה B — 🟢 handoff docs (תיעוד פנימי)

**קבצים (7):**

*חדשים:*
- `_handoff/agent-bootstraps.md`
- `_handoff/2026-05-26-engine-tech-brief.md`
- `_handoff/orchestrator-handoff-2026-05-25-evening.md`
- `_handoff/2026-05-22-letters-review.md`

*מעודכנים:*
- `_handoff/2026-05-26-partners-review-v3.html` *(תיקון רנדור — תואם ל-MD ב-`bb8754a`)*
- `_handoff/2026-05-25-architecture-tasks.md` *(חדש מאז סריקה קודמת)*
- `_handoff/2026-05-26-architecture-tasks-tracker.html` *(שונה שוב אחרי `1556c4f` — שווה הצצה מהירה לפני push)*

**מצב:** ✅ ready (עם הסתייגות קלה על ה-tracker).

**הודעת קומיט:** `אבני יסוד · handoff docs — bootstraps + tech-brief + רנדור v3 + tasks`

---

## קבוצה C — 🟢 Research + KB sources + Library + Vocab + ארכיון שותפים

**קבצים (19):**

*חדשים — research/blueprint (4):*
- `curriculum/blueprint/islands/island-1-research.md`
- `curriculum/blueprint/islands/island-2-research.md`
- `curriculum/blueprint/islands/island-3-research.md`
- `curriculum/blueprint/islands/island-2-parameters-proposal.md`

*חדשים — knowledge-base sources (6):*
- `curriculum/knowledge-base/sources/22-islands-validated-2026-05-21.json`
- `curriculum/knowledge-base/sources/perplexity-island1-interventions-validation-2026-05-25.json`
- `curriculum/knowledge-base/sources/perplexity-island1-parameters-validation-2026-05-25.json`
- `curriculum/knowledge-base/sources/perplexity-island2-parameters-validation-2026-05-24.json`
- `curriculum/knowledge-base/sources/perplexity-island4-parameters-validation-2026-05-25.json`
- `curriculum/knowledge-base/sources/perplexity-island5-parameters-validation-2026-05-25.json`
- `curriculum/knowledge-base/sources/perplexity-island9-parameters-validation-2026-05-25.json`

*(שים לב: 6 קבצים תקפים. `perplexity-shatil-share-2003-validation` ב-🔴 כי `_INVALIDATED: true`.)*

*חדשים — interventions library (2):*
- `docs/interventions/library-v1.md`
- `docs/interventions/library-v1-island1.md`

*חדשים — open questions (1):*
- `curriculum/open-questions-for-experts.md`

*מעודכן — vocab (1):*
- `curriculum/vocab-bank.json`

*חדשים — ארכיון שותפים v1/v2 (5):*
- `_handoff/2026-05-25-partners-review.md`
- `_handoff/2026-05-25-partners-review.html`
- `_handoff/2026-05-25-partners-review.pdf`
- `_handoff/2026-05-26-partners-review-v2.md`
- `_handoff/2026-05-26-partners-review-v2.html`

**מצב:** ✅ ready (נסרק לבר-און — נקי).

**הודעת קומיט:** `אבני יסוד · research + KB sources + interventions library + vocab + ארכיון v1/v2`

---

## קבוצה D — 🟡 README + index + demo-day2 (מינוח ישן)

**קבצים (6):**
- `README.md` *(M — "9 מיומנויות")*
- `index.html` *(M — "9 מיומנויות")*
- `engine/demo-day2/index.html`
- `engine/demo-day2/student-view.html`
- `engine/demo-day2/teacher-dashboard.html` *(BKT per-island)*
- `engine/demo-day2/day2-state.json`

**מצב:** 🟡 לא לדחוף עד שמסמכי-האם מעודכנים. הדמו והעמודים מציגים מינוח ישן (9 מיומנויות / BKT per-island).

---

## קבוצה E — 🟡 island-03-items.json + script (פעילים)

**קבצים (2):**
- `underwater-app/data/island-03-items.json` *(M — **את פתחת ב-IDE**, אולי פעיל)*
- `underwater-app/scripts/harden-l3-l4-distractors.py` *(?? — סקריפט שמרכך מסיחים, כנראה רץ על items.json)*

**מצב:** 🟡 לא ברור אם יציבים. ה-JSON פתוח ב-IDE שלך. שווה לוודא לפני push.

---

## קבוצה F — 🔴 דורש בדיקה ידנית של מיטל

### F1 — מסמכי-אם (4)
- `architecture-mvp.md` *(M)*
- `curriculum/literacy-grade1-2-yearly.md` *(M)*
- `curriculum/llm-pitfalls.md` *(??)*
- `curriculum/pedagogy-integration-framework.md` *(??)*

### F2 — מצטטים "בר-און" (2 קבצים, 5 מופעים)
- `spec.html` *(M — שורות 613, 1829, 1907)*
- `curriculum/diagnostic-axes-by-island.md` *(?? — שורות 29, 85)*

### F3 — פאקים חודשיים שמצטטים בר-און (7)
- `curriculum/packs/grade1-tashpaz/{september,october,november,december,january,february,march}.json`

### F4 — INVALIDATED (1)
- `curriculum/knowledge-base/sources/perplexity-shatil-share-2003-validation-2026-05-25.json` *(`"_INVALIDATED": true`)*

---

## בעיה היסטורית (לא בסקופ עכשיו)

`curriculum/knowledge-base/sources/world-systems-comparison.json` שורה 340 — tracked, מצטט "6 שלבי בר-און". תיקון בעתיד.

---

## סיכום כמותי

| קבוצה | קבצים | סטטוס |
|---|---|---|
| A — אי 3 PNG + CSS | 73 | ✅ ready |
| B — handoff docs | 7 | ✅ ready |
| C — research + KB sources + library + vocab + ארכיון | 19 | ✅ ready |
| D — README + index + demo-day2 | 6 | 🟡 אחרי master |
| E — island-03-items + script | 2 | 🟡 אישור |
| F1 — מסמכי-אם | 4 | 🔴 |
| F2 — בר-און | 2 | 🔴 |
| F3 — פאקים | 7 | 🔴 |
| F4 — INVALIDATED | 1 | 🔴 |
| **סה"כ ממתין** | **121** | |
