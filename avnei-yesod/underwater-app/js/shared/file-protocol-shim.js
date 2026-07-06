// ============================================================================
// file-protocol-shim.js — פתיחת משחקונים ישירות מהקובץ (file://), בלי שרת
//
// בפתיחה מ-file:// הדפדפן חוסם fetch/XHR של JSON מקומי (CORS). השכבה הזו:
//   1. טוענת את embedded-data.js (צריבה של כל קבצי התוכן — נוצר ע"י
//      scripts/build-embedded-data.js).
//   2. עוטפת fetch + XMLHttpRequest: בקשה לקובץ תוכן צרוב נענית מהזיכרון.
// ב-http/https — יציאה מיידית, אפס השפעה (ה-JSON מהשרת נשאר המקור).
// חייבת להיטען כ-script רגיל (לא module) לפני שאר הסקריפטים של הדף.
// ============================================================================
(function () {
  'use strict';
  if (location.protocol !== 'file:') return;

  // --- 1. הזרקת התוכן הצרוב באופן סינכרוני בזמן פענוח הדף ---
  document.write('<script src="js/shared/embedded-data.js"><\/script>');

  // --- נרמול נתיב לבקשת מפתח: מוריד query/hash, מיישר ל-underwater-app/ ---
  var hereDir = location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, '');
  var parentDir = hereDir.replace(/[^/]+\/$/, '');
  function keyFor(input) {
    var u = String(input && input.url ? input.url : input);
    u = u.replace(/[?#].*$/, '');
    if (u.indexOf(hereDir) === 0) u = u.slice(hereDir.length);
    else if (u.indexOf(parentDir) === 0) u = '../' + u.slice(parentDir.length);
    if (u.slice(0, 2) === './') u = u.slice(2);
    return u;
  }
  function lookup(input) {
    var map = window.AVNEI_EMBEDDED;
    if (!map) return undefined;
    return map[keyFor(input)];
  }

  // --- 2א. עטיפת fetch ---
  var origFetch = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (input, init) {
    var data = lookup(input);
    if (data !== undefined) {
      var body = JSON.stringify(data);
      return Promise.resolve({
        ok: true,
        status: 200,
        // עותק טרי לכל קריאה — שאף משחקון לא ישנה את המקור לאחרים
        json: function () { return Promise.resolve(JSON.parse(body)); },
        text: function () { return Promise.resolve(body); }
      });
    }
    return origFetch
      ? origFetch(input, init)
      : Promise.reject(new TypeError('fetch unavailable on file://'));
  };

  // --- 2ב. עטיפת XHR (interventions.js + pack-bkt-bridge.js משתמשים ב-sync XHR) ---
  var XHR = window.XMLHttpRequest;
  if (XHR && XHR.prototype) {
    var origOpen = XHR.prototype.open;
    var origSend = XHR.prototype.send;
    XHR.prototype.open = function (method, url) {
      var data = lookup(url);
      if (data !== undefined) { this._avneiEmbedded = data; return; }
      this._avneiEmbedded = undefined;
      return origOpen.apply(this, arguments);
    };
    XHR.prototype.send = function () {
      if (this._avneiEmbedded !== undefined) {
        Object.defineProperty(this, 'status', { value: 200, configurable: true });
        Object.defineProperty(this, 'readyState', { value: 4, configurable: true });
        Object.defineProperty(this, 'responseText',
          { value: JSON.stringify(this._avneiEmbedded), configurable: true });
        if (typeof this.onreadystatechange === 'function') this.onreadystatechange();
        if (typeof this.onload === 'function') this.onload();
        return;
      }
      return origSend.apply(this, arguments);
    };
  }
})();
