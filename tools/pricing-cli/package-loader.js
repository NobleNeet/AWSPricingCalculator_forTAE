import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export const readJson = async file => JSON.parse(await readFile(file, 'utf8'));

async function readJsonDirectory(directory) {
  const entries = await readdir(directory).catch(error => error.code === 'ENOENT' ? [] : Promise.reject(error));
  const result = {};
  for (const file of entries.filter(name => name.endsWith('.json')).sort()) {
    const key = file.slice(0, -5);
    result[key] = await readJson(path.join(directory, file));
  }
  return result;
}

export async function loadPackage(directory) {
  const service = await readJson(path.join(directory, 'service.json'));
  const pkg = { service, profiles: {}, components: {}, pricingMappings: {}, golden: [], directory, files: {} };
  for (const kind of ['profiles', 'components']) {
    pkg[kind] = await readJsonDirectory(path.join(directory, kind));
    for (const key of Object.keys(pkg[kind])) pkg.files[`${kind}/${key}`] = `${key}.json`;
  }
  pkg.pricingMappings = await readJsonDirectory(path.join(directory, 'pricing-mappings'));
  for (const key of Object.keys(pkg.pricingMappings)) pkg.files[`pricing-mappings/${key}`] = `${key}.json`;
  pkg.coverage = await readJson(path.join(directory, 'coverage.json'));
  for (const file of (await readdir(path.join(directory, 'golden'))).filter(name => name.endsWith('.json')).sort()) pkg.golden.push(await readJson(path.join(directory, 'golden', file)));
  return pkg;
}
export async function loadPackages(root = 'services') {
  const entries = await readdir(root, { withFileTypes: true }).catch(error => error.code === 'ENOENT' ? [] : Promise.reject(error));
  return Promise.all(entries.filter(entry => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name)).map(entry => loadPackage(path.join(root, entry.name))));
}
