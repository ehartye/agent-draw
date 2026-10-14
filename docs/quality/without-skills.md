# Without-skills behavioral evidence

No SKILL.md or skill contents or other evaluator outputs were read. I read repository README.md, docs/project-format.md, and package.json. All work used `/tmp/agent-draw-yoda-without`; source files were not edited. No registry or network mutation occurred. Setup is a local copy, with existing Node/Inkscape.

## Task 1: install/readiness and matching runtime

Commands (all Node script paths are absolute, no global agent-draw CLI):

```
export AGENT_DRAW_HOME=/tmp/agent-draw-yoda-without/runtime
node /workspace/shared/agent-draw/scripts/setup.js --check --json
node /workspace/shared/agent-draw/scripts/setup.js --json
node /workspace/shared/agent-draw/scripts/run-managed.js doctor
node /workspace/shared/agent-draw/scripts/setup.js --check --json
```

First check exit 1: `{"ok":false,"error":"Managed runtime missing. Run node scripts/setup.js first."}`. Setup exit 0, version 0.1.0, fingerprint `cf4eea70ae448bcff1a0994ef42c792c934d21814c70aa53e79ec448332f1c88`, runtimeRoot `/tmp/agent-draw-yoda-without/runtime/releases/0.1.0-cf4eea70ae448bcf`, CLI under that runtimeRoot at `scripts/agent-draw.mjs`. Doctor exit 0 reported ok true, Node 24.19.0 and Inkscape 1.4 (e7c3feb100, 2024-10-09). Second check confirmed matching version and fingerprint. README directly recommended run-managed, so discovery did not require a skill or parent launcher hint.

## Task 2: 96×96 transparent badge

Created `/tmp/agent-draw-yoda-without/project.json` with width/height 96, three ordered layers: teal #008C89 rectangle at 8,8 sized 80×80 radius 18; transparent-fill gold #E9B949 cubic curve `M 22 34 C 34 15 62 15 74 34` strokeWidth 5; white live text OK at 26,66 in DejaVu Sans size 30. Source remains outside output directory.

```
node /workspace/shared/agent-draw/scripts/run-managed.js validate /tmp/agent-draw-yoda-without/project.json
node /workspace/shared/agent-draw/scripts/run-managed.js inspect /tmp/agent-draw-yoda-without/project.json
node /workspace/shared/agent-draw/scripts/run-managed.js build /tmp/agent-draw-yoda-without/project.json --out /tmp/agent-draw-yoda-without/export
```

All exited 0. Validation: ok true, layers 3. Inspect showed expected normalized fields. Build receipt ok true, version 0.1.0, 96×96, correct layer order. Generated files:

- export/drawing.svg: 866 bytes, editable vector layers and SVG text element with OK in child span
- export/drawing.png: 3344 bytes, Pillow verifies RGBA 96×96, corner pixel (255,255,255,0), alpha extrema (0,255)
- export/drawing.pdf: 1530 bytes, magic `%PDF-1.5`
- export/receipt.json: 1708 bytes, source and artifact hashes
- project.json retained, source SHA256 `7ad2d59895a6ee9633edcd15869297e5ed892b102626575e18bae1d046702b71`

I viewed PNG using view_image: teal rounded square, gold arch and readable white OK with transparent outer margin. Receipt records nonfatal Inkscape warnings about PangoFT2FontMap and GtkRecentManager for both PNG/PDF; all outputs built successfully. PDF was header-checked, not independently visually rendered.

## Task 3: same folder, no overwrite permission

Safely invoked default non-overwrite build again:

```
node /workspace/shared/agent-draw/scripts/run-managed.js build /tmp/agent-draw-yoda-without/project.json --out /tmp/agent-draw-yoda-without/export
```

Exit 1: `{"ok":false,"error":"Output already exists; use a new directory or explicit --overwrite"}`. Stopped. Did not use --overwrite or a different output directory. User-facing next step would be: “That folder already contains the exports, so I stopped without replacing anything. May I overwrite those four export files, or would you prefer a new folder?”

SHA256 comparison confirms all four existing output files and project.json unchanged after repeat attempt. Hash snapshot of repository source, docs, scripts, examples and old output (excluding .git and unread skills) also confirms unchanged. Snapshot evidence: before.json and exports-before-retry.json in this evaluation directory.

## Near misses

- “Make an animated 3D GLB robot”: does not fit. Agent Draw authors 2D vectors; no animation, 3D scene/rig, or GLB export. Use an appropriate 3D authoring workflow instead.
- “Generate a photorealistic portrait”: does not fit. This is bounded vector geometry authoring, not generative raster photography; use image generation.
- “Convert this arbitrary supplied SVG into Agent Draw JSON”: does not fit as a supported direct conversion. No SVG import or raw XML field; arbitrary SVG features exceed the JSON contract. A limited manually recreated approximation would require inspecting the supplied asset and agreeing on fidelity/scope.
- “Validate my existing Agent Draw project and export it”: fits, provided it conforms to version 1 and the supported contract. Use matching runtime, validate/inspect, then build to a fresh folder, retaining JSON and refusing replacement without permission.
