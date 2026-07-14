/* ============================================================
   מישמיש — play.js  →  window.MishmishPlay
   ------------------------------------------------------------
   בקר-סשן: טוען חבילת-תוכן, מנהל רצף פריטים, שורת-התקדמות,
   שורת שפת-הישרדות, וסיום. מבוסס על lumi/app/js/engine.js.
   דגלים ב-URL: ?reset=1 (איפוס BKT) · ?peek=1 (חלון-מבוגר).
   ============================================================ */
window.MishmishPlay = (function () {
  var DATA = window.MISHMISH_DATA, BKT = window.MishmishBKT, A = window.MishmishAudio;

  function q(sel) { return document.querySelector(sel); }
  function flag(name) { return new URLSearchParams(location.search).get(name); }

  // preload — כל מצבי הדמות נטענים מראש כדי שהחלפת-מצב לא תהבהב/תשהה
  var MOODS = ['idle', 'speaking', 'listening', 'thinking', 'hint', 'confused-soft', 'happy', 'celebrate'];
  function preload() {
    MOODS.forEach(function (m) {
      var im = new Image(); im.src = '../assets/characters/mishmish/mishmish-' + m + '.png';
    });
  }

  function start() {
    if (flag('reset')) BKT.reset();
    BKT.beginSession();
    preload();

    // בחירת-pack בזמן-ריצה דרך ה-loader (?pack=/?mechanic=). ברירת-מחדל = market = מה שרץ היום.
    // fallback לבחירה-הישנה אם ה-loader לא נטען — כדי לא לשבור התנהגות קיימת.
    var sel = window.MishmishData &&
      window.MishmishData.pick({ pack: 'market', mechanic: 'give-me' });
    var pack = sel ? sel.pack :
      (DATA.packs.filter(function (p) { return p.pack === 'market'; })[0] || DATA.packs[0]);
    var items = pack.items;
    var idx = 0, active = null;

    // חיבור קליפי-אודיו מוקלטים (יעד עברית). key = item.id → קובץ.
    var clipMap = {};
    items.forEach(function (it) { clipMap[it.id] = pack.pack + '/' + it.target + '.mp3'; });
    A.setClipMap(clipMap);

    var els = {
      scene: q('.scene'), mishmish: q('#mishmish'), bubbleHe: q('#bubble-he'),
      listen: q('#listen'), tiles: q('#tiles'), scaffold: q('#scaffold'),
      progress: q('#progress'), placeChip: q('#place-chip'), instr: q('#instr')
    };

    // רקע-סצנה + שם-מקום
    els.scene.style.backgroundImage = "url('../assets/backgrounds/bg-shared-market.png')";
    els.placeChip.querySelector('.he').textContent = pack.place.he;

    // שורת-התקדמות (כף פר-פריט)
    els.progress.innerHTML = '';
    items.forEach(function () {
      var p = document.createElement('span'); p.className = 'paw'; els.progress.appendChild(p);
    });
    function paint() {
      Array.prototype.forEach.call(els.progress.children, function (p, i) {
        p.classList.toggle('done', i < idx);
        p.classList.toggle('current', i === idx);
      });
    }

    // הוראה מנוקדת (פעם-ראשונה בלבד פר-מפתח)
    var shownInstr = {};
    function instrFor(item) {
      var key = item.prompt.instruction_key;
      if (!key || shownInstr[key]) { els.instr.textContent = ''; return; }
      shownInstr[key] = true;
      var e = DATA.instructions[key];
      els.instr.textContent = e ? e.he : '';
    }

    function mountItem() {
      if (idx >= items.length) return finale();
      paint();
      var item = items[idx];
      instrFor(item);
      active = window.MishmishMeasured.mount(item, {
        pattern: pack.pattern,
        mishmish: els.mishmish, bubbleHe: els.bubbleHe, listen: els.listen,
        tiles: els.tiles, scaffold: els.scaffold, instr: els.instr,
        onMeasured: function (evt) { BKT.ingest(evt); },
        onDone: function () { idx++; window.setTimeout(mountItem, 500); }
      });
    }

    // כפתור-האזנה + שורת שפת-הישרדות
    els.listen.addEventListener('click', function () { if (active) active.replay(false); });
    q('#sv-again').addEventListener('click', function () { if (active) active.replay(false); });
    q('#sv-slow').addEventListener('click', function () { if (active) active.replay(true); });
    q('#sv-help').addEventListener('click', function () { if (active) active.hint(); });

    function finale() {
      paint();
      els.mishmish.src = '../assets/characters/mishmish/mishmish-celebrate.png';
      els.mishmish.classList.add('celebrate');
      els.bubbleHe.textContent = 'כָּל הַכָּבוֹד!';
      els.tiles.innerHTML = '';
      els.scaffold.hidden = true;
      if (flag('peek')) showPeek();
    }

    function showPeek() {
      var snap = BKT.snapshot();
      var box = document.createElement('pre');
      box.style.cssText = 'position:fixed;inset-block-end:8px;inset-inline-start:8px;max-width:340px;' +
        'background:#fffaf1;border:1px solid #e4cfaa;border-radius:12px;padding:10px;font-size:12px;z-index:9;';
      box.textContent = 'מבט-מבוגר (BKT):\n' + JSON.stringify(snap, null, 2);
      document.body.appendChild(box);
    }

    mountItem();
  }

  return { start: start };
})();
