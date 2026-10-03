import { readFile } from 'node:fs/promises';
import { run, candidateDirectory } from './pricing-cli/cli.js';
import { readJson, loadPackages } from './pricing-cli/package-loader.js';
import { schemaValidator } from './schema.js';
import { checksum } from './pricing-cli/build.js';
import { buildIndex, encode } from './pricing-cli/normalize.js';

for (const command of ['validate-definitions', 'validate-price-data', 'run-golden']) {
  const result = await run(command);
  console.log(`${command}: ${result.status}, errors=${result.summary.error}${result.branches ? `, branches=${result.branches}` : ''}${result.cases ? `, golden=${result.cases.length}` : ''}`);
  if (result.summary.error) { console.error(JSON.stringify(result.issues, null, 2)); process.exit(1); }
}
const active = await readJson('pricing/generated/manifest.json');
if (!(await schemaValidator('pricing/manifest'))(active)) throw Error('Invalid active manifest');
const directory = await candidateDirectory(), manifest = await readJson(`${directory}/build-manifest.json`);
if (!(await schemaValidator('pricing/build-manifest'))(manifest) || manifest.buildId !== active.activeBuildId || manifest.publicationDate !== active.publicationDate) throw Error('Invalid active build identity');
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
const packages = await loadPackages(), catalog = await readJson('services/catalog.json');
if (catalog.services.length !== packages.length || packages.some(pkg => !catalog.services.some(entry => entry.id === pkg.service.id && entry.label === pkg.service.label && entry.serviceCode === pkg.service.priceSource.serviceCode && entry.available === !!manifest.sources[entry.serviceCode]?.['ap-northeast-1']))) throw Error('Catalog out of sync with packages/build');
console.log('Price DB checksums/schema/index/identity and Catalog: passed');
