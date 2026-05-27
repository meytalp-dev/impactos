# קומיטים ממתינים — אבני יסוד
**📌 A1 נסגר 27.5.2026** · 3 קבוצות נדחפו (A · B · C). 2 נשארות חסומות על החלטות פדגוגיות (D · F).
**עדכון ולא קובץ חי** — לעדכונים עתידיים, צרו קובץ חדש מתוארך.

---

## ✅ קבוצה Q — D.15 v2 שלב E · קבוצת דגים (נדחפה 27.5 לילה · `e36a916`) — **D.15 סגורה!**

**סטטוס:** ✅ נדחפה · **17/17 אותיות D.15 חיות · רף ראמ"ה נפתח · חוסם פיילוט P0 נסגר**
**תאריך:** 2026-05-27 לילה
**משמעות אסטרטגית:** עם שלב E, **17/17 אותיות D.15 חיות** → רף ראמ"ה 18+/22 עובר (5 אמנותיים + 12 חדשים = 17 + עוד 5 אמנותיים = 22 סה"כ). חוסם פיילוט P0 נסגר.

**19 קבצים** (18 חדשים + 1 שינוי + 3 handoff updates)

| # | קובץ | סטטוס |
|---|---|---|
| 1 | `scripts/generate-fish-audio-d15.py` | חדש |
| 2-11 | `assets/audio/{intro,find}-{dalet,gimel,het,pey,kaf}.mp3` | 10 חדשים |
| 12-16 | `data/island-03-letters/{dalet,gimel,het,pey,kaf}.json` | 5 חדשים |
| 17-21 | `stage-3-{dalet,gimel,het,pey,kaf}.html` | 5 חדשים (cp+edit) |
| + | `stage-3-island.html` | שינוי — קבוצת דגים `built:true` |

הרוטציה: ד=tap-all · ג=pick · ח=memory-pair · פ=sort-by-letter · **כ=tap-all (חזרה לתחילה — אות 5)**.

5 אותיות > 4 מכניקות → כ' חוזרת ל-tap-all. סגירת מעגל.

לא נגעו ב-engine/mechanics/letter-anims/CSS — שכפול נטו של תבנית.

---

## ✅ קבוצה P — D.15 v2 שלב D · קבוצת צדפים (נדחפה 27.5 לילה · `98911af`)

**סטטוס:** 🟡 ממתין לאישור מיטל ידני / push (אחרי שלב C)
**תאריך:** 2026-05-27 לילה
**17 קבצים** (16 חדשים + 1 שינוי + 3 handoff updates)

| # | קובץ | סטטוס | הערה |
|---|---|---|---|
| 1 | `scripts/generate-shells-audio-d15.py` | **חדש** | 8 MP3 בהרצה אחת |
| 2-9 | `assets/audio/{intro,find}-{samekh,ayin,tzadi,tet}.mp3` | **8 חדשים** | AvriNeural |
| 10-13 | `data/island-03-letters/{samekh,ayin,tzadi,tet}.json` | **4 חדשים** | tap-all/pick/memory/sort · theme:shells |
| 14-17 | `stage-3-{samekh,ayin,tzadi,tet}.html` | **4 חדשים** | מבוססים על HTMLs מ-C (cp+edit letterKey+ucLetter) |
| + | `stage-3-island.html` | שינוי | קבוצת צדפים `built:true` עם שמות מותאמים פר מכניקה |
| + | `_handoff/{agent-completion-log,meytal-pending,pending-commits}.md` | שינוי | תיעוד |

**24/24 sanity tests.** לא נגעו ב-engine או mechanics — שכפול נטו של תבנית C.

**משמעות:** 12 מ-17 אותיות D.15 חיות (4 בועות + 4 כוכבים + 4 צדפים). נשארו 5 דגים (שלב E).

---

## ✅ קבוצה O — D.15 v2 שלב C · קבוצת כוכבים (נדחפה 27.5 לילה · `326b55c`)

**סטטוס:** ✅ נדחפה (לפני בדיקה ידנית של מיטל — אישרה push קודם → שלב D הבא)
**תאריך:** 2026-05-27 לילה (אחרי M+B+B-revised)
**17 קבצים (16 חדשים + 1 שינוי + 3 handoff updates) · חבילה אחת**

| # | קובץ | סטטוס | הערה |
|---|---|---|---|
| 1 | `underwater-app/scripts/generate-stars-audio-d15.py` | **חדש** | 8 MP3 בהרצה אחת · ניסוח פר מכניקה |
| 2-9 | `underwater-app/assets/audio/{intro,find}-{zayin,yud,vav,hey}.mp3` | **8 חדשים** | AvriNeural · rate -10% |
| 10-13 | `underwater-app/data/island-03-letters/{zayin,yud,vav,hey}.json` | **4 חדשים** | mechanic: tap-all/pick/memory-pair/sort-by-letter · theme:stars |
| 14-17 | `underwater-app/stage-3-{zayin,yud,vav,hey}.html` | **4 חדשים** | טוענים את כל ה-mechanics + letter-anims · CSS v=9 |
| + | `underwater-app/stage-3-island.html` | שינוי קל | קבוצת כוכבים: `built:true` ל-4 כרטיסים · שמות מותאמים פר מכניקה (צֵיד · בְּחִירַת · זִכָּרוֹן · מִיּוּן) |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד שלב C |
| + | `_handoff/meytal-pending.md` | בלוק חדש בראש | בדיקה ידנית של 4 הכוכבים |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו |

**מהות התוצר:**
שכפול של הרוטציה מקבוצת בועות (שלב B-revised) אל קבוצת כוכבים. אותה ארכיטקטורה — 4 מכניקות שונות פר אות — אבל עם נושא ויזואלי "כוכבי הים" וניסוח אודיו נושאי שונה. SVG האסוציאטיביים פר אות (זברה/יום/ורד/הר) כבר ב-letter-anims.js מ-M+B+B-revised.

**יחס לקבוצות שכבר נדחפו / ממתינות:**
- ❌ אין שינוי בקבצי engine או mechanics — שלב C משתמש בלבד במכניקות שכבר נדחפו ב-`a039980`
- ❌ אין חפיפת קבצים עם N (F.21A)
- ✅ תלות בקבוצה M+B+B-revised (`a039980`) — היא נדחפה כבר, אז אין חסימה

**🎯 איך זה משתלב במשימת-אם:**
8 מ-17 אותיות חיות עכשיו (4 בועות + 4 כוכבים). 9 חסרות לרף ראמ"ה 18+/22 (4 צדפים · 5 דגים). שלבי D+E יבואו זהים במבנה.

**לפני push (חובה — סביבת ריבוי-סוכנים):**
```
git fetch origin && git status
```

**הצעת message לקומיט:**
```
D.15 v2 שלב C — קבוצת כוכבים (4 אותיות, אותה רוטציה)

שכפול של הרוטציה מקבוצת בועות (M+B+B-revised) אל קבוצת
כוכבים. 4 אותיות, 4 מכניקות שונות:
  ז = tap-all       (צֵיד הַכּוֹכָבִים · זברה)
  י = pick          (בְּחִירַת הַכּוֹכָבִים · יום/שמש)
  ו = memory-pair   (זִכָּרוֹן הַכּוֹכָבִים · ורד)
  ה = sort-by-letter (מִיּוּן הַכּוֹכָבִים · הר)

4 JSONs חדשים · 4 HTMLs חדשים · 8 MP3 חדשים (intro+find פר
אות, ניסוח פר מכניקה). SVG אסוציאטיביים כבר ב-letter-anims.js
מ-M+B+B-revised — לא נגעו בקבצי engine או mechanics.

stage-3-island.html — 4 כרטיסי כוכבים עברו מ-coming-soon
ל-built:true עם שמות מותאמים פר מכניקה.

44/44 smoke tests. לא נגעו: bkt/epa/event-logger/mastery-check/
profile-classifier / כל קבצי js/templates / 5 משחקוני אי 3
האמנותיים / מסמכי-אם.

8 מ-17 אותיות חיות. נשאר: 4 צדפים (D) · 5 דגים (E) לרף 18+/22.
```

**מסלול בדיקה ידנית:** ראה meytal-pending.md → "🧪 D.15 v2 שלב C"

---

## ✅ קבוצה M+B+B-revised — D.15 שלב 1 + v2 שלב B + B-revised (נדחפה 27.5 לילה · `a039980`)

**עדכון 27.5 לילה:** הקבוצה הזו מאחדת עכשיו 3 שלבים: שלב 1 (ל·נ·א בסיסי) + שלב B (תשתית אנימציה ייחודית) + B-revised (3 מכניקות מתחלפות בקבוצת בועות).

**42 קבצים סה"כ** (~28 חדשים + ~10 שינויים + 4 handoff updates)

### B-revised — נוסף 27.5 לילה (8 קבצים)

| # | קובץ | סטטוס | הערה |
|---|---|---|---|
| 1 | `js/templates/mechanic-memory-pair.js` | **חדש** (~290 שורות) | 6 קלפים flip · pair = letter + SVG (מ-letter-anims) |
| 2 | `js/templates/mechanic-sort-by-letter.js` | **חדש** (~350 שורות) | Pointer events drag · 5-7 floaters → 2 bins |
| 3 | `js/templates/mechanic-pick.js` | שינוי | PRAISE_POOL חדש · inGamePromptAudioKey · without-replacement |
| 4 | `css/game-shell.css` | שינוי גדול | בלוקים `.mechanic-memory-pair` + `.mechanic-sort` + 8 sub-rules + animations |
| 5 | `data/island-03-letters/lamed.json` | שינוי | `mechanic: pick` · podsPerRound:4 |
| 6 | `data/island-03-letters/nun.json` | שינוי | `mechanic: memory-pair` · counter: זוגות 3 |
| 7 | `data/island-03-letters/alef.json` | שינוי | `mechanic: sort-by-letter` |
| 8 | 4 HTMLs (`stage-3-{lamed,nun,alef,template-demo}.html`) | שינוי | טעינת mechanic-memory-pair + mechanic-sort-by-letter · CSS v=8→v=9 |

**משמעות אסטרטגית:**
שלב B-revised פותר את ההערה של מיטל מ-27.5 לילה: "כל המשחקים עדיין באותו פורמט". עכשיו ב-כל קבוצה של 4 אותיות יש 4 מכניקות שונות (tap-all · pick · memory · sort), והרוטציה הזו תחזור בקבוצות הבאות (כוכבים/צדפים/דגים) — תוכנית ל-13 האותיות הנותרות תהיה זריזה יחסית כי המכניקות כבר בנויות.

**יחס לקבוצות שכבר נדחפו / ממתינות:**
- ❌ אין שינוי בקבצי ה-engine (bkt/epa/event-logger/mastery/profile)
- ❌ אין חפיפת קבצים עם קבוצה N (F.21A) — N נוגעת ב-`teacher-rama.html`/`mastery-check.js`, M+B נוגעת ב-`stage-3-*`/`game-shell.js`/`mechanic-*`/`letter-anims.js`/`css`
- ✅ M+B תלויה ב-D.14 (קבוצה J). אם D.14 עוד לא ב-`main`, צריך לדחוף קודם.

**🎯 פונקציות חדשות שנחשפות:**
- `window.AvneiMechanics['memory-pair']` — mount(root, opts)
- `window.AvneiMechanics['sort-by-letter']` — mount(root, opts)
- `window.AvneiLetterAnims.getAnimForLetter` + `runAnimation` (משלב B)

**הצעת message לקומיט מעודכן:**
```
D.15 שלב 1 + v2 שלב B + B-revised — בועות עם 4 מכניקות

חבילה משולשת: שלב 1 (3 אותיות חדשות) → שלב B (אנימציה
ייחודית פר אות + 9 word MP3) → B-revised (3 מכניקות
מתחלפות פנימית בקבוצה).

B-revised פותר את הערת מיטל מ-27.5 לילה: 4 הבועות לא
באותו פורמט יותר. עכשיו ש=tap-all · ל=pick · נ=memory-pair
· א=sort-by-letter. הרוטציה תחזור בכוכבים/צדפים/דגים.

2 מכניקות חדשות:
  mechanic-memory-pair.js (~290 שורות) — 6 קלפים flippable,
    3D rotateY transform · pair = אות + SVG מ-letter-anims
  mechanic-sort-by-letter.js (~350 שורות) — pointer events
    drag (mouse + iOS Safari 13+ touch) · 7 floaters → 2 bins,
    hit-test ב-elementFromPoint · placed/absorbed animations

mechanic-pick.js מעודכן: PRAISE_POOL חדש (yofi/metzuyan/mealeh)
במקום FEEDBACK_AUDIO old (exactly/great/right · קבצים לא קיימים).
without-replacement של שבחים. inGamePromptAudioKey במקום
sound-letter בלבד.

3 JSONs מעודכנים — lamed/nun/alef. בכל אחד mechanic + title +
intro_html חדשים. nun עבר ל-counter "זוגות 3" במקום "בועות 5".
4 HTMLs טוענים את 2 המכניקות החדשות + CSS bump ל-v=9.

CSS חדש (~280 שורות): .mechanic-memory-pair + .memory-card
(3D flip + pop) + .mechanic-sort + .sort-item (float/drag/
absorbed/sway) + .sort-bin (target+distractor + hint-pulse).

לא נגעו: bkt/epa/event-logger/mastery-check/profile-classifier
/ mechanic-tap-all / mechanic-quest / letter-anims / 5 משחקוני
אי 3 / stage-3-island.html.

36/36 smoke tests עוברים.
Spec: _handoff/2026-05-27-d15-v2-enhancements-spec.md
שלב הבא: C — כוכבים (אותה רוטציה, 4 JSONs+HTMLs+MP3 מהר).
```

**מסלול בדיקה ידנית של מיטל לפני אישור push:**
ראה meytal-pending.md → "🧪 D.15 v2 שלב B-revised — בדיקה ידנית של 3 מכניקות שונות בקבוצת בועות"

**אם נמצא באג** → איטרציה על המכניקה הספציפית.
**אם הכל תקין** → push מאוחד, מתחילים שלב C.

---

## 🟡 קבוצה M+B (תיאור קודם — לפני B-revised) — D.15 שלב 1 + v2 שלב B (משולבת)

**סטטוס:** 🟡 דורש בדיקת מיטל ידנית לפני push
**תאריך:** 2026-05-27 לילה
**הערה:** הקבוצה הזו מאחדת את שלב 1 הקיים (ל·נ·א בועות בסיסי) + שלב B החדש (תשתית אנימציה ייחודית פר אות + שדרוג 4 הבועות). מיטל ביקשה לבנות עם השיפורים מההתחלה (אופציה B) — לכן יוצאת חבילה אחת.

**29 קבצים (24 חדשים + 5 שינויים + 4 handoff updates) · חבילה אחת**

### שלב 1 — ל·נ·א בסיסי (כפי שכבר תועד בקבוצה M לפני)
- 3 JSONs · 3 HTMLs · 6 MP3 (intro+find פר אות) · scripts/generate-bubbles-letters-audio.py · stage-3-island.html מ-5 ל-22 הרפתקאות

### שלב B — תשתית אנימציה + שדרוג בועות (חדש)

| # | קובץ | סטטוס | הערה |
|---|---|---|---|
| 1 | `underwater-app/js/templates/letter-anims.js` | **חדש** (~360 שורות) | 17 SVG inline פר אות · `window.AvneiLetterAnims.runAnimation(letter, onComplete)` |
| 2 | `underwater-app/scripts/generate-word-audio-d15v2.py` | **חדש** | 9 מילים מנוקדות · UTF-8 reconfigure ל-Windows |
| 3-11 | `assets/audio/word-{aryeh,zebra,vered,har,etz,tzipor,tavas,dag,kelev}.mp3` | **9 חדשים** | AvriNeural · rate -10% |
| 12 | `underwater-app/js/templates/game-shell.js` | שינוי | `playLetterAnimThenFinale()` wrapper · preload של word-X |
| 13 | `underwater-app/css/game-shell.css` | שינוי | `.letter-anim-overlay` + animations + z-index 270 |
| 14-17 | 4 HTMLs (`stage-3-template-demo.html`, `stage-3-lamed.html`, `stage-3-nun.html`, `stage-3-alef.html`) | שינוי | טעינת `letter-anims.js` |
| + | `_handoff/2026-05-27-d15-v2-enhancements-spec.md` | **חדש** | spec מורחב v2 (4+3 החלטות עיצוביות סגורות + 17 רעיונות אסוציאטיביים) |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד שלב B |
| + | `_handoff/meytal-pending.md` | בלוק חדש בראש | בדיקה ידנית של שלב B |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו |

**יחס לקבוצות שכבר נדחפו / ממתינות:**
- ❌ אין חפיפת קבצים עם A.1 / A.3 / A.4 (BKT / EPA / Sub-BKT)
- ❌ אין חפיפת קבצים עם קבוצה N (F.21A code) — N נוגעת ב-`teacher-rama.html` / `mastery-check.js`, M+B נוגעת ב-`stage-3-*` / `game-shell.js` / `letter-anims.js`
- ✅ M+B תלויה ב-D.14 (קבוצה J) — אם D.14 עוד לא ב-`main`, צריך לדחוף אותה קודם

**🎯 פונקציה חדשה שנחשפת:**
`window.AvneiLetterAnims` — API עם `runAnimation(letter, onComplete)`. ייקרא אוטומטית מ-game-shell.js אחרי 5/5 הקשות, אם הקובץ נטען ב-HTML. תאימות-אחור: אם לא נטען — startFinale רץ ישירות (D.14 בלי שינוי).

**לפני push (חובה — סביבת ריבוי-סוכנים):**
```
git fetch origin && git status
```

**הצעת message לקומיט:**
```
D.15 שלב 1 + v2 שלב B — בועות (ש·ל·נ·א) עם אנימציה ייחודית

חבילה משולבת: שלב 1 הוסיף 3 אותיות בסיסיות (ל·נ·א) בקבוצת
בועות. שלב B הוסיף תשתית אנימציה ייחודית פר אות + שידרג
את 4 הבועות (כולל ש' demo) להשתמש בה.

ארכיטקטורה (שלב B):
  letter-anims.js (חדש · 17 SVG inline) →
    runAnimation(letter, onComplete) פותח overlay מרכזי,
    משחק word-X.mp3, מציג SVG ~2.2 שניות, fade-out, callback
  game-shell.js:
    playLetterAnimThenFinale() wrapper שקורא להפעלה לפני
    startFinale (אם letter-anims.js נטען). תאימות-אחור: D.14
    בלי letter-anims ייפול ישר ל-startFinale.
    preload של word-X.mp3 ב-start() למניעת latency.

9 קבצי word-X.mp3 חדשים (AvriNeural · rate -10%):
  aryeh · zebra · vered · har · etz · tzipor · tavas · dag · kelev
8 קיימים מהמאגר משמשים גם הם (shemesh · lev · ner · yom ·
saba · gamal · chatul · pil).

17 SVG אסוציאטיביים פר אות, פלטה זהוב/כתום/תכלת/חום
(תואמת ים): שמש · לב · נר · אריה · זברה · יום · ורד · הר
· סבא · עץ · ציפור · טווס · דג · גמל · חתול · פיל · כלב.
מיטל בחרה טווס במקום טבעת וכלב במקום כביש (27.5 לילה).

CSS חדש (.letter-anim-overlay) — radial gradient רקע
+ blur · z-index 270 (מתחת ל-confetti) · 200ms fade-in
+ 1800ms hold + 400ms fade-out · scale+wobble על ה-stage.

לא נגעו: bkt.js / epa.js / event-logger.js / mastery-check.js
/ profile-classifier.js / mechanic-*.js / 5 משחקוני אי 3
האמנותיים / 4 JSONs של הבועות (letter מספיק).

Spec מלא: _handoff/2026-05-27-d15-v2-enhancements-spec.md
שלב הבא: C — קבוצת כוכבים (mechanic-pick).
```

**מסלול בדיקה ידנית של מיטל לפני אישור push:**
ראה meytal-pending.md → "🧪 D.15 v2 שלב B — בדיקה ידנית של אנימציה ייחודית"

**אם נמצא באג** → איטרציה על האנימציה לפני push.
**אם הכל תקין** → push קבוצה M+B, מתחילים שלב C (כוכבים).

---

## 🟡 קבוצה N — F.21A code · מסך מורה בשפת ראמ"ה

**סטטוס:** 🟡 דורש בדיקת מיטל ידנית לפני push (4 תרחישים · 8-12 דק')
**תאריך:** 2026-05-27 לילה
**3 קבצים (2 חדשים + 1 שינוי + 4 handoff updates) · חבילה אחת**

| # | קובץ | סטטוס שינוי | הערה |
|---|---|---|---|
| 1 | `underwater-app/teacher-rama.html` | **חדש** (~770 שורות) | קובץ עצמאי בלי dependencies מעבר ל-shared/* הקיימים. PIN gate ב-sessionStorage (PIN=4521 cosmetic לפיילוט). Class View: טבלת תלמידות×10 משימות, sticky student-col בימין, pulse banding בכותרת, summary bar עם drill ל-failing. Student View: 5 sections (5 strands · 22 letters grid · EPA dominant · 10 RAMA tasks פר פעימה · flags). Pulse toggle Daily↔Snapshot. Auto-refresh 3 שנ' (זהה ל-teacher-live). Responsive mobile + grid sticky RTL. |
| 2 | `underwater-app/js/shared/mastery-check.js` | שינוי | הרחבה — הוספת `RAMA_TASKS` (קבוע · 10 משימות עם name/value_threshold/value_max/time_threshold_sec/pulse/islands) + `checkRamaTaskStatus(studentId, ramaTaskId)` (החזר: status/value/threshold/confidence/contributingIslands/reason כפי שמוגדר ב-spec §5) + 4 עזרים פרטיים (`_islandStatusForRama`, `_computeRamaValue`, `_aggregateStatuses`, `_confidenceFor`) + קבועים `NEAR_RATIO=0.80`, `CONFIDENCE_HIGH_MIN=30`, `CONFIDENCE_MED_MIN=10`. ה-API הקיים (`checkMastery`, `ISLAND_TO_RAMA` וכו') נשמר 1:1. |
| 3 | `underwater-app/scripts/test-rama-task-status.js` | **חדש** (~210 שורות) | 8 בלוקי smoke · 30 assertions · רץ ב-Node עם vm sandbox + mock localStorage · בודק: APIs נחשפים, RAMA_TASKS שלם, תלמידה ריקה→cold, מבנה תוצא תואם spec §5, status פדגוגי נכון (1 אות→fail · 15→near · 18→pass), aggregation min-wins, ספי confidence, backwards compat. |
| + | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי קל | F.21A עבר מ-⭐⏳ ל-✅ ב-2 מקומות (סיכום עליון + רשימת משימות). |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד F.21A code (כולל 4 החלטות פדגוגיות שהוטמעו, חתימת ה-API החדש, וכל מה שלא נגעתי בו). |
| + | `_handoff/meytal-pending.md` | בלוק חדש בראש | 4 תרחישי בדיקה ידנית (PIN gate · Class View · Student View · Pulse Snapshot) + רגרסיה ב-teacher-live. |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו. |

**מהות התוצר:**
F.21A code — מסך מורה חדש שמציג את הכיתה דרך עדשת **משרד החינוך + ראמ"ה** (10 משימות × 3 פעימות) במקום עדשת "המשחקונים של אבני יסוד" של teacher-live. מבוסס 1:1 על `_handoff/2026-05-27-F21A-ux-spec.md` (שנדחפה כקבוצה L). כל ההחלטות העיצוביות-עליונות נסגרו בשלב ה-spec — סוכן הקוד יישם בלבד.

**יחס לקבוצות שכבר נדחפו / ממתינות:**
- ❌ אין חפיפת קבצים עם A.1/A.3/A.4 (BKT/EPA/Sub-BKT) — F.21A code רק קורא את ה-API שלהן ולא נוגע בקבצים
- ❌ אין חפיפת קבצים עם D.14/D.15 (template + bubbles) — F.21A לא נוגע ב-stage-*, ב-game-shell, או ב-island-03-letters
- ✅ קבוצה L (F.21A-spec) — F.21A code מממש את ה-spec הזה, בלי לשנות אותו
- 🟡 קבוצה M (D.15 שלב 1) — ניתן לדחוף בכל סדר ביחס ל-N (אין חפיפה)

**🎯 פונקציה חדשה שנחשפת:**
`AvneiMasteryCheck.checkRamaTaskStatus(studentId, ramaTaskId)` — נדרשה ב-spec §5 כפונקציה לא-קיימת שדורשת בנייה. נבנתה כהרחבה של `mastery-check.js` הקיים (לא קובץ חדש), בלי לשבור את ה-API הקיים. נחשפת גם `RAMA_TASKS` כקבוע למקרה שדפים אחרים ירצו אותו.

**לא חוסם דבר נוסף:** F.21A הוא tip-of-pyramid עבור F.21B (Parent view) · F.21C (Inspector view) · B.10 (Group Suggestion). כולם ימתינו לפיילוט.

**לפני push (חובה — סביבת ריבוי-סוכנים):**
```
git fetch origin && git status
```

**הצעת message לקומיט (HEREDOC):**
```
F.21A code — מסך מורה בשפת ראמ"ה (10 משימות × 3 פעימות)

מימוש 1:1 של _handoff/2026-05-27-F21A-ux-spec.md (12 סקציות,
12 acceptance criteria). כל ההחלטות העיצוביות נסגרו ב-spec.

קובץ חדש: underwater-app/teacher-rama.html (~770 שורות, עצמאי)
  PIN gate (sessionStorage · PIN=4521 cosmetic לפיילוט)
  Class View — טבלת תלמידות × 10 משימות ראמ"ה
                sticky column ימין (RTL) · pulse banding בכותרת
                summary bar עם drill ל-failing students
  Student View — 5 sections:
                  5 strands (BKT bars + confidence)
                  22 letters grid (4 buckets בצבע)
                  EPA dominant pattern
                  10 RAMA tasks מקובצות פר פעימה
                  flags (אם קיימים)
  Pulse toggle Daily ↔ Snapshot (Snapshot מציג בארים אגרגטיביים
  פר פעימה נבחרת, לא state-time-travel — practical ל-MVP)
  Auto-refresh כל 3 שניות (זהה ל-teacher-live)
  Responsive mobile + sticky column RTL

הרחבת mastery-check.js:
  RAMA_TASKS (קבוע · 10 משימות × name/value_threshold/value_max/
              time_threshold_sec/pulse/islands)
  checkRamaTaskStatus(studentId, ramaTaskId) — החזר תואם spec §5:
    {status, value, threshold, confidence, contributingIslands, ...}
  עזרי aggregate (החלש מנצח · §10 ב-spec) ו-confidence (§7)
  API קיים נשמר 1:1 (checkMastery, ISLAND_TO_RAMA, וכו')

4 החלטות פדגוגיות שהוטמעו:
  1. Aggregate משימה רב-אית = Min (החלש מנצח)
  2. משימה 1 (זיהוי אותיות) — סטטוס לפי count אמיתי של אותיות
     שנשלטו (לא BKT proxy — 1/22 מצוין אינו "near 18")
  3. Confidence: <10→low · 10-29→med · 30+→high
     downgrade ל-med אם stale 7+ ימים · ⚠ אם 14+ ימים
  4. PIN: השוואה ישירה במקום SHA-256 (אותה רמת אבטחה בקוד-לקוח,
     post-pilot Apps Script לפי spec §6)

scripts/test-rama-task-status.js — 8 בלוקי smoke (30 assertions ✓)
  בודק: APIs · RAMA_TASKS structure · תלמידה ריקה → cold ·
  return shape · status פדגוגי (1/15/18) · aggregation min ·
  confidence thresholds · backwards compat.

לא נגעתי: bkt.js / epa.js / event-logger.js / teacher-live.html /
stage-*.html / map.html / student-picker.html / D.14/D.15 files.

קוראים API בלבד · spec ב-_handoff/2026-05-27-F21A-ux-spec.md
```

**מסלול בדיקה ידנית של מיטל לפני אישור push:**
1. `cd avnei-yesod && python -m http.server 8765`
2. `http://localhost:8765/underwater-app/teacher-rama.html` — PIN gate (4521)
3. Class View daily + Pulse Snapshot mode
4. Student View (לפחות תלמידה אחת)
5. רגרסיה: `teacher-live.html` עדיין עובד כרגיל

**אם נמצא באג** → איטרציה לפני push. **אם הכל תקין** → push קבוצה N.

---

## 🟡 קבוצה M — D.15 שלב 1 · 3 אותיות בועות (ל · נ · א)

**סטטוס:** 🟡 דורש בדיקת מיטל ידנית לפני push
**תאריך:** 2026-05-27 ערב
**14 קבצים (10 חדשים + 1 שינוי + 3 handoff updates) · חבילה אחת · לא לפצל**

| # | קובץ | סטטוס שינוי | הערה |
|---|---|---|---|
| 1 | `underwater-app/data/island-03-letters/lamed.json` | **חדש** | quest_id=`lamed-bubbles` · theme=`bubbles` · mechanic=`tap-all` · distractors מעודכנים (ש במקום ל) |
| 2 | `underwater-app/data/island-03-letters/nun.json` | **חדש** | quest_id=`nun-bubbles` |
| 3 | `underwater-app/data/island-03-letters/alef.json` | **חדש** | quest_id=`alef-bubbles` |
| 4 | `underwater-app/scripts/generate-bubbles-letters-audio.py` | **חדש** | edge-tts · 3 אותיות × 2 קבצים = 6 MP3 בהרצה אחת. שמות אותיות במנוקד מלא (לָמֶד / נוּן / אָלֶף) |
| 5 | `underwater-app/assets/audio/intro-lamed.mp3` | **חדש** | AvriNeural · rate -10% · ניסוח מאוחד פתיחה+משימה |
| 6 | `underwater-app/assets/audio/find-lamed.mp3` | **חדש** | "מצאו את כל הבועות עם האות לָמֶד בים" |
| 7 | `underwater-app/assets/audio/intro-nun.mp3` | **חדש** |  |
| 8 | `underwater-app/assets/audio/find-nun.mp3` | **חדש** |  |
| 9 | `underwater-app/assets/audio/intro-alef.mp3` | **חדש** |  |
| 10 | `underwater-app/assets/audio/find-alef.mp3` | **חדש** |  |
| 11 | `underwater-app/stage-3-lamed.html` | **חדש** | מבוסס stage-3-template-demo · letterKey='lamed' · href חזרה ל-stage-3-island.html |
| 12 | `underwater-app/stage-3-nun.html` | **חדש** | letterKey='nun' |
| 13 | `underwater-app/stage-3-alef.html` | **חדש** | letterKey='alef' |
| 14 | `underwater-app/stage-3-island.html` | שינוי | מ-5 ל-22 הרפתקאות מקובצות ב-5 נושאים · `.quest-group*` CSS חדש · animation-delay זז ל-`--card-delay` מחושב · progress label `0/22` |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד D.15 שלב 1 |
| + | `_handoff/meytal-pending.md` | בלוק חדש בראש | בדיקה ידנית של 3 אותיות + מסך אי 3 |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו |

**מהות התוצר:**
שלב 1 מתוך 5 של D.15. הקבוצה "בועות בים" עוברת מ-1 אות חיה (ש demo) ל-4 אותיות חיות (ש · ל · נ · א). אדיטיבי לחלוטין — לא נגע ב-game-shell / mechanic-tap-all / css / 5 משחקונים אמנותיים.

**יחס לקבוצות שכבר נדחפו / ממתינות:**
- ❌ אין חפיפת קבצים עם A.1 / A.3 / A.4 (BKT / EPA / Sub-BKT) — D.15 לא נוגע ב-js/shared
- ❌ אין חפיפת קבצים עם J (D.14) — D.14 כבר נדחפה כקבוצה J ב-`???` (טרם הומלצה ל-push בקובץ הזה — לוודא עם מיטל)
- D.15 שלב 1 משתמש בתבנית של D.14 (game-shell + mechanic-tap-all + shin.json template). אם D.14 עוד לא ב-`main` — חבילה זו דורשת ש-D.14 תידחף קודם.

**לא חוסם דבר נוסף:** התשתית theme-aware (לקבוצות 3-5) ובניית קבוצות כוכבים/צדפים/דגים יזרמו בקבוצות M.2, M.3, M.4, M.5 בנפרד.

**לפני push (חובה — סביבת ריבוי-סוכנים):**
```
git fetch origin && git status
```

**הצעת message לקומיט (HEREDOC):**
```
D.15 שלב 1 — קבוצת בועות שלמה: ש · ל · נ · א

הוספת 3 האותיות החסרות בקבוצת "בועות בים" של D.14.
הקבוצה עוברת מ-1 אות חיה (ש demo) ל-4 אותיות חיות.

3 קבצי JSON חדשים ב-data/island-03-letters/:
  lamed.json (quest_id=lamed-bubbles)
  nun.json   (quest_id=nun-bubbles)
  alef.json  (quest_id=alef-bubbles)

3 קבצי HTML חדשים מבוססים על stage-3-template-demo.html —
שכפול עם letterKey מקושח + href חזרה ל-stage-3-island.html
(לא map.html, כי האחר יהיה נכון רק עבור template-demo).

6 קבצי MP3 חדשים (AvriNeural · rate -10%):
  intro-{lamed,nun,alef}.mp3 — ניסוח מאוחד פתיחה+משימה
                                (iOS Safari-safe, כמו intro-shin)
  find-{lamed,nun,alef}.mp3  — הוראה במשחק

scripts/generate-bubbles-letters-audio.py מייצר את כל 6
בהרצה אחת. שמות אותיות במנוקד מלא (לָמֶד / נוּן / אָלֶף) לפי
[[feedback-tts-hebrew-niqud-pitfalls]].

stage-3-island.html שודרג מ-5 הרפתקאות (sequential) ל-22
מקובצות ב-5 נושאים. CSS חדש (.quest-group__*), animation-delay
מחושב פר כרטיס (--card-delay) במקום :nth-child(N) קשיח.
13 ההרפתקאות שטרם נבנו (כוכבים/צדפים/דגים) מסומנות
state-coming-soon.

נעילה הדרגתית נשמרה 1:1 — prevCompleted gates next.

4 החלטות שאישרה מיטל לפני קוד:
  intro audio = פר אות (כמו shin הקיים)
  SVG inline = Overlay מעל ה-tile (לשלב 2+)
  island map = 22 בעמוד אחד, מקובצים פר נושא
  סדר = שלב 1 (בועות) קודם, לפני תשתית theme-aware

לא נגעו: bkt.js / epa.js / event-logger.js / mastery-check.js
/ profile-classifier.js / js/templates/* / css/game-shell.css
/ 5 משחקוני אי 3 / stage-3-template-demo.html / מסמכי-אם.
```

**מסלול בדיקה ידנית של מיטל לפני אישור push:**
1. הפעלת `python -m http.server 8765` מ-`avnei-yesod/`
2. `http://localhost:8765/underwater-app/stage-3-island.html` — 22 הרפתקאות בעמוד אחד מקובצות
3. לפחות אחת מ-`stage-3-lamed.html` / `stage-3-nun.html` / `stage-3-alef.html` מקצה לקצה
4. רגרסיה ב-shin (`stage-3-template-demo.html` עדיין עובד)
5. רגרסיה ב-2 מ-5 המשחקונים האמנותיים (shell + storm)

**אם נמצא באג** → איטרציה לפני push. **אם הכל תקין** → push קבוצה M, מתחילים שלב 2 (תשתית theme-aware ב-game-shell + mechanic-tap-all + game-shell.css לקראת כוכבים).

---

## ✅ קבוצה L — F.21A-spec + D.15-spec · 2 מסמכי spec (נדחפה 27.5 ערב · `10f6a33`)

**סטטוס:** ✅ נדחפה
**תאריך:** 2026-05-27 ערב
**Commit:** `10f6a33`
**2 קבצים חדשים + 3 handoff updates · חבילה אחת**

| # | קובץ | סטטוס שינוי | הערה |
|---|---|---|---|
| 1 | `_handoff/2026-05-27-F21A-ux-spec.md` | **חדש** (~700 שורות) | wireframe + UX spec מלא ל-F.21A · 12 סקציות + 2 נספחים · 5 החלטות UX סגורות עם מיטל · 7 use cases · מיפוי API → UI · 12 acceptance criteria |
| 2 | `_handoff/2026-05-27-d15-spec.md` | **חדש** (~170 שורות) | spec מלא ל-D.15 (שכפול ל-17 אותיות באי 3) · נכתב ע"י סוכן D.14 לפני סגירה · P0 חוסם פיילוט · 4 קבוצות נושאיות סגורות (בועות/כוכבים/צדפים/דגים) · אומדן 12-15 שעות לסוכן ביצוע |
| + | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי קל | הוספת שורת `F.21A-spec ✅` לפני שורת `F.21A` בפאזה F · עדכון "מוכן להתחיל" · header 40 → 41 משימות |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד F.21A-spec |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו |

**מהות התוצר:**
מסמך spec שיחסום את שלב הקוד של F.21A. סוכן הקוד יקבל פרומפט שמצביע על המסמך כקריאה חובה. כל ההחלטות העיצוביות-עליונות סגורות; הקוד יישם בלבד.

**יחס לקבוצות שכבר נדחפו / ממתינות (I=A.1, H=A.3, K=A.4):**
- F.21A-spec לא נגעה בקבצי קוד כלל (רק markdown + HTML של tracker)
- אין חפיפת קבצים → אין קונפליקט merge עם A.1/A.3/A.4/D.14
- A.4 (קבוצה K, ממתינה ל-push) — F.21A-spec **קוראת ב-§5** את ה-API של A.4 (`getLetterMasteryDistribution`, `getLetterState`) כפונקציות מצופות; אם A.4 נדחפת **אחרי** L → אין בעיה (ה-API קיים בקוד גם אם לא ב-main בעת קריאת ה-spec). הסדר אינו קריטי.

**🎯 פונקציה חדשה שמסומנת ב-spec לבנייה בשלב הקוד:**
`AvneiMasteryCheck.checkRamaTaskStatus(studentId, ramaTaskId)` — הרחבה של `mastery-check.js` הקיים. חתימה מלאה בסעיף 5 של ה-spec. סוכן הקוד יבנה אותה כחלק מ-F.21A.

**לא חוסם דבר נוסף:** קבוצה L היא תיעוד, לא קוד. ניתן לדחוף ללא תלות במצב של K, J, או כל קבוצה אחרת.

**לפני push (חובה — סביבת ריבוי-סוכנים):**
```
git fetch origin && git status
```

**הצעת message לקומיט (HEREDOC):**
```
F.21A-spec · wireframe + UX spec למסך מורה בשפת ראמ"ה

מסמך עיצובי שחוסם את שלב הקוד של F.21A. F.21A נשארת
פתוחה ב-tracker; F.21A-spec נסגרת כשורה נפרדת (פיצול
שמיטל אישרה כדי לתעד ש"מוכן להתחיל" קוד).

5 החלטות UX שנסגרו עם מיטל לפני כתיבת ה-spec:
  - מבנה תצוגה ראשי = טבלה (תלמידות × משימות, צבע פר תא)
  - View ראשי = 2 כפתורים שווי-משקל בכניסה
  - רמת פירוט פר תלמידה = הכל + Confidence indicators
  - תצוגת פעימה = Daily mode + Snapshot mode (toggle)
  - פרטיות = URL נפרד (teacher-rama.html) + PIN בsessionStorage

תוצרים:
  spec יחיד: 12 סקציות + 2 נספחים
  4 ASCII mockups: Class View · Student View · Snapshot · PIN Gate
  7 use cases מתועדים
  מיפוי data → UI מלא לכל אלמנט במסך
  12 acceptance criteria לסוכן הקוד
  פונקציה חדשה מצוינת לבנייה: checkRamaTaskStatus

נגזרים מ-spec ל-handoff:
  5 שאלות פתוחות שעוד דורשות אישור מיטל לפני קוד
  (תחילת פעימה 1 · PIN default · inline vs קובץ נפרד · ...)
  
לא נגעו: teacher-live.html, mastery-check.js, כל js/shared.
F.21A יחיה כקובץ חדש teacher-rama.html (לא inline replace).
```

**מסלול בדיקה ידנית של מיטל לפני אישור push:**
1. קריאה של `_handoff/2026-05-27-F21A-ux-spec.md` מקצה לקצה
2. אישור שה-wireframes ב-§3 משקפים את הכוונה
3. אישור שהפיצול ל-`F.21A-spec ✅` + `F.21A ⏳` הוא הצורה הרצויה ב-tracker

**🟢 כל 5 השאלות הפתוחות נסגרו ב-27.5.2026 ערב:**
1. ✅ פעימה 1 = 1.9.2026
2. ✅ PIN cosmetic לפיילוט
3. ✅ `teacher-rama.html` קובץ נפרד (לא inline replace)
4. ✅ checkRamaTaskStatus aggregation = Min (החלש מנצח)
5. ✅ Practice gap = Downgrade Confidence (לא BKT) · 0-7 ✅ · 7-14 🟡 · 14+ 🟡 + אזהרה בולטת

ה-spec עודכן בהתאם (§9 + §10). סוכן קוד יכול להתחיל מיד אחרי push.

---

## ✅ קבוצה K — A.4 · Sub-BKT פר 22 אותיות (נדחפה 27.5 ערב · `1582a96`)

**סטטוס:** ✅ נדחפה ל-origin/main · 53/53 smoke tests עברו
**תאריך:** 2026-05-27 ערב
**Commit:** `1582a96` (`dac1595..1582a96`)
**1 קובץ שונה + 1 חדש + 2 handoff updates · חבילה אחת**

| # | קובץ | סטטוס שינוי | הערה |
|---|---|---|---|
| 1 | `underwater-app/js/shared/bkt.js` | שינוי מרכזי | הרחבה ל-22 אותיות · API חדש: getLetterState · getWeakestLetters · getLetterMasteryDistribution · מיגרציה אוטומטית + backfill מ-island 3 |
| 2 | `underwater-app/scripts/test-bkt-letters.js` | חדש (~220 שורות) | 12 בלוקי-בדיקה · 53 assertions · רגרסיה ל-22 אותיות + backwards compat A0.1/A0.3 + מיגרציה non-destructive |
| + | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי קל | A.4 ✅ · checkbox checked + עדכון טבלת "מוכן להתחיל" |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד A.4 |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו |

**יחס לקבוצות שכבר נדחפו (A.1 = `b4c0145`, A.3 = `3c063bb`):**
- A.4 משנה רק את `bkt.js` (קובץ של A.1 בלעדית) — לא קונפליקט עם A.3
- A.4 שומר 1:1 את ה-API של A.1 — `getStudentState`, `getIslandState`, `checkMastery`, `getStrandState`, `getStudentStrands`, `checkStrandMastery`, `getPerLetterState`, `setInitialState`, `recommendInitialTier` — כולם ממשיכים לעבוד
- A.4 לא נגע ב-`epa.js`/`event-logger.js`/`mastery-check.js`/`profile-classifier.js`

**יחס ל-D.14 (טרם נדחפה — קבוצה J):**
- D.14 הגדירה 22 letter-keys ב-`data/island-03-letters/_schema.md`. A.4 משתמש בדיוק באותה רשימת 22 אותיות (`ALL_HEBREW_LETTERS_22`) — single source of truth
- אין חפיפת קבצים → אין קונפליקט merge

**לא חוסם דבר נוסף:** A.4 פותח את F.21A (יכולה לקרוא `getLetterMasteryDistribution`) ואת D.15 (כל אות חדשה כבר מקבלת sub-BKT אוטומטית).

**לפני push (חובה — סביבת ריבוי-סוכנים):**
```
git fetch origin && git status
```

**הצעת message לקומיט (HEREDOC):**
```
A.4 — Sub-BKT פר 22 אותיות בסטרנד פונולוגיה

הרחבה מ-5 אותיות (מ/ק/ב/ר/ת — 5 המשחקונים הקיימים) ל-22
האותיות העבריות. ALL_HEBREW_LETTERS_22 הוא הרשימה הקנונית
היחידה — תואם בדיוק את data/island-03-letters/_schema.md
של D.14.

3 API חדשים נחשפים:
  getLetterState(studentId, letter)
  getWeakestLetters(studentId, n=3, {includeUntouched?})
  getLetterMasteryDistribution(studentId)
    → 4 דליים: mastered / in_progress / weak / untouched

מיגרציה non-destructive: state ישן עם 5 אותיות מתרחב
אוטומטית ל-22 בקריאה הראשונה. ערכי הניסיונות והנשלטות
הקיימים נשמרים. Backfill חד-פעמי מ-island 3 ל-strand 1
לילדות שהיו במערכת לפני A.1.

API חיצוני נשמר 1:1 — A0.1 (suggestFromBKT), A0.3
(mastery-check), event-logger ממשיכים לעבוד.

ISLAND_3_LETTERS עדיין = 5: mastery של "אי 3 נסגר"
דורש 5 משחקונים פעילים. ייעדכן ל-22 כש-D.15 ישלים את
17 המשחקונים החסרים.

Smoke tests:
  scripts/test-bkt.js          — 4/4 פערים A.1 עוברים זהים
  scripts/test-bkt-letters.js  — 53/53 חדשים עוברים
```

**מסלול בדיקה ידנית (אופציונלי — smoke tests מספיקים):**
```
cd c:/Users/meyta/Downloads/impactos/avnei-yesod
python -m http.server 8765
```
1. `http://localhost:8765/underwater-app/map.html` → picker → תלמידה אמיתית
2. שחק 2-3 משחקונים באי 3
3. DevTools console:
   ```js
   AvneiBKT.getLetterMasteryDistribution(localStorage.getItem('avnei-yesod-current-student'))
   AvneiBKT.getWeakestLetters(localStorage.getItem('avnei-yesod-current-student'), 5)
   AvneiBKT.getLetterState(localStorage.getItem('avnei-yesod-current-student'), 'מ')
   ```
   צפוי: distribution מציג mastered + untouched (17), getLetterState על מ עם attempts ו-pKnown אמיתיים

---

## 🟡 קבוצה J — D.14 · חילוץ תבנית גנרית מ-5 משחקוני אי 3 (עודכן 27.5.2026 ערב)

**סטטוס:** 🟡 דורש בדיקת מיטל ידנית ב-demo לפני push
**תאריך:** 2026-05-27 (עודכן ערב — Full C נבחר)
**12 קבצים חדשים + 1 שונה + 4 handoff updates · חבילה אחת · לא לפצל**

| # | קובץ | סטטוס שינוי | הערה |
|---|---|---|---|
| 1 | `underwater-app/js/templates/game-shell.js` | חדש (~225 שורות) | shell משותף · `AvneiGameShell.start(config)` · תומך ב-`inGamePromptAudioKey` |
| 2 | `underwater-app/js/templates/mechanic-tap-all.js` | חדש (~195 שורות) | plug-in מ-storm/trail · `window.AvneiMechanics['tap-all']` · משתמש ב-`inGamePromptAudioKey` |
| 3 | `underwater-app/js/templates/mechanic-pick.js` | חדש (172 שורות) | plug-in מ-rescue · `window.AvneiMechanics['pick']` |
| 4 | `underwater-app/js/templates/mechanic-quest.js` | חדש (171 שורות) | plug-in מ-shell/house · משתמש ב-js/activities/* קיימים |
| 5 | `underwater-app/css/game-shell.css` | חדש (~310 שורות) | sgylonot משותפים + 2 mechanics + confetti/kisses + `.intro-speaker` + `.start-btn` + bubbles theme |
| 6 | `underwater-app/data/island-03-letters/_schema.md` | חדש | סכמת JSON פר-אות + **Full C: 4 קבוצות נושאיות מאושרות** + חלוקת 17 אותיות |
| 7 | `underwater-app/data/island-03-letters/shin.json` | חדש | קובץ demo (אות ש) · נושא "בועות" · `theme: "bubbles"` |
| 8 | `underwater-app/stage-3-template-demo.html` | חדש | HTML demo שטוען shin.json ומריץ את התבנית |
| 9 | `underwater-app/scripts/generate-shin-demo-audio.py` | חדש | סקריפט edge-tts לייצור 3 קבצי MP3 לאות ש |
| 10 | `underwater-app/assets/audio/intro-shin-quest.mp3` | חדש | AvriNeural · "נוני מצא בועות זוהרות בים..." |
| 11 | `underwater-app/assets/audio/intro-shin-mission.mp3` | חדש | AvriNeural · "בואו תקישו על כל הבועות עם האות שין..." |
| 12 | `underwater-app/assets/audio/find-shin.mp3` | חדש | AvriNeural · "מצאו את כל הבועות עם האות שין בים." (in-game) |
| 13 | `underwater-app/js/shared/audio.js` | שינוי קל | `LETTER_TO_SOUND_FILE` מ-5 ל-22 אותיות (תוספת בלבד) |
| + | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי קל | D.14 ✅ |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד D.14 + עדכון 27.5 ערב על Full C |
| + | `_handoff/meytal-pending.md` | בלוק חדש בראש | בדיקת demo + אישור ויזואל "כוכבים" של D.15 |
| + | `_handoff/2026-05-27-d15-spec.md` | **חדש (קובץ חדש)** | ספק מלא ל-D.15 — 4 קבוצות, סדר בנייה, שורות אודיו, SVG inline guidelines |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו |

**יחס לקבוצות שכבר נדחפו / ממתינות (I=A.1, H=A.3, K=A.4):**
- D.14 לא נגעה בקבצי הליבה (bkt.js, epa.js, event-logger.js, mastery-check.js, profile-classifier.js)
- D.14 רק קוראת את ה-API שלהן (`AvneiBKT.*`, `AvneiEPA.ingestEvent`, `AvneiEventLogger.logActivityResult`, `AvneiMasteryCheck.checkAndShowIslandCelebration`)
- אין חפיפת קבצים → אין קונפליקט merge עם A.1/A.3/A.4

**🎯 החלטה אסטרטגית של D.15 נסגרה במהלך בדיקת D.14:** Full C — 4 קבוצות נושאיות (🫧בועות / ⭐כוכבים / 🐚צדפים / 🐟דגים), חלוקת 17 אותיות אושרה ע"י מיטל. הספק המלא ב-`_handoff/2026-05-27-d15-spec.md`.

**לא לדחוף עדיין כי:**
- 🟡 demo (`stage-3-template-demo.html`) דורש סבב בדיקה ידנית של מיטל מקצה לקצה לפני push (5-10 דק')
- ⚠️ ייתכן שתידרש התאמה אם הבדיקה הידנית מגלה רגרסיה ב-5 המשחקונים הקיימים (לא צפוי — התבנית אדיטיבית — אבל worth verifying)

**לפני push (חובה — סביבת ריבוי-סוכנים):**
```
git fetch origin && git status
```

**הצעת message לקומיט (HEREDOC):**
```
D.14 — חילוץ תבנית גנרית מ-5 משחקוני אי 3 + spec ל-D.15

ארכיטקטורה "בסיס משותף + 3 plug-ins" (שאישרה מיטל לפני קוד):

  game-shell.js   — overlay + top-bar + noni + audio + completion
                    + finale + mastery hook
  mechanic-tap-all  — N tiles, T targets (storm + trail extracted)
  mechanic-pick     — N rounds × M pods   (rescue extracted)
  mechanic-quest    — polymorphic stages  (shell + house extracted)

8 קבצי קוד חדשים + 1 שינוי ל-audio.js (LETTER_TO_SOUND_FILE
מ-5 ל-22 אותיות, כל sound-X.mp3 כבר קיים ב-AvriNeural).

Demo: stage-3-template-demo.html טוען shin.json ומריץ tap-all
על אות ש. 3 קבצי MP3 חדשים (intro-quest + intro-mission +
find-shin) נוצרו דרך scripts/generate-shin-demo-audio.py.

מהלך הבדיקה הציף 3 גילויים שנשמרו לזיכרון:
  - AvriNeural קורא קמץ-קטן כ-"kal" → כותבים "כֹּל" בחולם
  - ניסוח טבעי לבני 6: "ה-X עם האות Y", לא "X-י Y"
  - ילד בן 6 לא קורא → אודיו חייב לומר משימה מלאה

החלטת אסטרטגיה ל-D.15 הוסכמה במהלך הבדיקה: Full C — 4
קבוצות נושאיות (בועות/כוכבים/צדפים/דגים), 17 האותיות חולקו.
ספק מלא ב-_handoff/2026-05-27-d15-spec.md.

5 המשחקונים הקיימים (shell/house/rescue/trail-resh/storm) לא
נגעו. התבנית אדיטיבית בלבד.
```

**מסלול בדיקה ידנית שמיטל מבצעת לפני אישור push:**
1. `cd c:/Users/meyta/Downloads/impactos/avnei-yesod/underwater-app`
2. `python -m http.server 8765` (או `npx serve`)
3. פתח `http://localhost:8765/stage-3-template-demo.html`
4. צפוי:
   - overlay "מסע השמש"
   - מקיש על intro-speaker → לא משמיע (אין `intro-shin-*.mp3`) — זה תקין כברירת מחדל
   - לוחץ "בוא/י נתחיל"
   - 12 אריחים בים, 5 מהם עם ש׳
   - מקיש על כל ה-ש׳-ים בכל סדר → כל אחד מואר, נוני שמח, מונה עולה
   - אחרי 5 → finale עם confetti+kisses + completion overlay
5. בדיקת רגרסיה ב-5 הקיימים (חוזרים למפה ומשחקים shell/storm — לא אמורים להשתבש)

---

## ✅ קבוצה I — A.1 · BKT-per-strand (נדחפה 27.5.2026 · `b4c0145`)

**2 קבצים · ממתין לאישור מיטל:**

| # | קובץ | סטטוס שינוי | הערה |
|---|---|---|---|
| 1 | `underwater-app/js/shared/bkt.js` | שיכתוב | dual-write + compat layer + API חדש פר-strand |
| 2 | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי קל | A.1 ✅ |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד A.1 |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש (זה) | הקבוצה הזו |

**יחס לקבוצה H (A.3 EPA):**
- A.3 שינה את `event-logger.js` (12 שורות). אני לא נגעתי שם — אין קונפליקט.
- A.3 קורא ל-`AvneiBKT.ingestEvent` כרגיל; ה-dual-write שלי בולע את ה-event בשני המקומות.
- ניתן לדחוף את שתי הקבוצות בנפרד או יחד. סדר: H או I — לא משנה.

**לפני push (חובה — סביבת ריבוי-סוכנים):**
```
git fetch origin && git status
```

**הצעת message לקומיט (HEREDOC):**
```
A.1 — BKT-per-strand (5 מודלים) · dual-write + compat layer

bkt.js שוכתב כך שמנוע BKT מחזיק 5 BKT-ים פר ילדה (סטרנד),
בנוסף ל-state ה-per-island הקיים. API חיצוני נשמר 1:1 — A0.1
(suggestFromBKT) ו-A0.3 (mastery-check) ממשיכים לעבוד בלי שינוי.

Dual-write storage:
  avnei-bkt-v1         (legacy per-island — נשמר חי)
  avnei-bkt-strand-v1  (חדש per-strand — 5 BKT-ים פר ילדה)

API חדש:
  getStrandState, getStudentStrands, checkStrandMastery,
  getPerLetterState (compat layer ל-A0.1),
  ISLAND_TO_STRAND, STRAND_NAMES, PARAMS_PER_STRAND,
  FLUENCY_THRESHOLD_PER_STRAND_MS.

מיפוי (מ-22-islands-validated):
  strand 1 phonology    -> איים 1-8
  strand 2 morphology   -> איים 9-11
  strand 3 oral         -> איים 12-14
  strand 4 reading      -> איים 15-18
  strand 5 writing      -> איים 19-22

per_letter ב-island 3 ממשיך לחיות (legacy) + mirror תחת strand 1.
2 בדיקות עברו: test-bkt.js הקיים + smoke test פר-strand.
```

**אזהרה:** לא לערבב עם פאקים חודשיים / מסמכי-אם — אלה דורשים אישור פר-קובץ (F4 🔴).

---

## ✅ קבוצה H — A.3 · מודול EPA (נדחפה 27.5.2026 · `3c063bb`)

**12 קבצים · אחד חבילה אחת · לא לפצל:**

| # | קובץ | סטטוס שינוי | הערה |
|---|---|---|---|
| 1 | `underwater-app/js/shared/epa.js` | חדש (234 שורות) | מודול EPA — `window.AvneiEPA` |
| 2 | `underwater-app/js/shared/event-logger.js` | שינוי קל (12 שורות) | בלוק `if (window.AvneiEPA)` אחרי בלוק BKT |
| 3 | `underwater-app/stage-3-shell.html` | שורה אחת | `<script src="js/shared/epa.js">` |
| 4 | `underwater-app/stage-3-house.html` | שורה אחת | אותו דבר |
| 5 | `underwater-app/stage-3-storm.html` | שורה אחת | אותו דבר |
| 6 | `underwater-app/stage-3-rescue.html` | שורה אחת | אותו דבר |
| 7 | `underwater-app/stage-3-trail-resh.html` | שורה אחת | אותו דבר |
| 8 | `underwater-app/stage-3.html` | שורה אחת | אותו דבר |
| 9 | `underwater-app/stage-2-whispers.html` | שורה אחת | אותו דבר |
| 10 | `underwater-app/stage-2-twin-seaweeds.html` | שורה אחת | אותו דבר |
| 11 | `underwater-app/stage-2-fish-schools.html` | שורה אחת | אותו דבר |
| 12 | `underwater-app/teacher-live.html` | שורה אחת | אותו דבר |
| + | `_handoff/2026-05-26-architecture-tasks-tracker.html` | שינוי קל | A.3 ✅ |
| + | `_handoff/agent-completion-log.md` | בלוק חדש בראש | תיעוד A.3 |
| + | `_handoff/pending-commits.md` | בלוק חדש בראש | הקבוצה הזו |

**הצעת message לקומיט (HEREDOC):**
```
A.3 — מודול EPA (Error Pattern Analysis) · 3 צירים

ספירה תיאורית של טעויות פר ילדה×אי×אות על 3 צירים אורתוגונליים:
- failure (Shape/Sound/Name/Direction)
- context (isolation/initial/medial/final/font)
- task (recognition/find/name/write)

מודול חדש js/shared/epa.js בלי לגעת ב-bkt.js או 5 הדגלים האוטומטיים.
נקרא מ-event-logger.js אחרי AvneiBKT.ingestEvent, פעיל רק על is_correct=false.
threshold default 40% (Direction 30% override) לפי partners-review-v3 §6.
MIN_FAILURES_FOR_PATTERN=3 למניעת רעש על מדגם זעיר.

API: ingestEvent · getEPA · getDominantPattern · dump · reset
localStorage key נפרד: avnei-epa-v1
נצרך עתידית ע"י B.8 (intervention matcher), B.9 (group suggester), 21A.

14 smoke tests עברו ב-Node לפני push.
```

**אזהרה:** לא לערבב עם פאקים חודשיים / מסמכי-אם — אלה דורשים אישור פר-קובץ (F4 🔴).

---

## סיכום A1

| קבוצה | קבצים | Hash | תאריך |
|---|---|---|---|
| A — אי 3 · 70 PNG + CSS | 73 | `d48d6f8` | 26.5.2026 |
| B — handoff docs | 7 | `57778d8` | 26.5.2026 לילה |
| C — research + KB + library + vocab + ארכיון (+DEPRECATED) | 20 | `e3715bf` | 27.5.2026 |
| **סה"כ** | **100** | | |

**נשאר פתוח (חסום על החלטות):**
- D 🟡 — 6 קבצים (README/index/demo-day2) — ממתין לעדכון מסמכי-אם
- F 🔴 — 14 קבצים (מסמכי-אם + בר-און + פאקים + INVALIDATED) — דורש החלטות פר-קובץ

---

## ✅ קבוצה C — Research + KB sources + Library + Vocab + ארכיון v1/v2 (נדחפה 27.5.2026)

**Commit:** `e3715bf` · 20 קבצים

**מה נכלל:**
- 4 research mds ב-`curriculum/blueprint/islands/`
- 7 KB sources תקפים *(`22-islands-validated` + 6 perplexity validations)*
- 2 קבצי `docs/interventions/library-v1*.md`
- `curriculum/open-questions-for-experts.md`
- `curriculum/vocab-bank.json`
- 5 ארכיון v1/v2 *(2026-05-25 md+html+pdf · 2026-05-26-v2 md+html)* — **עם באנרי DEPRECATED** המפנים ל-v3

**מה לא נכלל (נשאר ב-F4 🔴):**
- `perplexity-shatil-share-2003-validation-2026-05-25.json` *(_INVALIDATED:true)*

---

## ✅ קבוצה B — handoff docs (נדחפה 26.5.2026 לילה)

**Commit:** `57778d8` · 7 קבצים (כולל מחיקת `2026-05-26-a0-1-handoff.md` ומיזוגו ל-agent-completion-log.md)

---

## ✅ קבוצה G — A0.3 · Mastery משולש (נדחפה 27.5.2026)

**קבצים שנדחפו (8):**
- `underwater-app/js/shared/mastery-check.js` (חדש)
- `underwater-app/stage-3-shell.html` · `stage-3-house.html` · `stage-3-storm.html` · `stage-3-trail-resh.html` · `stage-3-rescue.html` · `js/rescue-controller.js` — script tag + hook
- `underwater-app/teacher-live.html` — סקציה 6 + CSS + renderMasteryStatus + תיקון STATE_KEY ('avnei-state-v1' → 'underwater-app:v1' דרך state.js)
- `_handoff/2026-05-26-architecture-tasks-tracker.html` — A0.3 ✅

**הערה:** התיקון STATE_KEY שתוכנן כקומיט נפרד נכלל בקומיט הזה — בלעדיו A0.3 לא רץ (SyntaxError על הצהרה כפולה). באג צד-בונוס שתוקן: סקציות 1-5 ב-teacher-live שהציגו "אין נתונים" — עכשיו עובדות.

---

## 📌 כבר ב-git — 13 קומיטים מאז `bb8754a` (לא לדחוף שוב)

מאז שהתחלנו את הסקירה הזו, 13 קומיטים נוספים נדחפו ל-`main`:

| Hash | תיאור | קבצים שהיו ב"ממתינים" |
|---|---|---|
| `bb8754a` | partners doc v3 — 5 סטרנדים *(שלי)* | partners-review-v3.md |
| `4b876a4` | A0.1 · פרופיל אורייני ב-onboarding | onboarding-profile.html, profile-classifier.js |
| `1916fb6` | A0.4 · משחקון ים השמועות (יצירה ראשונית) | whispers.css, stage-2-whispers.html |
| `299216e` | A0.1 · הצעה אוטומטית מ-BKT | — |
| `2338b2c` | tracker + 3 docs | architecture-tasks-tracker.html, agent-completion-log.md, meytal-pending.md, pending-commits.md |
| `07c9af3` | A0.1 · student-picker | — |
| `7ad8e7b` | F.22 · דף אינדקס לאי 2 | — |
| `d57fad4` | A0.1 · הסרת onboarding.html | — |
| `a5e41c8` | A0.1 · picker empty-state | — |
| `0faa5ec` | A0.4 · whispers JSON fix *(שלי)* | island-02-whispers.json |
| `562a11d` | A0.4 · 29 MP3 AvriNeural | — |
| `f99161f` | A0.1 · classifier ↔ mastery.js | — |
| `1556c4f` | tracker · A0.4 note (29 MP3) | — |
| `942f148` | architecture-tasks.md — A0.4 + F.22 ✅ | _handoff/2026-05-25-architecture-tasks.md |
| `c5cd49a` | A0.1 · debug panel | (יצר את 2026-05-26-a0-1-handoff.md — מוטמע ב-log) |
| `f7b2406` | tracker · הוראות פרומפט מעודכנות | _handoff/2026-05-26-architecture-tasks-tracker.html |
| `e00ec7d` | **L3+L4 hardening (אפשרות D)** | **island-03-items.json + harden-l3-l4-distractors.py = קבוצה E** |
| `d48d6f8` | **אי 3 · 70 PNG + CSS** *(שלי)* | **כל קבוצה A** |

**מסקנה:** קבוצות 1, 2, A, E נסגרו במלואן. נשארו B (handoff docs), C (research+library+vocab+ארכיון), D (🟡), F (🔴).

---

## איך עוברים על המסמך (flow מעודכן)

1. **את מאשרת קבוצה ספציפית** ("דחוף קבוצה X").
2. **אני עושה `git fetch + sanity check`** (אם עברו >10 דק' מהסקירה).
3. **אני דוחף את הקבוצה הזו בלבד** וחוזר עם hash.
4. **את עוברת לקבוצה הבאה** — לא חזרה לסריקה מחדש.

קבוצות מסומנות 🔴 לא יוצעו לדחיפה.

---

## קבוצה A — 🟢 אי 3 · 70 PNG + 3 CSS (ready)

**קבצים (73):**
- 70 PNG ב-`engine/content/images/island-03/` *(אסטים PIL crop+center)*
- `underwater-app/css/house-quest.css` *(M)*
- `underwater-app/css/shell-quest.css` *(M)*
- `underwater-app/css/stage-3.css` *(M)*

**מצב:** ✅ ready.

**הודעת קומיט:** `אבני יסוד · אי 3 · 70 PNG (PIL crop+center) + CSS`

---

## קבוצה B — 🟢 handoff docs (תיעוד פנימי)

**קבצים (7):**

*חדשים:*
- `_handoff/agent-bootstraps.md`
- `_handoff/2026-05-26-engine-tech-brief.md`
- `_handoff/orchestrator-handoff-2026-05-25-evening.md`
- `_handoff/2026-05-22-letters-review.md`

*מעודכנים:*
- `_handoff/2026-05-26-partners-review-v3.html` *(תיקון רנדור — תואם ל-MD ב-`bb8754a`)*
- `_handoff/2026-05-25-architecture-tasks.md` *(חדש מאז סריקה קודמת)*
- `_handoff/2026-05-26-architecture-tasks-tracker.html` *(שונה שוב אחרי `1556c4f` — שווה הצצה מהירה לפני push)*

**מצב:** ✅ ready (עם הסתייגות קלה על ה-tracker).

**הודעת קומיט:** `אבני יסוד · handoff docs — bootstraps + tech-brief + רנדור v3 + tasks`

---

## קבוצה C — 🟢 Research + KB sources + Library + Vocab + ארכיון שותפים

**קבצים (19):**

*חדשים — research/blueprint (4):*
- `curriculum/blueprint/islands/island-1-research.md`
- `curriculum/blueprint/islands/island-2-research.md`
- `curriculum/blueprint/islands/island-3-research.md`
- `curriculum/blueprint/islands/island-2-parameters-proposal.md`

*חדשים — knowledge-base sources (6):*
- `curriculum/knowledge-base/sources/22-islands-validated-2026-05-21.json`
- `curriculum/knowledge-base/sources/perplexity-island1-interventions-validation-2026-05-25.json`
- `curriculum/knowledge-base/sources/perplexity-island1-parameters-validation-2026-05-25.json`
- `curriculum/knowledge-base/sources/perplexity-island2-parameters-validation-2026-05-24.json`
- `curriculum/knowledge-base/sources/perplexity-island4-parameters-validation-2026-05-25.json`
- `curriculum/knowledge-base/sources/perplexity-island5-parameters-validation-2026-05-25.json`
- `curriculum/knowledge-base/sources/perplexity-island9-parameters-validation-2026-05-25.json`

*(שים לב: 6 קבצים תקפים. `perplexity-shatil-share-2003-validation` ב-🔴 כי `_INVALIDATED: true`.)*

*חדשים — interventions library (2):*
- `docs/interventions/library-v1.md`
- `docs/interventions/library-v1-island1.md`

*חדשים — open questions (1):*
- `curriculum/open-questions-for-experts.md`

*מעודכן — vocab (1):*
- `curriculum/vocab-bank.json`

*חדשים — ארכיון שותפים v1/v2 (5):*
- `_handoff/2026-05-25-partners-review.md`
- `_handoff/2026-05-25-partners-review.html`
- `_handoff/2026-05-25-partners-review.pdf`
- `_handoff/2026-05-26-partners-review-v2.md`
- `_handoff/2026-05-26-partners-review-v2.html`

**מצב:** ✅ ready (נסרק לבר-און — נקי).

**הודעת קומיט:** `אבני יסוד · research + KB sources + interventions library + vocab + ארכיון v1/v2`

---

## קבוצה D — 🟡 README + index + demo-day2 (מינוח ישן)

**קבצים (6):**
- `README.md` *(M — "9 מיומנויות")*
- `index.html` *(M — "9 מיומנויות")*
- `engine/demo-day2/index.html`
- `engine/demo-day2/student-view.html`
- `engine/demo-day2/teacher-dashboard.html` *(BKT per-island)*
- `engine/demo-day2/day2-state.json`

**מצב:** 🟡 לא לדחוף עד שמסמכי-האם מעודכנים. הדמו והעמודים מציגים מינוח ישן (9 מיומנויות / BKT per-island).

---

## קבוצה E — 🟡 island-03-items.json + script (פעילים)

**קבצים (2):**
- `underwater-app/data/island-03-items.json` *(M — **את פתחת ב-IDE**, אולי פעיל)*
- `underwater-app/scripts/harden-l3-l4-distractors.py` *(?? — סקריפט שמרכך מסיחים, כנראה רץ על items.json)*

**מצב:** 🟡 לא ברור אם יציבים. ה-JSON פתוח ב-IDE שלך. שווה לוודא לפני push.

---

## קבוצה F — 🔴 דורש בדיקה ידנית של מיטל

### F1 — מסמכי-אם (4)
- `architecture-mvp.md` *(M)*
- `curriculum/literacy-grade1-2-yearly.md` *(M)*
- `curriculum/llm-pitfalls.md` *(??)*
- `curriculum/pedagogy-integration-framework.md` *(??)*

### F2 — מצטטים "בר-און" (2 קבצים, 5 מופעים)
- `spec.html` *(M — שורות 613, 1829, 1907)*
- `curriculum/diagnostic-axes-by-island.md` *(?? — שורות 29, 85)*

### F3 — פאקים חודשיים שמצטטים בר-און (7)
- `curriculum/packs/grade1-tashpaz/{september,october,november,december,january,february,march}.json`

### F4 — INVALIDATED (1)
- `curriculum/knowledge-base/sources/perplexity-shatil-share-2003-validation-2026-05-25.json` *(`"_INVALIDATED": true`)*

---

## בעיה היסטורית (לא בסקופ עכשיו)

`curriculum/knowledge-base/sources/world-systems-comparison.json` שורה 340 — tracked, מצטט "6 שלבי בר-און". תיקון בעתיד.

---

## סיכום כמותי

| קבוצה | קבצים | סטטוס |
|---|---|---|
| A — אי 3 PNG + CSS | 73 | ✅ ready |
| B — handoff docs | 7 | ✅ ready |
| C — research + KB sources + library + vocab + ארכיון | 19 | ✅ ready |
| D — README + index + demo-day2 | 6 | 🟡 אחרי master |
| E — island-03-items + script | 2 | 🟡 אישור |
| F1 — מסמכי-אם | 4 | 🔴 |
| F2 — בר-און | 2 | 🔴 |
| F3 — פאקים | 7 | 🔴 |
| F4 — INVALIDATED | 1 | 🔴 |
| **סה"כ ממתין** | **121** | |
