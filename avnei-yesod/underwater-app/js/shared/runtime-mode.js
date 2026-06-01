/**
 * Avnei Yesod — Runtime Mode Detection
 * -------------------------------------
 * Resolves whether the current page should run in 'cloud' or 'demo' mode.
 *
 * - cloud: production. Reads/writes through Supabase. Requires teacher auth
 *          (for dashboards) or student token (for student-facing pages).
 * - demo:  bypasses backend entirely. Reads/writes localStorage only.
 *          Triggered by ?presentation=1 / ?guest=1 / ?skip-picker=1.
 *          Used for client demos and dev work without a network.
 *
 * Detection runs once per page load and caches the result on window.
 *
 * Created: 2026-06-01
 */

(function () {
  'use strict';

  const DEMO_PARAMS = ['presentation', 'guest', 'skip-picker'];

  function detect() {
    try {
      const params = new URLSearchParams(window.location.search);
      for (const key of DEMO_PARAMS) {
        if (params.has(key)) return 'demo';
      }
    } catch (e) {
      // SSR or weird env — fall through to cloud
    }
    return 'cloud';
  }

  const mode = detect();

  window.AvneiRuntimeMode = {
    /** 'cloud' or 'demo' */
    current: mode,

    /** boolean shortcuts */
    isCloud: mode === 'cloud',
    isDemo: mode === 'demo',

    /** for tests — re-detect after mutating location */
    redetect() {
      const m = detect();
      this.current = m;
      this.isCloud = m === 'cloud';
      this.isDemo = m === 'demo';
      return m;
    },
  };

  // For Node-style tests
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { detect, DEMO_PARAMS };
  }
})();
