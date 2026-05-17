#!/usr/bin/env bash
# מעתיק מסמכי «השלמת משפטים» (יחידה 4) מ־Downloads ל־content/amirnet-course.
# הרצה: מהשורש של education — bash scripts/copy-sc-from-downloads.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:-$HOME/Downloads}"
DEST="$ROOT/content/amirnet-course/04_sentence_completion"
PQ="$DEST/practice_quizzes"

missing=0
copy_one() {
  local f="$1"
  local to="$2"
  if [[ ! -f "$SRC/$f" ]]; then
    echo "חסר: $SRC/$f" >&2
    missing=1
    return
  fi
  cp -f "$SRC/$f" "$to"
  echo "ok $f -> $to"
}

mkdir -p "$PQ"

for f in \
  SAMPLE_sc_quiz_1_easy.md \
  sc_quiz_2_easy.md \
  sc_quiz_3_intermediate.md \
  sc_quiz_4_intermediate.md \
  sc_quiz_5_hard.md \
  sc_quiz_6_hard.md \
  sc_quiz_7_mixed.md \
  sc_quiz_8_mixed.md; do
  copy_one "$f" "$PQ/$f"
done

for f in \
  4.2_solving_methods_master_guide.md \
  4.3_common_traps_guide.md \
  SAMPLE_video_script_5_solving_methods.md; do
  copy_one "$f" "$DEST/$f"
done

if [[ "$missing" -ne 0 ]]; then
  echo "חלק מהקבצים לא נמצאו ב־$SRC. העבר את המקור (ברירת מחדל: Downloads) או: $0 /path/to/folder" >&2
  exit 1
fi
echo "סיימתי. נתונים תחת $DEST"
