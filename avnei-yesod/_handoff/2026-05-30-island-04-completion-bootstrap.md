# Handoff — סוכן Fix אי 4: השלמת 2 חסרים (stage-4-island.html · stage-4-cv-build.html) + חיבור ל-map.html

> **מיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש. אומדן 3-5 שעות · משימה ממוקדת שמשלימה את עבודת סוכן 29.

> **גרסה 2 · 30.5.2026** — עודכן לפי הערות סוכן 29: stage-4-cv-tap.html הוא session-runner שלם (לא משחקון 1/3) · יש 4 mechanics קיימים (לא 1) · match-cv-to-word כבר ממלא את תפקיד cv-pair · 175 MP3 (לא 155).

---

## הוראות תזמורת — מיטל · 30.5.2026

> סוכן 29 בנה את **חוויית האי המלאה** של אי 4: vowel-adapter · cv-pairs.json · 175 MP3s · stage-4-cv-tap.html (**session-runner** של 5 סבבים עם 4 mechanics) · skill-units.js wire. **לא בנה רק:**
> 1. `stage-4-island.html` (מסך פתיחה buffer)
> 2. `stage-4-cv-build.html` (mechanic חדש — מבנה אות+ניקוד)
> 3. חיבור ל-`map.html`

## מה כבר קיים (אל תיצור מחדש · אל תדרוס)

✅ **Infrastructure (סוכן 29):**
- [js/shared/vowel-adapter.js](../underwater-app/js/shared/vowel-adapter.js) — adapter מלא · API: `getVowels()` · `getCVPairs(letter, vowel)` · `getTopWeakCVs(sid, n=3)`
- [js/shared/skill-units.js](../underwater-app/js/shared/skill-units.js) — wire של `AvneiVowelAdapter` (type='vowel') · אל תשנה
- [data/island-04-cv/cv-pairs.json](../underwater-app/data/island-04-cv/cv-pairs.json) + `_schema.md`
- [scripts/build-cv-pairs.js](../underwater-app/scripts/build-cv-pairs.js) + 3 audio generators (cv · narration · words)
- [scripts/test-vowel-adapter.js](../underwater-app/scripts/test-vowel-adapter.js) — 138 tests passing
- **175 MP3 אודיו** ב-`assets/audio/`:
  - 154 CV (`cv-{letter}-{vowel}.mp3`)
  - 15 anchor words
  - 6 narration files
  - `completion-isl04.mp3`

✅ **4 mechanics קיימים (סוכן 29):**
- [mechanic-tap-cv.js](../underwater-app/js/templates/mechanic-tap-cv.js) — "תפסי את מַ"
- [mechanic-listen-cv.js](../underwater-app/js/templates/mechanic-listen-cv.js) — שמע צליל → בחרי CV
- [mechanic-cv-vs-cv.js](../underwater-app/js/templates/mechanic-cv-vs-cv.js) — השוואה בין 2 CVs
- [mechanic-match-cv-to-word.js](../underwater-app/js/templates/mechanic-match-cv-to-word.js) — **ממלא את תפקיד cv-pair** (CV ↔ מילת עוגן)

✅ **Session-runner מוכן:**
- [stage-4-cv-tap.html](../underwater-app/stage-4-cv-tap.html) — **session שלם של 5 סבבים** עם רוטציה של 4 mechanics + נרטיב דגים + נוני + journey strip. **שם הקובץ מטעה — הוא לא רק tap-cv. הוא ה-session המלא של אי 4.**

✅ **mastery-check.js** — כבר מוגדר רישום אי 4 (משורה 69, היה קיים)

## מה חסר — בנה את אלה

### Phase A — stage-4-island.html (buffer קצר) + חיבור ל-map ראשי (1h)

> **החלטת מיטל:** island.html הוא **מסך פתיחה** (welcome buffer), לא מפת quests. ילדה פוגשת חוויה אחידה — כל פעם רואה את אותו welcome → נכנסת ל-cv-tap.html כסשן שלם.

1. ☐ קרא את [stage-3-island.html](../underwater-app/stage-3-island.html) כתבנית — אי 4 הוא הבא בסדרה, אותו pattern של buffer.
2. ☐ צור `stage-4-island.html` — מסך פתיחה קצר:
   - שם האי: "אי הצירופים" (אות + ניקוד = צליל ראשון)
   - נוני transparent + בועת דיבור: "ברוכה הבאה לאי הצירופים! נצא לדוג צלילים?"
   - **scene-bg PNG חובה** (אותו pattern של איים אחרים) + נוני + tokens.css — לפי [[reference-avnei-yesod-island-build-checklist]]
   - כפתור גדול "התחילי!" → קישור ל-`stage-4-cv-tap.html`
   - **לא** מפת quests · **לא** רשימת mechanics נפרדת
3. ☐ עדכן [map.html](../underwater-app/map.html) — הוסף נקודת אי 4 אחרי שורה 418 (אי 3):
   ```html
   <!-- אי 4 — אות-ניקוד-צליל (CV) (סוכן fix · 30.5.2026 · pilot). -->
   <a href="stage-4-island.html" class="map-node" data-island-id="4" data-vs-open="true" style="right: 60%; top: 35%;">
     <!-- ... עיצוב לפי תבנית של אי 3 / אי 14 ... -->
   </a>
   ```
   (התאם `right/top` כך שלא יחפוף עם 1·2·3·14 הקיימים.)

### Phase B — stage-4-cv-build.html (build mechanic · 2-3h)

> **המכניקה החסרה היחידה.** cv-pair (memory) **לא נדרש** — `mechanic-match-cv-to-word.js` שכבר קיים ממלא את התפקיד הפדגוגי.

4. ☐ צור `stage-4-cv-build.html` — ילדה בוחרת אות + ניקוד מתפריט = הצליל מושמע.
   - **רפרנס לסגנון:** [stage-4-cv-tap.html](../underwater-app/stage-4-cv-tap.html) (סוכן 29) — אבל **אל תדרוס אותו**
   - 22 אותיות בצד אחד · 7 ניקודים בצד שני · ילדה גוררת/מקליקה
   - בלחיצה: build את ה-CV pair → להשמיע את ה-MP3 המתאים מ-`assets/audio/cv-{letter}-{vowel}.mp3`
   - feedback ויזואלי: אם הצירוף לא קיים ב-cv-pairs.json → fall-back פדגוגי (לא error)
   - **phoneme group accept** — מַ + מָ שניהם /a/ נחשבים נכון (לפי checklist)
5. ☐ צור `js/templates/mechanic-cv-build.js` — mechanic חדש (לא מבוסס על קיים)

> **שאלת decision לסוכן fix:** האם cv-build יוכנס כ-mechanic 5 לתוך session של stage-4-cv-tap.html, או יהיה standalone שזמין רק מ-island.html? **תשאל את מיטל לפני שמחליט.**

### Phase C — Tests + Manual + Completion Report (1h)

6. ☐ הריצי `node scripts/test-vowel-adapter.js` — וודאי 138/138 (0 רגרסיות).
7. ☐ הריצי כל 18+ test suites של אבני יסוד — `node scripts/test-*.js` — 0 רגרסיות.
8. ☐ בדיקה ידנית בbrowser:
    - פתחי `map.html` → נקודת אי 4 רואים → לחיצה → `stage-4-island.html` נפתח עם נוני welcome
    - לחיצה על "התחילי" → `stage-4-cv-tap.html` (הסשן הקיים) פועל ללא שינוי
    - פתחי `stage-4-cv-build.html` ישירות → mechanic חדש עובד · MP3 משמיע · אין שגיאות console
9. ☐ עדכן [_handoff/agent-completion-log.md](agent-completion-log.md) — בלוק חדש "סוכן fix · אי 4 completion".
10. ☐ צור `_handoff/2026-05-30-island-04-completion-report.md` — דיווח מלא + findings אם יש.

## Acceptance Criteria

- [ ] `stage-4-island.html` קיים · welcome buffer קצר · scene-bg + נוני + tokens.css + כפתור "התחילי" → cv-tap
- [ ] `map.html` כולל `data-island-id="4"` עם `data-vs-open="true"` · ללא חפיפה עם 1/2/3/14
- [ ] `stage-4-cv-build.html` + `mechanic-cv-build.js` — בחירת אות+ניקוד → השמעת MP3
- [ ] **stage-4-cv-tap.html לא שונה** (session-runner נשאר נקי)
- [ ] 0 רגרסיות ב-18+ test suites
- [ ] בדיקה ידנית עברה (map → island → cv-tap זרם, + cv-build standalone)
- [ ] completion report ב-_handoff/

## אסור לך

- ❌ **לדרוס את stage-4-cv-tap.html** — זה ה-session-runner של סוכן 29, **רק רפרנס לסגנון**
- ❌ לערוך את `vowel-adapter.js` / `cv-pairs.json` / 175 MP3 קבצים / 4 mechanics קיימים
- ❌ לבנות `stage-4-cv-pair.html` או `mechanic-memory-pair` — `match-cv-to-word` כבר ממלא את התפקיד (החלטת סוכן 29 שאומתה)
- ❌ לערוך `bkt.js` / `mastery-check.js` (כבר מוגדר אי 4 דרך מנגנון per_letter של אי 3 — החלטת מיטל "פר אות")
- ❌ לערוך `skill-units.js` (סוכן 29 חיבר vowel adapter — אל תיגע)
- ❌ לערוך מסמכי-אם · interventions/*.json · moy-items.json · packs/*
- ❌ לדחוף ל-git בלי אישור מיטל
- ❌ Web Speech — להשתמש **רק** ב-MP3 הקיים (AvriNeural · `assets/audio/cv-*-*.mp3`)
- ❌ להמציא תוכן vocab — אם חסר אות/ניקוד → לבקש ממיטל

## Memory חובה — לקרוא לפני Phase A

- [[reference-avnei-yesod-island-build-checklist]] — **MUST READ** · 11 לקחים מאי 4 שעלו אצל סוכן 29
- [[feedback-avnei-yesod-noni-narrative-and-visuals-consistency]] — נוני + scene-bg + tokens.css
- [[feedback-avnei-yesod-niqud-on-student-screens]] — ניקוד מלא
- [[reference-hebrew-niqud-rules]] — 9 כללי ניקוד
- [[feedback-kid-block-letters-not-handwriting]] — Heebo בלבד

## תיאום עם סוכנים אחרים

- סוכן 31 (אי 14) — סיים · ב-origin (ee9cd88) · אין חפיפה
- סוכן 29 (אי 4) — סיים את ה-session-runner + 4 mechanics · ב-origin · אתה משלים את הbuffer + cv-build
- סוכן Fix A/G-1 (Print/PDF במודל B.7) — bootstrap עומד נפרד · יכול לרוץ במקביל (הוא ב-teacher-action/teacher-rama)

**לפני edit:** `git fetch origin && git status`. אם תראה M בקבצים של סוכן 29 שאמורים להיות נקיים → להפסיק ולשאול את מיטל.

---

*Bootstrap סוכן Fix אי 4 · v2 · 30.5.2026 · 2 חסרים (island buffer + cv-build) · 3-5h · מסגר את אי 4 לפיילוט.*
