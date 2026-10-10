import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { priceUpdate } from '../../tools/price-update.js';
import { promoteBuild } from '../../tools/publish-price-build.js';
import { writeJson } from '../../tools/pricing-cli/cli.js';
import { report } from '../../tools/pricing-cli/report.js';
import { buildPriceDb, checksum } from '../../tools/pricing-cli/build.js';
import { normalize } from '../../tools/pricing-cli/normalize.js';
import { rawFixture } from '../fixtures/raw.js';
import { fixturePackage } from '../fixtures/definitions.js';
import { contractFingerprints, definitionFingerprint } from '../../tools/pricing-cli/fingerprint.js';
import { loadPackages } from '../../tools/pricing-cli/package-loader.js';

test('NO_CHANGE pipeline never downloads; breaking and ERROR never build', async () => {
  for (const scenario of ['NO_CHANGE', 'STRUCTURE_BREAKING', 'VALIDATION_ERROR']) {
    const work = await mkdtemp(path.join(tmpdir(), 'tae-update-')), commands = [];
    const execute = async command => {
      commands.push(command);
      if (command === 'check-source') return report(command, [], { sourceStatus: scenario === 'NO_CHANGE' ? 'NO_CHANGE' : 'CHANGED' });
      if (command === 'classify-change') return report(command, [], { classification: scenario === 'STRUCTURE_BREAKING' ? 'STRUCTURE_BREAKING' : 'PRICE_ONLY', publishable: scenario !== 'STRUCTURE_BREAKING' });
      if (command === 'validate-price-data' && scenario === 'VALIDATION_ERROR') return report(command, [{ severity: 'error', code: 'AMBIGUOUS_SKU', message: 'ambiguous' }]);
      return report(command);
    };
    const packages = await loadPackages();
    const result = await priceUpdate({
      work,
      execute,
      previousDefinitionSha256: await definitionFingerprint(packages),
      previousContractFingerprints: await contractFingerprints(packages)
    });
    assert.equal(result.publishable, false); assert.equal(commands.includes('build'), false);
    if (scenario === 'NO_CHANGE') assert.deepEqual(commands, ['check-source']);
    else if (scenario === 'VALIDATION_ERROR') assert.deepEqual(commands, ['check-source', 'download', 'normalize', 'inventory', 'validate-definitions', 'validate-price-data', 'run-golden']);
    else assert.deepEqual(commands, ['check-source', 'download', 'normalize', 'inventory', 'validate-definitions', 'validate-price-data', 'run-golden', 'classify-change']);
  }
});
test('unchanged AWS metadata still refreshes raw source when Definition fingerprint changes', async () => {
  const work = await mkdtemp(path.join(tmpdir(), 'tae-definition-update-')), commands = [];
  const execute = async (command, options) => {
    commands.push(command);
    if (command === 'check-source') {
      await writeJson(options.output, { schemaVersion: 1, status: 'NO_CHANGE', sources: { Example: { changed: false } } });
      return report(command, [], { sourceStatus: 'NO_CHANGE' });
    }
    if (command === 'validate-price-data') return report(command, [{ severity: 'error', code: 'SKU_NOT_FOUND', message: 'missing' }]);
    if (command === 'classify-change') return report(command, [], { classification: 'STRUCTURE_BREAKING', publishable: false });
    return report(command);
  };
  const result = await priceUpdate({ work, execute, previousDefinitionSha256: 'changed-definition' });
  assert.equal(result.status, 'REJECTED'); assert.ok(commands.includes('download'));
  assert.equal(commands.includes('classify-change'), false);
  const metadata = JSON.parse(await readFile(path.join(work, 'source-metadata.json'))); assert.equal(metadata.sources.Example.changed, true);
  const change = JSON.parse(await readFile(path.join(work, 'reports/classify-change.json')));
  assert.equal(change.classification, 'STRUCTURE_BREAKING');
  assert.equal(change.skippedDueToValidation, true);
});
async function stagedFixture(classification) {
  const work = await mkdtemp(path.join(tmpdir(), 'tae-promote-')), generated = path.join(work, 'generated'), stage = path.join(work, 'stage'), reports = path.join(work, 'reports');
  await mkdir(path.join(generated, 'builds/old-old'), { recursive: true }); await mkdir(path.join(generated, 'builds/current'), { recursive: true });
  await writeJson(path.join(generated, 'manifest.json'), { schemaVersion: 1, activeBuildId: 'current', publicationDate: '2026-01-01' });
  const raw = rawFixture(), candidate = { data: { Example: normalize(raw, 'ap-northeast-1').data }, metadata: { sources: { Example: { serviceCode: 'Example', region: 'ap-northeast-1', sourceUrl: 'https://example.aws/price', version: raw.version, publicationDate: raw.publicationDate } } } };
  await buildPriceDb(candidate, path.join(stage, 'pricing'), 'candidate', { issues: [] });
  const proof = { schemaVersion: 1, status: 'VALIDATED', publishable: true, previousBuildId: 'current', buildId: 'candidate', classification, buildManifestSha256: checksum(await readFile(path.join(stage, 'pricing/builds/candidate/build-manifest.json'), 'utf8')) };
  await writeJson(path.join(reports, 'summary.json'), proof);
  for (const command of ['validate-definitions', 'validate-price-data', 'run-golden', 'classify-change', 'build']) await writeJson(path.join(reports, `${command}.json`), report(command, [], command === 'classify-change' ? { classification, publishable: classification !== 'STRUCTURE_BREAKING' } : {}));
  return { stage, reports, generated, catalogFile: path.join(work, 'catalog.json'), fixtureDirectory: null, packages: [fixturePackage()] };
}
test('PRICE_ONLY and STRUCTURE_WARNING promote verified resources with current+previous retention', async () => {
  for (const classification of ['PRICE_ONLY', 'STRUCTURE_WARNING']) {
    const options = await stagedFixture(classification);
    assert.equal((await promoteBuild(options)).activeBuildId, 'candidate');
    assert.equal(JSON.parse(await readFile(path.join(options.generated, 'manifest.json'))).activeBuildId, 'candidate');
    assert.deepEqual((await readdir(path.join(options.generated, 'builds'))).sort(), ['candidate', 'current']);
  }
});
test('breaking, failed validation, corrupted build and concurrent active change leave active untouched', async () => {
  for (const scenario of ['breaking', 'error', 'corrupt', 'concurrent']) {
    const options = await stagedFixture(scenario === 'breaking' ? 'STRUCTURE_BREAKING' : 'PRICE_ONLY');
    if (scenario === 'error') await writeJson(path.join(options.reports, 'validate-price-data.json'), report('validate-price-data', [{ severity: 'error', code: 'UNIT_MISMATCH', message: 'mismatch' }]));
    if (scenario === 'corrupt') await writeJson(path.join(options.stage, 'pricing/builds/candidate/indexes/Example/ap-northeast-1/index.json'), {});
    if (scenario === 'concurrent') options.expectedPrevious = 'different';
    const before = await readFile(path.join(options.generated, 'manifest.json'), 'utf8');
    await assert.rejects(() => promoteBuild(options));
    assert.equal(await readFile(path.join(options.generated, 'manifest.json'), 'utf8'), before);
    assert.deepEqual((await readdir(path.join(options.generated, 'builds'))).sort(), ['current', 'old-old']);
  }
});

test('Price DB publish job treats already-published build as successful no-op and retains deploy ref', async () => {
  const workflow = await readFile('.github/workflows/price-update.yml', 'utf8');
  const publish = workflow.slice(workflow.indexOf('\n  publish:'), workflow.indexOf('\n  deploy:'));
  assert.match(publish, /if git diff --cached --quiet; then/);
  assert.match(publish, /else\s+git commit -m 'Publish validated AWS Price DB build'\s+git push origin HEAD:main\s+fi/);
  assert.match(publish, /echo "commit=\$\(git rev-parse HEAD\)" >> "\$GITHUB_OUTPUT"/);
  assert.match(workflow, /ref: \$\{\{ needs\.publish\.outputs\.commit \}\}/);
});
