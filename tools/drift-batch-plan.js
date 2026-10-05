#!/usr/bin/env node
import path from 'node:path';
import { loadPackages, readJson } from './pricing-cli/package-loader.js';
import { loadCandidateMetadata, writeJson } from './pricing-cli/cli.js';
import { driftTasks } from './pricing-cli/drift-parallel.js';

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function restorePublishSkus(serialized = {}) {
  return Object.fromEntries(Object.entries(serialized).map(([key, values]) => [key, new Set(values)]));
}

export function groupDriftTasks(tasks, requestedBatchTasks = 1, maxBatches = 240) {
  const batchTasks = Math.max(requestedBatchTasks, Math.ceil(tasks.length / maxBatches), 1);
  const batches = [];
  for (let offset = 0; offset < tasks.length; offset += batchTasks) {
    const slice = tasks.slice(offset, offset + batchTasks);
    batches.push({
      batch_id: String(batches.length).padStart(4, '0'),
      task_ids: slice.map(task => task.taskId),
      labels: slice.map(task => `${task.serviceCode}/${task.region}`)
    });
  }
  return { batchTasks, batches };
}

export async function buildDriftPlan(work = '.work/update') {
  const packages = await loadPackages('services');
  const state = await readJson(path.join(work, 'prepare-state.json'));
  const semantic = await readJson(path.join(work, 'reports', 'validate-price-data.json'));
  const previousDirectory = `pricing/generated/builds/${state.previousBuildId}`;
  const candidateDirectory = path.join(work, 'candidate');
  const previous = await loadCandidateMetadata(previousDirectory);
  const candidate = await loadCandidateMetadata(candidateDirectory);
  const { tasks, missingService } = driftTasks(
    packages,
    previous.sources,
    candidate.sources,
    restorePublishSkus(semantic.publishSkus)
  );
  const requestedBatchTasks = positiveInt(process.env.PRICE_DRIFT_WORKFLOW_BATCH_TASKS, 1);
  const maxBatches = positiveInt(process.env.PRICE_DRIFT_MAX_WORKFLOW_BATCHES, 240);
  const grouped = groupDriftTasks(tasks, requestedBatchTasks, maxBatches);
  return {
    schemaVersion: 1,
    previousDirectory,
    candidateDirectory,
    missingService,
    tasks,
    matrix: { include: grouped.batches },
    summary: {
      tasks: tasks.length,
      batches: grouped.batches.length,
      tasksPerBatch: grouped.batchTasks,
      maxBatches
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
