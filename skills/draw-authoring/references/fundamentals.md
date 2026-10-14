# Vector craft fundamentals

## Goal and evidence

Make a deliberately composed image that remains editable and readable at its intended size. The construction and review suggestions here are practical starting points, not rules established by SVG or requirements of every art style. Technical claims below follow the linked standards; the JSON limits come from agent-draw's validator.

## Construction order

1. Write a one-sentence visual brief and identify the smallest delivery size. Choose a dominant silhouette and an area of quiet space before adding detail.
2. Block large masses in plain fills. Give touching forms a clear overlap, visible gap, or intentional shared edge; avoid almost-touching tangencies.
3. Establish repeated units: a corner treatment, line weight, palette roles, and (if shaded) a light direction. A small palette is a useful starting constraint, not a mandatory color count.
4. Shape curves with few purposeful segments. In `C x1 y1 x2 y2 x y`, the first two pairs control the curve and the last pair is its endpoint. At a smooth junction, align the arriving and departing handles through the shared endpoint; vary lengths to tune tension. Use a deliberate corner where the silhouette changes abruptly. [SVG path mechanics](https://www.w3.org/TR/SVG2/paths.html).
5. Add detail only where it improves recognition or expression. Layer order is paint order: background first, then rear masses, main forms, accents, and optional outline corrections.

## Palette and line rules

Assign colors to roles (background, subject, shadow, highlight, accent) so revision is systematic. Test subject/background separation by actual viewing, including a grayscale preview when useful. Do not rely on hue alone to separate adjacent essential forms. Stroke width is in canvas units and scales with the artwork; leave room around the shape for its outline.

An open path can still receive a closed-area fill. Use transparent fill for a centerline. `Z` closes a contour; use separate subpaths with `fillRule: "evenodd"` for a true hole instead of painting the background color over it. [SVG fill and stroke behavior](https://www.w3.org/TR/SVG2/painting.html).

## Concrete schema fragment

A 256 × 256 canvas can contain this single layer with a real transparent opening:

```json
{"name":"frame","type":"path","d":"M 32 32 H 224 V 224 H 32 Z M 80 80 H 176 V 176 H 80 Z","color":"#24546B","fillRule":"evenodd"}
```

Place fragments inside a project object's `layers` array; they are not standalone project files. Use `version: 1`, a name, and canvas width/height. Array examples in the other guides replace the `layers` array.

## Supported tools and limits

Use project `validate` and `inspect`, followed by the managed Inkscape build. There are five layer types; curve handles are authored in path data, not through a node-editing command. Every object is a named layer; extra shadow facets consume the 128-layer budget and canvas-area budget. No path boolean, transform, clip, or mask command is exposed. Compute resulting vertices/contours before serialization. Inkscape's own UI has more tools than this format; its [glossary](https://wiki.inkscape.org/wiki/Inkscape_glossary) distinguishes paths, nodes, fill, and stroke. Do not assume every UI feature has a JSON equivalent.

## Common mistakes and QA

- Too many nodes: inspect bumps and remove unnecessary segments in the source.
- Painting holes with a background-colored patch: test on a different background; use compound contours where transparency matters.
- Details before structure: hide accents and check whether the subject still reads.
- Full-size QA: inspect joins, curve continuity, clipped strokes, layer order, transparency, and font substitution in PNG/SVG; check the PDF independently when delivering it.
- Thumbnail QA: view at the actual smallest use size (for example 32 px for an icon, not automatically for a poster). Check silhouette, gaps, expression, and focal order. Increase essential gaps or simplify details if they disappear; rebuild and recheck.
