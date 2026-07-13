/* ============================================================
   מישמיש — measured.js  →  window.MishmishMeasured
   ------------------------------------------------------------
   מכונת-המצבים של פריט נמדד. חוזה נעול:
     · שמיעתי-קודם — האזנה לפני שהאריחים נפתחים.
     · רק הניסיון הראשון נמדד; אחרי טעות = מצב-למידה (לא נמדד).
     · בלי אדום/ירוק — טעות = הזמנה להאזין שוב (צהוב + אוזן).
     · רמז = קול + דמות; טקסט ערבי מגודר עד אימות.
   מצבים: introPlaying → awaitingAnswer → (correct→complete)
                                        ↘ (incorrect → hint → …)
   מבוסס על lumi/app/js/mechanics/_measured-core.js.
   ============================================================ */
window.MishmishMeasured = (function () {
  var A = window.MishmishAudio;

  function mount(item, ctx) {
    // ctx: { mishmish, bubbleHe, listen, tiles, scaffold, instr }  (DOM refs)
    //      onMeasured(evt), onDone()
    var st = { phase: 'loading', measuredDone: false, done: false, hintStep: 0 };

    function setMishmish(mood) {
      ctx.mishmish.src = '../assets/characters/mishmish/mishmish-' + mood + '.png';
      ctx.mishmish.classList.toggle('celebrate', mood === 'celebrate');
    }

    // בניית האריחים מהאופציות (סדר קבוע — לא לערבב מחדש; מוגדר בבנק)
    function renderTiles() {
      ctx.tiles.innerHTML = '';
      item.options.forEach(function (opt) {
        var b = document.createElement('button');
        b.className = 'tile';
        b.type = 'button';
        b.setAttribute('aria-disabled', 'true');   // נעול עד סוף ההאזנה
        b.innerHTML =
          '<img src="../assets/items/food/' + opt.img + '.png" alt="">' +
          '<span class="cap">' + opt.cap + '</span>';
        b.addEventListener('click', function () { onTile(b, opt); });
        ctx.tiles.appendChild(b);
      });
    }
    function enableTiles(on) {
      Array.prototype.forEach.call(ctx.tiles.children, function (b) {
        b.setAttribute('aria-disabled', on ? 'false' : 'true');
      });
    }
    function tileFor(pred) {
      return Array.prototype.filter.call(ctx.tiles.children, function (b, i) { return pred(item.options[i], i); })[0];
    }

    // ----- אודיו-יעד (עברית) -----
    function playTarget(slow) {
      ctx.listen.classList.add('playing');
      return A.hebrew(item.prompt.audio_he || item.prompt.he, {
        key: item.id, slow: slow, statusEl: ctx.listen
      }).then(function () { ctx.listen.classList.remove('playing'); });
    }

    // ----- מצבים -----
    function introPlaying() {
      st.phase = 'introPlaying';
      setMishmish('speaking');
      ctx.bubbleHe.textContent = item.prompt.he;
      enableTiles(false);
      playTarget(false).then(awaitingAnswer, awaitingAnswer);  // גם בשגיאת-אודיו — פותחים
    }
    function awaitingAnswer() {
      st.phase = 'awaitingAnswer';
      setMishmish('listening');
      enableTiles(true);
    }

    function onTile(btn, opt) {
      if (btn.getAttribute('aria-disabled') === 'true') return;

      // מדידה — ניסיון ראשון בלבד
      if (!st.measuredDone) {
        st.measuredDone = true;
        ctx.onMeasured && ctx.onMeasured({
          pattern: ctx.pattern, target: item.target, dimension: item.dimension,
          firstTry: true, correct: !!opt.correct, pb_focus: !!item.pb_focus
        });
        if (opt.correct) return commitCorrect(btn);
        return enterLearning(btn);         // טעות בניסיון-ראשון
      }
      // אחרי מצב-למידה: תגובה לא-נמדדת
      if (opt.correct) return commitCorrect(btn);
      return nudgeRetry(btn);
    }

    function commitCorrect(btn) {
      st.phase = 'correct';
      enableTiles(false);
      clearMarks();
      btn.classList.add('correct');
      setMishmish('celebrate');
      // בלי "יופי" — שבח קולי יגיע כקליפ מוקלט (מצוין/מעולה). כרגע חזותי בלבד.
      window.setTimeout(function () { setMishmish('happy'); complete(); }, 900);
    }

    // טעות ראשונה → מצב-למידה (לא נמדד): מישמיש מתבלבל בעדינות, מזמין להאזין שוב
    function enterLearning(btn) {
      st.phase = 'incorrect';
      btn.classList.add('retry');
      setMishmish('confused-soft');
      window.setTimeout(function () { hint(); }, 700);
    }

    function nudgeRetry(btn) {
      btn.classList.add('retry');
      window.setTimeout(function () { btn.classList.remove('retry'); }, 900);
      hint();
    }

    // סולם-רמז: קול+דמות. שלב 1 = השמעה חוזרת. שלב 2 = הצבעה על הנכון.
    function hint() {
      st.phase = 'hint';
      st.hintStep++;
      setMishmish('hint');
      // פיגום עמית מופיע (טקסט ערבי מגודר; מוצג רק אם אושר)
      if (ctx.scaffold) ctx.scaffold.hidden = false;
      playTarget(true).then(function () {
        if (st.hintStep >= 2) {
          var t = tileFor(function (o) { return o.correct; });
          if (t) { t.classList.add('selected'); }
        }
        setMishmish('listening');
      }, function () { setMishmish('listening'); });
    }

    function clearMarks() {
      Array.prototype.forEach.call(ctx.tiles.children, function (b) {
        b.classList.remove('retry', 'selected');
      });
    }

    function complete() {
      if (st.done) return;
      st.done = true; st.phase = 'complete';
      ctx.onDone && ctx.onDone();
    }

    // ----- אתחול -----
    renderTiles();
    setMishmish('idle');
    if (ctx.scaffold) ctx.scaffold.hidden = true;
    window.setTimeout(introPlaying, 250);

    // בקר חיצוני לשורת שפת-הישרדות
    return {
      replay: function (slow) { setMishmish('speaking'); playTarget(slow).then(awaitingAnswer, awaitingAnswer); },
      hint: function () { hint(); },
      phase: function () { return st.phase; }
    };
  }

  return { mount: mount };
})();
