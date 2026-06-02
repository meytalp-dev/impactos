# Orchestrator Handoff — 2.6.2026 · סוכן תזמורת חדש (Post-Cloud)

> **למיטל:** העתיקי את כל מה שמתחת לקו `---` כפרומפט פתיחה לסשן Claude Code חדש (Opus 4.7 · 1M).

---

# שיחה חדשה — סוכן תזמורת לאבני יסוד · continuation מ-2.6.2026

## מטרה

סוכן תזמורת ראשי. תזמורת = אינטגרציה · push selective · תיאום בין סוכני קוד. **לא יוזמה פדגוגית עצמאית.**

## מצב פרויקט · 2.6.2026

### ☁️ Backend live ב-cloud (חדש מ-1-2.6)
- **Supabase project:** `impact-os-avnei-yesod` (`ynxfszmpoppqrqocewcs`) · EU Frankfurt · free tier
- **7 tables + RLS + 7 RPCs** פעילים (migrations 0001+0002)
- **4 teachers ב-auth + public.teachers:** מיטל פלג · לירון גולן · אופיר שטיינברג · עמית אביטבול
- **1 class · 4 students · 21 events** (test data)
- **dual-mode preserved:** `?presentation=1` / `?guest=1` עוקפים cloud, חיים על localStorage

### 🚀 Production deploy
- **URL:** https://impact-os.app/avnei-yesod/underwater-app/
- **Source:** `meytalp-dev/impactos` main (auto-deploy via GitHub Pages ~2 min על push)
- **HEAD:** `aff8033` (diagnostic logging on cloud target push)

### 🚧 WIP מקומי שמיטל יודעת עליו (לא לדרוס!)
- `avnei-yesod/underwater-app/teacher-rama.html` — M (widget "Today's Lesson" חדש שהיא מתחילה לבנות)
- `avnei-yesod/_handoff/2026-06-02-unified-teacher-dashboard-mockup.html` — Mockup שלה
- `avnei-yesod/_handoff/teacher-onboarding-message.md` — תבנית מוכנה אבל לא נשלחה עדיין

### 📊 מה ב-origin (live)

**איים פעילים:** 1·2·3·4·5·14 (5 הוסר זמנית מ-map כשb-bootstrap היה ב-pre-pilot, חזר ב-31.5)
**Studio Editor:** `teacher-studio.html` · wizard + preview + validator עם Pipeline real (32+7 tests ✓)
**Cloud Stack:** `teacher-login.html` · `teacher-setup.html` · `student.html?token=` · scoped dashboards

### 🔴 הראש הכואב — Dashboard מפוצל
מיטל **סגרה את היום** כי הדשבורד מורה מפוצל ל-3+ מסכים:
- `teacher-rama.html` (F.21A · תצפית ראמ"ה)
- `teacher-action.html` (F.21E · פעולת בוקר · מציג רק "דחיפויות")
- `teacher-rama-snapshot.html`
- ועוד

**Memory חובה לקרוא לפני המשך עבודה:** [[feedback-avnei-yesod-dashboards-fragmented]]

החזון של מיטל: **מסך אחד** עם תוכנית שנתית בצד · נושא היום (ניתן לשינוי) · תרגול ברירת-מחדל · רשימת תלמידות עם המלצה פר-תלמידה · 2 פעולות פר תלמידה. ראמ"ה = כפתור, לא דשבורד.

---

## הוראות עבודה לתזמורת

### לפני כל פעולה
1. `git fetch origin && git status`
2. `git log --oneline -10`
3. אם יש M ב-`teacher-rama.html` שלא ערכת → זה WIP של מיטל, **לא לדרוס**
4. בדוק שאין untracked files של סוכנים אחרים (`_tmp_doc.*`, `e2e/11-12-*`, וכו') בcommit שלך

### Tests-as-signal rule
- Tests עוברים + commit סלקטיבי + scope ברור → push בלי לשאול
- Decision pedagogical / mixed scope / unfamiliar deletes → לעצור ולשאול

### Anti-pattern: parallel evolution
2 סוכנים על אותו handoff = בזבוז. לבדוק לפני הפעלה ש-handoff עוד פתוח.

### אסור-לגעת בלי אישור פר-קובץ
**מסמכי-אם:**
- `architecture-mvp.md` · `pedagogy-integration-framework.md` · `literacy-grade1-2-yearly.md` · `llm-pitfalls.md`

**תוכן מאושר פדגוגית:**
- 5 קבצי `interventions/*.json`
- 60 פריטי `moy-items.json`
- 7 packs ב-`curriculum/packs/grade1-tashpaz/`
- 25 passages באי 14 (v2 מאושר)
- 61 מילים באי 5

**Infrastructure (additions only):**
- `js/shared/bkt.js` · `event-logger.js` · `state.js` · `skill-units.js` · `mastery-check.js`
- `js/shared/cloud-*.js` (חדש מ-2.6)
- `map.html` · stage-*.html

**WIP מקומי של מיטל:**
- `teacher-rama.html` (widget Today's Lesson)
- `2026-06-02-unified-teacher-dashboard-mockup.html`

**Demo path — לא לשבור:**
- `seed-demo.html` (5 dummy students)
- `?presentation=1` / `?guest=1` / `?skip-picker=1` ב-כל הקבצים
- `TEACHER_PIN='4521'` ב-teacher-action/rama (fallback ל-demo)

### Multi-VS-Code parallel pattern
- 2-3 סוכנים ב-VS Codes שונים, כל bootstrap עם רשימת אסור-לגעת מפורשת
- תזמורת אוספת push בסוף
- ראה [[feedback-orchestrator-multi-vscode-parallel-pattern]]

---

## Memory חובה — יטען אוטומטית

### Cloud + Pilot (חדש)
- [[project-avnei-yesod-pilot-4-teachers]] — 4 מורים, 5 ילדות, ההורים מקצים טאבלטים
- [[project-avnei-yesod-cloud-architecture]] — Supabase + dual-mode + RLS + token
- [[feedback-avnei-yesod-dashboards-fragmented]] — **🔴 מסך אחד מאוחד**

### דשבורד מורה + תוכן (קיים)
- [[feedback-avnei-yesod-teacher-language-simplicity]] — שפת "שורה תחתונה"
- [[feedback-avnei-yesod-niqud-on-student-screens]] — ניקוד מלא בכל מסך ילד.ה
- [[feedback-kid-block-letters-not-handwriting]] — Heebo בלבד
- [[feedback-avnei-yesod-partners-are-testers]] — UX polished מ-day-1 לשותפים
- [[reference-hebrew-niqud-rules]] — 9 כללי ניקוד
- [[reference-hebrew-bgd-kpt-dagesh-rule]] — ב/כ/פ דגש קל ב-CV

### Orchestrator (התזמורת)
- [[feedback-orchestrator-multi-vscode-parallel-pattern]]
- [[feedback-orchestrator-auto-push-when-safe]]

### Islands + content
- [[reference-avnei-yesod-island-build-checklist]] — **MUST READ** · 11 לקחים מאי 4
- [[feedback-avnei-yesod-noni-narrative-and-visuals-consistency]]
- [[project-avnei-yesod-f21a-vs-f21e-split]] — נכון רק להבנת ההיסטוריה. **עתיד = מאוחד**.
- [[project-moy-lite-item-structure]]

---

## קבצי handoff חיוניים

1. **`2026-06-02-day-1-cloud-orchestrator-summary.md`** — סיכום מקיף של כל הסוכנים + state
2. **`2026-06-02-unified-teacher-dashboard-mockup.html`** — Mockup של מיטל לdashboard מאוחד
3. **`2026-06-01-backend-cloud-migration-bootstrap.md`** — bootstrap של cloud (5 phases)
4. **`teacher-onboarding-message.md`** — תבנית למורים + הורים
5. **`agent-completion-log.md`** — log היסטורי של כל הסוכנים

---

## הצעד הבא — מסלול מומלץ

### Phase 1 — Dashboard מאוחד (הראש הכואב)
1. קרא את `2026-06-02-unified-teacher-dashboard-mockup.html` שמיטל יצרה
2. קרא את `feedback-avnei-yesod-dashboards-fragmented` (memory)
3. שאל את מיטל את התשובות לפני שמתחילים:
   - איזה מהדשבורדים הקיימים נהיה הבסיס (rama? action? חדש?)
   - איך לטפל ב-PIN gate הקיים (להוריד? לשמור ל-demo?)
   - איזה רכיבים מ-rama להעביר וfעות לכפתור "📊 מבחני ראמ"ה"?
4. רק אחרי תשובות — להתחיל בנייה

### Phase 2 — Quick fixes (בלי dashboard עיון)
- Pack 404 (`june-2026.json`) — 5-10 דקות
- Send-practice cross-device — אינטגרציה עם dashboard מאוחד

### Phase 3 — Operations
- שליחת `teacher-onboarding-message.md` ל-3 המורים
- בדיקת E2E מ-iPad של ילדה אמיתית

### אומדן זמן
- Dashboard מאוחד: 2-3 ימי-סוכן (תלוי במורכבות mockup)
- Quick fixes: ~1 שעה
- Operations: 1-2 שבועות (חיצוני)
- **soft launch: יעד נשאר ספטמבר 2026**

---

## Decisions פתוחות לתשומת לב מיטל

1. **Dashboard מאוחד** — Vision מסודר, ואז אישור על scope מינימלי לחזרה לעבודה
2. **Pack 404** — ליצור `june-2026.json` placeholder, או לעדכן `loadCurrentPack` fallback?
3. **שליחה ל-3 מורים** — מתי?
4. **Email Template ב-Supabase** — להעביר לעברית עכשיו או לדחות?

---

## כללי זהב

1. **לא להחליט פדגוגית עצמאית** — בספק לשאול את מיטל
2. **לא לדחוף ישירות ל-golanliron/impactso** — תמיד דרך fork (`meytalp-dev/impactos`)
3. **לא לעדכן מסמכי-אם** בלי אישור פר-קובץ
4. **commit סלקטיבי** — אסור `git add . / -A`
5. **לא לדרוס WIP של מיטל** — בדוק `git status` לפני edit
6. **Tests-as-signal לאישור push** — לפי [[feedback-orchestrator-auto-push-when-safe]]
7. **השתמש ב-presentation mode (`?presentation=1`)** כשמראה הdashboard ללקוחות
8. **לא להוסיף עוד קבצי `teacher-*.html` חדשים** — לפי החלטת מיטל ב-feedback-dashboards-fragmented

---

## דמואים מהירים — קישורים שמורים

- **מפה ראשית:** https://impact-os.app/avnei-yesod/underwater-app/map.html
- **Login מורה (cloud):** https://impact-os.app/avnei-yesod/underwater-app/teacher-login.html
- **Setup כיתה:** https://impact-os.app/avnei-yesod/underwater-app/teacher-setup.html
- **Student URL (token):** https://impact-os.app/avnei-yesod/underwater-app/student.html?token=XXX
- **Dashboard לדמו (`?presentation=1`):** https://impact-os.app/avnei-yesod/underwater-app/teacher-action.html?presentation=1
- **Supabase Dashboard:** https://supabase.com/dashboard/project/ynxfszmpoppqrqocewcs

---

## העלייה הבאה — אחרי שhe dashboard מאוחד

- D.16 — איים 6, 7, 8, 9 (post-pilot)
- E.19 — Calibration לפי data ראמ"ה אמיתית
- B.10 — שפת 3 תצוגות (מורה/הורה/מפקח)
- F.20 — 3 island modes
- F.21 — Specialist Flag
- אנגלית כיתה ז' — פרויקט מקביל (`english-chativa/` — סוכן אחר · לא לגעת)

---

*Handoff זה הוא ה-snapshot של 2.6.2026 בסוף יום cloud-migration. סוכן תזמורת חדש יחיל עליו continuation. הquick-summary המקיף ב-`2026-06-02-day-1-cloud-orchestrator-summary.md`.*
