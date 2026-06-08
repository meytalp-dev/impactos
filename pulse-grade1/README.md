# Pulse · רגשי-חברתי לכיתות א'-ב'

> **בעלות:** מיטל פלג / אימפקט.OS — פרויקט עצמאי.
> **סטטוס:** v4 (4 פרסונות) · בעבודה לקראת פיילוט 1.9.2026.
> **מיקום קנוני:** הקובץ הזה. **אין עוד ריפו נפרד.**

---

## למה זה כאן

לפני 8.6.2026 הפולס היה מפוצל בין שני ריפואים: `meytalp-dev/pulse-grade1` (פרטי, קוד התלמיד.ה) ו-`meytalp-dev/impactos/_handoff/` (הרחבות ל-4 פרסונות, קטלוג, מצגת). פיצול כזה גרם לבלבול בין סוכני Claude שונים — מי לא ידע איפה הקנוני, מה הוארכב בטעות וכו'.

**ההחלטה (8.6.2026):** הכל מוזג לכאן. ריפו `pulse-grade1` הפרטי מאורכב כ-read-only. כל עבודה עתידית מתבצעת בתיקייה הזו.

---

## מבנה התיקייה

### Specs (מסמכי איפיון)
| קובץ | מה |
|---|---|
| [`system-10-pulse-spec.md`](system-10-pulse-spec.md) | **ה-spec הקנוני (v3, 29.5.2026)** — פרסונת תלמיד.ה |
| [`extension-spec-formal.md`](extension-spec-formal.md) | **הרחבת v4 (3.6.2026)** — מורה + הורה + מנהלת. **טרם ממוזג ל-v3 spec.** |
| [`extension-research-scaffold.md`](extension-research-scaffold.md) | בסיס המחקר ל-v4 (5 sub-agents · 14 מקורות) |
| [`HANDOFF-pulse-v3.md`](HANDOFF-pulse-v3.md) | מסמך מעבר היסטורי של v3 |
| [`pulse-build-plan.md`](pulse-build-plan.md) | תכנית בנייה 22 שעות |

### מסכים — תלמיד.ה (עובד)
| קובץ | מה |
|---|---|
| [`pulse-questionnaire.html`](pulse-questionnaire.html) | **שאלון התלמיד.ה** — drag-נוני × 4 תחנות, 3 פנים, אודיו אוטומטי |
| [`pulse-summary.html`](pulse-summary.html) | מסך סיכום אחרי השאלון |
| [`pulse-demo.html`](pulse-demo.html) | landing דמו שיווקי |

### מסכים — מורה (חלקי)
| קובץ | מה |
|---|---|
| [`pulse-dashboard.html`](pulse-dashboard.html) | דשבורד מחנכת — Hero + 4 פסים + role-based (?role=) |
| [`pulse-teacher-form-mockup.html`](pulse-teacher-form-mockup.html) | mockup טופס דירוג מורה (8 פריטים × 25 ילדים) |
| [`onboarding.html`](onboarding.html) | onboarding למחנכת |

### מסכים — הורה / מנהלת (חסר)
שני המסכים האלה **עוד לא נבנו**:
- `pulse-parent-monthly.html` — 5 פריטים + micro-pulse, WhatsApp + IVR
- `pulse-principal-dashboard.html` — 5 ווידג'טים + 15 התראות + Tier 80/15/5

ה-spec שלהם חי ב-`extension-spec-formal.md` סעיפים 3.3-3.4.

### מצגות והצעה (להצגה ל-מנח״י / שותפים)
| קובץ | מה |
|---|---|
| [`pulse-product-presentation-v2.html`](pulse-product-presentation-v2.html) | **מצגת מוצר v2** — 4 הפרסונות, השאלות שלך |
| [`system-10-pulse.html`](system-10-pulse.html) | מצגת A4 קצרה לטליה/מנח״י |
| [`proposal-impact-os.html`](proposal-impact-os.html) + 3 וריאציות | הצעת חומש מלאה |
| [`partners-onepager.html`](partners-onepager.html) | דף-אחד לשותפים |
| [`concept-map.html`](concept-map.html) · [`inclusion-program-concept-map.mermaid`](inclusion-program-concept-map.mermaid) | מפות קונספט |

### Intervention Catalog (30 מתכוני התערבות + 115 דפי הדפסה)
[`intervention-catalog/`](intervention-catalog/) — 10 קטגוריות, INDEX עם מערכת המלצות פר טריגר, +115 דפי A4 ב-`printables/`.

### נכסים
- `assets/noni-*.png` — 5 איורים של נוני (תמנון סגול)
- `assets/audio/` — **14 קבצי MP3 של הילה** · **🔒 לא בגיט** (gitignored, מקומי בלבד)
- `screenshots/` — 5 צילומי מסך

### ארכיב היסטורי
[`_archive-superseded-by-v3/`](_archive-superseded-by-v3/) — 3 קבצים שאורכבו בצדק: 2 כפילויות שגויות של מסכי תלמיד.ה/הורה + bootstrap מיושן.

---

## העקרונות הקריטיים של v4 (אסור לשבור)

- **4 ממדים** (לא 5): 🟡 הסתגלות · 🌸 חברות · 💜 שפה רגשית + ויסות · 💚 שמחה ללמוד
- **תלמיד.ה:** drag-3-פנים יחיד, "על נוני" (לא על הילד.ה), אודיו אנושי מוקלט (לא TTS), שבועי
- **מורה:** טופס 8 פריטים, item-by-item anti-halo, דו-שבועי
- **הורה:** 5 פריטים חודשי + micro-pulse באמצע, WhatsApp + IVR fallback
- **מנהלת:** 5 ווידג'טים + 15 התראות + Tier 80/15/5
- **מזוהה** (לא אנונימי) · הרשאות מדורגות פר תפקיד · escalation Tier 1/2/3

---

## הסתייגות חוקית (חובה)

> זהו check-in רגשי-כיתתי, **לא** מבדק SEL מתוקף. ציונים אינדיבידואליים מצריכים triangulation (תצפית מורה + DESSA-mini + תצפית 2 שבועות) לפני כל החלטת התערבות. שימוש בפולס כעילה יחידה להפניית תלמיד.ה לחינוך מיוחד = שימוש שגוי שהמערכת לא תומכת בו.
