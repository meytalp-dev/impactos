// ============================================================
// shared/feedback.js — בועת פידבק + burst של בועות זהב
// חולץ מ-stage-3.html v0.1 (23.5.2026)
// ============================================================

window.AvneiFeedback = (function() {

  function show(text) {
    const fb = document.getElementById('feedbackBubble');
    if (!fb) return;
    fb.textContent = text;
    fb.classList.add('show');
  }

  function hide() {
    const fb = document.getElementById('feedbackBubble');
    if (fb) fb.classList.remove('show');
  }

  // burst של בועות זהב סביב אלמנט נתון (או 'correct' card)
  function successBurst(targetEl) {
    const layer = document.getElementById('burst');
    if (!layer) return;

    const el = targetEl || document.querySelector('.option-card.correct');
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    for (let i = 0; i < 6; i++) {
      const b = document.createElement('div');
      b.className = 'burst-bubble';
      b.style.left = cx + 'px';
      b.style.top = cy + 'px';
      b.style.bottom = 'auto';
      b.style.setProperty('--dx', (Math.random() * 140 - 70) + 'px');
      b.style.animationDelay = (i * 60) + 'ms';
      b.style.width = (10 + Math.random() * 10) + 'px';
      b.style.height = b.style.width;
      layer.appendChild(b);
      setTimeout(() => b.remove(), 1300);
    }
  }

  return { show, hide, successBurst };
})();
