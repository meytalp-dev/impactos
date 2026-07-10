/* ============================================================================
 * teacher-cloud.js — שכבת-דאטה משותפת למסכי-המורה החדשים (מסלול B)
 * ----------------------------------------------------------------------------
 * מחלץ את הלוגיקה שהוכחה ב-teacher-dashboard.html למודול יחיד שכל מסך צורך:
 *   const { klass, students, profiles } = await TeacherCloud.init();
 *
 * אחראי על:
 *   1. אתחול Supabase client (storageKey זהה ל-login → session משותף)
 *   2. שער-אימות: אין משתמש → teacher-login.html · אין כיתה → teacher-setup.html
 *   3. טעינת class + students + events + bkt_state דרך RLS
 *   4. חישוב profiles[sid] (last, weekCount, mastered, inProgress, avgKnown…)
 *   5. realtime: אירועים נכנסים חיים
 *   6. helpers: rama(p), formatLast(iso), isLive(iso)
 *
 * דורש http(s) + login. ב-file:// אין ענן — init() דוחה בעדינות (no-op).
 * ========================================================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'avnei-yesod-supabase-auth';
  var SB_JS = 'https://esm.sh/@supabase/supabase-js@2.45.4';
  var _state = null;      // { supabase, user, klass, students, profiles }
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
    var mod = await import(SB_JS);
    await loadConfig();
    return mod.createClient(
      window.AvneiCloudConfig.SUPABASE_URL,
      window.AvneiCloudConfig.SUPABASE_PUBLISHABLE_KEY,
      { auth: {
          persistSession: true,
          autoRefreshToken: true,
          storage: window.localStorage,
          storageKey: STORAGE_KEY,
      } }
    );
  }

  // ---- חישוב פרופיל פר-תלמיד.ה (זהה למקור בדשבורד) ----
  function blankProfile() {
    return { last: null, weekCount: 0, mastered: [], inProgress: [],
             avgKnown: null, bktStrand: null, errorLetters: [] };
  }

  function computeProfiles(students, events, bktRows) {
    var profiles = {};
    var ids = (students || []).map(function (s) { return s.id; });
    ids.forEach(function (sid) { profiles[sid] = blankProfile(); });
    var weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    (events || []).forEach(function (ev) {
      var p = profiles[ev.student_id];
      if (!p) return;
      if (!p.last || ev.client_timestamp > p.last) p.last = ev.client_timestamp;
      if (ev.client_timestamp >= weekAgo) p.weekCount++;
      var payload = ev.payload || {};
      if (payload.is_correct === false && payload.target_letter &&
          p.errorLetters.indexOf(payload.target_letter) === -1) {
        p.errorLetters.push(payload.target_letter);
      }
    });

    (bktRows || []).forEach(function (row) {
      var p = profiles[row.student_id];
      if (!p) return;
      var strand1 = (row.strand_bkt || {})['1'] || {};
      p.bktStrand = strand1;
      p.avgKnown = (typeof strand1.pKnown === 'number') ? strand1.pKnown : null;
      var perLetter = strand1.per_letter || {};
      Object.keys(perLetter).forEach(function (letter) {
        var st = perLetter[letter] || {};
        var pct = Math.round((st.pKnown || 0) * 100);
        if (pct >= 90) p.mastered.push({ letter: letter, pct: pct });
        else if ((st.attempts || 0) > 0) p.inProgress.push({ letter: letter, pct: pct });
      });
      p.mastered.sort(function (a, b) { return b.pct - a.pct; });
      p.inProgress.sort(function (a, b) { return b.pct - a.pct; });
    });

    return profiles;
  }

  // ---- טעינה מלאה ----
  async function loadAll(supabase) {
    var userRes = await supabase.auth.getUser();
    var user = userRes.data && userRes.data.user;
    if (!user) { location.replace('teacher-login.html'); throw new Error('no-session'); }

    var classesRes = await supabase.from('classes')
      .select('id, name').eq('teacher_id', user.id).limit(1);
    if (classesRes.error) throw classesRes.error;
    if (!classesRes.data || !classesRes.data.length) {
      location.replace('teacher-setup.html'); throw new Error('no-class');
    }
    var klass = classesRes.data[0];

    var stuRes = await supabase.from('students')
      .select('id, name').eq('class_id', klass.id).eq('active', true).order('created_at');
    if (stuRes.error) throw stuRes.error;
    var students = stuRes.data || [];

    var profiles = {};
    var ids = students.map(function (s) { return s.id; });
    if (ids.length) {
      var res = await Promise.all([
        supabase.from('events')
          .select('student_id, event_type, payload, client_timestamp')
          .in('student_id', ids)
          .order('client_timestamp', { ascending: false }).limit(3000),
        supabase.from('bkt_state')
          .select('student_id, legacy_bkt, strand_bkt').in('student_id', ids),
      ]);
      profiles = computeProfiles(students, res[0].data, res[1].data);
    }
    return { supabase: supabase, user: user, klass: klass, students: students, profiles: profiles };
  }

  // ---- API ----
  function init() {
    if (_initPromise) return _initPromise;
    _initPromise = (async function () {
      if (location.protocol === 'file:') throw new Error('cloud-unavailable-file');
      var supabase = await initClient();
      _state = await loadAll(supabase);
      window.TeacherCloud._state = _state;
      document.dispatchEvent(new CustomEvent('teacher-cloud-ready', { detail: _state }));
      return _state;
    })();
    return _initPromise;
  }

  function subscribeRealtime(onInsert) {
    if (!_state || !_state.supabase) return;
    try {
      _state.supabase.channel('teacher-' + _state.klass.id)
        .on('postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'events' },
            function (msg) {
              var evt = msg && msg.new;
              if (!evt) return;
              var p = _state.profiles[evt.student_id];
              if (!p) return;   // לא מהכיתה שלנו
              if (!p.last || evt.client_timestamp > p.last) p.last = evt.client_timestamp;
              p.weekCount++;
              if (typeof onInsert === 'function') onInsert(evt, _state);
            })
        .subscribe();
    } catch (e) { /* Realtime לא-מופעל = שקט, המסך עדיין עובד */ }
  }

  // ---- helpers ----
  function knownRatio(p) {
    if (p.avgKnown != null) return p.avgKnown;
    var tot = p.mastered.length + p.inProgress.length;
    if (!tot) return null;
    return p.mastered.length / tot;
  }

  // מיפוי לרמות בשפת המסכים החדשים (זקוק לחיזוק / לתרגול נוסף / בדרך הנכונה / מצטיינת)
  function rama(p) {
    var k = knownRatio(p);
    if (k == null) return { cls: 'new', label: p.last ? 'תלמידה חדשה' : 'טרם תרגלה' };
    var pct = Math.round(k * 100);
    if (k >= 0.85) return { cls: 'lead',   label: 'מצטיינת', pct: pct };
    if (k >= 0.60) return { cls: 'ontrack', label: 'בדרך הנכונה', pct: pct };
    if (k >= 0.40) return { cls: 'more',   label: 'לתרגול נוסף', pct: pct };
    return               { cls: 'support', label: 'זקוק לחיזוק', pct: pct };
  }

  function formatLast(iso) {
    if (!iso) return 'טרם תרגלה';
    var ms = Date.now() - new Date(iso).getTime();
    var h = Math.floor(ms / 3600000), d = Math.floor(h / 24);
    if (h < 1) return 'תרגלה לפני פחות משעה';
    if (h < 24) return 'תרגלה לפני ' + h + ' שעות';
    if (d < 7) return 'תרגלה לפני ' + d + ' ימים';
    return 'לא תרגלה מעל שבוע';
  }

  function isLive(iso, windowMs) {
    if (!iso) return false;
    return (Date.now() - new Date(iso).getTime()) < (windowMs || 10 * 60 * 1000);
  }

  window.TeacherCloud = {
    init: init,
    subscribeRealtime: subscribeRealtime,
    computeProfiles: computeProfiles,
    rama: rama,
    formatLast: formatLast,
    isLive: isLive,
    knownRatio: knownRatio,
    get state() { return _state; },
  };
})();
