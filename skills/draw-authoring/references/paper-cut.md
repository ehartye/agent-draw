# Paper-cut

## Goal

Suggest stacked sheets through overlapping silhouettes, restrained offset shadows, and clean openings. This is a vector approximation of cut paper; it does not require simulated fibers or physically accurate lighting.

## Construction order

1. Plan the stack from back to front. Distinguish a raised solid sheet from a hole revealing a lower sheet.
2. Draw broad contours with a few purposeful irregularities if a handmade character is wanted. Avoid adding many random nodes as texture.
3. For a raised sheet, place a darker offset copy immediately below its face. Use one light direction across the stack and vary offset only to explain different height.
4. For a window, author outer and inner subpaths as one compound contour; deeper layers should remain visible through it.
5. Keep the topmost focal form simple enough to read apart from the stacked edges.

## Palette and line rules

Start with related muted colors plus one focal contrast if appropriate. Separate adjacent sheet values enough to read without relying entirely on shadows. Use no stroke for a clean cut edge, or a very restrained intentional edge treatment. Opaque shadows are predictable; translucent overlaps can darken where they accumulate.

## Concrete schema fragment

A raised square frame over a colored sheet, on a 256 × 256 canvas:

```json
[
  {"name":"lower-sheet","type":"rectangle","x":24,"y":24,"width":208,"height":208,"color":"#24546B"},
  {"name":"frame-shadow","type":"path","d":"M 44 48 H 220 V 224 H 44 Z M 84 88 H 180 V 184 H 84 Z","color":"#153341","fillRule":"evenodd"},
  {"name":"upper-frame","type":"path","d":"M 36 36 H 212 V 212 H 36 Z M 76 76 H 172 V 172 H 76 Z","color":"#E9CFA1","fillRule":"evenodd"}
]
```

This stylized offset shadow is a construction choice, not a blur or physical shadow simulation. [SVG filling semantics](https://www.w3.org/TR/SVG2/painting.html) govern the compound opening.

## Supported tools and limits

Use ordered layers, closed paths, `fillRule`, and explicit duplicate coordinates. There are no filters, blur, drop-shadow, clip, mask, texture, or automatic offset-path fields. Offset every relevant point/control point yourself; there is no transform field. The hole belongs to its own shape and does not punch through all lower layers. Validate and use actual Inkscape exports.

## Common mistakes and QA

- Treating a white patch as a hole: use a compound path when the layer below should show.
- Inconsistent shadow directions: compare every sheet against the chosen light.
- Excessive offsets: reduce them if the stack reads as disconnected floating objects.
- Full-size: check shadow alignment, inner edges, transparency, and unwanted overlaps; inspect on the final background and review PDF independently.
- Thumbnail: confirm the depth order and main subject remain clear. Reduce the number of near-parallel contours if they collapse into stripes.
