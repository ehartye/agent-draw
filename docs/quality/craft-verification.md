# Vector craft verification

Executed on Linux with Node 24.19.0 and Inkscape 1.4, 2026-10-14.

- Full suite: 173 passed, zero failures or skips. [Test output](craft-tests.txt).
- Actual exports verify transparent even-odd holes, round/square versus butt cap extents, linear/radial gradient colors and alpha, generated internal paint references, vector-only SVG/PDF, and old smoke/robot pixels identical to the frozen v0.1 renderer.
- Detector tests cover missing, too-old, unrecognized, failed, and ready executables; explicit overrides; platform advice; real smoke export and temporary cleanup. Broken explicit paths receive path-first advice.
- All eight JSON guide fragments and six style projects validate automatically. CI additionally exports all six style projects through the managed runtime.
- All six original 256px lantern style examples were built to SVG/PNG/PDF and visually reviewed. A composed vector gallery was exported to PNG/PDF; the PNG and independently rendered PDF were inspected. PDF image listing contains no raster images.
- All three skill bodies and seven references passed metadata/link/codepoint checks. [Actual Yoda paired audit](craft-yoda-audit.md) records both positive findings and limits.

Only Linux is verified. Fonts and renderer versions affect appearance. Isolated profiles are not an OS sandbox. Inkscape emitted nonfatal PangoFT2FontMap/GtkRecentManager warnings, retained in receipts. The gallery is a review artifact, not a claim that arbitrary SVG import, grouping, transforms, or animation are supported by the JSON schema.
