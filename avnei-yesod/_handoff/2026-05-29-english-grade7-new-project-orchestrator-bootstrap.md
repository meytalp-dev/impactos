# New Project Orchestrator Bootstrap — English Grade 7 (Differential System)

> **למיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש (Opus 4.7 · 1M). פרויקט **חדש** — לבנות מערכת דיפרנציאלית לאנגלית כיתה ז' על בסיס המנוע של אבני יסוד.

---

# שיחה חדשה — סוכן תזמורת ראשי · אנגלית כיתה ז' · Day 1

## מטרה

לבנות **מערכת תרגול אדפטיבית לאנגלית כיתה ז'** (ESL) באמצעות שכפול וההתאמה של המנוע של "אבני יסוד" (עברית כיתה א'). מיטל פלג = מנהלת פיתוח. תפקיד התזמורת = אינטגרציה, push, תיאום בין סוכני קוד · לא יוזמה פדגוגית עצמאית.

**יעד:** MVP פיילוט בעוד 4-6 חודשים (אוקטובר 2026).

## הקשר — המנוע הקיים של אבני יסוד

### 80% generic — נשכפל 1:1

| רכיב | למה generic |
|---|---|
| **BKT-per-strand** | מנוע סטטיסטי · עובד על כל skill |
| **EPA** (Failure × Context × Task) | axes אגנוסטיות לשפה |
| **Sub-BKT פר unit** | פר letter / vowel / word — generic |
| **Cold-start** | "סטודנט חדש" |
| **Mastery משולש** (BKT + fluency + threshold) | פדגוגית גנרית |
| **Pack × Tier** | 4-tier model |
| **F.21A/F.21E dashboards** | UI · מה שמשתנה = תוכן הטבלאות |
| **Skill Units abstraction** (סוכן 1 V2) | **תוכנן בדיוק לזה!** 8 types: letter · vowel · phon-skill · word · morpheme · reading-skill · oral-skill · writing |
| **B.7/B.8/B.9** interventions | 5 patterns גנריים |
| **MOY-Lite engine** | מבנה item:passage+question |
| **Event Logger + CSV export** | generic |

### 15% דורש refactor

| רכיב | למה |
|---|---|
| **RTL → LTR** | אנגלית = LTR. CSS sticky right→left · 30-50h |
| **Fonts** | Heebo (Hebrew) → Inter/Roboto · 1h |
| **TTS** | AvriNeural → Azure English TTS · 2-3h |
| **Niqud** | להסיר ניקוד-validation · 2-3h |
| **stage-3 games** | 22 עברי → 26 אנגלי · 40-80h |
| **UI strings translation** | 20-30h |

### 5% תוכן חדש (אתה תוסיף בעזרת מיטל)

| רכיב | מה |
|---|---|
| **vocab-bank** אנגלית כיתה ז' | את אספת חומר פדגוגי |
| **packs** חודשיים | tier 1-4 מילים אנגלית |
| **MOY items** אנגלית | החלפת assessment של ראמ"ה במקבילה אנגלית |
| **interventions** אנגלית | translation + adaptation |
| **standards** | מה הסטנדרט של משה"ח לאנגלית כיתה ז'? |

## ארכיטקטורה מומלצת — Monorepo

```
impactos/                  ← repo ראשי
├── avnei-yesod/          ← מערכת עברית כיתה א' (קיים · pilot-ready)
├── english-grade-7/      ← מערכת אנגלית ז' חדשה
│   ├── content/
│   │   ├── vocab-bank.json
│   │   ├── packs/        ← packs חודשיים
│   │   ├── interventions/
│   │   └── moy-items.json
│   ├── stage-games/      ← 26-letter equivalent + תרגול
│   ├── engine/           ← screener + onboarding
│   ├── teacher/          ← F.21A + F.21E equivalents
│   └── assets/           ← English audio, images
└── shared/               ← מנועי ליבה (refactor אחד-פעמי)
    ├── bkt.js
    ├── epa.js
    ├── skill-units.js
    └── ... (כל ה-engine שעובד על שני המוצרים)
```

**יתרון:** bug fix במנוע אחד מתעדכן ב-2 המוצרים.

## משימות מסלול ראשון (Day 1-5)

### Phase 0 — Setup repo (2h)

1. ☐ קרא את **כל ה-handoff documents** של אבני יסוד:
   - `avnei-yesod/_handoff/2026-05-29-orchestrator-handoff-night-FINAL.md` (snapshot)
   - `avnei-yesod/_handoff/2026-05-28-pre-pilot-roadmap.md`
   - `avnei-yesod/architecture-mvp.md`
   - `avnei-yesod/curriculum/pedagogy-integration-framework.md`
2. ☐ קרא קוד-מקור (overview · לא להעמיק):
   - `avnei-yesod/underwater-app/js/shared/bkt.js`
   - `avnei-yesod/underwater-app/js/shared/skill-units.js`
   - `avnei-yesod/underwater-app/js/shared/intervention-matcher.js`
3. ☐ צור `english-grade-7/` folder structure:
   ```
   mkdir -p english-grade-7/{content/{packs,interventions},stage-games,engine,teacher,assets}
   ```
4. ☐ צור `english-grade-7/README.md` עם:
   - מטרה
   - architecture
   - link ל-shared/ engine
   - status

### Phase 1 — Engine sharing decision (2h · החלטה ארכיטקטונית)

5. ☐ **שאל את מיטל:** האם לעשות **refactor של shared/** (להוציא מנועי ליבה מ-avnei-yesod ל-shared/) או לעשות **import** של avnei-yesod ל-english-grade-7?
   - אופציה A: refactor — נקי, אבל מסבך את avnei-yesod שעדיין ב-pilot
   - אופציה B: import — מהיר עכשיו, יוצר tech debt
   - **המלצה:** B כעת (אחרי pilot avnei-yesod → refactor ל-shared/)

### Phase 2 — Content scaffolding (5h)

6. ☐ **שאל את מיטל:** איפה החומר הפדגוגי שאספת לאנגלית ז'? format? אילו skills? אילו standards?
7. ☐ לבנות `english-grade-7/content/vocab-bank.json` (skeleton בלבד) — בהתבסס על מה שמיטל תיתן.
8. ☐ לבנות `english-grade-7/content/packs/october-2026.json` (skeleton בלבד) — 4 tiers · יעד 40 items כמו אבני יסוד.

### Phase 3 — Engine adaptations (15h)

9. ☐ צור `english-grade-7/engine/onboarding.html` — שכפול של `avnei-yesod/engine/onboarding-profile.html` + תיקון RTL→LTR + תרגום strings.
10. ☐ צור `english-grade-7/teacher/teacher-rama.html` — שכפול של F.21A.
11. ☐ צור `english-grade-7/teacher/teacher-action.html` — שכפול של F.21E.
12. ☐ RTL→LTR migration ב-CSS (sticky right→left · text-align · direction).
13. ☐ Font swap (Heebo → Inter).
14. ☐ Azure English TTS integration (במקום AvriNeural).

### Phase 4 — Skill Units English adapter (8h)

15. ☐ Skill units יש 8 types — לאנגלית רלוונטיים:
    - `letter` — 26 English letters
    - `vowel` — 5 vowels (a, e, i, o, u) + diphthongs
    - `phon-skill` — phonological awareness אנגלית
    - `word` — sight words (Dolch list?)
    - `morpheme` — prefixes/suffixes (un-, -ing, -ed)
16. ☐ צור `english-grade-7/js/shared/english-letter-adapter.js`
17. ☐ צור `english-grade-7/js/shared/english-vowel-adapter.js`
18. ☐ Tests.

### Phase 5 — First Game (10h)

19. ☐ צור `english-grade-7/stage-games/stage-1-alphabet.html` — משחקון demo (alphabet recognition).
20. ☐ Audio English (cat, dog, sun) + UI strings.
21. ☐ Manual test.

### Phase 6 — Handoff log + push (1h)

22. ☐ צור `english-grade-7/_handoff/day-1-completion-log.md`.
23. ☐ commit + push (אישור מיטל קודם).

## אסור לך

- ❌ לערוך **שום קובץ של אבני יסוד** (פיילוט שלה ספטמבר 2026 — אסור לסכן)
- ❌ לדחוף ל-git בלי אישור מפורש של מיטל
- ❌ להחליט פדגוגית — תוכן אנגלית = מיטל מתאמת
- ❌ לבחור standards לבד — לבדוק עם מיטל מה הסטנדרט שיש לה
- ❌ refactor של avnei-yesod (אסור, גם אם הגיוני)

## decisions שצריך לקבל ממיטל (לפני שמתחילים)

1. **שם המוצר** — "Cornerstones English"? "Foundation English"? אחר?
2. **קהל יעד** — ESL learners (לומדי אנגלית כשפה זרה) או native?
3. **רמת התחלה** — A1 · A2 · B1 (CEFR)?
4. **חומר פדגוגי שאספת** — שלחי / paste / file path?
5. **Engine sharing** — refactor ל-shared/ עכשיו (אופציה A) או import מ-avnei-yesod (אופציה B)?
6. **monorepo vs separate repos** — אופציה A (mono) או B (separate)?
7. **תאריך target ל-MVP** — אוקטובר 2026? נובמבר?
8. **timing מול avnei-yesod pilot** — לעבוד במקביל או לחכות שpilot ייגמר?

## עקרונות עבודה (יורש מ-אבני יסוד)

1. **Single ownership פר working unit** — handoff אחד = סוכן אחד
2. **רשימה מפורשת של אסור-לגעת** ב-bootstrap לכל סוכן
3. **תזמורת אוספת push בסוף** · לא כל סוכן דוחף
4. **Tests-as-signal לאישור push** של עבודה
5. **Memory** של אבני יסוד יורש אוטומטית — אבל אנגלית = רוב הזמן לא רלוונטית · ייתכן ויידרשו memories חדשים
6. **לא להחליט פדגוגית עצמאית**
7. **commit סלקטיבי** — אסור `git add . / -A`

## הצעד הבא

1. **קרא** את ה-handoff של אבני יסוד (נמוך 30 דק').
2. **שאל את מיטל** את 8 ה-decisions לעיל לפני שאתה מתחיל לכתוב קוד.
3. **שמור** את התשובות ב-`english-grade-7/_handoff/day-1-decisions.md`.
4. **אז** התחל Phase 0.

## אסטרטגיה (לטווח בינוני)

| חודש | אבני יסוד | אנגלית ז' |
|---|---|---|
| יולי 2026 | E2E · bug fixes · 3 איים חדשים | Phase 0-2 · vocab · scaffolding |
| אוגוסט 2026 | Operations · final polish | Phase 3-5 · adapters · first games |
| ספטמבר 2026 | **🚀 Soft launch אבני יסוד** | Phase 6-... · 3-5 stage games |
| אוקטובר 2026 | Pilot data collection | **🚀 MVP אנגלית · 1-2 stage games · בית ספר שני?** |
| נובמבר 2026 | Pilot mid-review | אנגלית data ראשון |
| דצמבר 2026 | Calibration | Expansion |

---

*Bootstrap זה הוא Day 1 של אנגלית כיתה ז'. סוכן תזמורת ראשון = הוא יקבל את הdecisions ויסלל את הדרך.*
