# Orchestrator Handoff — 29.5.2026 לילה · סוכן תזמורת חדש

> **למיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש (Opus 4.7 · 1M). זה ה-handoff המלא ל-continuation של אבני יסוד.

---

# שיחה חדשה — סוכן תזמורת לאבני יסוד · continuation מ-29.5.2026 לילה

## מטרה

סוכן-תזמורת ראשי. תזמורת = אינטגרציה, push, תיאום בין סוכני קוד. **לא יוזמה פדגוגית עצמאית.**

## מצב פרויקט · 29.5.2026 לילה

### יום ענק שעבר — 27+ commits ב-origin
3 מסלולים נסגרו: תשתית קוד · F.21E · עומק תוכן (MOY+interventions).

### מה חי וזמין במערכת
- **3 איים פעילים** — אי 1 (5 משחקונים) · אי 2 (4) · אי 3 (22 + 6 amateurs)
- **F.21A teacher-rama** + **F.21E teacher-action** — שניהם חיים
- **7 packs** (sep 2026 → mar 2027) · 280 items
- **MOY-Lite** — 60 items עם audio_text עברי + 🔊 פר option
- **5 interventions FULL** — Tier-2 RTI scripts (~89K chars total)
- **15+ test suites** · כולם passing
- **noni-idle.png** ב-moy-screener (לא emoji)
- **a11y fixes** — user-scalable=no הוסר · aria-label · contrast 4.6:1

### מה ממתין

| משימה | bootstrap | סטטוס |
|---|---|---|
| **סוכן 28 — Verification E2E** (Playwright) | `2026-05-29-verification-e2e-fresh-context-bootstrap.md` | bootstrap מוכן · להפעיל בשיחה חדשה |
| **סוכן 29 — אי 4 (CV)** | `2026-05-29-island-4-cv-code-agent-prompt.md` | bootstrap מוכן · ~30h עבודה |
| **סוכן 30 — אי 5 (מילים)** | `2026-05-29-island-5-blending-code-agent-prompt.md` | bootstrap מוכן · תלוי באי 4 |
| **סוכן 31 — אי 14 (הבנת הנשמע)** | `2026-05-29-island-14-listening-code-agent-prompt.md` | bootstrap מוכן · אי עצמאי |
| **Manual Lighthouse + iPhone** | — | מיטל · 30 דק' |
| **Operations** (בית ספר · מורה · 4-5 ילדות · הורים) | — | מיטל · חיצוני · 2-3 שבועות |

### מסלולים סגורים (לא לחזור אליהם)
- ✅ סוכן 1 (F.21E V1+V2) · 19 (september) · 21 פדגוגי (interventions deepening) · 22 (helper) · 23 (6 packs) · 24 (performance) · 25 (a11y) · 26 (MOY IPA) · 27 (interventions code)

## הוראות עבודה ל-תזמורת

### לפני כל פעולה
1. `git fetch origin && git status`
2. `git log --oneline -20`
3. אם יש `M` בקבצים שאת לא ערכת → ייתכן סוכן פעיל במקביל

### Tests-as-signal rule (תועד ב-memory `feedback-orchestrator-multi-vscode-parallel-pattern`)
- כשעובדים ב-disk המשותף · אם **tests passing ב-Phase C/D** + handoff scope מאומת → תזמורת רשאית לאסוף + push **לפני** Phase F.
- הסוכן יראה `git diff HEAD` ריק = ב-origin = יסגור סשן.

### Anti-pattern: parallel evolution
2 סוכנים על אותו handoff = בזבוז (3 פעמים היום). לבדוק לפני הפעלה ש-handoff חדש.

### אסור-לגעת בלי אישור פר-קובץ
- מסמכי-אם: `architecture-mvp.md` · `pedagogy-integration-framework.md` · `literacy-grade1-2-yearly.md` · `llm-pitfalls.md`
- 5 קבצי `interventions/*.json` — מאושר פדגוגית (אסור לשנות בלי סוכן 21 פדגוגי חדש)
- 60 פריטי MOY ב-`moy-items.json` — מאושר פדגוגית
- 7 packs ב-`curriculum/packs/grade1-tashpaz/` — מאושרים

## Memory חובה (גלובלי · יטען אוטומטית)

- `feedback-avnei-yesod-teacher-language-simplicity`
- `feedback-avnei-yesod-niqud-on-student-screens`
- `feedback-avnei-yesod-cross-screen-navigation-uses-history-back`
- `feedback-orchestrator-multi-vscode-parallel-pattern` (כולל Pattern 3 + Tests-as-signal)
- `feedback-kid-block-letters-not-handwriting`
- `project-avnei-yesod-f21a-vs-f21e-split` (F.21E V2 ב-origin)
- `project-moy-lite-item-structure`
- `reference-hebrew-niqud-rules` (9 כללים)
- `project-inclusion-pulse-grade1-only` (פרויקט אחר)

## קבצי handoff חיוניים לקריאה

1. **handoff זה** (`2026-05-29-orchestrator-handoff-night-FINAL.md`) — מקור-אמת
2. `2026-05-28-pre-pilot-roadmap.md` — 5 שלבי מסלול
3. `2026-05-29-post-pilot-review-list.md` — 10 loose ends
4. `2026-05-29-parallel-execution-guide.md` — איך להפעיל סוכנים במקביל
5. `agent-completion-log.md` — היסטוריה של כל הסוכנים
6. `2026-05-29-performance-audit-report.md` — סוכן 24

## הצעד הבא — מסלול מומלץ

### מקבילית (4 VS Codes):
1. **סוכן 28 (E2E)** — bootstraps מוכן
2. **סוכן 29 (אי 4)** — bootstraps מוכן
3. **סוכן 31 (אי 14)** — bootstraps מוכן · עצמאי
4. **את — Operations** + Manual Lighthouse

### לאחר סוכן 29 מסיים:
5. **סוכן 30 (אי 5)** — תלוי באי 4

### אומדן זמן ל-pilot-ready:
- בנייה: ~80h (3 איים) · 3-4 שבועות
- E2E + bugs fix: 1-2 שבועות
- Operations: 2-3 שבועות
- **soft launch: ספטמבר 2026** (יעד נשמר)

## decisions פתוחות לתשומת לב מיטל

1. **אי 4 sub-BKT level** — פר letter? פר vowel? פר CV pair? (סוכן 29 ישאל)
2. **אי 5 vocab** — לבחור מילים מ-vocab-bank.json או לאשר חדשות?
3. **inclusion/ folder** — repo נפרד? folder עליון נפרד? (untracked מהיום)
4. **AvriNeural לאיים 4/5/14** — להפיק audio MP3, או רק Web Speech fallback?
5. **Operations** — בית ספר ספציפי? מועצה?

## כללי זהב

1. **לא להחליט פדגוגית עצמאית** — בספק לשאול את מיטל
2. **לא לדחוף בלי אישור** של מיטל
3. **לא לעדכן מסמכי-אם** בלי אישור פר-קובץ
4. **commit סלקטיבי** — אסור `git add . / -A`
5. **לתעד הכל** ב-handoff docs
6. **Tests-as-signal לאישור push** של עבודת סוכן (לא Phase F דרוש)

## העלייה הבאה — אחרי הפיילוט

- D.16 — איים 6, 7, 8, 9 + שאר 19-22 (post-pilot)
- E.19 — Calibration לפי data
- B.10 — שפת 3 תצוגות (מורה/הורה/מפקח)
- F.20 — 3 island modes
- F.21 — Specialist Flag
- אנגלית כיתה ז' — פרויקט מקביל (ראה handoff נפרד)

---

*Handoff זה הוא ה-snapshot של 29.5.2026 לילה. סוכן תזמורת חדש יחיל עליו continuation.*
