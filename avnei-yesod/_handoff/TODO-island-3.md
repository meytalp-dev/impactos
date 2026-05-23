# 🏝️ TODO — אי 3 (אלמוגי האותיות)

> **מסמך תיאום בין סוכנים.** מיטל מעדכנת. כל סוכן שנכנס לפרויקט אי 3 — קורא את זה תחילה.
>
> **עדכון אחרון:** 2026-05-23 · בסיום סבב המסך הראשי (stage-3-island.html)

---

## ארכיטקטורה מאושרת

**משחקון פר אות**, סדר חשיפה: **מ → ב → ר → ק → ת**
ראה: `[[project-avnei-yesod-pedagogy-one-game-per-letter]]` בזיכרון.

**מסך פתיחה של אי 3:** `stage-3-island.html` (אינדקס יחיד — 5 כרטיסים עם נעילה הדרגתית).
**נקודה במפה הראשית:** רק אחת — לאי 3 → stage-3-island.html.

---

## סטטוס מצב נוכחי

| # | אות | משחקון | קובץ | סטטוס | quest tracking |
|---|---|---|---|---|---|
| 1 | מ | הצדף הקסום | `stage-3-shell.html` | ✅ נבדק | ⚠️ fallback ל-souvenir |
| 2 | ב | הבית של נוני | `stage-3-house.html` | ✅ בנוי | ✅ markQuestCompleted('house') |
| 3 | ר | שביל החזרה | `stage-3-trail-resh.html` | ✅ בנוי | ⚠️ fallback ל-souvenir |
| 4 | ק | הצלת הדגים | `stage-3-rescue.html` | ✅ בנוי | ❌ אין souvenir + אין markQuestCompleted |
| 5 | ת | הסערה והאור | `stage-3-storm.html` | ✅ בנוי | ⚠️ fallback ל-souvenir |

---

## ✅ קבצים שהושלמו ומאושרים

- `stage-3-shell.html` (מ׳) — הצדף הקסום
- `stage-3-house.html` (ב׳) — הבית של נוני
- `stage-3-trail-resh.html` (ר׳) — שביל החזרה
- `stage-3-storm.html` (ת׳) — הסערה והאור
- `stage-3-rescue.html` (ק׳) — הצלת הדגים
- `stage-3-island.html` — מסך הפתיחה
- `map.html` — נקודה יחידה לאי 3

---

## 🔧 משימות פתוחות (לסוכנים)

### לסוכן הצדף הקסום (stage-3-shell.html)

**משימה:** הוסף קריאה ל-`markQuestCompleted('shell')` בסיום המשחקון.

**מיקום:** ב-`showCompletion()` או ב-`startFinale()`, לפני/אחרי `addSouvenir`.

**קוד לחיקוי** (מ-stage-3-house.html):
```js
function markQuestCompleted(questId) {
  try {
    const key = 'island3-quests:completed';
    const completed = JSON.parse(localStorage.getItem(key) || '[]');
    if (!completed.includes(questId)) {
      completed.push(questId);
      localStorage.setItem(key, JSON.stringify(completed));
    }
  } catch (e) {}
}
// ובסיום:
markQuestCompleted('shell');
```

**למה:** כרגע יש fallback ל-souvenir 'אלמוג אות זוהר' (עובד). אבל המנגנון העדכני הוא tracking מפורש.

---

### לסוכן שביל החזרה (stage-3-trail-resh.html)

**משימות:**
1. הוסף `markQuestCompleted('trail')` בסיום (כמו לעיל).
2. החלט: **stage-3-journey-resh.html** או **stage-3-trail-resh.html**? שניהם על ר' עם אותו souvenir. צריך **למחוק אחד מהם** או לאחד.
   - הקובץ הקנוני לפי island.html: `stage-3-trail-resh.html`.

---

### לסוכן הצלת הדגים (stage-3-rescue.html)

**משימות חובה:**
1. **הוסף `addSouvenir('...')`** בסיום — אין כרגע. הצע: `'להקת דגים זוהרת'` (מהטקסט בקובץ).
2. **הוסף `markQuestCompleted('rescue')`** בסיום (כמו לעיל).

**למה:** בלי אחד מהשניים, stage-3-island.html לא יזהה ש-ק' הושלמה והנעילה של ת' לא תיפתח.

---

### לסוכן הסערה והאור (stage-3-storm.html)

**משימה:** הוסף `markQuestCompleted('storm')` בסיום (כמו לעיל).

---

### ניקוי כללי (לכל סוכן עם הזדמנות)

- **stage-3-journey.html** (מ׳) — קובץ ישן, לפני שינוי הסדר הפדגוגי. **למחוק** אם אף סוכן לא צריך אותו.
- **stage-3-journey-resh.html** (ר׳) — כפילות של stage-3-trail-resh.html. **לבחור אחד ולמחוק את השני**.

---

## 🚫 אסור לעשות

- **לא להוסיף נקודות חדשות לאי 3 ב-map.html** — יש כבר נקודה אחת שמובילה ל-stage-3-island.html.
- **לא לשנות את הסדר הפדגוגי** במשתנה `QUESTS` ב-stage-3-island.html בלי להתייעץ עם מיטל.
- **לא לשנות אות של משחקון קיים** — אם מיטל החליטה ת' = storm, אסור לשנות לאות אחרת.

---

## 📝 איך לפתוח שיחה חדשה לבניית/תיקון משחקון באי 3

```
שלום! אני רוצה לעבוד על משחקון [שם] באי 3 (אות [X]).
תקרא:
1. avnei-yesod/_handoff/TODO-island-3.md (המסמך הזה)
2. [project-avnei-yesod-island-overview-screen] (מסך פתיחה)
3. [project-avnei-yesod-pedagogy-one-game-per-letter] (אות פר משחקון)
4. [project-avnei-yesod-island3-mem-lessons] (14 לקחים)
5. [avnei-yesod-support-levels] (1/2/3 טעויות)
6. [feedback-pil-crop-center-chatgpt] (תמונות)
ואז עבד **רק על הקובץ של המשחקון הזה** — לא לערוך map.html או stage-3-island.html.
```
