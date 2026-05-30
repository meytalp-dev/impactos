# Handoff — סוכן Fix אי 4: השלמת 3 חסרים (island map · cv-pair · cv-build) + חיבור ל-map.html

> **מיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש. אומדן 5-7 שעות · משימה ממוקדת שמשלימה את עבודת סוכן 29.

---

## הוראות תזמורת — מיטל · 30.5.2026

> סוכן 29 בנה את ה-core של אי 4 (vowel-adapter · cv-pairs.json · 155 MP3s · stage-4-cv-tap.html · skill-units.js wire) אבל **לא סיים את כל המשחקונים ולא חיבר ל-map.html**. אתה משלים.

## מה כבר קיים (אל תיצור מחדש · אל תדרוס)

✅ **Infrastructure (סוכן 29):**
- [js/shared/vowel-adapter.js](../underwater-app/js/shared/vowel-adapter.js) — adapter מלא · API: `getVowels()` · `getCVPairs(letter, vowel)` · `getTopWeakCVs(sid, n=3)`
- [js/shared/skill-units.js](../underwater-app/js/shared/skill-units.js) — wire של `AvneiVowelAdapter` (type='vowel') · קיים, אל תשנה
- [js/templates/mechanic-tap-cv.js](../underwater-app/js/templates/mechanic-tap-cv.js) — mechanic tap-cv מוכן
- [data/island-04-cv/cv-pairs.json](../underwater-app/data/island-04-cv/cv-pairs.json) + `_schema.md`
- [scripts/build-cv-pairs.js](../underwater-app/scripts/build-cv-pairs.js) · [scripts/generate-island-04-cv-audio.py](../underwater-app/scripts/generate-island-04-cv-audio.py) · `generate-island-04-narration-audio.py` · `generate-island-04-words-audio.py`
- [scripts/test-vowel-adapter.js](../underwater-app/scripts/test-vowel-adapter.js)
- 155+ MP3 אודיו ב-`assets/audio/cv-*-*.mp3` + `completion-isl04.mp3`
- [stage-4-cv-tap.html](../underwater-app/stage-4-cv-tap.html) — משחקון 1/3, **עובד**, רפרנס לסגנון

✅ **mastery-check.js** — כבר מוגדר רישום אי 4 (משורה 69, היה קיים)

## מה חסר — בנה את אלה

### Phase A — stage-4-island.html + חיבור ל-map ראשי (1h)

1. ☐ קרא את [stage-3-island.html](../underwater-app/stage-3-island.html) כתבנית — אי 4 הוא ה-island הבא בסדרה, אותו מבנה.
2. ☐ צור `stage-4-island.html` — מפת האי עם 10-15 quests (כל quest = CV pair / letter / mechanic).
   - שם האי: "אי הצירופים" (אות + ניקוד = צליל ראשון)
   - 3 mechanics זמינים מהמשחקונים: `cv-tap` · `cv-pair` · `cv-build`
   - להשתמש ב-`AvneiVowelAdapter.getTopWeakCVs(sid)` לסדר quests פר חולשת הילדה
   - **scene-bg PNG חובה** + **נוני transparent** — לפי [[reference-avnei-yesod-island-build-checklist]]
3. ☐ עדכן [map.html](../underwater-app/map.html) — הוסף נקודת אי 4 אחרי שורה 418 (אי 3):
   ```html
   <!-- אי 4 — אות-ניקוד-צליל (CV) (סוכן fix · 30.5.2026 · pilot). -->
   <a href="stage-4-island.html" class="map-node" data-island-id="4" data-vs-open="true" style="right: 60%; top: 35%;">
     <!-- ... עיצוב לפי תבנית של אי 3 / אי 14 ... -->
   </a>
   ```
   (התאם `right/top` כך שלא יחפוף עם 1·2·3·14 הקיימים.)

### Phase B — stage-4-cv-pair.html (memory-pair · 2-3h)

4. ☐ צור `stage-4-cv-pair.html` — mechanic=memory-pair · CV ↔ תמונה (או CV ↔ CV הומופוני).
   - תבנית לסגנון: [stage-4-cv-tap.html](../underwater-app/stage-4-cv-tap.html) (סוכן 29)
   - תבנית למכניקה: חפש משחקי memory קיימים ב-stage-3-*.html אם יש (`stage-3-shell.html`?)
   - **phoneme group accept** — מַ + מָ שניהם /a/ נחשבים נכון (לפי checklist)
   - אודיו: MP3 מ-`assets/audio/cv-*-*.mp3` הקיים (סוכן 29 הפיק 155 קבצים)
5. ☐ עדכן או צור `js/templates/mechanic-memory-pair.js` (אם לא קיים)

### Phase C — stage-4-cv-build.html (build · 2-3h)

6. ☐ צור `stage-4-cv-build.html` — mechanic=build · ילדה בוחרת אות + ניקוד מתפריט = הצליל מושמע.
   - תבנית: stage-4-cv-tap.html
   - 22 אותיות בצד אחד · 7 ניקודים בצד שני · ילדה גוררת/מקליקה
   - בלחיצה: build את ה-CV pair → להשמיע את ה-MP3 המתאים מ-`assets/audio/`
   - feedback ויזואלי: אם הצירוף לא קיים ב-cv-pairs.json → fall-back פדגוגי (לא error)
7. ☐ צור `js/templates/mechanic-cv-build.js` חדש

### Phase D — Tests + Manual + Completion Report (1h)

8. ☐ הריצי `node scripts/test-vowel-adapter.js` — וודאי 0 רגרסיות.
9. ☐ הריצי כל 18+ test suites של אבני יסוד — `node scripts/test-*.js` — 0 רגרסיות.
10. ☐ בדיקה ידנית בbrowser:
    - פתחי `map.html` → נקודת אי 4 רואים → לחיצה → `stage-4-island.html` נפתח
    - פתחי כל 3 משחקוני stage-4-* → mechanic עובד · MP3 משמיע · אין שגיאות console
11. ☐ עדכן [_handoff/agent-completion-log.md](agent-completion-log.md) — בלוק חדש "סוכן fix · אי 4 completion".
12. ☐ צור `_handoff/2026-05-30-island-04-completion-report.md` — דיווח מלא + 2-3 findings אם יש.

## Acceptance Criteria

- [ ] `stage-4-island.html` קיים · 10-15 quests · scene-bg + נוני + tokens.css
- [ ] `map.html` כולל `data-island-id="4"` עם `data-vs-open="true"`
- [ ] `stage-4-cv-pair.html` + mechanic — עובד עם MP3 + phoneme group accept
- [ ] `stage-4-cv-build.html` + mechanic — בחירת אות+ניקוד → השמעת MP3
- [ ] 0 רגרסיות ב-18+ test suites
- [ ] בדיקה ידנית עברה ב-3 משחקונים
- [ ] completion report ב-_handoff/

## אסור לך

- ❌ **לדרוס את stage-4-cv-tap.html** — סוכן 29 בנה אותו, **הוא RFRENCE לסגנון בלבד**
- ❌ לערוך את `vowel-adapter.js` / `cv-pairs.json` / 155 MP3 קבצים (סוכן 29 גמר אותם)
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

- סוכן 31 (אי 14) — סיים · push ב-origin בקרוב (תזמורת תדחוף לפניך) · אין חפיפה
- סוכן 29 (אי 4) — סיים את ה-core שלו · אתה משלים · אסור לדרוס את שלו
- סוכן Fix A/G-1 (Print/PDF במודל B.7) — bootstrap עומד נפרד · יכול לרוץ במקביל (אין חפיפה — הוא ב-teacher-action/teacher-rama)

**לפני edit:** `git fetch origin && git status`. אם תראה M בקבצים של סוכן 29 שאמורים להיות נקיים → להפסיק ולשאול את מיטל.

---

*Bootstrap סוכן Fix אי 4 · 30.5.2026 · השלמת 3 חסרים · 5-7h · מסגר את אי 4 לפיילוט.*
