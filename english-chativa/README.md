# English Chativa — מערכת תרגול דיפרנציאלית לאנגלית · חט"ב

> **סטטוס:** Day 1 · 29.5.2026 · שכפול ראשוני של מנוע אבני יסוד · MVP target אוקטובר 2026 · MVP scope = כיתה ז' בלבד.
>
> **קהל יעד:** ESL · תלמידי כיתה ז' ישראלים · CEFR Pre-A1 → A1 (טווח מלא ז'-ח'-ט' = Pre-A1 → B1).
>
> **מבוסס על:** תוכנית תנופה (משה"ח · אנגלית חט"ב) + מנוע אבני יסוד (BKT + EPA + 4-track scaffolding).

## הקשר לאבני יסוד

`english-chativa/` הוא **שכפול של מנוע אבני יסוד** (העתקת קוד + structure ב-29.5.2026), לא subfolder של avnei-yesod ולא link.

**2 מערכות נפרדות · אותו מנוע (נכון להיום).** עדכון בקוד באבני יסוד → לא משפיע אוטומטית כאן (decoupled).

תוכנית עתידית: אחרי 2 הפיילוטים (אבני יסוד ספטמבר 2026 · English Chativa אוקטובר 2026) — refactor של מנועי הליבה ל-`impactos/shared/` המשותף.

**אסור לערוך קבצים תחת `avnei-yesod/`** — היא ב-pre-pilot, כל שינוי שם מסכן אותה.

## ארכיטקטורה

| שכבה | מקור | סטטוס |
|---|---|---|
| **מנוע (BKT + EPA + Skill Units + dashboards)** | אבני יסוד · 80% generic | ✓ הועתק (יידרש adapter לאנגלית) |
| **RTL → LTR · fonts · TTS** | refactor (~30-50h) | ⏳ Phase 2 |
| **תוכן** (Units · packs · vocab) | תנופה ז' (curriculum/tnufa-plans/) | ✓ annual-plans זמינים · packs/items TODO |
| **MOY-Lite** | יידרש החלפה — assessment אנגלית | ⏳ Phase 3 |
| **Interventions** | תרגום + התאמה (5 patterns) | ⏳ Phase 4 |

## תיקיות

```
english-chativa/
├── README.md                    ← זה
├── _handoff/                    ← היסטוריית סוכנים (Day 1: day-1-decisions.md)
├── _reference/                  ← מסמכי spec של אבני יסוד (read-only context)
│   ├── avnei-yesod-architecture-mvp.md
│   ├── avnei-yesod-spec.html
│   ├── gamification-spec.md
│   ├── narrative-spec.md
│   └── spec-audit-2026-05-21.md
├── curriculum/
│   ├── tnufa-plans/             ← תוכניות שנתיות תנופה ז'-ח'-ט' (קיימים!)
│   │   ├── english-tnufa-grade7.json   (32 שבועות · 128h · 8 units)
│   │   ├── english-tnufa-grade8.json
│   │   └── english-tnufa-grade9.json
│   ├── packs/                   ← חבילות חודשיות (TODO · ראה README)
│   ├── blueprint/               ← תבניות איים (יידרש adapter אנגלית)
│   ├── knowledge-base/          ← מקורות מחקריים
│   ├── yearly-plan/             ← פיוז עתידי בין tnufa-plans לבין מערכת ה-BKT
│   └── _reference/              ← מסמכי פדגוגיה מאבני יסוד
│       ├── literacy-grade1-2-yearly.md
│       ├── pedagogy-integration-framework.md
│       ├── llm-pitfalls.md
│       └── ...
├── engine/                      ← F.21A teacher-rama · F.21E teacher-action · demos
├── docs/                        ← תיעוד מהנדס
├── legacy/                      ← legacy/learning-engine-english/ (דמו + games קיימים)
│   └── learning-engine-english/
│       ├── demo.html            ← דמו 4 רמות (בסיסי/בינוני/מתקדם/העמקה)
│       └── games/grade{7,8,9}/  ← 4 פעילויות × 3 כיתות (trivia/matching/...)
└── underwater-app/              ← אפליקציית התלמיד.ה (יידרש RTL→LTR refactor)
    ├── js/                      ← BKT · EPA · skill-units · event-logger (generic)
    ├── css/                     ← RTL → LTR refactor TODO
    ├── data/                    ← מאגרי items פר-Unit (TODO · ראה README)
    ├── interventions/           ← Tier-2 scripts (TODO · ראה README)
    └── *.html                   ← stage-1-* · stage-2-* · stage-3-* templates
```

## Decisions של Day 1 (29.5.2026)

ראה `_handoff/day-1-decisions.md` לפירוט המלא.

## אסור לעשות

- ❌ לערוך קבצים תחת `avnei-yesod/` (פיילוט ספטמבר 2026)
- ❌ להחליט פדגוגית עצמאית — מיטל מאשרת תוכן אנגלית
- ❌ להמציא standards — לבסס על תוכנית תנופה (משה"ח)
- ❌ git add . / -A — commit סלקטיבי
- ❌ push בלי אישור מיטל
