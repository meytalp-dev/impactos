/* ============================================================
   _shared.js — cross-module studio shared state, modal, toast.
   Owned by Studio-UI agent. Pipeline agent may read but not edit.
   ============================================================ */
(function () {
  'use strict';

  const initialDraft = () => ({
    item_id: null,
    island_id: null,
    mechanic: null,
    letter: null,
    distractors: [],
    custom_words: [],
    sort_groups: [],
    prompt_text: '',
    challenge: null,
    audio_url: ''
  });

  const state = {
    step: 1,
    draft: initialDraft(),
    errors: [],
    warnings: [],
    isSaving: false,
    lastSavedId: null
  };

  const subscribers = new Set();

  function emit() {
    subscribers.forEach(fn => {
      try { fn(state); } catch (e) { console.error('studio subscriber', e); }
    });
  }

  function get() {
    return state;
  }

  function set(patch) {
    Object.assign(state, patch);
    emit();
  }

  function patchDraft(patch) {
    state.draft = Object.assign({}, state.draft, patch);
    emit();
  }

  function resetDraft() {
    state.draft = initialDraft();
    state.errors = [];
    state.warnings = [];
    state.step = 1;
    state.lastSavedId = null;
    state.isSaving = false;
    emit();
  }

  function subscribe(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  }

  function showToast(message, kind) {
    const host = document.getElementById('studioToastHost');
    if (!host) return;
    const t = document.createElement('div');
    t.className = `studio-toast${kind ? ' is-' + kind : ''}`;
    t.textContent = message;
    host.appendChild(t);
    setTimeout(() => {
      t.style.transition = 'opacity .25s';
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 250);
    }, 2600);
  }

  function openModal(node) {
    const host = document.getElementById('studioModalHost');
    if (!host) return null;
    host.innerHTML = '';
    host.hidden = false;
    const shell = document.createElement('div');
    shell.className = 'studio-modal';
    shell.setAttribute('role', 'dialog');
    shell.setAttribute('aria-modal', 'true');
    if (typeof node === 'string') {
      shell.innerHTML = node;
    } else if (node instanceof Node) {
      shell.appendChild(node);
    }
    host.appendChild(shell);

    const closeOnBackdrop = (e) => { if (e.target === host) closeModal(); };
    const closeOnEsc = (e) => { if (e.key === 'Escape') closeModal(); };
    host.addEventListener('click', closeOnBackdrop);
    document.addEventListener('keydown', closeOnEsc, { once: true });
    return shell;
  }

  function closeModal() {
    const host = document.getElementById('studioModalHost');
    if (!host) return;
    host.hidden = true;
    host.innerHTML = '';
  }

  window.StudioState = {
    get, set, patchDraft, resetDraft, subscribe,
    showToast, openModal, closeModal
  };
})();
