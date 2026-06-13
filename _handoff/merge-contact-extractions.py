#!/usr/bin/env python
"""Merge contact-extraction workflow results into foundations data."""
import sys, io, json, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, 'foundations-data-classified.json')

# Read workflow output
WF_OUT = r'C:\Users\meyta\AppData\Local\Temp\claude\c--Users-meyta-Downloads-impactos\c70a05f5-65c8-4067-be9c-4899bc0cca96\tasks\wpz45ip84.output'
with open(WF_OUT, encoding='utf-8') as f:
    payload = json.load(f)
results = payload['result']['results']
print(f'Loaded {len(results)} extraction results')

items = json.load(open(DATA, encoding='utf-8'))
fixed_with_person = 0
cleared_address = 0
for it in items:
    r = results.get(it['_id'])
    if not r: continue
    if r.get('has_real_person'):
        # Replace contact field with clean person info
        bits = []
        nm = r.get('person_name','').strip()
        role = r.get('person_role','').strip()
        em = r.get('person_email','').strip()
        ph = r.get('person_phone','').strip()
        if nm:
            bits.append(nm + (f' ({role})' if role else ''))
        if em: bits.append('✉️ ' + em)
        if ph: bits.append('📞 ' + ph)
        it['_original_contact'] = it.get('contact','')
        it['contact'] = ' · '.join(bits) if bits else ''
        it['_contact_source'] = r.get('source','web')
        it['_contact_notes'] = r.get('notes','')
        # if this was auto-review only due to bad contact, re-evaluate
        if it.get('_quality_contact') == 'bad':
            it['_quality_contact'] = 'ok'
            # rebuild auto_note without the contact issue
            note = it.get('_auto_note','')
            cleaned = ' · '.join(p for p in note.split(' · ') if 'איש קשר' not in p)
            it['_auto_note'] = cleaned
            if not cleaned:
                it['_auto_status'] = None  # back to clean / todo
        fixed_with_person += 1
    else:
        # No real person — clear the contact field, send back to todo
        it['_original_contact'] = it.get('contact','')
        it['contact'] = ''
        it['_contact_source'] = 'cleared'
        it['_contact_notes'] = r.get('notes','לא נמצא איש קשר אמיתי — נוקה')
        # remove the bad-contact issue from auto_note and downgrade if it was the only one
        note = it.get('_auto_note','')
        cleaned = ' · '.join(p for p in note.split(' · ') if 'איש קשר' not in p)
        it['_auto_note'] = cleaned
        if not cleaned:
            it['_auto_status'] = None  # back to clean / todo
        it['_quality_contact'] = 'missing'
        cleared_address += 1

with open(DATA, 'w', encoding='utf-8') as f:
    json.dump(items, f, ensure_ascii=False, indent=2)

print(f'\nFixed with real person: {fixed_with_person}')
print(f'Cleared (no person):    {cleared_address}')
print(f'\nWrote {DATA}')
