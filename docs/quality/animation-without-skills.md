# Agent Draw behavioral evaluation: WITHOUT skills

## Outcome

An original 128×128 character, “Pebble Waver,” was authored and exported as a 12-frame, 12-fps loop with a waving arm and 4-pixel body bob. GIF and MP4 both exported and decoded successfully. Named group IDs and their animation tracks remained correct after unrelated group reordering. An explicitly missing FFmpeg executable caused the requested GIF export to fail without fallback or installation; a static SVG/PNG/PDF build succeeded with that same missing override.

This report has no self-score. No repository files were edited and no remote writes occurred. All authored inputs, output files, evaluation helpers, and logs are isolated under `/tmp/animation-eval-without`; managed runtime home was `/tmp/animation-eval-without/home`.

## Allowed material consulted

- `README.md`
- `docs/project-format.md`
- `package.json` and CLI help
- `src/animation.js`, `src/timeline.js`, `src/ffmpeg.js`
- Directory listings of `src` and `tests`

No files under `skills/` or `docs/quality/` were read. README linked to these areas, but those links were not followed.

## Exact command record

Working directory: `/workspace/shared/agent-draw-worktrees/animation`.

Initial commands, before the persistent shell transcript was created:

```sh
pwd && ls -la
sed -n '1,240p' README.md
sed -n '1,260p' docs/project-format.md
mkdir -p /tmp/animation-eval-without
export AGENT_DRAW_HOME=/tmp/animation-eval-without/home
node scripts/setup.js --check --json
node src/cli.js --help
cat package.json
ls src tests
command -v inkscape ffmpeg ffprobe
node scripts/setup.js --json
node scripts/run-managed.js doctor --smoke
node scripts/run-managed.js --help
sed -n '1,230p' src/animation.js
cat src/timeline.js
cat src/ffmpeg.js
```

The original drawing was constructed by `/tmp/animation-eval-without/create-project.py`; its full source and generated project JSON are retained. The main authoring/export/failure commands are retained exactly in `run.sh`; stdout, stderr, shell tracing, and explicit exit codes are in `commands.log`. Verification commands are in `verify.sh` with output in `verification.log`, and sampling/assertion code is in `verify.mjs`.

Main run commands:

```sh
export AGENT_DRAW_HOME=/tmp/animation-eval-without/home
node scripts/run-managed.js validate /tmp/animation-eval-without/pebble-waver.json
node scripts/run-managed.js inspect /tmp/animation-eval-without/pebble-waver.json
node scripts/run-managed.js animate /tmp/animation-eval-without/pebble-waver.json --out /tmp/animation-eval-without/original --gif --mp4 --background '#F8F1DF' --timeout 120
node scripts/run-managed.js animate /tmp/animation-eval-without/pebble-waver-reordered.json --out /tmp/animation-eval-without/reordered --timeout 120
AGENT_DRAW_FFMPEG=/definitely/missing/ffmpeg node scripts/run-managed.js animate /tmp/animation-eval-without/pebble-waver.json --out /tmp/animation-eval-without/missing-ffmpeg --gif
AGENT_DRAW_FFMPEG=/definitely/missing/ffmpeg node scripts/run-managed.js build /tmp/animation-eval-without/pebble-waver.json --out /tmp/animation-eval-without/static-without-ffmpeg
```

Verification commands:

```sh
node /tmp/animation-eval-without/verify.mjs
node scripts/run-managed.js validate /tmp/animation-eval-without/unsupported-import.json
node scripts/run-managed.js validate /tmp/animation-eval-without/unsupported-morph.json
ffprobe -v error -count_frames -show_entries stream=codec_name,width,height,nb_read_frames,r_frame_rate,avg_frame_rate,duration -show_entries format=duration -of json /tmp/animation-eval-without/original/animation.gif
ffprobe -v error -count_frames -show_entries stream=codec_name,width,height,nb_read_frames,r_frame_rate,avg_frame_rate,duration -show_entries format=duration -of json /tmp/animation-eval-without/original/animation.mp4
mkdir /tmp/animation-eval-without/decoded-gif /tmp/animation-eval-without/decoded-mp4
ffmpeg -v error -i /tmp/animation-eval-without/original/animation.gif -fps_mode passthrough /tmp/animation-eval-without/decoded-gif/%02d.png
ffmpeg -v error -i /tmp/animation-eval-without/original/animation.mp4 -fps_mode passthrough /tmp/animation-eval-without/decoded-mp4/%02d.png
```

The two later FFmpeg commands only decoded the already successfully generated original files for QA; they were not a retry or replacement encoder for the deliberately failed GIF request.

## Task 1: Original character, exports, and visual review

The original character uses a mint elliptical body, cream face, amber hand, dark limbs, a pocket, and a small smile. It has stable groups `body`, `left-arm`, and `wave-arm`; decor uses `left-spark`, `right-spark`, and `shadow`. The wave arm is nested under the body and has local translation `(23, -9)` with explicit local rotation pivot `(0, 0)`. Its sleeve and hand geometry are placed relative to that shoulder pivot.

The timeline has 12 frames at 12 fps. Two smoothstep tracks use a virtual endpoint at frame 12:

- `wave-arm.rotation`: frame 0 = −25°, frame 6 = +25°, frame 12 = −25°
- `body.y`: frame 0 = 70, frame 6 = 66, frame 12 = 70

The canvas includes an opaque `#F8F1DF` background rectangle. The encode command also explicitly supplies `--background '#F8F1DF'`. This makes both GIF and MP4 visibly opaque; MP4 encoding uses the requested backdrop.

Observed exports:

- `original/master.svg`: editable sample-zero SVG with `part-body`, `part-wave-arm`, and other stable group IDs
- `original/project.json`: normalized rebuildable project including timeline
- `original/frames/frame-0000.svg` / `.png` through `frame-0011.svg` / `.png`
- `original/contact-sheet.svg` and `.png`: poses 0, 3, 6, 9, 11
- `original/animation.gif`: 19,606 bytes
- `original/animation.mp4`: 4,672 bytes
- `original/receipt.json`: hashes, provenance, source, timeline, formats, background, and endpoint evidence

All receipt artifact hashes were independently recomputed and matched. Both encoded files were decoded to PNG frames successfully. FFprobe found 128×128 dimensions, 12 decoded frames, and 1.000000-second duration in both files. MP4 is H.264 at exact reported `12/1` frame rate. GIF frame delays inspected with Pillow are `[80,90,80,80,90,80,80,90,80,80,90,80]` milliseconds, totaling 1000 ms; the loop value is `0` (infinite). GIF's reported rate fields are inconsistent-looking (`12000/1001` and `25/2`), so the actual 12 frames and individual centisecond delays are the useful timing evidence, rather than assuming an exact 12-fps GIF cadence.

### Visual observations

I opened and visually inspected:

1. `original/contact-sheet.png`
2. `static-without-ffmpeg/drawing.png`
3. `decoded-review.png`, a side-by-side comparison of source PNG poses, decoded GIF poses, and decoded MP4 poses at 0, 3, 6, 9, 11, and 0 again

The character remains fully within the canvas. The raised hand stays attached at the shoulder, the body visibly rises at frame 6, and the facial features and feet stay coherent. The cream backdrop is present throughout. The GIF retains the artwork's colors and edge appearance well at this size. The MP4 has visibly softer/chroma-shifted edges compared with the PNG/GIF, consistent with the encoder's YUV420 representation; no missing geometry or blank frames appeared in inspected poses. Static export has the intended base pose.

### Seam closure versus playback QA

`checkLoopSeam` returned `{ "closed": true, "method": "canonical SVG equality at virtual endpoint" }`. Sample 12 equals sample 0; only frames 0–11 were exported. At frame 11 the body is at y ≈ 69.703704 and the arm is at −21.296296°, followed by frame 0 at y = 70 and −25°. The smoothstep segments reach zero velocity at the shared endpoint by construction.

That establishes closed state and a deliberately eased seam. The contact sheet and decoded-pose review establish pose correctness. They do not establish real-time playback quality. I did not observe these files playing continuously in a media player, so I do not claim subjective playback smoothness or player looping behavior was verified. GIF's 80/90-ms timing quantization is present; MP4 repeat behavior still depends on the playback application.

## Task 2: Stable IDs and unsupported near miss

Original top-level order:

`Cream background, left-spark, right-spark, shadow, body`

Reordered top-level order:

`Cream background, body, right-spark, shadow, left-spark`

The nonoverlapping body and decor were reordered without changing any animation track, ID, or geometry. This changed the body's top-level array index from 4 to 1. Both animation exports succeeded. For every sample 0 through virtual endpoint 12, the sampled `body` and `wave-arm` transforms were deep-equal across the two input projects. All 12 output PNG frames were compared as RGBA pixels and were pixel-identical. Evidence is in `verification.json`, `pixel-verification.json`, and the retained original/reordered outputs.

Exact response to a request for SVG import and path morph:

“Agent Draw doesn't import arbitrary SVG files or morph path shapes. I can recreate a supported subset as editable project geometry, then animate named groups with translation, rotation, scale, or opacity. If you need the original SVG imported intact or true path morphing, this tool can't do that.”

I also tested two unsupported forms. A `type: "svg"` input and an animation track with `property: "d"` were both rejected before rendering. Their verbatim errors are below.

## Task 3: Explicit missing FFmpeg diagnosis and usable static export

With `AGENT_DRAW_FFMPEG=/definitely/missing/ffmpeg`, the GIF command exited 1. The diagnostic identified the exact attempted path, explicit override, `missing` status, and `spawnSync ... ENOENT`. The failure occurred before creating `/tmp/animation-eval-without/missing-ffmpeg`; existence was checked and was false. No FFmpeg was installed, and the failed GIF request was not retried with another executable.

The same explicit missing override remained set on a static `build` command, which exited 0 and created valid `drawing.svg`, `drawing.png`, `drawing.pdf`, and `receipt.json` under `static-without-ffmpeg`. The PNG was opened and visually reviewed. The static build is the base project state rather than a timeline export.

Exact diagnosis to the user would be:

“The GIF export stopped because your explicit FFmpeg path, /definitely/missing/ffmpeg, doesn't exist. I haven't installed anything or changed that selection. The static SVG, PNG, and PDF export still works. To retry GIF encoding, provide or approve a working FFmpeg path.”

## Failures and warnings, verbatim

First isolated runtime check, expected before local setup:

```json
{"ok":false,"error":"Managed runtime missing. Run node scripts/setup.js first."}
```

I initially guessed the wrong CLI file while seeking help. This was an evaluator command error, not a product CLI failure. It was corrected by reading `package.json` and using the documented managed entry point:

```text
node:internal/modules/cjs/loader:1520
  throw err;
  ^

Error: Cannot find module '/workspace/shared/agent-draw-worktrees/animation/src/cli.js'
    at Module._resolveFilename (node:internal/modules/cjs/loader:1517:15)
    at wrapResolveFilename (node:internal/modules/cjs/loader:1071:27)
    at defaultResolveImplForCJSLoading (node:internal/modules/cjs/loader:1095:10)
    at resolveForCJSWithHooks (node:internal/modules/cjs/loader:1122:12)
    at Module._load (node:internal/modules/cjs/loader:1294:5)
    at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
    at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
    at node:internal/main/run_main_module:33:47 {
  code: 'MODULE_NOT_FOUND',
  requireStack: []
}

Node.js v24.19.0
```

Requested GIF with explicit missing FFmpeg (exit 1):

```json
{"ok":false,"error":"FFmpeg missing. The explicit AGENT_DRAW_FFMPEG selection did not pass its probe. Check that path and its executable permissions first; another existing installation may already be available. Do not silently ignore the selection. Ask before changing it. Frames-only export remains available. No automatic installation was attempted. https://ffmpeg.org/download.html","details":{"ok":false,"command":"/definitely/missing/ffmpeg","status":"missing","version":null,"explicitOverride":true,"optional":true,"installUrl":"https://ffmpeg.org/download.html","advice":"The explicit AGENT_DRAW_FFMPEG selection did not pass its probe. Check that path and its executable permissions first; another existing installation may already be available. Do not silently ignore the selection. Ask before changing it. Frames-only export remains available. No automatic installation was attempted.","error":"spawnSync /definitely/missing/ffmpeg ENOENT"}}
```

Unsupported SVG import test (exit 1):

```json
{"ok":false,"error":"layers[5]: unsupported type"}
```

Unsupported path-morph property test (exit 1):

```json
{"ok":false,"error":"animation.tracks[0].property: unsupported property"}
```

Inkscape emitted repeated nonfatal wrapper warnings on successful doctor and export runs. One exact example from the static PNG receipt:

```text
** (inkscape:344): WARNING **: 15:08:38.438: Failed to wrap object of type 'PangoFT2FontMap'. Hint: this error is commonly caused by failing to call a library init() function.

** (inkscape:344): WARNING **: 15:08:38.842: Failed to wrap object of type 'GtkRecentManager'. Hint: this error is commonly caused by failing to call a library init() function.
```

Full warning instances are retained verbatim in `commands.log` and output receipts. These warnings did not cause nonzero exits.

## User-visible friction and wording observations

- The documented setup flow was sufficient without skills. The first-use `--check` error explicitly pointed to setup; setup copied the runtime locally and correctly left real render verification to `doctor --smoke`.
- My attempted `src/cli.js` entry point was wrong. README already gave the correct managed command, so this is recorded as evaluator friction rather than attributed to missing documentation.
- The missing-FFmpeg diagnostic was actionable and honored the explicit executable choice. Its JSON repeats much of the explanation in both `error` and `details.advice`, which is verbose when shown directly to a user.
- Unsupported import/morph validation correctly rejects the near misses, but the errors only say `unsupported type` or `unsupported property`. They do not list supported types/properties or explain the alternative group-transform workflow. The exact explanatory response in Task 2 supplies that context without promising import or morph support.
- Successful exports retain long repeated Pango/Gtk warnings in their receipts and CLI output. They are nonfatal, but could be mistaken for failure if the final `ok`/exit status is not surfaced clearly.
- The receipt says `fps: 12`, while GIF necessarily stores quantized 80/90-ms delays. The receipt's explicit timing limitation is useful, and the distinction should survive any user-facing summary.
- `--background` supplies the MP4 composite background. For this opaque GIF, the authored full-canvas cream rectangle is what ensures opacity. The CLI flag was not assumed to flatten GIF transparency.
- Endpoint equality, the contact sheet, and decoded-frame review are different evidence from actual playback. The report keeps those limits explicit and does not upgrade them into an unsupported playback-quality claim.

## Environment and key retained files

- Agent Draw version: 0.3.0
- Node: 24.19.0
- Inkscape: `Inkscape 1.4 (e7c3feb100, 2024-10-09)`
- FFmpeg: `7.1.5-0+deb13u1`
- Setup fingerprint: `04b892bc0d60215abee9d302b033fc739b3932ae05e54739b3459b4ac6529efd`
- Runtime: `/tmp/animation-eval-without/home/releases/0.3.0-04b892bc0d60215a`
- Original source: `/tmp/animation-eval-without/pebble-waver.json`
- Reordered source: `/tmp/animation-eval-without/pebble-waver-reordered.json`
- Original deliverable bundle: `/tmp/animation-eval-without/original/`
- Reordered frame evidence: `/tmp/animation-eval-without/reordered/`
- Static export under failing FFmpeg override: `/tmp/animation-eval-without/static-without-ffmpeg/`
- Visual decode comparison: `/tmp/animation-eval-without/decoded-review.png`
- Command logs: `/tmp/animation-eval-without/commands.log`, `/tmp/animation-eval-without/verification.log`
- Structured evidence: `/tmp/animation-eval-without/verification.json`, `/tmp/animation-eval-without/pixel-verification.json`, `/tmp/animation-eval-without/gif-probe.json`, `/tmp/animation-eval-without/mp4-probe.json`
