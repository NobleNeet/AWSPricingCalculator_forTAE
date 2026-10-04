import { execFile } from 'node:child_process';
import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { readJson } from './package-loader.js';
import { sourceKey } from './source.js';
import { report } from './report.js';
import { writeJson } from './cli.js';

const execFileAsync = promisify(execFile);
const worker = fileURLToPath(new URL('./normalize-source-worker.js', import.meta.url));

function flattenSources(sources = {}) {
  const flattened = {};
  for (const [key, value] of Object.entries(sources)) {
    if (value?.serviceCode && value?.region) flattened[sourceKey(value.serviceCode, value.region)] = value;
    else if (value && typeof value === 'object') for (const source of Object.values(value)) if (source?.serviceCode && source?.region) flattened[sourceKey(source.serviceCode, source.region)] = source;
  }
  return flattened;
}

export async function runConcurrent(items, limit, task) {
  if (!Number.isInteger(limit) || limit < 1) throw Error('Normalization concurrency must be a positive integer');
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await task(items[index], index);
    }
  });
  await Promise.all(runners);
}

export async function normalizeIsolated(options = {}) {
  const loaded = await readJson(options.input ?? '.work/source-metadata.json');
  const metadata = { ...loaded, sources: flattenSources(loaded.sources) };
  const directory = options.output ?? '.work/candidate';
  const rawDirectory = options.raw ?? '.work/raw';
  const buildId = options['build-id'] ?? 'candidate';
  const configuredConcurrency = Number.parseInt(process.env.PRICE_NORMALIZE_CONCURRENCY ?? '2', 10);
  const concurrency = Number.isInteger(configuredConcurrency) && configuredConcurrency > 0 ? configuredConcurrency : 2;
  const sources = Object.entries(metadata.sources);

  await runConcurrent(sources, concurrency, async ([key, source]) => {
    if (key !== sourceKey(source.serviceCode, source.region)) throw Error(`Invalid source key ${key}`);
    if (source.changed) {
      await execFileAsync(process.execPath, [worker, path.join(rawDirectory, source.serviceCode, `${source.region}.json`), directory, source.serviceCode, source.region, buildId], {
        env: { ...process.env, NODE_OPTIONS: process.env.NODE_OPTIONS ?? '--max-old-space-size=4096' },
        maxBuffer: 1024 * 1024
      });
      return;
    }
    if (!options.previous) throw Error('Unchanged source requires previous build');
    for (const [folder, file] of [['sources', 'products.json'], ['indexes', 'index.json']]) {
      const destination = path.join(directory, folder, source.serviceCode, source.region, file);
      await mkdir(path.dirname(destination), { recursive: true });
      await copyFile(path.join(options.previous, folder, source.serviceCode, source.region, file), destination);
    }
  });
  await writeJson(path.join(directory, 'source-metadata.json'), metadata);
  return report('normalize', [], { directory, concurrency });
}
