# Bootstrap — הוספת שקופית למצגת מנח״י

> **למיטל:** העתיקי כל מה שמתחת לקו `---` ושלחי לסוכן שצריך להוסיף שקופית למצגת.

---

# שיחה חדשה — הוספת שקופית למצגת avnei-yesod-manhi-impact

## ההקשר

המצגת `avnei-yesod-manhi-impact.html` חיה ב-repo של לירון (`golanliron/impactso`). יש לי (מיטל) **fork** של ה-repo ב-`meytalp-dev/impactso` שמשמש כ-staging area לפני שמעדכנים את לירון.

**אסור לדחוף ישירות ל-`golanliron/impactso`.** כולם עובדים על ה-fork שלי, ובסוף בעלת ה-pitch (לירון) מאשרת batch אחד.

## משימה

לבנות slide חדש (אחת) שמתאים לעיצוב הקיים של ה-deck, להוסיף אותה לפני `thanks-slide`, ולשלוח PR ל-`meytalp-dev/impactso`.

## 5 צעדים

### 1. Clone של ה-fork

```bash
cd /c/Users/meyta/Downloads/
git clone https://github.com/meytalp-dev/impactso.git impactso-work
cd impactso-work
```

### 2. ליצור branch חדש

```bash
git checkout -b add-slide-<TOPIC>
# למשל: add-slide-pricing · add-slide-roadmap · add-slide-pilot
```

### 3. עריכת הקובץ

הקובץ: `site/avnei-yesod-manhi-impact.html`.

**a. ה-CSS** — הוסף לפני `</style>` עם prefix scope ייחודי שלך:

```css
/* ============ MY SLIDE — scoped to .ms-N ============ */
.ms-N .something { ... }
```

prefixes שכבר תפוסים — אסור לחזור:
- `.ec-*` — English Chativa (slide 23)

**b. ה-HTML** — הוסף `<section>` חדש **מיד לפני** `<section class="slide thanks-slide"`:

```html
<section class="slide" data-slide="N">
  <div class="slide-shell">
    <div class="slide-head">
      <div>
        <div class="kicker">קטגוריה</div>
        <h2 class="slide-title">כותרת. <span class="accent">חלק מודגש.</span></h2>
        <p class="lede">פסקה מסבירה ב-2-3 משפטים.</p>
      </div>
      <div class="slide-num">N</div>
    </div>
    <!-- תוכן השקופית -->
    <div class="footer-note">N / TOTAL</div>
  </div>
</section>
```

**c. עדכן את `thanks-slide`** ל-`data-slide="N+1"` וfooter-note ל-`(N+1) / (N+1)`.

### 4. Commit + push

```bash
git add site/avnei-yesod-manhi-impact.html
git -c user.email="<email>" -c user.name="<name>" commit -m "slide N: <topic> — <שורה>"
git push origin add-slide-<TOPIC>
```

### 5. PR ל-fork של מיטל

```bash
gh pr create \
  --repo meytalp-dev/impactso \
  --base main \
  --head meytalp-dev:add-slide-<TOPIC> \
  --title "slide N: <topic>" \
  --body "תיאור התוכן + screenshots/mockups שהוספת."
```

**שלח את ה-PR URL למיטל ל-review.**

## כללי עיצוב (design system)

הקובץ מוגדר עם CSS variables. השתמש בהן בלבד:

| Token | מה |
|---|---|
| `var(--grad)` | gradient signature (Indigo→Violet→Magenta) |
| `var(--ink)`, `var(--ink-2)`, `var(--slate)`, `var(--muted)` | טקסט (מהכי כהה לבהיר) |
| `var(--white)`, `var(--paper)`, `var(--paper-2)`, `var(--line)` | רקעים |
| `var(--r-sm)`, `var(--r-md)` | border-radius |
| `var(--sh-1)`, `var(--sh-2)`, `var(--sh-3)` | shadows |

**Classes זמינים** (השתמש בהם בלי scope):
- `.kicker` `.slide-title` `.accent` `.lede` (header)
- `.card` `.card.tinted` `.card.dark` (cards generic)
- `.metric-value` `.metric-label` `.metric-desc`
- `.flow` `.flow-step` `.flow-num`
- `.compare` `.compare-col`
- `.pill` `.pill.alt` `.pill.warn`
- `.quote-panel`

לכל דבר ייחודי — prefix שלך `.ms-N` או `.<your-topic>-*`.

## אסור (kill switches)

- ❌ לדחוף ישירות ל-`golanliron/impactso` — אין הרשאה, וגם אם הייתה — יוצר מיש-מש.
- ❌ לערוך CSS משותף (`.card`, `.lede` בלי prefix) — תשבור slides אחרים.
- ❌ לשנות מספור של slides קיימים — רק להוסיף בסוף.
- ❌ לערוך את `thanks-slide` content (רק `data-slide` ו-`footer-note`).
- ❌ לחבר את ה-slide באמצע ה-deck — תמיד **לפני** `thanks-slide`.

## כש-PR נפתח ל-fork

מיטל:
1. Review את ה-PR ב-browser
2. אם בסדר → Squash and merge ל-main של ה-fork
3. אם יש שינויים — מעדכנת איתך
4. כש-3-4 slides הצטברו → היא פותחת PR יחיד מ-`meytalp-dev:main` ל-`golanliron:main`

## הצעד הבא לסוכן

1. הצג למיטל את הנושא של ה-slide שאתה הולך להוסיף (2-3 משפטים).
2. אחרי אישור — clone, branch, work, PR.

---

*Bootstrap זה הוא ה-onboarding לסוכן יחיד שמוסיף slide למצגת. ראה גם SOP כללי: `_handoff/2026-05-30-presentation-slide-coordination-SOP.md`.*
