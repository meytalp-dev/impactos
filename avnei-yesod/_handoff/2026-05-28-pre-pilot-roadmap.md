# Pre-Pilot Roadmap — אבני יסוד
## 28.5.2026 ערב · אחרי סגירת המסלול הראשון

> **המסלול הראשון נסגר היום (28.5):** המנועים חיים — BKT-per-strand · EPA · sub-BKT · cold-start · mastery משולש · Pack×BKT · Weakness Targeting · B.7 Interventions · MOY-Lite · MOY×B.7 link + UI · B.8 Intervention Matcher · F.21A teacher-rama (תצפית) · D.15 22/22 אותיות · E.17+E.18 דאטה.
>
> **המסלול הבא:** מתשתית קוד → פיילוט אמיתי עם כיתה אחת.

---

## 🎯 יעד סופי

פיילוט עם **כיתה אחת בכיתה א'** (4-5 ילדות, מורה אחת) שמייצר **data אמפירי** למחקר וכיול. צפי: ספטמבר 2026 (פעימה 1).

---

## 📊 מצב נוכחי — מה נשאר ב-tracker

### חוסם פיילוט (P0)
| משימה | סטטוס | תלוי ב |
|---|---|---|
| **B.9** Group Suggestion Engine | ⏳ סוכן 18 (מתוכנן) | B.7+B.8 ✓ |
| **F.21E** Action Dashboard | ⏳ ספק + קוד | B.7+B.8+B.9 |
| **תוכן ידני** (60 MOY + 40 packs + 5 scripts + 6 audio) | ⏳ פדגוגי | — |
| **Finding B** F5 TDZ refresh | 🟡 ניסיון לא פתר | חקירה |

### חוסם פיילוט מורחב (P1)
| משימה | סטטוס |
|---|---|
| **A.5 variants** (ח/נ imagePool, wrapping 3 אותיות) | ⏳ |
| **EOY Diagnostic** | ⏳ אחרי MOY content |

### Post-pilot (אחרי data)
- E.19 Calibration · B.10 3 תצוגות · D.16 איים 4-9 · F.20 3 island modes · F.21 Specialist Flag

---

## 🛤️ מסלול ב-5 שלבים

### שלב 1 — סגירת קצוות הקוד (1-2 שבועות · ~30-40 שעות)

| משימה | אומדן | מי | תלות |
|---|---|---|---|
| B.9 Group Suggester (סוכן 18) | L+ (8-12 שעות) | סוכן ייעודי | B.8 ✓ |
| F.21E spec | S (1-2 שעות) | מיטל | B.9 |
| F.21E code | L+ (12-15 שעות) | סוכן ייעודי | F.21E spec |
| Finding B real fix | S (1-2 שעות) | סוכן ייעודי | חקירה DevTools |
| A.5 Variants (אופציונלי לפיילוט) | M (6-8 שעות) | סוכן ייעודי + אישור מיטל פר אות | — |
| EOY spec + dummy items | S (2-3 שעות) | מיטל | MOY ✓ |

**סדר הפעלה מומלץ:** B.9 → F.21E spec → F.21E code (במקביל ל-Finding B fix). A.5 + EOY = אופציה לפני פיילוט או דחיה ל-post.

### שלב 2 — תוכן ידני (חוסם פיילוט · 1-2 שבועות · עיקר העבודה של מיטל)

| תוצר | מי | קצב |
|---|---|---|
| 60 MOY-Lite items (30 משימה 3 + 30 משימה 4) | ChatGPT → סוכן פדגוגי (Reviewer) → מיטל מאשרת → תזמורת כותבת ל-`engine/moy-items.json` | batches של 10 |
| 6 קטעי AvriNeural ל-MOY | מיטל מפיקה | 60-90 דק' |
| 40 packs items ל-`september-2026.json` | תזמורת כותבת metadata לפי D.15 (תוכן ש·ל·נ·א כבר קיים) | 15-30 דק' אחרי אישור |
| 5 scripts אינטרבנציה מעמיקים | מיטל + ChatGPT (expansion של templates של סוכן 9) | ~3-4 שעות פדגוגי |
| 7 packs planning (`{month}.json` בלי -2026) | החלטה: לדחוף או לעדכן sources_used קודם | 5-10 דק' |

### שלב 3 — בדיקת flow מלאה (2-3 ימים)

**E2E user journey לבדיקה:**
1. ילדה חדשה → onboarding-profile (פרופיל אורייני)
2. אי 3 — 22 אותיות עם sub-BKT
3. ינואר → MOY-Lite → fail במשימה 4
4. `state.assessments[sid].suggested_intervention` נשמר (B.8 matcher = phonological)
5. תלמידה 2 גם fail עם phonological → 3 ילדות → group banner מופיע
6. מורה לוחצת "פתחי קבוצת תמיכה" → modal של B.7
7. מבצעת intervention עם PDF print
8. סימון "✓ ביצעתי"
9. ילדות חוזרות ל-packs עם Weakness Targeting (b.7 letters)

**Verification מסכים:** onboarding · stage-3-* · moy-screener · teacher-rama · data-export · F.21E.
**Performance:** BKT עם 1000+ events · localStorage limits · mobile/RTL/accessibility.

### שלב 4 — Pilot Soft Launch (1-2 שבועות)

**דרישות (חיצוניות):**
- בית ספר אחד · כיתה א' אחת · 4-5 ילדות · מורה מאומנת · אישור הורים · בדיקת פרטיות (PIN sufficient?)

**מטרות מדידה:**
- D-effect size קריאה (BOY → end-of-pilot)
- שימוש מורה בכלי קבוצות
- enjoyment של ילדות (qualitative interviews)
- bugs דיווחו ב-flow

**data collection:**
- CSV export שבועי דרך `data-export.html`
- interviews של מורה (שבועי)
- screenshots של dashboard

### שלב 5 — Post-Pilot (מתי שיש data)

| משימה | אומדן |
|---|---|
| E.19 Calibration פר משימת ראמ"ה | L |
| TIER_THRESHOLDS חידוד מתוך data | S |
| WEAKNESS_THRESHOLD חידוד | S |
| B.10 שפת 3 תצוגות (מורה/הורה/מפקח) | S |
| F.20 3 island modes | S |
| F.21 Specialist Flag | M |
| D.16 איים 4-9 (סטרנד 1 + מורפולוגיה) | L+ |

---

## 🎯 מסלול קריטי לפיילוט אמיתי

```
B.9 (סוכן 18) → F.21E spec (מיטל) → F.21E code (סוכן ייעודי)
       ↓
תוכן ידני: 60 MOY + 6 audio + 5 scripts (במקביל)
       ↓
תוכן ידני: 40 packs items (תזמורת)
       ↓
Verification E2E (2-3 ימים)
       ↓
Pilot Soft Launch (כיתה אחת)
```

**Finding B + A.5 variants + EOY** — לא חוסמים פיילוט. ניתן לדחות ל-post-pilot.

---

## ❓ שאלות פתוחות לאישור מיטל

1. **B.9 (סוכן 18) — להפעיל עכשיו או מחר בבוקר?**
2. **F.21E spec — את תכתבי, או לפתוח סוכן ספק (כמו F.21A-spec)?**
3. **A.5 variants — לפני או אחרי פיילוט?** (אופציה: רק ח ו-נ לפיילוט, השאר post)
4. **EOY — בסקופ pre-pilot או post-pilot?**
5. **7 packs planning — לדחוף עכשיו או לעדכן sources_used קודם?**
6. **Finding B fix — דחוף או post-pilot?** (workaround: clear sessionStorage)
7. **Pilot operations** — מתי, איזה בית ספר, כמה ילדות? (decision חיצוני — לא טכני)

---

## 📋 Bootstrap לסוכן תזמורת בסשן הבא (29.5.2026 בוקר)

```
שיחה חדשה — סוכן תזמורת לאבני יסוד · 29.5.2026

מטרה: סוכן תזמורת ראשי לפרויקט "אבני יסוד". מיטל פלג מנהלת פיתוח.

קרא קודם:
1. _handoff/orchestrator-handoff-2026-05-28-day.md (בוקר 28.5)
2. _handoff/2026-05-28-pre-pilot-roadmap.md (ערב 28.5) ← זה
3. _handoff/agent-bootstraps.md (סוכנים 1-18+)
4. _handoff/agent-completion-log.md (סיכומים)
5. Memory (גלובלי):
   - feedback-avnei-yesod-teacher-language-simplicity
   - feedback-avnei-yesod-niqud-on-student-screens
   - feedback-avnei-yesod-cross-screen-navigation-uses-history-back
   - project-avnei-yesod-f21a-vs-f21e-split

סטטוס 29.5.2026:
- מסלול ראשון נסגר 28.5 — 13+ commits היום (סוכנים 8-17 + תזמורת)
- מסלול שני = Pre-Pilot (5 שלבים)
- B.9 (סוכן 18) — סטטוס תלוי בהפעלה 28.5 ערב או 29.5 בוקר

מיטל על המסך — חכה לשאלה.
```

---

## 🔚 לסגירת היום (28.5 ערב)

לפני סיום:
- [ ] B.9 (סוכן 18) — הפעלה עכשיו / מחר?
- [ ] Orchestrator commit אחרון — tracker (MOY ✅ verified) + agent-completion-log + roadmap הזה
- [ ] סוכן הפדגוגי של ChatGPT — נשאר רץ ברקע למחר

**יום מסיבי — 13+ commits.** המסלול הראשון נסגר. מתחילים pre-pilot מחר.

---

*Roadmap זה יכנס ל-orchestrator commit סוף יום (28.5 ערב) ויהווה referenceראשי לסוכן תזמורת בסשן הבא.*
