# SOP — הוספת שקופית למצגת מנח״י של לירון

> **מתי להשתמש בזה:** כל פעם שסוכן צריך להוסיף שקופית למצגת `avnei-yesod-manhi-impact.html` ב-repo של לירון (`golanliron/impactso`).
>
> **למה זה צריך SOP:** כל הסוכנים עורכים **את אותו קובץ HTML**. בלי תיאום = merge conflicts בבטוח.
>
> **התזמורת:** מיטל. כל הסוכנים שולחים PR לא ללירון, אלא **ל-fork של מיטל**.

---

## ארכיטקטורת התיאום

```
                                                            (1 PR מאוחד)
   סוכן A → PR ──┐                                                      ↓
                  ├──→ meytalp-dev/impactso (fork)  ───→ golanliron/impactso (לירון)
   סוכן B → PR ──┤      main branch · all slides            main branch · merge יחיד
                  │
   סוכן C → PR ──┘
```

**העיקרון:** סוכנים לא נוגעים ב-repo של לירון ישירות. מיטל מאחדת ב-fork, ואז עושה PR אחד ללירון.

---

## ה-fork של מיטל

- URL: `https://github.com/meytalp-dev/impactso`
- כבר קיים (יצרתי ב-30.5.2026 לטובת PR ראשון של English Chativa).
- Branches: `main` (תואם ל-upstream) + `english-chativa-summary-slide` (slide 23 — pending merge).

---

## תהליך לסוכן יחיד (5 שלבים)

### 1. Clone של ה-fork (לא של לירון!)

```bash
cd /c/Users/meyta/Downloads/
git clone https://github.com/meytalp-dev/impactso.git impactso-work
cd impactso-work
git remote add upstream https://github.com/golanliron/impactso.git
git fetch upstream main && git merge upstream/main  # סנכרון לאחרון של לירון
```

### 2. ליצור branch חדש פר slide

```bash
git checkout -b add-slide-<TOPIC>
# דוגמאות: add-slide-pricing · add-slide-roadmap · add-slide-customer-stories
```

### 3. עריכת הקובץ

**איפה להוסיף את ה-CSS:** בתוך `<style>...</style>`, **מיד לפני `</style>`**, עם prefix scope ייחודי:

```css
/* ============ MY SLIDE — scoped to .my-slide-N ============ */
.my-slide-N .something { ... }
```

הprefixes שכבר תפוסים:
- `.ec-*` — English Chativa (slide 23)
- כל הפסחים האחרים — לוודא לא תפסת כבר.

**איפה להוסיף את ה-section HTML:** **מיד לפני `<section class="slide thanks-slide"`** (השקופית האחרונה). השתמש ב-`data-slide` סודר.

```html
<section class="slide" data-slide="N">
  <div class="slide-shell">
    <div class="slide-head">
      <div>
        <div class="kicker">...</div>
        <h2 class="slide-title">... <span class="accent">...</span></h2>
        <p class="lede">...</p>
      </div>
      <div class="slide-num">N</div>
    </div>
    <!-- content -->
    <div class="footer-note">N / TOTAL</div>
  </div>
</section>
```

**עדכן `thanks-slide`** ל-data-slide+1 וfooter-note.

### 4. Commit + push ל-fork (לא ללירון)

```bash
git add site/avnei-yesod-manhi-impact.html
git -c user.email="<email>" -c user.name="<name>" commit -m "slide N: <topic> — <one line>"
git push origin add-slide-<TOPIC>
```

### 5. פתיחת PR ל-fork של מיטל

```bash
gh pr create \
  --repo meytalp-dev/impactso \
  --base main \
  --head meytalp-dev:add-slide-<TOPIC> \
  --title "slide N: <topic>" \
  --body "תיאור..."
```

**שים לב:** `--repo meytalp-dev/impactso` (לא golanliron!).

---

## מה התזמורת (מיטל) עושה

### בכל פעם שסוכן סיים PR ל-fork:

1. **Review** את ה-PR ב-`meytalp-dev/impactso`.
2. **Merge** ל-`main` של ה-fork (Squash and merge recommended).
3. אם יש conflict עם slide קודם — לתקן (התזמורת = single ownership של ה-numbering).
4. שמירת רשימה של slides שכבר נוספו (טבלה למטה).

### כשרוצים לדחוף הכל ללירון:

1. וודאי שכל ה-PRs המקומיות (ב-fork) מוזגו.
2. בdok על fork main — `data-slide` numbers רציפים, thanks-slide בסוף עם המספר הנכון.
3. PR יחיד ללירון:
   ```bash
   gh pr create \
     --repo golanliron/impactso \
     --base main \
     --head meytalp-dev:main \
     --title "presentation update: N new slides" \
     --body "סקירה..."
   ```
4. לירון מאשרת בקליק אחד.

---

## טבלת מעקב slides שנוספו

| # | Slide | סוכן | branch ב-fork | PR ל-fork | status |
|---|---|---|---|---|---|
| 23 | English Chativa summary | התזמורת | `english-chativa-summary-slide` | `meytalp-dev/impactso#1` | ✅ MERGED ל-fork main (30.5.2026) |
| ?? | (slide הבא) | ? | ? | ? | ⏳ pending |

## עדכון 30.5.2026 — אסטרטגיה: batch only

מיטל בחרה: **כל ה-slides ב-batch אחד ללירון**.
- PR ראשון ללירון (`golanliron/impactso#1`) נסגר 30.5.2026.
- slide 23 כבר merged ל-`meytalp-dev:main` של ה-fork.
- כשעוד 2-3 slides הצטרפו ל-fork main → PR מאוחד ללירון.

---

## אסטרטגיות merge ללירון — מתי כל אחד

| אסטרטגיה | מתי |
|---|---|
| **Individual PR ללירון** (כמו עכשיו עם slide 23) | אם slide יחיד דחוף · אם לא צופים עוד slides בקרוב |
| **Batch PR ללירון** (דרך fork) | אם 2+ סוכנים עובדים במקביל · רוצים לחסוך עומס מלירון |

**ההמלצה הכללית:** Batch. לירון מקבלת PR אחד מאוחד כל שבוע-שבועיים, ולא 5 PRs נפרדים.

---

## אסור (kill switches)

- ❌ סוכן לא דוחף ישירות ל-`golanliron/impactso` — אין לו הרשאה, ואם היה — יוצר merge nightmare.
- ❌ סוכן לא ממזג PRs של סוכנים אחרים — רק התזמורת ממזגת.
- ❌ סוכן לא מעלה `data-slide` של slide קיים — רק מוסיף בסוף.
- ❌ סוכן לא משתמש ב-CSS classes שלא scoped — `.card`, `.lede` של ה-deck יעודכנו בלי scope = collision.
- ❌ סוכן לא מעדכן את `thanks-slide` content (רק data-slide ו-footer-note).

---

## דוגמת bootstrap לסוכן

> השתמש בעקרונות ה-SOP הזה. clone fork של מיטל (`meytalp-dev/impactso`), branch חדש `add-slide-<TOPIC>`, צור slide N (אחרון לפני thanks), עדכן thanks ל-N+1, push לfork, PR ל-`meytalp-dev:main` (לא ל-golanliron!). שם prefixed CSS scope ייחודי. שלח לי את ה-PR URL כשמסיים.

---

*SOP זה נכתב 30.5.2026 כדי לאפשר עבודה מקבילה של סוכנים על מצגת אחת בלי conflicts.*
