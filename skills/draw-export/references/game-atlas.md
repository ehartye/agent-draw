# Game sprite atlas handoff

Use this workflow when already-authored PNG frames need a shared fixed canvas, foot origin, stable clip names and one Phaser atlas. It packs existing images; it does not create missing poses, turn a front view into eight views, or import raster layers into vector drawings. Keep the original SVG/project sources alongside the frame source directory.

## Prepare

Read `docs/atlas-format.md` from the plugin root. Confirm existing FFmpeg readiness through `doctor`; do not install it or ignore an explicit broken `AGENT_DRAW_FFMPEG`. The atlas command uses FFmpeg, not Inkscape. A successful Inkscape smoke alone does not establish packing readiness.

Choose a shared canvas and anchor before rendering frames. Measure the foot point in source pixels, then divide by canvas width/height. For Dust & Decay, 128×160 frames use foot (64,150), so pivot is exactly (0.5,0.9375). Do not trim each frame independently or round the anchor; this produces ground drift.

Write a strict manifest with relative PNG paths beneath its directory. Every frame must have the declared dimensions. Use semantic character/action names; include direction only when it describes an actually authored view. Clips require explicit fps and loop intent. Grouping a front-view idle sequence under eight direction names does not supply eight-view artwork.

## Pack and verify

```sh
node "<plugin-root>/scripts/run-managed.js" atlas /absolute/path/manifest.json --out /absolute/path/output/actors --timeout 120
```

Use a fresh dedicated output directory. Existing output requires explicit authorized `--overwrite` and a recognized atlas receipt. Never overwrite source frames or unrelated work.

Require successful completion, read the receipt, and verify the sheet, Phaser JSON, animation manifest and retained sources exist. Check all frame rectangles lie inside the sheet, each key maps to the intended source, and pivot values are exact. Review at actual game display size: silhouettes, eyes, hands and weapons must remain legible. Inspect transparency on light/dark backgrounds and the first/last pose of each clip; mathematical naming/packing success is not animation QA.

The packer retains full canvases and adds transparent gutters, without rotation, trimming or color extrusion. Use nearest filtering where suitable, or inspect linear-filter bleeding in the engine. Preserve the game’s depth-sort/ground position separately from the sprite anchor. Do not claim physical-controller or browser integration testing from exporter unit tests.

Deliver sheet.png, atlas.json, animations.json, receipt and retained manifest/frames. The rebuildable manifest uses copied frames; source-manifest.json records the original input unchanged. Retain editable vector originals separately. Publication/deployment remains a separate action.
