# Human action construction and attachments

Use this for human and stylized humanoid action drawings, especially collapsing limbs, backwards knees, misplaced shoulders, rotated boots and drifting clothing roots. Construct the whole figure before drawing its costume. The guides below describe an authoring method; they do not add an anatomy solver or runtime rig to Agent Draw.

## Establish a model, then a few complete drawings

For an editable starting figure, use the [human mannequin library](../../../examples/human-mannequins/README.md): a longer-limbed human and a broad compact RPG build, each with eight poses and eight-frame walk/run cycles in all eight facings. Copy a project to a durable working directory, expose its named construction-guide layer when needed, then design the costume around connected body masses. These are chosen stylized proportions and bare movement references. Turned views retain measured spatial limbs while allowing projected foreshortening; rear views use back planes and omit front facial marks. Validate and inspect actual exports after changing their model, then review alternating support, limb overlap and the final-to-first transition in playback.

Choose the camera and the character's proportions explicitly. Draw neutral beside a few action keys: weight reception, folded recovery, forward knee lift and flight. Compare head, ribcage, pelvis, hands and boots before adding small details. A large head, compact cloak and small limbs can be a deliberate design; do not impose a realistic head-count on a cartoon.

Set physical upper/lower limb lengths, thickness and attachment locations for the paired limbs. Keep those dimensions coherent through the action. Screen-space lengths may shorten with a constructed turn or foreshortening; an otherwise planar profile cannot explain a thigh almost disappearing as perspective. Compare alignments, negative spaces and masses as well as measurements.

Use a gesture through the head, ribcage and pelvis to explain the action. Place the supporting foot, then establish weight and the next recovery. Keep the construction simple enough to redraw repeatedly. For requested frame-by-frame animation, make every frame a complete drawing with changed contours and overlaps; do not substitute rotations of rigid limb pieces for bent anatomy.

## Anatomical guide identity and overhead cameras

Use an explicit guide legend. This library's convention is anatomical left blue, right red, head gold, torso teal and pelvis purple; these are project choices, not universal animation colors. Left and right belong to the character through every turn. Lighting, distance and near/far overlap are separate cues. Add labels or marker shapes so identity does not depend on color alone. The overhead example uses circular left joints and diamond right joints. Map historical screen-side or near/far keys before recoloring; mirroring screen geometry alone does not preserve anatomical names.

For a true orthographic overhead view, project lateral/forward position onto the picture plane and use height for occlusion. Do not keep a front-view face or force the full lengths of vertically hanging limbs into view. Show the head crown, shoulder width, forward nose projection and the body masses visible around them. The lean exposes a continuous lower back between rib cage and pelvis; a detached flat pelvic bar reads as an accessory. Review complete standing, crouched, passing and flight keys before filling all facings. A rotation of the entire overhead viewing direction is geometrically coherent; bent-limb contours and overlaps still change for each action drawing.

The [overhead mannequin set](../../../examples/human-mannequins/overhead/README.md) documents its camera, guide mapping and native-page crop provenance. Exact integer crops can batch export startup cost without resizing artwork; they must retain complete page sources, native receipts, crop coordinates and source/export hashes. Such a crop is not a separate native process receipt or evidence of motion quality.

## Connect the figure before cleaning the contour

Locate the shoulder girdle over the ribcage and the upper-arm socket beneath the acromion. The garment collar is not the shoulder joint. Wrap the shoulder/sleeve mass into the upper arm; a capped tube placed under the scarf can remain visually detached even when its guide has the right coordinates. Exact profile can project both shoulder guides to one point, but the visible attachment and overlaps must still make sense.

Locate the hip articulation inside the chosen pelvis/seat mass. Keep the thigh root proportionate to that mass. Establish hip–knee–ankle and shoulder–elbow–wrist chains before drawing around them. Judge knee direction with the thigh, patella/front of knee, heel and toe; it is not universally a screen-left or screen-right test. Reflection changes screen-space polarity, and turned or collapsed poses need their own construction.

Draw continuous tapered contours with readable thigh, calf, upper-arm and forearm masses. Measure thickness across each segment's direction. Fixed horizontal offsets can collapse or swell a rotated limb. Compress the inside joint and extend the outside edge; avoid a visible circular hinge or a uniform strip with an arbitrary sharp corner.

A front/back projection can fold a calf or forearm over its upper segment. Do not outline a self-intersecting envelope: crossed interior ink can look like a broken joint. Construct the visible combined volume and its occlusion instead. The mannequin example uses consistently wound overlapping mass paths, then removes internal stroke crossings with the same union fill; this is an offline drawing technique, not a native anatomy feature.

In side view, establish the far arm behind the torso and the near arm in front. Alternate the two legs and opposite arms through both half-strides. Show the knee advancing and the rear heel recovering on each anatomical side. Layer order and a half-cycle offset are necessary construction choices, but cannot certify readable motion. Hide internal detail and remove color cues: if the limbs merge into an ambiguous knot, change the gesture, gap or overlap.

Do not repair an entire action set by clamping every endpoint to a fixed reach. It can preserve lengths while destroying the lunge, contact or collapse. Redraw the complete pose around its intended force and support.

## Boots: separate the cuff from the sole

The calf enters the cuff; the foot articulates at the ankle. A boot copied at a fixed world angle can be nearly upside down on a folded recovery leg. Rotating the whole boot with the shin also fails during planted support, when the sole must remain on the ground as the calf leans.

For a right-facing planar drawing with downward-positive canvas y, let K be knee and A ankle:

```text
u = normalize(K - A)       direction from ankle toward knee
t = (-u.y, u.x)            transverse/front direction in this selected view
cuffCenter = A + u * cuffHeight
cuffEdges = cuffCenter ± t * cuffHalfWidth
```

These are construction coordinates, not required schema fields. Author the cuff around that calf frame. For an airborne foot, orient the sole/toe from the same frame with deliberately chosen ankle flexion. During support, draw the foot around its heel/ball/toe contact on the ground plane while the cuff follows the calf. Join those landmarks as one coherent boot contour. Mirror the complete construction for the opposite view or define its front direction explicitly; do not reuse the right-facing transverse convention blindly.

Inspect toe, heel, sole and shaft together. A recovery heel may rise above its toe and expose an upturned sole; that alone does not mean the boot is inverted. The cuff must still face and receive the calf. Check flat support, toe-off and swing separately, including the intermediate drawings between attractive key poses.

Review rear-facing feet independently of their front/profile versions. Preserve both heel corners and explain the heel wall and upper forefoot plane. An incomplete projected sole can produce a pointed near corner that reads as a toe facing the wrong direction even when the underlying forward vector is correct. Verify the actual drawn heel-to-forefoot relationship in N/NE/NW and both half-strides; a coordinate assertion cannot settle that visual reading.

Register the finished ink to the floor, not only a polygon's nominal sole vertices. An outside stroke can extend below the baseline. In an already ink-filled boot, dropping a redundant same-color outline can preserve the intended ground edge. Retain intentional outlines with their visible extent included in contact measurements. Recheck airborne clearance after correcting orientation: a formerly wrong boot angle may have hidden a ground intersection.

## Cape, scarf and neckpiece: share the attachment

Construct the visible neck between head and shoulder masses. Give the neckpiece a cross-section around that selected neck frame instead of placing a horizontal strip at a chest offset. For this fitted band, its transverse direction follows the neck's orientation; a deliberately loose garment may drape differently and needs its own drawn explanation.

Place the cape's root vertices inside the same neckpiece/neckline construction with enough overlap to survive rasterization. The free cloth can trail and change shape while its root remains attached. A separate head-relative tail and chest-relative collar can drift apart when the figure leans or turns. Do not solve that by parenting all cloth to the head without considering the shoulders.

Check the nape, underside of jaw, shoulder transition and both cape-root edges in every drawing. Look for gaps, tangencies, doubled contours and a band cutting through the jaw. Establish the attachment before adding folds or secondary flutter.

## Review in increasing scope

1. Inspect neutral and the few complete action keys, with temporary guides and plain silhouettes. Resolve attachment, joint direction and volume before generating the full set.
2. Inspect every exported drawing at a readable size, including both anatomical limbs, intermediate poses and opposing half-strides. Mark the actual frame/side where a defect occurs. A tiny all-frame contact sheet needs enlarged strips or individual images.
3. Inspect the same art at actual game size and against a visible ground line. Account for outlines and overlap. Check that the served browser images are the rebuilt exports; stale assets can hide a source fix.
4. Review normal and slow playback, transitions, loop seam and contact at the actual movement speed. Static keys establish static drawing quality only. Source-pixel travel, exposure and engine movement must agree for a planted foot to stay planted.

Geometry assertions can detect a reversed cuff or a changed limb length. Schema validation, counts, export receipts and source hashes establish different facts. None proves natural drawing or animation. A reviewer must actually open the images; inability to view is unverified. Screenshot sampling and frame strips do not establish continuous live video perception.

Preserve failed evidence and superseded verdicts. New owner feedback can expose a defect missed by an earlier PASS. After a correction, review the changed images and their demonstrated scope freshly; a boot/neckpiece pass does not accept remaining limb crowding or the entire game.

## References and worked evidence

Primary instruction: [Proko figure construction](https://www.proko.com/course-lesson/mannequinization-structure-of-the-human-body), [shoulder bones](https://www.proko.com/course-lesson/anatomy-of-the-shoulder-bones/), [leg bones](https://www.proko.com/course-lesson/how-to-draw-legs-bone-anatomy-for-artists), [measurement and projection](https://www.proko.com/course-lesson/measuring-techniques), [Larmann's figure understructure](https://drawinglab.evansville.edu/geometric.html), and [Wayne Gilbert's body mechanics](https://www.animationmentor.com/blog/animation-tips-tricks-what-makes-or-breaks-a-good-body-mechanics-shot/). These support figure construction and analysis; the attachment recipe and review sequence above are our practical synthesis. [Rusty Animator's posed run study](https://rustyanimator.com/run-cycle/) provides useful recovery/opposition images, with a mildly turned camera rather than an exact planar profile.

The [Redline construction case study](../../../docs/quality/redline-construction-evidence.md) retains representative source drawings and exports plus the measured before/after audit. The knee/proportion failures survived earlier checks; boot-frame errors were roughly 175° and 85°. After correction, a fresh scoped review covered 17 static drawings and the owner accepted the improvement. Compact run silhouettes and full animation acceptance remain separate work.

The case study's dimensions, ankle flexion and baseline belong to that character. Reuse the connected construction, attachment relationships and review method, rather than its pixel constants. The unfinished playable platformer is not part of this guidance release.
