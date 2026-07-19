/* ============================================================================
 * teacher-cloud-soft.js — שער dual-mode "רך" למסכי-המורה החדשים (DESIGN-LOCK v2)
 * ----------------------------------------------------------------------------
 * המסכים החיים הישנים cloud-gated: TeacherCloud.init() עושה redirect ל-login
 * כשאין סשן. מסכי ה-v2 משמשים גם כדמו-שיווקי (נצפה בלי התחברות), ולכן:
 *
 *   דמו = ברירת-מחדל (ה-SEED מרונדר מיד). ענן מופעל *רק* כשכבר קיים טוקן-סשן
 *   אמיתי ב-localStorage — כך צופה-דמו בלי טוקן לעולם לא מוקפץ ל-login.
 *   `?demo=1` כופה דמו גם למחובר.ת (להצגת הדמו). file:// = תמיד דמו.
 *
 *   TeacherCloudSoft.try(function(st){ ... מיפוי + re-render + setBadge ... });
 *
 * דורש: js/shared/teacher-cloud.js (ואם צריך פולס — pulse-cloud.js) לפני קובץ זה.
 * ========================================================================== */
(function () {
  'use strict';
  var AUTH_KEY = 'avnei-yesod-supabase-auth';   // storageKey של teacher-cloud/login

  function hasSession() {
    try { var v = localStorage.getItem(AUTH_KEY); return !!(v && v.length > 20); }
    catch (e) { return false; }
  }
  function forceDemo() {
    try { return new URLSearchParams(location.search).has('demo'); }
    catch (e) { return false; }
  }
  // מנסה ענן מול ספק כלשהו (ns.init). מחזיר true אם ניסה (מחובר.ת), false אם נשאר דמו.
  // ns = window.TeacherCloud | window.PrincipalCloud וכו'. שניהם חולקים storageKey ⇒ hasSession זהה.
  function tryWith(ns, apply, onErr) {
    if (location.protocol === 'file:' || forceDemo() || !ns || !ns.init || !hasSession()) return false;
    ns.init().then(function (st) {
      try { apply(st); } catch (e) { console.warn('[v2-cloud] apply', e); }
    }).catch(function (e) {
      var m = (e && e.message) || '';
      // no-session/no-class/no-school/not-principal/file — נשאר דמו בשקט
      if (/no-session|no-class|no-school|not-principal|cloud-unavailable-file/.test(m)) return;
      console.warn('[v2-cloud]', m);
      if (onErr) onErr(e);
    });
    return true;
  }
  // תאימות-לאחור: ברירת-מחדל = TeacherCloud (מסכי-המורה קוראים ל-.try).
  function tryCloud(apply, onErr) { return tryWith(window.TeacherCloud, apply, onErr); }
  function setBadge() {
    var b = document.getElementById('rtBadge'); if (!b) return;
    b.className = 'rt-badge rt-cloud';
    var t = document.getElementById('rtTx'); if (t) t.textContent = 'נתונים חיים · ענן';
  }
  // עדכון פירורי-הלחם תוך שימור הנקודה-הוורודה (.brand-dot) של DESIGN-LOCK.
  function setCrumb(afterName) {
    var cr = document.querySelector('.topbar .crumbs'); if (!cr) return;
    cr.innerHTML = 'אבני יסוד<span class="brand-dot"></span> · ' + afterName;
  }
  window.TeacherCloudSoft = {
    try: tryCloud, tryWith: tryWith, hasSession: hasSession, forceDemo: forceDemo,
    setBadge: setBadge, setCrumb: setCrumb
  };
})();
