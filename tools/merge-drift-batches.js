#!/usr/bin/env node
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readJson } from './pricing-cli/package-loader.js';
import { report } from './pricing-cli/report.js';

async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

export async function mergeDriftBatches(planFile, directory) {
  const plan = await readJson(planFile);
  const expected = new Map((plan.matrix?.include ?? []).map(batch => [batch.batch_id, batch]));
  if (!expected.size) {
    if (plan.summary?.scope !== 'reuse') throw new Error('Drift plan contains no batches.');
    return report('classify-change', [], {
      classification: 'PRICE_ONLY',
      publishable: true,
      rateDiff: [],
      workers: 0,
      batches: 0,
      plannedCases: 0,
      casesPerBatch: 0,
      processedCases: 0,
      reusedCases: 0,
      reusedRegions: 0,
      skippedTasks: [],
      taskTimings: [],
      reusedBaseline: true
    });
  }
  const names = (await readdir(directory)).filter(name => name.endsWith('.json')).sort();
  const batches = await Promise.all(names.map(name => readJson(path.join(directory, name))));
  const seen = new Set();
  const representedTasks = new Set();

  for (const batch of batches) {
    const planned = expected.get(batch.batchId);
    if (!planned) throw new Error(`Unexpected drift batch ${batch.batchId}`);
    if (seen.has(batch.batchId)) throw new Error(`Duplicate drift batch ${batch.batchId}`);
    seen.add(batch.batchId);

    const plannedTaskId = planned.task_id ?? planned.task_ids?.[0];
    if (batch.taskId !== plannedTaskId) {
      throw new Error(`Drift batch ${batch.batchId} task does not match plan`);
    }
    if ((batch.caseOffset ?? 0) !== (planned.case_offset ?? 0)) {
      throw new Error(`Drift batch ${batch.batchId} case offset does not match plan`);
    }
    if ((batch.caseLimit ?? null) !== (planned.case_limit ?? null)) {
      throw new Error(`Drift batch ${batch.batchId} case limit does not match plan`);
    }
    representedTasks.add(batch.taskId);
  }

  const missingBatches = [...expected.keys()].filter(batchId => !seen.has(batchId));
  if (missingBatches.length) throw new Error(`Missing drift batches: ${missingBatches.join(', ')}`);
  const missingTasks = plan.tasks.map(task => task.taskId).filter(taskId => !representedTasks.has(taskId));
  if (missingTasks.length) throw new Error(`Missing drift tasks: ${missingTasks.join(', ')}`);

  const issues = batches.flatMap(batch => batch.issues ?? []);
  const warning = Boolean(plan.missingService) || batches.some(batch => batch.warning || batch.classification === 'STRUCTURE_WARNING');
  return report('classify-change', issues, {
    classification: issues.length ? 'STRUCTURE_BREAKING' : warning ? 'STRUCTURE_WARNING' : 'PRICE_ONLY',
    publishable: !issues.length,
    rateDiff: batches.flatMap(batch => batch.rateDiff ?? []),
    workers: batches.length,
    batches: batches.length,
    plannedCases: plan.summary?.totalCases ?? null,
    casesPerBatch: plan.summary?.casesPerBatch ?? null,
    processedCases: batches.reduce((sum, batch) => sum + (batch.processedCases ?? 0), 0),
    reusedCases: batches.reduce((sum, batch) => sum + (batch.reusedCases ?? 0), 0),
    reusedRegions: batches.filter(batch => batch.reuseMode === 'region-identical').length,
    skippedTasks: plan.skippedTasks ?? [],
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
    process.stdout.write(`${JSON.stringify({
      status: merged.status,
      classification: merged.classification,
      batches: merged.batches,
      processedCases: merged.processedCases,
      summary: merged.summary
    }, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 2;
  }
}
