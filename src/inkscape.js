import { spawnSync } from 'node:child_process';

export const INKSCAPE_INSTALL_URL = 'https://inkscape.org/release/';
export const INKSCAPE_INSTALL_GUIDE = 'https://wiki.inkscape.org/wiki/Installing_Inkscape';

export function installAdvice(platform = process.platform) {
  const common = 'Install Inkscape 1.2 or newer from the official distribution. No automatic installation was attempted.';
  if (platform === 'darwin') return `${common} Choose the official macOS build for your Intel or Apple silicon Mac. If it is not on PATH, set AGENT_DRAW_INKSCAPE to the executable inside Inkscape.app. macOS execution is not yet verified by this project.`;
  if (platform === 'win32') return `${common} Use the official Windows installer. Select inkscape.com for console use when available, or set AGENT_DRAW_INKSCAPE to its full executable path. Windows execution is not yet verified by this project.`;
  return `${common} Use your Linux distribution's software installer or an official Inkscape package, then check inkscape --version. Set AGENT_DRAW_INKSCAPE if the executable is not on PATH.`;
}

// An explicit override is authoritative: a broken override is never silently ignored.
export function inspectInkscape({ platform = process.platform, env = process.env } = {}) {
  const override = env.AGENT_DRAW_INKSCAPE;
  const candidates = override !== undefined ? [override] : platform === 'win32'
    ? ['inkscape.com', 'inkscape.exe']
    : platform === 'darwin'
      ? ['inkscape', '/Applications/Inkscape.app/Contents/MacOS/inkscape']
      : ['inkscape'];
  const attempts = [];
  for (const command of candidates) {
    let result;
    try { result = spawnSync(command, ['--version'], { env, encoding: 'utf8', timeout: 10000, maxBuffer: 1048576 }); }
    catch (error) { result = { error }; }
    const output = (result.stdout || '').trim();
    const match = /^Inkscape (\d+)\.(\d+)(?:\.(\d+))?\b/.exec(output);
    let status;
    if (result.error?.code === 'ENOENT') status = 'missing';
    else if (result.error || result.status !== 0) status = 'probe-failed';
    else if (!match) status = 'unrecognized-version';
    else if (Number(match[1]) < 1 || (Number(match[1]) === 1 && Number(match[2]) < 2)) status = 'too-old';
    else status = 'ready';
    const attempt = { command, status, version: match ? match[0].slice(9) : null,
      versionText: output || null, error: result.error?.message || (status === 'probe-failed' ? `Exit ${result.status}: ${(result.stderr || '').trim().slice(0,1000)}` : null) };
    attempts.push(attempt);
    // Only a missing conventional command permits a platform fallback.
    if (status !== 'missing' || override !== undefined) break;
  }
  const chosen = attempts.at(-1);
  return { ok: chosen.status === 'ready', ...chosen, minimumVersion: '1.2',
    explicitOverride: override !== undefined, attempts, platform, verifiedPlatforms: ['linux'],
    installUrl: INKSCAPE_INSTALL_URL, installGuide: INKSCAPE_INSTALL_GUIDE,
    advice: chosen.status === 'ready'
      ? 'CLI version probe passed. Run doctor --smoke to verify real SVG, PNG, and PDF export.'
      : override !== undefined && chosen.status !== 'too-old'
        ? `The explicit AGENT_DRAW_INKSCAPE selection ${JSON.stringify(chosen.command)} did not pass its probe. Check that selected path and its executable permissions first; an existing installation may already be available elsewhere. Do not silently change or ignore the selection. Ask before updating it, then rerun setup and doctor --smoke. Install Inkscape only if no suitable existing installation is available. No automatic installation was attempted.`
        : installAdvice(platform) };
}

export function findInkscape() {
  const report = inspectInkscape();
  if (!report.ok) {
    const reason = report.status === 'missing' ? 'Inkscape 1.2+ CLI not found.'
      : report.status === 'too-old' ? `Inkscape 1.2+ is required; found ${report.version}.`
        : `Inkscape CLI probe failed (${report.status}) for ${JSON.stringify(report.command)}.`;
    const error = new Error(`${reason} ${report.advice} ${report.installUrl}`);
    error.details = report;
    throw error;
  }
  return { command: report.command, version: report.versionText, status: report.status,
    minimumVersion: report.minimumVersion, installUrl: report.installUrl };
}
