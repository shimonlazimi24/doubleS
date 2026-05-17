#!/usr/bin/env bash
# מעתיק מסמכי «סימולציות מלאות» (יחידה 8) מ־Downloads ל־content/amirnet-course.
# הרצה: bash scripts/copy-simulations8-from-downloads.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:-$HOME/Downloads}"
DEST="$ROOT/content/amirnet-course/08_full_simulations"

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
  simulation_1_baseline.md \
  simulation_2_warmup.md \
  simulation_3_challenge.md \
  simulation_4_final.md \
  8.1_how_to_run_simulation.md \
  8.2_reading_simulation_report.md \
  8.3_progress_tracking_sheet.md; do
  copy_one "$f"
done

if [[ "$missing" -ne 0 ]]; then
  echo "חלק מהקבצים לא נמצאו ב־$SRC" >&2
  exit 1
fi
echo "סיימתי. נתונים תחת $DEST"
