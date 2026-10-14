# Final-source missing-FFmpeg retest

The diagnostic nuance is fixed. Nested details.advice now explicitly says atlas packing requires the selected FFmpeg executable, prohibits silent replacement, distinguishes other vector/frame export commands, and confirms that no atlas was created. It no longer presents generic frames-only export as an apparent atlas fallback.

Only the requested broken-override case was rerun. No skills or quality reports were read; source was not edited and no external installation or fallback was attempted.

## Commands

From /workspace/shared/agent-draw-worktrees/atlas:

```sh
export AGENT_DRAW_HOME=/tmp/atlas-eval-without/runtime
node scripts/setup.js --json
AGENT_DRAW_FFMPEG=/missing/encoder node scripts/run-managed.js atlas /tmp/atlas-eval-without/inputs/manifest.json --out /tmp/atlas-eval-without/final-broken-output
test ! -e /tmp/atlas-eval-without/final-broken-output
```

## Fresh matching runtime

Setup exit status: 0. Exact setup output:

```text
{"ok":true,"version":"0.3.1","fingerprint":"8cc6f6ffa53558ef69a5ad8138c9125b15f61dbaabfd062e56f26a65130b13aa","runtimeRoot":"/tmp/atlas-eval-without/runtime/releases/0.3.1-8cc6f6ffa53558ef","cli":"/tmp/atlas-eval-without/runtime/releases/0.3.1-8cc6f6ffa53558ef/scripts/agent-draw.mjs","node":"24.19.0","inkscape":{"command":"inkscape","version":"Inkscape 1.4 (e7c3feb100, 2024-10-09)","status":"ready","minimumVersion":"1.2","installUrl":"https://inkscape.org/release/"},"exportVerified":false,"nextStep":"Run node \"/workspace/shared/agent-draw-worktrees/atlas/scripts/run-managed.js\" doctor --smoke to verify real exports."}
```

## Exact final error

Atlas exit status: 1. Exact output:

```text
{"ok":false,"error":"FFmpeg missing. Atlas export requires an existing FFmpeg installation. The explicit AGENT_DRAW_FFMPEG selection is authoritative; check its path and permissions. No automatic installation was attempted. https://ffmpeg.org/download.html","details":{"ok":false,"command":"/missing/encoder","status":"missing","version":null,"explicitOverride":true,"optional":true,"installUrl":"https://ffmpeg.org/download.html","advice":"Atlas packing requires this FFmpeg selection to pass its probe. Check the explicit path and permissions; do not silently replace it. Other vector/frame export commands remain available, but no atlas was created. No automatic installation was attempted.","error":"spawnSync /missing/encoder ENOENT"}}
```

The selected command remains /missing/encoder, explicitOverride=true, status=missing, and the underlying error is spawnSync /missing/encoder ENOENT. The output-absence test exited 0: /tmp/atlas-eval-without/final-broken-output did not exist afterward.

The original report.md retains the earlier observed error as historical evaluation evidence. This retest supersedes only its FFmpeg-advice friction finding; the prior successful packing and preservation evidence was not rerun or generalized to this new source fingerprint.
