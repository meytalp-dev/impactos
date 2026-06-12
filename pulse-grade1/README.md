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
| [`system-10-pulse-spec.md`](system-10-pulse-spec.md) | **ה-spec הקנוני (v4, 8.6.2026)** — 4 פרסונות, 20 סעיפים. כעת כולל 20 ניסוחי שאלות תלמיד.ה (4 מאושרים + 16 טיוטה) עם הערות עריכה. **המסמך היחיד שצריך לקרוא.** |
| [`parent-consent-template.md`](parent-consent-template.md) | **טופס הסכמת הורים (טיוטה)** — 14 סעיפים + טופס חתימה + נספחי אבטחה. דורש review משפטי לפני שימוש. |
| [`extension-spec-formal.md`](extension-spec-formal.md) | היסטורי — ממוזג ל-v4 |
| [`extension-research-scaffold.md`](extension-research-scaffold.md) | היסטורי — בסיס המחקר, ההצדקות נכנסו ל-v4 סעיף 13 |
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

### מסכים — הורה (נבנו 8.6.2026)
| קובץ | מה |
|---|---|
| [`pulse-parent-monthly.html`](pulse-parent-monthly.html) | שאלון הורים חודשי — 5 פריטים + open text. תומך גם ב-`?mode=micro` למצב micro-pulse (שאלה אחת, slider 0-10). pre-fill שם ילד.ה מ-URL `?child=דניאל`. localStorage לחזרה. |

### מסכים — מנהלת (נבנו 8.6.2026)
| קובץ | מה |
|---|---|
| [`pulse-principal-dashboard.html`](pulse-principal-dashboard.html) | דשבורד מנהלת — 5 ווידג'טים (Hero+donuts, heatmap, movers, equity, interventions) + Tier 80/15/5 + alerts feed. שימוש ב-seed data לצורך demo. |

### מוקאפים נוספים (נבנו 10.6.2026)
| קובץ | מה |
|---|---|
| [`pulse-onboarding-mockup.html`](pulse-onboarding-mockup.html) | **מסכי כניסה ורישום** ל-4 הפרסונות בטאבים: מורה (אימייל+סיסמה + magic link) · תלמיד.ה (PIN מורה → שם+אמוג'י) · הורה (WhatsApp deep-link · ללא login) · מנהלת (אימייל+סיסמה + הזמנת מורות). |
| [`pulse-admin-mockup.html`](pulse-admin-mockup.html) | **אדמין** — 3 טאבים: מאגר פולסים (47 פולסים מסוננים פר קהל יעד, drill-down) · תובנות (6 תובנות auto-generated) · תרחישים → התערבויות (8/14 תרחישים עם 1-3 המלצות כל אחד מתוך 50 המתכונים). |
| [`pulse-system-handoff.html`](pulse-system-handoff.html) | **המדריך המלא לטליה** — קהלים, תדירויות, כניסה, פולסים, דשבורדים, התערבויות, תרחישים, פרטיות, השקה. בסוף יש כפתור גדול שמוביל למערכת החיה. |
| [`pulse-live-pilot.html`](pulse-live-pilot.html) | **המערכת החיה** — דף נפרד עם נתוני דמו עשירים: בית ספר "אבן ישראל", 4 כיתות א' (רינת, לירון, אופיר, עמית), 47 פולסים השבוע, פעילות אחרונה, 3 התראות פעילות, 4 כרטיסי כניסה לכל קהל עם פרטי משתמש מחובר, וכרטיס מיוחד לטליה + walkthrough של 8 שלבים. |

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
