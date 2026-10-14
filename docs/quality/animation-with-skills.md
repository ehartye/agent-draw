# WITH-skills behavioral evaluation: Agent Draw animation

Run date: 2026-10-14 UTC. Checkout read: `/workspace/shared/agent-draw-worktrees/animation`. Isolated runtime and work: `/tmp/animation-eval-with`. No repository edits, remote writes, dependency installation, or fallback around an explicit encoder override were performed.

## Results

- Created original **Pip the seedling**, 128 × 128, a 12-frame wave plus body bob at nominal 12 fps, duration 1 second. GIF and MP4 both encoded successfully with explicit warm background `#FFF4DE`.
- Preserved source JSON, editable master SVG, all 12 SVG/PNG poses, contact sheet, and receipt. Verified all 30 receipt artifact hashes and nonempty files.
- Moved an unrelated group across the character in the root order. Body root index changed from 3 to 2. Stable `arm` and `body` tracks still target the correct parts; all 12 reordered PNG files are byte-identical to the originals, and target group IDs/attributes/transforms match in every frame.
- Explicit missing FFmpeg yielded an actual GIF export failure with ENOENT and no destination left behind. Static SVG/PNG/PDF and frames-only animation still succeeded under the same invalid override.
- Visually inspected the contact sheet, original PNG poses 0, 3, 6, 11, decoded GIF pose 6, and a separately rasterized static PDF. Actual real-time encoded playback was **not inspected**. The result has structural closed-endpoint evidence, selected-pose visual QA, and decode/timing checks; it is not a playback-quality signoff.

## Skills loaded and routing

Read all three skill files before running drawing commands:

- `skills/draw-authoring/SKILL.md`
- `skills/draw-export/SKILL.md`
- `skills/draw-setup/SKILL.md`

Directly linked local references read: authoring `fundamentals.md`, `cel-shaded-mascot.md`, `parts-and-animation.md`; export `animation-export.md`; `docs/project-format.md`, `docs/architecture.md`, `docs/roadmap.md`; and the complete linked `examples/waving-orbit.json`. External SVG standards and download links were not needed to execute this local evaluation.

Observed routing from the trigger descriptions and instructions:

1. “Create a tiny character with movable parts, wave and bob” selects authoring, with setup before the first command, then export for rendering. The mascot reference supplied the silhouette/shadow recipe, while the parts reference supplied hierarchy, local shoulder pivot, stable target IDs, absolute property values, and virtual endpoint rules.
2. “Export this existing Agent Draw JSON to GIF/MP4” selects export plus setup, with animation-export read for `animate`, explicit opaque MP4 background, and encoder requirements. It does not use static `build` as an animation export.
3. “Missing/broken FFmpeg or Inkscape” selects setup for diagnosis. Optional encoder status must be read independently of top-level doctor success.
4. SVG import and path morphing are near misses for the art/animation descriptions. Authoring boundaries and project-format explicitly reject them; no unsupported import field, command, or morph track was invented.
5. Generic website/CSS animation and arbitrary existing-SVG editing are not Agent Draw project authoring/export workflows merely because they mention animation or SVG.

## Exact near-miss responses

For “Import this SVG and animate its arm,” the response is:

> Agent Draw can’t import or round-trip an existing SVG. I can rebuild it as named editable geometry in Agent Draw JSON and animate the arm as a group around a local pivot. Manual edits to an exported SVG won’t be imported back into the JSON.

For “Morph this path into another shape,” the response is:

> Agent Draw doesn’t support path morphing. Its timelines can animate a group’s translation, rotation, scale, or opacity. I can use those controls for a rigid-part motion, but a true changing-contour morph needs a different tool.

These responses apply the documented capability boundary. No invalid near-miss project was submitted or misrepresented as supported.

## Construction and source

Visual brief: a friendly amber seedling with readable eyes and smile, two green crown leaves, a raised waving arm, small body bob, and ample canvas margin, viewed at its native 128 px delivery size. All geometry is original and numerically authored; no imported image or traced SVG was used.

- `body` / “Pip body assembly” contains the character, face, leaves, resting arm, feet and waving-arm child.
- `arm` / “Waving arm assembly” contains arm contour, hand, and hand highlight.
- Arm local shoulder pivot: `(85, 76)` in body-local coordinates. Base rotation −20°.
- Arm absolute rotation track: frame 0 = −20°, frame 6 = +20°, virtual frame 12 = −20°, smooth interpolation.
- Body absolute y track: frame 0 = 0, frame 6 = −3, virtual frame 12 = 0, smooth interpolation.
- `ground` and `sparkle` are separate stable named groups, outside body motion.
- Full opaque background is authored in the source and separately supplied as the MP4 `--background` argument.

Source generation is preserved in `create-project.py`; exact source is `pip.json`. Validation and inspect succeeded on the first authored project. No geometry revisions were needed after visual inspection.

## Setup and runtime evidence

Node `v24.19.0`; existing Inkscape `1.4 (e7c3feb100, 2024-10-09)`; existing FFmpeg `7.1.5-0+deb13u1`. Managed runtime v0.3.0 with source fingerprint `04b892bc0d60215abee9d302b033fc739b3932ae05e54739b3459b4ac6529efd`.

`AGENT_DRAW_HOME=/tmp/animation-eval-with/runtime` is separate from source and output subdirectories. First setup check exited 1 as expected in a fresh home, verbatim:

```json
{"ok":false,"error":"Managed runtime missing. Run node scripts/setup.js first."}
```

Ran setup, repeated the check, and required successful actual SVG/PNG/PDF smoke export before the project export. All succeeded. `doctor --smoke` showed both renderer and optional encoder ready. Actual GIF/MP4 encoding subsequently succeeded, which is stronger than the encoder version probe alone.

## Visual and technical checks

Contact sheet indexes: 0, 3, 6, 9, 11. Each thumbnail is 128 × 128. The start, midway and extreme wave positions are distinct; the body remains readable, the facial expression survives native-size viewing, and the right shoulder stays covered by the body while the hand follows the pivot. The arm does not detach or clip at either extreme. The body lifts 3 px; the fixed ground shadow makes the lift legible. The warm background is opaque, the shadow contour remains contained, and the sparkle stays clear of the character.

Selected pose checks used actual `view_image` inspection, not only file existence. The decoded GIF extreme retains the character, outline, and background visibly. The PDF was independently rendered with `pdftoppm` and visually checked. No interactive Inkscape node-editing test was performed; editability evidence is the SVG vector/group structure and named `part-body` / `part-arm` IDs, with no SVG image elements.

All 12 SVGs and 12 PNGs exist, frames 0000–0011 only; frame 0012 was not exported. Receipt duration is 12/12 = 1 second. Master SVG equals frame 0. Final sampled frame 11 differs from frame 0, as expected rather than adding a duplicate hold.

Receipt loop evidence is `closed: true`, method “canonical SVG equality at virtual endpoint.” This proves endpoint state closure only. The two smoothstep tracks also have zero continuous derivative at their end keys by construction, but that mathematical property does not establish perceptual pacing or encoder/player behavior.

Both encoded outputs fully decoded with FFmpeg and no errors. MP4 probe: H.264, 128 × 128, 12 frames, 12/1 fps, 1.000000 s. GIF: 12 frames, total 1.000000 s, infinite-loop extension (`loop: 0`), frame delays `[80, 90, 80, 80, 90, 80, 80, 90, 80, 80, 90, 80]` ms. These are expected centisecond-quantized approximations of 12 fps. FFprobe reports GIF average frame rate 25/2 and r_frame_rate 12000/1001, so this report uses actual frame delays and total duration rather than presenting those fields as exact nominal fps.

Actual GIF/MP4 real-time playback, subjective cadence, last-to-first visual transition in a player, and automatic MP4 looping remain unverified. Contact sheet and endpoint equality were not substituted for playback QA.

## Reorder evidence

`reorder-project.py` changes root order from `[background, ground, sparkle, body]` to `[background, ground, body, sparkle]`. The unrelated sparkle moves after the body; body’s positional index changes. Neither target ID nor timeline is edited. Source validates and animation export succeeds.

`verify.py` checks every frame’s `part-body`, `part-arm`, `part-ground`, and `part-sparkle` attributes against the original, verifies no embedded raster image elements, and compares all 12 PNG byte sequences. All assertions passed. The actual transform transcript is `15-verification.log`.

Examples:

- Frame 0: body y 0; arm SVG rotation 340° (canonical equivalent of −20°), pivot translate(85,76) / translate(−85,−76).
- Frame 3: body y −1.5; arm rotation 0°.
- Frame 6: body y −3; arm rotation 20°.
- Frame 11: body y −0.22222222222222188; arm rotation 342.96296296296293°.

## Explicit missing-encoder scenario

Set `AGENT_DRAW_FFMPEG=/definitely/missing/ffmpeg` for doctor, requested GIF export, static export, and frames-only export. Did not install FFmpeg, clear the override, or substitute another executable to repair the requested GIF.

Doctor exits 0 and top-level `ok` stays true because renderer readiness is independent of an optional encoder. Its nested FFmpeg status is unambiguously `ok: false`, `status: missing`, `explicitOverride: true`, and error `spawnSync /definitely/missing/ffmpeg ENOENT`. Read that status before promising an encoded format.

Requested GIF export exits 1, exact output:

```json
{"ok":false,"error":"FFmpeg missing. The explicit AGENT_DRAW_FFMPEG selection did not pass its probe. Check that path and its executable permissions first; another existing installation may already be available. Do not silently ignore the selection. Ask before changing it. Frames-only export remains available. No automatic installation was attempted. https://ffmpeg.org/download.html","details":{"ok":false,"command":"/definitely/missing/ffmpeg","status":"missing","version":null,"explicitOverride":true,"optional":true,"installUrl":"https://ffmpeg.org/download.html","advice":"The explicit AGENT_DRAW_FFMPEG selection did not pass its probe. Check that path and its executable permissions first; another existing installation may already be available. Do not silently ignore the selection. Ask before changing it. Frames-only export remains available. No automatic installation was attempted.","error":"spawnSync /definitely/missing/ffmpeg ENOENT"}}
```

`missing-encoder/` does not exist after failure. Static `build` exits 0 and creates successful SVG/PNG/PDF receipt; frames-only `animate` exits 0 and creates its full frame package. Both receipts and all their artifact hashes were independently checked. The failed GIF was not described as produced.

Exact diagnostic response for this scenario:

> The GIF export failed because AGENT_DRAW_FFMPEG points to /definitely/missing/ffmpeg, which returned ENOENT. I kept that explicit selection and didn’t install or switch binaries. Static SVG/PNG/PDF and SVG/PNG animation frames still export successfully. To make the GIF, provide the intended working FFmpeg path or approve changing the selection.

## Friction and limits encountered

- Expected first-run runtime-missing check required setup and recheck.
- Inkscape emitted PangoFT2FontMap/GtkRecentManager wrapping warnings during successful real exports. They are retained verbatim in the logs/receipts; they did not cause failed output or an observed visual defect. Example warning below.
- GIF timing is quantized. This is reported rather than implying 12 perfectly equal 83.333 ms holds.
- Optional-encoder doctor success must not be confused with encoder readiness. The setup skill explicitly directs checking the nested status.
- Real-time encoded playback was not inspected; no extra playback tool was introduced. Structural and selected-image QA are labeled separately.
- No skill ambiguity required asking for missing JSON fields or guessing a supported operation. Source format reference was sufficient for all authored fields.

Representative exact warning from the smoke log:

```text
** (inkscape:53): WARNING **: 15:07:56.108: Failed to wrap object of type 'PangoFT2FontMap'. Hint: this error is commonly caused by failing to call a library init() function.

** (inkscape:53): WARNING **: 15:07:56.551: Failed to wrap object of type 'GtkRecentManager'. Hint: this error is commonly caused by failing to call a library init() function.
```

## Files and raw commands

Primary package: `/tmp/animation-eval-with/animation/`

- `animation.gif`, `animation.mp4`
- `project.json`, `master.svg`, `receipt.json`
- `frames/frame-0000.svg` / `.png` through `frame-0011.svg` / `.png`
- `contact-sheet.svg`, `contact-sheet.png`

Supporting files: `pip.json`, `pip-reordered.json`, `create-project.py`, `reorder-project.py`, `verify.py`, `commands.sh`; command outputs `01-check.log` through `19-frames-only.log` (including probe JSON files); reordered package at `reordered/`; static invalid-encoder package at `static-missing-encoder/`; frames-only invalid-encoder package at `frames-missing-encoder/`; decoded GIF snapshots `gif-decoded-0000.png`, `0003`, `0006`, `0011`; independent PDF raster `static-pdf-preview.png`.

Raw command sequence (logging wrappers omitted here; exact stdout/stderr is retained in numbered logs):

```sh
# Recorded command sequence. This is a transcript, not a rerunnable overwriting script.
# Repository was read only. Generated work and runtime are under /tmp/animation-eval-with.
ROOT=/workspace/shared/agent-draw-worktrees/animation
EVAL=/tmp/animation-eval-with
export AGENT_DRAW_HOME=/tmp/animation-eval-with/runtime

# Skills and directly linked local references read before authoring.
for f in "$ROOT"/skills/*/SKILL.md; do cat "$f"; done
for f in skills/draw-authoring/references/fundamentals.md skills/draw-authoring/references/cel-shaded-mascot.md skills/draw-authoring/references/parts-and-animation.md skills/draw-export/references/animation-export.md docs/project-format.md docs/architecture.md docs/roadmap.md examples/waving-orbit.json; do cat "$ROOT/$f"; done
node --version
command -v inkscape
command -v ffmpeg
node "$ROOT/scripts/setup.js" --check --json
node "$ROOT/scripts/setup.js" --json
node "$ROOT/scripts/setup.js" --check --json
node "$ROOT/scripts/run-managed.js" doctor --smoke

# Full original source-generation script is preserved alongside this transcript.
python "$EVAL/create-project.py"
node "$ROOT/scripts/run-managed.js" validate "$EVAL/pip.json"
node "$ROOT/scripts/run-managed.js" inspect "$EVAL/pip.json"
node "$ROOT/scripts/run-managed.js" animate "$EVAL/pip.json" --out "$EVAL/animation" --gif --mp4 --background '#FFF4DE' --timeout 120

python "$EVAL/reorder-project.py"
node "$ROOT/scripts/run-managed.js" validate "$EVAL/pip-reordered.json"
node "$ROOT/scripts/run-managed.js" animate "$EVAL/pip-reordered.json" --out "$EVAL/reordered" --timeout 120
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate,avg_frame_rate,duration,nb_frames,nb_read_frames -of json "$EVAL/animation/animation.mp4"
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=codec_name,width,height,r_frame_rate,avg_frame_rate,duration,nb_frames,nb_read_frames -show_entries frame=pts_time,pkt_duration_time -of json "$EVAL/animation/animation.gif"
ffmpeg -v error -i "$EVAL/animation/animation.mp4" -f null -
ffmpeg -v error -i "$EVAL/animation/animation.gif" -f null -
python "$EVAL/verify.py"

# Missing encoder test: no later encode selected a different binary.
export AGENT_DRAW_FFMPEG=/definitely/missing/ffmpeg
node "$ROOT/scripts/run-managed.js" doctor
node "$ROOT/scripts/run-managed.js" animate "$EVAL/pip.json" --out "$EVAL/missing-encoder" --gif --timeout 120
node "$ROOT/scripts/run-managed.js" build "$EVAL/pip.json" --out "$EVAL/static-missing-encoder" --timeout 120
node "$ROOT/scripts/run-managed.js" animate "$EVAL/pip.json" --out "$EVAL/frames-missing-encoder" --timeout 120
# The final image/receipt inspection used Pillow, hashlib, JSON and ElementTree,
# not another encoder. GIF selected frames were decoded to gif-decoded-*.png.
pdftoppm -singlefile -scale-to 128 -png "$EVAL/static-missing-encoder/drawing.pdf" "$EVAL/static-pdf-preview"

```

This report contains observations and artifacts only; it assigns no self-score and makes no comparison claim against the paired run.
