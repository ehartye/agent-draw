# WITH-skills drawing audit

## Finished evidence

Original drawings were authored and rendered entirely in `/tmp/pose-craft-with`, with the managed runtime in `/tmp/pose-craft-with/runtime`. The repository was read-only. No example geometry, image generation, game edits, remote edits, imports, or runtime/source edits were used.

Final files to inspect first:

- `/tmp/pose-craft-with/outputs/action-v2/contact-sheet.png` (432 × 208)
- `/tmp/pose-craft-with/outputs/action-v2/contact-sheet.svg`
- `/tmp/pose-craft-with/outputs/action-v2/frames/frame-0000.svg` through `frame-0002.svg`, and matching PNGs (128 × 160)
- `/tmp/pose-craft-with/outputs/action-v2/projects/frame-0000.json` through `frame-0002.json`
- `/tmp/pose-craft-with/outputs/action-v2/manifest.json`, `source-manifest.json`, and `receipt.json`
- `/tmp/pose-craft-with/outputs/scene-v2/drawing.png` and `drawing.svg` (320 × 208), plus `receipt.json`
- `/tmp/pose-craft-with/outputs/pose-size-review/drawing.png` (240 × 94): all three poses at 0.5 source scale on the intended ground color
- `/tmp/pose-craft-with/sources/scale-scene.json` and `/tmp/pose-craft-with/sources/pose-size-review.json`
- `/tmp/pose-craft-with/evidence.json`: file sizes, geometry changes, vector-structure and foot-crop checks

Original first-pass renders remain in `outputs/action` and `outputs/scene`. The retained JSON in each sequence output rebuilds that exact version. `author.py` and `revise.py` preserve the original construction and revision; the final review JSON was subsequently reduced to one row after the validation error below.

## What was actually drawn and seen

The three independent front-view courier drawings bring both hands from outside the body to a brass canister carried against the chest. The arms are continuous filled sleeve contours; wrist/hand coordinates and elbow contours change between drawings. There are no animation blocks and no group transforms in any pose source. The final drawing also lowers the eyes toward the object. The scene uses a static 0.5 group scale only to establish the character/world ratio.

I visually inspected the first and revised contact sheets, both scene PNGs, and the 0.5-scale pose-review PNG using `view_image`. All images were supplied at their actual dimensions, rather than merely viewing enlarged individual sprites.

At 128 × 160, hands visibly move inward and contact opposite sides of the canister. Its brass lower half remains visible beneath the fingers. The two forearm directions, elbow bends and torso gaps distinguish the three stages. The first pass had pointed, triangular elbow ends; I redrew their curves and rebuilt. The final curves are softer and the sleeves stay attached. The hand shapes still read as simplified mittens, and the tightly flexed arms are stylized. The torso and legs remain essentially fixed, so this is a compact reach study rather than a fully acted whole-body performance.

The planted boots do not move: all three PNG crops covering source rows 135–159 are byte-identical. The source sole baseline is y=150. This is evidence of stable registration for this brief, not an engine/controller integration test.

At 0.5 scale, the action remains legible: hands outside the body, hands approaching the chest, then hands surrounding the canister. The eyes and small fold marks lose subtlety, while the arm direction and gold object remain readable. The first-to-second change is larger than the second-to-third, consistent with settling into the grasp. Only static frames were inspected; no timed playback was reviewed.

In the 320 × 208 scene the actor's visible raster body height is about 67 pixels, the door opening is 74 pixels, and the roof apex is 159 pixels above their shared ground line. The actor and threshold are placed at y=175; the building is substantially taller. This reads as a compact adult-sized door rather than a giant character. A low crate supplies an additional scale cue.

Indigo clothing separates clearly from warm tan masonry and ochre wood. Material marks are differentiated: compressed elbow creases and broad coat shading, sparse boot scuffs, vertical door grain and plank seams, horizontal crate marks, and sparse masonry chips/cracks around edges. The metal canister has a narrow bright edge and dark side band. Ground and foundation dust are quiet bounded patches. Small marks do not become the main silhouette at 1×.

Light is consistently from upper left: the character's right side is darker, the facade's left edge is lighter, door/window recesses are darker, and actor/crate/building shadows extend down-right. These are hand-drawn lighting cues, not a physically simulated light solution. The actor has a tight boot contact shadow. The broad building shadow is schematic, and the facade is mostly frontal rather than a fully established isometric camera.

Scene SVG structure contains 45 path elements, 11 rectangles and zero image elements, with named layer groups. It is actual vector geometry. I did not perform a GUI node-editing test. PDF files were generated by the normal build but were not independently visually checked; PDF appearance is not part of this audit's visual conclusion.

## Skills used and concrete usefulness

Read `draw-setup`, `draw-authoring`, `draw-export`; authoring references `fundamentals`, `cel-shaded-mascot`, `drawn-poses`, `materials-color-scale`, `parts-and-animation`; export references `drawn-sequence` and `game-atlas`; `docs/project-format.md` and `docs/sequence-format.md`.

The drawings show the specific guidance being used: full independent geometry instead of transform tracks, explicit ground registration, an actual sequence/contact sheet, a person/door/building comparison, separate material/color families, oriented material marks, and a second review at scene scale. The contour-review requirement caused a visible elbow revision after the first successful export. The references also supplied the exact distinction between loop intent and seam proof, and between atlas labels and authored directions.

These are observations about this run, not a causal claim that reading skills guarantees better art. The recipe did not remove the need for contour judgment, and I still initially attempted a QA sheet exceeding the leaf limit. The format document introductory sentence calls itself v0.3 while the skills/runtime and sequence docs describe v0.4; the actual field contract worked for this task.

## Commands, errors and warning evidence

All authoring/export commands used:

`export AGENT_DRAW_HOME=/tmp/pose-craft-with/runtime`

Initial command, verbatim:

`AGENT_DRAW_HOME=/tmp/pose-craft-with/runtime node /workspace/shared/agent-draw-worktrees/poses/scripts/setup.js --check --json`

Returned, exit 1:

`{"ok":false,"error":"Managed runtime missing. Run node scripts/setup.js first."}`

Then:

`node /workspace/shared/agent-draw-worktrees/poses/scripts/setup.js --json`

`node /workspace/shared/agent-draw-worktrees/poses/scripts/setup.js --check --json`

`node /workspace/shared/agent-draw-worktrees/poses/scripts/run-managed.js doctor --smoke`

These succeeded with Node 24.19.0, managed agent-draw 0.4.0 and Inkscape 1.4. The smoke actually exported SVG, PNG and PDF. Full exact output is in `logs/setup.txt`.

`node /workspace/shared/agent-draw-worktrees/poses/scripts/run-managed.js validate /tmp/pose-craft-with/sources/poses/pose-0.json`

The same validate command was run for pose-1, pose-2 and scale-scene. `inspect` was also run for each initial source. Complete commands/output are in `logs/render.txt`.

The first two-row, two-background review project failed validation, verbatim:

`node /workspace/shared/agent-draw-worktrees/poses/scripts/run-managed.js validate /tmp/pose-craft-with/sources/pose-size-review.json`

`{"ok":false,"error":"Project exceeds 128 leaves"}`

The shell stopped before its exports. I reduced that QA project to one row; validation then succeeded. Full failure log: `logs/revision.txt`.

Final actual rendering commands, verbatim:

`node /workspace/shared/agent-draw-worktrees/poses/scripts/run-managed.js sequence /tmp/pose-craft-with/sources/manifest.json --out /tmp/pose-craft-with/outputs/action-v2 --timeout 120`

`node /workspace/shared/agent-draw-worktrees/poses/scripts/run-managed.js build /tmp/pose-craft-with/sources/scale-scene.json --out /tmp/pose-craft-with/outputs/scene-v2 --timeout 120`

`node /workspace/shared/agent-draw-worktrees/poses/scripts/run-managed.js build /tmp/pose-craft-with/sources/pose-size-review.json --out /tmp/pose-craft-with/outputs/pose-size-review --timeout 120`

All returned `"ok": true`. The sequence receipt is `kind: "sequence"`, 3 frames, 4 fps, 0.75 seconds, `loop: false`. Nonempty outputs were checked and inventoried. Final full output: `logs/final-render.txt`. Inkscape emitted warnings during successful exports, including this exact first-smoke text:

`** (inkscape:51): WARNING **: 16:49:33.320: Failed to wrap object of type 'PangoFT2FontMap'. Hint: this error is commonly caused by failing to call a library init() function.`

`** (inkscape:51): WARNING **: 16:49:33.738: Failed to wrap object of type 'GtkRecentManager'. Hint: this error is commonly caused by failing to call a library init() function.`

Per-export PIDs/timestamps and complete warning strings are preserved verbatim in each receipt and log. No other command failures occurred. Runtime automated tests were outside this drawing audit.

## Precise response to the near miss

“`loop: true` only asks playback to repeat the drawings. It does not prove seamless motion, matching endpoints, or smooth timing. This three-frame reach ends with the hands on the chest and begins with them apart, so repeating it would visibly jump back. We would need to author an appropriate return/recovery sequence and review the last-to-first transition in playback before calling it seamless. A contact sheet cannot establish that timing.

“Giving this front-view clip eight directional labels would still produce the same front view eight times. The exporter and atlas packer do not synthesize side, rear or diagonal anatomy. Eight directions require genuinely authored and reviewed views, including their changed silhouettes, overlaps and hand/object relationships, on the agreed canvas and foot anchor. We can accurately package this as a front-view reach now.”
