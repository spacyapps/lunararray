<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 3D map textures (components/map/)

Default to procedural, canvas-generated textures (see `buildHullTexture` /
`buildDishTexture` / etc. in `components/map/bases/parts.tsx`, and the Moon's
own texture pipeline in `Moon.tsx`) — no external image assets, everything
drawn at runtime by code. This was the original build constraint and it
still holds for the shared parts kit.

**Amended 2026-07:** hand-picked hero surfaces may use an AI-generated
(e.g. Grok Imagine) image instead, when Walter explicitly asks for one and
supplies the image. Save it under `public/textures/`, wire it in via each
component's optional `imageMap` prop (falls back to the procedural texture
when absent), and note in the commit message which surface got the
exception and why. Don't default to external images for anything not
explicitly called out — the procedural approach stays the rule, this is a
named exception per surface.
