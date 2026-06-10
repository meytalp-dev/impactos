#!/usr/bin/env python
"""Build the final foundations-verifier HTML by inlining the JSON into the template."""
import sys, io, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

HERE = os.path.dirname(os.path.abspath(__file__))
TEMPLATE = os.path.join(HERE, 'foundations-verifier-template.html')
DATA = os.path.join(HERE, 'foundations-data-classified.json')
OUT = os.path.join(HERE, 'foundations-verifier.html')

with open(TEMPLATE, encoding='utf-8') as f:
    tpl = f.read()
with open(DATA, encoding='utf-8') as f:
    data = f.read()

# Safe to embed: data has no </script> sequences (it's a JSON array of strings).
# But to be defensive, escape any </script substring.
data = data.replace('</script', '<\\/script')

out = tpl.replace('__DATA__', data)
with open(OUT, 'w', encoding='utf-8') as f:
    f.write(out)

size_kb = os.path.getsize(OUT) // 1024
print(f'Wrote {OUT}')
print(f'Size: {size_kb} KB')
