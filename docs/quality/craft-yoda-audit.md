# Craft update: Yoda audit and behavioral evidence

2026-10-14. Applied the installed Hartye Skills 0.4.0 Yoda procedure to the revised draw-authoring and draw-setup skills; inspected the retained draw-export skill and the whole three-skill library as well. Existing-skill review entrance, not baseline-first authoring. No fourth overlapping craft skill was introduced.

## Diagnosis and design

The original authoring skill described geometry but did not route visual-style choices or teach construction techniques. It also correctly excluded gradients that the original runtime lacked. The revision adds a short selector and seven directly linked references, with technical SVG semantics cited separately from practical art heuristics. Detailed schema tables remain in docs. Setup now requires a real temporary export smoke test rather than equating an installed app or version string with a working renderer.

## Paired tasks

Spawned with-skills and without-skills evaluators together with identical tasks and separate directories. The baseline could read ordinary README/schema documentation but not skills, their references, or the other evaluator's output.

1. Build a transparent 128px flat lantern with genuine handle/window holes and retained JSON, SVG, PNG, PDF.
2. Build monoline and restrained gradient-editorial variants, legible at thumbnail size.
3. Diagnose a deliberately missing explicit Inkscape path without installing software or changing the selected executable.

Both evaluators completed all builds, confirmed actual alpha holes, round monoline attributes, native gradients, retained sources, and refused to silently override the selected path. Both reviewed thumbnails/backgrounds and independently rendered PDF output. Both noted dark-ink contrast limits on dark backgrounds. Near-miss responses correctly excluded animation and arbitrary SVG preservation; a cel-shaded mascot was accepted as supported.

This small sample did **not** distinguish overall completion or demonstrate that the revised skills outperform the existing README/schema baseline. No aesthetic superiority, statistical reliability, or automatic host-trigger performance is claimed. The guides provide an explicit reusable construction vocabulary, but that value is not a measured comparative score here.

## Concrete finding and correction

Both runs noticed the same tool-advice defect: structured diagnostics correctly identified a broken explicit executable path, but generic prose still recommended installing Inkscape even though an existing installation had already worked. The detector now gives path-first advice for explicit missing/broken selections, warns against silently ignoring the selection, and recommends installation only if no suitable existing copy is available.

A targeted second with/without pair ran after the fix. Both observed the improved advice, preserved the selection, and made no installation or configuration change. A unit regression locks down this behavior.

## Evidence

- [With-skills initial run](craft-with-skills.md)
- [Without-skills initial run](craft-without-skills.md)
- [With-skills diagnostic retest](craft-with-skills-retest.md)
- [Without-skills diagnostic retest](craft-without-skills-retest.md)
- [Metadata and codepoint scan](craft-yoda-inspection.json)
- [Executed software tests](craft-tests.txt)

## Inspection versus safety versus behavior

Inspection: names match directories; descriptions are 202, 204, and 226 characters, below the portable limit; bodies are 40, 35, and 38 lines. Seven style/fundamental references link directly from authoring, not through nested reference chains. Setup, authoring, and export retain distinct roles. All local links resolve; every JSON guide example is tested against the real validator. No unintentional shell positional-argument substitution patterns were found in the skill bodies.

Safety tooling: scanned all skill Markdown, including references, for invisible format/surrogate codepoints and disallowed controls; no findings. Locally authored guides and official technical source provenance are recorded. These checks are not a blanket safety certification of natural-language skills or native Inkscape execution.

Behavior: the observations above come from actual separate agents and generated artifacts, not skill self-scores. Native host activation, manual GUI editing, all possible prompts, and cross-platform execution remain untested.
