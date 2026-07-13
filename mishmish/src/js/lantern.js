/* ============================================================
   מישמיש — lantern.js  →  window.MishmishLantern
   ------------------------------------------------------------
   משחקון-המיפוי (הפרקטיס הראשון, חובה). מכניקת "פנס":
   מישמיש אומר מילה → הילד מזיז פנס בחושך → מוצא את מה ששמע.
   השראת-מכניקה: avnei-yesod/underwater-app/stage-3-flashlight-demo.html
   ההבדל (re-point): המטרה = "התמונה ששמעת את שמה" (audioWord→img),
   לא "מתחיל באות". שמיעתי-קודם · בלי אדום/ירוק · ניסיון-ראשון בלבד נמדד.
   מחובר ל-window.MishmishBKT (ingest) ו-window.MishmishAudio (hebrew).
   דגלי-URL: ?reset=1 (איפוס BKT) · ?peek=1 (מבט-מבוגר / snapshot).
   ============================================================ */
window.MishmishLantern = (function () {
  var DATA = window.MISHMISH_DATA, BKT = window.MishmishBKT, A = window.MishmishAudio;

  function q(s) { return document.querySelector(s); }
  function flag(n) { return new URLSearchParams(location.search).get(n); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // מיקומי-פיזור (%). נבחרים אקראית פר-סבב כדי שהחושך ירגיש חדש בכל פעם.
  var SLOTS = [
    { l: 14, t: 30 }, { l: 50, t: 24 }, { l: 78, t: 32 },
    { l: 20, t: 58 }, { l: 52, t: 62 }, { l: 80, t: 56 }
  ];
  var MOODS = ['idle', 'speaking', 'listening', 'thinking', 'hint', 'confused-soft', 'happy', 'celebrate'];

  function start() {
    if (flag('reset')) BKT.reset();
    BKT.beginSession();
    MOODS.forEach(function (m) { var im = new Image(); im.src = '../assets/characters/mishmish/mishmish-' + m + '.png'; });

    // בחירת-pack בזמן-ריצה דרך ה-loader (?pack=/?mechanic=). ברירת-מחדל = mapping = מה שרץ היום.
    // fallback לבחירה-הישנה אם ה-loader לא נטען — כדי לא לשבור התנהגות קיימת.
    var sel = window.MishmishData &&
      window.MishmishData.pick({ pack: 'mapping', mechanic: 'lantern' });
    var pack = sel ? sel.pack : DATA.packs.filter(function (p) { return p.pack === 'mapping'; })[0];
    if (!pack) { console.error('mapping pack missing'); return; }
    var items = pack.items, idx = 0;

    var els = {
      stage: q('#stage'), field: q('#field'), dark: q('#dark'), beam: q('#beam'),
      basket: q('#basket'), word: q('#word'), listen: q('#listen'),
      mishmish: q('#mishmish'), scaffold: q('#scaffold'), placeHe: q('#place-he')
    };
    els.placeHe.textContent = pack.place.he;

    // סל-אוצר: כף פר-פריט
    els.basket.innerHTML = '';
    items.forEach(function () { var s = document.createElement('span'); s.className = 'slot'; els.basket.appendChild(s); });
    var slots = els.basket.children;

    function setMood(m) { els.mishmish.src = '../assets/characters/mishmish/mishmish-' + m + '.png'; els.mishmish.classList.toggle('celebrate', m === 'celebrate'); }

    // ── הזזת הפנס (מסכה רדיאלית עוקבת) ──
    function moveBeam(cx, cy) {
      var r = els.stage.getBoundingClientRect();
      var x = cx - r.left, y = cy - r.top;
      els.dark.style.setProperty('--mx', x + 'px'); els.dark.style.setProperty('--my', y + 'px');
      els.beam.style.setProperty('--mx', x + 'px'); els.beam.style.setProperty('--my', y + 'px');
    }
    els.stage.addEventListener('pointermove', function (e) { moveBeam(e.clientX, e.clientY); });
    els.stage.addEventListener('pointerdown', function (e) { moveBeam(e.clientX, e.clientY); });

    // ── מצב פר-פריט ──
    var cur = null;   // { item, measuredDone, wrong, hintTimer }

    function playWord(slow) {
      var item = cur.item;
      setMood('speaking');
      return A.hebrew(item.prompt.audio_he || item.prompt.he, { key: item.id, slow: slow, statusEl: els.listen })
        .then(function () { setMood('listening'); }, function () { setMood('listening'); });
    }

    function clearHint() { if (cur && cur.hintTimer) { clearTimeout(cur.hintTimer); cur.hintTimer = null; } }
    function scheduleHint() {
      clearHint();
      cur.hintTimer = setTimeout(function () {
        var rem = els.field.querySelector('.obj[data-correct="1"]:not(.caught)');
        if (rem) { rem.classList.add('hint'); setMood('hint'); }
      }, 9000);
    }

    function mount() {
      if (idx >= items.length) return finale();
      var item = items[idx];
      cur = { item: item, measuredDone: false, wrong: 0, hintTimer: null };
      els.field.innerHTML = '';
      els.scaffold.classList.remove('show');
      els.word.textContent = item.prompt.he;      // בועת-היעד (מנוקדת)

      var opts = shuffle(item.options);
      var pos = shuffle(SLOTS).slice(0, opts.length);
      opts.forEach(function (opt, i) {
        var el = document.createElement('button');
        el.className = 'obj';
        el.type = 'button';
        el.dataset.correct = opt.correct ? '1' : '0';
        el.setAttribute('aria-label', opt.cap);
        el.style.insetInlineStart = pos[i].l + '%';
        el.style.top = pos[i].t + '%';
        el.style.setProperty('--bob', (3 + (i % 4) * 0.4).toFixed(1) + 's');
        el.style.animationDelay = (i * 0.22).toFixed(2) + 's';
        // תמונה אמיתית אם קיימת, אחרת אימוג'י (אסטרטגיית-placeholder)
        if (opt.img) {
          var im = document.createElement('img');
          im.src = '../assets/items/' + opt.img + '.png'; im.alt = '';
          im.onerror = function () { el.textContent = opt.emoji || '❓'; };
          el.appendChild(im);
        } else { el.textContent = opt.emoji || '❓'; }
        el.addEventListener('click', function () { onTap(el, opt); });
        els.field.appendChild(el);
      });

      setTimeout(function () { playWord(false); }, 350);
      scheduleHint();
    }

    function namePop(el, w) {
      var rc = el.getBoundingClientRect();
      var p = document.createElement('div'); p.className = 'name-pop'; p.textContent = w;
      p.style.left = (rc.left + rc.width / 2) + 'px'; p.style.top = (rc.top + rc.height / 2) + 'px';
      document.body.appendChild(p); setTimeout(function () { p.remove(); }, 1300);
    }
    function fillBasket(txt) {
      var s = slots[idx]; if (s) { s.textContent = txt; s.classList.add('filled'); }
    }

    function onTap(el, opt) {
      if (el.classList.contains('caught')) return;
      clearHint();

      // ── מדידה: ניסיון ראשון בלבד (עיקרון נעול) ──
      if (!cur.measuredDone) {
        cur.measuredDone = true;
        BKT.ingest({
          pattern: cur.item.pattern || 'mapping', target: cur.item.target, dimension: cur.item.dimension || 'recognize',
          firstTry: true, correct: !!opt.correct, pb_focus: !!cur.item.pb_focus
        });
      }

      if (opt.correct) {
        el.classList.remove('hint');
        namePop(el, opt.cap);
        setMood('celebrate');
        el.classList.add('caught');
        var emo = opt.emoji || '✔';
        setTimeout(function () { fillBasket(emo); }, 250);
        setTimeout(function () { setMood('happy'); idx++; mount(); }, 1050);
      } else {
        // מסיח → נבהל ובורח למקום חדש (בלי אדום/ירוק)
        cur.wrong++;
        setMood('confused-soft');
        el.classList.add('startle');
        setTimeout(function () {
          el.classList.remove('startle');
          var f = shuffle(SLOTS)[0];
          el.style.insetInlineStart = f.l + '%'; el.style.top = f.t + '%';
          setMood('listening');
        }, 600);
        // רמז מדורג: השמעה חוזרת; אחרי 2 טעויות — הבהוב הנכון + פיגום-עמית
        playWord(true);
        if (cur.wrong >= 2) {
          var rem = els.field.querySelector('.obj[data-correct="1"]:not(.caught)');
          if (rem) rem.classList.add('hint');
          els.scaffold.classList.add('show');   // אמיר (טקסט ערבי מגודר עד אימות)
        }
        scheduleHint();
      }
    }

    // ── שורת שפת-הישרדות + כפתור האזנה ──
    els.listen.addEventListener('click', function () { if (cur) playWord(false); });
    q('#sv-again').addEventListener('click', function () { if (cur) playWord(false); });
    q('#sv-slow').addEventListener('click', function () { if (cur) playWord(true); });
    q('#sv-help').addEventListener('click', function () {
      if (!cur) return;
      var rem = els.field.querySelector('.obj[data-correct="1"]:not(.caught)');
      if (rem) rem.classList.add('hint');
      setMood('hint'); playWord(true); els.scaffold.classList.add('show');
    });

    function finale() {
      setMood('celebrate');
      q('#doneOverlay').classList.remove('hidden');
      if (flag('peek')) showPeek();
    }
    function showPeek() {
      var box = document.createElement('pre'); box.className = 'peek';
      box.textContent = 'מבט-מבוגר · פרופיל-מיפוי (BKT):\n' + JSON.stringify(BKT.snapshot(), null, 2)
        + '\n\nדיוק פּ/בּ: ' + (BKT.pbAccuracy() == null ? '—' : Math.round(BKT.pbAccuracy() * 100) + '%');
      document.body.appendChild(box);
    }

    // ── התחלה: overlay-פתיחה משחרר אודיו (unlock) ──
    q('#startBtn').addEventListener('click', function () {
      q('#introOverlay').classList.add('hidden');
      mount();
    });
    // דגלי-צילום בלבד: ?open=1 מדלג על הפתיחה · ?lit=1 מסיר את החושך להצגת השדה
    if (flag('lit')) { els.dark.style.display = 'none'; els.beam.style.display = 'none'; }
    if (flag('open')) { q('#introOverlay').classList.add('hidden'); mount(); }
    q('#againBtn').addEventListener('click', function () {
      idx = 0;
      Array.prototype.forEach.call(slots, function (s) { s.textContent = ''; s.classList.remove('filled'); });
      q('#doneOverlay').classList.add('hidden');
      var pk = document.querySelector('.peek'); if (pk) pk.remove();
      mount();
    });
  }

  return { start: start };
})();
