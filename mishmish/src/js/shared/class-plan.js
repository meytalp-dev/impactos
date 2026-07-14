/* ============================================================
   מישמיש — class-plan.js  →  window.MishmishClassPlan   (חצי A)
   ------------------------------------------------------------
   View מעל window.MISHMISH_DATA.classPlan + .packs.
   מקור-אמת יחיד ל"מה הנושא שהכיתה עליו עכשיו".
   שכבת-תצוגה בלבד — אין מדידה, אין לוגיקת-משחקון.

   offline-first · בלי fetch (file:// יישבר). הכול מ-data.js המוטבע
   ומ-localStorage. סגנון: IIFE שמחזיר אובייקט (var, בלי ES modules),
   זהה ל-data-loader.js / bkt.js.

   API:
     current()        → { pack, he, week, packObj } של הנושא הנוכחי.
                        הכרעה: override(localStorage) ▸ classPlan.current ▸ ראשון-ברצף.
                        אם classPlan חסר → נפילה בטוחה ל-{ pack:'mapping', he:'טִיּוּל הַכָּרוּת' }.
     sequence()       → הרשימה המסודרת; כל פריט: { pack, he, week, isCurrent }.
     setCurrent(id)   → כותב override ל-localStorage (וו לצד-מורה עתידי).
                        מאמת שה-pack קיים ב-MISHMISH_DATA.packs; אחרת מתעלם ומחזיר false.
     label()          → "הַכִּתָּה שֶׁלָּכֶם עַכְשָׁיו בְּ" + current().he.
   ============================================================ */
window.MishmishClassPlan = (function () {
  var LS_KEY = 'mishmish-class-topic';
  var FALLBACK = { pack: 'mapping', he: 'טִיּוּל הַכָּרוּת' };

  function data() { return window.MISHMISH_DATA || {}; }
  function plan() { return data().classPlan || null; }
  function seqRaw() { var p = plan(); return (p && p.sequence) || []; }

  // packObj(id) — אובייקט-ה-pack המוטבע לפי meta id, או null. בלי תלות ב-data-loader.
  function packObj(id) {
    if (!id) return null;
    var packs = data().packs || [];
    for (var i = 0; i < packs.length; i++) { if (packs[i].pack === id) return packs[i]; }
    return null;
  }

  function packExists(id) { return !!packObj(id); }

  // override — מה שנכתב ידנית (setCurrent / וו צד-מורה). מתעלמים ממנו אם ה-pack כבר לא קיים.
  function override() {
    try {
      var v = window.localStorage.getItem(LS_KEY);
      return v && packExists(v) ? v : null;
    } catch (e) { return null; }
  }

  // seqEntry(id) — הפריט ברצף עבור pack מסוים, או null.
  function seqEntry(id) {
    var s = seqRaw();
    for (var i = 0; i < s.length; i++) { if (s[i].pack === id) return s[i]; }
    return null;
  }

  // currentId() — הכרעת מזהה-הנושא הנוכחי: override ▸ classPlan.current ▸ ראשון-ברצף.
  function currentId() {
    var ov = override();
    if (ov) return ov;
    var p = plan();
    if (p && p.current && packExists(p.current)) return p.current;
    var s = seqRaw();
    if (s.length && packExists(s[0].pack)) return s[0].pack;
    return null;
  }

  function current() {
    var id = currentId();
    if (!id) return { pack: FALLBACK.pack, he: FALLBACK.he, week: null, packObj: packObj(FALLBACK.pack) };
    var e = seqEntry(id);
    return {
      pack: id,
      he: e ? e.he : (packObj(id) && packObj(id).meta ? packObj(id).meta.topic : id),
      week: e ? e.week : null,
      packObj: packObj(id)
    };
  }

  function sequence() {
    var cur = currentId();
    return seqRaw().map(function (e) {
      return { pack: e.pack, he: e.he, week: e.week, isCurrent: e.pack === cur };
    });
  }

  function setCurrent(id) {
    if (!packExists(id)) return false;   // pack לא קיים → מתעלמים
    try { window.localStorage.setItem(LS_KEY, id); return true; }
    catch (e) { return false; }
  }

  function label() { return 'הַכִּתָּה שֶׁלָּכֶם עַכְשָׁיו בְּ' + current().he; }

  return {
    current: current,
    sequence: sequence,
    setCurrent: setCurrent,
    label: label
  };
})();
