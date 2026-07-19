# LunarArray Map → Godot 4 Migration

Work locally only. Do not push until Walter asks.

## Goal

Replace (or dual-path) the Three.js `/map` exploration with a **Godot 4** experience:
photorealistic lunar bases, better perf, HTML5 export embeddable in Next.js.

## Architecture

```
lunararray/                          # existing Next.js app
├── app/map/page.tsx                 # stays access-gated shell
├── components/map/
│   ├── MapRoot.tsx                  # lock screen + embed host
│   └── GodotMapEmbed.tsx            # NEW: loads exported Godot WASM/HTML
├── public/godot/                    # Godot HTML5 export output
│   ├── index.html
│   ├── lunararray_map.js
│   ├── lunararray_map.wasm
│   └── *.pck / assets
└── godot/lunararray_map/            # NEW: Godot 4 project (source of truth for 3D)
    ├── project.godot
    ├── export_presets.cfg
    ├── scenes/
    │   ├── main.tscn                # map hub / moon overview
    │   ├── base_environment.tscn
    │   ├── bases/LA00…LA08.tscn
    │   └── interiors/residential.tscn
    ├── scripts/
    │   ├── map_camera.gd
    │   ├── station_data.gd
    │   ├── base_controller.gd
    │   └── residential_enter.gd
    ├── assets/textures/             # Imagine + NASA-style maps (copied/symlinked)
    └── materials/
```

**Integration model:** Next.js keeps access gate + UI chrome. Canvas 3D is either:
1. **Godot HTML5 iframe/embed** (primary path once export works), or
2. Temporary Three.js fallback until first successful export.

## Design requirements (carry over)

| ID | Requirement |
|----|-------------|
| LA-00 | Central hub + **secret hatch easter egg** (MMDD keypad → subsurface hologram) |
| LA-08 | Sunlight pods on rim, space domes, **enterable** residential apartment |
| Interior | Wall-top hydroponic vegetation, ceiling artificial sun, digital panels, window view |
| All | Photoreal PBR, lunar regolith, Earth/Sun disks, smooth camera, approach/enter |

## Phases

| # | Phase | Status | Notes |
|---|--------|--------|-------|
| 0 | Plan + TODO | **done** | This file |
| 1 | Scaffold Godot 4 project | **done** | project.godot, scenes, scripts |
| 2 | Core systems | **done** | Camera FSM, station data, environment |
| 3 | Bases (LA-00 egg, LA-08 pods/domes/enter) | **done** | LA00/LA08 scenes + scripts |
| 4 | Residential interior | **done** | residential.tscn + residential.gd |
| 5 | Assets (copy from public/textures) | **done** | assets/textures/* |
| 6 | Web export pipeline | **done** | export_presets.cfg + export_web.sh |
| 7 | Next.js embed | **done** | GodotMapEmbed + MapRoot auto-switch |
| 8 | Install Godot / first HTML5 build | **done** | Godot 4.7.1 + templates; export in public/godot/ |
| 9 | Polish + document | **done** | godot/lunararray_map/README.md |

## Godot requirement

Godot **is not currently installed** on this machine. Phase 8 needs either:

```bash
# macOS (user installs)
brew install --cask godot
# or download Godot 4.3+ from https://godotengine.org/download
```

Export templates for **Web** must be installed once in the editor  
(Editor → Manage Export Templates) or via:

```bash
godot --headless --export-release "Web" public/godot/index.html
```

## Camera FSM (mirror Three.js)

```
map → dive → base ⇄ approach → interior → base → rise → map
```

- Map: orbit moon / select station  
- Dive: cinematic fly-in  
- Base: auto-orbit + free look  
- Approach: tighter framing  
- Interior: LA-08 residence only  
- Esc / UI: step back one level  

## Performance targets (Web)

- 60fps desktop, 30fps+ mid mobile where possible  
- Baked / limited real-time lights  
- Texture size caps (1024–2048)  
- LOD for distant bases  
- Single environment + WorldEnvironment for ACES-like tone  

## Execution notes

- Keep Three.js map **working** until Godot embed is verified  
- Reuse `public/textures/*` (copy into `godot/.../assets/textures`)  
- Do not push; Walter pushes  
- Ask before: new npm deps, brew install Godot, force-push  

## Phase summaries (filled as we go)

### Phase 0
Plan written; architecture is Next shell + Godot HTML5 embed + `godot/lunararray_map` source.

### Phase 1–7 (scaffold + embed)
Godot project under `godot/lunararray_map/` with main map, LA-00 (hatch MMDD), LA-08 (pods/domes/portal), residential interior, camera FSM, texture assets, Web export preset, and Next.js embed (`GodotMapEmbed` + auto fallback to Three.js).

### Phase 8 — export succeeded (Godot 4.7.1)
- Installed cask `godot` 4.7.1
- Downloaded export templates into `~/Library/Application Support/Godot/export_templates/4.7.1.stable/`
- `./godot/lunararray_map/scripts/export_web.sh` → `public/godot/index.html` (+ `.wasm` ~38MB, `.pck` ~12MB)
- Next `/map` auto-selects Godot when that file is present

```bash
npm run dev
# open /map (after access unlock)
```
