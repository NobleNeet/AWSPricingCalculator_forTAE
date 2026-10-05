import { parentPort, workerData } from 'node:worker_threads';
import { loadPackages, readJson } from './package-loader.js';
import { validatePriceData } from './semantics.js';
import { loadProductsMatching } from './product-chunks.js';
import { matches } from '../../src/pricing/filter.js';
import { accumulateInventory, finalizeInventory, validateCoverage } from './inventory.js';
import { issue } from '../../src/pricing/issues.js';
import { schemaValidator } from '../schema.js';

const packages = await loadPackages();
const common = await readJson('pricing/normalization/common.json');
const validateProducts = await schemaValidator('pricing/products');
const packageGroups = new Map();
const normalizers = new Map();

for (const pkg of packages) {
  const serviceCode = pkg.service.priceSource.serviceCode;
  const group = packageGroups.get(serviceCode) ?? [];
  group.push(pkg);
  packageGroups.set(serviceCode, group);
}

async function normalizerFor(serviceCode) {
  if (normalizers.has(serviceCode)) return normalizers.get(serviceCode);
  const normalizer = await readJson(`pricing/normalization/services/${serviceCode}.json`).catch(error => {
    if (error.code === 'ENOENT') return { rules: [], discriminators: [] };
    throw error;
  });
  normalizers.set(serviceCode, normalizer);
  return normalizer;
}

function sourceCodeFor(pkg, componentId) {
  return pkg.service.priceSource.componentOverrides?.[componentId] ?? pkg.service.priceSource.serviceCode;
}

function staticFilters(filters = []) {
  return filters.filter(filter => !filter.valueFrom);
}

function filterGroupsFor(servicePackages, serviceCode) {
  const groups = [];
  for (const pkg of servicePackages) for (const profileId of pkg.service.profiles) {
    const profile = pkg.profiles[profileId];
    if (pkg.service.priceSource.serviceCode === serviceCode) groups.push(staticFilters(profile.fixedFilters ?? []));
    for (const componentId of profile.components) {
      if (sourceCodeFor(pkg, componentId) !== serviceCode) continue;
      const component = pkg.components[componentId];
      groups.push(staticFilters([
        ...(profile.fixedFilters ?? []),
        ...(component.fixedFilters ?? []),
        ...(component.priceQuery?.productFilters ?? [])
      ]));
    }
  }
  return groups;
}

function productPredicate(servicePackages, serviceCode) {
  const groups = filterGroupsFor(servicePackages, serviceCode);
  if (!groups.length || groups.some(filters => filters.length === 0)) return () => true;
  return product => groups.some(filters => matches(product, filters, {}));
}

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function runTask(task) {
  const started = performance.now();
  const { serviceCode, region, sourceDescriptors, includeCoverage } = task;
  const servicePackages = packageGroups.get(serviceCode) ?? [];
  const issues = [];
  const coverage = {};
  const data = {};
  const normalizersByCode = {};
  const coverageCategories = new Map();
  let scannedProducts = 0;
  let selectedProducts = 0;
  let chunks = 0;

  for (const [code, source] of Object.entries(sourceDescriptors ?? {})) {
    const normalizer = await normalizerFor(code);
    normalizersByCode[code] = normalizer;
    const loaded = await loadProductsMatching(workerData.directory, source, productPredicate(servicePackages, code), {
      onChunk: async (chunkData, chunk) => {
        if (!validateProducts(chunkData)) {
          issues.push(issue('SCHEMA_ERROR', `${code}/${region}/${chunk.path}: ${JSON.stringify(validateProducts.errors)}`));
        }
        if (includeCoverage && code === serviceCode) accumulateInventory(coverageCategories, chunkData, common, normalizer);
      }
    });
    data[`${code}/${region}`] = loaded.data;
    scannedProducts += loaded.stats.products;
    selectedProducts += loaded.stats.selectedProducts;
    chunks += loaded.stats.chunks;
  }

  if (includeCoverage) {
    const categories = finalizeInventory(coverageCategories);
    for (const pkg of servicePackages) {
      const checkedCoverage = validateCoverage(categories, pkg.coverage);
      coverage[`${pkg.service.id}/${region}`] = checkedCoverage.summary;
      issues.push(...checkedCoverage.issues.map(entry => ({ ...entry, serviceId: pkg.service.id, region })));
    }
  }

  const caseBatchSize = positiveInt(process.env.PRICE_VALIDATE_CASE_BATCH_SIZE, 250);
  const checked = validatePriceData(
    servicePackages,
    data,
    common,
    normalizersByCode,
    {
      includeCoverage: false,
      caseBatchSize,
      onCaseBatch: progress => parentPort.postMessage({
        type: 'progress',
        taskId: task.taskId,
        serviceCode,
        region,
        processedCases: progress.processedCases,
        batchCases: progress.batchCases,
        elapsedMs: Math.round(performance.now() - started)
      })
    }
  );
  issues.push(...checked.issues);

  const packageByServiceId = new Map(servicePackages.map(pkg => [pkg.service.id, pkg]));
  const publishSkus = {};
  for (const resolution of checked.resolutions) {
    const sku = resolution.result.components[resolution.componentId]?.resolution?.product.sku;
    if (!sku) continue;
    const pkg = packageByServiceId.get(resolution.serviceId);
    const code = pkg ? sourceCodeFor(pkg, resolution.componentId) : serviceCode;
    const key = `${code}/${region}`;
    (publishSkus[key] ??= new Set()).add(sku);
  }

  return {
    taskId: task.taskId,
    serviceCode,
    region,
    issues,
    coverage,
    branches: checked.resolutions.length,
    publishSkus: Object.fromEntries(Object.entries(publishSkus).map(([key, values]) => [key, [...values]])),
    scannedProducts,
    selectedProducts,
    chunks,
    elapsedMs: Math.round(performance.now() - started)
  };
}

parentPort.on('message', async message => {
  if (message.type === 'stop') {
    parentPort.close();
    return;
  }
  if (message.type !== 'task') return;
  try {
    parentPort.postMessage({ type: 'result', result: await runTask(message.task) });
  } catch (error) {
    parentPort.postMessage({
      type: 'error',
      taskId: message.task.taskId,
      serviceCode: message.task.serviceCode,
      region: message.task.region,
      error: error.stack ?? error.message
    });
  }
});
