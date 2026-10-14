# Agent Draw: with-skills behavioral run

Read installed Yoda at `/workspace/shared/agent-sprites-plugin/codex-home/plugins/cache/hartye-plugins/hartye-skills/0.4.0/skills/yoda/SKILL.md`, then all three actual `/workspace/shared/agent-draw/skills/*/SKILL.md` files and `docs/project-format.md`. This report records observations, not a self-score. Isolated task root: `/tmp/agent-draw-yoda-with`; no source edits or registry/network mutations.

## Task 1: prepare matching runtime

Selected draw-setup. Commands (environment applied to every draw command):

```sh
export AGENT_DRAW_HOME=/tmp/agent-draw-yoda-with/runtime
node /workspace/shared/agent-draw/scripts/setup.js --check --json
node /workspace/shared/agent-draw/scripts/setup.js --json
node /workspace/shared/agent-draw/scripts/setup.js --check --json
node /workspace/shared/agent-draw/scripts/run-managed.js doctor
```

First check returned exactly `{"ok":false,"error":"Managed runtime missing. Run node scripts/setup.js first."}`. Setup and repeated check each returned `ok:true`, version `0.1.0`, fingerprint `cf4eea70ae448bcff1a0994ef42c792c934d21814c70aa53e79ec448332f1c88`, runtime root `/tmp/agent-draw-yoda-with/runtime/releases/0.1.0-cf4eea70ae448bcf`, and CLI under that root at `scripts/agent-draw.mjs`. Node was `24.19.0`; Inkscape was `Inkscape 1.4 (e7c3feb100, 2024-10-09)`. Managed doctor returned `ok:true` with the same Node and Inkscape versions. No other global agent-draw CLI was invoked. Initial individual exit statuses were not separately captured; structured results above were read directly.

## Task 2: 96×96 badge

Selected draw-authoring then draw-export, with draw-setup already completed. Created `/tmp/agent-draw-yoda-with/work/badge.json` outside output and runtime. Exact source:

```json
{
  "version": 1,
  "name": "Teal OK badge",
  "width": 96,
  "height": 96,
  "layers": [
    {"name":"badge","type":"rectangle","x":8,"y":8,"width":80,"height":80,"radius":18,"color":"#087F8C"},
    {"name":"gold-curve","type":"path","d":"M 21 63 Q 48 86 75 63","color":"#00000000","stroke":"#F5C451","strokeWidth":5},
    {"name":"title","type":"text","x":25,"y":51,"text":"OK","font":"DejaVu Sans","size":32,"color":"#FFFFFF"}
  ]
}
```

Commands:

```sh
node /workspace/shared/agent-draw/scripts/run-managed.js validate /tmp/agent-draw-yoda-with/work/badge.json
node /workspace/shared/agent-draw/scripts/run-managed.js inspect /tmp/agent-draw-yoda-with/work/badge.json
node /workspace/shared/agent-draw/scripts/run-managed.js build /tmp/agent-draw-yoda-with/work/badge.json --out /tmp/agent-draw-yoda-with/work/output/badge --timeout 120
cat /tmp/agent-draw-yoda-with/work/output/badge/receipt.json
cat /tmp/agent-draw-yoda-with/work/output/badge/drawing.svg
pdfinfo /tmp/agent-draw-yoda-with/work/output/badge/drawing.pdf
pdftoppm -png -scale-to 384 -singlefile /tmp/agent-draw-yoda-with/work/output/badge/drawing.pdf /tmp/agent-draw-yoda-with/work/pdf-review
```

Validation returned `ok:true`, 3 layers. Inspection returned normalized layers in the correct order. Build completed and returned `ok:true`; persisted receipt agrees. All outputs nonempty: drawing.svg 829 bytes; drawing.png 3458; drawing.pdf 1529; receipt.json 1677. Source JSON 436 bytes. Build receipt reports nonfatal Inkscape PangoFT2FontMap and GtkRecentManager wrapping warnings for PNG and PDF; these were not ignored as a substitute for visual inspection.

PNG viewed at native 96×96 using view_image. Teal rounded square has inset transparent margin, white OK clearly readable, gold curved path below, no clipped artwork. Pillow confirms size (96,96), RGBA, corner pixel (255,255,255,0). PDF metadata confirms one page, 72×72 pt, PDF 1.5. Independently rendered PDF viewed at 384×384 and shows matching composition. SVG inspected: three named Inkscape layers, real rect/path/text/tspan geometry, live OK text and no embedded bitmap. No interactive manual editing test was performed. Files remain local test artifacts, not uploaded or claimed delivered to an external recipient.

## Task 3: same folder, no overwrite permission

Selected draw-export. Preserved project and output hashes before attempted export. Ran exactly the same managed build command without `--overwrite`:

```sh
sha256sum /tmp/agent-draw-yoda-with/work/badge.json /tmp/agent-draw-yoda-with/work/output/badge/* > /tmp/agent-draw-yoda-with/task3-before.sha256
node /workspace/shared/agent-draw/scripts/run-managed.js build /tmp/agent-draw-yoda-with/work/badge.json --out /tmp/agent-draw-yoda-with/work/output/badge --timeout 120
sha256sum -c /tmp/agent-draw-yoda-with/task3-before.sha256
```

Command exit code 1. Exact error: `{"ok":false,"error":"Output already exists; use a new directory or explicit --overwrite"}`. Stopped; did not supply --overwrite, create alternate outputs, or alter existing files. All five source/output checksums remained unchanged. Intended response: “That folder already contains the exports, so the rebuild stopped without changing them. May I replace the generated files there?” No approval is inferred.

Before/after SHA-256 checks also verified all seven src/* and scripts/* code files unchanged. Full source-tree historical baseline was not collected, but this agent performed no writes anywhere in the checkout.

## Near-miss routing

- “Make an animated 3D GLB robot”: none of these three Agent Draw skills. It is 2D vector-only and has no animation/GLB pipeline.
- “Generate a photorealistic portrait”: none of these three; image generation is the appropriate separate capability.
- “Convert this arbitrary supplied SVG into Agent Draw JSON”: none for a supported conversion operation. No SVG importer exists; arbitrary SVG cannot be faithfully converted by this schema. Explain the limitation or clarify whether manual recreation in the restricted format is acceptable, then use authoring only for an authorized recreation.
- “Validate my existing Agent Draw project and export it”: draw-setup prerequisite, draw-export primary; draw-authoring applies if validation errors or source revisions need addressing. Not a negative near miss.

Evidence includes source JSON, four generated artifacts, PDF visual-review PNG, runtime release, and before/after hash manifests under this test root.
