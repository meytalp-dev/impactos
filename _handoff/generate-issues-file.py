#!/usr/bin/env python
"""Generate a unified file of all foundations that need data verification.

Combines:
  - items I auto-flagged (review or reject)
  - items the user marked as 'review' in her CSV

Outputs:
  c:\\Users\\meyta\\Downloads\\קרנות-לבדיקה.csv
  c:\\Users\\meyta\\Downloads\\impactos\\tools\\foundations-issues.html (mobile-friendly view)
"""
import sys, io, json, csv, os, html
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, 'foundations-data-classified.json')
USER_CSV = r'c:\Users\meyta\Downloads\קרנות-הכל-2026-06-11.csv'
OUT_CSV = r'c:\Users\meyta\Downloads\קרנות-לבדיקה.csv'

items = json.load(open(DATA, encoding='utf-8'))
by_name = {it['name']: it for it in items}

# load user CSV decisions
user_decisions = {}
with open(USER_CSV, encoding='utf-8-sig') as f:
    for r in csv.DictReader(f):
        if r.get('סטטוס','').strip() in ('approved','rejected','review'):
            it = by_name.get(r['שם'])
            if it:
                user_decisions[it['_id']] = {
                    'status': r['סטטוס'].strip(),
                    'note': r.get('הערה','').strip()
                }

# Pick all that need verification
to_verify = []
for it in items:
    user = user_decisions.get(it['_id'])
    auto_status = it.get('_auto_status')
    auto_note = it.get('_auto_note', '')

    source = []
    reasons = []
    status_now = ''

    if user and user['status'] == 'review':
        source.append('🟣 את')
        reasons.append(user['note'] or '(ללא הערה)')
        status_now = 'review'
    if auto_status in ('review', 'rejected') and (not user or user['status'] not in ('approved','rejected')):
        source.append('🤖 בדיקה אוטומטית')
        reasons.append(auto_note or '(אין פרטים)')
        if not status_now:
            status_now = auto_status

    if not source:
        continue

    KIND_LABEL = {
        'open_call': '🟢 קול קורא',
        'direct': '🔴 פנייה ישירה',
        'special': '🟣 הקדש',
        'inactive': '⚫ סגורה',
        'unknown': '⚪ לא ברור'
    }

    to_verify.append({
        'מקור הסימון': ' + '.join(source),
        'סטטוס נוכחי': status_now,
        'סוג קרן': KIND_LABEL.get(it.get('_kind'), it.get('_kind','')),
        'שם': it['name'],
        'בעיות שזוהו': ' · '.join(reasons),
        'אתר בקובץ': it.get('website','') or '(ריק)',
        'אימייל בקובץ': it.get('email','') or '(ריק)',
        'טלפון בקובץ': it.get('phone','') or '(ריק)',
        'איש קשר בקובץ': it.get('contact','') or it.get('contact_info','') or '(ריק)',
        'מקטע': it.get('_section',''),
        'תיאור': (it.get('description') or it.get('purpose','') or '')[:200],
        'קישור לחיפוש בגוגל': f'https://www.google.com/search?q=' + it['name'].replace(' ','+'),
    })

print(f'Total to verify: {len(to_verify)}')

# Breakdown by source
from collections import Counter
src = Counter(it['מקור הסימון'] for it in to_verify)
print('\n=== By source ===')
for k, v in src.most_common():
    print(f'  {v:4} {k}')

# Order: user-marked first, then auto
to_verify.sort(key=lambda x: (
    0 if 'את' in x['מקור הסימון'] else 1,
    x['סטטוס נוכחי'],
    x['שם']
))

# Write CSV (with BOM for Excel Hebrew)
with open(OUT_CSV, 'w', encoding='utf-8-sig', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(to_verify[0].keys()))
    w.writeheader()
    w.writerows(to_verify)
print(f'\nWrote {OUT_CSV}')

# ---- HTML view ----
OUT_HTML = r'c:\Users\meyta\Downloads\impactos\tools\foundations-issues.html'

def esc(s): return html.escape(str(s or ''))

def ensure_url(u):
    if not u or u == '(ריק)': return ''
    u = u.strip()
    if not u.startswith(('http://','https://')):
        u = 'https://' + u
    return u

cards_html = []
for v in to_verify:
    src = v['מקור הסימון']
    src_class = 'user' if 'את' in src else 'auto'
    name = esc(v['שם'])
    google = v['קישור לחיפוש בגוגל']
    site = ensure_url(v['אתר בקובץ'])
    cards_html.append(f"""
    <article class="card {src_class}">
      <header>
        <h2>{name}</h2>
        <span class="src">{esc(src)}</span>
      </header>
      <div class="kind">{esc(v['סוג קרן'])} · {esc(v['מקטע'])}</div>
      <div class="issue">⚠️ {esc(v['בעיות שזוהו'])}</div>
      <div class="fields">
        <div><b>אתר:</b> {esc(v['אתר בקובץ'])}</div>
        <div><b>אימייל:</b> {esc(v['אימייל בקובץ'])}</div>
        <div><b>טלפון:</b> {esc(v['טלפון בקובץ'])}</div>
        <div><b>איש קשר:</b> {esc(v['איש קשר בקובץ'])}</div>
      </div>
      <div class="actions">
        <a class="btn primary" href="{esc(google)}" target="_blank" rel="noopener">🔍 חיפוש בגוגל</a>
        {f'<a class="btn" href="{esc(site)}" target="_blank" rel="noopener">🌐 פתח אתר</a>' if site else ''}
      </div>
    </article>""")

html_doc = f"""<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>קרנות לבדיקת נתונים · {len(to_verify)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  *{{box-sizing:border-box}}
  body{{margin:0;padding:16px 12px;background:#f5f7f8;color:#102a33;font-family:'Heebo',system-ui,sans-serif;font-size:15px;line-height:1.5;max-width:780px;margin:0 auto}}
  h1{{font-size:18px;margin:0 0 8px;display:flex;align-items:center;gap:8px;justify-content:space-between}}
  h1 .tot{{font-size:13px;background:#fff;padding:4px 10px;border-radius:999px;border:1px solid #e3e8ea;font-weight:600;color:#4b5d63}}
  .legend{{font-size:12px;color:#4b5d63;margin:0 0 16px;background:#fff;padding:10px 12px;border-radius:10px;border:1px solid #e3e8ea}}
  .legend b{{color:#102a33}}
  .card{{background:#fff;border:1px solid #e3e8ea;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 1px 2px rgba(0,0,0,.03)}}
  .card.user{{border-right:4px solid #a855f7}}
  .card.auto{{border-right:4px solid #f97316}}
  .card header{{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px}}
  .card h2{{font-size:16px;margin:0;font-weight:700;line-height:1.3}}
  .src{{font-size:11px;font-weight:600;background:#f1f5f9;padding:3px 8px;border-radius:999px;white-space:nowrap;color:#475569}}
  .card.user .src{{background:#faf5ff;color:#7e22ce}}
  .card.auto .src{{background:#fff7ed;color:#c2410c}}
  .kind{{font-size:12px;color:#4b5d63;margin-bottom:8px}}
  .issue{{font-size:13px;padding:8px 10px;background:#fef3c7;border-radius:6px;color:#78350f;margin-bottom:8px;line-height:1.5}}
  .fields{{font-size:13px;background:#f8fafc;border-radius:8px;padding:8px 10px;margin-bottom:10px;display:grid;gap:4px}}
  .fields b{{color:#4b5d63;font-weight:600;margin-left:4px}}
  .fields div{{word-break:break-word}}
  .actions{{display:flex;gap:6px;flex-wrap:wrap}}
  .btn{{display:inline-flex;align-items:center;gap:6px;padding:0 14px;height:38px;border-radius:10px;font-size:13px;font-weight:700;text-decoration:none;background:#f1f5f9;color:#102a33;border:1px solid #e3e8ea}}
  .btn.primary{{background:#0f766e;color:#fff;border-color:#0f766e}}
  .filter-bar{{position:sticky;top:0;background:#f5f7f8;padding:10px 0 12px;z-index:10;margin:-16px -12px 12px;padding:12px}}
  .chips{{display:flex;gap:6px;overflow-x:auto;padding:2px 0}}
  .chip{{flex:0 0 auto;padding:6px 12px;border-radius:999px;border:1px solid #d6dee1;background:#fff;font:inherit;font-size:13px;font-weight:600;cursor:pointer;color:#102a33}}
  .chip.active{{background:#102a33;color:#fff;border-color:#102a33}}
</style>
</head>
<body>
<h1>
  <span>קרנות לבדיקת נתונים</span>
  <span class="tot">{len(to_verify)}</span>
</h1>
<div class="legend">
  <b>🟣 את</b> = סימנת ל"לבדוק" ב־CSV שלך (29 קרנות).
  <b>🤖 בדיקה אוטומטית</b> = הסקריפט שלי זיהה בעיית נתונים: אתר לא נטען, איש קשר עם כתובת, אימייל חשוד, אין אמצעי קשר כלל.
</div>
<div class="filter-bar">
  <div class="chips" id="chips">
    <button class="chip active" data-f="all">הכל</button>
    <button class="chip" data-f="user">🟣 שלך</button>
    <button class="chip" data-f="auto">🤖 אוטומטי</button>
  </div>
</div>
<div id="list">
{''.join(cards_html)}
</div>
<script>
document.getElementById('chips').addEventListener('click', e => {{
  const c = e.target.closest('.chip');
  if (!c) return;
  document.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
  c.classList.add('active');
  const f = c.dataset.f;
  document.querySelectorAll('.card').forEach(card => {{
    if (f === 'all') card.style.display = '';
    else if (f === 'user') card.style.display = card.classList.contains('user') ? '' : 'none';
    else if (f === 'auto') card.style.display = card.classList.contains('auto') ? '' : 'none';
  }});
}});
</script>
</body>
</html>
"""
with open(OUT_HTML, 'w', encoding='utf-8') as f:
    f.write(html_doc)
print(f'Wrote {OUT_HTML}')
