#!/usr/bin/env python
"""Programmatic data-quality scan + HTTP check of remaining foundations.

Inputs:
  foundations-data-classified.json  (the full 732)
  קרנות-הכל-2026-06-11.csv         (user's current decisions, to skip already-decided)

Outputs:
  foundations-data-classified.json  (overwritten — adds _auto_flag, _auto_status, _auto_note, _website_status)
  user-decisions.json               (extracted state from CSV for import feature)
"""
import sys, io, json, csv, re, os, concurrent.futures, time
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import urllib.request, urllib.error, ssl

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, 'foundations-data-classified.json')
USER_CSV = r'c:\Users\meyta\Downloads\קרנות-הכל-2026-06-11.csv'
USER_DECISIONS = os.path.join(HERE, 'user-decisions.json')

# ---- Load ----
items = json.load(open(DATA, encoding='utf-8'))
by_name = {it['name']: it for it in items}

# ---- Map user CSV decisions back to items by name ----
status_map = {'approved': 'approved', 'rejected': 'rejected', 'review': 'review'}
decisions = {}
with open(USER_CSV, encoding='utf-8-sig') as f:
    for r in csv.DictReader(f):
        st = r['סטטוס'].strip()
        if st not in status_map:
            continue
        item = by_name.get(r['שם'])
        if not item:
            continue
        decisions[item['_id']] = {
            'status': status_map[st],
            'note': r.get('הערה', '').strip(),
            'ts': r.get('חותמת זמן', '').strip()
        }
print(f'User decisions found: {len(decisions)}')

with open(USER_DECISIONS, 'w', encoding='utf-8') as f:
    json.dump(decisions, f, ensure_ascii=False, indent=2)
print(f'Wrote {USER_DECISIONS}')

# ---- Quality checks ----
EMAIL_RE = re.compile(r'^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$')
URL_HINTS = re.compile(r'(https?://|www\.|\.com|\.org|\.co\.il|\.gov\.il|\.net|\.org\.il)', re.I)
PHONE_RE = re.compile(r'^[+0-9][\d \-()]{5,}$')
HEBREW_WORD = re.compile(r'[֐-׿]')

def check_email(s):
    s = (s or '').strip()
    if not s: return ('missing', '')
    # multiple emails separated by comma/semicolon
    parts = re.split(r'[;,]\s*', s)
    if all(EMAIL_RE.match(p.strip()) for p in parts if p.strip()):
        return ('ok', '')
    # contains a URL?
    if URL_HINTS.search(s) and '@' not in s:
        return ('bad', 'נראה כמו כתובת אתר ולא אימייל')
    if '@' not in s:
        return ('bad', 'אין @ באימייל')
    return ('suspicious', 'פורמט אימייל חשוד')

def check_phone(s):
    s = (s or '').strip()
    if not s: return ('missing', '')
    # remove common noise
    cleaned = s.split(',')[0].split(';')[0].strip()
    if PHONE_RE.match(cleaned):
        return ('ok', '')
    return ('suspicious', 'פורמט טלפון לא תקני')

def check_contact_name(s):
    """contact should be a person's name, not an address/blurb."""
    s = (s or '').strip()
    if not s: return ('missing', '')
    # very long = probably address/blurb
    if len(s) > 80:
        return ('bad', 'שדה איש קשר ארוך מדי (כנראה כתובת/תיאור, לא שם)')
    # contains a clear address marker
    addr_markers = ['Street', 'Avenue', 'POB', 'P.O.', 'Box ', 'בית מס', 'רחוב ', 'ת.ד.', 'ת"ד', 'POB ', '5252', '91101']
    for m in addr_markers:
        if m in s:
            return ('bad', f'שדה איש קשר מכיל כתובת ("{m}")')
    # contains a URL
    if URL_HINTS.search(s):
        return ('bad', 'שדה איש קשר מכיל URL')
    # phone-only
    if PHONE_RE.match(s) and not HEBREW_WORD.search(s):
        return ('suspicious', 'איש קשר נראה כמו טלפון')
    return ('ok', '')

def check_website(s):
    s = (s or '').strip()
    if not s: return ('missing', '')
    if not s.startswith(('http://', 'https://')):
        # try fixing
        if s.startswith('www.') or '.' in s:
            return ('suspicious', 'URL ללא http:// — דורש בדיקה')
        return ('bad', 'אתר לא נראה כתקני')
    return ('ok', '')

# ---- Apply checks ----
print('\n=== Quality checks ===')
flags = {'website': 0, 'email': 0, 'contact': 0, 'phone': 0, 'no_contact': 0}
for it in items:
    issues = []

    w = check_website(it.get('website', ''))
    e = check_email(it.get('email', ''))
    p = check_phone(it.get('phone', ''))
    c = check_contact_name(it.get('contact', '') or it.get('contact_info', ''))

    it['_quality_website'] = w[0]
    it['_quality_email'] = e[0]
    it['_quality_phone'] = p[0]
    it['_quality_contact'] = c[0]

    if w[1]: issues.append('🌐 ' + w[1]); flags['website'] += 1
    if e[1]: issues.append('✉️ ' + e[1]); flags['email'] += 1
    if c[1]: issues.append('👤 ' + c[1]); flags['contact'] += 1
    if p[1]: issues.append('📞 ' + p[1]); flags['phone'] += 1

    # No-contact-anywhere check — does NOT apply to endowments (special process via guardian/guidestar)
    has_any = (e[0] == 'ok') or (p[0] == 'ok') or (w[0] in ('ok', 'suspicious'))
    if not has_any and it.get('_sheet') != 'endowments':
        issues.append('❌ אין דרך ליצור קשר (אין אימייל/טלפון/אתר תקינים)')
        flags['no_contact'] += 1
        it['_auto_status'] = 'rejected'
    elif issues:
        it['_auto_status'] = 'review'
    else:
        it['_auto_status'] = None

    it['_auto_note'] = ' · '.join(issues) if issues else ''
    it['_auto_flag'] = bool(issues)

print(f'  website issues:        {flags["website"]}')
print(f'  email issues:          {flags["email"]}')
print(f'  contact field issues:  {flags["contact"]}')
print(f'  phone issues:          {flags["phone"]}')
print(f'  no-contact-at-all:     {flags["no_contact"]}')

# ---- HTTP check on website URLs (only for non-special, non-already-decided) ----
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def head(url, timeout=8):
    if not url:
        return ('none', '')
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    req = urllib.request.Request(url, method='HEAD', headers={
        'User-Agent': 'Mozilla/5.0 (compatible; FoundationsVerifier/1.0)'
    })
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
            code = r.status
            return ('ok' if code < 400 else f'http_{code}', '')
    except urllib.error.HTTPError as e:
        # Some servers reject HEAD — try GET
        if e.code in (405, 403, 400):
            try:
                req2 = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req2, timeout=timeout, context=ctx) as r2:
                    return ('ok' if r2.status < 400 else f'http_{r2.status}', '')
            except Exception as e2:
                return ('error', str(e2)[:80])
        return (f'http_{e.code}', '')
    except urllib.error.URLError as e:
        return ('unreachable', str(e.reason)[:80])
    except Exception as e:
        return ('error', str(e)[:80])

# Only HEAD-check items where:
# - we haven't already decided
# - they have a website that didn't fail basic format check
# - they're not endowments (those usually don't have websites)
to_check = []
for it in items:
    if it['_id'] in decisions: continue
    if it.get('_sheet') == 'endowments': continue
    url = (it.get('website') or '').strip()
    if not url: continue
    to_check.append(it)

print(f'\n=== HTTP check on {len(to_check)} websites (parallel, timeout=8s) ===')
start = time.time()

def worker(it):
    status, msg = head(it.get('website', ''))
    return (it['_id'], status, msg)

results = {}
with concurrent.futures.ThreadPoolExecutor(max_workers=24) as ex:
    futures = {ex.submit(worker, it): it for it in to_check}
    for i, fut in enumerate(concurrent.futures.as_completed(futures)):
        rid, status, msg = fut.result()
        results[rid] = (status, msg)
        if (i+1) % 50 == 0:
            print(f'  {i+1}/{len(to_check)} done ({int(time.time()-start)}s)')

print(f'  total: {int(time.time()-start)}s')

# Tally
from collections import Counter
status_counts = Counter(s for s, _ in results.values())
print('\n=== Website status counts ===')
for k, v in status_counts.most_common():
    print(f'  {k:15} {v}')

# Merge into items
broken_added = 0
for it in items:
    rid = it['_id']
    if rid not in results:
        continue
    status, msg = results[rid]
    it['_website_status'] = status
    if status != 'ok':
        # add to auto note
        issue = '🌐 האתר לא נטען (' + status + ')'
        cur = it.get('_auto_note', '')
        if issue not in cur:
            it['_auto_note'] = (cur + ' · ' if cur else '') + issue
        if not it.get('_auto_status'):
            it['_auto_status'] = 'review'
        it['_auto_flag'] = True
        broken_added += 1
print(f'\nAdded broken-website flags to {broken_added} items')

# ---- Save back ----
with open(DATA, 'w', encoding='utf-8') as f:
    json.dump(items, f, ensure_ascii=False, indent=2)
print(f'\nWrote {DATA}')

# Final summary on the 516 remaining
remaining = [it for it in items if it['_id'] not in decisions]
auto_remaining = Counter()
for it in remaining:
    auto_remaining[it.get('_auto_status') or 'clean'] += 1
print(f'\n=== Auto-status on {len(remaining)} remaining ===')
for k, v in auto_remaining.most_common():
    print(f'  {k:10} {v}')
