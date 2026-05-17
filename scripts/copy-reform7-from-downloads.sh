#!/usr/bin/env bash
# מעתיק מסמכי «רפורמה 2026» (יחידה 7) מ־Downloads ל־content/amirnet-course.
# הרצה: bash scripts/copy-reform7-from-downloads.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:-$HOME/Downloads}"
DEST="$ROOT/content/amirnet-course/07_new_reform_audio_writing"

missing=0
copy_one() {
  local f="$1"
  if [[ ! -f "$SRC/$f" ]]; then
    echo "חסר: $SRC/$f" >&2
    missing=1
    return
  fi
  cp -f "$SRC/$f" "$DEST/$f"
  echo "ok $f -> $DEST"
}

for f in \
  7.1_reform_overview.md \
  7.2_listening_guide.md \
  7.3_listening_practice_quizzes.md \
  7.4_word_formation_guide.md \
  7.5_word_formation_practice.md \
  7.6_grammar_in_context_guide.md \
  7.7_grammar_practice.md \
  7.8_writing_guide.md \
  7.9_writing_examples_and_practice.md; do
  copy_one "$f"
done

if [[ "$missing" -ne 0 ]]; then
  echo "חלק מהקבצים לא נמצאו ב־$SRC" >&2
  exit 1
fi
echo "סיימתי. נתונים תחת $DEST"
