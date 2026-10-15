# Scope and roadmap

## Initial scope

Vector-first 2D authoring for coding agents: rectangles, ellipses, polygons, text, and paths in named layers. A JSON source builds an editable SVG plus PNG/PDF exports through headless Inkscape. Intended uses include icons, diagrams, badges, simple logos, title cards, and other bounded vector compositions.

## Current limits

- Node.js 22 or newer and an existing Inkscape 1.2 or newer installation are required; there are no npm dependencies or browser requirements.
- Linux is the initial verification target. macOS and Windows need explicit verification before support is claimed.
- Canvas dimensions are limited to 4096 pixels per side, projects to 128 leaves / 64 groups / 192 nodes with at most four group levels, and JSON input to 2 MiB.
- No PNG/JPEG imports or embedded raster images in vector projects. A separate fixed-canvas PNG atlas export packs existing frames for games. SVG outputs are authored geometry, not raster images wrapped in an SVG container.
- No import or round-trip editing of arbitrary existing SVG documents.
- No freehand brush engine, mesh gradients, masks, filters, custom blend modes, raw transforms, path morphing, skeletal constraints, or physics. Bounded groups, pivot transforms, short group-property timelines, linear/radial fills, fill rules, and stroke caps/joins are supported.
- Animation is limited to 2–120 frames at 1–30 fps and 64 Mi-pixels total. Optional GIF/MP4 requires FFmpeg; MP4 needs even canvas dimensions and explicit background. GIF cannot preserve partial alpha or arbitrary frame timing exactly.
- No arbitrary scripts, raw XML, URLs, or plug-in/extension procedure invocation in project data.
- Typography is limited and depends on installed fonts; layout requires visual review.
- No interactive editor, image generator, remote asset service, or publishing service.
- The earlier GIMP prototype is historical work, not a required dependency or the vector export backend.

## Candidate next steps

These are possibilities, not implemented features or delivery commitments:

1. Expand geometry, transparency, text, and PDF export regression coverage across Inkscape versions.
2. Establish executable discovery and verification on macOS and Windows.
3. Consider clipping and richer animation controls only after concrete workflows justify a bounded, tested contract.
4. Add typography and layout controls with reproducible font handling.
5. Define a safe existing-SVG editing contract that preserves manual edits.

Grow the format through explicit versioned operations and tests rather than unrestricted XML or script execution.

## Drawn-pose craft

Independent static project sequences support frame-specific contours and joints. Craft guidance covers gesture, contact, material/color separation and world scale. No automatic anatomy, eight-view generation, in-betweening or game state machine is claimed. Future tooling should address a demonstrated authoring gap rather than substituting rigid animation for requested pose drawing.
