# Named-part animation: Yoda review

2026-10-14. Applied the installed Hartye Skills 0.4.0 Yoda procedure to all three revised Agent Draw skills. This is the existing-skill audit entrance, not a claim of baseline-first new-skill authoring. No additional overlapping skill was created.

## Diagnosed gap and implementation

The prior skills correctly excluded group transforms and animation. Real Western character work required hand-written SVG groups, per-frame rendering, encoding, and contact sheets. The revised runtime provides bounded named groups/pivots and property tracks; existing authoring/export/setup skills now route directly to the corresponding references. Critical differences are prominent: static build uses base transforms, animation master uses sample 0; tracks are absolute; optional encoder readiness differs from renderer readiness; endpoint closure is not playback quality.

## Paired behavioral evidence

With-skills and without-skills evaluators were spawned together with identical tasks and isolated output/runtime directories. The baseline could use README, schema docs and source but not skills or audit reports.

1. Create an original 128px grouped character with stable body/arm IDs, local arm pivot, 12-frame/12fps closed wave and body bob; export SVG/PNG frames, source, contact sheet, GIF and explicitly background-composited MP4.
2. Reorder unrelated groups and verify animation targets remain correct; answer near-miss requests for SVG import and path morphing.
3. Diagnose an explicitly missing FFmpeg path without fallback or installation, while retaining static export capability.

Both runs completed the core tasks, exported actual encodings, proved all reordered frames unchanged, rejected unsupported operations, and respected the broken explicit encoder selection. Both visually inspected sampled poses/contact sheets and distinguished canonical endpoint closure from real-time playback, which was not observed. The with-skills run additionally verified frames-only animation under the broken encoder override. This small sample does not establish overall superiority over the README/schema baseline or reliable automatic host activation.

## Findings

No blocking skill failure was observed in these paired tasks. Baseline tried a nonexistent src/cli.js entry before using the documented launcher; its report correctly identifies this as evaluator error rather than absent documentation. Both actual command outcomes and failed attempts are retained, not replaced with self-scores.

Non-blocking tool friction remains: unsupported-type/property errors are terse; repeated nonfatal native Pango/Gtk warnings can make receipts noisy; structured encoder advice repeats in the top-level error and details. GIF timing is necessarily quantized despite the requested nominal fps. These limitations are recorded rather than hidden or treated as failed rendering.

## Inspection and provenance

Descriptions measure 278 (setup), 250 (export), and 225 (authoring) characters; bodies are 44, 37, and 42 lines. Names match directories. Setup handles runtime/dependency checks, authoring handles geometry/tracks, export handles delivery/QA. Both animation references link directly from their skills; no nested discovery chain is required. All guide JSON examples validate. No shell positional-placeholder patterns were found in skill bodies. Local links were checked by the documentation reviewer.

All skill/reference Markdown was scanned for invisible format and Unicode Tag codepoints; no findings. These locally authored changes have recorded provenance and review, but this is not a blanket safety certification of natural-language instructions or native executables. Cross-platform behavior, native host trigger activation, exhaustive prompt coverage, and real-time playback quality remain unverified.

## Evidence

- [With-skills run](animation-with-skills.md)
- [Without-skills run](animation-without-skills.md)
- [Metadata/codepoint inspection](animation-yoda-inspection.json)
- [Software tests](animation-tests.txt)
- [Artifact verification](animation-verification.md)
