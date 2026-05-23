#!/usr/bin/env python3
"""Generate draft items for Island 3 (Letter Recognition) — 5 letters x 4 levels.

v3 (22.5.2026): image-aware after Meytal approved ChatGPT custom illustrations.
- Same v2 pedagogical rules.
- Each word can have an image (PNG) — if present, item includes image_url.
- Emoji becomes fallback when image is missing.
- Anti-duplicate-image filter for distractors.
- Removed "קָרָה: ❓" which leaked as a visual hint to the kid.

v2 (22.5.2026): systemic fixes after pedagogical review.
- All options must have a real emoji (no 🖼️ placeholders that bias the kid).
- L1-L2 focus words must be concrete nouns (food/animals/objects). No personal names.
- L3-L4 focus words allow imageable verbs/adjectives.
- Distractors must be from different SUBCATEGORY than focus (no "names theme" leak).
- Items that can't satisfy all 3 rules are SKIPPED with a log line.
"""
import json
import random
from pathlib import Path

random.seed(42)

VOCAB_PATH = Path("C:/Users/meyta/Downloads/impactos/avnei-yesod/curriculum/vocab-bank.json")
OUT_PATH = Path("C:/Users/meyta/Downloads/impactos/avnei-yesod/engine/content/items/island-03-letter-recognition.json")
IMAGE_DIR = Path("C:/Users/meyta/Downloads/impactos/avnei-yesod/engine/content/images/island-03")
IMAGE_URL_PREFIX = "images/island-03"  # relative path written into JSON (HTML loads via relative URL)

# ─── EMOJI_MAP — only words that have a clear visual emoji ──────────
EMOJI_MAP = {
    # ת
    "תַּפּוּז": "🍊", "תָּמָר": "🌴", "תַּרְמִיל": "🎒", "תִּיק": "👜", "תְּרוּפָה": "💊",
    "תִּינוֹק": "👶",
    "תּוּת": "🍓", "תֻּכִּי": "🦜", "תַּפּוּחַ": "🍎", "תַּנּוּר": "🍳",  # batch ת 23.5.2026
    # מ — concrete nouns
    # מַטֶּה הוסר 23.5.2026 — התמונה לא ברורה לכיתה א' (פידבק מיטל)
    "מָרָק": "🍲", "מַחַק": "🧽", "מַתָּנָה": "🎁", "מִשְׁקָפַיִם": "👓",
    "מַמְתַּקִּים": "🍬", "מַחְבֶּרֶת": "📓", "מִכְנָסַיִם": "👖", "מְכוֹנִית": "🚗",
    "מַנְעוּל": "🔒", "מַגָּף": "🥾", "מַחְשֵׁב": "💻", "מִיטָּה": "🛏️",
    "מַפְתֵּחַ": "🔑", "מַקֵּל": "🦯", "מַשָּׂאִית": "🚚",
    "מִטְרִיָּה": "☂️", "מִרְאָה": "🪞",  # new (Meytal-approved 22.5.2026)
    # מ — imageable verbs (L3-L4)
    "מָרַח": "🧈", "מְדַבֶּרֶת": "🗣️",
    # ר — concrete nouns
    "רַקֶּפֶת": "🌸",
    "רִמּוֹן": "🍎", "רַכֶּבֶת": "🚂", "רַמְזוֹר": "🚦", "רוֹפֵא": "🩺",  # new (Meytal-approved 22.5.2026)
    "רַדְיוֹ": "📻", "רוֹלֶר": "⛸️", "רִיבָּה": "🍓", "רֶגֶל": "🦵",
    "רַעֲשָׁן": "🪇", "רוֹבּוֹט": "🤖",  # batch ר 22.5.2026 PM
    # ר — imageable verbs
    "רָאָה": "👀", "רָקַד": "💃", "רָכַב": "🚴", "רָץ": "🏃",
    "רָקְדָה": "💃", "רָכְבָה": "🚴‍♀️", "רָאֲתָה": "👀",
    # ב — concrete nouns
    "בָּנָנָה": "🍌", "בֵּיצָה": "🥚", "בְּרֵכָה": "🏊", "בָּלוֹן": "🎈",
    "בּוּעוֹת": "🫧", "בָּצָל": "🧅", "בָּרָד": "🌨️", "בֹּהֶן": "👍",
    "בָּרָק": "⚡",
    "בֻּבָּה": "🪆", "בָּיִת": "🏠",  # new (Meytal-approved 22.5.2026, from Kesem book 4)
    # ב — imageable verbs
    "בָּכָה": "😢", "בָּרַח": "🏃", "בָּנָה": "🏗️",
    # ק — concrete nouns
    "קַסְדָּה": "⛑️", "קַלְמָר": "✏️", "קֻבִּיָּה": "🎲", "קְפִיץ": "🌀", "קַנְגּוּרוּ": "🦘",
    "קוּפְסָה": "📦", "קוּמְקוּם": "🫖", "קִפּוֹד": "🦔",  # new (Meytal-approved 22.5.2026)
    # ק — imageable verbs
    "קוֹרֵאת": "📖", "קָנָה": "🛒", "קָם": "🧍", "קָנְתָה": "🛍️",
    # (removed קָרָה: ❓ — placeholder leaked as visual hint to kid)
    # — Non-target letters (distractors only). Need diverse categories.
    # animals
    "נָחָשׁ": "🐍", "נְמָלָה": "🐜", "לִוְיָתָן": "🐋", "חָתוּל": "🐈",
    "חִפּוּשִׁית": "🐞",  # new (Meytal-approved 22.5.2026, from Kesem)
    # food (non-target letters)
    "אֲנָנָס": "🍍", "לֶחֶם": "🍞", "חַלָּה": "🍞", "חָלָב": "🥛", "כָּרִיךְ": "🥪",
    # objects (non-target letters)
    "סֵפֶר": "📖", "שִׁיר": "🎵", "שֻׁלְחָן": "🪑", "שֶׁמֶשׁ": "☀️",
    "יָד": "✋", "יָם": "🌊", "אֹזֶן": "👂", "עַיִן": "👁️",
    # imageable adjectives (concrete)
    "קַר": "🥶", "חַם": "🔥",
}

# ─── IMAGE_FILENAME_MAP — Hebrew word → transliterated PNG basename ──
# If the file IMAGE_DIR / f"{basename}.png" exists, the item gets image_url.
# Otherwise only the emoji is shown (graceful fallback).
IMAGE_FILENAME_MAP = {
    # ת
    "תַּפּוּז": "tapuz", "תָּמָר": "tamar", "תַּרְמִיל": "tarmil",
    "תִּיק": "tik", "תְּרוּפָה": "trufa", "תִּינוֹק": "tinok",
    "תּוּת": "tut", "תֻּכִּי": "tuki", "תַּפּוּחַ": "tapuach", "תַּנּוּר": "tanur",
    # מ
    # מַטֶּה הוסר 23.5.2026 — התמונה לא ברורה לכיתה א'
    "מָרָק": "marak", "מַחַק": "machak", "מַתָּנָה": "matana",
    "מִשְׁקָפַיִם": "mishkafayim", "מַמְתַּקִּים": "mamtakim", "מַחְבֶּרֶת": "machberet",
    "מִכְנָסַיִם": "michnasayim", "מְכוֹנִית": "mechonit", "מַנְעוּל": "manul",
    "מַגָּף": "magaf", "מַחְשֵׁב": "machshev", "מִיטָּה": "mita",
    "מַפְתֵּחַ": "mafteach", "מַקֵּל": "makel", "מַשָּׂאִית": "masait",
    "מָרַח": "marach", "מְדַבֶּרֶת": "medaberet",
    "מִטְרִיָּה": "mitriya", "מִרְאָה": "mira",
    # ר
    "רַקֶּפֶת": "rakefet", "רָאָה": "raa", "רָקַד": "rakad", "רָכַב": "rachav",
    "רָץ": "ratz", "רָקְדָה": "rakda", "רָכְבָה": "rachva", "רָאֲתָה": "raata",
    "רִמּוֹן": "rimon", "רַכֶּבֶת": "rakevet", "רַמְזוֹר": "ramzor", "רוֹפֵא": "rofe",
    "רַדְיוֹ": "radyo", "רוֹלֶר": "roler", "רִיבָּה": "riba", "רֶגֶל": "regel",
    "רַעֲשָׁן": "raashan", "רוֹבּוֹט": "robot",
    # ב
    "בָּנָנָה": "banana", "בֵּיצָה": "beitza", "בְּרֵכָה": "brecha", "בָּלוֹן": "balon",
    "בּוּעוֹת": "buot", "בָּצָל": "batzal", "בָּרָד": "barad", "בֹּהֶן": "bohen",
    "בָּרָק": "barak", "בָּכָה": "bacha", "בָּרַח": "barach", "בָּנָה": "bana",
    "בֻּבָּה": "buba", "בָּיִת": "bayit",
    # ק
    "קַסְדָּה": "kasda", "קַלְמָר": "kalmar", "קֻבִּיָּה": "kubiya",
    "קְפִיץ": "kfitz", "קַנְגּוּרוּ": "kanguru", "קוּפְסָה": "kupsa", "קוּמְקוּם": "kumkum",
    "קוֹרֵאת": "koret", "קָנָה": "kana", "קָם": "kam", "קָנְתָה": "kanta",
    "קִפּוֹד": "kipod",
    # non-target distractors
    "נָחָשׁ": "nachash", "נְמָלָה": "nemala", "לִוְיָתָן": "livyatan", "חָתוּל": "chatul",
    "חִפּוּשִׁית": "chipushit",
    "אֲנָנָס": "ananas", "לֶחֶם": "lechem", "חַלָּה": "chala", "חָלָב": "chalav",
    "כָּרִיךְ": "karich", "סֵפֶר": "sefer", "שִׁיר": "shir", "שֻׁלְחָן": "shulchan",
    "שֶׁמֶשׁ": "shemesh", "יָד": "yad", "יָם": "yam", "אֹזֶן": "ozen", "עַיִן": "ayin",
    "קַר": "kar", "חַם": "cham",
}

def image_for(word):
    """Return relative URL if image file exists, else None."""
    base = IMAGE_FILENAME_MAP.get(word)
    if not base:
        return None
    if (IMAGE_DIR / f"{base}.png").exists():
        return f"{IMAGE_URL_PREFIX}/{base}.png"
    return None

# ─── Category rules ─────────────────────────────────────────
NAMES_CATEGORIES = {"names_people.girls", "names_people.boys", "names_people.family"}
CONCRETE_NOUN_CATEGORIES = {"nouns_food", "nouns_animals", "nouns_objects", "nouns_people"}
VERB_CATEGORIES = {"verbs_past_masculine", "verbs_past_feminine_with_shva_nach", "verbs_present"}
IMAGEABLE_ADJ_CATEGORIES = {"adjectives"}

# Allowed categories per level (for FOCUS word)
ALLOWED_FOCUS_CATS = {
    # Meytal 22.5.2026: ONLY concrete nouns at every level. Verbs and adjectives
    # are visually ambiguous to a 6-year-old (e.g. "boy on bike" = רָכַב OR אופניים?
    # "boy with scarf" = קַר OR חורף?). Concrete nouns are unambiguous.
    1: CONCRETE_NOUN_CATEGORIES,
    2: CONCRETE_NOUN_CATEGORIES,
    3: CONCRETE_NOUN_CATEGORIES,
    4: CONCRETE_NOUN_CATEGORIES,
}

# ─── Load vocab-bank ─────────────────────────────────────────
vocab = json.loads(VOCAB_PATH.read_text(encoding="utf-8"))

def first_letter(word):
    for ch in word:
        if 0x05D0 <= ord(ch) <= 0x05EA:
            return ch
    return None

def collect_words():
    """Returns: list of {word, category, has_emoji}."""
    all_words = []
    cats = vocab["vocabulary_consolidated"]["categories"]
    for cat_name, val in cats.items():
        if isinstance(val, list):
            for w in val:
                if isinstance(w, str):
                    all_words.append({"word": w, "category": cat_name, "has_emoji": w in EMOJI_MAP})
        elif isinstance(val, dict):
            for subkey, sublist in val.items():
                if isinstance(sublist, list):
                    for w in sublist:
                        if isinstance(w, str):
                            all_words.append({"word": w, "category": f"{cat_name}.{subkey}", "has_emoji": w in EMOJI_MAP})
    return all_words

ALL_WORDS = collect_words()

def words_starting_with(letter, allowed_cats=None, exclude=None, require_emoji=True):
    """Filter words by start letter, allowed categories, and emoji availability."""
    result = []
    for w in ALL_WORDS:
        if first_letter(w["word"]) != letter:
            continue
        if exclude and w["word"] in exclude:
            continue
        if require_emoji and not w["has_emoji"]:
            continue
        if allowed_cats and w["category"] not in allowed_cats:
            continue
        result.append(w)
    return result

def get_focus_word(letter, level, exclude):
    """Pick a focus word for this letter+level.

    For L1-L2: prefer concrete nouns. Fall back to verbs/adjectives if no concrete nouns left
    (some letters like ר have only 1 concrete noun in vocab-bank).
    """
    preferred = ALLOWED_FOCUS_CATS[level]
    candidates = words_starting_with(letter, allowed_cats=preferred, exclude=exclude, require_emoji=True)
    if candidates:
        return random.choice(candidates)

    # Fallback for L1-L2: allow imageable verbs/adjectives if concrete nouns ran out
    if level in (1, 2):
        fallback = CONCRETE_NOUN_CATEGORIES | VERB_CATEGORIES | IMAGEABLE_ADJ_CATEGORIES
        candidates = words_starting_with(letter, allowed_cats=fallback, exclude=exclude, require_emoji=True)
        if candidates:
            chosen = random.choice(candidates)
            chosen["_fallback_used"] = True  # tag so we can log
            return chosen

    return None

def get_distractors(focus_letter, focus_category, n, exclude):
    """Pick n distractors:
    - Not starting with focus_letter
    - Must have emoji
    - Subcategory must differ from focus_category
    - NEVER from NAMES_CATEGORIES (to avoid the "names theme" leak)
    - Meytal 22.5.2026: ONLY concrete nouns. Verbs/adjectives confuse the kid
      because the image is visually ambiguous (e.g. "boy running" looks like
      either בָּרַח or ילד — kid can't tell which is the target word).
    """
    candidates = []
    for w in ALL_WORDS:
        if first_letter(w["word"]) == focus_letter:
            continue
        if not w["has_emoji"]:
            continue
        if exclude and w["word"] in exclude:
            continue
        if w["category"] in NAMES_CATEGORIES:
            continue
        if w["category"] not in CONCRETE_NOUN_CATEGORIES:
            continue
        if w["category"] == focus_category:
            continue
        candidates.append(w)
    if len(candidates) < n:
        return None
    return random.sample(candidates, n)

# ─── Item builders per level ────────────────────────────────
ITEM_ID_COUNTERS = {}
def next_id(letter, level):
    key = (letter, level)
    ITEM_ID_COUNTERS[key] = ITEM_ID_COUNTERS.get(key, 0) + 1
    return f"i03-{letter}-l{level}-{ITEM_ID_COUNTERS[key]:02d}"

def concept_for(word):
    """Strip niqqud for display concept."""
    niq_chars = "ְִֵֶַָֹֻּׁׂ"
    return "".join(ch for ch in word if ch not in niq_chars)

def _option_visual_key(word):
    """Used for anti-duplicate-visual filter.
    Two options must not share the same visual key.
    Priority: image filename (if exists) > emoji.
    """
    img = image_for(word)
    if img:
        return ("img", img)
    return ("emoji", EMOJI_MAP.get(word, ""))

def _build_option(word, category, is_correct=False):
    opt = {
        "word": word,
        "concept": concept_for(word),
        "emoji_suggestion": EMOJI_MAP[word],
        "category": category,
    }
    img_url = image_for(word)
    if img_url:
        opt["image_url"] = img_url
    if is_correct:
        opt["correct"] = True
    return opt

def build_item(letter, level, used_words, num_options):
    """Generic item builder. Returns None if can't satisfy constraints."""
    focus = get_focus_word(letter, level, exclude=used_words)
    if focus is None:
        return None
    used_words.add(focus["word"])

    # Pick distractors, then filter out any that share the focus's visual key.
    distractors = get_distractors(letter, focus["category"], num_options - 1, exclude=used_words)
    if distractors is None:
        return None

    # Anti-duplicate-visual: ensure no two options share an image/emoji.
    focus_vk = _option_visual_key(focus["word"])
    seen_keys = {focus_vk}
    filtered = []
    for d in distractors:
        vk = _option_visual_key(d["word"])
        if vk in seen_keys:
            continue
        seen_keys.add(vk)
        filtered.append(d)

    # If filter removed some, try to refill from pool.
    if len(filtered) < num_options - 1:
        extras = get_distractors(letter, focus["category"], num_options - 1, exclude=used_words | {d["word"] for d in distractors})
        if extras:
            for e in extras:
                if len(filtered) >= num_options - 1:
                    break
                vk = _option_visual_key(e["word"])
                if vk in seen_keys:
                    continue
                seen_keys.add(vk)
                filtered.append(e)

    if len(filtered) < num_options - 1:
        return None  # couldn't build distinct visuals

    for d in filtered:
        used_words.add(d["word"])

    options = [_build_option(focus["word"], focus["category"], is_correct=True)]
    for d in filtered:
        options.append(_build_option(d["word"], d["category"]))
    random.shuffle(options)
    return focus, options

def build_level1_item(letter, used_words):
    result = build_item(letter, 1, used_words, num_options=4)
    if result is None: return None
    focus, options = result
    return {
        "id": next_id(letter, 1),
        "island_id": 3, "island_slug": "letter-recognition",
        "envelope": "tap-match", "level": 1,
        "type": "hear-sound-choose-image",
        "letter_in_focus": letter, "letters_required": [letter], "niqqud_required": [],
        "skills_tested": [1, 2],
        "prompt": f"בְּאֵיזוֹ תְּמוּנָה שׁוֹמְעִים אֶת הַצְּלִיל {letter}' בְּהַתְחָלָה?",
        "audio_cue_text": letter,
        "options": options, "hints": None,
        "review_status": "draft", "review_notes": "",
        "source": f"vocab-bank · {focus['category']}",
        "created_by": "auto-generator-v2", "created_at": "2026-05-22"
    }

def build_level2_item(letter, used_words):
    item = build_level1_item(letter, used_words)
    if item is None: return None
    item["level"] = 2
    item["id"] = next_id(letter, 2)
    item["hints"] = {"type": "replay-sound", "available_immediately": True,
                     "text": f"לחיצה כדי לשמוע את הצליל {letter} שוב"}
    return item

def build_level3_item(letter, used_words):
    result = build_item(letter, 3, used_words, num_options=3)
    if result is None: return None
    focus, options = result
    return {
        "id": next_id(letter, 3),
        "island_id": 3, "island_slug": "letter-recognition",
        "envelope": "tap-match", "level": 3,
        "type": "guided-letter-recognition",
        "letter_in_focus": letter, "letters_required": [letter], "niqqud_required": [],
        "skills_tested": [1, 2],
        "prompt": f"הִנֵּה הָאוֹת {letter}. אֵיזוֹ תְּמוּנָה מַתְחִילָה בָּאוֹת הַזּוֹ?",
        "letter_displayed": letter, "audio_cue_text": letter,
        "options": options,
        "hints": {"type": "highlight-letter", "after_seconds": 5,
                  "text": f"הָאוֹת {letter} נִשְׁמַעַת כְּמוֹ '{letter}{letter}{letter}'"},
        "review_status": "draft", "review_notes": "",
        "source": f"vocab-bank · {focus['category']}",
        "created_by": "auto-generator-v2", "created_at": "2026-05-22"
    }

def build_level4_item(letter, used_words):
    result = build_item(letter, 4, used_words, num_options=2)
    if result is None: return None
    focus, options = result
    return {
        "id": next_id(letter, 4),
        "island_id": 3, "island_slug": "letter-recognition",
        "envelope": "tap-match", "level": 4,
        "type": "listen-point-repeat",
        "letter_in_focus": letter, "letters_required": [letter], "niqqud_required": [],
        "skills_tested": [1, 2],
        "prompt": f"הַמּוֹרָה אוֹמֶרֶת אֶת הַצְּלִיל. תָּצְבִּיעַ עַל הָאוֹת {letter}:",
        "letter_displayed": letter, "audio_cue_text": letter,
        "options": options,
        "teacher_alert_after_2_failures": True, "wait_for_teacher_confirmation": True,
        "scaffolding_note": "המורה מקריאה קודם, מצביעה על האות, ואז התלמיד.ה חוזר.ת. תרגיל 'אצבע על האות'.",
        "hints": {"type": "show-letter", "after_seconds": 3,
                  "text": f"מצביעים על האות {letter}"},
        "review_status": "draft", "review_notes": "",
        "source": f"vocab-bank · {focus['category']}",
        "created_by": "auto-generator-v2", "created_at": "2026-05-22"
    }

# ─── Main ────────────────────────────────────────────────────
def main():
    target_letters = ['ת', 'מ', 'ר', 'ב', 'ק']
    items_per_level = {1: 3, 2: 3, 3: 2, 4: 2}

    all_items = []
    skipped = []
    fallback_count = 0
    for letter in target_letters:
        # Meytal 22.5.2026: used_words is now GLOBAL across all 4 levels per letter
        # (was reset per-level — caused the same word to repeat 3× while other valid
        # words were never selected). Now every available noun appears at least once
        # before any repetition.
        used_words = set()
        for level in [1, 2, 3, 4]:
            builder = {1: build_level1_item, 2: build_level2_item, 3: build_level3_item, 4: build_level4_item}[level]
            for i in range(items_per_level[level]):
                item = builder(letter, used_words)
                if item is None:
                    # If we ran out of unique words, reset used_words and try again
                    # (allows controlled repetition only after full coverage)
                    used_words = set()
                    item = builder(letter, used_words)
                if item is None:
                    skipped.append(f"{letter} L{level} #{i+1}")
                else:
                    # Check if focus word used the verb-fallback (only relevant at L1-L2)
                    correct = next((o for o in item['options'] if o.get('correct')), None)
                    if correct and level in (1, 2) and correct['category'] not in CONCRETE_NOUN_CATEGORIES:
                        item['_used_verb_fallback_at_L1_L2'] = True
                        fallback_count += 1
                    all_items.append(item)

    output = {
        "meta": {
            "title": "אבני יסוד · אי 3 · זיהוי אותיות · בנק פריטים",
            "island_id": 3, "island_slug": "letter-recognition",
            "version": "0.2-draft", "created": "2026-05-22",
            "purpose": "Vertical Slice — 5 אותיות ראשונות של ספטמבר. גרסה 0.2 אחרי סקירה פדגוגית של מיטל ב-22.5.2026.",
            "generator": "build_island3_items.py v2 · seed=42",
            "fixes_in_v2": [
                "כל אופציה חייבת אימוג'י אמיתי (אין 🖼️ placeholders)",
                "L1-L2 focus words: שמות עצם מוחשיים בעדיפות. נופלים לפעלים/תארים מאוירים רק כשאין שמות-עצם זמינים (למשל ר עם רק רַקֶּפֶת).",
                "L3-L4 focus words: שמות עצם + פעלים + תארים מאוירים — כולם פתוחים.",
                "מסיחים: תת-קטגוריה שונה מהמילה הנכונה. ללא שמות פרטיים בכלל.",
                "פריטים שלא עומדים בכללים — מדלגים עליהם עם לוג.",
                "פריטים שהשתמשו ב-verb-fallback מסומנים ב-_used_verb_fallback_at_L1_L2: true"
            ],
            "verb_fallback_count": fallback_count,
            "review_status": "all-draft",
            "total_items": len(all_items),
            "skipped_count": len(skipped),
            "skipped_details": skipped,
            "letters": target_letters,
            "levels_distribution_requested": items_per_level
        },
        "items": all_items
    }

    OUT_PATH.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT_PATH}")
    print(f"Total items: {len(all_items)}  |  Skipped: {len(skipped)}")
    print(f"Size: {OUT_PATH.stat().st_size / 1024:.1f} KB")

    # Also sync the embedded data inside island-03-review.html so the review UI
    # always reflects the latest generated items (avoids manual copy-paste).
    review_html = OUT_PATH.parent / "island-03-review.html"
    if review_html.exists():
        import re
        html = review_html.read_text(encoding="utf-8")
        new_const = "const EMBEDDED_DATA = " + json.dumps(output, ensure_ascii=False) + ";"
        # Match the entire "const EMBEDDED_DATA = {...};" line (it's currently one long line)
        pattern = re.compile(r"const EMBEDDED_DATA = \{.*?\};", re.DOTALL)
        if pattern.search(html):
            html_new = pattern.sub(new_const, html, count=1)
            review_html.write_text(html_new, encoding="utf-8")
            print(f"Synced EMBEDDED_DATA in {review_html.name}")
        else:
            print(f"WARN: EMBEDDED_DATA pattern not found in {review_html.name}")
    if skipped:
        print(f"\nSkipped items (couldn't satisfy constraints):")
        for s in skipped:
            print(f"  - {s}")
    print("\nBy letter:")
    for letter in target_letters:
        n = sum(1 for it in all_items if it['letter_in_focus'] == letter)
        expected = sum(items_per_level.values())
        marker = "✓" if n == expected else f"⚠ (חסר {expected-n})"
        print(f"  {letter}: {n}/{expected} {marker}")
    print("\nBy level:")
    for lvl in [1, 2, 3, 4]:
        n = sum(1 for it in all_items if it['level'] == lvl)
        expected = items_per_level[lvl] * len(target_letters)
        print(f"  L{lvl}: {n}/{expected}")

if __name__ == "__main__":
    main()
