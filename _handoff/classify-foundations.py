#!/usr/bin/env python
"""Classify each foundation: open call vs direct contact, based on existing data."""
import sys, io, json, re
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

DATA = r'c:\Users\meyta\Downloads\impactos\_handoff\foundations-data.json'
OUT = r'c:\Users\meyta\Downloads\impactos\_handoff\foundations-data-classified.json'

with open(DATA, encoding='utf-8') as f:
    items = json.load(f)

# Keywords
OPEN_CALL_HINTS = [
    'קול קורא', 'קולות קוראים', 'הגשה מקוונת', 'טופס מקוון',
    'open call', 'rfp', 'apply online', 'application form',
    'מענק', 'מענקים', 'rolling basis', 'deadline',
    'מועד הגשה', 'קרא קול', 'הזמנה להציע'
]
DIRECT_HINTS = [
    'פנייה אישית', 'דרך אימייל', 'דרך מייל', 'יצירת קשר',
    'invitation only', 'by invitation', 'contact directly',
    'no unsolicited', 'אין קבלת בקשות', 'לא מקבלת פניות',
    'דרך איש קשר', 'דרך אנשי קשר'
]
WEB_HINTS = ['אתר', 'website', 'http', 'www.']
EMAIL_HINTS = ['📨', '📧', '✉', 'אימייל', 'מייל', 'email', '@']
PHONE_HINTS = ['📞', 'טלפון', 'phone', '+972', '+1-', '03-', '02-', '04-', '08-', '09-']

def classify(item):
    """Return (kind, confidence, reason)"""
    section = (item.get('_section') or '').lower()
    how = (item.get('how_to_apply') or '').lower()
    desc = (item.get('description') or '').lower()
    crit = (item.get('criteria') or '').lower()
    status = (item.get('status') or '').lower()
    sheet = item.get('_sheet') or ''

    blob = ' '.join([how, desc, crit, status, section])

    # Strong signals first
    if 'קול קורא' in section or 'קולות קוראים' in section:
        return ('open_call', 'high', 'מקטע "קולות קוראים" בקובץ המקור')

    # Sheet 3: endowments
    if sheet == 'endowments':
        if 'אפוטרופוס' in blob or 'גיידסטאר' in blob:
            return ('special', 'high', 'הקדש — פנייה דרך האפוטרופוס הכללי/גיידסטאר')
        return ('special', 'medium', 'הקדש ישראלי — בדרך כלל לא קול קורא רגיל')

    # Open call keywords
    for k in OPEN_CALL_HINTS:
        if k in blob:
            return ('open_call', 'medium', f'נמצא: "{k}"')

    # Direct contact strong signals
    for k in DIRECT_HINTS:
        if k in blob:
            return ('direct', 'high', f'נמצא: "{k}"')

    # how_to_apply analysis
    if how:
        # explicit email-based application
        if any(h in how for h in EMAIL_HINTS) and '🌐' not in how and 'אתר' not in how:
            return ('direct', 'medium', 'דרך הפנייה: אימייל ישיר')
        # explicit website-based
        if any(h in how for h in WEB_HINTS) or '🌐' in how:
            return ('open_call_likely', 'low', 'דרך הפנייה: אתר אינטרנט (יתכן קול קורא)')
        # phone only
        if any(h in how for h in PHONE_HINTS) and not any(h in how for h in WEB_HINTS):
            return ('direct', 'medium', 'דרך הפנייה: טלפון בלבד')

    # Federations usually direct
    if 'פדרציה' in section or 'פדרציות' in section:
        return ('direct', 'low', 'פדרציה — לרוב פנייה ישירה')

    return ('unknown', None, 'לא נמצא רמז ברור — דורש בדיקה')

stats = {'open_call': 0, 'open_call_likely': 0, 'direct': 0, 'special': 0, 'unknown': 0}
conf_stats = {'high': 0, 'medium': 0, 'low': 0, None: 0}

for item in items:
    kind, conf, reason = classify(item)
    item['_kind'] = kind
    item['_kind_confidence'] = conf
    item['_kind_reason'] = reason
    stats[kind] += 1
    conf_stats[conf] += 1

print('=== Classification stats ===')
labels = {
    'open_call': '🟢 קול קורא (פתוח להגשה)',
    'open_call_likely': '🟡 כנראה קול קורא (לבדוק)',
    'direct': '🔴 פנייה ישירה',
    'special': '🟣 הקדש (תהליך מיוחד)',
    'unknown': '⚪ לא ברור — לבדוק'
}
for k, v in stats.items():
    print(f'  {labels[k]:50} {v}')
print()
print('=== Confidence levels ===')
for k, v in conf_stats.items():
    print(f'  {k or "none"}: {v}')

with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(items, f, ensure_ascii=False, indent=2)
print(f'\nWrote {OUT}')
