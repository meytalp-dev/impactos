/* ============================================================
   wizard.js — 3-step wizard for Teacher Content Studio
   Steps:
     1. בחירת אי + משחק
     2. תוכן (תלוי במכניקה)
     3. סקירה ושמירה
   ============================================================ */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const root = () => $('studioWizard');

  const HEBREW_LETTERS = [
    'א','ב','ג','ד','ה','ו','ז','ח','ט','י',
    'כ','ל','מ','נ','ס','ע','פ','צ','ק','ר','ש','ת'
  ];
  const HEBREW_FINALS = ['ך','ם','ן','ף','ץ'];

  const MECH_DESC = {
    'tap-all': 'הילדה רואה כמה אותיות במסך ומקישה על כל אות היעד שהיא רואה',
    'pick': 'הילדה שומעת שאלה ובוחרת תשובה אחת מתוך 4 אפשרויות',
    'memory-pair': 'מציאת זוגות תואמים (אות ↔ צליל / מילה ↔ תמונה)',
    'sort-by-letter': 'גרירת פריטים לקבוצות לפי האות שמתחילה את המילה'
  };
  const MECH_ICON = {
    'tap-all': '👆', 'pick': '🎯', 'memory-pair': '🃏', 'sort-by-letter': '📚'
  };

  const STEP_LABELS = {
    1: 'בוחרת אי ומשחק',
    2: 'ממלאת תוכן',
    3: 'סוקרת ושומרת'
  };

  function renderProgress() {
    const { step } = window.StudioState.get();
    return `
      <div class="wizard-progress">
        ${[1, 2, 3].map((n) => {
          const cls = n === step ? 'is-current' : (n < step ? 'is-done' : '');
          return `
            <div class="wizard-progress-step ${cls}">
              <span class="wizard-progress-num">${n}</span>
              <span class="wizard-progress-label">${STEP_LABELS[n]}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /* ============================================================
     Step 1 — choose island + mechanic
     ============================================================ */
  function renderStep1() {
    const { draft } = window.StudioState.get();
    const islands = window.AvneiStudioPipeline.getAvailableIslands();
    const sel = islands.find(x => x.id === draft.island_id);
    const mechanicsOfIsland = sel ? sel.mechanics_supported : [];

    return `
      <div class="wizard-step-header">
        <h2 class="wizard-step-title">איזה אי? איזה משחק?</h2>
        <p class="wizard-step-help">
          בחרי אי שמתאים לתוכן שאת רוצה ללמד, ואז את סוג המשחק.
          כל אי תומך בכמה סוגי משחקים. <a href="#" class="field-help-btn" data-help="island">איך לבחור?</a>
        </p>
      </div>

      <div class="section-divider">איים זמינים</div>
      <div class="island-grid">
        ${islands.map(isl => `
          <button class="island-card ${draft.island_id === isl.id ? 'is-selected' : ''}" data-island="${isl.id}" type="button">
            <div class="island-card-num">${isl.id}</div>
            <div class="island-card-name">${isl.name_he}</div>
            <div class="island-card-mech">${isl.mechanics_supported.length} סוגי משחק</div>
          </button>
        `).join('')}
      </div>

      ${sel ? `
        <div class="section-divider">סוג משחק — אי ${sel.id} ${sel.name_he}</div>
        <div class="mechanic-grid">
          ${mechanicsOfIsland.map(m => `
            <button class="mechanic-card ${draft.mechanic === m ? 'is-selected' : ''}" data-mechanic="${m}" type="button">
              <div class="mechanic-card-icon">${MECH_ICON[m] || '🎮'}</div>
              <div class="mechanic-card-name">${window.AvneiStudioPipeline.getMechanicLabel(m)}</div>
              <div class="mechanic-card-desc">${MECH_DESC[m] || ''}</div>
            </button>
          `).join('')}
        </div>
      ` : ''}
    `;
  }

  function bindStep1() {
    root().querySelectorAll('[data-island]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-island'));
        const isl = window.AvneiStudioPipeline.getAvailableIslands().find(x => x.id === id);
        const draftPatch = { island_id: id };
        // Reset mechanic if not supported by new island
        const current = window.StudioState.get().draft.mechanic;
        if (current && isl && !isl.mechanics_supported.includes(current)) {
          draftPatch.mechanic = null;
        }
        window.StudioState.patchDraft(draftPatch);
      });
    });
    root().querySelectorAll('[data-mechanic]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mech = btn.getAttribute('data-mechanic');
        const cur = window.StudioState.get().draft;
        const patch = { mechanic: mech };
        if (mech === 'memory-pair' && (!cur.custom_words || !cur.custom_words.length)) {
          patch.custom_words = [
            { a: '', b: '' }, { a: '', b: '' }, { a: '', b: '' }, { a: '', b: '' }
          ];
        }
        if (mech === 'sort-by-letter' && (!cur.sort_groups || !cur.sort_groups.length)) {
          patch.sort_groups = [
            { letter: '', items: [] }, { letter: '', items: [] }
          ];
        }
        window.StudioState.patchDraft(patch);
      });
    });
    root().querySelectorAll('[data-help]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        showHelp(a.getAttribute('data-help'));
      });
    });
  }

  function showHelp(topic) {
    const helpText = {
      island: {
        title: 'איך לבחור אי?',
        body: `
          <p>כל אי במפת אבני יסוד הוא יחידת תוכן עצמאית:</p>
          <ul style="padding-right:18px;margin:0 0 12px;">
            <li><strong>אי 1</strong> — בועות (זיהוי קצוות מילה)</li>
            <li><strong>אי 2</strong> — מודעות פונולוגית (חרוז, צליל פותח)</li>
            <li><strong>אי 3</strong> — הכרת אותיות (זיהוי אות בודדת)</li>
            <li><strong>אי 4</strong> — הברות (CV — אות + תנועה)</li>
            <li><strong>אי 5</strong> — מילים שלמות</li>
            <li><strong>אי 14</strong> — הבנת הנשמע</li>
          </ul>
          <p>אם לא בטוחה — בחרי את האי שהילדות שלך נמצאות בו עכשיו.</p>
        `
      },
      letter: {
        title: 'מהי אות יעד?',
        body: `<p>זו האות שהילדה אמורה לזהות, ללחוץ עליה, או לדעת לבחור. כל פריט מתמקד באות אחת — כך נוכל לעקוב אם הילדה שולטת בה.</p>`
      },
      distractors: {
        title: 'מהן אותיות מסיחות?',
        body: `
          <p>אלה האותיות האחרות שמופיעות במסך לצד אות היעד.</p>
          <p>בחירת מסיחות חכמה = שמדמות בלבול אמיתי (למשל: ב/ו, ר/ד, ג/נ). אם המסיחות קלות מדי — הילדה תצליח גם בלי באמת לדעת את האות.</p>
        `
      },
      challenge: {
        title: 'מה זה ניקוד / בלי ניקוד?',
        body: `<p>אם בחרת "עם ניקוד" — האותיות במסך יופיעו עם תנועה (פתח, חיריק וכו'). זה מקל. "בלי ניקוד" = רק שלד האות.</p>`
      }
    }[topic];
    if (!helpText) return;
    const node = document.createElement('div');
    node.innerHTML = `
      <h3 class="studio-modal-title">${helpText.title}</h3>
      <div class="studio-modal-body">${helpText.body}</div>
      <div class="studio-modal-actions">
        <button class="btn-primary" type="button" id="closeHelp">הבנתי</button>
      </div>
    `;
    window.StudioState.openModal(node);
    node.querySelector('#closeHelp').addEventListener('click', () => window.StudioState.closeModal());
  }

  /* ============================================================
     Step 2 — content (mechanic-dependent)
     ============================================================ */
  function renderStep2() {
    const { draft } = window.StudioState.get();
    if (!draft.mechanic) {
      return `
        <div class="wizard-step-header">
          <h2 class="wizard-step-title">תוכן</h2>
          <p class="wizard-step-help">חזרי לשלב 1 ובחרי משחק.</p>
        </div>
      `;
    }
    const label = window.AvneiStudioPipeline.getMechanicLabel(draft.mechanic);

    return `
      <div class="wizard-step-header">
        <h2 class="wizard-step-title">תוכן: ${label}</h2>
        <p class="wizard-step-help">מלאי את הפרטים. תוכלי לראות את התרגיל בתצוגה המקדימה מימין בעת ההקלדה.</p>
      </div>
      ${renderMechanicForm(draft.mechanic)}
    `;
  }

  function letterSelect(name, value, opts) {
    const includeFinals = opts && opts.includeFinals;
    return `
      <select class="form-select" data-field="${name}">
        <option value="">— בחרי אות —</option>
        ${HEBREW_LETTERS.map(l => `<option value="${l}" ${value === l ? 'selected' : ''}>${l}</option>`).join('')}
        ${includeFinals ? `
          <optgroup label="אותיות סופיות">
            ${HEBREW_FINALS.map(l => `<option value="${l}" ${value === l ? 'selected' : ''}>${l}</option>`).join('')}
          </optgroup>
        ` : ''}
      </select>
    `;
  }

  function distractorChips(value) {
    const list = Array.isArray(value) ? value : [];
    const suggested = HEBREW_LETTERS.filter(l => !list.includes(l)).slice(0, 8);
    return `
      <div class="chip-input" data-chip-input>
        ${list.map(c => `
          <span class="chip">${c}<button class="chip-remove" data-chip-remove="${c}" type="button" aria-label="הסירי ${c}">×</button></span>
        `).join('')}
        <input class="chip-input-field" type="text" maxlength="2" placeholder="הקלידי אות והקישי Enter" data-chip-add>
      </div>
      <div class="chip-suggestions">
        <span style="font-size:12px;color:var(--studio-text-muted);align-self:center;margin-left:6px;">מסיחות נפוצות:</span>
        ${suggested.map(l => `<button class="chip-suggest" data-chip-suggest="${l}" type="button">${l}</button>`).join('')}
      </div>
    `;
  }

  function renderMechanicForm(mech) {
    const { draft } = window.StudioState.get();
    if (mech === 'tap-all') {
      return `
        <div class="form-row">
          <label class="form-label">אות יעד <button class="field-help-btn" data-help="letter" type="button">?</button></label>
          <span class="form-label-help">האות שהילדה צריכה לזהות בכל הבועות במסך.</span>
          ${letterSelect('letter', draft.letter)}
        </div>

        <div class="form-row">
          <label class="form-label">אותיות מסיחות <button class="field-help-btn" data-help="distractors" type="button">?</button></label>
          <span class="form-label-help">3—5 אותיות אחרות שיופיעו בבועות. הוסיפי אות אחת או יותר שמתבלבלות עם אות היעד.</span>
          ${distractorChips(draft.distractors)}
        </div>

        <div class="form-row">
          <label class="form-label">דרגת אתגר <button class="field-help-btn" data-help="challenge" type="button">?</button></label>
          <div style="display:flex;gap:8px;">
            <button class="btn-secondary ${draft.challenge === 'with-niqud' ? 'is-selected' : ''}" data-challenge="with-niqud" type="button" style="${draft.challenge === 'with-niqud' ? 'background:var(--studio-accent-soft);border-color:var(--studio-accent);color:var(--studio-accent);' : ''}">עם ניקוד</button>
            <button class="btn-secondary ${draft.challenge === 'without-niqud' ? 'is-selected' : ''}" data-challenge="without-niqud" type="button" style="${draft.challenge === 'without-niqud' ? 'background:var(--studio-accent-soft);border-color:var(--studio-accent);color:var(--studio-accent);' : ''}">בלי ניקוד</button>
          </div>
        </div>
      `;
    }

    if (mech === 'pick') {
      return `
        <div class="form-row">
          <label class="form-label">אות יעד <button class="field-help-btn" data-help="letter" type="button">?</button></label>
          ${letterSelect('letter', draft.letter)}
        </div>

        <div class="form-row">
          <label class="form-label">טקסט שאלה שיישמע לילדה</label>
          <span class="form-label-help">לדוגמה: "איזו אות זאת?" — הילדה תשמע את זה בקול אברי לפני הבחירה.</span>
          <div class="form-input-wrap">
            <input class="form-input" type="text" data-field="prompt_text" value="${escAttr(draft.prompt_text || '')}" placeholder="הקלידי שאלה...">
            <button class="niqud-btn" data-niqud="prompt_text" type="button">🟡 נקדי לי</button>
          </div>
        </div>

        <div class="form-row">
          <label class="form-label">אופציות מסיחות <button class="field-help-btn" data-help="distractors" type="button">?</button></label>
          <span class="form-label-help">3 אותיות מסיחות (סה"כ 4 אופציות עם האות הנכונה).</span>
          ${distractorChips(draft.distractors)}
        </div>
      `;
    }

    if (mech === 'memory-pair') {
      const pairs = (draft.custom_words && draft.custom_words.length) ? draft.custom_words : [
        { a: '', b: '' }, { a: '', b: '' }, { a: '', b: '' }, { a: '', b: '' }
      ];
      return `
        <div class="form-row">
          <label class="form-label">אות יעד (אופציונלי)</label>
          <span class="form-label-help">אם כל הזוגות מתמקדים באות אחת — בחרי. אחרת — השאירי ריק.</span>
          ${letterSelect('letter', draft.letter)}
        </div>

        <div class="form-row">
          <label class="form-label">זוגות (4—6)</label>
          <span class="form-label-help">בכל שורה — שני פריטים שצריך להתאים זה לזה (לדוגמה: אות + תמונה, או מילה + צליל).</span>
          <div id="pairsHost">
            ${pairs.map((p, i) => `
              <div class="pair-row" data-pair-idx="${i}">
                <input class="form-input" type="text" data-pair-field="a" data-pair-idx="${i}" value="${escAttr(p.a || '')}" placeholder="פריט א'">
                <input class="form-input" type="text" data-pair-field="b" data-pair-idx="${i}" value="${escAttr(p.b || '')}" placeholder="פריט ב'">
                <button class="row-remove-btn" data-pair-remove="${i}" type="button" aria-label="הסירי שורה">×</button>
              </div>
            `).join('')}
          </div>
          <button class="row-add-btn" id="addPairBtn" type="button">+ הוסיפי זוג</button>
        </div>
      `;
    }

    if (mech === 'sort-by-letter') {
      const groups = (draft.sort_groups && draft.sort_groups.length) ? draft.sort_groups : [
        { letter: '', items: [] }, { letter: '', items: [] }
      ];
      return `
        <div class="form-row">
          <label class="form-label">קבוצות מיון (2—4)</label>
          <span class="form-label-help">לכל קבוצה — אות הקבוצה והפריטים שמתחילים באות הזאת.</span>
          <div id="groupsHost">
            ${groups.map((g, i) => `
              <div class="sort-group" data-group-idx="${i}">
                <div class="sort-group-head">
                  <span style="font-size:12px;color:var(--studio-text-muted);min-width:60px;">אות:</span>
                  ${letterSelect(`group-letter-${i}`, g.letter)}
                  <button class="row-remove-btn" data-group-remove="${i}" type="button" aria-label="הסירי קבוצה">×</button>
                </div>
                <input class="form-input" type="text" data-group-items="${i}" value="${escAttr((g.items || []).join(', '))}" placeholder="פריטים מופרדים בפסיק">
              </div>
            `).join('')}
          </div>
          <button class="row-add-btn" id="addGroupBtn" type="button">+ הוסיפי קבוצה</button>
        </div>
      `;
    }

    return `<p>סוג משחק לא מזוהה. חזרי לשלב 1.</p>`;
  }

  function escAttr(s) {
    return String(s).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function bindStep2() {
    const r = root();

    r.querySelectorAll('[data-field]').forEach(input => {
      input.addEventListener('input', () => {
        const field = input.getAttribute('data-field');
        window.StudioState.patchDraft({ [field]: input.value });
      });
    });

    // Distractor chips
    r.querySelectorAll('[data-chip-input]').forEach(host => {
      const field = host.querySelector('[data-chip-add]');
      if (field) {
        field.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const v = field.value.trim();
            if (v) addDistractor(v);
            field.value = '';
          } else if (e.key === 'Backspace' && !field.value) {
            const list = window.StudioState.get().draft.distractors.slice();
            list.pop();
            window.StudioState.patchDraft({ distractors: list });
          }
        });
      }
      host.querySelectorAll('[data-chip-remove]').forEach(btn => {
        btn.addEventListener('click', () => {
          const c = btn.getAttribute('data-chip-remove');
          const list = window.StudioState.get().draft.distractors.filter(x => x !== c);
          window.StudioState.patchDraft({ distractors: list });
        });
      });
    });
    r.querySelectorAll('[data-chip-suggest]').forEach(btn => {
      btn.addEventListener('click', () => {
        addDistractor(btn.getAttribute('data-chip-suggest'));
      });
    });

    // Niqud buttons
    r.querySelectorAll('[data-niqud]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const field = btn.getAttribute('data-niqud');
        const input = r.querySelector(`[data-field="${field}"]`);
        if (!input || !input.value.trim()) {
          window.StudioState.showToast('אין טקסט לנקד', 'warn');
          return;
        }
        btn.classList.add('is-loading');
        btn.textContent = '⏳ מנקדת...';
        try {
          const niqud = await window.AvneiStudioPipeline.applyNiqud(input.value);
          input.value = niqud;
          window.StudioState.patchDraft({ [field]: niqud });
          window.StudioState.showToast('נוקד!', 'success');
        } catch (e) {
          window.StudioState.showToast('הניקוד נכשל — נסי שוב', 'error');
        } finally {
          btn.classList.remove('is-loading');
          btn.innerHTML = '🟡 נקדי לי';
        }
      });
    });

    // Challenge toggles
    r.querySelectorAll('[data-challenge]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.StudioState.patchDraft({ challenge: btn.getAttribute('data-challenge') });
      });
    });

    // Pair builder
    r.querySelectorAll('[data-pair-field]').forEach(input => {
      input.addEventListener('input', () => {
        const idx = Number(input.getAttribute('data-pair-idx'));
        const field = input.getAttribute('data-pair-field');
        const pairs = window.StudioState.get().draft.custom_words.slice();
        pairs[idx] = Object.assign({}, pairs[idx], { [field]: input.value });
        window.StudioState.patchDraft({ custom_words: pairs });
      });
    });
    r.querySelectorAll('[data-pair-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-pair-remove'));
        const pairs = window.StudioState.get().draft.custom_words.slice();
        pairs.splice(idx, 1);
        window.StudioState.patchDraft({ custom_words: pairs });
      });
    });
    const addPair = r.querySelector('#addPairBtn');
    if (addPair) {
      addPair.addEventListener('click', () => {
        const pairs = window.StudioState.get().draft.custom_words.slice();
        if (pairs.length >= 6) {
          window.StudioState.showToast('מקסימום 6 זוגות', 'warn');
          return;
        }
        pairs.push({ a: '', b: '' });
        window.StudioState.patchDraft({ custom_words: pairs });
      });
    }

    // Group builder
    r.querySelectorAll('[data-field^="group-letter-"]').forEach(sel => {
      sel.addEventListener('change', () => {
        const idx = Number(sel.getAttribute('data-field').split('-').pop());
        const groups = window.StudioState.get().draft.sort_groups.slice();
        groups[idx] = Object.assign({}, groups[idx], { letter: sel.value });
        window.StudioState.patchDraft({ sort_groups: groups });
      });
    });
    r.querySelectorAll('[data-group-items]').forEach(input => {
      input.addEventListener('input', () => {
        const idx = Number(input.getAttribute('data-group-items'));
        const items = input.value.split(',').map(s => s.trim()).filter(Boolean);
        const groups = window.StudioState.get().draft.sort_groups.slice();
        groups[idx] = Object.assign({}, groups[idx], { items });
        window.StudioState.patchDraft({ sort_groups: groups });
      });
    });
    r.querySelectorAll('[data-group-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-group-remove'));
        const groups = window.StudioState.get().draft.sort_groups.slice();
        groups.splice(idx, 1);
        window.StudioState.patchDraft({ sort_groups: groups });
      });
    });
    const addGroup = r.querySelector('#addGroupBtn');
    if (addGroup) {
      addGroup.addEventListener('click', () => {
        const groups = window.StudioState.get().draft.sort_groups.slice();
        if (groups.length >= 4) {
          window.StudioState.showToast('מקסימום 4 קבוצות', 'warn');
          return;
        }
        groups.push({ letter: '', items: [] });
        window.StudioState.patchDraft({ sort_groups: groups });
      });
    }

    // Help links
    r.querySelectorAll('[data-help]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        showHelp(a.getAttribute('data-help'));
      });
    });
  }

  function addDistractor(letter) {
    const list = window.StudioState.get().draft.distractors.slice();
    if (list.includes(letter) || list.length >= 5) return;
    list.push(letter);
    window.StudioState.patchDraft({ distractors: list });
  }

  /* ============================================================
     Step 3 — review
     ============================================================ */
  function renderStep3() {
    const { draft } = window.StudioState.get();
    const item = window.AvneiStudioPipeline.autoTag(draft);
    const validation = window.AvneiStudioPipeline.validateContent(item);
    const islands = window.AvneiStudioPipeline.getAvailableIslands();
    const isl = islands.find(x => x.id === draft.island_id);

    const summaryLines = [
      ['אי', isl ? `${isl.id} · ${isl.name_he}` : '—'],
      ['משחק', draft.mechanic ? window.AvneiStudioPipeline.getMechanicLabel(draft.mechanic) : '—'],
      ['אות יעד', draft.letter || '—'],
      ['מסיחות', (draft.distractors || []).join(', ') || '—'],
      ['רמת קושי', draft.challenge === 'with-niqud' ? 'עם ניקוד' : (draft.challenge === 'without-niqud' ? 'בלי ניקוד' : '—')],
      ['שאלת אודיו', draft.prompt_text || '—']
    ];
    if (draft.mechanic === 'memory-pair') {
      summaryLines.push(['זוגות', (draft.custom_words || []).filter(p => p.a && p.b).length + ' זוגות']);
    }
    if (draft.mechanic === 'sort-by-letter') {
      summaryLines.push(['קבוצות מיון', (draft.sort_groups || []).filter(g => g.letter).length + ' קבוצות']);
    }

    const checklistItems = [];
    if (draft.island_id) checklistItems.push({ ok: true, text: 'אי נבחר' });
    else checklistItems.push({ ok: false, text: 'לא נבחר אי' });

    if (draft.mechanic) checklistItems.push({ ok: true, text: `סוג משחק: ${window.AvneiStudioPipeline.getMechanicLabel(draft.mechanic)}` });
    else checklistItems.push({ ok: false, text: 'לא נבחר סוג משחק' });

    validation.errors.forEach(err => {
      checklistItems.push({
        ok: false,
        warn: err.severity === 'warning',
        text: err.hebrew || err.code
      });
    });
    if (validation.valid && checklistItems.every(x => x.ok)) {
      checklistItems.push({ ok: true, text: 'תקין — מוכן לפרסום' });
    }

    return `
      <div class="wizard-step-header">
        <h2 class="wizard-step-title">סקירה ושמירה</h2>
        <p class="wizard-step-help">בדקי שהכל נראה נכון. תוכלי לשמור כטיוטה (לעצמך, בלי לפרסם לכיתה) או לפרסם לילדים.</p>
      </div>

      <div class="review-card">
        <h3 class="review-card-title">תקציר הפריט</h3>
        ${summaryLines.map(([k, v]) => `
          <div class="review-line">
            <span class="review-key">${k}</span>
            <span class="review-val">${v}</span>
          </div>
        `).join('')}
      </div>

      <div class="review-card">
        <h3 class="review-card-title">בדיקת תקינות</h3>
        <ul class="checklist">
          ${checklistItems.map(c => `
            <li class="${c.ok ? 'checklist-ok' : (c.warn ? 'checklist-warn' : 'checklist-err')}">${c.text}</li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  /* ============================================================
     Nav buttons
     ============================================================ */
  function renderNav() {
    const { step, isSaving, draft } = window.StudioState.get();
    const canForward = canMoveForward();
    if (step === 3) {
      return `
        <div class="wizard-nav">
          <button class="btn-secondary" id="navBack" type="button">חזרה</button>
          <div class="wizard-nav-actions">
            <button class="btn-secondary" id="saveDraftBtn" type="button" ${isSaving ? 'disabled' : ''}>
              ${isSaving ? 'שומרת...' : 'שמרי כטיוטה'}
            </button>
            <button class="btn-primary" id="publishBtn" type="button" ${isSaving ? 'disabled' : ''}>
              ${isSaving ? 'מפרסמת...' : 'פרסמי לכיתה'}
            </button>
          </div>
        </div>
      `;
    }
    return `
      <div class="wizard-nav">
        <button class="btn-secondary" id="navBack" type="button" ${step === 1 ? 'disabled' : ''}>חזרה</button>
        <button class="btn-primary" id="navNext" type="button" ${canForward ? '' : 'disabled'}>הלאה</button>
      </div>
    `;
  }

  function canMoveForward() {
    const { step, draft } = window.StudioState.get();
    if (step === 1) return !!draft.island_id && !!draft.mechanic;
    if (step === 2) {
      const item = window.AvneiStudioPipeline.autoTag(draft);
      const r = window.AvneiStudioPipeline.validateContent(item);
      return r.errors.filter(e => e.severity === 'error').length === 0;
    }
    return true;
  }

  function bindNav() {
    const r = root();
    const back = r.querySelector('#navBack');
    if (back) back.addEventListener('click', () => {
      const { step } = window.StudioState.get();
      if (step > 1) window.StudioState.set({ step: step - 1 });
    });
    const next = r.querySelector('#navNext');
    if (next) next.addEventListener('click', goNext);
    const sd = r.querySelector('#saveDraftBtn');
    if (sd) sd.addEventListener('click', () => save({ publish: false }));
    const pb = r.querySelector('#publishBtn');
    if (pb) pb.addEventListener('click', () => save({ publish: true }));
  }

  async function goNext() {
    const { step, draft } = window.StudioState.get();
    if (step === 2) {
      const item = window.AvneiStudioPipeline.autoTag(draft);
      const r = window.AvneiStudioPipeline.validateContent(item);
      if (!r.valid) {
        window.StudioValidatorUI && window.StudioValidatorUI.showErrors(r.errors);
        return;
      }
    }
    if (step < 3) window.StudioState.set({ step: step + 1 });
  }

  async function save({ publish }) {
    const { draft } = window.StudioState.get();
    const item = window.AvneiStudioPipeline.autoTag(draft);
    const v = window.AvneiStudioPipeline.validateContent(item);
    const hardErrors = v.errors.filter(e => e.severity === 'error');
    if (hardErrors.length) {
      window.StudioValidatorUI && window.StudioValidatorUI.showErrors(v.errors);
      return;
    }
    const warnings = v.errors.filter(e => e.severity === 'warning');
    if (warnings.length) {
      const ok = await confirmWarnings(warnings);
      if (!ok) return;
    }

    window.StudioState.set({ isSaving: true });
    try {
      const { id } = await window.AvneiStudioPipeline.saveDraft(item);
      if (publish) {
        await window.AvneiStudioPipeline.publishItem(id);
      }
      window.StudioState.set({ isSaving: false, lastSavedId: id });
      onSaved(publish);
    } catch (e) {
      console.error('save failed', e);
      window.StudioState.set({ isSaving: false });
      window.StudioState.showToast('השמירה נכשלה — נסי שוב', 'error');
    }
  }

  function confirmWarnings(warnings) {
    return new Promise(resolve => {
      const node = document.createElement('div');
      node.innerHTML = `
        <h3 class="studio-modal-title">יש דברים שכדאי לבדוק</h3>
        <div class="studio-modal-body">
          <p>הפריט תקין לשמירה, אבל מצאנו כמה דברים שמומלץ לתקן:</p>
          <ul style="padding-right:18px;margin:8px 0 12px;">
            ${warnings.map(w => `<li>${w.hebrew || w.code}</li>`).join('')}
          </ul>
          <p>לשמור בכל זאת?</p>
        </div>
        <div class="studio-modal-actions">
          <button class="btn-secondary" id="cw-cancel" type="button">לא, אחזור לתקן</button>
          <button class="btn-primary" id="cw-ok" type="button">כן, לשמור בכל זאת</button>
        </div>
      `;
      window.StudioState.openModal(node);
      node.querySelector('#cw-cancel').addEventListener('click', () => { window.StudioState.closeModal(); resolve(false); });
      node.querySelector('#cw-ok').addEventListener('click', () => { window.StudioState.closeModal(); resolve(true); });
    });
  }

  function onSaved(published) {
    const node = document.createElement('div');
    node.innerHTML = `
      <h3 class="studio-modal-title">${published ? 'הפריט פורסם לכיתה!' : 'נשמר כטיוטה'}</h3>
      <div class="studio-modal-body">
        <p>${published
          ? 'הילדים בכיתה שלך יקבלו את הפריט בסשן הבא שלהם. את לא חולקת אותו עם מורות אחרות.'
          : 'הטיוטה נשמרה אצלך. תוכלי להמשיך לערוך אותה מאוחר יותר.'}</p>
      </div>
      <div class="studio-modal-actions">
        <button class="btn-secondary" id="post-back" type="button">חזרה לרשימה</button>
        <button class="btn-primary" id="post-new" type="button">בנייה חדשה</button>
      </div>
    `;
    window.StudioState.openModal(node);
    window.StudioState.showToast(published ? 'פורסם!' : 'נשמר!', 'success');
    node.querySelector('#post-new').addEventListener('click', () => {
      window.StudioState.closeModal();
      window.StudioState.resetDraft();
    });
    node.querySelector('#post-back').addEventListener('click', () => {
      window.StudioState.closeModal();
      // future: list view; for now reset
      window.StudioState.resetDraft();
    });
  }

  /* ============================================================
     Renderer
     Re-render only on STRUCTURAL changes so typing into a text input
     doesn't blow away the input's focus on every keystroke.
     Lightweight updates (nav button enable/disable) happen separately.
     ============================================================ */
  let lastStructural = '';

  function structuralSignature() {
    const s = window.StudioState.get();
    return JSON.stringify({
      step: s.step,
      island_id: s.draft.island_id,
      mechanic: s.draft.mechanic,
      // Count-only — chip add/remove changes structure, typing inside doesn't
      d: (s.draft.distractors || []).length,
      c: (s.draft.custom_words || []).length,
      g: (s.draft.sort_groups || []).length,
      ch: s.draft.challenge,
      sv: s.isSaving,
      ls: s.lastSavedId || '',
      // Step 3 is a pure summary — always re-render on any draft change
      ds: s.step === 3 ? JSON.stringify(s.draft) : ''
    });
  }

  function refreshNavOnly() {
    const r = root();
    if (!r) return;
    const next = r.querySelector('#navNext');
    if (next) next.disabled = !canMoveForward();
  }

  function render() {
    const sig = structuralSignature();
    if (sig === lastStructural) {
      refreshNavOnly();
      return;
    }
    lastStructural = sig;

    const { step } = window.StudioState.get();
    const r = root();
    if (!r) return;

    let body;
    if (step === 1) body = renderStep1();
    else if (step === 2) body = renderStep2();
    else body = renderStep3();

    r.innerHTML = renderProgress() + body + renderNav();

    if (step === 1) bindStep1();
    if (step === 2) bindStep2();
    bindNav();
  }

  function forceRender() {
    lastStructural = '';
    render();
  }

  /* ============================================================
     Bootstrap (runs after defer scripts parsed)
     ============================================================ */
  function init() {
    if (!root()) return;
    window.StudioState.subscribe(render);
    render();

    // Header buttons
    const back = document.getElementById('studioBackBtn');
    if (back) {
      back.addEventListener('click', () => {
        try {
          if (document.referrer && history.length > 1) history.back();
          else location.href = 'teacher-rama.html';
        } catch { location.href = 'teacher-rama.html'; }
      });
    }

    // Teacher name from query param (cloud agent will replace via runtime-mode.js)
    const params = new URLSearchParams(location.search);
    const nameEl = document.getElementById('studioTeacherName');
    if (nameEl) {
      if (params.get('guest') === '1' || params.get('presentation') === '1') {
        nameEl.textContent = 'מצב הדגמה';
      } else if (params.get('teacher')) {
        nameEl.textContent = params.get('teacher');
      } else {
        nameEl.textContent = 'מורה';
      }
    }
  }

  window.StudioWizard = { render, forceRender, init };
  // Defer scripts execute in order; this file runs after _shared.js.
  // Use DOMContentLoaded as a guard so the body is parsed.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
