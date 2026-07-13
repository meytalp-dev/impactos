/* ============================================================
   מישמיש — js/shared/scaffold.js  →  window.MishmishScaffold
   ------------------------------------------------------------
   שכבת שפת-הישרדות הרוחבית (עוד פעם / לאט / לא הבנתי).
   מקור-אמת יחיד: data/scaffold.json (מוטמע ל-window.MISHMISH_DATA.scaffold
   דרך _build-data.js — file:// חוסם fetch). הרכיב מזריק את השורה למסך,
   ומחווט אותה ל-API של המשחקון הפעיל: replay(false)=עוד-פעם ·
   replay(true)=לאט · hint()=לא-הבנתי. כך מכניקה חדשה מקבלת את השורה בחינם.

   שימוש:
     · דף שכבר מחווט את #sv-* בעצמו (index/lantern):
         MishmishScaffold.render('#survival');     // מזריק בלבד
     · מכניקה חדשה בלי חיווט משלה:
         MishmishScaffold.bind('#survival', function () { return active; });
     · רמז-אמיר גנרי (למכניקות עתידיות):
         MishmishScaffold.amirHint('encourage');   // {tier,he,ar,ar_verified}
   ============================================================ */
window.MishmishScaffold = (function () {
  // מראה-בטיחות: אם data.js טרם נבנה-מחדש עם scaffold, השורה עדיין מוזרקת
  // (זהה בתוכן ל-survival_bar שב-data/scaffold.json). זה שיקוף בלבד — לא מקור-אמת.
  var FALLBACK = {
    survival_bar: {
      buttons: [
        { id: 'sv-again', action: 'replay', arg: false, emoji: '🔁', label_he: 'עוֹד פַּעַם' },
        { id: 'sv-slow',  action: 'replay', arg: true,  emoji: '🐢', label_he: 'לְאַט' },
        { id: 'sv-help',  action: 'hint',   arg: null,  emoji: '❔', label_he: 'לֹא הֵבַנְתִּי' }
      ]
    },
    amir_hints: { tiers: [] }
  };

  function config() {
    var d = window.MISHMISH_DATA;
    return (d && d.scaffold) || window.MISHMISH_SCAFFOLD || FALLBACK;
  }

  function el(sel) { return typeof sel === 'string' ? document.querySelector(sel) : sel; }
  function navButtons(nav) { return Array.prototype.slice.call(nav.querySelectorAll('button')); }

  // מזריק את כפתורי-ההישרדות אל אלמנט-עוגן (nav.survival ריק).
  // ה-id נשמר (sv-again/sv-slow/sv-help) — כך חיווט קיים ב-play.js/lantern.js
  // (q('#sv-again') …) ממשיך לתפוס אותם ללא שינוי. אידמפוטנטי.
  function render(target) {
    var nav = el(target);
    if (!nav) return [];
    if (nav.dataset.scaffoldReady === '1') return navButtons(nav);
    var bar = config().survival_bar || FALLBACK.survival_bar;
    var buttons = bar.buttons || [];
    nav.innerHTML = '';
    buttons.forEach(function (b) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.id = b.id;
      btn.className = 'sv-btn';
      if (b.action) btn.dataset.svAction = b.action;
      if (b.arg != null) btn.dataset.svArg = String(b.arg);
      btn.setAttribute('aria-label', b.label_he);
      // אימוג'י כאייקון = ללא תלות-CSS, עמיד file://, ואחיד בין כל המסכים
      btn.innerHTML =
        '<span class="sv-ico" aria-hidden="true">' + (b.emoji || '') + '</span>' +
        '<span class="sv-label">' + b.label_he + '</span>';
      nav.appendChild(btn);
    });
    nav.dataset.scaffoldReady = '1';
    return navButtons(nav);
  }

  // חיווט בשורה אחת למכניקה שאין לה תסריט-רמז משלה.
  // getActive() מחזיר את ה-API הפעיל { replay(slow), hint() } (או null בין-פריטים).
  function bind(target, getActive) {
    var list = render(target);
    list.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var api = typeof getActive === 'function' ? getActive() : getActive;
        if (!api) return;
        var act = btn.dataset.svAction;
        if (act === 'hint') { if (api.hint) api.hint(); }
        else if (act === 'replay') { if (api.replay) api.replay(btn.dataset.svArg === 'true'); }
      });
    });
    return list;
  }

  // רמז-אמיר גנרי פר-מדרג (encourage/point/amiya). 🔴 he=טיוטה לאישור מיטל;
  // ar=עאמייה לא-מאושרת (ar_verified:false) — אין להשמיע/להציג עד בודק ילידי.
  function amirHint(tier) {
    var tiers = (config().amir_hints || {}).tiers || [];
    for (var i = 0; i < tiers.length; i++) { if (tiers[i].tier === tier) return tiers[i]; }
    return null;
  }

  return { config: config, render: render, bind: bind, amirHint: amirHint };
})();
