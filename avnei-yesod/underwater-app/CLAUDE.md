# אבני יסוד · underwater-app — הנחיות מנוע (קרא לפני נגיעה ב-`js/shared/`)

שכבת הדאטה כותבת ל-`localStorage` בלבד; cloud-sync היא שכבה תוספתית (no-op במצב דמו
`?presentation=1`/`?guest=1`). אל תשבור את ה-dual-mode.

## EPA — מפתח-יחידה גנרי (G4 סגור · 30.6.2026)

`js/shared/epa.js` סופר טעויות פר **יחידה**, לא פר-אות:

```
state[studentId][islandId][unitKey][axis][value] = count
unitKey = evt.target_letter || evt.characteristic_id
```

- **אות** (`target_letter`) — פונולוגיה / CV (תאימות לאחור; נתוני localStorage ישנים תקפים).
- **`characteristic_id`** — מורפולוגיה / הבנת-נקרא / זכר-נקבה / רבים (~430 שאלות בלי אות-יעד אחת).

כל משחקון שמדווח טעות חייב להעביר `target_letter` **או** `characteristic_id` ל-payload
(`event-logger.logActivityResult`), אחרת `ingestEvent` מדלג (`return null` — מפתח-זבל נמנע).
מצב EPA מצטבר 3 צירים אורתוגונליים: `failure` · `context` · `task`.
גרנולריות = `characteristic_id` (446); `sub_topic_id` (195) זמין אם נצטרך גס יותר — לא נפתר עדיין.
helpers: `getEPA(stu, island)` · `getEPAForUnit(stu, island, unitKey)` · `getDominantPattern(stu, island)`.
אימות: `node tests/epa-g4-unit-key.test.js` (12/12).

## BKT — פר-אי, לא פר-אות

`js/shared/bkt.js` ממפתח `state[studentId][islandId]` (לא פר-אות). תקין — אל תיגע בו בשינויי EPA.
`event-logger.resolveIslandId` מכבד `island_id` מפורש מהמשחקון תחילה, אחרת `PRIMARY_ISLAND[activity]`.
איים עתידיים: פשוט העבירו `primary_island_id` ב-result — בלי לגעת בקובץ.

## minigame-fit — מצב (30.6.2026)

G1–G4 כולם סגורים. ליבת `js/templates/mechanic-mcq.js` (config-driven, EPA פר-מסיח) מכסה 5
אינטראקציות. **T6 בוצע (5.7.2026):** מתכוני-התערבות ל-Comprehension/WrongPlural/GenderMismatch —
`interventions/comprehension.json` · `wrong-plural.json` · `gender-mismatch.json` + זיהוי ב-
`js/shared/interventions.js` (8 דפוסים, `scripts/test-interventions.js` 108/108) — **אושרו
פדגוגית ע"י מיטל 5.7.2026.** הפקת MP3/תמונות לבנק הושלמה (B2+B3, 4-5.7.2026).
דוח: `../../_handoff/2026-06-29-minigame-fit-report.md`.
