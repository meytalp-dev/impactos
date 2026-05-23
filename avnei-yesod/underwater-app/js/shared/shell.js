// ============================================================
// shared/shell.js — בועה גלאסי אינטראקטיבית
//
// היסטוריה:
//  v1 (23.5.2026 בוקר): קונכייה+פנינה SVG בהשראת ChatGPT
//  v2 (23.5.2026 ערב):  הוחלף לבועה גלאסי לפי הסטנדרט שאומת ב-onboarding.html
//                       (feedback_avnei_yesod_visual_standard)
//
// הפונקציה שומרת על אותה API:
//   AvneiShell.create({ index, ariaLabel, dataset })           → button.bubble.shell-option
//   AvneiShell.withImage({ src, alt, fallback, ... })          → bubble עם תמונה 70% ממורכזת
//   AvneiShell.withLetter({ letter, ... })                     → bubble עם אות 72px
//   AvneiShell.setContent(el, content)
//
// ה-className הוא `bubble shell-option` — `.bubble` נותן את הסטיילינג,
// `.shell-option` נשאר כ-alias כדי לא לשבור סלקטורים קיימים ב-activities וב-CSS.
// ============================================================

window.AvneiShell = (function() {

  function create(opts) {
    const btn = document.createElement('button');
    btn.className = 'bubble shell-option ' + (opts.className || '');
    btn.type = 'button';
    if (opts.ariaLabel) btn.setAttribute('aria-label', opts.ariaLabel);
    if (opts.dataset) {
      Object.keys(opts.dataset).forEach(k => {
        btn.dataset[k] = opts.dataset[k];
      });
    }

    const slot = document.createElement('div');
    slot.className = 'shell-content';
    btn.appendChild(slot);

    if (opts.onClick) btn.addEventListener('click', opts.onClick);

    return btn;
  }

  function setContent(shellEl, content) {
    const slot = shellEl.querySelector('.shell-content');
    if (!slot) return;
    if (content instanceof HTMLElement) {
      slot.innerHTML = '';
      slot.appendChild(content);
    } else {
      slot.innerHTML = content;
    }
  }

  function withLetter(opts) {
    const shell = create(opts);
    setContent(shell, `<span class="shell-letter">${opts.letter}</span>`);
    return shell;
  }

  function withImage(opts) {
    const shell = create(opts);
    const fallback = opts.fallback || '?';
    setContent(shell, `
      <img class="shell-image" src="${opts.src}" alt="${opts.alt || ''}"
           onerror="this.outerHTML='<span class=&quot;shell-fallback&quot;>${fallback}</span>'">
    `);
    return shell;
  }

  return { create, setContent, withLetter, withImage };
})();
