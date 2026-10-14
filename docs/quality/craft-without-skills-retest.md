# Post-fix diagnostic retest without skills

No skills, paired output, or source files were read. No source edits. Used fresh isolated runtime and the same diagnostic procedure. Setup before setting the fixture succeeded; runtime fingerprint f39375651971c1b93b665f5d3e8a8e641652fe361f8ca7346db1bfa9d868d88d.

## Exact commands
Working directory: /workspace/shared/agent-draw-worktrees/craft

```sh
export AGENT_DRAW_HOME=/tmp/agent-draw-craft-yoda-without/retest-runtime
node scripts/setup.js --json > /tmp/agent-draw-craft-yoda-without/retest-setup.log 2>&1
export AGENT_DRAW_INKSCAPE=/tmp/agent-draw-craft-yoda-without/missing-inkscape
{ node scripts/setup.js --check --json; echo setup_exit=$?; node scripts/run-managed.js doctor --smoke; echo doctor_exit=$?; printf 'selected=%s\n' "$AGENT_DRAW_INKSCAPE"; command -v inkscape; inkscape --version; ls -l "$AGENT_DRAW_INKSCAPE"; printf 'selected_after=%s\n' "$AGENT_DRAW_INKSCAPE"; } > /tmp/agent-draw-craft-yoda-without/retest-diagnostics.log 2>&1
cat /tmp/agent-draw-craft-yoda-without/retest-setup.log /tmp/agent-draw-craft-yoda-without/retest-diagnostics.log
```

## Exact output
```
{"ok":true,"version":"0.2.0","fingerprint":"f39375651971c1b93b665f5d3e8a8e641652fe361f8ca7346db1bfa9d868d88d","runtimeRoot":"/tmp/agent-draw-craft-yoda-without/retest-runtime/releases/0.2.0-f39375651971c1b9","cli":"/tmp/agent-draw-craft-yoda-without/retest-runtime/releases/0.2.0-f39375651971c1b9/scripts/agent-draw.mjs","node":"24.19.0","inkscape":{"command":"inkscape","version":"Inkscape 1.4 (e7c3feb100, 2024-10-09)","status":"ready","minimumVersion":"1.2","installUrl":"https://inkscape.org/release/"},"exportVerified":false,"nextStep":"Run node \"/workspace/shared/agent-draw-worktrees/craft/scripts/run-managed.js\" doctor --smoke to verify real exports."}
{"ok":false,"error":"Inkscape 1.2+ CLI not found. The explicit AGENT_DRAW_INKSCAPE selection \"/tmp/agent-draw-craft-yoda-without/missing-inkscape\" did not pass its probe. Check that selected path and its executable permissions first; an existing installation may already be available elsewhere. Do not silently change or ignore the selection. Ask before updating it, then rerun setup and doctor --smoke. Install Inkscape only if no suitable existing installation is available. No automatic installation was attempted. https://inkscape.org/release/","details":{"ok":false,"command":"/tmp/agent-draw-craft-yoda-without/missing-inkscape","status":"missing","version":null,"versionText":null,"error":"spawnSync /tmp/agent-draw-craft-yoda-without/missing-inkscape ENOENT","minimumVersion":"1.2","explicitOverride":true,"attempts":[{"command":"/tmp/agent-draw-craft-yoda-without/missing-inkscape","status":"missing","version":null,"versionText":null,"error":"spawnSync /tmp/agent-draw-craft-yoda-without/missing-inkscape ENOENT"}],"platform":"linux","verifiedPlatforms":["linux"],"installUrl":"https://inkscape.org/release/","installGuide":"https://wiki.inkscape.org/wiki/Installing_Inkscape","advice":"The explicit AGENT_DRAW_INKSCAPE selection \"/tmp/agent-draw-craft-yoda-without/missing-inkscape\" did not pass its probe. Check that selected path and its executable permissions first; an existing installation may already be available elsewhere. Do not silently change or ignore the selection. Ask before updating it, then rerun setup and doctor --smoke. Install Inkscape only if no suitable existing installation is available. No automatic installation was attempted."}}
setup_exit=1
{
  "ok": false,
  "node": "24.19.0",
  "inkscape": {
    "ok": false,
    "command": "/tmp/agent-draw-craft-yoda-without/missing-inkscape",
    "status": "missing",
    "version": null,
    "versionText": null,
    "error": "spawnSync /tmp/agent-draw-craft-yoda-without/missing-inkscape ENOENT",
    "minimumVersion": "1.2",
    "explicitOverride": true,
    "attempts": [
      {
        "command": "/tmp/agent-draw-craft-yoda-without/missing-inkscape",
        "status": "missing",
        "version": null,
        "versionText": null,
        "error": "spawnSync /tmp/agent-draw-craft-yoda-without/missing-inkscape ENOENT"
      }
    ],
    "platform": "linux",
    "verifiedPlatforms": [
      "linux"
    ],
    "installUrl": "https://inkscape.org/release/",
    "installGuide": "https://wiki.inkscape.org/wiki/Installing_Inkscape",
    "advice": "The explicit AGENT_DRAW_INKSCAPE selection \"/tmp/agent-draw-craft-yoda-without/missing-inkscape\" did not pass its probe. Check that selected path and its executable permissions first; an existing installation may already be available elsewhere. Do not silently change or ignore the selection. Ask before updating it, then rerun setup and doctor --smoke. Install Inkscape only if no suitable existing installation is available. No automatic installation was attempted.",
    "detectedVersion": null
  }
}
doctor_exit=1
selected=/tmp/agent-draw-craft-yoda-without/missing-inkscape
/usr/bin/inkscape

** (process:42): WARNING **: 14:47:47.742: Unable to create profile directory (Read-only file system) (30)
Inkscape 1.4 (e7c3feb100, 2024-10-09)
ls: cannot access '/tmp/agent-draw-craft-yoda-without/missing-inkscape': No such file or directory
selected_after=/tmp/agent-draw-craft-yoda-without/missing-inkscape
```

## Actions and diagnosis
Both fixture setup check and doctor exit 1, report ENOENT and explicitOverride=true, and attempt only the chosen nonexistent path. The updated advice is path-first, says an installation may already exist elsewhere, explicitly forbids silently changing selection, and makes installation conditional on absence of a suitable existing installation.

Read-only independent checks find /usr/bin/inkscape, version 1.4. ls confirms the selected path does not exist. Version probing reports a read-only default profile warning but successfully returns the installed version. Selection printed before/after remains identical. No software installed, no override unset/changed after fixture assignment, no export redirected to alternate executable.

Advice to user: Inkscape 1.4 is already available at /usr/bin/inkscape. Agent Draw fails because AGENT_DRAW_INKSCAPE explicitly points to a nonexistent file. No installation is needed for the current diagnosis. If that override was accidental, you can correct it to /usr/bin/inkscape or remove it, then rerun setup and doctor --smoke; if intentional, restore the executable at the selected path. I have left your selection untouched.

No self-score assigned.
