#!/usr/bin/env node
import path from 'node:path';
import { loadPackages, readJson } from './pricing-cli/package-loader.js';
import { runDriftTask } from './pricing-cli/drift-task.js';
import { report } from './pricing-cli/report.js';
import { writeJson } from './pricing-cli/cli.js';

function parseBatch(value) {
  if (!value) throw new Error('PRICE_DRIFT_BATCH_JSON is required');
  const parsed = JSON.parse(value);
  if (!Array.isArray(parsed.task_ids) || !parsed.task_ids.length) throw new Error('Drift batch has no task_ids');
  return parsed;
}

export async function runDriftBatch(plan, batch, packages) {
  const byId = new Map(plan.tasks.map(task => [task.taskId, task]));
  const results = [];
  for (const taskId of batch.task_ids) {
    const task = byId.get(taskId);
    if (!task) throw new Error(`Unknown drift task ${taskId}`);
    console.log(`drift batch=${batch.batch_id} task start: service=${task.serviceCode}, region=${task.region}, task_id=${task.taskId}`);
    const result = await runDriftTask(packages, task, {
      previousDirectory: plan.previousDirectory,
      candidateDirectory: plan.candidateDirectory
    });
    results.push(result);
    console.log(`drift batch=${batch.batch_id} task done: service=${result.serviceCode}, region=${result.region}, rate_diff=${result.rateDiff.length}, elapsed_ms=${result.elapsedMs}`);
  }
  const issues = results.flatMap(result => result.issues ?? []);
  const warning = results.some(result => result.warning);
  return report('classify-change-batch', issues, {
    batchId: batch.batch_id,
    taskIds: batch.task_ids,
    classification: issues.length ? 'STRUCTURE_BREAKING' : warning ? 'STRUCTURE_WARNING' : 'PRICE_ONLY',
    publishable: !issues.length,
    warning,
    rateDiff: results.flatMap(result => result.rateDiff ?? []),
    taskTimings: results.map(result => ({
      taskId: result.taskId,
      serviceCode: result.serviceCode,
      region: result.region,
      rateDiff: result.rateDiff.length,
      candidateProductsLoaded: result.candidateProductsLoaded,
      elapsedMs: result.elapsedMs
    }))
  });
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  try {
    const work = process.argv[2] ?? '.work/update';
    const output = process.argv[3] ?? path.join(work, 'drift-batches', 'batch.json');
    const plan = await readJson(path.join(work, 'drift-plan.json'));
    const batch = parseBatch(process.env.PRICE_DRIFT_BATCH_JSON);
    const result = await runDriftBatch(plan, batch, await loadPackages('services'));
    await writeJson(output, result);
    process.stdout.write(`${JSON.stringify({ batchId: result.batchId, tasks: result.taskIds.length, classification: result.classification, summary: result.summary }, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 2;
  }
}
