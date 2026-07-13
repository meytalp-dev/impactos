# whisper-t12.py — transcribe every T12 English clip and compare to the intended text.
# I cannot hear the audio; this is the accent/word QA gate.
import whisper, os, re

OUT = r"C:\Users\meyta\Downloads\impactos\lumi\app\assets\audio\words"
EXPECT = {
    "mum": "mum", "dad": "dad", "baby": "baby", "brother": "brother",
    "sister": "sister", "grandma": "grandma", "grandpa": "grandpa",
    "where-mum": "where is my mum", "where-dad": "where is my dad",
    "where-baby": "where is the baby", "where-brother": "where is my brother",
    "where-sister": "where is my sister", "where-grandma": "where is my grandma",
    "where-grandpa": "where is my grandpa",
    "this-mum": "this is my mum", "this-dad": "this is my dad",
    "this-baby": "this is the baby", "this-brother": "this is my brother",
    "this-sister": "this is my sister", "this-grandma": "this is my grandma",
    "this-grandpa": "this is my grandpa", "ilove": "i love you",
}

def norm(s):
    return re.sub(r"[^a-z ]", "", s.lower()).strip()

model = whisper.load_model("base.en")
ok, warn = 0, []
for fn, exp in EXPECT.items():
    p = os.path.join(OUT, fn + ".mp3")
    r = model.transcribe(p, language="en", fp16=False)
    got = norm(r["text"])
    # accept mum/mom (US whisper often hears British "mum" as "mom") + grandma/grandpa family variants
    e = norm(exp)
    match = got == e or got.replace("mom", "mum") == e or e in got
    status = "OK " if match else "??"
    if match: ok += 1
    else: warn.append((fn, exp, got))
    print(f"{status} {fn:16s} exp='{exp}'  heard='{got}'")
print(f"\n{ok}/{len(EXPECT)} clean. Review:", warn)
