#!/usr/bin/env bash
# gen-t10-audio.sh — recorded English clips for T10 (👀 Light Up the Face).
# Voice: Jessica cgSgspJ2msm6clMCkdW9 · model eleven_multilingual_v2. Reads key from root .env.
set -u
ROOT="/c/Users/meyta/Downloads/impactos"
OUT="$ROOT/lumi/app/assets/audio/words"
VOICE="cgSgspJ2msm6clMCkdW9"
KEY=$(grep -E '^ELEVENLABS_API_KEY=' "$ROOT/.env" | cut -d= -f2- | tr -d '"'"'"'\r\n ')
mkdir -p "$OUT"

# filename|text
CLIPS=(
  "eyes|Eyes."
  "nose|Nose."
  "mouth|Mouth."
  "ears|Ears."
  "touch-eyes|Touch your eyes."
  "touch-nose|Touch your nose."
  "touch-mouth|Touch your mouth."
  "touch-ears|Touch your ears."
  "chunk-eyes|These are my eyes!"
  "chunk-nose|This is my nose!"
  "chunk-mouth|This is my mouth!"
  "chunk-ears|These are my ears!"
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
  sleep 0.5
done
echo "DONE-T10-AUDIO."
