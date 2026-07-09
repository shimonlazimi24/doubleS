#!/usr/bin/env bash
# מעתיק מסמכי «ניסוח מחדש» (יחידה 5) מ־Downloads ל־content/amirnet-course.
# הרצה: מהשורש של education - bash scripts/copy-restatement-from-downloads.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:-$HOME/Downloads}"
DEST="$ROOT/content/amirnet-course/05_restatement"
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
  restatement_quiz_1_easy.md \
  restatement_quiz_2_easy.md \
  restatement_quiz_3_intermediate.md \
  restatement_quiz_4_intermediate.md \
  restatement_quiz_5_hard.md \
  restatement_quiz_6_hard.md \
  restatement_quiz_7_mixed.md \
  restatement_quiz_8_mixed.md \
  SAMPLE_restatement_quiz_intermediate.md; do
  copy_one "$f" "$PQ/$f"
done

for f in \
  5.2_solving_methods_master_guide.md \
  5.3_sentence_structures_guide.md \
  5.4_common_traps_guide.md; do
  copy_one "$f" "$DEST/$f"
done

if [[ "$missing" -ne 0 ]]; then
  echo "חלק מהקבצים לא נמצאו ב־$SRC" >&2
  exit 1
fi
echo "סיימתי. נתונים תחת $DEST"
