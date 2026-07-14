/* ============================================================
   מישמיש — templates/mechanic-grammar-toggle.js  →  window.MishmishGrammarToggle
   ------------------------------------------------------------
   מכניקת "הַצּוּרָה הַמַּתְאִימָה" (grammar-toggle) — התאמת מין/מספר.
   שני תת-מצבים data-driven הנקבעים ע"י ה-pack (pack-schema §2:
   target["grammar-toggle"] = "lexeme.gender/number match"):

     (א) מִין   — מישמיש אומר "זֶה כִּסֵּא" / "זֹאת מַחְבֶּרֶת" (frame זֶה/זֹאת
                  נושא את רמז-המין), הילד בוחר את התֹּאַר התּוֹאֵם:
                  גָּדוֹל (m) מול גְּדוֹלָה (f).
     (ב) מִסְפָּר — התמונה מציגה כַּמּוּת (אֶחָד מול הַרְבֵּה, ע"י שכפול ה-PNG),
                  הילד בוחר את הצּוּרָה התּוֹאֶמֶת לַתְּמוּנָה: דָּג מול דָּגִים.

   🔴 חוק מבני: קוד data-driven בלבד. אין תוכן קשיח — התארים/צורות-הרבים
      נקראים מ-pack.grammar (ראו fixture-הדף כטיוטה). מזהי-שם-עצם נפתרים
      מול pack.lexicon (resolver: id → {he,img,gender,number}) — כך המכניקה
      נשענת על lexicon.gender/number בדיוק כמו שה-schema דורש, וה-pack
      נשאר דאטה טהורה. עד שסוכן ה-pack יזרים pack.grammar, נופלים ל-fixture
      window.MISHMISH_GRAMMAR_TOGGLE_DEMO (מוגדר בדף, לא כאן ולא ב-pack).

   חוזה נמדד (זהה ל-measured.js / M2 / M3 — לא משנים):
     · שמיעתי-קודם — האריחים נעולים עד סוף ההשמעה.
     · רק הניסיון הראשון נמדד; אחרי טעות = מצב-למידה (לא נמדד).
     · בלי אדום/ירוק — טעות = הזמנה להאזין שוב (מישמיש confused-soft),
       מדרג-רמז: השמעה-חוזרת → הצבעה חזותית על הנכון → פיגום-אמיר (עאמייה מגודרת).
     · טקסט עאמייה מגודר עד אימות בודק ילידי (ar_verified:false).

   מדידה = מַפַּת-מֶרְחָקִים פר-מימד. שני מימדים = שני KC נפרדים ב-bkt.js
   (חוזה נעול; לא נוגעים ב-bkt.js):
     מין   → pattern='gender_agree', intent='agree_gender'
     מספר  → pattern='number_agree', intent='agree_number'
   שניהם probe (spine:false — לא בין 5 תבניות-השדרה, לא מזהמים אותן),
   בדיוק כמו pattern='contrast' של M2. dimension='recognize' (זיהוי-הצורה-
   התואמת מתוך 2 — שיפוט מודרך). target=מזהה-שם-העצם → סף ≥2-מילים-שונות
   מוכיח הכללת-הכלל על-פני מילים, לא שינון זוג. טעות-דקדוק → errorAxis='pattern'
   (הפרת-התאמה מורפו-תחבירית, לא vocab/sound).

   מבוסס על lantern.js/M3 (מכניקה מחזיקת-דרייבר) + measured.js (החוזה).
   ============================================================ */
window.MishmishGrammarToggle = (function () {
  var BKT = window.MishmishBKT, A = window.MishmishAudio;

  function q(sel) { return document.querySelector(sel); }
  function flag(name) { try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; } }
  function wait(ms) { return new Promise(function (r) { window.setTimeout(r, ms); }); }

  var MOODS = ['idle', 'speaking', 'listening', 'thinking', 'hint', 'confused-soft', 'happy', 'celebrate'];
  function preload() {
    MOODS.forEach(function (m) { var im = new Image(); im.src = '../assets/characters/mishmish/mishmish-' + m + '.png'; });
    ['idle', 'hint', 'listening', 'happy'].forEach(function (m) { var im = new Image(); im.src = '../assets/characters/peers/amir-' + m + '.png'; });
  }

  // ── resolver: מזהה-lexeme → אובייקט-lexicon (id → {he,img,gender,number}) ──
  // זה ה"resolver של slot-ids מול lexicon" — המכניקה קוראת lexeme.gender/number
  // מה-lexicon של ה-pack, ולא מכילה תוכן קשיח. פריט-grammar יכול לספק שדות
  // מוטבעים (he/img/gender) לצורך standalone; אחרת נפתרים מ-lexicon.
  function buildLexIndex(lexicon) {
    var idx = {};
    (lexicon || []).forEach(function (lx) { if (lx && lx.id) idx[lx.id] = lx; });
    return idx;
  }

  // ── בניית רצף-הסבבים משני תת-המצבים (מין + מספר), משורגים ──────
  // מחזיק סדר קבוע (דטרמיניסטי) — עקבי ל-QA ולמדידה, לא אקראי.
  function buildRounds(grammar, lexIdx) {
    var g = (grammar && grammar.gender) || {};
    var n = (grammar && grammar.number) || {};
    var genderRounds = (g.items || []).map(function (it) { return genderRound(it, lexIdx, g); }).filter(Boolean);
    var numberRounds = (n.items || []).map(function (it) { return numberRound(it, lexIdx, n); }).filter(Boolean);

    // שרגור: מין, מספר, מין, מספר… כדי ששני המימדים ייצברו ראיות במקביל.
    var rounds = [], i = 0, j = 0;
    while (i < genderRounds.length || j < numberRounds.length) {
      if (i < genderRounds.length) rounds.push(genderRounds[i++]);
      if (j < numberRounds.length) rounds.push(numberRounds[j++]);
    }
    return rounds;
  }

  // סבב-מין: שם-עצם (עם מינו) + שני תארים; הנכון = התואם למין שם-העצם.
  function genderRound(it, lexIdx, cfg) {
    if (!it) return null;
    var lex = lexIdx[it.nounId] || {};
    var he = it.he || lex.he;
    var img = it.img || lex.img;
    var gender = it.gender || lex.gender;
    var adj = it.adj || {};
    if (!he || !gender || !adj.m || !adj.f) return null;      // צריך שם-עצם ממוגדר + זוג-תארים

    var demonstrative = gender === 'f' ? 'זֹאת' : 'זֶה';        // frame זֶה/זֹאת נושא את רמז-המין
    var correctForm = gender === 'f' ? adj.f : adj.m;
    // סדר-אריחים קבוע: m תחילה בסבב-זוגי, f תחילה באי-זוגי → הנכון לא תמיד ראשון.
    var order = (it._order != null ? it._order : 0);
    var forms = order % 2 === 0 ? [adj.m, adj.f] : [adj.f, adj.m];
    var options = forms.map(function (f) { return { he: f, correct: f === correctForm }; });

    return {
      mode: 'gender',
      id: 'gender::' + (it.nounId || he),
      targetId: it.nounId || he,
      pattern: 'gender_agree', intent: 'agree_gender',
      nounHe: he, nounImg: img, count: 1,
      prefix: demonstrative + ' ' + he,                        // "זֹאת מַחְבֶּרֶת" — מוצג + מושמע
      audioPrompt: demonstrative + ' ' + he + '?',             // מישמיש שואל איזו צורה מתאימה
      audioKey: 'gt:gender:' + (it.nounId || he),
      audioReveal: demonstrative + ' ' + he + ' ' + correctForm, // "זֹאת מַחְבֶּרֶת גְּדוֹלָה" — מודל אחרי-נכון
      audioRevealKey: 'gt:gender-full:' + (it.nounId || he),
      options: options,
      instruction: cfg.instruction || 'הַקְשִׁיבוּ וּבַחֲרוּ אֶת הַצּוּרָה הַמַּתְאִימָה'
    };
  }

  // סבב-מספר: תמונה בכמות (1 מול הרבה) + שתי צורות; הנכון = התואם לכמות שבתמונה.
  function numberRound(it, lexIdx, cfg) {
    if (!it) return null;
    var lex = lexIdx[it.baseId] || {};
    var img = it.img || lex.img;
    var sg = (it.sg && it.sg.he) || it.sg;
    var pl = (it.pl && it.pl.he) || it.pl;
    if (!sg || !pl) return null;                               // צריך שתי צורות

    var many = (it._show === 'pl');                             // איזו כמות מוצגת בתמונה
    var count = many ? (it.count_pl || 3) : 1;
    var correctForm = many ? pl : sg;
    var order = (it._order != null ? it._order : 0);
    var forms = order % 2 === 0 ? [sg, pl] : [pl, sg];
    var options = forms.map(function (f) { return { he: f, correct: f === correctForm }; });

    return {
      mode: 'number',
      id: 'number::' + (it.baseId || sg) + ':' + (many ? 'pl' : 'sg'),
      targetId: it.baseId || sg,
      pattern: 'number_agree', intent: 'agree_number',
      nounHe: correctForm, nounImg: img, count: count,
      prefix: 'כַּמָּה?',                                        // שאלת-כמות מוצגת
      audioPrompt: 'הַקְשִׁיבוּ. כַּמָּה? אֶחָד אוֹ הַרְבֵּה?',       // שאלה קבועה — לא חושפת צורה
      audioKey: 'gt:count',
      audioReveal: correctForm,                                  // "דָּגִים" — מודל אחרי-נכון
      audioRevealKey: 'gt:number-full:' + (it.baseId || sg) + ':' + (many ? 'pl' : 'sg'),
      options: options,
      instruction: cfg.instruction || 'הַסְתַּכְּלוּ בַּתְּמוּנָה וּבַחֲרוּ אֶת הַמִּלָּה הַמַּתְאִימָה'
    };
  }

  function start() {
    if (flag('reset') && BKT.reset) BKT.reset();
    if (BKT.beginSession) BKT.beginSession();
    preload();

    // בחירת-pack בזמן-ריצה דרך ה-loader (?pack=/?mechanic=). ברירת-מחדל = class
    // (נושא 1 — 'אני והכיתה', שם lexicon נושא gender/number לכל חפצי-הכיתה).
    var sel = window.MishmishData &&
      window.MishmishData.pick({ pack: 'class', mechanic: 'grammar-toggle' });
    var pack = sel && sel.pack;

    // מקור-התוכן: pack.grammar (חדש) + pack.lexicon (למען ה-resolver).
    // fallback ל-fixture-הדף עד שסוכן ה-pack יזרים אותם. אין תוכן קשיח במכניקה.
    var demo = window.MISHMISH_GRAMMAR_TOGGLE_DEMO || {};
    var grammar = (pack && pack.grammar) || demo.grammar || null;
    var lexicon = (pack && pack.lexicon) || demo.lexicon || [];
    var lexIdx = buildLexIndex(lexicon);
    var rounds = buildRounds(grammar, lexIdx);

    var usingFallback = !(pack && pack.grammar);
    console.log('[grammar-toggle] pack=' + (pack && pack.pack) + ' rounds=' + rounds.length +
      (usingFallback ? ' (FALLBACK — טיוטה, ממתין ל-pack.grammar)' : ''));

    var scene = demo.scene || (pack && pack.scene) ||
      { bg: (pack && pack.meta && pack.meta.bg && pack.meta.bg.replace(/\.png$/, '')) || 'bg-hara-courtyard' };

    var els = {
      sceneBg: q('#scene-bg'), progress: q('#progress'),
      placeHe: q('#place-he'), placeAr: q('#place-ar'),
      sentence: q('#sentence'), stimulus: q('#stimulus'),
      listen: q('#listen'), tiles: q('#tiles'),
      mishmish: q('#mishmish'), scaffold: q('#scaffold'), amirText: q('#amir-text'),
      instr: q('#instr'),
      introOverlay: q('#introOverlay'), startBtn: q('#startBtn'),
      doneOverlay: q('#doneOverlay'), againBtn: q('#againBtn')
    };

    // רקע-הסצנה + שם-המקום (מסגור-גשר: המרחב של הילד; ערבית מגודרת)
    if (scene.bg && els.sceneBg) els.sceneBg.src = '../assets/backgrounds/' +
      (String(scene.bg).indexOf('bg-') === 0 ? scene.bg : 'bg-' + scene.bg) + '.png';
    if (scene.place_he && els.placeHe) els.placeHe.textContent = scene.place_he;
    if (scene.place_ar && els.placeAr) els.placeAr.textContent = scene.place_ar;

    // שורת-התקדמות (נקודה פר-סבב)
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
    function setAmir(mood) {
      var img = els.scaffold && els.scaffold.querySelector('img');
      if (img) img.src = '../assets/characters/peers/amir-' + (mood || 'hint') + '.png';
    }

    // ── דרייבר-סבב יחיד: מכונת-מצבים תואמת-חוזה measured.js ──────
    function mountRound() {
      if (idx >= rounds.length) return finale();
      paintProgress();
      var round = rounds[idx];
      var st = { phase: 'loading', measuredDone: false, done: false, hintStep: 0 };

      // גירוי חזותי: מין → תמונת שם-העצם פעם-אחת · מספר → אשכול לפי הכמות.
      function renderStimulus() {
        els.stimulus.innerHTML = '';
        els.stimulus.setAttribute('data-mode', round.mode);
        els.stimulus.setAttribute('data-count', round.count > 1 ? 'many' : 'one');
        if (!round.nounImg) return;
        for (var c = 0; c < round.count; c++) {
          var im = document.createElement('img');
          im.src = '../assets/items/' + round.nounImg;
          im.alt = '';
          im.onerror = function () { this.style.visibility = 'hidden'; };
          els.stimulus.appendChild(im);
        }
      }

      // רצועת-המשפט המנוקדת: prefix + חלל-צורה. החלל מתמלא כפידבק אחרי-נכון.
      function renderSentence(filled) {
        els.sentence.innerHTML = '';
        els.sentence.appendChild(document.createTextNode(round.prefix + ' '));
        var gap = document.createElement('span');
        gap.className = 'form-gap';
        if (filled) {
          var chosen = round.options.filter(function (o) { return o.correct; })[0];
          gap.textContent = chosen ? chosen.he : '';
          gap.classList.add('filled');
        } else {
          gap.setAttribute('aria-label', 'צוּרָה חֲסֵרָה');
          gap.textContent = '…';
        }
        els.sentence.appendChild(gap);
      }

      // אריחי-צורה: מילה מנוקדת (טקסט-קודם — הגירוי הוא שמע/תמונה). ≥56px.
      function renderTiles() {
        els.tiles.innerHTML = '';
        round.options.forEach(function (opt) {
          var b = document.createElement('button');
          b.className = 'tile';
          b.type = 'button';
          b.setAttribute('aria-disabled', 'true');            // נעול עד סוף ההאזנה
          b.innerHTML = '<span class="cap">' + opt.he + '</span>';
          b.addEventListener('click', function () { onTile(b, opt); });
          els.tiles.appendChild(b);
        });
      }
      function enableTiles(on) {
        Array.prototype.forEach.call(els.tiles.children, function (b) {
          b.setAttribute('aria-disabled', on ? 'false' : 'true');
        });
      }
      function tileForCorrect() {
        return Array.prototype.filter.call(els.tiles.children, function (b, i) {
          return round.options[i] && round.options[i].correct;
        })[0];
      }
      function clearMarks() {
        Array.prototype.forEach.call(els.tiles.children, function (b) { b.classList.remove('retry', 'selected'); });
      }

      // ── אודיו (עברית) — קליפ מוקלט אם קיים (seam), אחרת TTS-fallback חי ──
      function playPrompt(slow) {
        return A.hebrew(round.audioPrompt, { key: round.audioKey, slow: slow, statusEl: els.listen })
          .then(function () { els.listen.setAttribute('data-audio', 'idle'); },
                function () { els.listen.setAttribute('data-audio', 'idle'); });
      }
      function playReveal() {
        return A.hebrew(round.audioReveal, { key: round.audioRevealKey })
          .then(function () {}, function () {});
      }

      // ── מצבים ──
      function introPlaying() {
        st.phase = 'introPlaying';
        setMishmish('speaking');
        renderSentence(false);
        enableTiles(false);
        playPrompt(false).then(awaitingAnswer, awaitingAnswer);  // גם בשגיאת-אודיו — פותחים
      }
      function awaitingAnswer() {
        st.phase = 'awaitingAnswer';
        setMishmish('listening');
        enableTiles(true);
      }

      function onTile(btn, opt) {
        if (btn.getAttribute('aria-disabled') === 'true') return;

        if (!st.measuredDone) {                                 // מדידה — ניסיון ראשון בלבד
          st.measuredDone = true;
          BKT.ingest && BKT.ingest({
            pattern: round.pattern,                             // gender_agree / number_agree
            intent: round.intent,                               // agree_gender / agree_number
            target: round.targetId,                             // שם-עצם → סף ≥2-מילים-שונות
            dimension: 'recognize',                             // שיפוט-צורה מודרך (זיהוי מתוך 2)
            firstTry: true,
            correct: !!opt.correct,
            errorAxis: opt.correct ? undefined : 'pattern'      // הפרת-התאמה = ציר-תבנית
          });
          if (opt.correct) return commitCorrect(btn);
          return enterLearning(btn);
        }
        if (opt.correct) return commitCorrect(btn);             // אחרי מצב-למידה: לא נמדד
        return nudgeRetry(btn);
      }

      function commitCorrect(btn) {
        st.phase = 'correct';
        enableTiles(false);
        clearMarks();
        btn.classList.add('selected');                          // כחול-זהות, לא ירוק
        renderSentence(true);                                   // מילוי-הצורה = פידבק חזותי
        setMishmish('celebrate');
        if (els.scaffold) els.scaffold.classList.remove('show');
        playReveal();                                           // מודל קולי של המשפט/הצורה הנכונה
        // שבח קולי מוקלט (מצוין/מעולה) יגיע דרך clipMap. אסור "יופי".
        window.setTimeout(function () { setMishmish('happy'); complete(); }, 1050);
      }

      function enterLearning(btn) {                              // טעות ראשונה → מצב-למידה
        st.phase = 'incorrect';
        btn.classList.add('retry');                             // צהוב חם, לא אדום
        setMishmish('confused-soft');
        window.setTimeout(hint, 700);
      }
      function nudgeRetry(btn) {
        btn.classList.add('retry');
        window.setTimeout(function () { btn.classList.remove('retry'); }, 900);
        hint();
      }

      // מדרג-רמז: השמעה-חוזרת (איטית) → הצבעה חזותית על הנכון → פיגום-אמיר.
      function hint() {
        st.phase = 'hint';
        st.hintStep++;
        setMishmish('hint');
        showAmir(st.hintStep >= 3 ? 'amiya' : (st.hintStep >= 2 ? 'point' : 'encourage'));
        playPrompt(true).then(function () {
          if (st.hintStep >= 2) {                               // שלב 2: הצבעה חזותית על הנכון
            var t = tileForCorrect();
            if (t) t.classList.add('selected');
          }
          setMishmish('listening');
        }, function () { setMishmish('listening'); });
      }

      // אמיר (פיגום-עמית). he = מדרג מ-scaffold.json (טיוטת מיטל);
      // ar = עאמייה מגודרת (ar_verified:false) — לא מוצג/מושמע כברירת-מחדל.
      function showAmir(tier) {
        var hintData = window.MishmishScaffold && window.MishmishScaffold.amirHint(tier);
        setAmir(tier === 'encourage' ? 'listening' : 'hint');
        if (hintData && hintData.he && els.amirText) els.amirText.textContent = hintData.he;
        if (els.scaffold) els.scaffold.classList.add('show');
      }

      function complete() {
        if (st.done) return;
        st.done = true; st.phase = 'complete';
        idx++;
        window.setTimeout(mountRound, 500);
      }

      // ── אתחול הסבב ──
      renderStimulus();
      renderSentence(false);
      renderTiles();
      setMishmish('idle');
      if (els.scaffold) els.scaffold.classList.remove('show');
      if (round.instruction && els.instr) els.instr.textContent = round.instruction;
      window.setTimeout(introPlaying, 250);

      // בקר חיצוני לשורת שפת-הישרדות + כפתור-האזנה
      active = {
        replay: function (slow) { setMishmish('speaking'); playPrompt(slow).then(awaitingAnswer, awaitingAnswer); },
        hint: function () { hint(); },
        phase: function () { return st.phase; }
      };
    }

    // כפתור-האזנה + שורת שפת-הישרדות (ה-#sv-* מוזרקים מ-scaffold.json דרך MishmishScaffold)
    if (els.listen) els.listen.addEventListener('click', function () { if (active) active.replay(false); });
    if (window.MishmishScaffold) {
      window.MishmishScaffold.bind('#survival', function () {
        return active ? { replay: active.replay, hint: active.hint } : null;
      });
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
      box.textContent = 'מבט-מבוגר · הַתְאָמַת מִין/מִסְפָּר (BKT):\n' + JSON.stringify(BKT.snapshot(), null, 2);
      document.body.appendChild(box);
    }

    // overlay-פתיחה: מתחילים רק אחרי נגיעת-ילד (מדיניות autoplay)
    function begin() {
      if (els.introOverlay) els.introOverlay.classList.add('hidden');
      mountRound();
    }
    if (els.startBtn) els.startBtn.addEventListener('click', begin);
    if (flag('open')) begin();
    if (els.againBtn) els.againBtn.addEventListener('click', function () { location.reload(); });

    // אם אין סבבים כלל (אין pack.grammar ואין fixture) — הודעה שקטה במקום מסך ריק
    if (!rounds.length && els.introOverlay) {
      var h = els.introOverlay.querySelector('h2');
      if (h) h.textContent = 'אֵין עֲדַיִן תַּרְגּוּל';
    }
  }

  return { start: start };
})();
