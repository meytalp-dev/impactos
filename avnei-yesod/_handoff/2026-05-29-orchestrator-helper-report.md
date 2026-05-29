# Helper Agent Report — סוכן 22 · אבני יסוד · 29.5.2026 ערב

> **מה זה:** דו"ח של 8 משימות סקירה/תיעוד (A2 · A3 · A4 · A5 · B1 · C1 · C2 · C3).
> סוכן 22 הוא **helper-only — אפס edits בקוד**.
> **5 קבצים נכתבו ב-`_handoff/`. אפס commits.**

---

## A2 — Interventions Depth Map

5 קבצי JSON ב-`underwater-app/interventions/` נסקרו. ספירת תווים פר stage = `teacher_say + teacher_do + notes + success_criterion`. דרגות: **STUB <500** · **PARTIAL 500-1500** · **FULL 1500+**.

מימדים שsuggesti bootstrap סוכן 21 הציע (examples_to_use · differentiation · troubleshooting) — **אינם קיימים** באף אחד מ-5 הקבצים. המבנה הנוכחי = רק teacher_say/teacher_do/notes.

| pattern | stage | chars (say+do+notes+criterion) | grade | חסר |
|---|---|---|---|---|
| phonological | hook | 184 | STUB | examples_to_use · differentiation · troubleshooting |
| phonological | model | 220 | STUB | כל-הנ"ל + 2nd word example |
| phonological | guided | 233 | STUB | רשימת 3 מילים מפורשת · troubleshooting פר טעות |
| phonological | independent | 195 | STUB | רשימת 5 כרטיסיות + differentiation |
| phonological | check | 175 | STUB | success_criterion מילולי · examples למצב "פחות" |
| letter_knowledge | hook | 218 | STUB | examples_to_use · 2 דוגמאות letter pair confused |
| letter_knowledge | model | 366 | STUB | רשימת זוגות (כיום inline "מ/ם · נ/ן · כ/ך · ב/פ") · differentiation |
| letter_knowledge | guided | 248 | STUB | 4 מילים נתונות · troubleshooting פר זוג |
| letter_knowledge | independent | 167 | STUB | 5 כרטיסיות מפורשות · differentiation |
| letter_knowledge | check | 161 | STUB | כל-הנ"ל |
| decoding | hook | 213 | STUB | examples · differentiation |
| decoding | model | 200 | STUB | רשימת 2 מילים מודלינג · differentiation |
| decoding | guided | 257 | STUB | רשימת 3 מילים · troubleshooting |
| decoding | independent | 197 | STUB | 5 כרטיסיות מפורשות |
| decoding | check | 142 | STUB | כל-הנ"ל |
| fluency | hook | 174 | STUB | רשימת 10 מילים מוצעות · differentiation |
| fluency | model | 220 | STUB | רשימת 5 מילים נתונות · differentiation |
| fluency | guided | 253 | STUB | רשימת 3×ילדה מילים · troubleshooting |
| fluency | independent | 285 | STUB | 10 מילים מפורשות · success_criterion mid-tier |
| fluency | check | 199 | STUB | examples של תוצאות שונות |
| letter_cluster | hook | 274 | STUB | examples_to_use לפי קבוצה דמיונית |
| letter_cluster | model | 218 | STUB | 3 מילים פר אות דוגמה |
| letter_cluster | guided | 251 | STUB | troubleshooting פר אות לא ידועה |
| letter_cluster | independent | 156 | STUB | examples · differentiation לקצב שונה |
| letter_cluster | check | 167 | STUB | כל-הנ"ל |

**מסקנה A2:** כל 25 stages = **STUB** (175-366 chars · מטרה: 1500+). 5 הקבצים נכתבו כ-skeleton פדגוגי תקין (Rosenshine 5 stages · IES evidence · success_criterion) אבל ללא העומק שמורה יכולה להריץ ישירות בלי לחבר תוכן בעצמה. **bootstrap לסוכן 21 פדגוגי = המקום הנכון להוסיף enhanced fields.**

לא נמצאו stages "ריקים לחלוטין" — כולם חתומים פדגוגית. החוסר הוא בעומק הנגזר ולא ב-skeleton.

---

## A3 — Niqud Audit ל-MOY-Lite

### MOY items (`engine/moy-items.json` · 60 פריטים)

**0 בעיות ניקוד.** כל 60 הפריטים (30 task_3 + 30 task_4) ב-`passage_text · question_text · word · instruction_text · options.text` עם ניקוד מלא ותקין. הfix של מיטל ב-moy-3-007 (וְצְבָעִים → וּצְבָעִים) מתועד ב-`_meta.corrections_applied`. מבחן ראומה rigorous עבר.

### MOY screener UI (`engine/moy-screener.html`)

**1 בעיה דקדוקית מהותית · 2 בעיות קוסמטיות באוורת error states:**

| שורה | issue | severity |
|---|---|---|
| 280 | `הִקְשַׁבְתִּי, הַמְשֵׁךְ לַשְּׁאֵלוֹת ←` — **"הַמְשֵׁךְ" זכר** (צריך "הַמְשִׁיכִי" נקבה — הילדות הן הקהל) | **HIGH** (דקדוק שגוי בפני ילדה) |
| 486 | `⚠️ קובץ הפריטים לא נטען` — **ללא ניקוד** | LOW (fallback של שגיאת fetch — ילדה כן רואה אם MOY-items.json לא זמין) |
| 543 | `'אין פריטים זמינים למשימה ' + tKey` — **ללא ניקוד** | LOW (error state פנימי) |
| 7 | meta description — ללא ניקוד | NONE (לא מוצג לילדה) |
| 6 | `<title>` — ללא ניקוד | NONE (tab title, לא ילדה) |

✅ כל UI strings אחרים (welcome / noni bubble / 2 audio buttons / 2 task labels / done screen) **מנוקדים תקין**.

**המלצה ל-A3:** fix קל ל-`הַמְשִׁיכִי` (line 280) + 2 ניקודים על error fallbacks (lines 486, 543) — צריך פעולה מסוכן קוד (לא ב-scope של helper).

---

## A4 — MEMORY.md Review

5 memory files קיימים תחת `memory/`. תקפים. הצעות:

### עדכון מומלץ (1)

**`project-avnei-yesod-f21a-vs-f21e-split.md`** — מצוטט "F.21E חדש — דשבורד פעולתי (לא נבנה עדיין)". אבל commit `d7e86ec` ("F.21E — Action Dashboard · UI + helpers + tests · code agent") כבר נדחף מקומית. סוכן 1 בעבודה. עדכון הטקסט: "F.21E — code בעבודה ע"י סוכן 1 מ-28.5.2026. UI + f21e-helpers.js + 12/12 tests passing. ממתין ל-B.7+B.8+B.10 כדי להחיות פעולות".

### הצעות חדשות (3)

1. **`feedback-orchestrator-multi-vscode-parallel-pattern.md`** (feedback)
   - **תוכן:** סוכן 1 (F.21E code) + סוכן 19 (september items) רצו במקביל ב-2 VS Codes שונים מ-28.5 ערב. אפס conflicts כי הוגדר בקפדנות **אסור-לגעת** פר סוכן. **Why:** עבר חלק כי כל סוכן ידע ב-bootstrap בדיוק במה אסור לגעת + לא היה pull/push אוטומטי. **How to apply:** ל-multi-agent sessions עתידיות — לכלול **לפני כל bootstrap רשימת אסור-לגעת מפורשת** + תזמורת אוספת push בסוף.

2. **`reference-hebrew-niqud-rules.md`** (reference)
   - **תוכן:** הvalidation של moy-3-007 (וְצְבָעִים → וּצְבָעִים) חשפה את הכלל: **ו"ב שורוק לפני שווא נע**. עוד כללים פדגוגיים מסוג זה צפויים בכתיבת תוכן MOY/EOY עתידי.
   - **How to apply:** סוכן שכותב/בודק תוכן עברי מנוקד — מומלץ pedagogical review pass של human reviewer (כפי שעבר 6/6 batches ב-`2026-05-28-MOY-items-approved-60.json`).

3. **`project-moy-lite-item-structure.md`** (project)
   - **תוכן:** MOY-Lite items במבנה **1 passage × 1 question** פר item (לא 1 passage × 3 questions כמו ב-dummy v0.2). 30 פריטים פר task. בחירה אקראית של 10 לtask_3 ו-22 balanced לtask_4 (7+8+7 לפי sub_type).
   - **How to apply:** סוכן שכותב EOY items / מרחיב MOY pool — להישאר במבנה 1:1, אחרת engine/moy-screener.html לא יעבוד.

### למחיקה: אפס

---

## A5 — 22 stage-3-*.html Audit

נמצאו **23 קבצי stage-3**: 17 letter-specific (alef · gimel · dalet · hey · vav · zayin · het · tet · yud · kaf · lamed · nun · samekh · ayin · pey · tzadi · trail-resh) + 5 generic (house · island · rescue · shell · storm) + 1 template-demo.

⚠️ **shin** קיים כ-JSON ב-`data/island-03-letters/shin.json` אבל **אין HTML matching** (ייתכן שמשולב ב-island.html). [unknown — לבדוק עם מיטל]

### בדיקות שעברו (כל ה-17 letter JSONs)

| בדיקה | מצב |
|---|---|
| `mechanic` נטען מ-JSON | ✅ 17/17 |
| `distractors` עם 8 פריטים (יותר מ-4) | ✅ 17/17 |
| `title` מנוקד | ✅ 17/17 |
| `intro_audio_keys` מערך מלא | ✅ 17/17 |
| `rama_task_alignment: 1` | ✅ 17/17 |
| `peima_target: 1` | ✅ 17/17 |
| MP3 file matching `intro-{letter}.mp3` | ✅ 17/17 (כל הקבצים נמצאו ב-`assets/audio/`) |

### Issues שזוהו (קוסמטיים בלבד · אפס שבירות)

| letter | file | mechanic מ-JSON | issue | severity |
|---|---|---|---|---|
| ayin | stage-3-ayin.html | pick | הערה ב-line 106: `// אות י (yud) · ... · mechanic=pick` — **stale copy-paste מ-yud** | COSMETIC (אין השפעה פונקציונלית — letterKey='ayin' נכון) |
| kaf | stage-3-kaf.html | tap-all | הערה ב-line 109: `// אות ז (zayin) · ... · mechanic=tap-all` — **stale copy-paste מ-zayin** | COSMETIC |
| het | stage-3-het.html | memory-pair | הערה ב-line 102: `// אות ו (vav) · ... · mechanic=memory-pair` — **stale copy-paste מ-vav** | COSMETIC |

3 הערות stale ב-script comments (היה copy-paste מתבניות זמן הכתיבה). הקוד עצמו תקין (`letterKey` עם המחרוזת הנכונה).

**מסקנה A5:** אפס שבירות פונקציונליות. 3 הערות stale = `// אות {אות-אחרת}` — לאוורר ב-cleanup pass עתידי (לא חוסם פיילוט).

לא נבדקו: 5 generic stages (house/island/rescue/shell/storm) + trail-resh + template-demo — מחוץ ל-pattern של "22 letter games".

---

## A2-A5 Open Questions for מיטל

1. **A5:** shin.json קיים בלי stage-3-shin.html — שילוב ב-island.html או חסר HTML?
2. **A3:** האם להחליף `הַמְשֵׁךְ` ל-`הַמְשִׁיכִי` ב-line 280 של moy-screener.html — פעולה של סוכן קוד (1 שורה).
3. **A2:** האם להחיל את enhanced fields (examples_to_use / differentiation / troubleshooting) על 5 intervention files — דורש סוכן 21 פדגוגי לכתיבת תוכן (לא helper).

---

## B1 / C1 / C2 / C3 — Deliverables

הקבצים נכתבו כקבצים נפרדים (לא בתוך report) — לוקליזציה ל-`_handoff/`:

| תוצר | קובץ | סטטוס |
|---|---|---|
| B1 | `_handoff/2026-05-29-orchestrator-handoff-evening.md` | ✅ |
| C1 | `_handoff/2026-05-29-eoy-spec-agent-prompt.md` | ✅ |
| C2 | `_handoff/2026-05-29-a5-variants-agent-prompt.md` | ✅ |
| C3 | `_handoff/2026-05-29-verification-e2e-agent-prompt.md` | ✅ |

---

## Status: 8/8 done · 5 files written ב-_handoff/ · אפס commits · אפס edits בקוד production

*— סוף report של helper agent. ממתין לאישור push של תזמורת.*
