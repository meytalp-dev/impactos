# Pack JSON Schema — C.11 + C.13

**גרסה:** 1.0 · **תאריך:** 28.5.2026 · **משימה:** C.11 (Pack schema) + C.13 (Item tagging)

> מסמך זה מתעד את ה-schema הרשמי של Pack JSON ב-`curriculum/packs/grade1-tashpaz/*.json`.
> Pack = יחידת תוכן חודשית (11 פאקים בשנת תשפ"ז, ספט-יוני, ללא יולי-אוג).
>
> **שים לב:** קיימים ב-`grade1-tashpaz/` גם 7 פאקים מגרסה מוקדמת (`september.json`, `october.json`, ...) שהם **"תוכנית-על"** עם `strand_intensity` ו-`letters_of_the_week`. שני ה-schemas חיים זה לצד זה:
> - `<month>.json` — planning (high-level, אישרה מיטל 25.5)
> - `<month>-<year>.json` — execution (Pack × Tier × items, C.11 — 28.5)

---

## §1 — מבנה כללי

```
{
  pack_id, month, month_index, year,
  title, description,

  focus_mode,           // "letters" | "strand"
  primary_strand,       // 1-5
  letters_in_focus,     // אם letters: ["ש","ל","נ","א"]; אם strand: null
  strand_breakdown,     // אם strand: object; אם letters: null

  tiers: {
    "1": { name, description, target_population, items[] },
    "2": { name, description, target_population, items[] },
    "3": { name, description, target_population, items[] },
    "4": { name, description, target_population, items_distribution, items[] }
  },

  metadata: { rama_task_alignment, peima_target, created_at, author, schema_version }
}
```

---

## §2 — שדות חובה ברמת ה-Pack

| שדה | סוג | הסבר |
|---|---|---|
| `pack_id` | string, unique | מזהה ייחודי (לדוגמה `september-2026`) |
| `month_index` | int 1-12 | חודש קלנדרי (1=ינו, 9=ספט) |
| `year` | int | שנה קלנדרית (2026) |
| `focus_mode` | enum | `"letters"` או `"strand"` |
| `primary_strand` | int 1-5 | הסטרנד הראשי שעליו ה-Pack מבוסס |
| `letters_in_focus` | array \| null | **חובה** אם `focus_mode=letters` |
| `strand_breakdown` | object \| null | **חובה** אם `focus_mode=strand` |
| `tiers` | object | חייב להכיל 4 keys: `"1"`, `"2"`, `"3"`, `"4"` |

### 2.1 — `focus_mode: "letters"`

מקרה ספט-נוב — אותיות נלמדות בודדות.

- `letters_in_focus`: array של תווים בעברית (1-22 איברים)
- `strand_breakdown`: `null`

### 2.2 — `focus_mode: "strand"`

מקרה דצמ-יוני — אין אותיות חדשות, יש סטרנדים מתקדמים (מודעות לשונית, הבנת הנקרא וכו').

- `letters_in_focus`: `null`
- `strand_breakdown`:
  ```json
  {
    "skills": ["מודעות פותח/סוגר", "הברות", "פונמות"],
    "weight_per_skill": {
      "מודעות פותח/סוגר": 0.4,
      "הברות": 0.4,
      "פונמות": 0.2
    }
  }
  ```
  סכום המשקלים חייב להיות 1.0.

---

## §3 — מבנה Tier

```json
"1": {
  "name": "בסיסי",
  "description": "חזרה על אותיות מאי קודמים",
  "target_population": "פערים משמעותיים (p<0.3)",
  "items": [ ... ]
}
```

### 3.1 — שדות חובה ב-Tier

| שדה | סוג | הסבר |
|---|---|---|
| `name` | string | שם בעברית (בסיסי / ליבה / מתקדם / מאסטר + חיזוק) |
| `description` | string | תיאור קצר של ה-tier |
| `target_population` | string | פרסונת היעד (p<0.3 וכו') |
| `items` | array | רשימת פריטים. מינימום 1, מקסימום ~50 (אין סף מערכת) |

### 3.2 — Tier 4 בלבד: `items_distribution`

```json
"items_distribution": { "new": 0.3, "review": 0.7 }
```

חייב להסתכם ל-1.0. תקין במידה והפאק כולל גם פריטי `type:review`. אם אין `review` ב-Tier 4 — השדה רשות.

### 3.3 — TIER_THRESHOLDS (לא בקובץ, אלא ב-`pack-bkt-bridge.js`)

```
p < 0.30        → Tier 1
0.30 ≤ p < 0.60 → Tier 2
0.60 ≤ p < 0.85 → Tier 3
p ≥ 0.85        → Tier 4
```

ספים אלה נחשפים ב-`AvneiPackBridge.TIER_THRESHOLDS` (קריאה בלבד · יוכוילו בפיילוט).

---

## §4 — מבנה Item (C.13)

```json
{
  "item_id": "pack9-t2-001",
  "tier": 2,
  "type": "new",
  "letter": "ש",
  "skill": "מודעות פותח/סוגר",
  "mechanic": "tap-all",
  "source_letter": "מ",
  "challenge": "with-niqud",
  "rama_task_alignment": 1,
  "peima_target": 1
}
```

### 4.1 — שדות חובה בפריט

| שדה | סוג | הסבר |
|---|---|---|
| `item_id` | string, unique | מזהה ייחודי בתוך הפאק (`pack{N}-t{tier}-{seq}`) |
| `tier` | int 1-4 | חייב להתאים ל-key של ה-tier בפאק (`tiers["2"].items[i].tier === 2`) |
| `type` | enum | `"new"` או `"review"` |
| `mechanic` | enum | `"tap-all"` \| `"pick"` \| `"memory-pair"` \| `"sort-by-letter"` |
| `rama_task_alignment` | int 1-10 | למשימת ראמ"ה הפריט תורם (מ-A0.2) |
| `peima_target` | int 1-3 | פעימה רלוונטית (מ-A0.2) |

### 4.2 — שדות מותנים

| שדה | מתי חובה | הסבר |
|---|---|---|
| `letter` | אם `focus_mode=letters` ו-`type=new` | האות (תו עברי בודד, חייב להיות ב-`letters_in_focus`) |
| `skill` | אם `focus_mode=strand` | המיומנות (חייב להיות ב-`strand_breakdown.skills`) |
| `source_letter` | אם `type=review` | אות מאי קודם (לא חייב ב-`letters_in_focus`) |

### 4.3 — שדות אופציונליים

| שדה | סוג | הסבר |
|---|---|---|
| `challenge` | string | `"with-niqud"` וכו' — מודיפיירים למכניקה |

---

## §5 — Manual tagging vs Auto-classification

**ההחלטה ב-C.13:** כל פריט מקבל `tier` ידנית ע"י כותב התוכן (מיטל / צוות פדגוגי). אין auto-classification של פריטים לטיר.

**רציונל:** Tier הוא **החלטה פדגוגית** — לא תוצאה מתמטית מהתוכן. אותה אות יכולה לחיות ב-Tier 1 (חזרה) או Tier 4 (מאסטר עם distractors מורכבים) — ההבדל הוא ב-context, scaffolding ו-mechanic, לא בתוכן.

**auto-classification = post-pilot.** אם נראה שכותבי תוכן מבזבזים זמן על תיוג ידני, נעבור ל-classifier מבוסס heuristics.

---

## §6 — Validation

הרצה:
```bash
node avnei-yesod/underwater-app/scripts/validate-pack.js september-2026.json
```

**בדיקות:**
1. Pack-level: כל השדות הנדרשים קיימים
2. `focus_mode` קיים והוא אחד מ-`letters`/`strand`
3. אם `letters`: `letters_in_focus` array לא ריק
4. אם `strand`: `strand_breakdown` עם `skills` ו-`weight_per_skill` שמסתכמים ל-1.0
5. `tiers` כולל את 4 ה-keys (`"1"`-`"4"`)
6. Tier 4: אם יש `items_distribution`, סכום = 1.0
7. כל item:
   - `tier` תואם ל-parent (item ב-`tiers["2"].items` חייב `tier:2`)
   - `mechanic` ב-{tap-all, pick, memory-pair, sort-by-letter}
   - אם `letters` ו-`type=new`: `letter` ב-`letters_in_focus`
   - אם `strand`: `skill` ב-`strand_breakdown.skills`
   - אם `type=review`: `source_letter` חייב להיות מוגדר
   - `rama_task_alignment` ו-`peima_target` קיימים

יציאה:
- `exit 0` אם תקין
- `exit 1` אם יש שגיאות, עם רשימה מסודרת

---

## §7 — דוגמאות חיות

ראה את 2 ה-dummy packs:
- `september-2026.json` — `focus_mode: "letters"`, 4 אותיות בועות (ש·ל·נ·א), `primary_strand: 1`
- `january-2026.json` — `focus_mode: "strand"`, 3 מיומנויות פונולוגיות, `primary_strand: 1`

שתיהן רשומות תקפות לפי ה-schema, ועוברות `validate-pack.js`.

---

## §8 — היחס לפאקים ה-"planning" הקיימים

ב-`curriculum/packs/grade1-tashpaz/` יש גם:
- `september.json` · `october.json` · `november.json` · `december.json` · `january.json` · `february.json` · `march.json`

אלה **פאקי-תוכנית** (pre-execution) שמיטל אישרה ב-25.5. הם מתעדים:
- `strand_intensity` (אחוזי זמן פר סטרנד)
- `letters_of_the_week` (תכנון רב-שבועי)
- `alignment_to_kesem_vehaverim` (התאמה לחומרי מטח)
- `intervention_eligibility` (אילו אינטרבנציות רלוונטיות)
- `benchmark_alignment` (יעדי ראמ"ה)

הם **לא תחליפים** לפאקי ה-execution החדשים (`<month>-2026.json`). היחס:
- planning packs = "מה ילדים אמורים לדעת בסוף החודש" (מטרות)
- execution packs = "מה מקבלת ילדה X בכל סשן, לפי ה-BKT שלה" (אופן הגעה)

`pack-bkt-bridge.js` קורא רק ל-execution packs. ה-planning packs נשארים כתיעוד פדגוגי.

---

**מסמך זה נכתב ע"י סוכן 8 בעת ביצוע C.11+C.12+C.13 (28.5.2026).**
**מקור-אם:** `_handoff/2026-05-28-C11-C12-C13-pack-bkt-spec.md` §3 + §5.
