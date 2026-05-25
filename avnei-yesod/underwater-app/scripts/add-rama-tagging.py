#!/usr/bin/env python3
"""
A0.2 — הוספת שדות rama_task_alignment + peima_target לכל פריטי התרגול.

מקור: _handoff/2026-05-25-architecture-tasks.md · משימה A0.2
תאריך: 2026-05-26

מיפוי קבצים → (rama_task_alignment, peima_target):
  - island-01-words.json          → (2, 1)  · מודעות פונולוגית (הברתית) · ספט-אוק
  - island-02-twin-seaweeds.json  → (2, 1)  · מודעות פונולוגית (פונמית — same/different) · ספט-אוק
  - island-02-fish-schools.json   → (2, 1)  · מודעות פונולוגית (סיווג פונמה פותחת) · ספט-אוק
  - island-03-items.json          → (2, 1)  · hear-sound-choose-image — primary phoneme awareness · ספט-אוק
  - island-03-find-letter.json    → (1, 1)  · letter recognition בקונטקסט · ספט-אוק
  - island-03-letter-shape.json   → (1, 1)  · pure letter recognition · ספט-אוק
  - island-03-trace-paths.json    → (1, 1)  · motor pathway → תורם לזיהוי אות · ספט-אוק

הערה: כל הפריטים בפעימה 1 כי האיים 1-3 בנויים לבסיס של ספט-אוקטובר. איים שיתווספו
לפעימות 2-3 (קריאת מילים, הבנת טקסט, הכתבה) יקבלו ערכים שונים.
"""
import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

# קונפיגורציה: שם קובץ → (rama_task_alignment, peima_target, items_key)
# items_key: שם המפתח שמחזיק את רשימת הפריטים (items / rounds / words).
#            None = מטא-לבל בלבד (לא נוסיף לכל אובייקט פנימי).
CONFIG = {
    "island-01-words.json":          (2, 1, "words"),      # 15 words (stimuli for syllable games)
    "island-02-twin-seaweeds.json":  (2, 1, "rounds"),     # 8 rounds
    "island-02-fish-schools.json":   (2, 1, "rounds"),     # 8 rounds
    "island-03-items.json":          (2, 1, "items"),      # 50 items
    "island-03-find-letter.json":    (1, 1, "items"),      # 3 items
    "island-03-letter-shape.json":   (1, 1, "items"),      # 2 items
    "island-03-trace-paths.json":    (1, 1, None),         # tracing data — meta only
}


def update_file(filename: str, rama_task: int, peima: int, items_key: str | None) -> dict:
    path = DATA_DIR / filename
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    # תמיד מוסיפים גם ברמת meta כדי שיהיה ברור לכל קובץ מה הברירת מחדל שלו
    meta = data.setdefault("meta", {})
    meta["rama_task_alignment"] = rama_task
    meta["peima_target"] = peima

    count_updated = 0
    if items_key and items_key in data:
        for item in data[items_key]:
            if isinstance(item, dict):
                item["rama_task_alignment"] = rama_task
                item["peima_target"] = peima
                count_updated += 1

    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

    return {
        "file": filename,
        "rama_task": rama_task,
        "peima": peima,
        "items_updated": count_updated,
        "meta_updated": True,
    }


def main():
    print("=" * 70)
    print("A0.2 — הוספת שדות rama_task_alignment + peima_target")
    print("=" * 70)
    results = []
    for filename, (rama_task, peima, items_key) in CONFIG.items():
        try:
            result = update_file(filename, rama_task, peima, items_key)
            results.append(result)
            print(
                f"✅ {filename:34s} → task={rama_task}, peima={peima}, "
                f"items={result['items_updated']}"
            )
        except Exception as e:
            print(f"❌ {filename:34s} → ERROR: {e}")

    print("-" * 70)
    total_items = sum(r["items_updated"] for r in results)
    print(f"סה\"כ: {len(results)} קבצים, {total_items} פריטים תוייגו.")


if __name__ == "__main__":
    main()
