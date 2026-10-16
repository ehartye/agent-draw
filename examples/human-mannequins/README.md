# Human figure starters

Two editable Agent Draw builds, eight facings, eight static poses per facing, and eight-frame walk/run cycles: **128 pose templates + 32 loops, 384 complete drawings**. JSON, native Inkscape SVG and transparent PNG accompany every drawing.

- **Human:** longer limbs and a smaller head.
- **Compact RPG:** larger head, broader torso and shorter, thicker limbs. Its proportions differ nonuniformly from Human.
- **Facings:** S toward the viewer, N away, E right, W left; SE/SW front diagonals and NE/NW rear diagonals.
- **Static poses:** neutral, walk contact, walk passing, run push, run flight, jump, crouch and reach.
- **Movement:** walk at 8 fps and run at 12 fps, each with eight distinct whole-frame drawings. The halves alternate anatomical sides; arms oppose the legs. Walk retains support; run includes flight. No duplicate first frame is appended.

These are deliberately stylized blank bodies for designing people and costumes. Finished faces, clothing, equipment and secondary motion need an additional art pass.

## Use a drawing or loop

Open `index.html` through an HTTP/HTTPS server. Filter by build, pose/movement and facing. Select a drawing to inspect it; movement cards open a player with play/pause, normal/quarter speed, a frame scrubber and forward/backward stepping. Playback starts paused. The guide toggle exposes the actual hidden vector construction layer. Downloads in the player correspond to its current frame. The complete ZIP includes every frame and `clips.json` timing/path metadata.

Copy the chosen `projects/*.json` into your own working folder, give it a new name, and add a costume around the gesture. Keep the shoulders within the shoulder girdle, thighs inside the pelvis, and cuffs aligned to their limbs. Guides explain the construction; moving a guide alone does not reshape its contour.

```powershell
Copy-Item '<plugin-root>/examples/human-mannequins/projects/rpg-neutral-S.json' './my-hero.json'
node '<plugin-root>/scripts/run-managed.js' validate './my-hero.json'
node '<plugin-root>/scripts/run-managed.js' build './my-hero.json' --out './hero-preview'
```

Replace `<plugin-root>` with your actual repository/plugin path. Rebuilds require Agent Draw setup and Inkscape. The static gallery needs no server-side application. JSON remains authoritative; manual SVG edits do not flow back to JSON.

## Construction and coordinates

Every canvas is 640 × 640, with ground origin `(320,560)`. The original 32 left/right profile files retain their accepted source geometry and flat ground y560. New turned poses use spatial landmarks `[lateral, height, forward]`, with ground height zero. A shallow view from above projects forward ground distance onto screen y, so planted feet at different depths correctly have different screen baselines. `clips.json` records the projection, and `landmarks.json` retains world and projected landmarks for new drawings. Bone lengths stay constant in world space; their screen projection shortens under foreshortening.

The same canvas and scale compare the two builds honestly. Proportions are chosen cartoon designs, not universal human measurements. Named head, torso, left/right arms and legs are ordinary editable groups. The torso contains neck, rib cage, abdomen and pelvis. Limb contours connect joints continuously; feet keep an explicit cuff, heel and forward toe. Depth order places limbs around the body according to view and pose. Rear heads omit front facial marks and rear torsos carry back-plane cues. Historical group keys remain reference-left (screen-left in S) and reference-right (screen-right in S). Reference-left is the person's anatomical right in the front view. Original profiles retain near/far names; E near is anatomical right, W near anatomical left.

The accepted guide palette is anatomical left blue #2879C7, right red #CC4B4B, head gold #B88016, torso teal #19877B and pelvis purple #8A57AE. These are Agent Draw conventions, not an industry standard. Colors remain attached to the character through turns and are independent of finished limb paint. The gallery legend labels all five. The new [overhead set](overhead/) also adds left-circle/right-diamond joint shapes.

`construction-guides` is hidden by default. Set `visible:true` in JSON or reveal that layer in Inkscape. There is no runtime skeleton, automatic costume fitting or native anatomy solver. Bare templates have no font dependency; live labels on the comparison board use Segoe UI.

Muted versus warm limb paint helps follow the two construction sides through a stride. It is a far-side cue in profile, not simulated lighting or a dynamic depth map: a muted limb can swing forward in a front/back view. Judge its depth from overlap and the turned form.

## Rebuild the library

In a full repository checkout, model constants and accepted profile construction live in `generate.mjs`. Spatial posing/projection and whole-frame contour authoring live in `directional.mjs`; `generate-eight.mjs` assembles the catalogue and bounded sequence manifests.

```powershell
node examples/human-mannequins/generate-eight.mjs
node --test examples/human-mannequins/mannequins.test.mjs examples/human-mannequins/directional.test.mjs
node '<plugin-root>/scripts/run-managed.js' sequence examples/human-mannequins/key-eight.json --out output/new-eight-keys --timeout 600
```

Inspect standing and action keys before exporting the four `sequence-eight-*.json` manifests. Run native batches sequentially on this Windows setup: overlapping version probes have timed out during another export. `retain-eight.py` consumes their four successful output directories, checks native/source bindings, retains exports, builds readable review sheets and packages the ZIP. The original `sequence.json` is only the legacy profile catalogue.

The delivered revision also retains its host-crash recovery: 89 completed native PNGs were recovered with exact captured JSON and regenerated-SVG bindings, full PNG decoding and separate recovered provenance. Their original process exit/native batch receipt was lost. `recover-eight.mjs` records that limitation explicitly; a native remainder sequence rendered the seven missing frames. `native-receipts/` and `native-bindings-eight.json` preserve the distinction between successful native batches and recovered partial output.

Revision r4 changes hidden guides only. `guide-palette-bindings.json` records original/new JSON and SVG hashes and exact equality of the visible SVG serialization for all 384 drawings. Existing native PNGs and native receipts are retained with their original provenance; the hidden-guide amendment is not relabeled a fresh Inkscape export. `apply-palette.mjs` is an explicitly one-time amendment and refuses already-amended inputs. `generate-eight.mjs` now reproduces the amended source directly; a full native rebuild can use it normally.

The ZIP includes all 384 JSON/SVG/PNG drawings, pose/clip metadata, coordinates, usage instructions, guide-amendment bindings and the original comparison source/SVG/PNG/PDF. Generator scripts remain in the full checkout because they use the repository validator. Static sheets establish drawing coverage; live playback and last-to-first inspection establish their separate motion evidence. This library supplies bare movement references, not a dressed game character or collision/controller setup.
