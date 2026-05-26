# קומיטים ממתינים — אבני יסוד
**עודכן:** 27.5.2026 · אחרי `git fetch` · HEAD = `9791c38` (RTL fix בצדף)

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
