import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// Classify known CI orchestration separately from pricing semantics. These files
// are covered by CI tests but do not change the published pricing data or
// calculator behavior. Unrecognized files and unavailable history fail closed.
const CI_CONTROL_FILES = new Set([
  '.github/workflows/ci.yml',
  '.github/workflows/onboarding-promotion.yml',
  '.github/workflows/price-update.yml',
  '.github/workflows/price-validation.yml',
  'tools/ci-validate.js',
  'tools/ci-validation-scope.js',
  'tools/ci-semantic-plan.js',
]);

export function changeCategory(file) {
  if (CI_CONTROL_FILES.has(file)) return 'ci-control';
  if (/^(src\/app\/|tests\/|docs\/|mock\/)/.test(file)
    || /^(index\.html|README\.md|AGENTS\.md|\.gitignore)$/.test(file)) return 'application';
  return 'pricing-or-unknown';
}
export function applicationOnlyChanges(files) {
  return Array.isArray(files) && files.length > 0
    && files.every(file => changeCategory(file) !== 'pricing-or-unknown');
}

export async function changedFiles(base = process.env.CI_BASE_SHA) {
  if (process.env.CI_VALIDATION_WORKTREE === 'true') {
    try {
      // Promotion validates an uncommitted merge; compare its full index/worktree
      // against HEAD rather than the CI event's pre-merge SHA.
      const { stdout } = await execFileAsync('git', ['diff', '--name-only', '-z', 'HEAD'], { maxBuffer: 8 * 1024 * 1024 });
      return stdout.split('\\0').filter(Boolean);
    } catch { return null; }
  }
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
