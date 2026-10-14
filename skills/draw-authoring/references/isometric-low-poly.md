# Isometric and low-poly

## Goal

Use planar facets to suggest volume. Isometric construction keeps one projection across the scene; low-poly describes faceted surfaces and need not be isometric. Choose which the brief needs rather than combining them accidentally. The projection and shading recipe below is a practical construction, not an SVG feature.

## Construction order

1. Pick a projection once. For a conventional equal-axis isometric view, map world coordinates `(u,v,w)` to canvas coordinates `x = ox + 0.8660254*s*(u-v)`, `y = oy + 0.5*s*(u+v) - s*w`. Here `s` is the common axis scale, and `ox,oy` position the drawing. Calculate these numbers before writing JSON.
2. Store shared vertices once in your working calculations and reuse their exact results for neighboring polygons. Do not independently eyeball every face.
3. Paint rear objects before front objects. Resolve visible facets explicitly; this is not a 3D renderer with automatic occlusion.
4. For low-poly organic forms, establish the silhouette first, then choose facets that explain changes of plane. Random triangles seldom explain volume.

## Palette and line rules

Assign a stable value family to top, left, and right faces under a chosen light direction. Three values are a convenient starting point, not a physical lighting model. Usually omit strokes between facets so seams do not become a wireframe. Use deliberate outlines only if the brief calls for them.

## Concrete schema fragment

Three cube faces for a 256 × 256 canvas, sharing the same vertices:

```json
[
  {"name":"left-face","type":"polygon","points":[[58.718,88],[128,128],[128,208],[58.718,168]],"color":"#397589"},
  {"name":"right-face","type":"polygon","points":[[128,128],[197.282,88],[197.282,168],[128,208]],"color":"#24546B"},
  {"name":"top-face","type":"polygon","points":[[128,48],[197.282,88],[128,128],[58.718,88]],"color":"#78BAC5"}
]
```

## Supported tools and limits

Use polygons or closed paths; no `transform`, perspective, extrusion, lighting, mesh, or triangulation tool is exposed. Polygons support fractional coordinates and 3–256 points. The Inkscape wiki's [tutorial index](https://wiki.inkscape.org/wiki/TutorialsAndHelp) includes isometric transformation resources for its GUI; those transforms are not JSON fields in agent-draw. Export with Inkscape and inspect the actual seams.

## Common mistakes and QA

- Mixed axis slopes or inconsistent height scale: derive all projected points with the same mapping.
- Arbitrary facet values: preserve the chosen light-side relationship unless a material change explains the difference.
- Hairline gaps: first fix mismatched coordinates. If raster antialiasing still reveals a seam, a small intentional underlap can help, but only where opacity and geometry make it safe; inspect SVG and PDF too.
- Full-size: check shared edges, occlusion order, unwanted strokes, and silhouette dents.
- Thumbnail: check that the volume remains readable without relying on tiny facets. Merge unnecessary facets in source if they become visual noise.
