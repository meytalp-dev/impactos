/* ============================================================
   journey.js — "מסע אחד מלא" (guided one-child journey)
   Owner: gate + navigation layer. Does NOT alter dashboard design.
   Activates ONLY when sessionStorage 'avnei-journey' === '1'.
   Focus child: איתי כ. · א'1  (reading: confuses sounds · pulse: drop in joy)
   Works on demo/ step screens AND on excursion screens (the ל game / pulse
   check-in) where it shows only a minimal "back to journey" pill.
   ============================================================ */
(function () {
  'use strict';
  if (sessionStorage.getItem('avnei-journey') !== '1') return; // normal navigation untouched

  var CHILD = sessionStorage.getItem('avnei-journey-child') || 'איתי כ.';
  var file = (location.pathname.split('/').pop() || '').toLowerCase();

  // ----- journey spine (demo/ screens) -----
  var STEPS = [
    { key: 'student-avnei.html', role: 'תלמיד',
      title: 'הבוקר של איתי',
      sub: 'איתי מתחיל ביום משחקי — קצר ונעים, בלי ציונים. שתי פעילויות בוקר:',
      activities: [
        { icon: '📖', label: 'קריאה · הרכבת הצליל', url: '../avnei-yesod/underwater-app/stage-4-cv-build.html?presentation=1&demo=1' },
        { icon: '💜', label: 'צ׳ק-אין רגשי · פולס', url: "../pulse-grade1/pulse-questionnaire.html?class=א'1" }
      ],
      next: 'teacher-avnei.html' },
    { key: 'teacher-avnei.html', role: 'מורה', chip: 'המורה רואה',
      title: 'המורה רואה — ופועלת',
      sub: 'מאותן לחיצות קטנות עולה תמונה: איתי מתבלבל בכמה צלילים, וגם פחות שמח ללמוד. ההמלצה: קבוצת חיזוק קטנה.',
      activities: [
        { icon: '📅', label: 'איפה זה בשנה · תוכנית שנתית', url: 'teacher-curriculum.html' }
      ],
      highlight: true, next: 'teacher-literacy-profile.html',
      nextLabel: 'איך המערכת הציבה את איתי? ›' },
    { key: 'teacher-literacy-profile.html', role: 'מורה', chip: 'הצבה',
      title: 'המערכת מציעה — המורה מכריעה',
      sub: 'מבדק הפתיחה (משחק קצר עם נוני) הציע לאיתי אי התחלה. ההצעה נשארת הצעה: המורה רואה את התמונה, משנה ומאשרת. בלי תיוג אוטומטי.',
      activities: [
        { icon: '🧒', label: 'איך זה נראה אצל הילד · המבדק', url: 'student-literacy-check.html' }
      ],
      highlight: true, next: 'teacher-pulse.html',
      nextLabel: 'ומה עם הרגש? ›' },
    { key: 'teacher-pulse.html', role: 'מורה', chip: 'רגש',
      title: 'אותו ילד — הצד הרגשי',
      sub: 'הפולס מראה את מה שקשה לתפוס בעין: אצל איתי יש ירידה בשמחה ללמוד. לא מערכת נוספת — אותו מסך, אותו ילד, וצעד הבא אחד.',
      highlight: true, next: 'principal-avnei.html',
      nextLabel: 'המשך למנהלת ›' },
    { key: 'principal-avnei.html', role: 'מנהלת',
      title: 'תמונת בית הספר',
      sub: 'המנהלת לא רואה כל לחיצה — היא רואה אילו כיתות בשגרה, איפה צריך ליווי, ומי הילדים שחשוב לא לפספס.',
      next: 'mavat-meshulav.html', nextLabel: 'החיבור: קריאה ורגש ›' },
    { key: 'mavat-meshulav.html', role: 'החיבור',
      title: 'קריאה ורגש — על אותו ילד',
      sub: 'כאן נפגשים שני העולמות אצל איתי: מה שקורה בקריאה ומה שקורה ברגש. לא תיוג — צעד הבא אחד, ברור.',
      highlight: true, last: true }
  ];

  // ----- excursion screens (the live game / pulse, in other folders) -----
  // value = how to get back to the demo/ folder from that screen
  var EXCURSIONS = {
    'stage-3-lamed.html': '../../demo/student-avnei.html',
    'student-literacy-check.html': 'teacher-literacy-profile.html',
    'teacher-curriculum.html': 'teacher-avnei.html',
    'stage-4-cv-build.html': '../../demo/student-avnei.html',
    'stage-4-cv-tap.html': '../../demo/student-avnei.html',
    'map.html': '../../demo/student-avnei.html',
    'pulse-questionnaire.html': '../demo/student-avnei.html',
    'pulse-summary.html': '../demo/student-avnei.html'
  };

  // ===== EXCURSION MODE: minimal floating "back to journey" pill only =====
  if (Object.prototype.hasOwnProperty.call(EXCURSIONS, file)) {
    var back = EXCURSIONS[file];
    var es = document.createElement('style');
    es.textContent =
      '.jw-back{position:fixed;z-index:99999;top:12px;right:12px;display:flex;align-items:center;gap:8px;' +
      'background:rgba(15,126,114,.96);color:#fff;border:none;border-radius:999px;padding:9px 16px;' +
      'font:800 13px Heebo,Arial,sans-serif;cursor:pointer;box-shadow:0 8px 22px -8px rgba(15,126,114,.8);' +
      'backdrop-filter:blur(4px);}' +
      '.jw-back:hover{background:#0a655c;} .jw-back .x{font-size:15px;}';
    document.head.appendChild(es);
    var pill = document.createElement('button');
    pill.className = 'jw-back';
    pill.innerHTML = '<span class="x">↩</span> חזרה למסע של איתי';
    pill.addEventListener('click', function () { location.href = back; });
    (document.body || document.documentElement).appendChild(pill);
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
    '.jw-call{position:fixed;z-index:9000;right:18px;bottom:18px;max-width:440px;background:#fff;border:1px solid #E1ECEE;',
      'border-radius:16px;box-shadow:0 22px 50px -22px rgba(20,55,67,.5);padding:18px 20px;font-family:Heebo,Arial,sans-serif;',
      'animation:jwUp .5s cubic-bezier(.32,.72,0,1) both;}',
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
  document.getElementById('jwExit').addEventListener('click', function () {
    sessionStorage.removeItem('avnei-journey'); sessionStorage.removeItem('avnei-journey-child');
    location.href = 'index.html';
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
    '<span class="role"><span style="width:7px;height:7px;border-radius:2px;background:#0F7E72;display:inline-block;"></span>' +
      (idx + 1) + ' מתוך ' + STEPS.length + ' · ' + step.role + '</span>' +
    '<h4>' + step.title + '</h4><p>' + step.sub + '</p>' +
    (acts ? '<div class="jw-acts">' + acts + '</div>' : '') +
    '<div class="jw-row">' + nextBtn + '</div>';
  document.body.appendChild(call);

  document.getElementById('jwNext').addEventListener('click', function () {
    if (step.last) {
      sessionStorage.removeItem('avnei-journey'); sessionStorage.removeItem('avnei-journey-child');
      location.href = 'index.html?journey-done=1';
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
