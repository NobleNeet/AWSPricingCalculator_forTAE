#!/usr/bin/env node
import path from 'node:path';
import { loadPackages, readJson } from './pricing-cli/package-loader.js';
import { loadCandidateMetadata, writeJson } from './pricing-cli/cli.js';
import { driftTasks } from './pricing-cli/drift-parallel.js';
import { planSemanticBatches } from './pricing-cli/semantic-plan.js';
import {
  effectiveValidationSourceCodes,
  filterPackagesBySourceCodes,
  validationScopeMode
} from './pricing-cli/update-scope.js';

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function restorePublishSkus(serialized = {}) {
  return Object.fromEntries(Object.entries(serialized).map(([key, values]) => [key, new Set(values)]));
}

function manifestFromMetadata(metadata) {
  const sources = {};
  for (const source of Object.values(metadata.sources ?? {})) {
    (sources[source.serviceCode] ??= {})[source.region] = {
      ...source,
      productsPath: source.productsPath ?? `sources/${source.serviceCode}/${source.region}/products.json`
    };
  }
  return { sources };
}

function plannedBatchCount(tasks, batchCases) {
  return tasks.reduce((sum, task) => sum + Math.max(1, Math.ceil((task.caseCount ?? 0) / batchCases)), 0);
}

function boundedBatchCases(tasks, requestedBatchCases, maxBatches) {
  if (tasks.length > maxBatches) {
    throw new Error(`Drift task count exceeds matrix limit: ${tasks.length} > ${maxBatches}`);
  }
  const requested = positiveInt(requestedBatchCases, 10000);
  if (plannedBatchCount(tasks, requested) <= maxBatches) return requested;

  let low = requested;
  let high = Math.max(requested, ...tasks.map(task => task.caseCount ?? 0));
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (plannedBatchCount(tasks, mid) <= maxBatches) high = mid;
    else low = mid + 1;
  }
  return low;
}

export function groupDriftTasks(tasks, requestedBatchCases = 10000, maxBatches = 240) {
  const batchCases = boundedBatchCases(tasks, requestedBatchCases, maxBatches);
  const batches = [];
  for (const task of tasks) {
    const caseCount = task.caseCount ?? 0;
    const count = Math.max(1, Math.ceil(caseCount / batchCases));
    for (let batchIndex = 0; batchIndex < count; batchIndex++) {
      const caseOffset = batchIndex * batchCases;
      const plannedCases = Math.max(0, Math.min(batchCases, caseCount - caseOffset));
      batches.push({
        batch_id: String(batches.length).padStart(4, '0'),
        task_id: task.taskId,
        task_ids: [task.taskId],
        labels: [`${task.serviceCode}/${task.region}`],
        case_offset: caseOffset,
        case_limit: Math.max(1, plannedCases),
        include_structural: batchIndex === 0,
        planned_cases: plannedCases
      });
    }
  }
  if (batches.length > maxBatches) {
    throw new Error(`Drift batch plan exceeded matrix limit: ${batches.length} > ${maxBatches}`);
  }
  return {
    batchCases,
    batches,
    totalCases: tasks.reduce((sum, task) => sum + (task.caseCount ?? 0), 0),
    maxBatches
  };
}

export async function buildDriftPlan(work = '.work/update', options = {}) {
  const packages = await loadPackages('services');
  const state = await readJson(path.join(work, 'prepare-state.json'));
  const semantic = await readJson(path.join(work, 'reports', 'validate-price-data.json'));
  const previousDirectory = `pricing/generated/builds/${state.previousBuildId}`;
  const candidateDirectory = path.join(work, 'candidate');
  const previous = await loadCandidateMetadata(previousDirectory);
  const candidate = await loadCandidateMetadata(candidateDirectory);
  const sourceCodes = effectiveValidationSourceCodes(state, candidate);
  const scopedPackages = filterPackagesBySourceCodes(packages, sourceCodes);
  if (!scopedPackages.length) throw new Error('Drift validation scope resolved to no service packages.');
  if (sourceCodes !== null) {
    console.log(`drift-plan scoped: services=${scopedPackages.map(pkg => pkg.service.id).join(',')} price_sources=${[...sourceCodes].sort().join(',')}`);
  }
  const planned = driftTasks(
    scopedPackages,
    previous.sources,
    candidate.sources,
    restorePublishSkus(semantic.publishSkus)
  );
  const definitionRefreshCodes = new Set(state.definitionRefreshServiceCodes ?? []);
  const tasks = planned.tasks.filter(task => {
    const key = `${task.serviceCode}/${task.region}`;
    const source = candidate.sources[key];
    if (!source) return true;
    if (definitionRefreshCodes.has(task.serviceCode)) return true;
    // New metadata records distinguish an AWS publication change from a source
    // that was refreshed only because its Definition changed. Legacy metadata
    // without awsChanged is conservatively revalidated.
    return source.awsChanged !== false;
  });
  const missingService = planned.missingService;
  const skippedTasks = planned.tasks.filter(task => !tasks.includes(task)).map(task => ({
    serviceCode: task.serviceCode,
    region: task.region,
    reason: 'unchanged-service-source'
  }));

  const plannerConcurrency = positiveInt(
    options.planConcurrency ?? process.env.PRICE_DRIFT_PLAN_CONCURRENCY,
    2
  );
  const previousPlan = await planSemanticBatches(
    scopedPackages,
    previousDirectory,
    manifestFromMetadata(previous),
    {
      concurrency: plannerConcurrency,
      batchCases: Number.MAX_SAFE_INTEGER,
      maxBatches: 240
    }
  );
  const previousCaseCounts = new Map(
    previousPlan.tasks.map(task => [`${task.serviceCode}/${task.region}`, task.caseCount ?? 0])
  );
  const countedTasks = tasks.map(task => ({
    ...task,
    caseCount: previousCaseCounts.get(`${task.serviceCode}/${task.region}`) ?? 0
  }));

  const requestedBatchCases = positiveInt(
    options.batchCases ?? process.env.PRICE_DRIFT_WORKFLOW_BATCH_CASES,
    10000
  );
  const maxBatches = positiveInt(
    options.maxBatches ?? process.env.PRICE_DRIFT_MAX_WORKFLOW_BATCHES,
    240
  );
  const grouped = groupDriftTasks(countedTasks, requestedBatchCases, maxBatches);

  return {
    schemaVersion: 2,
    previousDirectory,
    candidateDirectory,
    missingService,
    tasks: countedTasks,
    matrix: { include: grouped.batches },
    skippedTasks,
    summary: {
      tasks: countedTasks.length,
      skippedTasks: skippedTasks.length,
      totalCases: grouped.totalCases,
      batches: grouped.batches.length,
      casesPerBatch: grouped.batchCases,
      maxBatches,
      plannerConcurrency,
      scope: validationScopeMode(state, sourceCodes),
      scopeServiceIds: scopedPackages.map(pkg => pkg.service.id).sort(),
      scopeServiceCodes: sourceCodes === null ? [] : [...sourceCodes].sort()
    }
  };
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  try {
    const work = process.argv[2] ?? '.work/update';
    const output = process.argv[3] ?? path.join(work, 'drift-plan.json');
    const plan = await buildDriftPlan(work);
    await writeJson(output, plan);
    process.stdout.write(`${JSON.stringify(plan.summary, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 2;
  }
}
