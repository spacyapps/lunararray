# LunarArray Map — Godot 4

Photoreal lunar-base exploration (replaces / dual-paths the Three.js `/map` scene).

## Requirements

- **Godot 4.3+** (4.x Forward+)
- Web export templates installed once in the editor

```bash
brew install --cask godot
```

Or download from [godotengine.org/download](https://godotengine.org/download).

## Open the project

1. Launch Godot → **Import** → select `godot/lunararray_map/project.godot`
2. First open will import textures under `assets/textures/`
3. **Editor → Manage Export Templates → Download and Install** (match editor version)
4. Project → Export → ensure **Web** preset points at `../../public/godot/index.html`

## Run in editor

Press **F5** (main scene: `scenes/main.tscn`).

| Key | Action |
|-----|--------|
| Click hotspot | Dive to base |
| **A** | Approach / wider orbit |
| **E** | Enter residence (LA-08) |
| **Esc** | Step back (interior → base → map) |
| Drag | Free look (pauses auto-orbit ~2.8s) |

## Export HTML5 for Next.js

```bash
chmod +x scripts/export_web.sh
./scripts/export_web.sh
```

Or:

```bash
godot --headless --path . --export-release "Web" ../../public/godot/index.html
```

Output: `public/godot/*` → served as `/godot/index.html`.

`MapRoot` auto-picks Godot when that file exists; otherwise falls back to Three.js.

Force engine:

```bash
# .env.local
NEXT_PUBLIC_MAP_ENGINE=godot   # or three
```

## Scene map

| Path | Role |
|------|------|
| `scenes/main.tscn` | Moon overview, hotspots, UI, camera FSM |
| `scenes/base_environment.tscn` | Regolith, rocks, Earth, lights |
| `scenes/bases/LA00.tscn` | Hub + MMDD hatch easter egg |
| `scenes/bases/LA08.tscn` | Pods, domes, gardens, portal |
| `scenes/interiors/residential.tscn` | Enterable apartment |
| `scripts/*.gd` | Camera, stations, bases |

## Design carry-over

- LA-00 hatch: code = local **MMDD**, hologram on success  
- LA-08: sunlight pods, domes + vegetation, enter residence  
- Interior: wall-top hydro strips, window texture, furniture plate  
- Textures shared with Next `public/textures/` (copied into `assets/textures/`)

## Notes

- Remaining LA-01…07 load as placeholder beacons until scenes are added  
- Web export is large (WASM); first load may take a few seconds  
- Keep Three.js path until a successful export is verified on your machine  
