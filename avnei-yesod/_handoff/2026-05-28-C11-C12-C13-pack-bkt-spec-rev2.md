# C.11 + C.12 + C.13 — Revision 2
## Pack × BKT Integration · 28.5.2026 ערב · revision של rev1

> **מה זה המסמך:** revision מהותי של ה-spec המקורי (`2026-05-28-C11-C12-C13-pack-bkt-spec.md`). שני שינויים פדגוגיים-ארכיטקטוניים שעלו מדיון עם מיטל בערב 28.5:
>
> 1. **Tier = רמה של אותו תוכן, לא תוכן שונה.** כל הילדות עובדות על אותו פאק (אותיות הפאק); ה-Tier מגדיר את **רמת התרגול** (מכניקה, complexity, scaffolding) — לא את ה-letters עצמן.
>
> 2. **Weakness Targeting Engine.** ב-פאקים מתקדמים (אוצר מילים, חיריק, מורפולוגיה), המערכת מעדיפה פריטים שמכילים אותיות חלשות מפאקים קודמים.
>
> **rev1 נשאר כהיסטוריה.** הקוד של סוכן 8 (`6d5a47d`) מבוסס על rev1. **לא לדרוס** — נדרש עדכון מקבל (C.12B) אחרי שסוכן 8 ידחוף.
>
> **תלויות שנסגרו:** A.1 ✓ · A.4 ✓ · A0.2 ✓ · D.14 ✓ · F.21A ✓ · `getLetterMasteryDistribution` ✓

---

## §1 — מה השתנה מ-rev1 → rev2

### 🔄 שינוי 1 — Tier = רמה, לא תוכן

**ב-rev1 (שגוי):**
```
Tier 1 (Basic): פריטי "review" של אותיות מאיים קודמים (מ/ק/ב/ר/ת/ד)
Tier 2 (Core): פריטים של 4 אותיות הפאק (ש/ל/נ/א)
Tier 3 (Advanced): + צירופים פשוטים
Tier 4 (Master): 30% חדש + 70% פריטי review מאיים קודמים
```

**ב-rev2 (נכון):**
```
פאק ספטמבר = ש · ל · נ · א — תוכן זהה לכל הכיתה

Tier 1 (Basic — פערים):       מכניקה: tap-all בלבד · 1 אות בכל סשן · audio prompts תכופים
Tier 2 (Core — חלקית):         מכניקות: tap-all + pick · 2 אותיות מעורבות
Tier 3 (Advanced — טובה):      מכניקות: pick + memory-pair · 4 אותיות + ניקוד
Tier 4 (Master — מצוינת):      מכניקות: memory-pair + sort-by-letter · 4 אותיות + מיקום + mixed
```

**עיקרון:** המורה מלמדת נושא (ש·ל·נ·א בספטמבר). **המערכת נותנת לכל ילדה רמה שונה ל-אותו תוכן.** כשמתגלה כשל — המערכת מענה **בתוך הפאק הנוכחי**, לא קופצת לחומר אחר.

### 🆕 שינוי 2 — Weakness Targeting Engine

**ב-rev1 (חסר):** אין מנגנון של "weaknesses עוברים בין פאקים".

**ב-rev2 (חדש):** Weak letters מספטמבר משפיעים על בחירת פריטים בפאקים הבאים.

**דוגמה:**
```
ספטמבר: פאק אותיות → נועה מסיימת:
  sub-BKT(מ) = 0.32 ← חלשה
  sub-BKT(ל) = 0.45 ← חלשה
  שאר האותיות > 0.70

נובמבר: פאק חיריק (תוכן חדש לחלוטין)
  weak_letters = AvneiBKT.getWeakLetters(noa_id) → [מ, ל, ר]
  
  המערכת בוחרת 70% מהפריטים שמכילים מ/ל/ר:
    "מָיִם" ✓ (מ)
    "לִיל" ✓ (ל)  
    "מָלֵא" ✓ (מ + ל!)
    "גִיר" ← 30% רגיל
↓
נועה לומדת חיריק — אבל בעיקר דרך מילים שמחזקות לה את מ/ל/ר
```

---

## §2 — ההחלטות הסגורות (rev2, מבוסס מחקר 28.5)

| # | פריט | החלטה | מקור |
|---|---|---|---|
| 1 | מבנה Tier | **Tier = רמה של אותו תוכן** (לא תוכן שונה) | החלטה פדגוגית של מיטל 28.5 ערב |
| 2 | Max weak letters לטרגט | **Top-3** הכי חלשות | Cowan 2001 + IES Foorman 2016 + Wanzek RTI meta |
| 3 | Threshold לחלשה | **p < 0.40** | מבוסס getLetterMasteryDistribution + נורמות |
| 4 | Min attempts לטרגוט | **5+** (למניעת רעש cold-start) | באנלוגיה ל-Confidence indicators |
| 5 | TARGETED_RATIO פר Tier | **30% / 70% / 75% / 70%** | Drill-Sandwich (MacQuarrie + Burns) + Cepeda 2008 |
| 6 | שדה ב-item | **`letters_involved`** (תיוג רחב — כל האותיות במילה) | החלטה ארכיטקטונית |
| 7 | מתי Weakness Targeting פעיל? | **אוטומטית** — אם BKT mature (יש מספיק היסטוריה) | פיילוט-friendly |

**ילדה ללא weak letters:** תרגיל רגיל, אין סינון (ברירת מחדל).
**שקיפות למורה:** רק כשלוחצת "פרטים" ב-Section 5 (ברירת מחדל).

---

## §3 — Pack Schema (rev2)

### 3.1 — מבנה מעודכן

```json
{
  "pack_id": "september-2026",
  "month": "ספטמבר",
  "month_index": 9,
  "year": 2026,
  "title": "אותיות בועות",
  
  "focus_mode": "letters",
  "primary_strand": 1,
  "letters_in_focus": ["ש", "ל", "נ", "א"],
  
  "allows_weakness_targeting": false,    // ← ספטמבר = פאק אותיות, אין weakness מקודם
  
  "tiers": {
    "1": { "name": "בסיסי", "items": [/* רמה הכי קלה של ש·ל·נ·א */] },
    "2": { "name": "ליבה", "items": [/* רמת ביניים של ש·ל·נ·א */] },
    "3": { "name": "מתקדם", "items": [/* רמה גבוהה של ש·ל·נ·א */] },
    "4": { "name": "מאסטר", "items": [/* רמה הכי מאתגרת של ש·ל·נ·א */] }
  }
}
```

```json
{
  "pack_id": "november-2026-hirik",
  "title": "חיריק",
  
  "focus_mode": "skill",
  "primary_strand": 1,
  
  "allows_weakness_targeting": true,     // ← מנובמבר ואילך: יש כבר היסטוריה מספטמבר
  
  "tiers": {
    "1": { "items": [/* 10 פריטי חיריק רמה בסיסית */] },
    "2": { "items": [/* 10 פריטי חיריק רמת ליבה */] },
    ...
  }
}
```

### 3.2 — שדה חדש: `allows_weakness_targeting`

- **`false`** — פאק זה לא מטרגט weak letters (לדוגמה: פאק האותיות הראשון). ה-bridge תתעלם מ-weak letters.
- **`true`** — פאק זה מטרגט. ה-bridge תפעיל את ה-engine.

ברירת מחדל: `false` (לבטיחות).

---

## §4 — Item Schema (rev2)

### 4.1 — שדה חדש חובה: `letters_involved`

```json
{
  "item_id": "pack11-t2-007",
  "tier": 2,
  "skill": "חיריק",
  "word": "מָיִם",
  "letters_involved": ["מ", "י"],        // ← חדש! כל האותיות הלא-ניקוד
  "letters_with_niqud": ["מָ", "יִ"],    // ← אופציונלי
  "mechanic": "tap-all",
  "rama_task_alignment": 5,
  "peima_target": 3
}
```

### 4.2 — חוקים

- `letters_involved` **חובה** בכל פריט בפאק עם `allows_weakness_targeting: true`
- שמות אותיות בעברית — לפי convention הקיים ב-`bkt.js` (22 אותיות: א-ת)
- ל-letters_with_niqud אין משמעות ב-bridge (רק תיעוד)

---

## §5 — Bridge API (rev2)

### 5.1 — שינויים ב-`pack-bkt-bridge.js`

**שיטה חדשה:** `selectItemsForStudent(studentId, packId)`

```js
function selectItemsForStudent(studentId, packId) {
  const pack = loadPack(packId);
  const { tier } = selectTierForStudent(studentId, packId);
  const items = pack.tiers[tier].items;

  // אם פאק לא מתיר targeting — חזרה לכל הפריטים
  if (!pack.allows_weakness_targeting) {
    return items;
  }

  // משוך top-3 weak letters
  const weakLetters = AvneiBKT.getWeakLetters(studentId, {
    threshold: 0.40,
    minAttempts: 5,
    max: 3
  });

  // אם אין weak letters — חזרה רגילה
  if (weakLetters.length === 0) {
    return items;
  }

  // סנן ל-2 קבוצות
  const targeted = items.filter(i =>
    i.letters_involved.some(l => weakLetters.includes(l))
  );
  const general = items.filter(i =>
    !i.letters_involved.some(l => weakLetters.includes(l))
  );

  // אחוז מטורגט פר Tier
  const ratio = TARGETED_RATIO[tier];

  // בנייה פר drill-sandwich:
  // X% מטורגטים, (1-X)% רגילים — מעורבבים
  const totalItems = items.length;
  const targetCount = Math.round(totalItems * ratio);
  const generalCount = totalItems - targetCount;

  // הגן על מקרה שאין מספיק פריטים מטורגטים
  const finalTargeted = shuffle(targeted).slice(0, targetCount);
  const finalGeneral = shuffle(general).slice(0, generalCount);
  
  // מערבב לפי drill-sandwich (לא רק מצמיד)
  return interleaveDrill(finalTargeted, finalGeneral);
}
```

### 5.2 — שיטה חדשה ב-`bkt.js`

**הוספה ל-`bkt.js`:**

```js
AvneiBKT.getWeakLetters = function(studentId, options = {}) {
  const { threshold = 0.40, minAttempts = 5, max = 3 } = options;
  const dist = getLetterMasteryDistribution(studentId);
  
  return Object.entries(dist)
    .filter(([letter, data]) => 
      data.pKnown < threshold && data.attempts >= minAttempts
    )
    .sort((a, b) => a[1].pKnown - b[1].pKnown)  // מהחלשה ביותר
    .slice(0, max)
    .map(([letter]) => letter);
};
```

### 5.3 — Constants חדשים ב-bridge

```js
const WEAKNESS_THRESHOLD = 0.40;
const MIN_ATTEMPTS_FOR_WEAK = 5;
const MAX_WEAK_LETTERS_TARGETED = 3;
const TARGETED_RATIO = {
  1: 0.30,   // Tier 1 — מתחילים, פחות מטורגט (להימנע overload)
  2: 0.70,   // Tier 2 — drill-sandwich
  3: 0.75,   // Tier 3 — יותר מאתגר
  4: 0.70    // Tier 4 — drill-sandwich קלאסי
};
```

---

## §6 — שינויים נדרשים ב-קוד הקיים של סוכן 8 (C.12B)

הקוד שסוכן 8 כתב (`pack-bkt-bridge.js`) **לא** כולל את המנגנון הזה. עדכון נדרש:

### 6.1 — `getItemsForStudent` → `selectItemsForStudent`
- שינוי שם הפונקציה
- הוספת לוגיקת weakness targeting

### 6.2 — שדה חדש ב-packs קיימים
- `september-2026.json` של סוכן 8 — צריך `allows_weakness_targeting: false`
- `january-2026.json` של סוכן 8 — צריך `allows_weakness_targeting: false` (פאק 2, עדיין לא מתורגל)
- פאקים עתידיים (נובמבר+) — `true`

### 6.3 — Item Schema
- כל item ב-packs קיימים — צריך `letters_involved` (נכון לעכשיו: 0 פריטים מתויגים)
- ב-dummy packs ספטמבר — `letters_involved: [letter]` (האות בלבד, אין מילה)
- ב-pack חיריק עתידי — `letters_involved` הוא מערך מילים שלמות

### 6.4 — Tier model
**חשוב!** הקוד של סוכן 8 כנראה הניח Tier=תוכן. צריך לבדוק:
- האם `tier.items` הוא array של אותיות אחרות (rev1) או אותו תוכן ברמות שונות (rev2)?
- אם rev1 — צריך revision של ה-dummy packs

---

## §7 — מקורות מאומתים (מ-Weakness Targeting research)

- **Cowan 2001/2010** — Working memory capacity (children 6-7 = 3-4 chunks)
- **IES Foorman 2016** — Foundational Reading Skills, "up to 3 foundational skills"
- **Wanzek RTI meta** — 1-2 primary skills, max 3 closely related
- **MacQuarrie / Burns / Wright** — Incremental Rehearsal, ratio scaffolding
- **Cepeda et al. 2008** — Distributed practice meta-analysis
- **Drill-Sandwich Pattern** — 70/30 ratio empirically validated
- **Bjork desirable difficulties** — interleaving for retention
- **בר-און / Share / Ravid** — Hebrew-specific reading recommendations

**🟡 verification-pending:**
- ציטוטים ספציפיים לעמודי PDF (Foorman, Cowan, MacQuarrie) — תקצירי Perplexity בלבד
- empirical Hebrew niqud — אין מחקר ספציפי לרמה הזו

---

## §8 — סדר עבודה לסוכן 8B (אחרי שסוכן 8 ידחוף)

1. עדכון `bkt.js` — הוספת `getWeakLetters`
2. עדכון `pack-bkt-bridge.js` — שינוי `getItemsForStudent` ל-`selectItemsForStudent` + constants
3. עדכון `_schema.md` — Item schema עם `letters_involved`
4. עדכון `validate-pack.js` — בדיקת `letters_involved` בכל item
5. עדכון `september-2026.json` + `january-2026.json` — `allows_weakness_targeting: false`
6. בדיקות חדשות ב-`test-pack-bridge.js`:
   - Weakness targeting פעיל רק כשמותר
   - Top-3 selection עובד
   - TARGETED_RATIO פר Tier
   - drill-sandwich interleaving
   - ילדה ללא weak letters → קבלה רגילה

**אומדן:** 4-6 שעות ל-C.12B (פחות מ-C.12 המקורי כי התשתית קיימת)

---

## §9 — Tier model מעודכן — הסבר פדגוגי

### מה השתנה ב-Tier:
- **rev1:** Tier כתת-מודלים של תוכן (T1=אותיות קודמות, T2=הפאק)
- **rev2:** Tier כתת-מודלים של רמה (T1=פשוט, T4=מאתגר; אותו תוכן)

### דוגמה ספציפית (פאק ספטמבר, אות ש):

| Tier | פריטים אופייניים | מכניקה | תוכן |
|---|---|---|---|
| 1 | 5 בועות שלכולן ש (no distractors) | tap-all | רק ש בודדת |
| 2 | 5 בועות, 3 עם ש ו-2 עם ל | tap-all + pick | ש + 1 distractor |
| 3 | 6 קלפי memory: ש-שֶׁמֶש · ל-לָבָן · נ-נְמָלָה | memory-pair | ש בתוך מילים |
| 4 | 6 בועות: 3 "אות ש" + 3 "אות ם" → לסנן לפי הוראה | sort-by-letter | ש + הבחנה מ-ם |

### לוגיקה פר ילדה:

- **שירה** (sub-BKT(ש)=0.18, cold) → Tier 1 ב-ש (basic)
- **נועה** (sub-BKT(ש)=0.62) → Tier 3 ב-ש (memory-pair)
- **מאיה** (sub-BKT(ש)=0.92) → Tier 4 ב-ש (sort + discrimination)

כולן עובדות על ש — בעוצמה מותאמת. **המערכת מתחת מנהלת את הטעינה הקוגניטיבית** לפי CLT.

---

## §10 — מה זה לא בסקופ (rev2)

- ❌ Sub-tier-per-letter (ילדה ב-Tier 3 ב-ש אבל Tier 2 ב-ל) — אם נדרש, יהיה C.12C עתידי
- ❌ אינטרבנציה אוטומטית (B.7) על weak letters — זה ב-spec של B.7 הנפרד
- ❌ EOY-Lite (פאקים פעימה 3) — אחרי MOY
- ❌ Auto-classification של letters_involved — manual tagging בלבד

---

## §11 — מבוטל מ-rev1

- ❌ `items_distribution: { new: 0.3, review: 0.7 }` ב-Tier 4 — לא רלוונטי (Tier = רמה, לא תוכן)
- ❌ `type: "review"` בפריט — לא רלוונטי (כל הפריטים שייכים לפאק הנוכחי)
- ❌ `source_letter` בפריט — לא רלוונטי (אין אותיות מאי קודמים בפאק)
- ❌ `source_island` בפריט — לא רלוונטי

---

*— סוף rev2. סוכן 8B יבנה לפי המסמך הזה, אחרי שסוכן 8 ידחוף את rev1.*

**גרסה:** 2.0 · **כתב:** סוכן תזמורת (Claude Opus 4.7) · **תאריך:** 28.5.2026 ערב · **אישרה:** מיטל פלג (7 החלטות + מחקר Weakness Targeting מ-6 שאילתות Perplexity מאומתות)
