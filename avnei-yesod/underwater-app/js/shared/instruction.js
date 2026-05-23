// ============================================================
// shared/instruction.js — בועת הוראה (Speech bubble) משותפת
// פיל אופקי באפרסק/קורל עם טקסט וכפתור אודיו צמוד.
// יושב למעלה בתוך game-area ולא בתוך activity ספציפי.
// ============================================================

window.AvneiInstruction = (function() {

  let _el = null;

  // יוצר את הבועה. opts: { text, onAudio }
  function mount(rootEl, opts) {
    if (_el) unmount();
    _el = document.createElement('div');
    _el.className = 'instruction-bubble';
    _el.innerHTML = `
      <button class="instruction-audio-btn" aria-label="השמע שוב">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M5 9v6h4l5 4V5L9 9H5z" fill="currentColor"/>
          <path d="M16 8a4 4 0 010 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
        </svg>
      </button>
      <span class="instruction-text"></span>
    `;
    setText(opts.text || '');
    if (opts.onAudio) {
      _el.querySelector('.instruction-audio-btn').addEventListener('click', opts.onAudio);
    }
    // הזרקה — תמיד בתחילת ה-root כדי שיהיה למעלה
    rootEl.insertBefore(_el, rootEl.firstChild);
    requestAnimationFrame(() => _el.classList.add('show'));
    return _el;
  }

  function setText(txt) {
    if (!_el) return;
    const t = _el.querySelector('.instruction-text');
    if (t) t.textContent = txt;
  }

  function unmount() {
    if (_el && _el.parentNode) _el.parentNode.removeChild(_el);
    _el = null;
  }

  return { mount, setText, unmount };
})();
