# Without-skills paired craft evaluation

Completed using the read-only checkout at `/workspace/shared/agent-draw-worktrees/poses`. All authored sources, managed runtime, renders and evidence are under `/tmp/pose-craft-without`. No repository, game, or remote changes were made. No example geometry was copied and no image generation was used.

## Deliverables

1. Three original static 128 × 160 drawings: a courier brings both hands toward a neck-strapped chest compass. The neck strap gives the chest object support before either hand reaches it. The sequence is intentionally nonlooping, three frames at 3 fps.
2. An original 384 × 256 scene places that courier beside a sunlit masonry workshop and wooden doorway at a shared ground baseline.
3. An honest response to the loop/direction near miss, below.

Primary review images:
- `sequence-output/contact-sheet.png` (432 × 208; each pose is shown at its authored 128 × 160 size)
- `sequence-output/frames/frame-0002.png` (128 × 160)
- `scene-output/drawing.png` (384 × 256)

Editable and rebuildable sources:
- `poses/00-reach.json`, `poses/01-gather.json`, `poses/02-hold.json`
- `sequence.json`
- `sequence-output/projects/frame-0000.json` through `frame-0002.json`
- `sequence-output/frames/frame-0000.svg` through `frame-0002.svg`, with each corresponding PNG
- `sequence-output/contact-sheet.svg`, `manifest.json`, `source-manifest.json`, `receipt.json`
- `scene.json`
- `scene-output/drawing.svg`, `drawing.png`, `drawing.pdf`, `receipt.json`
- `author.py` contains the complete original authoring procedure. `check_evidence.py` and `inspection.json` retain the checks and artifact hashes.

## What I read

Only README.md, docs/project-format.md and docs/sequence-format.md from the checkout. I did not read skills/, docs/quality/, or any example projects. This evaluation therefore uses the format and CLI documentation but no craft skill material.

## Actual visual review

I opened the generated contact-sheet PNG, the final individual pose PNG, and the scene PNG with the image-viewing tool. The review was at their original pixel dimensions, not an enlarged beauty render.

### Pose sequence

- The first pose has hands near the waist; the second pulls them inward and higher; the third closes both hands around the chest compass.
- The elbows flare outward and the sleeves change from downward bent arms into folded forearms. The continuous arm silhouettes and fold marks change, rather than moving a fixed arm with a transform track.
- The final pose has a clearly bent left and right elbow, with hands overlapping the compass edges while leaving its face visible.
- Head, torso, legs and boots stay registered. Both boots stay in the same place in the contact sheet.
- This is a three-pose action study. At 3 fps the individual drawings are meant to remain readable. It is not evidence of smooth playback, and I did not claim a polished animation or inspect an encoded animation.
- The character uses stylized proportions. Fingers are simplified into mitten-like grips at this small size. The approach to the object is readable, but the hand articulation is not anatomically detailed.

### Scene at 384 × 256

- Cool blue clothing is visually distinct from warm peach/terracotta masonry. The brass compass repeats the warmer object accent without making the whole figure the same color family as the building.
- Masonry has staggered pale mortar joints, sparse chips and pocks. Wood has vertical plank seams, curved grain and a knot. Clothing has short directional fold marks and hem/seam lines. The marks are material-specific rather than the same texture applied to all surfaces.
- The roof/top-left edges are light; the building's right face is darker; the roof/eaves and doorway recesses have shadow. Ground shadows point down and right from the building and figure, consistent with sunlight from upper left.
- The character feet and doorway share y = 220. The figure does not float above or sink into a differently placed ground line.
- The figure is approximately 85.8 px high against a 106 px door. That ratio is consistent with a 1.70 m person and a 2.10 m door, as an explicit scale assumption rather than measured real-world dimensions.
- At this size the blue silhouette, hands-at-chest action, door, brick courses, wood grain and lighting planes remain visible. Tiny facial and compass details are substantially less legible than in the standalone 128 × 160 sprite. The small stone chips are subordinate detail, not necessary to identify the material.
- The illustration is deliberately sparse and stylized. I have not tested alternate backgrounds, different game scenes, other camera views, or player-controlled motion.

## Registration and geometry evidence

The three source drawings have no `animation` object and no groups/transforms. Left sleeve, right sleeve, left hand and right hand each have three distinct path-data strings. Both boot objects are byte-equivalent as parsed source data across all poses.

The unchanged PNG pixel region x = 28…98, y = 130…153 covers both boots and nearby ground contact. It is byte-identical in all three frames. The boot sole paths have an authored y = 147 baseline. In the scene, a static group placement uses y = 122.98 and scale = 0.66, so 122.98 + 147 × 0.66 = 220 exactly. That scene-only transform resizes the already independently drawn final pose; it is not a substitute for redrawing the sequence.

The complete machine-readable evidence and SHA-256 inventory are in `inspection.json`.

## Near-miss response

“`loop: true` records playback intent; it does not prove seamless motion. For an independently drawn sequence, the exporter does not force the last drawing to match the first or generate in-betweens, and its receipt leaves seam quality unproven. These three drawings end with the hands gripping the compass and start with the hands down, so simply looping them creates a visible reset. We would need to author the return/recovery motion and review the last-to-first transition in actual playback. Even a transform animation with a matching virtual endpoint proves a closed state, not smooth velocity or attractive motion.

“Changing labels from a front view into eight direction names would still give you the same front-view geometry. Those labels cannot create side/back silhouettes, changed overlaps, face visibility, costume placement, or lighting. Eight actual directions require eight authored views with consistent proportions, anchors and ground contact. The exporter can preserve and label those drawings once they exist; it does not synthesize them.”

## Commands and outcomes

These are the exact executable commands used, excluding the shell heredocs that wrote the retained Python source files and this report:

```sh
pwd; ls -la /workspace/shared/agent-draw-worktrees/poses; cat /workspace/shared/agent-draw-worktrees/poses/README.md
cat /workspace/shared/agent-draw-worktrees/poses/docs/project-format.md; printf '\n--- SEQUENCE ---\n'; cat /workspace/shared/agent-draw-worktrees/poses/docs/sequence-format.md
mkdir -p /tmp/pose-craft-without
export AGENT_DRAW_HOME=/tmp/pose-craft-without/managed
node /workspace/shared/agent-draw-worktrees/poses/scripts/setup.js --check --json
node /workspace/shared/agent-draw-worktrees/poses/scripts/setup.js --json
node /workspace/shared/agent-draw-worktrees/poses/scripts/run-managed.js doctor --smoke
python /tmp/pose-craft-without/author.py
export AGENT_DRAW_HOME=/tmp/pose-craft-without/managed
node /workspace/shared/agent-draw-worktrees/poses/scripts/run-managed.js validate /tmp/pose-craft-without/poses/00-reach.json
node /workspace/shared/agent-draw-worktrees/poses/scripts/run-managed.js validate /tmp/pose-craft-without/poses/01-gather.json
node /workspace/shared/agent-draw-worktrees/poses/scripts/run-managed.js validate /tmp/pose-craft-without/poses/02-hold.json
node /workspace/shared/agent-draw-worktrees/poses/scripts/run-managed.js validate /tmp/pose-craft-without/scene.json
node /workspace/shared/agent-draw-worktrees/poses/scripts/run-managed.js sequence /tmp/pose-craft-without/sequence.json --out /tmp/pose-craft-without/sequence-output
node /workspace/shared/agent-draw-worktrees/poses/scripts/run-managed.js build /tmp/pose-craft-without/scene.json --out /tmp/pose-craft-without/scene-output
python /tmp/pose-craft-without/check_evidence.py
find /tmp/pose-craft-without/poses /tmp/pose-craft-without/sequence-output /tmp/pose-craft-without/scene-output -type f -printf '%P\t%s bytes\n' | sort
python /tmp/pose-craft-without/write_report.py
```

The new isolated home had no managed runtime on its first check. Exact error output:

```json
{"ok":false,"error":"Managed runtime missing. Run node scripts/setup.js first."}
```

The local setup then succeeded without downloads, reporting version 0.4.0, Node 24.19.0, and Inkscape 1.4 (e7c3feb100, 2024-10-09). Runtime root: `/tmp/pose-craft-without/managed/releases/0.4.0-89705d6b5ffc8387`. `doctor --smoke` reported `ok: true` and actual 16 × 16 SVG/PNG/PDF exports. Each of the three pose validations reported `ok: true`, `layers: 40`; the scene reported `ok: true`, `layers: 36` (top-level nodes; the character is a group).

`sequence` and `build` both reported `ok: true`, and their actual output files were opened for the review above. No validation or rendering failure occurred after setup. The smoke command and renders emitted the following Inkscape warnings. These were not ignored as evidence of a failed build: the command receipts report success, and the PNG artifacts were opened.

Exact smoke warning strings, transcribed from the tool result:

```text
** (inkscape:50): WARNING **: 16:49:27.264: Failed to wrap object of type 'PangoFT2FontMap'. Hint: this error is commonly caused by failing to call a library init() function.

** (inkscape:50): WARNING **: 16:49:27.713: Failed to wrap object of type 'GtkRecentManager'. Hint: this error is commonly caused by failing to call a library init() function.
** (inkscape:57): WARNING **: 16:49:27.795: Failed to wrap object of type 'PangoFT2FontMap'. Hint: this error is commonly caused by failing to call a library init() function.

** (inkscape:57): WARNING **: 16:49:27.889: Failed to wrap object of type 'GtkRecentManager'. Hint: this error is commonly caused by failing to call a library init() function.
```

Exact sequence/build warnings, copied from their actual receipt files:

### Sequence

```json
[
  {
    "file": "frames/frame-0000.svg",
    "message": "** (inkscape:90): WARNING **: 16:51:03.806: Failed to wrap object of type 'PangoFT2FontMap'. Hint: this error is commonly caused by failing to call a library init() function.\n\n** (inkscape:90): WARNING **: 16:51:04.233: Failed to wrap object of type 'GtkRecentManager'. Hint: this error is commonly caused by failing to call a library init() function."
  },
  {
    "file": "frames/frame-0001.svg",
    "message": "** (inkscape:97): WARNING **: 16:51:04.321: Failed to wrap object of type 'PangoFT2FontMap'. Hint: this error is commonly caused by failing to call a library init() function.\n\n** (inkscape:97): WARNING **: 16:51:04.406: Failed to wrap object of type 'GtkRecentManager'. Hint: this error is commonly caused by failing to call a library init() function."
  },
  {
    "file": "frames/frame-0002.svg",
    "message": "** (inkscape:104): WARNING **: 16:51:04.492: Failed to wrap object of type 'PangoFT2FontMap'. Hint: this error is commonly caused by failing to call a library init() function.\n\n** (inkscape:104): WARNING **: 16:51:04.582: Failed to wrap object of type 'GtkRecentManager'. Hint: this error is commonly caused by failing to call a library init() function."
  },
  {
    "file": "contact-sheet.svg",
    "message": "** (inkscape:111): WARNING **: 16:51:04.664: Failed to wrap object of type 'PangoFT2FontMap'. Hint: this error is commonly caused by failing to call a library init() function.\n\n** (inkscape:111): WARNING **: 16:51:04.755: Failed to wrap object of type 'GtkRecentManager'. Hint: this error is commonly caused by failing to call a library init() function."
  }
]
```

### Scene

```json
[
  {
    "format": "png",
    "message": "** (inkscape:136): WARNING **: 16:51:05.174: Failed to wrap object of type 'PangoFT2FontMap'. Hint: this error is commonly caused by failing to call a library init() function.\n\n** (inkscape:136): WARNING **: 16:51:05.746: Failed to wrap object of type 'GtkRecentManager'. Hint: this error is commonly caused by failing to call a library init() function."
  },
  {
    "format": "pdf",
    "message": "** (inkscape:143): WARNING **: 16:51:05.860: Failed to wrap object of type 'PangoFT2FontMap'. Hint: this error is commonly caused by failing to call a library init() function.\n\n** (inkscape:143): WARNING **: 16:51:05.950: Failed to wrap object of type 'GtkRecentManager'. Hint: this error is commonly caused by failing to call a library init() function."
  }
]
```

## Evidence summary

```json
{
  "pose_dimensions": [
    [
      128,
      160
    ],
    [
      128,
      160
    ],
    [
      128,
      160
    ]
  ],
  "no_animation_or_group_transforms": true,
  "left_sleeve_distinct_contours": 3,
  "right_sleeve_distinct_contours": 3,
  "left_hand_distinct_contours": 3,
  "right_hand_distinct_contours": 3,
  "left_boot_exactly_equal": true,
  "right_boot_exactly_equal": true,
  "sole_baseline_px": 147,
  "scene": {
    "canvas_px": [
      384,
      256
    ],
    "door_px": 106,
    "approx_character_px": 85.8,
    "door_to_person_ratio": 1.235,
    "ground_y": 220,
    "foot_transform_y": 220.0,
    "person_if_door_2_10m": 1.7
  },
  "png_frame_dimensions": [
    [
      128,
      160
    ],
    [
      128,
      160
    ],
    [
      128,
      160
    ]
  ],
  "foot_region_box": [
    28,
    130,
    99,
    154
  ],
  "foot_region_byte_identical": true,
  "contact_sheet_px": [
    432,
    208
  ],
  "scene_png_px": [
    384,
    256
  ]
}
```

## Actual artifact inventory

- `poses/00-reach.json`: 9580 bytes; SHA-256 `b461c2ef803eab48872a3cb526e9045340dedfd6bb82c54f6956c10476db1067`
- `poses/01-gather.json`: 9566 bytes; SHA-256 `00e015b1aa24ff22a1b7397fdf3138489c7a7f5cd4e831328a1138640a666418`
- `poses/02-hold.json`: 9585 bytes; SHA-256 `5ac42f41904473a1e0d76e8c08eff621d686a6b0e41bb83bc794315d0a629435`
- `sequence-output/contact-sheet.png`: 20935 bytes; SHA-256 `7291a3fdb0697a5abbb42dd381034203e2a3a927774a0ee80c783c3658959bbd`
- `sequence-output/contact-sheet.svg`: 32151 bytes; SHA-256 `cee0d72ff1857893ef72be57e42c357e8b6f71c09ad1b36c8d626b04a7c44694`
- `sequence-output/frames/frame-0000.png`: 10942 bytes; SHA-256 `52a2f7105ab30085901d674693d2f83c9c9703b93b7820d7658065f5425d3268`
- `sequence-output/frames/frame-0000.svg`: 10372 bytes; SHA-256 `12febf5df279af0240251197a0c05a0c294db33cb613de37ecee7f46ebe17dd3`
- `sequence-output/frames/frame-0001.png`: 11075 bytes; SHA-256 `fd6c0da58963110d4cde05cfc028d24ebb5b19be70f167a79cea5247dcadfba0`
- `sequence-output/frames/frame-0001.svg`: 10358 bytes; SHA-256 `3f0e71e5c51983462457a55333fbfd4bf1b48bd34a772dcc6d35ec2fe9d7b588`
- `sequence-output/frames/frame-0002.png`: 10641 bytes; SHA-256 `92f8418e7213434c4dff263aba2fbf3ca823069f20685e94f1b5f6ab2546eb76`
- `sequence-output/frames/frame-0002.svg`: 10377 bytes; SHA-256 `bf80b6fedd9b5d961de78a0b09949a659e679f990764f90e20d7465037ecbb7e`
- `sequence-output/manifest.json`: 205 bytes; SHA-256 `c7e284a306a8e33bac26fb6208ec566e8e54912472358fea1d3cf086f6916717`
- `sequence-output/projects/frame-0000.json`: 9580 bytes; SHA-256 `b461c2ef803eab48872a3cb526e9045340dedfd6bb82c54f6956c10476db1067`
- `sequence-output/projects/frame-0001.json`: 9566 bytes; SHA-256 `00e015b1aa24ff22a1b7397fdf3138489c7a7f5cd4e831328a1138640a666418`
- `sequence-output/projects/frame-0002.json`: 9585 bytes; SHA-256 `5ac42f41904473a1e0d76e8c08eff621d686a6b0e41bb83bc794315d0a629435`
- `sequence-output/receipt.json`: 5537 bytes; SHA-256 `32178f6deb4c1cc822a03384c15ae3b01f7a24b642669daad6203522581b5fa2`
- `sequence-output/source-manifest.json`: 189 bytes; SHA-256 `ef6257cbd6c9168fbb9a977717e75ddcb7230638531cac7ec6f21cc778ccaf2a`
- `scene-output/drawing.pdf`: 4709 bytes; SHA-256 `6e5c8460be3faf841c306dbc6e61802075459f719ef300ca64a558bc77a09959`
- `scene-output/drawing.png`: 13580 bytes; SHA-256 `f69e96eecf2be365c11fac78c9dc70e619463ef5be825de1099d2ca96dbbdc40`
- `scene-output/drawing.svg`: 18560 bytes; SHA-256 `d8c1c4e888e5e80c153a41d0ba56567375f48c56e8d9d950df2be303d552f727`
- `scene-output/receipt.json`: 2413 bytes; SHA-256 `2ff2da618efea31d45d938eb3d02494a222edaaf6b7ec1f21cf007ac967af34d`

No self-score is assigned. Runtime regression tests were outside this evaluation and are being handled separately.
