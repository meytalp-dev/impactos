// ============================================================
// templates/mechanic-quest.js — Polymorphic 5-stage quest mechanic
//
// Extracted from stage-3-shell.html (אות מ) and stage-3-house.html
// (אות ב). The mechanic runs 5 sequential stages, each one a different
// activity from js/activities/* (sound-match, letter-shape A/B, find-
// letter). On completion of each stage the child collects one unit
// (key/brick/etc.) → onUnitWon. After 5 stages → onComplete.
//
// Stage queue defaults match shell/house (the proven mix):
//   1. soundMatch    2. letterShape A    3. findLetter
//   4. letterShape B 5. soundMatch
//
// Data sources (same JSON files the 5 existing games use):
//   data/island-03-items.json         → soundMatch items
//   data/island-03-letter-shape.json  → letterShape A/B items
//   data/island-03-find-letter.json   → findLetter items
//
// Items are filtered by letter at load time. If a stage has no matching
// items the mechanic falls back to another soundMatch item (matches the
// fallback behavior in shell/house).
// ============================================================

window.AvneiMechanics = window.AvneiMechanics || {};

window.AvneiMechanics['quest'] = (function () {

  const DEFAULT_STAGES = [
    { activity: 'soundMatch',  variant: null },
    { activity: 'letterShape', variant: 'A'  },
    { activity: 'findLetter',  variant: null },
    { activity: 'letterShape', variant: 'B'  },
    { activity: 'soundMatch',  variant: null },
  ];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  async function loadData(letter, cfg) {
    const itemsPath = cfg.itemsPath        || 'data/island-03-items.json';
    const shapePath = cfg.letterShapePath  || 'data/island-03-letter-shape.json';
    const findPath  = cfg.findLetterPath   || 'data/island-03-find-letter.json';

    const [items03, shapeData, findData] = await Promise.all([
      fetch(itemsPath).then(r => r.json()).catch(() => ({ items: [] })),
      fetch(shapePath).then(r => r.json()).catch(() => ({ items: [] })),
      fetch(findPath).then(r => r.json()).catch(() => ({ items: [] })),
    ]);

    return {
      soundMatchItems:    (items03.items || []).filter(it => it.letter_in_focus === letter),
      letterShapeAItems:  (shapeData.items || []).filter(it => it.letter === letter && it.variant === 'A'),
      letterShapeBItems:  (shapeData.items || []).filter(it => it.letter === letter && it.variant === 'B'),
      findLetterItems:    (findData.items || []).filter(it => it.target_letter === letter),
    };
  }

  function mount(root, opts) {
    const letter = opts.letter;
    const total  = opts.total || 5;
    const cfg    = opts.mechanicConfig || {};
    const stages = cfg.stages || DEFAULT_STAGES;

    root.innerHTML = '';
    root.classList.add('mechanic-quest');

    const state = {
      pool: { sm: [], lsA: [], lsB: [], fl: [] },
      stageIdx: 0,
      wins: 0,
      currentActivity: null,
    };

    function getStageItems(stage) {
      if (stage.activity === 'soundMatch') {
        const next = state.pool.sm.shift();
        return next ? [next] : [];
      }
      if (stage.activity === 'letterShape' && stage.variant === 'A') {
        return state.pool.lsA.length ? [state.pool.lsA[0]] : [];
      }
      if (stage.activity === 'letterShape' && stage.variant === 'B') {
        return state.pool.lsB.length ? [state.pool.lsB[0]] : [];
      }
      if (stage.activity === 'findLetter') {
        return state.pool.fl.length
          ? [state.pool.fl[Math.floor(Math.random() * state.pool.fl.length)]]
          : [];
      }
      return [];
    }

    function getActivity(name) {
      if (name === 'soundMatch')  return window.AvneiSoundMatch;
      if (name === 'letterShape') return window.AvneiLetterShape;
      if (name === 'findLetter')  return window.AvneiFindLetter;
      return null;
    }

    function runStage(stage) {
      return new Promise((resolve) => {
        const activity = getActivity(stage.activity);
        if (!activity) {
          console.warn('mechanic-quest: missing activity', stage.activity);
          return resolve({ skipped: true });
        }
        let items = getStageItems(stage);
        if (items.length === 0 && state.pool.sm.length > 0) {
          // Fallback to next sound-match item (matches shell/house behavior)
          const fb = state.pool.sm.shift();
          items = [fb];
          stage = { activity: 'soundMatch', variant: null };
        }
        if (items.length === 0) return resolve({ skipped: true });

        const realActivity = getActivity(stage.activity);
        state.currentActivity = realActivity;
        realActivity.mount(root, {
          letter,
          supportLevel: 1,
          variant: stage.variant,
          items,
          onItemComplete: () => {},
          onActivityComplete: (summary) => {
            realActivity.unmount();
            state.currentActivity = null;
            resolve(summary || {});
          },
        });
      });
    }

    async function runAll() {
      try {
        const data = await loadData(letter, cfg);
        state.pool = {
          sm:  shuffle(data.soundMatchItems),
          lsA: data.letterShapeAItems.slice(),
          lsB: data.letterShapeBItems.slice(),
          fl:  data.findLetterItems.slice(),
        };
      } catch (e) {
        console.error('mechanic-quest: failed to load data', e);
        return;
      }

      for (let i = 0; i < total; i++) {
        state.stageIdx = i;
        const result = await runStage(stages[i] || stages[stages.length - 1]);
        if (result && result.skipped) continue;

        opts.onUnitWon && opts.onUnitWon(state.wins);
        state.wins++;

        if (state.wins < total) {
          await new Promise(r => setTimeout(r, 2400));
        }
      }

      if (state.wins >= total) {
        setTimeout(() => opts.onComplete && opts.onComplete(), 800);
      } else {
        console.warn('mechanic-quest: insufficient stages completed', state.wins);
        opts.onComplete && opts.onComplete();
      }
    }

    runAll();

    return {
      unmount() {
        if (state.currentActivity && state.currentActivity.unmount) {
          state.currentActivity.unmount();
        }
        root.innerHTML = '';
        root.classList.remove('mechanic-quest');
      },
    };
  }

  return { mount };
})();
