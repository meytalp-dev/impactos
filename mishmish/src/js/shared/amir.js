/* ============================================================
   מישמיש — js/shared/amir.js  →  window.MishmishAmir
   ------------------------------------------------------------
   רכיב-הפיגום הדו-לשוני (אמיר) — חוזה אחיד לכל המכניקות.
   אמיר = דמות-עמית דו-לשונית; מישמיש = דמות-היעד (עברית),
   אמיר = הפיגום (עאמייה). הרכיב מרכז את מה שכל מכניקה שכפלה
   בעצמה (setAmir + amirText + scaffold.show) לקריאה אחת.

   מדיניות-עולם נעולה (כל סטייה = באג):
     · אמיר מופיע רק במדרג-הרמז שלב "עאמייה" — אחרי השמעה-חוזרת
       (מדרג 'encourage') והצבעה חזותית (מדרג 'point'). הוא הרמז
       האסטרטגי האחרון, לא כפתור-תרגום קבוע.
     · בועה = רמז עברי (יעד, מאושר-מיטל) + 🔴 טקסט עאמייה מגודר:
       ה-.ar נכתב ל-DOM אך מוסתר ע"י CSS ([data-arabic-verified="false"])
       ואינו מושמע — עד שבודק/ת ילידי/ת מאשר/ת (root → "true").
     · מצבי-דמות לפי הקשר: listening (הילד עונה / עידוד) · hint
       (מרמז / עאמייה) · happy (הצלחה). PNG שקופים ב-peers/.
     · אין כפתור "תרגום" קבוע — הפיגום נעלם.

   API:
     MishmishAmir.attach(el)            → instance {show,hide,listening,happy,el}
     MishmishAmir.show(level, texts)    → singleton על '#scaffold'
     MishmishAmir.hide() / listening() / happy()
   כאשר:
     level  = מדרג ('encourage'|'point'|'amiya') או מספר (1|2|3, ≥3→amiya)
     texts  = { he, ar, ar_verified } אופציונלי — דורס את ברירת-המחדל
              מ-scaffold.json (MishmishScaffold.amirHint). he=טיוטת-מיטל,
              ar=עאמייה מגודרת. אם לא סופק — נלקח מ-scaffold.json.

   🔴 חוק תוכן: אין כאן מחרוזות עאמייה קשיחות. כל טקסט he/ar מגיע
      מ-data/scaffold.json (F1) או מ-texts שהמכניקה מספקת. הרכיב רק
      *מציג* — לא ממציא ערבית ולא מציג אותה כמאושרת.
   ============================================================ */
window.MishmishAmir = (function () {
  var A = window.MishmishAudio;
  var PEER_BASE = '../assets/characters/peers/amir-';

  // מדרג → מצב-דמות. ברירת-מחדל; scaffold.json יכול לדרוס דרך שדה state.
  var TIER_STATE = { encourage: 'listening', point: 'hint', amiya: 'hint' };
  var LEVEL_TIERS = [null, 'encourage', 'point', 'amiya'];   // 1-indexed

  function normTier(level) {
    if (typeof level === 'number') return LEVEL_TIERS[Math.min(3, Math.max(1, level))] || 'amiya';
    return level || 'amiya';
  }

  // האם עאמייה מותרת להצגה/השמעה? מגודר בשני שערים: דגל-הדף (root) + שער-האודיו.
  function arabicUnlocked() {
    var root = (typeof document !== 'undefined') && document.documentElement;
    var domOK = root && root.getAttribute('data-arabic-verified') === 'true';
    var audioOK = !A || A.ARABIC_VERIFIED === true;
    return !!(domOK && audioOK);
  }

  function resolve(target) {
    if (!target) return null;
    return typeof target === 'string' ? document.querySelector(target) : target;
  }

  // ברירות-מחדל למדרג מתוך scaffold.json (F1) — מקור-האמת ל-he/ar הגנריים.
  function defaults(tier) {
    var S = window.MishmishScaffold;
    return (S && S.amirHint) ? S.amirHint(tier) : null;
  }

  // מוודא שמבנה-הבועה קיים (img + .he + .ar). אידמפוטנטי — לא דורס תוכן קיים,
  // רק משלים אלמנטים חסרים כדי שגם container מינימלי (<div id=scaffold> ריק) יעבוד.
  function ensure(box) {
    var img = box.querySelector('img');
    if (!img) {
      img = document.createElement('img');
      img.alt = '';
      box.insertBefore(img, box.firstChild);
    }
    var heEl = box.querySelector('.he, [data-amir-he]');
    if (!heEl) {
      heEl = document.createElement('span');
      heEl.className = 'he';
      box.appendChild(heEl);
    }
    var arEl = box.querySelector('.ar, [data-amir-ar]');
    if (!arEl) {
      arEl = document.createElement('span');
      arEl.className = 'ar';
      arEl.setAttribute('lang', 'ar');
      arEl.setAttribute('data-arabic-verified', 'false');
      box.appendChild(arEl);
    }
    return { img: img, heEl: heEl, arEl: arEl };
  }

  function setMood(img, mood) {
    if (img) img.src = PEER_BASE + (mood || 'idle') + '.png';
  }
  // גילוי/הסתרה עמיד לשתי מוסכמות-CSS: class .show (same-different) + hidden attr (index).
  function reveal(box, on) {
    box.classList.toggle('show', !!on);
    box.hidden = !on;
  }

  function attach(target) {
    var box = resolve(target);
    if (!box) return null;
    var refs = ensure(box);

    var inst = {
      el: box,

      /* מציג את אמיר במדרג נתון עם טקסט. he חובה (יעד); ar עאמייה מגודרת.
         מדיניות: אמיר-כדמות מיועד למדרג 'amiya', אך show עובד לכל מדרג
         כדי לאפשר למכניקה להחליט. ההגנה על העאמייה זהה בכל מקרה. */
      show: function (level, texts) {
        var tier = normTier(level);
        texts = texts || {};
        var d = defaults(tier) || {};
        var he = texts.he != null ? texts.he : d.he;
        var ar = texts.ar != null ? texts.ar : d.ar;
        var state = texts.state || d.state || TIER_STATE[tier] || 'hint';

        setMood(refs.img, state);
        if (refs.heEl && he != null) refs.heEl.textContent = he;

        // 🔴 עאמייה מגודרת: כותבים ל-DOM (למען הבודק/ת דרך arabic-review-tool),
        // אך CSS [data-arabic-verified="false"] מסתיר אותה, וכאן היא לא מושמעת
        // אלא-אם שני השערים פתוחים. הרכיב לעולם לא מציג ar כמאושרת.
        if (refs.arEl) {
          refs.arEl.textContent = (ar != null ? ar : '');
          refs.arEl.setAttribute('data-arabic-verified', 'false');
        }
        reveal(box, true);

        // השמעת-עאמייה: רק במדרג 'amiya' וכששני השערים פתוחים. אחרת gated no-op.
        if (tier === 'amiya' && ar && arabicUnlocked() && A && A.arabic) {
          A.arabic(ar, { slow: true });
        }
        return inst;
      },

      // הילד עונה / עידוד — אמיר מקשיב.
      listening: function () { setMood(refs.img, 'listening'); return inst; },
      // הצלחה — אמיר שמח (ואז נעלם דרך hide בזמן-קריאה של המכניקה/המנוע).
      happy: function () { setMood(refs.img, 'happy'); return inst; },
      hide: function () { reveal(box, false); return inst; }
    };
    return inst;
  }

  // singleton-נוחות על '#scaffold' (למנוע measured.js ולמכניקות שלא מנהלות instance).
  var _def = null;
  function def() {
    if (_def && document.contains(_def.el)) return _def;
    _def = attach('#scaffold');
    return _def;
  }

  return {
    attach: attach,
    arabicUnlocked: arabicUnlocked,
    show: function (level, texts) { var i = def(); return i && i.show(level, texts); },
    listening: function () { var i = def(); return i && i.listening(); },
    happy: function () { var i = def(); return i && i.happy(); },
    hide: function () { var i = def(); return i && i.hide(); }
  };
})();
