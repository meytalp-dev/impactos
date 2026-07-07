// ============================================================================
// island10b-game.js — מריץ משותף לשני משחקוני-ההמשך של אי 10 (C10b · 7.7.2026)
//
// אי 10 = "מִפְרַץ אַבְנֵי הַבְּנִיָּה" (מורפולוגיה: תחיליות/סיומות). המשחקונים
// המקוריים (C10) מכסים יחיד/רבים ותחיליות מהבנק. שני המשחקונים כאן (אושרו ע"י
// מיטל 7.7) מוסיפים שני תת-נושאים שהבנק לא כיסה כראוי:
//   1. mode:'gender' → זכר/נקבה בהתאמת שם-תואר (הוּא גָּדוֹל / הִיא גְּדוֹלָה).
//        פריטי GenderMismatch בבנק הם הטיית פועל/כינוי (רָכַב/רָכְבָה) — לא סבב-סיומות
//        → תוכן inline חדש (דפוס island11-game): עצם מוכר + תואר, בחירה בין צורת
//        זכר לצורת נקבה. stem=טקסט (העצם נראֶה) · options=טקסט → נגיעה יחידה.
//   2. mode:'hey' → ה' הידיעה (דָּג ↔ הַדָּג). אין אף פריט-בנק (הבנק מכסה רק ל/ב/ו)
//        → תוכן inline: שומעים משפט, ובוחרים איזו מילה נאמרה מבין X / הַX.
//        stem=אודיו (משפט) · options=אודיו (two-tap) — ה' = הברה שלמה, מובחנת באוזן.
//
// חוקי מדידה (זהים ל-island8/10/11):
//   primary_island_id=10 מפורש בכל result (resolveIslandId מכבד אותו → BKT אי 10).
//   characteristic_id יציב פר-משחקון (isl10-gender-adj / isl10-hey-hayedia) → EPA G4.
//   two-tap לאפשרויות-שמע מובנה ב-mechanic-mcq (נגיעה 1 = האזנה, 2 = בחירה).
//
// אודיו: MP3 מוקלט מראש (ElevenLabs eleven_v3 קול נוני + QA Whisper,
//   scripts/generate-island-10-audio.py). מצב gender = ללא אודיו פר-סבב (טקסט,
//   כמו משחקון היחיד/רבים המקורי). מצב hey = משפט-stem מתנגן פעם אחת ב-mount +
//   מילות-האופציה הן האודיו (two-tap). אופציית-שמע בלי MP3 עדיין ניתנת-לבחירה
//   (playKey נכשל בשקט) — המשחק לא נשבר. אין עריכת JSON → אין build-embedded-data.
// ============================================================================
(function () {
  'use strict';

  var ISLAND_ID = 10;

  var CHAR = {
    gender: 'isl10-gender-adj',
    hey:    'isl10-hey-hayedia',
  };

  // ── משחקון "הוּא אוֹ הִיא?" — עצם מוכר (מין דקדוקי ידוע) + זוג צורות של תואר ──
  // he = צורת זכר · she = צורת נקבה · gender = מין העצם (m/f) → הצורה הנכונה.
  // stem_he = המילה כפי שהיא מוצגת (עם ה' הידיעה, מנוקד מלא, דגש קל בב/כ/פ).
  var GENDER_ROUNDS = [
    { stem_he: 'הַכַּדּוּר',  gender: 'm', he: 'גָּדוֹל',  she: 'גְּדוֹלָה' },
    { stem_he: 'הַבֻּבָּה',   gender: 'f', he: 'קָטָן',    she: 'קְטַנָּה'  },
    { stem_he: 'הַכֶּלֶב',    gender: 'm', he: 'קָטָן',    she: 'קְטַנָּה'  },
    { stem_he: 'הַצִּפּוֹר',  gender: 'f', he: 'יָפֶה',    she: 'יָפָה'    },
    { stem_he: 'הַסֵּפֶר',    gender: 'm', he: 'חָדָשׁ',   she: 'חֲדָשָׁה' },
    { stem_he: 'הָעֻגָּה',    gender: 'f', he: 'גָּדוֹל',  she: 'גְּדוֹלָה' },
  ];

  // ── משחקון "הַהַתְחָלָה שֶׁל הַ" — שומעים משפט, בוחרים איזו מילה נאמרה ──
  // audio = מפתח-MP3 של משפט-ה-stem · defWord/bareWord = המילה עם/בלי ה' הידיעה,
  // כל אחת מפתח-MP3 משלה (two-tap). answer = 'def' (במשפטים כאן ה' תמיד נשמעת).
  var HEY_ROUNDS = [
    { audio: 's-isl10-hey-dag',    defWord: { he: 'הַדָּג',    audio: 'w-isl10-hadag' },
                                    bareWord: { he: 'דָּג',     audio: 'w-isl10-dag' } },
    { audio: 's-isl10-hey-kelev',  defWord: { he: 'הַכֶּלֶב',   audio: 'w-isl10-hakelev' },
                                    bareWord: { he: 'כֶּלֶב',    audio: 'w-isl10-kelev' } },
    { audio: 's-isl10-hey-yeled',  defWord: { he: 'הַיֶּלֶד',   audio: 'w-isl10-hayeled' },
                                    bareWord: { he: 'יֶלֶד',     audio: 'w-isl10-yeled' } },
    { audio: 's-isl10-hey-sefer',  defWord: { he: 'הַסֵּפֶר',   audio: 'w-isl10-hasefer' },
                                    bareWord: { he: 'סֵפֶר',     audio: 'w-isl10-sefer' } },
    { audio: 's-isl10-hey-shemesh', defWord: { he: 'הַשֶּׁמֶשׁ', audio: 'w-isl10-hashemesh' },
                                    bareWord: { he: 'שֶׁמֶשׁ',   audio: 'w-isl10-shemesh' } },
  ];

  function $(id) { return document.getElementById(id); }

  function textOption(label, isCorrect, epaWhat) {
    var o = { mode: 'text', label_he: label, is_correct: !!isCorrect };
    if (!isCorrect) o.epa = { what: epaWhat, where: 'isolation', task: 'inflect' };
    return o;
  }

  function audioOption(word, isCorrect, epaWhat) {
    var o = { mode: 'audio', audio_key: word.audio, label_he: word.he, is_correct: !!isCorrect };
    if (!isCorrect) o.epa = { what: epaWhat, where: 'isolation', task: 'find' };
    return o;
  }

  // בונה config ל-mechanic-mcq לפי מצב המשחק
  function toConfig(round, game) {
    if (game.mode === 'hey') {
      var opts = [
        audioOption(round.defWord, true, 'Comprehension'),
        audioOption(round.bareWord, false, 'Comprehension'),
      ];
      return {
        interaction: 'listen_first_sound',
        questId: round.audio, item_id: round.audio,
        characteristic_id: CHAR.hey,
        primary_island_id: ISLAND_ID,
        theme: game.theme || 'shells',
        promptLine: 'אֵיזוֹ מִלָּה שְׁמַעְתֶּם? הַאֲזִינוּ לָאֶפְשָׁרֻיּוֹת וּבַחֲרוּ.',
        stem: { mode: 'audio', audio_key: round.audio, text_he: '' },
        options: opts,
        layout: 'grid',
      };
    }
    // mode === 'gender'
    var correct = (round.gender === 'm') ? round.he : round.she;
    var wrong   = (round.gender === 'm') ? round.she : round.he;
    return {
      interaction: 'fill_missing',
      questId: 'isl10-g-' + round.stem_he, item_id: 'isl10-g-' + round.stem_he,
      characteristic_id: CHAR.gender,
      primary_island_id: ISLAND_ID,
      theme: game.theme || 'shells',
      promptLine: 'הוּא אוֹ הִיא? בַּחֲרוּ אֶת הַמִּלָּה הַמַּתְאִימָה.',
      stem: { mode: 'fill', text_he: round.stem_he, fill: { before: round.stem_he + ' ', after: '' } },
      options: [
        textOption(correct, true, 'GenderMismatch'),
        textOption(wrong, false, 'GenderMismatch'),
      ],
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
    var HUB = 'stage-10-island.html';

    $('backBtn').addEventListener('click', function (e) {
      e.preventDefault();
      if (history.length > 1) history.back(); else location.href = HUB;
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
        '<h2>' + (game.finishTitle || 'כָּל הַכָּבוֹד!') + '</h2>' +
        '<p>' + (game.finishText || 'בְּנִיתֶם מִלִּים שְׁלֵמוֹת!') + '</p>' +
        '<div class="btns">' +
        '<button class="again" id="againBtn">עוֹד פַּעַם</button>' +
        '<a class="home" href="' + HUB + '">חֲזָרָה לָאִי</a>' +
        '</div></div>';
      $('againBtn').addEventListener('click', function () { location.reload(); });
      try { window.AvneiAudio.play(game.completionKey || 'completion-isl10'); } catch (e) {}
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
        // glow פנינה פר-סבב (פידבק ויזואלי בלבד אחרי תשובה נכונה)
        var pearls = document.querySelectorAll('.pearl');
        var p = pearls[idx - 1];
        if (p) { p.classList.add('just-added'); setTimeout(function () { p.classList.remove('just-added'); }, 600); }
        setTimeout(mountNext, 250);
      };

      current = window.AvneiMechanics.mcq.mount(root, cfg);
    }

    // בניית התור מהתוכן ה-inline (בלי fetch)
    var rounds = (game.mode === 'hey') ? HEY_ROUNDS : GENDER_ROUNDS;
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

  window.AvneiIsland10bGame = {
    boot: boot, _toConfig: toConfig,
    _GENDER_ROUNDS: GENDER_ROUNDS, _HEY_ROUNDS: HEY_ROUNDS,
  };
})();
