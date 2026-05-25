#!/usr/bin/env python3
"""
חיזוק קושי של L3 ו-L4 ב-island-03-items.json — אפשרות D (אתגר במיקום)

מקור: שיחה עם מיטל ב-26.5.2026. גרסה 2 אחרי גילוי קונפליקט עם
perplexity-island2-mechanics-2026-05-23.json (אסור זוגות קוליים + גרוניות
בשלבים מוקדמים).

עקרון פדגוגי (Option D):
  L3 = 3 אפשרויות: 1 מסיח-מיקום + 1 רנדומלי בטוח.
  L4 = 4 אפשרויות: 2 מסיחי-מיקום + 1 רנדומלי בטוח.

מסיח-מיקום = מילה שמכילה את האות-יעד אבל **לא בהתחלה**.
דוגמה: target=תְּרוּפָה (ת בהתחלה) · distractor=בַּיִת 🏠 (ת בסוף).

יתרונות:
  ✅ תואם לאימות הפדגוגי הקיים (לא משתמש בזוגות קוליים אסורים)
  ✅ בודק את המיומנות האמיתית — זיהוי מיקום פונמה (משימה 2 ראמ"ה)
  ✅ אבחוני: ילדה שטועה — לא מבחינה בין "מתחיל ב-" ל-"מכיל"

מילים שעבורן כל הילדים בכיתה א' מכירים, ויש להן ייצוג חזותי ברור (emoji).
המסיחים לא צריכים image_url — emoji מספיק (תואם למבנה הקיים).
"""
import json
from pathlib import Path

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "island-03-items.json"


def opt(word: str, emoji: str, image_url: str = None, correct: bool = False, category: str = "noun") -> dict:
    """בונה אופציה אחת."""
    o = {
        "word": word,
        "concept": word.translate({ord(c): None for c in "ְֱֲֳִֵֶַָֹֻּׁׂ"}),
        "emoji_suggestion": emoji,
        "category": category,
    }
    if image_url:
        o["image_url"] = image_url
    if correct:
        o["correct"] = True
    return o


# 20 פריטים חדשים — אפשרות D
NEW_OPTIONS = {
    # ============ ת (/t/) ============
    "i03-ת-l3-01": [
        opt("תִּינוֹק", "👶", "images/island-03/tinok.png", correct=True, category="nouns_people"),
        opt("בַּיִת", "🏠", category="nouns_objects"),                  # ת בסוף
        opt("שֶׁמֶשׁ", "☀️", category="nouns_nature"),                  # safe random (continuant)
    ],
    "i03-ת-l3-02": [
        opt("תִּיק", "👜", "images/island-03/tik.png", correct=True, category="nouns_objects"),
        opt("כִּתָּה", "🏫", category="nouns_objects"),                 # ת באמצע
        opt("לֵב", "❤️", category="nouns_body"),                       # safe random
    ],
    "i03-ת-l4-01": [
        opt("תִּיק", "👜", "images/island-03/tik.png", correct=True, category="nouns_objects"),
        opt("בַּיִת", "🏠", category="nouns_objects"),                  # ת בסוף
        opt("מַתָּנָה", "🎁", category="nouns_objects"),                # ת באמצע
        opt("שֶׁמֶשׁ", "☀️", category="nouns_nature"),                  # safe random
    ],
    "i03-ת-l4-02": [
        opt("תְּרוּפָה", "💊", "images/island-03/trufa.png", correct=True, category="nouns_objects"),
        opt("כִּתָּה", "🏫", category="nouns_objects"),                 # ת באמצע
        opt("בַּיִת", "🏠", category="nouns_objects"),                  # ת בסוף
        opt("לֵב", "❤️", category="nouns_body"),                       # safe random
    ],

    # ============ מ (/m/) ============
    "i03-מ-l3-01": [
        opt("מִיטָּה", "🛏️", "images/island-03/mita.png", correct=True, category="nouns_objects"),
        opt("שֶׁמֶשׁ", "☀️", category="nouns_nature"),                  # מ באמצע
        opt("נְמָלָה", "🐜", category="nouns_animals"),                  # safe random
    ],
    "i03-מ-l3-02": [
        opt("מִכְנָסַיִם", "👖", "images/island-03/michnasayim.png", correct=True, category="nouns_objects"),
        opt("שָׁלוֹם", "✌️", category="nouns_abstract"),                # מ בסוף
        opt("לִוְיָתָן", "🐋", category="nouns_animals"),                # safe random
    ],
    "i03-מ-l4-01": [
        opt("מַפְתֵּחַ", "🔑", "images/island-03/mafteach.png", correct=True, category="nouns_objects"),
        opt("שֶׁמֶשׁ", "☀️", category="nouns_nature"),                  # מ באמצע
        opt("חֲלוֹם", "💭", category="nouns_abstract"),                # מ בסוף
        opt("סֵפֶר", "📖", category="nouns_objects"),                   # safe random
    ],
    "i03-מ-l4-02": [
        opt("מִכְנָסַיִם", "👖", "images/island-03/michnasayim.png", correct=True, category="nouns_objects"),
        opt("שָׁלוֹם", "✌️", category="nouns_abstract"),                # מ בסוף
        opt("שָׁמַיִם", "☁️", category="nouns_nature"),                  # מ באמצע
        opt("נְמָלָה", "🐜", category="nouns_animals"),                  # safe random
    ],

    # ============ ר (/r/) ============
    "i03-ר-l3-01": [
        opt("רוֹפֵא", "🩺", "images/island-03/rofe.png", correct=True, category="nouns_people"),
        opt("שִׁיר", "🎵", category="nouns_abstract"),                  # ר בסוף
        opt("לִוְיָתָן", "🐋", category="nouns_animals"),                # safe random
    ],
    "i03-ר-l3-02": [
        opt("רַכֶּבֶת", "🚂", "images/island-03/rakevet.png", correct=True, category="nouns_objects"),
        opt("כַּדּוּר", "⚽", category="nouns_objects"),                 # ר בסוף
        opt("סֵפֶר", "📖", category="nouns_objects"),                   # safe random
    ],
    "i03-ר-l4-01": [
        opt("רַקֶּפֶת", "🌸", "images/island-03/rakefet.png", correct=True, category="nouns_nature"),
        opt("שִׁיר", "🎵", category="nouns_abstract"),                  # ר בסוף
        opt("צִפּוֹר", "🐦", category="nouns_animals"),                  # ר בסוף
        opt("לִוְיָתָן", "🐋", category="nouns_animals"),                # safe random
    ],
    "i03-ר-l4-02": [
        opt("רִמּוֹן", "🍎", "images/island-03/rimon.png", correct=True, category="nouns_food"),
        opt("כַּדּוּר", "⚽", category="nouns_objects"),                 # ר בסוף
        opt("פֶּרַח", "🌸", category="nouns_nature"),                   # ר באמצע
        opt("נְמָלָה", "🐜", category="nouns_animals"),                  # safe random
    ],

    # ============ ב (/b/) ============
    "i03-ב-l3-01": [
        opt("בֻּבָּה", "🪆", "images/island-03/buba.png", correct=True, category="nouns_objects"),
        opt("כֶּלֶב", "🐕", category="nouns_animals"),                   # ב בסוף
        opt("שֶׁמֶשׁ", "☀️", category="nouns_nature"),                  # safe random
    ],
    "i03-ב-l3-02": [
        opt("בָּלוֹן", "🎈", "images/island-03/balon.png", correct=True, category="nouns_objects"),
        opt("כּוֹכָב", "⭐", category="nouns_nature"),                   # ב בסוף
        opt("שִׁיר", "🎵", category="nouns_abstract"),                  # safe random
    ],
    "i03-ב-l4-01": [
        opt("בָּצָל", "🧅", "images/island-03/batzal.png", correct=True, category="nouns_food"),
        opt("כֶּלֶב", "🐕", category="nouns_animals"),                   # ב בסוף
        opt("חָלָב", "🥛", category="nouns_food"),                      # ב בסוף
        opt("לִוְיָתָן", "🐋", category="nouns_animals"),                # safe random
    ],
    "i03-ב-l4-02": [
        opt("בֹּהֶן", "👍", "images/island-03/bohen.png", correct=True, category="nouns_body"),
        opt("כּוֹכָב", "⭐", category="nouns_nature"),                   # ב בסוף
        opt("צָב", "🐢", category="nouns_animals"),                     # ב בסוף
        opt("נְמָלָה", "🐜", category="nouns_animals"),                  # safe random
    ],

    # ============ ק (/k/) ============
    "i03-ק-l3-01": [
        opt("קוּמְקוּם", "🫖", "images/island-03/kumkum.png", correct=True, category="nouns_objects"),
        opt("מָרָק", "🍲", category="nouns_food"),                      # ק בסוף
        opt("לִוְיָתָן", "🐋", category="nouns_animals"),                # safe random
    ],
    "i03-ק-l3-02": [
        opt("קִפּוֹד", "🦔", "images/island-03/kipod.png", correct=True, category="nouns_animals"),
        opt("בַּקְבּוּק", "🍼", category="nouns_objects"),               # ק באמצע+סוף
        opt("שֶׁמֶשׁ", "☀️", category="nouns_nature"),                  # safe random
    ],
    "i03-ק-l4-01": [
        opt("קִפּוֹד", "🦔", "images/island-03/kipod.png", correct=True, category="nouns_animals"),
        opt("מָרָק", "🍲", category="nouns_food"),                      # ק בסוף
        opt("בָּרָק", "⚡", category="nouns_nature"),                    # ק בסוף
        opt("נְמָלָה", "🐜", category="nouns_animals"),                  # safe random
    ],
    "i03-ק-l4-02": [
        opt("קַנְגּוּרוּ", "🦘", "images/island-03/kanguru.png", correct=True, category="nouns_animals"),
        opt("בַּקְבּוּק", "🍼", category="nouns_objects"),               # ק באמצע+סוף
        opt("מָרָק", "🍲", category="nouns_food"),                      # ק בסוף
        opt("שִׁיר", "🎵", category="nouns_abstract"),                  # safe random
    ],
}


def main():
    print("=" * 70)
    print("חיזוק L3/L4 — אפשרות D (אתגר במיקום פונמה)")
    print("=" * 70)

    with DATA_FILE.open("r", encoding="utf-8") as f:
        data = json.load(f)

    updated_count = 0
    for item in data["items"]:
        item_id = item.get("id")
        if item_id in NEW_OPTIONS:
            old_options = len(item.get("options", []))
            new_options = NEW_OPTIONS[item_id]
            item["options"] = new_options
            updated_count += 1
            print(f"✅ {item_id:20s} L{item['level']} | {old_options} → {len(new_options)} אפשרויות")

    # Update meta
    meta = data["meta"]
    meta["version"] = "0.3-draft"
    # Replace v3 fixes with the corrected approach
    meta["fixes_in_v3"] = [
        "L3 → 3 אפשרויות: 1 מסיח-מיקום (האות במקום שאינו תחילת מילה) + 1 רנדומלי בטוח (continuant)",
        "L4 → 4 אפשרויות: 2 מסיחי-מיקום + 1 רנדומלי בטוח (במקום 2 אפשרויות = 50% ניחוש)",
        "לא נעשה שימוש בזוגות קוליים (ב/פ · ג/כ · ד/ת) בשלב מוקדם — תואם perplexity-island2-mechanics-2026-05-23",
        "לא נעשה שימוש בגרוניות (ח/ע/א/ה) כמסיח עיקרי — נמנע מסיכון Saiegh-Haddad bilingual.",
        "פירוט בסקריפט scripts/harden-l3-l4-distractors.py.",
    ]
    meta["updated"] = "2026-05-26"

    with DATA_FILE.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print("-" * 70)
    print(f"סה\"כ עודכנו: {updated_count} פריטים. גרסת קובץ: {meta['version']}.")


if __name__ == "__main__":
    main()
