/* ============================================================
   מישמיש — js/shared/flow.js  →  window.MishmishFlow
   ------------------------------------------------------------
   בּוֹרֵר-הזרימה של התלמיד. מחבר את שכבת ה-EPA (epa.js) לניווט בין
   המשחקונים: בסיום פעילות → EPA.recommendNext() בוחר את התגבור הבא
   (מכניקה+תבנית) → ניווט לדף המתאים, תוך שמירת ה-pack הנוכחי.

   🔴 self-attaching: הדף רק טוען <script epa.js> + <script flow.js>.
      flow מזהה את מסך-הסיום (#doneOverlay) ומזריק כפתור "הַמְשֵׁךְ →"
      כשהוא נחשף — בלי לגעת בקוד/בלוגיקה של המכניקה (HTML/JS בבעלות סוכן אחר).

   מודל-הזרימה:
     · דף-מיפוי (lantern בלי ?pack, או ?pack=mapping) → אחרי סיום עוברים לנושא.
     · דף-בתוך-נושא (?pack=class…) → נשארים ב-pack, מחליפים מכניקה לפי הכשל.
   ברירת-מחדל כשאין דפוס-כשל דומיננטי: defaultNext (התקדמות רגילה).

   כיול פר-דף (אופציונלי, לפני הטעינה):
     window.MISHMISH_FLOW = { topic:'class', defaultNext:'missing-slot' };
   ============================================================ */
window.MishmishFlow = (function () {
  var DEFAULTS = { topic: 'class', defaultNext: 'missing-slot', mapping: 'mapping' };

  // מכניקה → דף. swim-hunt/lantern חולקים דף (הפנס).
  var PAGE = {
    'lantern': 'lantern.html',
    'swim-hunt': 'lantern.html',
    'missing-slot': 'missing-slot.html',
    'same-different': 'same-different.html',
    'grammar-toggle': 'grammar-toggle.html',
    'give-me': 'index.html'
  };

  function cfg() {
    var o = window.MISHMISH_FLOW || {};
    return { topic: o.topic || DEFAULTS.topic,
             defaultNext: o.defaultNext || DEFAULTS.defaultNext,
             mapping: o.mapping || DEFAULTS.mapping };
  }
  function param(n) { try { return new URLSearchParams(location.search).get(n); } catch (e) { return null; } }
  function currentPack() { return param('pack') || null; }
  function isMapping() { var p = currentPack(); return !p || p === cfg().mapping; }

  // ── decideNext — ההחלטה: לאן ממשיכים ──
  function decideNext() {
    var c = cfg();
    var EPA = window.MishmishEPA;
    var rec = (EPA && EPA.recommendNext) ? EPA.recommendNext() : { mechanic: null, reason: null };
    var mech = rec.mechanic || c.defaultNext;                 // אין דפוס דומיננטי → התקדמות רגילה
    // אחרי המיפוי עוברים לנושא; בתוך-נושא נשארים ב-pack הנוכחי
    var pack = isMapping() ? c.topic : (currentPack() || c.topic);
    var page = PAGE[mech] || PAGE[c.defaultNext] || 'missing-slot.html';
    return { mechanic: mech, pack: pack, url: page + '?pack=' + encodeURIComponent(pack),
             reason: rec.reason || null, rec: rec };
  }

  function goNext() { var n = decideNext(); location.href = n.url; return n; }

  // ── attach — מזריק "הַמְשֵׁךְ →" למסך-הסיום כשהוא נחשף (idempotent) ──
  function attach(overlaySel) {
    var ov = document.querySelector(overlaySel || '#doneOverlay');
    if (!ov) return;
    var injected = false;
    function inject() {
      if (injected || ov.classList.contains('hidden')) return;   // עדיין לא סיום
      injected = true;
      var n = decideNext();
      var btn = document.createElement('a');
      btn.className = 'btn-big flow-next';                        // מנצל את סגנון-הכפתור של הדף
      btn.href = n.url;
      btn.style.textDecoration = 'none';                         // <a> בסגנון-כפתור — בלי קו-תחתון
      btn.textContent = 'הַמְשֵׁךְ →';
      btn.setAttribute('data-flow-mechanic', n.mechanic);
      btn.setAttribute('data-flow-pack', n.pack);
      var again = ov.querySelector('#againBtn');                  // ממקמים אחרי "עוד פעם"
      if (again && again.parentNode) again.parentNode.insertBefore(btn, again.nextSibling);
      else ov.appendChild(btn);
    }
    inject();                                                     // אם כבר גלוי
    new MutationObserver(inject).observe(ov, { attributes: true, attributeFilter: ['class'] });
  }

  function auto() { attach('#doneOverlay'); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto);
  else auto();

  return {
    decideNext: decideNext, goNext: goNext, attach: attach,
    pageFor: function (m) { return PAGE[m] || null; }, config: cfg
  };
})();
