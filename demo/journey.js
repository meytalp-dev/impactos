/* ============================================================
   journey.js — "מסע אחד מלא" (guided one-child journey)
   Owner: gate + navigation layer. Does NOT alter dashboard design.
   Activates ONLY when sessionStorage 'avnei-journey' === '1'.
   Focus child: איתי כ. · א'1  (reading: confuses sounds · pulse: drop in joy)
   Spine (8): placement → student morning → teacher → teacher pulse →
   teacher mavat → principal → principal pulse (pulse-grade1/) → meshulav.
   Works on step screens AND on excursion screens (games / pulse check-in)
   where it shows only a minimal "back to journey" pill.
   ============================================================ */
(function () {
  'use strict';
  if (sessionStorage.getItem('avnei-journey') !== '1') return; // normal navigation untouched

  var CHILD = sessionStorage.getItem('avnei-journey-child') || 'איתי כ.';
  var file = (location.pathname.split('/').pop() || '').toLowerCase();

  // ----- journey spine -----
  // NOTE: step URLs are written as '../<folder>/<file>' so they resolve the
  // same from demo/ AND from pulse-grade1/ (step 7 lives there).
  var STEPS = [
    { key: 'map.html', role: 'האי', chip: 'מפת האי',
      title: 'ברוכים הבאים לים של נוני',
      sub: 'זה העולם שהילדים פוגשים כל בוקר: מפת איים, וכל אי הוא תחנה בדרך לקריאה. כולם רואים את אותה מפה — אבל כל ילד מפליג בקצב שלו. הסתכלו על המפה בנחת, וכשמוכנים —',
      next: '../../demo/reading-journey.html',
      nextLabel: 'להתחיל את ההדגמות ›' },
    { key: 'reading-journey.html', role: 'המפה', chip: 'התחנות',
      title: 'חמש תחנות — וטעימה חיה מכל אחת',
      sub: 'הדרך מ"לא קורא" ל"קורא ומבין" בחמש תחנות. בכל תחנה יש קישור "נסו בעצמכם" — טעימה חיה מתרגול אמיתי: הקשבה, הברות, מילים, הבנה וכתיבה. שימו לב לאיתי — תכף נצא למסע שלו.',
      highlight: true, next: '../demo/teacher-literacy-profile.html',
      nextLabel: 'עכשיו נכיר את איתי ›' },
    { key: 'teacher-literacy-profile.html', role: 'מורה', chip: 'פתיחת שנה',
      title: 'פתיחת שנה — המיפוי ההתחלתי',
      sub: 'לפני הכול: איתי שיחק משחק קצר עם נוני, והמערכת הציעה לו נקודת התחלה. ההצעה נשארת הצעה — המורה רואה את התמונה, משנה ומאשרת. בלי תיוג אוטומטי.',
      activities: [
        { icon: '🧒', label: 'איך זה נראה אצל הילד · המבדק', url: '../demo/student-literacy-check.html' }
      ],
      highlight: true, next: '../demo/student-avnei.html',
      nextLabel: 'ומכאן — שנת הלמידה ›' },
    { key: 'student-avnei.html', role: 'תלמיד',
      title: 'הבוקר של איתי',
      sub: 'כמה שבועות לתוך השנה. איתי מתחיל ביום משחקי — קצר ונעים, בלי ציונים. היום הוא באי ההקראה — ושימו לב: נוני בוחר לו בכוונה מילים עם אותיות שהוא עוד לא רכש, ופחות כאלה שהוא כבר שולט בהן. התרגול תמיד בגובה שלו.',
      activities: [
        { icon: '🎤', label: 'הקראה · נוני מקשיבה', url: '../avnei-yesod/underwater-app/stage-read-aloud.html?presentation=1' },
        { icon: '📖', label: 'קריאה · הרכבת הצליל', url: '../avnei-yesod/underwater-app/stage-4-cv-build.html?presentation=1&demo=1' },
        { icon: '💜', label: 'צ׳ק-אין רגשי · פולס', url: "../pulse-grade1/pulse-questionnaire.html?class=א'1" }
      ],
      next: '../demo/teacher-avnei.html', nextLabel: 'מה המורה רואה? ›' },
    { key: 'teacher-avnei.html', role: 'מורה', chip: 'המורה רואה',
      title: 'המורה רואה — ופועלת',
      sub: 'מאותן לחיצות קטנות עולה תמונה: איתי מתבלבל בכמה צלילים, וגם פחות שמח ללמוד. ההמלצה: קבוצת חיזוק קטנה.',
      activities: [
        { icon: '📅', label: 'איפה זה בשנה · תוכנית שנתית', url: '../demo/teacher-curriculum.html' }
      ],
      highlight: true, next: '../pulse-grade1/pulse-dashboard.html?seed=1',
      nextLabel: 'ומה עם הרגש? ›' },
    { key: 'pulse-dashboard.html', role: 'מורה', chip: 'רגש',
      title: 'אותו ילד — הצד הרגשי',
      sub: 'דשבורד הפולס החי של המחנכת: הכיתה בארבעה ממדים רגשיים. מה שקשה לתפוס בעין — כאן רואים: אצל איתי יש ירידה בשמחה ללמוד. והתמונה לא נשענת רק על הילדים — גם המורה מדווחת אחת לשבועיים, 8 שאלות קצרות.',
      activities: [
        { icon: '📝', label: 'הדיווח של המורה · 8 שאלות', url: '../pulse-grade1/pulse-teacher-form-mockup.html' }
      ],
      highlight: true, next: '../demo/teacher-mavat.html',
      nextLabel: 'לחבר למידה ורגש ›' },
    { key: 'teacher-mavat.html', role: 'מורה', chip: 'מבט משולב',
      title: 'למידה ורגש — על מפה אחת',
      sub: 'המבט המשולב של המורה: קודם הכיתה כולה על מפת רבעים — למידה מול רגש. ואז איתי עצמו: למה הוא נמצא שם, ומה הצעד הבא.',
      highlight: true, next: '../demo/principal-avnei.html',
      nextLabel: 'המשך למנהלת ›' },
    { key: 'principal-avnei.html', role: 'מנהלת',
      title: 'תמונת בית הספר',
      sub: 'המנהלת לא רואה כל לחיצה — היא רואה אילו כיתות בשגרה, איפה צריך ליווי, ומי הילדים שחשוב לא לפספס.',
      next: '../pulse-grade1/pulse-principal-dashboard.html',
      nextLabel: 'הרגש בעיני המנהלת ›' },
    { key: 'pulse-principal-dashboard.html', role: 'מנהלת', chip: 'רגש בית-ספרי',
      title: 'הרווחה של כל כיתות א׳',
      sub: 'אותו פולס, בגובה מנהלת: אילו כיתות בשגרה טובה ואיפה כדאי ליווי — ברמת כיתה, בלי חשיפת תשובות של ילד בודד.',
      next: '../demo/mavat-meshulav.html', nextLabel: 'החיבור: קריאה ורגש ›' },
    { key: 'mavat-meshulav.html', role: 'החיבור',
      title: 'קריאה ורגש — על אותו ילד',
      sub: 'אותה מפה שראתה המורה — בגובה מנהלת: כל שכבת א׳ על שתי העדשות, ואיתי בתוכה. לא תיוג — צעד הבא אחד, ברור.',
      highlight: true, last: true }
  ];

  // ----- excursion screens (the live game / pulse, in other folders) -----
  // back = fallback route to the journey (used only when there is no history);
  // note = small floating explainer shown on the game screen itself.
  var NOTE_ADAPTIVE = 'איתי משחק באי ההקראה — אבל התרגול נבחר אישית: נוני נותן לו יותר אותיות שהוא עוד לא רכש, ופחות ממה שהוא כבר שולט בו. כך הוא מתאמן תמיד בדיוק בגובה שלו.';
  var NOTE_TASTE = 'טעימה חיה מתוך תרגול אמיתי — כך זה נראה אצל הילד. חזרו לתחנות כדי לטעום עוד.';
  var EXCURSIONS = {
    'stage-3-lamed.html': { back: '../../demo/student-avnei.html' },
    'student-literacy-check.html': { back: '../demo/teacher-literacy-profile.html' },
    'teacher-curriculum.html': { back: '../demo/teacher-avnei.html' },
    'stage-read-aloud.html': { back: '../../demo/student-avnei.html', note: NOTE_ADAPTIVE },
    'stage-4-cv-build.html': { back: '../../demo/student-avnei.html',
      note: 'התרגול הזה נבחר אישית לאיתי: יותר צירופים עם אותיות שהוא עוד לא רכש, ופחות ממה שהוא כבר שולט בו.' },
    'stage-4-cv-tap.html': { back: '../../demo/reading-journey.html', note: NOTE_TASTE },
    'stage-1-merge-bubble.html': { back: '../../demo/reading-journey.html', note: NOTE_TASTE },
    'stage-5-word-build.html': { back: '../../demo/reading-journey.html', note: NOTE_TASTE },
    'stage-14-listen-and-answer.html': { back: '../../demo/reading-journey.html', note: NOTE_TASTE },
    'stage-14-read-and-answer.html': { back: '../../demo/reading-journey.html', note: NOTE_TASTE },
    'stage-3-write-tav-accurate.html': { back: '../../demo/reading-journey.html', note: NOTE_TASTE },
    'pulse-questionnaire.html': { back: '../demo/student-avnei.html' },
    'pulse-summary.html': { back: '../demo/student-avnei.html' },
    'pulse-teacher-form-mockup.html': { back: '../pulse-grade1/pulse-dashboard.html?seed=1' }
  };

  // ===== EXCURSION MODE: floating "back to journey" pill + optional note =====
  if (Object.prototype.hasOwnProperty.call(EXCURSIONS, file)) {
    var exc = EXCURSIONS[file];
    var es = document.createElement('style');
    es.textContent =
      '.jw-back{position:fixed;z-index:99999;top:12px;right:12px;display:flex;align-items:center;gap:8px;' +
      'background:rgba(15,126,114,.96);color:#fff;border:none;border-radius:999px;padding:9px 16px;' +
      'font:800 13px Heebo,Arial,sans-serif;cursor:pointer;box-shadow:0 8px 22px -8px rgba(15,126,114,.8);' +
      'backdrop-filter:blur(4px);}' +
      '.jw-back:hover{background:#0a655c;} .jw-back .x{font-size:15px;}' +
      '.jw-note{position:fixed;z-index:99998;top:58px;right:12px;max-width:330px;background:rgba(255,255,255,.97);' +
      'border:1px solid #DCEAEC;border-radius:14px;padding:12px 14px 12px 34px;' +
      'font:600 12.5px/1.55 Heebo,Arial,sans-serif;color:#1E3D47;box-shadow:0 14px 34px -16px rgba(20,55,67,.45);' +
      'animation:jwNote .5s cubic-bezier(.32,.72,0,1) both;}' +
      '.jw-note b{color:#0F7E72;display:block;margin-bottom:3px;font-weight:800;}' +
      '.jw-note .c{position:absolute;top:8px;left:8px;width:22px;height:22px;border-radius:50%;border:none;' +
      'background:#F1F5F6;color:#8197A0;cursor:pointer;font:800 12px/1 Heebo,Arial;}' +
      '.jw-note .c:hover{background:#E8F4F0;color:#0F7E72;}' +
      '@keyframes jwNote{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:none;}}';
    document.head.appendChild(es);
    var pill = document.createElement('button');
    pill.className = 'jw-back';
    pill.innerHTML = '<span class="x">↩</span> חזרה למסע של איתי';
    pill.addEventListener('click', function () {
      if (history.length > 1 && document.referrer) { history.back(); }
      else { location.href = exc.back; }
    });
    (document.body || document.documentElement).appendChild(pill);
    if (exc.note) {
      var noteEl = document.createElement('div');
      noteEl.className = 'jw-note';
      noteEl.innerHTML = '<button class="c" title="סגירה">✕</button><b>מה קורה כאן?</b>' + exc.note;
      noteEl.querySelector('.c').addEventListener('click', function () { noteEl.remove(); });
      (document.body || document.documentElement).appendChild(noteEl);
    }
    return;
  }

  // ===== STEP MODE =====
  var idx = -1;
  for (var i = 0; i < STEPS.length; i++) { if (STEPS[i].key === file) { idx = i; break; } }
  if (idx === -1) return;
  var step = STEPS[idx];

  var css = document.createElement('style');
  css.textContent = [
    '.jw-bar{position:fixed;top:0;left:0;right:0;z-index:9000;display:flex;align-items:center;gap:14px;',
      'padding:10px 18px;background:rgba(255,255,255,.96);backdrop-filter:blur(8px);',
      'border-bottom:1px solid #E1ECEE;box-shadow:0 4px 18px -8px rgba(20,55,67,.25);font-family:Heebo,Arial,sans-serif;}',
    '.jw-brand{display:flex;align-items:center;gap:8px;font-weight:800;color:#0F7E72;font-size:14px;white-space:nowrap;}',
    '.jw-brand .d{width:9px;height:9px;border-radius:3px;background:#0F7E72;}',
    '.jw-steps{display:flex;align-items:center;gap:8px;flex:1;justify-content:center;flex-wrap:wrap;}',
    '.jw-chip{display:flex;align-items:center;gap:7px;padding:5px 12px;border-radius:999px;font-size:12.5px;font-weight:700;',
      'color:#7E929A;background:#F1F5F6;border:1px solid #E7EDEF;white-space:nowrap;}',
    '.jw-chip .n{width:18px;height:18px;border-radius:50%;background:#C8D3D6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;}',
    '.jw-chip.on{color:#0F7E72;background:#E8F4F0;border-color:#C6E6DC;}',
    '.jw-chip.on .n{background:#0F7E72;}',
    '.jw-chip.done{color:#0D6B54;background:#E3F6EC;border-color:#D6ECE3;}',
    '.jw-chip.done .n{background:#4FBF8B;}',
    '.jw-exit{background:none;border:1px solid #E1ECEE;color:#8197A0;border-radius:8px;padding:6px 12px;font:600 12px Heebo,Arial;cursor:pointer;white-space:nowrap;}',
    '.jw-exit:hover{background:#F6FAFB;}',
    '.jw-call{position:fixed;z-index:9000;left:18px;bottom:18px;max-width:440px;background:#fff;border:1px solid #E1ECEE;',
      'border-radius:16px;box-shadow:0 22px 50px -22px rgba(20,55,67,.5);padding:18px 20px;font-family:Heebo,Arial,sans-serif;',
      'animation:jwUp .5s cubic-bezier(.32,.72,0,1) both;}',
    '.jw-min{position:absolute;top:10px;left:12px;width:30px;height:30px;border-radius:50%;border:1px solid #E1ECEE;',
      'background:#fff;color:#8197A0;cursor:pointer;font:800 15px/1 Heebo,Arial;display:flex;align-items:center;justify-content:center;}',
    '.jw-min:hover{background:#F6FAFB;color:#0F7E72;}',
    '.jw-mini{position:fixed;z-index:9000;left:18px;bottom:18px;display:none;align-items:center;gap:8px;',
      'background:#0F7E72;color:#fff;border:none;border-radius:999px;padding:11px 18px;',
      'font:800 13.5px Heebo,Arial,sans-serif;cursor:pointer;box-shadow:0 12px 30px -12px rgba(15,126,114,.7);}',
    '.jw-mini:hover{background:#0a655c;}',
    '@keyframes jwUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;}}',
    '.jw-call .role{display:inline-flex;align-items:center;gap:7px;font-size:11.5px;font-weight:800;color:#0F7E72;',
      'background:#E8F4F0;border-radius:999px;padding:3px 11px;margin-bottom:9px;}',
    '.jw-call h4{font:800 19px Heebo,Arial;color:#1E3D47;margin:0 0 6px;}',
    '.jw-call p{font:500 13.5px/1.55 Heebo,Arial;color:#557079;margin:0 0 13px;}',
    '.jw-acts{display:flex;gap:9px;margin-bottom:13px;flex-wrap:wrap;}',
    '.jw-act{display:flex;align-items:center;gap:7px;flex:1;min-width:160px;text-decoration:none;background:#F4FAFB;',
      'border:1px solid #DCEAEC;border-radius:11px;padding:10px 13px;font:700 13px Heebo,Arial;color:#1E3D47;transition:background .2s;}',
    '.jw-act:hover{background:#E8F4F0;} .jw-act .ai{font-size:16px;} .jw-act .ag{margin-inline-start:auto;color:#0F7E72;font-weight:800;}',
    '.jw-row{display:flex;align-items:center;gap:10px;}',
    '.jw-next{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;background:#0F7E72;color:#fff;',
      'border:none;border-radius:10px;padding:12px 18px;font:800 14.5px Heebo,Arial;cursor:pointer;transition:background .2s;}',
    '.jw-next:hover{background:#0a655c;}',
    '.jw-focus{outline:3px solid #0F7E72!important;outline-offset:3px;border-radius:14px;',
      'box-shadow:0 0 0 6px rgba(15,126,114,.15)!important;scroll-margin:120px;transition:outline .3s;}',
    'body{padding-top:52px!important;}'
  ].join('');
  document.head.appendChild(css);

  var bar = document.createElement('div');
  bar.className = 'jw-bar';
  var chips = STEPS.map(function (s, k) {
    var cls = k < idx ? 'done' : (k === idx ? 'on' : '');
    var mark = k < idx ? '✓' : (k + 1);
    return '<span class="jw-chip ' + cls + '"><span class="n">' + mark + '</span>' + (s.chip || s.role) + '</span>';
  }).join('<span style="color:#C8D3D6;">·</span>');
  bar.innerHTML =
    '<span class="jw-brand"><span class="d"></span>מסע אחד · ' + CHILD + '</span>' +
    '<span class="jw-steps">' + chips + '</span>' +
    '<button class="jw-exit" id="jwExit">יציאה מהמסע ✕</button>';
  document.body.appendChild(bar);
  // map.html lives two levels deep (avnei-yesod/underwater-app/) — exit path differs
  var DEMO_ROOT = (file === 'map.html') ? '../../demo/' : '../demo/';
  document.getElementById('jwExit').addEventListener('click', function () {
    sessionStorage.removeItem('avnei-journey'); sessionStorage.removeItem('avnei-journey-child');
    location.href = DEMO_ROOT + 'index.html';
  });

  var acts = (step.activities || []).map(function (a) {
    return '<a class="jw-act" href="' + a.url + '"><span class="ai">' + a.icon + '</span>' + a.label + '<span class="ag">›</span></a>';
  }).join('');

  var call = document.createElement('div');
  call.className = 'jw-call';
  var nextBtn = step.last
    ? '<button class="jw-next" id="jwNext">סיום המסע ✦</button>'
    : '<button class="jw-next" id="jwNext">' + (step.nextLabel || ('המשך ל' + STEPS[idx + 1].role + ' ›')) + '</button>';
  call.innerHTML =
    '<button class="jw-min" id="jwMin" title="מזעור ההנחיה">–</button>' +
    '<span class="role"><span style="width:7px;height:7px;border-radius:2px;background:#0F7E72;display:inline-block;"></span>' +
      (idx + 1) + ' מתוך ' + STEPS.length + ' · ' + step.role + '</span>' +
    '<h4>' + step.title + '</h4><p>' + step.sub + '</p>' +
    (acts ? '<div class="jw-acts">' + acts + '</div>' : '') +
    '<div class="jw-row">' + nextBtn + '</div>';
  document.body.appendChild(call);

  // minimized pill — reopens the guidance card; preference persists across steps
  var mini = document.createElement('button');
  mini.className = 'jw-mini';
  mini.innerHTML = '▸ המסע · ' + (idx + 1) + '/' + STEPS.length;
  document.body.appendChild(mini);
  function setMin(on) {
    call.style.display = on ? 'none' : '';
    mini.style.display = on ? 'flex' : 'none';
    sessionStorage.setItem('avnei-journey-min', on ? '1' : '0');
  }
  document.getElementById('jwMin').addEventListener('click', function () { setMin(true); });
  mini.addEventListener('click', function () { setMin(false); });
  if (sessionStorage.getItem('avnei-journey-min') === '1') setMin(true);

  document.getElementById('jwNext').addEventListener('click', function () {
    if (step.last) {
      sessionStorage.removeItem('avnei-journey'); sessionStorage.removeItem('avnei-journey-child');
      location.href = '../demo/index.html?journey-done=1';
    } else { location.href = step.next; }
  });

  if (step.highlight) {
    setTimeout(function () {
      var key = CHILD.replace(/\s*\.$/, '').split(' ')[0];
      var nodes = document.querySelectorAll('h1,h2,h3,h4,b,strong,.name,td,div');
      var target = null;
      for (var j = 0; j < nodes.length; j++) {
        var t = (nodes[j].textContent || '').trim();
        if (t.indexOf(key) === 0 && t.length < 24) { target = nodes[j]; break; }
      }
      if (!target) return;
      var el = target;
      for (var c = 0; c < 5 && el && el.parentElement; c++) {
        var w = el.offsetWidth; if (w > 170 && w < 560) break; el = el.parentElement;
      }
      if (el) { el.classList.add('jw-focus'); try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} }
    }, 600);
  }
})();
