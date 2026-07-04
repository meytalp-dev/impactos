// ============================================================================
// templates/mechanic-match-pairs.js — חיבור N זוגות (match_pair · 36 שאלות)
// minigame-fit T4 · 30.6.2026 · לפי fit-report §5 NEW match-pairs
//
// הילד.ה מחבר.ת זוגות (יחיד↔רבים · זכר↔נקבה · מילה↔תמונה · אות↔אות) ע"י
// הקשה-הקשה בין שני טורים. הזוגות גלויים (לא משחק-זיכרון הופכי — זה memory-pair).
//
// config:
//   mount(root, {
//     pairs: [ { pair_id,
//                left:  { label_he, mode:'text'|'image'|'audio', audio_key, image_src, image_alt },
//                right: { label_he, mode, audio_key, image_src, image_alt },
//                epa:{what,where,task}|null /* טעות אופיינית לצימוד שגוי של הזוג הזה */ } ],
//     distractor_epa,           // ברירת-מחדל ל-epa אם לזוג אין epa משלו
//     promptLine, target_letter, primary_island_id, secondary_island_ids,
//     rama_task_alignment, peima_target, interaction, questId, item_id, theme,
//     onUnitWon, onComplete
//   })
//
// 🔴 חוזה EPA: חיבור שגוי → failure/task/where מתוך epa (בד"כ WrongPlural/GenderMismatch).
//   ⚠️ למורפולוגיה אין target_letter יחיד → epa.js לא ירשום עד G4 (מפתח לא-מבוסס-אות).
//   ראה _handoff/2026-06-30-minigame-implementation-agent-brief.md §4 T5. נשאר additive.
// ============================================================================

(function () {
  'use strict';

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function noni(state) {
    if (typeof window !== 'undefined' && window.AvneiNoni) { try { window.AvneiNoni.setState(state); } catch (e) {} }
  }
  function playKey(key) {
    if (key && typeof window !== 'undefined' && window.AvneiAudio) { try { window.AvneiAudio.play(key); } catch (e) {} }
  }

  function buildLogPayload(opts, epa, ctx) {
    return {
      activity_type:        'match-pairs',
      activity_variant:     opts.interaction || 'match_pair',
      item_id:              opts.item_id || opts.questId || null,
      target_letter:        opts.target_letter || null,
      is_correct:           !!(ctx && ctx.is_correct),
      failure_type:         epa ? (epa.what || null)  : null,
      letter_position:      epa ? (epa.where || null) : null,
      task_type:            epa ? (epa.task || null)  : null,
      primary_island_id:    (typeof opts.primary_island_id === 'number') ? opts.primary_island_id : undefined,
      secondary_island_ids: Array.isArray(opts.secondary_island_ids) ? opts.secondary_island_ids : undefined,
      rama_task_alignment:  (typeof opts.rama_task_alignment === 'number') ? opts.rama_task_alignment : undefined,
      peima_target:         (typeof opts.peima_target === 'number') ? opts.peima_target : undefined,
      supportLevel:         1,
      attempts:             (ctx && ctx.attempts) || 1,
      response_time_ms:     (ctx && ctx.is_correct) ? ((ctx && ctx.response_time_ms) || null) : null,
      hint_used:            !!(ctx && ctx.hint_used),
    };
  }
  function logResult(opts, epa, ctx) {
    if (typeof window === 'undefined' || !window.AvneiEventLogger) return;
    try { window.AvneiEventLogger.logActivityResult(buildLogPayload(opts, epa, ctx)); } catch (e) {}
  }

  function renderSide(side, theme) {
    var tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'mp-tile mp-tile--' + (side.mode || 'text');
    if (side.mode === 'image') {
      var imgAlt = side.image_alt || side.label_he || '';
      // src ריק / 404 → נפילה חיננית לתווית טקסט במקום <img> שבור (כמו mechanic-mcq)
      var imgFallback = function () {
        var fspan = document.createElement('span');
        fspan.className = 'mp-tile__label'; fspan.lang = 'he'; fspan.textContent = imgAlt;
        tile.innerHTML = ''; tile.appendChild(fspan);
      };
      if (side.image_src) {
        var img = document.createElement('img'); img.className = 'mp-tile__img';
        img.src = side.image_src; img.alt = imgAlt;
        img.onerror = imgFallback;
        tile.appendChild(img);
      } else {
        imgFallback();
      }
      tile.setAttribute('aria-label', imgAlt || 'תְּמוּנָה');
    } else if (side.mode === 'audio') {
      var spk = document.createElement('span'); spk.className = 'mp-tile__spk'; spk.setAttribute('aria-hidden', 'true'); spk.textContent = '🔊';
      tile.appendChild(spk); tile.setAttribute('aria-label', 'הַאֲזָנָה');
    } else {
      var span = document.createElement('span'); span.className = 'mp-tile__label'; span.lang = 'he';
      span.textContent = side.label_he || ''; tile.appendChild(span);
      tile.setAttribute('aria-label', side.label_he || '');
    }
    return tile;
  }

  function mount(root, opts) {
    opts = opts || {};
    var pairs = Array.isArray(opts.pairs) ? opts.pairs.slice() : [];
    if (!pairs.length) return { unmount: function () {} };

    var epaById = {};
    pairs.forEach(function (p) { epaById[p.pair_id] = p.epa || opts.distractor_epa || null; });

    var state = { matched: 0, attempts: 0, locked: false, selected: null, startTime: Date.now() };

    root.innerHTML = '';
    root.classList.add('mechanic-match-pairs');
    if (opts.theme) root.classList.add('theme-' + opts.theme);

    if (opts.promptLine) {
      var prompt = document.createElement('div');
      prompt.className = 'mp-prompt'; prompt.lang = 'he'; prompt.textContent = opts.promptLine;
      root.appendChild(prompt);
    }

    var board = document.createElement('div');
    board.className = 'mp-board';
    var colRight = document.createElement('div'); colRight.className = 'mp-col mp-col--right';
    var colLeft  = document.createElement('div'); colLeft.className = 'mp-col mp-col--left';
    board.appendChild(colRight); board.appendChild(colLeft);
    root.appendChild(board);

    var feedback = document.createElement('div');
    feedback.className = 'mcq-feedback'; feedback.setAttribute('aria-live', 'polite');
    root.appendChild(feedback);

    // טור ימין = left-sides (RTL); טור שמאל = right-sides. כל אחד מעורבב בנפרד.
    shuffle(pairs).forEach(function (p) {
      var t = renderSide(p.left, opts.theme);
      t.dataset.pairId = String(p.pair_id); t.dataset.col = 'A';
      t.addEventListener('click', function () { onTile(t, p.left); });
      colRight.appendChild(t);
    });
    shuffle(pairs).forEach(function (p) {
      var t = renderSide(p.right, opts.theme);
      t.dataset.pairId = String(p.pair_id); t.dataset.col = 'B';
      t.addEventListener('click', function () { onTile(t, p.right); });
      colLeft.appendChild(t);
    });

    noni('idle');

    function clearSelection() {
      if (state.selected) state.selected.tile.classList.remove('selected');
      state.selected = null;
    }

    function onTile(tile, side) {
      if (state.locked) return;
      if (tile.classList.contains('matched')) return;
      if (side && side.audio_key) playKey(side.audio_key);

      // אין בחירה → בחר. בחירה קיימת באותו טור → החלף בחירה. טור נגדי → נסה לחבר.
      if (!state.selected) {
        state.selected = { tile: tile, col: tile.dataset.col };
        tile.classList.add('selected');
        return;
      }
      if (state.selected.tile === tile) { clearSelection(); return; }
      if (state.selected.col === tile.dataset.col) {
        clearSelection();
        state.selected = { tile: tile, col: tile.dataset.col };
        tile.classList.add('selected');
        return;
      }

      // חיבור בין שני טורים → הכרעה.
      var a = state.selected.tile, b = tile;
      var isMatch = a.dataset.pairId === b.dataset.pairId;
      state.attempts++;

      if (isMatch) {
        a.classList.remove('selected'); a.classList.add('matched'); b.classList.add('matched');
        a.disabled = true; b.disabled = true;
        state.selected = null;
        state.matched++;
        noni('cheer');
        logResult(opts, null, { is_correct: true, attempts: state.attempts, response_time_ms: Date.now() - state.startTime });
        if (typeof opts.onUnitWon === 'function') try { opts.onUnitWon(state.matched - 1); } catch (e) {}
        if (state.matched >= pairs.length) {
          state.locked = true;
          feedback.textContent = 'כָּל הַזּוּגוֹת חֻבְּרוּ!'; feedback.className = 'mcq-feedback mcq-feedback--ok';
          setTimeout(function () { if (typeof opts.onComplete === 'function') try { opts.onComplete(); } catch (e) {} }, 1100);
        }
      } else {
        // טעות — דווח את ה-epa של הזוג שה-left שלו נבחר (קטגוריית הטעות).
        var aId = a.dataset.col === 'A' ? a.dataset.pairId : b.dataset.pairId;
        logResult(opts, epaById[aId], { is_correct: false, attempts: state.attempts });
        a.classList.add('wrong-sway'); b.classList.add('wrong-sway');
        setTimeout(function () { a.classList.remove('wrong-sway'); b.classList.remove('wrong-sway'); }, 700);
        clearSelection();
        if (state.attempts >= 3 && window.AvneiNoni) noni('hint');
      }
    }

    return {
      unmount: function () {
        root.innerHTML = '';
        root.classList.remove('mechanic-match-pairs');
        if (opts.theme) root.classList.remove('theme-' + opts.theme);
      },
    };
  }

  if (typeof window !== 'undefined') {
    window.AvneiMechanics = window.AvneiMechanics || {};
    window.AvneiMechanics['match-pairs'] = { mount: mount, _buildLogPayload: buildLogPayload };
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { mount: mount, buildLogPayload: buildLogPayload };
  }
})();
