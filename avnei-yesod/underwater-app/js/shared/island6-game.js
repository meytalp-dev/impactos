// ============================================================================
// island6-game.js — מריץ משותף לשני משחקוני אי 6 (אוטומטיזציה ושטף מילה)
// לוח בניית האיים N6 · 7.7.2026
//
// שני המשחקונים רצים על ליבת mechanic-flash-word ומשתפים בחירת-מילים, מונה-פנינים
// ומסך-סיום. התוכן = anchor words שכבר נלמדו (word-adapter) שיש להן אודיו
// word-<key>.mp3 קיים — אין המצאת מילים.
//
//   AvneiIsland6Game.bootFast()    → "דָּג מָהִיר"  — הבזק שהולך ומתקצר בין סבבים.
//   AvneiIsland6Game.bootRepeat()  → "דְּגִיגוֹן חוֹזֵר" — repeated reading, אותה מילה
//                                     חוזרת על דגים שונים; מודדים שיפור זמן-תגובה.
//
// 🔴 מדידה: primary_island_id=6 + response_time_ms על תשובה נכונה. המילה המדויקת
//   רוכבת ב-item_id (הסכמה נעולה, אין שדה target_word). אין טיימר גלוי; חלון-ההבזק
//   מסתגל (ילד.ה איטי.ת → המילה נשארת יותר) ולעולם לא "נכשלים בגלל זמן".
// ============================================================================
(function () {
  'use strict';

  var ISLAND_ID = 6;

  // ---- מאגר-מילים: anchor words מוכרות לגיל, כולן עם word-<key>.mp3 קיים ----
  // 'short' = 2 אותיות (הבזק ראשוני ארוך→קצר); 'long' = 3-4 אותיות (המשך).
  var WORDS = [
    { text: 'יָד',    key: 'yud-dalet-yad',          band: 'short' },
    { text: 'דָּג',   key: 'dalet-gimel-dag',        band: 'short' },
    { text: 'גַּן',   key: 'gimel-nun-gan',          band: 'short' },
    { text: 'יָם',    key: 'yud-mem-yam',            band: 'short' },
    { text: 'אָב',    key: 'alef-bet-av',            band: 'short' },
    { text: 'אָח',    key: 'alef-het-ach',           band: 'short' },
    { text: 'נֵר',    key: 'nun-resh-ner',           band: 'short' },
    { text: 'גַּל',   key: 'gimel-lamed-gal',        band: 'short' },
    { text: 'בַּת',   key: 'bet-tav-bat',            band: 'short' },
    { text: 'קַר',    key: 'qof-resh-qar',           band: 'short' },
    { text: 'חַם',    key: 'het-mem-cham',           band: 'short' },
    { text: 'מַר',    key: 'mem-resh-mar',           band: 'short' },
    { text: 'בַּיִת',  key: 'bet-yud-tav-bayit',      band: 'long' },
    { text: 'גָּמָל',  key: 'gimel-mem-lamed-gamal',  band: 'long' },
    { text: 'פִּיל',   key: 'pey-yud-lamed-pil',      band: 'long' },
    { text: 'בָּלוֹן',  key: 'bet-lamed-vav-nun-balon', band: 'long' },
    { text: 'שָׁעוֹן',  key: 'shin-ayin-vav-nun-shaon', band: 'long' },
    { text: 'תַּפּוּז', key: 'tav-pey-vav-zayin-tapuz', band: 'long' },
  ];

  function audioKey(w) { return 'word-' + w.key; }
  function firstLetter(w) { return (w.text || '').charAt(0); }   // אות ראשונה (עם ניקוד — נחתך בהמשך)
  function baseFirstLetter(w) {
    // אות-בסיס ראשונה בלי ניקוד (לתיוג teacher/EPA).
    var t = w.text || '';
    for (var i = 0; i < t.length; i++) {
      var c = t.charCodeAt(i);
      if (c >= 0x05D0 && c <= 0x05EA) return t.charAt(i);
    }
    return null;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // 2 מסיחים = מילים אמיתיות אחרות מהמאגר, מובחנות בבירור מהיעד.
  function distractorsFor(word, n) {
    var pool = WORDS.filter(function (w) { return w.text !== word.text; });
    return shuffle(pool).slice(0, n || 2);
  }

  function optionsFor(word) {
    var opts = [{ text_he: word.text, is_correct: true }];
    distractorsFor(word, 2).forEach(function (d) {
      opts.push({ text_he: d.text, is_correct: false });
    });
    return opts;
  }

  function $(id) { return document.getElementById(id); }

  // ניגון קליפ-משימה חד-פעמי עם callback (fallback ל-timeout אם אין קובץ).
  function playMissionThen(missionKey, cb) {
    var done = false;
    function fin() { if (!done) { done = true; cb(); } }
    if (!missionKey) { fin(); return; }
    try {
      var a = new Audio('assets/audio/' + encodeURIComponent(missionKey) + '.mp3');
      a.addEventListener('ended', fin);
      a.addEventListener('error', fin);
      a.play().catch(fin);
      setTimeout(fin, 10000);
    } catch (e) { fin(); }
  }

  // ---- שלד-ריצה משותף (מונה, פנינים, מסך-סיום) ----
  function makeRunner(cfg) {
    var root = $('mountRoot');
    var current = null;

    $('backBtn').addEventListener('click', function (e) {
      e.preventDefault();
      if (history.length > 1) history.back(); else location.href = 'stage-6-island.html';
    });

    function renderPearls(total, done) {
      var el = $('pearls'); if (!el) return;
      el.innerHTML = '';
      for (var i = 0; i < total; i++) {
        var p = document.createElement('span');
        p.className = 'pearl' + (i < done ? ' filled' : '');
        el.appendChild(p);
      }
    }

    function pulsePearl(done) {
      var pearls = document.querySelectorAll('.pearl');
      var p = pearls[done - 1];
      if (p) { p.classList.add('just-added'); setTimeout(function () { p.classList.remove('just-added'); }, 600); }
    }

    function showFinish(total) {
      $('noniRow').hidden = true;
      $('counter').textContent = total + ' / ' + total;
      try { if (typeof addPearl === 'function') addPearl(1); } catch (e) {}
      root.innerHTML =
        '<div class="finish">' +
        '<img src="assets/noni-happy.png" alt="נוני שמחה" onerror="this.style.display=\'none\'">' +
        '<h2>' + cfg.finishTitle + '</h2>' +
        '<p>' + cfg.finishLine + '</p>' +
        '<div class="btns">' +
        '<button class="again" id="againBtn">עוֹד פַּעַם</button>' +
        '<a class="home" href="stage-6-island.html">חֲזָרָה לָאִי</a>' +
        '</div></div>';
      $('againBtn').addEventListener('click', function () { location.reload(); });
      try { window.AvneiAudio.play(cfg.completionKey); } catch (e) {}
    }

    return {
      root: root,
      renderPearls: renderPearls,
      pulsePearl: pulsePearl,
      showFinish: showFinish,
      mount: function (mcfg) {
        if (current && current.unmount) { try { current.unmount(); } catch (e) {} }
        current = window.AvneiMechanics['flash-word'].mount(root, mcfg);
        return current;
      },
    };
  }

  function startVeil(onStart) {
    $('startVeil').hidden = false;
    $('startBtn').addEventListener('click', function () {
      try { if (window.AvneiAudio.unlock) window.AvneiAudio.unlock(); } catch (e) {}
      $('startVeil').hidden = true;
      onStart();
    });
  }

  // ========================================================================
  // משחקון 1 — "דָּג מָהִיר": הבזק שהולך ומתקצר בין סבבים (אדפטיבי).
  // ========================================================================
  function bootFast(overrides) {
    var cfg = Object.assign({
      missionKey: 'mission-isl06-fast',
      completionKey: 'completion-isl06',
      finishTitle: 'כָּל הַכָּבוֹד!',
      finishLine: 'זִהִיתֶם אֶת הַמִּלִּים בִּמְהִירוּת שֶׁל דָּג!',
    }, overrides || {});

    var run = makeRunner(cfg);
    // סולם-הבזק יורד (ms). ילד.ה איטי.ת/טעות → לא ממשיכים לרדת (עדינות אדפטיבית).
    var LADDER = [2200, 1900, 1600, 1300, 1050, 850];
    var rounds = shuffle(WORDS.filter(function (w) { return w.band === 'short'; })).slice(0, 3)
      .concat(shuffle(WORDS.filter(function (w) { return w.band === 'long'; })).slice(0, 3));
    rounds = shuffle(rounds).slice(0, LADDER.length);
    var total = rounds.length;
    var idx = 0;
    var rung = 0;   // מיקום בסולם-ההבזק

    function mountNext() {
      run.renderPearls(total, idx);
      if (idx >= total) { run.showFinish(total); return; }
      var word = rounds[idx];
      $('counter').textContent = (idx + 1) + ' / ' + total;
      $('noniRow').hidden = false;
      $('promptText').textContent = 'אֵיזוֹ מִילָּה שָׂחֲתָה? הַקִּישׁוּ עָלֶיהָ!';

      run.mount({
        variant: 'flash',
        flashMs: LADDER[Math.min(rung, LADDER.length - 1)],
        target: { text_he: word.text, audio_key: audioKey(word) },
        options: optionsFor(word),
        item_id: 'isl6-flash-' + word.key,
        target_letter: baseFirstLetter(word),
        target_word: word.text,
        primary_island_id: ISLAND_ID,
        theme: 'fish',
        onResult: function (ctx) {
          // אדפטיבי: הצליח מהר ובניסיון ראשון → מקצרים; אחרת נשארים באותה רמה.
          if (ctx.correct && !ctx.slow && ctx.attempts === 1) rung = Math.min(rung + 1, LADDER.length - 1);
          else if (rung > 0) rung = Math.max(rung - 1, 0);
        },
        onComplete: function () {
          idx++;
          run.renderPearls(total, idx);
          run.pulsePearl(idx);
          setTimeout(mountNext, 220);
        },
      });
    }

    startVeil(function () { playMissionThen(cfg.missionKey, mountNext); });
  }

  // ========================================================================
  // משחקון 2 — "דְּגִיגוֹן חוֹזֵר": repeated reading. אותה מילה חוזרת על דגים
  //             שונים; המילה נשארת גלויה, נוני אומרת אותה, מודדים שיפור-זמן.
  // ========================================================================
  function bootRepeat(overrides) {
    var cfg = Object.assign({
      missionKey: 'mission-isl06-repeat',
      completionKey: 'completion-isl06',
      finishTitle: 'מְעֻלֶּה!',
      finishLine: 'כֹּל פַּעַם הִכַּרְתֶּם אֶת הַמִּלִּים מַהֵר יוֹתֵר!',
    }, overrides || {});

    var run = makeRunner(cfg);
    var REPEATS = 3;
    var targets = shuffle(WORDS.filter(function (w) { return w.band === 'short'; })).slice(0, 3);
    // רצף מרווח: A B C A B C A B C (חזרה מרווחת, לא צמודה).
    var queue = [];
    for (var r = 0; r < REPEATS; r++) {
      targets.forEach(function (w, i) { queue.push({ word: w, occ: r + 1, ti: i }); });
    }
    var total = queue.length;
    var idx = 0;
    var bestRt = {};   // key → זמן-התגובה הטוב ביותר עד כה (לפידבק-שיפור)

    function mountNext() {
      run.renderPearls(total, idx);
      if (idx >= total) { run.showFinish(total); return; }
      var item = queue[idx];
      var word = item.word;
      $('counter').textContent = (idx + 1) + ' / ' + total;
      $('noniRow').hidden = false;
      $('promptText').textContent = 'אוֹתָהּ מִילָּה שׁוּב — הַקִּישׁוּ עָלֶיהָ!';

      run.mount({
        variant: 'repeat',
        flashMs: null,                     // repeated reading — המילה נשארת גלויה
        target: { text_he: word.text, audio_key: audioKey(word) },
        options: optionsFor(word),
        item_id: 'isl6-repeat-' + word.key + '-r' + item.occ,
        target_letter: baseFirstLetter(word),
        target_word: word.text,
        primary_island_id: ISLAND_ID,
        theme: 'fish',
        onResult: function (ctx) {
          if (!ctx.correct) return;
          var prev = bestRt[word.key];
          if (item.occ > 1 && typeof prev === 'number' && ctx.response_time_ms < prev - 150) {
            // שיפור-זמן על אותה מילה — פידבק חיובי רך (בלי מספרים לילד.ה).
            $('promptText').textContent = 'מַהֵר יוֹתֵר! 🐟💨';
          }
          if (typeof prev !== 'number' || ctx.response_time_ms < prev) bestRt[word.key] = ctx.response_time_ms;
        },
        onComplete: function () {
          idx++;
          run.renderPearls(total, idx);
          run.pulsePearl(idx);
          setTimeout(mountNext, 220);
        },
      });
    }

    startVeil(function () { playMissionThen(cfg.missionKey, mountNext); });
  }

  window.AvneiIsland6Game = {
    bootFast: bootFast,
    bootRepeat: bootRepeat,
    WORDS: WORDS,
    _optionsFor: optionsFor,
    _audioKey: audioKey,
  };
})();
