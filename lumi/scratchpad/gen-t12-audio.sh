#!/usr/bin/env bash
# gen-t12-audio.sh — recorded English clips for T12 (🖼️ The Family Photo · scene-hide).
# Voice: Jessica cgSgspJ2msm6clMCkdW9 · model eleven_multilingual_v2. Reads key from root .env.
set -u
ROOT="/c/Users/meyta/Downloads/impactos"
OUT="$ROOT/lumi/app/assets/audio/words"
VOICE="cgSgspJ2msm6clMCkdW9"
KEY=$(grep -E '^ELEVENLABS_API_KEY=' "$ROOT/.env" | cut -d= -f2- | tr -d '"'"'"'\r\n ')
mkdir -p "$OUT"

# filename|text
CLIPS=(
  # bare words (recognize / discriminate item bank + peek chips)
  "mum|Mum."
  "dad|Dad."
  "baby|Baby."
  "brother|Brother."
  "sister|Sister."
  "grandma|Grandma."
  "grandpa|Grandpa."
  # scene-hide comprehension chunk (what Lumi asks each round)
  "where-mum|Where is my mum?"
  "where-dad|Where is my dad?"
  "where-baby|Where is the baby?"
  "where-brother|Where is my brother?"
  "where-sister|Where is my sister?"
  "where-grandma|Where is my grandma?"
  "where-grandpa|Where is my grandpa?"
  # warm "This is my ___" chunk spoken when the family member is found
  "this-mum|This is my mum!"
  "this-dad|This is my dad!"
  "this-baby|This is the baby!"
  "this-brother|This is my brother!"
  "this-sister|This is my sister!"
  "this-grandma|This is my grandma!"
  "this-grandpa|This is my grandpa!"
  # signature communicative chunk at the end
  "ilove|I love you!"
)

for entry in "${CLIPS[@]}"; do
  fname="${entry%%|*}"
  text="${entry#*|}"
  dest="$OUT/$fname.mp3"
  echo "→ $fname.mp3  :  \"$text\""
  http=$(curl -sS -w '%{http_code}' -o "$dest" \
    -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOICE" \
    -H "xi-api-key: $KEY" \
    -H "Content-Type: application/json" \
    -d "{\"text\":\"$text\",\"model_id\":\"eleven_multilingual_v2\",\"voice_settings\":{\"stability\":0.45,\"similarity_boost\":0.8,\"style\":0.3}}")
  sz=$(stat -c%s "$dest" 2>/dev/null || echo 0)
  echo "   http=$http bytes=$sz"
  if [ "$http" != "200" ] || [ "$sz" -lt 1000 ]; then
    echo "   !! FAILED — response body:"; head -c 300 "$dest"; echo
  fi
  sleep 0.4
done
echo "DONE-T12-AUDIO."
