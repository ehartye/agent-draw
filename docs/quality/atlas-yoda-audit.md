# Game atlas: Yoda review

2026-10-14. Applied installed Hartye Skills 0.4.0 Yoda using its existing-skill audit entrance. The existing export skill gained one directly linked game-atlas reference; no additional overlapping skill was added. Setup/authoring roles remain unchanged.

## Diagnosis

The real game integration needed one texture sheet, exact foot registration and semantic animation clip metadata. The prior export skill only covered vector builds and animation encoding. The update routes already-authored frame packing separately and warns that labels cannot create missing directional or action artwork.

## Paired runs

Spawned with-skill and without-skill evaluators together with the same tasks and isolated runtimes/output directories. The baseline could use README, atlas format and source, but not skills or audit reports.

1. Pack copies of the game's 16 actual 128×160 frames into two 6fps idle clips, with foot anchor (64,150), eight columns and transparent gutters. Verify exact pivots, every crop, hashes and retained-source rebuilding.
2. Diagnose a deliberately broken explicit FFmpeg path without fallback/install; refuse replacement of a directory with unrelated content.
3. Answer the near miss: label one front-view idle as eight directional walking animations.

Both runs completed packing and independent pixel/anchor/source checks, honored the explicit failing encoder, and preserved unrelated content. Both rejected misrepresenting one authored idle as missing directional walk art. These small paired runs do not establish superiority over ordinary documentation, native host trigger reliability or broader success rates.

## Observed friction

`doctor` intentionally reports renderer readiness as its overall success: FFmpeg is optional for core static/frame exports. Therefore its exit status/top-level ok is insufficient for atlas readiness when the selected encoder is broken. The atlas reference explicitly requires reading FFmpeg status and successful actual packing. Both runs diagnosed the selected encoder rather than silently substituting another binary. The runtime has separate command-level failure reporting.

The baseline identified a concrete tool-advice ambiguity: nested generic FFmpeg advice said “Frames-only export remains available” even inside an atlas failure. Atlas now supplies command-specific advice that the selected encoder is required and no atlas was created, while distinguishing other vector/frame commands. A regression assertion checks the wording; both evaluators reran this targeted failure after matching-runtime setup.

No blocking skill defect was demonstrated. No new claims of engine/browser integration, generated art, or physical-controller testing were introduced.

## Inspection and safety limits

Export description is 271 characters; body is 39 lines. The directly linked reference contains the specialized workflow, leaving the skill as a router. All three names match directory names; setup, authoring and export remain distinct. No unintentional shell positional placeholders were found. All skill/reference Markdown was scanned for invisible format/Unicode Tag codepoints; no findings. Atlas guide JSON validates against actual code. Local provenance and official Phaser technical sources are recorded.

This inspection is not a blanket safety certification. Behavior evidence comes from separate agent executions, not self-scores. Native automatic trigger activation, all platforms, all game engines and live playback remain outside this review.

## Evidence

- [With-skill report](atlas-with-skill.md)
- [Without-skill report](atlas-without-skill.md)
- [With-skill diagnostic retest](atlas-with-skill-retest.md)
- [Without-skill diagnostic retest](atlas-without-skill-retest.md)
- [Inspection](atlas-yoda-inspection.json)
- [Tests](atlas-tests.txt)
- [Actual game case verification](atlas-case-study.md)
