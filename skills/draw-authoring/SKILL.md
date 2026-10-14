---
name: draw-authoring
description: Author or revise vector-first 2D illustrations, icons, mascots, and diagrams in agent-draw project JSON. Use for drawing composition, art styles, editable shapes and paths, or project validation errors.
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

Read the [project format](../../docs/project-format.md) for exact fields and limits. Recipes use the v0.2 runtime's additions while keeping project `version: 1`; older runtimes reject those fields. Never invent unsupported operations to imitate an Inkscape GUI technique.

## Author, validate, review

1. Save JSON in a durable user working directory outside both generated output and managed runtime. Name unique layers by function; array order is bottom to top.
2. Block the silhouette and major masses before details. Use only rectangles, ellipses, polygons, paths, and text. Keep a coherent palette, edge treatment, and light direction for the selected style.
3. Validate and inspect after editing:

```sh
node "<plugin-root>/scripts/run-managed.js" validate /absolute/path/project.json
node "<plugin-root>/scripts/run-managed.js" inspect /absolute/path/project.json
```

4. Fix every validation error. Load `draw-export`, build with actual Inkscape, and visually check the selected style at full size and intended thumbnail size. Revise the source until both read correctly; successful export alone is not design approval.

## Boundaries

The canvas is transparent unless covered. For stroke-only paths use `color: "#00000000"`. Supported fill gradients are structured JSON, not URLs or arbitrary SVG. No raster import, filters, masks, clipping paths, groups, transforms, brushes, booleans, or animation are exposed. Author the final contours numerically instead. Text needs installed fonts and visual checking.

The JSON is the rebuildable source. Manual SVG edits are not imported; preserve a separate SVG copy for independent editing. Keep detailed schema limits in the linked format reference rather than guessing from style examples.
