# WITH-skill targeted FFmpeg retest

Initial report remains unchanged at /tmp/atlas-eval-with/report.md. This retest covers only the corrected atlas failure advice after preparing the new matching managed runtime.

## Result

Setup and matching-runtime check both exited 0. Runtime fingerprint: 8cc6f6ffa53558ef69a5ad8138c9125b15f61dbaabfd062e56f26a65130b13aa.

The atlas command with AGENT_DRAW_FFMPEG=/missing/encoder exited 1 and retained the authoritative override. Nested advice now explicitly states that atlas packing requires FFmpeg and that no atlas was created. The output directory did not exist after failure. No fallback, install, repository edit, or game change was attempted.

## Exact commands

```sh
AGENT_DRAW_HOME=/tmp/atlas-eval-with/runtime node /workspace/shared/agent-draw-worktrees/atlas/scripts/setup.js --json
AGENT_DRAW_HOME=/tmp/atlas-eval-with/runtime node /workspace/shared/agent-draw-worktrees/atlas/scripts/setup.js --check --json
AGENT_DRAW_HOME=/tmp/atlas-eval-with/runtime AGENT_DRAW_FFMPEG=/missing/encoder node /workspace/shared/agent-draw-worktrees/atlas/scripts/run-managed.js atlas /tmp/atlas-eval-with/inputs/manifest.json --out /tmp/atlas-eval-with/retest-broken-encoder-out --timeout 120
test ! -e /tmp/atlas-eval-with/retest-broken-encoder-out && echo NO_OUTPUT_CREATED
```

## Actual output

Setup, exit 0:

```json
{"ok":true,"version":"0.3.1","fingerprint":"8cc6f6ffa53558ef69a5ad8138c9125b15f61dbaabfd062e56f26a65130b13aa","runtimeRoot":"/tmp/atlas-eval-with/runtime/releases/0.3.1-8cc6f6ffa53558ef","cli":"/tmp/atlas-eval-with/runtime/releases/0.3.1-8cc6f6ffa53558ef/scripts/agent-draw.mjs","node":"24.19.0","inkscape":{"command":"inkscape","version":"Inkscape 1.4 (e7c3feb100, 2024-10-09)","status":"ready","minimumVersion":"1.2","installUrl":"https://inkscape.org/release/"},"exportVerified":false,"nextStep":"Run node \"/workspace/shared/agent-draw-worktrees/atlas/scripts/run-managed.js\" doctor --smoke to verify real exports."}
```

Matching runtime check, exit 0:

```json
{"ok":true,"version":"0.3.1","fingerprint":"8cc6f6ffa53558ef69a5ad8138c9125b15f61dbaabfd062e56f26a65130b13aa","runtimeRoot":"/tmp/atlas-eval-with/runtime/releases/0.3.1-8cc6f6ffa53558ef","cli":"/tmp/atlas-eval-with/runtime/releases/0.3.1-8cc6f6ffa53558ef/scripts/agent-draw.mjs","node":"24.19.0","inkscape":{"command":"inkscape","version":"Inkscape 1.4 (e7c3feb100, 2024-10-09)","status":"ready","minimumVersion":"1.2","installUrl":"https://inkscape.org/release/"},"exportVerified":false,"nextStep":"Run node \"/workspace/shared/agent-draw-worktrees/atlas/scripts/run-managed.js\" doctor --smoke to verify real exports."}
```

Atlas, exit 1, complete verbatim failure:

```json
{"ok":false,"error":"FFmpeg missing. Atlas export requires an existing FFmpeg installation. The explicit AGENT_DRAW_FFMPEG selection is authoritative; check its path and permissions. No automatic installation was attempted. https://ffmpeg.org/download.html","details":{"ok":false,"command":"/missing/encoder","status":"missing","version":null,"explicitOverride":true,"optional":true,"installUrl":"https://ffmpeg.org/download.html","advice":"Atlas packing requires this FFmpeg selection to pass its probe. Check the explicit path and permissions; do not silently replace it. Other vector/frame export commands remain available, but no atlas was created. No automatic installation was attempted.","error":"spawnSync /missing/encoder ENOENT"}}
```

Existence check:

```
NO_OUTPUT_CREATED
```

## Remaining scope limits

No packing, visual, overwrite, or doctor tests were repeated. Initial report contains those earlier results. The shared detector metadata still contains optional=true, but the atlas-specific nested advice now clearly states the requirement and failed result. This observation does not broaden the retest.
