// ============================================================
// templates/letter-anims.js — SVG אסוציאטיבי פר אות
//
// D.15 v2 (27.5.2026): אנימציה ייחודית פר אות, רצה אחרי 5/5
// הקשות נכונות ולפני startFinale. הילד שומע word-X.mp3 + רואה
// SVG אסוציאטיבי במרכז המסך (~1.8 שניות), ואז confetti רגיל.
//
// 17 entries — 5 בועות + 4 כוכבים + 4 צדפים + 5 דגים. ש (shin)
// נכלל כי בקבוצת בועות (לא רק demo).
//
// כל SVG: viewBox 0 0 200 200, פלטה בתואם אי 3 (תכלת·כתום·זהוב·טורקיז).
// עיצוב פשוט וקריא לילד בן 6.
// ============================================================

window.AvneiLetterAnims = (function () {

  // ===== Helper: gradient defs משותף =====
  const DEFS = `
    <defs>
      <linearGradient id="anim-sun" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FFE066"/>
        <stop offset="100%" stop-color="#FFA94D"/>
      </linearGradient>
      <linearGradient id="anim-flame" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stop-color="#FF6B35"/>
        <stop offset="100%" stop-color="#FFE066"/>
      </linearGradient>
      <linearGradient id="anim-heart" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FF6B9D"/>
        <stop offset="100%" stop-color="#E91E63"/>
      </linearGradient>
      <linearGradient id="anim-fish" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#FFA98D"/>
        <stop offset="100%" stop-color="#FF6B35"/>
      </linearGradient>
      <linearGradient id="anim-rose" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FF4757"/>
        <stop offset="100%" stop-color="#B71540"/>
      </linearGradient>
      <linearGradient id="anim-mountain" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#A8E8FF"/>
        <stop offset="60%" stop-color="#5C9DBA"/>
        <stop offset="100%" stop-color="#3A6E85"/>
      </linearGradient>
      <radialGradient id="anim-bigsun" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#FFFFFF"/>
        <stop offset="40%" stop-color="#FFE066"/>
        <stop offset="100%" stop-color="#FF8C42"/>
      </radialGradient>
    </defs>`;

  // ===== SVG inline factory =====
  function svg(content) {
    return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${DEFS}${content}</svg>`;
  }

  // ===== 🫧 קבוצת בועות =====

  // ש — שמש (sun): 8 קרניים + פנים מחייכים
  const SHIN = svg(`
    <g class="anim-sun-rays">
      ${[0,45,90,135,180,225,270,315].map(deg => `
        <polygon points="100,30 95,55 105,55" fill="#FFA94D"
                 transform="rotate(${deg} 100 100)"/>
      `).join('')}
    </g>
    <circle cx="100" cy="100" r="42" fill="url(#anim-sun)" stroke="#FFFFFF" stroke-width="3"/>
    <circle cx="85" cy="92" r="4" fill="#3A2A18"/>
    <circle cx="115" cy="92" r="4" fill="#3A2A18"/>
    <path d="M82 110 Q100 124 118 110" stroke="#3A2A18" stroke-width="3" fill="none" stroke-linecap="round"/>
  `);

  // ל — לב פועם
  const LAMED = svg(`
    <path d="M100,160 C55,130 30,100 30,72 C30,54 46,40 65,40 C82,40 92,52 100,68 C108,52 118,40 135,40 C154,40 170,54 170,72 C170,100 145,130 100,160 Z"
          fill="url(#anim-heart)" stroke="#FFFFFF" stroke-width="3"/>
    <ellipse cx="80" cy="65" rx="10" ry="6" fill="#FFFFFF" opacity="0.5"/>
  `);

  // נ — נר עם להבה מרצדת
  const NUN = svg(`
    <rect x="80" y="95" width="40" height="80" rx="4" fill="#F5F0E6" stroke="#A89A82" stroke-width="2"/>
    <rect x="80" y="95" width="40" height="10" fill="#D4C5A8"/>
    <line x1="100" y1="105" x2="100" y2="55" stroke="#5C4A2E" stroke-width="2"/>
    <ellipse cx="100" cy="55" rx="14" ry="26" fill="url(#anim-flame)"/>
    <ellipse cx="100" cy="50" rx="6" ry="14" fill="#FFFEF0" opacity="0.8"/>
  `);

  // א — אריה עם רעמה
  const ALEF = svg(`
    <g class="anim-mane">
      ${Array.from({length: 14}, (_, i) => {
        const deg = (360/14) * i;
        return `<polygon points="100,30 90,60 110,60" fill="#C77518"
                         transform="rotate(${deg} 100 105)"/>`;
      }).join('')}
    </g>
    <circle cx="100" cy="105" r="38" fill="#F5A623" stroke="#FFFFFF" stroke-width="2"/>
    <circle cx="85" cy="98" r="3.5" fill="#3A2A18"/>
    <circle cx="115" cy="98" r="3.5" fill="#3A2A18"/>
    <polygon points="100,108 95,116 105,116" fill="#3A2A18"/>
    <path d="M88 122 Q100 130 112 122" stroke="#3A2A18" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <line x1="74" y1="105" x2="62" y2="103" stroke="#3A2A18" stroke-width="1.5"/>
    <line x1="74" y1="110" x2="62" y2="110" stroke="#3A2A18" stroke-width="1.5"/>
    <line x1="126" y1="105" x2="138" y2="103" stroke="#3A2A18" stroke-width="1.5"/>
    <line x1="126" y1="110" x2="138" y2="110" stroke="#3A2A18" stroke-width="1.5"/>
  `);

  // ===== ⭐ קבוצת כוכבים =====

  // ז — זברה
  const ZAYIN = svg(`
    <ellipse cx="100" cy="115" rx="48" ry="58" fill="#FFFFFF" stroke="#000000" stroke-width="3"/>
    <path d="M65 95 Q75 100 70 130" stroke="#000000" stroke-width="6" fill="none"/>
    <path d="M85 75 Q92 90 88 145" stroke="#000000" stroke-width="6" fill="none"/>
    <path d="M105 75 Q112 90 108 145" stroke="#000000" stroke-width="6" fill="none"/>
    <path d="M125 80 Q130 100 128 140" stroke="#000000" stroke-width="6" fill="none"/>
    <polygon points="68,68 78,52 84,72" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
    <polygon points="132,68 122,52 116,72" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
    <circle cx="85" cy="105" r="3.5" fill="#000000"/>
    <circle cx="115" cy="105" r="3.5" fill="#000000"/>
    <ellipse cx="100" cy="155" rx="14" ry="8" fill="#FFC0CB" stroke="#000000" stroke-width="2"/>
    <circle cx="94" cy="155" r="2" fill="#000000"/>
    <circle cx="106" cy="155" r="2" fill="#000000"/>
  `);

  // י — יום (שמש גדולה)
  const YUD = svg(`
    <g class="anim-bigsun-rays">
      ${[0,30,60,90,120,150,180,210,240,270,300,330].map(deg => `
        <polygon points="100,15 94,45 106,45" fill="#FFA94D"
                 transform="rotate(${deg} 100 100)"/>
      `).join('')}
    </g>
    <circle cx="100" cy="100" r="55" fill="url(#anim-bigsun)" stroke="#FFFFFF" stroke-width="3"/>
    <circle cx="82" cy="92" r="5" fill="#5A3D1A"/>
    <circle cx="118" cy="92" r="5" fill="#5A3D1A"/>
    <circle cx="84" cy="90" r="1.5" fill="#FFFFFF"/>
    <circle cx="120" cy="90" r="1.5" fill="#FFFFFF"/>
    <path d="M76 112 Q100 132 124 112" stroke="#5A3D1A" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="68" cy="108" r="4" fill="#FFB3D1" opacity="0.7"/>
    <circle cx="132" cy="108" r="4" fill="#FFB3D1" opacity="0.7"/>
  `);

  // ו — ורד
  const VAV = svg(`
    <line x1="100" y1="180" x2="100" y2="120" stroke="#2D6A2F" stroke-width="5"/>
    <ellipse cx="80" cy="155" rx="14" ry="6" fill="#4CAF50" transform="rotate(-30 80 155)"/>
    <ellipse cx="120" cy="148" rx="14" ry="6" fill="#4CAF50" transform="rotate(25 120 148)"/>
    ${[0,72,144,216,288].map(deg => `
      <ellipse cx="100" cy="75" rx="22" ry="32" fill="url(#anim-rose)"
               stroke="#FFFFFF" stroke-width="1.5"
               transform="rotate(${deg} 100 100)"/>
    `).join('')}
    <circle cx="100" cy="100" r="14" fill="#FFE066" stroke="#FFFFFF" stroke-width="2"/>
    <circle cx="100" cy="100" r="6" fill="#FFA94D"/>
  `);

  // ה — הר
  const HEY = svg(`
    <polygon points="20,170 65,80 110,170" fill="url(#anim-mountain)" stroke="#FFFFFF" stroke-width="2"/>
    <polygon points="65,80 55,95 75,95" fill="#FFFFFF"/>
    <polygon points="80,170 135,50 190,170" fill="#5C9DBA" stroke="#FFFFFF" stroke-width="2"/>
    <polygon points="135,50 122,72 148,72" fill="#FFFFFF"/>
    <circle cx="150" cy="35" r="12" fill="url(#anim-sun)"/>
    <ellipse cx="40" cy="60" rx="18" ry="6" fill="#FFFFFF" opacity="0.85"/>
    <ellipse cx="170" cy="80" rx="14" ry="5" fill="#FFFFFF" opacity="0.7"/>
  `);

  // ===== 🐚 קבוצת צדפים =====

  // ס — סבא
  const SAMEKH = svg(`
    <circle cx="100" cy="80" r="40" fill="#F4D5B0" stroke="#FFFFFF" stroke-width="2"/>
    <path d="M75 95 Q70 110 72 130 Q78 160 100 170 Q122 160 128 130 Q130 110 125 95 Z"
          fill="#FFFFFF" stroke="#D8D8D8" stroke-width="2"/>
    <path d="M62 70 Q60 50 75 45 Q85 42 95 48 Q105 42 115 48 Q125 42 135 45 Q140 50 138 70"
          fill="#E8E8E8" stroke="#D0D0D0" stroke-width="2"/>
    <circle cx="86" cy="80" r="3.5" fill="#3A2A18"/>
    <circle cx="114" cy="80" r="3.5" fill="#3A2A18"/>
    <path d="M86 95 Q100 102 114 95" stroke="#A8855E" stroke-width="2" fill="none" stroke-linecap="round"/>
    <ellipse cx="100" cy="100" rx="6" ry="3" fill="#FF9999" opacity="0.5"/>
  `);

  // ע — עץ
  const AYIN = svg(`
    <rect x="88" y="115" width="24" height="65" rx="3" fill="#7A4F2D" stroke="#FFFFFF" stroke-width="2"/>
    <path d="M88 130 L78 145 M112 130 L122 140" stroke="#5A3D1A" stroke-width="2"/>
    <circle cx="100" cy="70" r="40" fill="#4CAF50" stroke="#FFFFFF" stroke-width="2"/>
    <circle cx="65" cy="90" r="28" fill="#388E3C" stroke="#FFFFFF" stroke-width="2"/>
    <circle cx="135" cy="90" r="28" fill="#388E3C" stroke="#FFFFFF" stroke-width="2"/>
    <circle cx="100" cy="55" r="6" fill="#FF6B6B"/>
    <circle cx="80" cy="80" r="5" fill="#FF6B6B"/>
    <circle cx="120" cy="80" r="5" fill="#FF6B6B"/>
    <circle cx="105" cy="100" r="5" fill="#FF6B6B"/>
  `);

  // צ — ציפור
  const TZADI = svg(`
    <ellipse cx="100" cy="115" rx="45" ry="35" fill="#FFE066" stroke="#FFFFFF" stroke-width="2"/>
    <circle cx="125" cy="85" r="28" fill="#FFD43B" stroke="#FFFFFF" stroke-width="2"/>
    <polygon points="148,82 168,90 148,98" fill="#FFA94D" stroke="#FFFFFF" stroke-width="1.5"/>
    <circle cx="130" cy="80" r="4" fill="#3A2A18"/>
    <circle cx="131" cy="78" r="1.5" fill="#FFFFFF"/>
    <ellipse cx="80" cy="115" rx="22" ry="14" fill="#FFA94D" transform="rotate(-15 80 115)"/>
    <line x1="90" y1="148" x2="88" y2="170" stroke="#FF8C42" stroke-width="3" stroke-linecap="round"/>
    <line x1="105" y1="148" x2="107" y2="170" stroke="#FF8C42" stroke-width="3" stroke-linecap="round"/>
    <polygon points="85,170 80,178 90,178" fill="#FF8C42"/>
    <polygon points="107,170 102,178 112,178" fill="#FF8C42"/>
  `);

  // ט — טווס (גוף קטן + זנב גלגלי צבעוני)
  const TET = svg(`
    ${[
      {deg: -50, color: '#2196F3'},
      {deg: -30, color: '#00BCD4'},
      {deg: -10, color: '#4CAF50'},
      {deg: 10, color: '#8BC34A'},
      {deg: 30, color: '#9C27B0'},
      {deg: 50, color: '#673AB7'},
    ].map(f => `
      <g transform="rotate(${f.deg} 100 130)">
        <ellipse cx="100" cy="60" rx="13" ry="42" fill="${f.color}" stroke="#FFFFFF" stroke-width="1.5"/>
        <circle cx="100" cy="35" r="9" fill="#FFE066" stroke="#FFFFFF" stroke-width="1"/>
        <circle cx="100" cy="35" r="4" fill="#1A237E"/>
      </g>
    `).join('')}
    <ellipse cx="100" cy="140" rx="22" ry="28" fill="#1565C0" stroke="#FFFFFF" stroke-width="2"/>
    <circle cx="100" cy="120" r="14" fill="#1976D2" stroke="#FFFFFF" stroke-width="2"/>
    <polygon points="100,108 95,116 105,116" fill="#FFE066"/>
    <polygon points="115,108 122,115 113,118" fill="#FFA94D"/>
    <circle cx="95" cy="117" r="2" fill="#000000"/>
    <circle cx="103" cy="117" r="2" fill="#000000"/>
  `);

  // ===== 🐟 קבוצת דגים =====

  // ד — דג כתום שוחה
  const DALET = svg(`
    <ellipse cx="100" cy="105" rx="55" ry="32" fill="url(#anim-fish)" stroke="#FFFFFF" stroke-width="2"/>
    <polygon points="40,105 15,80 15,130" fill="#FF6B35" stroke="#FFFFFF" stroke-width="2"/>
    <circle cx="135" cy="95" r="6" fill="#FFFFFF"/>
    <circle cx="135" cy="95" r="3.5" fill="#3A2A18"/>
    <path d="M145 110 Q155 115 145 120" stroke="#3A2A18" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M100 75 Q108 70 110 80" stroke="#FFFFFF" stroke-width="2" fill="none"/>
    <path d="M80 95 Q90 100 80 110" stroke="#D44A1F" stroke-width="2" fill="none"/>
    <circle cx="65" cy="65" r="4" fill="#FFFFFF" opacity="0.7"/>
    <circle cx="55" cy="78" r="3" fill="#FFFFFF" opacity="0.6"/>
    <circle cx="170" cy="140" r="3" fill="#FFFFFF" opacity="0.6"/>
  `);

  // ג — גמל
  const GIMEL = svg(`
    <ellipse cx="100" cy="135" rx="55" ry="22" fill="#C7975A" stroke="#FFFFFF" stroke-width="2"/>
    <path d="M65 130 Q70 90 90 100 Q105 88 120 100 Q140 90 145 130" fill="#C7975A" stroke="#FFFFFF" stroke-width="2"/>
    <circle cx="145" cy="80" r="22" fill="#B8843D" stroke="#FFFFFF" stroke-width="2"/>
    <line x1="160" y1="78" x2="170" y2="65" stroke="#B8843D" stroke-width="4" stroke-linecap="round"/>
    <polygon points="142,60 138,52 145,55" fill="#B8843D"/>
    <polygon points="148,60 152,52 145,55" fill="#B8843D"/>
    <circle cx="148" cy="78" r="2.5" fill="#3A2A18"/>
    <ellipse cx="158" cy="86" rx="3" ry="2" fill="#3A2A18"/>
    <rect x="55" y="155" width="6" height="25" fill="#8C6932"/>
    <rect x="80" y="155" width="6" height="25" fill="#8C6932"/>
    <rect x="115" y="155" width="6" height="25" fill="#8C6932"/>
    <rect x="138" y="155" width="6" height="25" fill="#8C6932"/>
  `);

  // ח — חתול
  const HET = svg(`
    <polygon points="60,75 75,30 92,68" fill="#9E9E9E" stroke="#FFFFFF" stroke-width="2"/>
    <polygon points="140,75 125,30 108,68" fill="#9E9E9E" stroke="#FFFFFF" stroke-width="2"/>
    <polygon points="65,68 75,40 85,65" fill="#FFB3D1"/>
    <polygon points="135,68 125,40 115,65" fill="#FFB3D1"/>
    <circle cx="100" cy="105" r="48" fill="#9E9E9E" stroke="#FFFFFF" stroke-width="2"/>
    <ellipse cx="82" cy="95" rx="6" ry="8" fill="#FFE066"/>
    <ellipse cx="118" cy="95" rx="6" ry="8" fill="#FFE066"/>
    <ellipse cx="82" cy="97" rx="2" ry="6" fill="#000000"/>
    <ellipse cx="118" cy="97" rx="2" ry="6" fill="#000000"/>
    <polygon points="100,115 92,122 108,122" fill="#FFB3D1"/>
    <path d="M100 122 Q92 132 86 130 M100 122 Q108 132 114 130" stroke="#3A2A18" stroke-width="2" fill="none" stroke-linecap="round"/>
    <line x1="60" y1="105" x2="40" y2="100" stroke="#3A2A18" stroke-width="1.5"/>
    <line x1="60" y1="112" x2="40" y2="112" stroke="#3A2A18" stroke-width="1.5"/>
    <line x1="140" y1="105" x2="160" y2="100" stroke="#3A2A18" stroke-width="1.5"/>
    <line x1="140" y1="112" x2="160" y2="112" stroke="#3A2A18" stroke-width="1.5"/>
  `);

  // פ — פיל
  const PEY = svg(`
    <ellipse cx="60" cy="80" rx="22" ry="32" fill="#B0BEC5" stroke="#FFFFFF" stroke-width="2"/>
    <ellipse cx="140" cy="80" rx="22" ry="32" fill="#B0BEC5" stroke="#FFFFFF" stroke-width="2"/>
    <circle cx="100" cy="100" r="48" fill="#90A4AE" stroke="#FFFFFF" stroke-width="2"/>
    <path d="M100 130 Q95 150 80 160 Q70 165 75 175 Q82 180 88 174 Q98 162 100 145"
          fill="#90A4AE" stroke="#FFFFFF" stroke-width="2"/>
    <circle cx="84" cy="95" r="4" fill="#3A2A18"/>
    <circle cx="116" cy="95" r="4" fill="#3A2A18"/>
    <circle cx="85" cy="93" r="1.2" fill="#FFFFFF"/>
    <circle cx="117" cy="93" r="1.2" fill="#FFFFFF"/>
    <ellipse cx="78" cy="172" rx="6" ry="3" fill="#FFB3D1"/>
  `);

  // כ — כלב חום
  const KAF = svg(`
    <ellipse cx="60" cy="90" rx="20" ry="35" fill="#8D6E63" stroke="#FFFFFF" stroke-width="2" transform="rotate(-15 60 90)"/>
    <ellipse cx="140" cy="90" rx="20" ry="35" fill="#8D6E63" stroke="#FFFFFF" stroke-width="2" transform="rotate(15 140 90)"/>
    <circle cx="100" cy="110" r="48" fill="#A1887F" stroke="#FFFFFF" stroke-width="2"/>
    <ellipse cx="100" cy="135" rx="22" ry="18" fill="#BCAAA4"/>
    <circle cx="85" cy="105" r="4.5" fill="#3A2A18"/>
    <circle cx="115" cy="105" r="4.5" fill="#3A2A18"/>
    <circle cx="86" cy="103" r="1.5" fill="#FFFFFF"/>
    <circle cx="116" cy="103" r="1.5" fill="#FFFFFF"/>
    <ellipse cx="100" cy="128" rx="8" ry="6" fill="#3A2A18"/>
    <path d="M100 134 Q100 145 92 150 Q88 154 95 158 Q105 160 110 155 Q108 148 100 142"
          fill="#FF6B9D" stroke="#E91E63" stroke-width="1.5"/>
  `);

  // ===== ANIMS map =====
  const ANIMS = {
    'ש': { wordKey: 'word-shemesh', svg: SHIN },
    'ל': { wordKey: 'word-lev',     svg: LAMED },
    'נ': { wordKey: 'word-ner',     svg: NUN },
    'א': { wordKey: 'word-aryeh',   svg: ALEF },

    'ז': { wordKey: 'word-zebra',   svg: ZAYIN },
    'י': { wordKey: 'word-yom',     svg: YUD },
    'ו': { wordKey: 'word-vered',   svg: VAV },
    'ה': { wordKey: 'word-har',     svg: HEY },

    'ס': { wordKey: 'word-saba',    svg: SAMEKH },
    'ע': { wordKey: 'word-etz',     svg: AYIN },
    'צ': { wordKey: 'word-tzipor',  svg: TZADI },
    'ט': { wordKey: 'word-tavas',   svg: TET },

    'ד': { wordKey: 'word-dag',     svg: DALET },
    'ג': { wordKey: 'word-gamal',   svg: GIMEL },
    'ח': { wordKey: 'word-chatul',  svg: HET },
    'פ': { wordKey: 'word-pil',     svg: PEY },
    'כ': { wordKey: 'word-kelev',   svg: KAF },
  };

  // ===== Public API =====
  function getAnimForLetter(letter) {
    return ANIMS[letter] || null;
  }

  function getAllAnims() {
    return ANIMS;
  }

  // mount an overlay element on body, return the cleanup function
  // משחק את word-X.mp3 + מציג SVG במרכז המסך · 1.8 שניות hold +
  // 400ms fade-out. אחרי שהתסיים — קורא ל-onComplete().
  function runAnimation(letter, onComplete) {
    const anim = getAnimForLetter(letter);
    if (!anim) {
      // אם אין מיפוי (אות לא ידועה) — לדלג שקט
      if (onComplete) onComplete();
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'letter-anim-overlay';
    overlay.innerHTML = `<div class="letter-anim-stage">${anim.svg}</div>`;
    document.body.appendChild(overlay);

    // משחק את word-X.mp3 במקביל להופעת ה-SVG
    if (window.AvneiAudio && anim.wordKey) {
      AvneiAudio.play(anim.wordKey);
    }

    // הפעלת fade-in ב-RAF
    requestAnimationFrame(() => {
      overlay.classList.add('show');
    });

    // hold 1.8 שניות (משך word-X.mp3 ~1-1.5 שניות + אוויר)
    setTimeout(() => {
      overlay.classList.add('hide');
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (onComplete) onComplete();
      }, 400); // fade-out
    }, 1800);
  }

  return {
    getAnimForLetter,
    getAllAnims,
    runAnimation,
  };
})();
