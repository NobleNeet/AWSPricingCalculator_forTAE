import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// Only explicitly known presentation/test/documentation changes may reuse the
// published semantic baseline. Unknown paths and unavailable history fail safe.
export function applicationOnlyChanges(files) {
  return Array.isArray(files) && files.length > 0 && files.every(file =>
    /^(src\/app\/|tests\/|docs\/|mock\/)/.test(file)
    || /^(index\.html|README\.md|AGENTS\.md|\.gitignore)$/.test(file)
  );
}

export async function changedFiles(base = process.env.CI_BASE_SHA) {
  if (!base || !/^[a-f0-9]{40}$/i.test(base) || /^0+$/.test(base)) return null;
  try {
    // PRs compare with the merge base; pushes compare with the previous head.
    const comparison = process.env.CI_EVENT_NAME === 'pull_request'
      ? (await execFileAsync('git', ['merge-base', base, 'HEAD'])).stdout.trim()
      : base;
    const { stdout } = await execFileAsync('git', ['diff', '--name-only', '-z', comparison, 'HEAD'], { maxBuffer: 8 * 1024 * 1024 });
    return stdout.split('\0').filter(Boolean);
  } catch { return null; }
}

export function validationScope({ fingerprintMatches, files }) {
  if (!fingerprintMatches) return 'candidate';
  return applicationOnlyChanges(files) ? 'application' : 'published';
}
