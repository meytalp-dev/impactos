/**
 * Avnei Yesod — Cloud Client
 * ---------------------------
 * Initializes the Supabase JS client (loaded via ESM CDN).
 * Provides helpers for the current session: who is the active teacher / token.
 *
 * Loaded as an ES module — pages that need it should:
 *   <script src="js/shared/cloud-config.js"></script>
 *   <script type="module" src="js/shared/cloud-client.js"></script>
 *
 * After load: window.AvneiCloudClient is available.
 *
 * In demo mode (runtime-mode.js → 'demo'), cloud-client doesn't initialize the
 * Supabase client at all — it exposes a stub that throws on use, so accidental
 * cloud calls in demo paths fail loudly.
 *
 * Created: 2026-06-01
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

(function () {
  'use strict';

  const cfg = window.AvneiCloudConfig;
  const mode = window.AvneiRuntimeMode;

  if (!cfg) {
    console.error('[cloud-client] AvneiCloudConfig missing. Load cloud-config.js first.');
    return;
  }
  if (!mode) {
    console.error('[cloud-client] AvneiRuntimeMode missing. Load runtime-mode.js first.');
    return;
  }

  // In demo mode, expose a stub. Anything that calls cloud APIs in demo mode
  // is a bug — fail loudly so we catch it in dev.
  if (mode.isDemo) {
    window.AvneiCloudClient = {
      mode: 'demo',
      supabase: null,
      getCurrentTeacher: async () => null,
      getStudentToken: () => null,
      _stub: true,
      _throwIfUsed(method) {
        throw new Error(`[cloud-client] ${method} called in demo mode. Wrap cloud calls in 'if (AvneiRuntimeMode.isCloud)'.`);
      },
    };
    console.log('[cloud-client] Demo mode — Supabase client not initialized.');
    return;
  }

  // Cloud mode: real initialization
  const supabase = createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: window.localStorage,
        storageKey: 'avnei-yesod-supabase-auth',
      },
    }
  );

  /**
   * Get the currently logged-in teacher (Supabase auth user + teachers row).
   * Returns null if no session.
   */
  async function getCurrentTeacher() {
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return null;

    const { data, error } = await supabase
      .from('teachers')
      .select('id, name, email')
      .eq('id', user.id)
      .single();

    if (error) {
      console.warn('[cloud-client] Could not fetch teacher row:', error.message);
      return { id: user.id, email: user.email, name: user.email.split('@')[0] };
    }
    return data;
  }

  /**
   * Get the active student's token from localStorage.
   * Returns null if no token bound.
   */
  function getStudentToken() {
    return window.localStorage.getItem('avnei-yesod-student-token');
  }

  /**
   * Set the student token (e.g., after parsing ?token= from URL).
   */
  function setStudentToken(token) {
    if (token) {
      window.localStorage.setItem('avnei-yesod-student-token', token);
    } else {
      window.localStorage.removeItem('avnei-yesod-student-token');
    }
  }

  window.AvneiCloudClient = {
    mode: 'cloud',
    supabase,
    getCurrentTeacher,
    getStudentToken,
    setStudentToken,
  };

  console.log('[cloud-client] Initialized in cloud mode.');
})();
