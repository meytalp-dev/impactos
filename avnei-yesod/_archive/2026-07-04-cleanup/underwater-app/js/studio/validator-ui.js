/* ============================================================
   validator-ui.js — Hebrew error rendering
   ------------------------------------------------------------
   Takes errors from AvneiStudioPipeline.validateContent() and shows
   pedagogical Hebrew messages — never error codes to the teacher.
   ============================================================ */
(function () {
  'use strict';

  // Map of error codes → pedagogical Hebrew copy.
  // Pipeline agent's validateContent() may return codes; we map them here.
  // For codes we don't know, we fall back to err.hebrew or a generic message.
  const ERROR_HEBREW = {
    missing_letter: {
      title: 'שכחת לציין על איזו אות התרגיל מתמקד',
      body: 'בלי לדעת איזו אות — לא נוכל להגיד לך אם הילדה חזקה או חלשה באות הזאת.',
      fix: 'חזרי לשלב 2 ובחרי אות מהרשימה.',
      jumpField: 'letter',
      jumpStep: 2
    },
    missing_mechanic: {
      title: 'לא נבחר סוג משחק',
      body: 'בלי סוג משחק לא נוכל לבנות פריט. כל אי תומך בכמה סוגים שונים.',
      fix: 'חזרי לשלב 1 ובחרי סוג משחק.',
      jumpStep: 1
    },
    missing_island: {
      title: 'לא נבחר אי',
      body: 'בחרי קודם אי מהמפה — כל אי הוא יחידת תוכן עצמאית.',
      fix: 'חזרי לשלב 1 ובחרי אי.',
      jumpStep: 1
    },
    missing_audio: {
      title: 'חסר אודיו לפריט',
      body: 'ילדה בכיתה א\' לא תמיד יודעת לקרוא — האודיו הוא איך שהיא תבין את השאלה.',
      fix: 'הוסיפי טקסט שאלה ולחצי "צרי אודיו".',
      jumpField: 'prompt_text',
      jumpStep: 2
    },
    distractors_too_few: {
      title: 'מעט מדי אותיות מסיחות',
      body: 'בלי אותיות מסיחות הילדה תוכל לנחש לפי תהליך הפסילה. כדי שנדע באמת אם היא שולטת באות — צריך לפחות 3 מסיחות.',
      fix: 'הוסיפי עוד אותיות לאזור המסיחות.',
      jumpField: 'distractors',
      jumpStep: 2
    },
    distractors_too_similar: {
      title: 'המסיחות שבחרת קלות מדי',
      body: 'הצלחה של 100% לא תלמד אותנו כלום. כדאי להכניס אותיות שמתבלבלות עם אות היעד (לדוגמה: ב/ו, ר/ד, ג/נ).',
      fix: 'הוסיפי לפחות מסיחה אחת שדומה לאות היעד.',
      jumpField: 'distractors',
      jumpStep: 2
    },
    niqud_violation_bgd_kpt: {
      title: 'ניקוד: ב/כ/פ בתחילת הברה דורשים דגש קל',
      body: 'אם תכתבי "בַ" במקום "בַּ" — אברי יבטא /va/ במקום /ba/, והילדה תתבלבל.',
      fix: 'הוסיפי דגש (נקודה בתוך האות) ל-ב, כ, פ כשהן בתחילת הברה.',
      jumpStep: 2
    },
    niqud_missing: {
      title: 'הטקסט לא מנוקד',
      body: 'מסכי תלמיד.ה בכיתה א\' חייבים להיות מנוקדים — בלי ניקוד הילדה לא תוכל לקרוא לבד.',
      fix: 'לחצי על הכפתור "🟡 נקדי לי" ליד שדה הטקסט.',
      jumpField: 'prompt_text',
      jumpStep: 2
    },
    pairs_too_few: {
      title: 'מעט מדי זוגות',
      body: 'משחק זיכרון עם פחות מ-4 זוגות לא יוצר אתגר מספיק.',
      fix: 'הוסיפי עוד זוגות (עד 6).',
      jumpStep: 2
    },
    groups_too_few: {
      title: 'מעט מדי קבוצות מיון',
      body: 'משחק מיון דורש לפחות 2 קבוצות — אחרת אין מה למיין.',
      fix: 'הוסיפי עוד קבוצה.',
      jumpStep: 2
    },
    too_few_items_in_pack: {
      title: 'מעט מדי פריטים — לא יספיק לסשן',
      body: 'סשן ילדה רגיל = 8—12 פריטים. בנית פחות.',
      fix: 'בנייה חדשה מאותה אות עם מסיחות שונות תעזור — תוכלי להוסיף ככה עוד פריטים.',
      jumpStep: 3
    }
  };

  const GENERIC = {
    title: 'משהו דורש תשומת לב',
    body: 'בדקי את הפרטים בשלב 2 ונסי שוב.',
    fix: ''
  };

  function lookup(err) {
    const map = ERROR_HEBREW[err.code];
    if (map) return map;
    return {
      title: err.hebrew || GENERIC.title,
      body: '',
      fix: GENERIC.fix
    };
  }

  function showErrors(errors) {
    if (!errors || !errors.length) return;
    const hardErrors = errors.filter(e => e.severity !== 'warning');
    const warnings = errors.filter(e => e.severity === 'warning');

    const list = document.createElement('div');
    list.innerHTML = `
      <h3 class="studio-modal-title">${hardErrors.length ? 'משהו חסר' : 'דברים שכדאי לבדוק'}</h3>
      <div class="studio-modal-body">
        <p>${hardErrors.length
          ? 'לא נוכל להתקדם עד שתתקני את הדברים האלה:'
          : 'הפריט תקין, אבל הנה כמה דברים שמומלץ לתקן:'}</p>
        <ul class="error-list" id="errListHost">
          ${[...hardErrors, ...warnings].map((err, idx) => {
            const x = lookup(err);
            return `
              <li class="error-item ${err.severity === 'warning' ? 'is-warn' : ''}">
                <p class="error-item-title">${x.title}</p>
                ${x.body ? `<p class="error-item-body">${x.body}</p>` : ''}
                ${x.fix ? `<p class="error-item-fix">איך לתקן: ${x.fix}</p>` : ''}
                ${(x.jumpStep || x.jumpField) ? `<button class="error-item-fix-link" data-jump-idx="${idx}" type="button">קחי אותי לתיקון ←</button>` : ''}
              </li>
            `;
          }).join('')}
        </ul>
      </div>
      <div class="studio-modal-actions">
        <button class="btn-primary" id="errClose" type="button">סגרי</button>
      </div>
    `;
    window.StudioState.openModal(list);

    const allErrors = [...hardErrors, ...warnings];
    list.querySelectorAll('[data-jump-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-jump-idx'));
        const e = allErrors[idx];
        const x = lookup(e);
        window.StudioState.closeModal();
        if (x.jumpStep) window.StudioState.set({ step: x.jumpStep });
        if (x.jumpField) {
          setTimeout(() => {
            const el = document.querySelector(`[data-field="${x.jumpField}"]`);
            if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
          }, 60);
        }
      });
    });
    list.querySelector('#errClose').addEventListener('click', () => window.StudioState.closeModal());
  }

  /* Inline field cues (green/red border).
     Called from wizard re-render via subscribe. */
  function applyInlineCues() {
    const { draft } = window.StudioState.get();
    const wiz = document.getElementById('studioWizard');
    if (!wiz) return;
    const validation = window.AvneiStudioPipeline.validateContent(draft);
    const fields = new Set(validation.errors.map(e => e.field));

    wiz.querySelectorAll('.form-input, .form-textarea, .form-select').forEach(input => {
      const f = input.getAttribute('data-field');
      if (!f) return;
      input.classList.remove('is-error', 'is-valid');
      if (fields.has(f)) {
        input.classList.add('is-error');
      } else if (input.value && input.value.trim()) {
        input.classList.add('is-valid');
      }
    });
  }

  // Subscribe so cues update on every state change (debounced lightly).
  let cueTimer = null;
  function init() {
    if (!window.StudioState) return;
    window.StudioState.subscribe(() => {
      clearTimeout(cueTimer);
      cueTimer = setTimeout(applyInlineCues, 80);
    });
  }

  window.StudioValidatorUI = { showErrors, applyInlineCues };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
