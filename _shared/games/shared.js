/* ================================================================
   Impact SO — Games Shared JS
   Common utilities + Sheets integration for all 12 games
   ================================================================ */

(function () {
  'use strict';

  // ─── Existing Apps Script backend (same one used by docs/quizzes/*) ───
  const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbyLwo3jrseEDJ4GLnVNCzoJTRJBK_IAkJE0IiGGcx18buwJQ0XSRgOcJ2FmbMtA5ojU/exec';

  // ─── Default teacher email ───
  const DEFAULT_TEACHER = 'meytalp@bethaarava.ort.org.il';

  // ─── Default class options ───
  const DEFAULT_CLASSES = ['י"א-1', 'י"א-2', 'י"א-3'];

  // ─── Game type metadata (label + emoji shown in welcome screen) ───
  const GAME_TYPES = {
    trivia:      { label: 'טריוויה',           emoji: '🎯' },
    matching:    { label: 'התאמה',             emoji: '🔗' },
    ordering:    { label: 'סדר נכון',          emoji: '📋' },
    escape:      { label: 'חדר בריחה',         emoji: '🔐' },
    memory:      { label: 'זיכרון',            emoji: '🧠' },
    wheel:       { label: 'גלגל המזל',         emoji: '🎡' },
    truefalse:   { label: 'נכון / לא נכון',    emoji: '✅' },
    fillblank:   { label: 'השלמת חסר',         emoji: '✏️' },
    sentence:    { label: 'סדר את המשפט',      emoji: '🔤' },
    groups:      { label: 'קבוצות',            emoji: '🎨' },
    hangman:     { label: 'נחשו את המילה',     emoji: '🔮' },
    millionaire: { label: 'מיליונר',           emoji: '💰' },
  };

  // ─── Score tier (used by result screen) ───
  function scoreTier(percent) {
    if (percent >= 90) return { tier: 'excellent', emoji: '🌟', msg: 'מצוין! שליטה מעולה!' };
    if (percent >= 70) return { tier: 'good',      emoji: '👏', msg: 'כל הכבוד! ביצוע טוב מאוד!' };
    if (percent >= 50) return { tier: 'ok',        emoji: '💪', msg: 'אפשר לשפר — נסו שוב!' };
    return { tier: 'low', emoji: '📖', msg: 'כדאי לחזור על החומר' };
  }

  // ─── Fisher-Yates shuffle ───
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ─── HTML escape ───
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  // ─── URL params ───
  function getParam(name, fallback) {
    const p = new URLSearchParams(location.search);
    return p.get(name) || fallback || '';
  }

  // ─── Load content — works on both file:// and http(s) ───
  // Tries fetch first; on failure, falls back to <script> tag (path swapped to .js)
  // .js files must set window.__GAME_CONTENT = {...}
  function loadContent(path) {
    if (!path) return Promise.reject(new Error('content path missing'));
    return new Promise((resolve, reject) => {
      // Method 1: fetch (works on http(s))
      fetch(path, { cache: 'no-store' })
        .then(res => res.ok ? res.json() : Promise.reject(new Error('HTTP ' + res.status)))
        .then(resolve)
        .catch(() => {
          // Method 2: <script> tag fallback (works on file://)
          const jsPath = path.replace(/\.json$/i, '.js');
          window.__GAME_CONTENT = null;
          const s = document.createElement('script');
          s.src = jsPath + '?_=' + Date.now();
          s.onload = () => {
            if (window.__GAME_CONTENT) {
              const c = window.__GAME_CONTENT;
              window.__GAME_CONTENT = null;
              resolve(c);
            } else {
              reject(new Error('שגיאה בטעינת תוכן (אין נתונים)'));
            }
          };
          s.onerror = () => reject(new Error('שגיאה בטעינת תוכן (קובץ לא נמצא: ' + jsPath + ')'));
          document.head.appendChild(s);
        });
    });
  }

  // ─── Send results to Google Sheets (JSONP via script tag) ───
  function sendResults(opts) {
    const params = new URLSearchParams({
      action: 'submit',
      quizName: opts.quizName,
      studentName: opts.studentName,
      classroom: opts.classroom,
      score: String(Math.round(opts.percentage)),
      totalQuestions: String(opts.totalItems),
      correctAnswers: String(opts.correctItems),
      level: opts.level || '',
      teacherEmail: opts.teacherEmail || DEFAULT_TEACHER,
    });
    const status = document.getElementById('sendStatus');
    if (status) status.textContent = 'שולח למורה...';
    return new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = SHEETS_URL + '?' + params.toString();
      let done = false;
      const finish = (ok, msg) => {
        if (done) return;
        done = true;
        if (status) {
          status.textContent = ok ? '✓ הציון נשלח למורה' : ('שגיאה: ' + msg);
          status.className = ok ? 'ok' : 'err';
        }
        s.remove();
        resolve(ok);
      };
      s.onload = () => finish(true);
      s.onerror = () => finish(false, 'בעיית רשת');
      setTimeout(() => finish(true), 3000); // assume success after 3s
      document.body.appendChild(s);
    });
  }

  // ─── Build welcome screen HTML ───
  function welcomeHtml(opts) {
    const t = GAME_TYPES[opts.gameType] || { label: 'משחק', emoji: '🎮' };
    const classes = (opts.classes && opts.classes.length) ? opts.classes : DEFAULT_CLASSES;
    return `
      <div class="card welcome">
        <div class="welcome-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
        </div>
        <div class="welcome-eyebrow">${escapeHtml(opts.eyebrow || opts.kitTitle || 'Impact SO')}</div>
        <h1 class="welcome-title">${escapeHtml(opts.title)}</h1>
        <div class="game-badge">${t.emoji} ${t.label}</div>
        <p class="welcome-sub">${escapeHtml(opts.subtitle || 'הזינו שם וכיתה כדי להתחיל')}</p>
        <form class="welcome-form" id="welcomeForm" autocomplete="off">
          <input type="text" id="studentName" placeholder="שם מלא" required maxlength="40">
          <select id="studentClass" required>
            <option value="">בחרו כיתה</option>
            ${classes.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}
          </select>
          <button type="submit" class="btn-primary" id="startBtn" disabled>🎮 התחילו לשחק!</button>
        </form>
      </div>
    `;
  }

  // ─── Build result screen HTML ───
  function resultHtml(opts) {
    const tier = scoreTier(opts.percentage);
    return `
      <div class="card result">
        <div class="result-emoji">${tier.emoji}</div>
        <div class="result-score">${Math.round(opts.percentage)}%</div>
        <div class="result-of">מתוך 100</div>
        <div class="result-msg tier-${tier.tier}">${tier.msg}</div>
        <div class="result-stats">
          <div class="stat-tile">
            <div class="stat-tile-num">${opts.correctItems}</div>
            <div class="stat-tile-label">נכונות</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile-num">${opts.totalItems - opts.correctItems}</div>
            <div class="stat-tile-label">שגויות</div>
          </div>
          <div class="stat-tile">
            <div class="stat-tile-num">${opts.totalItems}</div>
            <div class="stat-tile-label">סה"כ</div>
          </div>
        </div>
        <div id="sendStatus"></div>
        <div class="result-actions">
          <button class="btn-primary" id="playAgainBtn">🔄 שחקו שוב</button>
        </div>
      </div>
    `;
  }

  // ─── Build progress bar HTML ───
  function progressHtml(current, total, label) {
    const pct = total ? Math.round((current / total) * 100) : 0;
    return `
      <div class="progress-wrap">
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="progress-meta">
          <span>${escapeHtml(label || 'התקדמות')}</span>
          <span>${current} / ${total}</span>
        </div>
      </div>
    `;
  }

  // ─── Topbar (back to kit + game title) ───
  function topbarHtml(opts) {
    const t = GAME_TYPES[opts.gameType] || { label: 'משחק', emoji: '🎮' };
    return `
      <div class="topbar">
        <a class="topbar-back" href="${opts.backHref || '../index.html'}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          חזרה למערך
        </a>
        <div class="topbar-title">${t.emoji} ${escapeHtml(opts.title || t.label)}</div>
        <div class="topbar-meta">${escapeHtml(opts.kitTitle || '')}</div>
      </div>
    `;
  }

  // ─── Wire up the welcome form (calls onStart with {studentName, studentClass}) ───
  function wireWelcomeForm(onStart) {
    const form = document.getElementById('welcomeForm');
    const nameInput = document.getElementById('studentName');
    const classSel = document.getElementById('studentClass');
    const btn = document.getElementById('startBtn');
    const validate = () => {
      btn.disabled = !(nameInput.value.trim().length >= 2 && classSel.value);
    };
    nameInput.addEventListener('input', validate);
    classSel.addEventListener('change', validate);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      validate();
      if (btn.disabled) return;
      onStart({
        studentName: nameInput.value.trim(),
        studentClass: classSel.value,
      });
    });
  }

  // ─── Show result + send to sheet + wire "play again" ───
  function showResult(opts) {
    const root = document.getElementById('root');
    root.innerHTML = resultHtml(opts);
    document.getElementById('playAgainBtn').addEventListener('click', () => location.reload());

    // Send to Sheets in background
    sendResults({
      quizName: (opts.gameTitle || 'משחק') + ' — ' + (GAME_TYPES[opts.gameType]?.label || opts.gameType),
      studentName: opts.studentName,
      classroom: opts.studentClass,
      percentage: opts.percentage,
      totalItems: opts.totalItems,
      correctItems: opts.correctItems,
      teacherEmail: opts.teacherEmail || DEFAULT_TEACHER,
    });
  }

  // ─── Compute percentage safely ───
  function pct(correct, total) {
    if (!total) return 0;
    return (correct / total) * 100;
  }

  // ─── Public API ───
  window.IGS = {
    SHEETS_URL,
    DEFAULT_TEACHER,
    GAME_TYPES,
    shuffle,
    escapeHtml,
    getParam,
    loadContent,
    welcomeHtml,
    resultHtml,
    progressHtml,
    topbarHtml,
    wireWelcomeForm,
    showResult,
    sendResults,
    pct,
    scoreTier,
  };
})();
