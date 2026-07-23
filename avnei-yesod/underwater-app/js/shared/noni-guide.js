/* ============================================================================
   noni-guide.js — נוני-מלווה צפה למסע-ההתנסות (סנדבוקס לאינקלו/מעריכים)
   שכבת-על בלבד. מופיעה רק כשהמסע פעיל (?noni=1 או localStorage 'noni-guide'=on).
   משתמשת בנכס הקנוני בלבד (noni-hero-transparent.png — עיניים כחולות-כהות).
   self-contained · לא תלוי · עטוף ב-try/catch · לא נוגע בלוגיקת הדף.
   ============================================================================ */
(function () {
  try {
    var params = new URLSearchParams(location.search);

    // כיבוי מפורש
    if (params.get('noni') === '0' || params.get('noni') === 'off') {
      try { localStorage.removeItem('noni-guide'); } catch (e) {}
      return;
    }
    // הפעלה: פרמטר או דגל שמור (כדי שנוני "תיזכר" בין מסכים)
    var active = params.get('noni') === '1' || (function () {
      try { return localStorage.getItem('noni-guide') === 'on'; } catch (e) { return false; }
    })();
    if (!active) return;
    try { localStorage.setItem('noni-guide', 'on'); } catch (e) {}

    var NONI = 'assets/noni-hero-transparent.png';
    var page = (location.pathname.split('/').pop() || '').toLowerCase();

    // ---- מפת-הקשר: טיפ + הצעד הבא בסיור, פר מסך ----
    var STEPS = {
      'setup.html': {
        hat: 'כובע מנהלת + מורה',
        tip: 'כאן לובשים שני כובעים: קודם מנהלת שמקימה בית ספר וכיתה, ואז מורה שמוסיפה 2־3 תלמידים. קחו את הזמן — אני כאן.',
        next: { label: 'סיימתי — עכשיו לתרגל כתלמיד', href: 'stage-summary-cave-codex.html' }
      },
      'stage-summary-cave-codex.html': {
        hat: 'כובע תלמיד',
        tip: 'זו חוויית־הילד. שחקו קצת — אני מקשיבה בשקט לכל תשובה, בלי מבחן ובלי לחץ.',
        next: { label: 'עכשיו נראה מה המורה קיבלה', href: 'teacher-home-v2.html?open' }
      },
      'teacher-home-v2.html': {
        hat: 'הלולאה נסגרת · מסך המורה',
        tip: 'הנה הלב: כל ילד מנוטר — מי זורם, מי נתקע, ואיפה נשבר. אם הלוח ריק, לחצו "פתיחת תרגול כיתתי".',
        next: { label: 'עכשיו התוכנית השנתית', href: 'teacher-curriculum-v2.html' }
      },
      'teacher-curriculum-v2.html': {
        hat: 'כובע מורה · התוכנית',
        tip: 'זו התוכנית השנתית — מה הכיתה לומדת לאורך השנה. כל ילד מתקדם באותו ציר, בקצב שלו.',
        next: { label: 'ומבט המנהלת על בית הספר', href: 'principal-avnei-v2.html' }
      },
      'principal-avnei-v2.html': {
        hat: 'כובע מנהלת · מבט־על',
        tip: 'וזה מה שהמנהלת רואה: תמונת בית הספר כולו — התקדמות ולאן הולך המענה. זהו, ראיתם את כל הלולאה!',
        next: { label: 'בונוס — השכבה הרגשית (פולס)', href: '../../pulse-grade1/pulse-dashboard.html?seed=1' },
        restart: 'gate-landing.html'
      }
    };
    var cfg = STEPS[page] || { tip: 'אני כאן איתכם לאורך כל ההתנסות 🐙' };

    // ---- סגנון ממודר (ng-) ----
    var css = ''
      + '.ng-root{position:fixed;inset-block-end:16px;inset-inline-start:16px;z-index:2147483000;'
      + 'font-family:"Heebo",system-ui,sans-serif;direction:rtl;display:flex;align-items:flex-end;gap:10px;max-width:min(92vw,420px);}'
      + '.ng-noni{width:74px;height:auto;flex:0 0 auto;cursor:pointer;filter:drop-shadow(0 10px 18px rgba(38,80,92,.28));'
      + 'animation:ng-breathe 4.2s ease-in-out infinite;transform-origin:50% 62%;}'
      + '@keyframes ng-breathe{0%,100%{transform:scale(1) translateY(0);}50%{transform:scale(1.04) translateY(-4px);}}'
      + '.ng-card{background:#fff;border-radius:18px;box-shadow:0 14px 34px rgba(38,80,92,.22);padding:13px 15px;'
      + 'max-width:300px;position:relative;animation:ng-in .4s cubic-bezier(.32,.72,0,1) both;}'
      + '@keyframes ng-in{from{opacity:0;transform:translateY(8px) scale(.96);}to{opacity:1;transform:none;}}'
      + '.ng-hat{font-size:10.5px;font-weight:800;letter-spacing:.05em;color:#48388f;text-transform:uppercase;margin-bottom:3px;}'
      + '.ng-tip{margin:0;font-size:14px;font-weight:700;line-height:1.45;color:#26505C;}'
      + '.ng-row{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px;}'
      + '.ng-btn{font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;border:none;border-radius:999px;padding:9px 15px;'
      + 'background:#5D4CB0;color:#fff;text-decoration:none;display:inline-flex;align-items:center;gap:5px;}'
      + '.ng-btn.ghost{background:#EEEBF8;color:#48388f;}'
      + '.ng-x{position:absolute;top:7px;inset-inline-start:9px;border:none;background:none;cursor:pointer;font-size:15px;color:#9fb0b4;line-height:1;padding:2px;}'
      + '.ng-min{display:none;}'
      + '.ng-collapsed .ng-card{display:none;} .ng-collapsed .ng-min{display:grid;place-items:center;position:absolute;'
      + 'inset-block-end:60px;inset-inline-start:8px;width:22px;height:22px;border-radius:50%;background:#5D4CB0;color:#fff;font-size:13px;font-weight:800;box-shadow:0 4px 10px rgba(93,76,176,.4);}'
      + '@media(prefers-reduced-motion:reduce){.ng-noni,.ng-card{animation:none!important;}}'
      + '@media(max-width:520px){.ng-card{max-width:220px;} .ng-noni{width:60px;}}';

    var style = document.createElement('style');
    style.setAttribute('data-noni-guide', '1');
    style.textContent = css;

    // ---- DOM ----
    var root = document.createElement('div');
    root.className = 'ng-root';

    var card = document.createElement('div');
    card.className = 'ng-card';
    var html = ''
      + '<button class="ng-x" aria-label="הסתר את נוני">✕</button>'
      + (cfg.hat ? '<div class="ng-hat">' + cfg.hat + '</div>' : '')
      + '<p class="ng-tip"></p>'
      + '<div class="ng-row"></div>';
    card.innerHTML = html;
    card.querySelector('.ng-tip').textContent = cfg.tip;

    var row = card.querySelector('.ng-row');
    if (cfg.next) {
      var a = document.createElement('a');
      a.className = 'ng-btn';
      a.href = cfg.next.href;
      a.textContent = cfg.next.label + ' ›';
      row.appendChild(a);
    }
    if (cfg.restart) {
      var rb = document.createElement('a');
      rb.className = 'ng-btn ghost';
      rb.href = cfg.restart;
      rb.textContent = '↺ להתחלה';
      row.appendChild(rb);
    }
    var hide = document.createElement('button');
    hide.className = 'ng-btn ghost';
    hide.textContent = 'הסתר';
    row.appendChild(hide);

    var noni = document.createElement('img');
    noni.className = 'ng-noni';
    noni.src = NONI;
    noni.alt = 'נוני';
    noni.title = 'נוני מלווה אתכם';

    var mini = document.createElement('div');
    mini.className = 'ng-min';
    mini.textContent = '💬';

    root.appendChild(card);
    root.appendChild(noni);
    root.appendChild(mini);

    // ---- התנהגות ----
    function collapse() { root.classList.add('ng-collapsed'); }
    function expand() { root.classList.remove('ng-collapsed'); }
    hide.addEventListener('click', collapse);
    noni.addEventListener('click', function () {
      if (root.classList.contains('ng-collapsed')) expand(); else collapse();
    });
    card.querySelector('.ng-x').addEventListener('click', function () {
      try { localStorage.setItem('noni-guide', 'off'); } catch (e) {}
      root.remove(); style.remove();
    });

    function mount() {
      document.head.appendChild(style);
      document.body.appendChild(root);
    }
    if (document.body) mount();
    else document.addEventListener('DOMContentLoaded', mount);

  } catch (e) { /* לעולם לא לשבור את הדף המארח */ }
})();
