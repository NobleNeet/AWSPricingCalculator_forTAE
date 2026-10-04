#!/usr/bin/env node
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { readJson } from './pricing-cli/package-loader.js';
import { report } from './pricing-cli/report.js';
import { writeJson } from './pricing-cli/cli.js';

export async function mergeSemanticShards(directory, shardCount = 4) {
  const names = (await readdir(directory)).filter(name => name.endsWith('.json')).sort();
  const shards = await Promise.all(names.map(name => readJson(path.join(directory, name))));
  const byIndex = new Map();
  for (const shard of shards) {
    if (shard.shardCount !== shardCount) throw new Error(`Unexpected shard count ${shard.shardCount}; expected ${shardCount}`);
    if (!Number.isInteger(shard.shardIndex) || shard.shardIndex < 0 || shard.shardIndex >= shardCount) throw new Error(`Invalid shard index ${shard.shardIndex}`);
    if (byIndex.has(shard.shardIndex)) throw new Error(`Duplicate semantic shard ${shard.shardIndex}`);
    byIndex.set(shard.shardIndex, shard);
  }
  const missing = Array.from({ length: shardCount }, (_, index) => index).filter(index => !byIndex.has(index));
  if (missing.length) throw new Error(`Missing semantic shards: ${missing.join(', ')}`);

  const ordered = Array.from({ length: shardCount }, (_, index) => byIndex.get(index));
  const issues = ordered.flatMap(shard => shard.issues ?? []);
  const coverage = Object.assign({}, ...ordered.map(shard => shard.coverage ?? {}));
  const taskTimings = ordered.flatMap(shard => shard.taskTimings ?? []);
  const publishSets = new Map();
  for (const shard of ordered) for (const [key, values] of Object.entries(shard.publishSkus ?? {})) {
    const set = publishSets.get(key) ?? new Set();
    for (const value of values) set.add(value);
    publishSets.set(key, set);
  }

  return report('validate-price-data', issues, {
    coverage,
    branches: ordered.reduce((sum, shard) => sum + (shard.branches ?? 0), 0),
    workers: ordered.reduce((sum, shard) => sum + (shard.workers ?? 0), 0),
    shards: shardCount,
    taskTimings,
    publishSkus: Object.fromEntries([...publishSets.entries()].map(([key, values]) => [key, [...values].sort()]))
  });
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  try {
    const directory = process.argv[2] ?? '.work/update/shards';
    const output = process.argv[3] ?? '.work/update/reports/validate-price-data.json';
    const shardCount = Number.parseInt(process.argv[4] ?? '4', 10);
    const merged = await mergeSemanticShards(directory, shardCount);
    await writeJson(output, merged);
    process.stdout.write(`${JSON.stringify({ status: merged.status, summary: merged.summary, branches: merged.branches, shards: merged.shards }, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.stack}\n`);
    process.exitCode = 2;
  }
}
