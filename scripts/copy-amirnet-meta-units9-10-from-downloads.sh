#!/usr/bin/env bash
# מעתיק README, NAVIGATION, יחידה 9 ו־10 מ־Downloads ל־content/amirnet-course.
# הרצה: bash scripts/copy-amirnet-meta-units9-10-from-downloads.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:-$HOME/Downloads}"
BASE="$ROOT/content/amirnet-course"

missing=0
copy_to() {
  local f="$1"
  local to_dir="$2"
  if [[ ! -f "$SRC/$f" ]]; then
    echo "חסר: $SRC/$f" >&2
    missing=1
    return
  fi
  mkdir -p "$to_dir"
  cp -f "$SRC/$f" "$to_dir/$f"
  echo "ok $f -> $to_dir/"
}

copy_to "README.md" "$BASE"
copy_to "NAVIGATION.md" "$BASE"
copy_to "unit_9_winning_tips_and_strategies.md" "$BASE/09_winning_tips"
copy_to "unit_10_summary_and_feedback.md" "$BASE/10_summary_feedback"

if [[ "$missing" -ne 0 ]]; then
  echo "חלק מהקבצים לא נמצאו ב־$SRC" >&2
  exit 1
fi
echo "סיימתי. נתונים תחת $BASE (שורש, 09, 10)"
