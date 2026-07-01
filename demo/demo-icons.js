/* demo-icons.js — אייקוני קו מקצועיים לסרגל הצד (מחליף [data-ic] ב-SVG) */
(function(){
  var S='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">';
  var I={
    home:    S+'<path d="M4 11.5 12 5l8 6.5"/><path d="M6 10.3V19h12v-8.7"/><path d="M10 19v-4.2h4V19"/></svg>',
    classes: S+'<rect x="4" y="4" width="7" height="7" rx="1.4"/><rect x="13" y="4" width="7" height="7" rx="1.4"/><rect x="4" y="13" width="7" height="7" rx="1.4"/><rect x="13" y="13" width="7" height="7" rx="1.4"/></svg>',
    people:  S+'<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c.7-3 2.9-4.5 5.5-4.5S13.8 16 14.5 19"/><path d="M16 5.8a3 3 0 0 1 0 5.7"/><path d="M17.6 14.4c2 .7 3.3 2.1 3.8 4.4"/></svg>',
    learn:   S+'<path d="M12 6.6C10.4 5.2 7.6 4.7 4 5.2v13c3.6-.5 6.4 0 8 1.4 1.6-1.4 4.4-1.9 8-1.4v-13c-3.6-.5-6.4 0-8 1.4Z"/><path d="M12 6.6V20"/></svg>',
    chart:   S+'<path d="M5 19V5"/><path d="M5 19h14"/><path d="M9 16v-4"/><path d="M13 16V9"/><path d="M17 16v-6"/></svg>',
    resources:S+'<path d="M12 4 3.5 8.2 12 12.4l8.5-4.2L12 4Z"/><path d="M4 12.4 12 16.6l8-4.2"/></svg>',
    chat:    S+'<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v7.5A1.5 1.5 0 0 1 19 15.5H9.6L5.5 19v-3.5H5A1.5 1.5 0 0 1 3.5 14V6.5A1.5 1.5 0 0 1 5 5Z"/></svg>',
    settings:S+'<path d="M4 7h8"/><circle cx="15" cy="7" r="2.1"/><path d="M18 7h2"/><path d="M4 17h4"/><circle cx="11" cy="17" r="2.1"/><path d="M14 17h6"/></svg>',
    book:    S+'<path d="M12 6.6C10.4 5.2 7.6 4.7 4 5.2v13c3.6-.5 6.4 0 8 1.4 1.6-1.4 4.4-1.9 8-1.4v-13c-3.6-.5-6.4 0-8 1.4Z"/><path d="M12 6.6V20"/></svg>',
    link:    S+'<path d="M10.5 13.5a4 4 0 0 0 5.7 0l2.3-2.3a4 4 0 0 0-5.7-5.7l-1.2 1.2"/><path d="M13.5 10.5a4 4 0 0 0-5.7 0l-2.3 2.3a4 4 0 0 0 5.7 5.7l1.2-1.2"/></svg>',
    report:  S+'<path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4"/><path d="M9.5 12h5"/><path d="M9.5 15.5h5"/></svg>',
    pulse:   S+'<path d="M20.5 9.3c0-2.2-1.8-3.9-3.9-3.9-1.5 0-2.8.8-3.5 2-.7-1.2-2-2-3.5-2C7.3 5.4 5.5 7.1 5.5 9.3c0 .5.1 1 .3 1.5h2.4l1-1.7 1.8 3.4 1.4-2.3h1.3"/><path d="M6.2 10.8c1 2 3.1 4 5.8 6 2.7-2 4.8-4 5.8-6"/></svg>',
    calendar:S+'<rect x="4" y="5.5" width="16" height="15" rx="2"/><path d="M4 9.5h16"/><path d="M8 3.5v3.6"/><path d="M16 3.5v3.6"/><path d="M8 13h2.2"/><path d="M13.8 13H16"/><path d="M8 16.5h2.2"/></svg>',
    /* --- content / status line-icons (serious, no emoji) --- */
    target:  S+'<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r=".9" fill="currentColor" stroke="none"/></svg>',
    waves:   S+'<path d="M3 8c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/><path d="M3 13c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/><path d="M3 18c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/></svg>',
    scale:   S+'<path d="M12 4v16"/><path d="M7.5 7h9"/><path d="M7.5 7 4.6 13.2a2.6 2.6 0 0 0 5.8 0L7.5 7Z"/><path d="M16.5 7l-2.9 6.2a2.6 2.6 0 0 0 5.8 0L16.5 7Z"/><path d="M8.5 20h7"/></svg>',
    heart:   S+'<path d="M12 19s-6-3.8-8-7.2C2.4 8.7 3.8 5.8 6.6 5.8c1.6 0 2.8.9 3.4 1.9.6-1 1.8-1.9 3.4-1.9 2.8 0 4.2 2.9 2.6 6C18 15.2 12 19 12 19Z"/></svg>',
    trend:   S+'<path d="M4 15.5l5-5 3 3 6.5-6.5"/><path d="M14.5 7h4.5v4.5"/></svg>',
    alert:   S+'<path d="M12 4.6 21 19H3L12 4.6Z"/><path d="M12 10v4"/><path d="M12 16.8h.01"/></svg>',
    checkcircle:S+'<circle cx="12" cy="12" r="8.2"/><path d="M8.4 12.2l2.4 2.4 4.7-4.9"/></svg>',
    sound:   S+'<path d="M5 9.5v5h3l4 3.4V6.1L8 9.5H5Z"/><path d="M15.3 9.4a3.6 3.6 0 0 1 0 5.2"/><path d="M17.6 7.2a6.8 6.8 0 0 1 0 9.6"/></svg>',
    userplus:S+'<circle cx="10" cy="8.5" r="3"/><path d="M4 18.6c.7-3 2.9-4.6 6-4.6"/><path d="M17.5 9.5v5"/><path d="M15 12h5"/></svg>',
    edit:    S+'<path d="M4 20h4L18.5 9.5l-4-4L4 16v4Z"/><path d="M13.5 6.5l4 4"/></svg>',
    upload:  S+'<path d="M12 16V5.5"/><path d="M8 9.5l4-4 4 4"/><path d="M5 19h14"/></svg>',
    refresh: S+'<path d="M19 8a7 7 0 0 0-12-2.2L4 8.5"/><path d="M4 4.5v4h4"/><path d="M5 16a7 7 0 0 0 12 2.2l3-2.7"/><path d="M20 19.5v-4h-4"/></svg>',
    playcircle:S+'<circle cx="12" cy="12" r="8.2"/><path d="M10.3 9.1l4.4 2.9-4.4 2.9V9.1Z" fill="currentColor" stroke="none"/></svg>',
    eye:     S+'<path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"/><circle cx="12" cy="12" r="2.6"/></svg>',
    leaf:    S+'<path d="M5 18c0-7 5-12 14-12 0 9-5 14-12 14a5 5 0 0 1-2-2Z"/><path d="M5 18c3-3 6-5 9-6"/></svg>',
    tools:   S+'<path d="M14.5 6.5a3.5 3.5 0 0 0 4.6 4.4l-7.8 7.8a2 2 0 0 1-2.8-2.8l7.8-7.8Z"/><path d="M6 6l3 3"/><path d="M4.5 4.5 9 9"/></svg>',
    star:    S+'<path d="M12 4.5l2.3 4.7 5.2.8-3.8 3.7.9 5.1-4.6-2.4-4.6 2.4.9-5.1L4.5 10l5.2-.8L12 4.5Z"/></svg>',
    flag:    S+'<path d="M6 21V4"/><path d="M6 5h11l-2 3 2 3H6"/></svg>',
    bulb:    S+'<path d="M9 17h6"/><path d="M10 20h4"/><path d="M8.5 14.5a5 5 0 1 1 7 0c-.6.6-1 1.2-1 2h-5c0-.8-.4-1.4-1-2Z"/></svg>',
    doc:     S+'<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M9.5 12.5h5"/><path d="M9.5 16h5"/></svg>',
    sparkle: S+'<path d="M12 4.5c.6 3.6 1.4 4.4 5 5-3.6.6-4.4 1.4-5 5-.6-3.6-1.4-4.4-5-5 3.6-.6 4.4-1.4 5-5Z"/><path d="M18.5 13.5c.3 1.6.7 2 2.3 2.3-1.6.3-2 .7-2.3 2.3-.3-1.6-.7-2-2.3-2.3 1.6-.3 2-.7 2.3-2.3Z"/></svg>',
    handshake:S+'<path d="M11 7 8 9.5a2 2 0 0 0 2.6 3l1.4-1.2 3 2.7a1.5 1.5 0 0 0 2.2-2"/><path d="M13 7l3.5 3"/><path d="M3 9l3-2 5 2"/><path d="M21 9l-3-2-2 1"/></svg>',
    plus:    S+'<path d="M12 5.5v13"/><path d="M5.5 12h13"/></svg>',
    check:   S+'<path d="M5 12.5l4.5 4.5L19 7"/></svg>',
    chevright:S+'<path d="M14 7l-5 5 5 5"/></svg>',
    chevleft: S+'<path d="M10 7l5 5-5 5"/></svg>'
  };
  function fill(){
    document.querySelectorAll('[data-ic]').forEach(function(el){
      var k=el.getAttribute('data-ic'); if(I[k]) el.innerHTML=I[k];
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fill); else fill();
  window.DemoIcons=I;
})();
