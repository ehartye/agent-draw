# Monoline

## Goal

Create an outline-led illustration whose repeated line weight and clear rhythm carry the subject. This recipe favors friendly rounded lines; a technical angular brief may choose butt caps or bevel joins instead.

## Construction order

1. Draw centerlines first, using paths for open forms and closed shapes for enclosed ones.
2. Pick one primary stroke width at the target canvas scale. Budget space for the stroke on both sides of each centerline.
3. Choose caps and joins intentionally, then apply them consistently across related layers.
4. Simplify intersections: stop hidden lines before an occluding object or draw its opaque fill above them. Break unrelated crossing lines into distinct paths when needed.

## Palette and line rules

Use a transparent fill on open linework. A single dark stroke is a useful starting point; use color accents only where they clarify hierarchy. At the same stroke width, round and square caps extend beyond the endpoint while butt caps terminate there. Joins affect corners; sharp mitered angles can protrude. [SVG cap/join definitions](https://www.w3.org/TR/SVG2/painting.html).

## Concrete schema fragment

Two layers on a 256 × 256 canvas:

```json
[
  {"name":"cup","type":"path","d":"M 56 96 H 176 V 168 Q 176 208 136 208 H 96 Q 56 208 56 168 Z M 176 112 H 192 Q 216 112 216 136 Q 216 160 192 160 H 176","color":"#00000000","stroke":"#234653","strokeWidth":10,"strokeLinecap":"round","strokeLinejoin":"round"},
  {"name":"steam","type":"path","d":"M 112 72 C 88 56 136 40 112 24","color":"#00000000","stroke":"#234653","strokeWidth":10,"strokeLinecap":"round","strokeLinejoin":"round"}
]
```

## Supported tools and limits

Supported caps: `butt`, `round`, `square`; joins: `round`, `bevel`, `miter`. Both fields require `stroke`. The format does not expose dashes, markers, variable-width strokes, vector effects, or a miter-limit setting. Draw arrowheads as explicit polygons and variable-width marks as filled contours if required. Use project validation and Inkscape export; do not invent fields matching GUI controls.

## Common mistakes and QA

- Visible fill wedges on an open curve: use `#00000000` fill.
- Inconsistent terminal appearance: set caps explicitly rather than depending on defaults.
- Overlapping translucent strokes become darker: use opaque strokes when uniform weight is intended, or redesign the intersection.
- Full-size: check endpoint overshoot, doubled intersections, sharp joins, and clipped half-strokes at the canvas boundary.
- Thumbnail: check that adjacent strokes do not merge and curved gaps remain legible. Adjust geometry or stroke weight for the intended use size, then rebuild all deliverables.
