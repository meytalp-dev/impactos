/**
 * Avnei Yesod — Cloud Config
 * --------------------------
 * Public Supabase configuration. Safe to commit to git.
 *
 * The PUBLISHABLE_KEY (sb_publishable_*) is the new format for what used to be
 * called the "anon key". It's designed to be exposed client-side; Row Level
 * Security (RLS) policies in the database are the actual access gate.
 *
 * The SECRET_KEY (sb_secret_*) lives ONLY in .env, never here.
 *
 * Created: 2026-06-01
 */

(function () {
  'use strict';

  window.AvneiCloudConfig = {
    SUPABASE_URL: 'https://ynxfszmpoppqrqocewcs.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_Nq1wqSAjsAZMmuOXq2afUA_f_g8CEIU',

    // CDN for the Supabase JS client. ESM module via esm.sh.
    SUPABASE_JS_URL: 'https://esm.sh/@supabase/supabase-js@2.45.4',
  };
})();
