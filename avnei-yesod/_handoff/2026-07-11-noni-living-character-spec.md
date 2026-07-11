# מסמך יישום סופי — "נוני חיה"
### דמות מלווה מגיבה במערכת אבני יסוד · גרסה 1.0 · 11.7.2026

**סטטוס:** מחייב, מוכן להעברה לקודקס · **לא להתחיל קוד לפני נעילת "שאלות פתוחות" (חלק ט״ו).**

**עוגני קוד אמיתיים (מהאודיט):**
- דמות: `<img id="noniImg" class="noni-fixed">` · נכסים: `assets/noni-{idle,happy,thinking,surprised,kiss,hero,hero-transparent}.png` + `noni.svg`
- מצבים: `js/shared/noni.js` → `AvneiNoni.setState('help'|'hint'|'cheer'|'idle')`, `AvneiNoni.ready()`
- של משחקון: `js/templates/game-shell.js` → `startFinale()`, `spawnConfetti()`, `spawnKisses()`, `cheerNoni()`
- חגיגת אי מלאה: `js/shared/mastery-check.js` → `showIslandCelebration()` (`#island-celebration-overlay`, `.ic-*`)
- אודיו: `js/shared/audio.js` → `AvneiAudio.play/playAndWait/preload/unlock/isUnlocked`
- שכבת file://: `js/shared/file-protocol-shim.js` · תוכן צרוב: `embedded-data.js`
- תקדים מודול-משותף: `js/shared/teacher-cloud.js`
- **מרחב אירועים `noni:*` — פנוי** (האירוע המותאם היחיד בפרויקט: `teacher-cloud-ready`).
- פיילוט קיים (עבודה מקומית, לא merged): `css/noni-fx.css`, `js/shared/noni-fx.js`, `noni-fx-demo.html`, מחווט ל-`stage-3-bet.html`.

---

## חלק א׳ — אישיות נוני (אופרטיבי)

| עיקרון | מה זה אומר בפועל | נוני **כן** | נוני **לא** | דוגמה |
|---|---|---|---|---|
| **מעודדת** | כל אינטראקציה משאירה תחושה טובה | מחייכת, מהנהנת, בועה קטנה אחרי ניסיון | חוגגת כל קליק בגדול | אחרי ניסיון שגוי — מבט חם + הישארות ליד |
| **לא שיפוטית** | טעות ≠ כישלון | עוברת ל-`thinking`, נשארת רגועה | `surprised` שלילי, רעד, אדום | טעות שנייה → נוני מצביעה בעדינות, לא "מנדנדת" |
| **מגיבה למאמץ, לא רק לתוצאה** | התמדה מקבלת הכרה | חיזוק חזק ל"הצלחה אחרי מאמץ" | אותה תגובה להצלחה מיידית ולמאומצת | 3 ניסיונות ואז נכון → ריקוד (רמה 3), לא רק happy |
| **רגועה** | קצב נמוך, לא היפראקטיבית | נשימה 4.5s, תנועות איטיות | אנימציות מהירות/קופצניות ברצף | ברירת מחדל = `idle` שקט |
| **סקרנית** | מזמינה, לא דורשת | מבט לצד/בועה כהזמנה עדינה ב-idle | קפיצות "תעשה כבר משהו" | 22s בלי מגע → בועה + הטיית ראש |
| **מחזקת מסוגלות** | הילד מרגיש "אני יכול" | מגיבה לרצף, מסמנת התקדמות | מייחסת הצלחה לעצמה | streak 3 → כתר זמני + "מצוין" |
| **לא מוסרת תשובה מוקדם** | רמז הדרגתי | רמז מתחזק רק אחרי כשל חוזר | להאיר את התשובה בניסיון ראשון | hint רמה 1 = כיוון כללי, לא האות |
| **בלי צבעי-סטטוס** | אין אדום/ירוק במסך ילד | צבעי-זהות + בועות/אור | מסגרת אדומה, X | טעות → נענוע עדין של האלמנט, נוני נשארת חיובית |
| **לא מעכבת** | לעולם לא חוסמת קלט | אנימציה מעל, `pointer-events:none` | overlay חוסם כפתורים | חגיגה רצה — הכפתורים פעילים |
| **לא משתלטת על המסך** | נשארת בפינה | פינה קבועה, חלקיקים מקומיים | fullscreen בכל הצלחה | fullscreen שמור לרמה 4 בלבד |

---

## חלק ב׳ — שפת התגובה (4 רמות)

| מאפיין | **רמה 1 · מיקרו** | **רמה 2 · הצלחה קטנה** | **רמה 3 · רצף/בינוני** | **רמה 4 · חגיגה גדולה** |
|---|---|---|---|---|
| מתי | idle, instruction, attempt | `correct` בודד | streak≥3, complete-משימה | complete-אי, mastery |
| משך | 0.4–1.5s | 0.8–1.5s | 1.5–2.5s | 3–5s |
| חלקיקים | 0–1 בועה | 3–5 (בועות/כוכבים) | 8–14 (כוכבי-ים/פנינים) | 40–80 (בועות-זהב+קונפטי) |
| הבעה | `idle`+מצמוץ | `happy` | `happy`/`cheer`+זרועות | `hero`/`cheer` |
| תנועה | נשימה/הנהון | קפיצה קצרה | ריקוד/סיבוב | ריקוד גדול |
| אקססורי | — | — | כתר/מדליה זמני | כובע מסיבה |
| צליל | אין | אופציונלי קליק רך | praise (`praise-metzuyan/mealeh`) | praise + finale |
| דילוג | לא רלוונטי | לא | כן (טאץ') | **כן (חובה)** |
| cooldown מינ׳ | 2s | 6s | 15s | פר-סשן (ראה חלק ט׳) |
| **אסור** | לצבור לרצף רועש | להפוך לרמה 3 | fullscreen | לחסום, לחזור פעמיים ברצף |

עיקרון-על: **downgrade אוטומטי** — אם התרחשה חגיגה גבוהה לאחרונה, האירוע הבא יורד רמה (חלק ט׳).

---

## חלק ג׳ — מפת אירועים

טבלה ראשית (עדיפות גבוהה יותר = גוברת בעת התנגשות; מספר גבוה גובר):

| event | trigger | הבעה | אנימציה | חלקיקים | אקססורי | צליל | משך | cooldown | עדיפות |
|---|---|---|---|---|---|---|---|---|---|
| **session-start** | טעינת מסך ראשון בסשן | idle→wave | `noni-enter`+wave | — | — | אין | 1.2s | פר-סשן | 3 |
| **instruction** | השמעת הוראה קולית | thinking | `noni-lean` (הקשבה) | — | משקפיים? (אופ') | (ההוראה עצמה) | כל ההוראה | — | 6 |
| **attempt** | הילד נגע בתשובה | idle | micro-nod | — | — | אין | 0.3s | 1s | 2 |
| **correct** | תשובה נכונה בודדת | happy | `noni-cheer-hop` | 3–5 | — | קליק רך (אופ') | 1.2s | 6s | 5 |
| **almost** | קרוב (פונמה/ניקוד סמוך) | thinking | `noni-lean`+point-soft | 0–1 | מצביע רך | אין | 1.2s | 4s | 5 |
| **incorrect** | תשובה שגויה | thinking | הישארות רגועה | — | — | אין | 0.8s | 3s | 5 |
| **hint** | בקשת/הפעלת רמז | hint (surprised-חיובי) | `noni-hint-bob`+point | 0–1 | 💡 נורה/מצביע | אין | לפי הרמז | 3s | 7 |
| **streak** | רצף≥3 נכונים | happy→cheer | `noni-dance`/`noni-spin` | 8–14 | 👑 כתר זמני | praise | 2s | 15s | 6 |
| **complete** (משימה) | סיום סבב | cheer | `noni-final-dance` | 8–14 | מדליה זמנית | praise→finale | 2.5s | — | 8 |
| **complete-אי** (mastery) | `showIslandCelebration` | hero | fullscreen | 40–80 | כובע מסיבה | praise+finale | 3–5s | פר-סשן (max) | 9 |
| **idle-soft** | ~12s בלי קלט | idle | מצמוץ/מבט לצד | — | — | אין | 0.6s | — | 1 |
| **idle-medium** | ~22s | idle | בועה+הטיית ראש | 1 | — | אין | 1s | — | 1 |
| **idle-sleep** | ~35–45s (מסכים מותרים בלבד) | idle (dim) | `sleep-bob` איטי | — | 😴 כובע-שינה/Zzz | אין | מתמשך | — | 1 |
| **resume** | קלט אחרי idle/sleep | happy קצר | wake-pop | 1–2 | — | אין | 0.6s | — | 4 |
| **tap** | נגיעה בנוני | kiss | `nfxWiggle` | 3–5 לבבות | 🎀 סרט זמני | אין | 0.95s | 1.5s | 4 |
| **long-press** | לחיצה ארוכה (>600ms) | surprised (חיובי) | pop | 2 | — | אין | 0.8s | 2s | 4 |
| **loading** | טעינת נכס/מעבר אסינכ׳ | idle | `noni-fx-swim` | — | 🥽 משקפי-שחייה | אין | עד הסיום | — | 3 |
| **transition** | מעבר בין מסכים/סבבים | idle | swim קצר | — | — | אין | 1.4s | — | 3 |
| **frustration** | ראה חלק ד׳ (טעויות/קליקים) | thinking (חם) | lean קרוב | — | — | אין | 1s | 8s | 7 |
| **success-after-effort** | נכון אחרי ≥2 ניסיונות/frustration | cheer | `noni-dance` | 8–14 | 👑/מדליה | praise (מודגש) | 2s | 10s | 8 |

**תנאים כלליים + "מתי לא להפעיל":** כל אירוע רמה≥2 מותנה ב-`animationBudget.canPlay(level)` (חלק ט׳). idle-* לא מופעל במסכי "no-sleep" (חלק ה׳). correct/streak לא מופעלים כשמסך חגיגה מלא פעיל.

**התנגשות (interruption):** אירוע נכנס עם עדיפות ≥ הנוכחי → הנוכחי מסתיים מיד (fade 150ms) והחדש רץ. עדיפות נמוכה יותר → נכנס לתור אם רמה≤2, אחרת מושמט. idle-* תמיד נדחה/מבוטל ע"י כל אירוע אמיתי.

---

## חלק ד׳ — תגובה למאמץ (לוגיקה פדגוגית)

| מצב | תגובת נוני | rmz/פעולה | חיזוק |
|---|---|---|---|
| טעות ראשונה | `thinking`, נשארת רגועה, בלי חלקיקים | אין רמז | ניטרלי-חיובי |
| טעות שנייה | `thinking`+`noni-lean` קרוב | **hint רמה 1** (כיוון כללי) | עידוד רך |
| טעות שלישית | `hint`+מצביע | **hint רמה 2** (צמצום אפשרויות, לא התשובה) | "כמעט, בוא ננסה יחד" |
| הצלחה אחרי מאמץ | `success-after-effort` (רמה 3) | — | **מוגבר** — כתר/מדליה + praise מודגש |
| רצף נכונים | `streak` בהדרגה (3→כתר, 5→ריקוד) | — | מסוגלות מצטברת |
| חזרה אחרי הפסקה | `resume` חיובי | — | "טוב שחזרת" (ויזואלי) |
| עבודה איטית | **אין הענשה** — idle-soft בלבד | סבלנות | ניטרלי |
| קליקים מהירים חוזרים | `frustration` — נוני מתקרבת ומרגיעה | האטה, אולי hint | הרגעה, לא נזיפה |
| קושי מתמשך (אותו סוג) | `frustration`+hint מתגבר | הצעת רמז יזומה | תמיכה |

חוקי-ברזל: אין תחושת כישלון · אין אדום · אין חשיפת תשובה בניסיון 1 · רמז נבנה בהדרגה · **הצלחה-אחרי-מאמץ > הצלחה-מיידית** בעוצמת החיזוק.

`frustrationLevel` עולה ב: טעות רצופה, קליקים מהירים (<400ms בין נגיעות), זמן-על-משימה גבוה. יורד ב: הצלחה, resume.

---

## חלק ה׳ — idle חכם (מדורג, ללא "שינה אחרי 15ש׳")

| זמן | תגובה |
|---|---|
| ~12s | מצמוץ / מבט לצד (idle-soft) |
| ~22s | בועה קטנה + תנועת-הזמנה (idle-medium) |
| ~35–45s | נמנום עדין (idle-sleep) — **רק במסכים מותרים** |
| מגע/קלט | התעוררות חיובית (resume) |

**מסכים שבהם `idle-sleep` כבוי (חובה):** הקשבה · קריאה · הקלטה (שטף/read-aloud) · הוראה קולית מתנגנת · מסך עם טקסט ארוך · כל פעילות הדורשת חשיבה ממושכת. מנוהל בדגל `screenProfile.allowSleep=false`. במסכי no-sleep עוצרים ב-idle-medium.

---

## חלק ו׳ — אינטראקציה ישירה + אקססוריז

**Easter eggs:** `tap`→kiss+לבבות · `long-press`→surprised · `double-tap`→סיבוב+בועות · `tap` בזמן חגיגה→מחווה קצרה נוספת (לא חוגגת מחדש).

**מיפוי אקססוריז להקשר (לא אקראי). מימוש = החלפת-PNG מלאה, לא overlay.**

| מצב | אקססורי | גל | נכס |
|---|---|---|---|
| streak | כתר קטן | **1** | `noni-crown.png` |
| complete / complete-אי | כובע מסיבה | **1** | `noni-party.png` |
| idle-sleep | כובע-שינה | **1** | `noni-sleep.png` |
| thinking / instruction | משקפיים קטנים | 2 | `noni-glasses.png` |
| hint | מצביע / 💡 נורת-רעיון | 2 | `noni-hint.png` |
| loading | משקפי-שחייה | 2 | `noni-swim.png` |
| tap/kiss | סרט/לב קטן | 2 | (על `noni-kiss` הקיים) |

**מניעת עומס:** מצב-נוני אחד בכל רגע (החלפת-PNG אטומית) · לא במסכי no-distraction · חזרה ל-`idle` אחרי משך התגובה · **כל אקססורי = PNG מלא בסגנון נוני הקיים** (מובטחת התאמת-סגנון, אפס הרכבה). גל 1 = 3 בלבד; שאר השורות מותנות בהוכחת-ערך.

---

## חלק ז׳ — ארכיטקטורה (3 שכבות + state)

הפרדת אחריות מלאה. שלוש שכבות + מודל state, בדפוס המודול-המשותף של `teacher-cloud.js`.

**`NoniActor`** (js/shared/noni-actor.js) — *מה שרואים*: הצגת דמות, החלפת PNG, class-names, מיקום/scale/movement/gestures, זיהוי tap/long-press/double-tap, שכבת אקססוריז, `aria`, כיבוד reduced-motion. **חסר-מצב** — רק מבצע פקודות. מרחיב/מאחד את `AvneiNoni` הקיים (תאימות אחורה: `setState` נשאר).

**`NoniDirector`** (js/shared/noni-director.js) — *מה שמחליטים*: מאזין ל-`noni:react`, בוחר רמה/תגובה, אוכף עדיפויות+cooldowns+animation-budget, מנהל session-state (streak/attempts/frustration/idle), חוקי suppression+interruption, scheduling ותור. **הלב הפדגוגי.**

**`NoniFX`** (js/shared/noni-fx.js — *מרחיב את הפיילוט הקיים*) — *אפקטים*: bubbles, pearls, stars, sea-particles, gold-bubbles, confetti, Zzz, sparkles, וו-צליל (`AvneiAudio`), שכבת חגיגת-מסך-מלא. **מאחד** את `spawnConfetti/spawnKisses` (game-shell) ו-`showIslandCelebration` (mastery-check) מאחורי API אחד.

**`NoniSessionState`** (בזיכרון, אופ׳ persist ל-sessionStorage):
```js
{
  correctStreak: 0, currentAttempts: 0, completedActivities: 0,
  idleSeconds: 0, recentReactions: [], lastReactionAt: 0,
  majorCelebrationsCount: 0, soundEnabled: true, reducedMotion: false,
  currentNoniState: 'idle', frustrationLevel: 0
}
```

זרימה: משחקון → `dispatchEvent('noni:react')` → **Director** מחליט → קורא ל-**Actor** (דמות) ו-**FX** (חלקיקים). המשחקון לא יודע דבר על דמות/חלקיקים — רק "מה קרה".

---

## חלק ח׳ — API אחיד לאירועים

```js
window.dispatchEvent(new CustomEvent('noni:react', {
  detail: {
    type: 'correct',          // required — enum מחלק ג׳
    intensity: 'small',       // optional — 'micro'|'small'|'medium'|'major' (Director גובר אם לוגיקה מחייבת)
    source: 'word-match',     // optional — שם המכניקה (טלמטריה/דיבוג)
    streak: 2,                // optional — Director מסתמך על state אם חסר
    attempts: 1,              // optional
    metadata: {}              // optional — פתוח
  }
}));
```

**Schema/validation:** `type` חובה ומ-enum; לא-חוקי → מושמט + `console.warn`. שדות חסרים → **fallback ל-`NoniSessionState`**. `intensity` חסר → Director מחשב מהלוגיקה. **priority** לא נשלח ע"י הקורא — נגזר מהטבלה בחלק ג׳.

**קריאות לדוגמה:**
```js
// תשובה נכונה
dispatch('noni:react',{type:'correct',source:'mechanic-pick'});
// רצף — Director יזהה גם לבד מה-state
dispatch('noni:react',{type:'correct',streak:3});
// טעות (בלי אדום, בלי חלקיקים)
dispatch('noni:react',{type:'incorrect',attempts:2});
// סיום אי (חגיגה גדולה)
dispatch('noni:react',{type:'complete',intensity:'major',source:'island-3'});
// טעינה
dispatch('noni:react',{type:'loading'}); /* ... */ dispatch('noni:react',{type:'resume'});
```

**תאימות אחורה:** `NoniDirector` גם עוטף את `AvneiNoni.setState('cheer')` הקיים → מתרגם ל-`noni:react{correct}`, כך שה-70 משחקונים עובדים גם בלי שינוי (כמו בפיילוט הנוכחי).

---

## חלק ט׳ — Animation Budget (ברירות מחדל)

| פרמטר | ברירת מחדל | תפקיד |
|---|---|---|
| `maxMajorCelebrationsPerSession` | 3 | מגביל fullscreen (רמה 4) |
| `minimumGapBetweenReactions` | 2000ms | אין תגובה על תגובה |
| `maxParticles` (בו-זמנית) | 60 | תקרת חלקיקים |
| `maxConcurrentAnimations` | 2 | דמות + חלקיקים |
| `muteRepeatedSoundWithin` | 8000ms | לא לחזור על praise |
| `suppressIdleDuringInstruction` | true | — |
| `downgradeIfCelebratedWithin` | 10000ms | רמה→רמה-1 |
| `blockingAllowed` | **false לעולם** | — |
| `noRepeatedFullscreen` | true | fullscreen לא ברצף |

Director שומר `recentReactions[]` (חלון 30s) ואוכף את כל הכללים לפני כל play.

---

## חלק י׳ — נגישות וביצועים (מחייב)

- `prefers-reduced-motion` → כיבוי כל האנימציות/חלקיקים, נוני נשארת PNG סטטי חיובי (כבר ממומש ב-`noni-fx.css`/`noni.css` — להרחיב לכל השכבות).
- כיבוי צליל (`soundEnabled=false`) → אין וו-צליל, ויזואל נשאר.
- Low-power / מכשיר חלש → `maxParticles` יורד, אין fullscreen; זיהוי היוריסטי (deviceMemory/hardwareConcurrency).
- **אף אנימציה לא חוסמת** קלט · לא מסתירה תשובות · לא חוסמת כפתורים · `pointer-events:none` על שכבת FX, `auto` רק על נוני ל-tap.
- responsive · RTL · mobile-first · מגע ≥56px.
- Lazy-load אקססוריז; **preload** של 6 נכסי נוני + praise (כבר נעשה ב-game-shell).
- **Fallback ל-PNG סטטי** אם שכבה כלשהי נכשלת/reduced-motion.
- ביטול אפקטים כבדים במסכים עמוסים (`screenProfile.heavy=true`).

---

## חלק י״א — הפיילוט (3 מסכים בלבד)

| # | מסך | אירועים מחוברים | תגובות נוני | אקססוריז | חלקיקים | מדד הצלחה | מהו עומס/כישלון |
|---|---|---|---|---|---|---|---|
| 1 | **בחירה פשוט** (`stage-3-bet.html`, mechanic-pick) | attempt, correct, almost, incorrect, hint, idle-*, tap | micro→happy, thinking לטעות, hint מתגבר | מצביע (hint) | 3–5 בועות/כוכבים | ילד ממשיך בזרימה, מחייך; אין תגובה על טעות | חלקיקים בכל קליק · אדום · חסימה |
| 2 | **רצף הצלחות** (מכניקת אותיות עם ≥5 יחידות) | correct, streak, success-after-effort, complete | happy→dance, כתר ב-3 | 👑 כתר, מדליה | 8–14 כוכבי-ים | streak מזוהה, חיזוק-מאמץ מובחן | חגיגה גדולה בכל נכון · רעש |
| 3 | **מסך סיום** (completion / `showIslandCelebration`) | complete, complete-אי, tap-בזמן-חגיגה | hero, ריקוד גדול | כובע מסיבה | 40–80 בועות-זהב | חגיגה אחת, ניתנת לדילוג, כפתורים פעילים | fullscreen חוזר · חסימת "חזרה לאי" |

**מדדים לבדיקה:** אין ירידת FPS מורגשת (mobile) · אין קליק חסום · reduced-motion עובד · אין חגיגה כפולה על אירוע כפול · הצלחה-אחרי-מאמץ ≠ הצלחה-מיידית ויזואלית.

---

## חלק י״ב — תוכנית עבודה

**שלב 0 · audit** (חלקו בוצע כבר במסמך זה): מיפוי כל שימושי `#noniImg`/`.noni-fixed`; כל `noni-*.png`; כל קבצי CSS עם `noni`/keyframes (25 קבצי CSS, ~50 keyframes של noni מפוזרים בין quest-CSS); אירועים קיימים (רק `teacher-cloud-ready`; `noni:*` פנוי); מנגנוני חגיגה (`game-shell.startFinale`, `mastery-check.showIslandCelebration`, `rescue-controller`); דפוס `teacher-cloud.js`.

**שלב 1 · foundation:** NoniActor + NoniDirector + NoniFX + event API + state + cooldowns + reduced-motion. עטיפת `AvneiNoni.setState` לתאימות. **בלי לגעת במשחקונים.**

**שלב 2 · pilot:** 3 המסכים; אינטראקציות; תגובה-למאמץ; loading; celebration.

**שלב 3 · QA:** mobile · RTL · a11y · performance · no-blocking · visual-overload · regression (5 quest games קיימים).

**שלב 4 · rollout:** הדרגתי בקבוצות משחקונים · **feature flag** (`window.NONI_LIVE=false` כברירת-מחדל עד אישור) · rollback = כיבוי הדגל.

---

## חלק י״ג — Definition of Done

- [ ] אין שינוי לוגיקת-משחק במשחקונים
- [ ] כולם דרך API אחיד (`noni:react`)
- [ ] ניתן לכבות נוני (feature flag)
- [ ] ניתן לכבות צלילים
- [ ] reduced-motion עובד
- [ ] fallback ל-PNG עובד
- [ ] אין חסימת כפתורים
- [ ] אין ירידת ביצועים מורגשת
- [ ] אירוע כפול ≠ אנימציה כפולה
- [ ] נוני לא חושפת תשובה בניסיון 1
- [ ] הצלחה-אחרי-מאמץ מקבלת חיזוק מוגבר
- [ ] חגיגה ניתנת לדילוג
- [ ] **אפס שינוי ב-70 המשחקונים לפני אישור הפיילוט**
- [ ] file:// לא נשבר

---

## חלק י״ד — תוצרים למסירה

1. **מסמך יישום** (זה).
2. **מפת קבצים מוצעת:**
```
js/shared/noni-actor.js      (מרחיב AvneiNoni)
js/shared/noni-director.js   (חדש — הלב)
js/shared/noni-fx.js         (מרחיב את הפיילוט הקיים)
js/shared/noni-events.js     (schema+validation+dispatch helper)
css/noni-fx.css              (קיים — הרחבה)
assets/noni-{crown,party,sleep}.png  (גל 1 — 3 הבעות אקססורי בסגנון נוני)
_handoff/2026-07-11-noni-living-character-spec.md (המסמך)
```
3. **event schema** (חלק ח׳).
4. **state schema** (חלק ז׳).
5. **טבלת אירועים** (חלק ג׳).
6. **assets נדרשים:** 6 PNG קיימים + **3 חדשים לגל 1** (`noni-crown`, `noni-party`, `noni-sleep`) בסגנון נוני. גל 2 (מותנה): `noni-glasses`, `noni-hint`, `noni-swim`.
7. **אקססוריז** (חלק ו׳).
8. **פיילוט** (חלק י״א).
9. **QA** (שלב 3).
10. **סיכונים:** אקססוריז חדשים = תלות-נכסים (עלול לעכב) · פיצול ה-keyframes הקיימים → סיכון רגרסיה ב-5 quest games · צליל חוזר = מטרד אם budget לא מדויק · double-tap עלול להתנגש ב-tap.

---

## חלק ט״ו — 5 השאלות + המלצות (הוכרעו 11.7)

**1. אקססוריז — ✅ הוכרע (מיטל 11.7): כן, כ-3 הבעות-PNG מלאות בסגנון נוני.**
לא אקססורי-וקטור מודבק (סיכון "מודבק/זול" על דמות רכה תלת-ממדית), אלא **הבעות-נוני מלאות עם האקססורי כבר עליה**, באותו סגנון של ה-PNG הקיימים (כמו `noni-happy`/`noni-kiss`). ה-Actor מחליף תמונה בלבד → אפס הרכבה, התאמת-סגנון מובטחת. מתחילים ב-3:
- 👑 `noni-crown.png` — streak
- 🎉 `noni-party.png` — complete / חגיגה
- 😴 `noni-sleep.png` — idle-sleep

דורש הרצת פייפליין-התמונות שיצר את `noni-*.png` הקיימים (3 תמונות, לא פרויקט). שאר האקססוריז (משקפיים/משקפי-שחייה/נורה/מצביע/סרט/מדליה) — גל 2, ורק אם יוכחו כבעלי-ערך. **חלק ו׳ מתעדכן בהתאם: אקססוריז = החלפת-PNG, לא שכבת-overlay.**

**2. צליל על `correct` בודד — ✅ המלצה: לא. ויזואל בלבד.**
praise (`praise-metzuyan/mealeh`) נשאר לרמה 3–4 בלבד. קליק על כל נכונה = עומס-שמע, ומתנגש במכניקות ההאזנה (two-tap, מסיחי-שמע) שבהן האודיו הוא כלי-המדידה. שקט על נכונה בודדת = נכון פדגוגית.

**3. `idle-sleep` — ✅ המלצה: להשאיר, אבל gated.**
שומרים על ה-idle המדורג (12s/22s/35–45s) כולל sleep, אבל sleep רץ **רק** כש-`screenProfile.allowSleep=true`. בפיילוט: מסך-בחירה ומסך-רצף = allowSleep (בר-בדיקה); מסך-סיום = אין idle כלל. במסכי האזנה/קריאה/הקלטה — עוצרים ב-medium.

**4. 3 מסכי פיילוט — ✅ המלצה מאושרת:**
(1) `stage-3-bet.html` (בחירה/בנייה) · (2) משחקון-אות עם ≥5 יחידות ברצף למכניקת tap-all (למשל `stage-3-lamed` — רצף מובהק ל-streak) · (3) מסך-סיום דרך `showIslandCelebration`. גיוון מכניקה בין 1↔2 בכוונה, לבחון את ה-API על יותר ממכניקה אחת.

**5. Persist של state — ✅ המלצה: `sessionStorage` פר-תלמיד.**
שורד רענון (file:// reload, רענון בטעות) אך מתאפס פר-סשן — כך streak/frustration/majorCelebrations הם פר-סשן-למידה, וזה הנכון פדגוגית. מפתח: `noni-state:<studentId>`. תואם דפוסי ה-sessionStorage הקיימים ב-game-shell/mastery.

**כל 5 השאלות ננעלו (מיטל 11.7).** #1 = אקססוריז כ-3 הבעות-PNG · #4 = 3 המסכים אושרו (`stage-3-bet` / `stage-3-lamed` / `showIslandCelebration`). המסמך מוכן 100% להעברה לקודקס.

---

## חלק ט״ז — ✅ החלטות לנעילה מיידית

- מרחב `noni:react` אחיד (event-driven)
- 3 שכבות (Actor / Director / FX) + NoniSessionState
- 4 רמות תגובה מדורגות
- idle מדורג (12s / 22s / 35–45s) — **לא** שינה אחרי 15s
- בלי אדום/צבעי-סטטוס · בלי חסימת קלט לעולם
- reduced-motion + fallback ל-PNG = חובה
- feature-flag לפני rollout · rollback = כיבוי דגל
- **אפס שינוי ב-70 המשחקונים לפני אישור הפיילוט**

---

*המסמך נכתב מתוך סריקת ריפו בפועל (11.7.2026). כל שם קובץ/פונקציה/מחלקה לעיל אומת מול הקוד.*
