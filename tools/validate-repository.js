import { readFile } from 'node:fs/promises';
import { run, candidateDirectory } from './pricing-cli/cli.js';
import { readJson, loadPackages } from './pricing-cli/package-loader.js';
import { schemaValidator } from './schema.js';
import { checksum } from './pricing-cli/build.js';
import { buildIndex, encode } from './pricing-cli/normalize.js';
import { definitionFingerprint } from './pricing-cli/fingerprint.js';
import { validatePublishedPriceDataParallel } from './pricing-cli/semantic-parallel.js';

const prevalidatedPublication = process.env.PRICE_VALIDATE_PREVALIDATED === 'true';

if (!prevalidatedPublication) {
  const definition = await run('validate-definitions');
  console.log(`validate-definitions: ${definition.status}, errors=${definition.summary.error}`);
  if (definition.summary.error) { console.error(JSON.stringify(definition.issues, null, 2)); process.exit(1); }
}

const active = await readJson('pricing/generated/manifest.json');
if (!(await schemaValidator('pricing/manifest'))(active)) throw Error('Invalid active manifest');
const directory = await candidateDirectory(), manifest = await readJson(`${directory}/build-manifest.json`);
if (!(await schemaValidator('pricing/build-manifest'))(manifest) || manifest.buildId !== active.activeBuildId || manifest.publicationDate !== active.publicationDate) throw Error('Invalid active build identity');

const packages = await loadPackages();
if (prevalidatedPublication) {
  const expectedBuildId = process.env.PRICE_VALIDATE_EXPECTED_BUILD_ID;
  if (!expectedBuildId || expectedBuildId !== active.activeBuildId || expectedBuildId !== manifest.buildId) throw Error('Prevalidated publication build identity mismatch');
  console.log(`publication-validation: using prevalidated semantic/golden proof for build ${expectedBuildId}`);
} else {
  const semantic = await validatePublishedPriceDataParallel(packages, directory, manifest);
  const semanticErrors = semantic.issues.filter(issue => issue.severity === 'error').length;
  console.log(`validate-price-data: ${semanticErrors ? 'failed' : 'passed'}, errors=${semanticErrors}, branches=${semantic.branches}, workers=${semantic.concurrency}`);
  if (semanticErrors) { console.error(JSON.stringify(semantic.issues, null, 2)); process.exit(1); }

  const golden = await run('run-golden');
  console.log(`run-golden: ${golden.status}, errors=${golden.summary.error}${golden.cases ? `, golden=${golden.cases.length}` : ''}`);
  if (golden.summary.error) { console.error(JSON.stringify(golden.issues, null, 2)); process.exit(1); }
}

for (const [code, regions] of Object.entries(manifest.sources)) for (const [region, source] of Object.entries(regions)) {
  const loaded = {};
  for (const [kind, folder] of [['products', 'sources'], ['index', 'indexes']]) {
    if (source[`${kind}Path`] !== `${folder}/${code}/${region}/${kind}.json`) throw Error('Invalid resource path');
    const text = await readFile(`${directory}/${source[`${kind}Path`]}`, 'utf8');
    if (checksum(text) !== source[`${kind}Sha256`] || Buffer.byteLength(text) !== source[`${kind}Bytes`]) throw Error('Invalid resource checksum');
    loaded[kind] = JSON.parse(text);
    if (!(await schemaValidator(`pricing/${kind}`))(loaded[kind]) || loaded[kind].buildId !== manifest.buildId || loaded[kind].serviceCode !== code || loaded[kind].region !== region) throw Error('Invalid resource identity/schema');
  }
  if (encode(buildIndex(loaded.products.products, manifest.buildId, code, region)) !== encode(loaded.index)) throw Error('Index differs from deterministic derivation');
}
const catalog = await readJson('services/catalog.json');
if (manifest.definitionSha256 && manifest.definitionSha256 !== await definitionFingerprint(packages)) throw Error('Definition/normalization fingerprint changed: build a validated candidate before publication');
if (catalog.services.length !== packages.length || packages.some(pkg => !catalog.services.some(entry => entry.id === pkg.service.id && entry.label === pkg.service.label && entry.serviceCode === pkg.service.priceSource.serviceCode && entry.available === !!manifest.sources[entry.serviceCode]?.['ap-northeast-1']))) throw Error('Catalog out of sync with packages/build');
console.log('Price DB checksums/schema/index/identity and Catalog: passed');
