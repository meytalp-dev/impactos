#!/usr/bin/env python
"""Merge the website-finding workflow results into foundations-data-classified.json."""
import sys, io, json, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, 'foundations-data-classified.json')
RESULTS = os.path.join(HERE, 'find-websites-results.json')

items = json.load(open(DATA, encoding='utf-8'))
results = json.load(open(RESULTS, encoding='utf-8'))['results']

changed = 0
revived = 0
confirmed_dead = 0
for it in items:
    r = results.get(it['_id'])
    if not r: continue

    if r.get('has_active_presence'):
        it['_found_website'] = r.get('website_url', '')
        it['_found_apply_url'] = r.get('apply_url', '')
        it['_found_email'] = r.get('contact_email', '')
        it['_found_phone'] = r.get('contact_phone', '')
        it['_found_contact_name'] = r.get('contact_name', '')
        it['_found_notes'] = r.get('notes', '')
        it['_found_confidence'] = r.get('confidence', 'medium')

        # Reclassify — no longer "no contact". Mark as 'review' so user verifies.
        # Build a clear note showing what we found.
        parts = ['🤖 מצאתי באינטרנט: ' + r.get('notes', '')]
        if r.get('apply_url'):
            parts.append('🟢 הגשה: ' + r['apply_url'])
        elif r.get('website_url'):
            parts.append('🌐 אתר: ' + r['website_url'])
        if r.get('contact_email'):
            parts.append('✉️ ' + r['contact_email'])
        if r.get('contact_phone'):
            parts.append('📞 ' + r['contact_phone'])
        it['_auto_note'] = ' · '.join(parts)
        it['_auto_status'] = 'review'  # was 'rejected'
        revived += 1
    else:
        # Truly inactive — keep auto-reject but improve the note
        it['_found_website'] = ''
        it['_auto_note'] = '🤖 חיפשתי באינטרנט: ' + (r.get('notes') or 'לא מצאתי נוכחות מקוונת אקטיבית')
        it['_auto_status'] = 'rejected'
        confirmed_dead += 1

    changed += 1

with open(DATA, 'w', encoding='utf-8') as f:
    json.dump(items, f, ensure_ascii=False, indent=2)

print(f'Changed {changed} items')
print(f'  Revived (active presence found):    {revived}')
print(f'  Confirmed dead (kept as reject):    {confirmed_dead}')
print(f'\nWrote {DATA}')

# Stats
from collections import Counter
auto_counts = Counter(it.get('_auto_status') or 'clean' for it in items)
print('\n=== Final auto-status across all 732 ===')
for k, v in auto_counts.most_common():
    print(f'  {k:10} {v}')
