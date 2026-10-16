# Overhead human figure starters

Two builds, eight compass facings, 128 static pose cards and 32 eight-frame walk/run loops: 384 editable complete drawings. Human and compact RPG retain their different world proportions. This is a true orthographic overhead camera, not the shallow elevated camera of the parent library.

Open this directory through HTTP/HTTPS. S means down the screen, N up, E right and W left. Choose a build/action/facing, open a card, then play, step or scrub. Walk is 8 fps; run is 12 fps. Quarter speed assists inspection. Clips start paused. No duplicated endpoint is appended.

Construction guides start visible in the gallery but remain a separate hidden layer in downloaded JSON/SVG. Toggle them in the gallery or reveal `construction-guides` in Inkscape. Left/right belongs to the character: blue #2879C7 left, red #CC4B4B right, gold #B88016 head, teal #19877B torso, purple #8A57AE pelvis. Left joint markers are circles, right are diamonds; the legend labels all five. These are our documented colors, not an industry standard. The historical spatial constructor's reference-right maps to anatomical left, reference-left to anatomical right. New overhead projected landmark keys are anatomical.

All individual canvases are 384 × 384, centered at (192,192), at the same world scale. Projection uses world lateral and forward positions; height controls draw order, not screen y. A limb hanging vertically can disappear behind the shoulders/head. The head shows a crown and small forward nose projection, with no frontal eyes. Rotating the entire overhead viewing direction is geometrically valid; individual bent-limb shapes are authored anew per action frame. No browser limb rig or in-between interpolation is used.

Copy a `projects/*.json`, rename it, and add a costume around the construction. The JSON remains authoritative; manual SVG edits do not flow back. These sources do not provide automatic clothing, a skeleton or a game controller.

## Rebuild

From the full Agent Draw checkout, run `node examples/human-mannequins/overhead/generate.mjs`, then its focused `drawing.test.mjs`. Use the version-matched Agent Draw launcher and a checked Inkscape executable. Render `keys.json` first and inspect actual exports. Render `sequence-0.json` and `sequence-1.json` serially into fresh directories, then run `retain.py <batch-0-directory> <batch-1-directory>`.

Each native page is 768 × 768 and contains four complete drawings translated into 384-square cells. Individual PNGs are exact integer crops from those native Inkscape page exports, with no resizing. Individual SVGs use Agent Draw's validated serializer. Page projects, manifests, receipts and hashes/crop coordinates in `native-bindings.json` make this provenance explicit; individual crops are not represented as individual native process receipts. `review/` sheets retain source-pixel artwork with labels. The ZIP contains all JSON/SVG/PNG drawings, timing, coordinates and the native page sources/exports/bindings.

Static sheets establish drawing coverage; live browser playback is separately verified. Neither proves that a dressed game character or engine movement has been accepted by the owner.
