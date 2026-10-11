import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildSemanticBatches } from '../../tools/pricing-cli/semantic-plan.js';
import { mergeSemanticBatches, validateSemanticPlan } from '../../tools/merge-semantic-batches.js';
import { report } from '../../tools/pricing-cli/report.js';
import { writeJson } from '../../tools/pricing-cli/cli.js';
import { readJson, loadPackages } from '../../tools/pricing-cli/package-loader.js';
import { sourceDownloadMatrix, downloadSourceCandidate, verifySourceCandidates, goldenSourceEvidence, assembleSourceCandidates } from '../../tools/price-source-batches.js';
import { planSemanticBatches } from '../../tools/pricing-cli/semantic-plan.js';
import { loadCandidate, goldenValidation } from '../../tools/pricing-cli/cli.js';
import { refreshGoldenEvidenceTolerant } from '../../tools/golden-evidence.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { check } from '../../tools/price-update-matrix.js';

function plan() {
  const task = { taskId: 0, globalTaskId: 0, serviceCode: 'Example', region: 'r1', caseCount: 3, includeCoverage: true };
  const built = buildSemanticBatches([task], 2);
  return { tasks: [task], summary: { batches: built.batches.length, totalCases: 3 }, matrix: { include: built.batches } };
}
function result(batch, issues = []) {
  return report('validate-price-data', issues, { branches: batch.planned_cases, workers: 1, taskTimings: [{ batchId: batch.batch_id, serviceCode: batch.service_code, region: batch.region, caseOffset: batch.case_offset, caseLimit: batch.case_limit, branches: batch.planned_cases }] });
}

test('semantic plans reject duplicate, missing, overlapping and incomplete ranges', () => {
  const valid = plan();
  validateSemanticPlan(valid);
  for (const mutate of [p => p.matrix.include.pop(), p => p.matrix.include[1].batch_id = '0000', p => p.matrix.include[1].case_offset = 1, p => p.tasks[0].caseCount = 4, p => p.matrix.include[1].include_defaults = true]) {
    const invalid = structuredClone(valid); mutate(invalid);
    assert.throws(() => validateSemanticPlan(invalid));
  }
});

test('semantic merge requires every batch, the correct source/range and the exact evaluated count', async () => {
  const work = await mkdtemp(path.join(os.tmpdir(), 'ci-semantic-'));
  try {
    const p = plan(), planFile = path.join(work, 'plan.json'), dir = path.join(work, 'batches');
    await writeJson(planFile, p);
    const [a, b] = p.matrix.include;
    await writeJson(path.join(dir, 'batch-0000.json'), result(a));
    await assert.rejects(mergeSemanticBatches(planFile, dir), /Missing/);
    await writeJson(path.join(dir, 'batch-0001.json'), result(b));
    assert.equal((await mergeSemanticBatches(planFile, dir)).branches, 3);
    for (const mutate of [r => r.branches = 0, r => r.taskTimings[0].region = 'wrong', r => r.taskTimings[0].caseOffset = 0, r => r.taskTimings[0].batchId = 'other', r => r.summary.error = 1]) {
      const invalid = result(b); mutate(invalid);
      await writeJson(path.join(dir, 'batch-0001.json'), invalid);
      await assert.rejects(mergeSemanticBatches(planFile, dir), /Invalid semantic batch result/);
    }
    await writeJson(path.join(dir, 'batch-0001.json'), result(b, [{ severity: 'error', code: 'TEST' }]));
    assert.equal((await mergeSemanticBatches(planFile, dir)).status, 'failed');
    await writeJson(path.join(dir, 'batch-9999.json'), result(b));
    await assert.rejects(mergeSemanticBatches(planFile, dir), /Unexpected/);
  } finally { await rm(work, { recursive: true, force: true }); }
});

test('source plan includes only changed source/region pairs and is deterministic', () => {
  const entry = (serviceCode, region, changed) => ({ serviceCode, region, changed });
  const metadata = { sources: { 'B/r2': entry('B', 'r2', true), 'A/r1': entry('A', 'r1', false), 'B/r1': entry('B', 'r1', true) } };
  assert.deepEqual(sourceDownloadMatrix(metadata).include.map(x => x.source_key), ['B/r1', 'B/r2']);
  assert.throws(() => sourceDownloadMatrix({ sources: { 'wrong': entry('B', 'r1', true) } }), /Invalid source/);
});

test('download shards pin source versions, retain raw Golden evidence and reject incomplete or tampered artifacts', async () => {
  const work = await mkdtemp(path.join(os.tmpdir(), 'ci-source-'));
  try {
    const packages = (await loadPackages()).filter(pkg => pkg.service.id === 'kms');
    const raw = await readJson('tests/fixtures/aws/awskms.json');
    const source = { serviceCode: raw.offerCode, region: 'ap-northeast-1', version: raw.version, sourceUrl: 'https://example.invalid/pinned', changed: true };
    const metadata = { schemaVersion: 1, sources: { 'awskms/ap-northeast-1': source } }, p = sourceDownloadMatrix(metadata);
    await writeJson(path.join(work, 'source-metadata.json'), metadata);
    await writeJson(path.join(work, 'source-plan.json'), p);
    const fetcher = async url => { assert.equal(url, source.sourceUrl); return { ok: true, json: async () => raw }; };
    await downloadSourceCandidate(work, '0000', { fetcher, packages });
    await verifySourceCandidates(work, metadata, p);
    const sample = await readJson(path.join(work, 'raw/awskms/ap-northeast-1.json'));
    assert.equal(sample.version, raw.version);
    assert.ok(Object.keys(sample.products).length > 0);
    assert.deepEqual(sample, goldenSourceEvidence(packages, source, raw));
    const candidateDirectory = path.join(work, 'candidate');
    const goldenDirectory = path.join(work, 'golden');
    await refreshGoldenEvidenceTolerant(packages, path.join(work, 'raw'), goldenDirectory, candidateDirectory);
    assert.equal((await goldenValidation(packages, await loadCandidate(candidateDirectory), goldenDirectory)).issues.filter(issue => issue.severity === 'error').length, 0);
    // Exercise the real planner, worker/CLI, and merge, not just report fixtures.
    const semanticPlan = await planSemanticBatches(packages, candidateDirectory, { sources: { awskms: { 'ap-northeast-1': source } } }, { batchCases: 2 });
    await writeJson(path.join(work, 'semantic-plan.json'), semanticPlan);
    for (const batch of semanticPlan.matrix.include) {
      await promisify(execFile)(process.execPath, ['tools/pricing-cli/cli.js', 'validate-price-data', '--input', candidateDirectory, '--output', path.join(work, 'batches', `batch-${batch.batch_id}.json`)], { env: { ...process.env, PRICE_VALIDATE_BATCH_JSON: JSON.stringify(batch), PRICE_VALIDATE_CONCURRENCY: '1' } });
    }
    const merged = await mergeSemanticBatches(path.join(work, 'semantic-plan.json'), path.join(work, 'batches'));
    assert.equal(merged.status, 'passed');
    assert.equal(merged.branches, semanticPlan.summary.totalCases);
    const unchanged = { serviceCode: 'Other', region: 'r1', changed: false };
    metadata.sources['Other/r1'] = unchanged;
    await writeJson(path.join(work, 'source-metadata.json'), metadata);
    const previous = path.join(work, 'previous');
    await writeJson(path.join(previous, 'sources/Other/r1/products.json'), { products: [] });
    await writeJson(path.join(previous, 'indexes/Other/r1/index.json'), { products: [] });
    await assembleSourceCandidates(work, previous);
    assert.deepEqual((await readJson(path.join(work, 'candidate/source-metadata.json'))).sources, metadata.sources);
    assert.deepEqual(await readJson(path.join(work, 'candidate/sources/Other/r1/products.json')), { products: [] });
    await assert.rejects(downloadSourceCandidate(work, '0000', { packages, fetcher: async () => ({ ok: true, json: async () => ({ ...raw, version: 'wrong' }) }) }), /source\/version mismatch/);
    const file = path.join(work, 'candidate/sources/awskms/ap-northeast-1/products.json');
    await writeFile(file, (await readFile(file, 'utf8')) + ' ');
    await assert.rejects(verifySourceCandidates(work, metadata, p), /checksum/);
    await assert.rejects(downloadSourceCandidate(work, '9999', { fetcher, packages }), /Unknown source/);
    await rm(path.join(work, 'source-results/0000.json'));
    await assert.rejects(verifySourceCandidates(work, metadata, p), /Incomplete/);
  } finally { await rm(work, { recursive: true, force: true }); }
});

test('forced source refresh is rejected before networking unless validation-only and explicitly scoped', async () => {
  const work = await mkdtemp(path.join(os.tmpdir(), 'ci-refresh-guard-'));
  const keys = ['PRICE_UPDATE_SCOPE_SERVICE_IDS', 'PRICE_UPDATE_VALIDATION_ONLY', 'PRICE_UPDATE_REFRESH_REQUESTED_SOURCES'];
  const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    process.env.PRICE_UPDATE_REFRESH_REQUESTED_SOURCES = 'true';
    process.env.PRICE_UPDATE_SCOPE_SERVICE_IDS = 'kms';
    process.env.PRICE_UPDATE_VALIDATION_ONLY = 'false';
    await assert.rejects(check(work), /Forced source refresh requires/);
    process.env.PRICE_UPDATE_VALIDATION_ONLY = 'true';
    process.env.PRICE_UPDATE_SCOPE_SERVICE_IDS = '';
    await assert.rejects(check(work), /Forced source refresh requires/);
  } finally {
    for (const key of keys) { if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key]; }
    await rm(work, { recursive: true, force: true });
  }
});
