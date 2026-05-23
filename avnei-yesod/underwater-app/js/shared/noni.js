// ============================================================
// shared/noni.js — מצבי דמות נוני
// idle | help | hint | cheer
// חולץ מ-stage-3.html v0.1 (23.5.2026)
// ============================================================

window.AvneiNoni = (function() {

  function setState(state) {
    const noni = document.getElementById('noniImg');
    if (!noni) return;
    noni.classList.remove('noni-helping', 'noni-hint', 'noni-cheering');
    if (state === 'help')  noni.classList.add('noni-helping');
    else if (state === 'hint')  noni.classList.add('noni-hint');
    else if (state === 'cheer') noni.classList.add('noni-cheering');
  }

  function ready() {
    const noni = document.getElementById('noniImg');
    if (noni) noni.classList.add('ready');
  }

  return { setState, ready };
})();
