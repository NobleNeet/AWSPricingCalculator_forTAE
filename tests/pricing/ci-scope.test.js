import test from 'node:test';
import assert from 'node:assert/strict';
import { applicationOnlyChanges, validationScope, changedFiles } from '../../tools/ci-validation-scope.js';

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

test('pricing, data, dependencies, other workflow and unknown changes fail safe', () => {
  for (const file of ['src/pricing/core.js', 'services/ec2/service.json', 'pricing/generated/manifest.json', 'package-lock.json', '.github/workflows/ci.yml', 'tools/ci-validate.js', 'unknown']) {
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
