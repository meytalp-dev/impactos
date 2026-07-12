/* ============================================================================
 * pulse-cloud.js — שכבת-דאטה לפולס (רווחה חברתית-רגשית · מסלול מנהלת · גל 2)
 * ----------------------------------------------------------------------------
 * מודול helpers טהור + טוען יחיד. לא מאתחל Supabase ולא עושה auth-gating בעצמו —
 * צורכים אותו *אחרי* PrincipalCloud.init() / TeacherCloud.init(), שכבר נותנים
 * supabase client + רשימת students. RLS (מיגרציה 0008) קובע מה יחזור:
 *   מורה  → פולס תלמידי-כיתתה · מנהלת → פולס כל בית-הספר.
 *
 *   const ST   = await PrincipalCloud.init();          // או TeacherCloud.init()
 *   const rows = await PulseCloud.loadForStudents(ST.supabase, ids);
 *   const byS  = PulseCloud.perStudent(rows);          // {sid: {avg, level, byDim…}}
 *   const dims = PulseCloud.schoolDims(byS);           // {dim: {mean, level, n}}
 *
 * ציר-הרגש (level) משתלב בציר-הלמידה (TeacherCloud.rama) ל"מבט משולב".
 * ========================================================================== */
(function () {
  'use strict';

  // ---- מטא-דאטה של הממדים (מקור: pulse-questionnaire DIMENSIONS) ----
  // id זהה למפתח ב-answers. label/icon בשפת מסכי-המנהלת (principal-pulse).
  var DIMENSIONS = [
    { id: 'adjust',  label: 'הסתגלות לכיתה', short: 'הסתגלות', icon: 'leaf',      color: '#F2B844', bg: '#FCEFD9', fg: '#9C6212' },
    { id: 'friend',  label: 'חברוּת וקשרים', short: 'חברוּת',  icon: 'handshake', color: '#E08FAF', bg: '#FBEBF2', fg: '#B05A86' },
    { id: 'emotion', label: 'ויסות רגשי',    short: 'ויסות',   icon: 'heart',     color: '#8B6BC0', bg: '#EEEBF8', fg: '#6A59B8' },
    { id: 'joy',     label: 'שמחה בלמידה',   short: 'שמחה',    icon: 'star',      color: '#5BC0A8', bg: '#DDF3EC', fg: '#2E7A66' }
  ];
  var DIM_IDS = DIMENSIONS.map(function (d) { return d.id; });
  var DIM_BY_ID = {};
  DIMENSIONS.forEach(function (d) { DIM_BY_ID[d.id] = d; });

  // ---- מיפוי ניקוד (1-3, גבוה=טוב) → רמת-רווחה ----
  // 3 = הפנים העליונות (חיובי) · 1 = התחתונות. סף שמרני: לא מתייגים ילד.ה על סמך רעש.
  function level(avg) {
    if (avg == null) return { cls: 'new',   label: 'טרם נאסף פולס' };
    if (avg >= 2.4)  return { cls: 'ok',    label: 'פנוי.ה רגשית' };
    if (avg >= 1.8)  return { cls: 'watch', label: 'לתשומת לב' };
    return              { cls: 'care',  label: 'זקוק.ה להקשבה' };
  }

  // ---- טעינה: pulse_responses עבור קבוצת תלמידים (RLS מסנן לפי תפקיד) ----
  async function loadForStudents(supabase, ids) {
    if (!supabase || !ids || !ids.length) return [];
    var res = await supabase.from('pulse_responses')
      .select('student_id, respondent, cycle, answers, taken_at')
      .in('student_id', ids)
      .order('taken_at', { ascending: false })
      .limit(8000);
    if (res.error) throw res.error;
    return res.data || [];
  }

  // ---- אגרגציה פר-תלמיד.ה ----
  // מכל התשובות של הילד.ה לוקחים את *המחזור האחרון* (taken_at המקסימלי) פר respondent,
  // וממצעים את הממדים. כך פולס-מורה/הורה מעדכן, לא מצטבר לאורך כל השנה.
  // מחזיר {sid: {avg, level, byDim:{dim:score}, lastAt, respondents:[…], hasData}}
  function perStudent(rows) {
    var out = {};
    // הכי-חדש קודם (כבר ממוין desc); לכל sid — התשובה הראשונה שנראית פר respondent.
    var seen = {};  // sid → {respondent → true}
    (rows || []).forEach(function (r) {
      var sid = r.student_id;
      if (!out[sid]) out[sid] = { byDimSum: {}, byDimN: {}, lastAt: null, respondents: [], _seen: {} };
      var o = out[sid];
      // דלג אם כבר לקחנו תשובה עדכנית יותר מאותו respondent (רק המחזור האחרון קובע)
      if (o._seen[r.respondent]) return;
      o._seen[r.respondent] = true;
      o.respondents.push(r.respondent);
      if (!o.lastAt || r.taken_at > o.lastAt) o.lastAt = r.taken_at;
      var ans = r.answers || {};
      DIM_IDS.forEach(function (dim) {
        var v = ans[dim];
        if (typeof v === 'number') {
          o.byDimSum[dim] = (o.byDimSum[dim] || 0) + v;
          o.byDimN[dim]   = (o.byDimN[dim] || 0) + 1;
        }
      });
    });
    // סיכום: ממוצע פר-ממד + ממוצע כללי + רמה
    Object.keys(out).forEach(function (sid) {
      var o = out[sid];
      var byDim = {}, all = [];
      DIM_IDS.forEach(function (dim) {
        if (o.byDimN[dim]) {
          var m = o.byDimSum[dim] / o.byDimN[dim];
          byDim[dim] = m; all.push(m);
        }
      });
      var avg = all.length ? all.reduce(function (a, b) { return a + b; }, 0) / all.length : null;
      out[sid] = {
        byDim: byDim,
        avg: avg,
        level: level(avg),
        lastAt: o.lastAt,
        respondents: o.respondents,
        hasData: all.length > 0
      };
    });
    return out;
  }

  // ---- אגרגציה בית-ספרית/כיתתית פר-ממד ----
  // byStudent = פלט perStudent. מחזיר {dim: {mean, level, n}} — n = כמה ילדים ענו.
  function schoolDims(byStudent, sidFilter) {
    var acc = {}; DIM_IDS.forEach(function (d) { acc[d] = []; });
    Object.keys(byStudent || {}).forEach(function (sid) {
      if (sidFilter && sidFilter.indexOf(sid) === -1) return;
      var bd = (byStudent[sid] || {}).byDim || {};
      DIM_IDS.forEach(function (dim) {
        if (typeof bd[dim] === 'number') acc[dim].push(bd[dim]);
      });
    });
    var out = {};
    DIM_IDS.forEach(function (dim) {
      var arr = acc[dim];
      var mean = arr.length ? arr.reduce(function (a, b) { return a + b; }, 0) / arr.length : null;
      out[dim] = { mean: mean, level: level(mean), n: arr.length, meta: DIM_BY_ID[dim] };
    });
    return out;
  }

  // ---- ילדים לתשומת-לב רגשית: care קודם, אחר-כך watch ----
  // students = מערך {id,name,class_id…} · byStudent = perStudent · classNameOf(sid)→שם
  function kidsToWatch(students, byStudent, classNameOf, limit) {
    var order = { care: 0, watch: 1 };
    var out = [];
    (students || []).forEach(function (s) {
      var ps = byStudent[s.id];
      if (!ps || !ps.hasData) return;
      var cls = ps.level.cls;
      if (cls !== 'care' && cls !== 'watch') return;
      // הממד החלש ביותר — נותן כותרת ("שמחה בלמידה" / "חברוּת")
      var weakDim = null, weakVal = 99;
      Object.keys(ps.byDim).forEach(function (dim) {
        if (ps.byDim[dim] < weakVal) { weakVal = ps.byDim[dim]; weakDim = dim; }
      });
      out.push({
        id: s.id, name: s.name, status: cls,
        className: classNameOf ? classNameOf(s.id) : '',
        weakDim: weakDim, weakDimMeta: weakDim ? DIM_BY_ID[weakDim] : null,
        avg: ps.avg, lastAt: ps.lastAt
      });
    });
    out.sort(function (a, b) {
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
      return (a.avg || 0) - (b.avg || 0);
    });
    return limit ? out.slice(0, limit) : out;
  }

  // ---- ציר-למידה: המרת פרופיל-קריאה (TeacherCloud) לרמה גסה למבט-משולב ----
  // מחזיר {cls:'lead'|'ontrack'|'more'|'support'|'new', strong:bool} · strong=מתקדם.
  function learningAxis(profile) {
    if (!window.TeacherCloud) return { cls: 'new', strong: null };
    var r = window.TeacherCloud.rama(profile || {});
    var strong = (r.cls === 'lead' || r.cls === 'ontrack');
    return { cls: r.cls, label: r.label, pct: r.pct, strong: (r.cls === 'new' ? null : strong) };
  }

  // ---- מבט משולב: שיבוץ ילד.ה לאחד מ-4 הרביעים (למידה × רגש) ----
  // learning.strong (מתקדם/מתקשה) × emotion available (פנוי/לא-פנוי).
  // מחזיר מפתח quadrant: 'strong-open' | 'strong-blocked' | 'struggle-open' | 'struggle-blocked'
  // או null אם חסר אחד הצירים (לא מספיק דאטה להצליב).
  function quadrant(learning, emotionLevelCls) {
    if (learning == null || learning.strong == null) return null;
    if (!emotionLevelCls || emotionLevelCls === 'new') return null;
    var open = (emotionLevelCls === 'ok');
    if (learning.strong)  return open ? 'strong-open'   : 'strong-blocked';
    return                       open ? 'struggle-open' : 'struggle-blocked';
  }

  window.PulseCloud = {
    DIMENSIONS: DIMENSIONS,
    DIM_IDS: DIM_IDS,
    DIM_BY_ID: DIM_BY_ID,
    level: level,
    loadForStudents: loadForStudents,
    perStudent: perStudent,
    schoolDims: schoolDims,
    kidsToWatch: kidsToWatch,
    learningAxis: learningAxis,
    quadrant: quadrant
  };
})();
