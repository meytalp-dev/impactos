#!/usr/bin/env bash
# gen-t8-audio.sh — recorded clips for T8 · 🧺 The Fruit Basket (light-beam).
# English words + "I want ___" chunk: Jessica cgSgspJ2msm6clMCkdW9 / eleven_multilingual_v2.
# Hebrew parent/intro/done: Nunni ZI6I4a3UGgs1DXxqWjBV / eleven_v3 (per brief).
# 'orange' already exists (shared with T4 colours) → not regenerated.
set -u
ROOT="/c/Users/meyta/Downloads/impactos"
OUT="$ROOT/lumi/app/assets/audio/words"
JESSICA="cgSgspJ2msm6clMCkdW9"
NUNNI="ZI6I4a3UGgs1DXxqWjBV"
KEY=$(grep -E '^ELEVENLABS_API_KEY=' "$ROOT/.env" | cut -d= -f2- | tr -d '"'"'"'\r\n ')
mkdir -p "$OUT"

gen () { # voice model filename text stability style
  local voice="$1" model="$2" fname="$3" text="$4" stab="$5" style="$6"
  local dest="$OUT/$fname.mp3"
  echo "→ $fname.mp3  :  \"$text\""
  http=$(curl -sS -w '%{http_code}' -o "$dest" \
    -X POST "https://api.elevenlabs.io/v1/text-to-speech/$voice" \
    -H "xi-api-key: $KEY" -H "Content-Type: application/json" \
    -d "{\"text\":\"$text\",\"model_id\":\"$model\",\"voice_settings\":{\"stability\":$stab,\"similarity_boost\":0.8,\"style\":$style}}")
  sz=$(stat -c%s "$dest" 2>/dev/null || echo 0)
  echo "   http=$http bytes=$sz"
  if [ "$http" != "200" ] || [ "$sz" -lt 1000 ]; then echo "   !! FAILED:"; head -c 300 "$dest"; echo; fi
  sleep 0.5
}

# ---- English words (Jessica) ----
gen "$JESSICA" eleven_multilingual_v2 apple  "apple"  0.45 0.3
gen "$JESSICA" eleven_multilingual_v2 banana "banana" 0.45 0.3
# ---- English "I want ___" chunk (produce / self-listen) ----
gen "$JESSICA" eleven_multilingual_v2 iwant-apple  "I want an apple."  0.5 0.35
gen "$JESSICA" eleven_multilingual_v2 iwant-banana "I want a banana."  0.5 0.35
gen "$JESSICA" eleven_multilingual_v2 iwant-orange "I want an orange." 0.5 0.35

# ---- Hebrew intro + done (Nunni, warm parent voice) ----
gen "$NUNNI" eleven_v3 fruit-intro-he "בְּסַל הַפֵּרוֹת שֶׁל לוּמִי הִתְחַבְּאוּ פֵּרוֹת. הַזִּיזוּ אֶת אֲלֻמַּת הָאוֹר, וְהִיא תְּגַלֶּה פְּרִי. הַקְשִׁיבוּ לַמִּלָּה וְהָאִירוּ עַל הַפְּרִי הַנָּכוֹן." 0.6 0.2
gen "$NUNNI" eleven_v3 fruit-done-he "מָצָאתֶם אֶת כָּל הַפֵּרוֹת בַּסַּל! כָּל הַכָּבוֹד!" 0.6 0.2

echo "DONE."
