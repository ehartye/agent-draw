# Yoda skill audit: Agent Draw 0.1.0

Date: 2026-10-14. Procedure: installed Hartye Skills 0.4.0, Yoda skill, source commit `39359293edd07f49cf1737e26fca966d4c33707b`.

## Scope and honest starting point

Audited all three created skills: draw-setup, draw-authoring, draw-export. Drafts already existed when the user requested Yoda, so this used Yoda's existing-skill review entrance. It does **not** claim baseline-first authoring. Both members of each with/without pair were launched together, with the same task wording and isolated working/runtime directories. The baseline could read README and project-format docs, but not skills or the paired evaluator's output.

## Finding and fix

The initial draw-setup wording told an agent to rerun setup for a modified runtime. The implementation deliberately rejects a modified existing release instead of silently repairing it. That advice could cause a failed retry loop. The skill now distinguishes a new source fingerprint (prepare a new release) from a tampered existing release (report the error and request authorization before moving it aside). Architecture documentation was aligned. This finding came from inspection, not from a claimed baseline failure.

Codex metadata also gained an explicit `skills` path. This is a manifest integration correction; a native host installation/activation test of Agent Draw itself has not been performed.

## Paired behavioral evidence

| Task | With skills | Without skills |
| --- | --- | --- |
| Fresh setup, matching runtime, doctor | Completed using the managed launcher | Completed using README guidance and the managed launcher |
| 96×96 badge with transparent margin, rounded teal square, gold curve, live OK text | Built SVG/PNG/PDF and retained JSON; inspected SVG, PNG, and independently rendered PDF | Built SVG/PNG/PDF and retained JSON; inspected SVG/PNG and PDF header |
| Same-folder export without overwrite permission | Exit 1; all prior outputs and source unchanged | Exit 1; all prior outputs and source unchanged |
| Modified-runtime diagnosis, no move/delete permission | Detected modification, stopped for permission; no bypass or repair | Same outcome |

Observed improvement in this small sample: the with-skills evaluator performed the explicitly required independent PDF visual review; the baseline only checked its header. Both completed the core workflows. This is not a statistical claim that the skills outperform good README documentation, and no self-assigned quality scores were used.

Near-miss choices were also recorded: both rejected animated 3D GLB work, photorealistic generation, and arbitrary SVG-to-JSON import as unsupported; both accepted validation/export of an existing Agent Draw project. These are evaluator routing responses, **not** measured automatic skill activation in a native host.

Evidence:
- [With-skills run](with-skills.md)
- [Without-skills run](without-skills.md)
- [With-skills modified-runtime run](with-skills-tamper.md)
- [Without-skills modified-runtime run](without-skills-tamper.md)
- [Machine-readable inspection](yoda-inspection.json)

## Inspection: metadata, structure, library fit

All names match their parent directories. Descriptions are below the vendor-neutral 1,024-character limit and the Yoda-documented 1,536-character combined host limit. Final exact counts are in the inspection JSON. Each body is under 500 lines; trigger descriptions identify capability and conditions without substituting for the procedure. No dollar-digit or dollar-ARGUMENTS substitution hazards were found.

Tier allocation: metadata holds triggers; short bodies hold setup/author/export procedures and completion conditions; detailed format and architecture references live in docs. The three workflows intentionally form a sequence: setup is a prerequisite, authoring creates/fixes project JSON, export builds/reviews it. References resolve locally and do not require chasing a chain of references for schema details.

The relevant neighboring library includes agent-sprites (sprite/raster work), agent-meshes (3D), and agent-beeps (audio). Agent Draw's descriptions are explicitly 2D vector/project-oriented. This is inspection of scope and descriptions, not evidence of zero collisions across every installed host.

## Safety evidence is separate

A codepoint scan of every created SKILL.md found no invisible format/surrogate codepoints or disallowed controls. Shell snippets contain no unintentional positional-argument placeholders. The skills were authored locally for this project; the audit procedure came from the user's installed Hartye Skills release identified above. These checks establish bounded provenance and scan results, not blanket safety certification of a native program or natural-language instruction library.

## Remaining limits

The experiment is small and task-specific. It does not establish long-term trigger reliability, cross-host behavior, macOS/Windows support, arbitrary SVG import fidelity, or interactive manual-editing usability. Final runtime fixes are additionally covered by the software tests. See the repository test report for exact executed results.
