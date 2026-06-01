/* ============================================================
   preview.js — Live preview pane (student-mode rendering)
   ------------------------------------------------------------
   Strategy: srcdoc iframe with self-contained mini-renderer.
   Avoids modifying existing stage-*.html files (other agents own them).
   Updates on draft change, debounced 400ms.
   ============================================================ */
(function () {
  'use strict';

  const HOST_ID = 'studioPreview';
  let host, viewport, controls, currentOrientation = 'portrait';
  let lastDraftJson = '';
  let debounceTimer = null;

  function init() {
    host = document.getElementById(HOST_ID);
    if (!host) return;
    renderShell();
    window.StudioState.subscribe(scheduleUpdate);
    scheduleUpdate();
  }

  function renderShell() {
    host.innerHTML = `
      <div class="preview-head">
        <div>
          <h3 class="preview-title">תצוגה מקדימה במצב תלמידה</h3>
          <div class="preview-title-sub">איך התרגיל ייראה לילדות בכיתה</div>
        </div>
        <div class="preview-controls">
          <button class="preview-ctrl-btn ${currentOrientation === 'portrait' ? 'is-active' : ''}" data-orient="portrait" type="button" title="מצב טאבלט (אנכי)">📱</button>
          <button class="preview-ctrl-btn ${currentOrientation === 'landscape' ? 'is-active' : ''}" data-orient="landscape" type="button" title="מצב טאבלט (אופקי)">📺</button>
          <button class="preview-ctrl-btn" id="previewRefresh" type="button" title="רענן">🔁</button>
        </div>
      </div>
      <div class="preview-viewport is-${currentOrientation}" id="previewViewport">
        <div class="preview-placeholder" id="previewPlaceholder">
          <div>
            <strong>תצוגה מקדימה</strong>
            תופיע כאן אחרי שתבחרי משחק ותתחילי למלא תוכן.
          </div>
        </div>
      </div>
    `;
    viewport = document.getElementById('previewViewport');

    host.querySelectorAll('[data-orient]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentOrientation = btn.getAttribute('data-orient');
        viewport.classList.remove('is-portrait', 'is-landscape');
        viewport.classList.add(`is-${currentOrientation}`);
        host.querySelectorAll('[data-orient]').forEach(b => b.classList.toggle('is-active', b === btn));
      });
    });
    const refresh = host.querySelector('#previewRefresh');
    if (refresh) refresh.addEventListener('click', () => { lastDraftJson = ''; scheduleUpdate(); });
  }

  function scheduleUpdate() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateNow, 400);
  }

  function updateNow() {
    const { draft } = window.StudioState.get();
    const json = JSON.stringify(draft);
    if (json === lastDraftJson) return;
    lastDraftJson = json;

    if (!draft.mechanic) {
      showPlaceholder('תופיע כאן אחרי שתבחרי משחק ותתחילי למלא תוכן.');
      return;
    }
    const html = renderStudentView(draft);
    setIframe(html);
  }

  function showPlaceholder(text) {
    viewport.innerHTML = `
      <div class="preview-placeholder">
        <div>
          <strong>תצוגה מקדימה</strong>
          ${text}
        </div>
      </div>
    `;
  }

  function setIframe(htmlDoc) {
    let iframe = viewport.querySelector('iframe.preview-iframe');
    if (!iframe) {
      viewport.innerHTML = '';
      iframe = document.createElement('iframe');
      iframe.className = 'preview-iframe';
      iframe.setAttribute('title', 'תצוגה מקדימה');
      iframe.setAttribute('sandbox', 'allow-same-origin');
      viewport.appendChild(iframe);
    }
    iframe.srcdoc = htmlDoc;
  }

  /* ============================================================
     Student-view renderer (mini)
     Self-contained HTML returned as iframe srcdoc.
     ============================================================ */
  function renderStudentView(draft) {
    const isl = window.AvneiStudioPipeline.getAvailableIslands()
      .find(x => x.id === draft.island_id) || { id: '?', name_he: '' };

    const body = renderMechanicBody(draft);
    const promptText = draft.prompt_text || defaultPrompt(draft);

    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<style>
  :root {
    --water-main: #A8E8FF; --water-soft: #8DDFFF; --water-deep: #63CFE5;
    --mint: #B8F2CF; --coral: #FFA98D; --gold: #FFE7A8;
    --text-deep: #1E3D47; --text-main: #26505C;
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0; height: 100%;
    font-family: 'Heebo', 'Rubik', 'Assistant', sans-serif;
    background: linear-gradient(180deg, #A8E8FF 0%, #73D9D1 100%);
    color: var(--text-deep);
    direction: rtl;
    overflow: hidden;
  }
  .stage {
    height: 100%; padding: 20px;
    display: flex; flex-direction: column;
    position: relative;
  }
  .stage-top {
    display: flex; justify-content: space-between; align-items: center;
    color: var(--text-deep); font-size: 13px; font-weight: 600;
    background: rgba(255,255,255,0.5);
    padding: 6px 12px; border-radius: 999px;
    margin-bottom: 14px;
  }
  .prompt {
    background: rgba(255,255,255,0.85);
    border-radius: 18px; padding: 12px 16px;
    text-align: center; font-size: 16px;
    color: var(--text-deep);
    box-shadow: 0 2px 8px rgba(30,61,71,0.10);
    margin-bottom: 14px;
    line-height: 1.5;
  }
  .prompt-target { font-weight: 800; font-size: 22px; }
  .stage-body {
    flex: 1; display: flex; align-items: center; justify-content: center;
    flex-wrap: wrap; gap: 10px;
    position: relative;
  }
  .bubble {
    width: clamp(54px, 12vw, 90px);
    aspect-ratio: 1;
    border-radius: 999px;
    background: radial-gradient(circle at 30% 25%, rgba(255,255,255,0.95), rgba(141,223,255,0.6));
    box-shadow: 0 4px 12px rgba(30,61,71,0.20);
    display: inline-flex; align-items: center; justify-content: center;
    font-size: clamp(28px, 7vw, 44px);
    font-weight: 800;
    color: var(--text-deep);
    border: 2px solid rgba(255,255,255,0.8);
  }
  .bubble.is-target {
    background: radial-gradient(circle at 30% 25%, rgba(255,231,168,0.95), rgba(255,200,80,0.7));
    box-shadow: 0 0 16px var(--gold);
  }
  .pick-grid {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
    width: 100%; max-width: 320px;
  }
  .pick-opt {
    background: rgba(255,255,255,0.9);
    border-radius: 16px; padding: 14px;
    font-size: 36px; font-weight: 800; text-align: center;
    color: var(--text-deep);
    box-shadow: 0 2px 8px rgba(30,61,71,0.10);
  }
  .pair-grid {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
    width: 100%; max-width: 320px;
  }
  .pair-card {
    background: rgba(255,255,255,0.9);
    border-radius: 12px; padding: 12px;
    text-align: center; font-size: 16px; font-weight: 700;
    color: var(--text-deep);
    box-shadow: 0 1px 4px rgba(30,61,71,0.08);
    min-height: 56px;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .sort-board {
    display: grid;
    grid-template-columns: repeat(var(--cols, 2), 1fr);
    gap: 8px; width: 100%;
  }
  .sort-bin {
    background: rgba(255,255,255,0.7);
    border: 2px dashed rgba(30,61,71,0.25);
    border-radius: 14px;
    padding: 12px;
    min-height: 100px;
    text-align: center;
  }
  .sort-bin-letter {
    font-size: 32px; font-weight: 800; color: var(--text-deep);
    margin-bottom: 6px;
  }
  .sort-bin-items {
    font-size: 13px; color: var(--text-main); line-height: 1.6;
  }
  .noni-dot {
    position: absolute; bottom: 12px; right: 12px;
    background: var(--gold); border-radius: 999px;
    padding: 6px 12px; font-size: 12px; font-weight: 700;
    color: var(--text-deep);
    box-shadow: 0 2px 6px rgba(30,61,71,0.15);
  }
  .empty-hint {
    font-size: 14px; color: var(--text-main);
    background: rgba(255,255,255,0.7);
    padding: 12px 16px; border-radius: 12px;
    text-align: center;
  }
</style>
</head>
<body>
<div class="stage">
  <div class="stage-top">
    <span>אִי ${isl.id} · ${isl.name_he}</span>
    <span>0 / ${expectedCount(draft)}</span>
  </div>
  <div class="prompt">${promptText}</div>
  <div class="stage-body">${body}</div>
  <div class="noni-dot">נוֹנִי</div>
</div>
</body>
</html>`;
  }

  function defaultPrompt(draft) {
    if (draft.mechanic === 'tap-all' && draft.letter) {
      return `הַקִּישׁוּ עַל כֹּל הָאוֹת <span class="prompt-target">${draft.letter}</span>`;
    }
    if (draft.mechanic === 'pick' && draft.letter) {
      return `אֵיזוֹ אוֹת זוֹ?`;
    }
    if (draft.mechanic === 'memory-pair') {
      return `מִצְאוּ אֶת הַזּוּגוֹת`;
    }
    if (draft.mechanic === 'sort-by-letter') {
      return `מַיְּנוּ לְפִי הָאוֹת הָרִאשׁוֹנָה`;
    }
    return 'תַּרְגִּיל';
  }

  function expectedCount(draft) {
    if (draft.mechanic === 'tap-all') return 5;
    if (draft.mechanic === 'pick') return 1;
    if (draft.mechanic === 'memory-pair') return (draft.custom_words || []).filter(p => p.a && p.b).length;
    if (draft.mechanic === 'sort-by-letter') {
      return (draft.sort_groups || []).reduce((acc, g) => acc + ((g.items || []).length), 0);
    }
    return 1;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function renderMechanicBody(draft) {
    if (draft.mechanic === 'tap-all') {
      if (!draft.letter && (!draft.distractors || !draft.distractors.length)) {
        return `<div class="empty-hint">בחרי אות יעד וכמה מסיחות כדי לראות בועות</div>`;
      }
      const letters = [];
      // Show target letter twice, mixed with distractors
      if (draft.letter) letters.push(draft.letter, draft.letter);
      (draft.distractors || []).forEach(d => letters.push(d));
      while (letters.length < 5 && draft.letter) letters.push(draft.letter);
      const shuffled = shuffle(letters).slice(0, 6);
      return shuffled.map(l => `
        <div class="bubble ${l === draft.letter ? 'is-target' : ''}">${l}</div>
      `).join('');
    }

    if (draft.mechanic === 'pick') {
      const opts = [];
      if (draft.letter) opts.push(draft.letter);
      (draft.distractors || []).slice(0, 3).forEach(d => opts.push(d));
      while (opts.length < 4) opts.push('?');
      return `
        <div class="pick-grid">
          ${shuffle(opts).map(o => `<div class="pick-opt">${o}</div>`).join('')}
        </div>
      `;
    }

    if (draft.mechanic === 'memory-pair') {
      const pairs = (draft.custom_words || []).filter(p => p.a || p.b);
      if (!pairs.length) {
        return `<div class="empty-hint">מלאי לפחות זוג אחד כדי לראות לוח</div>`;
      }
      const cards = [];
      pairs.forEach(p => {
        if (p.a) cards.push(p.a);
        if (p.b) cards.push(p.b);
      });
      const shuffled = shuffle(cards).slice(0, 8);
      return `
        <div class="pair-grid">
          ${shuffled.map(c => `<div class="pair-card">${c}</div>`).join('')}
        </div>
      `;
    }

    if (draft.mechanic === 'sort-by-letter') {
      const groups = (draft.sort_groups || []).filter(g => g.letter || (g.items && g.items.length));
      if (!groups.length) {
        return `<div class="empty-hint">מלאי לפחות קבוצה אחת עם פריטים</div>`;
      }
      const cols = Math.min(groups.length, 4);
      return `
        <div class="sort-board" style="--cols:${cols};">
          ${groups.map(g => `
            <div class="sort-bin">
              <div class="sort-bin-letter">${g.letter || '?'}</div>
              <div class="sort-bin-items">${(g.items || []).join(', ') || '—'}</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    return '';
  }

  window.StudioPreview = { init };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
