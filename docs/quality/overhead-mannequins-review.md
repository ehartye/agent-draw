# Overhead mannequin delivery

Status: complete feature/sample delivery with live previews, passing scoped checks and synced wiki documentation. Plan: [overhead-mannequins-plan.md](overhead-mannequins-plan.md).

Accepted palette: anatomical left blue #2879C7; right red #CC4B4B; head gold #B88016; torso teal #19877B; pelvis purple #8A57AE. This is an Agent Draw convention, not a universal animation standard. Existing reference-left maps to anatomical right in S. Existing E near maps to anatomical right; W near maps to anatomical left.

## Implemented and checked

All 384 parent JSON/SVG guide layers now use the accepted mapping. `guide-palette-bindings.json` retains the original native hashes and new source hashes, plus exact equality of visible SVG serialization with hidden guides excluded. Original PNGs/native receipts retain their original provenance; no fresh native render is implied by this amendment. Ten existing/new construction tests passed before the overhead arm correction; the four focused overhead tests pass after it.

Parent tailnet browser checks passed all 32 clip step/wrap controls, all five actual SVG guide colors, legend, filters, unique DOM IDs, four downloads, phone fit, preserved game and 1,163 served-file hashes with zero page errors. Timing was deliberately not repeated for the hidden-guide-only parent change; previous r3 timing evidence remains separate.

Root inspected native overhead keys for both builds, then corrected the flat pelvis block with a rounded volume and continuous lower back. Superseded r1 art and r2 movement remain in their original output directories; unchanged r2 static pages are retained in the final art. Final overhead drawings use a true height-independent overhead projection; the spatial constructor's old reference-side keys are explicitly remapped to anatomical keys.

## Workflow and remaining acceptance

Explicit workflow-setup invocation selected existing managed 0.4.5 digest `b4ef61d3ae030180e96acf27559365d5892be35bc189fd609d3c4fc6f2454bc6`, Node 24.21.0. Doctor passed authentication, buffered/streamed/PTY commands and cancellation with zero inference requests. Shared Session 0 compatibility was requested and confirmed applied under existing owner authorization. Owned Windows jobs drained without force; arbitrary descendants remain unverified. No plugin/runtime reinstall, account routing change or policy widening was needed.

Key review `9c239b1f-1fc8-4341-9c89-cd479e125f7c`, generation 1, viewed and hash-verified all four revised native key pages. Both standing rows PASS; both run-frame-2 rows GAP because the arms read as a bilateral forward reach. Root changed only overhead walk/run arm phasing and run elbow/upper-arm ranges, retaining measured lengths and exact half-stride exchange. Focused checks cover both builds' corrected passing-key separation. This preserves the reviewers' original GAP; it is not relabeled PASS. The observer consumed attachment through terminal cursor 3; both owned jobs drained unforced, arbitrary descendants unverified.

Final full-set review `4289033c-8c5b-42ea-acdb-6a54ec342746`, generation 1: both build reviewers PASS. Each hash-verified and actually opened 25 PNGs (24 build sheets plus one shared guide key), covering all 384 complete drawings and the guide palette. All 50 coverage rows PASS, with no missing slots. Root separately opened native keys, representative corrected sheets and actual browser captures. Both observers consumed attachment through terminal cursor 3. Advisory quiet warnings occurred during the final run; no failure, retry or permission widening followed. All four review workers completed once with owned Windows jobs drained unforced; arbitrary descendants remain unverified.

## Final exports and browser evidence

Current art uses 96 successful native Inkscape page exports: 32 unchanged static pages from r2 and 64 corrected movement pages from r3. Native source/cell geometry, exact crop pixels, all 384 JSON/SVG/PNG hashes and all 96 serialized page SVGs bind. Every PNG fully decodes with transparent unclipped borders; every movement clip has eight distinct RGBA frames. Individual PNGs are exact unscaled cell crops, not independent-process native exports. The full overhead ZIP has 1,457 byte-verified entries; the amended parent ZIP has 1,171. Historical original native receipts and hidden-guide amendment provenance remain distinct.

Eleven focused construction tests pass. `verify-delivery.mjs` checks all 768 current drawings against generators/serialization/bindings plus native page SVG equality. The actual tailnet overhead browser passes 64 timing traces (32 loops at normal and quarter speed), ordered frame progression and last-to-first wrap, stepping, filters, actual five-color guides, unique IDs, real JSON/SVG/PNG/ZIP downloads, phone fit, preserved game and 1,162 served-file hashes, with zero page errors. Root corrected a mobile heading word-space after the full browser run; final served-byte parity and a fresh mobile capture separately check that text-only change. No timing/player/art change followed the full run.

Preview: https://hal9000.taila5c443.ts.net:8468/mannequins/overhead/?rev=overhead-20261015-r1&pose=run&direction=all . Parent r4 remains at /mannequins/; the Phaser game mount is preserved. Palette/camera/construction lessons are in the feature plugin reference and the canonical wiki. This is feature/sample delivery, not a new installed marketplace release. Static image review and timestamp traces do not certify continuous-video perception, dressed-character movement, collision behavior or owner acceptance.

Wiki completion: operation committed/rebased as `23d2ce85`, pushed to origin/main from the docs feature worktree, with upstream divergence 0/0 and a clean worktree. Native page/cell export support is a planned plugin enhancement; no native API change is claimed. Full worker inspection confirms retained exec-level call/output pairs, command coverage and cleanup; those counts do not independently certify nested image paths. Image-view coverage is the reviewers' explicit report against the frozen inputs, supplemented by root's representative image inspection.
