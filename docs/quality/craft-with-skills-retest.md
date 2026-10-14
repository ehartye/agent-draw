# Post-fix WITH-skills diagnostic retest

Used previously read draw-setup instructions, with a new isolated runtime. No paired output consulted; no self-score or source changes.

Runtime home: `/tmp/agent-draw-craft-yoda-with/retest-runtime`.
Prepared runtime 0.2.0 fingerprint `f39375651971c1b93b665f5d3e8a8e641652fe361f8ca7346db1bfa9d868d88d`.

## Observed outcome

Before setting fixture: setup, setup check and actual doctor --smoke all exited 0. Inkscape 1.4 rendered SVG/PNG/PDF successfully, with the same recorded nonfatal Pango/GTK warnings.

After setting nonexistent override: setup check and doctor both exited 1; `explicitOverride: true`, `status: missing`, ENOENT, and exactly one attempted executable matching the override. `ls` confirmed the selected file absent (exit 2). `command -v inkscape` found `/usr/bin/inkscape` without executing or selecting it. No installation or override change after fixture was set; no render attempt with another binary.

The revised advice is now path-first, explicitly requires asking before changing selection, and makes installation conditional on no suitable existing installation. Exact tool text is preserved below.

## Advice to the user for this specific case

Agent Draw is trying `/tmp/agent-draw-craft-yoda-with/missing-inkscape`, which does not exist. An Inkscape installation is present at `/usr/bin/inkscape`, and the smoke test before your override was applied successfully used Inkscape 1.4. The selected path is the problem; installing another copy is unnecessary on this evidence. Confirm which executable you want selected before changing the override, then rerun setup check and doctor --smoke. I have not changed your selection or installed anything.

## Reproducible commands and exact output

Executed `bash -x /tmp/agent-draw-craft-yoda-with/retest.sh`; script retained in the workspace. Full expanded transcript follows, also saved in `evidence/retest-commands.log`.

```text
+ set -u
+ export AGENT_DRAW_HOME=/tmp/agent-draw-craft-yoda-with/retest-runtime
+ AGENT_DRAW_HOME=/tmp/agent-draw-craft-yoda-with/retest-runtime
+ unset AGENT_DRAW_INKSCAPE
+ node /workspace/shared/agent-draw-worktrees/craft/scripts/setup.js --json
{"ok":true,"version":"0.2.0","fingerprint":"f39375651971c1b93b665f5d3e8a8e641652fe361f8ca7346db1bfa9d868d88d","runtimeRoot":"/tmp/agent-draw-craft-yoda-with/retest-runtime/releases/0.2.0-f39375651971c1b9","cli":"/tmp/agent-draw-craft-yoda-with/retest-runtime/releases/0.2.0-f39375651971c1b9/scripts/agent-draw.mjs","node":"24.19.0","inkscape":{"command":"inkscape","version":"Inkscape 1.4 (e7c3feb100, 2024-10-09)","status":"ready","minimumVersion":"1.2","installUrl":"https://inkscape.org/release/"},"exportVerified":false,"nextStep":"Run node \"/workspace/shared/agent-draw-worktrees/craft/scripts/run-managed.js\" doctor --smoke to verify real exports."}
+ printf 'Setup exit: %s\n' 0
Setup exit: 0
+ node /workspace/shared/agent-draw-worktrees/craft/scripts/setup.js --check --json
{"ok":true,"version":"0.2.0","fingerprint":"f39375651971c1b93b665f5d3e8a8e641652fe361f8ca7346db1bfa9d868d88d","runtimeRoot":"/tmp/agent-draw-craft-yoda-with/retest-runtime/releases/0.2.0-f39375651971c1b9","cli":"/tmp/agent-draw-craft-yoda-with/retest-runtime/releases/0.2.0-f39375651971c1b9/scripts/agent-draw.mjs","node":"24.19.0","inkscape":{"command":"inkscape","version":"Inkscape 1.4 (e7c3feb100, 2024-10-09)","status":"ready","minimumVersion":"1.2","installUrl":"https://inkscape.org/release/"},"exportVerified":false,"nextStep":"Run node \"/workspace/shared/agent-draw-worktrees/craft/scripts/run-managed.js\" doctor --smoke to verify real exports."}
+ printf 'Setup check exit: %s\n' 0
Setup check exit: 0
+ node /workspace/shared/agent-draw-worktrees/craft/scripts/run-managed.js doctor --smoke
{
  "ok": true,
  "node": "24.19.0",
  "inkscape": {
    "ok": true,
    "command": "inkscape",
    "status": "ready",
    "version": "Inkscape 1.4 (e7c3feb100, 2024-10-09)",
    "versionText": "Inkscape 1.4 (e7c3feb100, 2024-10-09)",
    "error": null,
    "minimumVersion": "1.2",
    "explicitOverride": false,
    "attempts": [
      {
        "command": "inkscape",
        "status": "ready",
        "version": "1.4",
        "versionText": "Inkscape 1.4 (e7c3feb100, 2024-10-09)",
        "error": null
      }
    ],
    "platform": "linux",
    "verifiedPlatforms": [
      "linux"
    ],
    "installUrl": "https://inkscape.org/release/",
    "installGuide": "https://wiki.inkscape.org/wiki/Installing_Inkscape",
    "advice": "CLI version probe passed. Run doctor --smoke to verify real SVG, PNG, and PDF export.",
    "detectedVersion": "1.4"
  },
  "smoke": {
    "ok": true,
    "width": 16,
    "height": 16,
    "formats": [
      "svg",
      "png",
      "pdf"
    ],
    "warnings": [
      {
        "format": "png",
        "message": "** (inkscape:51): WARNING **: 14:47:44.388: Failed to wrap object of type 'PangoFT2FontMap'. Hint: this error is commonly caused by failing to call a library init() function.\n\n** (inkscape:51): WARNING **: 14:47:44.866: Failed to wrap object of type 'GtkRecentManager'. Hint: this error is commonly caused by failing to call a library init() function."
      },
      {
        "format": "pdf",
        "message": "** (inkscape:58): WARNING **: 14:47:44.984: Failed to wrap object of type 'PangoFT2FontMap'. Hint: this error is commonly caused by failing to call a library init() function.\n\n** (inkscape:58): WARNING **: 14:47:45.075: Failed to wrap object of type 'GtkRecentManager'. Hint: this error is commonly caused by failing to call a library init() function."
      }
    ]
  }
}
+ printf 'Baseline smoke exit: %s\n' 0
Baseline smoke exit: 0
+ export AGENT_DRAW_INKSCAPE=/tmp/agent-draw-craft-yoda-with/missing-inkscape
+ AGENT_DRAW_INKSCAPE=/tmp/agent-draw-craft-yoda-with/missing-inkscape
+ node /workspace/shared/agent-draw-worktrees/craft/scripts/setup.js --check --json
{"ok":false,"error":"Inkscape 1.2+ CLI not found. The explicit AGENT_DRAW_INKSCAPE selection \"/tmp/agent-draw-craft-yoda-with/missing-inkscape\" did not pass its probe. Check that selected path and its executable permissions first; an existing installation may already be available elsewhere. Do not silently change or ignore the selection. Ask before updating it, then rerun setup and doctor --smoke. Install Inkscape only if no suitable existing installation is available. No automatic installation was attempted. https://inkscape.org/release/","details":{"ok":false,"command":"/tmp/agent-draw-craft-yoda-with/missing-inkscape","status":"missing","version":null,"versionText":null,"error":"spawnSync /tmp/agent-draw-craft-yoda-with/missing-inkscape ENOENT","minimumVersion":"1.2","explicitOverride":true,"attempts":[{"command":"/tmp/agent-draw-craft-yoda-with/missing-inkscape","status":"missing","version":null,"versionText":null,"error":"spawnSync /tmp/agent-draw-craft-yoda-with/missing-inkscape ENOENT"}],"platform":"linux","verifiedPlatforms":["linux"],"installUrl":"https://inkscape.org/release/","installGuide":"https://wiki.inkscape.org/wiki/Installing_Inkscape","advice":"The explicit AGENT_DRAW_INKSCAPE selection \"/tmp/agent-draw-craft-yoda-with/missing-inkscape\" did not pass its probe. Check that selected path and its executable permissions first; an existing installation may already be available elsewhere. Do not silently change or ignore the selection. Ask before updating it, then rerun setup and doctor --smoke. Install Inkscape only if no suitable existing installation is available. No automatic installation was attempted."}}
+ printf 'Override setup check exit: %s\n' 1
Override setup check exit: 1
+ node /workspace/shared/agent-draw-worktrees/craft/scripts/run-managed.js doctor
{
  "ok": false,
  "node": "24.19.0",
  "inkscape": {
    "ok": false,
    "command": "/tmp/agent-draw-craft-yoda-with/missing-inkscape",
    "status": "missing",
    "version": null,
    "versionText": null,
    "error": "spawnSync /tmp/agent-draw-craft-yoda-with/missing-inkscape ENOENT",
    "minimumVersion": "1.2",
    "explicitOverride": true,
    "attempts": [
      {
        "command": "/tmp/agent-draw-craft-yoda-with/missing-inkscape",
        "status": "missing",
        "version": null,
        "versionText": null,
        "error": "spawnSync /tmp/agent-draw-craft-yoda-with/missing-inkscape ENOENT"
      }
    ],
    "platform": "linux",
    "verifiedPlatforms": [
      "linux"
    ],
    "installUrl": "https://inkscape.org/release/",
    "installGuide": "https://wiki.inkscape.org/wiki/Installing_Inkscape",
    "advice": "The explicit AGENT_DRAW_INKSCAPE selection \"/tmp/agent-draw-craft-yoda-with/missing-inkscape\" did not pass its probe. Check that selected path and its executable permissions first; an existing installation may already be available elsewhere. Do not silently change or ignore the selection. Ask before updating it, then rerun setup and doctor --smoke. Install Inkscape only if no suitable existing installation is available. No automatic installation was attempted.",
    "detectedVersion": null
  }
}
+ printf 'Override doctor exit: %s\n' 1
Override doctor exit: 1
+ printf 'Selected executable: %s\n' /tmp/agent-draw-craft-yoda-with/missing-inkscape
Selected executable: /tmp/agent-draw-craft-yoda-with/missing-inkscape
+ ls -l /tmp/agent-draw-craft-yoda-with/missing-inkscape
ls: cannot access '/tmp/agent-draw-craft-yoda-with/missing-inkscape': No such file or directory
+ printf 'Selected-path ls exit: %s\n' 2
Selected-path ls exit: 2
+ printf 'PATH candidate (not selected or executed): '
PATH candidate (not selected or executed): + command -v inkscape
/usr/bin/inkscape

```
