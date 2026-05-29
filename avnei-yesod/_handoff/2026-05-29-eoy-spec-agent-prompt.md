# Handoff — סוכן EOY Spec (אבני יסוד · post-MOY)

> **מיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש. **סוכן ספק** (לא code) — כותב spec רשמי בלבד. **לא חוסם פיילוט ספטמבר 2026** — post-MOY (= post-pilot data).

---

## משימה

אתה ספק רשמי לאבני יסוד. כותב **EOY — End of Year Diagnostic Spec** בסגנון `_handoff/2026-05-28-MOY-diagnostic-spec.md` הקיים. ההבדלים העיקריים:

- **EOY = אחרי פעימה 3** (אפריל-מאי 2027)
- **משימות ראמ"ה הרלוונטיות: 5-10** (פעימה 3 — מעבר מ-decoding לקריאת מילים שלמות + שטף + הבנה)
- **לא חוסם פיילוט ספטמבר 2026** — pure post-MOY → רק תכנון
- **אומדן:** S spec (~2000-3000 מילים) · M dummy items (~30-50 פריטים)

**הקשר:** "אבני יסוד" = מערכת תרגול אדפטיבית לכיתה א'. ראמ"ה מבצעת 3 מבדקים שנתיים: BOY · MOY · EOY. ב-`engine/screener.html` קיים BOY. ב-`engine/moy-screener.html` קיים MOY (חדש 28.5). EOY = הצעד הבא.

## חובה לקרוא קודם (לא מקצר!)

1. `_handoff/2026-05-28-MOY-diagnostic-spec.md` — **המסמך המנחה** (style + structure). חקה את ה-9 sections.
2. `_handoff/2026-05-28-pre-pilot-roadmap.md` — להבין למה EOY לא חוסם.
3. `curriculum/literacy-grade1-2-yearly.md` — להבין מה פעימה 3 (אפריל-מאי 2027).
4. `curriculum/knowledge-base/sources/madrich-mivdak-kriah-grade1.txt` (אם קיים) — משימות 5-10 פר ראמ"ה.
5. `architecture-mvp.md` — להבין איפה state.assessments.eoy יישב (כבר יש placeholder ב-schema של MOY spec).
6. `engine/moy-items.json` `_meta` section — להבין מבנה item (1 passage × 1 question).

## ⚠️ אסור לגעת ב

- כל קוד JS חי (קריאה בלבד)
- מסמכי-אם (architecture-mvp.md · pedagogy-integration-framework.md · literacy-grade1-2-yearly.md · llm-pitfalls.md) — קריאה בלבד
- `engine/moy-items.json` · `engine/moy-screener.html` — קריאה בלבד
- ❌ **לא לעשות `git commit` או `git push`** — תזמורת תאסוף.
- ❌ **לא להפעיל סוכנים אחרים**.

## מותר לכתוב

- **קובץ spec חדש:** `_handoff/2026-05-29-EOY-diagnostic-spec.md`
- **קובץ dummy items (optional):** `_handoff/2026-05-29-EOY-items-dummy-30.json` — אם הספק מספיק לזה
- ❌ אין `engine/eoy-screener.html` עדיין — זה לסוכן code עתידי.
- ❌ אין `engine/eoy-items.json` real items עדיין — זה למיטל / סוכן פדגוגי.

## מבנה ה-spec (9 sections — כמו MOY)

חקה בדיוק את `2026-05-28-MOY-diagnostic-spec.md`:

1. **§1 — הקשר:** איפה EOY-Lite יושב (BOY → MOY → EOY)
2. **§2 — ההחלטות הפדגוגיות** (לסמן OPEN_QUESTION למיטל אם לא ברור):
   - מי מנהלת? (MOY-Lite = ילדה לבד. EOY: זהה? או יותר מורה?)
   - מתי? חלון אפר-מאי, גמיש פר ילדה
   - אם נכשלת? (תיעוד + הצעת אינטרבנציה — אחרון בשנה, אין repeat 5-6 שבועות אמיתי)
   - איפה נשמרות תוצאות? state.assessments.eoy (already in MOY schema)
3. **§3 — Architecture:** קובץ חדש `engine/eoy-screener.html` + extending `assessments.js`
4. **§4 — Item Pool:** פריטים שונים מתרגול + שונים מ-MOY!
5. **§5 — UI flow** (כתיתה א' בסוף שנה — קוראת קצת לבד)
6. **§6 — Integration with BKT** — איך EOY מעדכן BKT-per-strand
7. **§7 — Integration with teacher-rama** — איך תוצאות מוצגות
8. **§8 — Open Questions** — לסמן בבירור OPEN_QUESTION למיטל
9. **§9 — Acceptance Criteria + סוכן code מומלץ**

## משימות 5-10 ראמ"ה (אם madrich-mivdak לא נגיש)

לפי `literacy-grade1-2-yearly.md` (מה שאמורים לראות בפעימה 3):
- **משימה 5:** קריאת מילים שלמות (16-22 מילים, רף ~80% נכון)
- **משימה 6:** קריאת משפטים קצרים
- **משימה 7:** קריאת קטע קצר (15-25 מילים)
- **משימה 8:** הבנת קטע נקרא (לעומת מושמע במשימה 3)
- **משימה 9:** שטף — דיוק + קצב (WCPM וריאנט לעברית)
- **משימה 10:** מבחן מילים-מסיחות / orthographic awareness

אם משימה כלשהי לא ברורה — **לסמן OPEN_QUESTION למיטל** בspec, לא להמציא.

## איזה משימות לכלול ב-EOY-Lite

המלצה ראשונית (לדיון עם מיטל):
- ✅ **משימה 5** (קריאת מילים) — קריטי, BKT decoding signal
- ✅ **משימה 6** (משפטים) — איכותי
- ✅ **משימה 9** (שטף) — נוסף שלא היה ב-MOY
- ⚠️ **משימה 7-8** (קטע + הבנה נקראת) — אופציונלי בLite
- ❌ **משימה 10** (orthographic) — תוסף, לא חוסם

אבל **תהיה גמיש** — מיטל תחליט. סמן ב-§2 כOPEN_QUESTION.

## Dummy items (אופציונלי)

אם נשאר זמן — כתוב 10-15 dummy items במבנה (עם ניקוד מלא):

```json
{
  "item_id": "eoy-5-dummy-001",
  "rama_task_alignment": 5,
  "peima_target": 3,
  "type": "word_reading",
  "word": "שֶׁמֶשׁ",
  "options": [
    { "text": "שֶׁמֶשׁ", "correct": true },
    { "text": "שֶׁלֶט", "correct": false },
    { "text": "שֶׁקֶל", "correct": false }
  ]
}
```

**אסור:** dummy data כתחליף לpedagogical review של מיטל. סמן בבירור `_meta.requires_pedagogical_review: true`.

## Acceptance Criteria

- [ ] קובץ spec חדש ב-`_handoff/2026-05-29-EOY-diagnostic-spec.md` (~2000-3000 מילים).
- [ ] 9 sections כמו MOY spec.
- [ ] לפחות 3-5 OPEN_QUESTIONs מפורשים למיטל (יש דברים שלא ברורים בלי החלטה פדגוגית).
- [ ] **אפס** edits ב-production code.
- [ ] **אפס** commits.
- [ ] רפורט סופי: "EOY spec done · N OPEN_QUESTIONs למיטל · ממתין לאישור push".

## אסור

- ❌ git commit / push
- ❌ עדכון agent-completion-log.md
- ❌ עדכון tracker.html
- ❌ עריכת moy-items.json / moy-screener.html / קוד JS חי
- ❌ להמציא משימות שלא ב-`madrich-mivdak-kriah-grade1.txt` — בספק לסמן OPEN_QUESTION
- ❌ להתחיל לפני קריאת MOY spec — סגנון EOY חייב לשקף MOY (continuity)

## בספק

שאל את מיטל. במיוחד:
- אם משימה 5/6/7/8/9/10 לא מובנת מ-`literacy-grade1-2-yearly.md`
- אם dummy item נראה לא-פדגוגי — לסמן בלי לכתוב
- אם חישוב threshold לא מתאים לראמ"ה (לא להמציא)

---

*Bootstrap זה מוכן לסוכן EOY spec. **לא חוסם פיילוט ספטמבר 2026** — אפשר להפעיל בכל עת אחרי שמיטל אישרה.*
