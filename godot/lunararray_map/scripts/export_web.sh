#!/usr/bin/env bash
# Export LunarArray Map to HTML5 for Next.js embed.
# Requires Godot 4.x with Web export templates for that exact version.
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

# Detect version (e.g. 4.7.1.stable) for template path check
VER_LINE="$("$GODOT" --version 2>/dev/null || true)"
# e.g. 4.7.1.stable.official.a13da4feb → 4.7.1.stable
VER="$(echo "$VER_LINE" | sed -E 's/^([0-9]+\.[0-9]+(\.[0-9]+)?\.stable).*/\1/')"
TDIR="${HOME}/Library/Application Support/Godot/export_templates/${VER}"
if [[ ! -f "${TDIR}/web_nothreads_release.zip" && ! -f "${TDIR}/web_release.zip" ]]; then
  echo "Missing Web export templates for ${VER}."
  echo "Download once:"
  echo "  https://github.com/godotengine/godot/releases/download/${VER%-stable*}-stable/Godot_v${VER%-stable*}-stable_export_templates.tpz"
  echo "Unzip into:"
  echo "  $TDIR"
  echo "Or: open Godot → Editor → Manage Export Templates → Download"
  exit 1
fi

echo "Using: $GODOT ($VER_LINE)"
echo "Exporting Web → $OUT/index.html"
"$GODOT" --headless --path "$ROOT" --export-release "Web" "$OUT/index.html"
echo "Done. Next.js embed: components/map/GodotMapEmbed.tsx → /godot/index.html"
ls -lh "$OUT"/index.*
