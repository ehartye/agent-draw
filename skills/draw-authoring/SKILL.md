---
name: draw-authoring
description: Author or revise vector-first 2D drawings with named shapes, text, and paths for editable SVG and Inkscape PNG/PDF output. Use for agent-draw project JSON, layer composition, or project validation errors.
---

# Draw authoring

Load `draw-setup` before the first command in a session. Read the [version 1 project format](../../docs/project-format.md); do not guess fields or invoke unsupported operations.

## Workflow

1. Establish the asset, canvas dimensions, transparency, and intended use. Use sensible defaults for reversible design choices.
2. Save project JSON in a durable user working directory, outside the output directory and the managed runtime.
3. Name layers by function: `background`, `badge`, `title`, `outline`. Names must be unique. Array order is bottom to top.
4. Use only `rectangle`, `ellipse`, `polygon`, `text`, or `path`. Canvas coordinates start at the top left. A full-canvas rectangle creates an opaque background; otherwise the background is transparent.
5. Validate, then inspect:

```sh
node "<plugin-root>/scripts/run-managed.js" validate /absolute/path/project.json
node "<plugin-root>/scripts/run-managed.js" inspect /absolute/path/project.json
```

6. Fix every validation error before building. Load `draw-export` for output and visual review.

## Constraints

- Canvas: 1–4096 pixels per side; 1–128 layers; input JSON at most 2 MiB.
- Layers take a hex fill color, optional stroke/stroke width, opacity 0–100, and visibility. Use an alpha-zero fill for stroke-only artwork.
- Polygon points are absolute canvas coordinates; polygons do not take `x` or `y`.
- Path `d` is restricted SVG path data, not raw XML or executable code.
- Text uses installed fonts and limited layout; review clipping and font appearance.
- No raster imports or embedded images. This format creates actual editable vector shapes, paths, and live text.
- Unknown fields fail. Do not add scripts, URLs, arbitrary XML, filters, gradients, brushes, masks, or unsupported groups.

The JSON is the rebuildable source. Manual edits in a generated SVG are not imported into it. Preserve a separate SVG copy if the user wants to continue manual editing independently.
