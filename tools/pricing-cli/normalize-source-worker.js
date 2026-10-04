import path from 'node:path';
import { readJson } from './package-loader.js';
import { normalize } from './normalize.js';
import { writeJson } from './cli.js';

const [rawFile, outputDirectory, serviceCode, region, buildId = 'candidate'] = process.argv.slice(2);
if (!rawFile || !outputDirectory || !serviceCode || !region) throw Error('Usage: normalize-source-worker <raw-file> <output-directory> <service-code> <region> [build-id]');

const raw = await readJson(rawFile);
const result = normalize(raw, region, buildId);
await writeJson(path.join(outputDirectory, 'sources', serviceCode, region, 'products.json'), result.data);
await writeJson(path.join(outputDirectory, 'indexes', serviceCode, region, 'index.json'), result.index);
