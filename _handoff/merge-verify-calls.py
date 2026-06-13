#!/usr/bin/env python
"""Merge call-verification workflow results."""
import sys, io, json, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, 'foundations-data-classified.json')
RESULTS = os.path.join(HERE, 'verify-calls-results.json')

results = json.load(open(RESULTS, encoding='utf-8'))['results']
items = json.load(open(DATA, encoding='utf-8'))

KIND_FOR = {
    'open_call_active': 'open_call',
    'open_call_closed': 'inactive',   # call is over, no longer worth pursuing this specific call
    'direct': 'direct',
    'inactive': 'inactive',
    'unclear': 'unknown',
}
AUTO_FOR = {
    'open_call_active': None,         # leave for user review
    'open_call_closed': 'rejected',   # call closed → can't apply
    'direct': None,
    'inactive': 'rejected',
    'unclear': 'review',
}

changed = 0
for it in items:
    r = results.get(it['_id'])
    if not r: continue
    cls = r.get('classification', 'unclear')
    new_kind = KIND_FOR.get(cls, 'unknown')
    it['_kind'] = new_kind
    it['_kind_confidence'] = r.get('confidence', 'medium')

    # Build clear note
    notes = r.get('notes', '')
    deadline = r.get('deadline', '')
    grant = r.get('grant_amount', '')
    apply_url = r.get('apply_url', '')
    parts = ['🤖 ' + notes]
    if deadline: parts.append(f'⏰ דדליין: {deadline}')
    if grant: parts.append(f'💰 גובה: {grant}')
    it['_kind_reason'] = ' · '.join(parts)
    it['_kind_source'] = 'web_research'

    if apply_url:
        it['_active_call_url'] = apply_url
    if r.get('contact_email'):
        it['_found_email'] = r['contact_email']
    if r.get('contact_phone'):
        it['_found_phone'] = r['contact_phone']

    # Set auto_status
    auto = AUTO_FOR.get(cls)
    if auto:
        it['_auto_status'] = auto
        if cls == 'open_call_closed':
            it['_auto_note'] = '🤖 קול קורא סגור: ' + notes
        elif cls == 'inactive':
            it['_auto_note'] = '🤖 לא פעיל: ' + notes
        elif cls == 'unclear':
            it['_auto_note'] = '🤖 לא ברור אחרי מחקר: ' + notes
    else:
        # clear any stale auto-status (e.g. if we previously had review)
        it['_auto_status'] = None
        it['_auto_note'] = ''

    changed += 1

with open(DATA, 'w', encoding='utf-8') as f:
    json.dump(items, f, ensure_ascii=False, indent=2)

print(f'Changed {changed} items')

# Final stats
from collections import Counter
kinds = Counter(it['_kind'] for it in items)
print('\n=== Final kind distribution across all 732 ===')
for k, v in kinds.most_common():
    print(f'  {k:15} {v}')

auto = Counter(it.get('_auto_status') or 'clean' for it in items)
print('\n=== Auto-status ===')
for k, v in auto.most_common():
    print(f'  {k:10} {v}')
