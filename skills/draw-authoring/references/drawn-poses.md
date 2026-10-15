# Draw the pose, then draw the motion

Use independently drawn frames when an action changes anatomy, perspective, silhouette, clothing folds or contact. A rigid arm rotated at its shoulder still has a straight elbow. It cannot become a convincing braced shot merely by adding more keys. Keep transform animation for parts that genuinely stay rigid or for a small secondary effect; do not substitute it for requested redrawing.

## Start from action and weight

State the action as a physical verb and a clear intention: brace and aim, reach across the chest, recoil, drag a leg. Draw a gesture line through head, ribcage and pelvis before adding costume. Choose a dominant curve or counter-curve, rather than a vertical stack of symmetrical body parts. Tilt shoulders and pelvis in relation to the action; keep the head and gaze involved.

Place the supporting foot or feet before the torso. Project the torso/pelvis mass over the support area unless the next frame deliberately catches a fall. The front of the boot, heel and sole should describe the same ground plane. During a planted phase, preserve the contact point; pelvis bob should not drag the whole foot through the floor. On an isometric camera, world travel and screen height are different from a sprite's canvas coordinates. Agree on a fixed foot origin with the engine before drawing.

Use head/ribcage/pelvis/hand/boot masses to judge proportions in silhouette. Keep a meaningful gap between forearm and torso when the action needs it. Foreshortening shortens the visible segment; it does not shrink every body part uniformly. Draw a nearer hand or boot with enough area to explain its overlap.

## Construct bent joints as contours

For an arm, establish shoulder S, elbow E and wrist W, then draw the outside sleeve as one tapered contour around S–E–W. A bent arm has two differently directed segments and a readable elbow corner. Inside the bend, compress the fabric and add one short crease; outside, use a longer stretched edge. Keep cuff and hand attached, overlap the forearm where perspective demands it, and avoid an exposed circular hinge. Elbow motion changes E and often W in the next drawing; it is not just a rotation of the same straight silhouette.

For a leg, establish hip H, knee K and ankle A. Taper thigh to knee and calf to ankle. Draw the compressed inside knee crease and the stretched outside edge. Let split coat tails reveal enough of the swing knee to read. The planted boot can stay fixed while knee and hip redraw above it. Avoid identical straight legs swinging like pendulums.

A useful test: hide all internal lines. Can the viewer still tell bent from straight, support from swing, and reach from idle? If not, change the contour or overlap before adding texture.

## Design key drawings, then spacing

Make a small sheet of distinct key poses before rendering a long sequence. For a walk, use contact → down → passing → up on one half-stride, then the opposing half. Show weight acceptance, a bent swing knee and foot clearance; do not merely shift the same standing drawing. Body motion should follow support changes, with shoulders and hips countering rather than moving as a rigid block.

For a shot: aim/brace → compression or anticipation → recoil → recovery. The support hand meets the weapon; the elbow bends visibly; the barrel follows the aim. Recoil should affect wrist/forearm, shoulder and torso coherently, while the feet keep balance. For reload, draw the hands meeting the weapon near the chest; do not leave the weapon hanging by an unchanged idle arm. Follow-through in coat/scarf can lag the main movement, then settle.

For an injured or undead character, change the gesture itself: forward neck, unequal shoulders, asymmetric support and a delayed dragged foot. Reusing the cowboy walk with another palette will not create a lurch. A fall needs a new silhouette and ground-contact drawing, not only rotation of an upright figure.

Use frame spacing to describe acceleration: close drawings near a hold, larger changes through the fast action, then smaller recovery steps. The sequence exporter plays drawings at a fixed fps without interpolation. Repeat a frame reference deliberately for a hold; do not add a duplicate loop endpoint automatically. Review the last-to-first transition as an action, not just a file comparison.

## Quantify the current game, not universal anatomy

For the Dust & Decay review at roughly 64–65 screen pixels of body height, useful starting targets were: pose silhouette changes around three screen pixels, a hand/weapon gap around two, and a planted foot within one or two pixels during its support interval. A visible support elbow bend around 60–100 degrees and a bent swing knee around 60–110 degrees helped break the rigid-limb look. These are scene-specific art-review targets, not a validator or universal drawing rule. Convert them back to source pixels using the actual engine scale before editing.

## Agent Draw authoring contract

Each frame is a complete ordinary project with its own path/primitive coordinates and no `animation` block. Reuse names, palette roles and a fixed canvas to compare drawings, but change geometry wherever the pose requires it. Keep editable named parts for future revisions. No SVG import, path-morph engine, automatic anatomy or inferred in-betweens are promised.

The repository example `examples/drawn-fire/manifest.json` contains four complete, independently drawn brace/fire/recoil/recovery projects, rather than a hypothetical code fragment.

Put the frames beneath a sequence manifest and use `sequence` through the managed launcher. See the export skill's directly linked drawn-sequence reference for the command and exact retained outputs. Validate every frame; inspect contact sheets at both source size and the actual game size. Accept the sequence only after checking gesture, silhouette, joint continuity, balance, foot contact, clipping and action timing. Test the new art inside a representative scene, not only on a blank artboard.
