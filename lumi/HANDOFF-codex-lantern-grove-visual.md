# משימת קודקס · העיצוב של Lantern Grove / Recognize
מנה קצרה, טהורה-ויזואלית. הלוגיקה, המדידה, החיווט והבדיקות — **כבר בנויים ועובדים** (Claude). אתה מעצב **נגד חוזה קפוא**. אל תיגע בקוד JS.

---

## 0. מה כבר קיים ועובד (אל תבנה מחדש)
- מכניקת Lantern Grove Recognize חיה, מחווטת למנוע, על 5 מילות Pets (dog/cat/fish/bird/rabbit).
- מדידה נקייה (two-tap fix): נגיעה ראשונה=בחירה · נמדד פעם אחת · replay נפרד · טעות→מצב-למידה שלא מוזן ל-BKT · נעילה בזמן האודיו הראשוני. **16/16 בדיקות עוברות.**
- 🟢 **כל הנכסים כבר נחתו, נגזרו לשקיפות (rembg) וחוברו ב-baseline עובד** — 7 מצבי לומי (מגיבים!) · רקע חורשה מלא-מסך · פנס · 5 חיות. **אמנות אמיתית כבר על המסך.** תפקידך = **ליטוש**, לא בנייה מאפס. ראה `tests/screenshots/lg-REAL-*.png`.
- הפעלה/תצוגה: פותחים בדפדפן את
  `lumi/app/lantern-grove.html?qa=lantern` — מסך recognize בודד לעיצוב.
  `?qa=lantern&autoplay=1` — רץ עד מצב success. `?auto=1&warm=1` — המסע המלא.

## 0.1 מה נשאר לך ללטש (ה-baseline עובד, זה הליטוש)
- **כוריאוגרפיית החשיפה** — כרגע החיה פשוט מתבהרת. עצב את ה"עלייה מהפנס" (§6 revealing→success).
- **מצב idle** — כרגע החיה נראית גם כבויה; דאג שהיא באמת "מוסתרת/עמומה" עד הבחירה.
- **מיקום/גודל מדויקים** של לומי + הפנסים + `.lg-animal` בתוך הפנס (כרגע `inset:14% 16% 20%` — כוונן).
- **ה-scrim** (`.lg-bg`) והקומפוזיציה מול הרקע העשיר · **תנועה** (§13) · הכפתור `.target-btn`.
- מסיחי-אובייקטים (star/cup) עדיין אימוג'י — אופציונלי להחליף.

## 1. הקובץ היחיד שאתה עורך
✏️ **`lumi/app/css/lantern-grove.css`** — כרגע שלד מכוער בכוונה. הפוך אותו למוצר: soft-3D storybook, עומק, זוהר חם, מובייל, אנימציות קצרות.
(מותר גם להוסיף `@font-face`/keyframes באותו קובץ. אם חייבים token חדש — `tokens.css`.)

## 🚫 אסור לגעת (JS + לוגיקה)
`lumi/app/js/**` כולו — במיוחד `mechanics/_measured-core.js`, `mechanics/lantern-grove-recognize.js`, `engine.js`, `bkt.js`, `resolve-practice.js`, `data.js`, `tests/**`. השמות והמבנה שם מזינים את ה-CSS שלך; שינוי JS ישבור את החוזה והבדיקות.

---

## 2. החוזה הקפוא — עצב נגד הסלקטורים והערכים האלה בדיוק
ה-JS מחליף את הערכים; אתה מלביש כל מצב.

### סצנה
`.lg-grove[data-phase]` → `prompting` · `awaiting` · `revealing` · `success` · `retry`
- `.lg-bg` — רקע החורשה (§3 בבריף האמנות: `grove-bg.png`/WebP, עומק בשכבות).

### דמות Lumi
`.lumi-companion[data-mood]` → `idle · listening · pointing · curious · happy · celebrate · try-again`
- הערכים **תואמים 1:1** לשמות `lumi-*.png`. ההטמעה: `background-image` פר `[data-mood]`, **אותו גודל ועיגון בכולם** (בלי קפיצה), crossfade קצר מותר.
- כרגע יש placeholder SVG בתוך `.lc-figure` — החלף אותו ב-PNG והסתר את `.lc-figure`.

### פנס (× 3)
`.lg-lantern[data-state]` → `idle · active · revealing · success · retry · hint · dimmed`
שכבות בתוך כל פנס (כולן קיימות, ריקות — צבע אותן):
- `.lg-glow` — הילת האור (כבה ב-idle, דולק ב-active/revealing/success).
- `.lg-shell` — קליפת הפנס (`lantern-shell.png`).
- `.lg-animal[data-animal="dog"]` — החיה (בחר PNG לפי `data-animal`; הסתר את האימוג'י שבפנים).
- `.lg-glass` — ברק/זכוכית מעל.

מיפוי התנהגות המצבים (מה כל state צריך לשדר):
| state | משמעות | דגש עיצובי |
|---|---|---|
| idle | פנס כבוי, ממתין | חיה מעומעמת, בלי הילה |
| active | נבחר/מאורז בלמידה | מתרומם קלות, הילה מתחילה |
| revealing | נחשף | גדל, הילה מתחזקת, חיה מוארת |
| success | תשובה נכונה | הכי מואר, חיה מלאה, ניצוץ |
| retry | טעות (עדין!) | **בלי אדום, בלי X** — ריצוד רך בלבד |
| hint | רמז לתשובה | הילה קוראת, פועם עדין |
| dimmed | לא-נבחר | דהוי ברקע |

## 3. מפת נכסים (drop-in) — כשמיטל תביא מ-GPT
`lumi/app/assets/character/lumi/lumi-<mood>.png` → `.lumi-companion[data-mood="<mood>"]`
`lumi/app/assets/worlds/lantern-grove/lanterns/lantern-shell.png` → `.lg-shell`
`lumi/app/assets/animals/pets/<animal>.png` → `.lg-animal[data-animal="<animal>"]`
`lumi/app/assets/worlds/lantern-grove/backgrounds/grove-bg.png` → `.lg-bg`
עד שהם מגיעים — placeholders מסומנים כבר במקום; אל תציג placeholder כסופי.

## 4. חובות מהבריף שהם באחריותך
- **מובייל אנכי** 390×844 (+360/430/768). אזור הקשה ≥ 56px. אין גלילה תוך-משחק.
- **`@media (prefers-reduced-motion: reduce)`** — לבטל קפיצות, fade קצר, בלי לפגוע בהבנת המצב. (יש שלד — הרחב.)
- **בלי אימוג'י במסך הסופי · בלי טקסט אנגלי לילד** (האנגלית היא רק אודיו).
- כפתור ה-replay `.target-btn` (👂) — עצב אותו **בולט וברור** (§6: replay נפרד מהבחירה). כרגע כמעט בלתי-נראה.
- זוהר/ניצוצות/שביל — CSS (לא נכס). `LumiFx.sparkle` כבר יורה ב-success; אפשר לעצב את `.spark`.
- פלטה: רק `--lumi-*`/`--lg-*` (§7). בלי ניאון/כהה-מפחיד.

## 5. הרפרנס להשוואה
אם תייצרו `lumi/app/assets/references/lantern-grove-target-{idle,active,success}.png` — השווה מולם.
צילומי skeleton נוכחיים: `lumi/app/tests/screenshots/lg-0{1,2}-*.png`.

## 6. תנאי קבלה לפאס העיצובי שלך
נראה כמו עולם משחק (לא 3 כרטיסים) · לומי עקבי מ-PNG · 3 פנסים ברורים כאפשרויות · הילד מבין בלי לקרוא · אין אימוג'י/אנגלית סופיים · מובייל בלי גלילה · reduced-motion עובד · אין שגיאות קונסול · הבדיקות עדיין 16/16 (הרץ `lumi/app/tests/lantern-grove.test.html`).
