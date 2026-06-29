#!/usr/bin/env python3
"""Transcribe the eleven-v3 proof clips with local Whisper (Hebrew) for QA."""
import json
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import whisper

PROOF = Path(__file__).parent.parent / "_audio-test" / "eleven-v3-proof"
report = json.loads((PROOF / "qa-report.json").read_text(encoding="utf-8"))

print("טוען Whisper (small)...")
model = whisper.load_model("small")


def tr(p: Path) -> str:
    if not p.exists():
        return "[no file]"
    r = model.transcribe(str(p), language="he", fp16=False)
    return (r.get("text") or "").strip()


for row in report:
    for mode in ("off", "on"):
        if f"text_{mode}" in row:
            heard = tr(PROOF / mode / f"{row['id']}.mp3")
            row[f"heard_{mode}"] = heard
            print(f"  [{mode:3s}] {row['id']:14s} expect«{row['expect']}» → heard«{heard}»")

(PROOF / "qa-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"\n✅ עודכן: {PROOF / 'qa-report.json'}")
