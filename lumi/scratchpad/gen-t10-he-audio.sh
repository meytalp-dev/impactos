#!/usr/bin/env bash
# gen-t10-he-audio.sh — Hebrew intro/done for T10. Nono voice (parent/UI Hebrew, correct accent).
# Voice: nono ZI6I4a3UGgs1DXxqWjBV. Tries eleven_v3, falls back to eleven_multilingual_v2.
set -u
ROOT="/c/Users/meyta/Downloads/impactos"
OUT="$ROOT/lumi/app/assets/audio/words"
VOICE="ZI6I4a3UGgs1DXxqWjBV"
KEY=$(grep -E '^ELEVENLABS_API_KEY=' "$ROOT/.env" | cut -d= -f2- | tr -d '"'"'"'\r\n ')
mkdir -p "$OUT"

CLIPS=(
  "face-intro-he|הַפָּנִים שֶׁל לוּמִי בַּחֹשֶׁךְ. הָזִיזוּ אֶת אֲלֻמַּת הָאוֹר וְגַלּוּ אֵיזֶה חֵלֶק מִסְתַּתֵּר. הַקְשִׁיבוּ לַמִּלָּה בְּאַנְגְּלִית, וְהָאִירוּ עַל הַחֵלֶק הַנָּכוֹן בַּפָּנִים."
  "face-done-he|הֶאַרְתֶּם אֶת כָּל הַפָּנִים! עֵינַיִם, אַף, פֶּה וְאָזְנַיִם. כָּל הַכָּבוֹד!"
)

gen () {
  local text="$1" dest="$2" model="$3"
  curl -sS -w '%{http_code}' -o "$dest" \
    -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOICE" \
    -H "xi-api-key: $KEY" -H "Content-Type: application/json" \
    -d "{\"text\":\"$text\",\"model_id\":\"$model\",\"voice_settings\":{\"stability\":0.5,\"similarity_boost\":0.8}}"
}

for entry in "${CLIPS[@]}"; do
  fname="${entry%%|*}"; text="${entry#*|}"; dest="$OUT/$fname.mp3"
  echo "→ $fname.mp3"
  http=$(gen "$text" "$dest" "eleven_v3")
  sz=$(stat -c%s "$dest" 2>/dev/null || echo 0)
  if [ "$http" != "200" ] || [ "$sz" -lt 1000 ]; then
    echo "   eleven_v3 failed (http=$http) — falling back to eleven_multilingual_v2"
    http=$(gen "$text" "$dest" "eleven_multilingual_v2")
    sz=$(stat -c%s "$dest" 2>/dev/null || echo 0)
  fi
  echo "   http=$http bytes=$sz"
  if [ "$http" != "200" ] || [ "$sz" -lt 1000 ]; then echo "   !! FAILED:"; head -c 300 "$dest"; echo; fi
  sleep 0.5
done
echo "DONE-T10-HE."
