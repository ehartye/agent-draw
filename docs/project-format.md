# Project format, version 1

This describes the v0.3 runtime, retaining project `version: 1`. Existing v0.1 and v0.2 projects remain valid; older runtimes reject fields introduced after their release.

Projects are UTF-8 JSON files of at most 2 MiB. Unknown fields are rejected, including fields that belong to another layer type. Run `validate` after every edit; a JSON parser alone cannot validate the project contract.

## Project object

| Field | Required | Meaning |
| --- | --- | --- |
| `version` | Yes | Exactly `1` |
| `name` | Yes | Nonblank string, at most 128 characters |
| `width`, `height` | Yes | Integer canvas dimensions, 1–4096 pixels each |
| `layers` | Yes | Array of 1–128 top-level nodes, bottom to top |

Optional `animation` describes the timeline below. The entire tree allows at most 128 shape/text leaves, 64 groups, and 192 total nodes. Group nesting is at most four levels. The layer budget is `width × height × number of leaves ≤ 134217728`; hidden leaves count. A large canvas therefore supports fewer leaves than the absolute limit.

Coordinates are pixels from the canvas's top-left origin at the root, or from the containing group's local origin when nested: positive x goes right and positive y goes down. Shapes extending beyond the canvas are clipped in the flattened export. The canvas is transparent until layers cover it.

## Common shape/text leaf fields

| Field | Required | Meaning |
| --- | --- | --- |
| `name` | Yes | Unique nonblank layer name, at most 128 characters |
| `type` | Yes | `rectangle`, `ellipse`, `polygon`, `text`, or `path` |
| `opacity` | No | Number from 0 to 100; defaults to 100 |
| `visible` | No | Boolean; defaults to true |
| `color` | Yes | Fill color: `#RRGGBB` or `#RRGGBBAA` |
| `stroke` | No | Outline color in the same hex formats |
| `strokeWidth` | No | Number from 0 to 128; defaults to 1 when `stroke` is set |
| `fillRule` | No | `nonzero` (default) or `evenodd` |
| `strokeLinecap` | No | `butt` (default), `round`, or `square`; requires `stroke` |
| `strokeLinejoin` | No | `round` (default), `bevel`, or `miter`; requires `stroke` |
| `fillGradient` | No | Structured linear or radial fill gradient; solid source `color` remains required |

Use JSON booleans, not strings. Colors are `#RRGGBB` or `#RRGGBBAA`; the optional final pair is the alpha channel. Color alpha and layer opacity both affect the final composition. Use `#00000000` for a transparent fill when drawing a stroke-only shape. `strokeWidth`, `strokeLinecap`, and `strokeLinejoin` require `stroke`. The default round join preserves v0.1 output; the default butt cap matches its previous SVG behavior. There is no miter-limit setting. `fillRule` controls compound/intersecting contours; `evenodd` is useful for holes without relying on contour direction. It does not subtract one layer from another.

### Gradient fills

`fillGradient` accepts exactly one of these forms:

```json
{"type":"linear","x1":32,"y1":32,"x2":224,"y2":224,"stops":[{"offset":0,"color":"#FFE6A6"},{"offset":1,"color":"#6846B7"}]}
```

```json
{"type":"radial","cx":96,"cy":88,"r":152,"stops":[{"offset":0,"color":"#FFE6A6"},{"offset":1,"color":"#6846B700"}]}
```

- All listed geometry fields are required for the selected gradient type. Unknown fields are rejected.
- Coordinates (`x1`, `y1`, `x2`, `y2`, `cx`, `cy`) are finite numbers from -4096 to 8192. They use absolute user-space units, not percentages or object-bounding-box units: canvas coordinates at the root, and the containing group’s local coordinate system when nested. Editing leaf geometry alone does not relocate its gradient; a group transform carries both geometry and paint together.
- Linear endpoints must differ; coincident endpoints are rejected.
- Radial `r` is finite, greater than zero, and at most 8192.
- `stops` contains 2–16 objects, each with only `offset` and `color`. Offset is a finite number from 0 to 1, sorted in nondecreasing order; repeated offsets are allowed. Color is `#RRGGBB` or `#RRGGBBAA`.
- The renderer creates internal SVG paint IDs and uses `gradientUnits="userSpaceOnUse"`. Do not supply IDs, URLs, XML, transforms, or another coordinate mode.
- A gradient overrides the solid `color` completely in rendered SVG; `color` remains required as a retained solid source color, not an emitted paint fallback. Stop alpha controls gradient transparency, and layer opacity still applies. The source color's alpha is not multiplied into the gradient.
- Strokes remain solid colors. There are no gradient stroke, focal-point, spread-mode, mesh, conic, or pattern fields.

The technical basis is [SVG paint servers](https://www.w3.org/TR/SVG2/pservers.html); agent-draw deliberately exposes only the bounded subset above.

## Rectangle and ellipse

Required: `width`, `height`, `color`. Optional: `x`, `y`.

- `x` and `y` are integers from -4096 to 4096, defaulting to 0.
- `width` and `height` are integers from 1 to 8192.
- An ellipse fits inside the given bounding rectangle.
- Both remain editable vector shapes in SVG.
- Rectangles also accept optional `radius`, a number from 0 to 4096 (default 0), for rounded corners.

```json
{"name":"disc","type":"ellipse","x":32,"y":32,"width":128,"height":128,"color":"#44BBAACC"}
```

## Polygon

Required: `points`, `color`. Do not provide `x`, `y`, `width`, or `height`.

`points` contains 3–256 `[x, y]` pairs in canvas coordinates. Coordinates may be fractional and must lie between -4096 and 8192. The filled outline closes from the final point back to the first. Avoid self-intersecting or degenerate outlines when predictable fill geometry matters.

```json
{"name":"triangle","type":"polygon","points":[[128,24],[232,224],[24,224]],"color":"#FFCC44"}
```

## Text

Required: `text`, `color`. Optional: `x`, `y`, `font`, `size`.

Unlike shape top-left coordinates, text `y` is a baseline. A value of 0 will place most letter shapes above the canvas.

- `x` and `y` have the same integer limits/defaults as rectangle layers.
- `text` is a nonblank string of at most 4096 characters; JSON `\n` can represent line breaks.
- `font` is a nonblank installed font name, at most 128 characters; default `DejaVu Sans`.
- `size` is a number from 1 to 512, in pixels; default 32.
- Text uses live SVG text, with `x` and `y` locating the first line’s baseline. Subsequent newline-separated lines use a line advance of `size × 1.2`. There is no width/height box, automatic fit, wrapping setting, alignment, or rich-text markup in this contract.

```json
{"name":"title","type":"text","x":24,"y":24,"text":"Hello","font":"DejaVu Sans","size":48,"color":"#FFFFFF"}
```

Keep important text within the canvas and review the export. Do not assume a font exists on another machine. Missing or substituted fonts can prevent or alter a build.

## Path

Required: `d`, `color`. Do not provide `x`, `y`, `width`, or `height`.

`d` is SVG path data, at most 65536 characters and 8192 parsed tokens. It must start with a move command. Supported commands are `M L H V C S Q T A Z` and their lowercase relative equivalents. Numbers must be finite and within -16384 to 16384. Argument counts must match the command; arc radii must be nonnegative, and arc flags must be 0 or 1. No XML, scripts, or external references are allowed.

```json
{"name":"curve","type":"path","d":"M 24 128 C 80 24 176 24 232 128","color":"#00000000","stroke":"#187DAB","strokeWidth":8}
```

Absolute commands use canvas coordinates; relative commands offset from the current path point. Open paths with a visible fill follow SVG filling semantics. Use a transparent fill for open stroke-only curves. Bounds on individual numeric arguments do not guarantee the full path stays on canvas; review clipping visually.

## Groups and local transforms

A group accepts only `type`, `id`, `name`, `children`, `opacity`, `visible`, and `transform`. `type: "group"`, `id`, `name`, and `children` are required. Names are globally unique across leaves and groups. IDs are globally unique among groups and match `^[a-z][a-z0-9-]{0,63}$` (1–64 characters); generated SVG uses `id="part-<id>"`. Keep IDs stable when revising or targeting parts. Children are ordered bottom to top and may contain leaves or groups; an empty group is allowed. A child array permits at most 192 nodes, subject to the stricter project-wide budgets above.

`opacity` defaults to 100 (range 0–100) and `visible` defaults to true. Group opacity applies to the composited group; ancestor opacity and visibility also affect descendants. Groups cannot carry color, stroke, gradient, path data, or other leaf paint fields. They do not provide paint inheritance.

`transform` is optional; omitted components have these defaults and finite numeric bounds:

| Component | Default | Range |
| --- | --- | --- |
| `x`, `y` | 0 | −8192…8192 |
| `pivotX`, `pivotY` | 0 | −8192…8192 |
| `rotation` | 0 degrees | −360…360 |
| `scaleX`, `scaleY` | 1 | 0.01…10 |

In the group's local coordinates, subtract the pivot, scale, rotate, restore the pivot, then translate by x/y. Positive rotation appears clockwise in the usual y-down canvas. Parent transforms compose around child transforms; they are not independent canvas offsets. There is no raw transform string, matrix, skew, reflection, or per-leaf transform field. Leaf coordinates and gradient coordinates retain their existing numeric bounds in the local system. Scaling also scales strokes; no non-scaling-stroke option is exposed.

```json
{"type":"group","id":"arm","name":"arm-part","transform":{"pivotX":64,"pivotY":80,"rotation":15},"children":[{"type":"rectangle","name":"arm-shape","x":60,"y":80,"width":16,"height":64,"color":"#187DAB"}]}
```

## Animation timeline

Optional project `animation` accepts `fps`, `frames`, `loop`, and `tracks` only:

- `fps`: required integer 1–30. `frames`: required integer 2–120. Duration is `frames / fps` seconds.
- `loop`: boolean, defaults to true.
- `width × height × frames ≤ 67108864` (64 Mi-pixels), in addition to the leaf budget.
- `tracks`: 1–64 entries, targeting existing group IDs only. Each target/property pair is unique.
- Each track has `target`, `property`, `keyframes`, and optional `easing` (`linear` default, `smooth`, or `step`). Properties are `x`, `y`, `rotation`, `scaleX`, `scaleY`, or `opacity`; pivots and visibility are not animatable.
- Each track has 2–64 keyframes `{ "frame": integer, "value": number }` in strictly increasing frame order. Values use the corresponding group property's bounds. Values are **absolute**, replacing the base property, never deltas added to it. Untracked properties retain their base values.
- Each track starts at frame 0. For loops it ends at virtual frame N (`frames`); for nonloops it ends at N−1. Loop start/end values must be equal, except rotations may differ by whole turns (multiples of 360).

`linear` interpolates numeric values directly; `smooth` uses smoothstep `t*t*(3-2*t)` per segment; `step` holds the left key until the next key. Rotation does not automatically choose the shortest arc. For a full turn use 0→360; for a short wave explicitly specify intermediate angles.

```json
{"fps":12,"frames":24,"loop":true,"tracks":[{"target":"arm","property":"rotation","easing":"smooth","keyframes":[{"frame":0,"value":15},{"frame":12,"value":-20},{"frame":24,"value":15}]}]}
```

This is the `animation` object, not a standalone project. All frames 0…N−1 are exported; the virtual loop endpoint N is used to compare canonical SVG against sample 0, never encoded as a duplicate frame. Equality proves closed endpoint state, not smooth velocity or attractive motion. Check the last-to-first transition in actual playback. Nonloop duration still includes the final frame's display interval.

`build` renders the base project state; it does not sample tracks or create animation files. `animate` samples the timeline, writes `master.svg` from sample 0, and preserves the timeline in `project.json`. All generated SVGs are static editable snapshots, not embedded SVG animations.

## Unsupported inputs

There is no image layer, SVG-import field, raw XML, URL reference, or arbitrary script. This format authors vector geometry directly. It does not embed bitmap assets or trace them automatically. No filters, masks, clipping paths, arbitrary SVG groups/transforms, boolean operations, brushes, path morphing, skeletal constraints, or physics are exposed. Only the structured group and timeline fields above are accepted. Structured fill gradients are supported; arbitrary SVG paint-server input is not.

## Validation and inspection

```sh
node scripts/run-managed.js validate project.json
node scripts/run-managed.js inspect project.json
```

These commands validate the project without rendering. Fix reported fields rather than removing validation or substituting arbitrary scripts. To change an asset, edit its project source and rebuild into a fresh output directory.
