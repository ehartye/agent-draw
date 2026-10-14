# Flat pictogram

## Goal

Communicate one concept with a recognizable silhouette and a few deliberate interior cuts. These are practical heuristics for compact icons, not a universal icon grid or accessibility guarantee.

## Construction order

1. Reduce the subject to its most identifying outer contour. Start with an ellipse, rounded rectangle, or a short closed path.
2. Establish a working margin and center by visual weight, not just the bounding box. A pointed or asymmetric form may need an optical shift.
3. Cut only the negative spaces needed for recognition. Prefer a compound path for transparent openings; use overlapping same-color solids when no actual hole is needed.
4. Repeat corner character and spacing. Compare the icon at its target size before adding secondary details.

## Palette and line rules

Start with one foreground color and optional accent. Favor either a filled silhouette or a consistent outline system rather than accidental mixtures. Small interior gaps need enough width to survive the target export; there is no single minimum that works for all sizes and renderers.

## Concrete schema fragment

A simple house pictogram with a transparent doorway on a 256 × 256 canvas:

```json
{"name":"house","type":"path","d":"M 40 112 L 128 40 L 216 112 V 216 H 40 Z M 108 152 H 148 V 216 H 108 Z","color":"#24546B","fillRule":"evenodd"}
```

The second contour reaches the exterior to create an opening. For a fully enclosed window, end the inner contour above the base. The geometry is original; [SVG fill rules](https://www.w3.org/TR/SVG2/painting.html) define how compound contours are painted.

## Supported tools and limits

Use rectangles with `radius`, ellipses, polygons, and closed paths. `fillRule` supports `evenodd` and `nonzero`; it is not a boolean subtract operation. Draw the resulting contour directly. There are no clone, align, boolean-union, or automatic optical-centering commands. Reuse coordinate values deliberately and validate the project before the Inkscape build.

## Common mistakes and QA

- A literal miniature drawing: remove features until the concept remains clear without them.
- False holes painted white: verify on both dark and light backgrounds when transparency is required.
- Unequal apparent weight: compare the pictogram beside its intended neighbors rather than enforcing identical bounding boxes.
- Full-size: check corners, unintended self-intersections, and edge margins. Review editable SVG and exported PDF when required.
- Thumbnail: inspect the intended icon size, ensuring the doorway/gaps remain open and the outer silhouette communicates the concept. Avoid judging only a zoomed screenshot.
