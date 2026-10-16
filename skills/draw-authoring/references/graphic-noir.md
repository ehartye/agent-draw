# Graphic noir: mass, gesture and shot design

## Scope and evidence

Use for original high-contrast comic characters and scenes, especially black/white work with one accent. This is project-derived art direction, not a universal recipe or an account of a particular artist's process. Pair it with [fundamentals](fundamentals.md), [human action construction](human-action-construction.md) and [materials, color and scale](materials-color-scale.md).

The Noir game, its generated concepts and full development evidence are separate from this plugin release. Historical reports under `docs/quality/` describe those development paths; they are not a claim that the game or all referenced artifacts are bundled here. This release includes the reusable craft guidance, mannequin library and bitmap-lettering exporter.

Noir's first playable chapter established anatomy, native whole-frame animation and readable corrected stair landings. Inspection of its street screenshot beside the owner's coat and rooftop-action references exposed another opportunity: even thin contours and repeated architectural detail were carrying too much of the picture. The owner then approved a rendered static convergence key. The subsequent playable street and six generated concept screens have separate source, render and acceptance records; a documentation review does not establish improved motion. See `docs/quality/noir-craft-retrospective.md`, `noir-convergence.md`, `noir-playable-street.md` and `noir-six-concepts.md` under `docs/quality/` for case evidence and limitations.

## Establish the shot in broad masses

1. State the shot's emotional event and the player's next readable action. Choose the focal subject, a dominant black or white field, and a quiet area before drawing windows or rain.
2. Block a few large filled shapes. A coat can read as a single white mass cut by black fold wedges, or a black mass interrupted by selected lit planes. Do not outline every limb and seam equally. Hide small detail and inspect at the intended game size and as a reduced composition preview: the gesture and focal order must survive.
3. Choose where edges appear. Let a shadowed arm merge into the torso or a coat edge merge into the background, while keeping enough shoulder, hand, knee or sole information to read the action. Test the character against the backgrounds it actually crosses. A contour that works on black may disappear on pale sky.
4. Add only the internal cuts that explain force, material or expression. Reserve the sharpest value changes and essential gaps for the focal action. Neutral gray can support depth, but should not dissolve the principal black/white statement into uniformly midtone scenery.

Compute final contours within Draw's supported paths, polygons and groups. For a transparent opening, use a compound contour with the appropriate fill rule; a black patch is only a black painted shape and will not reveal a different background. Masks, clipping, brush strokes and arbitrary boolean operations are not exposed by the JSON format. Keep the leaf/group budgets in the project-format reference in view.

## Make perspective and acting do work

Construct the environment's volumes before scattering surface marks. In the approved Noir concepts, a cropped foreground wheel, enclosing tenement walls, white pavement and a substantial coat establish three distinct depths. The first editable street adaptation gained depth when its buildings acquired corners, recessed doorways, staggered roof profiles, scale-changing window clusters and fire escapes. The actual native/Phaser proof is retained in `docs/quality/noir-concept-emulation.md`; it is a still-composition observation, separate from whole-cycle or owner acceptance.

Give each receding edge a material owner: a sill, cornice, curb, wall return or balcony. Join those edges into credible planes and openings. Keep the largest light/ink relationships readable when window detail disappears. Use broken reflection groups that echo nearby buildings and the accent source, leaving quiet water and support areas. Chips can describe an exposed edge and hatching can turn a plane; evenly distributed scratches consume contrast without supplying that construction. A few legible structural groups can carry more spatial information than an evenly detailed facade.

Inspect the whole figure at multiple route positions before extending its keys. Noir's first concept-street proof lost the white shoulders and sleeves against pale sky; dark cuff/neck fragments then made their attachment harder to follow. A second neutral proof restored selected dark contour/return planes and attached gloved hands, inspected in both facings on the pale field. Also inspect the extreme travel bounds: a foreground crop can hide a player even when the starting position and exit route pass. This adaptation keeps the street actor on a readable plane in front of the wheel. A further neutral proof adds directional calf/boot light planes and short pavement cuts registered to y600, restoring the soles and their support against that dark crop. These are observed proof corrections, separate from full-cycle or physical-controller acceptance.

Design depth through scale, overlap and cropping: a cropped foreground shoe, rail or coat can frame a much smaller distant figure. Choose a low, high, overhead or close view because it expresses the event. Rotating a conventional side view alone does not create those depth relationships. Redraw the whole pose for its view; mirroring a profile cannot supply foreshortening or a new facing.

Make traversal belong to that camera. Noir's doorway follow-up came from owner feedback that a profile character moving across screen fought an illustration of a bridge receding away from the viewer. For an away-walking shot, author a real back view and put the foot contact on a ground plane with lateral and depth coordinates. Use one projection for deck/rail construction, character placement, physical scale and path bounds. Clamp the footprint in world space before projection. A separate screen-y scale curve or independently traced collision polygon can disagree with the drawing even when each looks plausible alone. Returning toward the camera needs a front view; diagonal steering needs quarter views. Keep each facing's shoulder, hand, knee and sole construction coherent rather than stretching a profile into another view.

Gate an extended walk set on the actual engine composition: inspect one rear neutral/contact/passing pose and a front pose at large foreground size, middle depth, near the doorway and both travel extremes. Check the feet against the projected support, head height against the horizon, rail occlusion and the distant figure against the door. A declared origin is not a measured contact: include both soles and their stroke edges, including the trailing toe-off boot, record raw positions and register the complete drawing to the expected baseline without moving its joints. A receiving-foot-only check missed toe-off penetration in Noir; inspect actual rendered ink below the baseline as well as source landmarks. Lift a rotating airborne boot clear of the floor before tilting it, and inspect each sole's angle and clearance. Then inspect actual controlled away/return motion and alternating contacts. A still at several assigned depths proves camera registration, not playable traversal or a finished walk cycle. The doorway uses planar whole-pose drawings under a pinhole projection; it does not establish full 3D limb perspective or continuously locked stance feet. See `docs/quality/noir-doorway.md` for the shared-camera contract and scoped evidence.

Begin character keys with support and force. Locate the planted foot, weight-bearing hip, shoulder/pelvis relationship, head direction and purposeful hand. Compress a pose against wind; let the coat's bulk respond to that force. Preserve measured limb lengths, shoulder attachment, near/far arm order, opposing gait phases, boot/sole orientation and prop-to-hand attachment from the anatomy guidance. Concealed edges do not excuse an impossible joint. Check the underlying construction separately when a shadow hides it.

Draw contact, weight reception, passing and push-off as coherent whole poses before filling the cycle. Inspect normal and slow playback in both travel directions. Strong keys need readable timing; adding in-between frames cannot repair weak acting or a backwards knee.

## Share an attention target across character and environment

Choose a named point in canvas coordinates and give it narrative meaning, such as a distant doorway. Construct receding architectural edges and road reflections from that common vanishing point. Then borrow its direction for selected character marks: a hat brim, fold cuts, cuff or gaze. The character participates through gesture and mark placement; retain coherent shoulders, joints, planted soles and gravity. Keep uprights and essential support edges legible. A single perspective vanishing point applies to one family of parallel receding edges, not every physical edge in a scene.

For an exact guide, with target `V` and an outer point `P`, use `Q(t) = V + t * (P - V)`. Two points with distinct `t` values define a segment whose extension reaches `V`. Use interrupted segments and broad quiet masses rather than covering the image with complete rays. Preserve different edge weights and a local focal opening so the target survives the surrounding diagonals. Weather can share the compositional direction as an explicit stylization; radial streaks are not evidence of a physical wind field.

Noir's static convergence study uses `V = [944, 300]` on a 1280 by 720 canvas, with the red doorway centered there. Selected coat folds, hat brim, cuff, window bands and road cuts derive from the same point. Native study and transparent guide exports are retained with editable source in `examples/noir/art/convergence/`; the Phaser viewer under `public/convergence/` switches guides and the previous game screenshot. Inspect both guide-free and guided images at actual size. This is a rendered still-pose experiment, not acceptance of a new animation cycle or replacement gameplay art. See `docs/quality/noir-convergence.md` for the evidence and limitations.

## Stage weather and marks

Group rain by depth and local density, with broad nearby streaks, smaller distant marks and quiet gaps around important faces, hands and objectives. Use white cuts over dark fields and dark marks over pale fields when each helps the composition. Establish a coherent wind direction across weather, clothing and pose. Inspect a frozen weather frame as well as motion; a busy moving overlay can conceal a weak picture.

Use roughness at selected hems, impact edges, folds or weather-exposed surfaces. Group window lights and hatching into meaningful planes and clusters. Leave large calm fields. Uniform noise, splatter or a full window grid tends to give every area equal attention. Keep reduced-motion presentation readable without depending on flicker or repeated camera movement.

## Carry the drawing into movement

Compose around the reachable objective and actual support plane. A distant doorway in a still key cannot become an interactive exit merely by placing a trigger at a different height. In the playable street, the doorway reaches the y600 support plane while a selected target inside it attracts the architecture. Check actor/door scale and the ink's ground contact together before producing a full frame set.

Static geometry can share an exact world-space target. Translating or mirroring a complete character drawing moves its projected convergence too. Let selected cuts and gestures reinforce the direction at representative positions; keep joints, near/far order and registered contacts coherent throughout travel. Do not stretch limbs to force every moving line through the fixed target.

Calibrate gait cadence when changing drawing or display scale. Measure a planted support landmark's local horizontal travel over its authored stance duration. A useful reference is `referenceSpeed = renderScale * abs(localSupportEndX - localSupportStartX) / stanceSeconds`; with evenly timed keys, this becomes per-key displacement times fps times scale. The engine's playback multiplier follows travel speed divided by that reference. Use actual exposure durations when holds differ. Separate source calibration from visual review of normal and slow playback in both directions.

Keep footstep cues aligned with the authored contacts after cadence changes. Existing timer intervals may be wrong for a larger figure. Pass meaningful contact keys to the engine and use its native animation/audio ownership; distinguish a landing from a repeated step. Contact indices depend on the clip. Technical event timing does not establish listening acceptance.

## Use raster concepts as composition trials

For a flat three-ink concept, specify the drawn medium, value masses and edge treatment alongside black/white/accent. In this case, cinematic rain language introduced gray atmosphere and photographic depth blur despite the named palette. A targeted street generation asking for printed graphic ink, flat white sky, broad reflection cuts, hard edges and no photographic focus blur visibly changed that result. Preserve the prompt and superseded output so the observation remains inspectable; this is one case, not a general model-behavior guarantee.

Give every requested screen its own camera, action and focal role. Noir's set varies low street, elevated stealth alley, overhead stair, side-on leap, near-foreground interior and distant frontal bridge. Retain the original character's coat/hat silhouette and accent role across the set. Show uncropped images at usable size; a crop may hide a landing, boot contact or foreground framing.

Inspect the actual generated palette. Three named art inks do not guarantee exactly three RGB values: antialiasing, ink texture and neutral remnants remain in these outputs. Label a black/white/red art direction honestly; do not claim pixel quantization. Prompted convergence is an attention goal requiring inspection, not mathematically assured geometry: the generated street can retain central depth while its accent door sits to the side. Construct exact shared targets numerically when required. Generated perspective and apparent traversal also need review. The first rooftop concept concealed the receiving tread behind its parapet/rail; a targeted image edit made a broad landing top and contrasting front face visible, with the rail behind. Preserve that before/after alongside the earlier native stair correction. This observed correction does not prove a guidance-only behavioral trial or a working collision route.

Use the concepts to choose masses, silhouette, camera and material marks for editable production art. Rebuild and review the game's actual layers and whole-pose frames through the supported Draw contract. A detailed raster illustration is not an imported editable Draw project or an animation set.

## Preserve the playable drawing

Give actual support surfaces a distinct tread edge and front face, matching collision tops and endpoints. Dim or interrupt background rails so they cannot impersonate longer platforms. Review the actual engine image with collision coordinates: a successful jump route does not prove that the drawing communicates the route. This was a concrete corrected defect in Noir's stairwell.

Keep landing targets and the player readable during playable shots. Use a brief inspection close-up or scene transition for framing that would obscure essential movement. Compose captions into deliberate quiet areas and inspect actual lettering, controller prompts and fullscreen crops. Give the accent color a stable role such as clue or interaction; do not rely on hue alone to communicate an essential state.

## Smallest useful revision and acceptance

Revise one representative hero key and one street shot before multiplying scenes or frames. Retain the before image, proposed value block-in and actual native export on matching backgrounds. Then inspect the actual engine view at its smallest supported viewport.

- With details hidden, can a viewer find the figure, read its attitude and identify the next action?
- Do selected missing edges create a coherent mass while essential hands, contact points and facing remain legible across backgrounds?
- Does depth come from drawn scale, overlap and perspective, with no ambiguous landing surfaces?
- Do anatomy, planted contacts, boots, props and near/far layering hold in the complete motion cycle?
- Do rain, cloth, captions and accent guide attention without obscuring objectives or controls?
- Are all delivered assets rebuilt from supported source and checked visually at actual size?

Record the result as observed, corrected or proposed. Keep failures and untested changes visible. A schema-valid export, passing route, source review or attractive contact sheet alone cannot establish the final in-game art quality.
