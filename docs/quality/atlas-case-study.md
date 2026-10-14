# Dust & Decay: bounded atlas improvement

2026-10-14. The playable game prototype exposed repeated loading of 16 PNGs and hardcoded foot-origin values. It supplied an exact export contract: two eight-frame idle clips, each 128×160 RGBA, foot (64,150), normalized pivot (0.5,0.9375), 6 fps. The art already existed; this phase did not author walk cycles or eight-direction views.

## Implemented

A separate strict atlas manifest, transparent fixed-grid packing, Phaser JSON hash frame metadata, semantic character/action/optional-direction clip names, exact normalized pivot, copied inputs, rebuildable manifest, original-manifest preservation, source/output hashes, safe staged publication and deadline/resource limits. Existing FFmpeg performs bitmap packing; vector authoring remains unchanged. No browser, new npm package or automatic installation is required.

## Actual case verification

- Read-only copies of all 16 game frames were packed into a 1042×326 sheet: eight columns, two rows, two-pixel outer/intercell padding.
- Independent Pillow decoding compared every cropped RGBA pixel against its original frame. All 16 were identical, including transparency. Exact pivot values and transparent outer margin verified.
- The installed game's Phaser 3.90.0 `textures/parsers/JSONHash.js` accepted the generated atlas and set custom pivots on all 16 frames. A stub texture was used to observe parser results; this is format compatibility evidence, not browser/game integration testing.
- Visually inspected the sheet at native frame scale. Silhouettes remain legible; the supplied idle poses are deliberately subtle. No trimming/rotation or scaling was introduced.
- The game source, runtime and deployment were not modified by the atlas work.

## Software verification

Full suite: 213 tests passed, zero failures/skips, including 17 atlas tests and the prior static/craft/animation tests. Coverage includes real alpha/pixel packing, gutters, exact anchors, retained source rebuilds, input hash preservation, strict schema, PNG chunk/CRC/decoded-size/APNG guards, byte/pixel limits, symlinks, source/output changes during encoding, missing/broken encoder, whole-run deadline, cleanup and safe overwrite inventory. Atlas guide JSON validates against the implementation.

## Limits and remaining case-study friction

Only static non-interlaced 8-bit RGBA PNG inputs are accepted. Transparent gutters are not edge extrusion; texture filtering and game-scale bleed need engine review. No dedicated checkerboard preview command, collision metadata, generated directional art, walk/shoot/hurt/death cycles, gameplay or controller behavior is added. The export records direction labels only when the caller supplies real authored views. Original editable vector sources remain separate from the copied PNG frame handoff.

Remote publication/CI for this phase is pending separate approval.

## Later mandatory Agent Draw comic-art pipeline

The user then required every game character to be produced through Agent Draw. The game art author converted the new warm comic geometry into declarative JSON with explicit leaf paint, stable groups, compensated pivot transforms and per-state tracks. All 36 character/view/action projects successfully rendered through the managed 0.3.1 animation runtime without increasing schema limits or adding a raw-SVG bypass.

Independent plugin-side verification read all 36 receipts and recomputed every recorded artifact SHA256: all matched. The batch contains 192 frames, 12 closed-loop clips and 24 non-looping clips. This verifies runtime provenance, completion and artifact integrity; the game/art review owns visual quality, packing, gameplay transitions and live playback. The earlier 16-frame atlas bundle remains a preserved historical packing fixture, not the upgraded game artwork.
