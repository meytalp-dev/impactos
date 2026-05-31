# Orchestrator Handoff — 31.5.2026 · סוכן תזמורת חדש

> **למיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש (Opus 4.7 · 1M). זה ה-handoff המלא לcontinuation של אבני יסוד.

---

# שיחה חדשה — סוכן תזמורת לאבני יסוד · continuation מ-31.5.2026

## מטרה

סוכן-תזמורת ראשי. תזמורת = אינטגרציה · push selective · תיאום בין סוכני קוד. **לא יוזמה פדגוגית עצמאית.**

## מצב פרויקט · 31.5.2026

### מה חי ב-origin

**5 איים פעילים** במפה (1·2·3·4·14) — כולם נגישים ב-impact-os.app:
- אי 1·2·3 — קיימים מהתחלה
- **אי 4** (CV · session-runner של 4 mechanics + cv-build standalone) — סוכן 29 + fix
- **אי 14** (הבנת הנשמע · session-runner + 25 passages) — סוכן 31 + תוכן

**5 פיצ'רים נוספים בpil:**
- F.21A teacher-rama + F.21E teacher-action (cover סוכן 1)
- OBS-2 fix · min_confidence='low' לפיילוט
- B.7 print button (story 7 לפיילוט · סוכן fix A/G-1)
- 175 MP3 AvriNeural אי 4 + תיקון ב/כ/פ דגש
- 25 passages לאי 14 (v2 פדגוגית מותאם לכיתה א')

**Tests:** 19/19 unit suites · 305/305 oral-skill · 138/138 vowel-adapter · 0 רגרסיות

### מה ממתין

| משימה | bootstrap | סטטוס |
|---|---|---|
| **סוכן 30 — אי 5 blending — push** | בנוי. ממתין למיטל לאשר vocab add (12 מילים) + manual push selective | 🟡 ~95% complete · cleanup ב-fs |
| **סוכן fix אי 14 visual consistency** | `2026-05-31-island-14-visual-consistency-fix-bootstrap.md` | bootstrap מוכן · 2-3h |
| **PR #2 ב-fork לpresentation assets** | https://github.com/meytalp-dev/impactso/pull/2 | ממתין למיטל למerge ב-fork main |
| **PR fork → golanliron** | אחרי merge ב-fork main | ⏳ |
| **Manual Lighthouse + iPhone** | — | מיטל · 30 דק' |
| **Operations** (בית ספר · מורה · 4-5 ילדות · הורים) | — | מיטל · חיצוני · 2-3 שבועות |

### מסלולים סגורים

- ✅ סוכנים 1·19·21·22·23·24·25·26·27·28·29 (+ fix)·31

### Sprint history (29-31.5.2026)

| commit | מה |
|---|---|
| 91e6106 | סוכן 28 E2E suite (42/42) |
| ee9cd88 | סוכנים 29+31 — אי 4 core + אי 14 full (199 קבצים) |
| 6a68d9b | OBS-2 fix + 2 bootstraps |
| 1e26040 | 4 mechanics חסרים (cv-vs-cv, listen-cv, match, story-sequence) |
| 0d828e2 | bootstrap אי 4 v2 |
| 8d71465 | ספרינט סגירה 30.5 · fix A/G-1 + fix אי 4 + 3 stage-14 ששכחתי |
| 5bd71de | bootstrap אי 5 v2 |
| c009dd4 | 25 passages לאי 14 v1 |
| 3563ef5 | passages v2 (מותאם פדגוגית לכיתה א') |
| 07e3338 | demo: ?demo=1 ב-stage-3-island |
| b780b94 | fix: map.html איים VS-open נראים מלא |
| 9385b67 | אי 3 ניקוד מלא (5 משחקונים + bulk sed) |
| 0ca8b76 | presentation mode ב-teacher-action |
| a9a7a86 | presentation mode styling |
| 16009ed | auto-seed ב-presentation mode |

## הוראות עבודה ל-תזמורת

### לפני כל פעולה
1. `git fetch origin && git status`
2. `git log --oneline -10`
3. אם יש `M` בקבצים שאתה לא ערכת → ייתכן סוכן פעיל במקביל (לבדוק לפני edit)

### Tests-as-signal rule
- אם סוכן דיווח tests passing + scope ברור → **push selective בלי לשאול** (לפי [[feedback-orchestrator-auto-push-when-safe]])
- אם יש decision pedagogical / mixed scope / unfamiliar deletes → לעצור ולשאול

### Anti-pattern: parallel evolution
2 סוכנים על אותו handoff = בזבוז. לבדוק לפני הפעלה ש-handoff חדש.

### אסור-לגעת בלי אישור פר-קובץ
- מסמכי-אם: `architecture-mvp.md` · `pedagogy-integration-framework.md` · `literacy-grade1-2-yearly.md` · `llm-pitfalls.md`
- 5 קבצי `interventions/*.json` (מאושר פדגוגית)
- 60 פריטי MOY ב-`moy-items.json`
- 7 packs ב-`curriculum/packs/grade1-tashpaz/`
- 25 passages באי 14 (v2 — מאושר)
- 49 מילים באי 5 (אם סוכן 30 ימשיך — לא דורס)

### Multi-VS-Code parallel pattern
- 2-3 סוכנים ב-VS Codes שונים, כל bootstrap עם רשימת אסור-לגעת מפורשת
- תזמורת אוספת push בסוף
- 4 קבצי infrastructure (bkt.js · skill-units.js · mastery-check.js · map.html) — לחפש additions, לא דריסות
- לפי [[feedback-orchestrator-multi-vscode-parallel-pattern]]

## Memory חובה — יטען אוטומטית

### דשבורדי מורה + תוכן
- [[feedback-avnei-yesod-teacher-language-simplicity]] — F.21E "שורה תחתונה", לא BKT/EPA
- [[feedback-avnei-yesod-niqud-on-student-screens]] — ניקוד מלא בכל מסך ילד.ה
- [[feedback-kid-block-letters-not-handwriting]] — Heebo בלבד
- [[reference-hebrew-niqud-rules]] — 9 כללי ניקוד
- [[reference-hebrew-bgd-kpt-dagesh-rule]] — ב/כ/פ דגש קל בCV של תחילת הברה
- [[feedback-avnei-yesod-cross-screen-navigation-uses-history-back]] — history.back() ל-teacher-rama

### Orchestrator (התזמורת)
- [[feedback-orchestrator-multi-vscode-parallel-pattern]] — multi-VS-Code
- [[feedback-orchestrator-auto-push-when-safe]] — auto-push כשבטוח

### Islands + content
- [[reference-avnei-yesod-island-build-checklist]] — **MUST READ** · 11 לקחים מאי 4
- [[feedback-avnei-yesod-noni-narrative-and-visuals-consistency]] — visuals של איים
- [[project-avnei-yesod-f21a-vs-f21e-split]] — F.21A=תצפית · F.21E=פעולה
- [[project-moy-lite-item-structure]] — 1 passage × 1 question
- [[project-inclusion-pulse-grade1-only]] — פולס (פרויקט אחר)

## קבצי handoff חיוניים

1. **handoff זה** (`2026-05-31-orchestrator-handoff-NEW-CONTEXT.md`) — מקור-אמת
2. `2026-05-31-island-14-visual-consistency-fix-bootstrap.md` — fix אי 14 (open)
3. `2026-05-30-island-05-vocab-gaps.md` — 12 מילים נוספות לאי 5 (אושרו · ממתין למיטל)
4. `2026-05-30-island-05-completion-report.md` — סוכן 30 דיווח
5. `2026-05-30-island-04-completion-report.md` — סוכן fix אי 4 דיווח
6. `2026-05-30-presentation-slide-coordination-SOP.md` — **SOP חובה** למצגת
7. `agent-completion-log.md` — היסטוריה
8. `2026-05-29-pre-pilot-roadmap.md` — 5 שלבי מסלול
9. `2026-05-29-post-pilot-review-list.md` — 10 loose ends

## SOP — מצגת של ליריון

> **חשוב!** כל edit למצגת ב-`golanliron/impactso` עובר דרך **fork של מיטל** (`meytalp-dev/impactso`).
> ראה [`_handoff/2026-05-30-presentation-slide-coordination-SOP.md`](2026-05-30-presentation-slide-coordination-SOP.md).
>
> **לעולם לא לדחוף ישירות ל-golanliron** — אין הרשאה (meytalp-dev אינו collab), והכלי SOP מונע merge nightmare.
>
> Flow: branch בfork → PR ל-meytalp-dev:main → מיטל merge → אז PR מאוחד ל-golanliron.
>
> דוגמה אחרונה: PR #2 ב-fork — 4 screenshots לpilot, ממתין למerge של מיטל.

## הצעד הבא — מסלול מומלץ

1. **Push סוכן 30 (אי 5)** — אם יש דיווח חדש ממיטל. ה-fs כולל ~15 קבצים untracked + 4 modified. selective commit.
2. **סוכן fix אי 14 visual** — bootstrap מוכן. ~2-3h עבודה. אחרי merge — אי 14 יהיה consistent עם איים 1-4.
3. **Merge PR #2 ב-fork** + PR מאוחד ל-golanliron — מיטל
4. **Manual testing** + **Operations** — מיטל

### אומדן זמן ל-pilot-ready:
- סוכן 30 push: 30 דק'
- סוכן fix אי 14: 2-3h
- Total tech work: ~3-4h
- Operations: 2-3 שבועות (חיצוני)
- **soft launch: ספטמבר 2026** (יעד נשמר)

## Decisions פתוחות לתשומת לב מיטל

1. **PR #2 ב-fork — merge?** ממתין למיטל
2. **סוכן 30 vocab** — אישרה אופציה A (12 מילים נוספות). ממתין שהסוכן יחזור עם push request.
3. **אי 5 ב-map.html** — הוסר זמנית (כדי לא להפנות לקובץ שלא ב-origin). יחזור עם push של סוכן 30.
4. **OBS-2 חזרה ל-med** — לאחר 2-3 שבועות פיילוט (החלטה עתידית)
5. **Operations** — בית ספר ספציפי? מועצה?

## כללי זהב

1. **לא להחליט פדגוגית עצמאית** — בספק לשאול את מיטל
2. **לא לדחוף ישירות ל-golanliron/impactso** — תמיד דרך fork
3. **לא לעדכן מסמכי-אם** בלי אישור פר-קובץ
4. **commit סלקטיבי** — אסור `git add . / -A`
5. **לתעד הכל** ב-handoff docs
6. **Tests-as-signal לאישור push** של עבודת סוכן (לפי [[feedback-orchestrator-auto-push-when-safe]])
7. **השתמש ב-presentation mode (?presentation=1)** כשמראה הdashboard ללקוחות

## דמואים מהירים — קישורים שמורים

- **מפה ראשית:** https://impact-os.app/avnei-yesod/underwater-app/map.html
- **אי 3 (?demo=1):** https://impact-os.app/avnei-yesod/underwater-app/stage-3-island.html?demo=1
- **אי 4 cv-tap:** https://impact-os.app/avnei-yesod/underwater-app/stage-4-cv-tap.html
- **אי 14 listen:** https://impact-os.app/avnei-yesod/underwater-app/stage-14-listen-and-answer.html
- **Seed (אוטו):** https://impact-os.app/avnei-yesod/underwater-app/seed-demo.html
- **Dashboard לדמו (?presentation=1):** https://impact-os.app/avnei-yesod/underwater-app/teacher-action.html?presentation=1

## העלייה הבאה — אחרי הפיילוט

- D.16 — איים 6, 7, 8, 9 + שאר 19-22 (post-pilot)
- E.19 — Calibration לפי data
- B.10 — שפת 3 תצוגות (מורה/הורה/מפקח)
- F.20 — 3 island modes
- F.21 — Specialist Flag
- אנגלית כיתה ז' — פרויקט מקביל (`english-chativa/` — סוכן אחר · לא לגעת)

---

*Handoff זה הוא ה-snapshot של 31.5.2026. סוכן תזמורת חדש יחיל עליו continuation.*
