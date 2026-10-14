# Fixed-canvas game atlas format (0.3.1)

The separate `atlas` command packs already-authored local PNG frames. This does not change vector project version 1 or enable raster imports into drawings. It requires existing FFmpeg; no packages are downloaded. Linux is verified; other platforms are not.

```json
{
  "version": 1,
  "name": "actors",
  "width": 128,
  "height": 160,
  "columns": 8,
  "padding": 2,
  "pivot": {"x": 0.5, "y": 0.9375},
  "clips": [{
    "id": "drifter-idle",
    "character": "drifter",
    "action": "idle",
    "fps": 6,
    "loop": true,
    "frames": ["frames/drifter-0.png", "frames/drifter-1.png"]
  }]
}
```

Manifest paths are relative `.png` files contained beneath the input manifest directory. URLs, parent traversal, symlinks, unknown fields and mismatched canvas sizes are rejected. Only static, non-interlaced 8-bit RGBA PNGs are supported. PNG signature, CRC/chunk and header checks precede actual FFmpeg decoding. Keep manifests and inputs outside output directories.

- `version`: exactly 1; `name`: nonempty, maximum 120 characters.
- `width`, `height`: integers 1–8192; all frames share these dimensions.
- `columns`: integer 1–256; `padding`: integer 0–16, default 2. Transparent gutters and outer margins use the same padding.
- `pivot`: required normalized finite x/y values 0–1. It is metadata, not an instruction to shift source pixels.
- `clips`: unique IDs with explicit character/action, optional authored direction, integer fps 1–120, boolean loop, and nonempty frame paths. IDs and labels use lowercase alphanumeric/hyphen slugs.
- At most 256 total frames; source and padded sheet pixel budgets are bounded to 64 Mi-pixels, and sheet dimensions to 8192. JSON input is limited to 2 MiB. Compressed PNG inputs are capped at 258 MiB per file and 272 MiB in aggregate.
- Frame names derive from `character/action[/direction]/000` in clip order. Duplicate names are rejected. Direction labels describe supplied art, not generated viewpoints.

## CLI and outputs

`node scripts/run-managed.js atlas manifest.json --out output/actors [--overwrite] [--timeout 120]`

Timeout is a whole-operation deadline of 1–600 seconds. Explicit FFmpeg override selection is authoritative. Output publication is staged, with input/source protection and ownership checks before replacement.

Outputs: `sheet.png`, `atlas.json`, `animations.json`, `receipt.json`, copied `frames/frame-0000.png` inputs, byte-identical `source-manifest.json`, and rebuildable `manifest.json` pointing to retained frames.

`atlas.json` uses Phaser JSON hash format: named `frame` rectangles, `rotated:false`, `trimmed:false`, full-size `spriteSourceSize`/`sourceSize`, and normalized `pivot`. `meta` identifies sheet.png, RGBA8888, sheet size and scale 1. `animations.json` contains version 1, texture name, atlas filename and clip metadata with ordered frame keys, fps and loop. It is an Agent Draw handoff manifest, not Phaser's serialized animation-manager format.

Load the atlas with Phaser's atlas loader, then create animations using each clip's frame names, frameRate=fps, and repeat=-1 for loops or 0 otherwise. Apply/verify the intended origin when switching frames. These mappings do not provide gameplay logic, collision shapes, directional art or an engine integration guarantee.

Primary technical references: [Phaser textures and frame pivots](https://docs.phaser.io/phaser/concepts/textures), [Phaser atlas loader](https://docs.phaser.io/api-documentation/class/loader-loaderplugin). The chosen fixed-canvas convention comes from the actual Dust & Decay integration.
