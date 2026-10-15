# Drawn pose sequence format (0.4.0)

`sequence` renders an ordered collection of independently authored static Agent Draw projects. Each frame can redraw contours, joint positions, overlaps, costume folds and shading. This keeps existing strict drawing project version 1; there is no new unrestricted geometry or SVG-import format.

```json
{"version":1,"name":"brace-fire-recover","fps":12,"loop":false,"frames":["poses/brace.json","poses/fire.json","poses/recover.json"]}
```

- Manifest version exactly 1; name is bounded nonempty text; fps is an integer 1–30; loop is an explicit boolean.
- Frames contains 1–120 relative `.json` paths below the manifest directory. Deliberate repeated references create held drawings.
- Every referenced file passes ordinary project validation, must have identical canvas dimensions, and must omit `animation` to avoid ambiguous sampling.
- Manifest and each project are limited to 2 MiB; total manifest plus referenced project bytes to 32 MiB; total frame canvas pixels to 64 Mi-pixels. Existing project geometry/layer/group limits also apply.
- Regular files only; no symlinks, parent traversal, URLs, raw SVG or executable content.

## Command

`node scripts/run-managed.js sequence manifest.json --out output/action [--overwrite] [--timeout 120]`

Existing Inkscape is required. The whole-operation timeout is 1–600 seconds. Each pose is actually rendered to PNG from its generated vector SVG with an isolated Inkscape profile. There is no interpolator or unnecessary per-frame PDF build. FFmpeg is not needed for this command.

## Retained outputs

- `source-manifest.json`: original manifest bytes.
- `manifest.json`: rebuildable manifest referring to retained projects.
- `projects/frame-0000.json`, etc.: original project bytes for each ordered frame.
- `frames/frame-0000.svg` and `.png`, etc.: editable vector and raster output for every drawing.
- `contact-sheet.svg` and `.png`: every frame, rows of at most eight thumbnails, each at most 192×192.
- `receipt.json`: source/output hashes, runtime/renderer versions, dimensions, timing intent and verification limits.

Source and output protection, staged publication, output ownership and cleanup rules apply. An existing directory is not permission to replace its contents; choose a fresh output unless explicit replacement is authorized.

## Meaning of loop and registration

Loop is intent, not proof. Independently drawn first and last poses may differ legitimately; the exporter does not impose equality or append an extra endpoint. The receipt marks seam quality as unproven, requiring visual/playback review. Matching canvases prevents size drift but does not infer anatomy, foot origin or ground contact. Those must be authored and checked at the actual game scale.

Use existing `atlas` output for fixed-canvas Phaser packing or a zero-padding horizontal strip when appropriate. A clip's labels describe authored action/views only. No automatic walk cycle, eight-view synthesis, skeleton, physics, path morphing or gameplay state machine is provided.
