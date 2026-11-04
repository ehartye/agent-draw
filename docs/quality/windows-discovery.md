# Windows Inkscape discovery verification (0.5.2)

The detector checks PATH first, then a bounded list of conventional machine-install
locations. See [setup](../../skills/draw-setup/SKILL.md) for ordering and
[architecture](../architecture.md) for trust and timeout limits. An explicit
override remains authoritative. Only missing executables allow fallback; failed
probes identify the selected path and retain its error/output.

## Portable regression coverage

`node --test tests/windows-discovery.test.js` passed all 10 tests. Injected process
results exercise PATH precedence, paths with spaces, console/GUI order, root
deduplication and case, absent roots, relative/network exclusions, all-missing
diagnostics, failed/old/unrecognized/timed-out probes, explicit empty/broken/valid
overrides, an existing file whose launch reports ENOENT, and unchanged non-Windows
selection. They do not pretend to execute a Windows binary on Linux.

## Native Windows acceptance, 2026-11-04

Node 24.18.0 and installed Inkscape 1.4.4 (dcaf3e7, 2026-05-05) were used. The
fixture removed PATH and the override, used a disposable managed home and isolated
profile/temp locations, and left project inputs intact. The released 0.5.1
detector reported missing; the new detector tried both missing PATH names and
selected `C:\Program Files\Inkscape\bin\inkscape.com`. Explicit valid and missing
overrides each attempted exactly one executable.

Managed setup and `--check` succeeded. On the serial acceptance run, managed
`doctor --smoke` exported the 16x16 SVG/PNG/PDF fixture, and managed `sequence`
exported all four `drawn-fire` poses plus a 700x240 contact sheet. Source hashes,
output PNG structure and receipt hashes were checked. These are native export
measurements, not visual/art acceptance, font fidelity or full Windows support.

## Retained failures and limits

- The broad Windows suite reported **211 passed, 38 failed, 6 skipped** across
  255 tests. Failures include POSIX shebang executable fixtures, unavailable
  symlink privileges, renderer probing/export behavior and optional FFmpeg
  assumptions. This is a failed Windows suite, not a passing release qualification.
  Linux remains the configured full-suite CI platform.
- An acceptance attempt concurrent with that suite timed out probing the selected
  renderer. A serial run completed setup and both export commands. The timeout's
  cause was not established; success on retry does not erase it.
- The serial harness then failed its extra empty-temp-directory assertion:
  renderer-created D-Bus nonce/keyring files remained in the disposable fixture.
  Those files and command receipts were retained, and process inspection found no
  remaining Inkscape processes. This change does not fix renderer temp cleanup.
- Fontconfig `SHGetFolderPathA`/configuration warnings from the isolated Windows
  profile remain in the successful export receipts. No renderer was installed,
  no user assets were overwritten, and no system configuration was changed.

Custom/portable locations, UNC paths and per-user installs are not searched;
use `AGENT_DRAW_INKSCAPE` for a deliberately selected executable. Discovery does
not authenticate the binary. macOS execution remains unqualified.
