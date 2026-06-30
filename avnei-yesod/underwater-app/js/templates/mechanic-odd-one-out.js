// ============================================================================
// templates/mechanic-odd-one-out.js — "מי לא שייך?" (pick_odd_one · 54 שאלות)
// minigame-fit T4 · 30.6.2026 · לפי fit-report §5 NEW odd-one-out
//
// ההבדל מ-pick: אין יעד מוכרז. הילד.ה מאתר.ת את הפריט שאינו שייך לחבורה
// (לפי צליל/צורה/קטגוריה). ה"נכון" = היוצא-דופן (is_correct:true). שאר הפריטים =
// "הרוב התקין"; ה-epa שלהם מתאר *למה הילד.ה אולי טעה.תה לחשוב שהם היוצא-דופן*.
//
// config:
//   mount(root, {
//     items: [ { label_he, mode:'text'|'audio'|'image', audio_key, image_src,
//                is_correct:bool /* =היוצא-דופן */, epa:{what,where,task}|null } ],
//     promptLine, target_letter, primary_island_id, secondary_island_ids,
//     rama_task_alignment, peima_target, interaction, questId, item_id, theme,
//     onUnitWon, onComplete
//   })
//
// משתמש ב-class של mcq (.mcq-options/.mcq-option) כדי שכל התחפושות (theme-*) יחולו.
// חוזה EPA זהה ל-mcq: טעות → failure/task/where מתוך epa של הפריט שנלחץ; נכון → ללא.
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
    if (typeof window !== 'undefined' && window.AvneiNoni) {
      try { window.AvneiNoni.setState(state); } catch (e) {}
    }
  }
  function playKey(key) {
    if (key && typeof window !== 'undefined' && window.AvneiAudio) {
      try { window.AvneiAudio.play(key); } catch (e) {}
    }
  }

  function buildLogPayload(opts, item, ctx) {
    var isCorrect = !!(item && item.is_correct);
    var epa = (!isCorrect && item && item.epa) ? item.epa : null;
    return {
      activity_type:        'odd-one-out',
      activity_variant:     opts.interaction || 'pick_odd_one',
      item_id:              opts.item_id || opts.questId || null,
      target_letter:        opts.target_letter || null,
      is_correct:           isCorrect,
      failure_type:         epa ? (epa.what || null)  : null,
      letter_position:      epa ? (epa.where || null) : null,
      task_type:            epa ? (epa.task || null)  : null,
      primary_island_id:    (typeof opts.primary_island_id === 'number') ? opts.primary_island_id : undefined,
      secondary_island_ids: Array.isArray(opts.secondary_island_ids) ? opts.secondary_island_ids : undefined,
      rama_task_alignment:  (typeof opts.rama_task_alignment === 'number') ? opts.rama_task_alignment : undefined,
      peima_target:         (typeof opts.peima_target === 'number') ? opts.peima_target : undefined,
      supportLevel:         1,
      attempts:             (ctx && ctx.attempts) || 1,
      response_time_ms:     isCorrect ? ((ctx && ctx.response_time_ms) || null) : null,
      hint_used:            !!(ctx && ctx.hint_used),
    };
  }

  function logResult(opts, item, ctx) {
    if (typeof window === 'undefined' || !window.AvneiEventLogger) return;
    try { window.AvneiEventLogger.logActivityResult(buildLogPayload(opts, item, ctx)); } catch (e) {}
  }

  function mount(root, opts) {
    opts = opts || {};
    var items = Array.isArray(opts.items) ? opts.items.slice() : [];
    if (!items.length) return { unmount: function () {} };

    var state = { attempts: 0, locked: false, startTime: Date.now(), hintTimer: null, audioActiveTile: null };

    root.innerHTML = '';
    root.classList.add('mechanic-mcq', 'mechanic-odd-one-out');
    if (opts.theme) root.classList.add('theme-' + opts.theme);

    if (opts.promptLine) {
      var p = document.createElement('div');
      p.className = 'mcq-stem-card mcq-stem-card--text';
      p.lang = 'he'; p.textContent = opts.promptLine;
      var sw = document.createElement('div'); sw.className = 'mcq-stem';
      sw.appendChild(p); root.appendChild(sw);
    }

    var field = document.createElement('div');
    field.className = 'mcq-options';
    field.setAttribute('role', 'radiogroup');
    field.setAttribute('aria-label', opts.promptLine || 'מִי לֹא שַׁיָּךְ');
    root.appendChild(field);

    var feedback = document.createElement('div');
    feedback.className = 'mcq-feedback'; feedback.setAttribute('aria-live', 'polite');
    root.appendChild(feedback);

    var tiles = [];
    function oddTiles() { return tiles.filter(function (t) { return t.dataset.correct === '1'; }); }

    shuffle(items).forEach(function (item) {
      var tile = document.createElement('button');
      tile.type = 'button';
      tile.className = 'mcq-option mcq-option--' + (item.mode || 'text');
      tile.setAttribute('role', 'radio');
      tile.setAttribute('aria-checked', 'false');
      tile.dataset.correct = item.is_correct ? '1' : '0';

      if (item.mode === 'image') {
        var img = document.createElement('img');
        img.className = 'mcq-option__img'; img.src = item.image_src || ''; img.alt = item.image_alt || item.label_he || '';
        tile.appendChild(img); tile.setAttribute('aria-label', img.alt || 'תְּמוּנָה');
      } else if (item.mode === 'audio') {
        var spk = document.createElement('span'); spk.className = 'mcq-option__spk'; spk.setAttribute('aria-hidden', 'true'); spk.textContent = '🔊';
        tile.appendChild(spk); tile.setAttribute('aria-label', 'אֶפְשָׁרוּת לְהַאֲזָנָה');
      } else {
        var span = document.createElement('span'); span.className = 'mcq-option__label'; span.lang = 'he'; span.textContent = item.label_he || '';
        tile.appendChild(span); tile.setAttribute('aria-label', item.label_he || '');
      }
      tile.addEventListener('click', function () { handleTap(tile, item); });
      field.appendChild(tile);
      tiles.push(tile);
    });

    noni('idle');
    state.hintTimer = setTimeout(function () {
      if (state.locked) return;
      noni('hint');
      oddTiles().forEach(function (t) { t.classList.add('hint-glow'); });
    }, 9000);

    function handleTap(tile, item) {
      if (state.locked || tile.classList.contains('picked')) return;
      // מצב audio: הקשה ראשונה = השמעה; הקשה שנייה על אותו אריח = בחירה.
      if (item.mode === 'audio' && state.audioActiveTile !== tile) {
        if (state.audioActiveTile) state.audioActiveTile.classList.remove('mcq-option--listening');
        state.audioActiveTile = tile; tile.classList.add('mcq-option--listening');
        playKey(item.audio_key);
        return;
      }
      if (state.hintTimer) { clearTimeout(state.hintTimer); state.hintTimer = null; }
      state.attempts++;
      var isCorrect = !!item.is_correct;
      logResult(opts, item, { attempts: state.attempts, response_time_ms: Date.now() - state.startTime, hint_used: state.attempts > 1 });
      tile.setAttribute('aria-checked', 'true');

      if (isCorrect) {
        state.locked = true;
        tile.classList.add('picked'); tile.classList.remove('mcq-option--listening');
        noni('cheer');
        feedback.textContent = 'יֵשׁ! זֶה לֹא שַׁיָּךְ.'; feedback.className = 'mcq-feedback mcq-feedback--ok';
        if (typeof opts.onUnitWon === 'function') try { opts.onUnitWon(0); } catch (e) {}
        setTimeout(function () { if (typeof opts.onComplete === 'function') try { opts.onComplete(); } catch (e) {} }, 1100);
      } else {
        tile.setAttribute('aria-checked', 'false');
        tile.classList.add('wrong-sway');
        setTimeout(function () { tile.classList.remove('wrong-sway'); }, 700);
        if (state.attempts >= 2) {
          noni('hint');
          oddTiles().forEach(function (t) { t.classList.add('hint-glow'); });
        }
      }
    }

    return {
      unmount: function () {
        if (state.hintTimer) clearTimeout(state.hintTimer);
        root.innerHTML = '';
        root.classList.remove('mechanic-mcq', 'mechanic-odd-one-out');
        if (opts.theme) root.classList.remove('theme-' + opts.theme);
      },
    };
  }

  if (typeof window !== 'undefined') {
    window.AvneiMechanics = window.AvneiMechanics || {};
    window.AvneiMechanics['odd-one-out'] = { mount: mount, _buildLogPayload: buildLogPayload };
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { mount: mount, buildLogPayload: buildLogPayload };
  }
})();
