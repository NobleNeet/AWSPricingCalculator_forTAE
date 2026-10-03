#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { loadPackages } from './package-loader.js';
import { validateDefinitions } from './validate-definitions.js';
import { report } from './report.js';
import { issue } from '../../src/pricing/issues.js';
import { readJson } from './package-loader.js';
import { checkSources, downloadSources } from './source.js';
import { normalize, encode } from './normalize.js';
import { inventory, validateCoverage } from './inventory.js';
import { mkdir, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { validatePriceData } from './semantics.js';
import { runGolden } from './golden.js';
import { classifyChange } from './drift.js';
import { buildPriceDb } from './build.js';
import { schemaValidator } from '../schema.js';

export async function writeJson(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, encode(data));
}
export async function loadCandidate(directory) {
  let metadata;
  try { metadata = await readJson(path.join(directory, 'source-metadata.json')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const build = await readJson(path.join(directory, 'build-manifest.json'));
    metadata = { sources: Object.fromEntries(Object.entries(build.sources).map(([code, regions]) => [code, Object.values(regions)[0]])) };
  }
  const data = {};
  for (const source of Object.values(metadata.sources)) data[source.serviceCode] = await readJson(path.join(directory, 'sources', source.serviceCode, source.region, 'products.json'));
  return { metadata, data };
}
export async function candidateDirectory(input) {
  if (input) return input;
  const active = await readJson('pricing/generated/manifest.json');
  return `pricing/generated/builds/${active.activeBuildId}`;
}
export async function semanticValidation(packages, candidate) {
  const common = await readJson('pricing/normalization/common.json');
  const normalizers = Object.fromEntries(await Promise.all(Object.keys(candidate.data).map(async code => [code, await readJson(`pricing/normalization/services/${code}.json`)])));
  const result = validatePriceData(packages, candidate.data, common, normalizers);
  const validate = await schemaValidator('pricing/products');
  for (const [code, data] of Object.entries(candidate.data)) if (!validate(data)) result.issues.push(issue('SCHEMA_ERROR', `${code}: ${JSON.stringify(validate.errors)}`));
  return result;
}
export async function goldenValidation(packages, candidate, rawDirectory) {
  const raw = Object.fromEntries(await Promise.all(Object.keys(candidate.data).map(async code => [code, await readJson(path.join(rawDirectory ?? 'tests/fixtures/aws', `${code}.json`))])));
  return runGolden(packages, candidate.data, raw);
}

const commands = ['validate-definitions', 'validate-price-data', 'run-golden', 'normalize', 'inventory', 'classify-change', 'build', 'check-source', 'download'];
export async function run(command, options = {}) {
  if (!commands.includes(command)) throw new Error(`Unknown command: ${command}`);
  if (command === 'validate-definitions') return report(command, await validateDefinitions(await loadPackages(options.services ?? 'services')));
  if (command === 'check-source') {
    const config = await readJson(options.input ?? 'pricing/sources.json');
    const previous = options.previous ? (await readJson(options.previous)).sources : {};
    const metadata = await checkSources(config, previous);
    await writeJson(options.output ?? '.work/source-metadata.json', metadata);
    return report(command, [], { sourceStatus: metadata.status, sources: metadata.sources });
  }
  if (command === 'download') {
    const metadata = await readJson(options.input ?? '.work/source-metadata.json');
    return report(command, [], { files: await downloadSources(metadata, options.output ?? '.work/raw') });
  }
  if (command === 'normalize') {
    const metadata = await readJson(options.input ?? '.work/source-metadata.json');
    const directory = options.output ?? '.work/candidate';
    for (const source of Object.values(metadata.sources)) {
      if (source.changed) {
        const raw = await readJson(path.join(options.raw ?? '.work/raw', `${source.serviceCode}.json`));
        const result = normalize(raw, source.region, options['build-id'] ?? 'candidate');
        await writeJson(path.join(directory, 'sources', source.serviceCode, source.region, 'products.json'), result.data);
        await writeJson(path.join(directory, 'indexes', source.serviceCode, source.region, 'index.json'), result.index);
      } else {
        if (!options.previous) throw Error('Unchanged source requires previous build');
        for (const [folder, file] of [['sources', 'products.json'], ['indexes', 'index.json']]) await writeJson(path.join(directory, folder, source.serviceCode, source.region, file), await readJson(path.join(options.previous, folder, source.serviceCode, source.region, file)));
      }
    }
    await writeJson(path.join(directory, 'source-metadata.json'), metadata);
    return report(command, [], { directory });
  }
  if (command === 'inventory') {
    const { data } = await loadCandidate(options.input ?? '.work/candidate');
    const common = await readJson('pricing/normalization/common.json');
    const inventories = {};
    for (const [code, source] of Object.entries(data)) inventories[code] = inventory(source, common, await readJson(`pricing/normalization/services/${code}.json`));
    await writeJson(options.output ?? '.work/inventory.json', inventories);
    return report(command, [], { categories: Object.fromEntries(Object.entries(inventories).map(([code, categories]) => [code, categories.length])) });
  }
  if (['validate-price-data', 'run-golden', 'classify-change', 'build'].includes(command)) {
    const packages = await loadPackages(options.services ?? 'services');
    const candidate = await loadCandidate(await candidateDirectory(options.input));
    let result;
    if (command === 'validate-price-data') {
      const checked = await semanticValidation(packages, candidate);
      result = report(command, checked.issues, { coverage: checked.coverage, branches: checked.resolutions.length });
    }
    if (command === 'run-golden') { const checked = await goldenValidation(packages, candidate, options.raw); result = report(command, checked.issues, { cases: checked.cases }); }
    if (command === 'classify-change') {
      const previous = await loadCandidate(await candidateDirectory(options.previous));
      const checked = await semanticValidation(packages, candidate);
      const change = classifyChange(packages, previous.data, candidate.data, checked.issues);
      result = report(command, change.issues, { classification: change.classification, publishable: change.publishable, rateDiff: change.rateDiff });
    }
    if (command === 'build') {
      const definitionIssues = await validateDefinitions(packages);
      const semantic = await semanticValidation(packages, candidate);
      const golden = await goldenValidation(packages, candidate, options.raw);
      const issues = [...definitionIssues, ...semantic.issues, ...golden.issues];
      if (issues.some(i => i.severity === 'error')) return report(command, issues);
      const publishSkus = {};
      for (const resolution of semantic.resolutions) {
        const code = packages.find(pkg => pkg.service.id === resolution.serviceId).service.priceSource.serviceCode;
        const sku = resolution.result.components[resolution.componentId]?.resolution?.product.sku;
        if (sku) (publishSkus[code] ??= new Set()).add(sku);
      }
      const manifest = await buildPriceDb(candidate, options.output ?? 'pricing/generated', options['build-id'], { issues, publishSkus });
      return report(command, [], { build: manifest });
    }
    if (options.output) await writeJson(options.output, result);
    return result;
  }
  return report(command, [issue('NOT_IMPLEMENTED', `${command} is not implemented.`)]);
}
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  try {
    const { positionals, values } = parseArgs({ allowPositionals: true, options: Object.fromEntries(['services', 'input', 'output', 'previous', 'build-id', 'raw', 'region'].map(key => [key, { type: 'string' }])) });
    const result = await run(positionals[0], values);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = result.summary.error ? 1 : 0;
  } catch (error) {
    process.stdout.write(`${JSON.stringify(report(process.argv[2], [issue('TOOL_FAILURE', error.message)]), null, 2)}\n`);
    process.exitCode = 2;
  }
}
