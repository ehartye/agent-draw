# Cel-shaded mascot

## Goal

Build an expressive character from a strong silhouette, readable facial features, and a few hard-edged shadow shapes. The sequence is an original design heuristic; it does not imply that all mascot art needs outlines or exactly two tones.

## Construction order

1. Establish gesture, support foot, shoulder/pelvis relationship and bent-joint landmarks before costume detail. Choose the pose and expression. Block head, body, and major appendages in flat color; test the silhouette before the face.
2. Draw the main contour with intentional curve segments. Mirror coordinates initially if useful, then introduce asymmetry for the pose or expression.
3. Pick a light direction. Add a contained shadow contour describing the volume; do not use a translated copy of the whole object as a substitute for form shading.
4. Add eyes, brows, and mouth with enough space to survive reduction. Add highlights last and only where they reinforce the expression or material.
5. If using a heavy outer outline, paint a final transparent-fill contour above shading to keep its edge clean.

## Palette and line rules

Use a base and shadow color that remain distinct at delivery size. A slightly hue-shifted shadow can be useful, but is an art choice, not a required formula. Keep outlines consistent within a character; reserve deliberate variation for emphasis. Test facial-feature contrast against the actual fill.

## Concrete schema fragment

A simple shaded face on a 256 × 256 canvas:

```json
[
  {"name":"head-base","type":"ellipse","x":40,"y":40,"width":176,"height":176,"color":"#F6BC55"},
  {"name":"head-shadow","type":"path","d":"M 190 80 C 208 128 188 188 128 206 C 174 206 206 174 206 128 C 206 108 200 92 190 80 Z","color":"#D98345"},
  {"name":"eyes","type":"path","d":"M 88 112 V 124 M 160 112 V 124","color":"#00000000","stroke":"#342D43","strokeWidth":10,"strokeLinecap":"round"},
  {"name":"smile","type":"path","d":"M 100 152 Q 124 178 152 152","color":"#00000000","stroke":"#342D43","strokeWidth":7,"strokeLinecap":"round"},
  {"name":"head-outline","type":"ellipse","x":40,"y":40,"width":176,"height":176,"color":"#00000000","stroke":"#342D43","strokeWidth":8}
]
```

## Supported tools and limits

Use ellipses, closed cubic/quadratic paths, explicit shadow shapes, and stroke controls. The [SVG path specification](https://www.w3.org/TR/SVG2/paths.html) defines the curve commands; it does not generate character anatomy. There is no clipping mask or boolean intersection, so keep shadows inside the contour by construction. A foreground outline can tidy edges but cannot hide a shadow that extends well beyond the body. Build with Inkscape after validation.

## Common mistakes and QA

- Tiny facial details: prioritize eye placement and mouth shape over decorative marks.
- Unmotivated shadow islands: simplify or reconnect them to the volume they describe.
- Shadows leaking outside the silhouette: fix their vertices and control points, rather than adding a fake background patch.
- Full-size: inspect curve kinks, eye alignment, outline continuity, and shadow containment.
- Thumbnail: check the intended emotion and pose at the actual use size. If the expression changes or disappears, enlarge/reposition essential features and re-export SVG, PNG, and PDF.
