/* ============================================================
   מישמיש — data-loader.js  →  window.MishmishData
   ------------------------------------------------------------
   טוען-החבילות הכללי. כל מכניקה בוחרת pack בזמן-ריצה — בלי hard-code.
   קורא את window.MISHMISH_DATA המיוצר (data.js) ואינו נוגע בו.

   API:
     MishmishData.pack(id)              → אובייקט-ה-pack לפי meta id, או null.
     MishmishData.pick({ pack, mechanic })
        → מכריע pack בזמן-ריצה מ-?pack= / ?mechanic= ב-URL, עם ברירות-מחדל.
          קדימוּת:  ?pack= / ?mechanic= (URL) ▸ ברירות-המחדל (opts) ▸ הראשון.
          ברירות-המחדל = "מה שרץ היום" — בלי פרמטרי-URL ההתנהגות זהה לקיים.
          מחזיר { pack, id, mechanic, target, items, instructions } או null.
     MishmishData.target(pack, mechanic) → מטרת-המכניקה הגנרית (pack.target[mechanic]).
        target הוא **שדה** (pack-schema §2): כל מכניקה קוראת target.<mechanic> אחיד.

   השראה: lumi/app/js/engine.js (בחירת-pack) — כאן מופרד ללוגיקת-טעינה נקייה.
   ============================================================ */
window.MishmishData = (function () {
  function data() { return window.MISHMISH_DATA || { packs: [], instructions: {} }; }

  function param(name) {
    try { return new URLSearchParams(location.search).get(name); }
    catch (e) { return null; }
  }

  // pack(id) — ה-pack ש-meta שלו (pack.pack) תואם, אחרת null. בחירה לפי id, לא אינדקס.
  function pack(id) {
    if (!id) return null;
    return data().packs.filter(function (p) { return p.pack === id; })[0] || null;
  }

  // packForMechanic(m) — ה-pack הראשון שמצהיר על המכניקה הזו, אחרת null.
  function packForMechanic(m) {
    if (!m) return null;
    return data().packs.filter(function (p) { return p.mechanic === m; })[0] || null;
  }

  // target(pack, mechanic) — מתאר-המטרה הגנרי של המכניקה מתוך שדה pack.target.
  // כל מכניקה קוראת אותו אותו-הדבר; אם חסר → null (המכניקה עדיין רצה).
  function targetOf(p, mechanic) {
    if (!p || !p.target || !mechanic) return null;
    return p.target[mechanic] || null;
  }

  // pick({ pack, mechanic }) — בחירת-pack בזמן-ריצה. ראה תיעוד למעלה.
  function pick(opts) {
    opts = opts || {};
    var wantId = param('pack') || opts.pack || null;
    var wantMech = param('mechanic') || opts.mechanic || null;

    var p = pack(wantId) || packForMechanic(wantMech) || data().packs[0] || null;
    if (!p) return null;

    // המכניקה שייכת לדף (הקוד); ה-pack הוא הדאטה הניתן-להחלפה. לכן ברירת-המכניקה
    // נשארת של הקורא (opts.mechanic) אם ה-URL לא ביקש אחרת, ורק אז נופלת ל-pack.mechanic.
    var mechanic = wantMech || p.mechanic || null;

    return {
      pack: p,
      id: p.pack,
      mechanic: mechanic,
      target: targetOf(p, mechanic),
      items: p.items || [],
      instructions: data().instructions || {}
    };
  }

  return {
    pack: pack,
    pick: pick,
    target: targetOf,
    packForMechanic: packForMechanic,
    all: function () { return data().packs.slice(); }
  };
})();
