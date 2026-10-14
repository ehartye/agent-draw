# Named-part animation verification

2026-10-14, Linux, Node.js 24.19.0, Inkscape 1.4, FFmpeg 7.1.5.

- Full suite: 196 tests passed, zero failures/skips. Includes prior static/craft coverage, bounded groups and transforms, absolute timeline interpolation, canonical virtual-endpoint closure, actual PNG motion/alpha, GIF/MP4 encoding, output guards, symlink refusal, deadline-bound probes, and cleanup after failed encoding.
- Every authoring reference JSON example validates against the actual schema, including the complete animation example.
- Managed setup/check and doctor --smoke passed from an isolated runtime home.
- Waving ORBIT: 41 vector leaves grouped into stable body, raised-arm, left-arm, head and antenna IDs. 24 frames at 12 fps on a 512×512 transparent canvas. SVG master, all SVG/PNG frames, normalized JSON, contact sheet, GIF, MP4, and receipt were created by the actual runtime.
- ffprobe independently confirmed both encodings contain 24 frames and run for 2.000 seconds; MP4 is H.264 at 12 fps. The contact sheet was visually reviewed: arm and antenna movement visible, body bob subtle, no clipping or paint-ID artifacts.
- A canonical SVG comparison verifies frame 0 equals the virtual loop endpoint. This proves endpoint closure, not motion quality or an observed real-time playback test. Contact-sheet review is a sampled visual check.
- CI configuration adds distro FFmpeg and a managed animation export smoke. This phase has not been published or run through remote CI yet.

## Limits

Only Linux is verified. GIF thresholds partial transparency and quantizes timing to centiseconds. MP4 requires an explicit opaque background, even dimensions, and an FFmpeg build with libx264. Frame export/contact sheets work without FFmpeg. Timelines support bounded group translation, rotation, scale and opacity; no path morphing, automatic rigging, generated directional views, physics, arbitrary SVG import or external scripts. The static build uses base transforms; animate's master is timeline sample 0.
