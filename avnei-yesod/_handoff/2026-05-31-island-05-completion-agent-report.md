# Completion Report — סוכן השלמת אי 5 · 31.5.2026

## Status
✅ Committed locally · Awaiting orchestrator push

## Decision taken
**B1-mini** — מסלול B1 המקורי דרס על טעות בספירת אותיות. רק מילה אחת אכן בת 4 אותיות. הוחלט עם מיטל ב-31.5.

## Vocab discrepancy discovered (חשוב לתזמורת)

ה-bootstrap המקורי קבע "B1 = הוספת 2 מילים ל-L3 (צִינוֹר + מִכְתָּב)" וטען ששתיהן בנות 4 אותיות. **הטענה שגויה.**

| מילה | base letters (stripNiqud) | L3 (4cv)? |
|---|---|---|
| מִכְתָּב | מ-כ-ת-ב = 4 | ✅ נוסף |
| צִינוֹר | צ-י-נ-ו-ר = **5** | ❌ נדחה ל-L4 post-pilot |
| תְּמוּנָה | ת-מ-ו-נ-ה = 5 | ❌ נדחה ל-L4 post-pilot |
| חֲנֻכִּיָּה | ח-נ-כ-י-ה = 5 | ❌ נדחה ל-L4 post-pilot |

הסתירה זוהתה ב-`words-level-3.json` metadata (v1.2) של סוכן 30: *"צִינוֹר *לא* נוסף — 5 אותיות בפועל"* — ה-bootstrap לא קלט את ההערה.

מיטל אישרה B1-mini: רק `מִכְתָּב`. 3 הקנדידטים בני 5 אותיות מתועדים ב-`post_pilot_l4_candidates` ב-JSON metadata.

## What was done

1. **Vocab L3 += 1** — `מִכְתָּב` נוסף ל-`words-level-3.json` (גרסה 1.3) ול-`word-adapter.js → WORDS_4CV`. סך מילים: 49 → 61 (L1=19 · L2=30 · L3=12). source: `vocab-bank.book_3_station_10_real_vs_invented` (line 664).
2. **Audio: 63 MP3 הופקו** ע"י `generate-island-05-word-audio.py` עם AvriNeural — 61 word-* + `intro-isl05.mp3` + `completion-isl05.mp3`. 0 כשלים. אזהרות BKP=0 (מ אינה ב/כ/פ).
3. **Map node** — `<a href="stage-5-island.html" data-island-id="5" data-vs-open="true" style="right:48%; top:30%">` עם label "השונית הצדפית", ממוקם בין אי 4 (right:62) ל-14 (right:35).
4. **Tests** — 14 test suites הורצו · 0 רגרסיות:
   - test-word-adapter: 121 ✓ (כולל JSON-adapter sync — L3=12)
   - test-island-5-integration: 49 ✓
   - test-vowel-adapter: 149 ✓
   - test-skill-units: 85 ✓
   - test-oral-skill-adapter: 305 ✓
   - test-bkt: ✓ engine
   - test-bkt-letters: 53 ✓
   - test-letter-targets: 59 ✓
   - test-event-logger-fields: ✓
   - test-cold-start: ✓
   - test-rama-task-status: ✓
   - test-pack-bridge: 75 ✓
   - test-weakness-targeting: 38 ✓
   - test-f21e-helpers: 132 ✓

## What's NOT in the commit (intentionally left for other agents / decisions)

- `.gitignore` (M) + `.env.example` (??) — שינוי שלא שלי, מוסיף הגנה על secrets. לא נגוע.
- `_tmp_doc.txt` / `_tmp_doc.xml` — סוכן פדגוגי B.7
- `teacher-action-v2.html` / `_voice-diag.html` / `_audio-test/` — debug/experiment, לא של אי 5
- `flow-slides-mockup.html` · `scripts/e2e/11-*` · `scripts/e2e/12-*` — presentation work
- `inclusion/` — פרויקט אחר

## For Meytal — manual test before pilot

1. פתחי `map.html` — האם אי 5 נראה בין אי 4 לאי 14 ב-right:48% top:30%?
2. לחיצה על אי 5 → `stage-5-island.html` (welcome buffer)
3. ה-CTA הראשי → `stage-5-word-merge.html` או mechanic אחר
4. 5 סבבים — בדקי:
   - אודיו נשמע נכון (b/k/p בדגש, לא v/x/f)?
   - `מִכְתָּב` נכלל בסט?
   - נוני קבועה ב-scene-bg של underwater?
   - ניקוד מלא בכל הטקסט?
   - celebration רק אחרי mastery אמיתי?
5. אם נכשל ב-1–4 → דווחי לתזמורת לתקן.

## Files in commit (selective add)

**Modified:**
- `avnei-yesod/_handoff/agent-completion-log.md`
- `avnei-yesod/underwater-app/js/shared/bkt.js`
- `avnei-yesod/underwater-app/js/shared/skill-units.js`
- `avnei-yesod/underwater-app/js/shared/word-adapter.js`
- `avnei-yesod/underwater-app/map.html`

**New (untracked → staged):**
- JSON: `avnei-yesod/underwater-app/data/island-05-words/*` (3 files + schema)
- Mechanics (5): `mechanic-{word-merge, tap-word, word-vs-word, match-word-to-image, word-build}.js`
- Stages (3): `stage-5-island.html`, `stage-5-word-merge.html`, `stage-5-word-build.html`
- Scripts: `generate-island-05-word-audio.py`, `test-word-adapter.js`, `test-island-5-integration.js`
- Audio: 63 MP3 ב-`assets/audio/`
- Handoff docs (4): completion-report (29.5 30agent) · vocab-gaps · bootstrap (31.5) · **this report (31.5)**

## Notes לתזמורת

- אסור לדחוף בעצמי (per bootstrap). אני רק committed-locally. ה-push הוא שלך.
- אם תרצי לדחות שורת `expected_count_bootstrap: 15` ב-JSON (כי בפועל לעולם לא נגיע ל-15 בלי L4) — זה החלטה פדגוגית של מיטל ל-V2.
- ה-post_pilot_l4_candidates (`צִינוֹר`, `תְּמוּנָה`, `חֲנֻכִּיָּה`) מתועדים ב-JSON metadata לרפרנס עתידי.
