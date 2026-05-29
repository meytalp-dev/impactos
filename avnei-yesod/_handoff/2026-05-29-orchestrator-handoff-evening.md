# Orchestrator Handoff — אבני יסוד
## 29.5.2026 ערב · סוף יום משולש (סוכן 1 + 19 + 22 helper)

> **מה זה המסמך:** מצב מלא של הפרויקט בסוף יום עבודה במקבילות (29.5.2026 ערב). 4 קומיטים מקומיים לא דחופים · 1 סוכן קוד עוד בעבודה · 1 helper agent (סוכן 22) סיים 8 משימות תיעוד.
> **זמן קריאה:** 10-12 דקות.
> **handoff קודם:** `orchestrator-handoff-2026-05-28-day.md` — חלקיו תקפים אבל **המסמך הזה גובר**.

---

## 1. ההישגים של היום (29.5.2026)

### 🟡 4 commits מקומיים — ממתינים לpush מסונכרן

| commit | מה | מי | סטטוס |
|---|---|---|---|
| `c611a92` | test-weakness-targeting fix — Tier 3 expectation 4 → 10 | תזמורת | מקומי |
| `7316272` | orchestrator: archive demo + F.21E pedagogical handoff trail + interventions bootstrap | תזמורת | מקומי |
| `79b1540` | september-2026 pack — 19 → 40 items (סוכן 19) | סוכן 19 | מקומי |
| `d7e86ec` | F.21E — Action Dashboard (UI + helpers + tests · code agent) | סוכן 1 | מקומי · **עוד בעבודה** |

**12/12 tests passing** אחרי הfix של `c611a92`.

### 🤝 helper agent (סוכן 22) — 8 משימות סקירה/תיעוד

ראה report מלא: `_handoff/2026-05-29-orchestrator-helper-report.md`. בקיצור:

| משימה | מה | תוצר |
|---|---|---|
| A2 | Interventions depth map (5 patterns × 5 stages) | כל 25 stages = STUB. דרוש סוכן 21 פדגוגי לעומק |
| A3 | Niqud audit ל-MOY-Lite | 60 items ✓ · 1 bug דקדוקי ב-screener (`הַמְשֵׁךְ` → `הַמְשִׁיכִי`) + 2 errors ללא ניקוד |
| A4 | MEMORY.md review | הצעה לעדכן F.21A vs F.21E split + 3 memories חדשים |
| A5 | 22 stage-3 audit | 17/17 letter games תקינים. 3 הערות stale ב-comments (קוסמטי). shin.json בלי HTML matching [unknown] |
| B1 | Handoff doc 29.5 ערב | זה המסמך |
| C1 | EOY spec bootstrap | `2026-05-29-eoy-spec-agent-prompt.md` |
| C2 | A.5 variants bootstrap | `2026-05-29-a5-variants-agent-prompt.md` (עם OPEN_QUESTION למיטל) |
| C3 | E2E verification bootstrap | `2026-05-29-verification-e2e-agent-prompt.md` |

---

## 2. מצב מסלולים פעילים

### 🟢 סוכן 1 (F.21E code) — בעבודה

קובץ קוד מרכזי: `underwater-app/teacher-action.html` + `underwater-app/js/shared/f21e-helpers.js`. tests ב-`scripts/test-f21e-helpers.js`. UI חדש = action dashboard ("מה לעשות עכשיו?") עבור 3 דקות בבוקר → תכנית פעולה לשיעור.

**מצב מקומי:** modified files: `teacher-action.html`, `f21e-helpers.js`, `scripts/test-f21e-helpers.js`, `pack-bkt-bridge.js` + new files `letter-targets.js`, `test-letter-targets.js`, `seed-demo.html`. commit `d7e86ec` כבר נדחף לקיים מקומית — שינויים נוספים מתרחשים.

⚠️ **תזמורת:** אל תקשור את סוכן 1 לpush מסונכרן עד שהוא מסיים. נטר מצב tests + ממתין לאישור.

### ✅ סוכן 19 (september items) — סיים

הרחיב את `curriculum/packs/grade1-tashpaz/september-2026.json` מ-19 → 40 פריטים. modified (לא דחוף). אישור פדגוגי של מיטל בוצע בbatches. ✓

### ⏳ סוכן 21 פדגוגי (interventions content) — bootstrap מוכן, לא הופעל

bootstrap קיים ב-`_handoff/` (נכתב 28.5/29.5). 5 קבצי JSON ב-`interventions/` עוברים enhancement. עיבוי examples_to_use · differentiation · troubleshooting. **ממתין לאישור הפעלה ממיטל.**

### ✅ סוכן 22 (helper-orchestrator · זה) — סיים 8/8

תוצרים ב-`_handoff/2026-05-29-*.md`. אפס edits בקוד. אפס commits.

---

## 3. Untracked + שינויים פתוחים

### Modified (4 קבצים)

```
M avnei-yesod/curriculum/packs/grade1-tashpaz/september-2026.json   ← סוכן 19 (אושר פדגוגית)
M avnei-yesod/underwater-app/js/shared/f21e-helpers.js               ← סוכן 1 (בעבודה)
M avnei-yesod/underwater-app/js/shared/pack-bkt-bridge.js            ← סוכן 1 (בעבודה)
M avnei-yesod/underwater-app/scripts/test-f21e-helpers.js            ← סוכן 1 (בעבודה)
M avnei-yesod/underwater-app/teacher-action.html                     ← סוכן 1 (בעבודה)
```

### Untracked (6+)

```
?? avnei-yesod/_handoff/2026-05-29-orchestrator-helper-agent-prompt.md   ← bootstrap זה (התחלת היום)
?? avnei-yesod/underwater-app/js/shared/letter-targets.js                ← סוכן 1 (חדש)
?? avnei-yesod/underwater-app/scripts/test-letter-targets.js              ← סוכן 1 (חדש)
?? avnei-yesod/underwater-app/seed-demo.html                              ← סוכן 1 (חדש)
?? inclusion/system-10-pulse-spec.md                                      ← מחוץ ל-scope (פולס לחומש)
?? inclusion/system-10-pulse.html                                         ← מחוץ ל-scope (פולס לחומש)

+ 5 קבצים חדשים מהיום (סוכן 22 · helper):
?? avnei-yesod/_handoff/2026-05-29-orchestrator-helper-report.md
?? avnei-yesod/_handoff/2026-05-29-orchestrator-handoff-evening.md   ← זה
?? avnei-yesod/_handoff/2026-05-29-eoy-spec-agent-prompt.md
?? avnei-yesod/_handoff/2026-05-29-a5-variants-agent-prompt.md
?? avnei-yesod/_handoff/2026-05-29-verification-e2e-agent-prompt.md
```

---

## 4. מסלולים פתוחים — לסוכן תזמורת מחר

### דחוף (P0 — לפני שום סוכן חדש)

1. **לוודא שסוכן 1 (F.21E) סיים** — 12/12 tests עוברים? UI smoke-test ב-browser? אם כן → push מסונכרן של כל 4 הקומיטים + commit חדש שאוסף את 5 קבצי helper.
2. **לאשר עם מיטל push של 4 הקומיטים** — `git fetch origin && git status` → אם clean → push.
3. **לעדכן `agent-completion-log.md`** ו-`2026-05-26-architecture-tasks-tracker.html` (סוכן 22 לא נגע בהם).

### חצי-דחוף (P1)

4. **A3 fix (פיקס דקדוקי 1 שורה):** `engine/moy-screener.html` line 280 — `הַמְשֵׁךְ` → `הַמְשִׁיכִי`. +2 ניקודים על error fallbacks (lines 486, 543).
5. **A5 cleanup (קוסמטי):** 3 הערות stale ב-`stage-3-ayin.html` (line 106) · `stage-3-kaf.html` (line 109) · `stage-3-het.html` (line 102) — לעדכן את ה-`// אות X (yyy) ·` לכתיבה הנכונה.
6. **A4 memory updates:** עדכון `project-avnei-yesod-f21a-vs-f21e-split.md` (F.21E כבר נכתב — לא "לא נבנה עדיין"). יצירת 3 memories חדשים שהוצעו ב-report.
7. **בדיקת shin.json:** [unknown — לבדוק עם מיטל] — האם shin משולב ב-island.html או חסר HTML?

### לא-דחוף (P2 — sequencing להמשך)

8. **אישור הפעלה לסוכן 21 פדגוגי** — bootstrap מוכן, ממתין למיטל.
9. **שיגור סוכן EOY spec** — bootstrap מוכן: `_handoff/2026-05-29-eoy-spec-agent-prompt.md`. post-MOY, לא חוסם פיילוט.
10. **שיגור סוכן A.5 variants** — bootstrap מוכן: `_handoff/2026-05-29-a5-variants-agent-prompt.md`. דורש החלטה פר אות ממיטל לפני הפעלה (OPEN_QUESTION בbootstrap).
11. **שיגור סוכן E2E verification (Playwright)** — bootstrap מוכן: `_handoff/2026-05-29-verification-e2e-agent-prompt.md`. דורש Playwright + Hebrew RTL setup.

---

## 5. 7 שאלות פתוחות מה-Pre-Pilot Roadmap (סטטוס מעודכן 29.5)

> מקור: `_handoff/2026-05-28-pre-pilot-roadmap.md`.

| # | שאלה | סטטוס | הערה |
|---|---|---|---|
| Q1 | האם F.21E צריך לוגיקת B.7 חיה (modal interventions) או רק link לפעולות? | 🟡 בעבודה | סוכן 1 בונה. ככל הנראה links + helpers, B.7 modal יבוא בנפרד |
| Q2 | האם MOY-Lite suggested_intervention נשמר ב-state.assessments? | ✅ ב-spec | MOY-spec.md מתאר schema, code עוד לא נבדק end-to-end |
| Q3 | האם group banner מופיע כש-3 ילדות עם אותו intervention? | ⏳ פתוח | תלוי בסוכן 1 (F.21E) + B.10 Group Suggester |
| Q4 | האם print PDF של intervention pack תקין למקרי edge? | ⏳ פתוח | B.7 modal לא נבנה — לא נבדק |
| Q5 | האם "✓ ביצעתי" מחזיר ילדה ל-packs עם Weakness Targeting (b.7 letters)? | 🟡 חלקי | weakness-targeting test בעבודה (סוכן 19 · `c611a92` fix). E2E עוד לא רץ |
| Q6 | מה התנהגות onboarding-profile לילדה חדשה (cold-start)? | ✅ מוטמע | A.5 cold-start = 3 ימים + 30 ניסיונות. F.21A מראה badge "חדשה". |
| Q7 | האם 22 letter games פועלים end-to-end מהילדה? | ✅ A5 audit | 17/17 letter JSONs תקינים + 17/17 MP3 קיימים. shin בלי HTML — open question |

---

## 6. אזהרות אסור-לחזור-עליהן (לא השתנו מ-28.5)

- ❌ 5 דפוסי intervention המקוריים (Shape/Sound/Context/Velocity/Letter-cluster) — אומת כ-Phonological/Letter Knowledge/Decoding/Fluency/Letter-cluster
- ❌ 7 דק' חד-פעמית — אין בסיס מחקרי. Tier-2 = 10-15 דק' × 4-5 ימים
- ❌ MOY דיגיטלי כתחליף ל-1-on-1 — אסור פר ראמ"ה
- ❌ פריטי MOY-Lite כתרגול — אוסר ראמ"ה (`madrich-mivdak-kriah-grade1.txt:247`)
- ✅ קולן 2025 = מאומת (moe-curriculum-tashpav-2026.json:20)
- ❌ Shatil & Share 2003 הציעו שלבים (הזיה)
- ❌ Share & Bar-On 2018 = 6 שלבים (לא — 3 פאזות Triplex)

### 🆕 חדש מ-29.5

- ⚠️ **multi-agent בלי file-no-touch contracts → סיכון conflict.** סוכן 1 ו-19 רצו במקביל בלי conflict רק כי הוגדר בקפדנות פר-bootstrap מה אסור לגעת. סוכן 22 (helper) פעל עם file-no-touch מלא = אפס edits.

---

## 7. Bootstrap prompt לסוכן תזמורת חדש

**הדבק בשיחת Claude חדשה:**

```
שיחה חדשה — סוכן תזמורת לאבני יסוד · continuity מסוכן 29.5.2026 ערב

מטרה: סוכן-תזמורת ראשי לפרויקט אבני יסוד. אני (מיטל פלג) מנהלת פיתוח.
תפקיד התזמורת = אינטגרציה ותרגום בין סוכנים, לא יוזמה פדגוגית עצמאית.

צעדים מיידיים (חובה לפני שאלות):

1. קרא את הזיכרון (נטען אוטומטית):
   - MEMORY.md (אינדקס)
   - 5 קבצי memory ב-c:/Users/meyta/.claude/projects/c--Users-meyta-Downloads-impactos/memory/

2. קרא את ה-handoff התזמורתי החדש (גובר!):
   avnei-yesod/_handoff/2026-05-29-orchestrator-handoff-evening.md

3. קרא את ה-report של helper (אם רלוונטי):
   avnei-yesod/_handoff/2026-05-29-orchestrator-helper-report.md

4. קרא את agent-bootstraps.md (סוכנים 1-22).

5. פתח את ה-tracker:
   https://impact-os.app/avnei-yesod/_handoff/2026-05-26-architecture-tasks-tracker.html

מצב נוכחי (29.5.2026 — סוף יום):
- 🟡 4 קומיטים מקומיים, ממתינים ל-push מסונכרן (c611a92 + 7316272 + 79b1540 + d7e86ec)
- 🟢 סוכן 1 (F.21E code) עוד בעבודה — נטר tests
- ✅ סוכן 19 (september items) סיים
- ✅ סוכן 22 (helper) סיים 8 משימות — 5 קבצים ב-_handoff/
- ⏳ סוכן 21 פדגוגי — bootstrap מוכן, ממתין לאישור מיטל

עדיפויות מיידיות:
1. וודא שסוכן 1 סיים → push מסונכרן כולל 5 קבצי helper
2. עדכן agent-completion-log + tracker.html
3. הצע למיטל את 4 הfix הקטנים מ-report (A3 + A5 cosmetic)

3 bootstraps מוכנים להפעלה (לפי הצורך):
- EOY spec → 2026-05-29-eoy-spec-agent-prompt.md
- A.5 variants → 2026-05-29-a5-variants-agent-prompt.md (דורש החלטות מיטל)
- E2E Playwright → 2026-05-29-verification-e2e-agent-prompt.md

אזהרות אסור-לחזור-עליהן: ראה §6 ב-handoff.

עכשיו אני (מיטל) על המסך — חכה לשאלה ממני.
```

---

## 8. log שינויים במסמך זה

| תאריך | מה השתנה | על-ידי |
|---|---|---|
| 29.5.2026 ערב | יצירה (helper-only · אפס edits בקוד) | סוכן 22 (Claude Opus 4.7) |

*— סוף מסמך התזמורת. עדכן בכל שינוי מהותי.*
