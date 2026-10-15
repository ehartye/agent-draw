# Independently drawn pose sequence export

Use `sequence` when each pose changes path/primitive geometry, bent joints, clothing contours or overlaps. Use `animate` only when the requested motion can genuinely be described by the existing group's transform/opacity tracks. Sequence does not infer anatomy, generate in-betweens or morph paths.

## Input and command

Create a manifest beside or above the authored static project JSON files. Every frame must use the same canvas and contain no `animation` block. Keep the foot baseline and landmark conventions consistent in the drawings; matching canvas dimensions alone does not establish foot contact.

```json
{"version":1,"name":"drawn-action","fps":12,"loop":false,"frames":["poses/anticipation.json","poses/action.json","poses/recovery.json"]}
```

```sh
node "<plugin-root>/scripts/run-managed.js" sequence /absolute/path/manifest.json --out /absolute/path/output/action --timeout 120
```

Read [sequence format](../../../docs/sequence-format.md) for exact limits. Use an existing Inkscape installation and matching managed runtime; no FFmpeg is needed for SVG/PNG sequence output. Relative project paths must remain beneath the manifest directory. No symlinks, URLs, raw SVG or external scripts enter the manifest. Use a fresh dedicated output directory; explicit authorized overwrite still refuses sources or unrelated content.

## Verification is drawing plus rendering

Require command success and the `kind: "sequence"` receipt. Inspect retained project JSON to confirm the requested anatomy changes exist as drawing coordinates, not merely a transform-only substitute. Verify all SVG/PNG frames, original/rebuildable manifests, retained project inputs and the all-frame contact sheet.

Review key drawings at actual engine size: line of action, bent elbow/knee, support foot, pelvis height, hand/weapon relationship, coat overlap and clipping. Compare frames in order, not just individually. Check anticipation, action and recovery read at the selected fps. A contact sheet reveals shape changes but cannot establish timing or a seamless live loop.

For humanoids, inspect both boot cuffs against their calves, toe/heel direction through recovery, flat versus toe-off contact, and the finished ink's ground clearance including stroke. Check the neckpiece against the neck/jaw/shoulders and both cape-root overlaps. Include intermediate drawings and both half-strides in readable strips or individual images. Retain per-frame findings and keep a scoped attachment pass separate from full-motion acceptance.

A sequence `loop: true` is playback intent only. It does not prove endpoint equality or a good last-to-first transition. The exporter records this limitation rather than forcing duplicate endpoints. Judge the final-to-first action and foot contact in playback before claiming a finished loop. For a hold, deliberately repeat a frame reference; do not create accidental extra holds by appending the first frame automatically.

Use the existing atlas workflow for game packing. Preserve frame registration and semantic action/view names; packing cannot invent missing directional poses. For a horizontal strip, choose the clip's frame count as columns and padding 0 only when that matches the engine contract. Retain vector/project sources and receipts even when the game consumes only the final raster strip.

Approve the result against a scene crop showing the character beside a door, cover and building at the same ground depth. Distinguish exporter tests, drawing review, engine-scale scene review and live playback. A successful command or test count is not a visual-quality verdict.
