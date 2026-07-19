# LunarArray /map — 3D Base Exploration Enhancement

Work locally only. Do not push until Walter asks.

## Phase status

| Phase | Title | Status |
|-------|--------|--------|
| 1 | Analyze current /map code & easter eggs | **done** |
| 2 | Plan unique base designs | **done** |
| 3 | Camera / view state (smooth approach + enter) | **done** |
| 4 | LA-08 exterior (sunlight pods, keep domes) | **done** |
| 5 | Residential interior (wall-top hydroponics) | **done** |
| 6 | Base uniqueness polish (exteriors) | **done** |
| 7 | Textures via Grok Imagine | **done** |
| 8 | Lighting, performance, mobile | **done** |
| 9 | Test & refine | **done** (build + tsc + eslint clean) |

---

## Phase 1 — Analysis (findings)

### Route & stack
- Route is **`/map`** (not `/maps`): `app/map/page.tsx` → `MapRoot` → dynamic `MapScene`.
- Stack: Next.js App Router + `@react-three/fiber` + `@react-three/drei` + `three` (no new deps).
- Access-gated via `useAccessUnlocked` / RequestAccess.

### Easter egg (kept intact)
**LA-00** service hatch SW of terminal (`HATCH_POS = [-10,0,8]`):
1. Click hatch → keypad HTML overlay.
2. Code = **today’s local date as MMDD** (no UI hint).
3. Success → `TunnelHologram` subsurface map.
LA-00 exterior structure and hatch logic were **not** redesigned.

---

## What shipped

### Camera / FSM (`view.ts`, `CameraDirector.tsx`, `MapScene.tsx`)
```
map → dive → base ⇄ approach → interior (LA-08) → base → rise → map
```
- **Approach base** / **Wider orbit** (button + key `A`)
- **Enter residence** on LA-08 (button + key `E`)
- Esc: interior → base; base/approach → rise → map
- Fade-through-black on enter/exit so exterior↔interior swaps stay clean
- Canvas `dpr={[1, 1.75]}` + `powerPreference: high-performance`

### LA-08 exterior
- Park + outer greenhouse domes kept (hero `dome-glass.jpg` on park + half outer)
- **SunlightPodRing** at r≈30 (14 pods) and r≈22.5 (8 pods)
- Atmosphere light shafts, residential portal canopy on plaza
- Stronger night-city lighting

### Residential interior (`bases/interiors/ResidentialInterior.tsx`)
- Warm apartment bay, lounge, plant nooks, soft sconces
- Lunar viewport with Earth glow
- **HydroponicChannel** along wall crowns (no soil, grow-light tubes + foliage)
- Hero maps: `interior-wall.jpg`, `hydroponic-greenery.jpg`

### Parts kit
- `SunlightPod`, `SunlightPodRing`, `HydroponicChannel`
- `LensDome` optional `imageMap`

### Textures (`public/textures/`)
| File | Use |
|------|-----|
| `sunlight-pod.jpg` | Collector pod skins |
| `dome-glass.jpg` | Greenhouse / park domes |
| `interior-wall.jpg` | Residence walls |
| `hydroponic-greenery.jpg` | Wall-crown plant cards |

### Light polish
- LA-01 / LA-03 / LA-07 accent practicals bumped (LA-00 untouched)

### Verify
- `tsc --noEmit` clean
- `eslint components/map` clean
- `npm run build` success

---

## How to try it
1. Unlock access (Request Access on site or prior unlock).
2. Open `/map`, click **LA-08 Imbrium**.
3. **Approach base** → closer exterior orbit.
4. **Enter residence** → apartment with wall-top gardens.
5. Esc / **Exit residence** → back to exterior; **Return to array** → moon map.
6. LA-00 hatch easter egg still works as before (MMDD).

## Optional next (not in this pass)
- Free look OrbitControls on base (currently cinematic + approach zoom)
- Enter interiors for other house bases
- Redesign LA-00 surface (keep hatch lore)
