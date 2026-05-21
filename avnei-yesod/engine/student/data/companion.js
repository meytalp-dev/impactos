// ============================================================
// Companion — האבן שלי
// משותף לכל דפי התלמיד. מחדיר את ה-SVG, ה-CSS, וה-API לשינוי מצב.
// שימוש:  Companion.mount(el, { size: 120 });
//         Companion.setState('cheer'); // calm | blink | cheer | sleep
// ============================================================

window.Companion = (function() {

  const SVG = `<svg class="cm-svg" viewBox="0 0 220 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <radialGradient id="cmBody" cx="40%" cy="35%" r="75%">
        <stop offset="0%"  stop-color="#fdf8f0"/>
        <stop offset="35%" stop-color="#e8dfd3"/>
        <stop offset="75%" stop-color="#d3c6b3"/>
        <stop offset="100%" stop-color="#b8a78f"/>
      </radialGradient>
      <radialGradient id="cmShine" cx="35%" cy="25%" r="35%">
        <stop offset="0%" stop-color="#fffefb" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="#fffefb" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <ellipse cx="110" cy="135" rx="92" ry="88" fill="url(#cmBody)"/>
    <ellipse cx="110" cy="135" rx="92" ry="88" fill="none" stroke="#8a7860" stroke-width="2" stroke-opacity="0.25"/>
    <ellipse cx="92" cy="92" rx="38" ry="22" fill="url(#cmShine)"/>
    <ellipse cx="110" cy="200" rx="60" ry="14" fill="#8a7860" opacity="0.12"/>
    <ellipse class="cm-cheek" cx="62"  cy="148" rx="13" ry="9" fill="#f4a5a5"/>
    <ellipse class="cm-cheek" cx="158" cy="148" rx="13" ry="9" fill="#f4a5a5"/>
    <ellipse class="cm-eye" cx="80"  cy="125" rx="7" ry="11" fill="#2d2418"/>
    <ellipse class="cm-eye" cx="140" cy="125" rx="7" ry="11" fill="#2d2418"/>
    <circle class="cm-eye" cx="82"  cy="121" r="2.2" fill="#fff"/>
    <circle class="cm-eye" cx="142" cy="121" r="2.2" fill="#fff"/>
    <path class="cm-eye-cheer" d="M 70 128 Q 80 116 90 128" stroke="#2d2418" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path class="cm-eye-cheer" d="M 130 128 Q 140 116 150 128" stroke="#2d2418" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path class="cm-eye-sleep" d="M 70 125 Q 80 130 90 125" stroke="#2d2418" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path class="cm-eye-sleep" d="M 130 125 Q 140 130 150 125" stroke="#2d2418" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path class="cm-mouth-calm" d="M 92 158 Q 110 172 128 158" stroke="#3a2d1f" stroke-width="4" fill="none" stroke-linecap="round"/>
    <ellipse class="cm-mouth-blink" cx="110" cy="162" rx="6" ry="5" fill="#3a2d1f" opacity="0.85"/>
    <path class="cm-mouth-cheer" d="M 86 156 Q 110 184 134 156 Q 110 168 86 156 Z" fill="#3a2d1f"/>
    <path class="cm-mouth-cheer" d="M 100 168 Q 110 178 120 168 Q 110 174 100 168 Z" fill="#f4a5a5"/>
    <ellipse class="cm-mouth-sleep" cx="110" cy="164" rx="5" ry="4" fill="#3a2d1f" opacity="0.7"/>
    <g class="cm-zzz">
      <text x="170" y="80" font-family="Playpen Sans Hebrew, sans-serif" font-size="22" font-weight="700" fill="#6b5cff">Z</text>
      <text x="184" y="65" font-family="Playpen Sans Hebrew, sans-serif" font-size="16" font-weight="700" fill="#6b5cff" opacity="0.75">z</text>
      <text x="194" y="52" font-family="Playpen Sans Hebrew, sans-serif" font-size="12" font-weight="700" fill="#6b5cff" opacity="0.55">z</text>
    </g>
  </svg>`;

  const CSS = `
  .cm-host { display: inline-block; position: relative; line-height: 0; }
  .cm-svg { width: 100%; height: 100%; display: block;
            animation: cm-idle 3.4s ease-in-out infinite; transform-origin: center bottom; }
  @keyframes cm-idle { 0%,100%{transform:translateY(0) rotate(-0.5deg);} 50%{transform:translateY(-3px) rotate(0.5deg);} }

  .cm-host.state-cheer .cm-svg { animation: cm-cheer 0.6s ease-out 3; }
  @keyframes cm-cheer {
    0%{transform:translateY(0) rotate(0);} 25%{transform:translateY(-22px) rotate(-3deg);}
    50%{transform:translateY(0) rotate(3deg);} 75%{transform:translateY(-14px) rotate(-2deg);}
    100%{transform:translateY(0) rotate(0);}
  }
  .cm-host.state-blink .cm-svg { animation: cm-wiggle 0.5s ease-in-out 2; }
  @keyframes cm-wiggle { 0%,100%{transform:translateX(0) rotate(0);} 25%{transform:translateX(-4px) rotate(-2deg);} 75%{transform:translateX(4px) rotate(2deg);} }
  .cm-host.state-sleep .cm-svg { animation: cm-breath 3.6s ease-in-out infinite; }
  @keyframes cm-breath { 0%,100%{transform:translateY(0) scale(1);} 50%{transform:translateY(2px) scale(1.02);} }

  .cm-eye { transition: all 0.18s ease-out; transform-origin: center; }
  .cm-eye-cheer, .cm-eye-sleep, .cm-mouth-blink, .cm-mouth-cheer, .cm-mouth-sleep, .cm-zzz {
    opacity: 0; transition: opacity 0.22s ease-out;
  }
  .cm-cheek { opacity: 0.55; transition: opacity 0.22s ease-out; }

  .cm-host.state-blink .cm-eye { ry: 1; }
  .cm-host.state-blink .cm-mouth-calm { opacity: 0; }
  .cm-host.state-blink .cm-mouth-blink { opacity: 1; }

  .cm-host.state-cheer .cm-eye { opacity: 0; }
  .cm-host.state-cheer .cm-eye-cheer { opacity: 1; }
  .cm-host.state-cheer .cm-mouth-calm { opacity: 0; }
  .cm-host.state-cheer .cm-mouth-cheer { opacity: 1; }
  .cm-host.state-cheer .cm-cheek { opacity: 0.95; }

  .cm-host.state-sleep .cm-eye { opacity: 0; }
  .cm-host.state-sleep .cm-eye-sleep { opacity: 1; }
  .cm-host.state-sleep .cm-mouth-calm { opacity: 0; }
  .cm-host.state-sleep .cm-mouth-sleep { opacity: 1; }
  .cm-host.state-sleep .cm-zzz { animation: cm-zzz-float 2.6s ease-in-out infinite; }

  @keyframes cm-zzz-float {
    0%{transform:translate(0,0) rotate(-5deg); opacity:0;}
    20%{opacity:1;} 80%{opacity:0.6;}
    100%{transform:translate(20px,-30px) rotate(8deg); opacity:0;}
  }

  .cm-host.state-calm .cm-eye { animation: cm-natural-blink 5s infinite; }
  @keyframes cm-natural-blink {
    0%, 92%, 100% { ry: 11; }
    94%, 98%      { ry: 1; }
  }
  `;

  let styleInjected = false;
  function injectStyle() {
    if (styleInjected) return;
    const s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
    styleInjected = true;
  }

  const instances = new WeakMap();

  function mount(el, opts = {}) {
    injectStyle();
    const size = opts.size || 120;
    el.classList.add('cm-host', 'state-calm');
    el.style.width = size + 'px';
    el.style.height = (size * (240/220)) + 'px';
    el.innerHTML = SVG;
    instances.set(el, { state: 'calm' });
    return {
      el,
      setState(s) { setState(el, s); },
      get state() { return instances.get(el).state; }
    };
  }

  function setState(el, s) {
    const valid = ['calm','blink','cheer','sleep'];
    if (!valid.includes(s)) return;
    el.classList.remove('state-calm','state-blink','state-cheer','state-sleep');
    el.classList.add('state-' + s);
    const inst = instances.get(el) || {};
    inst.state = s;
    instances.set(el, inst);

    // Auto-return to calm for transient states
    if (s === 'cheer') setTimeout(() => { if (instances.get(el)?.state === 'cheer') setState(el, 'calm'); }, 2200);
    if (s === 'blink') setTimeout(() => { if (instances.get(el)?.state === 'blink') setState(el, 'calm'); }, 1400);
  }

  return {
    mount,
    setState: (el, s) => setState(el, s)
  };

})();
