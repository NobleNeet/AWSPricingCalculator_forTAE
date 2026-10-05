#!/usr/bin/env node
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { readJson } from './pricing-cli/package-loader.js';
import { report } from './pricing-cli/report.js';
import { writeJson } from './pricing-cli/cli.js';

export async function mergeDriftBatches(planFile, directory) {
  const plan = await readJson(planFile);
  const names = (await readdir(directory)).filter(name => name.endsWith('.json')).sort();
  const batches = await Promise.all(names.map(name => readJson(path.join(directory, name))));
  const expected = new Map(plan.matrix.include.map(batch => [batch.batch_id, batch]));
  const seen = new Set();
  const seenTasks = new Set();

  for (const batch of batches) {
    if (!expected.has(batch.batchId)) throw new Error(`Unexpected drift batch ${batch.batchId}`);
    if (seen.has(batch.batchId)) throw new Error(`Duplicate drift batch ${batch.batchId}`);
    seen.add(batch.batchId);
    const plannedTaskIds = expected.get(batch.batchId).task_ids;
    if (JSON.stringify(batch.taskIds) !== JSON.stringify(plannedTaskIds)) {
      throw new Error(`Drift batch ${batch.batchId} task list does not match plan`);
    }
    for (const taskId of batch.taskIds) {
      if (seenTasks.has(taskId)) throw new Error(`Duplicate drift task ${taskId}`);
      seenTasks.add(taskId);
    }
  }

  const missingBatches = [...expected.keys()].filter(batchId => !seen.has(batchId));
  if (missingBatches.length) throw new Error(`Missing drift batches: ${missingBatches.join(', ')}`);
  const missingTasks = plan.tasks.map(task => task.taskId).filter(taskId => !seenTasks.has(taskId));
  if (missingTasks.length) throw new Error(`Missing drift tasks: ${missingTasks.join(', ')}`);

  const issues = batches.flatMap(batch => batch.issues ?? []);
  const warning = Boolean(plan.missingService) || batches.some(batch => batch.warning || batch.classification === 'STRUCTURE_WARNING');
  return report('classify-change', issues, {
    classification: issues.length ? 'STRUCTURE_BREAKING' : warning ? 'STRUCTURE_WARNING' : 'PRICE_ONLY',
    publishable: !issues.length,
    rateDiff: batches.flatMap(batch => batch.rateDiff ?? []),
    workers: batches.length,
    batches: batches.length,
    taskTimings: batches.flatMap(batch => batch.taskTimings ?? [])
  });
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  try {
    const planFile = process.argv[2] ?? '.work/update/drift-plan.json';
    const directory = process.argv[3] ?? '.work/update/drift-batches';
    const output = process.argv[4] ?? '.work/update/reports/classify-change.json';
    const merged = await mergeDriftBatches(planFile, directory);
    await writeJson(output, merged);
    process.stdout.write(`${JSON.stringify({ status: merged.status, classification: merged.classification, batches: merged.batches, summary: merged.summary }, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 2;
  }
}
