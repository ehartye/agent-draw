# Project format, version 1

Projects are UTF-8 JSON files of at most 2 MiB. Unknown fields are rejected, including fields that belong to another layer type. Run `validate` after every edit; a JSON parser alone cannot validate the project contract.

## Project object

| Field | Required | Meaning |
| --- | --- | --- |
| `version` | Yes | Exactly `1` |
| `name` | Yes | Nonblank string, at most 128 characters |
| `width`, `height` | Yes | Integer canvas dimensions, 1–4096 pixels each |
| `layers` | Yes | Array of 1–128 layers, bottom to top |

The additional layer budget is `width × height × number of layers ≤ 134217728`. A large canvas therefore supports fewer layers than the absolute 128-layer limit. Hidden layers count toward this budget.

Coordinates are pixels from the canvas's top-left origin: positive x goes right and positive y goes down. Shapes extending beyond the canvas are clipped in the flattened export. The canvas is transparent until layers cover it.

## Common layer fields

| Field | Required | Meaning |
| --- | --- | --- |
| `name` | Yes | Unique nonblank layer name, at most 128 characters |
| `type` | Yes | `rectangle`, `ellipse`, `polygon`, `text`, or `path` |
| `opacity` | No | Number from 0 to 100; defaults to 100 |
| `visible` | No | Boolean; defaults to true |
| `color` | Yes | Fill color: `#RRGGBB` or `#RRGGBBAA` |
| `stroke` | No | Outline color in the same hex formats |
| `strokeWidth` | No | Number from 0 to 128; defaults to 1 when `stroke` is set |

Use JSON booleans, not strings. Colors are `#RRGGBB` or `#RRGGBBAA`; the optional final pair is the alpha channel. Color alpha and layer opacity both affect the final composition. Use `#00000000` for a transparent fill when drawing a stroke-only shape. `strokeWidth` requires `stroke`. Outlines use round joins; the format does not expose cap/join controls.

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

## Unsupported inputs

There is no image layer, SVG-import field, raw XML, URL reference, or arbitrary script. This format authors vector geometry directly. It does not embed bitmap assets or trace them automatically.

## Validation and inspection

```sh
node scripts/run-managed.js validate project.json
node scripts/run-managed.js inspect project.json
```

These commands validate the project without rendering. Fix reported fields rather than removing validation or substituting arbitrary scripts. To change an asset, edit its project source and rebuild into a fresh output directory.
