#!/usr/bin/env node
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { run, writeJson, loadCandidate, candidateDirectory } from './pricing-cli/cli.js';
import { readJson, loadPackages } from './pricing-cli/package-loader.js';
import { checksum, buildPriceDb } from './pricing-cli/build.js';
import { encode } from './pricing-cli/normalize.js';
import { definitionFingerprint } from './pricing-cli/fingerprint.js';
import { normalizeIsolated } from './pricing-cli/normalize-isolated.js';
import { report } from './pricing-cli/report.js';
import { classifyChangeParallel } from './pricing-cli/drift-parallel.js';
import { refreshGoldenEvidence } from './price-update.js';

const defaultExecute = (command, options) => command === 'normalize' ? normalizeIsolated(options) : run(command, options);

async function writeOutput(values) {
  if (!process.env.GITHUB_OUTPUT) return;
  await appendFile(process.env.GITHUB_OUTPUT, Object.entries(values).map(([key, value]) => `${key}=${value ?? ''}\n`).join(''));
}

async function record(work, command, options) {
  const started = performance.now();
  const rawResult = await defaultExecute(command, options);
  const result = { ...rawResult, elapsedMs: Math.round(performance.now() - started) };
  await writeJson(path.join(work, 'reports', `${command}.json`), result);
  return result;
}

async function prepare(work) {
  await mkdir(work, { recursive: true });
  const previousDirectory = await candidateDirectory();
  const previous = await loadCandidate(previousDirectory);
  const active = await readJson('pricing/generated/manifest.json');
  const activeBuild = await readJson(path.join(previousDirectory, 'build-manifest.json'));
  const packages = await loadPackages();
  const fingerprint = await definitionFingerprint(packages);
  const definitionsChanged = fingerprint !== activeBuild.definitionSha256;

  const previousFile = path.join(work, 'previous-sources.json');
  await writeJson(previousFile, previous.metadata);
  const config = await readJson('pricing/sources.json');
  config.serviceCodes = [...new Set(packages.map(pkg => pkg.service.priceSource.serviceCode))].sort();
  const configFile = path.join(work, 'sources.json');
  await writeJson(configFile, config);
  const metadataFile = path.join(work, 'source-metadata.json');
  const source = await record(work, 'check-source', { input: configFile, previous: previousFile, output: metadataFile });

  if (source.sourceStatus === 'NO_CHANGE' && !definitionsChanged) {
    const summary = { schemaVersion: 1, status: 'NO_CHANGE', publishable: false, previousBuildId: active.activeBuildId };
    await writeJson(path.join(work, 'reports', 'summary.json'), summary);
    await writeOutput({ needs_update: 'false', publishable: 'false', build_id: '' });
    return summary;
  }

  if (definitionsChanged) {
    const metadata = await readJson(metadataFile);
    for (const item of Object.values(metadata.sources)) item.changed = true;
    await writeJson(metadataFile, metadata);
    const sourceReport = await readJson(path.join(work, 'reports', 'check-source.json'));
    sourceReport.definitionsChanged = true;
    sourceReport.definitionRefreshServiceCodes = 'ALL';
    await writeJson(path.join(work, 'reports', 'check-source.json'), sourceReport);
  }

  const rawDirectory = path.join(work, 'raw');
  const candidate = path.join(work, 'candidate');
  await record(work, 'download', { input: metadataFile, output: rawDirectory });
  await record(work, 'normalize', { input: metadataFile, raw: rawDirectory, output: candidate, previous: previousDirectory });
  await record(work, 'inventory', { input: candidate, output: path.join(work, 'reports', 'inventory-data.json') });
  const definition = await record(work, 'validate-definitions', {});
  if (definition.summary.error) throw new Error(`Definition validation failed with ${definition.summary.error} errors`);
  await refreshGoldenEvidence(packages, rawDirectory, path.join(work, 'golden-raw'));
  await writeJson(path.join(work, 'prepare-state.json'), {
    schemaVersion: 1,
    previousBuildId: active.activeBuildId,
    definitionSha256: fingerprint
  });
  await writeOutput({ needs_update: 'true', publishable: 'false', build_id: '' });
  return { schemaVersion: 1, status: 'PREPARED', publishable: false, previousBuildId: active.activeBuildId };
}

function restorePublishSkus(serialized = {}) {
  return Object.fromEntries(Object.entries(serialized).map(([key, values]) => [key, new Set(values)]));
}

async function finalize(work) {
  const state = await readJson(path.join(work, 'prepare-state.json'));
  const definition = await readJson(path.join(work, 'reports', 'validate-definitions.json'));
  const semantic = await readJson(path.join(work, 'reports', 'validate-price-data.json'));
  const candidateDirectoryPath = path.join(work, 'candidate');
  const rawDirectory = path.join(work, 'golden-raw');
  const stage = path.join(work, 'staged');
  const packages = await loadPackages();
  const candidate = await loadCandidate(candidateDirectoryPath);
  const golden = await record(work, 'run-golden', { input: candidateDirectoryPath, raw: rawDirectory });
  const validationIssues = [...definition.issues, ...semantic.issues, ...golden.issues].filter(issue => issue.severity === 'error');
  const publishSkus = restorePublishSkus(semantic.publishSkus);

  let change;
  if (validationIssues.length) {
    const started = performance.now();
    change = {
      ...report('classify-change', validationIssues, {
        classification: 'STRUCTURE_BREAKING',
        publishable: false,
        rateDiff: [],
        skippedDueToValidation: true
      }),
      elapsedMs: Math.round(performance.now() - started)
    };
  } else {
    const previousDirectory = await candidateDirectory();
    const previous = await loadCandidate(previousDirectory);
    const started = performance.now();
    const classified = await classifyChangeParallel(
      packages,
      previousDirectory,
      candidateDirectoryPath,
      previous.data,
      candidate.data,
      publishSkus,
      []
    );
    change = {
      ...report('classify-change', classified.issues, {
        classification: classified.classification,
        publishable: classified.publishable,
        rateDiff: classified.rateDiff,
        workers: classified.concurrency,
        taskTimings: classified.taskTimings
      }),
      elapsedMs: Math.round(performance.now() - started)
    };
  }
  await writeJson(path.join(work, 'reports', 'classify-change.json'), change);

  const publishable = [definition, semantic, golden, change].every(item => item.status === 'passed' && item.summary.error === 0)
    && ['PRICE_ONLY', 'STRUCTURE_WARNING'].includes(change.classification)
    && change.publishable === true;
  const summary = {
    schemaVersion: 1,
    status: publishable ? 'VALIDATED' : 'REJECTED',
    publishable,
    classification: change.classification,
    previousBuildId: state.previousBuildId
  };

  if (publishable) {
    const metadata = await readJson(path.join(work, 'source-metadata.json'));
    const buildId = `${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}-${checksum(encode(metadata)).slice(0, 8)}`;
    const started = performance.now();
    const buildManifest = await buildPriceDb(candidate, path.join(stage, 'pricing'), buildId, {
      issues: [...definition.issues, ...semantic.issues, ...golden.issues],
      publishSkus,
      definitionSha256: state.definitionSha256
    });
    const built = { ...report('build', [], { build: buildManifest }), elapsedMs: Math.round(performance.now() - started) };
    await writeJson(path.join(work, 'reports', 'build.json'), built);
    summary.buildId = buildId;
    summary.buildManifestSha256 = checksum(await readFile(path.join(stage, 'pricing', 'builds', buildId, 'build-manifest.json'), 'utf8'));
    await refreshGoldenEvidence(packages, rawDirectory, path.join(stage, 'fixtures'));
  }

  await writeJson(path.join(work, 'reports', 'summary.json'), summary);
  await writeOutput({ needs_update: 'true', publishable: String(summary.publishable), build_id: summary.buildId ?? '' });
  return summary;
}

const phase = process.argv[2];
const work = process.argv[3] ?? '.work/update';
try {
  const result = phase === 'prepare' ? await prepare(work) : phase === 'finalize' ? await finalize(work) : null;
  if (!result) throw new Error('Usage: node tools/price-update-matrix.js <prepare|finalize> [work]');
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (phase === 'finalize' && result.status === 'REJECTED') process.exitCode = 1;
} catch (error) {
  process.stderr.write(`${error.stack}\n`);
  process.exitCode = 2;
}
