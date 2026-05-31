# Phase 3 · Decisions Needed (סוכן ↔ מיטל)

> סוכן Phase 3 UI Refactor · english-chativa
> נפתח: 2026-05-30
> סטטוס: 1 החלטה ממתינה (#1) — סוכן ממשיך לפי הנחה הצהובה למטה עד אישור/שלילה

---

## #1 · Scope של "RTL → LTR refactor" (Phase 3A)

### מה נמצא בקוד המשוכפל

- **21 קבצי CSS** ב-`underwater-app/css/` — כולם RTL + תמטיים לעולם underwater (bubble · coral · noni · word-bubble · whispers · fish-schools · rescue-quest · etc.)
- **43 קבצי HTML** — כולם RTL · רובם `stage-3-{letter}.html` (alef · bet · gimel ... tav) שמתרגלים אות עברית ספציפית
- **21 קבצים shared JS** — חלקם relevant (audio, scaffolding, feedback) · חלקם hyper-specific (letter-targets · skill-units עם 22 sub-BKTs פר אות עברית)

### הבעיה

ה-bootstrap אומר "סרוק `css/*.css` ו-`*.html` והפוך RTL→LTR + Heebo→Inter".
**אבל:** אם אני עושה את זה literal — אני מבזבז ~8h על:

- תרגום `stage-3-alef.html` (אות עברית ספציפית) לאנגלית — אין משמעות פדגוגית
- שינוי `dir="rtl"→"ltr"` ב-`whispers.css` (סצנת לחישות מים) שלא משמשת ב-english MVP
- החלפת `Heebo` ל-`Inter` ב-`coral.css` שמייצג "אלמוג עם אות עברית" — visual primitive שאתה ממילא מחליפ.ה ב-Modern Editorial

**זה לא מתאים לשפת ה-bootstrap עצמה** — שאומרת מפורש:
> Companion = avatar קטן בפינה (לא Noni). Subtle micro-interactions.
> Modern Editorial vibe — לא ילדותי. Spotify Wrapped / Wordle aesthetic

האסטטיקה המבוקשת = החלפה של ה-visual primitives (bubble · coral · noni). לא תרגום שלהם.

### ההצעה (הנחת עבודה שאני ממשיך לפיה אלא אם תעצרי אותי)

🟡 **Pragmatic scope:**

| מה | פעולה | למה |
|---|---|---|
| `css/tokens.css` | **רענון מלא** — Inter, off-white, 4 Track colors | תשתית לכל המסכים החדשים |
| `css/components.css` | **leave as-is** (legacy) | bubble/coral/word-bubble = visual primitives שלא בשימוש ב-Modern Editorial |
| `css/student.css` חדש | **ליצור** | רכיבים חדשים: card · top-bar · progress-dots · option-pill · companion-avatar |
| 19 קבצי CSS אחרים (whispers, fish-schools, ...) | **leave as-is** (legacy) | scene-specific לאבני יסוד · לא רלוונטי ל-english MVP |
| `index.html` (welcome screen) | **לבחור: רענן או החלף** ב-student.html ישירות | התלמיד.ה ב-MVP פותח.ת `student.html`, לא `index.html` |
| 43 HTML `stage-*` | **leave as-is** (legacy) | Hebrew-letter-specific · לא בנתיב MVP |
| 21 shared JS | **רלוונטיים בלבד**: `audio.js` (3B) · אולי `feedback.js` · אחרים = legacy | sub-BKT לאותיות עבריות לא מתאים |

### אם תאמרי "לא — refactor הכל"

אני אבצע. אבל זה מוסיף ~6-8h ל-13-18h המוערכים → 19-26h סה"כ. וההשקעה ב-legacy stage-* קבצים שאינם בנתיב MVP מייצרת חוב טכני (קוד עברית שעובר רנדור חלקי באנגלית = יותר גרוע מ-Hebrew shipped).

### החלטה מבוקשת

- [ ] ✅ אשרי: Pragmatic scope (כפי שמתואר למעלה · אני ממשיך)
- [ ] 🔁 אני רוצה refactor מלא — תשקיע ב-stage-* גם
- [ ] 🗑️ אני רוצה למחוק את stage-* legacy לחלוטין מ-english-chativa/ (ולהשאיר רק את המינימום ל-MVP)

**ברירת המחדל שלי עד תגובה:** Pragmatic. אני ממשיך.

---

## #2 · UI Strings · אישור CSV (יבוא ב-Phase 3C)

לא נדרשת החלטה עכשיו — אני אפלוט CSV נפרד כש-Phase 3C נפתח (אם בכלל יש Hebrew strings ב-`student.html` החדש, שיהיה English-native מההתחלה).

---

## #3 · Welcome flow ל-MVP

האם מיטל פותחת:
- (a) `index.html` (welcome → onboarding → student) — דורש 3 מסכים מתורגמים
- (b) `student.html` ישירות (name modal בפעם ראשונה) — מסך 1 יחיד

**הנחתי (Pragmatic):** (b) — `student.html` עם name-modal בפעם ראשונה. אם תרצי flow מלא — נחזור ב-Phase 3F.
