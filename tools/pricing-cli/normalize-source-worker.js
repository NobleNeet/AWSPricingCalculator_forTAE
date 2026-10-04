import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readJson } from './package-loader.js';
import { normalize, encode } from './normalize.js';

async function writeJson(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, encode(data));
}

const [rawFile, outputDirectory, serviceCode, region, buildId = 'candidate'] = process.argv.slice(2);
if (!rawFile || !outputDirectory || !serviceCode || !region) throw Error('Usage: normalize-source-worker <raw-file> <output-directory> <service-code> <region> [build-id]');

const raw = await readJson(rawFile);
const result = normalize(raw, region, buildId);
await writeJson(path.join(outputDirectory, 'sources', serviceCode, region, 'products.json'), result.data);
await writeJson(path.join(outputDirectory, 'indexes', serviceCode, region, 'index.json'), result.index);
