# Reusable parts and bounded animation

## Plan the moving assembly

Choose the intended pose, smallest viewing size, duration, and whether playback loops. Keep the subject readable before adding movement. Group shapes that should move together: an arm plus its highlight and hand, not unrelated objects that merely share a color. Preserve stable group IDs and globally unique names so future edits target the same parts.

Use a shallow hierarchy: a body parent carries the head/arm children; a child arm rotates about its shoulder in body-local coordinates. Put the pivot at the joint before animating. Parent motion composes with child motion, so do not add the parent's translation into a child's track as well. Leave deliberate overlap at joints and verify that no gap appears at extremes. Layer order is still bottom to top within each parent; a child cannot paint between siblings of another parent.

## Concrete part and track

This group is a fragment for the project's `layers` array:

```json
{"type":"group","id":"arm","name":"arm-part","transform":{"pivotX":64,"pivotY":80,"rotation":15},"children":[{"type":"rectangle","name":"arm-shape","x":60,"y":80,"width":16,"height":64,"color":"#187DAB"}]}
```

A complete, directly valid project connects that part to its track:

```json
{"version":1,"name":"arm-wave","width":192,"height":192,"layers":[{"type":"group","id":"arm","name":"arm-part","transform":{"pivotX":64,"pivotY":80,"rotation":15},"children":[{"type":"rectangle","name":"arm-shape","x":60,"y":80,"width":16,"height":64,"color":"#187DAB"}]}],"animation":{"fps":12,"frames":24,"loop":true,"tracks":[{"target":"arm","property":"rotation","easing":"smooth","keyframes":[{"frame":0,"value":15},{"frame":12,"value":-20},{"frame":24,"value":15}]}]}}
```

Tracks target group IDs and assign **absolute values**, not offsets from the base transform. A base x of 100 and a track value of 10 produces x=10, not 110. Untracked properties retain their base values. The static `build` renders the base pose; `animate`'s master is sample 0, which may differ when tracks override it.

## Timing and paint mechanics

Start with one readable action; add secondary motion only if it strengthens it. `smooth` eases each segment with smoothstep; `linear` has constant property speed per segment; `step` holds until the next key. Rotation follows the stated numeric angles, not an automatic shortest arc. A 0→360 linear track makes a full turn.

For a looping N-frame project, all tracks start at 0 and end at virtual frame N with matching values (rotation may differ by multiples of 360). Exported frames are 0…N−1. Never add a duplicate endpoint to the encoded sequence. Endpoint equality cannot prevent a speed discontinuity or a visible pause: review last-to-first playback. Nonloops end their tracks at N−1.

Groups accept transforms/opacity/visibility, not shared fill or stroke. Paint belongs to leaves. Gradient coordinates use local user-space units; editing a leaf's path/position alone leaves its paint field in place, whereas moving a group carries its geometry and gradients together. Group scale also scales stroke widths. For articulated cel-shaded art, keep a part's contained shadow/highlight in that part; a global light direction may require manually adjusting those contours rather than rotating every highlight indiscriminately.

## Review before export approval

Validate and inspect the source, then use `draw-export`'s animation workflow. Check the start, extrema, intermediate poses, and final sampled frame for pivot placement, joint gaps, unwanted sibling occlusion, inherited parent movement, gradient attachment, and canvas clipping. Review at the delivery size. If motion is too small to read, simplify the movement or increase its amplitude within the safe crop.

A contact sheet only shows selected poses. Review encoded playback for pacing and last-to-first continuity, and explicitly report when playback has not been inspected. Keep source JSON and editable SVG/PNG frames even if the final delivery uses a compressed format. There is no arbitrary SVG import, path tweening, rig constraint solver, or physics engine; exact bounds are in the project-format reference directly linked from `draw-authoring`.
