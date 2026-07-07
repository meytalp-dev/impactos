// ============================================================================
// island11-game.js — מריץ משותף לשני משחקוני אי 11 (מילות יחס / מקום)
// 7.7.2026 · לוח בניית האיים C11
//
// אי 11 = "מִפְרַץ הַגֶּשְׁרוֹנִים" (השם אושר ע"י מיטל, R1). הנושא: מילות היחס
// הקטנות (עַל · מִתַּחַת · לְיַד · בְּתוֹךְ) הן ה"גשרונים" שמחברים בין מילים
// ומראים אֵיפֹה כל דבר בשונית. ההבחנה מול אי 8 (מילים שכיחות): שם מזהים את
// המילה הכתובה; כאן מבינים את התפקיד/המקום במשפט.
//
// עטיפה דקה סביב ליבת mechanic-mcq (כמו island8-game.js), אבל התוכן מוגדר
// inline (אין פריט-בנק בעל המבנה הזה). כל סבב ממופה ל-config של mechanic-mcq:
//   mode:'where'   → stem=audio (משפט-מיקום), options=image (סצנות SVG) — נגיעה יחידה.
//   mode:'missing' → stem=image (סצנת מיקום + משפט-חור), options=audio — two-tap.
//
// חוקי מדידה:
//   primary_island_id=11 מפורש בכל result (resolveIslandId מכבד אותו — BKT אי 11).
//   characteristic_id פר מילת-יחס (isl11-al/mitachat/leyad/betoch) → EPA G4 פר-יחס.
//   two-tap לאפשרויות-שמע מובנה ב-mechanic-mcq (נגיעה 1 = האזנה, 2 = בחירה).
//
// אודיו: MP3 מוקלט מראש (ElevenLabs eleven_v3 + QA Whisper,
// scripts/generate-island-11-audio.py). במצב where ה-stem (משפט) מתנגן פעם
// אחת ב-mount; במצב missing האפשרויות עצמן הן האודיו (two-tap). קליפ-משימה
// מושמע פעם אחת אחרי "מתחילים", ורק אז עולה הסבב הראשון.
//
// תמונות: assets/island11/*.svg נטענות כ-image_src ישירות (img לא נחסם ב-file://).
// אין עריכת JSON תוכן → אין צורך ב-build-embedded-data.
// ============================================================================
(function () {
  'use strict';

  var ISLAND_ID = 11;
  var SCENE_BASE = 'assets/island11/';

  // סצנות-מיקום (אותו אובייקט, מיקום דג שונה — ההבדל היחיד בין אופציות)
  var SCENE = {
    'arch-on':     SCENE_BASE + 'arch-on.svg',
    'arch-under':  SCENE_BASE + 'arch-under.svg',
    'arch-beside': SCENE_BASE + 'arch-beside.svg',
    'cave-in':     SCENE_BASE + 'cave-in.svg',
    'cave-on':     SCENE_BASE + 'cave-on.svg',
    'cave-beside': SCENE_BASE + 'cave-beside.svg',
  };

  // מילות היחס — טקסט מנוקד (ב/כ/פ ראש-הברה בדגש: בְּתוֹךְ) + מפתח-אודיו
  var WORD = {
    al:       { he: 'עַל',      audio: 'w-isl11-al' },
    mitachat: { he: 'מִתַּחַת',  audio: 'w-isl11-mitachat' },
    leyad:    { he: 'לְיַד',     audio: 'w-isl11-leyad' },
    betoch:   { he: 'בְּתוֹךְ',   audio: 'w-isl11-betoch' },
  };

  // characteristic_id פר מילת-יחס (יחידת-EPA חדשה לאי 11 — פר-יחס = אבחון עשיר
  // למורה: "מבלבל.ת מִתַּחַת/עַל"). אין אות-יעד → epa.js ממפתח תחת characteristic_id.
  var CHAR = {
    al: 'isl11-al', mitachat: 'isl11-mitachat', leyad: 'isl11-leyad', betoch: 'isl11-betoch',
  };

  // ── משחקון 1 "אֵיפֹה הַדָּג?" — הַקְשִׁיבוּ למשפט וּבַחֲרוּ את התמונה ──
  var WHERE_ROUNDS = [
    { prep: 'al',       audio: 's-isl11-dag-al-gesher',       he: 'הַדָּג עַל הַגֶּשֶׁר.',
      correct: 'arch-on',     distractors: ['arch-under', 'arch-beside'] },
    { prep: 'mitachat', audio: 's-isl11-dag-mitachat-gesher', he: 'הַדָּג מִתַּחַת לַגֶּשֶׁר.',
      correct: 'arch-under',  distractors: ['arch-on', 'arch-beside'] },
    { prep: 'leyad',    audio: 's-isl11-dag-leyad-gesher',    he: 'הַדָּג לְיַד הַגֶּשֶׁר.',
      correct: 'arch-beside', distractors: ['arch-on', 'arch-under'] },
    { prep: 'betoch',   audio: 's-isl11-dag-betoch-meara',    he: 'הַדָּג בְּתוֹךְ הַמְּעָרָה.',
      correct: 'cave-in',     distractors: ['cave-on', 'cave-beside'] },
    { prep: 'al',       audio: 's-isl11-dag-al-meara',        he: 'הַדָּג עַל הַמְּעָרָה.',
      correct: 'cave-on',     distractors: ['cave-in', 'cave-beside'] },
  ];

  // ── משחקון 2 "הַמִּלָּה הַקְּטַנָּה הַחֲסֵרָה" — תמונה + משפט-חור, בוחרים מילת-יחס ──
  var MISSING_ROUNDS = [
    { scene: 'arch-on',     answer: 'al',       object: 'הַגֶּשֶׁר',  distractors: ['mitachat', 'leyad'] },
    { scene: 'arch-under',  answer: 'mitachat', object: 'הַגֶּשֶׁר',  distractors: ['al', 'leyad'] },
    { scene: 'arch-beside', answer: 'leyad',    object: 'הַגֶּשֶׁר',  distractors: ['al', 'mitachat'] },
    { scene: 'cave-in',     answer: 'betoch',   object: 'הַמְּעָרָה', distractors: ['al', 'leyad'] },
    { scene: 'cave-on',     answer: 'al',       object: 'הַמְּעָרָה', distractors: ['betoch', 'mitachat'] },
  ];

  function $(id) { return document.getElementById(id); }

  function imageOption(sceneKey, isCorrect) {
    var o = { mode: 'image', image_src: SCENE[sceneKey], image_alt: 'תְּמוּנָה', is_correct: !!isCorrect };
    if (!isCorrect) o.epa = { what: 'Comprehension', where: 'isolation', task: 'find' };
    return o;
  }

  function audioOption(prepKey, isCorrect) {
    var w = WORD[prepKey];
    var o = { mode: 'audio', audio_key: w.audio, label_he: w.he, is_correct: !!isCorrect };
    if (!isCorrect) o.epa = { what: 'Comprehension', where: 'isolation', task: 'find' };
    return o;
  }

  // בונה config ל-mechanic-mcq לפי מצב המשחק
  function toConfig(round, game) {
    if (game.mode === 'missing') {
      var opts = [audioOption(round.answer, true)]
        .concat(round.distractors.map(function (d) { return audioOption(d, false); }));
      var gapSentence = 'הַדָּג ______ ' + round.object + '.';
      return {
        interaction: 'fill_missing',
        questId: 'isl11-m-' + round.scene, item_id: 'isl11-m-' + round.scene,
        characteristic_id: CHAR[round.answer],
        primary_island_id: ISLAND_ID,
        theme: game.theme || 'fish',
        promptLine: 'אֵיזוֹ מִלָּה קְטַנָּה חֲסֵרָה? הַאֲזִינוּ לָאֶפְשָׁרֻיּוֹת וּבַחֲרוּ.',
        stem: { mode: 'image', image_src: SCENE[round.scene], image_alt: 'תְּמוּנַת מִיקּוּם', text_he: gapSentence },
        options: opts,
        layout: 'grid',
      };
    }
    // mode === 'where'
    var iopts = [imageOption(round.correct, true)]
      .concat(round.distractors.map(function (d) { return imageOption(d, false); }));
    return {
      interaction: 'word_to_image',
      questId: 'isl11-w-' + round.audio, item_id: 'isl11-w-' + round.audio,
      characteristic_id: CHAR[round.prep],
      primary_island_id: ISLAND_ID,
      theme: game.theme || 'fish',
      promptLine: 'אֵיפֹה הַדָּג? הַקְשִׁיבוּ וּבַחֲרוּ אֶת הַתְּמוּנָה הַמַּתְאִימָה.',
      stem: { mode: 'audio', audio_key: round.audio, text_he: round.he },
      options: iopts,
      layout: 'grid',
    };
  }

  // ניגון קליפ-משימה חד-פעמי עם callback בסיום (fallback ל-timeout אם אין קובץ)
  function playMissionThen(missionKey, cb) {
    var done = false;
    function fin() { if (!done) { done = true; cb(); } }
    if (!missionKey) { fin(); return; }
    try {
      var a = new Audio('assets/audio/' + encodeURIComponent(missionKey) + '.mp3');
      a.addEventListener('ended', fin);
      a.addEventListener('error', fin);
      a.play().catch(fin);
      setTimeout(fin, 12000);
    } catch (e) { fin(); }
  }

  function boot(game) {
    var root = $('mountRoot');
    var current = null;
    var queue = [];
    var idx = 0;

    $('backBtn').addEventListener('click', function (e) {
      e.preventDefault();
      if (history.length > 1) history.back(); else location.href = 'stage-11-island.html';
    });

    function renderPearls() {
      var el = $('pearls');
      el.innerHTML = '';
      queue.forEach(function (_, i) {
        var p = document.createElement('span');
        p.className = 'pearl' + (i < idx ? ' filled' : '');
        el.appendChild(p);
      });
    }

    function showFinish() {
      $('noniRow').hidden = true;
      $('counter').textContent = queue.length + ' / ' + queue.length;
      root.innerHTML =
        '<div class="finish">' +
        '<img src="assets/noni-happy.png" alt="נוני שמחה" onerror="this.style.display=\'none\'">' +
        '<h2>כָּל הַכָּבוֹד!</h2>' +
        '<p>מְצָאתֶם כֹּל דָּג בַּשּׁוֹנִית — בְּעֶזְרַת הַמִּלִּים הַקְּטַנּוֹת!</p>' +
        '<div class="btns">' +
        '<button class="again" id="againBtn">עוֹד פַּעַם</button>' +
        '<a class="home" href="stage-11-island.html">חֲזָרָה לָאִי</a>' +
        '</div></div>';
      $('againBtn').addEventListener('click', function () { location.reload(); });
      try { window.AvneiAudio.play('completion-isl11'); } catch (e) {}
    }

    function mountNext() {
      if (current && current.unmount) { try { current.unmount(); } catch (e) {} }
      current = null;
      renderPearls();
      if (idx >= queue.length) { showFinish(); return; }

      var cfg = queue[idx];
      $('counter').textContent = (idx + 1) + ' / ' + queue.length;
      $('noniRow').hidden = false;
      $('promptText').textContent = cfg.promptLine;

      cfg.onComplete = function () {
        idx++;
        renderPearls();
        var pearls = document.querySelectorAll('.pearl');
        var p = pearls[idx - 1];
        if (p) { p.classList.add('just-added'); setTimeout(function () { p.classList.remove('just-added'); }, 600); }
        setTimeout(mountNext, 250);
      };

      current = window.AvneiMechanics.mcq.mount(root, cfg);
    }

    // בניית התור מהתוכן ה-inline (בלי fetch)
    var rounds = (game.mode === 'missing') ? MISSING_ROUNDS : WHERE_ROUNDS;
    queue = rounds.map(function (r) { return toConfig(r, game); });

    $('startVeil').hidden = false;
    $('startBtn').addEventListener('click', function () {
      try { if (window.AvneiAudio.unlock) window.AvneiAudio.unlock(); } catch (e) {}
      $('startVeil').hidden = true;
      idx = 0;
      // הוראת-המשימה של נוני פעם אחת — ורק אחריה הסבב הראשון
      playMissionThen(game.missionKey, mountNext);
    });
  }

  window.AvneiIsland11Game = { boot: boot, _toConfig: toConfig, _SCENE: SCENE, _WORD: WORD };
})();
