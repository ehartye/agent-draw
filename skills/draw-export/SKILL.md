---
name: draw-export
description: Build and review agent-draw vector projects as editable layered SVG plus PNG and PDF exports, with receipts and safe output handling. Use to render, export, verify, or deliver an existing drawing project.
---

# Draw export

Load `draw-setup` and validate the project before building. Use the managed launcher resolved from the plugin root, not a guessed PATH binary.

## Build

Choose a fresh output directory separate from the input project:

```sh
node "<plugin-root>/scripts/run-managed.js" validate /absolute/path/project.json
node "<plugin-root>/scripts/run-managed.js" build /absolute/path/project.json --out /absolute/path/output/drawing --timeout 120
```

The build creates `drawing.svg`, `drawing.png`, `drawing.pdf`, and `receipt.json`, using actual headless Inkscape for exports with a separate profile. Existing output directories are refused unless `--overwrite` is explicitly provided. Use that flag only when replacement is authorized and the directory contains dedicated generated output, not sources or unrelated work. Prefer a fresh output directory when uncertain.

## Verify

1. Require successful command completion and verify all four outputs exist and are nonempty. Read the receipt; file presence after a failed command does not prove success.
2. Inspect the PNG visually at its actual dimensions. Check text clipping, layer order, transparency, spacing, and paths against the brief or reference.
3. Inspect SVG structure or open it in Inkscape when editable named layers matter. Verify that artwork is vector geometry rather than an embedded bitmap. Distinguish structural checks from a manual editing test.
4. Check the PDF when it is part of the requested deliverable; do not infer its appearance solely from the PNG.
5. Fix the JSON source and rebuild after problems. Do not silently edit only the PNG, leaving vector source inconsistent.

PNG is a raster export of the visible composition. SVG retains vector shapes, paths, live text, and named layers. Fonts are environmental inputs. Export success alone is not a visual-quality pass.

## Deliver

Provide SVG, PNG, and PDF using the host's supported file delivery mechanism. Include project JSON and the receipt when a rebuildable package is requested. Explain relevant limitations and identify verification that could not be performed. Do not claim publication, remote upload, or successful delivery without confirmation.

See [architecture](../../docs/architecture.md) and [limitations](../../docs/roadmap.md).
