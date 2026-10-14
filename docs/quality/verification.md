# Verification record

Executed on 2026-10-14 with Node.js 24.19.0 and Inkscape 1.4 on Linux.

- `npm test`: 71 tests passed, zero failures, zero skips. Full output: [tests.txt](tests.txt).
- Real Inkscape PNG/PDF exports ran. PNG tests decode pixels using Node's standard zlib library and assert colors, alpha, hidden layers, overlap, and geometry.
- Safety regressions cover existing outputs, unrelated files, protected source, symlink output entries, managed-home aliases, escaped release directories, modified runtimes, timeout cleanup, missing executable, and nonzero export failure.
- Final managed setup, check, doctor, and robot build ran against the matching copied release.
- Robot: 512×512 RGBA PNG; corner alpha 0; 41 named SVG layers; zero SVG image elements; PDF image listing empty. Receipt SHA-256 values independently matched all three artifacts.
- PNG and independently rendered PDF were visually inspected. SVG structure was parsed, but no interactive manual editing session was performed.
- All local documentation links and both plugin JSON manifests checked.
- [Yoda audit](yoda-audit.md) records paired agent runs and distinct inspection/safety evidence.

Nonfatal Inkscape 1.4 PangoFT2FontMap/GtkRecentManager warnings are retained in build receipts. Profile/cache isolation avoids requiring a writable normal HOME; it is not a native-code sandbox. Font availability remains environmental.

Agent Draw itself has not been published or registered in the marketplace. Linux was tested; no cross-platform support claim is made. The historical GIMP prototype is preserved separately and is outside the supported vector runtime/test coverage.
