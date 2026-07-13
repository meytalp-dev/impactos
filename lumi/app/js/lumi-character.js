// ============================================================
// lumi-character.js — Lumi, a small GLOWING creature (not an octopus, not a
// fish, not Noni). Rendered as inline SVG so it is crisp, themeable, and can
// carry MEANING through gesture (comprehensible input, learning-model §2):
//   points  → "where?"          (comprehend / find-it)
//   listen  → cups toward ear   (recognize / discriminate)
//   hug     → arms in, big glow (function / celebration)
//   lean    → tips forward      (produce invitation)
//   dim     → low glow          (drifted, patient "let's listen again")
//   glow    → radiant           (a lantern just lit / home)
//
// API: LumiCharacter.mount(el) → controller with .setMood(name) and .say(html).
// No word-text ever rendered inside Lumi's bubble in the child loop; the bubble
// shows only gesture dots / Hebrew procedural UI when explicitly asked.
// ============================================================
window.LumiCharacter = (function () {
  'use strict';

  var SVG = [
    '<svg class="lumi-svg" viewBox="0 0 120 130" aria-hidden="true">',
      '<defs>',
        '<radialGradient id="lumiBody" cx="50%" cy="42%" r="62%">',
          '<stop offset="0%" stop-color="var(--lumi-core)"/>',
          '<stop offset="60%" stop-color="var(--lumi-body)"/>',
          '<stop offset="100%" stop-color="var(--amber)"/>',
        '</radialGradient>',
        '<radialGradient id="lumiAura" cx="50%" cy="50%" r="50%">',
          '<stop offset="0%" stop-color="var(--lumi-aura)"/>',
          '<stop offset="100%" stop-color="rgba(255,210,120,0)"/>',
        '</radialGradient>',
      '</defs>',
      '<circle class="lumi-aura" cx="60" cy="60" r="58" fill="url(#lumiAura)"/>',
      // little floaty tendrils of light
      '<g class="lumi-arms">',
        '<path class="lumi-arm lumi-arm-l" d="M28 74 q-16 6 -18 22" />',
        '<path class="lumi-arm lumi-arm-r" d="M92 74 q16 6 18 22" />',
      '</g>',
      '<circle class="lumi-core" cx="60" cy="58" r="40" fill="url(#lumiBody)"/>',
      // face
      '<g class="lumi-face">',
        '<circle class="lumi-eye lumi-eye-l" cx="48" cy="54" r="5.4"/>',
        '<circle class="lumi-eye lumi-eye-r" cx="72" cy="54" r="5.4"/>',
        '<circle class="lumi-spark lumi-spark-l" cx="49.6" cy="52" r="1.7"/>',
        '<circle class="lumi-spark lumi-spark-r" cx="73.6" cy="52" r="1.7"/>',
        '<path class="lumi-smile" d="M50 70 q10 10 20 0"/>',
        '<ellipse class="lumi-cheek lumi-cheek-l" cx="40" cy="65" rx="5" ry="3.2"/>',
        '<ellipse class="lumi-cheek lumi-cheek-r" cx="80" cy="65" rx="5" ry="3.2"/>',
      '</g>',
      // pointing hand (shown only in "points" mood)
      '<circle class="lumi-point" cx="104" cy="60" r="6"/>',
    '</svg>'
  ].join('');

  var MOODS = ['idle', 'listen', 'points', 'hug', 'lean', 'dim', 'glow', 'happy'];

  function mount(el) {
    el.classList.add('lumi');
    el.innerHTML =
      '<div class="lumi-stage" data-mood="idle">' + SVG + '</div>' +
      '<div class="lumi-bubble" hidden></div>';
    var stage  = el.querySelector('.lumi-stage');
    var bubble = el.querySelector('.lumi-bubble');

    function setMood(name) {
      if (MOODS.indexOf(name) === -1) name = 'idle';
      stage.setAttribute('data-mood', name);
    }

    // say — bubble content is HTML (gesture glyphs / Hebrew UI only). Pass ''
    // to hide. NEVER used to show English word-text in the child loop.
    function say(html) {
      if (!html) { bubble.hidden = true; bubble.innerHTML = ''; return; }
      bubble.hidden = false;
      bubble.innerHTML = html;
    }

    // pulse — a quick celebratory bloom (a lantern lit / correct answer).
    function pulse() {
      stage.classList.remove('lumi-pulse');
      // force reflow to restart the animation
      void stage.offsetWidth;
      stage.classList.add('lumi-pulse');
    }

    return { setMood: setMood, say: say, pulse: pulse, el: el };
  }

  return { mount: mount, MOODS: MOODS };
})();
