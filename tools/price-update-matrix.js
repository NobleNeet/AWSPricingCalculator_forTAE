#!/usr/bin/env node
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { run, writeJson, candidateDirectory } from './pricing-cli/cli.js';
import { readJson, loadPackages } from './pricing-cli/package-loader.js';
import { checksum, buildPriceDb } from './pricing-cli/build.js';
import { encode } from './pricing-cli/normalize.js';
import {
  changedPriceSourceCodes,
  contractFingerprints,
  definitionFingerprint,
  packagePriceSourceCodes
} from './pricing-cli/fingerprint.js';
import { normalizeIsolated } from './pricing-cli/normalize-isolated.js';
import { report } from './pricing-cli/report.js';
import { classifyChangeParallel } from './pricing-cli/drift-parallel.js';
import { loadCandidateForPublish } from './pricing-cli/product-chunks.js';
import { refreshGoldenEvidence } from './price-update.js';
import { refreshGoldenEvidenceTolerant } from './golden-evidence.js';
import { resolveRequestedValidationScope } from './pricing-cli/update-scope.js';

const defaultExecute = (command, options) => command === 'normalize' ? normalizeIsolated(options) : run(command, options);

async function writeOutput(values) {
  if (!process.env.GITHUB_OUTPUT) return;
  await appendFile(process.env.GITHUB_OUTPUT, Object.entries(values).map(([key, value]) => `${key}=${value ?? ''}\n`).join(''));
}

async function record(work, command, options) {
  const started = performance.now();
  console.log(`${command}: start`);
  const rawResult = await defaultExecute(command, options);
  const result = { ...rawResult, elapsedMs: Math.round(performance.now() - started) };
  await writeJson(path.join(work, 'reports', `${command}.json`), result);
  console.log(`${command}: done elapsed_ms=${result.elapsedMs}`);
  return result;
}

function flattenSourceDescriptors(sources = {}) {
  const flattened = {};
  for (const [key, value] of Object.entries(sources)) {
    if (value?.serviceCode && value?.region) flattened[key.includes('/') ? key : `${value.serviceCode}/${value.region}`] = value;
    else if (value && typeof value === 'object') {
      for (const source of Object.values(value)) {
        if (source?.serviceCode && source?.region) flattened[`${source.serviceCode}/${source.region}`] = source;
      }
    }
  }
  return flattened;
}

async function loadSourceDescriptors(directory) {
  try {
    const metadata = await readJson(path.join(directory, 'source-metadata.json'));
    return { schemaVersion: metadata.schemaVersion ?? 1, sources: flattenSourceDescriptors(metadata.sources) };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const build = await readJson(path.join(directory, 'build-manifest.json'));
    return { schemaVersion: 1, sources: flattenSourceDescriptors(build.sources) };
  }
}

function priceSourceCodes(packages) {
  return [...new Set(packages.flatMap(packagePriceSourceCodes))].sort();
}

async function prepare(work) {
  await mkdir(work, { recursive: true });
  const previousDirectory = await candidateDirectory();
  const previousMetadata = await loadSourceDescriptors(previousDirectory);
  const active = await readJson('pricing/generated/manifest.json');
  const activeBuild = await readJson(path.join(previousDirectory, 'build-manifest.json'));
  const packages = await loadPackages();
  const requestedScope = resolveRequestedValidationScope(
    packages,
    process.env.PRICE_UPDATE_SCOPE_SERVICE_IDS ?? ''
  );
  if (requestedScope.serviceIds.length) {
    console.log(`price update validation scope: services=${requestedScope.serviceIds.join(',')} price_sources=${requestedScope.serviceCodes.join(',')}`);
  }
  const fingerprint = await definitionFingerprint(packages);
  const contracts = await contractFingerprints(packages);
  const definitionsChanged = fingerprint !== activeBuild.definitionSha256;
  const definitionRefreshCodes = definitionsChanged
    ? changedPriceSourceCodes(packages, activeBuild.contractFingerprints, contracts)
    : new Set();

  const previousFile = path.join(work, 'previous-sources.json');
  await writeJson(previousFile, previousMetadata);
  const config = await readJson('pricing/sources.json');
  config.serviceCodes = priceSourceCodes(packages);
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

  {
    const metadata = await readJson(metadataFile);
    for (const item of Object.values(metadata.sources)) {
      item.awsChanged = Boolean(item.changed);
      item.definitionChanged = definitionRefreshCodes.has(item.serviceCode);
      if (item.definitionChanged) item.changed = true;
    }
    await writeJson(metadataFile, metadata);
    const sourceReport = await readJson(path.join(work, 'reports', 'check-source.json'));
    sourceReport.definitionsChanged = definitionsChanged;
    sourceReport.definitionRefreshServiceCodes = [...definitionRefreshCodes].sort();
    sourceReport.awsChangedSources = Object.entries(metadata.sources)
      .filter(([, item]) => item.awsChanged)
      .map(([key]) => key)
      .sort();
    await writeJson(path.join(work, 'reports', 'check-source.json'), sourceReport);
  }

  const rawDirectory = path.join(work, 'raw');
  const candidate = path.join(work, 'candidate');
  await record(work, 'download', { input: metadataFile, output: rawDirectory });
  await record(work, 'normalize', { input: metadataFile, raw: rawDirectory, output: candidate, previous: previousDirectory });
  await record(work, 'inventory', { input: candidate, output: path.join(work, 'reports', 'inventory-data.json') });
  const definition = await record(work, 'validate-definitions', {});
  if (definition.summary.error) throw new Error(`Definition validation failed with ${definition.summary.error} errors`);
  await refreshGoldenEvidenceTolerant(packages, rawDirectory, path.join(work, 'golden-raw'), candidate);
  await writeJson(path.join(work, 'prepare-state.json'), {
    schemaVersion: 2,
    previousBuildId: active.activeBuildId,
    definitionSha256: fingerprint,
    contractFingerprints: contracts,
    definitionRefreshServiceCodes: [...definitionRefreshCodes].sort(),
    requestedScopeServiceIds: requestedScope.serviceIds,
    requestedScopeServiceCodes: requestedScope.serviceCodes
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
  const prevalidated = process.env.PRICE_FINALIZE_PREVALIDATED === 'true';
  const golden = prevalidated
    ? await readJson(path.join(work, 'reports', 'run-golden.json'))
    : await record(work, 'run-golden', { input: candidateDirectoryPath, raw: rawDirectory });
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
  } else if (prevalidated) {
    change = await readJson(path.join(work, 'reports', 'classify-change.json'));
  } else {
    const previousDirectory = await candidateDirectory();
    const previousMetadata = await loadSourceDescriptors(previousDirectory);
    const candidateMetadata = await loadSourceDescriptors(candidateDirectoryPath);
    const started = performance.now();
    console.log(`classify-change: start sources_previous=${Object.keys(previousMetadata.sources).length} sources_candidate=${Object.keys(candidateMetadata.sources).length}`);
    const classified = await classifyChangeParallel(
      packages,
      previousDirectory,
      candidateDirectoryPath,
      previousMetadata.sources,
      candidateMetadata.sources,
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
    console.log(`classify-change: done elapsed_ms=${change.elapsedMs}`);
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
    metadata.sources = flattenSourceDescriptors(metadata.sources);
    const buildId = `${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}-${checksum(encode(metadata)).slice(0, 8)}`;
    const started = performance.now();
    console.log('build: loading only publishable SKUs from candidate chunks');
    const candidate = await loadCandidateForPublish(candidateDirectoryPath, metadata, publishSkus);
    const buildManifest = await buildPriceDb(candidate, path.join(stage, 'pricing'), buildId, {
      issues: [...definition.issues, ...semantic.issues, ...golden.issues],
      publishSkus,
      definitionSha256: state.definitionSha256,
      contractFingerprints: state.contractFingerprints
    });
    const built = { ...report('build', [], { build: buildManifest }), elapsedMs: Math.round(performance.now() - started) };
    await writeJson(path.join(work, 'reports', 'build.json'), built);
    console.log(`build: done elapsed_ms=${built.elapsedMs}`);
    summary.buildId = buildId;
    summary.buildManifestSha256 = checksum(await readFile(path.join(stage, 'pricing', 'builds', buildId, 'build-manifest.json'), 'utf8'));
    await refreshGoldenEvidence(packages, rawDirectory, path.join(stage, 'fixtures'), candidateDirectoryPath);
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
