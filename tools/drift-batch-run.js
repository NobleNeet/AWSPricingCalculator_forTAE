#!/usr/bin/env node
import path from 'node:path';
import { loadPackages, readJson } from './pricing-cli/package-loader.js';
import { runDriftTask } from './pricing-cli/drift-task.js';
import { report } from './pricing-cli/report.js';
import { writeJson } from './pricing-cli/cli.js';

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBatch(value) {
  if (!value) throw new Error('PRICE_DRIFT_BATCH_JSON is required');
  const parsed = JSON.parse(value);
  const taskId = parsed.task_id ?? parsed.task_ids?.[0];
  if (!Number.isInteger(taskId)) throw new Error('Drift batch has no task_id');
  return { ...parsed, task_id: taskId };
}

export async function runDriftBatch(plan, batch, packages) {
  const byId = new Map(plan.tasks.map(task => [task.taskId, task]));
  const task = byId.get(batch.task_id);
  if (!task) throw new Error(`Unknown drift task ${batch.task_id}`);

  const caseOffset = Number.parseInt(batch.case_offset ?? 0, 10) || 0;
  const caseLimit = positiveInt(batch.case_limit, 10000);
  const includeStructural = Boolean(batch.include_structural);
  const caseBatchSize = positiveInt(process.env.PRICE_DRIFT_CASE_BATCH_SIZE, 250);

  console.log(
    `drift batch=${batch.batch_id} task start: service=${task.serviceCode}, region=${task.region}, task_id=${task.taskId}, offset=${caseOffset}, limit=${caseLimit}, structural=${includeStructural}`
  );
  const result = await runDriftTask(
    packages,
    task,
    {
      previousDirectory: plan.previousDirectory,
      candidateDirectory: plan.candidateDirectory
    },
    {
      caseOffset,
      caseLimit,
      includeStructural,
      caseBatchSize,
      onCaseBatch: progress => {
        console.log(
          `drift batch=${batch.batch_id} progress: service=${task.serviceCode}, region=${task.region}, seen_cases=${progress.seenCases}, processed_cases=${progress.processedCases}, batch_cases=${progress.batchCases}, offset=${caseOffset}, limit=${caseLimit}`
        );
      }
    }
  );
  console.log(
    `drift batch=${batch.batch_id} task done: service=${result.serviceCode}, region=${result.region}, reuse=${result.reuseMode}, rate_diff=${result.rateDiff.length}, processed_cases=${result.processedCases}, reused_cases=${result.reusedCases ?? 0}, seen_cases=${result.seenCases}, elapsed_ms=${result.elapsedMs}`
  );

  const issues = result.issues ?? [];
  return report('classify-change-batch', issues, {
    batchId: batch.batch_id,
    taskId: task.taskId,
    taskIds: [task.taskId],
    caseOffset,
    caseLimit,
    plannedCases: batch.planned_cases ?? null,
    includeStructural,
    processedCases: result.processedCases,
    reusedCases: result.reusedCases ?? 0,
    reuseMode: result.reuseMode,
    seenCases: result.seenCases,
    classification: issues.length ? 'STRUCTURE_BREAKING' : result.warning ? 'STRUCTURE_WARNING' : 'PRICE_ONLY',
    publishable: !issues.length,
    warning: result.warning,
    rateDiff: result.rateDiff ?? [],
    taskTimings: [{
      taskId: result.taskId,
      serviceCode: result.serviceCode,
      region: result.region,
      caseOffset,
      caseLimit,
      processedCases: result.processedCases,
      reusedCases: result.reusedCases ?? 0,
      reuseMode: result.reuseMode,
      candidateProductsLoaded: result.candidateProductsLoaded,
      elapsedMs: result.elapsedMs
    }]
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
    process.stdout.write(`${JSON.stringify({
      batchId: result.batchId,
      taskId: result.taskId,
      cases: result.processedCases,
      classification: result.classification,
      summary: result.summary
    }, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 2;
  }
}
