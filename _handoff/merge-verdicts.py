#!/usr/bin/env python
"""Merge workflow verdicts into foundations-data-classified.json.

Usage: pass the workflow result JSON (the {verdicts: {...}, count, total}) on stdin or
       via the VERDICTS_FILE env var. Output overwrites foundations-data-classified.json.
"""
import sys, io, json, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

DATA = r'c:\Users\meyta\Downloads\impactos\_handoff\foundations-data-classified.json'

# Map workflow kind values back to verifier kind values
KIND_MAP = {
    'open_call': 'open_call',
    'direct': 'direct',
    'inactive': 'inactive',
    'unclear': 'unknown',
}

def load_verdicts(path):
    with open(path, encoding='utf-8') as f:
        payload = json.load(f)
    if isinstance(payload, dict) and 'verdicts' in payload:
        return payload['verdicts']
    if isinstance(payload, dict) and all(isinstance(v, dict) for v in payload.values()):
        return payload
    raise ValueError('Unrecognized verdicts payload structure')

def main(verdicts_path):
    items = json.load(open(DATA, encoding='utf-8'))
    verdicts = load_verdicts(verdicts_path)
    print(f'Loaded {len(verdicts)} verdicts')

    changed = 0
    new_open_calls = 0
    new_direct = 0
    new_inactive = 0
    still_unclear = 0
    for it in items:
        v = verdicts.get(it['_id'])
        if not v:
            continue
        new_kind = KIND_MAP.get(v.get('kind'), 'unknown')
        old_kind = it.get('_kind')
        it['_kind'] = new_kind
        it['_kind_confidence'] = v.get('confidence', 'medium')
        it['_kind_reason'] = '🤖 ' + v.get('reason', '')
        it['_active_call_url'] = v.get('active_call_url', '') or ''
        it['_evidence_url'] = v.get('evidence_url', '') or ''
        it['_research_contact'] = v.get('contact_method', '') or ''
        it['_kind_source'] = 'web_research'
        changed += 1
        if new_kind == 'open_call': new_open_calls += 1
        elif new_kind == 'direct': new_direct += 1
        elif v.get('kind') == 'inactive': new_inactive += 1
        else: still_unclear += 1

    with open(DATA, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

    print(f'Updated {changed} items')
    print(f'  → open_call:   +{new_open_calls}')
    print(f'  → direct:      +{new_direct}')
    print(f'  → inactive:    +{new_inactive}')
    print(f'  → still unclear: {still_unclear}')

if __name__ == '__main__':
    path = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('VERDICTS_FILE')
    if not path:
        print('Usage: merge-verdicts.py <verdicts.json>')
        sys.exit(1)
    main(path)
