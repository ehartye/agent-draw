# Architecture

## Declarative source, editable vector output

Project JSON is the authoring source of truth. Strict validation narrows it to five declarative vector layer types. The serializer creates an SVG with named Inkscape layers containing rectangles, ellipses, polygons, text, or paths. Inkscape's actual headless export commands render PNG and PDF deliverables.

The SVG keeps real vector geometry and live text. PNG is the raster preview/export; it is not the source for tracing or for regenerating the SVG. No imported or embedded raster images are accepted. There is no browser, MCP server, or long-lived service, and the Node.js runtime has zero npm dependencies.

## Managed runtime

`scripts/setup.js` prepares a runtime outside the plugin checkout. The managed launcher selects the matching plugin version and checks its source fingerprint, avoiding stale code after plugin updates. Rerun setup for a missing runtime or a new source fingerprint after an update. A modified existing release is rejected, not automatically repaired; report the error and obtain authorization before moving it aside and preparing a fresh copy. Setup does not install Inkscape or download dependencies.

`AGENT_DRAW_HOME` selects the managed runtime home. `AGENT_DRAW_INKSCAPE` selects the Inkscape executable when normal discovery is unsuitable. Keep the managed home separate from input/output project directories and from the plugin checkout.

## Build boundaries

Each build uses a separate Inkscape profile and bounded execution time. The output directory must be absent unless replacement is requested with `--overwrite`; input files must not be destroyed by output replacement. Keep the project JSON outside the output directory.

The serializer treats names, colors, font names, and text as data. Text is escaped for XML, and path data is restricted to SVG path commands and numeric coordinates. Gradient fills generate internal IDs in a controlled defs block; projects cannot choose a URL or paint-server ID. Fill rules and stroke cap/join controls are enumerated. There are no fields for raw SVG markup, scripts, URLs, arbitrary shell commands, or Inkscape extension calls. Unknown fields are rejected.

A separate profile is not an OS sandbox. Inkscape is a native application running under the current account. Use a trusted binary and retain host-level restrictions when handling untrusted content.

## Reproducibility and editability

Fonts and Inkscape versions are environmental inputs. Text metrics can change if a font is unavailable or replaced. Keep the chosen fonts and renderer version consistent for repeatable output, and inspect exports visually rather than promising byte-identical output across machines.

Named SVG layers preserve authoring structure in Inkscape. The JSON source is one-way: manual SVG changes are not imported back into JSON, and rebuilding replaces generated output. Save edited SVGs separately when manual work must survive.

## Verification model

Validation checks data before rendering. Export completion checks that the renderer produced its expected artifacts. Neither proves that the result satisfies the design brief. Review the PNG for composition, clipping, transparency, and text; inspect the SVG structure or open it in Inkscape when layer editability matters. Keep the receipt with the exports for provenance. Distinguish checks actually run from checks that remain unverified.
