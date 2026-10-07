import { readFile, mkdir, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { run, writeJson, loadCandidate, candidateDirectory } from './pricing-cli/cli.js';
import { readJson, loadPackages } from './pricing-cli/package-loader.js';
import { checksum } from './pricing-cli/build.js';
import { encode } from './pricing-cli/normalize.js';
import {
  changedPriceSourceCodes,
  contractFingerprints,
  definitionFingerprint,
  PRICING_CONTRACT_FILES,
  semanticGlobalChanged
} from './pricing-cli/fingerprint.js';
import { sourceKey } from './pricing-cli/source.js';
import { normalizeIsolated } from './pricing-cli/normalize-isolated.js';
import { report } from './pricing-cli/report.js';
import { evaluateService } from '../src/pricing/core.js';
import { readGoldenRawSource } from './golden-evidence.js';

const defaultExecute = (command, options) => command === 'normalize' ? normalizeIsolated(options) : run(command, options);
const GLOBAL_FINGERPRINT_FILES = new Set([
  'pricing/normalization/common.json',
  'pricing/limitations.json',
  ...PRICING_CONTRACT_FILES
]);

export function definitionRefreshServiceCodes(packages, changedFiles) {
  if (!Array.isArray(changedFiles) || changedFiles.length === 0) return null;
  const packageCodes = new Map(packages.map(pkg => [path.basename(pkg.directory), pkg.service.priceSource.serviceCode]));
  const knownCodes = new Set(packages.map(pkg => pkg.service.priceSource.serviceCode));
  const affected = new Set();
  let recognizedFingerprintChange = false;

  for (const file of changedFiles) {
    if (GLOBAL_FINGERPRINT_FILES.has(file)) return null;

    const serviceMatch = file.match(/^services\/([^/]+)\//);
    if (serviceMatch) {
      recognizedFingerprintChange = true;
      const code = packageCodes.get(serviceMatch[1]);
      if (!code) return null;
      affected.add(code);
      continue;
    }

    const normalizerMatch = file.match(/^pricing\/normalization\/services\/([^/]+)\.json$/);
    if (normalizerMatch) {
      recognizedFingerprintChange = true;
      if (!knownCodes.has(normalizerMatch[1])) return null;
      affected.add(normalizerMatch[1]);
    }
  }

  return recognizedFingerprintChange && affected.size > 0 ? affected : null;
}

export async function refreshGoldenEvidence(packages, rawDirectory, output, candidateDirectoryPath) {
  if (!candidateDirectoryPath) throw new Error('Golden evidence requires a normalized candidate directory');
  const candidate = await loadCandidate(candidateDirectoryPath);
  const groups = new Map();
  for (const pkg of packages) for (const golden of pkg.golden) {
    const code = pkg.service.priceSource.serviceCode;
    const region = golden.project?.region ?? golden.project?.defaultRegion ?? 'ap-northeast-1';
    const key = sourceKey(code, region);
    const group = groups.get(key) ?? { code, region, entries: [] };
    group.entries.push({ pkg, golden });
    groups.set(key, group);
  }
  for (const { code, region, entries } of groups.values()) {
    const raw = await readGoldenRawSource(rawDirectory, code, region);
    const key = sourceKey(code, region);
    const source = candidate.data[key] ?? (candidate.data[code]?.region === region || !candidate.data[code]?.region ? candidate.data[code] : undefined);
    if (!source) throw new Error(`Golden evidence ${code}/${region}: normalized source missing`);
    const sample = { offerCode: raw.offerCode, version: raw.version, publicationDate: raw.publicationDate, products: {}, terms: { OnDemand: {} } };
    for (const { pkg, golden } of entries) {
      const result = evaluateService(
        pkg,
        golden,
        { ...golden.project, region, defaultRegion: golden.project?.defaultRegion ?? region },
        source.products ?? []
      );
      for (const componentId of Object.keys(golden.verification)) {
        const sku = result.components[componentId]?.resolution?.product?.sku;
        if (!sku) throw new Error(`Golden evidence ${code}/${region}/${golden.id}/${componentId}: resolved SKU missing`);
        const product = raw.products[sku];
        const terms = raw.terms.OnDemand[sku];
        if (!product || !terms) throw new Error(`Golden evidence ${code}/${region}/${golden.id}/${componentId}: raw SKU ${sku} missing`);
        sample.products[sku] = product;
        sample.terms.OnDemand[sku] = terms;
      }
    }
    await writeJson(path.join(output, code, `${region}.json`), sample);
  }
}
export async function priceUpdate({ work = '.work/update', execute = defaultExecute, previousDefinitionSha256, changedFiles } = {}) {
  await mkdir(work, { recursive: true });
  const reports = {};
  const previousDirectory = await candidateDirectory();
  const previous = await loadCandidate(previousDirectory);
  const active = await readJson('pricing/generated/manifest.json');
  const activeBuild = await readJson(path.join(previousDirectory, 'build-manifest.json'));
  const packages = await loadPackages();
  const fingerprint = await definitionFingerprint(packages);
  const contracts = await contractFingerprints(packages);
  const globalContractChanged = semanticGlobalChanged(activeBuild.contractFingerprints, contracts);
  const persistedRefreshCodes = changedPriceSourceCodes(
    packages,
    activeBuild.contractFingerprints,
    contracts
  );
  const definitionsChanged = globalContractChanged || persistedRefreshCodes.size > 0;
  // Explicit changed-file scoping remains available for tests/debugging, but production
  // uses persisted per-service fingerprints so unpublished changes cannot be stranded.
  const changedFileRefreshCodes = definitionsChanged && previousDefinitionSha256 !== undefined
    ? definitionRefreshServiceCodes(packages, changedFiles)
    : undefined;
  const definitionRefreshCodes = changedFileRefreshCodes === undefined
    ? persistedRefreshCodes
    : changedFileRefreshCodes;
  const record = async (command, options) => {
    const started = performance.now();
    const rawResult = await execute(command, options);
    const result = { ...rawResult, elapsedMs: Math.round(performance.now() - started) };
    reports[command] = result;
    await writeJson(path.join(work, 'reports', `${command}.json`), result); return result;
  };
  const metadataFile = path.join(work, 'source-metadata.json');
  const previousFile = path.join(work, 'previous-sources.json'); await writeJson(previousFile, previous.metadata);
  const config = await readJson('pricing/sources.json');
  config.serviceCodes = [...new Set(packages.map(pkg => pkg.service.priceSource.serviceCode))].sort();
  const configFile = path.join(work, 'sources.json'); await writeJson(configFile, config);
  const source = await record('check-source', { input: configFile, previous: previousFile, output: metadataFile });
  if (source.sourceStatus === 'NO_CHANGE' && !definitionsChanged) {
    const summary = { schemaVersion: 1, status: 'NO_CHANGE', publishable: false, previousBuildId: active.activeBuildId };
    await writeJson(path.join(work, 'reports/summary.json'), summary); return summary;
  }
  if (definitionsChanged) {
    const metadata = await readJson(metadataFile);
    for (const item of Object.values(metadata.sources)) {
      if (definitionRefreshCodes === null || definitionRefreshCodes.has(item.serviceCode)) item.changed = true;
    }
    await writeJson(metadataFile, metadata);
    reports['check-source'].definitionsChanged = true;
    reports['check-source'].definitionRefreshServiceCodes = definitionRefreshCodes === null ? 'ALL' : [...definitionRefreshCodes].sort();
    await writeJson(path.join(work, 'reports/check-source.json'), reports['check-source']);
  }
  const rawDirectory = path.join(work, 'raw'), candidate = path.join(work, 'candidate'), stage = path.join(work, 'staged');
  await record('download', { input: metadataFile, output: rawDirectory });
  await record('normalize', { input: metadataFile, raw: rawDirectory, output: candidate, previous: previousDirectory });
  await record('inventory', { input: candidate, output: path.join(work, 'reports/inventory-data.json') });
  const definition = await record('validate-definitions', {});
  const semantic = await record('validate-price-data', { input: candidate });
  const golden = await record('run-golden', { input: candidate, raw: rawDirectory });
  const validationIssues = [...definition.issues, ...semantic.issues, ...golden.issues].filter(issue => issue.severity === 'error');
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
    reports['classify-change'] = change;
    await writeJson(path.join(work, 'reports/classify-change.json'), change);
  } else {
    change = await record('classify-change', { input: candidate, previous: previousDirectory });
  }
  const publishable = [definition, semantic, golden, change].every(r => r.status === 'passed' && r.summary.error === 0) && ['PRICE_ONLY', 'STRUCTURE_WARNING'].includes(change.classification) && change.publishable === true;
  const summary = { schemaVersion: 1, status: publishable ? 'VALIDATED' : 'REJECTED', publishable, classification: change.classification, previousBuildId: active.activeBuildId };
  if (publishable) {
    const metadata = await readJson(metadataFile);
    const buildId = `${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}-${checksum(encode(metadata)).slice(0, 8)}`;
    const built = await record('build', { input: candidate, raw: rawDirectory, output: path.join(stage, 'pricing'), 'build-id': buildId });
    if (built.status !== 'passed') { summary.status = 'REJECTED'; summary.publishable = false; }
    else {
      summary.buildId = buildId;
      summary.buildManifestSha256 = checksum(await readFile(path.join(stage, 'pricing/builds', buildId, 'build-manifest.json'), 'utf8'));
      await refreshGoldenEvidence(packages, rawDirectory, path.join(stage, 'fixtures'), candidate);
    }
  }
  await writeJson(path.join(work, 'reports/summary.json'), summary);
  return summary;
}
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  try {
    const work = process.argv[2] ?? '.work/update';
    const changedFiles = process.env.PRICE_UPDATE_CHANGED_FILES
      ? (await readFile(process.env.PRICE_UPDATE_CHANGED_FILES, 'utf8')).split(/\r?\n/).map(value => value.trim()).filter(Boolean)
      : undefined;
    const result = await priceUpdate({ work, changedFiles });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `publishable=${result.publishable}\nbuild_id=${result.buildId ?? ''}\n`);
    if (process.env.GITHUB_STEP_SUMMARY) {
      const semantic = await readJson(path.join(work, 'reports/validate-price-data.json')).catch(() => null);
      const change = await readJson(path.join(work, 'reports/classify-change.json')).catch(() => null);
      await appendFile(process.env.GITHUB_STEP_SUMMARY, `## Price update\n\n\`\`\`json\n${JSON.stringify({ ...result, coverage: semantic?.coverage, validation: semantic?.summary, rateDiff: change?.rateDiff }, null, 2)}\n\`\`\`\n`);
    }
    process.exitCode = result.status === 'REJECTED' ? 1 : 0;
  } catch (error) { process.stderr.write(`${error.stack}\n`); process.exitCode = 2; }
}
