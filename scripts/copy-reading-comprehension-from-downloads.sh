#!/usr/bin/env bash
# מעתיק מסמכי «הבנת הנקרא» (יחידה 6) מ־Downloads ל־content/amirnet-course.
# אם קיים practice_quizzes-*.zip — מחלץ ממנו קבצי .md ל־practice_quizzes.
# הרצה: bash scripts/copy-reading-comprehension-from-downloads.sh

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${1:-$HOME/Downloads}"
DEST="$ROOT/content/amirnet-course/06_reading_comprehension"
PQ="$DEST/practice_quizzes"

missing=0
zip_ok=0
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
  reading_comp_quiz_1_easy.md \
  reading_comp_quiz_2_easy.md \
  reading_comp_quiz_3_intermediate.md \
  reading_comp_quiz_4_intermediate.md \
  reading_comp_quiz_5_hard.md \
  reading_comp_quiz_6_hard.md \
  reading_comp_quiz_7_mixed.md \
  reading_comp_quiz_8_mixed.md \
  SAMPLE_reading_comp_quiz_intermediate.md; do
  copy_one "$f" "$PQ/$f"
done

for f in \
  6.2_solving_methods_master_guide.md \
  6.3_paragraph_structure_guide.md \
  6.6_common_traps_guide.md; do
  copy_one "$f" "$DEST/$f"
done

# חבילת zip (שם עם חותמת זמן) — רק .md, שטוח לתיקיית practice_quizzes
shopt -s nullglob
zips=("$SRC"/practice_quizzes-*.zip)
if ((${#zips[@]})); then
  for z in "${zips[@]}"; do
    echo "מחלץ: $z"
    if unzip -o -j -q "$z" "*.md" -d "$PQ"; then
      echo "  -> $PQ"
      zip_ok=1
    else
      echo "כשל unzip (אולי אין .md בפנים?)" >&2
      missing=1
    fi
  done
else
  echo "אין practice_quizzes-*.zip ב־$SRC — מדלג"
fi
shopt -u nullglob

if [[ "$missing" -ne 0 ]] && [[ "$zip_ok" -eq 0 ]]; then
  echo "חלק מהעתקות ה־md נכשלו וגם ה־zip לא חולץ — בדוק." >&2
  exit 1
fi
if [[ "$missing" -ne 0 ]]; then
  echo "הערה: חלק מהקבצים הבודדים חסרו ב־$SRC; אם ה־zip מכסה אותם — אין בעיה." >&2
fi
echo "סיימתי. נתונים תחת $DEST"
