/**
 * Studio · Pipeline (real)
 * Entry point — מחבר את כל המודולים ומחשף window.AvneiStudioPipeline.
 *
 * סדר טעינה ב-HTML (UI agent יוסיף ל-teacher-studio.html):
 *   <script src="js/studio/metadata.js"></script>
 *   <script src="js/studio/auto-tagger.js"></script>
 *   <script src="js/studio/niqud-client.js"></script>
 *   <script src="js/studio/tts-batch.js"></script>
 *   <script src="js/studio/validator-pipeline.js"></script>
 *   <script src="js/studio/local-store.js"></script>
 *   <script src="js/studio/_pipeline-real.js"></script>   ← LAST
 *
 * הקובץ הזה דורס _pipeline-stub.js (אם נטען) — זה הצפוי.
 */
(function (global) {
  'use strict';

  const m  = global._StudioMetadata;
  const at = global._StudioAutoTagger;
  const nc = global._StudioNiqudClient;
  const tt = global._StudioTTSBatch;
  const vp = global._StudioValidatorPipeline;
  const ls = global._StudioLocalStore;

  // sanity check — חסר משהו = bug בסדר הטעינה
  const missing = [];
  if (!m)  missing.push('metadata.js');
  if (!at) missing.push('auto-tagger.js');
  if (!nc) missing.push('niqud-client.js');
  if (!tt) missing.push('tts-batch.js');
  if (!vp) missing.push('validator-pipeline.js');
  if (!ls) missing.push('local-store.js');
  if (missing.length > 0) {
    const msg = `[studio] _pipeline-real.js: missing modules — ${missing.join(', ')}`;
    if (typeof console !== 'undefined') console.error(msg);
    throw new Error(msg);
  }

  global.AvneiStudioPipeline = {
    // ============ AUTO-TAGGING ============
    autoTag: at.autoTag,

    // ============ NIQUD ============
    applyNiqud: nc.applyNiqud,

    // ============ TTS ============
    generateTTS: tt.generateTTS,

    // ============ VALIDATION ============
    validateContent: vp.validateContent,

    // ============ STORAGE ============
    saveDraft:    ls.saveDraft,
    publishItem:  ls.publishItem,
    listMyItems:  ls.listMyItems,
    deleteDraft:  ls.deleteDraft,

    // ============ METADATA HELPERS ============
    getAvailableIslands: m.getAvailableIslands,
    getMechanicLabel:    m.getMechanicLabel,
    getTierLabel:        m.getTierLabel,
    getMechanicDescription: m.getMechanicDescription,

    // ============ INTERNAL (לבדיקות / debug) ============
    _internals: {
      autoTagger: at,
      niqudClient: nc,
      ttsBatch: tt,
      validator: vp,
      localStore: ls,
      metadata: m,
      version: '1.0.0-2026-06-01'
    }
  };

  // Local-store צריך את ה-validator לבדיקה לפני publish
  if (typeof ls._injectValidator === 'function') {
    ls._injectValidator(vp);
  }

  if (typeof console !== 'undefined') {
    console.log('[studio] AvneiStudioPipeline ready · v' +
      global.AvneiStudioPipeline._internals.version);
  }
})(typeof window !== 'undefined' ? window : globalThis);
