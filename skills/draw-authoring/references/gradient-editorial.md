# Gradient editorial

## Goal

Use broad color transitions to support a focal idea or atmospheric form while retaining a clear vector silhouette. Gradients are a compositional tool, not a replacement for shape design. The palette and lighting suggestions here are heuristics.

## Construction order

1. Compose the illustration with flat masses first. Reserve a quiet area for any headline or labels.
2. Assign the gradient a job: directional illumination, a colored atmosphere, or a focal glow. Choose linear for a directional transition, radial for a centered spread.
3. Place gradient coordinates in canvas space. They are not percentages or coordinates local to a shape; moving geometry alone does not move its paint field.
4. Begin with two or three stops. Add stops only to control a specific transition. Compare the silhouette against both ends of the gradient.
5. Add a few solid accents or live text after the large transitions read correctly.

## Palette and line rules

Choose stops that preserve the intended light/dark hierarchy. Saturated complementary endpoints can produce an unwanted dull intermediate region; inspect the rendered transition instead of assuming its appearance. Solid dark or light accents can anchor soft fields. For a fade, keep the RGB hue consistent while changing the alpha unless a hue change is intentional.

## Concrete schema fragment

A lit orb on a 256 × 256 canvas:

```json
{"name":"orb","type":"ellipse","x":32,"y":32,"width":192,"height":192,"color":"#7856C7","fillGradient":{"type":"radial","cx":96,"cy":88,"r":152,"stops":[{"offset":0,"color":"#FFE6A6"},{"offset":0.45,"color":"#EE8BA6"},{"offset":1,"color":"#6846B7"}]}}
```

For a linear field replace the gradient with:

```json
{"type":"linear","x1":32,"y1":32,"x2":224,"y2":224,"stops":[{"offset":0,"color":"#FFE6A6"},{"offset":1,"color":"#6846B7"}]}
```

This second fragment is the `fillGradient` value only. Keep the containing layer's required solid source `color`; the gradient overrides it completely in rendered SVG.

## Supported tools and limits

Agent-draw emits internal paint IDs and `userSpaceOnUse` gradients. The [SVG paint-server specification](https://www.w3.org/TR/SVG2/pservers.html) defines the underlying coordinate and stop behavior. The supported contract is narrower: only linear/radial fill gradients, 2–16 sorted stops, finite coordinates -4096…8192, and radial radius greater than 0 and at most 8192. Stops use offsets 0…1 and hex colors with optional alpha. Layer opacity affects the whole result; the retained solid source color is not a rendered fallback, and its alpha is not an extra opacity multiplier on the gradient.

No gradient strokes, mesh/conic gradients, focal-point controls, transforms, repeated spread modes, blur, blend modes, or imported paint servers are exposed. Do not supply `url(...)`, raw XML, or user-chosen paint IDs. Use validation and the Inkscape build; interpolation appearance and export fidelity need visual checking.

## Common mistakes and QA

- Tiny or coincident linear endpoints: choose endpoints spanning the intended transition; coincident endpoints are rejected by validation.
- A gradient positioned outside the shape: review canvas coordinates together with its geometry.
- Too many near-identical stops: simplify to avoid accidental bands.
- Full-size: inspect banding, alpha edges, crop, and text readability in PNG and independently in PDF. Verify the SVG retains gradients and vector geometry.
- Thumbnail: check that the focal subject wins over the brightest background area and the silhouette survives reduction. Adjust masses or contrast before adding effects.
