import test from 'node:test';
import assert from 'node:assert/strict';
import { applicationOnlyChanges, changeCategory, validationScope, changedFiles } from '../../tools/ci-validation-scope.js';

test('presentation changes reuse semantics only when the published fingerprint matches', () => {
  const files = ['src/app/drawer-labels-ja.js', 'tests/e2e/drawer-labels-ja.spec.js', 'docs/DRAWER_LABELS_JA.md'];
  assert.equal(validationScope({ fingerprintMatches: true, files }), 'application');
  assert.equal(validationScope({ fingerprintMatches: false, files }), 'candidate');
});

test('price update orchestration changes skip unrelated published semantics', () => {
  const files = ['.github/workflows/price-update.yml'];
  assert.equal(applicationOnlyChanges(files), true);
  assert.equal(validationScope({ fingerprintMatches: true, files }), 'application');
  assert.equal(validationScope({ fingerprintMatches: false, files }), 'candidate');
  assert.equal(validationScope({ fingerprintMatches: true, files: [...files, 'src/pricing/core.js'] }), 'published');
});

test('known CI-control edits do not trigger published semantic validation', () => {
  const files = ['.github/workflows/ci.yml', '.github/workflows/onboarding-promotion.yml', '.github/workflows/price-validation.yml', 'tools/ci-validation-scope.js', 'tools/ci-validate.js', 'tools/ci-semantic-plan.js'];
  for (const file of files) {
    assert.equal(changeCategory(file), 'ci-control', file);
    assert.equal(validationScope({ fingerprintMatches: true, files: [file] }), 'application', file);
    assert.equal(validationScope({ fingerprintMatches: false, files: [file] }), 'candidate', file);
  }
  assert.equal(validationScope({ fingerprintMatches: true, files: ['tools/ci-validation-scope.js', '.github/workflows/onboarding-promotion.yml', 'tests/pricing/ci-scope.test.js'] }), 'application');
  assert.equal(validationScope({ fingerprintMatches: true, files: [...files, 'services/ec2/service.json'] }), 'published');
});

test('pricing, data, dependencies, unknown workflow and unknown changes fail safe', () => {
  for (const file of ['src/pricing/core.js', 'services/ec2/service.json', 'pricing/generated/manifest.json', 'package-lock.json', '.github/workflows/new-unclassified.yml', 'tools/pricing-cli/semantic-plan.js', 'unknown']) {
    assert.equal(applicationOnlyChanges(['src/app/app.js', file]), false, file);
    assert.equal(validationScope({ fingerprintMatches: true, files: [file] }), 'published', file);
  }
  for (const files of [null, [], undefined]) assert.equal(validationScope({ fingerprintMatches: true, files }), 'published');
});

test('missing or invalid comparison history never authorizes semantic reuse', async () => {
  assert.equal(await changedFiles('0'.repeat(40)), null);
  assert.equal(await changedFiles('untrusted-ref'), null);
  assert.equal(await changedFiles('f'.repeat(40)), null);
});

test('onboarding merge worktree scope does not fall back to published baseline', async () => {
  const previous = process.env.CI_VALIDATION_WORKTREE;
  process.env.CI_VALIDATION_WORKTREE = 'true';
  try {
    // No staged changes in a clean checkout; unlike a missing base SHA,
    // the worktree mode returns a concrete (possibly empty) changed-file list.
    const files = await changedFiles();
    assert.ok(Array.isArray(files));
    assert.equal(validationScope({ fingerprintMatches: true, files: ['src/app/labels.js'] }), 'application');
    assert.equal(validationScope({ fingerprintMatches: true, files: ['src/pricing/core.js'] }), 'published');
  } finally {
    if (previous === undefined) delete process.env.CI_VALIDATION_WORKTREE;
    else process.env.CI_VALIDATION_WORKTREE = previous;
  }
});
