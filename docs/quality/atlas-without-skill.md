# Atlas evaluation without skill access

## Result

The atlas was built successfully from copies of the actual Drifter and Revenant frames. Independent checks verified all 16 exact RGBA crops, 64,150 fixed-canvas anchors, ordered stable frame names, two looping 6 fps idle clips, 8 columns, transparent 2-pixel gutters and margins, retained source bytes, and every receipt artifact hash. Rebuilding from the retained manifest produced byte-identical sheet, atlas metadata, animation metadata, normalized manifest, and source frames.

The explicit broken FFmpeg selection failed without falling back. Both attempts to replace a directory containing an unrelated file were refused, including with --overwrite; the file remained byte-identical. No game files, plugin source, or remote content were modified.

## Evaluation boundary

- Working checkout: /workspace/shared/agent-draw-worktrees/atlas (read-only usage).
- Isolated home: AGENT_DRAW_HOME=/tmp/atlas-eval-without/runtime.
- Read README.md, docs/atlas-format.md, package.json, CLI --help, and a targeted grep of src/*.js for diagnostics. Did not read skills/, quality reports, or tests.
- Inputs: copies of /workspace/shared/dust-and-decay/public/assets/drifter-0.png through drifter-7.png and revenant-0.png through revenant-7.png.
- Existing tools: Node v24.19.0, /usr/bin/ffmpeg (receipt version 7.1.5-0+deb13u1), /usr/bin/inkscape (setup version 1.4). Pillow was used independently for pixel verification. No software was downloaded or installed externally. Setup only copied this checkout's managed runtime under the isolated home.
- Runtime version 0.3.1, fingerprint d36fd42aede7d402b358f32c5b5f4fef43c30beee8abc623111ba591edbe1271.

## Commands and manifest

Commands were executed from the checkout. Output logs are retained under /tmp/atlas-eval-without/logs. The commands below omit only tee/exit-status printing for readability.

```sh
mkdir -p /tmp/atlas-eval-without/inputs/frames /tmp/atlas-eval-without/logs
cp /workspace/shared/dust-and-decay/public/assets/drifter-{0..7}.png /workspace/shared/dust-and-decay/public/assets/revenant-{0..7}.png /tmp/atlas-eval-without/inputs/frames/
export AGENT_DRAW_HOME=/tmp/atlas-eval-without/runtime
node scripts/setup.js --check --json
node scripts/setup.js --json
node scripts/run-managed.js --help
node scripts/run-managed.js atlas /tmp/atlas-eval-without/inputs/manifest.json --out /tmp/atlas-eval-without/output
python /tmp/atlas-eval-without/verify.py
node scripts/run-managed.js atlas /tmp/atlas-eval-without/output/manifest.json --out /tmp/atlas-eval-without/rebuilt
AGENT_DRAW_FFMPEG=/missing/encoder node scripts/run-managed.js atlas /tmp/atlas-eval-without/inputs/manifest.json --out /tmp/atlas-eval-without/broken-output
mkdir -p /tmp/atlas-eval-without/unrelated-output
printf 'Preserve this unrelated file exactly.\n' > /tmp/atlas-eval-without/unrelated-output/unrelated.txt
sha256sum /tmp/atlas-eval-without/unrelated-output/unrelated.txt
node scripts/run-managed.js atlas /tmp/atlas-eval-without/inputs/manifest.json --out /tmp/atlas-eval-without/unrelated-output
node scripts/run-managed.js atlas /tmp/atlas-eval-without/inputs/manifest.json --out /tmp/atlas-eval-without/unrelated-output --overwrite
sha256sum /tmp/atlas-eval-without/unrelated-output/unrelated.txt
```

The input manifest was written with Python json.dumps(..., indent=2):

```json
{
  "version": 1,
  "name": "dust-and-decay-idles",
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

## Output inspection and independently verified evidence

- sheet.png is 1042×326 RGBA, exactly 8 columns by 2 rows. For frame index i, the rectangle is x=2+130×(i mod 8), y=2+162×floor(i/8), width=128, height=160.
- All 16 named entries are unrotated and untrimmed. sourceSize is 128×160, spriteSourceSize is (0,0,128,160), and pivot is (0.5,0.9375). Multiplying by the canvas dimensions recovers exactly (64,150). The anchor is metadata; pixels were not repositioned.
- Stable keys are drifter/idle/000 through drifter/idle/007, then revenant/idle/000 through revenant/idle/007. animations.json preserves this order in drifter-idle and revenant-idle, fps=6 and loop=true for each.
- Every crop from the actual sheet equals its input's decoded RGBA pixels byte-for-byte, including RGB values in fully transparent pixels. All 12,012 pixels outside the frame rectangles are exactly (0,0,0,0), covering all gutters and outside margins.
- All 16 retained frames are byte-identical to their copied input PNGs and to the actual game source PNGs. All 21 artifact SHA-256 values in receipt.json match the generated files.
- source-manifest.json is byte-identical to the input manifest. The normalized manifest.json references retained frames/frame-0000.png through frame-0015.png. Rebuilding that retained manifest to a fresh sibling directory succeeds independently of original filename paths.
- sheet.png, atlas.json, animations.json, and manifest.json are byte-identical between the first build and rebuild; all 16 retained frame files are identical too. Receipt and source-manifest differ on the second build because the rebuild's source manifest/path differs, so these were not falsely claimed identical.
- Opened and visually inspected sheet.png: both rows contain front-facing standing/idle poses. This visual review does not establish playback quality or game-engine integration.

Verification script: /tmp/atlas-eval-without/verify.py. Full per-frame checks and exact coordinates: logs/verification.txt. Rebuild hash evidence: logs/rebuild-verification.txt.

## Failure and preservation evidence

### Initial isolated setup check

```text
{"ok":false,"error":"Managed runtime missing. Run node scripts/setup.js first."}
```

Exit status: 1.

### Explicit broken FFmpeg selection

```text
{"ok":false,"error":"FFmpeg missing. Atlas export requires an existing FFmpeg installation. The explicit AGENT_DRAW_FFMPEG selection is authoritative; check its path and permissions. No automatic installation was attempted. https://ffmpeg.org/download.html","details":{"ok":false,"command":"/missing/encoder","status":"missing","version":null,"explicitOverride":true,"optional":true,"installUrl":"https://ffmpeg.org/download.html","advice":"The explicit AGENT_DRAW_FFMPEG selection did not pass its probe. Check that path and its executable permissions first; another existing installation may already be available. Do not silently ignore the selection. Ask before changing it. Frames-only export remains available. No automatic installation was attempted.","error":"spawnSync /missing/encoder ENOENT"}}
```

Exit status: 1.

### Existing directory, default behavior

```text
{"ok":false,"error":"Output already exists; use a new directory or explicit --overwrite"}
```

Exit status: 1.

### Existing directory, explicit overwrite

```text
{"ok":false,"error":"Refusing to replace directory containing unrelated files"}
```

Exit status: 1.

The broken-override process exited 1 and /tmp/atlas-eval-without/broken-output did not exist afterward. The selected command is explicitly recorded as /missing/encoder, explicitOverride=true, status=missing, error=spawnSync /missing/encoder ENOENT. I did not unset or replace the explicit override for that attempted operation, install FFmpeg, or retry via another encoder. The other successful test operations were separate calls without this deliberately broken per-command override.

The unrelated directory contained only unrelated.txt before and after both refusal tests. Its content remained exactly `Preserve this unrelated file exactly.\n`; SHA-256 before and after was 81eb6ecd03cc8b9aa51a24f2c6282895cae5cb59f073c3700d7409045d09e274.

## Near-miss response, exact text

These frames show a front-view idle. Renaming them won’t create walking motion or new viewpoints. I can keep the idle labels or make clearly marked placeholders for your eight-direction setup; genuine walking clips need walking frames for each direction.

No directional or walking labels were applied in this evaluation. No new artwork was generated.

## Observed friction and limits

- The fresh isolated setup check fails with a short actionable runtime-missing error. Following the README setup instruction resolves it locally; there was no atlas-authoring schema failure or retry.
- The format documentation supplied enough information to derive normalized foot-anchor coordinates, semantic names, gutter dimensions, and a reversible output without skills. I still needed a custom pixel/hash verification script to prove those properties independently; CLI success and the receipt alone are not such proof.
- The FFmpeg top-level error is atlas-specific and correctly honors the override, but nested advice says "Frames-only export remains available." That sentence is inherited from the animation/encoding diagnostic and is confusing in an atlas failure: this atlas command itself needs FFmpeg, and the message does not identify another atlas mode that could succeed without it. I did not attempt or claim a fallback.
- README's general overwrite warning says --overwrite permits replacement and warns against unrelated work; this atlas implementation is stronger and actually refuses unrelated content. The exact observed guard is useful, but should not be generalized to arbitrary directories or other workflows without checking them.
- The raw image preview showed white source regions and dark grid gaps because fully transparent source pixels retain white RGB while gutters use zero RGB. Checking RGBA resolved the ambiguity: source corner pixels are (255,255,255,0), while gutters are (0,0,0,0). Both are transparent. There was no opaque-background regression.
- The independent verifier emitted a Pillow getdata() deprecation warning. It was a verifier warning, not a plugin failure; all assertions completed successfully.
- Packing preserves an agreed foot anchor; it does not infer where painted feet should land or correct pose motion. For example, source alpha bounding boxes differ between the characters while the metadata origin remains exactly (64,150).
- Stable frame keys depend on manifest character/action/direction labels and order. Verified keys remain stable for the same manifest and retained-source rebuild; arbitrary reordering was not tested.
- Transparent padding is not edge extrusion. Linear-filtered/minified rendering needs separate in-engine testing; no Phaser runtime, collision geometry, gameplay logic, directional art, loop playback, or cross-platform behavior was verified.
- This test confirms exact fixed-canvas packing and reversible sources, not generated poses, animation authorship, or eight-direction walking support.
