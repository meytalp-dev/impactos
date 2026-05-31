# Handoff — סוכן Fix אי 14: visual consistency (scene-bg + נוני + נרטיב)

> **מיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש. אומדן 2-3 שעות · משימה ממוקדת.

---

## הוראות תזמורת — מיטל · 31.5.2026

> finding: אי 14 (סוכן 31 · 29.5) **לא עומד ב-island-build-checklist**. מסלול שונה מ-pattern של איים 1-4: gradient כחול ייחודי במקום scene-bg PNG, אין נוני, אין נרטיב אמיתי. צריך הרמוניזציה ל-pattern של איים 1-4.

## הבעיה הספציפית

**stage-14-island.html · stage-14-listen-and-answer.html · stage-14-story-sequence.html — שלושתם:**

| צריך (לפי checklist + visuals memory) | יש כרגע באי 14 |
|---|---|
| `scene-bg` PNG: `assets/scene-stage-3-bg.png` | ❌ gradient ייחודי `--isle14-bg: linear-gradient(...)` |
| `noni-hero-transparent.png` עם בועת דיבור | ❌ אין נוני בכלל |
| `tokens.css` palette (לא צבעים אד-הוק) | 🟡 קיים import אבל overrides עם `--isle14-indigo/violet` |
| נרטיב סיפור עם בעיה→פתרון | ❌ welcome גנרי בלי story arc |
| consistency עם איים 1-4 | ❌ מסלול נפרד |

## מה לבנות

### Phase A — stage-14-island.html (welcome buffer) — 1h

**תבנית לעקוב:** [stage-4-island.html](../underwater-app/stage-4-island.html) של סוכן 29 fix.

1. ☐ קרא stage-4-island.html — זה ה-pattern הקנוני
2. ☐ קרא [[reference-avnei-yesod-island-build-checklist]] + [[feedback-avnei-yesod-noni-narrative-and-visuals-consistency]]
3. ☐ עדכן stage-14-island.html:
   - **רקע:** `<img class="scene-bg" src="assets/scene-stage-3-bg.png" alt="" aria-hidden="true">` (אותו PNG של איים 1-4)
   - **הסר** `--isle14-bg` gradient. הסר את כל ה-isle14-* CSS variables. השתמש ב-tokens.css.
   - **נוני hero:** `<img class="island-hero-noni" src="assets/noni-hero-transparent.png" alt="נוני">`
   - **בועת דיבור עם narrative אמיתי:** 3 פסקאות מנוקדות. דוגמה:
     > "שָׁלוֹם, חֲבֵרָה. בָּאִי הַשִּׁשִּׁי בַּשַּׁרְשֶׁרֶת, אֲנַחְנוּ לֹא קוֹרְאִים — אֲנַחְנוּ מַקְשִׁיבִים. דָּגִיגִים קְטַנִּים יְלַחֲשׁוּ לָנוּ סִפּוּרִים. אֶת תַּעֲנִי עַל שְׁאֵלוֹת. בּוֹאוּ נַתְחִיל!"
   - **CTA primary:** "בּוֹאוּ נַתְחִיל" → stage-14-listen-and-answer.html
   - **CTA secondary (אופציונלי):** "מָה זֶה הָאִי הַזֶּה?" → modal הסבר קצר
   - intro audio: `assets/audio/intro-isl14.mp3` (אם קיים — אם לא, אופציונלי)

### Phase B — stage-14-listen-and-answer.html (mechanic) — 45 דק'

**שמור** את ה-mechanic logic (האזנה + שאלות), **שנה רק** visuals:

4. ☐ הוסף `<img class="scene-bg" src="assets/scene-stage-3-bg.png">` ברקע
5. ☐ הוסף `<img class="noni-fixed" src="assets/noni-hero-transparent.png">` בפינה
6. ☐ הסר את ה-isle14-bg gradient + variables
7. ☐ ודא ש-passage_text + question_text + options יושבים על carrd לבן שקוף (לא על gradient כחול)
8. ☐ ודא שכפתורי תשובה משתמשים ב-tokens.css colors (--water-secondary, --coral וכו')

### Phase C — stage-14-story-sequence.html (mechanic) — 45 דק'

9. ☐ אותו treatment כמו Phase B
10. ☐ ודא ש-drag-drop interactions עובדות אחרי החלפת הCSS

### Phase D — Tests + Manual — 30 דק'

11. ☐ `node scripts/test-oral-skill-adapter.js` — 305/305 passing (לא אמור להיות רגרסיה — שינוי visual בלבד)
12. ☐ בדיקה ידנית:
    - מפה → אי 14 → island.html נראה consistent עם איים 1-4 (אותו scene-bg, נוני בפינה)
    - אי 14 → listen-and-answer → mechanic עובד · ויזואל consistent
    - מ-listen-and-answer → story-sequence → אותו pattern
13. ☐ עדכן `agent-completion-log.md`
14. ☐ צור `_handoff/2026-05-31-island-14-visual-fix-completion-report.md`

## Acceptance Criteria

- [ ] 3 קבצי stage-14-*.html משתמשים ב-scene-bg PNG (לא gradient ייחודי)
- [ ] נוני transparent מופיע בכל אחד
- [ ] בועת דיבור עם narrative אמיתי בstage-14-island.html
- [ ] אין יותר `--isle14-bg / isle14-indigo / isle14-violet` (הוסרו, בtokens.css במקום)
- [ ] 305/305 tests של oral-skill-adapter עוברים · 0 רגרסיות
- [ ] בדיקה ידנית של 3 המסכים עברה
- [ ] completion report ב-_handoff/

## אסור לך

- ❌ לערוך passages JSONs (`data/island-14-listening/*.json`) — תוכן פדגוגי קפוא
- ❌ לערוך `oral-skill-adapter.js` או `bkt.js` — infrastructure של סוכן 31
- ❌ לשנות mechanic logic (השמעה, שאלות, scoring) — רק visuals
- ❌ לערוך scene-bg PNG עצמו (משותף עם איים 1-4)
- ❌ לדחוף בלי אישור מיטל
- ❌ להמציא narrative — אם רוצה משהו אחר מהדוגמה — לשאול את מיטל

## Memory חובה — לקרוא ראשון

- [[reference-avnei-yesod-island-build-checklist]] · 11 לקחים מאי 4
- [[feedback-avnei-yesod-noni-narrative-and-visuals-consistency]] · הרציונל הפדגוגי
- [[feedback-avnei-yesod-niqud-on-student-screens]] · ניקוד מלא לטקסט נראה לילד.ה
- [[reference-hebrew-niqud-rules]] · כללי ניקוד
- [[feedback-kid-block-letters-not-handwriting]] · Heebo

## תיאום עם סוכנים אחרים

- סוכן 31 (אי 14) — סיים. אתה לא דורס אותו — רק תיקון visual
- סוכן 30 (אי 5) — סיים core + 12 מילים נוספות, push pending
- סוכנים 28+29 — סגורים

**לפני edit:** `git fetch origin && git status`. אם תראה M בקבצים שלא ערכת → להפסיק ולשאול את מיטל.

---

*Bootstrap Fix אי 14 visual · 31.5.2026 · 2-3h · יישור ל-pattern של איים 1-4.*
