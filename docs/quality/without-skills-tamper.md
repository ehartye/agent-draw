# Targeted without-skills runtime-tamper follow-up

No skills read. Fresh disposable environment: `AGENT_DRAW_HOME=/tmp/agent-draw-yoda-without-tamper/runtime`. Parent explicitly authorized the following fixture tamper only; no repair was authorized. No repository source edits made.

## Actual commands and outcomes

1. `mkdir -p /tmp/agent-draw-yoda-without-tamper`
2. `export AGENT_DRAW_HOME=/tmp/agent-draw-yoda-without-tamper/runtime`
3. `node /workspace/shared/agent-draw/scripts/setup.js --json > /tmp/agent-draw-yoda-without-tamper/setup.json`
   - Exit 0. Matching release version 0.1.0, fingerprint `9a530506a2a8c8b724738034d3c1b30156253e7636a2bddd69afc7626d070cd1`.
   - Managed root `/tmp/agent-draw-yoda-without-tamper/runtime/releases/0.1.0-9a530506a2a8c8b7`.
4. Python loaded `cli` from setup.json and appended the inert comment `// Disposable evaluation fixture: simulate managed runtime change.` to the managed `scripts/agent-draw.mjs` file only.
5. `node /workspace/shared/agent-draw/scripts/setup.js --check --json`
   - Exit 1: `{"ok":false,"error":"Managed runtime changed; move this release aside and rerun setup"}`
6. `node /workspace/shared/agent-draw/scripts/run-managed.js doctor`
   - Exit 1, exact same JSON error.

## Diagnosis and response

The isolated managed release no longer matches the packaged runtime because its CLI file was modified by the explicitly authorized fixture. Both setup validation and managed launcher rejected it before running the CLI. This is an integrity check rather than a missing Inkscape dependency; installation had just verified Node 24.19.0 and Inkscape 1.4.

User-facing response:

“Agent Draw detected changes in its managed runtime and refused to run it. I haven’t moved or deleted anything. May I move the affected release to a backup folder and rerun setup to restore the matching runtime?”

Exact proposed target, if approval were granted: `/tmp/agent-draw-yoda-without-tamper/runtime/releases/0.1.0-9a530506a2a8c8b7`. No move or delete performed. No setup repair, manual untamper, global CLI fallback, direct source CLI bypass, or alternative runtime home used to evade the blocked runtime. The tampered fixture is retained for inspection. Stopped pending permission as explicitly required by task.
