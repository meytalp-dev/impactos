# מדריך הפעלה מקבילית — סגירת אבני יסוד לפיילוט

> **למיטל:** המסמך הזה מסכם את כל הסוכנים שאת יכולה להפעיל **במקביל** כדי לסגור את המערכת לפיילוט ספטמבר 2026. **7 סוכנים · 3 גלים · ~6-10 שעות עבודה אוטומטית · ~3-5 שעות עבודה שלך (operations + decisions).**

---

## 🎯 התמונה הגדולה

**מצב היום:** המסלול הראשון נסגר (תשתית). המסלול השני נסגר (Pre-Pilot). חסר:
- 5 חבילות עבודה טכניות (P0 + P1)
- 2 משימות חיצוניות שלך (AvriNeural + Operations)
- 2 החלטות פדגוגיות שלך (A.5 OPEN_QUESTIONs · inclusion repo)

---

## 🌊 גל 1 — להפעיל **עכשיו** (4 סוכנים במקביל · 4 VS Codes)

### ⭐ סוכן P21 — Interventions Deepening (פדגוגי · P0 חוסם פיילוט)

- **bootstrap:** [2026-05-29-interventions-deepening-pedagogical-agent-prompt.md](2026-05-29-interventions-deepening-pedagogical-agent-prompt.md)
- **סוג סוכן:** ChatGPT / Claude (לא Claude Code — תוכן פדגוגי, לא קוד)
- **מה הוא עושה:** מעמיק 5 קבצי `interventions/*.json` מ-`PARTIAL` (~800 chars) ל-`FULL` (~2000) עם examples_to_use · differentiation · troubleshooting
- **אומדן:** 3-4 שעות פר אישור פדגוגי שלך (5 קבצים)
- **conflict potential:** אפס (לא נוגע בקוד)
- **דורש ממך:** אישור פר-קובץ פדגוגי

### ⭐ סוכן 23 — 6 Packs Items (P1 — נחמד שיהיה לפיילוט, חוסם בהמשך)

- **bootstrap:** [2026-05-29-6-packs-items-agent-prompt.md](2026-05-29-6-packs-items-agent-prompt.md)
- **סוג סוכן:** Claude Code Opus 4.7
- **מה הוא עושה:** יוצר 6 קבצי pack (october-march) עם 40 items כל אחד · 240 items סה"כ
- **אומדן:** ~3-4 שעות עבודה אוטומטית
- **conflict potential:** אפס (קבצים חדשים בתיקיית packs)
- **דורש ממך:** אישור פר חודש (6 אישורים) + שאלה על year confusion (january-2026 או 2027)

### ⭐ סוכן 20 — Finding B Debug (P1 — UX אבל חוסם איכות לפיילוט)

- **bootstrap:** [2026-05-29-finding-b-debug-agent-prompt.md](2026-05-29-finding-b-debug-agent-prompt.md)
- **סוג סוכן:** Claude Code Opus 4.7
- **מה הוא עושה:** Debug ב-DevTools של הbאג TDZ ב-`teacher-rama.html` F5 refresh + תיקון
- **אומדן:** 1-2 שעות
- **conflict potential:** ⚠️ נוגע ב-`teacher-rama.html` — סוכן 1 סיים, **אבל לוודא ש-git fetch + status נקי לפני שמתחיל**
- **דורש ממך:** בדיקה ידנית של F5 אחרי תיקון (לא רק טסטים)

### ⭐ סוכן 24 — Performance Testing (P0 — חוסם פיילוט)

- **bootstrap:** [2026-05-29-performance-testing-agent-prompt.md](2026-05-29-performance-testing-agent-prompt.md)
- **סוג סוכן:** Claude Code Opus 4.7
- **מה הוא עושה:** stress test ל-9000+ events · localStorage limits · mobile responsive · RTL · accessibility
- **אומדן:** 5-7 שעות עבודה אוטומטית
- **conflict potential:** אפס (קריאה בלבד · קבצי test חדשים)
- **דורש ממך:** הסתכלות על report הסיום + הקצאת bandwidth לbugs קריטיים

---

## 🌊 גל 2 — להפעיל **אחרי גל 1** (3 סוכנים + 1 חיצוני)

### סוכן Verification E2E (P0 — חוסם פיילוט)

- **bootstrap:** [2026-05-29-verification-e2e-agent-prompt.md](2026-05-29-verification-e2e-agent-prompt.md)
- **למה אחרי גל 1:** דורש את כל ה-fixes של גל 1 (Finding B · performance) להיות מאומתים לפני שמריצים E2E מלא
- **סוג סוכן:** Claude Code Opus 4.7 + Playwright
- **אומדן:** 4-6 שעות
- **דורש ממך:** התקנת Playwright לראשונה (אם לא מותקן) + הסתכלות על failure reports

### סוכן A.5 Variants (P1 · אופציונלי לפיילוט)

- **bootstrap:** [2026-05-29-a5-variants-agent-prompt.md](2026-05-29-a5-variants-agent-prompt.md)
- **למה אחרי:** דורש 3 OPEN_QUESTIONs שלך **לפני הפעלה:**
  1. אות נ — מה זה "יש עוד על מה לעבוד"? פירוט.
  2. imagePool ל-נ/ו/צ — האם להוסיף 3 תמונות לכל (כמו ח)? איזה תמונות?
  3. wrapping ל-3 אותיות נוספות — איזה? (1 פר קבוצה: כוכבים · צדפים · דגים)
- **אומדן:** 4-6 שעות אחרי שתעני
- **conflict potential:** נמוך (data/island-03-letters/*.json + stage-3-*.html)

### סוכן EOY Spec (P0 לQ4 · לא חוסם פיילוט ספטמבר)

- **bootstrap:** [2026-05-29-eoy-spec-agent-prompt.md](2026-05-29-eoy-spec-agent-prompt.md)
- **למה אחרי:** post-pilot. אם רוצים EOY מוכן עד אפריל 2027 — אפשר לדחות.
- **סוג סוכן:** ChatGPT (spec בלבד, לא קוד)
- **אומדן:** 2-3 שעות פדגוגי + 1 שעת קוד אחר כך
- **המלצה:** **לדחות ל-post-pilot**, אלא אם כן רוצים מסלול ייעודי

### את — AvriNeural (P0 אופציונלי)

- **מה:** 6 קטעי MP3 ל-MOY (משימה 3 — passages)
- **אומדן:** 60-90 דק' בportal של Azure
- **אופציונלי:** Web Speech he-IL fallback עובד. עדיף איכות AvriNeural לפיילוט.

---

## 🌊 גל 3 — אחרי שכל הקוד נסגר (Operations · חיצוני)

### את — Pilot Operations

- בית ספר אחד (איזה?)
- כיתה א' אחת
- 4-5 ילדות
- מורה מאומנת
- אישור הורים (form)
- בדיקת פרטיות (האם PIN מספיק? לשאול את הbeit ספר)

### את — החלטה על `inclusion/` folder

- 7 קבצים untracked מפרויקט system-10 pulse
- **המלצה:** repo נפרד / folder עליון לא תחת avnei-yesod (לא קשור פדגוגית)

---

## 📊 לוח זמנים מוצע

```
היום (29.5 ערב):
  ✓ push 6 commits ל-origin
  ✓ הכנת bootstraps (זה — אני)

מחר (30.5 בוקר):
  🌊 גל 1 — את מפעילה 4 סוכנים ב-4 VS Codes
  → 9:00 — סוכן P21 (interventions)
  → 9:00 — סוכן 23 (6 packs)
  → 9:00 — סוכן 20 (Finding B)
  → 9:00 — סוכן 24 (Performance)
  → 12:00-15:00 — את עוברת על תוצרים פר אישור

30.5-31.5:
  🌊 גל 2 — Verification E2E + A.5 (אם תרצי)
  → את שולחת clarification של 3 ה-OPEN_QUESTIONs ל-A.5

1.6-3.6:
  🌊 גל 3 — Operations (בית ספר · מורה · הורים)
  → את: AvriNeural

שבוע 1.6-7.6:
  בדיקות ידניות אחרונות
  fixes לbugs מ-Performance/E2E

שבוע 8.6-14.6:
  Soft launch — שבוע 1 פיילוט עם הילדות
```

---

## 🚨 דגלים אדומים — שים לב

1. **גל 1 = 4 סוכנים במקביל.** ה-pattern עבד אתמול (סוכן 1 + 19), אבל **כל סוכן צריך לעשות `git fetch && git status` לפני שמתחיל**.
2. **Finding B = teacher-rama.html.** אם סוכן 1 שוב נכנס למסך הזה — conflict. ודאי שהוא סיים סופית לפני שמפעילה את 20.
3. **Performance Testing יכול לחשוף bugs קריטיים** שיחייבו עיכוב הפיילוט. תהיי מוכנה לקבל decisions.
4. **EOY = post-pilot.** אל תפעילי עכשיו אם זה מסיט focus.
5. **Interventions deepening (P21) הוא הקריטי ביותר** — בלי תוכן עמוק, ה-modal של B.7 לא משכנע פדגוגית למורה.

---

## ✅ צ'קליסט סגירת פיילוט

לפני soft launch:
- [ ] 5 interventions = FULL (סוכן P21 ✓)
- [ ] 40 items ספטמבר (סוכן 19 ✓ נסגר)
- [ ] Finding B נסגר (סוכן 20)
- [ ] Performance audit עבר (סוכן 24)
- [ ] E2E Playwright עובר (סוכן Verification)
- [ ] AvriNeural 6 קטעים (את · אופציונלי)
- [ ] בית ספר · כיתה · 4-5 ילדות (את · external)
- [ ] אישור הורים (את · external)
- [ ] מורה מאומנת על המערכת (את · external)
- [ ] CSV export נבדק (את — נסי לייצא + פתחי ב-Excel)

לאחר אישור הצ'קליסט → **soft launch** 🚀

---

## 🟡 לדחות ל-post-pilot

- EOY spec + items
- A.5 variants (אם לא קריטי)
- B.10 שפת 3 תצוגות
- F.20 3 island modes
- F.21 Specialist Flag
- D.16 איים 4-9
- post-pilot skill-unit adapters (vowel · word · morpheme · phon-skill)

---

*המדריך הזה מסכם את כל הפעולות הנדרשות לסגירת אבני יסוד לפיילוט. כל bootstrap מקושר. כל החלטה מתועדת. בהצלחה! 🌅*
