# Drawn-pose craft and sequence verification

2026-10-14. Linux, Node.js 24.19.0, Inkscape 1.4. This phase responds to the observed rigid-limb and uniform-sepia art failure; it does not treat successful export or a test total as an art verdict.

## Changed capability

The `sequence` command accepts an ordered manifest of complete static project JSONs. Every drawing is independently validated and actually rendered. It preserves exact project/manifest bytes, editable SVG and PNG frames, all-frame contact sheets and hashed receipts. Same-canvas enforcement and strict resource/path/output guards do not infer anatomy, foot contact or good looping. Loop seam quality is explicitly unproven.

## Craft changes

Authoring now directly routes to drawn-pose and material/color/scale references. They describe gesture and mass, supporting feet, bent-joint contour construction, contact/down/passing/up, anticipation/recoil/recovery, hand-to-weapon interaction, asymmetric undead motion, material-specific marks, line hierarchy, value/color families and person/door/building scale. Scene-specific numeric targets are labeled as examples rather than universal anatomy rules. Rigid group animation remains available for genuinely rigid movement, not as a substitute for requested redraws.

## Rendered evidence and actual art review

The four-frame drawn-fire example uses 60–61 editable leaves per pose, no animation blocks or transform keys, and genuinely different geometry. Independent art review rejected its first support-hand placement. The artist corrected the forearm/hand contour and recoil; the packaged example was refreshed from corrected source. Review accepted it as a restrained shot: readable bent support elbow, hand meeting pistol, near-horizontal barrel and visible recoil/return. The mostly planted lower body is intentional; this is not evidence of broad locomotion quality.

The executable scale/material study places a roughly 70-pixel visible character and 80-pixel door on a shared baseline. It separates blue/slate clothing from warm masonry, includes sparse wood/stone marks and coherent cast shadows. PNG and independently rasterized PDF were inspected. It is a calibration illustration, not a substitute for the isometric game's actual scene QA.

## Actual game pipeline

Independently read 39 game sequence receipts: 180 frames, all successful managed Agent Draw 0.4.0 sequence exports. Recomputed every recorded artifact SHA256 and inspected each retained project: all matched; no animation blocks or transform keys were present. This proves drawn-project provenance and output integrity. The game/art reviewers own scene composition, anatomy, final crop, timing, transitions and gameplay acceptance.

## Software checks

232 tests passed, zero failures/skips, including 16 real-render sequence tests and three craft-example/schema checks plus all prior coverage. Sequence tests cover fixed-endpoint elbow redrawing, canvas/foot-coordinate fixtures, exact sources/rebuilds, all-pose contact sheets, isolated renderer, limits, path/symlink/input protections, deadlines, mutation checks and transactional overwrite. All three skills pass the installed skill-creator structural validator. CI configuration includes the pose sequence and scale/material study, but remote CI/publication for this phase has not run.

## Boundaries

No anatomy generator, path morphing, in-between inference, automatic eight-view artwork, game state machine, arbitrary SVG/script import or raster texture injection. Texture remains intentionally authored vector marks. True transparent PNG/SVG outputs remain editable/reproducible. Linux alone is verified; live playback is distinct from static/contact-sheet review.
