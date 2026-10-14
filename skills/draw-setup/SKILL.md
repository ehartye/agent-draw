---
name: draw-setup
description: Check and prepare the version-matched agent-draw runtime for headless Inkscape vector exports. Use before the first draw command, after plugin updates, or for missing, outdated, or broken Inkscape and runtime discovery errors, or missing FFmpeg during optional GIF/MP4 encoding.
---

# Draw setup

Resolve `<plugin-root>` from this loaded skill: it is two directory levels above the `draw-setup` directory. Confirm that `scripts/setup.js` exists there. Use its absolute path; do not assume the current working directory is the plugin checkout.

Requirements: Node.js 22 or newer and an existing Inkscape 1.2 or newer installation. Linux is the initial verification target. Setup copies local runtime files into the user cache; it does not install Inkscape, launch a browser, or install npm packages.

1. Check: `node "<plugin-root>/scripts/setup.js" --check --json`.
2. Read the result. If a matching managed runtime is missing, prepare it with `node "<plugin-root>/scripts/setup.js" --json`.
3. Repeat the check and require success. A first-run failed check is expected when no runtime has been prepared; other failures still need diagnosis.
4. Run `node "<plugin-root>/scripts/run-managed.js" doctor --smoke`. Require `ok: true` and a successful real SVG/PNG/PDF smoke export before claiming builds are ready. The smoke test uses temporary isolated output and cleans up afterward; it does not prove visual quality for a real project.

## Diagnose Inkscape

Read the structured status and attempted executable, not just whether an app icon exists:

- `missing`: no executable was found. Point to [official stable downloads](https://inkscape.org/release/) and the [platform installation guide](https://wiki.inkscape.org/wiki/Installing_Inkscape), or ask the user for their existing executable location.
- `too-old`: report detected and minimum versions; advise an official upgrade to 1.2 or newer.
- `probe-failed` or `unrecognized-version`: report the actual executable and error/output. Do not claim a working renderer or silently try a different binary after an explicit override.
- `ready`: the version probe passed; complete the smoke export to check actual rendering.

Linux can use the distribution software installer or an official package. macOS needs the official build matching its processor; Windows can use the official installer and console executable. Those are setup suggestions, not verified macOS/Windows support. Do not install software without the required permission. If `AGENT_DRAW_INKSCAPE` is explicitly set, it is authoritative: confirm a corrected path with the user instead of ignoring it.

## Optional animation encoding

SVG/PNG frame sequences and contact sheets require Inkscape only. GIF/MP4 additionally need an existing FFmpeg installation. `doctor` reports optional FFmpeg status; the Inkscape smoke test does not establish encoder readiness. Read the encoder status before promising a GIF/MP4. A version probe also does not prove the requested codec works: require successful actual encoding.

For missing or broken FFmpeg, offer frames-only output or point to [official FFmpeg downloads](https://ffmpeg.org/download.html) / the distribution package manager. Do not automatically install it. `AGENT_DRAW_FFMPEG` selects the executable and is authoritative; diagnose an explicit invalid path rather than silently falling back. MP4 also requires an even-sized canvas and the user's intended opaque background. Read `draw-export`'s animation reference before choosing encoding flags.

## Managed commands

Use the managed launcher for all authoring commands:

```sh
node "<plugin-root>/scripts/run-managed.js" <command> ...
```

`AGENT_DRAW_INKSCAPE` selects the executable when discovery is unsuitable. `AGENT_DRAW_HOME` selects the managed runtime home; keep it outside the checkout and the project/output directories. The launcher checks runtime version and source fingerprint. After a source update, rerun setup to prepare the new fingerprint-matched release. If an existing managed release was modified, setup refuses it rather than automatically repairing it: report the exact error, and move the affected release aside only with user authorization before rerunning setup. Never bypass an integrity failure with another executable.

Stop on errors and report the actual error. Do not install software, alter system permissions, or bypass host restrictions without the required authorization. See [architecture](../../docs/architecture.md) for runtime and isolation boundaries. After setup, load `draw-authoring` or `draw-export` for the requested task.
