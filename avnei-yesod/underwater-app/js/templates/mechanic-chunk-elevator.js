// ============================================================================
// templates/mechanic-chunk-elevator.js — "מַעֲלִית הַצְּ׳אנְקִים" (אי 7)
// לְגוּנַת הַזְּרָמִים · דקודינג מילים ארוכות דרך צ׳אנקים
//
// מכניקה: מילה ארוכה מפורקת ל-3 צ׳אנקים (הברות). המילה מוצגת גלויה למעלה עם
// חריצים ריקים (·). מגדל אלמוגים בן 3 קומות עומד לצד המילה. הילד.ה מקיש.ה על
// הצ׳אנק הבא לפי הסדר (מימין לשמאל — כיוון הקריאה); בהצלחה הצ׳אנק "עולה במעלית"
// לקומה שלו, הקומה נדלקת והצ׳אנק נקרא בקול. כשכל 3 הקומות דולקות — המגדל קורא
// את המילה כולה ברצף, ואז עוברים למילה הבאה.
//
// למה כך (ולא drag): מצב-המטרה של mechanic-word-build עבר מ-drag ל-tap
// (פישוט מיטל 6.7.2026) כי tap אמין יותר למגע בכיתה א'. אותו עיקרון כאן.
//
// חוקי עולם:
//   • טקסט ילד מנוקד מלא, לשון רבים, Heebo. ב/כ/פ בראש צ׳אנק = דגש קל (בַּ=/ba/).
//   • אודיו: MP3 מוקלט מראש בלבד. הנחיה פעם אחת ב-mount; אחרי צ׳אנק נכון —
//     קול הצ׳אנק (חלק מהדקודינג), ובסיום המילה — המילה כולה. אין Web Speech.
//   • הדף עובד גם בלי אודיו (הצ׳אנקים גלויים כטקסט; פידבק ויזואלי).
//   • logging: onWordComplete(word, {attempts}) — הדף מדווח primary_island_id=7.
//
// opts:
//   words        — [{ text, chunks:[str,...], wordAudioKey, chunkAudioKeys:[str,...] }]
//   introKey     — מפתח MP3 הנחיה (מושמע פעם אחת עם המילה הראשונה)
//   distractors  — כמה צ׳אנקי-הסחה להוסיף למגש (default 0 — המילה גלויה, אין ניחוש)
//   onWordComplete(text, {attempts}) — נקרא בכל השלמת מילה (ל-logging BKT)
//   onAllComplete()                  — נקרא כשכל המילים הושלמו
// ============================================================================

(function () {
  'use strict';

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function nfc(s) { return (s && s.normalize) ? s.normalize('NFC') : s; }

  function playKey(key) {
    if (!key || typeof window === 'undefined' || !window.AvneiAudio) return;
    try { window.AvneiAudio.play(key); } catch (e) {}
  }

  function mount(root, opts) {
    const words = (opts.words || []).slice();
    const distractorCount = (opts.distractors == null) ? 0 : opts.distractors;

    root.innerHTML = '';
    root.classList.add('mechanic-chunk-elevator');

    // --- prompt ---
    const prompt = document.createElement('div');
    prompt.className = 'chunk-prompt';
    prompt.textContent = 'קִרְאוּ אֶת הַמִּלָּה חֵלֶק־חֵלֶק — מִיָּמִין לִשְׂמֹאל.';
    root.appendChild(prompt);

    // --- stage: tower (right) + word target with slots ---
    const stage = document.createElement('div');
    stage.className = 'chunk-stage';
    root.appendChild(stage);

    const tower = document.createElement('div');
    tower.className = 'chunk-tower';
    tower.setAttribute('aria-hidden', 'true');
    stage.appendChild(tower);

    const wordCol = document.createElement('div');
    wordCol.className = 'chunk-word-col';
    stage.appendChild(wordCol);

    const targetEl = document.createElement('div');
    targetEl.className = 'chunk-word-target';
    wordCol.appendChild(targetEl);

    const hearBtn = document.createElement('button');
    hearBtn.type = 'button';
    hearBtn.className = 'chunk-hear-btn';
    hearBtn.innerHTML = '<span aria-hidden="true">🔊</span> הַקְשִׁיבוּ לַמִּלָּה';
    wordCol.appendChild(hearBtn);

    // --- tray of chunk tiles ---
    const tray = document.createElement('div');
    tray.className = 'chunk-tray';
    tray.setAttribute('aria-label', 'חלקי המילה');
    root.appendChild(tray);

    // --- progress ---
    const progressEl = document.createElement('div');
    progressEl.className = 'chunk-progress';
    root.appendChild(progressEl);

    let wordIdx = 0;
    let chunks = [];
    let nextIdx = 0;
    let attempts = 0;
    let busy = false;
    let done = false;

    hearBtn.addEventListener('click', function () {
      if (done) return;
      playKey(words[wordIdx].wordAudioKey);
    });

    function renderTarget() {
      targetEl.innerHTML = '';
      chunks.forEach(function (c, i) {
        const span = document.createElement('span');
        if (i < nextIdx) {
          span.className = 'chunk-piece filled';
          span.textContent = c;
        } else {
          span.className = 'chunk-piece slot';
          span.textContent = '·';
        }
        targetEl.appendChild(span);
      });
    }

    function renderTower(justLitF) {
      tower.innerHTML = '';
      // הקומות נבנות מלמעלה כלפי מטה בתצוגה, אך נדלקות מלמטה למעלה:
      // קומה תחתונה (f=0) = צ׳אנק ראשון.
      for (let f = chunks.length - 1; f >= 0; f--) {
        const floor = document.createElement('div');
        let cls = 'tower-floor' + (f < nextIdx ? ' lit' : '');
        if (f === justLitF) cls += ' just-lit';
        floor.className = cls;
        floor.textContent = f < nextIdx ? chunks[f] : '';
        tower.appendChild(floor);
      }
      const base = document.createElement('div');
      base.className = 'tower-base';
      base.textContent = '🪸';
      tower.appendChild(base);
    }

    function makeTiles() {
      // האריחים = הצ׳אנקים של המילה (מעורבבים). המילה גלויה → אין צורך במסיחים,
      // אבל distractors>0 יוסיף צ׳אנקים ממילים אחרות (לשלב אתגר עתידי).
      const tiles = chunks.map(function (c, i) {
        return { display: c, orderIdx: i };
      });
      if (distractorCount > 0) {
        const used = {};
        chunks.forEach(function (c) { used[nfc(c)] = true; });
        const pool = [];
        words.forEach(function (w, wi) {
          if (wi === wordIdx) return;
          (w.chunks || []).forEach(function (c) {
            if (!used[nfc(c)]) pool.push({ display: c, orderIdx: -1 });
          });
        });
        shuffle(pool).slice(0, distractorCount).forEach(function (d) { tiles.push(d); });
      }
      return shuffle(tiles);
    }

    function renderTray() {
      tray.innerHTML = '';
      makeTiles().forEach(function (t) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'chunk-tile';
        btn.textContent = t.display;
        btn.addEventListener('click', function () {
          if (done || busy || btn.disabled) return;
          const expected = chunks[nextIdx];
          if (expected != null && nfc(t.display) === nfc(expected)) {
            btn.disabled = true;
            btn.classList.add('used');
            const chunkIdx = nextIdx;
            nextIdx++;
            renderTarget();
            renderTower(chunkIdx);   // מדגיש את הקומה שזה עתה נדלקה
            // צליל הצ׳אנק — חלק מהדקודינג (לא "פידבק אודיו" של תשובה נכונה)
            const keys = words[wordIdx].chunkAudioKeys || [];
            playKey(keys[chunkIdx]);
            if (nextIdx >= chunks.length) wordComplete();
          } else {
            attempts++;
            btn.classList.remove('shake'); void btn.offsetWidth;
            btn.classList.add('shake');
          }
        });
        tray.appendChild(btn);
      });
    }

    function wordComplete() {
      busy = true;
      targetEl.classList.add('celebrate');
      tower.classList.add('complete');
      // הפרס: המילה כולה נשמעת פעם אחת ברצף
      setTimeout(function () { playKey(words[wordIdx].wordAudioKey); }, 450);
      if (typeof opts.onWordComplete === 'function') {
        try { opts.onWordComplete(words[wordIdx].text, { attempts: attempts }); } catch (e) {}
      }
      setTimeout(function () {
        targetEl.classList.remove('celebrate');
        tower.classList.remove('complete');
        wordIdx++;
        busy = false;
        if (wordIdx >= words.length) {
          finishAll();
        } else {
          startWord();
        }
      }, 2200);
    }

    function finishAll() {
      done = true;
      prompt.textContent = 'כֹּל הַמִּגְדָּלִים נִדְלְקוּ — מְצֻיָּן!';
      stage.innerHTML = '';
      const trophy = document.createElement('div');
      trophy.className = 'chunk-word-target celebrate';
      trophy.textContent = '🎉';
      stage.appendChild(trophy);
      tray.innerHTML = '';
      progressEl.textContent = '';
      const again = document.createElement('button');
      again.type = 'button';
      again.className = 'chunk-hear-btn';
      again.textContent = '↻ עוֹד פַּעַם';
      again.addEventListener('click', function () { location.reload(); });
      tray.appendChild(again);
      if (typeof opts.onAllComplete === 'function') { try { opts.onAllComplete(); } catch (e) {} }
    }

    function startWord() {
      const w = words[wordIdx];
      chunks = (w.chunks || []).slice();
      nextIdx = 0;
      attempts = 0;
      targetEl.textContent = '';
      renderTarget();
      renderTower();
      renderTray();
      progressEl.textContent = 'מִלָּה ' + (wordIdx + 1) + ' מִתּוֹךְ ' + words.length;
      // הנחיה קולית (רק במילה הראשונה) ואז המילה — פעם אחת ב-mount.
      if (wordIdx === 0 && opts.introKey && window.AvneiAudio && window.AvneiAudio.playSequence) {
        window.AvneiAudio.playSequence([opts.introKey, w.wordAudioKey], 600);
      } else {
        playKey(w.wordAudioKey);
      }
    }

    startWord();

    return {
      unmount: function () {
        root.innerHTML = '';
        root.classList.remove('mechanic-chunk-elevator');
      },
    };
  }

  window.AvneiMechanics = window.AvneiMechanics || {};
  window.AvneiMechanics['chunk-elevator'] = { mount: mount };
})();
