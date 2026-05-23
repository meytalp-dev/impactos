// ============================================================
// shared/shell.js — קונכייה+פנינה אינטראקטיבית (SVG + slot)
// בנוי בהשראת הויזואל של ChatGPT (23.5.2026):
//   קונכייה צבעונית בתחתית + פנינה לבנה־זוהרת למעלה + תוכן בתוך הפנינה
// תוכן יכול להיות: אות עברית, תמונה, או טקסט קצר.
// 3 גוונים מסתובבים: אפרסק/מינט/לבנדר.
// ============================================================

window.AvneiShell = (function() {

  const COLORS = ['peach', 'mint', 'lavender'];

  // בונה את ה-SVG של קונכייה + פנינה. ה-content נכנס מעל ב-HTML.
  // (לא בתוך ה-SVG עצמו — קל יותר לעטוף עברית/תמונות)
  function buildSvg(color) {
    return `
      <svg class="shell-svg" viewBox="0 0 220 220" aria-hidden="true">
        <defs>
          <radialGradient id="shellGrad-${color}" cx="50%" cy="100%" r="80%">
            <stop offset="0%"  stop-color="var(--shell-${color}-bottom)"/>
            <stop offset="100%" stop-color="var(--shell-${color}-top)"/>
          </radialGradient>
          <radialGradient id="pearlGrad-${color}" cx="35%" cy="28%" r="75%">
            <stop offset="0%"  stop-color="#FFFFFF" stop-opacity="1"/>
            <stop offset="55%" stop-color="#FFFFFF" stop-opacity="0.95"/>
            <stop offset="100%" stop-color="var(--pearl-shadow-${color})" stop-opacity="0.9"/>
          </radialGradient>
        </defs>

        <!-- בסיס הקונכייה — צורת מניפה רחבה -->
        <path d="M 14 132
                 Q 22 196 110 210
                 Q 198 196 206 132
                 Q 196 128 184 134
                 Q 170 128 158 138
                 Q 144 128 132 140
                 Q 116 126 110 144
                 Q 104 126 88 140
                 Q 76 128 62 138
                 Q 50 128 36 134
                 Q 24 128 14 132 Z"
              fill="url(#shellGrad-${color})"
              stroke="rgba(255,255,255,0.85)" stroke-width="2"/>

        <!-- צלעות הקונכייה — מעדנות עומק -->
        <g stroke="rgba(255,255,255,0.55)" stroke-width="2" fill="none" stroke-linecap="round">
          <path d="M 110 210 Q 70 178 36 134"/>
          <path d="M 110 210 Q 88 175 62 138"/>
          <path d="M 110 210 Q 100 174 88 140"/>
          <path d="M 110 210 Q 110 174 110 144"/>
          <path d="M 110 210 Q 120 174 132 140"/>
          <path d="M 110 210 Q 132 175 158 138"/>
          <path d="M 110 210 Q 150 178 184 134"/>
        </g>

        <!-- פנינה — מעל הקונכייה, נשענת על השפה -->
        <circle cx="110" cy="100" r="76"
                fill="url(#pearlGrad-${color})"
                stroke="rgba(255,255,255,0.95)" stroke-width="3"/>

        <!-- נצנוץ קטן על הפנינה -->
        <ellipse cx="86" cy="78" rx="18" ry="10"
                 fill="#FFFFFF" opacity="0.55"/>
        <circle cx="74" cy="68" r="4" fill="#FFFFFF" opacity="0.85"/>
      </svg>
    `;
  }

  // יוצר אלמנט כפתור עם קונכייה + slot לתוכן בתוך הפנינה
  // opts: { color: 'peach'|'mint'|'lavender'|null, className: extra, ariaLabel, onClick, dataset: {} }
  // אם color לא מוגדר — נבחר אוטומטית לפי index שמועבר
  function create(opts) {
    const color = opts.color || COLORS[(opts.index || 0) % COLORS.length];
    const btn = document.createElement('button');
    btn.className = 'shell-option ' + (opts.className || '');
    btn.dataset.shellColor = color;
    if (opts.ariaLabel) btn.setAttribute('aria-label', opts.ariaLabel);
    if (opts.dataset) {
      Object.keys(opts.dataset).forEach(k => {
        btn.dataset[k] = opts.dataset[k];
      });
    }

    btn.innerHTML = `
      ${buildSvg(color)}
      <div class="shell-content"></div>
    `;

    if (opts.onClick) btn.addEventListener('click', opts.onClick);

    return btn;
  }

  // הזרקת תוכן לתוך הפנינה (אות / תמונה / HTML)
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

  // קיצור: שמה אות עברית בתוך הפנינה
  function withLetter(opts) {
    const shell = create(opts);
    setContent(shell, `<span class="shell-letter">${opts.letter}</span>`);
    return shell;
  }

  // קיצור: שמה תמונה בתוך הפנינה (sound-match)
  function withImage(opts) {
    const shell = create(opts);
    const fallback = opts.fallback || '?';
    setContent(shell, `
      <img class="shell-image" src="${opts.src}" alt="${opts.alt || ''}"
           onerror="this.outerHTML='<span class=&quot;shell-fallback&quot;>${fallback}</span>'">
    `);
    return shell;
  }

  return { create, setContent, withLetter, withImage, COLORS };
})();
