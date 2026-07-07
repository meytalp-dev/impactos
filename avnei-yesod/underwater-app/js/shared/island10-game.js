// ============================================================================
// island10-game.js — מריץ משותף לשני משחקוני אי 10 (מפרץ אבני הבנייה · תחיליות וסיומות)
// 7.7.2026 · לוח בניית האיים C10
//
// עטיפה דקה סביב דפוס stage-bank-play / island8-game: כל דף-משחק של אי 10 קורא
//   AvneiIsland10Game.boot({ missionKey, qIds, theme, prompts?, genericPrompt?,
//                            finishTitle, finishText, completionKey })
// והמודול טוען את הבנק (curriculum/questions-grade1.json), בונה תור לפי רשימת
// q_id מפורשת (הסדר = רצף פדגוגי קל→קשה), וממפה כל שאלה ל-mechanic-mcq.
//
// חוקי מדידה (זהים לאי 8):
//   primary_island_id=10 מפורש בכל result (resolveIslandId מכבד אותו → BKT אי 10).
//   characteristic_id מהבנק בכל payload (EPA G4, פר-מסיח).
//   כל האופציות שלנו הן טקסט → אין two-tap ואין בעיית מסיח-שמע לא-מובחן.
//
// אודיו:
//   סיומות (יחיד/רבים) — stem טקסט (מציג את המילה, "בסיס + סיומת" נראֶה לעין;
//     דפוס אי 9). אין אודיו פר-סבב; הוראת-המשימה מושמעת פעם אחת בהתחלה.
//   תחיליות — חלק מהפריטים stem אודיו (שומעים בְּ/וְ/לְ + מילה → בוחרים כתיב),
//     כי התחילית היא הבדל צליל. ה-stems האלה מוקלטים מראש (isl10-w-*, ElevenLabs
//     + QA Whisper, scripts/generate-island-10-audio.py). שאלת-אודיו בלי MP3 מדולגת
//     בשקט (כמו bank-play). ה-stem מתנגן פעם אחת ב-mount (mechanic-mcq).
// ============================================================================
(function () {
  'use strict';

  var ISLAND_ID = 10;

  // מיפוי מחרוזת מנוקדת מדויקת → מפתח MP3 (רק ה-stems האודיו של אי 10 — תחיליות).
  var WORD_AUDIO = {
    'לְנָדָב':   'isl10-w-lenadav',
    'וְחַרְדָּל': 'isl10-w-vechardal',
    'בִּדְבַשׁ':  'isl10-w-bidvash',
  };

  // מסיר תעתיק לטיני /..../ מתצוגה לילד (נשאר בבנק — מיועד למורה)
  function cleanHe(s) {
    return String(s || '').replace(/\s*\/[A-Za-z'’\-]+\/\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }

  function $(id) { return document.getElementById(id); }

  // בועת-נוני: task_he של פריטי אי 10 אינו חושף את התשובה (שואל "מה הרבים של X" /
  // "אחד או הרבה" / "הקשיבו ובחרו") → אפשר להשתמש בו כלשונו. תמיכה בעקיפה פר-משחק
  // (genericPrompt) ופר-שאלה (prompts[q_id]) נשמרת ליתר ביטחון.
  function promptFor(q, game) {
    if (game.prompts && game.prompts[q.q_id]) return game.prompts[q.q_id];
    if (q.stem_mode === 'audio' && game.genericPrompt) return game.genericPrompt;
    return cleanHe(q.task_he);
  }

  function toConfig(q, game) {
    var opts = (q.options || []).map(function (o) {
      return {
        label_he: cleanHe(o.label_he), mode: o.mode || 'text',
        is_correct: !!o.is_correct, epa: o.epa || null,
      };
    });

    var stem;
    if (q.stem_mode === 'audio') {
      var key = WORD_AUDIO[(q.stem_he || '').trim()];
      if (!key) return null;                 // אין הקלטה → מדלגים, לא שוברים
      stem = { mode: 'audio', audio_key: key, text_he: q.stem_he };
    } else {
      stem = { mode: 'text', text_he: cleanHe(q.stem_he) };
    }

    return {
      interaction: q.interaction,
      questId: q.q_id, item_id: q.q_id,
      characteristic_id: q.characteristic_id || null,
      primary_island_id: ISLAND_ID,
      theme: game.theme || 'shells',
      promptLine: promptFor(q, game),
      stem: stem,
      options: opts,
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
    var skipped = 0;
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

    fetch('../curriculum/questions-grade1.json', { cache: 'no-cache' })
      .then(function (r) { return r.json(); })
      .then(function (b) {
        var list = Array.isArray(b) ? b : (b.questions || b.items || []);
        var byId = {};
        list.forEach(function (q) { byId[q.q_id] = q; });
        queue = [];
        game.qIds.forEach(function (id) {
          var q = byId[id];
          var cfg = q ? toConfig(q, game) : null;
          if (cfg) queue.push(cfg); else skipped++;
        });
        if (skipped) console.warn('[island10] דולגו ' + skipped + ' שאלות ללא אודיו/שאלה');
        if (!queue.length) {
          root.innerHTML = '<div class="empty-note">אֵין כָּרֶגַע שְׁאֵלוֹת מוּכָנוֹת. נַסּוּ שׁוּב מְאֻחָר יוֹתֵר.</div>';
          return;
        }
        $('startVeil').hidden = false;
        $('startBtn').addEventListener('click', function () {
          try { if (window.AvneiAudio.unlock) window.AvneiAudio.unlock(); } catch (e) {}
          $('startVeil').hidden = true;
          idx = 0;
          // הוראת-המשימה של נוני פעם אחת — ורק אחריה הסבב הראשון
          playMissionThen(game.missionKey, mountNext);
        });
      })
      .catch(function (err) {
        console.error('[island10] load failed', err);
        root.innerHTML = '<div class="empty-note">מַשֶּׁהוּ הִשְׁתַּבֵּשׁ בִּטְעִינַת הַשְּׁאֵלוֹת.</div>';
      });
  }

  window.AvneiIsland10Game = { boot: boot, _toConfig: toConfig, _WORD_AUDIO: WORD_AUDIO };
})();
