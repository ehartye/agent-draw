# Material, color and world-scale craft

Use this reference when art looks flat, over-tinted, noisy, or disconnected from its game world. More vector marks are not automatically more detail. Each mark should explain a plane, material, light or wear pattern at the intended display size.

## Establish the scene before decorating assets

Choose a camera, sun direction and a few scale anchors before drawing the final character. Put a person beside an ordinary doorway and a full building silhouette. A practical starting proportion is an adult body around 80–90% of a usable door opening, with roof and facade substantially taller; adjust for the fictional architecture and perspective. Compare assets on the same projected ground plane. A nearer character can legitimately be larger, so do not compare unrelated screen depths as if they shared a scale.

For the current isometric slice, the target scene uses a body near 64 pixels, a door opening near 72 pixels, and roofs roughly 145–190 pixels above their ground anchor. These are project-specific composition targets. Measure actual visible body bounds, not the whole transparent sprite canvas. Keep the fixed foot pivot consistent across every pose; use engine object scale to establish person/world ratio before adding detail. A large sprite canvas is not a request for a giant person.

Review a screenshot containing character, door, cover and building together. Check eye level, reach height, cover height, shadow attachment and readable navigable ground. Do not approve scale from isolated character and building sheets viewed at different zooms.

## Use a color structure, not one global tint

A sunny frontier scene can have warm sandstone and dust, blue sky, cooler sky-lit shadows, faded indigo or slate clothing, muted sage, oxblood accents, ochre wood and varied skin values. Choose roles from the reference and the scene's needs; these examples are not a mandatory palette. “No teal” does not mean removing every cool hue or converting everything to brown.

Set large value groups first: lit ground, building masses, cast shadows and readable actors. Give the protagonist enough value or hue separation from the ground without outlining everything in neon. Test a grayscale thumbnail for value grouping, then restore color to judge temperature and material differences. Avoid an automatic hue-remap function that collapses all materials into the same few browns.

Choose a shared light direction and shadow family. Form shadows turn with the volume; cast shadows fall onto another surface and share the scene's direction. A dark translated copy of an entire character is not a substitute for body shading. Keep contact shadows tight near boots or grounded objects; broader shadows can stretch away with the light. Render body planes with hard-edged shadow shapes when aiming for a comic look, with restrained gradients only where they help the chosen language.

## Build material marks deliberately

- Cloth: broad folds follow tension between shoulder, elbow, belt and knee. Use fewer, stronger creases at compressed joints; leave flat planes calmer. Change fold geometry when the pose changes.
- Leather: put wear on bent edges, belt holes, boot toes and cuffs; use a few irregular scuffs rather than evenly scattered dots.
- Wood: long grain follows the board. Break boards at seams; vary the marks' length and spacing. Splintered ends and sun-bleached edges explain construction more than uniform noise.
- Stone/adobe: group irregular chips and cracks around corners, openings and stressed edges. Keep broad wall planes mostly quiet so architecture remains readable.
- Metal: sharp value transitions, a thin bright edge and a darker reflected band can read better than many scratches. Keep a gun's barrel/cylinder/grip geometry legible at game size.
- Dust: collect it on horizontal ledges, hems, lower boots and wheel contact. Use bounded translucent shapes in clusters; do not cover every object with identical speckles.

Author texture with supported paths, narrow polygons, short strokes and deliberate alpha shapes. Combine disconnected same-paint marks into one compound path when that preserves meaning and editability; do not spend one layer per tiny grain. There are no procedural noise filters, clipping masks or raster texture imports. Keep texture contours inside the receiving shape by construction. If a necessary effect cannot be expressed cleanly, report the concrete gap rather than inserting arbitrary SVG or a bitmap into the vector source.

## Line hierarchy and reduction

Use a strong but not uniform silhouette boundary, medium overlap/joint lines, and quieter material marks. Darken an occlusion or contact seam selectively; an equal heavy outline around every small shape fragments the form. Keep adjacent internal marks separated enough to survive downscaling. If they merge into a dark patch, simplify them rather than sharpening the whole image.

Inspect a 1× engine-size render first, then a larger view for contour quality. A detail invisible at 1× may be worth omitting; a defining eye, bent elbow, gun muzzle or coat split may need deliberate exaggeration. Check the actor on actual light ground and dark shadow, not just a checkerboard. Count whether a new texture layer improves material identity or merely adds visual noise.

The executable `examples/scale-material-study.json` places the drawn character and an 80-pixel doorway on the same baseline, with warm stone, blue/slate clothing, directional cast shadows and sparse material marks. It is a scale/material calibration illustration, not a substitute for the game's isometric scene QA.

## Done conditions

A representative scene shows believable human/door/building ratios; the actor separates from its ground; multiple material/color families remain visible; light and cast shadows agree; texture follows construction and wear; pose-critical shapes survive at game size. Save that scene crop and the actual display dimensions with the source/export evidence. Export success and a high test count do not establish these visual outcomes.
