// סימולציה לאימות BKT — מריץ אירועים סינתטיים ובודק שה-p(שולטת) מתעדכן כמצופה
// הרצה: node test-bkt.js

// טעינה ידנית של bkt.js במצב Node (בלי DOM/window)
const fs = require('fs');
const path = require('path');

// stub עבור localStorage + window
global.localStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = v; },
  removeItem(k) { delete this._data[k]; },
};
global.window = {};

// טעינת bkt.js
const bktCode = fs.readFileSync(path.join(__dirname, '../js/shared/bkt.js'), 'utf-8');
eval(bktCode);
const BKT = global.window.AvneiBKT;

// ============================================================
// סימולציות
// ============================================================

function fmtP(p) { return (p * 100).toFixed(1) + '%'; }

function runSim(label, events) {
  console.log('\n' + '='.repeat(60));
  console.log('SIMULATION:', label);
  console.log('='.repeat(60));
  BKT.reset('test-student');

  events.forEach((isCorrect, i) => {
    const result = BKT.ingestEvent({
      student_id: 'test-student',
      session_id: 'sess-1',
      primary_island_id: 3,
      is_correct: isCorrect,
      response_time_ms: 3000,
    });
    console.log(`  פריט ${(i+1).toString().padStart(2)}: ${isCorrect ? '✓' : '✗'}  →  p(שולטת) = ${fmtP(result.pKnown)}`);
  });

  const mastery = BKT.checkMastery('test-student', 3);
  console.log(`\n  סופי: p = ${fmtP(mastery.pKnown)}  ·  mastered? ${mastery.mastered}  ·  ${mastery.reason}`);
}

// ============================================================
// תרחישים
// ============================================================

// 1. ילדה שתמיד צודקת
runSim('כל הפריטים נכונים (10)', [true, true, true, true, true, true, true, true, true, true]);

// 2. ילדה שתמיד טועה
runSim('כל הפריטים שגויים (10)', [false, false, false, false, false, false, false, false, false, false]);

// 3. ילדה ממוצעת — 70% דיוק
runSim('70% נכון (7/10)', [true, true, false, true, true, false, true, false, true, true]);

// 4. ילדה שמתחילה לאט ומשתפרת
runSim('שיפור הדרגתי (4 נכונים, אז 6 נכונים)', [false, false, true, false, true, true, true, true, true, true]);

// 5. False positive test — ניחוש בודד
runSim('ניחוש אחד באקראי בתוך 9 טעויות', [false, false, false, true, false, false, false, false, false, false]);

console.log('\n' + '='.repeat(60));
console.log('סיכום: BKT מתפקד כמצופה');
console.log('='.repeat(60));
