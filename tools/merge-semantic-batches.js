#!/usr/bin/env node
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readJson } from './pricing-cli/package-loader.js';
import { report } from './pricing-cli/report.js';
import { logicalBatchesFromPlan, validateWorkerAssignments } from './pricing-cli/work-pool.js';

async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

export function validateSemanticPlan(plan) {
  const batches = logicalBatchesFromPlan(plan);
  validateWorkerAssignments(plan);
  if (!batches.length && plan.summary?.scope === 'reuse' && plan.summary.totalCases === 0 && plan.summary.batches === 0) return;
  if (!batches.length || new Set(batches.map(b => b.batch_id)).size !== batches.length || plan.summary?.batches !== batches.length) throw Error('Invalid semantic batch inventory');
  let total = 0;
  const tasks = new Map((plan.tasks ?? []).map(task => [task.taskId, task]));
  if (!tasks.size) throw Error('Semantic source task inventory missing');
  for (const [taskId, task] of tasks) {
    const shards = batches.filter(batch => batch.source_task_id === taskId).sort((a, b) => a.case_offset - b.case_offset);
    let offset = 0;
    if (!shards.length) throw Error(`Missing semantic source task: ${taskId}`);
    for (const [index, batch] of shards.entries()) {
      if (batch.service_code !== task.serviceCode || batch.region !== task.region
        || batch.case_offset !== offset || !Number.isInteger(batch.planned_cases) || batch.planned_cases < 0
        || batch.case_limit !== Math.max(1, batch.planned_cases)
        || batch.include_defaults !== (index === 0)
        || batch.include_coverage !== Boolean(task.includeCoverage && index === 0)) throw Error(`Invalid semantic range: ${batch.batch_id}`);
      offset += batch.planned_cases;
    }
    if (offset !== task.caseCount) throw Error(`Incomplete semantic ranges: ${taskId}`);
    total += offset;
  }
  if (batches.some(batch => !tasks.has(batch.source_task_id)) || total !== plan.summary.totalCases) throw Error('Invalid semantic planned case total');
}

export async function mergeSemanticBatches(planFile, directory) {
  const plan = await readJson(planFile);
  validateSemanticPlan(plan);
  const expected = new Map(logicalBatchesFromPlan(plan).map(batch => [batch.batch_id, batch]));
  if (!expected.size) {
    if (plan.summary?.scope !== 'reuse') throw new Error('Semantic plan contains no batches.');
    return report('validate-price-data', [], {
      coverage: {},
      branches: 0,
      workers: 0,
      batches: 0,
      plannedCases: 0,
      batchCases: 0,
      taskTimings: [],
      publishSkus: {},
      reusedBaseline: true
    });
  }

  const names = (await readdir(directory)).filter(name => /^(?:batch|worker)-.*\.json$/.test(name)).sort();
  const results = new Map();
  let workerArtifacts = 0;
  for (const name of names) {
    const artifact = await readJson(path.join(directory, name));
    const pooled = Array.isArray(artifact.batchResults);
    const fileBatchId = name.startsWith('batch-') ? name.slice('batch-'.length, -'.json'.length) : null;
    const entries = pooled
      ? artifact.batchResults.map(entry => ({
        command: 'validate-price-data',
        status: entry.issues?.some(issue => issue.severity === 'error') ? 'failed' : 'passed',
        summary: { error: entry.issues?.filter(issue => issue.severity === 'error').length ?? 0 },
        issues: entry.issues ?? [],
        coverage: entry.coverage ?? {},
        branches: entry.branches ?? 0,
        workers: 1,
        publishSkus: entry.publishSkus ?? {},
        taskTimings: [{
          batchId: entry.batchId,
          serviceCode: entry.serviceCode,
          region: entry.region,
          caseOffset: entry.caseOffset,
          caseLimit: entry.caseLimit,
          branches: entry.branches,
          scannedProducts: entry.scannedProducts,
          selectedProducts: entry.selectedProducts,
          chunks: entry.chunks,
          iteratorSkippedCases: entry.iteratorSkippedCases ?? 0,
          prunedBranches: entry.prunedBranches ?? 0,
          branchBlocks: entry.branchBlocks ?? 0,
          elapsedMs: entry.elapsedMs
        }]
      }))
      : [artifact];
    if (pooled) workerArtifacts += 1;
    for (const result of entries) {
      const timing = result.taskTimings?.[0];
      const batchId = pooled ? (timing?.batchId ?? result.batchId) : fileBatchId;
      if (!expected.has(batchId)) throw new Error(`Unexpected semantic batch: ${batchId}`);
      if (results.has(batchId)) throw new Error(`Duplicate semantic batch: ${batchId}`);
      const batch = expected.get(batchId);
      if (result.command !== 'validate-price-data' || !['passed', 'failed'].includes(result.status)
        || !Number.isInteger(result.summary?.error) || !Array.isArray(result.issues)
        || result.summary.error !== result.issues.filter(issue => issue.severity === 'error').length
        || result.taskTimings?.length !== 1 || timing?.batchId !== batchId
        || timing.serviceCode !== batch.service_code || timing.region !== batch.region
        || timing.caseOffset !== batch.case_offset || timing.caseLimit !== batch.case_limit
        || result.branches !== batch.planned_cases || timing.branches !== batch.planned_cases) throw Error(`Invalid semantic batch result: ${batchId}`);
      results.set(batchId, result);
    }
  }

  const missing = [...expected.keys()].filter(batchId => !results.has(batchId));
  if (missing.length) throw new Error(`Missing semantic batches: ${missing.join(', ')}`);

  const ordered = [...expected.keys()].map(batchId => results.get(batchId));
  const issues = ordered.flatMap(batch => batch.issues ?? []);
  const coverage = Object.assign({}, ...ordered.map(batch => batch.coverage ?? {}));
  const taskTimings = ordered.flatMap(batch => batch.taskTimings ?? []);
  const publishSets = new Map();
  for (const batch of ordered) for (const [key, values] of Object.entries(batch.publishSkus ?? {})) {
    const set = publishSets.get(key) ?? new Set();
    for (const value of values) set.add(value);
    publishSets.set(key, set);
  }

  return report('validate-price-data', issues, {
    coverage,
    branches: ordered.reduce((sum, batch) => sum + (batch.branches ?? 0), 0),
    workers: workerArtifacts || ordered.reduce((sum, batch) => sum + (batch.workers ?? 0), 0),
    batches: ordered.length,
    plannedCases: plan.summary?.totalCases ?? null,
    batchCases: plan.summary?.batchCases ?? null,
    taskTimings,
    publishSkus: Object.fromEntries([...publishSets.entries()].map(([key, values]) => [key, [...values].sort()]))
  });
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  try {
    const planFile = process.argv[2] ?? '.work/update/semantic-plan.json';
    const directory = process.argv[3] ?? '.work/update/batches';
    const output = process.argv[4] ?? '.work/update/reports/validate-price-data.json';
    const merged = await mergeSemanticBatches(planFile, directory);
    await writeJson(output, merged);
    process.stdout.write(`${JSON.stringify({ status: merged.status, summary: merged.summary, branches: merged.branches, batches: merged.batches, plannedCases: merged.plannedCases }, null, 2)}\n`);
    if (merged.status !== 'passed') process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 2;
  }
}
