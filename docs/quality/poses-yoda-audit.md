# Drawn-pose and scene craft: Yoda audit

2026-10-14. Applied the installed Hartye Skills 0.4.0 Yoda procedure to revised existing authoring/export skills, with setup retained and the three-skill library inspected together. This is existing-skill review, not a claim of baseline-first creation of a new skill. Specialized craft stays in directly linked references instead of adding another competing skill.

## Failure that motivated the change

The game art had straight limbs rotated as rigid assemblies, insufficiently readable joint/action changes, a collapsed brown palette, and poor actor/building scale. The old tools could export those assets correctly without addressing the visual failure. The changes separate anatomy redrawing from rigid transform animation, provide a bounded full-project sequence exporter, and teach specific joint/contact/action and material/color/scale construction decisions. They do not equate test count with art quality.

## Paired task evidence

With-skills and without-skills evaluators were spawned together. Both received identical tasks and separate runtimes/workspaces. Baseline could read ordinary README/schema/source, but not skills, quality reports or example geometry.

1. Draw three original 128×160 reaching/holding poses, with bent elbows changing contour coordinates and stable ground feet; actually export the sequence.
2. Draw and render a shared-ground person/door/building comparison with cool clothing, warm masonry, material-specific marks and coherent sunlight/shadows; review at display size.
3. Explain whether loop:true proves seamless motion and whether view labels can turn a front view into eight authored directions.

Both produced actual independently drawn geometry, preserved JSON/SVG/PNG sources, rendered contact sheets and scene studies, and correctly rejected both near-miss claims. Images were inspected in addition to reading reports. Both showed readable arm changes and human/door scale; this small sample does not demonstrate superiority over the ordinary documentation baseline, a reliable aesthetic score or automatic host-trigger performance.

The with-skills evaluator noticed overly angular elbows in its own first drawing and revised them. A combined two-background QA sheet exceeded the existing leaf budget and was correctly rejected; it reduced that review layout instead of weakening resource limits. These are observed authoring iterations, not evidence that a test pass certifies good anatomy or that the entire skill library is safe.

## Independent real-case art correction

Separately from the paired tasks, an art reviewer rejected the first game-derived firing example because its support hand remained low. The author redrew the forearm/hand relationship and recoil geometry. The reviewer then accepted it as a restrained shot with a readable bent elbow and joined pistol grip. The final plugin example comes from the corrected drawings. Full scene composition and live playback remain separate acceptance steps.

## Inspection and provenance

Descriptions: authoring 269, export 294, setup 278 characters. Bodies: 44, 41 and 44 lines. Names match directories; setup remains dependency/runtime preparation, authoring routes drawing decisions, export routes rendering and QA. New pose/material and sequence references link directly from their owning skills. All local links resolve; executable guide manifests and examples are schema-tested. Structural skill-creator validation passes for all three skills.

Scanned every skill/reference Markdown for invisible format/Unicode Tag codepoints and unintentional shell positional placeholders; no findings. New craft text is locally authored from the user's correction, the actual reference image and concrete art-review observations. Numerical scene targets are explicitly project-specific heuristics. The available tools expose no wiki-master discover/ingest operation, so no wiki update is claimed.

Inspection cannot certify natural-language safety, cross-platform operation, anatomy quality across all poses, native trigger activation or live loop timing. Observed behavior is recorded in independent reports, not self-scores.

## Evidence

- [With-skills run](poses-with-skills.md)
- [Without-skills run](poses-without-skills.md)
- [Inspection](poses-yoda-inspection.json)
- [Executed tests](poses-tests.txt)
- [Real-case/render verification](poses-verification.md)
