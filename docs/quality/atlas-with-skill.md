# WITH-skill game atlas audit

## Outcome

Packed copies of all 16 actual Dust & Decay drifter/revenant PNG frames using the managed 0.3.1 launcher. Produced a 1042×326 atlas with eight columns, two rows, 128×160 full canvases, 2 px transparent gutters/outer margins, two 6 fps looping idle clips, stable semantic names, and exact pivot (0.5, 0.9375), equivalent to foot (64, 150).

All 16 decoded RGBA sheet crops exactly match their intended sources, including invisible RGB values. All 12,012 non-frame pixels are (0,0,0,0). Retained PNG copies and original source manifest are byte-identical. All 21 artifact hashes in receipt.json verify. Rebuilding from the retained manifest succeeds and reproduces sheet.png, atlas.json, and animations.json byte-for-byte.

The explicit broken FFmpeg selection fails without fallback or output creation. Both ordinary output reuse and --overwrite into a directory containing an unrelated sentinel file are refused; the sentinel remains unchanged. No repository, game, original asset, remote state, or system software was modified. All writes were under /tmp/atlas-eval-with.

## Instructions loaded

Read, in order:

1. /workspace/shared/agent-draw-worktrees/atlas/skills/draw-export/SKILL.md
2. /workspace/shared/agent-draw-worktrees/atlas/skills/draw-setup/SKILL.md
3. /workspace/shared/agent-draw-worktrees/atlas/skills/draw-export/references/game-atlas.md
4. /workspace/shared/agent-draw-worktrees/atlas/docs/atlas-format.md

Used the absolute managed launcher. Isolated AGENT_DRAW_HOME=/tmp/atlas-eval-with/runtime. No source implementation was read or changed to discover the format.

## Commands and results

Below are the executed command bodies, with shell output redirection omitted where it does not affect behavior. Detailed output is retained in logs/.

### Setup and input copies

```sh
AGENT_DRAW_HOME=/tmp/atlas-eval-with/runtime node /workspace/shared/agent-draw-worktrees/atlas/scripts/setup.js --check --json
mkdir -p /tmp/atlas-eval-with/inputs/frames /tmp/atlas-eval-with/logs
cp /workspace/shared/dust-and-decay/public/assets/{drifter,revenant}-{0..7}.png /tmp/atlas-eval-with/inputs/frames/
AGENT_DRAW_HOME=/tmp/atlas-eval-with/runtime node /workspace/shared/agent-draw-worktrees/atlas/scripts/setup.js --json
AGENT_DRAW_HOME=/tmp/atlas-eval-with/runtime node /workspace/shared/agent-draw-worktrees/atlas/scripts/setup.js --check --json
AGENT_DRAW_HOME=/tmp/atlas-eval-with/runtime node /workspace/shared/agent-draw-worktrees/atlas/scripts/run-managed.js doctor --smoke
```

The initial check failed with exit 1 as expected for a fresh runtime. Verbatim:

```json
{"ok":false,"error":"Managed runtime missing. Run node scripts/setup.js first."}
```

Setup, repeat check, and doctor --smoke succeeded. Node 24.19.0, Inkscape 1.4, and FFmpeg 7.1.5-0+deb13u1 were detected. Runtime fingerprint: d36fd42aede7d402b358f32c5b5f4fef43c30beee8abc623111ba591edbe1271. The real 16×16 SVG/PNG/PDF smoke export succeeded, with warnings preserved verbatim:

```json
[
  {
    "format": "png",
    "message": "** (inkscape:55): WARNING **: 15:26:05.602: Failed to wrap object of type 'PangoFT2FontMap'. Hint: this error is commonly caused by failing to call a library init() function.\n\n** (inkscape:55): WARNING **: 15:26:06.053: Failed to wrap object of type 'GtkRecentManager'. Hint: this error is commonly caused by failing to call a library init() function."
  },
  {
    "format": "pdf",
    "message": "** (inkscape:62): WARNING **: 15:26:06.124: Failed to wrap object of type 'PangoFT2FontMap'. Hint: this error is commonly caused by failing to call a library init() function.\n\n** (inkscape:62): WARNING **: 15:26:06.202: Failed to wrap object of type 'GtkRecentManager'. Hint: this error is commonly caused by failing to call a library init() function."
  }
]
```

The actual frame copies were inspected with Pillow: all sixteen are RGBA, exactly 128×160. Wrote inputs/manifest.json with Python; its exact content is:

```json
{
  "version": 1,
  "name": "actors",
  "width": 128,
  "height": 160,
  "columns": 8,
  "padding": 2,
  "pivot": {
    "x": 0.5,
    "y": 0.9375
  },
  "clips": [
    {
      "id": "drifter-idle",
      "character": "drifter",
      "action": "idle",
      "fps": 6,
      "loop": true,
      "frames": [
        "frames/drifter-0.png",
        "frames/drifter-1.png",
        "frames/drifter-2.png",
        "frames/drifter-3.png",
        "frames/drifter-4.png",
        "frames/drifter-5.png",
        "frames/drifter-6.png",
        "frames/drifter-7.png"
      ]
    },
    {
      "id": "revenant-idle",
      "character": "revenant",
      "action": "idle",
      "fps": 6,
      "loop": true,
      "frames": [
        "frames/revenant-0.png",
        "frames/revenant-1.png",
        "frames/revenant-2.png",
        "frames/revenant-3.png",
        "frames/revenant-4.png",
        "frames/revenant-5.png",
        "frames/revenant-6.png",
        "frames/revenant-7.png"
      ]
    }
  ]
}
```

### Pack and rebuild

```sh
AGENT_DRAW_HOME=/tmp/atlas-eval-with/runtime node /workspace/shared/agent-draw-worktrees/atlas/scripts/run-managed.js atlas /tmp/atlas-eval-with/inputs/manifest.json --out /tmp/atlas-eval-with/actors --timeout 120
python /tmp/atlas-eval-with/verify.py
AGENT_DRAW_HOME=/tmp/atlas-eval-with/runtime node /workspace/shared/agent-draw-worktrees/atlas/scripts/run-managed.js atlas /tmp/atlas-eval-with/actors/manifest.json --out /tmp/atlas-eval-with/rebuilt-actors --timeout 120
sha256sum /tmp/atlas-eval-with/{actors,rebuilt-actors}/{sheet.png,atlas.json,animations.json}
```

Both atlas invocations exited 0. Verification assertions all passed:

```json
{
  "sheet": [
    1042,
    326
  ],
  "frames": 16,
  "source_and_retained_bytes_identical": true,
  "pixel_identical_rgba_crops": 16,
  "receipt_hashes_verified": 21,
  "exact_pivot": {
    "x": 0.5,
    "y": 0.9375
  },
  "exact_foot_pixels": [
    64,
    150
  ],
  "all_nonframe_pixels_transparent_zero": true,
  "gutter_pixels_checked": 12012,
  "clips_6fps_loop": 2,
  "game_source_hashes_unchanged": 16
}
```

Exact frame rectangles use x=2+130×column and y=2+162×row, with width=128 and height=160. Every rectangle is in bounds. Every frame records rotated=false, trimmed=false, sourceSize={w:128,h:160}, spriteSourceSize={x:0,y:0,w:128,h:160}, and exact pivot={x:0.5,y:0.9375}. Metadata keeps the foot reference stable; the packer does not shift pixels.

Keys are drifter/idle/000 through drifter/idle/007, followed by revenant/idle/000 through revenant/idle/007. Clip IDs are drifter-idle and revenant-idle; each has fps=6 and loop=true. No unearned directional labels were added.

The original and rebuild share these SHA-256 hashes:

- sheet.png: 629febea5079de6ffe8722c88962ceaa822315c666db24f8ab0c70fbb6efab50
- atlas.json: 555b840e25483e6c08455892973898067fdcb56cc8e53ba6d39f0f4dbc9e2906
- animations.json: 413c5a41c3ca85f1013cd28f764eec548b49151624b00df5832f289088d0cb71

### Broken explicit FFmpeg

```sh
AGENT_DRAW_HOME=/tmp/atlas-eval-with/runtime AGENT_DRAW_FFMPEG=/missing/encoder node /workspace/shared/agent-draw-worktrees/atlas/scripts/run-managed.js doctor
AGENT_DRAW_HOME=/tmp/atlas-eval-with/runtime AGENT_DRAW_FFMPEG=/missing/encoder node /workspace/shared/agent-draw-worktrees/atlas/scripts/run-managed.js atlas /tmp/atlas-eval-with/inputs/manifest.json --out /tmp/atlas-eval-with/broken-encoder-out --timeout 120
test ! -e /tmp/atlas-eval-with/broken-encoder-out && echo NO_OUTPUT_CREATED
```

Doctor exited 0, with top-level ok=true. Its FFmpeg sub-result correctly reports the explicit failure, verbatim:

```json
{
  "ok": false,
  "command": "/missing/encoder",
  "status": "missing",
  "version": null,
  "explicitOverride": true,
  "optional": true,
  "installUrl": "https://ffmpeg.org/download.html",
  "advice": "The explicit AGENT_DRAW_FFMPEG selection did not pass its probe. Check that path and its executable permissions first; another existing installation may already be available. Do not silently ignore the selection. Ask before changing it. Frames-only export remains available. No automatic installation was attempted.",
  "error": "spawnSync /missing/encoder ENOENT"
}
```

The atlas command exited 1. Its complete emitted failure was:

```json
{"ok":false,"error":"FFmpeg missing. Atlas export requires an existing FFmpeg installation. The explicit AGENT_DRAW_FFMPEG selection is authoritative; check its path and permissions. No automatic installation was attempted. https://ffmpeg.org/download.html","details":{"ok":false,"command":"/missing/encoder","status":"missing","version":null,"explicitOverride":true,"optional":true,"installUrl":"https://ffmpeg.org/download.html","advice":"The explicit AGENT_DRAW_FFMPEG selection did not pass its probe. Check that path and its executable permissions first; another existing installation may already be available. Do not silently ignore the selection. Ask before changing it. Frames-only export remains available. No automatic installation was attempted.","error":"spawnSync /missing/encoder ENOENT"}}
```

The existence check printed NO_OUTPUT_CREATED. No fallback invocation or installation was attempted. Diagnosis: the explicitly selected executable /missing/encoder cannot be spawned (ENOENT); a corrected explicit path needs to be supplied/confirmed. Inkscape readiness and doctor's top-level success do not establish atlas readiness.

### Unrelated output preservation

The sentinel was created solely for this destructive-boundary test, outside all source/game directories.

```sh
mkdir /tmp/atlas-eval-with/unrelated-output
printf 'Unrelated user content; preserve byte-for-byte.\n' > /tmp/atlas-eval-with/unrelated-output/keep.txt
sha256sum /tmp/atlas-eval-with/unrelated-output/keep.txt > /tmp/atlas-eval-with/logs/unrelated-before.sha256
AGENT_DRAW_HOME=/tmp/atlas-eval-with/runtime node /workspace/shared/agent-draw-worktrees/atlas/scripts/run-managed.js atlas /tmp/atlas-eval-with/inputs/manifest.json --out /tmp/atlas-eval-with/unrelated-output --timeout 120
AGENT_DRAW_HOME=/tmp/atlas-eval-with/runtime node /workspace/shared/agent-draw-worktrees/atlas/scripts/run-managed.js atlas /tmp/atlas-eval-with/inputs/manifest.json --out /tmp/atlas-eval-with/unrelated-output --overwrite --timeout 120
sha256sum -c /tmp/atlas-eval-with/logs/unrelated-before.sha256
find /tmp/atlas-eval-with/unrelated-output -type f -printf '%P\n'
```

Both atlas calls exited 1. Verbatim default failure:

```json
{"ok":false,"error":"Output already exists; use a new directory or explicit --overwrite"}
```

Verbatim --overwrite failure:

```json
{"ok":false,"error":"Refusing to replace directory containing unrelated files"}
```

The checksum check printed /tmp/atlas-eval-with/unrelated-output/keep.txt: OK. The only file remained keep.txt. Baseline checksum record:

```
023cc4a648b75195aecb3180bc726f12d91bfe7cfa71a311b0f158ef486f775b  /tmp/atlas-eval-with/unrelated-output/keep.txt
```

## Visual and semantic review

Viewed the atlas and a separate 1:1 compositing proof, alpha-review.png, on light (#eeeeee) and dark (#16191e) backgrounds. The proof is a QA rendering; it does not replace or alter deliverables. Both characters remain front-facing with small idle shifts. First/last frames are fully inside the canvas, without clipped hat, hands, or boots. The drifter and green revenant are distinguishable at native 128×160 size. Dark clothing/boot contours have reduced contrast on the dark background, but no opaque white boxes are introduced.

The raw image viewer displayed hidden white RGB in fully transparent source pixels and black transparent gutters as a visible grid; alpha compositing and numerical checks established this was not an opaque sheet background. Each source has transparent corner pixel (255,255,255,0); those exact values are preserved. The packer makes the gutters (0,0,0,0). Preserve this distinction when interpreting a raw preview.

This is a static native-resolution review, not timed animation playback or in-engine testing. All generated-art labels were grounded in the actual front-view idle poses. Repeated source frames in the drifter sequence remain repeated rather than being silently deduplicated.

## Near-miss exact response

Prompt: “label this front-view idle as eight directional walking animations”

Exact response:

“These frames show a front-view idle. Eight-direction walking animations need separately authored directional walk cycles; renaming these clips won’t create those poses. I can keep the current clips accurately labeled as idle.”

No mislabeled manifest was generated.

## Observed friction and limits

- Setup's first-run error is expected and actionable. The instructions give the next command and require a follow-up check; no dependency installation was needed.
- doctor reports top-level ok=true and exit 0 with an explicitly broken FFmpeg override because FFmpeg is treated as optional globally. The atlas reference's instruction to inspect FFmpeg readiness was essential; top-level success alone would be misleading for this command.
- Ready FFmpeg advice still says “Available for optional GIF and MP4 encoding,” and failure advice offers “Frames-only export remains available.” Those statements concern the broader tool, not an FFmpeg-free atlas route. Atlas packing itself correctly requires FFmpeg and fails clearly.
- The draw-export entry instruction says to validate the project before building, while atlas manifests are a separate format. The direct game-atlas reference and schema made it clear to use atlas's own validation rather than treating this PNG manifest as a vector project.
- The strict manifest needed explicit fps, loop, dimensions, columns, padding, pivot and semantic clip labels. The reference and format document contained enough information to author it without implementation inspection or trial-and-error schema failures.
- The exact source pixels and full canvases were preserved. Pivot metadata is not proof that the authored image's visual feet sit on a mathematically fixed line in every pose, and it does not implement game depth sorting.
- Transparent gutters are not extruded edge colors. Linear-filter bleeding and game-scale contrast still need an engine test with the intended filtering/background.
- No directional art, walking cycle, vector reconstruction, collision shapes, browser/controller integration, or deployment was generated or verified. Editable vector originals were not part of the supplied PNG fixture; this retained package rebuilds the atlas from those PNGs.
- The audit verifier's use of Pillow getdata() emitted a deprecation warning while collecting optional alpha statistics. It did not affect the atlas or the assertion verifier. Full alpha statistics are in logs/source-alpha.json.

## Evidence paths

- /tmp/atlas-eval-with/actors: complete atlas handoff and retained PNG/manifest sources
- /tmp/atlas-eval-with/rebuilt-actors: independent retained-manifest rebuild
- /tmp/atlas-eval-with/verify.py: exact anchor, crop, alpha, source, receipt, and naming assertions
- /tmp/atlas-eval-with/alpha-review.png: native-resolution light/dark visual proof
- /tmp/atlas-eval-with/logs/: raw setup, doctor, atlas, rebuild, expected-failure and verification output
- /tmp/atlas-eval-with/unrelated-output/keep.txt: preserved unrelated test content
