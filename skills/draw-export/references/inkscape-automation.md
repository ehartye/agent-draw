# Inkscape CLI and Python API quick reference

Use Draw's managed `build`, `sequence`, `animate`, `atlas` and `font-atlas` commands for Draw projects. Use the native interfaces below for SVG inspection, native export and extension development.

Validated baseline: Inkscape **1.4.3**, bundled **inkex 1.4.0**, Windows console executable. Reviewed 2026-10-16. Inkscape 1.4.4 is the current stable release; this guide's recipes use the installed 1.4.3 interfaces.

## Choose the interface

| Task | Interface | Entry point |
| --- | --- | --- |
| Render existing SVG to PNG/PDF/SVG | Native CLI | `inkscape --export-filename=... input.svg` |
| Inspect object bounds | Native CLI | `--query-all`, `--query-id`, geometry flags |
| Select, transform, convert or export several times | Actions | `--actions`, `--actions-file` |
| Process several documents in one process | Shell | `--shell`, action lines on stdin |
| Read/edit SVG objects, paths, styles and transforms in Python | `inkex` API | `load_svg`, element classes, `Path`, `Style`, `Transform` |
| Add an Extensions menu operation | Python extension | `EffectExtension` plus an `.inx` descriptor |
| Invoke native rendering from Python | `inkex.command` | `inkscape(...)`, `inkscape_command(...)` |

## Select the executable and sample

PowerShell examples use the existing installation and the bundled sample. Set `$drawPlugin` to the loaded plugin root; run from your project directory.

```powershell
$ink = 'C:/Program Files/Inkscape/bin/inkscape.com'
$sample = Join-Path $drawPlugin 'examples/inkscape-automation'
$svg = (Join-Path $sample 'input.svg').Replace('\', '/')
$out = (Join-Path $PWD.Path 'output/inkscape-cli').Replace('\', '/')
New-Item -ItemType Directory -Path $out -Force | Out-Null
& $ink --version
```

On Linux, select the installed `inkscape` executable; the long options are the same. Quote complete arguments containing spaces, semicolons or color values. With a subprocess library, pass an argument array directly.

## Inspect the installation

| Command/option | Result |
| --- | --- |
| `--version` | Application version/build |
| `--help` | Application options |
| `--help-all` | Application, GApplication and GTK options |
| `--debug-info` | Build, dependency and operating-system diagnostics |
| `--action-list` | Action IDs and descriptions available in this installation |
| `--list-input-types` | Available import extensions |
| `--system-data-directory` | Installed resources, including core extensions |
| `--user-data-directory` | User profile/resources directory |

```powershell
& $ink --action-list | Select-String 'select-|transform-|object-to-path|export-'
& $ink --system-data-directory
```

## Export recipes

```powershell
# Full page, transparent background, original canvas dimensions.
& $ink $svg --export-area-page --export-background-opacity=0 `
    "--export-filename=$out/page.png"

# Exact raster width; aspect ratio follows the export area.
& $ink $svg --export-area-page --export-width=128 `
    "--export-filename=$out/half-size.png"

# PDF and plain SVG.
& $ink $svg --export-area-page "--export-filename=$out/page.pdf"
& $ink $svg --export-plain-svg "--export-filename=$out/plain.svg"

# Tight bounds of one object, hiding all other objects.
& $ink $svg --export-id=hero --export-id-only `
    "--export-filename=$out/hero.png"
```

| Option | Meaning |
| --- | --- |
| `--export-area-page` | Keep the page canvas; useful for registered animation frames |
| `--export-area-drawing` | Tight bounds around the drawing |
| `--export-id=hero` | Use the object's bounds; other objects may appear within those bounds |
| `--export-id-only` | Hide other objects during export |
| `--export-id="hero;occluder"` | Separate exports for the semicolon-separated IDs |
| `--export-width`, `--export-height` | Raster pixels; override DPI |
| `--export-dpi=96` | Raster resolution; 96 is the default |
| `--export-background="#ffffff"`, `--export-background-opacity=1` | Opaque bitmap background |
| `--export-type=png,pdf` | Export multiple formats using names derived from the input |
| `--export-page=1` | Select a page for export |
| `--pages=1` | Select a page during multipage import |
| `--export-text-to-path` | Outline text for SVG/PDF/PS/EPS export |

Write generated files into a dedicated output directory. `--export-overwrite` permits replacement of the input file; Draw's `--overwrite` instead controls its generated output directory. Keep source SVGs separate from generated exports.

## Query geometry

```powershell
& $ink $svg --query-all
& $ink $svg '--query-id=hero,occluder' --query-width
& $ink $svg --query-id=hero --query-x
& $ink $svg --query-id=hero --query-y
& $ink $svg --query-id=hero --query-height
```

`--query-all` returns `id,x,y,width,height` rows. `--query-x`, `--query-y`, `--query-width` and `--query-height` return SVG user-unit/px values. Query IDs are comma-separated; multiple IDs return values in the requested order. A query without an ID measures the drawing bounds. Read page size/viewBox from the SVG when you need the canvas.

The bundled `hero` rectangle has x=16, y=24, width=64, height=80. The `occluder` has width=64. The page is 256 by 192.

## Actions and reusable processes

Actions use `name:argument`, separated by semicolons. Use the IDs printed by `--action-list`. Export actions use names such as `export-id`, `export-filename`, `export-width` and `export-do`.

```powershell
$actions = "export-id:hero;export-id-only;export-filename:$out/action-hero.png;export-do"
& $ink $svg --export-type=png "--actions=$actions"

# An actions file uses the same semicolon-separated text.
$actionsFile = Join-Path $out 'export.actions'
[IO.File]::WriteAllText($actionsFile, $actions)
& $ink $svg --export-type=png "--actions-file=$actionsFile"

# One process, one action line: open a document, export it, close it.
$line = "file-open:$svg;export-area-page;export-filename:$out/shell-page.png;export-do;file-close"
$line | & $ink --shell
```

The export option selects headless export mode for the action recipes above. `export-do` exports at that point in the action sequence. Export settings remain in effect until changed, so set the filename, area and object selection for each intended output. `--actions-file` takes precedence over `--actions`. `--batch-process` exits after actions complete; `--with-gui` enables the interface for an operation that needs it. `--active-window` targets the currently focused document when deliberately editing an open session.

`INKSCAPE_PROFILE_DIR` selects a profile directory. `--app-id-tag=TAG` separates application instances. Draw already creates a separate profile for each native build.

## Python API

`inkex` supplies the SVG object model and extension framework. It ships with Inkscape's core extensions. Use an interpreter with those modules and their dependencies available. This Windows installation includes `bin/python.exe`.

```powershell
$inkPython = Join-Path (Split-Path $ink) 'python.exe'
$data = (& $ink --system-data-directory).Trim()
$extensions = Join-Path $data 'extensions'
$env:PYTHONPATH = $extensions + [IO.Path]::PathSeparator + $env:PYTHONPATH
$env:INKSCAPE_COMMAND = $ink
& $inkPython -c 'import inkex; print(inkex.__version__)'
```

| API | Use |
| --- | --- |
| `inkex.load_svg(path)` | Parse an SVG into an element tree |
| `tree.getroot().getElementById(id)` | Find a named element |
| `element.style['fill'] = color` | Edit a style property |
| `inkex.Path`, `inkex.Transform` | Construct path geometry and transforms |
| `inkex.EffectExtension.effect()` | Implement an SVG-editing extension |
| `self.svg.selection` | Elements selected for the extension |
| `inkex.command.inkscape(path, **options)` | Run native Inkscape and return stdout |
| `inkex.command.inkscape_command(svg, actions=...)` | Apply native actions to SVG and return SVG |

The bundled examples can run directly without installing a menu extension:

```powershell
& $inkPython (Join-Path $sample 'recolor.py') $svg "$out/recolored.svg"
& $inkPython (Join-Path $sample 'export.py') $svg "$out/python-page.png"
& $inkPython (Join-Path $sample 'tint_selected.py') --id=hero `
    "--output=$out/extension.svg" $svg
```

`recolor.py` edits an SVG through `inkex`. `export.py` calls native rendering through `inkex.command`. `tint_selected.py` demonstrates `EffectExtension`; its matching `.inx` describes the interpreter, extension ID and Extensions menu placement. To install that menu example, copy the Python and INX files together into the user's extensions directory and restart Inkscape.

Native SVG/API edits are separate editable documents. For a Draw project, make the corresponding change in JSON before rebuilding.

## Current API documentation

- [Inkscape 1.4.3 CLI manual](https://gitlab.com/inkscape/inkscape/-/raw/0d15f7504220b00925bc3cb3673fcf44610a17d5/man/inkscape.pod.in)
- [inkex extension classes](https://inkscape.gitlab.io/extensions/documentation/source/inkex.extensions.html)
- [inkex command API](https://inkscape.gitlab.io/extensions/documentation/source/inkex.command.html)
- [INX descriptor format](https://inkscape.gitlab.io/extensions/documentation/authors/inx-overview.html)
