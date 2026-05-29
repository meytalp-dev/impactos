# Day 1 Decisions — English Chativa · 29.5.2026

> **סוכן תזמורת ראשון של פרויקט English Chativa.** הוקם כ-continuation של bootstrap `2026-05-29-english-grade7-new-project-orchestrator-bootstrap.md`. ראה גם `_reference/` למקורות.

## 11 ה-decisions של מיטל

### החלטות מ-bootstrap המקורי (8)

| # | שאלה | תשובה | הקשר |
|---|---|---|---|
| 1 | שם המוצר | **"אנגלית ז'"** (זמני) | זמני — שם רשמי TBD |
| 2 | קהל יעד | **ESL** (לומדי אנגלית כשפה זרה) | תלמידי כיתה ז' ישראלים |
| 3 | רמת CEFR | **A1 → B1** (טווח מלא לחט"ב ז'-ח'-ט') | grade7 = Pre-A1 → A1, grade9 = B1 |
| 4 | Engine sharing | **אופציה B — Import** (ביצוע: copy decoupled) | refactor ל-shared/ post-pilot |
| 5 | Repo structure | **Monorepo** | `impactos/english-chativa/` sibling של `avnei-yesod/` |
| 6 | MVP target | **אוקטובר 2026** | במקביל לפיילוט אבני יסוד (ספטמבר 2026) |
| 7 | Timing | **עבודה במקביל** לפיילוט אבני יסוד | לא לסכן אבני יסוד |
| 8 | חומר פדגוגי | **בריפו של אורט בית הערבה** = `impactos/learning-engine/` | annual-plans + games קיימים |

### החלטות נוספות בעקבות סקירת חומר קיים (3)

| # | שאלה | תשובה |
|---|---|---|
| 9 | שם folder | **`english-chativa/`** (חט"ב — מרחיב בעתיד לח'-ט') |
| 10 | Scope MVP | **רק כיתה ז' לפיילוט** · ח'-ט' = future packs |
| 11 | מה לעשות עם `learning-engine/english/` | **להעביר ל-`english-chativa/legacy/`** |

### החלטות טקטיות (3)

| # | שאלה | תשובה |
|---|---|---|
| 12 | Clone strategy | **cp סלקטיבי** — structure + code + dashboards · לא assets/scripts/sales/_archive |
| 13 | תוכן עברי | **למחוק מיד אחרי cp** + כתיבת README placeholders (להימנע מבלבול) |
| 14 | Re-confirmation | **אבני יסוד נגעה: 0 קבצים.** `git diff avnei-yesod/` ריק. |

## מה בוצע ב-Day 1

### cp סלקטיבי (avnei-yesod → english-chativa)

**הועתק:**
- שורש: `architecture-mvp.md`, `gamification-spec.md`, `narrative-spec.md`, `spec.html`, `spec-audit-2026-05-21.md` → `_reference/`
- `engine/` (HTML dashboards)
- `docs/`
- `underwater-app/{js, css, _prompts, *.html}`
- `curriculum/{blueprint, knowledge-base, _reference docs}`

**לא הועתק (מכוון):**
- `underwater-app/assets/` (117M audio עברי)
- `underwater-app/scripts/` (1.9M utilities)
- `_archive/`, `scripts/`, `sales/`, `_handoff/` (היסטוריה לא רלוונטית)
- תוכן עברי: `vocab-bank.json`, `packs/*.json`, `interventions/*.json`, `moy-items.json`, `underwater-app/data/island-*.json`

**folders ריקים עם README placeholders:**
- `curriculum/packs/README.md`
- `underwater-app/data/README.md`
- `underwater-app/interventions/README.md`

### מעבר חומר תנופה קיים

- `learning-engine/english/` → `english-chativa/legacy/learning-engine-english/` (move)
- `learning-engine/annual-plans/english-tnufa-grade{7,8,9}.json` → `english-chativa/curriculum/tnufa-plans/` (copy)

### git status

- `english-chativa/` = untracked (folder חדש)
- `learning-engine/english/*` = D (נמחקו בגלל ה-move ל-`legacy/`)
- `avnei-yesod/` = **0 שינויים** (אומת ב-`git diff --stat avnei-yesod/`)
- **לא בוצע commit** — ממתינים לאישור מיטל

## decisions שנסגרו אחרי החקירה (29.5.2026)

### 🔵 Architecture — 3-layer (אושר ע"י מיטל)

חקירה ב-WebFetch של רמ"ה + Bulletin המפמ"ר אישרה את הטענה של מיטל: **תנופה אנגלית = מסגרת מדידה ל-English Curriculum 2020**. ראה memory `reference-tnufa-english-curriculum-2020`.

**3 שכבות מאושרות:**

1. **תוכן (Master) = Curriculum 2020 schema** — Can-do statements (CEFR) + Vocabulary (lexical bands) + Grammar
2. **מדידה = LSRW + Language** — 5 BKTs primary פר תלמיד.ה (Listening · Speaking · Reading · Writing · Language/Grammar). Sub-BKTs פר vocab cluster ו-grammar pattern. EPA פר can-do.
3. **ארגון = תנופה annual plan** — 8 Thematic Units × 4 Tracks (בסיסי / בינוני / מתקדם / העמקה)

**ממצאים חדשים מהחקירה:**

- ❗ תנופה אנגלית קיים רק בכיתה **ט'** (לא ז'!). רמת CEFR: **A2**.
- ❗ תנופה ט' מודד רק **3 skills:** Vocabulary · Reading · Writing. Listening + Speaking = enrichment מ-Curriculum, לא מבחן.
- ❗ Curriculum = **3 רכיבים מבניים** (can-do + vocab + grammar), לא 4-5 domains.

### 🟢 UI direction — אושר

**Modern Editorial + Streak + Story arc קליל** (לא Adventure, לא Social Feed). ייעוד לדור ז' (12-13). הדמו הקיים ב-`legacy/learning-engine-english/demo.html` הוא נקודת מוצא — צריך לקרר פלטה (cream/teal/burgundy → off-white/dark + accent) ולחזק typography (Inter/Söhne).

## decisions שנסגרו ב-end of Day 1

| # | Decision | תשובה |
|---|---|---|
| 15 | **Story arc** | ✓ דמות אחת שמלווה את 8 ה-Units במקומות משתנים (Sarah in London → Mumbai → Tokyo → …). נארטיב לאורך כל שנה. |
| 16 | **Audio strategy (MVP)** | ✓ Web Speech API en-US. native browser · free · מיידי. תואם ל-fallback של MOY באבני יסוד. Azure/ElevenLabs = post-MVP. |

## decisions שעדיין פתוחים (לפני Phase 1)

1. **שם רשמי של המוצר** — "אנגלית ז'" זמני · לא להתחיל מיתוג עד הסגירה
2. **Interventions** — מי כותב? מיטל לבד? יש שותפת.ת פדגוגית?
3. **Push לאחר commit ראשון** — לאחר commit מקומי, האם לדחוף ל-origin? (תוכל אבני יסוד לבדוק שלא נשבר משהו לפני)

## Phases הבאים — תוכנית מסלול

לפי bootstrap המקורי:

- **Phase 1 (2h)** — Engine sharing decision (נסגר: Copy decoupled · refactor ל-shared/ post-pilot)
- **Phase 2 (5h)** — Content scaffolding: יצירת `curriculum/vocab-bank.json` skeleton מתנופה + `curriculum/packs/october-2026.json` skeleton
- **Phase 3 (15h)** — Engine adaptations: shadow `engine/teacher-rama.html` ל-`teacher-rama-en.html` + RTL→LTR · font swap · TTS · niqud removal
- **Phase 4 (8h)** — Skill Units English adapter: letter · word · sight-words · phonics
- **Phase 5 (10h)** — First Game: stage-1-alphabet.html (alphabet recognition · 1 משחקון demo)
- **Phase 6 (1h)** — Handoff log + push (אישור מיטל)

**זמן כולל מעריך לראשון Game playable:** ~40h עבודה לסוכן 1 (אינו תזמורת).

## אסור (יורש מאבני יסוד)

1. ❌ לערוך קבצי `avnei-yesod/` (פיילוט ספטמבר 2026)
2. ❌ push בלי אישור מיטל
3. ❌ להחליט פדגוגית עצמאית
4. ❌ להמציא standards — להישען על תוכנית תנופה
5. ❌ git add . / -A — commit סלקטיבי
6. ❌ למחוק `_reference/` או `curriculum/_reference/` (זה מקור-אמת)

---

*Day 1 — תשתית בנויה · ממתין לאישור מיטל לפני המשך.*
