// ============================================================
// shared/item-renderer.js — envelope → DOM
// English Chativa · grade 7
// ============================================================
//
// Renders a single practice item into a container DIV.
// Returns a controller with three methods used by student.html:
//   hasAnswer()     → bool       (Continue button should be enabled)
//   evaluate()      → { correct, feedback }
//   reveal(result)  → void       (paint correct/wrong styles)
//
// The renderer also accepts an onChange() callback that fires
// whenever the answer state changes (so the host can toggle the
// Continue button).
// ============================================================

window.ItemRenderer = (function() {

  // ---- helpers ---------------------------------------------------

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(k => {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k.startsWith('on') && typeof attrs[k] === 'function') {
          node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else if (attrs[k] === true) node.setAttribute(k, '');
        else if (attrs[k] !== false && attrs[k] != null) node.setAttribute(k, attrs[k]);
      });
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(c => {
        if (c == null || c === false) return;
        node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return node;
  }

  function speak(text) {
    if (window.AvneiAudio && typeof window.AvneiAudio.speak === 'function') {
      return window.AvneiAudio.speak(text);
    }
    return Promise.resolve();
  }

  function audioButton(label, onPlay) {
    const btn = el('button', {
      class: 'audio-btn',
      type: 'button',
      'aria-label': 'Play audio',
    }, [
      el('span', { html: `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polygon points="6 4 20 12 6 20 6 4" fill="currentColor"/>
        </svg>
      ` }),
      el('span', { text: label || 'Listen' }),
    ]);
    btn.addEventListener('click', () => {
      btn.setAttribute('data-playing', 'true');
      const done = () => btn.removeAttribute('data-playing');
      Promise.resolve(onPlay()).then(done, done);
    });
    return btn;
  }

  // ---- shared dispatchers ----------------------------------------

  function render(item, container, onChange) {
    container.innerHTML = '';
    const env = item && item.organization_layer && item.organization_layer.envelope;
    const map = {
      'tap-match': renderTapMatch,
      'listen-mcq': renderListenMcq,
      'listen-then-tap': renderListenMcq,
      'mcq': renderMcq,
      'fill-blank': renderFillBlank,
      'drag-build': renderDragBuild,
      'open-input': renderOpenInput,
      'story-sequence': renderUnsupported,
      'pair-interview': renderUnsupported,
    };
    const fn = map[env] || renderUnsupported;
    return fn(item, container, onChange || (() => {}));
  }

  // ---- 1. tap-match (Track 1) -----------------------------------

  function renderTapMatch(item, container, onChange) {
    return renderListenStyle(item, container, onChange, 'Listen and tap');
  }

  // ---- 2. listen-mcq (Track 1) ----------------------------------

  function renderListenMcq(item, container, onChange) {
    return renderListenStyle(item, container, onChange, 'Listen and tap');
  }

  // Shared body for tap-match + listen-mcq: audio is the source-of-truth,
  // options are taps. Answer is captured on first tap (Track 1 = no
  // "select then confirm" — direct revelation is the design).
  function renderListenStyle(item, container, onChange, defaultLabel) {
    const c = item.content || {};
    const opts = Array.isArray(c.options) ? c.options : [];
    let selectedIdx = -1;

    container.appendChild(el('p', { class: 'prompt', text: c.prompt_text || defaultLabel }));

    if (c.audio_text) {
      const btn = audioButton('Tap to listen', () => speak(c.audio_text));
      btn.classList.add('audio-btn--primary');
      const row = el('div', { class: 'prompt-meta' }, [btn]);
      container.appendChild(row);
      // No auto-play: most browsers silently block speechSynthesis.speak()
      // that is not in a direct user-gesture handler. The big Listen
      // button is the primary action for Track 1.
    }

    const cols = opts.length === 2 ? '2' : '1';
    const grid = el('div', { class: 'options', 'data-cols': cols, role: 'radiogroup' });
    const buttons = [];
    opts.forEach((opt, i) => {
      const b = el('button', {
        class: 'option',
        type: 'button',
        role: 'radio',
        'aria-checked': 'false',
        text: opt.text != null ? opt.text : (opt.label || ''),
      });
      b.addEventListener('click', () => {
        if (selectedIdx !== -1) return;
        selectedIdx = i;
        buttons.forEach(btn => btn.setAttribute('aria-checked', 'false'));
        b.setAttribute('aria-checked', 'true');
        b.setAttribute('data-state', 'selected');
        onChange();
      });
      buttons.push(b);
      grid.appendChild(b);
    });
    container.appendChild(grid);

    return {
      hasAnswer: () => selectedIdx >= 0,
      evaluate: () => ({
        correct: !!(opts[selectedIdx] && opts[selectedIdx].correct),
        feedback: opts[selectedIdx] && opts[selectedIdx].correct ? 'Correct!' : 'Try the next one.',
        selectedIdx,
      }),
      reveal: (result) => {
        buttons.forEach((b, i) => {
          if (opts[i] && opts[i].correct) {
            b.setAttribute('data-state', 'correct');
          } else if (i === selectedIdx && !result.correct) {
            b.setAttribute('data-state', 'wrong');
          } else {
            b.setAttribute('data-state', 'disabled');
          }
        });
      },
    };
  }

  // ---- 3. mcq (Track 2-3) ---------------------------------------

  function renderMcq(item, container, onChange) {
    const c = item.content || {};
    const opts = Array.isArray(c.options) ? c.options : [];
    const multi = c.multi_select === true;
    const selected = new Set();

    container.appendChild(el('p', { class: 'prompt', text: c.prompt_text || '' }));

    if (multi) {
      container.appendChild(el('p', { class: 'open-input-hint', text: 'Tap all that apply.' }));
    }

    const grid = el('div', { class: 'options', 'data-cols': opts.length === 2 ? '2' : '1' });
    const buttons = [];

    opts.forEach((opt, i) => {
      const b = el('button', {
        class: 'option',
        type: 'button',
        text: opt.text != null ? opt.text : '',
      });
      b.addEventListener('click', () => {
        if (multi) {
          if (selected.has(i)) {
            selected.delete(i);
            b.removeAttribute('data-state');
          } else {
            selected.add(i);
            b.setAttribute('data-state', 'selected');
          }
        } else {
          selected.clear();
          buttons.forEach(btn => btn.removeAttribute('data-state'));
          selected.add(i);
          b.setAttribute('data-state', 'selected');
        }
        onChange();
      });
      buttons.push(b);
      grid.appendChild(b);
    });
    container.appendChild(grid);

    return {
      hasAnswer: () => selected.size > 0,
      evaluate: () => {
        if (multi) {
          const correctIdx = opts
            .map((o, i) => o.correct ? i : -1)
            .filter(i => i >= 0);
          const selArr = [...selected].sort();
          const correctArr = correctIdx.sort();
          const sameSize = selArr.length === correctArr.length;
          const sameSet = sameSize && selArr.every((v, k) => v === correctArr[k]);
          return {
            correct: sameSet,
            feedback: sameSet ? 'Correct!' : 'Not quite.',
            selected: selArr,
          };
        }
        const idx = [...selected][0];
        return {
          correct: !!(opts[idx] && opts[idx].correct),
          feedback: opts[idx] && opts[idx].correct ? 'Correct!' : 'Not quite.',
          selectedIdx: idx,
        };
      },
      reveal: (result) => {
        buttons.forEach((b, i) => {
          const isCorrect = !!(opts[i] && opts[i].correct);
          const isSelected = selected.has(i);
          if (isCorrect) {
            b.setAttribute('data-state', 'correct');
          } else if (isSelected) {
            b.setAttribute('data-state', 'wrong');
          } else {
            b.setAttribute('data-state', 'disabled');
          }
        });
      },
    };
  }

  // ---- 4. fill-blank (Track 2-3) --------------------------------
  //
  // Schema: { prompt_text (with ___), options: [{text, correct}] }
  // For grade-7 bridge pack, the option `text` may be a *bundle*
  // such as "is, am" when there are multiple blanks. We treat each
  // option as a single tappable choice (the bundle string is the
  // visible label).

  function renderFillBlank(item, container, onChange) {
    const c = item.content || {};
    const opts = Array.isArray(c.options) ? c.options : [];
    let selectedIdx = -1;

    // Render the prompt with visible blanks.
    const promptHTML = (c.prompt_text || '').replace(
      /_{2,}/g,
      '<span class="blank" aria-hidden="true"></span>'
    );
    container.appendChild(el('p', { class: 'fill-blank-text', html: promptHTML }));

    const grid = el('div', { class: 'options', 'data-cols': '1' });
    const buttons = [];
    opts.forEach((opt, i) => {
      const b = el('button', {
        class: 'option',
        type: 'button',
        text: opt.text != null ? opt.text : '',
      });
      b.addEventListener('click', () => {
        selectedIdx = i;
        buttons.forEach(btn => btn.removeAttribute('data-state'));
        b.setAttribute('data-state', 'selected');
        onChange();
      });
      buttons.push(b);
      grid.appendChild(b);
    });
    container.appendChild(grid);

    return {
      hasAnswer: () => selectedIdx >= 0,
      evaluate: () => ({
        correct: !!(opts[selectedIdx] && opts[selectedIdx].correct),
        feedback: opts[selectedIdx] && opts[selectedIdx].correct ? 'Correct!' : 'Not quite.',
        selectedIdx,
      }),
      reveal: (result) => {
        buttons.forEach((b, i) => {
          if (opts[i] && opts[i].correct) {
            b.setAttribute('data-state', 'correct');
          } else if (i === selectedIdx && !result.correct) {
            b.setAttribute('data-state', 'wrong');
          } else {
            b.setAttribute('data-state', 'disabled');
          }
        });
      },
    };
  }

  // ---- 5. drag-build (Track 2) ----------------------------------
  //
  // Schema: { prompt_text, words_to_arrange: [], correct_order: [] }
  // Pointer-event based: tap a source pill to append it to the target;
  // tap a target pill to send it back. This avoids HTML5 drag-and-drop
  // touch limitations on tablets.

  function renderDragBuild(item, container, onChange) {
    const c = item.content || {};
    const source = Array.isArray(c.words_to_arrange) ? c.words_to_arrange.slice() : [];
    const correctOrder = Array.isArray(c.correct_order) ? c.correct_order.slice() : [];

    container.appendChild(el('p', { class: 'prompt', text: c.prompt_text || 'Build the sentence.' }));

    const target = el('div', { class: 'drag-target', 'aria-label': 'Sentence' });
    const placeholder = el('span', { class: 'open-input-hint', text: 'Tap the words below in order.' });
    target.appendChild(placeholder);

    const placement = []; // ordered list of source indices currently in target

    function syncTarget() {
      target.innerHTML = '';
      if (placement.length === 0) {
        target.appendChild(placeholder);
        return;
      }
      placement.forEach((srcIdx) => {
        const word = source[srcIdx];
        const pill = el('button', {
          class: 'word-pill',
          type: 'button',
          'data-in-target': 'true',
          text: word,
        });
        pill.addEventListener('click', () => {
          // remove this occurrence from target
          const at = placement.indexOf(srcIdx);
          if (at >= 0) placement.splice(at, 1);
          sourcePillStates[srcIdx].removeAttribute('data-placed');
          syncTarget();
          onChange();
        });
        target.appendChild(pill);
      });
    }
    container.appendChild(target);

    const sourceRow = el('div', { class: 'drag-source' });
    const sourcePillStates = [];
    source.forEach((word, i) => {
      const pill = el('button', {
        class: 'word-pill',
        type: 'button',
        text: word,
      });
      pill.addEventListener('click', () => {
        if (pill.getAttribute('data-placed') === 'true') return;
        pill.setAttribute('data-placed', 'true');
        placement.push(i);
        syncTarget();
        onChange();
      });
      sourcePillStates[i] = pill;
      sourceRow.appendChild(pill);
    });
    container.appendChild(sourceRow);

    return {
      hasAnswer: () => placement.length === source.length,
      evaluate: () => {
        const built = placement.map(i => source[i]);
        const ok = built.length === correctOrder.length &&
                   built.every((w, k) => w === correctOrder[k]);
        return {
          correct: ok,
          feedback: ok ? 'Correct!' : 'Not the right order.',
          built,
        };
      },
      reveal: (result) => {
        // Disable further edits and show colored target.
        target.style.borderStyle = 'solid';
        target.style.borderColor = result.correct
          ? 'var(--success)' : 'var(--error)';
        target.style.background = result.correct
          ? 'var(--success-soft)' : 'var(--error-soft)';
        Array.from(target.children).forEach(child => {
          child.setAttribute('data-in-target', 'true');
          child.style.pointerEvents = 'none';
        });
        sourcePillStates.forEach(p => { p.style.pointerEvents = 'none'; });
      },
    };
  }

  // ---- 6. open-input (Track 4) ----------------------------------
  //
  // Schema: { prompt_text, validation: {
  //   must_include?: [words],
  //   must_start_with?: string,
  //   min_words?: number, max_words?: number,
  //   min_sentences?: number,
  //   exclude?: [words],
  // } }

  function renderOpenInput(item, container, onChange) {
    const c = item.content || {};
    const v = c.validation || {};

    container.appendChild(el('p', { class: 'prompt', text: c.prompt_text || '' }));

    const ta = el('textarea', {
      class: 'open-input',
      placeholder: 'Type your answer in English…',
      rows: '4',
      autocapitalize: 'sentences',
      autocomplete: 'off',
      spellcheck: 'true',
      lang: 'en',
    });
    ta.addEventListener('input', onChange);
    container.appendChild(ta);

    // Hint summarizing the validation rules in friendly language.
    const hintParts = [];
    if (v.must_start_with) hintParts.push(`Start with "${v.must_start_with}".`);
    if (Array.isArray(v.must_include) && v.must_include.length) {
      hintParts.push(`Use ${v.must_include.map(w => `"${w}"`).join(', ')}.`);
    }
    if (v.min_words) hintParts.push(`At least ${v.min_words} words.`);
    if (v.min_sentences) hintParts.push(`At least ${v.min_sentences} sentences.`);
    if (hintParts.length) {
      container.appendChild(el('p', {
        class: 'open-input-hint',
        text: hintParts.join(' '),
      }));
    }

    function tokenize(text) {
      return (text || '').trim().split(/\s+/).filter(Boolean);
    }
    function sentences(text) {
      return (text || '').split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
    }

    return {
      hasAnswer: () => ta.value.trim().length > 0,
      evaluate: () => {
        const raw = ta.value.trim();
        const words = tokenize(raw);
        const lower = raw.toLowerCase();
        const reasons = [];

        if (v.must_start_with) {
          if (!lower.startsWith(v.must_start_with.toLowerCase())) {
            reasons.push(`Start with "${v.must_start_with}".`);
          }
        }
        if (Array.isArray(v.must_include)) {
          v.must_include.forEach(w => {
            const re = new RegExp(`\\b${w.toLowerCase()}\\b`);
            if (!re.test(lower)) reasons.push(`Use the word "${w}".`);
          });
        }
        if (v.min_words && words.length < v.min_words) {
          reasons.push(`Use at least ${v.min_words} words. (You wrote ${words.length}.)`);
        }
        if (v.max_words && words.length > v.max_words) {
          reasons.push(`Use at most ${v.max_words} words.`);
        }
        if (v.min_sentences && sentences(raw).length < v.min_sentences) {
          reasons.push(`Write at least ${v.min_sentences} sentences.`);
        }
        if (Array.isArray(v.exclude)) {
          v.exclude.forEach(w => {
            const re = new RegExp(`\\b${w.toLowerCase()}\\b`);
            if (re.test(lower)) reasons.push(`Try a different word than "${w}".`);
          });
        }
        return {
          correct: reasons.length === 0,
          feedback: reasons.length === 0 ? 'Nice work!' : reasons.join(' '),
          text: raw,
        };
      },
      reveal: (result) => {
        ta.disabled = true;
        ta.style.borderColor = result.correct
          ? 'var(--success)' : 'var(--error)';
        ta.style.background = result.correct
          ? 'var(--success-soft)' : 'var(--error-soft)';
      },
    };
  }

  // ---- fallback --------------------------------------------------

  function renderUnsupported(item, container, onChange) {
    const env = item && item.organization_layer && item.organization_layer.envelope;
    container.appendChild(el('p', { class: 'prompt', text: 'This question type is not available yet.' }));
    container.appendChild(el('p', {
      class: 'open-input-hint',
      text: `(envelope: ${env || 'unknown'})`,
    }));
    return {
      hasAnswer: () => true,           // let learner skip past it
      evaluate: () => ({ correct: false, feedback: 'Skipped (unsupported).' }),
      reveal: () => {},
    };
  }

  // ---- public surface -------------------------------------------

  return {
    render,
    renderTapMatch,
    renderListenMcq,
    renderMcq,
    renderFillBlank,
    renderDragBuild,
    renderOpenInput,
  };
})();
