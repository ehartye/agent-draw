# agent-draw

Layered 2D authoring for coding agents, backed by **Inkscape**. Describe a drawing in a small, validated JSON project; build an editable SVG, transparent PNG, and PDF using Inkscape's headless export interface.

This is the 0.2.0 craft-enabled implementation. It does not require a browser, an MCP server, or npm dependencies. It does require an existing Inkscape 1.2 or newer installation and Node.js 22 or newer. Linux is the initial verification target; macOS and Windows support is not yet established.

## What it does

- Creates named rectangle, ellipse, polygon, text, and path layers with solid or bounded gradient fills, true cutouts, and deliberate stroke caps/joins.
- Preserves layer order, visibility, and opacity in an editable SVG with named Inkscape layers.
- Exports a composited PNG with transparency, a PDF, and a machine-readable build receipt.
- Validates projects before launching Inkscape, including bounded canvas/layer sizes and restricted path data.
- Uses a version-matched managed runtime and a separate Inkscape profile for each build.

It is deliberately a small authoring contract, not a general-purpose scripting interface. No arbitrary scripts, shell commands, embedded raster images, filters, masks, or animation are accepted in project data.

## Quick start

From this checkout:

```sh
node scripts/setup.js --check --json
# If the managed runtime is missing, install the local runtime:
node scripts/setup.js --json
node scripts/run-managed.js doctor --smoke
node scripts/run-managed.js validate project.json
node scripts/run-managed.js inspect project.json
node scripts/run-managed.js build project.json --out ./output/my-drawing
```

Setup copies the matching plugin runtime into the user cache. It does not install Inkscape or download dependencies. A failed `--check` on first use means setup may be needed; read the reported error before proceeding. Agents should resolve the plugin's absolute path from the loaded skill rather than assuming the user's current directory is the plugin checkout.

Try the included vector demo after setup:

```sh
node scripts/run-managed.js validate examples/orbit-robot.json
node scripts/run-managed.js build examples/orbit-robot.json --out output/orbit-robot
```

Save this as `project.json`:

```json
{
  "version": 1,
  "name": "simple-badge",
  "width": 512,
  "height": 512,
  "layers": [
    {
      "name": "badge",
      "type": "ellipse",
      "x": 56,
      "y": 56,
      "width": 400,
      "height": 400,
      "color": "#187DAB",
      "opacity": 100,
      "visible": true
    },
    {
      "name": "highlight",
      "type": "rectangle",
      "x": 152,
      "y": 232,
      "width": 208,
      "height": 48,
      "color": "#FFFFFF",
      "opacity": 100,
      "visible": true
    }
  ]
}
```

Layers run **bottom to top** in the JSON array. Coordinates use pixels, with the origin at the top left. The canvas starts transparent; add a full-canvas rectangle for an opaque background.

## Outputs and overwrite safety

A successful build writes:

| File | Purpose |
| --- | --- |
| `drawing.svg` | Editable vector document with named Inkscape layers |
| `drawing.pdf` | PDF export from Inkscape |
| `drawing.png` | Flattened visible composition with alpha |
| `receipt.json` | Build provenance and output information |

PDF export converts text to outlines for portability. The SVG keeps live text editable; its appearance still depends on installed fonts.

Choose a fresh output directory. An existing directory is refused by default. `--overwrite` explicitly permits replacement, so never point it at a directory containing unrelated work. Input protection still applies. Keep project JSON outside the output directory.

```sh
node scripts/run-managed.js build project.json --out ./output/my-drawing --timeout 120
# Only when replacement is intended:
node scripts/run-managed.js build project.json --out ./output/my-drawing --overwrite
```

Keep the project JSON alongside the outputs when delivering a rebuildable asset. Manual edits in an exported SVG are not imported back into project JSON; rebuilding regenerates from the JSON source.

## Agent plugin layout

The `.claude-plugin/` and `.codex-plugin/` metadata and `skills/` directory follow a skill-first plugin layout, with three workflows:

- [draw-setup](skills/draw-setup/SKILL.md): check and prepare the matching runtime.
- [draw-authoring](skills/draw-authoring/SKILL.md): author and validate project data.
- [draw-export](skills/draw-export/SKILL.md): build, inspect, and deliver SVG/PNG/PDF artifacts.

The plugin is prepared for the [Hartye Plugins marketplace](https://github.com/ehartye/hartye-claude-plugins). The initial release is listed; this checkout may contain a newer feature version pending review. Install the published version with:

```sh
# Claude Code
/plugin marketplace add ehartye/hartye-claude-plugins
/plugin install agent-draw@hartye-plugins
# Then run /agent-draw:draw-setup

# Codex
codex plugin marketplace add ehartye/hartye-claude-plugins
codex plugin add agent-draw@hartye-plugins
# Then use draw-setup
```

Setup requires an already installed Inkscape 1.2+ and Node 22+. It never downloads a browser or renderer.

## Documentation

- [Project format](docs/project-format.md)
- [Architecture and safety boundaries](docs/architecture.md)
- [Roadmap and limitations](docs/roadmap.md)

MIT licensed. Inkscape is a separate external dependency with its own license.

## Development and verification

```sh
npm test
npm run test:integration
```

The tests use Node's built-in test runner and no npm packages. Integration tests invoke the actual installed Inkscape CLI, decode PNG pixels, and check SVG/PDF structure. They skip explicitly if Inkscape is absent; install it before claiming an integration pass. See [quality evidence](docs/quality/yoda-audit.md) for the skill audit and measured limitations.


## Vector art craft

The [draw-authoring skill](skills/draw-authoring/SKILL.md) selects direct references for six styles: flat pictograms, monoline illustration, isometric/low-poly geometry, cel-shaded mascots, hard-edged paper-cut landscapes, and gradient editorial illustration. References explain construction, visual tradeoffs, common mistakes, and size/background checks; they distinguish practical art heuristics from SVG mechanics.

Six original, editable [style projects](examples/styles/) demonstrate the supported techniques. For example:

```sh
node scripts/run-managed.js build examples/styles/monoline.json --out output/monoline
node scripts/run-managed.js build examples/styles/gradient-editorial.json --out output/gradient-editorial
```

The JSON format adds bounded gradient fills, even-odd cutouts, and cap/join choices. It still does not import arbitrary SVG, animate, or expose arbitrary XML, filter effects, or scripts. Old version-1 projects remain accepted.

### Verify or locate Inkscape

Setup probes the selected executable and reports missing, too-old, broken, or unrecognized installations separately. `doctor --smoke` verifies actual temporary SVG/PNG/PDF export. An explicit `AGENT_DRAW_INKSCAPE` override is never silently ignored. Errors include the detected version, minimum version, attempted path, and [official installation advice](https://wiki.inkscape.org/wiki/Installing_Inkscape). Installation is not automatic. Only Linux has been exercised by this project.
