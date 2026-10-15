---
name: draw-authoring
description: Author or revise vector-first 2D illustrations, icons, mascots, and diagrams in agent-draw project JSON. Use for drawing composition, art styles, character anatomy and attachments, editable parts, pivots, drawn pose sequences, material texture, world scale, keyframed loops, or project validation errors.
---

# Draw authoring

Load `draw-setup` before the first command in a session. Confirm the Inkscape check succeeds before promising exports.

## Choose the construction before the geometry

Establish the subject, use, canvas, transparency, and smallest viewing size. Read [fundamentals](references/fundamentals.md), then the reference matching the requested visual language. These are starting recipes, not universal rules:

- [Flat pictogram](references/flat-pictogram.md): silhouette, negative space, optical balance
- [Monoline](references/monoline.md): centerlines, consistent weight, caps and joins
- [Isometric / low-poly](references/isometric-low-poly.md): shared vertices, projected axes, face values
- [Cel-shaded mascot](references/cel-shaded-mascot.md): silhouette, expression, contained hard shadows
- [Paper-cut](references/paper-cut.md): stacked contours, offset shadows, real holes
- [Gradient editorial](references/gradient-editorial.md): focal hierarchy, bounded gradient fills

For dynamic characters, bent joints or frame-by-frame action, read [drawn poses](references/drawn-poses.md). For material texture, varied color and believable person/building scale, read [materials, color and scale](references/materials-color-scale.md). Review those choices at actual engine size before adding fine detail.

For human or stylized humanoid proportions, backwards knees, misplaced shoulders, boot rotation or cape/neckpiece attachment, read [human action construction](references/human-action-construction.md) before extending the pose set. Establish a few complete drawings and inspect their actual exports before filling a cycle.

For genuinely rigid reusable parts, nested motion, waves, or loops, read [parts and animation](references/parts-and-animation.md) before writing transforms or tracks.

Read the [project format](../../docs/project-format.md) for exact fields and limits. Recipes use the v0.4 runtime's additions while keeping project `version: 1`; older runtimes reject those fields. Never invent unsupported operations to imitate an Inkscape GUI technique.

## Author, validate, review

1. Save JSON in a durable user working directory outside both generated output and managed runtime. Name unique layers by function; array order is bottom to top.
2. Block the silhouette and major masses before details. Use rectangles, ellipses, polygons, paths, and text, with structured groups for parts that move together. Keep a coherent palette, edge treatment, and light direction for the selected style.
3. Validate and inspect after editing:

```sh
node "<plugin-root>/scripts/run-managed.js" validate /absolute/path/project.json
node "<plugin-root>/scripts/run-managed.js" inspect /absolute/path/project.json
```

4. Fix every validation error. Load `draw-export`, build with actual Inkscape, and visually check the selected style at full size and intended thumbnail size. Revise the source until both read correctly; successful export alone is not design approval.

## Boundaries

The canvas is transparent unless covered. For stroke-only paths use `color: "#00000000"`. Supported fill gradients are structured JSON, not URLs or arbitrary SVG. Structured groups accept bounded local pivot transforms; timelines animate only group translation, rotation, scale, and opacity. No raster/SVG import, filters, masks, clipping paths, arbitrary transforms, brushes, booleans, path morphing, or physics are exposed. Author final contours numerically. Text needs installed fonts and visual checking.

The JSON is the rebuildable source. Manual SVG edits are not imported; preserve a separate SVG copy for independent editing. Keep detailed schema limits in the linked format reference rather than guessing from style examples.
