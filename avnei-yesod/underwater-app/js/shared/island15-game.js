// ============================================================================
// island15-game.js — מריץ משותף למסך המשחק של אי 15 (הבנת משפט כתוב)
// 7.7.2026 · לוח בניית האיים N15
//
// אי 15 = "מִפְרַץ הַתְּמוּנוֹת" (השם אושר ונצרב במפה ע"י R1). הנושא: הַבָּנַת
// מִשְׁפָּט בּוֹדֵד כָּתוּב. שני סוגי סבב, שניהם מבוססי-קריאה (הילד.ה קורא.ת
// לבד — אין הקראה אוטומטית של המשפט; זו כל הפואנטה):
//   mode:'image'    → משפט (טקסט) → בחירת התמונה המתאימה מבין 3.
//   mode:'question' → משפט (טקסט, נשאר על המסך) → שאלה קצרה עליו (מִי/מָה/אֵיפֹה)
//                     + 3 תשובות טקסט. רמקול-עזרה ליד השאלה משמיע את השאלה
//                     בלבד (לא את המשפט), ורק בלחיצה ידנית.
//
// הבחנה מול אי 14 (הבנת הנקרא): שם קטע שלם + כמה שאלות; כאן משפט בודד.
// הבחנה מול stage-read-aloud (נוני מקשיבה, שטף) שגם מדווח לאי 15: הַהַפְרָדָה
// היא ב-activity_type ('mcq' כאן מול 'read_aloud' שם) + activity_variant
// (engine_label של הבנק) + characteristic_id (מהבנק כאן, אין ב-read_aloud).
// שניהם ראיות-קריאה לאי 15/סטרנד 4 — זה תקין ומכוון (strand משותף בכוונה).
//
// עטיפה דקה סביב ליבת mechanic-mcq (כמו island11-game.js). התוכן מוטמע inline,
// נאמן לפריטי questions-grade1.json (strand reading_comprehension, stem_mode:text)
// והתמונות מ-assets/vocab/ (אותם קבצים שממופים ב-_manifest.json). אין עריכת
// JSON תוכן → אין צורך ב-build-embedded-data; ה-img נטען גם ב-file://.
//
// חוקי מדידה:
//   primary_island_id=15 מפורש בכל result (resolveIslandId מכבד אותו — BKT אי 15).
//   characteristic_id מהבנק (EPA G4 פר-מאפיין). is_correct + EPA פר-מסיח.
//   האפשרויות = תמונה/טקסט (לא שמע) → אין two-tap ואין ניחוש-מיקום-שמע.
//   אין הקראת-משפט אוטומטית; אין השמעת-שבח חוזרת (פידבק ויזואלי בלבד).
// ============================================================================
(function () {
  'use strict';

  var ISLAND_ID = 15;
  var VOCAB_BASE = 'assets/vocab/';

  // ── סוג (א): משפט → תמונה מתאימה מבין 3 ──
  // מקור: questions-grade1.json (dec-w3-d2-c2 comprehend_sentence_meaning ·
  // apr-w3-d2-c2 sentence_picture_match). התמונות = קבצי assets/vocab/ הקיימים.
  var IMAGE_ROUNDS = [
    { q_id: 'dec-w3-d2-c2-L1', char: 'dec-w3-d2-c2', variant: 'comprehend_sentence_meaning',
      sentence: 'נָדָב יוֹשֵׁב לְיַד הַשֻּׁלְחָן.',
      options: [
        { label: 'יֶלֶד יוֹשֵׁב לְיַד שֻׁלְחָן', file: 'yld-yvshb-lyd-shlchn.png', correct: true },
        { label: 'יֶלֶד רָץ בֶּחָצֵר',        file: 'yld-rts-bchtsr.png',
          epa: { what: 'Comprehension', where: 'isolation', task: 'find' } },
        { label: 'כֶּלֶב יָשֵׁן',             file: 'klb-yshn.png',
          epa: { what: 'Comprehension', where: 'isolation', task: 'find' } },
      ] },
    { q_id: 'dec-w3-d2-c2-L2', char: 'dec-w3-d2-c2', variant: 'comprehend_sentence_meaning',
      sentence: 'הַסֵּפֶר לְיַד הַדְּלִי.',
      options: [
        { label: 'סֵפֶר לְיַד דְּלִי',    file: 'spr-lyd-dly.png', correct: true },
        { label: 'סֵפֶר בְּתוֹךְ הַדְּלִי', file: 'spr-btvk-hdly.png',
          epa: { what: 'Comprehension', where: 'isolation', task: 'find' } },
        { label: 'דְּלִי לְבַד',          file: 'dly-lbd.png',
          epa: { what: 'Comprehension', where: 'isolation', task: 'find' } },
      ] },
    { q_id: 'dec-w3-d2-c2-L3', char: 'dec-w3-d2-c2', variant: 'comprehend_sentence_meaning',
      sentence: 'מִיכַל נָתְנָה תְּרוּפָה לְנָדָב.',
      options: [
        { label: 'יַלְדָּה נוֹתֶנֶת תְּרוּפָה לְיֶלֶד', file: 'yldh-nvtnt-trvph-lyld.png', correct: true },
        { label: 'יֶלֶד נוֹתֵן תְּרוּפָה לְיַלְדָּה',   file: 'yld-nvtn-trvph-lyldh.png',
          epa: { what: 'Comprehension', where: 'isolation', task: 'find' } },
        { label: 'יַלְדָּה שׁוֹתָה תְּרוּפָה',         file: 'yldh-shvth-trvph.png',
          epa: { what: 'Comprehension', where: 'isolation', task: 'find' } },
      ] },
    { q_id: 'apr-w3-d2-c2-L1', char: 'apr-w3-d2-c2', variant: 'sentence_picture_match',
      sentence: 'הַיֶּלֶד רָץ.',
      options: [
        { label: 'יֶלֶד רָץ',    file: 'yld-rts.png', correct: true },
        { label: 'יֶלֶד יוֹשֵׁב', file: 'yld-yvshb.png',
          epa: { what: 'Comprehension', where: 'isolation', task: 'recognition' } },
        { label: 'יַלְדָּה רָצָה', file: 'yldh-rtsh.png',
          epa: { what: 'GenderMismatch', where: 'isolation', task: 'recognition' } },
      ] },
    { q_id: 'apr-w3-d2-c2-L2', char: 'apr-w3-d2-c2', variant: 'sentence_picture_match',
      sentence: 'הַדָּג עַל הַשֻּׁלְחָן.',
      options: [
        { label: 'דָּג עַל שֻׁלְחָן', file: 'dg-l-shlchn.png', correct: true },
        { label: 'דָּג בַּיָּם',      file: 'dg-bym.png',
          epa: { what: 'Comprehension', where: 'isolation', task: 'recognition' } },
        { label: 'שֻׁלְחָן רֵיק',     file: 'shlchn-ryk.png',
          epa: { what: 'Comprehension', where: 'isolation', task: 'recognition' } },
      ] },
    { q_id: 'apr-w3-d2-c2-L3', char: 'apr-w3-d2-c2', variant: 'sentence_picture_match',
      sentence: 'הַיַּלְדָּה יוֹשֶׁבֶת עַל הַסֻּלָּם.',
      options: [
        { label: 'יַלְדָּה יוֹשֶׁבֶת עַל סֻלָּם', file: 'yldh-yvshbt-l-slm.png', correct: true },
        { label: 'יֶלֶד יוֹשֵׁב עַל סֻלָּם',      file: 'yld-yvshb-l-slm.png',
          epa: { what: 'GenderMismatch', where: 'isolation', task: 'recognition' } },
        { label: 'יַלְדָּה יוֹשֶׁבֶת עַל כִּסֵּא',  file: 'yldh-yvshbt-l-ks.png',
          epa: { what: 'Comprehension', where: 'isolation', task: 'recognition' } },
      ] },
  ];

  // ── סוג (ב): משפט → שאלה קצרה (literal מי/מה/איפה). המשפט נשאר על המסך ──
  // מקור: questions-grade1.json (mar-w4-d3-c1 answer_literal_question_mc ·
  // jun-w2-d2 literal_who/what/where · jun-w3-d3-c2 · may-w2-d4-c1 locate_info).
  var QUESTION_ROUNDS = [
    { q_id: 'mar-w4-d3-c1-L1', char: 'mar-w4-d3-c1', variant: 'answer_literal_question_mc',
      sentence: 'נוּנִי בַּמַּיִם.', question: 'מִי בַּמַּיִם?', qaudio: 'q-isl15-mi-bamayim',
      options: [
        { label: 'נוּנִי', correct: true },
        { label: 'אִמָּא', epa: { what: 'Comprehension', where: 'medial', task: 'find' } },
        { label: 'אַבָּא', epa: { what: 'Comprehension', where: 'medial', task: 'find' } },
      ] },
    { q_id: 'jun-w2-d2-c1-L1', char: 'jun-w2-d2-c1', variant: 'literal_who_question',
      sentence: 'רוֹנִי אָכַל תַּפּוּחַ מָתוֹק.', question: 'מִי אָכַל אֶת הַתַּפּוּחַ?', qaudio: 'q-isl15-mi-achal',
      options: [
        { label: 'רוֹנִי',    correct: true },
        { label: 'הַחָתוּל', epa: { what: 'Comprehension', where: 'medial', task: 'find' } },
        { label: 'סָבְתָּא',  epa: { what: 'Comprehension', where: 'medial', task: 'find' } },
      ] },
    { q_id: 'jun-w2-d2-c2-L1', char: 'jun-w2-d2-c2', variant: 'literal_what_question',
      sentence: 'מַיָּה צִיְּרָה צִיּוּר יָפֶה.', question: 'מָה עָשְׂתָה מַיָּה?', qaudio: 'q-isl15-ma-asta',
      options: [
        { label: 'צִיְּרָה צִיּוּר', correct: true },
        { label: 'אָכְלָה אֲרוּחָה', epa: { what: 'Comprehension', where: 'medial', task: 'find' } },
        { label: 'יָשְׁנָה בַּמִּטָּה', epa: { what: 'Comprehension', where: 'medial', task: 'find' } },
      ] },
    { q_id: 'jun-w2-d2-c3-L1', char: 'jun-w2-d2-c3', variant: 'literal_where_question',
      sentence: 'הַכֶּלֶב יָשַׁן בַּחָצֵר.', question: 'אֵיפֹה יָשַׁן הַכֶּלֶב?', qaudio: 'q-isl15-eifo-yashan',
      options: [
        { label: 'בַּחָצֵר', correct: true },
        { label: 'בַּיָּם',  epa: { what: 'Comprehension', where: 'medial', task: 'find' } },
        { label: 'בַּכִּתָּה', epa: { what: 'Comprehension', where: 'medial', task: 'find' } },
      ] },
    { q_id: 'jun-w3-d3-c2-L1', char: 'jun-w3-d3-c2', variant: 'eoy_literal_comprehension',
      sentence: 'הַיֶּלֶד אָכַל בָּנָנָה.', question: 'מָה אָכַל הַיֶּלֶד?', qaudio: 'q-isl15-ma-achal-yeled',
      options: [
        { label: 'בָּנָנָה', correct: true },
        { label: 'לֶחֶם',   epa: { what: 'Comprehension', where: 'medial', task: 'find' } },
        { label: 'מַיִם',   epa: { what: 'Comprehension', where: 'medial', task: 'find' } },
      ] },
    { q_id: 'may-w2-d4-c1-L1', char: 'may-w2-d4-c1', variant: 'locate_explicit_info',
      sentence: 'הַלִּוְיָתָן חַי בַּיָּם וְאוֹכֵל דָּגִים.', question: 'אֵיפֹה חַי הַלִּוְיָתָן?', qaudio: 'q-isl15-eifo-chai',
      options: [
        { label: 'בַּיָּם',  correct: true },
        { label: 'בָּעֵץ',  epa: { what: 'Comprehension', where: 'isolation', task: 'find' } },
        { label: 'בַּבַּיִת', epa: { what: 'Comprehension', where: 'isolation', task: 'find' } },
      ] },
  ];

  function $(id) { return document.getElementById(id); }

  function playKey(key) {
    if (key && window.AvneiAudio) { try { return window.AvneiAudio.play(key); } catch (e) {} }
    return null;
  }

  // ── config ל-mechanic-mcq · סוג (א): משפט-טקסט (לא מוקרא) + 3 תמונות ──
  function imageConfig(round) {
    var opts = round.options.map(function (o) {
      var opt = { mode: 'image', image_src: VOCAB_BASE + o.file, image_alt: o.label, is_correct: !!o.correct };
      if (!o.correct && o.epa) opt.epa = o.epa;
      return opt;
    });
    return {
      interaction: round.variant,
      questId: 'isl15-' + round.q_id, item_id: round.q_id,
      characteristic_id: round.char,
      primary_island_id: ISLAND_ID,
      theme: 'shells',
      promptLine: 'קִרְאוּ אֶת הַמִּשְׁפָּט וּבַחֲרוּ אֶת הַתְּמוּנָה הַמַּתְאִימָה.',
      // stem טקסט = המשפט מוצג על המסך, בלי אודיו → אין הקראה אוטומטית.
      stem: { mode: 'text', text_he: round.sentence },
      options: opts,
      layout: 'grid',
    };
  }

  // ── config ל-mechanic-mcq · סוג (ב): משפט (passage, נשאר) + שאלה + 3 תשובות ──
  function questionConfig(round) {
    var opts = round.options.map(function (o) {
      var opt = { mode: 'text', label_he: o.label, is_correct: !!o.correct };
      if (!o.correct && o.epa) opt.epa = o.epa;
      return opt;
    });
    return {
      interaction: round.variant,
      questId: 'isl15-' + round.q_id, item_id: round.q_id,
      characteristic_id: round.char,
      primary_island_id: ISLAND_ID,
      theme: 'shells',
      // promptLine = השאלה → aria-label של קבוצת-התשובות (נגישות). היא מוצגת
      // חזותית פעם אחת בלבד, בכרטיס-השאלה הצהוב (mcq-stem-card--text) עם רמקול-העזרה.
      promptLine: round.question,
      // בועת-נוני העליונה = הנחיה גנרית (לא חזרה על השאלה) — מסירים כפילות
      // (החלטת מיטל 7.7). מקבילה לבועה במצב image.
      bubbleLine: 'קִרְאוּ אֶת הַמִּשְׁפָּט — וְעֲנוּ עַל הַשְּׁאֵלָה.',
      layout: 'passage',
      // passage_he = המשפט (נשאר, בלי passage_audio_key → לא מוקרא);
      // stem text = השאלה. אין audio_key → אין השמעה אוטומטית של דבר.
      stem: { mode: 'text', passage_he: round.sentence, text_he: round.question },
      options: opts,
      _qaudio: round.qaudio,   // רמקול-עזרה ידני לשאלה (לא למשפט)
    };
  }

  function boot(game) {
    var root = $('mountRoot');
    var current = null;
    var queue = [];
    var idx = 0;

    var rounds = (game.mode === 'question') ? QUESTION_ROUNDS : IMAGE_ROUNDS;
    var toConfig = (game.mode === 'question') ? questionConfig : imageConfig;

    $('backBtn').addEventListener('click', function (e) {
      e.preventDefault();
      if (history.length > 1) history.back(); else location.href = 'stage-15-island.html';
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
        '<p>קְרָאתֶם אֶת הַמִּשְׁפָּטִים לְבַד — וְהֵבַנְתֶּם כֹּל אֶחָד!</p>' +
        '<div class="btns">' +
        '<button class="again" id="againBtn">עוֹד פַּעַם</button>' +
        '<a class="home" href="stage-15-island.html">חֲזָרָה לָאִי</a>' +
        '</div></div>';
      $('againBtn').addEventListener('click', function () { location.reload(); });
      playKey('completion-isl15');
    }

    function mountNext() {
      if (current && current.unmount) { try { current.unmount(); } catch (e) {} }
      current = null;
      renderPearls();
      if (idx >= queue.length) { showFinish(); return; }

      var cfg = queue[idx];
      $('counter').textContent = (idx + 1) + ' / ' + queue.length;
      $('noniRow').hidden = false;
      // בבועה: הנחיה גנרית אם הוגדרה (mode=question — מונע כפילות עם כרטיס-השאלה),
      // אחרת ה-promptLine עצמו (mode=image — המשפט הוא ה-stem, הבועה = הנחיה).
      $('promptText').textContent = cfg.bubbleLine || cfg.promptLine;

      cfg.onComplete = function () {
        idx++;
        renderPearls();
        var pearls = document.querySelectorAll('.pearl');
        var p = pearls[idx - 1];
        if (p) { p.classList.add('just-added'); setTimeout(function () { p.classList.remove('just-added'); }, 600); }
        setTimeout(mountNext, 250);
      };

      current = window.AvneiMechanics.mcq.mount(root, cfg);

      // סוג (ב): רמקול-עזרה ידני ליד השאלה — משמיע את השאלה בלבד (לא את המשפט),
      // ורק בלחיצה. אין השמעה אוטומטית (זו כל הפואנטה — הילד.ה קורא.ת).
      if (cfg._qaudio) {
        var qcard = root.querySelector('.mcq-stem-card--text');
        if (qcard) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'q-help-spk';
          btn.setAttribute('aria-label', 'לִשְׁמֹעַ אֶת הַשְּׁאֵלָה');
          btn.innerHTML = '<span aria-hidden="true">🔊</span><span>הַשְּׁאֵלָה</span>';
          btn.addEventListener('click', function () { playKey(cfg._qaudio); });
          qcard.appendChild(btn);
        }
      }
    }

    // בניית התור מהתוכן ה-inline
    queue = rounds.map(toConfig);

    $('startVeil').hidden = false;
    $('startBtn').addEventListener('click', function () {
      try { if (window.AvneiAudio && window.AvneiAudio.unlock) window.AvneiAudio.unlock(); } catch (e) {}
      $('startVeil').hidden = true;
      idx = 0;
      // הוראת-המשימה של נוני פעם אחת (guidance), ורק אחריה הסבב הראשון.
      playMissionThen(game.missionKey, mountNext);
    });
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
      setTimeout(fin, 10000);
    } catch (e) { fin(); }
  }

  window.AvneiIsland15Game = {
    boot: boot,
    _imageConfig: imageConfig,
    _questionConfig: questionConfig,
    _IMAGE_ROUNDS: IMAGE_ROUNDS,
    _QUESTION_ROUNDS: QUESTION_ROUNDS,
  };
})();
