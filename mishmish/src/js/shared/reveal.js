/* ============================================================
   מישמיש · مشمش — אור-הפנס החושף (MMReveal)
   ------------------------------------------------------------
   החתימה: פנס מוגדר נע בספירלה (2 סבבים) מהמרכז עד הפינות
   ומגלה את הדף. עמום→בהיר, לא שחור, אוטומטי, בלי השהיה בסוף.
   דורש .mm-veil + .mm-halo (מ-design-language.css) ב-DOM.
   מכבד prefers-reduced-motion (מדלג לגמרי).
   ============================================================ */
(function (global) {
  function reveal(opts) {
    opts = opts || {};
    var veil = opts.veil || document.querySelector('.mm-veil');
    var halo = opts.halo || document.querySelector('.mm-halo');
    if (!veil) return;
    if (global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      veil.style.display = 'none';
      return;
    }
    var HALO = opts.halo_size || 460;
    if (halo) {
      halo.style.width = HALO + 'px';
      halo.style.height = HALO + 'px';
      halo.style.margin = (-HALO / 2) + 'px 0 0 ' + (-HALO / 2) + 'px';
      halo.style.opacity = '1';
    }
    veil.style.display = 'block';
    veil.style.opacity = '1';

    var W = innerWidth, H = innerHeight, cx = W / 2, cy = H / 2;
    var pool = Math.min(W, H) * 0.26;          /* גודל עיגול-הפנס (קבוע) */
    var orbit = Math.hypot(W, H) / 2 * 0.98;   /* מרחק-סופי עד הפינות */
    var turns = opts.turns || 2, a0 = -Math.PI / 2;
    var dur = opts.duration || 2600, start = null;

    function put(x, y, r, op) {
      veil.style.setProperty('--x', x + 'px');
      veil.style.setProperty('--y', y + 'px');
      veil.style.setProperty('--r-lantern', r + 'px');
      if (halo) { halo.style.setProperty('--x', x + 'px'); halo.style.setProperty('--y', y + 'px'); }
      if (op != null) veil.style.opacity = op;
    }
    function step(ts) {
      if (start === null) start = ts;
      var e = Math.min(1, (ts - start) / dur);
      var a = a0 + turns * 2 * Math.PI * e;
      var r = orbit * (0.06 + 0.94 * e);
      var x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      var op = e < 0.74 ? 1 : Math.max(0, 1 - (e - 0.74) / 0.26);
      put(x, y, pool, op);
      if (halo) halo.style.opacity = String(Math.max(0, 1 - Math.max(0, (e - 0.82)) / 0.18));
      if (e < 1) {
        requestAnimationFrame(step);
      } else {
        veil.style.opacity = '0'; veil.style.display = 'none';
        if (halo) halo.style.opacity = '0';
      }
    }
    requestAnimationFrame(step);
  }
  global.MMReveal = reveal;
})(window);
