# Architecture

## Declarative source, editable vector output

Project JSON is the authoring source of truth. Strict validation narrows it to five declarative vector leaf types and bounded structured groups. The serializer creates an SVG with named Inkscape layers containing rectangles, ellipses, polygons, text, or paths. Inkscape's actual headless export commands render PNG and PDF deliverables.

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

`font-atlas` converts a bounded printable-ASCII manifest into ordinary white text leaves, then uses the same native Inkscape selection for a transparent RGBA PNG. It emits editable Draw JSON/SVG, single-page BMFont XML, normalized/original manifests and artifact hashes. Fixed cells define advances and baseline; no font measurement, kerning, glyph-coverage guarantee or raster tracing is added. Input/output identity checks and owned staging guard publication and recognized overwrite. See [the lettering contract](font-atlas.md).

Validation checks data before rendering. Export completion checks that the renderer produced its expected artifacts. Neither proves that the result satisfies the design brief. Review the PNG for composition, clipping, transparency, and text; inspect the SVG structure or open it in Inkscape when layer editability matters. Keep the receipt with the exports for provenance. Distinguish checks actually run from checks that remain unverified.

## Group and animation boundary

Group IDs become stable `part-<id>` SVG IDs. Local pivot translation/rotation/scale composes through at most four group levels. Paint stays on leaves; group transforms carry local geometry and paint together. Validation bounds nodes, leaves, groups, tracks, keyframes, values, and rendered pixel counts. The existing static project contract remains compatible.

Animation sampling creates a fresh validated tree for each pose and replaces only targeted group properties with absolute track values. It does not mutate source geometry or import arbitrary SVG. Frames are static vector snapshots rendered to PNG by Inkscape. The native vector contact sheet reuses only generated SVG, namespaces its IDs, and is also rasterized by Inkscape; no extra raster library is required.

`animate` stages outputs and checks completion before replacing a destination. Overwrite requires an existing agent-draw animation receipt and only recognized generated files; input protection and explicit authorization still apply. A single bounded timeout covers export and encoding. Optional FFmpeg receives fixed arguments to encode existing PNG frames, not project-supplied commands. `AGENT_DRAW_FFMPEG` is authoritative when set; setup never installs it. MP4 flattens onto an explicit background, while GIF reduces alpha to a binary threshold and quantizes timing.

The animation receipt lists hashes, renderer/encoder versions, nominal fps and duration, sampled contact-sheet indexes, and canonical-SVG equality at a virtual loop endpoint. Structural seam equality cannot establish perceptual motion, velocity continuity, encoding fidelity, or player behavior. Review joints, hierarchy, crop, and the actual last-to-first playback transition separately; report unavailable playback as unverified.

## Game atlas boundary

The separate atlas manifest accepts bounded local static RGBA PNG frames beneath its own directory. It retains fixed canvas registration, semantic clip metadata and normalized anchors, copies inputs, then tiles with existing FFmpeg into a transparent sheet plus Phaser JSON hash metadata. Source SVG/project authoring is unchanged; raster inputs never enter vector renderSvg. No remote URLs, arbitrary XML, auto-generated directions or gameplay behavior are introduced. Frames and padded-sheet budgets, full deadline, source containment, output ownership, staged publication and receipts apply independently.

## Drawn-pose sequence boundary

The sequence manifest references bounded local static drawing projects. Each is validated independently, must share a canvas and omit timeline animation, and is rendered through isolated headless Inkscape. Retained original inputs, SVG/PNG frames, all-pose contact sheet and hashes preserve provenance. This is drawing replacement per frame, not path morphing or a new arbitrary SVG/script channel. Loop quality, joint anatomy and ground registration require art/engine review.
