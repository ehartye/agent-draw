# Behavioral evaluation without skills

## Scope and sources
Worked only in /tmp/agent-draw-craft-yoda-without; checkout /workspace/shared/agent-draw-worktrees/craft was read-only. Did not read any SKILL.md, skills directory contents, or paired-worker output. Read README.md, docs/project-format.md, docs/roadmap.md, package.json, and CLI help. Projects are original geometry, not copied examples. Runtime home was isolated as /tmp/agent-draw-craft-yoda-without/runtime.

## Deliverables
All files use the common root `/tmp/agent-draw-craft-yoda-without`:
- Task 1: flat-lantern.json; flat-lantern/drawing.svg, drawing.png, drawing.pdf, receipt.json.
- Task 2 monoline: monoline-lantern.json; monoline-lantern/drawing.svg, drawing.png, drawing.pdf, receipt.json.
- Task 2 editorial: editorial-lantern.json; editorial-lantern/drawing.svg, drawing.png, drawing.pdf, receipt.json.
- Diagnostics: diagnostics.log.
- Checks: checks.json, review.png, pdf-check.log, each output directory's pdf-review.png.
- Construction: create_projects.py contains complete exact original geometry and styles; check.py contains exact checking/compositing code. These scripts are evaluation files, not source changes.

## Commands performed
Working directory for commands: /workspace/shared/agent-draw-worktrees/craft.

Initial inspection: `pwd; ls -la; cat README.md`, then `cat docs/project-format.md; cat docs/roadmap.md; cat package.json; mkdir -p /tmp/agent-draw-craft-yoda-without`.

Runtime:
```
export AGENT_DRAW_HOME=/tmp/agent-draw-craft-yoda-without/runtime
node scripts/setup.js --check --json
node scripts/setup.js --json
node scripts/run-managed.js doctor --smoke
node scripts/run-managed.js --help
```
First check returned exit 1: managed runtime missing. Setup copied local runtime 0.2.0 into isolated home; Node 24.19.0 and Inkscape 1.4 detected. Doctor smoke passed SVG/PNG/PDF at 16x16. No software installation or downloads were performed.

Wrote create_projects.py using a shell heredoc, then executed:
```
python /tmp/agent-draw-craft-yoda-without/create_projects.py
export AGENT_DRAW_HOME=/tmp/agent-draw-craft-yoda-without/runtime
for name in flat-lantern monoline-lantern editorial-lantern; do
node scripts/run-managed.js validate /tmp/agent-draw-craft-yoda-without/$name.json > /tmp/agent-draw-craft-yoda-without/$name.validate.log 2>&1
node scripts/run-managed.js inspect /tmp/agent-draw-craft-yoda-without/$name.json > /tmp/agent-draw-craft-yoda-without/$name.inspect.log 2>&1
node scripts/run-managed.js build /tmp/agent-draw-craft-yoda-without/$name.json --out /tmp/agent-draw-craft-yoda-without/$name > /tmp/agent-draw-craft-yoda-without/$name.build.log 2>&1
cat /tmp/agent-draw-craft-yoda-without/$name.build.log
done
```
All validates, inspections, and builds succeeded on first attempt. No overwrite flag used; JSON remained outside output directories. Runtime reported nonfatal PangoFT2FontMap and GtkRecentManager warnings for exports. Receipt logs retain them.

Wrote check.py using a shell heredoc, then:
```
python /tmp/agent-draw-craft-yoda-without/check.py
command -v pdftoppm
for name in flat-lantern monoline-lantern editorial-lantern; do
pdfinfo /tmp/agent-draw-craft-yoda-without/$name/drawing.pdf | head -16
pdftoppm -scale-to 128 -singlefile -png /tmp/agent-draw-craft-yoda-without/$name/drawing.pdf /tmp/agent-draw-craft-yoda-without/$name/pdf-review
done > /tmp/agent-draw-craft-yoda-without/pdf-check.log 2>&1
cat /tmp/agent-draw-craft-yoda-without/pdf-check.log
```
Viewed review.png via image tool and editorial-lantern/pdf-review.png. Review shows full-size and 32px thumbnails on white, dark blue, and gray. No geometry clipping; simple silhouette and flame remain distinct on white/gray. Dark ink has weak contrast against dark blue, especially at thumbnail size. Deliver as light-background artwork; a light-ink variant would be needed for dark surfaces. No unrequested variant added.

## Task 1 construction and checks
Flat deep teal frame with compound even-odd window; handle has an open interior made from contour geometry. Neither opening uses a white cover-up. Small gold flame is the only interior opaque detail. PNG is 128x128 RGBA. Alpha probes: background (0,0), handle interior (64,23), window top (64,56), and window side (45,80) all alpha 0. Flame (64,88) is RGBA (230,163,38,255); frame (32,80) is (35,73,82,255). Four named SVG layers, no raster embedding. Nonempty alpha bounds (28,9,100,110).

## Task 2 construction and checks
Monoline uses transparent fill, identical 5px teal strokes, round linecap and round linejoin on every path. Deliberate gaps between cap, handle, and body keep shapes separate. SVG attributes confirmed all four paths share those stroke values. PNG 128x128; bounds (29,9,99,111). Editorial lantern uses a restrained two-color teal linear gradient on structural frame/cap and cream-to-warm-gold glass, with a solid rust-gold flame. Five named SVG layers; PNG 128x128; bounds (28,9,100,110). Editorial PDF rendered successfully and visually matches structure/colors. All PDFs parse as one unencrypted page at 96x96 points, corresponding to 128 CSS pixels at 96 dpi.

## Task 3 exact diagnostic commands and result
```
export AGENT_DRAW_HOME=/tmp/agent-draw-craft-yoda-without/runtime
export AGENT_DRAW_INKSCAPE=/tmp/agent-draw-craft-yoda-without/missing-inkscape
{ node scripts/setup.js --check --json; echo setup_exit=$?;
node scripts/run-managed.js doctor --smoke; echo doctor_exit=$?;
printf 'selected=%s\n' "$AGENT_DRAW_INKSCAPE";
command -v inkscape; inkscape --version;
ls -l "$AGENT_DRAW_INKSCAPE";
printf 'selected_after=%s\n' "$AGENT_DRAW_INKSCAPE";
} > /tmp/agent-draw-craft-yoda-without/diagnostics.log 2>&1
cat /tmp/agent-draw-craft-yoda-without/diagnostics.log
```
Setup check and doctor both exit 1. Structured report: explicitOverride=true, status=missing, attempted only /tmp/agent-draw-craft-yoda-without/missing-inkscape, spawn ENOENT. That path does not exist. Independent `command -v` finds /usr/bin/inkscape; explicit `inkscape --version` returns 1.4. The version probe warns that its default profile directory is read-only, but reports its version; earlier isolated-profile export passed. Selected override is unchanged before/after. No installer, override clearing, executable switch, or build with alternate selection was attempted during this task.

Advice to user: Inkscape is already installed at /usr/bin/inkscape (1.4, meeting the 1.2 minimum). Agent Draw is pinned to a nonexistent executable through AGENT_DRAW_INKSCAPE, so the selected path fails despite an available PATH installation. If that override was accidental, you can unset it or update it to /usr/bin/inkscape, then rerun doctor --smoke. If it was intentional, restore the executable at that chosen path. I have left your selection untouched. The CLI's generic installation advice is not necessary for this diagnosed case.

## Near-miss routing decisions
- “Animate an SVG arm wave”: outside Agent Draw's static authoring/export contract. Explain it cannot animate; use a suitable SVG/CSS or animation workflow for actual movement. Agent Draw can supply static vector poses but should not claim to complete animation.
- “Import arbitrary SVG and preserve every effect”: unsupported; do not convert through restricted project JSON or promise round-trip preservation. Use an SVG-aware editor directly and verify preserved effects. Agent Draw rebuilds its own geometry and excludes filters/masks/unsupported effects.
- “Build a cel-shaded vector mascot”: within scope using named paths/polygons and hard-edged solid shadow shapes. Author an original bounded JSON composition, validate/build, inspect silhouette and small-size legibility, retain JSON and SVG/PNG/PDF. Do not route it to raster generation merely because it is a mascot. Actual additional mascot build was not requested for this evaluation.

No self-score assigned.
