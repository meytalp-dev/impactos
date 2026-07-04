/* ============================================================
   feedback.js — Floating feedback widget + onboarding tour
   ------------------------------------------------------------
   Stores feedback in localStorage 'studio-feedback-log'.
   Pipeline agent / cloud agent will swap localStorage → Supabase
   in Phase 4.
   ============================================================ */
(function () {
  'use strict';

  const FEEDBACK_KEY = 'studio-feedback-log';
  const ONBOARDED_KEY = 'studio-onboarded';

  /* ============================================================
     Onboarding tour
     ============================================================ */
  const TOUR_STEPS = [
    {
      title: 'ברוכה הבאה לסטודיו!',
      body: 'כאן תוכלי לבנות פריטי תרגול משלך עבור הילדים בכיתה. מותאם רק לכיתה שלך — אנחנו לא חולקים בין מורות.'
    },
    {
      title: 'שלב 1 — איזה אי?',
      body: 'בוחרת אי מבית הספר של אבני יסוד. רק האיים שכבר בנויים זמינים כאן. כל אי תומך בכמה סוגי משחקים.'
    },
    {
      title: 'שלב 2 — תוכן',
      body: 'ממלאת את התוכן (אותיות, מילים, מסיחות). כל שדה טקסט עם כפתור צהוב "🟡 נקדי לי" שמנקד אוטומטית — תוכלי גם לערוך ידנית.'
    },
    {
      title: 'שלב 3 — שמירה',
      body: 'רואה תקציר של מה שבנית. אם משהו חסר — נסביר לך בעברית מה. שמירה כטיוטה = רק את רואה. פרסום = מופיע לילדים בכיתה שלך.'
    },
    {
      title: 'מצב הדגמה',
      body: 'בנית פריט במצב הדגמה (?guest=1)? הוא נשמר רק במכשיר הזה. במצב הרגיל הוא יסונכרן לענן.'
    }
  ];

  let tourIdx = 0;

  function maybeStartTour() {
    if (localStorage.getItem(ONBOARDED_KEY) === '1') return;
    tourIdx = 0;
    renderTour();
  }

  function renderTour() {
    const step = TOUR_STEPS[tourIdx];
    if (!step) {
      finishTour();
      return;
    }
    let overlay = document.getElementById('studioTourOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'studioTourOverlay';
      overlay.className = 'tour-overlay';
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
      <div class="tour-card" role="dialog" aria-modal="true">
        <span class="tour-step-num">שלב ${tourIdx + 1} מתוך ${TOUR_STEPS.length}</span>
        <h2>${step.title}</h2>
        <p>${step.body}</p>
        <div class="tour-actions">
          <button class="tour-skip" id="tourSkip" type="button">סיימתי, אל תציגו שוב</button>
          <div class="tour-dots">
            ${TOUR_STEPS.map((_, i) => `<span class="tour-dot ${i === tourIdx ? 'is-current' : ''}"></span>`).join('')}
          </div>
          <button class="btn-primary" id="tourNext" type="button">
            ${tourIdx === TOUR_STEPS.length - 1 ? 'בואי נתחיל' : 'הלאה'}
          </button>
        </div>
      </div>
    `;
    overlay.querySelector('#tourSkip').addEventListener('click', finishTour);
    overlay.querySelector('#tourNext').addEventListener('click', () => {
      tourIdx++;
      renderTour();
    });
  }

  function finishTour() {
    try { localStorage.setItem(ONBOARDED_KEY, '1'); } catch {}
    const overlay = document.getElementById('studioTourOverlay');
    if (overlay) overlay.remove();
  }

  /* ============================================================
     Feedback widget
     ============================================================ */
  function openFeedback(meta) {
    const { step, draft } = (window.StudioState && window.StudioState.get()) || { step: 1, draft: {} };
    const node = document.createElement('div');
    node.innerHTML = `
      <h3 class="studio-modal-title">ספרי לנו</h3>
      <div class="studio-modal-body">
        <div class="feedback-meta">
          איפה את עכשיו: שלב ${step}${meta && meta.element ? ` · אלמנט: ${meta.element}` : ''}
        </div>
        <form class="feedback-form" id="feedbackForm" novalidate>
          <div>
            <label class="form-label" for="fbWanted">מה רצית לעשות?</label>
            <textarea class="form-textarea" id="fbWanted" rows="2" placeholder="לדוגמה: לבנות תרגיל לאות נון..."></textarea>
          </div>
          <div>
            <label class="form-label" for="fbHappened">מה עבד / לא עבד?</label>
            <textarea class="form-textarea" id="fbHappened" rows="3" placeholder="לדוגמה: לא הצלחתי להוסיף מסיחה רביעית..."></textarea>
          </div>
          <div>
            <label class="form-label">סוג</label>
            <div class="feedback-urgency" id="fbUrgency">
              <button class="feedback-urgency-opt" data-urg="error" type="button">שגיאה</button>
              <button class="feedback-urgency-opt" data-urg="suggestion" type="button">המלצה</button>
              <button class="feedback-urgency-opt" data-urg="compliment" type="button">מחמאה</button>
            </div>
          </div>
        </form>
      </div>
      <div class="studio-modal-actions">
        <button class="btn-secondary" id="fbCancel" type="button">בטלי</button>
        <button class="btn-primary" id="fbSubmit" type="button">שלחי</button>
      </div>
    `;
    window.StudioState.openModal(node);

    let urgency = 'suggestion';
    const urgWrap = node.querySelector('#fbUrgency');
    function paintUrg() {
      urgWrap.querySelectorAll('[data-urg]').forEach(b => {
        b.classList.toggle('is-selected', b.getAttribute('data-urg') === urgency);
      });
    }
    urgWrap.querySelectorAll('[data-urg]').forEach(b => {
      b.addEventListener('click', () => { urgency = b.getAttribute('data-urg'); paintUrg(); });
    });
    paintUrg();

    node.querySelector('#fbCancel').addEventListener('click', () => window.StudioState.closeModal());
    node.querySelector('#fbSubmit').addEventListener('click', () => {
      const wanted = node.querySelector('#fbWanted').value.trim();
      const happened = node.querySelector('#fbHappened').value.trim();
      if (!wanted && !happened) {
        window.StudioState.showToast('כתבי משהו לפני שליחה', 'warn');
        return;
      }
      storeFeedback({
        step,
        element: (meta && meta.element) || null,
        draft_snapshot: cloneSafe(draft),
        wanted,
        happened,
        category: urgency
      });
      window.StudioState.closeModal();
      window.StudioState.showToast('תודה! ההערה נשמרה ✓', 'success');
    });
  }

  function cloneSafe(obj) {
    try { return JSON.parse(JSON.stringify(obj)); } catch { return null; }
  }

  function storeFeedback(entry) {
    try {
      const list = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '[]');
      const teacherEmail = guessTeacherEmail();
      list.push(Object.assign({
        teacher_email: teacherEmail,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        url: location.href
      }, entry));
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('feedback storage failed', e);
    }
  }

  function guessTeacherEmail() {
    const params = new URLSearchParams(location.search);
    if (params.get('teacher_email')) return params.get('teacher_email');
    if (window.AvneiRuntimeMode && window.AvneiRuntimeMode.teacherEmail) {
      return window.AvneiRuntimeMode.teacherEmail;
    }
    return localStorage.getItem('teacher-email') || 'unknown';
  }

  /* ============================================================
     Init
     ============================================================ */
  function init() {
    const fab = document.getElementById('studioFeedbackFab');
    if (fab) fab.addEventListener('click', () => openFeedback({}));

    // Delegated handler: any element with [data-feedback="<label>"]
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest && e.target.closest('[data-feedback]');
      if (!trigger) return;
      e.preventDefault();
      openFeedback({ element: trigger.getAttribute('data-feedback') });
    });

    // Start tour after first paint (give wizard a beat to render)
    setTimeout(maybeStartTour, 250);
  }

  window.StudioFeedback = { init, openFeedback, _restart: () => { localStorage.removeItem(ONBOARDED_KEY); maybeStartTour(); } };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
