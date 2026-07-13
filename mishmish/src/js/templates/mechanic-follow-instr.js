/* ============================================================
   מישמיש — templates/mechanic-follow-instr.js  →  window.MishmishFollowInstr
   ------------------------------------------------------------
   מכניקת "בִּיצוּעַ הוֹרָאוֹת" (follow-instr) — קליטה (reception).
   מישמיש נותן הוראה מדוברת ("שִׂימוּ אֶת הַסֵּפֶר עַל הַשֻּׁלְחָן"),
   הילד גורר (או מקיש) את הפריט אל יעד-המיקום הנכון מבין 2–3 מיקומים.
   target = lexeme + preposition (איזה פריט + לְאָן / באיזו מילת-יחס).

   🔴 חוק מבני (זהה ל-M2/M3/M4): קוד data-driven בלבד. אין תוכן קשיח.
      התוכן נקרא מ-pack דרך MishmishData.pick({pack,mechanic:'follow-instr'}):
        · פריטים (lexeme) ← pack.lexicon (he/img נפתרים לפי id)
        · מילות-יחס + מיקומים + השמות ← pack.follow_instr (עתידי)
      עד שסוכן ה-pack יזרים pack.follow_instr, נופלים ל-fixture
      window.MISHMISH_FOLLOW_INSTR_DEMO (חי בדף follow-instr.html, לא כאן
      ולא ב-pack) — טיוטה מנוקדת לאישור מיטל. גם כשאין pack.follow_instr,
      פריטי-ה-fixture נפתרים קודם מול pack.lexicon (למשל ?pack=class →
      סֵפֶר/יַלְקוּט/מַחְבֶּרֶת עם תמונות אמיתיות מ-assets/items/class/).

   חוזה נמדד (זהה ל-measured.js — לא משנים):
     · שמיעתי-קודם — יעדי-המיקום נעולים והפריט לא-נגרר עד סוף ההשמעה.
     · רק הניסיון-הראשון נמדד; אחרי טעות = מצב-למידה (לא נמדד).
     · בלי אדום/ירוק — טעות = הזמנה להאזין שוב (retry=צהוב, selected=כחול-זהות,
       מישמיש confused-soft → hint).
     · מדרג-רמז: השמעה-חוזרת (איטית) → הצבעה חזותית על היעד → פיגום-אמיר (עאמייה).
     · טקסט עאמייה מגודר עד אימות בודק ילידי (amir.js + data-arabic-verified).

   מדידה (bkt.js F6): pattern='follow_instr' (probe, spine:false — לא מזהם
     5 תבניות-השדרה) · intent='follow' · dimension='recognize' (רמה 1 · קליטה) ·
     target = מזהה-הפריט (סף ≥2-מילים-שונות = הכללה, לא שינון) ·
     טעות → errorAxis='pattern' (הבנת-הוראה, לא אוצר/צליל).

   מבוסס על same-different.js (מכניקה מחזיקת-דרייבר עצמאי) + measured.js (החוזה).
   ============================================================ */
window.MishmishFollowInstr = (function () {
  var BKT = window.MishmishBKT, A = window.MishmishAudio;

  function q(s) { return document.querySelector(s); }
  function flag(n) { try { return new URLSearchParams(location.search).get(n); } catch (e) { return null; } }
  function wait(ms) { return new Promise(function (r) { window.setTimeout(r, ms); }); }

  var MOODS = ['idle', 'speaking', 'listening', 'thinking', 'hint', 'confused-soft', 'happy', 'celebrate'];
  function preload() {
    MOODS.forEach(function (m) { var im = new Image(); im.src = '../assets/characters/mishmish/mishmish-' + m + '.png'; });
    ['idle', 'hint', 'listening', 'happy'].forEach(function (m) { var im = new Image(); im.src = '../assets/characters/peers/amir-' + m + '.png'; });
  }

  // ── seam חוזה-דאטה ────────────────────────────────────────────
  // אינדקס lexicon (id→lexeme) מ-pack; ריק כשאין pack (מצב-fixture).
  function buildLexIndex(pack) {
    var idx = {};
    ((pack && pack.lexicon) || []).forEach(function (l) { if (l && l.id) idx[l.id] = l; });
    return idx;
  }

  // resolveItem(id) → {id,he,img(src מלא|null),emoji}. פותר קודם מול pack.lexicon
  // (he/img אמיתיים), אחרת מול פריטי-ה-fixture המוטבעים (inlineItems).
  function resolveItem(id, lexIndex, inlineItems) {
    var lex = lexIndex[id];
    if (lex) {
      return {
        id: lex.id, he: lex.he,
        img: lex.img ? ('../assets/items/' + lex.img) : null,   // lexeme.img כולל תת-תיקייה+.png
        emoji: lex.emoji || null
      };
    }
    var it = inlineItems[id];
    if (it) {
      return {
        id: id, he: it.he,
        img: it.img ? ('../assets/items/' + it.img + '.png') : null,   // fixture: basename תחת items/
        emoji: it.emoji || null
      };
    }
    return null;   // פריט ללא מקור → מדלגים (לא שוברים)
  }

  // נורמליזציה של יעד-מיקום: {id,he,phrase,prep,img(src מלא|null)}
  function resolveLoc(loc) {
    if (!loc || !loc.id) return null;
    return {
      id: loc.id, he: loc.he || loc.id, phrase: loc.phrase || loc.he || loc.id,
      prep: loc.prep || null,
      img: loc.img ? ('../assets/items/' + loc.img + (/\.png$/i.test(loc.img) ? '' : '.png')) : null
    };
  }

  // buildRounds(spec, lexIndex) — כל placement = סבב אחד: פריט-יעד + כל היעדים
  // כאופציות (סדר קבוע ל-QA), הנכון לפי placement.loc.
  function buildRounds(spec, lexIndex) {
    var inlineItems = spec.items || {};
    var locs = (spec.locations || []).map(resolveLoc).filter(Boolean);
    var locIndex = {};
    locs.forEach(function (l) { locIndex[l.id] = l; });
    if (locs.length < 2) return [];   // צריך ≥2 יעדים כדי שתהיה בחירה

    var verb = spec.verb || 'שִׂימוּ';
    var rounds = [];
    (spec.placements || []).forEach(function (pl) {
      var item = resolveItem(pl.item, lexIndex, inlineItems);
      var target = locIndex[pl.loc];
      if (!item || !target) return;    // חוסר-התאמה → מדלגים
      // משפט-ההוראה: placement.he מאושר (טיוטת-מיטל) אם סופק; אחרת בנייה גסה
      // (מתויג asks — דורש אישור-ניקוד). התצוגה = מה שהילד רואה, לכן מעדיפים he.
      var sentence = pl.he || (verb + ' ' + item.he + ' ' + target.phrase);
      rounds.push({
        id: 'follow_instr::' + item.id + '@' + target.id,
        itemId: item.id, itemHe: item.he, itemImg: item.img, itemEmoji: item.emoji,
        correctLocId: target.id,
        prep: target.prep,
        sentence: sentence,                 // מנוקד (מוצג + מושמע)
        audioKey: pl.audio || null,         // seam: קליפ מוקלט עתידי → assets/audio/<key>.mp3
        locs: locs                          // אותה רשימת-יעדים בכל הסבבים (סדר קבוע)
      });
    });
    return rounds;
  }

  function start() {
    if (flag('reset') && BKT.reset) BKT.reset();
    if (BKT.beginSession) BKT.beginSession();
    preload();

    // בחירת-pack בזמן-ריצה (?pack=/?mechanic=). ברירת-מחדל = class (נושא-הכיתה,
    // מרחב hara-courtyard, שנושא את open_close/follow-instr).
    var sel = window.MishmishData &&
      window.MishmishData.pick({ pack: 'class', mechanic: 'follow-instr' });
    var pack = sel && sel.pack;

    // מקור-התוכן: pack.follow_instr (pack-schema — עתידי) → אחרת fixture הדף.
    var demo = window.MISHMISH_FOLLOW_INSTR_DEMO || {};
    var spec = (pack && pack.follow_instr) || demo;
    var usingFallback = !(pack && pack.follow_instr);
    var lexIndex = buildLexIndex(pack);
    var rounds = buildRounds(spec, lexIndex);

    console.log('[follow-instr] pack=' + (pack && pack.pack) + ' rounds=' + rounds.length +
      (usingFallback ? ' (FALLBACK — טיוטה, ממתין ל-pack.follow_instr)' : ''));

    var els = {
      sceneBg: q('#scene-bg'), progress: q('#progress'),
      placeHe: q('#place-he'), placeAr: q('#place-ar'),
      sentence: q('#sentence'), listen: q('#listen'),
      zones: q('#zones'), tray: q('#tray'), item: q('#item'),
      mishmish: q('#mishmish'), scaffold: q('#scaffold'),
      introOverlay: q('#introOverlay'), startBtn: q('#startBtn'),
      doneOverlay: q('#doneOverlay'), againBtn: q('#againBtn')
    };

    // רקע-הסצנה + שם-המקום (מסגור-גשר: מרחב מהעולם של הילד; ערבית מגודרת).
    // מעדיפים pack.meta.setting (למשל hara-courtyard ל-class) על scene של ה-fixture.
    var meta = (pack && pack.meta) || {};
    var scene = demo.scene || {};
    var setting = meta.setting || scene.bg || 'bg-hara-courtyard';
    if (els.sceneBg) els.sceneBg.src = '../assets/backgrounds/' +
      (/^bg-/.test(setting) ? setting : 'bg-' + setting) + '.png';
    var placeHe = scene.place_he || (meta.space === 'shared' ? 'בַּמֶּרְחָב הַמְּשׁוּתָּף' : 'בֶּחָצֵר');
    if (els.placeHe) els.placeHe.textContent = placeHe;
    if (els.placeAr && scene.place_ar) els.placeAr.textContent = scene.place_ar;

    // אמיר — הרכיב המשותף (amir.js). מופיע רק במדרג-הרמז האחרון (עאמייה).
    var Amir = window.MishmishAmir;
    var amir = (Amir && els.scaffold) ? Amir.attach(els.scaffold) : null;

    // שורת-התקדמות (כף פר-סבב)
    els.progress.innerHTML = '';
    rounds.forEach(function () { var p = document.createElement('span'); p.className = 'paw'; els.progress.appendChild(p); });
    var idx = 0, active = null;
    function paintProgress() {
      Array.prototype.forEach.call(els.progress.children, function (p, i) {
        p.classList.toggle('done', i < idx);
        p.classList.toggle('current', i === idx);
      });
    }

    function setMishmish(mood) {
      els.mishmish.src = '../assets/characters/mishmish/mishmish-' + mood + '.png';
      els.mishmish.classList.toggle('celebrate', mood === 'celebrate');
    }

    // ── דרייבר-סבב יחיד: מכונת-מצבים תואמת-חוזה measured.js ──────
    function mountRound() {
      if (idx >= rounds.length) return finale();
      paintProgress();
      var round = rounds[idx];
      var st = { phase: 'loading', measuredDone: false, done: false, hintStep: 0, locked: true };

      // משפט-ההוראה המנוקד
      els.sentence.textContent = round.sentence;

      // ── פריט-היעד (נגרר) ──
      els.item.innerHTML = '';
      els.item.setAttribute('data-item', round.itemId);
      var visual = round.itemImg
        ? '<img src="' + round.itemImg + '" alt="" draggable="false" onerror="this.style.visibility=\'hidden\'">'
        : (round.itemEmoji ? '<span class="emoji" aria-hidden="true">' + round.itemEmoji + '</span>' : '');
      els.item.innerHTML = visual + '<span class="cap">' + round.itemHe + '</span>';
      resetItem();

      // ── יעדי-המיקום (drop-zones) — סדר קבוע ל-QA ──
      els.zones.innerHTML = '';
      round.locs.forEach(function (loc) {
        var z = document.createElement('button');
        z.className = 'zone';
        z.type = 'button';
        z.setAttribute('data-loc', loc.id);
        z.setAttribute('aria-disabled', 'true');          // נעול עד סוף ההשמעה
        z.setAttribute('aria-label', loc.phrase);
        var zv = loc.img
          ? '<img src="' + loc.img + '" alt="" draggable="false" onerror="this.style.visibility=\'hidden\'">'
          : '';
        z.innerHTML = '<span class="drop" aria-hidden="true"></span>' + zv + '<span class="zcap">' + loc.he + '</span>';
        z.addEventListener('click', function () { onChoose(loc.id, z); });
        els.zones.appendChild(z);
      });

      function zoneEls() { return Array.prototype.slice.call(els.zones.children); }
      function zoneById(id) { return zoneEls().filter(function (z) { return z.getAttribute('data-loc') === id; })[0]; }
      function enableZones(on) {
        st.locked = !on;
        els.item.classList.toggle('draggable', !!on);
        zoneEls().forEach(function (z) { z.setAttribute('aria-disabled', on ? 'false' : 'true'); });
      }
      function clearMarks() {
        zoneEls().forEach(function (z) { z.classList.remove('retry', 'selected', 'point'); });
      }

      // ── אודיו-יעד (עברית) — קליפ מוקלט אם קיים (seam), אחרת TTS-fallback חי ──
      function playTarget(slow) {
        setMishmish('speaking');
        return A.hebrew(round.sentence, { key: round.audioKey || round.id, slow: slow, statusEl: els.listen })
          .then(function () { els.listen.setAttribute('data-audio', 'idle'); },
                function () { els.listen.setAttribute('data-audio', 'idle'); });
      }

      // ── מצבים ──
      function introPlaying() {
        st.phase = 'introPlaying';
        enableZones(false);
        playTarget(false).then(awaitingAnswer, awaitingAnswer);   // גם בשגיאת-אודיו — פותחים
      }
      function awaitingAnswer() {
        st.phase = 'awaitingAnswer';
        setMishmish('listening');
        enableZones(true);
        if (amir && amir.el.classList.contains('show')) amir.listening();
      }

      function onChoose(locId, zoneEl) {
        if (st.locked || st.done) return;
        resetItem();                                       // גרירה שהסתיימה — מחזירים לטרֵיי אם לא-נכון
        var correct = (locId === round.correctLocId);

        if (!st.measuredDone) {                            // מדידה — ניסיון ראשון בלבד
          st.measuredDone = true;
          BKT.ingest && BKT.ingest({
            pattern: 'follow_instr',
            intent: 'follow',                              // KC=follow::follow_instr → spine:false (probe)
            target: round.itemId,                          // מזהה-פריט → סף ≥2-מילים-שונות
            dimension: 'recognize',                        // רמה 1 — קליטה
            firstTry: true,
            correct: correct,
            errorAxis: correct ? undefined : 'pattern'     // הבנת-הוראה
          });
          if (correct) return commitCorrect(locId, zoneEl);
          return enterLearning(zoneEl);
        }
        if (correct) return commitCorrect(locId, zoneEl);  // אחרי מצב-למידה: לא נמדד
        return nudgeRetry(zoneEl);
      }

      function commitCorrect(locId, zoneEl) {
        st.phase = 'correct';
        enableZones(false);
        clearMarks();
        zoneEl.classList.add('selected');                  // כחול-זהות, לא ירוק
        // הפריט "מתיישב" ביעד = פידבק חזותי
        var drop = zoneEl.querySelector('.drop');
        if (drop) {
          drop.innerHTML = round.itemImg
            ? '<img src="' + round.itemImg + '" alt="">'
            : (round.itemEmoji ? '<span class="emoji">' + round.itemEmoji + '</span>' : round.itemHe);
          drop.classList.add('filled');
        }
        els.item.classList.add('placed');
        setMishmish('celebrate');
        if (amir && amir.el.classList.contains('show')) amir.happy();
        // בלי "יופי" — שבח קולי יגיע כקליפ מוקלט (מְצֻיָּן/מְעֻלֶּה). כרגע חזותי בלבד.
        window.setTimeout(function () { setMishmish('happy'); if (amir) amir.hide(); complete(); }, 950);
      }

      function enterLearning(zoneEl) {                     // טעות ראשונה → מצב-למידה
        st.phase = 'incorrect';
        markRetry(zoneEl);
        setMishmish('confused-soft');
        window.setTimeout(hint, 700);
      }
      function nudgeRetry(zoneEl) {
        markRetry(zoneEl);
        hint();
      }
      function markRetry(zoneEl) {
        zoneEl.classList.add('retry');                     // צהוב חם, לא אדום
        window.setTimeout(function () { zoneEl.classList.remove('retry'); }, 900);
      }

      // מדרג-רמז: השמעה-חוזרת איטית → הצבעה חזותית → פיגום-אמיר (עאמייה).
      function hint() {
        st.phase = 'hint';
        st.hintStep++;
        setMishmish('hint');
        var tier = st.hintStep >= 3 ? 'amiya' : (st.hintStep >= 2 ? 'point' : 'encourage');
        // אמיר-כדמות מופיע רק במדרג האחרון (עאמייה); לפני כן הבועה מוסתרת.
        if (amir) { if (tier === 'amiya') amir.show('amiya'); else amir.hide(); }
        playTarget(true).then(function () {
          if (st.hintStep >= 2) {                          // שלב 2: הצבעה חזותית על היעד הנכון
            var t = zoneById(round.correctLocId);
            if (t) t.classList.add('point');
          }
          setMishmish('listening');
        }, function () { setMishmish('listening'); });
      }

      function complete() {
        if (st.done) return;
        st.done = true; st.phase = 'complete';
        idx++;
        window.setTimeout(mountRound, 500);
      }

      // ── גרירת-הפריט (Pointer Events — עכבר + מגע) + הקשה-על-יעד (fallback/נגישות) ──
      function resetItem() {
        els.item.classList.remove('placed', 'dragging');
        els.item.style.transform = '';
        els.item.style.left = '';
        els.item.style.top = '';
      }
      var drag = { on: false, id: null, dx: 0, dy: 0 };
      function onDown(e) {
        if (st.locked || st.done) return;
        drag.on = true; drag.id = e.pointerId;
        var r = els.item.getBoundingClientRect();
        drag.dx = e.clientX - (r.left + r.width / 2);
        drag.dy = e.clientY - (r.top + r.height / 2);
        els.item.classList.add('dragging');
        try { els.item.setPointerCapture(e.pointerId); } catch (err) {}
        e.preventDefault();
      }
      function onMove(e) {
        if (!drag.on || e.pointerId !== drag.id) return;
        var stage = els.item.offsetParent || document.body;
        var sr = stage.getBoundingClientRect();
        var x = e.clientX - sr.left - drag.dx;
        var y = e.clientY - sr.top - drag.dy;
        els.item.style.left = x + 'px';
        els.item.style.top = y + 'px';
        els.item.style.transform = 'translate(-50%,-50%)';
        e.preventDefault();
      }
      function onUp(e) {
        if (!drag.on || e.pointerId !== drag.id) return;
        drag.on = false;
        els.item.classList.remove('dragging');
        try { els.item.releasePointerCapture(e.pointerId); } catch (err) {}
        var hit = zoneAtPoint(e.clientX, e.clientY);
        if (hit) onChoose(hit.getAttribute('data-loc'), hit);
        else resetItem();                                  // לא מעל יעד → חזרה לטרֵיי
      }
      function zoneAtPoint(x, y) {
        return zoneEls().filter(function (z) {
          var r = z.getBoundingClientRect();
          return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
        })[0] || null;
      }
      els.item.onpointerdown = onDown;
      els.item.onpointermove = onMove;
      els.item.onpointerup = onUp;
      els.item.onpointercancel = function () { drag.on = false; els.item.classList.remove('dragging'); resetItem(); };

      // ── אתחול הסבב ──
      setMishmish('idle');
      if (amir) amir.hide();
      window.setTimeout(introPlaying, 250);

      // בקר חיצוני לשורת שפת-הישרדות + כפתור-האזנה
      active = {
        replay: function (slow) { playTarget(slow).then(awaitingAnswer, awaitingAnswer); },
        hint: function () { hint(); },
        phase: function () { return st.phase; }
      };
    }

    // כפתור-האזנה + שורת שפת-הישרדות (מקור-אמת יחיד; מזריק+מחווט לפי ה-API הפעיל)
    if (els.listen) els.listen.addEventListener('click', function () { if (active) active.replay(false); });
    if (window.MishmishScaffold) {
      window.MishmishScaffold.bind('#survival', function () { return active; });
    }

    function finale() {
      paintProgress();
      active = null;
      if (els.doneOverlay) els.doneOverlay.classList.remove('hidden');
      setMishmish('celebrate');
      if (flag('peek')) showPeek();
    }
    function showPeek() {
      if (!BKT.snapshot) return;
      var box = document.createElement('pre');
      box.className = 'peek';
      box.textContent = 'מבט-מבוגר · בִּיצוּעַ הוֹרָאוֹת (BKT):\n' + JSON.stringify(BKT.snapshot(), null, 2);
      document.body.appendChild(box);
    }

    // overlay-פתיחה: מתחילים רק אחרי נגיעת-ילד (מדיניות autoplay / unlock אודיו)
    function begin() {
      if (els.introOverlay) els.introOverlay.classList.add('hidden');
      mountRound();
    }
    if (els.startBtn) els.startBtn.addEventListener('click', begin);
    if (flag('open')) begin();
    if (els.againBtn) els.againBtn.addEventListener('click', function () { location.reload(); });

    // אם אין סבבים כלל (אין pack.follow_instr ואין fixture) — הודעה שקטה במקום מסך ריק
    if (!rounds.length && els.introOverlay) {
      var h = els.introOverlay.querySelector('h2');
      if (h) h.textContent = 'אֵין עֲדַיִן הוֹרָאוֹת';
    }
  }

  return { start: start };
})();
