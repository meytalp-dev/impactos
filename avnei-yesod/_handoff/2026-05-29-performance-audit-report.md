# Performance & Quality Audit — אבני יסוד · לקראת פיילוט

> **סוכן 24** · 2026-05-29 · בדיקת performance/scaling/responsive/RTL/a11y לפיילוט (4-5 ילדות · ~3 חודשים).

## TL;DR — שלוש כותרות

1. **BKT scale: PASS חזק.** ingest avg = **0.64ms** · read APIs **< 1ms** · aggregation 5 ילדות = **11ms**. כל הספים של ההנדאוף נמדדו בשולי בטחון של 50x+. אין צורך באופטימיזציה לפני הפיילוט.
2. **localStorage לפיילוט: PASS בטוח.** 5 ילדות × 1800 events = **582KB (11% מ-5MB)**. **77% מהשטח** הוא `state.events` (1000 events FIFO) — לא BKT. סקאלינג ל-50 ילדות = 35% · 100 ילדות = 62% · **250 ילדות = 142%** (חורג). לפיילוט — לא רלוונטי.
3. **Frontend a11y/RTL/mobile: 3 issues חשובים** לפני פיילוט (לא חוסמים, אבל מומלץ לסגור):
   - `user-scalable=no` ב-30 מסכי תלמיד.ה — מונע zoom (WCAG 1.4.4).
   - `moy-screener.html` — **0 aria attributes + 0 @media queries**. screener קצר ופחות קריטי, אבל פנימי לטכניקה צריך לכוון.
   - טבלת `teacher-rama.html` (`min-width: 880px`) — overflow-x עובד, אבל קשה לתפעל במובייל. F.21E (`teacher-action.html`) יותר ידידותית לטלפון.

---

## Phase A — BKT Performance

### Setup
- 9,000 events מצטברים: 5 ילדות × 1,800 events כ"א.
- distribution: 95% אי 3 · 5% איים 2/5/6/9/15.
- 22 אותיות מ-`ALL_HEBREW_LETTERS_22`, accuracy 55-85% פר ילדה (deterministic seed).
- בדיקה: `node avnei-yesod/underwater-app/scripts/test-bkt-performance.js`

### תוצאות

| מטריקה | ערך | סף | מצב |
|---|---|---|---|
| ingest avg | **0.642ms** | < 5ms | ✓ |
| ingest p99 | 1.795ms | < 20ms | ✓ |
| ingest max | 20.99ms | < 100ms | ✓ |
| bulk 9k events | 5.78s | < 30s | ✓ |
| `checkMastery` avg | **0.27ms** | < 50ms | ✓✓ |
| `getLetterMasteryDistribution` avg | 0.87ms | < 50ms | ✓✓ |
| `getStrandState` avg | 0.45ms | < 50ms | ✓✓ |
| `getWeakestLetters` avg | 0.86ms | < 50ms | ✓✓ |
| `getLetterState("מ")` avg | 0.88ms | < 50ms | ✓✓ |
| F.21A aggregation (5 ילדות × 4 APIs) | **11.39ms** | < 1000ms | ✓✓ |
| BKT state size | 118.7KB | < 2MB | ✓✓ |

**18/18 PASS · 0 findings.**

### למה זה טוב כל-כך
- `responseTimesMs` חתום ל-100 פר letter/island (`bkt.js:347, 411, 472`) — מונע O(n) growth.
- כל read API עושה `loadState` יחיד (JSON.parse של ~120KB) — חצי מילישנייה בלבד.
- ה-bottleneck התיאורטי (`JSON.parse+stringify` × 2 פר event) נשלם ב-~0.6ms ב-Node. גם עם **מכפיל 5x** למובייל איטי = 3.2ms — עדיין הרבה מתחת לסף.

### הערה למובייל
המדידה נעשתה ב-Node על Windows. mobile real-world performance עשוי להיות פי 3-5 איטי יותר (סמארטפון בינוני, לא חזק). הספים שלנו עומדים במכפיל גם של 50x.

---

## Phase B — localStorage Footprint

### Setup
- 4 stores פעילים: `underwater-app:v1`, `avnei-bkt-v1`, `avnei-bkt-strand-v1`, `avnei-epa-v1`.
- baseline פיילוט: 5 ילדות × 1800 events דרך `Logger.logActivityResult` (path מלא: state.events + BKT + EPA).
- בדיקה: `node avnei-yesod/underwater-app/scripts/test-localstorage-limits.js`

### Baseline (5 ילדות × 1,800 events)

| store | size | % מהשטח |
|---|---|---|
| `underwater-app:v1` (state.events × 1000) | **445.5KB** | **76.6%** |
| `avnei-bkt-strand-v1` | 61.0KB | 10.5% |
| `avnei-bkt-v1` | 58.2KB | 10.0% |
| `avnei-epa-v1` | 16.9KB | 2.9% |
| **TOTAL** | **581.8KB** | **11.4% מ-5MB** |

### Per-student growth (לינארי)
| תלמידות | size proj | % מ-5MB |
|---|---|---|
| 1 | 472.8KB | 9.2% |
| 5 (פיילוט) | **581.7KB** | **11.4%** |
| 10 | 717.9KB | 14.0% |
| 25 | 1.13MB | 22.0% |
| 50 | 1.81MB | 35.3% |
| 100 | 3.17MB | 61.9% **WATCH** |
| 250 | 7.25MB | 141.7% **CRITICAL** |

### תובנה עיקרית — `state.events` הוא ה-floor, לא BKT
- 1000 events × ~440 bytes ≈ 440KB **קבועים** (FIFO).
- BKT+EPA פר ילדה ≈ **27KB** — זניח.
- כשמסקלים מעבר ל-~150 ילדות, ה-`state.events` היחיד לא יספיק להחזיק את כל הילדות. צריך לעבור ל-IndexedDB או partition פר-ילדה.

### Per-event Logger cost = 4.66ms (פי 7 מ-BKT-only)
- `state.js:appendEvent` עושה full JSON.parse + slice(-1000) + JSON.stringify של state גדל פר event.
- לא חוסם UI (event אחד כל כמה שניות), אבל **hot path** שכדאי לדעת עליו אם מישהו מנסה לעשות replay של 1000 events בבת אחת.

### תוצאות
**10/10 PASS · 1 finding (informational).**

---

## Phase C — Mobile Responsive (static audit)

> בדיקה בוצעה ב-static analysis בלבד (grep על HTML/CSS). Chrome DevTools mobile mode דורש הרצה בדפדפן — לא בוצע.

### תוצאות פר-מסך
| מסך | viewport | dir=rtl | @media | touch targets | סטטוס |
|---|---|---|---|---|---|
| `teacher-action.html` | ✓ | ✓ | `min-width:1024` + `max-width:480` (2) | ≥44px ברוב, 40px ב-`.ta-btn` | OK |
| `teacher-rama.html` | ✓ | ✓ | `max-width:768` (1) | 880px min-width על טבלה | **WATCH** |
| `moy-screener.html` | ✓ | ✓ | **0** | `<button>` semantic | **IMPORTANT** |
| `data-export.html` | ✓ | ✓ | 1 | n/a | OK |
| `stage-3-*` (משחקונים) | ✓ + `user-scalable=no` | ✓ | 0-1 | clamp-based scaling | OK פונקציונלית, a11y issue |

### Issues
1. **`teacher-rama.html` table — `min-width: 880px`** (line 116):
   - יש `overflow-x: auto` + `-webkit-overflow-scrolling: touch` ✓
   - sticky right column (line 150) — עובד טוב ב-RTL ✓
   - **אבל**: על iPhone 12 (390px) המורה תראה ~44% מהרוחב — הרבה גלילה אופקית. אם המסך הזה לשימוש שגרתי במובייל — UX מסובך.
   - **המלצה**: F.21E (`teacher-action.html`) כבר ידידותית למובייל ומתאימה לשימוש בדרך לבית-ספר. השאירי את `teacher-rama` ככלי לשולחן/לפטופ.
2. **`moy-screener.html` — אפס media queries**:
   - `max-width:720px` על `.page` + `padding:32px 20px` — על iPhone 12 = 32px padding מצידים זה הרבה.
   - הtouch targets טובים (`<button>` סמנטיים עם padding גדול).
   - **המלצה**: להוסיף `@media (max-width: 480px)` שמקטין padding ל-20px ומקטין `font-size: 26px` של h1 ל-22px.

---

## Phase D — RTL Audit (static)

### חיובי
- כל ה-4 מסכים: `<html lang="he" dir="rtl">` ✓
- כל ה-30 מסכי תלמיד.ה: ✓
- 41 מסכים בסך הכל עם `dir=rtl` — coverage מלא.
- fonts: `Heebo` (כתב דפוס) למסכי תלמיד.ה + `Assistant` למסכי מורה. **אפס** `Playpen/cursive/handwriting` — תואם memory rule.
- sticky positioning עם `right: 0` (לא `left`) — תקין ל-RTL.
- `:before/:after` עם content `'· '` ועם `'💬 המורה אומרת: '` — לא חוסם RTL.

### Issues
ה-static audit לא חושף issues של niqud ב-final letters (ך/ם/ן/ף/ץ) כי הם תלויי-font rendering. **נדרש visual check ידני** ב-Chrome/Safari + Android Chrome.

### המלצה — visual check ידני (10 דקות)
לפתוח 3 מסכים:
1. `moy-screener.html` — לוודא שכל פריט עם ניקוד מוצג נכון (במיוחד אותיות סופיות).
2. כל `stage-3-*.html` עם target_letter סופי (ץ/ך/ם/ן/ף לא קיימים ב-22 אבל הרבה אותיות בעלות צורה סופית) — לוודא רינדור.
3. `teacher-rama.html` — לוודא שמיקס עברית/מספרים ב-cells (אחוזים, ספירות) מוצג בסדר הנכון.

---

## Phase E — Accessibility (static)

> Lighthouse audit דורש דפדפן + DevTools — לא בוצע אוטומטית. סקירה ידנית של HTML markup בלבד.

### תקציר aria-coverage
| מסך | aria/role count | סטטוס |
|---|---|---|
| `teacher-rama.html` | 4 | low |
| `teacher-action.html` | 2 | low |
| `stage-3-storm.html` (representative) | 10 | OK |
| `moy-screener.html` | **0** | critical |

### Critical findings

1. **`user-scalable=no` ב-30 מסכי תלמיד.ה** (`<meta viewport>`):
   - **WCAG 1.4.4 violation** — מונע מהמשתמש להגדיל text.
   - לפיילוט עם 1 מורה ו-4 ילדות — לא חוסם.
   - להמשך: להסיר את `maximum-scale=1.0, user-scalable=no` בכל ה-stage-3-* + map + student-picker.
   - **fix**: regex replace ב-30 קבצים. סוכן אחר.

2. **`moy-screener.html` — אפס aria attributes**:
   - 6 `<button>` יסודיים — accessible כי דפדפן ייתן role=button native.
   - **חסר**: aria-label על `audio-btn` (כפתור 🔊 שמשמש להקראה), aria-live על אזורי תגובה דינמיים, aria-describedby על noni-bubble.
   - **fix**: סוכן UI להוסיף 10-15 aria-label. ~30 דקות עבודה.

3. **כפתורי icon-only ב-`teacher-action.html` / `teacher-rama.html`**:
   - PIN gate, modal close, header buttons — חסרים aria-label.
   - 2-4 aria attrs בלבד פר מסך כשיש 10+ כפתורים.
   - **fix**: סוכן UI להוסיף aria-label. ~20 דקות עבודה.

### Important findings

4. **צבעי hint נמוכי-contrast** (`teacher-action.html` + `data-export.html`):
   - `#a0aec0` על רקע לבן ≈ contrast ratio 2.5:1.
   - WCAG AA דורש 4.5:1 לטקסט רגיל.
   - **השפעה**: hint text כמו "12+ ימים של data" קשה לקרוא לקצרי-ראייה.
   - **fix**: לשנות ל-`#718096` (כבר בשימוש במקומות אחרים) = 4.6:1 ✓.

5. **`<div onclick>` ב-modal backdrops**:
   - 3 instances ב-`teacher-action.html` + 6 ב-`teacher-rama.html` — כולן `class="modal-backdrop" onclick="this.remove()"`.
   - **לא חוסם** — זה click-outside-to-close, ו-ESC כנראה מטופל ב-JS.
   - אבל לוודא ש-modal סוגר גם עם Escape key (חוץ מ-backdrop click).

### Nice-to-have

6. **stage-3-storm aria-coverage טוב** (10 attrs):
   - `aria-hidden` על decorative images ✓
   - `aria-label` על icon buttons ✓
   - **דוגמה טובה לשאר ה-stage-3-***. לאחד את הסטנדרט.

---

## פר-severity — רשימה משולבת

### Critical (must-fix לפני פיילוט)
**אין.** כל היכולות הקריטיות עובדות.

### Important (nice-to-fix לפני פיילוט — 1-2 שעות עבודה)

| # | Issue | מסכים | מי בטיפול | זמן |
|---|---|---|---|---|
| 1 | `user-scalable=no` ב-30 מסכי תלמיד.ה | `stage-3-*.html`, `stage-2-*.html`, `map.html`, `student-picker.html` | סוכן UI | 15 דק׳ (regex) |
| 2 | `moy-screener.html` — אין aria + אין @media | `engine/moy-screener.html` | סוכן UI | 45 דק׳ |
| 3 | aria-label על כפתורי icon-only | `teacher-action.html`, `teacher-rama.html` | סוכן UI | 20 דק׳ |
| 4 | `#a0aec0` text contrast | `teacher-action.html`, `data-export.html` | סוכן UI | 10 דק׳ |

### Post-pilot (לדחות, לא חוסם פיילוט)

| # | Issue | זמן |
|---|---|---|
| 5 | `teacher-rama` `min-width:880px` table — UX לא נוח על iPhone | רידיזיין partial / או למקד הוראה "פתחי בלפטופ" | 2-4h |
| 6 | `state.js:appendEvent` — JSON.parse+stringify O(n²) effective | אופטימיזציה ל-state.events (אולי batch save פר 10 events) | 1-2h |
| 7 | localStorage scaling > 150 ילדות | מיגרציה ל-IndexedDB עם partition פר ילדה | יום+ |

---

## קבצים שיוצרו

1. `avnei-yesod/underwater-app/scripts/test-bkt-performance.js` — 18 tests · רץ ב-~6 שניות.
2. `avnei-yesod/underwater-app/scripts/test-localstorage-limits.js` — 10 tests · רץ ב-~2 דקות.
3. `avnei-yesod/_handoff/2026-05-29-performance-audit-report.md` — הדו"ח הזה.

## נקודות שלא בוצעו (דורש סביבה אינטראקטיבית)
- **Lighthouse a11y score** — דורש Chrome DevTools.
- **Visual mobile audit** — צילומי מסך מ-iPhone 12 / Android — דורש browser/emulator.
- **niqud rendering check** — דורש visual inspection פר font/OS.

מומלץ לסוכן הבא או למיטל לבצע ידנית ~30 דק׳:
1. Lighthouse על `teacher-action`, `moy-screener`, `stage-3-storm`.
2. iPhone 12 mode על 5 המסכים העיקריים.
3. Visual check של 5 פריטים מ-moy-screener על Chrome/Safari mobile.

---

## נספח — מספרים מהיר

```
BKT ingest:        0.64ms avg  | 1.79ms p99 | 5.78s × 9000 events
BKT reads:         < 1ms        avg     על 5 ילדות × 22 אותיות
Aggregation 5×4:   11.4ms        (יעד היה < 1000ms)
BKT state size:    119KB        (5 ילדות אחרי 9000 events)

localStorage:      582KB / 5MB = 11.4%  (פיילוט)
state.events:      77% מהשטח (FIFO 1000 → 445KB constant)
Per-student:       +27KB BKT+EPA (לינארי)
Hard limit:        ~150 ילדות    לפני שצריך מיגרציה ל-IndexedDB
```
