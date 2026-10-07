#!/usr/bin/env node
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readJson } from './pricing-cli/package-loader.js';
import { report } from './pricing-cli/report.js';

async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

export async function mergeSemanticBatches(planFile, directory) {
  const plan = await readJson(planFile);
  const expected = new Map((plan.matrix?.include ?? []).map(batch => [batch.batch_id, batch]));
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

  const names = (await readdir(directory)).filter(name => /^batch-.*\.json$/.test(name)).sort();
  const results = new Map();
  for (const name of names) {
    const batchId = name.slice('batch-'.length, -'.json'.length);
    if (!expected.has(batchId)) throw new Error(`Unexpected semantic batch: ${batchId}`);
    if (results.has(batchId)) throw new Error(`Duplicate semantic batch: ${batchId}`);
    results.set(batchId, await readJson(path.join(directory, name)));
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
    workers: ordered.reduce((sum, batch) => sum + (batch.workers ?? 0), 0),
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
  } catch (error) {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 2;
  }
}
