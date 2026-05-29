# Post-Pilot Review List — Loose Ends לבדיקה אחרי הפיילוט

> **למה הקובץ הזה:** דברים שעלו ב-29.5.2026 ערב שלא קריטיים לפיילוט אבל **חייבים להיבדק אחרי**. כל item כאן = "תזכורת מתועדת" — לא חוסם פיילוט אבל לא לשכוח.

---

## 1. october-2026.json — ✅ נסגר (parallel evolution · אין loose end)

### הקונטקסט
מיטל הפעילה בטעות 2 סוכני 23 במקביל ב-2 VS Codes שונים. הסוכן השני סגר את `october-2026.json` עם 4 edits נוספים (test 75/75 ✓).

### הגילוי (29.5.2026 לילה)
הסוכן השני בדק `git diff HEAD -- october-2026.json` → **ריק**. כלומר ה-4 edits שהוא חשב לעשות **כבר ב-origin** — הסוכן הראשון הגיע לאותן מסקנות עצמאית ב-commit `673b63e`. זה מקרה של **parallel evolution** — שני סוכנים מקבלים החלטות זהות בנפרד.

### Lesson learned
פדגוגית — שני agents עצמאיים שמגיעים לאותו תיקון = signal חזק שזה התיקון הנכון. ראה [[feedback-orchestrator-multi-vscode-parallel-pattern]].

### סטטוס
✅ **סגור** · אין פעולה נדרשת post-pilot.

---

## 2. vocab-bank.json — 8 מילים חדשות להוסיף

### הקונטקסט
ב-october-2026.json הסוכן השני (וגם הראשון) השתמש ב-מילים שלא ב-vocab-bank.json:

| אות | מילים | סטטוס |
|---|---|---|
| ז | זָהָב, זַחַל, זְבוּב | בסיסיות לכיתה א' |
| ה | הַר, הָדָס, יָם | בסיסיות |
| י | יָם | (כפילות מ-ה) |
| ו | וֶרֶד, וִילוֹן | ⚠️ בעייתיות — ו' לא טבעית כאות פותחת בעברית, אבל אלה ה-2 הנפוצות |

### מה לבדוק post-pilot
- [ ] עדכון `avnei-yesod/curriculum/vocab-bank.json` — להוסיף 8 המילים תחת `vocabulary_by_skill` או `vocabulary_consolidated`
- [ ] לוודא שכל המילים מנוקדות נכון לפי [[reference-hebrew-niqud-rules]]
- [ ] במידה ויש מילים נוספות שעלו ב-november/december/january packs — להוסיף גם אותן

### חשיבות
🟢 **נמוכה** — מילים מאומתות פדגוגית. רק תיעוד formal ב-vocab-bank.

---

## 3. עוד loose ends שעלו היום (29.5.2026)

### A. moy-items.json — 102 IPA → עברית (in progress · סוכן 26)
- ⏳ בעבודה: סוכן 26 שמיטל הפעילה ערב 29.5
- post-pilot review: לוודא שכל ה-22 mappings (IPA→עברית) בטבלת bootstrap סוכן 26 נכונים פדגוגית

### B. inclusion/* — פרויקט נפרד (system-10 pulse לטליה/מנח״י)
- 9+ קבצים untracked: pulse-questionnaire / pulse-dashboard / pulse-demo / HANDOFF-pulse-v3 / assets / וכו'
- **לא קשור לאבני יסוד פדגוגית.**
- post-pilot decision: repo נפרד / folder עליון / למחוק?

### C. _tmp_doc.txt + _tmp_doc.xml (root)
- stale files מimport קודם, untracked
- post-pilot: לבדוק תוכן + למחוק

### D. moy-screener.html — error fallback strings
- 2 strings תוקנו ל-ניקוד מלא (lines 486, 543). 
- post-pilot: לוודא שילדה אמיתית לא רואה את ה-errors הללו ברגיל שימוש (error states פנימיים).

### E. teacher-rama mobile UX (סוכן 24 audit)
- טבלה min-width:880px — מורה לא יכולה לתפעל בנוחות במובייל
- post-pilot decision: רידיזיין partial / הוראה רשמית "פתחי בלפטופ" / או הוספת תצוגת cards למובייל

### F. state.events appendEvent O(n²)
- per-event Logger cost = 4.66ms (פי 7 מ-BKT-only)
- post-pilot optimization: batch save פר 10 events במקום פר event יחיד
- חוסם רק ב-replay של 1000 events בבת אחת — לא בפעולה רגילה

### G. localStorage > 150 ילדות
- היום OK ל-5 ילדות (11% מ-5MB)
- 100 ילדות = 62% · 250 ילדות = 142% (חורג)
- post-pilot: מיגרציה ל-IndexedDB עם partition פר ילדה
- חוסם רק ב-scale של בית-ספר/רשת

### H. 22 stage-3 — 3 stale comments
- ayin/kaf/het — `// אות {זרה}` ב-script comments (copy-paste שלא נמחק)
- post-pilot cleanup: regex replace ב-3 קבצים. עלות אפסית. אין השפעה פונקציונלית.

---

## טבלת severity מסכמת

| # | item | severity | חוסם פיילוט? |
|---|---|---|---|
| 1 | october 4 edits | 🟡 בינונית | לא |
| 2 | vocab-bank +8 | 🟢 נמוכה | לא |
| 3.A | MOY IPA | 🔴 גבוהה | כן · in progress |
| 3.B | inclusion/* | 🟡 בינונית | לא |
| 3.C | _tmp_doc | 🟢 נמוכה | לא |
| 3.D | error fallback | 🟢 נמוכה | לא |
| 3.E | teacher-rama mobile | 🟡 בינונית | לא |
| 3.F | appendEvent O(n²) | 🟡 בינונית | לא |
| 3.G | localStorage > 150 ילדות | 🟢 נמוכה לפיילוט | רק ב-scale |
| 3.H | stage-3 stale comments | 🟢 נמוכה | לא |

**0 חוסמים פיילוט** (חוץ מ-MOY IPA שכבר בטיפול).

---

*קובץ מתחזק. סוכן תזמורת/פדגוגי שעובד post-pilot — לעבור על הרשימה הזו ולסמן ✓ כל item שטופל. להוסיף items חדשים בסיבובים.*
