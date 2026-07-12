/* ============================================================================
 * principal-cloud.js — שכבת-דאטה חוצה-כיתות למסכי-המנהלת (מסלול מנהלת · גל 1)
 * ----------------------------------------------------------------------------
 * המקבילה של teacher-cloud.js, אבל אוגרת את *כל* בית-הספר במקום כיתה אחת:
 *   const st = await PrincipalCloud.init();
 *   // st = { supabase, user, school, classes, teachers, students, profiles, byClass }
 *
 * דורש:
 *   1. מיגרציה 0007 (schools + role + RLS למנהלת) הורצה בענן.
 *   2. teacher-cloud.js טעון קודם — משתמשים ב-helpers הטהורים שלו
 *      (computeProfiles / rama / knownRatio / isLive / formatLast).
 *
 * שער-אימות:
 *   אין session          → gate.html
 *   role != 'principal'  → teacher-home.html (מורה) או gate.html
 *   אין school_id        → gate.html
 *
 * ב-file:// אין ענן — init() דוחה בעדינות (no-op).
 * ========================================================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'avnei-yesod-supabase-auth';
  var SB_JS = 'https://esm.sh/@supabase/supabase-js@2.45.4';
  var _state = null;
  var _initPromise = null;

  function loadConfig() {
    if (window.AvneiCloudConfig) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'js/shared/cloud-config.js';
      s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function initClient() {
    var results = await Promise.all([import(SB_JS), loadConfig()]);
    return results[0].createClient(
      window.AvneiCloudConfig.SUPABASE_URL,
      window.AvneiCloudConfig.SUPABASE_PUBLISHABLE_KEY,
      { auth: { persistSession: true, autoRefreshToken: true,
                storage: window.localStorage, storageKey: STORAGE_KEY } }
    );
  }

  // ---- reuse teacher-cloud pure helpers (fail loudly if missing) ----
  function TC() {
    if (!window.TeacherCloud) throw new Error('principal-cloud requires teacher-cloud.js loaded first');
    return window.TeacherCloud;
  }

  // ---- full load: כל בית-הספר ----
  async function loadAll(supabase) {
    var userRes = await supabase.auth.getUser();
    var user = userRes.data && userRes.data.user;
    if (!user) { location.replace('gate.html'); throw new Error('no-session'); }

    // הקשר: תפקיד + בית-ספר
    var ctxRes = await supabase.rpc('get_my_context');
    if (ctxRes.error) throw ctxRes.error;
    var ctx = (ctxRes.data && ctxRes.data[0]) || {};
    if (ctx.role !== 'principal') {
      location.replace(ctx.school_id ? 'teacher-home.html' : 'gate.html');
      throw new Error('not-principal');
    }
    if (!ctx.school_id) { location.replace('gate.html'); throw new Error('no-school'); }
    var school = { id: ctx.school_id, name: ctx.school_name, join_code: ctx.join_code };

    // כיתות + מורות (RLS מחזיר את כל בית-הספר בזכות policy המנהלת)
    var res1 = await Promise.all([
      supabase.from('classes').select('id, name, teacher_id').order('name'),
      supabase.from('teachers').select('id, name, email'),
      supabase.from('students').select('*').eq('active', true).order('created_at'),
    ]);
    if (res1[0].error) throw res1[0].error;
    var classes  = res1[0].data || [];
    var teachers = {};
    (res1[1].data || []).forEach(function (t) { teachers[t.id] = t; });
    var students = res1[2].data || [];

    // אירועים + BKT + הצבות לכל תלמידי בית-הספר
    var ids = students.map(function (s) { return s.id; });
    var profiles = {};
    if (ids.length) {
      var res2 = await Promise.all([
        supabase.from('events')
          .select('student_id, event_type, payload, client_timestamp')
          .in('student_id', ids)
          .order('client_timestamp', { ascending: false }).limit(6000),
        supabase.from('bkt_state')
          .select('student_id, legacy_bkt, strand_bkt').in('student_id', ids),
        supabase.from('assessments')
          .select('student_id, assessment_type, payload, taken_at')
          .in('student_id', ids).eq('assessment_type', 'BOY')
          .order('taken_at', { ascending: false }),
      ]);
      profiles = TC().computeProfiles(students, res2[0].data, res2[1].data);
      (res2[2].data || []).forEach(function (a) {
        var p = profiles[a.student_id]; if (p && !p.boy) p.boy = a.payload;
      });
      // weekCount כבר מחושב ב-computeProfiles; שומרים גם last למורה-שימוש
    }

    var byClass = aggregateByClass(classes, teachers, students, profiles);
    return { supabase: supabase, user: user, school: school,
             classes: classes, teachers: teachers, students: students,
             profiles: profiles, byClass: byClass };
  }

  // ---- אגרגציה פר-כיתה ----
  function aggregateByClass(classes, teachers, students, profiles) {
    var byClass = {};
    classes.forEach(function (c) {
      byClass[c.id] = {
        klass: c,
        teacherName: (teachers[c.teacher_id] && teachers[c.teacher_id].name) || '—',
        studentIds: [], tier: { ok: 0, watch: 0, care: 0, 'new': 0 },
        known: [], weekActive: 0, lastActivity: null
      };
    });
    students.forEach(function (s) {
      var b = byClass[s.class_id]; if (!b) return;
      var p = profiles[s.id] || {};
      b.studentIds.push(s.id);
      var r = TC().rama(p);
      var bucket = { lead: 'ok', ontrack: 'ok', more: 'watch', support: 'care', 'new': 'new' }[r.cls] || 'new';
      b.tier[bucket]++;
      var k = TC().knownRatio(p);
      if (typeof k === 'number') b.known.push(k);
      if ((p.weekCount || 0) > 0) b.weekActive++;
      if (p.last && (!b.lastActivity || p.last > b.lastActivity)) b.lastActivity = p.last;
    });
    // מדד התקדמות כיתתי + סטטוס
    Object.keys(byClass).forEach(function (cid) {
      var b = byClass[cid];
      b.progressPct = b.known.length
        ? Math.round(b.known.reduce(function (a, x) { return a + x; }, 0) / b.known.length * 100)
        : null;
      b.status = classStatus(b);
    });
    return byClass;
  }

  // סטטוס כיתה: קודם לפי חלק הילדים ב"ליווי קרוב", אחרת לפי ההתקדמות הממוצעת.
  function classStatus(b) {
    var total = b.studentIds.length;
    if (!total || b.progressPct == null) return 'new';
    var careShare = b.tier.care / total;
    if (careShare >= 0.34) return 'care';
    if (b.progressPct >= 75 && careShare === 0) return 'ok';
    if (b.progressPct >= 60) return 'watch';
    return 'care';
  }

  // ---- API ----
  function init() {
    if (_initPromise) return _initPromise;
    _initPromise = (async function () {
      if (location.protocol === 'file:') throw new Error('cloud-unavailable-file');
      var supabase = await initClient();
      _state = await loadAll(supabase);
      window.PrincipalCloud._state = _state;
      document.dispatchEvent(new CustomEvent('principal-cloud-ready', { detail: _state }));
      return _state;
    })();
    return _initPromise;
  }

  // ---- views ----

  // חלוקת בית-הספר לשלוש רמות (טיר) — ספירת תלמידים
  function schoolTier() {
    if (!_state) return { ok: 0, watch: 0, care: 0, total: 0 };
    var t = { ok: 0, watch: 0, care: 0, total: 0 };
    Object.keys(_state.byClass).forEach(function (cid) {
      var tr = _state.byClass[cid].tier;
      t.ok += tr.ok; t.watch += tr.watch; t.care += (tr.care); t.total += (tr.ok + tr.watch + tr.care + tr['new']);
    });
    return t;
  }

  // ילדים שחשוב לא לפספס — care קודם, אחר-כך watch; עם שם כיתה + מורה
  function kidsToWatch(limit) {
    if (!_state) return [];
    var order = { care: 0, watch: 1 };
    var out = [];
    _state.students.forEach(function (s) {
      var p = _state.profiles[s.id] || {};
      var r = TC().rama(p);
      var bucket = { lead: 'ok', ontrack: 'ok', more: 'watch', support: 'care', 'new': 'new' }[r.cls] || 'new';
      if (bucket !== 'care' && bucket !== 'watch') return;
      var b = _state.byClass[s.class_id] || {};
      out.push({
        id: s.id, name: s.name, status: bucket,
        className: (b.klass && b.klass.name) || '', teacherName: b.teacherName || '',
        knownPct: (function () { var k = TC().knownRatio(p); return k == null ? null : Math.round(k * 100); })(),
        errorLetters: (p.errorLetters || []).slice(0, 3),
        lastLabel: TC().formatLast(p.last)
      });
    });
    out.sort(function (a, b2) {
      if (order[a.status] !== order[b2.status]) return order[a.status] - order[b2.status];
      return (a.knownPct || 0) - (b2.knownPct || 0);
    });
    return limit ? out.slice(0, limit) : out;
  }

  // שימוש-מורות — סקאלה ניטרלית (לא סטטוס): high / mid / low לפי פעילות שבועית
  function teacherUsage() {
    if (!_state) return [];
    return _state.classes.map(function (c) {
      var b = _state.byClass[c.id] || {};
      var total = b.studentIds.length || 0;
      var share = total ? b.weekActive / total : 0;
      var lvl = (b.weekActive === 0) ? 'low' : (share >= 0.6 ? 'high' : 'mid');
      return {
        teacherName: b.teacherName, className: c.name,
        weekActive: b.weekActive, total: total, level: lvl,
        lastLabel: b.lastActivity ? TC().formatLast(b.lastActivity) : 'טרם נרשמה פעילות'
      };
    });
  }

  // סיכומי אקשן (שורת הסטטים העליונה)
  function summary() {
    if (!_state) return { careKids: 0, classesCare: 0, classesTotal: 0, activeTeachers: 0, teachersTotal: 0 };
    var careKids = kidsToWatch().filter(function (k) { return k.status === 'care'; }).length;
    var classesCare = 0;
    Object.keys(_state.byClass).forEach(function (cid) { if (_state.byClass[cid].status === 'care') classesCare++; });
    var usage = teacherUsage();
    return {
      careKids: careKids,
      classesCare: classesCare,
      classesTotal: _state.classes.length,
      activeTeachers: usage.filter(function (u) { return u.level !== 'low'; }).length,
      teachersTotal: usage.length
    };
  }

  window.PrincipalCloud = {
    init: init,
    schoolTier: schoolTier,
    kidsToWatch: kidsToWatch,
    teacherUsage: teacherUsage,
    summary: summary,
    get state() { return _state; },
  };
})();
