#!/usr/bin/env bash
# Export LunarArray Map to HTML5 for Next.js embed.
# Requires Godot 4.3+ with Web export templates installed.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$(cd "$ROOT/../.." && pwd)/public/godot"
mkdir -p "$OUT"

GODOT="${GODOT_BIN:-}"
if [[ -z "$GODOT" ]]; then
  if command -v godot >/dev/null 2>&1; then
    GODOT="godot"
  elif [[ -x "/Applications/Godot.app/Contents/MacOS/Godot" ]]; then
    GODOT="/Applications/Godot.app/Contents/MacOS/Godot"
  else
    echo "Godot 4 not found. Install with: brew install --cask godot"
    echo "Or set GODOT_BIN to your Godot binary path."
    exit 1
  fi
fi

echo "Using: $GODOT"
echo "Exporting Web → $OUT/index.html"
"$GODOT" --headless --path "$ROOT" --export-release "Web" "$OUT/index.html"
echo "Done. Next.js embed: components/map/GodotMapEmbed.tsx → /godot/index.html"
