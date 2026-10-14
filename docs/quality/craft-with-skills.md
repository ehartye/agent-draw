# With-skills paired evaluation evidence

Completed independently; no paired-run output consulted, no repository source edits, no numerical self-score. Workspace: `/tmp/agent-draw-craft-yoda-with`. Plugin root: `/workspace/shared/agent-draw-worktrees/craft`. All Agent Draw commands used the managed launcher with `AGENT_DRAW_HOME=/tmp/agent-draw-craft-yoda-with/runtime`.

## Loaded instructions

Read installed Hartye Yoda SKILL.md at `/workspace/shared/agent-sprites-plugin/codex-home/plugins/cache/hartye-plugins/hartye-skills/0.4.0/skills/yoda/SKILL.md`.
Read craft skills `draw-setup`, `draw-authoring`, `draw-export`; directly read fundamentals, flat-pictogram, monoline, gradient-editorial references and `docs/project-format.md`. Read cel-shaded-mascot for routing check. Followed bounded JSON contract; did not infer GUI capabilities.

## Setup commands and outcomes

From plugin root, with isolated AGENT_DRAW_HOME:

1. `node "$PWD/scripts/setup.js" --check --json`: first-run expected failure, managed runtime missing. Captured `evidence/setup-first.json`.
2. `node "$PWD/scripts/setup.js" --json`: prepared runtime 0.2.0 fingerprint c5edafb347d5e302fcc88a98ce6325783da97495640ad3f41f82238ba6865945. Captured `evidence/setup.json`.
3. `node "$PWD/scripts/setup.js" --check --json`: success. Captured `evidence/setup-check.json`.
4. `node "$PWD/scripts/run-managed.js" doctor --smoke`: ok true; Inkscape 1.4, real SVG/PNG/PDF smoke verified. Captured `evidence/doctor.json`.

No software installed. Setup only prepared managed local runtime. Initial failed check was not misrepresented as a rendering failure.

## Task 1: flat transparent lantern

Brief: 128px flat dark teal lantern badge with clear handle/window negative space and one small gold flame; review at 32px as smallest use size. Margin roughly 10px top and 16px bottom. Built handle as an open-bottom contour closed by roof; window is a compound even-odd path. No white paint simulates holes.

Source: `projects/flat-lantern.json`.
Deliverables: `outputs/flat-lantern/drawing.svg`, `drawing.png`, `drawing.pdf`, `receipt.json`.

## Task 2: monoline and gradient editorial

Monoline brief: same subject simplified to 5px dark teal centerlines, transparent fills, explicitly round caps/joins throughout, no tiny decorations. Open handle endpoints and base rail show rounded terminals. Source: `projects/monoline-lantern.json`; exports in `outputs/monoline-lantern/`.

Editorial brief: quiet warm-paper square, muted directional teal frame gradient, a restrained two-stop radial glass fill, solid amber flame as focal mark. Only supported structured fill gradients, canvas-space coordinates. Source: `projects/editorial-lantern.json`; exports in `outputs/editorial-lantern/`.

### Exact authoring/build commands

Geometry creation is fully reproduced by `create-projects.py`, invoked as:
`python /tmp/agent-draw-craft-yoda-with/create-projects.py`

Executed `bash -x /tmp/agent-draw-craft-yoda-with/build.sh`; all expanded commands recorded in `evidence/build-commands.log`. Script loops over flat-lantern, monoline-lantern, editorial-lantern and invokes:

- `node /workspace/shared/agent-draw-worktrees/craft/scripts/run-managed.js validate /tmp/agent-draw-craft-yoda-with/projects/NAME.json`
- `node /workspace/shared/agent-draw-worktrees/craft/scripts/run-managed.js inspect /tmp/agent-draw-craft-yoda-with/projects/NAME.json`
- `node /workspace/shared/agent-draw-worktrees/craft/scripts/run-managed.js build /tmp/agent-draw-craft-yoda-with/projects/NAME.json --out /tmp/agent-draw-craft-yoda-with/outputs/NAME --timeout 120`

All succeeded on first authored iteration; no overwrite, fallback renderer, or unsupported fields. Per-drawing validation, inspection and build output in `evidence/NAME-{validate,inspect,build}.json`.

### QA performed

Read all receipts: ok true. All 12 output files nonempty. `qa.py` verifies receipt artifact hashes against disk, PNG size 128×128, SVG layer counts, no embedded raster images, stroke attrs and gradient defs; results `evidence/qa.json`.

Flat PNG alpha samples: background (0,0)=0; handle opening (64,25)=0; window (48,70) and (64,60)=0; flame (64,87)=(223,165,44,255); frame (34,80)=(24,62,73,255). SVG has four named layers. Monoline has five named layers and all five paths use 5px strokes, round caps, round joins. Editorial has six layers, two native linear gradient definitions and one radial, all userSpaceOnUse.

Executed for each NAME:
`pdftoppm -scale-to 128 -png -singlefile /tmp/agent-draw-craft-yoda-with/outputs/NAME/drawing.pdf /tmp/agent-draw-craft-yoda-with/evidence/NAME-pdf`
Then `python /tmp/agent-draw-craft-yoda-with/qa.py`.

Visually inspected `evidence/review-sheet.png` with image viewer: original 128px PNGs on white/dark backgrounds, true-size 32px previews, independently rendered PDFs. Shapes remain recognizable at 32px; no clipped edges observed. Monoline flame cavity and handle gap remain visible. Editorial subtle transitions and silhouette visible in PDF as well as PNG. Dark teal is deliberately low contrast on the dark QA background; no claim of universal-background contrast. Dark backdrop confirms transparent openings. No geometry revisions were made after inspection.

Checks are structural and rendered-image checks, not a manual Inkscape editing test. SVG layers/paths/paint definitions remain editable structure; actual GUI editing was not tested. Local files prepared for evaluator; no remote delivery claim.

Warnings: every real export returned nonfatal PangoFT2FontMap and GtkRecentManager wrapper warnings, recorded in receipts. Commands succeeded, artifacts/hash checks passed and rendered outputs were reviewed. No warnings hidden or treated as errors requiring installation.

## Task 3: explicit missing-executable override

Set `AGENT_DRAW_INKSCAPE=/tmp/agent-draw-craft-yoda-with/missing-inkscape` for diagnostics. Full exact commands, selected value and exit statuses in `diagnose.sh` and `evidence/diagnostic-commands.log`; structured outputs retained separately in `evidence/override-setup.json` and `evidence/override-doctor.json`.

Commands: setup --check --json and managed doctor; ls -l on exact selected path; command -v inkscape for read-only candidate discovery. Repeated diagnostics only to capture explicit statuses. Setup and doctor exit 1. Selected path does not exist, ls exit 2. Doctor reports `status: missing`, `explicitOverride: true`, exactly one attempted executable, ENOENT. PATH contains `/usr/bin/inkscape`; did not invoke that candidate after override, did not unset/change override, did not build under the broken configuration, did not install anything.

User-facing diagnostic/advice: “Agent Draw is trying the explicitly selected executable `/tmp/agent-draw-craft-yoda-with/missing-inkscape`, which does not exist (ENOENT). Inkscape is also present on PATH at `/usr/bin/inkscape`, and the earlier successful smoke test used Inkscape 1.4. This is a selected-path problem rather than evidence that Inkscape needs installing. Confirm the executable you want Agent Draw to use, then update the override to that path and rerun setup check and doctor --smoke. I have not changed your selection or installed software.”

Noted limitation in tool advice: its missing status generic prose recommends installing despite explicitOverride=true. Used structured attempted executable and known successful earlier renderer evidence to avoid repeating misleading installation advice.

## Near-miss routing decisions

- “Animate an SVG arm wave”: do not run draw-authoring/export as an animation solution. This runtime exposes no animation or SVG import. Route to a suitable animation/SVG code workflow; Agent Draw could only help produce static artwork if separately requested. No build executed for this near-miss.
- “Import arbitrary SVG and preserve every effect”: do not claim supported roundtrip/import. Project JSON has no SVG-import/raw XML fields; filters, masks and arbitrary transforms/effects are outside exposed schema. Route to native SVG-preserving tooling, retaining the original. No conversion or lossy replacement attempted.
- “Build a cel-shaded vector mascot”: this is a positive boundary case, not a rejection. Load setup + authoring, fundamentals + cel-shaded-mascot reference, then export for deliverables. Use a recognizable silhouette, expressive face and hard bounded shadow contours; no mask/clip/blur/boolean assumptions. Read the matching reference to confirm this routing; did not build an unrequested fourth illustration.
