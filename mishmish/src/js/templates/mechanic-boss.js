/* ============================================================
   מישמיש — templates/mechanic-boss.js  →  window.MishmishBoss
   ------------------------------------------------------------
   בּוֹס-הנושא · "הַמַּעֲבָר לַשְּׁכוּנָה הַמְּשֻׁתֶּפֶת"
   ------------------------------------------------------------
   🔴 מַרְכִּיב, לא בונה-מחדש. זו אינה מכניקה חדשה — זהו מבנה-בוס
      שמרכיב שלוש מכניקות קיימות כשלושה שערים, כל שער = ציר אחד:

        שַׁעַר הַצְּלִיל       → same-different  (הבחנת-צליל · רצפטיבי)
        שַׁעַר הַתַּבְנִית     → missing-slot    (מילה חסרה · מפיק-בתמיכה)
        שַׁעַר הָאִינְטֶרָאקְצְיָה → roleplay        (שיחה עם אמיר · מפיק-אקטיבי)

      מדרג-קושי L2 טבעי: רצפטיבי → מפיק-בתמיכה → מפיק-אקטיבי.

   🔴 מסגור-הגשר עצמו הוא מבנה-המשחק: מישמיש חוצה מ"הַחָצֵר שֶׁלִּי /
      حارتي" (pack class · space=hara · bg-hara-courtyard) דרך שער-מַעֲבָר
      אל "הַמֶּרְחָב הַמְּשֻׁתָּף" (pack market · space=shared · bg-shared-market).
      אמיר = שומר-שער ידידותי שנפתח רק בשימוש נכון; journey-track מתמלא
      בתחתית ומראה את ההתקדמות בין שני המרחבים.

   🔴 חוזה נמדד — זהה בדיוק ל-measured.js / M2 / M3 / M6 (לא משנים):
     · שמיעתי-קודם — האריחים נעולים עד סוף ההשמעה.
     · רק הניסיון הראשון נמדד; אחרי טעות = מצב-למידה (לא נמדד).
     · בלי אדום/ירוק — טעות = הזמנה להאזין שוב (retry=צהוב, selected=כחול,
       מישמיש confused-soft), ואף פעם לא נחסמים: השער נפתח אחרי שהילד
       מגיע לנכון (בעצמו או בעזרת מדרג-הרמז).
     · מדרג-רמז נעול: השמעה-חוזרת → הצבעה חזותית → פיגום-עאמייה (אמיר).
     · טקסט עאמייה מגודר עד אימות בודק/ת ילידי/ת.

   🔴 מדידה מצטברת דרך אותם KC של המכניקות המורכבות (bkt.js F6):
     · שער-צליל:      pattern:'contrast'  intent:'discriminate'
                       dimension:'recognize'        pb_context:'onset'   (=M2)
     · שער-תבנית:     pattern:<pattern.id> intent:<pattern.intent>
                       dimension:'produce_supported' pb_context:'sentence' (=M3)
     · שער-אינטראקציה: pattern:'give_me'    intent:'request_object'
                       dimension:'produce_supported' pb_context:'sentence' (=M6)
     אין KC חדש — הבוס רק צובר ראיות על אותן תבניות-שדרה.

   🔴 חוק מבני: data-driven בלבד. אין תוכן קשיח — התוכן נקרא מ-pack
      דרך MishmishData.pick: contrasts+patterns+lexicon של class (חצר)
      ו-market (משותף). עד rebuild/standalone נופלים ל-fixture המוגדר
      בדף boss.html (לא כאן, לא ב-pack) כדי שהמסך יהיה בדיק standalone.
      כל עברית = טיוטה לאישור מיטל (asks.meytal); שאלת-אמיר בשער-3 היא
      תוכן-בוס חדש (draft) — נרשמת ל-asks.

   דגלי-URL: ?reset=1 (איפוס BKT) · ?peek=1 (מבט-מבוגר) · ?open=1 (דילוג-פתיחה).
   ============================================================ */
window.MishmishBoss = (function () {
  var BKT = window.MishmishBKT, A = window.MishmishAudio;

  function q(sel) { return document.querySelector(sel); }
  function flag(name) { try { return new URLSearchParams(location.search).get(name); } catch (e) { return null; } }
  function wait(ms) { return new Promise(function (r) { window.setTimeout(r, ms); }); }
  function stripNiqud(s) { return String(s || '').replace(/[֑-ׇ]/g, ''); }
  function reduceMotion() {
    try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
  }

  var MISHMISH_MOODS = ['idle', 'speaking', 'listening', 'thinking', 'hint', 'confused-soft', 'happy', 'celebrate'];
  var AMIR_MOODS = ['idle', 'hint', 'listening', 'happy'];
  function preload() {
    MISHMISH_MOODS.forEach(function (m) { var im = new Image(); im.src = '../assets/characters/mishmish/mishmish-' + m + '.png'; });
    AMIR_MOODS.forEach(function (m) { var im = new Image(); im.src = '../assets/characters/peers/amir-' + m + '.png'; });
    ['bg-hara-courtyard', 'bg-gateway-arch', 'bg-shared-market'].forEach(function (b) { var im = new Image(); im.src = '../assets/backgrounds/' + b + '.png'; });
  }

  // pb_focus נגזר מ-lexeme.sound_tags — זהה ל-M3/M6 (בּ/פּ בראש-הברה → true).
  function pbFocusFromTags(tags) {
    if (!tags || !tags.length) return false;
    return tags.some(function (t) {
      t = String(t).toLowerCase();
      return t === 'b_initial' || t === 'p_initial' || t === 'b_onset' || t === 'p_onset';
    });
  }
  function lexIndex(pack) {
    var idx = {};
    ((pack && pack.lexicon) || []).forEach(function (l) { if (l && l.id) idx[l.id] = l; });
    return idx;
  }
  function findPattern(pack, id) {
    return ((pack && pack.patterns) || []).filter(function (p) { return p && p.id === id; })[0] || null;
  }

  /* =====================================================================
     בוני-השערים — כל שער מרכיב את חוזה-הדאטה של המכניקה המקורית שלו.
     כל בונה מחזיר { kind, title_he, sub_he, place_he, place_ar, bg, items[] }
     ומוגבל למספר-פריטים קטן (הבוס = מעבר קולנועי תמציתי, לא תרגול ארוך).
     ===================================================================== */

  var GATE_ITEMS = 2;   // פריטים פר-שער (2 יעדים שונים → סף ≥2-מילים-שונות ל-KC ההפקה)

  // ── שער-צליל (same-different) — קורא pack.class.contrasts (זהה ל-M2) ──
  function buildSoundGate(classPack, demo) {
    var contrasts = (classPack && classPack.contrasts && classPack.contrasts.length)
      ? classPack.contrasts : (demo.sound && demo.sound.contrasts) || [];
    var wave = (classPack && classPack.meta && classPack.meta.sound_wave) || 1;
    var active = contrasts.filter(function (c) { return (c.wave == null ? 1 : c.wave) <= wave; });
    if (!active.length) active = contrasts.slice();

    var items = [];
    // בונים דטרמיניסטית מהזוג הראשון: פריט "שונה" + פריט "אותו" (מאוזן, עקבי ל-QA).
    var c = active[0];
    if (c) {
      var wp = (c.words && c.words[0]) || c.pair || [];
      var pb = (c.pb_focus === true) || (c.pb_focus !== false &&
        stripNiqud((c.pair || []).concat(wp).join('')).indexOf('פ') !== -1 &&
        stripNiqud((c.pair || []).concat(wp).join('')).indexOf('ב') !== -1);
      var label = (c.pair && c.pair.length >= 2)
        ? stripNiqud(c.pair[0]) + '~' + stripNiqud(c.pair[1])
        : stripNiqud(wp[0] || '?') + '~' + stripNiqud(wp[1] || '?');
      if (wp[0] && wp[1]) {
        items.push({ kind: 'sound', a: wp[0], b: wp[1], isSame: false, label: label, pb: !!pb });
        items.push({ kind: 'sound', a: wp[0], b: wp[0], isSame: true, label: label, pb: !!pb });
      }
    }
    return {
      kind: 'sound',
      title_he: 'שַׁעַר הַצְּלִיל',
      sub_he: 'אוֹתוֹ אוֹ שׁוֹנֶה?',
      place_he: 'בֶּחָצֵר', place_ar: 'بالحارة',
      bg: 'bg-hara-courtyard',
      items: items.slice(0, GATE_ITEMS)
    };
  }

  // ── שער-תבנית (missing-slot) — קורא pack.class.patterns (this_that) (זהה ל-M3) ──
  function resolveSlot(ref, idx) {
    var lex = (ref && typeof ref === 'object') ? ref : idx[ref];
    if (!lex || !lex.he) return null;
    return {
      id: lex.id, he: lex.he,
      img: lex.img ? ('../assets/items/' + lex.img) : null,
      emoji: lex.emoji || null,
      gender: lex.gender || 'm',
      pb_focus: pbFocusFromTags(lex.sound_tags)
    };
  }
  function buildPatternGate(classPack, demo) {
    var pat = findPattern(classPack, 'this_that');
    var idx = lexIndex(classPack);
    var slots = pat ? (pat.slots || []).map(function (s) { return resolveSlot(s, idx); }).filter(Boolean)
                    : ((demo.pattern && demo.pattern.slots) || []).map(function (s) { return resolveSlot(s, idx); }).filter(Boolean);
    var frame = (pat && pat.frame) || (demo.pattern && demo.pattern.frame) || 'זֶה ___';
    var frameF = (pat && pat.frame_f) || (demo.pattern && demo.pattern.frame_f) || 'זֹאת ___';
    var gendered = pat ? !!pat.gendered : true;
    var intent = (pat && pat.intent) || 'identify';
    var patId = (pat && pat.id) || 'this_that';

    var items = [];
    if (slots.length >= 3) {
      // מעדיפים יעד-זכר + יעד-נקבה כדי שה-frame יתחלף (זֶה/זֹאת) ו-distinctWords≥2.
      var male = slots.filter(function (s) { return s.gender !== 'f'; });
      var female = slots.filter(function (s) { return s.gender === 'f'; });
      var targets = [];
      if (male[0]) targets.push(male[0]);
      if (female[0]) targets.push(female[0]);
      while (targets.length < GATE_ITEMS && slots[targets.length]) {
        if (targets.indexOf(slots[targets.length]) === -1) targets.push(slots[targets.length]);
      }
      targets = targets.slice(0, GATE_ITEMS);
      targets.forEach(function (target, ti) {
        var others = slots.filter(function (s) { return s.id !== target.id; });
        var distractors = [others[0], others[1]];
        var options = [target].concat(distractors).map(function (s, oi) {
          return { id: s.id, he: s.he, img: s.img, emoji: s.emoji, correct: oi === 0 };
        });
        for (var r = 0; r < (ti % 3); r++) options.push(options.shift());  // הנכון לא תמיד ראשון
        items.push({
          kind: 'pattern',
          frame: (gendered && frameF && target.gender === 'f') ? frameF : frame,
          targetId: target.id, targetHe: target.he,
          pattern: patId, intent: intent,
          audio_he: ((gendered && frameF && target.gender === 'f') ? frameF : frame).replace('___', target.he),
          audio_full_key: (idx[target.id] && idx[target.id].audio_he) || null,
          audio_frame: (pat && pat.audio_frame) || null,
          options: options,
          pb_focus: !!target.pb_focus
        });
      });
    }
    return {
      kind: 'pattern',
      title_he: 'שַׁעַר הַתַּבְנִית',
      sub_he: 'הַשְׁלִימוּ אֶת הַמִּלָּה',
      place_he: 'בַּמַּעֲבָר', place_ar: 'بالممرّ',
      bg: 'bg-gateway-arch',
      items: items.slice(0, GATE_ITEMS)
    };
  }

  // ── שער-אינטראקציה (roleplay) — קורא pack.market.patterns give_me + lexicon (זהה ל-M6) ──
  // 🔴 שאלת-אמיר ("מָה אַתֶּם רוֹצִים?") היא תוכן-בוס (draft → asks.meytal): ב-market
  //    ל-give_me אין answer_pattern/amir_ask משלו, ולכן הבוס מספק את מסגרת-השאלה.
  function buildInteractionGate(marketPack, demo) {
    var give = findPattern(marketPack, 'give_me') || (demo.interaction && demo.interaction.produce);
    var idx = lexIndex(marketPack);
    var slots = give ? (give.slots || []).map(function (s) { return resolveSlot(s, idx); }).filter(function (n) { return n && n.img; })
                     : ((demo.interaction && demo.interaction.slots) || []).map(function (s) { return resolveSlot(s, idx); }).filter(Boolean);
    var frame = (give && give.frame) || 'תֵּן לִי ___';
    var patId = (give && give.id) || 'give_me';
    var intent = (give && give.intent) || 'request_object';
    var ask = (demo.interaction && demo.interaction.ask) ||
      { he: 'מָה אַתֶּם רוֹצִים?', audioKey: 'boss:ask:give_me' };   // draft → asks.meytal

    var items = [];
    var targets = slots.slice(0, GATE_ITEMS);
    targets.forEach(function (target, ti) {
      var distractor = slots.filter(function (s) { return s.id !== target.id; })[0];
      if (!distractor) return;
      var pair = (ti % 2 === 0) ? [target, distractor] : [distractor, target];
      var options = pair.map(function (n) {
        return { id: n.id, he: frame.replace('___', n.he), correct: n.id === target.id };
      });
      items.push({
        kind: 'interaction',
        producePattern: patId, intent: intent,
        targetId: target.id, pb_focus: !!target.pb_focus,
        ask: ask,
        referent: { id: target.id, he: target.he, img: target.img, emoji: target.emoji },
        options: options
      });
    });
    return {
      kind: 'interaction',
      title_he: 'שַׁעַר הַשִּׂיחָה',
      sub_he: 'עֲנוּ לְאָמִיר',
      place_he: 'בַּשּׁוּק', place_ar: 'بالسوق',
      bg: 'bg-shared-market',
      items: items.slice(0, GATE_ITEMS)
    };
  }

  /* =====================================================================
     start() — הרכבה + נהיגה
     ===================================================================== */
  function start() {
    if (flag('reset') && BKT && BKT.reset) BKT.reset();
    if (BKT && BKT.beginSession) BKT.beginSession();
    preload();

    var classSel = window.MishmishData && window.MishmishData.pick({ pack: 'class' });
    var marketSel = window.MishmishData && window.MishmishData.pick({ pack: 'market' });
    var classPack = classSel && classSel.pack;
    var marketPack = marketSel && marketSel.pack;
    var demo = window.MISHMISH_BOSS_DEMO || {};

    var gates = [
      buildSoundGate(classPack, demo),
      buildPatternGate(classPack, demo),
      buildInteractionGate(marketPack, demo)
    ].filter(function (g) { return g.items && g.items.length; });

    var usingFallback = !(classPack && classPack.contrasts) || !(marketPack && marketPack.patterns);
    console.log('[boss] gates=' + gates.length + ' items=' + gates.map(function (g) { return g.kind + ':' + g.items.length; }).join(',') +
      (usingFallback ? ' (FALLBACK בחלק מהשערים — טיוטה)' : ''));

    var els = {
      sceneBg: q('#scene-bg'), curtain: q('#curtain'),
      gateProgress: q('#gate-progress'),
      placeHe: q('#place-he'), placeAr: q('#place-ar'),
      banner: q('#gate-banner'), bannerTitle: q('#banner-title'), bannerSub: q('#banner-sub'),
      gate: q('#gate'), gatekeeper: q('#gatekeeper'),
      // אזורי-משחק (מוחלפים פר kind)
      sound: q('#area-sound'), snd1: q('#snd-1'), snd2: q('#snd-2'),
      tSame: q('#tile-same'), tDiff: q('#tile-different'), soundBubble: q('#sound-bubble'),
      pattern: q('#area-pattern'), sentence: q('#sentence'),
      interaction: q('#area-interaction'), amirHe: q('#amir-he'), refImg: q('#ref-img'), refBadge: q('#ref-badge'),
      listen: q('#listen'), tiles: q('#tiles'),
      mishmish: q('#mishmish'),
      scaffold: q('#scaffold'), amirText: q('#amir-text'), amirAr: q('#amir-ar'),
      instr: q('#instr'),
      journeyFill: q('#journey-fill'), journeyPaw: q('#journey-paw'), journeyNodes: q('#journey-nodes'),
      introOverlay: q('#introOverlay'), startBtn: q('#startBtn'),
      doneOverlay: q('#doneOverlay'), againBtn: q('#againBtn'),
      peekBtn: null
    };

    // ── כלים משותפים ──
    function setMishmish(mood) {
      els.mishmish.src = '../assets/characters/mishmish/mishmish-' + mood + '.png';
      els.mishmish.classList.toggle('celebrate', mood === 'celebrate');
    }
    function setGatekeeper(mood) {
      if (els.gatekeeper) els.gatekeeper.src = '../assets/characters/peers/amir-' + (mood || 'idle') + '.png';
    }
    function setScaffoldAmir(mood) {
      var img = els.scaffold && els.scaffold.querySelector('img');
      if (img) img.src = '../assets/characters/peers/amir-' + (mood || 'hint') + '.png';
    }

    // מדרג-רמז: he מ-scaffold.json (טיוטת-מיטל), ar עאמייה מגודרת (ar_verified:false).
    function showHint(step) {
      if (!els.scaffold) return;
      var tier = step >= 3 ? 'amiya' : (step >= 2 ? 'point' : 'encourage');
      setScaffoldAmir(tier === 'encourage' ? 'listening' : 'hint');
      var hintData = window.MishmishScaffold && window.MishmishScaffold.amirHint(tier);
      if (els.amirText) els.amirText.textContent = (hintData && hintData.he) || 'עוֹד פַּעַם — הַקְשִׁיבוּ טוֹב';
      if (els.amirAr) {                                   // עאמייה: נכתבת ל-DOM, מוסתרת ב-CSS
        els.amirAr.textContent = (tier === 'amiya' && hintData && hintData.ar) ? hintData.ar : '';
        els.amirAr.setAttribute('data-arabic-verified', 'false');
      }
      els.scaffold.classList.add('show');
    }
    function hideHint() { if (els.scaffold) els.scaffold.classList.remove('show'); }

    // שורת שפת-הישרדות — מקור-אמת יחיד (זהה לכל המכניקות)
    if (window.MishmishScaffold) {
      window.MishmishScaffold.bind('#survival', function () {
        return activeCtl ? { replay: activeCtl.replay, hint: activeCtl.hint } : null;
      });
    }
    if (els.listen) els.listen.addEventListener('click', function () { if (activeCtl) activeCtl.replay(false); });

    // ── journey-track (מתמלא בתחתית בין שני המרחבים) ──
    if (els.journeyNodes) {
      els.journeyNodes.innerHTML = '';
      gates.forEach(function (g, i) {
        var n = document.createElement('span');
        n.className = 'jnode';
        n.style.insetInlineStart = (gates.length === 1 ? 50 : (i / (gates.length - 1)) * 100) + '%';
        n.setAttribute('data-kind', g.kind);
        els.journeyNodes.appendChild(n);
      });
    }
    function paintJourney(completed) {
      var pct = gates.length ? (completed / gates.length) * 100 : 0;
      if (els.journeyFill) els.journeyFill.style.width = pct + '%';
      if (els.journeyPaw) els.journeyPaw.style.insetInlineStart = pct + '%';
      Array.prototype.forEach.call((els.journeyNodes && els.journeyNodes.children) || [], function (n, i) {
        n.classList.toggle('done', i < completed);
        n.classList.toggle('current', i === completed);
      });
    }
    // gate-progress בטופ-בר (נקודה פר שער)
    if (els.gateProgress) {
      els.gateProgress.innerHTML = '';
      gates.forEach(function () { var p = document.createElement('span'); p.className = 'paw'; els.gateProgress.appendChild(p); });
    }
    function paintGateProgress(gi) {
      Array.prototype.forEach.call((els.gateProgress && els.gateProgress.children) || [], function (p, i) {
        p.classList.toggle('done', i < gi);
        p.classList.toggle('current', i === gi);
      });
    }

    // מעבר קולנועי בין מרחבים: וילון נסגר (מישמיש חוצה את השער) → החלפת רקע/מקום → וילון נפתח.
    function crossTo(gate) {
      return new Promise(function (resolve) {
        var swap = function () {
          if (els.sceneBg) els.sceneBg.src = '../assets/backgrounds/' + gate.bg + '.png';
          if (els.placeHe) els.placeHe.textContent = gate.place_he;
          if (els.placeAr) els.placeAr.textContent = gate.place_ar;
        };
        if (reduceMotion() || !els.curtain) { swap(); resolve(); return; }
        els.curtain.classList.add('show');
        window.setTimeout(function () {
          swap();
          window.setTimeout(function () {
            els.curtain.classList.remove('show');
            window.setTimeout(resolve, 340);
          }, 120);
        }, 360);
      });
    }
    function showBanner(gate) {
      if (!els.banner) return Promise.resolve();
      if (els.bannerTitle) els.bannerTitle.textContent = gate.title_he;
      if (els.bannerSub) els.bannerSub.textContent = gate.sub_he;
      els.banner.classList.add('show');
      return wait(reduceMotion() ? 200 : 1100).then(function () { els.banner.classList.remove('show'); return wait(reduceMotion() ? 0 : 220); });
    }
    // אנימציית פתיחת-שער כשהילד השלים אותו (שומר-השער נפתח בשימוש נכון).
    function openGateAnim() {
      if (!els.gate) return Promise.resolve();
      setGatekeeper('happy');
      els.gate.classList.add('open');
      return wait(reduceMotion() ? 0 : 700).then(function () { els.gate.classList.remove('open'); });
    }

    // הצגת אזור-המשחק המתאים ל-kind (מסתיר את השאר)
    function showArea(kind) {
      [['sound', els.sound], ['pattern', els.pattern], ['interaction', els.interaction]].forEach(function (p) {
        if (p[1]) p[1].hidden = (p[0] !== kind);
      });
      // כפתור-האזנה משמש בשער-תבנית + שער-אינטראקציה בלבד
      if (els.listen) els.listen.hidden = (kind === 'sound');
    }

    var gateIdx = 0, itemIdx = 0, activeCtl = null;

    // ── דרייבר-פריט יחיד: מכונת-מצבים תואמת-חוזה measured.js ──
    function mountItem() {
      var gate = gates[gateIdx];
      if (!gate) return finale();
      if (itemIdx >= gate.items.length) return gateComplete();

      var item = gate.items[itemIdx];
      var st = { measuredDone: false, done: false, hintStep: 0 };
      showArea(gate.kind);
      hideHint();
      setMishmish('idle');
      setGatekeeper(gate.kind === 'interaction' ? 'idle' : 'idle');

      // ---------- רינדור פר-kind ----------
      function renderTiles(tileEls) {   // עבור pattern + interaction (אריחי-בחירה)
        els.tiles.innerHTML = '';
        tileEls.forEach(function (opt) {
          var b = document.createElement('button');
          b.className = 'tile';
          b.type = 'button';
          b.setAttribute('aria-disabled', 'true');
          var visual = '';
          if (opt.img) visual = '<img src="' + opt.img + '" alt="" onerror="this.style.visibility=\'hidden\'">';
          else if (opt.emoji) visual = '<span class="emoji" aria-hidden="true">' + opt.emoji + '</span>';
          b.innerHTML = visual + '<span class="cap">' + opt.he + '</span>';
          b.addEventListener('click', function () { onChoice(b, opt); });
          els.tiles.appendChild(b);
        });
      }
      function enableTiles(on, list) {
        (list || els.tiles.children) && Array.prototype.forEach.call(list || els.tiles.children, function (b) {
          b.setAttribute('aria-disabled', on ? 'false' : 'true');
        });
      }
      function clearMarks() {
        Array.prototype.forEach.call(els.tiles.children, function (b) { b.classList.remove('retry', 'selected'); });
        [els.tSame, els.tDiff].forEach(function (b) { if (b) b.classList.remove('retry', 'selected'); });
      }

      // רשימת אריחי-הבחירה הפעילים (sound=שני אריחי-שיפוט; אחרת #tiles)
      function activeTiles() {
        return gate.kind === 'sound' ? [els.tSame, els.tDiff]
          : Array.prototype.slice.call(els.tiles.children);
      }
      function lockAll(on) { activeTiles().forEach(function (b) { if (b) b.setAttribute('aria-disabled', on ? 'false' : 'true'); }); }

      // ---------- אודיו (עברית=יעד) ----------
      function playSound(word, slow, chip) {
        if (chip) chip.classList.add('playing');
        return A.hebrew(word, { key: 'sd:' + stripNiqud(word), slow: slow, statusEl: chip })
          .then(function () { if (chip) chip.classList.remove('playing'); },
                function () { if (chip) chip.classList.remove('playing'); });
      }
      function playPatternPrompt(slow) {
        els.listen.setAttribute('data-audio', 'playing');
        return A.hebrew(item.audio_he, { key: item.audio_full_key || (item.pattern + '::' + item.targetId), slow: slow, statusEl: els.listen })
          .then(function () { els.listen.setAttribute('data-audio', 'idle'); },
                function () { els.listen.setAttribute('data-audio', 'idle'); });
      }
      function playAsk(slow) {
        setGatekeeper('idle');                               // אין מצב 'speaking' לאמיר — נשאר idle בזמן הדיבור
        els.listen.setAttribute('data-audio', 'playing');
        return A.hebrew(item.ask.he, { key: item.ask.audioKey || 'boss:ask:' + item.producePattern, slow: slow, statusEl: els.listen })
          .then(function () { els.listen.setAttribute('data-audio', 'idle'); },
                function () { els.listen.setAttribute('data-audio', 'idle'); });
      }

      // ---------- מדידה — ניסיון ראשון בלבד, KC זהה למכניקה המקורית ----------
      function measure(correct) {
        if (!BKT || !BKT.ingest) return;
        if (gate.kind === 'sound') {
          BKT.ingest({
            pattern: 'contrast', intent: 'discriminate', target: item.label,
            dimension: 'recognize', firstTry: true, correct: correct,
            pb_focus: !!item.pb, pb_context: 'onset',
            errorAxis: correct ? undefined : 'sound'
          });
        } else if (gate.kind === 'pattern') {
          BKT.ingest({
            pattern: item.pattern, intent: item.intent, target: item.targetId,
            dimension: 'produce_supported', firstTry: true, correct: correct,
            pb_focus: !!item.pb_focus, pb_context: 'sentence'
          });
        } else {
          BKT.ingest({
            pattern: item.producePattern, intent: item.intent, target: item.targetId,
            dimension: 'produce_supported', firstTry: true, correct: correct,
            pb_focus: !!item.pb_focus, pb_context: 'sentence'
          });
        }
      }

      // ---------- זרימת-הבחירה (משותפת) ----------
      function onChoice(btn, opt) {
        if (btn.getAttribute('aria-disabled') === 'true') return;
        var correct = gate.kind === 'sound' ? (opt.choice === (item.isSame ? 'same' : 'different')) : !!opt.correct;

        if (!st.measuredDone) {
          st.measuredDone = true;
          measure(correct);
          if (correct) return commitCorrect(btn);
          return enterLearning(btn);
        }
        if (correct) return commitCorrect(btn);
        return nudgeRetry(btn);
      }

      function commitCorrect(btn) {
        lockAll(false);
        clearMarks();
        btn.classList.add('selected');                  // כחול-זהות, לא ירוק
        if (gate.kind === 'pattern') fillSentence(true);
        if (gate.kind === 'interaction') { setGatekeeper('happy'); playEcho(); }
        setMishmish('celebrate');
        hideHint();
        window.setTimeout(function () { setMishmish('happy'); complete(); }, gate.kind === 'interaction' ? 1050 : 950);
      }
      function enterLearning(btn) {                       // טעות ראשונה → מצב-למידה (לא נמדד)
        btn.classList.add('retry');                       // צהוב חם, לא אדום
        setMishmish('confused-soft');
        window.setTimeout(hint, 700);
      }
      function nudgeRetry(btn) {
        btn.classList.add('retry');
        window.setTimeout(function () { btn.classList.remove('retry'); }, 900);
        hint();
      }

      // מדרג-רמז: השמעה-חוזרת → הצבעה חזותית (step≥2) → פיגום-עאמייה (step≥3)
      function hint() {
        st.hintStep++;
        setMishmish('hint');
        showHint(st.hintStep);
        replayAudio(true).then(function () {
          if (st.hintStep >= 2) pointToCorrect();
          setMishmish('listening');
        }, function () { setMishmish('listening'); });
      }
      function pointToCorrect() {
        if (gate.kind === 'sound') {
          var t = item.isSame ? els.tSame : els.tDiff;
          if (t) t.classList.add('selected');
        } else {
          var c = Array.prototype.filter.call(els.tiles.children, function (b, i) {
            return item.options[i] && item.options[i].correct;
          })[0];
          if (c) c.classList.add('selected');
        }
      }
      function playEcho() {
        var c = item.options.filter(function (o) { return o.correct; })[0];
        if (c) A.hebrew(c.he, { key: 'rp:echo:' + item.targetId }).then(function () {}, function () {});
      }

      // ---------- רצף-ההשמעה + פתיחת-האריחים (שמיעתי-קודם) פר-kind ----------
      var GAP_MS = 480;
      function playIntro() {
        lockAll(false);
        if (gate.kind === 'sound') {
          setMishmish('speaking');
          els.snd1.classList.remove('done'); els.snd2.classList.remove('done');
          return playSound(item.a, false, els.snd1)
            .then(function () { els.snd1.classList.add('done'); return wait(GAP_MS); })
            .then(function () { return playSound(item.b, false, els.snd2); })
            .then(function () { els.snd2.classList.add('done'); }, function () {})
            .then(openForAnswer, openForAnswer);
        }
        if (gate.kind === 'pattern') {
          setMishmish('speaking');
          fillSentence(false);
          return playPatternPrompt(false).then(openForAnswer, openForAnswer);
        }
        // interaction
        setGatekeeper('idle');
        setMishmish('listening');
        if (els.amirHe) els.amirHe.textContent = item.ask.he;
        return playAsk(false).then(openForAnswer, openForAnswer);
      }
      function replayAudio(slow) {
        if (gate.kind === 'sound') {
          els.snd1.classList.remove('done'); els.snd2.classList.remove('done');
          return playSound(item.a, slow, els.snd1)
            .then(function () { els.snd1.classList.add('done'); return wait(GAP_MS); })
            .then(function () { return playSound(item.b, slow, els.snd2); })
            .then(function () { els.snd2.classList.add('done'); }, function () {});
        }
        if (gate.kind === 'pattern') return playPatternPrompt(slow);
        return playAsk(slow);
      }
      function openForAnswer() {
        setMishmish(gate.kind === 'interaction' ? 'idle' : 'listening');
        if (gate.kind === 'interaction') setGatekeeper('listening');
        lockAll(true);
      }

      // ---------- רינדור התוכן פר-kind ----------
      function fillSentence(filled) {
        if (!els.sentence) return;
        var parts = String(item.frame).split('___');
        els.sentence.innerHTML = '';
        els.sentence.appendChild(document.createTextNode(parts[0] || ''));
        var gap = document.createElement('span');
        gap.className = 'slot-gap' + (filled ? ' filled' : '');
        if (filled) gap.textContent = item.targetHe; else gap.setAttribute('aria-label', 'מִלָּה חֲסֵרָה');
        els.sentence.appendChild(gap);
        els.sentence.appendChild(document.createTextNode(parts[1] || ''));
      }

      if (gate.kind === 'sound') {
        if (els.soundBubble) els.soundBubble.textContent = gate.sub_he;
        els.instr && (els.instr.textContent = 'הַקְשִׁיבוּ. אוֹתוֹ אוֹ שׁוֹנֶה?');
        clearMarks();
      } else if (gate.kind === 'pattern') {
        renderTiles(item.options);
        fillSentence(false);
        els.instr && (els.instr.textContent = 'הַקְשִׁיבוּ לַמִּישְׁמִישׁ וּבַחֲרוּ אֶת הַמִּלָּה הַחֲסֵרָה');
      } else {
        renderTiles(item.options);
        if (els.amirHe) els.amirHe.textContent = item.ask.he;
        if (els.refBadge) els.refBadge.textContent = 'אַתֶּם צְרִיכִים';
        if (els.refImg) {
          if (item.referent.img) { els.refImg.src = item.referent.img; els.refImg.style.visibility = ''; els.refImg.onerror = function () { this.style.visibility = 'hidden'; }; }
          else { els.refImg.removeAttribute('src'); els.refImg.style.visibility = 'hidden'; }
        }
        els.instr && (els.instr.textContent = 'הַקְשִׁיבוּ לְאָמִיר וּבַחֲרוּ מָה לוֹמַר');
      }

      lockAll(false);
      window.setTimeout(function () { playIntro(); }, 250);
      paintGateProgress(gateIdx);

      activeCtl = {
        replay: function (slow) { setMishmish('speaking'); replayAudio(!!slow).then(openForAnswer, openForAnswer); },
        hint: function () { hint(); }
      };

      function complete() {
        if (st.done) return;
        st.done = true;
        itemIdx++;
        window.setTimeout(mountItem, 420);
      }
    }

    // ── סיום-שער → פתיחת-שער + מעבר-מרחב → השער הבא ──
    function gateComplete() {
      activeCtl = null;
      var completed = gateIdx + 1;
      openGateAnim().then(function () {
        paintJourney(completed);
        paintGateProgress(completed);
        gateIdx++;
        itemIdx = 0;
        if (gateIdx >= gates.length) return finale();
        var next = gates[gateIdx];
        crossTo(next).then(function () { return showBanner(next); }).then(function () { setGatekeeper('idle'); mountItem(); });
      });
    }

    // ── פתיחת השער הראשון ──
    function startGate0() {
      var g0 = gates[0];
      paintJourney(0);
      paintGateProgress(0);
      if (els.sceneBg) els.sceneBg.src = '../assets/backgrounds/' + g0.bg + '.png';
      if (els.placeHe) els.placeHe.textContent = g0.place_he;
      if (els.placeAr) els.placeAr.textContent = g0.place_ar;
      showBanner(g0).then(function () { setGatekeeper('idle'); mountItem(); });
    }

    function finale() {
      activeCtl = null;
      paintJourney(gates.length);
      setMishmish('celebrate');
      setGatekeeper('happy');
      if (els.doneOverlay) els.doneOverlay.classList.remove('hidden');
      if (flag('peek')) showPeek();
    }
    function showPeek() {
      if (!BKT || !BKT.snapshot) return;
      var box = document.createElement('pre');
      box.className = 'peek';
      box.textContent = 'מבט-מבוגר · בּוֹס-הַמַּעֲבָר (BKT):\n' + JSON.stringify(BKT.snapshot(), null, 2);
      document.body.appendChild(box);
    }

    // overlay-פתיחה: מתחילים רק אחרי נגיעת-ילד (מדיניות autoplay + unlock אודיו)
    function begin() { if (els.introOverlay) els.introOverlay.classList.add('hidden'); startGate0(); }
    if (els.startBtn) els.startBtn.addEventListener('click', begin);
    if (flag('open')) begin();
    if (els.againBtn) els.againBtn.addEventListener('click', function () { location.reload(); });

    if (!gates.length && els.introOverlay) {
      var h = els.introOverlay.querySelector('h2');
      if (h) h.textContent = 'אֵין עֲדַיִן שְׁעָרִים';
    }
  }

  return { start: start };
})();
