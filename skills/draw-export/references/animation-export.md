# Animation export and review

## Choose the output before rendering

Use `animate` for a validated project containing `animation`; [waving-orbit.json](../../../examples/waving-orbit.json) is a complete example. Inkscape is required for every animation export. FFmpeg is optional and required only for `--gif` / `--mp4`; setup never installs it. Default to editable frames plus a contact sheet when no encoded format was requested.

```sh
node "<plugin-root>/scripts/run-managed.js" validate /absolute/path/project.json
node "<plugin-root>/scripts/run-managed.js" animate /absolute/path/project.json --out /absolute/path/output/frames --timeout 120
# GIF when requested:
node "<plugin-root>/scripts/run-managed.js" animate /absolute/path/project.json --out /absolute/path/output/gif --gif --timeout 120
# MP4 when requested; choose the intended opaque background:
node "<plugin-root>/scripts/run-managed.js" animate /absolute/path/project.json --out /absolute/path/output/video --mp4 --background '#FFFFFF' --timeout 120
```

`--gif` and `--mp4` may be combined. `--timeout` is an integer 1–600 seconds, default 120, for the overall operation. Keep the input outside the output directory. Use a fresh directory; use `--overwrite` only with replacement authorization. Animation overwrite requires a recognizable generated animation directory/receipt and rejects unrelated entries. Do not bypass those protections.

MP4 requires even width and height, an explicit `#RRGGBB` background, and a working FFmpeg H.264 encoder. It has no alpha; a loop flag in the source does not make arbitrary video players replay it. GIF has palette limits, 1-bit transparency (partial alpha is thresholded at 128), and centisecond timing. Check the actual encode for edge/timing changes; use PNG frames for full-alpha fidelity. An explicit `AGENT_DRAW_FFMPEG` override is never silently ignored. If it fails, diagnose it or offer the frames-only command; do not claim an encode was produced.

## Required outputs and receipt

A successful default export produces:

- `project.json`: normalized, rebuildable source including groups and timeline
- `master.svg`: editable static sample 0, not the unsampled base pose
- `frames/frame-0000.svg` and `.png` through frame N−1: editable poses and transparent raster frames
- `contact-sheet.svg` and `.png`: selected labeled poses, rendered by Inkscape
- `receipt.json`: successful completion, artifact SHA-256 hashes, dimensions, frame count, nominal fps/duration, versions, contact-sheet indexes, and loop seam evidence
- `animation.gif` and/or `animation.mp4` only when requested and successfully encoded

No PDF or self-playing SVG is promised by `animate`. Use static `build` for a PDF of the base pose. Its base transforms may differ from timeline sample 0 because tracks replace property values absolutely.

Require a successful command and nonempty expected artifacts. Read `receipt.json`; output presence after failure is insufficient. Check sequence count equals N and receipt duration equals N/fps. The exported sequence excludes virtual frame N: that frame checks closed-loop canonical SVG equality with sample 0 and must not be appended as a duplicate hold. The final encoded sample N−1 normally differs from sample 0.

## Visual QA and delivery

1. Inspect the contact sheet and full-resolution start/extreme/intermediate/final PNGs for silhouette, pivots, attached joints, parent/child hierarchy, occlusion, clipping, transparency, and local paint movement. Inspect other frames if selected samples miss an extreme.
2. Inspect the SVG tree for stable part IDs and real editable vectors. A structure inspection is not a hands-on editing test.
3. Inspect actual GIF/MP4 playback at intended size and rate when delivering an encode. Check cadence, unwanted pauses, partial-alpha artifacts/background, and last-to-first transition. Structural endpoint equality and a contact sheet do not prove playback quality or velocity continuity.
4. Fix JSON, revalidate, and rebuild into a fresh destination. Do not repair only a raster frame while leaving the rebuildable source inconsistent.

Deliver requested encodes together with source JSON, the master, receipt, and editable frames when a rebuildable package is needed. State exactly which structural, visual, and playback checks ran; label unavailable playback as unverified. Do not claim successful publishing or delivery until the host confirms it.
